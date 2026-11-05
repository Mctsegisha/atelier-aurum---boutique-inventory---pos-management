import { db } from '../../database/connection.js';

export interface AuditLogRecord {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: string | null;
  new_values: string | null;
  ip_address: string | null;
  created_at: string;
  user_name?: string;
  user_role?: string;
}

export class AuditRepository {
  public insertLog(log: {
    id: string;
    userId: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    oldValues: string | null;
    newValues: string | null;
    ipAddress: string | null;
  }): void {
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      log.id,
      log.userId,
      log.action,
      log.entityType,
      log.entityId,
      log.oldValues,
      log.newValues,
      log.ipAddress
    );
  }

  public getLogs(limit = 100, action?: string, entityType?: string): AuditLogRecord[] {
    let sql = `
      SELECT a.*, u.full_name as user_name, u.role as user_role
      FROM audit_logs a
      LEFT JOIN profiles u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (action) {
      sql += ` AND a.action = ?`;
      params.push(action);
    }
    if (entityType) {
      sql += ` AND a.entity_type = ?`;
      params.push(entityType);
    }

    sql += ` ORDER BY a.created_at DESC LIMIT ?`;
    params.push(limit);

    return db.prepare(sql).all(...params) as AuditLogRecord[];
  }

  public getNotifications(limit = 50): any[] {
    return db.prepare(`
      SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?
    `).all(limit);
  }

  public markNotificationAsRead(id: string): void {
    db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ?`).run(id);
  }

  public markAllNotificationsAsRead(): void {
    db.prepare(`UPDATE notifications SET is_read = 1`).run();
  }

  public insertNotification(id: string, type: string, title: string, message: string, link?: string): void {
    db.prepare(`
      INSERT INTO notifications (id, type, title, message, link)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, type, title, message, link || null);
  }
}

export const auditRepository = new AuditRepository();

