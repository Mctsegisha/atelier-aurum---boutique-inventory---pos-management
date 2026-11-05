import { Router } from 'express';
import { posController } from './pos.controller.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validate.js';
import { checkoutSchema } from './pos.schemas.js';

const router = Router();

router.post(
  '/checkout',
  authenticateUser,
  requireRole(['admin', 'store_person', 'sales']),
  validateRequest(checkoutSchema),
  posController.checkout
);

export default router;

