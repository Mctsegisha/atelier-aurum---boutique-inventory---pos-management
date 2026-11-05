import { Router } from 'express';
import { settingsController } from './settings.controller.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validate.js';
import { updateSettingsSchema } from './settings.schemas.js';

const router = Router();

router.get('/', authenticateUser, settingsController.getSettings);
router.put('/', authenticateUser, requireRole(['admin']), validateRequest(updateSettingsSchema), settingsController.updateSettings);

export default router;

