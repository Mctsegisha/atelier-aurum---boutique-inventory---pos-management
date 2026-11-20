import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  dashboardQuerySchema,
  salesReportQuerySchema,
  pnlReportQuerySchema,
  channelsReportQuerySchema,
  settleCreditSchema,
  wastageReportQuerySchema
} from './reports.schemas.js';

const router = Router();

router.get('/sales', authenticateUser, validateRequest(salesReportQuerySchema), reportsController.getSalesReport);
router.get('/pnl', authenticateUser, validateRequest(pnlReportQuerySchema), reportsController.getPnlReport);
router.get('/stock-value', authenticateUser, reportsController.getStockValueReport);
router.get('/channels', authenticateUser, validateRequest(channelsReportQuerySchema), reportsController.getChannelsReport);
router.get('/owed-to-us', authenticateUser, reportsController.getOwedToUsReport);
router.post('/settle-credit', authenticateUser, validateRequest(settleCreditSchema), reportsController.settleCustomerCredit);
router.get('/wastage', authenticateUser, validateRequest(wastageReportQuerySchema), reportsController.getWastageReport);
router.get('/dashboard', authenticateUser, validateRequest(dashboardQuerySchema), reportsController.getDashboard);

export default router;
