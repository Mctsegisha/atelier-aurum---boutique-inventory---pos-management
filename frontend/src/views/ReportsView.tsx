import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { formatCurrency } from '../lib/currency.ts';
import {
  SalesReportResponse,
  PnlReportResponse,
  StockValueReportResponse,
  ChannelsReportResponse,
  OwedToUsReportResponse,
  WastageReportResponse,
  ReceivableCustomer
} from '../types.ts';
import {
  TrendingUp,
  Scale,
  Package,
  Landmark,
  CircleDollarSign,
  Trash2,
  Download,
  FileSpreadsheet,
  Printer,
  Lightbulb,
  AlertCircle,
  RefreshCw,
  X,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

type ReportTab = 'sales' | 'pnl' | 'stock' | 'channels' | 'owed' | 'wastage';
type PeriodPreset = 'today' | '7d' | '30d' | 'month' | 'custom';
type GroupBy = 'day' | 'week' | 'month';

export function ReportsView() {
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [period, setPeriod] = useState<PeriodPreset>('30d');
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [showCustomPicker, setShowCustomPicker] = useState<boolean>(false);
  const [atRiskDays, setAtRiskDays] = useState<number>(30);

  // Live Data States
  const [salesReport, setSalesReport] = useState<SalesReportResponse | null>(null);
  const [pnlReport, setPnlReport] = useState<PnlReportResponse | null>(null);
  const [stockReport, setStockReport] = useState<StockValueReportResponse | null>(null);
  const [channelsReport, setChannelsReport] = useState<ChannelsReportResponse | null>(null);
  const [owedReport, setOwedReport] = useState<OwedToUsReportResponse | null>(null);
  const [wastageReport, setWastageReport] = useState<WastageReportResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Settlement Modal State (Tab 5: Owed to us)
  const [settlingCustomer, setSettlingCustomer] = useState<ReceivableCustomer | null>(null);
  const [settleAmount, setSettleAmount] = useState<string>('');
  const [settlePaymentMethod, setSettlePaymentMethod] = useState<string>('cash');
  const [settleNotes, setSettleNotes] = useState<string>('');
  const [isSettling, setIsSettling] = useState<boolean>(false);

  useEffect(() => {
    loadActiveReport();
  }, [activeTab, period, groupBy, atRiskDays]);

  const loadActiveReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const periodParam = period === 'custom' && customStart && customEnd ? 'custom' : period;
      const startDate = period === 'custom' ? customStart : undefined;
      const endDate = period === 'custom' ? customEnd : undefined;

      switch (activeTab) {
        case 'sales': {
          const res = await api.getSalesReport({
            period: periodParam,
            groupBy,
            startDate,
            endDate
          });
          setSalesReport(res);
          break;
        }
        case 'pnl': {
          const res = await api.getPnlReport({
            period: periodParam,
            startDate,
            endDate
          });
          setPnlReport(res);
          break;
        }
        case 'stock': {
          const res = await api.getStockValueReport();
          setStockReport(res);
          break;
        }
        case 'channels': {
          const res = await api.getChannelsReport({
            period: periodParam,
            startDate,
            endDate
          });
          setChannelsReport(res);
          break;
        }
        case 'owed': {
          const res = await api.getOwedToUsReport();
          setOwedReport(res);
          break;
        }
        case 'wastage': {
          const res = await api.getWastageReport({ atRiskDays });
          setWastageReport(res);
          break;
        }
      }
    } catch (err: any) {
      console.error('[ReportsView loadActiveReport error]', err);
      setError(err.message || 'Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // EXPORT UTILITIES (CSV, PDF, Excel)
  // ==========================================
  const handleExportCSV = () => {
    let rows: string[][] = [];
    let filename = `report_${activeTab}_${period}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeTab === 'sales' && salesReport) {
      rows.push(['DATE', 'SALES', 'REVENUE (ETB)', 'COST (ETB)', 'GROSS PROFIT (ETB)', 'MARGIN (%)']);
      salesReport.breakdown_table.forEach((r) => {
        rows.push([r.date, String(r.sales_count), String(r.revenue), String(r.cost), String(r.gross_profit), `${r.margin_percent}%`]);
      });
    } else if (activeTab === 'pnl' && pnlReport) {
      rows.push(['LINE ITEM', 'AMOUNT (ETB)']);
      rows.push(['Revenue', String(pnlReport.statement.revenue)]);
      rows.push(['Cost of Goods Sold', `-${pnlReport.statement.cogs}`]);
      rows.push(['Gross Profit', String(pnlReport.statement.gross_profit)]);
      rows.push(['Operating Expenses', `-${pnlReport.statement.operating_expenses}`]);
      rows.push(['Wastage Written Off', `-${pnlReport.statement.wastage_written_off}`]);
      rows.push(['Net Profit', String(pnlReport.statement.net_profit)]);
      rows.push([]);
      rows.push(['EXPENSE CATEGORY', 'AMOUNT (ETB)']);
      pnlReport.where_expenses_went.forEach((e) => {
        rows.push([e.category, String(e.amount)]);
      });
      rows.push([]);
      rows.push(['PRODUCT', 'QTY SOLD', 'REVENUE (ETB)', 'COST (ETB)', 'GROSS PROFIT (ETB)', 'MARGIN (%)']);
      pnlReport.profit_by_product.forEach((p) => {
        rows.push([p.product_name, String(p.qty_sold), String(p.revenue), String(p.cost), String(p.gross_profit), `${p.margin_percent}%`]);
      });
    }

    if (rows.length === 0) return;
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    // Generate formatted tab-delimited Excel file
    handleExportCSV();
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Settlement submission
  const handleOpenSettleModal = (customer: ReceivableCustomer) => {
    setSettlingCustomer(customer);
    setSettleAmount(String(customer.outstanding));
    setSettlePaymentMethod('cash');
    setSettleNotes('');
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingCustomer) return;
    const amountVal = parseFloat(settleAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Please enter a valid positive settlement amount.');
      return;
    }

    setIsSettling(true);
    try {
      await api.settleCustomerCredit({
        customer_id: settlingCustomer.customer_id,
        amount: amountVal,
        payment_method: settlePaymentMethod,
        notes: settleNotes.trim() || undefined
      });
      setSettlingCustomer(null);
      await loadActiveReport();
    } catch (err: any) {
      alert(err.message || 'Failed to record customer credit payment.');
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 w-full font-sans">
      {/* 1. Page Header & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-sans tracking-tight">Reports</h1>
          <p className="text-xs text-gray-500 font-sans mt-0.5">
            Analytics and insights for your store.
          </p>
        </div>

        {/* Period Selector (Top Right on Sales, P&L, Channels) */}
        {(activeTab === 'sales' || activeTab === 'pnl' || activeTab === 'channels') && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-[11px] text-gray-400 font-sans">Period</span>
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 text-xs shadow-2xs">
              {(['today', '7d', '30d', 'month', 'custom'] as PeriodPreset[]).map((p) => {
                const labels: Record<PeriodPreset, string> = {
                  today: 'Today',
                  '7d': '7 days',
                  '30d': '30 days',
                  month: 'This month',
                  custom: 'Custom'
                };
                const isSelected = period === p;
                return (
                  <button
                    key={p}
                    onClick={() => {
                      setPeriod(p);
                      if (p === 'custom') setShowCustomPicker(true);
                    }}
                    className={`px-3 py-1 rounded-md text-xs font-sans transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-gray-900 text-white font-medium shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Custom Date Range Picker Modal/Flyout */}
      {showCustomPicker && (
        <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-md max-w-md flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1 border border-gray-200 rounded-md font-mono text-xs text-gray-800"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1 border border-gray-200 rounded-md font-mono text-xs text-gray-800"
            />
          </div>
          <button
            onClick={() => {
              setShowCustomPicker(false);
              loadActiveReport();
            }}
            className="px-3 py-1 bg-gray-900 hover:bg-black text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
          >
            Apply Range
          </button>
          <button
            onClick={() => setShowCustomPicker(false)}
            className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer ml-auto"
          >
            Cancel
          </button>
        </div>
      )}

      {/* 2. Tab Bar (6 Tabs) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-gray-200/80">
        {[
          { id: 'sales', label: 'Sales', icon: TrendingUp },
          { id: 'pnl', label: 'P&L', icon: Scale },
          { id: 'stock', label: 'Stock Value', icon: Package },
          { id: 'channels', label: 'Channels', icon: Landmark },
          { id: 'owed', label: 'Owed to us', icon: CircleDollarSign },
          { id: 'wastage', label: 'Wastage', icon: Trash2 }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as ReportTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium font-sans whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-white text-gray-900 border border-gray-200 shadow-2xs font-semibold'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadActiveReport}
            className="text-xs font-semibold underline text-red-800 hover:text-red-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400 text-xs space-y-2">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-300" />
          <span>Generating report...</span>
        </div>
      ) : (
        <div id="printable-report-area" className="space-y-6">
          {/* ============================================================== */}
          {/* TAB 1: SALES REPORT (Reference Images 1, 2, 3)                  */}
          {/* ============================================================== */}
          {activeTab === 'sales' && salesReport && (
            <div className="space-y-6">
              {/* Controls Row: Group By + CSV, PDF, Excel */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-sans">Group By</span>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                    className="px-2.5 py-1.5 border border-gray-200 rounded-md text-xs font-sans text-gray-800 bg-white shadow-2xs focus:outline-none cursor-pointer"
                  >
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-sans text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-sans text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-sans text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </button>
                </div>
              </div>

              {/* Top 3 KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl border border-gray-200/80 bg-white shadow-2xs">
                  <span className="text-xs text-gray-500 font-sans block leading-tight font-medium">Total Revenue</span>
                  <span className="text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight mt-2 block tracking-tight">
                    {formatCurrency(salesReport.kpis.total_revenue)}
                  </span>
                </div>

                <div className="p-5 rounded-xl border border-gray-200/80 bg-white shadow-2xs">
                  <span className="text-xs text-gray-500 font-sans block leading-tight font-medium">Total gross profit</span>
                  <span className="text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight mt-2 block tracking-tight">
                    {formatCurrency(salesReport.kpis.total_gross_profit)}
                  </span>
                </div>

                <div className="p-5 rounded-xl border border-gray-200/80 bg-white shadow-2xs">
                  <span className="text-xs text-gray-500 font-sans block leading-tight font-medium">Avg Daily Sales</span>
                  <span className="text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight mt-2 block tracking-tight">
                    {formatCurrency(salesReport.kpis.avg_daily_sales)}
                  </span>
                </div>
              </div>

              {/* Grouped Bar Chart: Revenue (black) vs Gross Profit (green) */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesReport.grouped_bars} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F0" />
                      <XAxis
                        dataKey="label"
                        stroke="#A1A1AA"
                        fontSize={10}
                        tickLine={false}
                        dy={6}
                      />
                      <YAxis
                        stroke="#A1A1AA"
                        fontSize={10}
                        tickLine={false}
                        tickFormatter={(val) => `${val}`}
                      />
                      <Tooltip
                        formatter={(val: any, name: any) => [
                          formatCurrency(Number(val)),
                          name === 'revenue' ? 'Revenue' : 'Gross profit'
                        ]}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E4E4E7',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontFamily: 'inherit'
                        }}
                      />
                      <Bar dataKey="gross_profit" name="Gross profit" fill="#16A34A" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="revenue" name="Revenue" fill="#18181B" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend Below Chart */}
                <div className="flex items-center justify-center gap-6 pt-3 text-xs font-sans">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-[#16A34A] rounded-xs" />
                    <span className="text-gray-700 font-medium">Gross profit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-[#18181B] rounded-xs" />
                    <span className="text-gray-700 font-medium">Revenue</span>
                  </div>
                </div>
              </div>

              {/* Breakdown Table (Reference Image 1 bottom) */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs divide-y divide-gray-100">
                    <thead className="bg-[#FAF9F7] text-gray-400 uppercase tracking-wider text-[10px] font-sans font-semibold">
                      <tr>
                        <th className="py-3 px-4">DATE</th>
                        <th className="py-3 px-4 text-center">SALES</th>
                        <th className="py-3 px-4 text-right">REVENUE</th>
                        <th className="py-3 px-4 text-right">COST</th>
                        <th className="py-3 px-4 text-right">GROSS PROFIT</th>
                        <th className="py-3 px-4 text-right">MARGIN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {salesReport.breakdown_table.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-400 font-sans">
                            No sales recorded in the selected period.
                          </td>
                        </tr>
                      ) : (
                        salesReport.breakdown_table.map((r, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-3.5 px-4 font-sans text-gray-800 whitespace-nowrap">
                              {r.label}
                            </td>
                            <td className="py-3.5 px-4 font-mono tabular-nums text-gray-800 text-center whitespace-nowrap">
                              {r.sales_count}
                            </td>
                            <td className="py-3.5 px-4 font-mono tabular-nums text-gray-900 font-medium text-right whitespace-nowrap">
                              {formatCurrency(r.revenue)}
                            </td>
                            <td className="py-3.5 px-4 font-mono tabular-nums text-gray-700 text-right whitespace-nowrap">
                              {formatCurrency(r.cost)}
                            </td>
                            <td className="py-3.5 px-4 font-mono tabular-nums text-[#16803d] font-semibold text-right whitespace-nowrap">
                              {formatCurrency(r.gross_profit)}
                            </td>
                            <td className="py-3.5 px-4 font-mono tabular-nums text-gray-800 text-right whitespace-nowrap">
                              {r.margin_percent.toFixed(1)}%
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Insights Section (Reference Images 2 & 3) */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-gray-800">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-gray-900 font-sans">Insights</h3>
                </div>

                {/* 4 Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
                    <span className="text-[11px] text-gray-500 font-sans block">Average sale</span>
                    <span className="text-base font-bold text-gray-900 font-mono tabular-nums mt-1 block">
                      {formatCurrency(salesReport.insights.average_sale)}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
                    <span className="text-[11px] text-gray-500 font-sans block">Items per sale</span>
                    <span className="text-base font-bold text-gray-900 font-mono tabular-nums mt-1 block">
                      {salesReport.insights.items_per_sale}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
                    <span className="text-[11px] text-gray-500 font-sans block">Money in stock nothing sold</span>
                    <span className="text-base font-bold text-gray-900 font-mono tabular-nums mt-1 block">
                      {formatCurrency(salesReport.insights.money_in_stock_nothing_sold)}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
                    <span className="text-[11px] text-gray-500 font-sans block">At risk of expiring (90d)</span>
                    <span className="text-base font-bold text-gray-900 font-mono tabular-nums mt-1 block">
                      {formatCurrency(salesReport.insights.at_risk_dead_stock)}
                    </span>
                  </div>
                </div>

                {/* Pareto & Peak Hours Summary Banner */}
                <div className="p-4 rounded-xl border border-gray-200 bg-[#FBFBFA] space-y-1">
                  <p className="text-xs font-semibold text-gray-900 font-sans">
                    {salesReport.insights.pareto_insight}
                  </p>
                  <p className="text-xs text-gray-500 font-sans">
                    {salesReport.insights.busiest_insight}
                  </p>
                </div>

                {/* EARNING YOU THE MOST Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="px-4 py-3 bg-[#FAF9F7] border-b border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-sans">
                      EARNING YOU THE MOST
                    </span>
                    <div className="flex items-center gap-8 text-[10px] uppercase font-bold text-gray-400 tracking-wider font-sans pr-4">
                      <span>UNITS</span>
                      <span>REVENUE</span>
                      <span>GROSS PROFIT</span>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {salesReport.insights.top_earners.length === 0 ? (
                      <div className="py-6 text-center text-xs text-gray-400 font-sans">
                        No product sales recorded yet.
                      </div>
                    ) : (
                      salesReport.insights.top_earners.map((item, idx) => (
                        <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-xs">
                          <span className="font-sans text-gray-800 font-medium truncate max-w-sm">
                            {item.product_name}
                          </span>
                          <div className="flex items-center gap-10 font-mono tabular-nums">
                            <span className="w-12 text-center text-gray-700">{item.units_sold}</span>
                            <span className="w-24 text-right text-gray-900 font-medium">{formatCurrency(item.revenue)}</span>
                            <span className="w-24 text-right text-gray-900 font-semibold">{formatCurrency(item.gross_profit)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* When people come in Hourly Bar Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 font-sans">When people come in</h4>
                  <div className="h-48 sm:h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesReport.insights.hourly_distribution} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F0" />
                        <XAxis
                          dataKey="hour"
                          stroke="#A1A1AA"
                          fontSize={10}
                          tickLine={false}
                          dy={6}
                        />
                        <YAxis
                          stroke="#A1A1AA"
                          fontSize={10}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(val: any) => [`${val} transactions`, 'Visitors']}
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderColor: '#E4E4E7',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontFamily: 'inherit'
                          }}
                        />
                        <Bar dataKey="sales_count" fill="#16A34A" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: P&L REPORT (Reference Image 4)                          */}
          {/* ============================================================== */}
          {activeTab === 'pnl' && pnlReport && (
            <div className="space-y-6">
              {/* Top Controls: CSV, PDF, Excel */}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-sans text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-sans text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-sans text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
              </div>

              {/* P&L Statement Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-2xs">
                {/* + Revenue */}
                <div className="flex justify-between items-baseline border-b border-gray-100 pb-3">
                  <div>
                    <span className="font-bold text-gray-900 text-sm font-sans">+ Revenue</span>
                    <span className="text-[11px] text-gray-400 font-sans block mt-0.5">
                      {pnlReport.statement.sales_count} sales, net of refunds
                    </span>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-gray-900 text-sm">
                    {formatCurrency(pnlReport.statement.revenue)}
                  </span>
                </div>

                {/* - Cost of goods sold */}
                <div className="flex justify-between items-center text-xs text-gray-700 font-sans border-b border-gray-100 pb-3">
                  <span>- Cost of goods sold</span>
                  <span className="font-mono tabular-nums font-medium text-gray-900">
                    -{formatCurrency(pnlReport.statement.cogs)}
                  </span>
                </div>

                {/* = Gross profit */}
                <div className="flex justify-between items-center text-xs font-bold text-gray-900 font-sans border-b border-gray-100 pb-3">
                  <span>= Gross profit ({pnlReport.statement.gross_margin_percent.toFixed(1)}%)</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(pnlReport.statement.gross_profit)}
                  </span>
                </div>

                {/* - Operating expenses */}
                <div className="flex justify-between items-center text-xs text-gray-700 font-sans border-b border-gray-100 pb-3">
                  <span>- Operating expenses</span>
                  <span className="font-mono tabular-nums font-medium text-gray-900">
                    -{formatCurrency(pnlReport.statement.operating_expenses)}
                  </span>
                </div>

                {/* - Wastage written off */}
                <div className="flex justify-between items-center text-xs text-gray-700 font-sans border-b border-gray-100 pb-3">
                  <span>- Wastage written off</span>
                  <span className="font-mono tabular-nums font-medium text-gray-900">
                    -{formatCurrency(pnlReport.statement.wastage_written_off)}
                  </span>
                </div>

                {/* = Net profit */}
                <div className="flex justify-between items-center text-sm font-bold text-gray-900 font-sans pt-1">
                  <span>= Net profit ({pnlReport.statement.net_margin_percent.toFixed(1)}%)</span>
                  <span className="font-mono tabular-nums">
                    {pnlReport.statement.net_profit < 0 ? '-' : ''}
                    {formatCurrency(Math.abs(pnlReport.statement.net_profit))}
                  </span>
                </div>
              </div>

              {/* WHERE THE EXPENSES WENT Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="px-4 py-3 bg-[#FAF9F7] border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-sans">
                    WHERE THE EXPENSES WENT
                  </span>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-sans">
                    AMOUNT
                  </span>
                </div>

                <div className="divide-y divide-gray-100">
                  {pnlReport.where_expenses_went.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-400 font-sans">
                      No operating expenses recorded for this period.
                    </div>
                  ) : (
                    pnlReport.where_expenses_went.map((e, idx) => (
                      <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-xs font-sans">
                        <span className="text-gray-800 font-medium">{e.category}</span>
                        <span className="font-mono tabular-nums font-semibold text-gray-900">
                          {formatCurrency(e.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Profit by product Table */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 font-sans">Profit by product</h3>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs divide-y divide-gray-100">
                      <thead className="bg-[#FAF9F7] text-gray-400 uppercase tracking-wider text-[10px] font-sans font-semibold">
                        <tr>
                          <th className="py-3 px-4">PRODUCT</th>
                          <th className="py-3 px-4 text-center">QTY SOLD</th>
                          <th className="py-3 px-4 text-right">REVENUE</th>
                          <th className="py-3 px-4 text-right">COST</th>
                          <th className="py-3 px-4 text-right">GROSS PROFIT</th>
                          <th className="py-3 px-4 text-right">MARGIN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pnlReport.profit_by_product.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-400 font-sans">
                              No product profit data available.
                            </td>
                          </tr>
                        ) : (
                          pnlReport.profit_by_product.map((p, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                              <td className="py-3.5 px-4 font-sans text-gray-800 font-medium">
                                {p.product_name}
                              </td>
                              <td className="py-3.5 px-4 font-mono tabular-nums text-gray-800 text-center">
                                {p.qty_sold}
                              </td>
                              <td className="py-3.5 px-4 font-mono tabular-nums text-gray-900 font-medium text-right">
                                {formatCurrency(p.revenue)}
                              </td>
                              <td className="py-3.5 px-4 font-mono tabular-nums text-gray-700 text-right">
                                {formatCurrency(p.cost)}
                              </td>
                              <td className="py-3.5 px-4 font-mono tabular-nums text-[#16803d] font-semibold text-right">
                                {formatCurrency(p.gross_profit)}
                              </td>
                              <td className="py-3.5 px-4 font-mono tabular-nums text-gray-800 text-right">
                                {p.margin_percent.toFixed(1)}%
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: STOCK VALUE REPORT (Reference Image 5)                  */}
          {/* ============================================================== */}
          {activeTab === 'stock' && stockReport && (
            <div className="space-y-6">
              {/* Top 4 KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl border border-gray-200/80 bg-white shadow-2xs">
                  <span className="text-xs text-gray-500 font-sans block leading-tight font-medium">Cost of stock on hand</span>
                  <span className="text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight mt-2 block tracking-tight">
                    {formatCurrency(stockReport.cost_of_stock_on_hand)}
                  </span>
                </div>

                <div className="p-5 rounded-xl border border-gray-200/80 bg-white shadow-2xs">
                  <span className="text-xs text-gray-500 font-sans block leading-tight font-medium">Value at retail</span>
                  <span className="text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight mt-2 block tracking-tight">
                    {formatCurrency(stockReport.value_at_retail)}
                  </span>
                </div>

                <div className="p-5 rounded-xl border border-gray-200/80 bg-white shadow-2xs">
                  <span className="text-xs text-gray-500 font-sans block leading-tight font-medium">Markup if it all sells</span>
                  <span className="text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight mt-2 block tracking-tight">
                    {formatCurrency(stockReport.markup_if_all_sells)}
                  </span>
                </div>

                <div className="p-5 rounded-xl border border-gray-200/80 bg-white shadow-2xs">
                  <span className="text-xs text-gray-500 font-sans block leading-tight font-medium">Markup on cost</span>
                  <span className="text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight mt-2 block tracking-tight">
                    {stockReport.markup_on_cost_percent.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Summary Line */}
              <p className="text-xs text-gray-500 font-sans">
                {stockReport.total_units.toLocaleString()} units across {stockReport.total_products} products. Expired stock is excluded from both figures — it cannot be sold at retail and will not be recovered at cost.
              </p>

              {/* Alert / Excluded Stock Banner (Reference Image 5 bottom) */}
              <div className="p-4 rounded-xl border border-gray-200 bg-white flex items-center justify-between shadow-2xs">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 font-sans">
                    Expired stock still on the shelf
                  </h4>
                  <p className="text-[11px] text-gray-500 font-sans mt-0.5">
                    Not counted above. Write it off from Inventory to clear it.
                  </p>
                </div>
                <span className="text-base font-bold text-[#DC2626] font-mono tabular-nums">
                  {formatCurrency(stockReport.dead_stock_value)}
                </span>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: CHANNELS REPORT (Reference Image 6)                     */}
          {/* ============================================================== */}
          {activeTab === 'channels' && channelsReport && (
            <div className="space-y-6">
              {/* Top Right Summary Card */}
              <div className="flex justify-end">
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs text-right min-w-[200px]">
                  <span className="text-[11px] text-gray-500 font-sans block">Taken in total</span>
                  <span className="text-lg font-bold text-gray-900 font-mono tabular-nums mt-1 block">
                    {formatCurrency(channelsReport.taken_in_total)}
                  </span>
                </div>
              </div>

              {/* Channel Breakdown Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs divide-y divide-gray-100">
                    <thead className="bg-[#FAF9F7] text-gray-400 uppercase tracking-wider text-[10px] font-sans font-semibold">
                      <tr>
                        <th className="py-3 px-4">CHANNEL</th>
                        <th className="py-3 px-4 text-center">SALES</th>
                        <th className="py-3 px-4 text-center">SHARE</th>
                        <th className="py-3 px-4 text-right">COLLECTED</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {channelsReport.channels.map((c, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-sans text-gray-800 font-medium">
                            <span>{c.channel}</span>
                            {c.note && (
                              <span className={`text-[11px] ml-2 font-normal ${
                                c.channel_key === 'credit' ? 'text-amber-600' : 'text-gray-400'
                              }`}>
                                {c.note}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono tabular-nums text-gray-800 text-center">
                            {c.sales_count}
                          </td>
                          <td className="py-3.5 px-4 font-mono tabular-nums text-gray-800 text-center">
                            {c.share_percent.toFixed(1)}%
                          </td>
                          <td className="py-3.5 px-4 font-mono tabular-nums text-gray-900 font-semibold text-right">
                            {formatCurrency(c.collected)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: OWED TO US REPORT (Reference Image 7)                   */}
          {/* ============================================================== */}
          {activeTab === 'owed' && owedReport && (
            <div className="space-y-6">
              {/* Top Summary Bar */}
              <div className="p-4 rounded-xl border border-gray-200 bg-white flex items-center justify-between shadow-2xs">
                <span className="text-xs text-gray-600 font-sans">Total owed to you</span>
                <span className="text-base font-bold text-gray-900 font-mono tabular-nums">
                  {formatCurrency(owedReport.total_owed)}
                </span>
              </div>

              {/* Receivables Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs divide-y divide-gray-100">
                    <thead className="bg-[#FAF9F7] text-gray-400 uppercase tracking-wider text-[10px] font-sans font-semibold">
                      <tr>
                        <th className="py-3 px-4">CUSTOMER</th>
                        <th className="py-3 px-4">DUE</th>
                        <th className="py-3 px-4 text-right">OUTSTANDING</th>
                        <th className="py-3 px-4 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {owedReport.receivables.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-400 font-sans">
                            No outstanding customer credit balances!
                          </td>
                        </tr>
                      ) : (
                        owedReport.receivables.map((customer) => (
                          <tr key={customer.customer_id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-3.5 px-4 font-sans text-gray-800 font-medium whitespace-nowrap">
                              {customer.customer_name}
                            </td>
                            <td className="py-3.5 px-4 font-mono tabular-nums whitespace-nowrap">
                              {customer.is_overdue ? (
                                <span className="text-rose-600 font-medium">
                                  {customer.due_date} — overdue
                                </span>
                              ) : (
                                <span className="text-gray-700">{customer.due_date}</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-gray-900 text-right whitespace-nowrap">
                              {formatCurrency(customer.outstanding)}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleOpenSettleModal(customer)}
                                className="px-3 py-1.5 border border-gray-200 hover:border-gray-300 rounded-md text-xs font-sans text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
                              >
                                Record payment
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 6: WASTAGE REPORT (Reference Image 8)                      */}
          {/* ============================================================== */}
          {activeTab === 'wastage' && wastageReport && (
            <div className="space-y-6">
              {/* Filter Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-sans">At risk within</span>
                <select
                  value={atRiskDays}
                  onChange={(e) => setAtRiskDays(parseInt(e.target.value, 10))}
                  className="px-2.5 py-1.5 border border-gray-200 rounded-md text-xs font-sans text-gray-800 bg-white shadow-2xs focus:outline-none cursor-pointer"
                >
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>

              {/* Top 3 Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl border border-gray-200/80 bg-white shadow-2xs">
                  <span className="text-xs text-gray-500 font-sans block leading-tight font-medium">
                    At risk — sell within {atRiskDays} days
                  </span>
                  <span className="text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight mt-2 block tracking-tight">
                    {formatCurrency(wastageReport.at_risk_value)}
                  </span>
                </div>

                <div className="p-5 rounded-xl border border-gray-200/80 bg-white shadow-2xs">
                  <span className="text-xs text-gray-500 font-sans block leading-tight font-medium">
                    Expired, not yet written off
                  </span>
                  <span className="text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight mt-2 block tracking-tight">
                    {formatCurrency(wastageReport.expired_not_written_off)}
                  </span>
                </div>

                <div className="p-5 rounded-xl border border-gray-200/80 bg-white shadow-2xs">
                  <span className="text-xs text-gray-500 font-sans block leading-tight font-medium">
                    Written off
                  </span>
                  <span className="text-2xl font-bold text-gray-900 font-mono tabular-nums leading-tight mt-2 block tracking-tight">
                    {formatCurrency(wastageReport.written_off)}
                  </span>
                </div>
              </div>

              {/* Total Lost Banner (Reference Image 8) */}
              <div className="p-4 rounded-xl border border-gray-200 bg-white flex items-center justify-between shadow-2xs">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 font-sans">Total lost</h4>
                  <p className="text-[11px] text-gray-500 font-sans mt-0.5 max-w-xl">
                    Expired plus written off, both at cost. At-risk stock is not counted — it is still sellable, and {formatCurrency(wastageReport.at_risk_revenue)} of revenue is still there to rescue.
                  </p>
                </div>
                <span className="text-base font-bold text-[#DC2626] font-mono tabular-nums whitespace-nowrap ml-4">
                  {formatCurrency(wastageReport.total_lost)}
                </span>
              </div>

              {/* Breakdown Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs divide-y divide-gray-100">
                    <thead className="bg-[#FAF9F7] text-gray-400 uppercase tracking-wider text-[10px] font-sans font-semibold">
                      <tr>
                        <th className="py-3 px-4">REASON</th>
                        <th className="py-3 px-4 text-center">UNITS</th>
                        <th className="py-3 px-4 text-right">COST</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {wastageReport.breakdown.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-gray-400 font-sans">
                            No inventory wastage recorded.
                          </td>
                        </tr>
                      ) : (
                        wastageReport.breakdown.map((b, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-3.5 px-4 font-sans text-gray-800 font-medium">
                              {b.reason}
                            </td>
                            <td className="py-3.5 px-4 font-mono tabular-nums text-gray-800 text-center">
                              {b.units}
                            </td>
                            <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-gray-900 text-right">
                              {formatCurrency(b.cost)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* RECORD PAYMENT MODAL (Tab 5: Owed to us)                       */}
      {/* ============================================================== */}
      {settlingCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-gray-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-sans">Record Customer Payment</h3>
                <p className="text-xs text-gray-500 font-sans mt-0.5">
                  Record a credit settlement for {settlingCustomer.customer_name}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettlingCustomer(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-600 font-sans">Current Outstanding:</span>
              <span className="font-mono tabular-nums font-bold text-gray-900">
                {formatCurrency(settlingCustomer.outstanding)}
              </span>
            </div>

            <form onSubmit={handleSettleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1 font-sans">
                  Settlement Amount (ETB) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={settlingCustomer.outstanding}
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono tabular-nums text-sm text-gray-900 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1 font-sans">
                  Payment Method *
                </label>
                <select
                  value={settlePaymentMethod}
                  onChange={(e) => setSettlePaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-sans text-gray-900 bg-white focus:outline-none focus:border-gray-400 transition-colors"
                >
                  <option value="cash">Cash Tender</option>
                  <option value="telebirr">Telebirr</option>
                  <option value="cbe">Bank Transfer / CBE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1 font-sans">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="e.g. Cleared November balance via Telebirr"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-gray-400 transition-colors font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettlingCustomer(null)}
                  className="px-4 py-2 border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSettling}
                  className="px-4 py-2 bg-[#234233] hover:bg-[#1A3327] text-white rounded-md text-xs font-medium transition-colors shadow-2xs cursor-pointer font-sans disabled:opacity-50"
                >
                  {isSettling ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsView;
