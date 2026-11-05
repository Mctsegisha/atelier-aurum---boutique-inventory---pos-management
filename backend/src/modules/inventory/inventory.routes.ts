import { Router } from 'express';
import { inventoryController } from './inventory.controller.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validate.js';
import { adjustStockSchema, receiveStockSchema } from './inventory.schemas.js';

const router = Router();

router.get('/', authenticateUser, inventoryController.getInventory);
router.post('/adjust', authenticateUser, requireRole(['admin', 'store_person']), validateRequest(adjustStockSchema), inventoryController.adjustStock);
router.post('/receive', authenticateUser, requireRole(['admin', 'store_person']), validateRequest(receiveStockSchema), inventoryController.receiveStock);
router.get('/movements', authenticateUser, inventoryController.getMovements);

export default router;

