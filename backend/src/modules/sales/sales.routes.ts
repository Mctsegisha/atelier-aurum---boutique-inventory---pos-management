import { Router } from 'express';
import { salesController } from './sales.controller.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validate.js';
import { processRefundSchema } from './sales.schemas.js';

const router = Router();

router.get('/', authenticateUser, salesController.getSales);
router.get('/:id', authenticateUser, salesController.getSaleById);
router.post('/:id/refund', authenticateUser, requireRole(['admin', 'store_person']), validateRequest(processRefundSchema), salesController.processRefund);

export default router;

