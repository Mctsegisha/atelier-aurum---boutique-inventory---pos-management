import { z } from 'zod';

export const adjustStockSchema = {
  body: z.object({
    variant_id: z.string().min(1, 'variant_id is required'),
    adjustment_type: z.enum(['set', 'add', 'subtract']).optional(),
    type: z.string().optional(),
    quantity: z.coerce.number().int().min(0).optional(),
    new_quantity: z.coerce.number().int().min(0).optional(),
    reason: z.string().min(1, 'Reason is required').max(255),
    reference_id: z.string().optional().nullable()
  }).refine(data => data.quantity !== undefined || data.new_quantity !== undefined, {
    message: 'Either quantity or new_quantity must be provided'
  })
};

export const updateVariantSchema = {
  params: z.object({
    variantId: z.string().min(1, 'variantId is required')
  }),
  body: z.object({
    sku: z.string().optional(),
    barcode: z.string().optional().nullable(),
    size: z.string().optional(),
    color: z.string().optional(),
    selling_price: z.coerce.number().min(0).optional(),
    purchase_price: z.coerce.number().min(0).optional(),
    min_threshold: z.coerce.number().int().min(0).optional()
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

