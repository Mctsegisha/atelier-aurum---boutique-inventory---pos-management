import { z } from 'zod';

export const processRefundSchema = {
  body: z.object({
    refund_amount: z.coerce.number().positive('Refund amount must be > 0'),
    reason: z.string().min(1, 'Reason is required').max(255),
    items: z
      .array(
        z.object({
          sale_item_id: z.string().min(1),
          variant_id: z.string().min(1),
          quantity: z.coerce.number().int().positive(),
          restock_item: z.coerce.number().int().min(0).max(1).default(1),
          refund_amount: z.coerce.number().min(0)
        })
      )
      .optional()
      .default([])
  })
};

