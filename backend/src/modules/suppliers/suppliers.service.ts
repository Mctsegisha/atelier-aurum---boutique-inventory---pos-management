import { SuppliersRepository, suppliersRepository } from './suppliers.repository.js';
import { db } from '../../database/connection.js';
import { generateId, generatePoNumber } from '../../utils/idGenerator.js';
import { auditService } from '../audit/audit.service.js';
import { NotFoundError, BadRequestError } from '../../errors/AppError.js';
import { AuthUser } from '../../middleware/authenticate.js';

export class SuppliersService {
  constructor(private readonly repo: SuppliersRepository = suppliersRepository) {}

  public getSuppliers() {
    return this.repo.getAll();
  }

  public createSupplier(user: AuthUser, body: any) {
    const id = generateId('s');
    const created = this.repo.create({
      id,
      companyName: body.company_name.trim(),
      contactPerson: body.contact_person,
      phone: body.phone,
      email: body.email,
      address: body.address,
      productsSupplied: body.products_supplied
    });
    auditService.log(user.id, 'CREATE_SUPPLIER', 'SUPPLIER', id, { company_name: body.company_name });
    return created;
  }

  public updateSupplier(id: string, user: AuthUser, body: any) {
    const existing = this.repo.getById(id);
    if (!existing) {
      throw new NotFoundError('Supplier not found.');
    }
    const updated = this.repo.update(id, body);
    auditService.log(user.id, 'UPDATE_SUPPLIER', 'SUPPLIER', id, body);
    return updated;
  }

  public getPurchaseOrders() {
    return this.repo.getAllPurchaseOrders();
  }

  public createPurchaseOrder(user: AuthUser, body: any) {
    const { supplier_id, expected_date, notes, items } = body;
    const poId = generateId('po');
    const orderNumber = generatePoNumber();

    let totalCost = 0;
    for (const it of items) {
      totalCost += Number(it.quantity_ordered) * Number(it.unit_cost);
    }

    this.repo.executeTransaction(() => {
      db.prepare(`
        INSERT INTO purchase_orders (id, order_number, supplier_id, status, total_cost, expected_date, created_by_id, notes)
        VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)
      `).run(poId, orderNumber, supplier_id, totalCost, expected_date || null, user.id, notes || null);

      const insertPoItem = db.prepare(`
        INSERT INTO purchase_order_items (id, po_id, variant_id, quantity_ordered, quantity_received, unit_cost, total_cost)
        VALUES (?, ?, ?, ?, 0, ?, ?)
      `);

      for (const it of items) {
        const poiId = generateId('poi');
        const lineCost = Number(it.quantity_ordered) * Number(it.unit_cost);
        insertPoItem.run(poiId, poId, it.variant_id, it.quantity_ordered, it.unit_cost, lineCost);
      }

      auditService.log(user.id, 'CREATE_PURCHASE_ORDER', 'PURCHASE_ORDER', poId, { orderNumber, totalCost });
    });

    return { id: poId, orderNumber, totalCost, message: 'Purchase Order created.' };
  }

  public receivePurchaseOrder(poId: string, user: AuthUser) {
    const po = this.repo.getPurchaseOrderById(poId);
    if (!po) {
      throw new NotFoundError('Purchase order not found.');
    }
    if (po.status === 'received') {
      throw new BadRequestError('Purchase order has already been received.');
    }

    this.repo.executeTransaction(() => {
      const items = this.repo.getPurchaseOrderItems(poId);

      for (const it of items) {
        const inv = db.prepare('SELECT quantity FROM inventory WHERE variant_id = ?').get(it.variant_id) as any;
        const prevQty = inv ? inv.quantity : 0;
        const qtyReceived = it.quantity_ordered;
        const newQty = prevQty + qtyReceived;

        db.prepare('UPDATE purchase_order_items SET quantity_received = ? WHERE id = ?').run(qtyReceived, it.id);
        db.prepare('UPDATE inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE variant_id = ?').run(newQty, it.variant_id);

        db.prepare(`
          INSERT INTO inventory_movements (id, variant_id, previous_quantity, quantity_changed, new_quantity, movement_type, reason, reference_id, user_id)
          VALUES (?, ?, ?, ?, ?, 'received', 'Received stock from PO', ?, ?)
        `).run(generateId('mov'), it.variant_id, prevQty, qtyReceived, newQty, po.order_number, user.id);
      }

      db.prepare("UPDATE purchase_orders SET status = 'received', received_date = datetime('now') WHERE id = ?").run(poId);

      auditService.notify(
        'po_received',
        `Goods Received: ${po.order_number}`,
        `Stock from Purchase Order ${po.order_number} has been verified and added to inventory.`,
        '/suppliers'
      );

      auditService.log(user.id, 'RECEIVE_PURCHASE_ORDER', 'PURCHASE_ORDER', poId, { orderNumber: po.order_number });
    });

    return { message: 'Purchase order received and stock replenished.' };
  }
}

export const suppliersService = new SuppliersService();

