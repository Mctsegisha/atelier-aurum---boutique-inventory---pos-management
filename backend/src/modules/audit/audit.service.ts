import { auditRepository, AuditRepository } from './audit.repository.js';
import { generateId } from '../../utils/idGenerator.js';
import { logger } from '../../utils/logger.js';

export class AuditService {
  constructor(private readonly repo: AuditRepository = auditRepository) {}

  public log(
    userId: string | undefined,
    action: string,
    entityType: string,
    entityId: string | null = null,
    newValues?: unknown,
    oldValues?: unknown,
    ipAddress = '127.0.0.1'
  ): void {
    try {
      const id = generateId('aud');
      this.repo.insertLog({
        id,
        userId: userId || null,
        action,
        entityType,
        entityId,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        ipAddress
      });
    } catch (err) {
      logger.error('[AuditService.log failed]', err);
    }
  }

  public notify(type: string, title: string, message: string, link?: string): void {
    try {
      const id = generateId('notif');
      this.repo.insertNotification(id, type, title, message, link);
    } catch (err) {
      logger.error('[AuditService.notify failed]', err);
    }
  }

  public getLogs(limit?: number, action?: string, entityType?: string) {
    return this.repo.getLogs(limit, action, entityType);
  }

  public getNotifications() {
    return this.repo.getNotifications();
  }

  public markNotificationRead(id: string) {
    this.repo.markNotificationAsRead(id);
  }

  public markAllNotificationsRead() {
    this.repo.markAllNotificationsAsRead();
  }
}

export const auditService = new AuditService();

