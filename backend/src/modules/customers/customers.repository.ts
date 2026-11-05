import { db } from '../../database/connection.js';

export class CustomersRepository {
  public getAll(search?: string, limit = 50) {
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params: any[] = [];

    if (search) {
      sql += ' AND (full_name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY total_spent DESC, full_name ASC LIMIT ?';
    params.push(limit);

    return db.prepare(sql).all(...params);
  }

  public getById(id: string) {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    if (!customer) return null;

    const purchases = db.prepare(`
      SELECT s.id, s.receipt_number, s.total_amount, s.payment_status, s.payment_method, s.created_at,
             u.full_name as cashier_name
      FROM sales s
      LEFT JOIN profiles u ON s.cashier_id = u.id
      WHERE s.customer_id = ?
      ORDER BY s.created_at DESC
    `).all(id);

    return { customer, purchases };
  }

  public create(data: {
    id: string;
    fullName: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    birthday?: string | null;
    notes?: string | null;
  }) {
    db.prepare(`
      INSERT INTO customers (id, full_name, phone, email, address, birthday, notes, loyalty_points, total_spent)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0.0)
    `).run(
      data.id,
      data.fullName,
      data.phone || null,
      data.email || null,
      data.address || null,
      data.birthday || null,
      data.notes || null
    );
    return db.prepare('SELECT * FROM customers WHERE id = ?').get(data.id);
  }

  public update(id: string, data: any) {
    db.prepare(`
      UPDATE customers SET
        full_name = COALESCE(?, full_name),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        address = COALESCE(?, address),
        birthday = COALESCE(?, birthday),
        notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(
      data.full_name || null,
      data.phone || null,
      data.email || null,
      data.address || null,
      data.birthday || null,
      data.notes || null,
      id
    );
    return db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  }
}

export const customersRepository = new CustomersRepository();

