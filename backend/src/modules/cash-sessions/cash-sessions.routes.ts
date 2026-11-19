import { Router } from 'express';
import { cashSessionsController } from './cash-sessions.controller.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validate.js';
import { openCashSessionSchema, closeCashSessionSchema } from './cash-sessions.schemas.js';

const router = Router();

router.get('/', authenticateUser, cashSessionsController.getSessionData);
router.get('/active', authenticateUser, cashSessionsController.getActiveSession);
router.post('/open', authenticateUser, validateRequest(openCashSessionSchema), cashSessionsController.openSession);
router.post('/:id/close', authenticateUser, validateRequest(closeCashSessionSchema), cashSessionsController.closeSession);
router.post('/close', authenticateUser, validateRequest(closeCashSessionSchema), cashSessionsController.closeSession);

export default router;
