import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validate.js';
import { loginSchema, changePasswordSchema, quickSwitchSchema } from './auth.schemas.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post('/login', authRateLimiter, validateRequest(loginSchema), authController.login);
router.post('/quick-switch', validateRequest(quickSwitchSchema), authController.quickSwitch);
router.get('/me', authenticateUser, authController.me);
router.post('/change-password', authenticateUser, validateRequest(changePasswordSchema), authController.changePassword);

export default router;

