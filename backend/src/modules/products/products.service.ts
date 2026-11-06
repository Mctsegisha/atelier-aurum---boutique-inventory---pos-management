import { ProductsRepository, productsRepository } from './products.repository.js';
import { db } from '../../database/connection.js';
import { generateId } from '../../utils/idGenerator.js';
import { auditService } from '../audit/audit.service.js';
import { NotFoundError, BadRequestError } from '../../errors/AppError.js';
import { AuthUser } from '../../middleware/authenticate.js';

export class ProductsService {
  constructor(private readonly repo: ProductsRepository = productsRepository) {}

  public getProducts(user: AuthUser, query: any) {
    const isCashier = user.role === 'sales';
    const products = this.repo.getAll({
      category: query.category,
      subcategory: query.subcategory,
      brand: query.brand,
      status: query.status,
      search: query.search,
      isCashier,
      limit: query.limit ? Number(query.limit) : undefined,
      offset: query.offset ? Number(query.offset) : undefined
    });

    const productIds = products.map((p) => p.id);
    let variantsMap: Record<string, any[]> = {};

    if (productIds.length > 0) {
      const variants = this.repo.getVariantsForProductIds(productIds, isCashier);
      for (const v of variants) {
        if (isCashier) {
          delete v.purchase_price;
        }
        if (v.attributes && typeof v.attributes === 'string') {
          try {
            v.attributes = JSON.parse(v.attributes);
          } catch {
            // Keep as string if parsing fails
          }
        }
        if (!variantsMap[v.product_id]) {
          variantsMap[v.product_id] = [];
        }
        variantsMap[v.product_id].push(v);
      }
    }

    return products.map((p) => {
      if (isCashier) {
        delete p.purchase_price;
        delete p.wholesale_price;
      }
      if (p.attributes && typeof p.attributes === 'string') {
        try {
          p.attributes = JSON.parse(p.attributes);
        } catch {
          // Keep as string
        }
      }
      return {
        ...p,
        variants: variantsMap[p.id] || []
      };
    });
  }

  public getByBarcode(barcode: string, user: AuthUser) {
    const variant = this.repo.findByBarcode(barcode);
    if (!variant) {
      throw new NotFoundError(`No product found with barcode/SKU: ${barcode}`);
    }

    if (variant.product_status === 'pending_approval') {
      throw new BadRequestError(`Product "${variant.product_name}" is pending administrator approval before it can be sold.`);
    }
    if (variant.product_status === 'rejected') {
      throw new BadRequestError(`Product "${variant.product_name}" was rejected by administrator and cannot be sold.`);
    }
    if (variant.product_status !== 'active') {
      throw new BadRequestError(`Product "${variant.product_name}" is not active for sale (status: ${variant.product_status}).`);
    }

    if (user.role === 'sales') {
      delete variant.purchase_price;
    }

    return variant;
  }

  public getPendingApprovalCount() {
    return { count: this.repo.getPendingCount() };
  }

  public createProduct(user: AuthUser, body: any) {
    const {
      name,
      description,
      category_id,
      subcategory_id,
      brand_id,
      supplier_id,
      purchase_price = 0,
      selling_price = 0,
      wholesale_price = 0,
      tax_rate = 0.15,
      min_stock_level = 5,
      dead_stock_days = 60,
      image_url,
      is_simple = 0,
      season,
      collection,
      gender,
      material,
      attributes,
      variants = [],
      initial_stock = 0,
      sku: customSku,
      barcode: customBarcode
    } = body;

    const isStorePerson = user.role === 'store_person';
    const initialStatus = isStorePerson ? 'pending_approval' : 'active';
    const approvedBy = isStorePerson ? null : user.id;
    const approvedAt = isStorePerson ? null : new Date().toISOString();

    const productId = generateId('p');
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 5)}`;
    const serializedAttrs = attributes ? (typeof attributes === 'string' ? attributes : JSON.stringify(attributes)) : null;

    this.repo.executeTransaction(() => {
      db.prepare(`
        INSERT INTO products (
          id, name, slug, description, category_id, subcategory_id, brand_id, supplier_id,
          purchase_price, selling_price, wholesale_price, tax_rate, min_stock_level, dead_stock_days,
          image_url, status, is_simple, season, collection, gender, material, attributes,
          created_by, approved_by, approved_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        productId,
        name.trim(),
        slug,
        description || null,
        category_id || null,
        subcategory_id || null,
        brand_id || null,
        supplier_id || null,
        Number(purchase_price) || 0,
        Number(selling_price) || 0,
        Number(wholesale_price) || 0,
        Number(tax_rate) !== undefined && !isNaN(Number(tax_rate)) ? Number(tax_rate) : 0.15,
        Number(min_stock_level) || 5,
        Number(dead_stock_days) || 60,
        image_url || null,
        initialStatus,
        Number(is_simple) ? 1 : 0,
        season || null,
        collection || null,
        gender || null,
        material || null,
        serializedAttrs,
        user.id,
        approvedBy,
        approvedAt
      );

      const insertVarStmt = db.prepare(`
        INSERT INTO product_variants (id, product_id, sku, barcode, size, color, color_code, variant_name, attributes, purchase_price, selling_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertInvStmt = db.prepare(`
        INSERT INTO inventory (id, variant_id, quantity, location, min_threshold)
        VALUES (?, ?, ?, 'Main Storefront', ?)
      `);

      const insertMovStmt = db.prepare(`
        INSERT INTO inventory_movements (id, variant_id, previous_quantity, quantity_changed, new_quantity, movement_type, reason, reference_id, user_id)
        VALUES (?, ?, 0, ?, ?, 'received', 'Initial Stock Intake', ?, ?)
      `);

      const cleanPrefix = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'AUR';

      if (Number(is_simple) === 1 || variants.length === 0) {
        const variantId = generateId('v');
        const sku = customSku || `${cleanPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
        const barcode = customBarcode || `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
        const qty = Number(initial_stock) || 0;

        insertVarStmt.run(
          variantId,
          productId,
          sku,
          barcode,
          'Standard',
          'Standard',
          '#1A1A1A',
          'Standard Piece',
          null,
          Number(purchase_price) || 0,
          Number(selling_price) || 0
        );

        insertInvStmt.run(`inv_${variantId}`, variantId, qty, Number(min_stock_level) || 3);

        if (qty > 0) {
          insertMovStmt.run(generateId('mov'), variantId, qty, qty, `INIT-${productId}`, user.id);
        }
      } else {
        for (const v of variants) {
          const variantId = generateId('v');
          const sku = v.sku || `${cleanPrefix}-${(v.size || 'OS').replace(/[^a-zA-Z0-9]/g, '')}-${(v.color || 'CLR').substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
          const barcode = v.barcode || `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
          const vAttrs = v.attributes ? (typeof v.attributes === 'string' ? v.attributes : JSON.stringify(v.attributes)) : null;

          insertVarStmt.run(
            variantId,
            productId,
            sku,
            barcode,
            v.size || 'Standard',
            v.color || 'Standard',
            v.color_code || '#1A1A1A',
            v.variant_name || `${v.size || 'One Size'} · ${v.color || 'Standard'}`,
            vAttrs,
            Number(v.purchase_price || purchase_price) || 0,
            Number(v.selling_price || selling_price) || 0
          );

          const qty = Number(v.initial_stock || 0);
          insertInvStmt.run(`inv_${variantId}`, variantId, qty, Number(min_stock_level) || 3);

          if (qty > 0) {
            insertMovStmt.run(generateId('mov'), variantId, qty, qty, `INIT-${productId}`, user.id);
          }
        }
      }

      if (isStorePerson) {
        auditService.notify(
          'approval_needed',
          `New Product Pending Approval: ${name}`,
          `Store Person submitted "${name}" for administrative approval before it can be sold in POS.`,
          '/products'
        );
      }
    });

    auditService.log(user.id, 'CREATE_PRODUCT', 'PRODUCT', productId, { name, initialStatus });

    return {
      id: productId,
      message: isStorePerson
        ? `Product "${name}" submitted for Administrator approval.`
        : `Product "${name}" created successfully and active on POS.`
    };
  }

  public approveProduct(productId: string, user: AuthUser) {
    const product = this.repo.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found.');
    }

    db.prepare(`
      UPDATE products SET
        status = 'active',
        approved_by = ?,
        approved_at = CURRENT_TIMESTAMP,
        rejection_reason = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(user.id, productId);

    auditService.log(user.id, 'APPROVE_PRODUCT', 'PRODUCT', productId, { name: product.name });
    auditService.notify('product_approved', `Product Approved: ${product.name}`, `Product "${product.name}" was approved by Administrator and is now live on the POS sales floor.`, '/products');

    return { message: `Product "${product.name}" approved successfully. It is now active on POS.` };
  }

  public rejectProduct(productId: string, rejectionReason: string, user: AuthUser) {
    const product = this.repo.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found.');
    }

    db.prepare(`
      UPDATE products SET
        status = 'rejected',
        rejection_reason = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(rejectionReason, productId);

    auditService.log(user.id, 'REJECT_PRODUCT', 'PRODUCT', productId, { name: product.name, rejectionReason });
    auditService.notify('product_rejected', `Product Rejected: ${product.name}`, `Product "${product.name}" was rejected by Administrator: ${rejectionReason}`, '/products');

    return { message: `Product "${product.name}" rejected.` };
  }

  public updateProduct(productId: string, user: AuthUser, body: any) {
    const existing = this.repo.findById(productId);
    if (!existing) {
      throw new NotFoundError('Product not found.');
    }

    const {
      name = existing.name,
      description = existing.description,
      category_id = existing.category_id,
      subcategory_id = existing.subcategory_id,
      brand_id = existing.brand_id,
      supplier_id = existing.supplier_id,
      purchase_price = existing.purchase_price,
      selling_price = existing.selling_price,
      wholesale_price = existing.wholesale_price,
      tax_rate = existing.tax_rate,
      min_stock_level = existing.min_stock_level,
      dead_stock_days = existing.dead_stock_days ?? 60,
      image_url = existing.image_url,
      status = existing.status,
      is_simple = existing.is_simple,
      season = existing.season,
      collection = existing.collection,
      gender = existing.gender,
      material = existing.material,
      attributes = existing.attributes
    } = body;

    const serializedAttrs = attributes ? (typeof attributes === 'string' ? attributes : JSON.stringify(attributes)) : null;

    db.prepare(`
      UPDATE products SET
        name = ?, description = ?, category_id = ?, subcategory_id = ?, brand_id = ?,
        supplier_id = ?, purchase_price = ?, selling_price = ?, wholesale_price = ?,
        tax_rate = ?, min_stock_level = ?, dead_stock_days = ?, image_url = ?, status = ?, is_simple = ?,
        season = ?, collection = ?, gender = ?, material = ?, attributes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name,
      description,
      category_id || null,
      subcategory_id || null,
      brand_id || null,
      supplier_id || null,
      Number(purchase_price),
      Number(selling_price),
      Number(wholesale_price),
      Number(tax_rate),
      Number(min_stock_level),
      Number(dead_stock_days) || 60,
      image_url || null,
      status,
      Number(is_simple) ? 1 : 0,
      season || null,
      collection || null,
      gender || null,
      material || null,
      serializedAttrs,
      productId
    );

    auditService.log(user.id, 'UPDATE_PRODUCT', 'PRODUCT', productId, { name });

    return { message: 'Product updated successfully.' };
  }

  public deleteProduct(productId: string, user: AuthUser) {
    const existing = this.repo.findById(productId);
    if (!existing) {
      throw new NotFoundError('Product not found.');
    }

    db.prepare("UPDATE products SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(productId);
    auditService.log(user.id, 'ARCHIVE_PRODUCT', 'PRODUCT', productId, { name: existing.name });

    return { message: 'Product archived successfully.' };
  }

  // Categories, Subcategories, Brands
  public getCategories() {
    return this.repo.getCategories();
  }

  public createCategory(name: string, description?: string) {
    const id = generateId('cat');
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return this.repo.createCategory(id, name, slug, description);
  }

  public updateCategory(id: string, name: string, description?: string, isActive = 1) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return this.repo.updateCategory(id, name, slug, description, isActive);
  }

  public getSubcategories(categoryId?: string) {
    return this.repo.getSubcategories(categoryId);
  }

  public createSubcategory(categoryId: string, name: string, description?: string) {
    const id = generateId('sub');
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return this.repo.createSubcategory(id, categoryId, name, slug, description);
  }

  public updateSubcategory(id: string, categoryId: string, name: string, description?: string, isActive = 1) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return this.repo.updateSubcategory(id, categoryId, name, slug, description, isActive);
  }

  public deleteSubcategory(id: string) {
    this.repo.deleteSubcategory(id);
    return { message: 'Subcategory deleted successfully.' };
  }

  public getBrands() {
    return this.repo.getBrands();
  }

  public createBrand(name: string, country?: string) {
    const id = generateId('b');
    return this.repo.createBrand(id, name, country);
  }
}

export const productsService = new ProductsService();

