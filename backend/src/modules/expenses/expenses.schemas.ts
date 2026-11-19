import { z } from 'zod';

export const createExpenseSchema = {
  body: z.object({
    category_id: z.string().min(1, 'Category is required'),
    title: z.string().max(150).optional().nullable(),
    note: z.string().max(500).optional().nullable(),
    description: z.string().max(500).optional().nullable(),
    amount: z.coerce.number().positive('Amount must be > 0'),
    payment_method: z.enum(['cash', 'card', 'bank_transfer', 'mobile']).optional().default('card'),
    expense_date: z.string().optional(),
    date: z.string().optional()
  })
};

export const createExpenseCategorySchema = {
  body: z.object({
    name: z.string().min(1, 'Category name is required').max(100),
    description: z.string().max(500).optional().nullable()
  })
};

export type CreateExpenseInput = z.input<typeof createExpenseSchema.body>;
export type CreateExpenseCategoryInput = z.input<typeof createExpenseCategorySchema.body>;
