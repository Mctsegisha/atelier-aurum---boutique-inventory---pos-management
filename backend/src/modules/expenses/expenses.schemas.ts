import { z } from 'zod';

export const createExpenseSchema = {
  body: z.object({
    category_id: z.string().min(1, 'Category is required'),
    title: z.string().min(1, 'Title is required').max(150),
    description: z.string().max(500).optional().nullable(),
    amount: z.coerce.number().positive('Amount must be > 0'),
    payment_method: z.enum(['cash', 'card', 'bank_transfer']).default('card'),
    expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expense_date must be YYYY-MM-DD').optional()
  })
};

