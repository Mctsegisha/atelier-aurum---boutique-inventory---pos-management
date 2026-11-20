import { z } from 'zod';

const optionalDate = z.preprocess(
  (val) => (val === 'undefined' || val === 'null' || val === '' || val === null ? undefined : val),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional()
);

export const dashboardQuerySchema = {
  query: z.object({
    period: z.enum(['day', 'week', 'month', 'today', 'yesterday', '7d', '30d', 'custom']).default('day'),
    startDate: optionalDate,
    endDate: optionalDate
  })
};

export const salesReportQuerySchema = {
  query: z.object({
    period: z.enum(['day', 'week', 'month', 'today', 'yesterday', '7d', '30d', 'custom']).default('30d'),
    groupBy: z.enum(['day', 'week', 'month']).default('day'),
    startDate: optionalDate,
    endDate: optionalDate
  })
};

export const pnlReportQuerySchema = {
  query: z.object({
    period: z.enum(['day', 'week', 'month', 'today', 'yesterday', '7d', '30d', 'custom']).default('30d'),
    startDate: optionalDate,
    endDate: optionalDate
  })
};

export const channelsReportQuerySchema = {
  query: z.object({
    period: z.enum(['day', 'week', 'month', 'today', 'yesterday', '7d', '30d', 'custom']).default('30d'),
    startDate: optionalDate,
    endDate: optionalDate
  })
};

export const settleCreditSchema = {
  body: z.object({
    customer_id: z.string().min(1, 'customer_id is required'),
    amount: z.coerce.number().positive('Payment amount must be greater than zero'),
    payment_method: z.string().default('cash'),
    notes: z.string().max(500).optional()
  })
};

export const wastageReportQuerySchema = {
  query: z.object({
    atRiskDays: z.coerce.number().int().min(1).max(365).default(30)
  })
};

export type DashboardQuery = z.infer<typeof dashboardQuerySchema.query>;
export type SalesReportQuery = z.infer<typeof salesReportQuerySchema.query>;
export type PnlReportQuery = z.infer<typeof pnlReportQuerySchema.query>;
export type ChannelsReportQuery = z.infer<typeof channelsReportQuerySchema.query>;
export type SettleCreditInput = z.infer<typeof settleCreditSchema.body>;
export type WastageReportQuery = z.infer<typeof wastageReportQuerySchema.query>;
