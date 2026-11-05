import { db } from '../../database/connection.js';

export class InventoryRepository {
  public getAll(filters: { lowStockOnly?: boolean; search?: string; isCashier?: boolean }) {
    let sql = `
      SELECT
        i.id as inventory_id,
        i.quantity,
        i.location,
        i.min_threshold,
        i.updated_at,
        pv.id as variant_id,
        pv.sku,
        pv.barcode,
        pv.size,
        pv.color,
        pv.color_code,
        pv.variant_name,
        pv.selling_price as variant_price,
        ${filters.isCashier ? 'NULL' : 'pv.purchase_price'} as variant_cost,
        p.id as product_id,
        p.name as product_name,
        p.image_url,
        p.status as product_status,
        p.is_simple,
        c.name as category_name,
        sc.name as subcategory_name,
        b.name as brand_name
      FROM inventory i
      JOIN product_variants pv ON i.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.lowStockOnly) {
      sql += ` AND i.quantity <= i.min_threshold`;
    }

    if (filters.search) {
      sql += ` AND (p.name LIKE ? OR pv.sku LIKE ? OR pv.barcode LIKE ? OR pv.variant_name LIKE ? OR c.name LIKE ? OR sc.name LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term, term, term, term);
    }

    sql += ` ORDER BY (i.quantity <= i.min_threshold) DESC, p.name ASC, pv.size ASC`;

    return db.prepare(sql).all(...params);
  }

  public getVariantInfo(variantId: string) {
    return db.prepare(`
      SELECT pv.*, p.name, p.status as product_status, i.quantity as stock_quantity, i.min_threshold
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN inventory i ON pv.id = i.variant_id
      WHERE pv.id = ?
    `).get(variantId) as any;
  }

  public updateStock(variantId: string, finalQty: number) {
    const existing = db.prepare('SELECT id FROM inventory WHERE variant_id = ?').get(variantId);
    if (existing) {
      db.prepare('UPDATE inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE variant_id = ?').run(finalQty, variantId);
    } else {
      db.prepare('INSERT INTO inventory (id, variant_id, quantity, location) VALUES (?, ?, ?, "Main Storefront")').run(`inv_${variantId}`, variantId, finalQty);
    }
  }

  public insertMovement(movement: {
    id: string;
    variantId: string;
    previousQuantity: number;
    quantityChanged: number;
    newQuantity: number;
    movementType: string;
    reason: string;
    referenceId?: string | null;
    userId: string;
  }) {
    db.prepare(`
      INSERT INTO inventory_movements (id, variant_id, previous_quantity, quantity_changed, new_quantity, movement_type, reason, reference_id, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      movement.id,
      movement.variantId,
      movement.previousQuantity,
      movement.quantityChanged,
      movement.newQuantity,
      movement.movementType,
      movement.reason,
      movement.referenceId || null,
      movement.userId
    );
  }

  public getMovements(filters: { variantId?: string; movementType?: string; startDate?: string; endDate?: string; limit?: number }) {
    let sql = `
      SELECT
        im.*,
        pv.sku,
        pv.size,
        pv.color,
        pv.variant_name,
        p.name as product_name,
        p.image_url,
        u.full_name as operator_name,
        u.role as operator_role
      FROM inventory_movements im
      JOIN product_variants pv ON im.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN profiles u ON im.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.variantId) {
      sql += ` AND im.variant_id = ?`;
      params.push(filters.variantId);
    }

    if (filters.movementType && filters.movementType !== 'all') {
      sql += ` AND im.movement_type = ?`;
      params.push(filters.movementType);
    }

    if (filters.startDate) {
      sql += ` AND im.created_at >= ?`;
      params.push(`${filters.startDate} 00:00:00`);
    }

    if (filters.endDate) {
      sql += ` AND im.created_at <= ?`;
      params.push(`${filters.endDate} 23:59:59`);
    }

    sql += ` ORDER BY im.created_at DESC LIMIT ?`;
    params.push(filters.limit || 100);

    return db.prepare(sql).all(...params);
  }

  public executeTransaction<T>(fn: () => T): T {
    const tx = db.transaction(fn);
    return tx();
  }
}

export const inventoryRepository = new InventoryRepository();

