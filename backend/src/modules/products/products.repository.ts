import { db } from '../../database/connection.js';

export class ProductsRepository {
  public getAll(filters: {
    category?: string;
    subcategory?: string;
    brand?: string;
    status?: string;
    search?: string;
    isCashier?: boolean;
    limit?: number;
    offset?: number;
  }) {
    let sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             sc.name as subcategory_name, sc.slug as subcategory_slug,
             b.name as brand_name, s.company_name as supplier_name,
             u1.full_name as created_by_name,
             u2.full_name as approved_by_name,
        (SELECT SUM(i.quantity) FROM inventory i JOIN product_variants pv ON i.variant_id = pv.id WHERE pv.product_id = p.id) as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN profiles u1 ON p.created_by = u1.id
      LEFT JOIN profiles u2 ON p.approved_by = u2.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.category && filters.category !== 'all') {
      sql += ` AND (p.category_id = ? OR c.slug = ?)`;
      params.push(filters.category, filters.category);
    }

    if (filters.subcategory && filters.subcategory !== 'all') {
      sql += ` AND (p.subcategory_id = ? OR sc.slug = ?)`;
      params.push(filters.subcategory, filters.subcategory);
    }

    if (filters.brand && filters.brand !== 'all') {
      sql += ` AND p.brand_id = ?`;
      params.push(filters.brand);
    }

    if (filters.isCashier) {
      sql += ` AND p.status = 'active'`;
    } else if (filters.status && filters.status !== 'all') {
      sql += ` AND p.status = ?`;
      params.push(filters.status);
    }

    if (filters.search) {
      sql += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.material LIKE ? OR c.name LIKE ? OR sc.name LIKE ? OR EXISTS (
        SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND (pv.sku LIKE ? OR pv.barcode LIKE ? OR pv.variant_name LIKE ?)
      ))`;
      const pattern = `%${filters.search}%`;
      params.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern);
    }

    sql += ` ORDER BY p.created_at DESC`;

    if (filters.limit) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(filters.limit, filters.offset || 0);
    }

    return db.prepare(sql).all(...params) as any[];
  }

  public getVariantsForProductIds(productIds: string[], isCashier = false) {
    if (productIds.length === 0) return [];
    const placeholders = productIds.map(() => '?').join(',');
    const sql = `
      SELECT pv.*, COALESCE(i.quantity, 0) as stock_quantity, i.location, i.min_threshold
      FROM product_variants pv
      LEFT JOIN inventory i ON pv.id = i.variant_id
      WHERE pv.product_id IN (${placeholders})
      ORDER BY pv.size, pv.color
    `;
    return db.prepare(sql).all(...productIds) as any[];
  }

  public findById(id: string) {
    return db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
  }

  public findByBarcode(barcode: string) {
    return db.prepare(`
      SELECT pv.*, p.id as product_id, p.name as product_name, p.status as product_status,
             p.image_url, p.description, p.tax_rate, p.category_id, p.supplier_id,
             c.name as category_name,
             COALESCE(i.quantity, 0) as stock_quantity, i.location, i.min_threshold
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON pv.id = i.variant_id
      WHERE pv.barcode = ? OR pv.sku = ?
    `).get(barcode, barcode) as any;
  }

  public getPendingCount() {
    const row = db.prepare("SELECT COUNT(*) as count FROM products WHERE status = 'pending_approval'").get() as { count: number };
    return row.count;
  }

  public executeTransaction<T>(fn: () => T): T {
    const tx = db.transaction(fn);
    return tx();
  }

  // Categories
  public getCategories() {
    return db.prepare(`
      SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) as product_count
      FROM categories c
      ORDER BY c.name ASC
    `).all();
  }

  public createCategory(id: string, name: string, slug: string, description?: string) {
    db.prepare(`
      INSERT INTO categories (id, name, slug, description, is_active) VALUES (?, ?, ?, ?, 1)
    `).run(id, name, slug, description || null);
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  }

  public updateCategory(id: string, name: string, slug: string, description?: string, isActive = 1) {
    db.prepare(`
      UPDATE categories SET name = ?, slug = ?, description = ?, is_active = ? WHERE id = ?
    `).run(name, slug, description || null, isActive, id);
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  }

  // Subcategories
  public getSubcategories(categoryId?: string) {
    let sql = `
      SELECT sc.*, c.name as category_name,
             (SELECT COUNT(*) FROM products p WHERE p.subcategory_id = sc.id) as product_count
      FROM subcategories sc
      JOIN categories c ON sc.category_id = c.id
      WHERE 1=1
    `;
    const params: string[] = [];
    if (categoryId && categoryId !== 'all') {
      sql += ` AND sc.category_id = ?`;
      params.push(categoryId);
    }
    sql += ` ORDER BY sc.name ASC`;
    return db.prepare(sql).all(...params);
  }

  public createSubcategory(id: string, categoryId: string, name: string, slug: string, description?: string) {
    db.prepare(`
      INSERT INTO subcategories (id, category_id, name, slug, description, is_active) VALUES (?, ?, ?, ?, ?, 1)
    `).run(id, categoryId, name, slug, description || null);
    return db.prepare('SELECT * FROM subcategories WHERE id = ?').get(id);
  }

  public updateSubcategory(id: string, categoryId: string, name: string, slug: string, description?: string, isActive = 1) {
    db.prepare(`
      UPDATE subcategories SET category_id = ?, name = ?, slug = ?, description = ?, is_active = ? WHERE id = ?
    `).run(categoryId, name, slug, description || null, isActive, id);
    return db.prepare('SELECT * FROM subcategories WHERE id = ?').get(id);
  }

  public deleteSubcategory(id: string) {
    db.prepare('DELETE FROM subcategories WHERE id = ?').run(id);
  }

  // Brands
  public getBrands() {
    return db.prepare(`
      SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id) as product_count
      FROM brands b
      ORDER BY b.name ASC
    `).all();
  }

  public createBrand(id: string, name: string, country?: string) {
    db.prepare('INSERT INTO brands (id, name, country) VALUES (?, ?, ?)').run(id, name, country || null);
    return db.prepare('SELECT * FROM brands WHERE id = ?').get(id);
  }
}

export const productsRepository = new ProductsRepository();

