import { z } from 'zod';

export const createCustomerSchema = {
  body: z.object({
    full_name: z.string().min(1, 'Customer full name is required').max(100),
    phone: z.string().max(30).optional().nullable(),
    email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
    address: z.string().max(255).optional().nullable(),
    birthday: z.string().optional().nullable(),
    notes: z.string().max(500).optional().nullable()
  })
};

export const updateCustomerSchema = {
  body: z.object({
    full_name: z.string().min(1).max(100).optional(),
    phone: z.string().max(30).optional().nullable(),
    email: z.string().email().optional().nullable().or(z.literal('')),
    address: z.string().max(255).optional().nullable(),
    birthday: z.string().optional().nullable(),
    notes: z.string().max(500).optional().nullable()
  })
};

