import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';
import { auditService, AuditService } from './audit.service.js';

export class AuditController {
  constructor(private readonly service: AuditService = auditService) {}

  public getLogs = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit = '100', action, entityType } = req.query;
      const logs = this.service.getLogs(Number(limit), action as string, entityType as string);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  };

  public getNotifications = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const notifications = this.service.getNotifications();
      res.json(notifications);
    } catch (err) {
      next(err);
    }
  };

  public markRead = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      this.service.markNotificationRead(id);
      res.json({ message: 'Notification marked as read.' });
    } catch (err) {
      next(err);
    }
  };

  public markAllRead = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      this.service.markAllNotificationsRead();
      res.json({ message: 'All notifications marked as read.' });
    } catch (err) {
      next(err);
    }
  };
}

export const auditController = new AuditController();

