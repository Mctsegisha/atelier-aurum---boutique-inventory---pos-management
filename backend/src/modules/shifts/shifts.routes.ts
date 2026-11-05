import { Router } from 'express';
import { shiftsController } from './shifts.controller.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validate.js';
import { startShiftSchema, closeShiftSchema } from './shifts.schemas.js';

const router = Router();

router.get('/current', authenticateUser, shiftsController.getCurrentShift);
router.post('/start', authenticateUser, validateRequest(startShiftSchema), shiftsController.startShift);
router.post('/close', authenticateUser, validateRequest(closeShiftSchema), shiftsController.closeShift);

export default router;

