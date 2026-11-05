import { z } from 'zod';

export const dashboardQuerySchema = {
  query: z.object({
    period: z.enum(['today', 'yesterday', '7d', '30d', 'month', 'custom']).default('30d'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD').optional()
  })
};

