import { Router } from 'express';
import { auditController } from './audit.controller.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';

const router = Router();

router.get('/logs', authenticateUser, requireRole(['admin']), auditController.getLogs);
router.get('/notifications', authenticateUser, auditController.getNotifications);
router.patch('/notifications/:id/read', authenticateUser, auditController.markRead);
router.post('/notifications/read-all', authenticateUser, auditController.markAllRead);

export default router;

