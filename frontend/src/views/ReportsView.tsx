import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api.ts';
import { formatCurrency } from '../lib/currency.ts';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  Users
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
  Bar
} from 'recharts';

export function ReportsView() {
  const { role } = useAuth();
  const [period, setPeriod] = useState<string>('30d');
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadReports();
  }, [period]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDashboardReports(period);
      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    const stats = reportData.stats;
    const rows = [
      ['Metric', 'Value'],
      ['Period', period],
      ['Total Revenue (ETB)', stats.total_revenue],
      ['Total Discounts (ETB)', stats.total_discounts],
      ['Total Refunds (ETB)', stats.total_refunds],
      ['Net Sales (ETB)', stats.net_sales],
      ...(role === 'admin' ? [
        ['Cost of Goods Sold (COGS - ETB)', stats.cogs],
        ['Gross Profit (ETB)', stats.gross_profit],
        ['Operating Expenses (ETB)', stats.total_expenses],
        ['Net Profit (ETB)', stats.net_profit],
        ['Inventory Cost Valuation (ETB)', stats.inventory_cost_value]
      ] : []),
      ['Inventory Retail Valuation (ETB)', stats.inventory_retail_value],
      ['Total Units On Hand', stats.total_stock],
      ['Low Stock SKUs', stats.low_stock_count]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `hirbit_store_financial_report_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = reportData?.stats || {};
  const charts = reportData?.charts || {};

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E0D8]">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#B89B65] font-medium">
            Financial & Operational Intelligence
          </span>
          <h1 className="text-3xl font-serif font-medium text-[#1A1A1A] mt-1">
            {role === 'admin' ? 'Financial Profit & Loss Statement' : 'Store Operational Reports'}
          </h1>
          <p className="text-xs text-[#716D66] mt-1">
            Strictly computed from real database sales, COGS, inventory valuation, and operating expenses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center gap-1 p-1 bg-[#EFECE6] rounded-md border border-[#E5E0D8]">
            {['today', '7d', '30d', 'month'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded capitalize transition-colors cursor-pointer ${
                  period === p
                    ? 'bg-white text-[#1A1A1A] shadow-xs'
                    : 'text-[#59554F] hover:text-[#1A1A1A]'
                }`}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white border border-[#E5E0D8] text-[#1A1A1A] hover:bg-[#F9F8F6] rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#716D66]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ADMIN FINANCIAL STATEMENT (P&L Breakdown) */}
      {role === 'admin' && (
        <div className="bg-white rounded-xl border border-[#E5E0D8] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
            <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">Executive P&L Income Statement</h3>
            <span className="text-xs text-[#716D66]">Accrual & Cash Basis Integrated</span>
          </div>

          <div className="divide-y divide-[#F0EDE8] text-xs space-y-2">
            <div className="flex justify-between py-2 text-[#59554F]">
              <span>Gross Sales (POS & Invoices)</span>
              <span className="font-medium text-[#1A1A1A] tabular-nums">{formatCurrency(stats.total_revenue)}</span>
            </div>
            <div className="flex justify-between py-2 text-[#59554F]">
              <span>Less: Returns & Customer Refunds</span>
              <span className="text-rose-700 font-medium tabular-nums">-{formatCurrency(stats.total_refunds)}</span>
            </div>
            <div className="flex justify-between py-2 font-semibold text-[#1A1A1A] bg-[#F9F8F6] px-2 rounded">
              <span>Net Sales</span>
              <span className="tabular-nums">{formatCurrency(stats.net_sales)}</span>
            </div>
            <div className="flex justify-between py-2 text-[#59554F]">
              <span>Less: Cost of Goods Sold (COGS - Product Cost)</span>
              <span className="text-amber-800 font-medium tabular-nums">-{formatCurrency(stats.cogs)}</span>
            </div>
            <div className="flex justify-between py-2.5 font-serif text-sm font-bold text-[#1A1A1A] bg-[#EFECE6]/50 px-2 rounded">
              <span>Gross Profit (Net Sales - COGS)</span>
              <span className="tabular-nums text-[#B89B65]">{formatCurrency(stats.gross_profit)}</span>
            </div>
            <div className="flex justify-between py-2 text-[#59554F]">
              <span>Less: Operating Expenses (Store Rent, Packaging, Utilities)</span>
              <span className="text-rose-700 font-medium tabular-nums">-{formatCurrency(stats.total_expenses)}</span>
            </div>
            <div className="flex justify-between py-3 font-serif text-lg font-bold text-emerald-900 bg-emerald-50 px-3 rounded border border-emerald-200">
              <span>Net Store Operating Profit</span>
              <span className="tabular-nums">{formatCurrency(stats.net_profit)}</span>
            </div>
          </div>
        </div>
      )}

      {/* SALES VOLUME & CATEGORY BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category */}
        <div className="bg-white rounded-xl border border-[#E5E0D8] p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-base font-semibold text-[#1A1A1A]">Category Sales Contribution</h3>
          <div className="divide-y divide-[#F0EDE8] text-xs">
            {charts.sales_by_category?.map((c: any, idx: number) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#1A1A1A]">{c.category}</p>
                  <span className="text-[11px] text-[#716D66]">{c.units_sold} units sold</span>
                </div>
                <span className="font-semibold text-[#1A1A1A] tabular-nums">{formatCurrency(c.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Volume */}
        <div className="bg-white rounded-xl border border-[#E5E0D8] p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-base font-semibold text-[#1A1A1A]">Cashier Sales Breakdown</h3>
          <div className="divide-y divide-[#F0EDE8] text-xs">
            {charts.cashier_performance?.map((c: any, idx: number) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#1A1A1A]">{c.cashier_name}</p>
                  <span className="text-[11px] text-[#716D66] capitalize">{c.role} · {c.transactions_count} sales</span>
                </div>
                <span className="font-semibold text-[#1A1A1A] tabular-nums">{formatCurrency(c.total_generated)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
