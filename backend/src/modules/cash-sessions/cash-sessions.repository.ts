import { db } from '../../database/connection.js';

export interface CashSessionRow {
  id: string;
  opened_by_user_id?: string | null;
  opened_by_name: string;
  opened_at: string;
  closed_at?: string | null;
  opening_float: number;
  cash_sales: number;
  telebirr_sales: number;
  total_sales: number;
  expected_cash: number;
  closing_cash?: number | null;
  difference?: number | null;
  notes?: string | null;
  status: 'open' | 'closed';
  created_at?: string;
  updated_at?: string;
}

export interface LiveSalesSummary {
  cash_sales: number;
  telebirr_sales: number;
  total_sales: number;
}

export class CashSessionsRepository {
  public getActiveSession(): CashSessionRow | undefined {
    return db.prepare<CashSessionRow>(`
      SELECT * FROM cash_sessions
      WHERE status = 'open'
      ORDER BY opened_at DESC
      LIMIT 1
    `).get();
  }

  public getById(id: string): CashSessionRow | undefined {
    return db.prepare<CashSessionRow>(`
      SELECT * FROM cash_sessions
      WHERE id = ?
    `).get(id);
  }

  public getAll(limit = 100): CashSessionRow[] {
    return db.prepare<CashSessionRow>(`
      SELECT * FROM cash_sessions
      ORDER BY opened_at DESC
      LIMIT ?
    `).all(limit);
  }

  public createSession(data: {
    id: string;
    opened_by_user_id?: string | null;
    opened_by_name: string;
    opening_float: number;
    notes?: string | null;
  }): CashSessionRow {
    db.prepare(`
      INSERT INTO cash_sessions (
        id, opened_by_user_id, opened_by_name, opened_at,
        opening_float, cash_sales, telebirr_sales, total_sales,
        expected_cash, status, notes
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, 0, 0, 0, ?, 'open', ?)
    `).run(
      data.id,
      data.opened_by_user_id || null,
      data.opened_by_name,
      data.opening_float,
      data.opening_float,
      data.notes || null
    );

    return this.getById(data.id)!;
  }

  public aggregateSalesSince(openedAt: string): LiveSalesSummary {
    try {
      const row = db.prepare<{
        cash_sales: number | string | null;
        telebirr_sales: number | string | null;
        total_sales: number | string | null;
      }>(`
        SELECT
          COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'cash' THEN total_amount ELSE 0 END), 0) as cash_sales,
          COALESCE(SUM(CASE WHEN LOWER(payment_method) IN ('mobile', 'telebirr') THEN total_amount ELSE 0 END), 0) as telebirr_sales,
          COALESCE(SUM(total_amount), 0) as total_sales
        FROM sales
        WHERE created_at >= ?
          AND (is_refunded IS NULL OR is_refunded = 0)
          AND (payment_status IS NULL OR payment_status != 'cancelled')
      `).get(openedAt);

      return {
        cash_sales: Number(row?.cash_sales ?? 0),
        telebirr_sales: Number(row?.telebirr_sales ?? 0),
        total_sales: Number(row?.total_sales ?? 0)
      };
    } catch {
      return { cash_sales: 0, telebirr_sales: 0, total_sales: 0 };
    }
  }

  public closeSession(
    id: string,
    updateData: {
      cash_sales: number;
      telebirr_sales: number;
      total_sales: number;
      expected_cash: number;
      closing_cash: number;
      difference: number;
      notes?: string | null;
    }
  ): CashSessionRow {
    db.prepare(`
      UPDATE cash_sessions SET
        closed_at = CURRENT_TIMESTAMP,
        cash_sales = ?,
        telebirr_sales = ?,
        total_sales = ?,
        expected_cash = ?,
        closing_cash = ?,
        difference = ?,
        notes = COALESCE(?, notes),
        status = 'closed',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      updateData.cash_sales,
      updateData.telebirr_sales,
      updateData.total_sales,
      updateData.expected_cash,
      updateData.closing_cash,
      updateData.difference,
      updateData.notes || null,
      id
    );

    return this.getById(id)!;
  }
}

export const cashSessionsRepository = new CashSessionsRepository();
