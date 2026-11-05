import { db } from '../../database/connection.js';

export class ExpensesRepository {
  public getAll(filters: { categoryId?: string; startDate?: string; endDate?: string }) {
    let sql = `
      SELECT e.*, ec.name as category_name, u.full_name as recorded_by_name
      FROM expenses e
      JOIN expense_categories ec ON e.category_id = ec.id
      LEFT JOIN profiles u ON e.recorded_by_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.categoryId && filters.categoryId !== 'all') {
      sql += ' AND e.category_id = ?';
      params.push(filters.categoryId);
    }

    if (filters.startDate) {
      sql += ' AND e.expense_date >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ' AND e.expense_date <= ?';
      params.push(filters.endDate);
    }

    sql += ' ORDER BY e.expense_date DESC, e.created_at DESC';

    return db.prepare(sql).all(...params);
  }

  public getCategories() {
    return db.prepare('SELECT * FROM expense_categories ORDER BY name ASC').all();
  }

  public findById(id: string) {
    return db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
  }

  public create(data: {
    id: string;
    categoryId: string;
    title: string;
    description?: string | null;
    amount: number;
    paymentMethod: string;
    expenseDate: string;
    recordedById: string;
  }) {
    db.prepare(`
      INSERT INTO expenses (id, category_id, title, description, amount, payment_method, expense_date, recorded_by_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.id,
      data.categoryId,
      data.title,
      data.description || null,
      data.amount,
      data.paymentMethod,
      data.expenseDate,
      data.recordedById
    );
  }

  public delete(id: string) {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  }
}

export const expensesRepository = new ExpensesRepository();

