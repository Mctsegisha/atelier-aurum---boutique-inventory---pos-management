import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api.ts';
import { Shift } from '../types.ts';
import { formatCurrency } from '../lib/currency.ts';
import {
  Clock,
  Banknote,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Play,
  Square
} from 'lucide-react';

export function ShiftView() {
  const { user } = useAuth();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Open Shift Form
  const [startingCash, setStartingCash] = useState<number>(200);
  const [openNotes, setOpenNotes] = useState<string>('Morning register opening float');

  // Close Shift Form
  const [endingCash, setEndingCash] = useState<number>(200);
  const [closeNotes, setCloseNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadShift();
  }, []);

  const loadShift = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCurrentShift();
      setActiveShift(res.shift);
      if (res.shift) {
        setEndingCash(res.shift.starting_cash + (res.shift.cash_sales || 0));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.startShift({ starting_cash: Number(startingCash), notes: openNotes });
      setActiveShift(res);
    } catch (err: any) {
      alert(err.message || 'Failed to start shift');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to reconcile cash and close this shift?')) return;
    setIsSubmitting(true);
    try {
      await api.closeShift({ ending_cash: Number(endingCash), notes: closeNotes });
      setActiveShift(null);
      alert('Shift reconciled and closed successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to close shift');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-[#E5E0D8]">
        <span className="text-xs uppercase tracking-widest text-[#B89B65] font-medium">
          POS Terminal Register
        </span>
        <h1 className="text-3xl font-serif font-medium text-[#1A1A1A] mt-1">Shift & Cash Reconciliation</h1>
        <p className="text-xs text-[#716D66] mt-1">
          Open your daily register with a counted cash drawer float and reconcile end-of-shift receipts.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-xs text-[#716D66]">
          Loading active shift session...
        </div>
      ) : activeShift ? (
        /* ACTIVE SHIFT VIEW */
        <div className="bg-white rounded-xl border border-[#E5E0D8] p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
            <div className="flex items-center gap-2 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider">Shift Active & Open</span>
            </div>
            <span className="text-xs text-[#716D66] font-mono">
              Started: {new Date(activeShift.start_time).toLocaleTimeString()}
            </span>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#F9F8F6] rounded-lg border border-[#E5E0D8]">
              <span className="text-[11px] text-[#716D66] uppercase block">Opening Cash Float</span>
              <p className="text-2xl font-serif font-bold text-[#1A1A1A] tabular-nums mt-0.5">
                {formatCurrency(activeShift.starting_cash)}
              </p>
            </div>

            <div className="p-4 bg-[#F9F8F6] rounded-lg border border-[#E5E0D8]">
              <span className="text-[11px] text-[#716D66] uppercase block">Total Sales Processed</span>
              <p className="text-2xl font-serif font-bold text-[#B89B65] tabular-nums mt-0.5">
                {formatCurrency(activeShift.total_sales)}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-[#59554F]">
              <span>Cash Sales:</span>
              <span className="font-semibold text-[#1A1A1A] tabular-nums">{formatCurrency(activeShift.cash_sales)}</span>
            </div>
            <div className="flex justify-between text-[#59554F]">
              <span>Credit Card & Contactless:</span>
              <span className="font-semibold text-[#1A1A1A] tabular-nums">{formatCurrency(activeShift.card_sales)}</span>
            </div>
            <div className="flex justify-between text-[#59554F] pt-2 border-t border-[#E5E0D8]">
              <span>Expected Cash in Drawer:</span>
              <span className="font-bold text-[#1A1A1A] tabular-nums">
                {formatCurrency(Number(activeShift.starting_cash || 0) + Number(activeShift.cash_sales || 0))}
              </span>
            </div>
          </div>

          {/* Close Shift Form */}
          <form onSubmit={handleCloseShift} className="pt-4 border-t border-[#E5E0D8] space-y-3 text-xs">
            <span className="font-semibold text-[#1A1A1A] block">Close Register & Count Cash</span>
            <div>
              <label className="block text-[#59554F] font-medium mb-1">Physical Cash Count in Drawer (ETB) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={endingCash}
                onChange={e => setEndingCash(Number(e.target.value))}
                className="w-full p-2.5 border border-[#E5E0D8] rounded text-base font-bold tabular-nums focus:outline-none focus:border-[#B89B65]"
              />
            </div>

            <div>
              <label className="block text-[#59554F] font-medium mb-1">Reconciliation Notes</label>
              <input
                type="text"
                placeholder="e.g. Balanced drawer; all receipts verified."
                value={closeNotes}
                onChange={e => setCloseNotes(e.target.value)}
                className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Reconcile Drawer & Close Shift</span>
            </button>
          </form>
        </div>
      ) : (
        /* OPEN NEW SHIFT */
        <div className="bg-white rounded-xl border border-[#E5E0D8] p-6 shadow-xs space-y-5">
          <div className="text-center space-y-1">
            <Clock className="w-8 h-8 text-[#B89B65] mx-auto stroke-[1.5]" />
            <h3 className="font-serif text-xl font-semibold text-[#1A1A1A]">Open Register Session</h3>
            <p className="text-xs text-[#716D66]">Count your opening cash drawer float to start taking sales</p>
          </div>

          <form onSubmit={handleStartShift} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#59554F] font-medium mb-1">Starting Cash Float (ETB) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={startingCash}
                onChange={e => setStartingCash(Number(e.target.value))}
                className="w-full p-2.5 border border-[#E5E0D8] rounded text-base font-bold tabular-nums focus:outline-none focus:border-[#B89B65]"
              />
            </div>

            <div>
              <label className="block text-[#59554F] font-medium mb-1">Session Notes</label>
              <input
                type="text"
                value={openNotes}
                onChange={e => setOpenNotes(e.target.value)}
                className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#1A1A1A] hover:bg-[#B89B65] text-white rounded-lg text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>Start Register Shift</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
