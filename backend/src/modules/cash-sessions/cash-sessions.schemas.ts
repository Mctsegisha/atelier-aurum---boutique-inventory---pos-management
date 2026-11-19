import { z } from 'zod';

export const openCashSessionSchema = {
  body: z.object({
    opening_float: z.coerce.number().min(0, 'Opening float cannot be negative').default(1000.0),
    notes: z.string().max(500).optional().nullable()
  })
};

export const closeCashSessionSchema = {
  body: z.object({
    closing_cash: z.coerce.number().min(0, 'Closing cash cannot be negative').optional(),
    counted_cash: z.coerce.number().min(0, 'Counted cash cannot be negative').optional(),
    notes: z.string().max(500).optional().nullable()
  }).refine((data) => data.closing_cash !== undefined || data.counted_cash !== undefined, {
    message: 'Either closing_cash or counted_cash must be provided'
  })
};

export type OpenCashSessionInput = z.infer<typeof openCashSessionSchema.body>;
export type CloseCashSessionInput = z.infer<typeof closeCashSessionSchema.body>;
