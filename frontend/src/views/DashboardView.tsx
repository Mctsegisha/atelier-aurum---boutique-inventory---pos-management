import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api.ts';
import { formatCurrency } from '../lib/currency.ts';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  ShoppingBag,
  ShoppingCart,
  CreditCard,
  ArrowUpRight,
  Sparkles,
  Users,
  ChevronRight,
  Clock,
  Tag
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
  const [period, setPeriod] = useState<string>('day');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (period === 'custom') {
      if (startDate && endDate) {
        fetchDashboardData();
      }
    } else {
      fetchDashboardData();
    }
  }, [period, startDate, endDate, role]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getDashboardReports(period, startDate || undefined, endDate || undefined);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (pId: string) => {
    setStartDate('');
    setEndDate('');
    setPeriod(pId);
  };

  const handleResetToday = () => {
    setStartDate('');
    setEndDate('');
    setPeriod('day');
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (val && endDate) {
      setPeriod('custom');
    }
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    if (startDate && val) {
      setPeriod('custom');
    }
  };

  const getPeriodLabel = (metric: string) => {
    if (period === 'day' || period === 'today') return `TODAY — ${metric}`;
    if (period === 'week' || period === '7d') return `THIS WEEK — ${metric}`;
    if (period === 'month' || period === '30d') return `THIS MONTH — ${metric}`;
    return `PERIOD — ${metric}`;
  };

  const formatCardCurrency = (val: number | string | null | undefined): string => {
    if (val === null || val === undefined || val === '') return 'ETB 0';
    const num = Number(val);
    if (isNaN(num)) return 'ETB 0';
    return `ETB ${num.toLocaleString('en-US', {
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    })}`;
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

        {/* Period Selector Tabs & Custom Date Range Filter */}
        {role !== 'sales' && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Presets: Day, Week, Month */}
            <div className="inline-flex items-center p-1 bg-[#F5F4F0] rounded-lg border border-[#E5E0D8]">
              {[
                { id: 'day', label: 'Day' },
                { id: 'week', label: 'Week' },
                { id: 'month', label: 'Month' }
              ].map(p => {
                const isActive = (period === p.id) || (p.id === 'day' && period === 'today') || (p.id === 'week' && period === '7d') || (p.id === 'month' && period === '30d');
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#1E3E31] text-white shadow-xs'
                        : 'text-[#59554F] hover:text-[#1A1A1A]'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Date Range Filter (mm/dd/yyyy to mm/dd/yyyy) */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={e => handleStartDateChange(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E0D8] rounded-md text-[#1A1A1A] focus:outline-none focus:border-[#1E3E31] shadow-xs cursor-pointer"
                title="Start Date"
              />
              <span className="text-xs text-[#716D66] font-normal">to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => handleEndDateChange(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E0D8] rounded-md text-[#1A1A1A] focus:outline-none focus:border-[#1E3E31] shadow-xs cursor-pointer"
                title="End Date"
              />
            </div>

            {/* Today shortcut */}
            <button
              type="button"
              onClick={handleResetToday}
              className="px-2.5 py-1.5 text-xs font-medium text-[#59554F] hover:text-[#1E3E31] transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* 5 SUMMARY CARDS MATCHING ADMIN DASHBOARD DESIGN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* 1. Today's Revenue */}
        <div className="p-5 bg-white rounded-xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#716D66]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#716D66]">
              {getPeriodLabel('REVENUE')}
            </span>
            <ShoppingCart className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="text-2xl lg:text-3xl font-serif font-semibold text-[#1A1A1A] mt-3 tabular-nums">
            {formatCardCurrency(stats.total_revenue)}
          </div>
          <div className="text-xs text-[#716D66] mt-1.5">
            {stats.total_transactions || 0} transactions
          </div>
        </div>

        {/* 2. Today's Gross Profit */}
        <div className="p-5 bg-white rounded-xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#716D66]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#716D66]">
              {getPeriodLabel('GROSS PROFIT')}
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="text-2xl lg:text-3xl font-serif font-semibold text-[#1A1A1A] mt-3 tabular-nums">
            {formatCardCurrency(stats.gross_profit)}
          </div>
          <div className="text-xs text-[#716D66] mt-1.5">
            {stats.gross_margin_percent || 0}% margin
          </div>
        </div>

        {/* 3. Low Stock */}
        <div
          onClick={() => onNavigate('inventory')}
          className="p-5 bg-white rounded-xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between text-[#716D66]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#716D66]">
              LOW STOCK
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <div className="text-2xl lg:text-3xl font-serif font-semibold text-[#1A1A1A] mt-3 tabular-nums">
            {stats.low_stock_count ?? 0}
          </div>
          <div className="text-xs text-[#716D66] mt-1.5">
            products below reorder
          </div>
        </div>

        {/* 4. Slow Moving Stock (Replaces Expiring Soon) */}
        <div
          onClick={() => onNavigate('inventory')}
          className="p-5 bg-white rounded-xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between cursor-pointer hover:border-rose-400 transition-colors"
        >
          <div className="flex items-center justify-between text-[#716D66]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#716D66]">
              SLOW MOVING STOCK
            </span>
            <Clock className="w-4 h-4 text-rose-500 shrink-0" />
          </div>
          <div className="text-2xl lg:text-3xl font-serif font-semibold text-[#1A1A1A] mt-3 tabular-nums">
            {stats.slow_moving_count ?? 0}
          </div>
          <div className="text-xs text-[#716D66] mt-1.5">
            within 30 days
          </div>
        </div>

        {/* 5. Total Products */}
        <div
          onClick={() => onNavigate('products')}
          className="p-5 bg-white rounded-xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between cursor-pointer hover:border-[#1E3E31] transition-colors"
        >
          <div className="flex items-center justify-between text-[#716D66]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#716D66]">
              TOTAL PRODUCTS
            </span>
            <Package className="w-4 h-4 text-[#1E3E31] shrink-0" />
          </div>
          <div className="text-2xl lg:text-3xl font-serif font-semibold text-[#1A1A1A] mt-3 tabular-nums">
            {stats.total_products ?? 0}
          </div>
          <div className="text-xs text-[#716D66] mt-1.5">
            active products
          </div>
        </div>
      </div>

      {/* SECONDARY STRIP: Inventory Valuation Quick Stats */}
      {role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* SLOW-MOVING STOCK PANEL (Store Manager & Admin) */}
      {role !== 'sales' && (
        <div className="p-6 bg-white rounded-xl border border-[#E5E0D8] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-serif font-semibold text-[#1A1A1A]">Slow-Moving Stock</h3>
              <p className="text-xs text-[#716D66]">Products with available stock but no sales in the last 60 days</p>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-[#B89B65] hover:underline cursor-pointer"
            >
              View Inventory
            </button>
          </div>

          {charts.slow_moving_stock && charts.slow_moving_stock.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#F0EDE8]">
                    <th className="pb-2 text-left font-medium text-[#716D66] uppercase tracking-wider">Product</th>
                    <th className="pb-2 text-left font-medium text-[#716D66] uppercase tracking-wider">Category</th>
                    <th className="pb-2 text-right font-medium text-[#716D66] uppercase tracking-wider">In Stock</th>
                    <th className="pb-2 text-right font-medium text-[#716D66] uppercase tracking-wider">Unit Price</th>
                    <th className="pb-2 text-right font-medium text-[#716D66] uppercase tracking-wider">Stock Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EDE8]">
                  {charts.slow_moving_stock.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-md bg-[#F0EDE8] overflow-hidden shrink-0 border border-[#E5E0D8]">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="w-3.5 h-3.5 text-[#B89B65]" />
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-[#1A1A1A] truncate max-w-[180px]">{item.product_name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-[#716D66]">{item.category}</td>
                      <td className="py-3 pr-4 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                          {item.stock_quantity} units
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right text-[#1A1A1A] tabular-nums">
                        {formatCurrency(item.selling_price)}
                      </td>
                      <td className="py-3 text-right font-semibold text-[#1A1A1A] tabular-nums">
                        {formatCurrency(item.selling_price * item.stock_quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Package className="w-10 h-10 text-[#D8D2C7] mb-3" />
              <p className="text-sm font-medium text-[#1A1A1A]">All stocked items are moving</p>
              <p className="text-xs text-[#716D66] mt-1">No products with zero sales in the last 60 days.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
