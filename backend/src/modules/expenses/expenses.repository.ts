import { db } from '../../database/connection.js';

export interface ExpenseCategoryRow {
  id: string;
  name: string;
  description?: string | null;
}

export interface ExpenseRow {
  id: string;
  category_id: string;
  category_name?: string;
  title: string;
  description?: string | null;
  amount: number;
  payment_method: string;
  expense_date: string;
  recorded_by_id: string;
  recorded_by_name?: string;
  receipt_url?: string | null;
  created_at: string;
}

export class ExpensesRepository {
  public getAll(filters: { categoryId?: string; startDate?: string; endDate?: string }): ExpenseRow[] {
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

    return db.prepare<ExpenseRow>(sql).all(...params);
  }

  public getCategories(): ExpenseCategoryRow[] {
    return db.prepare<ExpenseCategoryRow>('SELECT * FROM expense_categories ORDER BY name ASC').all();
  }

  public findCategoryById(id: string): ExpenseCategoryRow | undefined {
    return db.prepare<ExpenseCategoryRow>('SELECT * FROM expense_categories WHERE id = ?').get(id);
  }

  public findCategoryByName(name: string): ExpenseCategoryRow | undefined {
    return db.prepare<ExpenseCategoryRow>('SELECT * FROM expense_categories WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))').get(name);
  }

  public createCategory(id: string, name: string, description?: string | null): ExpenseCategoryRow {
    db.prepare(`
      INSERT INTO expense_categories (id, name, description)
      VALUES (?, ?, ?)
    `).run(id, name.trim(), description || null);

    return this.findCategoryById(id)!;
  }

  public findById(id: string): ExpenseRow | undefined {
    return db.prepare<ExpenseRow>('SELECT * FROM expenses WHERE id = ?').get(id);
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
  }): void {
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

  public delete(id: string): void {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  }
}

export const expensesRepository = new ExpensesRepository();
