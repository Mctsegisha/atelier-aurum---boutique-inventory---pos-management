import { ExpensesRepository, expensesRepository } from './expenses.repository.js';
import { generateId } from '../../utils/idGenerator.js';
import { auditService } from '../audit/audit.service.js';
import { NotFoundError } from '../../errors/AppError.js';
import { AuthUser } from '../../middleware/authenticate.js';

export class ExpensesService {
  constructor(private readonly repo: ExpensesRepository = expensesRepository) {}

  public getExpenses(query: any) {
    return this.repo.getAll({
      categoryId: query.categoryId as string,
      startDate: query.startDate as string,
      endDate: query.endDate as string
    });
  }

  public getCategories() {
    return this.repo.getCategories();
  }

  public createExpense(user: AuthUser, body: any) {
    const id = generateId('exp');
    const dateStr = body.expense_date || new Date().toISOString().split('T')[0];

    this.repo.create({
      id,
      categoryId: body.category_id,
      title: body.title.trim(),
      description: body.description,
      amount: Number(body.amount),
      paymentMethod: body.payment_method || 'card',
      expenseDate: dateStr,
      recordedById: user.id
    });

    auditService.log(user.id, 'RECORD_EXPENSE', 'EXPENSE', id, { title: body.title, amount: body.amount });

    return { id, message: 'Expense recorded.' };
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

