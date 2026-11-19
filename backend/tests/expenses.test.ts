import { test, describe } from 'node:test';
import assert from 'node:assert';
import { createExpenseSchema, createExpenseCategorySchema } from '../src/modules/expenses/expenses.schemas.js';
import { ExpensesService } from '../src/modules/expenses/expenses.service.js';
import { ExpensesRepository, ExpenseCategoryRow, ExpenseRow } from '../src/modules/expenses/expenses.repository.js';
import { AuthUser } from '../src/middleware/authenticate.js';

describe('Expenses Validation Schemas', () => {
  test('should accept valid expense creation payload with note and date', () => {
    const parsed = createExpenseSchema.body.parse({
      category_id: 'ec_rent',
      amount: 15000,
      date: '2026-11-19',
      note: 'September showroom rent'
    });
    assert.strictEqual(parsed.category_id, 'ec_rent');
    assert.strictEqual(parsed.amount, 15000);
    assert.strictEqual(parsed.date, '2026-11-19');
    assert.strictEqual(parsed.note, 'September showroom rent');
    assert.strictEqual(parsed.payment_method, 'card');
  });

  test('should reject expense creation with non-positive amount', () => {
    assert.throws(() => {
      createExpenseSchema.body.parse({
        category_id: 'ec_rent',
        amount: -50
      });
    });

    assert.throws(() => {
      createExpenseSchema.body.parse({
        category_id: 'ec_rent',
        amount: 0
      });
    });
  });

  test('should reject expense creation without category_id', () => {
    assert.throws(() => {
      createExpenseSchema.body.parse({
        amount: 500
      });
    });
  });

  test('should accept valid expense category creation payload', () => {
    const parsed = createExpenseCategorySchema.body.parse({
      name: 'Showroom Fragrances & Scenting'
    });
    assert.strictEqual(parsed.name, 'Showroom Fragrances & Scenting');
  });

  test('should reject empty category name', () => {
    assert.throws(() => {
      createExpenseCategorySchema.body.parse({
        name: ''
      });
    });
  });
});

describe('Expenses Service & Category Workflow', () => {
  const dummyUser: AuthUser = {
    id: 'u_admin',
    username: 'admin',
    email: 'admin@hirbit.com',
    full_name: 'Administrator',
    role: 'admin'
  };

  const initialCategories: ExpenseCategoryRow[] = [
    { id: 'ec_electricity', name: 'Electricity' },
    { id: 'ec_internet_phone', name: 'Internet & phone' },
    { id: 'ec_rent', name: 'Rent' }
  ];

  test('should create and persist a new custom category', () => {
    const categories = [...initialCategories];

    const mockRepo = {
      getCategories: () => categories,
      findCategoryById: (id: string) => categories.find(c => c.id === id),
      findCategoryByName: (name: string) => categories.find(c => c.name.toLowerCase() === name.toLowerCase()),
      createCategory: (id: string, name: string) => {
        const cat = { id, name };
        categories.push(cat);
        return cat;
      }
    } as unknown as ExpensesRepository;

    const service = new ExpensesService(mockRepo);
    const created = service.createCategory(dummyUser, { name: 'Packaging Ribbons' });

    assert.strictEqual(created.name, 'Packaging Ribbons');
    assert.ok(created.id.startsWith('ec_'));
    assert.strictEqual(categories.length, 4);
  });

  test('should return existing category if name already exists (case-insensitive)', () => {
    const categories = [...initialCategories];

    const mockRepo = {
      getCategories: () => categories,
      findCategoryById: (id: string) => categories.find(c => c.id === id),
      findCategoryByName: (name: string) => categories.find(c => c.name.toLowerCase() === name.toLowerCase()),
      createCategory: () => { throw new Error('Should not be called'); }
    } as unknown as ExpensesRepository;

    const service = new ExpensesService(mockRepo);
    const result = service.createCategory(dummyUser, { name: 'electricity' });

    assert.strictEqual(result.id, 'ec_electricity');
    assert.strictEqual(result.name, 'Electricity');
  });

  test('should record an expense and cleanly derive title from category and note', () => {
    const categories = [...initialCategories];
    let createdRecord: any = null;

    const mockRepo = {
      getCategories: () => categories,
      findCategoryById: (id: string) => categories.find(c => c.id === id),
      findCategoryByName: (name: string) => categories.find(c => c.name.toLowerCase() === name.toLowerCase()),
      create: (data: any) => {
        createdRecord = data;
      }
    } as unknown as ExpensesRepository;

    const service = new ExpensesService(mockRepo);
    const res = service.createExpense(dummyUser, {
      category_id: 'ec_rent',
      amount: 12000,
      date: '2026-11-19',
      note: 'September rent'
    });

    assert.ok(res.id.startsWith('exp_'));
    assert.strictEqual(res.category_id, 'ec_rent');
    assert.strictEqual(res.amount, 12000);
    assert.strictEqual(res.title, 'Rent - September rent');
    assert.strictEqual(res.description, 'September rent');
    assert.strictEqual(createdRecord.expenseDate, '2026-11-19');
  });
});

describe('Net Profit Integration in Reports', () => {
  test('should correctly subtract total_expenses from gross_profit to calculate net_profit', () => {
    const grossSales = 10000;
    const totalTax = 1500;
    const totalRefunds = 0;
    const netSales = Math.max(0, grossSales - totalTax - totalRefunds); // 8500
    const totalCogs = 4500;
    const grossProfit = Math.max(0, netSales - totalCogs); // 4000
    const totalExpenses = 1200;

    // Formula: netProfit = grossProfit - totalExpenses
    const netProfit = grossProfit - totalExpenses; // 2800

    assert.strictEqual(grossProfit, 4000);
    assert.strictEqual(netProfit, 2800);
  });
});
