import { z } from 'zod';

export const updateSettingsSchema = {
  body: z.object({
    business_name: z.string().min(1).max(100).optional(),
    tagline: z.string().max(200).optional().nullable(),
    phone: z.string().max(30).optional().nullable(),
    email: z.string().email().optional().nullable().or(z.literal('')),
    address: z.string().max(255).optional().nullable(),
    currency_code: z.string().max(10).optional(),
    currency_symbol: z.string().max(5).optional(),
    tax_rate: z.coerce.number().min(0).max(1).optional(),
    low_stock_threshold: z.coerce.number().int().min(0).optional(),
    receipt_header: z.string().max(500).optional().nullable(),
    receipt_footer: z.string().max(500).optional().nullable(),
    allow_negative_inventory: z.coerce.boolean().optional(),
    return_policy_days: z.coerce.number().int().min(0).optional()
  })
};

