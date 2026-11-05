import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validate.js';
import { dashboardQuerySchema } from './reports.schemas.js';

const router = Router();

router.get('/dashboard', authenticateUser, validateRequest(dashboardQuerySchema), reportsController.getDashboard);

export default router;

