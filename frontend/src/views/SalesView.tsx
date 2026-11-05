import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api.ts';
import { Sale } from '../types.ts';
import { formatCurrency } from '../lib/currency.ts';
import {
  Receipt,
  Search,
  Filter,
  RotateCcw,
  Printer,
  ChevronRight,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export function SalesView() {
  const { role, user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selected Sale for Detail Modal
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<{ sale: Sale; items: any[]; payments: any[]; refunds: any[] } | null>(null);

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState<boolean>(false);
  const [refundReason, setRefundReason] = useState<string>('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [restockChecked, setRestockChecked] = useState<boolean>(true);
  const [isRefunding, setIsRefunding] = useState<boolean>(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  useEffect(() => {
    loadSales();
  }, [paymentMethodFilter, statusFilter]);

  const loadSales = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSales({
        paymentMethod: paymentMethodFilter,
        status: statusFilter
      });
      setSales(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDetail = async (saleId: string) => {
    try {
      const detail = await api.getSaleDetails(saleId);
      setSelectedSaleDetail(detail);
      setRefundAmount(detail.sale.total_amount - (detail.sale.refunded_amount || 0));
    } catch (err: any) {
      alert(err.message || 'Failed to load transaction detail');
    }
  };

  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleDetail) return;
    if (!refundReason.trim()) {
      setRefundError('A mandatory reason is required for processing returns.');
      return;
    }

    setIsRefunding(true);
    setRefundError(null);

    try {
      await api.refundSale(selectedSaleDetail.sale.id, {
        reason: refundReason.trim(),
        refund_amount: Number(refundAmount),
        items: selectedSaleDetail.items.map(it => ({
          sale_item_id: it.id,
          variant_id: it.variant_id,
          quantity: it.quantity,
          restock: restockChecked,
          refund_amount: it.total
        }))
      });

      setShowRefundModal(false);
      setRefundReason('');
      handleOpenDetail(selectedSaleDetail.sale.id);
      loadSales();
    } catch (err: any) {
      setRefundError(err.message || 'Refund authorization failed');
    } finally {
      setIsRefunding(false);
    }
  };

  const filteredSales = sales.filter(s =>
    !search ||
    s.receipt_number.toLowerCase().includes(search.toLowerCase()) ||
    s.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.customer_phone?.includes(search)
  );

  const totalRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E0D8]">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#B89B65] font-medium">
            {role === 'sales' ? 'Personal Register History' : 'Boutique Transaction Ledger'}
          </span>
          <h1 className="text-3xl font-serif font-medium text-[#1A1A1A] mt-1">
            {role === 'sales' ? 'My Completed Sales' : 'Sales, Invoices & Refunds'}
          </h1>
          <p className="text-xs text-[#716D66] mt-1">
            {role === 'sales'
              ? 'Review your processed receipts and customer tender.'
              : 'Audit store receipts, tender settlements, and authorized return requests.'}
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] uppercase tracking-wider text-[#716D66]">Period Sales Total</span>
          <p className="text-2xl font-serif font-semibold text-[#1A1A1A] tabular-nums mt-0.5">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8C8275] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by receipt number (e.g. HIR-2026-...) or client name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E0D8] rounded-md text-xs focus:outline-none focus:border-[#B89B65]"
          />
        </div>

        <select
          value={paymentMethodFilter}
          onChange={e => setPaymentMethodFilter(e.target.value)}
          className="bg-white border border-[#E5E0D8] rounded-md text-xs px-3 py-2 focus:outline-none"
        >
          <option value="all">All Payment Tenders</option>
          <option value="card">Credit Card</option>
          <option value="cash">Cash Tender</option>
          <option value="mobile">Apple Pay / Mobile</option>
          <option value="transfer">Bank Transfer</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-white border border-[#E5E0D8] rounded-md text-xs px-3 py-2 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed Only</option>
          <option value="refunded">Refunded / Returns</option>
        </select>
      </div>

      {/* Sales Table */}
      <div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-[#E5E0D8]">
            <thead className="bg-[#F9F8F6] text-[#716D66] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date & Time</th>
                {role !== 'sales' && <th className="py-3 px-4">Sales Staff</th>}
                <th className="py-3 px-4">VIP Client</th>
                <th className="py-3 px-4">Tender</th>
                <th className="py-3 px-4">Subtotal</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE8]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#716D66]">
                    Loading sales records...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#716D66]">
                    No sales found matching search.
                  </td>
                </tr>
              ) : (
                filteredSales.map(s => {
                  const isRefunded = s.payment_status === 'refunded' || s.is_refunded;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => handleOpenDetail(s.id)}
                      className="hover:bg-[#F9F8F6] transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-[#1A1A1A]">
                        {s.receipt_number}
                      </td>

                      <td className="py-3.5 px-4 text-[#716D66]">
                        {new Date(s.created_at).toLocaleDateString()} {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {role !== 'sales' && (
                        <td className="py-3.5 px-4 text-[#1A1A1A] font-medium">
                          {s.cashier_name || 'Staff'}
                        </td>
                      )}

                      <td className="py-3.5 px-4 text-[#59554F]">
                        {s.customer_name ? (
                          <span className="font-medium text-[#1A1A1A]">{s.customer_name}</span>
                        ) : (
                          <span className="text-[#8C8275] italic">Guest Walk-In</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 capitalize text-[#59554F]">
                        {s.payment_method}
                      </td>

                      <td className="py-3.5 px-4 text-[#716D66] tabular-nums">
                        {formatCurrency(s.subtotal)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[#1A1A1A] tabular-nums">
                        {formatCurrency(s.total_amount)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                          isRefunded
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {s.payment_status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 text-[#B89B65] font-medium">
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: Transaction Details & Return/Refund Authorization       */}
      {/* ============================================================== */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#E5E0D8] max-w-xl w-full p-6 space-y-5 shadow-2xl my-6">
            <div className="flex items-start justify-between border-b border-[#E5E0D8] pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#716D66]">Transaction Slip</span>
                <h3 className="font-serif text-xl font-semibold text-[#1A1A1A] mt-0.5">
                  Receipt #{selectedSaleDetail.sale.receipt_number}
                </h3>
                <p className="text-xs text-[#716D66]">
                  {new Date(selectedSaleDetail.sale.created_at).toLocaleString()} · Cashier: {selectedSaleDetail.sale.cashier_name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 border border-[#E5E0D8] hover:bg-[#F9F8F6] rounded text-[#1A1A1A] cursor-pointer"
                  title="Print Slip"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedSaleDetail(null)}
                  className="text-[#716D66] hover:text-[#1A1A1A] p-2 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Client Info */}
            {selectedSaleDetail.sale.customer_name && (
              <div className="p-3 bg-[#F9F8F6] rounded-lg border border-[#E5E0D8] text-xs">
                <span className="text-[10px] uppercase tracking-wider text-[#716D66] font-medium block">
                  VIP Client Attached
                </span>
                <p className="font-serif text-sm font-semibold text-[#1A1A1A] mt-0.5">{selectedSaleDetail.sale.customer_name}</p>
                <p className="text-[11px] text-[#716D66]">{selectedSaleDetail.sale.customer_phone || selectedSaleDetail.sale.customer_email}</p>
              </div>
            )}

            {/* Line Items */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#1A1A1A]">Purchased Items</span>
              <div className="divide-y divide-[#F0EDE8] border border-[#E5E0D8] rounded-lg overflow-hidden">
                {selectedSaleDetail.items.map((it, idx) => (
                  <div key={idx} className="p-3 bg-white flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-[#1A1A1A]">{it.product_name}</p>
                      <p className="text-[11px] text-[#716D66]">{it.variant_details} · Qty: {it.quantity} @ {formatCurrency(it.unit_price)}</p>
                    </div>
                    <span className="font-semibold text-[#1A1A1A] tabular-nums">{formatCurrency(it.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="p-3 bg-[#F9F8F6] rounded-lg space-y-1.5 text-xs">
              <div className="flex justify-between text-[#716D66]">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium">{formatCurrency(selectedSaleDetail.sale.subtotal)}</span>
              </div>
              {Number(selectedSaleDetail.sale.discount_amount || 0) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Courtesy Discount</span>
                  <span className="tabular-nums font-medium">-{formatCurrency(selectedSaleDetail.sale.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#716D66]">
                <span>Tax (15%)</span>
                <span className="tabular-nums font-medium">{formatCurrency(selectedSaleDetail.sale.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-sm font-serif font-bold text-[#1A1A1A] pt-1.5 border-t border-[#E5E0D8]">
                <span>Total Amount Paid</span>
                <span className="tabular-nums">{formatCurrency(selectedSaleDetail.sale.total_amount)}</span>
              </div>

              {Number(selectedSaleDetail.sale.refunded_amount || 0) > 0 && (
                <div className="flex justify-between text-xs text-rose-700 font-semibold pt-1 border-t border-rose-200">
                  <span>Total Refunded to Date:</span>
                  <span className="tabular-nums">-{formatCurrency(selectedSaleDetail.sale.refunded_amount)}</span>
                </div>
              )}
            </div>

            {/* Refund History if any */}
            {selectedSaleDetail.refunds && selectedSaleDetail.refunds.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-[#1A1A1A]">Authorized Return Record</span>
                {selectedSaleDetail.refunds.map(r => (
                  <div key={r.id} className="p-2.5 bg-rose-50/70 border border-rose-200 rounded text-xs">
                    <div className="flex justify-between font-semibold text-rose-800">
                      <span>Refunded {formatCurrency(r.refund_amount)}</span>
                      <span>By {r.authorized_by_name}</span>
                    </div>
                    <p className="text-[11px] text-rose-700 mt-1 italic">&ldquo;{r.reason}&rdquo;</p>
                  </div>
                ))}
              </div>
            )}

            {/* Actions: Process Return (Admin & Store Person) */}
            <div className="flex justify-between items-center pt-3 border-t border-[#E5E0D8]">
              {role !== 'sales' && selectedSaleDetail.sale.payment_status !== 'refunded' ? (
                <button
                  onClick={() => setShowRefundModal(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Authorize Return / Refund</span>
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="px-4 py-2 border border-[#E5E0D8] rounded text-xs hover:bg-[#F9F8F6] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Authorized Return / Refund Workflow                     */}
      {/* ============================================================== */}
      {showRefundModal && selectedSaleDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#E5E0D8] max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-rose-700 font-semibold">Store Person / Admin Override</span>
                <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">Authorize Customer Return</h3>
              </div>
              <button
                onClick={() => setShowRefundModal(false)}
                className="text-[#716D66] hover:text-[#1A1A1A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {refundError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded text-xs">
                {refundError}
              </div>
            )}

            <form onSubmit={handleConfirmRefund} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#59554F] font-medium mb-1">
                  Refund Amount (ETB) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedSaleDetail.sale.total_amount - (selectedSaleDetail.sale.refunded_amount || 0)}
                  min="0.01"
                  required
                  value={refundAmount}
                  onChange={e => setRefundAmount(Number(e.target.value))}
                  className="w-full p-2.5 border border-[#E5E0D8] rounded text-sm font-bold tabular-nums focus:outline-none focus:border-rose-500"
                />
                <span className="text-[11px] text-[#716D66] block mt-1">
                  Max refundable: {formatCurrency(Number(selectedSaleDetail.sale.total_amount || 0) - Number(selectedSaleDetail.sale.refunded_amount || 0))}
                </span>
              </div>

              <div className="flex items-center gap-2 p-3 bg-[#F9F8F6] rounded border border-[#E5E0D8]">
                <input
                  type="checkbox"
                  id="restock-cb"
                  checked={restockChecked}
                  onChange={e => setRestockChecked(e.target.checked)}
                  className="rounded text-[#B89B65] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="restock-cb" className="text-xs text-[#1A1A1A] cursor-pointer select-none">
                  Automatically return unworn items to available inventory
                </label>
              </div>

              <div>
                <label className="block text-[#59554F] font-medium mb-1">
                  Mandatory Return Reason *
                </label>
                <textarea
                  required
                  placeholder="e.g. Size exchange; Client fitting alteration preference; Defective zip fastener..."
                  rows={2}
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E0D8]">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 border border-[#E5E0D8] rounded hover:bg-[#F9F8F6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRefunding}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium transition-colors cursor-pointer"
                >
                  {isRefunding ? 'Processing...' : 'Authorize Refund & Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
