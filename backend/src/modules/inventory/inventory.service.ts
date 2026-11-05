import { InventoryRepository, inventoryRepository } from './inventory.repository.js';
import { AuthUser } from '../../middleware/authenticate.js';
import { generateId } from '../../utils/idGenerator.js';
import { auditService } from '../audit/audit.service.js';
import { NotFoundError, BadRequestError } from '../../errors/AppError.js';

export class InventoryService {
  constructor(private readonly repo: InventoryRepository = inventoryRepository) {}

  public getInventory(user: AuthUser, query: any) {
    const isCashier = user.role === 'sales';
    return this.repo.getAll({
      lowStockOnly: query.lowStockOnly === 'true',
      search: query.search as string,
      isCashier
    });
  }

  public adjustStock(user: AuthUser, body: any) {
    const { variant_id, adjustment_type, quantity, reason, reference_id } = body;
    const variantInfo = this.repo.getVariantInfo(variant_id);

    if (!variantInfo) {
      throw new NotFoundError('Variant not found.');
    }

    const currentQty = variantInfo.stock_quantity ?? 0;
    const inputQty = Number(quantity);
    let finalQty = currentQty;
    let qtyChanged = 0;

    if (adjustment_type === 'set') {
      finalQty = inputQty;
      qtyChanged = finalQty - currentQty;
    } else if (adjustment_type === 'add') {
      finalQty = currentQty + inputQty;
      qtyChanged = inputQty;
    } else if (adjustment_type === 'subtract') {
      if (currentQty < inputQty) {
        throw new BadRequestError(`Cannot subtract ${inputQty} units. Current stock is only ${currentQty}.`);
      }
      finalQty = currentQty - inputQty;
      qtyChanged = -inputQty;
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
        movementType: 'adjustment',
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

