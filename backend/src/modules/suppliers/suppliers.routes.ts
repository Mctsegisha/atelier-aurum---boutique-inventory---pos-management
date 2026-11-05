import { Router } from 'express';
import { suppliersController } from './suppliers.controller.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validate.js';
import { createSupplierSchema, updateSupplierSchema, createPoSchema } from './suppliers.schemas.js';

const router = Router();

router.get('/', authenticateUser, requireRole(['admin', 'store_person']), suppliersController.getSuppliers);
router.post('/', authenticateUser, requireRole(['admin', 'store_person']), validateRequest(createSupplierSchema), suppliersController.createSupplier);
router.put('/:id', authenticateUser, requireRole(['admin', 'store_person']), validateRequest(updateSupplierSchema), suppliersController.updateSupplier);

router.get('/purchase-orders/all', authenticateUser, requireRole(['admin', 'store_person']), suppliersController.getPurchaseOrders);
router.post('/purchase-orders', authenticateUser, requireRole(['admin', 'store_person']), validateRequest(createPoSchema), suppliersController.createPurchaseOrder);
router.post('/purchase-orders/:id/receive', authenticateUser, requireRole(['admin', 'store_person']), suppliersController.receivePurchaseOrder);

export default router;

