import { db } from '../../database/connection.js';

export class SuppliersRepository {
  public getAll() {
    return db.prepare(`
      SELECT s.*, (SELECT COUNT(*) FROM products p WHERE p.supplier_id = s.id) as product_count
      FROM suppliers s
      ORDER BY s.company_name ASC
    `).all();
  }

  public getById(id: string) {
    return db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
  }

  public create(data: {
    id: string;
    companyName: string;
    contactPerson?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    productsSupplied?: string | null;
  }) {
    db.prepare(`
      INSERT INTO suppliers (id, company_name, contact_person, phone, email, address, products_supplied, balance_due)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0.0)
    `).run(
      data.id,
      data.companyName,
      data.contactPerson || null,
      data.phone || null,
      data.email || null,
      data.address || null,
      data.productsSupplied || null
    );
    return db.prepare('SELECT * FROM suppliers WHERE id = ?').get(data.id);
  }

  public update(id: string, data: any) {
    db.prepare(`
      UPDATE suppliers SET
        company_name = COALESCE(?, company_name),
        contact_person = COALESCE(?, contact_person),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        address = COALESCE(?, address),
        products_supplied = COALESCE(?, products_supplied),
        balance_due = COALESCE(?, balance_due)
      WHERE id = ?
    `).run(
      data.company_name || null,
      data.contact_person || null,
      data.phone || null,
      data.email || null,
      data.address || null,
      data.products_supplied || null,
      data.balance_due !== undefined ? Number(data.balance_due) : null,
      id
    );
    return db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
  }

  public getAllPurchaseOrders() {
    return db.prepare(`
      SELECT po.*, s.company_name as supplier_name, u.full_name as created_by_name,
        (SELECT COUNT(*) FROM purchase_order_items poi WHERE poi.po_id = po.id) as item_count
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN profiles u ON po.created_by_id = u.id
      ORDER BY po.created_at DESC
    `).all();
  }

  public getPurchaseOrderById(id: string) {
    return db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(id) as any;
  }

  public getPurchaseOrderItems(poId: string) {
    return db.prepare('SELECT * FROM purchase_order_items WHERE po_id = ?').all(poId) as any[];
  }

  public executeTransaction<T>(fn: () => T): T {
    const tx = db.transaction(fn);
    return tx();
  }
}

export const suppliersRepository = new SuppliersRepository();

