import { z } from 'zod';

export const dashboardQuerySchema = {
  query: z.object({
    period: z.enum(['day', 'week', 'month', 'today', 'yesterday', '7d', '30d', 'custom']).default('day'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD').optional()
  })
};

