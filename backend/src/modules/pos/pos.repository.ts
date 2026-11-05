import { db } from '../../database/connection.js';

export interface VariantStockRecord {
  id: string;
  product_id: string;
  product_name: string;
  size: string;
  color: string;
  status: string;
  selling_price_cents: number;
  purchase_price_cents: number;
  stock_quantity: number;
  min_threshold: number;
}

export class PosRepository {
  public findExistingSaleByIdempotencyKey(key: string): any {
    const sale = db.prepare('SELECT * FROM sales WHERE idempotency_key = ?').get(key) as any;
    if (!sale) return null;
    const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(sale.id);
    return { sale, items };
  }

  public getBusinessSettings(): { tax_rate: number; allow_negative_inventory: boolean } {
    const settings = db.prepare('SELECT tax_rate, allow_negative_inventory FROM business_settings LIMIT 1').get() as any;
    return {
      tax_rate: settings && settings.tax_rate !== null && settings.tax_rate !== undefined ? Number(settings.tax_rate) : 0.15,
      allow_negative_inventory: settings ? Boolean(settings.allow_negative_inventory) : false
    };
  }

  public getVariantWithStock(variantId: string): VariantStockRecord | undefined {
    return db.prepare(`
      SELECT pv.id, pv.product_id, p.name as product_name, pv.size, pv.color,
             p.status,
             CAST(ROUND(pv.selling_price * 100) AS INTEGER) as selling_price_cents,
             CAST(ROUND(COALESCE(pv.purchase_price, 0) * 100) AS INTEGER) as purchase_price_cents,
             COALESCE(i.quantity, 0) as stock_quantity,
             COALESCE(i.min_threshold, 3) as min_threshold
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN inventory i ON pv.id = i.variant_id
      WHERE pv.id = ?
    `).get(variantId) as VariantStockRecord | undefined;
  }

  public executeTransaction<T>(fn: () => T): T {
    const tx = db.transaction(fn);
    return tx();
  }

  public insertSale(data: {
    id: string;
    receiptNumber: string;
    cashierId: string;
    customerId: string | null;
    subtotalCents: number;
    discountCents: number;
    discountType: string;
    taxRate: number;
    taxCents: number;
    totalCents: number;
    paymentMethod: string;
    notes: string | null;
    idempotencyKey: string | null;
  }): void {
    db.prepare(`
      INSERT INTO sales (
        id, receipt_number, cashier_id, customer_id, subtotal, discount_amount,
        discount_type, tax_rate, tax_amount, total_amount, payment_status,
        payment_method, notes, idempotency_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      data.id,
      data.receiptNumber,
      data.cashierId,
      data.customerId,
      data.subtotalCents / 100,
      data.discountCents / 100,
      data.discountType,
      data.taxRate,
      data.taxCents / 100,
      data.totalCents / 100,
      data.paymentMethod,
      data.notes,
      data.idempotencyKey
    );
  }

  public insertSaleItem(item: {
    id: string;
    saleId: string;
    variantId: string;
    productName: string;
    variantDetails: string;
    quantity: number;
    unitPriceCents: number;
    costPriceCents: number;
    totalCents: number;
  }): void {
    db.prepare(`
      INSERT INTO sale_items (id, sale_id, variant_id, product_name, variant_details, quantity, unit_price, cost_price, discount, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      item.id,
      item.saleId,
      item.variantId,
      item.productName,
      item.variantDetails,
      item.quantity,
      item.unitPriceCents / 100,
      item.costPriceCents / 100,
      item.totalCents / 100
    );
  }

  public deductInventory(variantId: string, quantity: number): void {
    db.prepare(`
      UPDATE inventory
      SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
      WHERE variant_id = ?
    `).run(quantity, variantId);
  }

  public logInventoryMovement(movement: {
    id: string;
    variantId: string;
    prevQty: number;
    qtyChanged: number;
    newQty: number;
    refNumber: string;
    userId: string;
  }): void {
    db.prepare(`
      INSERT INTO inventory_movements (id, variant_id, previous_quantity, quantity_changed, new_quantity, movement_type, reason, reference_id, user_id)
      VALUES (?, ?, ?, ?, ?, 'sale', 'POS Checkout', ?, ?)
    `).run(
      movement.id,
      movement.variantId,
      movement.prevQty,
      movement.qtyChanged,
      movement.newQty,
      movement.refNumber,
      movement.userId
    );
  }

  public insertPayment(id: string, saleId: string, method: string, amountCents: number, txnRef: string): void {
    db.prepare(`
      INSERT INTO payments (id, sale_id, payment_method, amount, status, transaction_ref)
      VALUES (?, ?, ?, ?, 'completed', ?)
    `).run(id, saleId, method, amountCents / 100, txnRef);
  }

  public updateActiveShiftStats(userId: string, cashCents: number, cardCents: number, totalCents: number): void {
    db.prepare(`
      UPDATE shifts
      SET cash_sales = cash_sales + ?,
          card_sales = card_sales + ?,
          total_sales = total_sales + ?
      WHERE user_id = ? AND status = 'active'
    `).run(cashCents / 100, cardCents / 100, totalCents / 100, userId);
  }
}

export const posRepository = new PosRepository();

