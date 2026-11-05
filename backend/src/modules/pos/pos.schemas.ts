import { z } from 'zod';

export const checkoutSchema = {
  body: z.object({
    cart_items: z
      .array(
        z.object({
          variant_id: z.string().min(1, 'variant_id is required'),
          quantity: z.number().int().positive('Quantity must be an integer > 0')
        })
      )
      .min(1, 'Cart cannot be empty'),
    customer_id: z.string().optional().nullable(),
    payment_method: z.enum(['cash', 'card', 'transfer', 'mobile']).default('card'),
    discount_amount: z.number().min(0).default(0),
    discount_type: z.enum(['fixed', 'percentage']).default('fixed'),
    notes: z.string().max(500).optional().nullable(),
    idempotency_key: z.string().min(8).max(128).optional().nullable()
  })
};

export type CheckoutInput = z.infer<typeof checkoutSchema.body>;

