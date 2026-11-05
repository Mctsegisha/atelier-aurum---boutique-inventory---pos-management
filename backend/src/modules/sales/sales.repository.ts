import { db } from '../../database/connection.js';

export class SalesRepository {
  public getAll(filters: {
    cashierId?: string;
    paymentMethod?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    limit?: number;
  }) {
    let sql = `
      SELECT
        s.*,
        u.full_name as cashier_name,
        c.full_name as customer_name,
        c.phone as customer_phone,
        (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
      FROM sales s
      LEFT JOIN profiles u ON s.cashier_id = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.cashierId) {
      sql += ` AND s.cashier_id = ?`;
      params.push(filters.cashierId);
    }

    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      sql += ` AND s.payment_method = ?`;
      params.push(filters.paymentMethod);
    }

    if (filters.status && filters.status !== 'all') {
      sql += ` AND s.payment_status = ?`;
      params.push(filters.status);
    }

    if (filters.startDate) {
      sql += ` AND s.created_at >= ?`;
      params.push(`${filters.startDate} 00:00:00`);
    }

    if (filters.endDate) {
      sql += ` AND s.created_at <= ?`;
      params.push(`${filters.endDate} 23:59:59`);
    }

    if (filters.search) {
      sql += ` AND (s.receipt_number LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY s.created_at DESC LIMIT ?`;
    params.push(filters.limit || 50);

    return db.prepare(sql).all(...params);
  }

  public getById(id: string) {
    const sale = db.prepare(`
      SELECT s.*, u.full_name as cashier_name, c.full_name as customer_name, c.phone as customer_phone, c.email as customer_email
      FROM sales s
      LEFT JOIN profiles u ON s.cashier_id = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.id = ?
    `).get(id);

    if (!sale) return null;

    const items = db.prepare(`
      SELECT si.*, pv.sku, pv.size, pv.color, p.image_url
      FROM sale_items si
      JOIN product_variants pv ON si.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE si.sale_id = ?
    `).all(id);

    const payments = db.prepare('SELECT * FROM payments WHERE sale_id = ?').all(id);
    const refunds = db.prepare(`
      SELECT r.*, u1.full_name as authorized_by_name, u2.full_name as cashier_name
      FROM refunds r
      LEFT JOIN profiles u1 ON r.authorized_by_id = u1.id
      LEFT JOIN profiles u2 ON r.cashier_id = u2.id
      WHERE r.sale_id = ?
      ORDER BY r.created_at DESC
    `).all(id);

    return { sale, items, payments, refunds };
  }

  public executeTransaction<T>(fn: () => T): T {
    const tx = db.transaction(fn);
    return tx();
  }
}

export const salesRepository = new SalesRepository();

