import { Router } from 'express';
import { inventoryController } from './inventory.controller.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validate.js';
import { adjustStockSchema, receiveStockSchema, updateVariantSchema } from './inventory.schemas.js';

const router = Router();

router.get('/', authenticateUser, inventoryController.getInventory);
router.get('/stats', authenticateUser, inventoryController.getStats);
router.get('/slow-moving', authenticateUser, inventoryController.getSlowMoving);
router.post('/adjust', authenticateUser, requireRole(['admin', 'store_person']), validateRequest(adjustStockSchema), inventoryController.adjustStock);
router.patch('/variant/:variantId', authenticateUser, requireRole(['admin', 'store_person']), validateRequest(updateVariantSchema), inventoryController.updateVariant);
router.post('/receive', authenticateUser, requireRole(['admin', 'store_person']), validateRequest(receiveStockSchema), inventoryController.receiveStock);
router.get('/movements', authenticateUser, inventoryController.getMovements);

export default router;

