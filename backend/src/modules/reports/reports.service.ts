import { ReportsRepository, reportsRepository } from './reports.repository.js';
import { AuthUser } from '../../middleware/authenticate.js';

export class ReportsService {
  constructor(private readonly repo: ReportsRepository = reportsRepository) {}

  public getDashboardData(user: AuthUser, period: string, startDate?: string, endDate?: string) {
    const role = user.role;
    const dateClause = this.repo.buildDateClause(period, startDate, endDate, 's');

    // 1. General Boutique Inventory Stats & Valuations
    const generalStats = this.repo.getGeneralStats();

    // 2. Sales Summary in period
    const cashierFilterId = role === 'sales' ? user.id : undefined;
    const salesSummary = this.repo.getSalesSummary(dateClause, cashierFilterId);

    const netSales = Math.max(0, salesSummary.total_revenue - salesSummary.total_refunds);
    const averageBasket =
      salesSummary.total_transactions > 0
        ? Math.round((netSales / salesSummary.total_transactions) * 100) / 100
        : 0;

    // 3. Financial Cost & Profit (Admin / Store Person only)
    const { total_cogs: totalCogs } = this.repo.getCogsSummary(dateClause);
    const { total_expenses: totalExpenses } =
      role === 'sales'
        ? { total_expenses: 0 }
        : this.repo.getExpensesSummary(period, startDate, endDate);

    const grossProfit = Math.max(0, netSales - totalCogs);
    const netProfit = grossProfit - totalExpenses;
    const grossMarginPercent = netSales > 0 ? Math.round((grossProfit / netSales) * 100 * 10) / 10 : 0;

    // 4. Breakdown Datasets
    const categoryBreakdown = this.repo.getCategoryBreakdown(dateClause);
    const topGarments = this.repo.getTopSellingGarments(dateClause);
    const paymentBreakdown = this.repo.getPaymentBreakdown(dateClause);
    const staffSales = this.repo.getStaffSalesBreakdown(dateClause);
    const salesOverTime = this.repo.getSalesOverTime(dateClause);
    const recentSales = this.repo.getRecentSales(8);

    // 5. Total Items Price & Slow-Moving Stock
    const totalItemsData = this.repo.getTotalItemsPrice(dateClause);
    const slowMovingStock = this.repo.getSlowMovingStock();

    // Standardized KPI metrics matching DashboardView & ReportsView expectations
    const stats = {
      total_revenue: salesSummary.total_revenue,
      gross_sales: salesSummary.gross_sales,
      total_discounts: salesSummary.total_discounts,
      total_tax: salesSummary.total_tax,
      total_refunds: salesSummary.total_refunds,
      net_sales: netSales,
      total_items_price: totalItemsData.total_items_price,
      total_items_sold: totalItemsData.total_items_sold,
      cogs: totalCogs,
      gross_profit: grossProfit,
      gross_margin_percent: grossMarginPercent,
      total_expenses: totalExpenses,
      net_profit: netProfit,
      total_transactions: salesSummary.total_transactions,
      average_basket: averageBasket,
      total_stock: generalStats.totalStock,
      total_variants: generalStats.totalVariants,
      total_products: generalStats.totalProducts,
      low_stock_count: generalStats.lowStockCount,
      inventory_retail_value: generalStats.inventoryRetailValue,
      inventory_cost_value: generalStats.inventoryCostValue
    };

    // Formatted chart structures required by Recharts components
    const charts = {
      sales_over_time: salesOverTime,
      sales_by_category: categoryBreakdown.map((c) => ({
        category: c.category_name,
        value: c.revenue,
        count: c.items_sold
      })),
      top_products: topGarments.map((g) => ({
        product_name: g.name,
        total_qty: g.units_sold,
        total_revenue: g.total_revenue,
        image_url: g.image_url
      })),
      payment_methods: paymentBreakdown.map((p) => ({
        payment_method: p.payment_method,
        amount: p.total,
        count: p.count
      })),
      cashier_performance: staffSales.map((s) => ({
        cashier_name: s.full_name,
        role: s.role,
        transactions_count: s.total_transactions,
        total_generated: s.total_revenue
      })),
      slow_moving_stock: slowMovingStock
    };

    // Sales role specific context
    const activeShift = role === 'sales' ? this.repo.getActiveShift(user.id) : null;
    const myRecentSales = role === 'sales' ? this.repo.getCashierRecentSales(user.id) : [];

    return {
      role,
      period,
      stats,
      charts,
      financials: {
        totalRevenue: salesSummary.total_revenue,
        grossSales: salesSummary.gross_sales,
        totalDiscounts: salesSummary.total_discounts,
        totalTax: salesSummary.total_tax,
        totalRefunds: salesSummary.total_refunds,
        netSales,
        totalCogs,
        grossProfit,
        grossMarginPercent,
        totalExpenses,
        netProfit,
        totalTransactions: salesSummary.total_transactions,
        averageBasket
      },
      categoryBreakdown,
      topGarments,
      paymentBreakdown,
      staffSales,
      recentSales,
      activeShift: activeShift || null,
      myRecentSales
    };
  }
}

export const reportsService = new ReportsService();
