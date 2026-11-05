import { db } from '../../database/connection.js';

export class ShiftsRepository {
  public getActiveShift(userId: string) {
    return db.prepare(`
      SELECT * FROM shifts
      WHERE user_id = ? AND status = 'active'
      ORDER BY start_time DESC LIMIT 1
    `).get(userId);
  }

  public getById(id: string) {
    return db.prepare('SELECT * FROM shifts WHERE id = ?').get(id);
  }

  public createShift(id: string, userId: string, startingCash: number, notes?: string | null) {
    db.prepare(`
      INSERT INTO shifts (id, user_id, start_time, starting_cash, cash_sales, card_sales, total_sales, status, notes)
      VALUES (?, ?, CURRENT_TIMESTAMP, ?, 0, 0, 0, 'active', ?)
    `).run(id, userId, startingCash, notes || 'Shift opened');

    return this.getById(id);
  }

  public closeShift(id: string, endingCash: number, notes?: string | null) {
    db.prepare(`
      UPDATE shifts SET
        end_time = CURRENT_TIMESTAMP,
        ending_cash = ?,
        status = 'closed',
        notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(endingCash, notes || null, id);

    return this.getById(id);
  }
}

export const shiftsRepository = new ShiftsRepository();

