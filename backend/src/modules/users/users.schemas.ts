import { z } from 'zod';

export const createUserSchema = {
  body: z.object({
    username: z.string().min(3, 'Username must be at least 3 chars').max(50),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    full_name: z.string().min(1, 'Full name is required').max(100),
    role: z.enum(['admin', 'store_person', 'sales']),
    phone: z.string().max(30).optional().nullable(),
    avatar_url: z.string().optional().nullable()
  })
};

export const updateUserSchema = {
  body: z.object({
    username: z.string().min(3).max(50).optional(),
    email: z.string().email().optional(),
    full_name: z.string().min(1).max(100).optional(),
    role: z.enum(['admin', 'store_person', 'sales']).optional(),
    phone: z.string().max(30).optional().nullable(),
    avatar_url: z.string().optional().nullable(),
    is_active: z.coerce.number().int().min(0).max(1).optional(),
    new_password: z.string().min(6).optional()
  })
};

