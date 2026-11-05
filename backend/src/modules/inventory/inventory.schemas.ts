import { z } from 'zod';

export const adjustStockSchema = {
  body: z.object({
    variant_id: z.string().min(1, 'variant_id is required'),
    adjustment_type: z.enum(['set', 'add', 'subtract']),
    quantity: z.coerce.number().int().min(0),
    reason: z.string().min(1, 'Reason is required').max(255),
    reference_id: z.string().optional().nullable()
  })
};

export const receiveStockSchema = {
  body: z.object({
    supplier_id: z.string().optional().nullable(),
    po_id: z.string().optional().nullable(),
    invoice_number: z.string().optional().nullable(),
    items: z
      .array(
        z.object({
          variant_id: z.string().min(1),
          quantity: z.coerce.number().int().positive()
        })
      )
      .min(1, 'Items list cannot be empty')
  })
};

