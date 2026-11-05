import { z } from 'zod';

export const startShiftSchema = {
  body: z.object({
    starting_cash: z.coerce.number().min(0).default(200.0),
    notes: z.string().max(500).optional().nullable()
  })
};

export const closeShiftSchema = {
  body: z.object({
    ending_cash: z.coerce.number().min(0, 'Ending cash must be >= 0'),
    notes: z.string().max(500).optional().nullable()
  })
};

