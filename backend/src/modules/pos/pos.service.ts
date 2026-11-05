import { PosRepository, posRepository, VariantStockRecord } from './pos.repository.js';
import { CheckoutInput } from './pos.schemas.js';
import { BadRequestError } from '../../errors/AppError.js';
import { generateId, generateReceiptNumber } from '../../utils/idGenerator.js';
import { auditService } from '../audit/audit.service.js';

export class PosService {
  constructor(private readonly repo: PosRepository = posRepository) {}

  public async processCheckout(cashierId: string, input: CheckoutInput) {
    // 1. Idempotency Check
    if (input.idempotency_key) {
      const existing = this.repo.findExistingSaleByIdempotencyKey(input.idempotency_key);
      if (existing) {
        return {
          idempotentReplay: true,
          message: 'Transaction already completed (Idempotent replay)',
          sale: existing.sale,
          items: existing.items
        };
      }
    }

    const { tax_rate, allow_negative_inventory } = this.repo.getBusinessSettings();

    // 2. Validate Items & Compute Financials in Integer Cents
    let subtotalCents = 0;
    const validatedItems: Array<{
      variant: VariantStockRecord;
      quantity: number;
      itemTotalCents: number;
    }> = [];

    for (const item of input.cart_items) {
      const variant = this.repo.getVariantWithStock(item.variant_id);
      if (!variant) {
        throw new BadRequestError(`Product variant ID ${item.variant_id} does not exist.`);
      }

      if (variant.status === 'pending_approval') {
        throw new BadRequestError(`Product "${variant.product_name}" is pending administrator approval and cannot be sold.`);
      }

      if (variant.status === 'rejected') {
        throw new BadRequestError(`Product "${variant.product_name}" was rejected by administrator and cannot be sold.`);
      }

      if (variant.status !== 'active') {
        throw new BadRequestError(`Product "${variant.product_name}" is not active for sale (status: ${variant.status}).`);
      }

      if (!allow_negative_inventory && variant.stock_quantity < item.quantity) {
        throw new BadRequestError(
          `Insufficient inventory for "${variant.product_name} (${variant.size} / ${variant.color})". Available: ${variant.stock_quantity}, Requested: ${item.quantity}`
        );
      }

      const itemTotalCents = variant.selling_price_cents * item.quantity;
      subtotalCents += itemTotalCents;

      validatedItems.push({
        variant,
        quantity: item.quantity,
        itemTotalCents
      });
    }

    // 3. Discount & Tax Calculation (Exact Integer Math)
    let discountCents = 0;
    if (input.discount_type === 'percentage') {
      const pct = Math.min(100, Math.max(0, input.discount_amount));
      discountCents = Math.round((subtotalCents * pct) / 100);
    } else {
      discountCents = Math.min(subtotalCents, Math.round(input.discount_amount * 100));
    }

    const taxableAmountCents = Math.max(0, subtotalCents - discountCents);
    const taxCents = Math.round(taxableAmountCents * tax_rate);
    const grandTotalCents = taxableAmountCents + taxCents;

    const saleId = generateId('sale');
    const receiptNumber = generateReceiptNumber();

    // 4. Atomic Database Execution
    const result = this.repo.executeTransaction(() => {
      // Insert Sale
      this.repo.insertSale({
        id: saleId,
        receiptNumber,
        cashierId,
        customerId: input.customer_id || null,
        subtotalCents,
        discountCents,
        discountType: input.discount_type,
        taxRate: tax_rate,
        taxCents,
        totalCents: grandTotalCents,
        paymentMethod: input.payment_method,
        notes: input.notes || null,
        idempotencyKey: input.idempotency_key || null
      });

      // Insert Items & Decrement Stock
      for (const { variant, quantity, itemTotalCents } of validatedItems) {
        this.repo.insertSaleItem({
          id: generateId('si'),
          saleId,
          variantId: variant.id,
          productName: variant.product_name,
          variantDetails: `${variant.size} · ${variant.color}`,
          quantity,
          unitPriceCents: variant.selling_price_cents,
          costPriceCents: variant.purchase_price_cents,
          totalCents: itemTotalCents
        });

        this.repo.deductInventory(variant.id, quantity);

        const newStock = variant.stock_quantity - quantity;
        this.repo.logInventoryMovement({
          id: generateId('mov'),
          variantId: variant.id,
          prevQty: variant.stock_quantity,
          qtyChanged: -quantity,
          newQty: newStock,
          refNumber: receiptNumber,
          userId: cashierId
        });

        if (newStock <= variant.min_threshold) {
          auditService.notify(
            'low_stock',
            `Low Stock: ${variant.product_name}`,
            `${variant.product_name} (${variant.size} / ${variant.color}) reached ${newStock} units.`,
            '/inventory'
          );
        }
      }

      // Record Payment
      const paymentId = generateId('pay');
      this.repo.insertPayment(
        paymentId,
        saleId,
        input.payment_method,
        grandTotalCents,
        `TXN_${Date.now()}`
      );

      // Shift Update
      const cashCents = input.payment_method === 'cash' ? grandTotalCents : 0;
      const cardCents = input.payment_method === 'card' ? grandTotalCents : 0;
      this.repo.updateActiveShiftStats(cashierId, cashCents, cardCents, grandTotalCents);

      return {
        saleId,
        receiptNumber,
        totalAmount: grandTotalCents / 100
      };
    });

    auditService.log(cashierId, 'POS_CHECKOUT', 'SALE', saleId, { receiptNumber, total: grandTotalCents / 100 });

    return {
      message: 'Sale completed successfully.',
      receipt: {
        id: result.saleId,
        receipt_number: result.receiptNumber,
        subtotal: subtotalCents / 100,
        discount_amount: discountCents / 100,
        tax_rate,
        tax_amount: taxCents / 100,
        total_amount: result.totalAmount,
        payment_method: input.payment_method,
        cashier_id: cashierId,
        created_at: new Date().toISOString()
      }
    };
  }
}

export const posService = new PosService();

