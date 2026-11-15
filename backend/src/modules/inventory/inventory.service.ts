import { InventoryRepository, inventoryRepository } from './inventory.repository.js';
import { AuthUser } from '../../middleware/authenticate.js';
import { generateId } from '../../utils/idGenerator.js';
import { auditService } from '../audit/audit.service.js';
import { NotFoundError, BadRequestError } from '../../errors/AppError.js';

export class InventoryService {
  constructor(private readonly repo: InventoryRepository = inventoryRepository) {}

  public getInventory(user: AuthUser, query: any) {
    const isCashier = user.role === 'sales';
    const flatRows = this.repo.getAll({
      lowStockOnly: query.lowStockOnly === 'true',
      search: query.search as string,
      categoryId: query.categoryId as string,
      status: query.status as string,
      isCashier
    });

    if (query.grouped === 'false') {
      return flatRows;
    }

    return this.groupInventoryRows(flatRows);
  }

  public groupInventoryRows(rows: any[]) {
    const groupedMap = new Map<string, any>();

    for (const row of rows) {
      if (!groupedMap.has(row.product_id)) {
        groupedMap.set(row.product_id, {
          product_id: row.product_id,
          product_name: row.product_name,
          category_id: row.category_id || '',
          category_name: row.category_name || 'Boutique',
          subcategory_name: row.subcategory_name || '',
          brand_name: row.brand_name || '',
          image_url: row.image_url || null,
          is_simple: Boolean(row.is_simple),
          product_status: row.product_status || 'active',
          quantity: 0,
          total_quantity: 0,
          min_threshold: Number(row.min_stock_level ?? 5),
          cost_price: Number(row.product_purchase_price ?? row.variant_cost ?? 0),
          selling_price: Number(row.product_selling_price ?? row.variant_price ?? 0),
          status: 'healthy',
          batch_count: 0,
          batch_number: row.sku || `BAT-${row.variant_id.slice(-6).toUpperCase()}`,
          batches: []
        });
      }

      const parent = groupedMap.get(row.product_id)!;
      const batchQty = Number(row.quantity || 0);
      parent.quantity += batchQty;
      parent.total_quantity += batchQty;
      parent.batch_count += 1;

      const batchNumber = row.sku || `BAT-${row.variant_id.slice(-6).toUpperCase()}`;

      parent.batches.push({
        batch_number: batchNumber,
        variant_id: row.variant_id,
        inventory_id: row.inventory_id,
        product_id: row.product_id,
        sku: row.sku,
        barcode: row.barcode || '',
        size: row.size || 'Standard',
        color: row.color || 'Standard',
        color_code: row.color_code || null,
        variant_name: row.variant_name || (row.size !== 'Standard' || row.color !== 'Standard' ? `${row.size} · ${row.color}` : 'Single Unit'),
        quantity: batchQty,
        cost_price: Number(row.variant_cost ?? row.product_purchase_price ?? 0),
        selling_price: Number(row.variant_price ?? row.product_selling_price ?? 0),
        min_threshold: Number(row.min_threshold ?? parent.min_threshold ?? 3),
        location: row.location || 'Main Storefront',
        updated_at: row.updated_at
      });
    }

    for (const parent of groupedMap.values()) {
      parent.status = parent.quantity <= parent.min_threshold ? 'low_stock' : 'healthy';
      if (parent.batches.length > 1) {
        parent.batch_number = `${parent.batches.length} Batches`;
      }
    }

    return Array.from(groupedMap.values());
  }

  public getStats() {
    return this.repo.getKPIStats();
  }

  public getSlowMoving() {
    return this.repo.getSlowMovingStock();
  }

  public updateVariant(user: AuthUser, variantId: string, body: any) {
    const existing = this.repo.getVariantInfo(variantId);
    if (!existing) {
      throw new NotFoundError('Variant not found.');
    }

    this.repo.executeTransaction(() => {
      this.repo.updateVariantDetails(variantId, {
        sku: body.sku,
        barcode: body.barcode,
        size: body.size,
        color: body.color,
        selling_price: body.selling_price !== undefined ? Number(body.selling_price) : undefined,
        purchase_price: body.purchase_price !== undefined ? Number(body.purchase_price) : undefined
      });

      if (body.min_threshold !== undefined) {
        this.repo.updateMinThreshold(variantId, Number(body.min_threshold));
      }
    });

    auditService.log(user.id, 'UPDATE_VARIANT', 'INVENTORY', variantId, body);

    return {
      message: 'Variant inventory record updated successfully.',
      variant_id: variantId
    };
  }

  public adjustStock(user: AuthUser, body: any) {
    const { variant_id, adjustment_type, type, quantity, new_quantity, reason, reference_id } = body;
    const variantInfo = this.repo.getVariantInfo(variant_id);

    if (!variantInfo) {
      throw new NotFoundError('Variant not found.');
    }

    const currentQty = variantInfo.stock_quantity ?? 0;
    let finalQty = currentQty;
    let qtyChanged = 0;

    if (new_quantity !== undefined) {
      finalQty = Math.max(0, Number(new_quantity));
      qtyChanged = finalQty - currentQty;
    } else if (adjustment_type === 'set') {
      finalQty = Math.max(0, Number(quantity));
      qtyChanged = finalQty - currentQty;
    } else if (adjustment_type === 'add') {
      finalQty = currentQty + Number(quantity);
      qtyChanged = Number(quantity);
    } else if (adjustment_type === 'subtract') {
      const inputQty = Number(quantity);
      if (currentQty < inputQty) {
        throw new BadRequestError(`Cannot subtract ${inputQty} units. Current stock is only ${currentQty}.`);
      }
      finalQty = currentQty - inputQty;
      qtyChanged = -inputQty;
    } else {
      finalQty = Math.max(0, Number(quantity || 0));
      qtyChanged = finalQty - currentQty;
    }

    const movementId = generateId('mov');

    this.repo.executeTransaction(() => {
      this.repo.updateStock(variant_id, finalQty);
      this.repo.insertMovement({
        id: movementId,
        variantId: variant_id,
        previousQuantity: currentQty,
        quantityChanged: qtyChanged,
        newQuantity: finalQty,
        movementType: type || 'adjustment',
        reason,
        referenceId: reference_id,
        userId: user.id
      });

      if (finalQty <= (variantInfo.min_threshold || 3)) {
        auditService.notify(
          'low_stock',
          `Low Stock: ${variantInfo.name}`,
          `${variantInfo.name} (${variantInfo.size} / ${variantInfo.color}) reached ${finalQty} units.`,
          '/inventory'
        );
      }
    });

    auditService.log(user.id, 'STOCK_ADJUSTMENT', 'INVENTORY', variant_id, {
      product: variantInfo.name,
      previous: currentQty,
      newQuantity: finalQty,
      reason
    });

    return {
      message: 'Inventory adjusted successfully.',
      variant_id,
      previous_quantity: currentQty,
      new_quantity: finalQty,
      quantity_changed: qtyChanged
    };
  }

  public receiveStock(user: AuthUser, body: any) {
    const { items, po_id, invoice_number } = body;

    const results: any[] = [];

    this.repo.executeTransaction(() => {
      for (const item of items) {
        const { variant_id, quantity } = item;
        const qty = Number(quantity);
        if (qty <= 0) continue;

        const variant = this.repo.getVariantInfo(variant_id);
        if (!variant) continue;

        const currentQty = variant.stock_quantity ?? 0;
        const newQty = currentQty + qty;

        this.repo.updateStock(variant_id, newQty);
        this.repo.insertMovement({
          id: generateId('mov'),
          variantId: variant_id,
          previousQuantity: currentQty,
          quantityChanged: qty,
          newQuantity: newQty,
          movementType: 'received',
          reason: `Stock Receiving${invoice_number ? ` (Invoice: ${invoice_number})` : ''}`,
          referenceId: po_id || invoice_number || 'RECEIVE-INTAKE',
          userId: user.id
        });

        results.push({ variant_id, name: variant.name, previous: currentQty, new_quantity: newQty });
      }
    });

    auditService.log(user.id, 'STOCK_RECEIVED', 'INVENTORY', po_id || 'INTAKE', { itemCount: items.length });

    return {
      message: 'Stock successfully received and added to inventory.',
      received_items: results
    };
  }

  public getMovements(query: any) {
    return this.repo.getMovements({
      variantId: query.variantId as string,
      movementType: query.movementType as string,
      startDate: query.startDate as string,
      endDate: query.endDate as string,
      limit: query.limit ? Number(query.limit) : 100
    });
  }
}

export const inventoryService = new InventoryService();

