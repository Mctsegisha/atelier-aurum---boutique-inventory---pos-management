import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api.ts';
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  ShoppingBag,
  CreditCard,
  ArrowUpRight,
  Sparkles,
  Users,
  ChevronRight,
  Clock
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { user, role } = useAuth();
  const [period, setPeriod] = useState<string>('30d');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [period, role]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getDashboardReports(period);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const PIE_COLORS = ['#B89B65', '#2C2B29', '#8C8275', '#D4AF37', '#6A5ACD'];

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[#716D66] text-xs">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-[#B89B65] border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Compiling boutique analytics...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header with Luxury Serif Display & Period Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E5E0D8]">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#B89B65] font-medium">
            {role === 'admin' ? 'Hirbit Store Executive Analytics' : role === 'store_person' ? 'Store Operations Overview' : 'Shift Sales Console'}
          </span>
          <h1 className="text-3xl lg:text-4xl font-serif font-medium text-[#1A1A1A] mt-1">
            {role === 'admin' ? 'Financial & Inventory Health' : role === 'store_person' ? 'Hawassa Retail Operations' : 'My Daily Sales Summary'}
          </h1>
          <div className="flex items-center gap-2 text-xs text-[#716D66] mt-2">
            <span>Live Data Sync</span>
            <span aria-hidden="true">·</span>
            <span>Neon PostgreSQL Engine</span>
            <span aria-hidden="true">·</span>
            <span>All metrics calculated from normalized transactions</span>
          </div>
        </div>

        {/* Period Selector Tabs (Zero-Pill interactive control) */}
        {role !== 'sales' && (
          <div className="flex items-center gap-1 p-1 bg-[#EFECE6] rounded-lg border border-[#E5E0D8] self-start md:self-end">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'month', label: 'This Month' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  period === p.id
                    ? 'bg-white text-[#1A1A1A] shadow-xs'
                    : 'text-[#59554F] hover:text-[#1A1A1A]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
        {/* Total Revenue */}
        <div className="p-5 bg-white rounded-xl border border-[#E5E0D8] shadow-xs">
          <div className="flex items-center justify-between text-[#716D66]">
            <span className="text-xs uppercase tracking-wider font-medium">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-[#B89B65]" />
          </div>
          <div className="text-2xl lg:text-3xl font-serif font-semibold text-[#1A1A1A] mt-2 tabular-nums">
            {formatCurrency(stats.total_revenue)}
          </div>
          <div className="text-[11px] text-[#716D66] mt-1 flex items-center gap-1">
            <span>{stats.total_transactions || 0} completed transactions</span>
          </div>
        </div>

        {/* Net Sales */}
        <div className="p-5 bg-white rounded-xl border border-[#E5E0D8] shadow-xs">
          <div className="flex items-center justify-between text-[#716D66]">
            <span className="text-xs uppercase tracking-wider font-medium">Net Sales</span>
            <TrendingUp className="w-4 h-4 text-[#B89B65]" />
          </div>
          <div className="text-2xl lg:text-3xl font-serif font-semibold text-[#1A1A1A] mt-2 tabular-nums">
            {formatCurrency(stats.net_sales)}
          </div>
          <div className="text-[11px] text-[#716D66] mt-1">
            After {formatCurrency(stats.total_refunds)} refunds
          </div>
        </div>

        {/* Gross Profit (Admin Only) or Inventory Stock (Manager/Cashier) */}
        {role === 'admin' ? (
          <div className="p-5 bg-white rounded-xl border border-[#E5E0D8] shadow-xs">
            <div className="flex items-center justify-between text-[#716D66]">
              <span className="text-xs uppercase tracking-wider font-medium">Gross Profit</span>
              <Sparkles className="w-4 h-4 text-[#B89B65]" />
            </div>
            <div className="text-2xl lg:text-3xl font-serif font-semibold text-[#1A1A1A] mt-2 tabular-nums">
              {formatCurrency(stats.gross_profit)}
            </div>
            <div className="text-[11px] text-[#716D66] mt-1">
              COGS: {formatCurrency(stats.cogs)}
            </div>
          </div>
        ) : (
          <div className="p-5 bg-white rounded-xl border border-[#E5E0D8] shadow-xs">
            <div className="flex items-center justify-between text-[#716D66]">
              <span className="text-xs uppercase tracking-wider font-medium">Total Stock</span>
              <Package className="w-4 h-4 text-[#B89B65]" />
            </div>
            <div className="text-2xl lg:text-3xl font-serif font-semibold text-[#1A1A1A] mt-2 tabular-nums">
              {stats.total_stock || 0}
            </div>
            <div className="text-[11px] text-[#716D66] mt-1">
              Across {stats.total_variants || 0} active variants
            </div>
          </div>
        )}

        {/* Net Profit (Admin Only) or Low Stock Alert */}
        {role === 'admin' ? (
          <div className="p-5 bg-white rounded-xl border border-[#E5E0D8] shadow-xs">
            <div className="flex items-center justify-between text-[#716D66]">
              <span className="text-xs uppercase tracking-wider font-medium">Net Profit</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl lg:text-3xl font-serif font-semibold text-emerald-800 mt-2 tabular-nums">
              {formatCurrency(stats.net_profit)}
            </div>
            <div className="text-[11px] text-[#716D66] mt-1">
              Less {formatCurrency(stats.total_expenses)} expenses
            </div>
          </div>
        ) : (
          <div
            onClick={() => onNavigate('inventory')}
            className="p-5 bg-white rounded-xl border border-[#E5E0D8] shadow-xs cursor-pointer hover:border-[#B89B65] transition-colors"
          >
            <div className="flex items-center justify-between text-[#716D66]">
              <span className="text-xs uppercase tracking-wider font-medium">Low Stock Alerts</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl lg:text-3xl font-serif font-semibold text-amber-700 mt-2 tabular-nums">
              {stats.low_stock_count || 0}
            </div>
            <div className="text-[11px] text-[#B89B65] mt-1 flex items-center gap-1 font-medium">
              <span>Inspect inventory</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        )}
      </div>

      {/* SECONDARY STRIP: Inventory Valuation & Low Stock Quick Stats */}
      {role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#EFECE6]/50 rounded-lg border border-[#E5E0D8] flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#716D66] font-medium">Retail Valuation</span>
              <p className="text-xl font-serif font-semibold text-[#1A1A1A] tabular-nums mt-0.5">
                {formatCurrency(stats.inventory_retail_value)}
              </p>
            </div>
            <div className="text-right text-xs text-[#716D66]">
              <span>{stats.total_stock} Total units</span>
            </div>
          </div>

          <div className="p-4 bg-[#EFECE6]/50 rounded-lg border border-[#E5E0D8] flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#716D66] font-medium">Inventory Cost Valuation</span>
              <p className="text-xl font-serif font-semibold text-[#1A1A1A] tabular-nums mt-0.5">
                {formatCurrency(stats.inventory_cost_value)}
              </p>
            </div>
            <div className="text-right text-xs text-[#716D66]">
              <span>Capital tied in stock</span>
            </div>
          </div>

          <div
            onClick={() => onNavigate('inventory')}
            className="p-4 bg-[#EFECE6]/50 rounded-lg border border-[#E5E0D8] flex items-center justify-between cursor-pointer hover:bg-[#EFECE6] transition-colors"
          >
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#716D66] font-medium">Restock Required</span>
              <p className="text-xl font-serif font-semibold text-amber-700 tabular-nums mt-0.5">
                {stats.low_stock_count} Items Below Min
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#B89B65]" />
          </div>
        </div>
      )}

      {/* CHARTS ROW (Area Chart Sales Trends + Bar Chart Category Sales) */}
      {role !== 'sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Over Time (Area Chart) */}
          <div className="lg:col-span-2 p-6 bg-white rounded-xl border border-[#E5E0D8] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-semibold text-[#1A1A1A]">Daily Revenue Momentum</h3>
                <p className="text-xs text-[#716D66]">Aggregated revenue from Hirbit Store POS and sales transactions</p>
              </div>
            </div>
            <div className="h-64 w-full">
              {charts.sales_over_time && charts.sales_over_time.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.sales_over_time} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="aurumGold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#B89B65" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#B89B65" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EDE8" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#8C8275', fontSize: 11 }}
                      tickFormatter={(d) => d.slice(5)}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#8C8275', fontSize: 11 }}
                      tickFormatter={(v) => `${v} ETB`}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(val), 'Revenue']}
                      contentStyle={{
                        backgroundColor: '#1A1A1A',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#F9F8F6',
                        fontSize: '12px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#B89B65"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#aurumGold)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#716D66]">
                  No sales recorded in selected timeframe
                </div>
              )}
            </div>
          </div>

          {/* Sales by Category (Bar Chart) */}
          <div className="p-6 bg-white rounded-xl border border-[#E5E0D8] shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-serif font-semibold text-[#1A1A1A]">Sales by Category</h3>
              <p className="text-xs text-[#716D66]">Volume and revenue breakdown</p>
            </div>
            <div className="h-64 w-full">
              {charts.sales_by_category && charts.sales_by_category.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.sales_by_category} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0EDE8" />
                    <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: '#8C8275', fontSize: 10 }} tickFormatter={(v) => `${v} ETB`} />
                    <YAxis type="category" dataKey="category" tickLine={false} axisLine={false} tick={{ fill: '#1A1A1A', fontSize: 11 }} width={90} />
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(val), 'Gross Sales']}
                      contentStyle={{ backgroundColor: '#1A1A1A', borderRadius: '8px', border: 'none', color: '#F9F8F6', fontSize: '12px' }}
                    />
                    <Bar dataKey="value" fill="#2C2B29" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#716D66]">
                  No category data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LOWER GRID: Top Selling Products + Payment Methods + Cashier Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <div className="p-6 bg-white rounded-xl border border-[#E5E0D8] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-serif font-semibold text-[#1A1A1A]">Curated Best Sellers</h3>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs text-[#B89B65] hover:underline cursor-pointer"
            >
              Catalog
            </button>
          </div>
          <div className="divide-y divide-[#F0EDE8]">
            {charts.top_products && charts.top_products.length > 0 ? (
              charts.top_products.map((item: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-md bg-[#F0EDE8] overflow-hidden shrink-0 border border-[#E5E0D8]">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#B89B65]">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="truncate">
                      <p className="font-medium text-[#1A1A1A] truncate">{item.product_name}</p>
                      <p className="text-[11px] text-[#716D66]">{item.total_qty} units sold</p>
                    </div>
                  </div>
                  <span className="font-medium text-[#1A1A1A] tabular-nums shrink-0 ml-2">
                    {formatCurrency(item.total_revenue)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#716D66] py-6 text-center">No transactions recorded yet.</p>
            )}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="p-6 bg-white rounded-xl border border-[#E5E0D8] shadow-xs space-y-4">
          <h3 className="text-base font-serif font-semibold text-[#1A1A1A]">Settlement Channels</h3>
          <div className="space-y-3">
            {charts.payment_methods && charts.payment_methods.length > 0 ? (
              charts.payment_methods.map((pm: any, idx: number) => {
                const total = stats.total_revenue || 1;
                const pct = Math.round((pm.amount / total) * 100);
                return (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between font-medium text-[#1A1A1A]">
                      <span className="capitalize">{pm.payment_method} Payment</span>
                      <span className="tabular-nums">{formatCurrency(pm.amount)} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#F0EDE8] rounded-full overflow-hidden">
                      <div className="h-full bg-[#B89B65]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-[#716D66] py-6 text-center">No payment data recorded</p>
            )}
          </div>
        </div>

        {/* Cashier Team Performance */}
        <div className="p-6 bg-white rounded-xl border border-[#E5E0D8] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-serif font-semibold text-[#1A1A1A]">Sales Team Volume</h3>
            {role === 'admin' && (
              <button
                onClick={() => onNavigate('employees')}
                className="text-xs text-[#B89B65] hover:underline cursor-pointer"
              >
                Manage Staff
              </button>
            )}
          </div>
          <div className="divide-y divide-[#F0EDE8]">
            {charts.cashier_performance && charts.cashier_performance.length > 0 ? (
              charts.cashier_performance.map((c: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-medium text-[#1A1A1A]">{c.cashier_name}</p>
                    <span className="text-[11px] text-[#716D66] capitalize">{c.role} · {c.transactions_count || 0} sales</span>
                  </div>
                  <span className="font-semibold text-[#1A1A1A] tabular-nums">
                    {formatCurrency(c.total_generated)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#716D66] py-6 text-center">No staff performance data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
