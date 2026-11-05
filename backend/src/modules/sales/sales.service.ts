import { SalesRepository, salesRepository } from './sales.repository.js';
import { db } from '../../database/connection.js';
import { AuthUser } from '../../middleware/authenticate.js';
import { generateId } from '../../utils/idGenerator.js';
import { auditService } from '../audit/audit.service.js';
import { NotFoundError, BadRequestError } from '../../errors/AppError.js';

export class SalesService {
  constructor(private readonly repo: SalesRepository = salesRepository) {}

  public getSales(user: AuthUser, query: any) {
    const isCashier = user.role === 'sales';
    return this.repo.getAll({
      cashierId: isCashier ? user.id : (query.cashierId !== 'all' ? (query.cashierId as string) : undefined),
      paymentMethod: query.paymentMethod as string,
      status: query.status as string,
      startDate: query.startDate as string,
      endDate: query.endDate as string,
      search: query.search as string,
      limit: query.limit ? Number(query.limit) : 50
    });
  }

  public getSaleById(id: string) {
    const result = this.repo.getById(id);
    if (!result) {
      throw new NotFoundError('Sale not found.');
    }
    return result;
  }

  public processRefund(saleId: string, user: AuthUser, body: any) {
    const { refund_amount, reason, items = [] } = body;
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId) as any;

    if (!sale) {
      throw new NotFoundError('Original sale record not found.');
    }

    const currentRefunded = Number(sale.refunded_amount) || 0;
    const maxRefundable = Math.max(0, Number(sale.total_amount) - currentRefunded);
    const requestedAmount = Number(refund_amount);

    if (requestedAmount <= 0 || requestedAmount > maxRefundable + 0.01) {
      throw new BadRequestError(`Invalid refund amount ($${requestedAmount}). Maximum refundable: $${maxRefundable}`);
    }

    const refundId = generateId('ref');
    const newTotalRefunded = currentRefunded + requestedAmount;
    const newStatus = newTotalRefunded >= Number(sale.total_amount) - 0.01 ? 'refunded' : 'partial_refund';

    this.repo.executeTransaction(() => {
      db.prepare(`
        INSERT INTO refunds (id, sale_id, receipt_number, authorized_by_id, cashier_id, refund_amount, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(refundId, saleId, sale.receipt_number, user.id, user.id, requestedAmount, reason);

      db.prepare(`
        UPDATE sales SET
          refunded_amount = ?,
          payment_status = ?,
          is_refunded = 1
        WHERE id = ?
      `).run(newTotalRefunded, newStatus, saleId);

      const insertRefundItem = db.prepare(`
        INSERT INTO refund_items (id, refund_id, sale_item_id, variant_id, quantity, restock_item, refund_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const restockStmt = db.prepare(`
        UPDATE inventory SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE variant_id = ?
      `);

      const movStmt = db.prepare(`
        INSERT INTO inventory_movements (id, variant_id, previous_quantity, quantity_changed, new_quantity, movement_type, reason, reference_id, user_id)
        VALUES (?, ?, ?, ?, ?, 'return', ?, ?, ?)
      `);

      for (const it of items) {
        const refItemId = generateId('rfi');
        insertRefundItem.run(
          refItemId,
          refundId,
          it.sale_item_id,
          it.variant_id,
          it.quantity,
          it.restock_item ? 1 : 0,
          it.refund_amount
        );

        if (it.restock_item) {
          const inv = db.prepare('SELECT quantity FROM inventory WHERE variant_id = ?').get(it.variant_id) as any;
          const prev = inv ? inv.quantity : 0;
          const next = prev + Number(it.quantity);

          restockStmt.run(it.quantity, it.variant_id);
          movStmt.run(
            generateId('mov'),
            it.variant_id,
            prev,
            it.quantity,
            next,
            `Customer return: ${reason}`,
            refundId,
            user.id
          );
        }
      }

      auditService.notify(
        'refund_issued',
        `Refund Processed: $${requestedAmount.toFixed(2)}`,
        `Receipt ${sale.receipt_number} was authorized for $${requestedAmount.toFixed(2)} refund by ${user.full_name}.`,
        '/sales'
      );
    });

    auditService.log(user.id, 'REFUND_PROCESSED', 'SALE', saleId, {
      receiptNumber: sale.receipt_number,
      refundAmount: requestedAmount,
      reason
    });

    return {
      message: 'Refund authorized and processed successfully.',
      refund_id: refundId,
      refund_amount: requestedAmount,
      new_payment_status: newStatus
    };
  }
}

export const salesService = new SalesService();

