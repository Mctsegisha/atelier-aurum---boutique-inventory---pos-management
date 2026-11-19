import { ExpensesRepository, expensesRepository, ExpenseCategoryRow, ExpenseRow } from './expenses.repository.js';
import { generateId } from '../../utils/idGenerator.js';
import { auditService } from '../audit/audit.service.js';
import { NotFoundError, BadRequestError } from '../../errors/AppError.js';
import { AuthUser } from '../../middleware/authenticate.js';
import { CreateExpenseInput, CreateExpenseCategoryInput } from './expenses.schemas.js';

export class ExpensesService {
  constructor(private readonly repo: ExpensesRepository = expensesRepository) {}

  public getExpenses(query: { categoryId?: string; startDate?: string; endDate?: string }): ExpenseRow[] {
    return this.repo.getAll({
      categoryId: query.categoryId,
      startDate: query.startDate,
      endDate: query.endDate
    });
  }

  public getCategories(): ExpenseCategoryRow[] {
    return this.repo.getCategories();
  }

  public createCategory(user: AuthUser, body: CreateExpenseCategoryInput): ExpenseCategoryRow {
    const trimmedName = body.name.trim();
    if (!trimmedName) {
      throw new BadRequestError('Category name is required.');
    }

    const existing = this.repo.findCategoryByName(trimmedName);
    if (existing) {
      return existing;
    }

    const id = generateId('ec');
    const created = this.repo.createCategory(id, trimmedName, body.description);

    auditService.log(user.id, 'CREATE_EXPENSE_CATEGORY', 'EXPENSE_CATEGORY', id, {
      name: trimmedName
    });

    return created;
  }

  public createExpense(user: AuthUser, body: CreateExpenseInput) {
    let category = this.repo.findCategoryById(body.category_id);
    if (!category) {
      category = this.repo.findCategoryByName(body.category_id);
    }
    if (!category) {
      throw new NotFoundError('Selected expense category does not exist.');
    }

    const id = generateId('exp');
    const dateStr = body.expense_date || body.date || new Date().toISOString().split('T')[0];
    const noteText = body.note?.trim() || body.description?.trim() || null;

    // Use explicit title if provided; otherwise fallback to category name (or note)
    const title = body.title?.trim() || (noteText ? `${category.name} - ${noteText}` : category.name);
    const amount = Number(body.amount);

    this.repo.create({
      id,
      categoryId: category.id,
      title,
      description: noteText,
      amount,
      paymentMethod: body.payment_method || 'card',
      expenseDate: dateStr,
      recordedById: user.id
    });

    auditService.log(user.id, 'RECORD_EXPENSE', 'EXPENSE', id, {
      title,
      amount,
      category_id: category.id,
      category_name: category.name,
      expense_date: dateStr
    });

    return {
      id,
      category_id: category.id,
      category_name: category.name,
      title,
      description: noteText,
      amount,
      expense_date: dateStr,
      message: 'Expense recorded successfully.'
    };
  }

  public deleteExpense(id: string, user: AuthUser) {
    const existing = this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError('Expense not found.');
    }
    this.repo.delete(id);
    auditService.log(user.id, 'DELETE_EXPENSE', 'EXPENSE', id);
    return { message: 'Expense removed.' };
  }
}

export const expensesService = new ExpensesService();
