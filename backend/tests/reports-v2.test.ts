import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  salesReportQuerySchema,
  pnlReportQuerySchema,
  channelsReportQuerySchema,
  settleCreditSchema,
  wastageReportQuerySchema
} from '../src/modules/reports/reports.schemas.js';
import { ReportsService } from '../src/modules/reports/reports.service.js';
import { ReportsRepository } from '../src/modules/reports/reports.repository.js';
import { AuthUser } from '../src/middleware/authenticate.js';

describe('Reports V2 Validation Schemas', () => {
  it('should validate sales report query params', () => {
    const parsed = salesReportQuerySchema.query.parse({ period: '7d', groupBy: 'day' });
    assert.equal(parsed.period, '7d');
    assert.equal(parsed.groupBy, 'day');

    const defaultParsed = salesReportQuerySchema.query.parse({});
    assert.equal(defaultParsed.period, '30d');
    assert.equal(defaultParsed.groupBy, 'day');
  });

  it('should validate pnl report query params', () => {
    const parsed = pnlReportQuerySchema.query.parse({ period: 'month' });
    assert.equal(parsed.period, 'month');
  });

  it('should validate settle credit input payload', () => {
    const parsed = settleCreditSchema.body.parse({
      customer_id: 'c_1',
      amount: 1500.0,
      payment_method: 'telebirr',
      notes: 'Partial payment'
    });
    assert.equal(parsed.customer_id, 'c_1');
    assert.equal(parsed.amount, 1500.0);
    assert.equal(parsed.payment_method, 'telebirr');

    assert.throws(() => {
      settleCreditSchema.body.parse({ customer_id: 'c_1', amount: -50 });
    });
  });

  it('should validate wastage report query params', () => {
    const parsed = wastageReportQuerySchema.query.parse({ atRiskDays: '60' });
    assert.equal(parsed.atRiskDays, 60);

    const defaultParsed = wastageReportQuerySchema.query.parse({});
    assert.equal(defaultParsed.atRiskDays, 30);
  });
});

describe('Reports V2 Business Logic & Calculation Integrity', () => {
  const dummyAdmin: AuthUser = {
    id: 'u_admin',
    username: 'admin',
    email: 'admin@hirbit.com',
    full_name: 'Administrator',
    role: 'admin'
  };

  const mockRepo = {
    buildDateClause: (period: string, startDate?: string, endDate?: string, alias = 's') => ({
      sql: `${alias}.created_at >= NOW() - INTERVAL '30 days'`,
      params: []
    }),
    buildExpenseDateClause: (period: string, startDate?: string, endDate?: string, alias = 'e') => ({
      sql: `${alias}.expense_date >= CURRENT_DATE - INTERVAL '30 days'`,
      params: []
    }),
    getSalesReportData: (dateClause: any, groupBy: string) => ({
      kpis: {
        total_revenue: 20371.65,
        total_gross_profit: 7685.19,
        avg_daily_sales: 679.06
      },
      grouped_bars: [
        { date: '2026-10-21', label: 'Oct 21', sales_count: 10, revenue: 2171.35, cost: 1403.58, gross_profit: 767.77, margin_percent: 35.4 }
      ],
      breakdown_table: [
        { date: '2026-10-21', label: 'Oct 21', sales_count: 10, revenue: 2171.35, cost: 1403.58, gross_profit: 767.77, margin_percent: 35.4 }
      ],
      insights: {
        average_sale: 222.41,
        items_per_sale: 3.5,
        money_in_stock_nothing_sold: 0.0,
        at_risk_dead_stock: 228.0,
        pareto_insight: '14 of your 40 products — 35% of the catalogue — earn 80% of your profit',
        busiest_insight: 'Busiest around 10 AM, and Wednesday is the busiest day.',
        top_earners: [
          { product_name: 'Sample Family First Aid Pack', units_sold: 12, revenue: 4200.0, gross_profit: 1500.0 }
        ],
        hourly_distribution: [
          { hour: '9 AM', hour_24: 9, sales_count: 2, revenue: 150.0 },
          { hour: '10 AM', hour_24: 10, sales_count: 15, revenue: 3600.0 }
        ]
      }
    }),
    getPnlReportData: (dateClause: any, period: string, startDate?: string, endDate?: string) => ({
      statement: {
        revenue: 20098.5,
        sales_count: 91,
        cogs: 12686.46,
        gross_profit: 7412.04,
        gross_margin_percent: 36.9,
        operating_expenses: 21000.0,
        wastage_written_off: 22.32,
        net_profit: -13610.28,
        net_margin_percent: -67.7
      },
      where_expenses_went: [
        { category: 'Sample salaries', amount: 14000.0 },
        { category: 'Sample rent', amount: 6000.0 }
      ],
      profit_by_product: [
        { product_name: 'Sample Family First Aid Pack', qty_sold: 12, revenue: 4200.0, cost: 2700.0, gross_profit: 1500.0, margin_percent: 35.7 }
      ]
    }),
    getStockValueReportData: () => ({
      cost_of_stock_on_hand: 343576.28,
      value_at_retail: 547874.0,
      markup_if_all_sells: 204297.72,
      markup_on_cost_percent: 59.5,
      total_units: 8396,
      total_products: 40,
      dead_stock_value: 505.68,
      dead_stock_units: 12
    }),
    getChannelsReportData: (dateClause: any) => ({
      taken_in_total: 20533.8,
      channels: [
        { channel: 'Telebirr', channel_key: 'telebirr', sales_count: 39, share_percent: 38.5, collected: 7910.3, note: '' },
        { channel: 'Cash', channel_key: 'cash', sales_count: 39, share_percent: 37.1, collected: 7613.45, note: 'should be in the drawer' },
        { channel: 'Sample CBE account', channel_key: 'bank', sales_count: 12, share_percent: 23.9, collected: 4908.05, note: '' },
        { channel: 'Customer credit', channel_key: 'credit', sales_count: 1, share_percent: 0.5, collected: 102.0, note: 'not collected yet' }
      ]
    }),
    getOwedToUsReportData: () => ({
      total_owed: 4799.74,
      receivables: [
        { customer_id: 'c_1', customer_name: 'Sample customer 0809', phone: '0912345678', due_date: '2026-11-12', outstanding: 312.0, is_overdue: true, days_overdue: 8 }
      ]
    }),
    settleCustomerCredit: (customerId: string, amount: number) => ({
      id: customerId,
      full_name: 'Sample customer 0809',
      phone: '0912345678',
      outstanding_balance: Math.max(0, 312.0 - amount)
    }),
    getWastageReportData: (atRiskDays: number) => ({
      at_risk_value: 372.0,
      at_risk_revenue: 372.0,
      expired_not_written_off: 505.68,
      written_off: 22.32,
      total_lost: 528.0,
      breakdown: [
        { reason: 'Expired', units: 2, cost: 22.32 }
      ]
    })
  } as unknown as ReportsRepository;

  const service = new ReportsService(mockRepo);

  it('Tab 1: Sales Report should calculate KPIs, series and insights matching UI reference', () => {
    const sales = service.getSalesReport('30d', 'day');
    assert.equal(sales.kpis.total_revenue, 20371.65);
    assert.equal(sales.kpis.total_gross_profit, 7685.19);
    assert.equal(sales.kpis.avg_daily_sales, 679.06);
    assert.equal(sales.grouped_bars.length, 1);
    assert.equal(sales.breakdown_table.length, 1);
    assert.equal(sales.insights.average_sale, 222.41);
    assert.equal(sales.insights.items_per_sale, 3.5);
    assert.equal(sales.insights.money_in_stock_nothing_sold, 0.0);
    assert.equal(sales.insights.at_risk_dead_stock, 228.0);
  });

  it('Tab 2: P&L Report mathematical reconciliation: net_profit = gross_profit - expenses - wastage', () => {
    const pnl = service.getPnlReport('30d');
    assert.equal(pnl.statement.revenue, 20098.5);
    assert.equal(pnl.statement.cogs, 12686.46);
    assert.equal(pnl.statement.gross_profit, 7412.04);
    assert.equal(pnl.statement.operating_expenses, 21000.0);
    assert.equal(pnl.statement.wastage_written_off, 22.32);

    const calculatedNet = Math.round((pnl.statement.gross_profit - pnl.statement.operating_expenses - pnl.statement.wastage_written_off) * 100) / 100;
    assert.equal(pnl.statement.net_profit, calculatedNet);
    assert.equal(pnl.statement.net_profit, -13610.28);
  });

  it('Tab 3: Stock Value Report should compute retail, cost and markup metrics', () => {
    const stock = service.getStockValueReport();
    assert.equal(stock.cost_of_stock_on_hand, 343576.28);
    assert.equal(stock.value_at_retail, 547874.0);
    assert.equal(stock.markup_if_all_sells, 204297.72);
    assert.equal(stock.markup_on_cost_percent, 59.5);
    assert.equal(stock.total_units, 8396);
    assert.equal(stock.total_products, 40);
    assert.equal(stock.dead_stock_value, 505.68);
  });

  it('Tab 4: Channels Report should correctly report Telebirr, Cash drawer, and Credit notes', () => {
    const channels = service.getChannelsReport('30d');
    assert.equal(channels.taken_in_total, 20533.8);
    assert.equal(channels.channels.length, 4);

    const cash = channels.channels.find(c => c.channel_key === 'cash');
    assert.ok(cash);
    assert.equal(cash.note, 'should be in the drawer');

    const credit = channels.channels.find(c => c.channel_key === 'credit');
    assert.ok(credit);
    assert.equal(credit.note, 'not collected yet');
  });

  it('Tab 5: Owed to Us Report should list overdue receivables and settle customer balance', () => {
    const owed = service.getOwedToUsReport();
    assert.equal(owed.total_owed, 4799.74);
    assert.equal(owed.receivables.length, 1);
    assert.equal(owed.receivables[0].is_overdue, true);

    const settled = service.settleCustomerCredit(dummyAdmin, {
      customer_id: 'c_1',
      amount: 100.0,
      payment_method: 'cash',
      notes: 'Customer paid partial debt'
    });
    assert.equal(settled.outstanding_balance, 212.0);
  });

  it('Tab 6: Wastage Report should accurately reflect total lost and reasons', () => {
    const wastage = service.getWastageReport(30);
    assert.equal(wastage.at_risk_value, 372.0);
    assert.equal(wastage.expired_not_written_off, 505.68);
    assert.equal(wastage.written_off, 22.32);
    assert.equal(wastage.total_lost, 528.0);
    assert.equal(wastage.breakdown[0].reason, 'Expired');
    assert.equal(wastage.breakdown[0].cost, 22.32);
  });
});
