import { db } from '../../database/connection.js';

export interface DateFilterClause {
  sql: string;
  params: string[];
}

export class ReportsRepository {
  public buildDateClause(period: string, startDate?: string, endDate?: string, tableAlias = 's'): DateFilterClause {
    if (period === 'today') {
      return { sql: `${tableAlias}.created_at >= CURRENT_DATE`, params: [] };
    }
    if (period === 'yesterday') {
      return {
        sql: `(${tableAlias}.created_at >= CURRENT_DATE - INTERVAL '1 day' AND ${tableAlias}.created_at < CURRENT_DATE)`,
        params: []
      };
    }
    if (period === '7d') {
      return { sql: `${tableAlias}.created_at >= NOW() - INTERVAL '7 days'`, params: [] };
    }
    if (period === 'month') {
      return { sql: `to_char(${tableAlias}.created_at, 'YYYY-MM') = to_char(NOW(), 'YYYY-MM')`, params: [] };
    }
    if (period === 'custom' && startDate && endDate) {
      return {
        sql: `${tableAlias}.created_at >= ? AND ${tableAlias}.created_at <= ?`,
        params: [`${startDate} 00:00:00`, `${endDate} 23:59:59`]
      };
    }
    // Default 30 days
    return { sql: `${tableAlias}.created_at >= NOW() - INTERVAL '30 days'`, params: [] };
  }

  public getGeneralStats() {
    const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products WHERE status != 'archived'").get() as { count: any };
    const totalVariants = db.prepare("SELECT COUNT(*) as count FROM product_variants").get() as { count: any };
    const totalStock = db.prepare("SELECT COALESCE(SUM(quantity), 0) as total FROM inventory").get() as { total: any };
    const lowStock = db.prepare("SELECT COUNT(*) as count FROM inventory WHERE quantity <= min_threshold").get() as { count: any };

    const valuation = db.prepare(`
      SELECT
        COALESCE(SUM(i.quantity * COALESCE(pv.selling_price, p.selling_price, 0)), 0) as retail_value,
        COALESCE(SUM(i.quantity * COALESCE(pv.purchase_price, p.purchase_price, 0)), 0) as cost_value
      FROM inventory i
      JOIN product_variants pv ON i.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
    `).get() as { retail_value: any; cost_value: any };

    return {
      totalProducts: Number(totalProducts?.count || 0),
      totalVariants: Number(totalVariants?.count || 0),
      totalStock: Number(totalStock?.total || 0),
      lowStockCount: Number(lowStock?.count || 0),
      inventoryRetailValue: Math.round(Number(valuation?.retail_value || 0) * 100) / 100,
      inventoryCostValue: Math.round(Number(valuation?.cost_value || 0) * 100) / 100
    };
  }

  public getSalesSummary(dateClause: DateFilterClause, cashierId?: string) {
    let sql = `
      SELECT
        COUNT(*) as total_transactions,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COALESCE(SUM(s.subtotal), 0) as gross_sales,
        COALESCE(SUM(s.discount_amount), 0) as total_discounts,
        COALESCE(SUM(s.tax_amount), 0) as total_tax,
        COALESCE(SUM(s.refunded_amount), 0) as total_refunds
      FROM sales s
      WHERE ${dateClause.sql}
    `;
    const params = [...dateClause.params];

    if (cashierId) {
      sql += ` AND s.cashier_id = ?`;
      params.push(cashierId);
    }

    const row = db.prepare(sql).get(...params) as any;
    return {
      total_transactions: Number(row?.total_transactions || 0),
      total_revenue: Math.round(Number(row?.total_revenue || 0) * 100) / 100,
      gross_sales: Math.round(Number(row?.gross_sales || 0) * 100) / 100,
      total_discounts: Math.round(Number(row?.total_discounts || 0) * 100) / 100,
      total_tax: Math.round(Number(row?.tax_amount ?? row?.total_tax ?? 0) * 100) / 100,
      total_refunds: Math.round(Number(row?.refunded_amount ?? row?.total_refunds ?? 0) * 100) / 100
    };
  }

  public getActiveShift(userId: string) {
    return db.prepare(`
      SELECT * FROM shifts WHERE user_id = ? AND status = 'active' ORDER BY start_time DESC LIMIT 1
    `).get(userId);
  }

  public getCashierRecentSales(cashierId: string) {
    const rows = db.prepare(`
      SELECT s.id, s.receipt_number, s.total_amount, s.payment_method, s.payment_status, s.created_at,
             (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
      FROM sales s
      WHERE s.cashier_id = ?
      ORDER BY s.created_at DESC LIMIT 15
    `).all(cashierId) as any[];

    return rows.map(r => ({
      ...r,
      total_amount: Math.round(Number(r.total_amount || 0) * 100) / 100,
      item_count: Number(r.item_count || 0)
    }));
  }

  public getCogsSummary(dateClause: DateFilterClause) {
    const sql = `
      SELECT COALESCE(SUM(si.cost_price * si.quantity), 0) as total_cogs
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE ${dateClause.sql} AND s.payment_status != 'refunded'
    `;
    const row = db.prepare(sql).get(...dateClause.params) as any;
    return { total_cogs: Math.round(Number(row?.total_cogs || 0) * 100) / 100 };
  }

  public getExpensesSummary(period: string, startDate?: string, endDate?: string) {
    let expClause = '';
    const params: string[] = [];

    if (period === 'today') {
      expClause = `expense_date::date = CURRENT_DATE`;
    } else if (period === 'yesterday') {
      expClause = `expense_date::date = CURRENT_DATE - INTERVAL '1 day'`;
    } else if (period === '7d') {
      expClause = `expense_date >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (period === 'month') {
      expClause = `to_char(expense_date::timestamp, 'YYYY-MM') = to_char(NOW(), 'YYYY-MM')`;
    } else if (period === 'custom' && startDate && endDate) {
      expClause = `expense_date >= ? AND expense_date <= ?`;
      params.push(startDate, endDate);
    } else {
      expClause = `expense_date >= CURRENT_DATE - INTERVAL '30 days'`;
    }

    const expSql = `SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses WHERE ${expClause}`;
    const row = db.prepare(expSql).get(...params) as any;
    return { total_expenses: Math.round(Number(row?.total_expenses || 0) * 100) / 100 };
  }

  public getCategoryBreakdown(dateClause: DateFilterClause) {
    const sql = `
      SELECT
        COALESCE(c.name, 'Uncategorized') as category_name,
        COUNT(si.id) as items_sold,
        COALESCE(SUM(si.total), 0) as revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN product_variants pv ON si.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${dateClause.sql} AND s.payment_status != 'refunded'
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `;
    const rows = db.prepare(sql).all(...dateClause.params) as any[];
    return rows.map(r => ({
      category_name: r.category_name,
      items_sold: Number(r.items_sold || 0),
      revenue: Math.round(Number(r.revenue || 0) * 100) / 100
    }));
  }

  public getTopSellingGarments(dateClause: DateFilterClause) {
    const sql = `
      SELECT
        p.id,
        p.name,
        p.image_url,
        COALESCE(c.name, 'Uncategorized') as category,
        SUM(si.quantity) as units_sold,
        SUM(si.total) as total_revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN product_variants pv ON si.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${dateClause.sql} AND s.payment_status != 'refunded'
      GROUP BY p.id, p.name, p.image_url, c.name
      ORDER BY units_sold DESC
      LIMIT 6
    `;
    const rows = db.prepare(sql).all(...dateClause.params) as any[];
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      image_url: r.image_url,
      category: r.category,
      units_sold: Number(r.units_sold || 0),
      total_revenue: Math.round(Number(r.total_revenue || 0) * 100) / 100
    }));
  }

  public getPaymentBreakdown(dateClause: DateFilterClause) {
    const sql = `
      SELECT payment_method, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
      FROM sales s
      WHERE ${dateClause.sql} AND payment_status != 'refunded'
      GROUP BY payment_method
    `;
    const rows = db.prepare(sql).all(...dateClause.params) as any[];
    return rows.map(r => ({
      payment_method: r.payment_method,
      count: Number(r.count || 0),
      total: Math.round(Number(r.total || 0) * 100) / 100
    }));
  }

  public getStaffSalesBreakdown(dateClause: DateFilterClause) {
    const sql = `
      SELECT
        u.id,
        u.full_name,
        u.role,
        COUNT(s.id) as total_transactions,
        COALESCE(SUM(s.total_amount), 0) as total_revenue
      FROM profiles u
      LEFT JOIN sales s ON u.id = s.cashier_id AND ${dateClause.sql} AND s.payment_status != 'refunded'
      WHERE u.is_active = 1
      GROUP BY u.id, u.full_name, u.role
      ORDER BY total_revenue DESC
    `;
    const rows = db.prepare(sql).all(...dateClause.params) as any[];
    return rows.map(r => ({
      id: r.id,
      full_name: r.full_name,
      role: r.role,
      total_transactions: Number(r.total_transactions || 0),
      total_revenue: Math.round(Number(r.total_revenue || 0) * 100) / 100
    }));
  }

  public getSalesOverTime(dateClause: DateFilterClause) {
    const sql = `
      SELECT
        to_char(s.created_at, 'YYYY-MM-DD') as date,
        COALESCE(SUM(s.total_amount), 0) as revenue,
        COUNT(*) as count
      FROM sales s
      WHERE ${dateClause.sql} AND s.payment_status != 'refunded'
      GROUP BY to_char(s.created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
    `;
    const rows = db.prepare(sql).all(...dateClause.params) as any[];
    return rows.map(r => ({
      date: r.date,
      revenue: Math.round(Number(r.revenue || 0) * 100) / 100,
      count: Number(r.count || 0)
    }));
  }

  public getRecentSales(limit = 8) {
    const rows = db.prepare(`
      SELECT s.id, s.receipt_number, s.total_amount, s.payment_method, s.payment_status, s.created_at,
             u.full_name as cashier_name, c.full_name as customer_name
      FROM sales s
      LEFT JOIN profiles u ON s.cashier_id = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.created_at DESC LIMIT ?
    `).all(limit) as any[];

    return rows.map(r => ({
      ...r,
      total_amount: Math.round(Number(r.total_amount || 0) * 100) / 100
    }));
  }

  /**
   * Total Item Price: sum of (unit_price × quantity) across all sale_items in the period,
   * i.e. the gross merchandise value before discounts, tax, or refunds.
   */
  public getTotalItemsPrice(dateClause: DateFilterClause) {
    const sql = `
      SELECT COALESCE(SUM(si.unit_price * si.quantity), 0) as total_items_price,
             COALESCE(SUM(si.quantity), 0) as total_items_sold
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE ${dateClause.sql} AND s.payment_status != 'refunded'
    `;
    const row = db.prepare(sql).get(...dateClause.params) as any;
    return {
      total_items_price: Math.round(Number(row?.total_items_price || 0) * 100) / 100,
      total_items_sold: Number(row?.total_items_sold || 0)
    };
  }

  /**
   * Slow-Moving Stock: products whose variants have stock above zero
   * but zero sales in the last 60 days. Limited to top 8 by stock quantity.
   */
  public getSlowMovingStock() {
    const sql = `
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.image_url,
        COALESCE(c.name, 'Uncategorized') as category,
        SUM(inv.quantity) as stock_quantity,
        COALESCE(p.selling_price, 0) as selling_price
      FROM products p
      JOIN product_variants pv ON pv.product_id = p.id
      JOIN inventory inv ON inv.variant_id = pv.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
        AND inv.quantity > 0
        AND p.id NOT IN (
          SELECT DISTINCT pv2.product_id
          FROM sale_items si
          JOIN sales s ON si.sale_id = s.id
          JOIN product_variants pv2 ON si.variant_id = pv2.id
          WHERE s.created_at >= NOW() - INTERVAL '60 days'
            AND s.payment_status != 'refunded'
        )
      GROUP BY p.id, p.name, p.image_url, c.name, p.selling_price
      ORDER BY stock_quantity DESC
      LIMIT 8
    `;
    const rows = db.prepare(sql).all() as any[];
    return rows.map(r => ({
      product_id: r.product_id,
      product_name: r.product_name,
      image_url: r.image_url,
      category: r.category,
      stock_quantity: Number(r.stock_quantity || 0),
      selling_price: Math.round(Number(r.selling_price || 0) * 100) / 100
    }));
  }
}

export const reportsRepository = new ReportsRepository();
