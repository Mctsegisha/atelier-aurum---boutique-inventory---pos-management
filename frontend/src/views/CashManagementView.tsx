import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api.ts';
import { CashSession } from '../types.ts';
import { formatCurrency } from '../lib/currency.ts';
import { SkeletonBar, SkeletonTableRows } from '../components/common/SkeletonLoader.tsx';
import {
  Wallet,
  Clock,
  ArrowUpCircle,
  X,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export function formatSessionDuration(openedAt: string, closedAt?: string | null): string {
  const start = new Date(openedAt).getTime();
  const end = closedAt ? new Date(closedAt).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);
  const totalMins = Math.floor(diffMs / (1000 * 60));

  if (!closedAt && totalMins < 1) {
    return 'less than a minute';
  }
  const effectiveMins = closedAt && totalMins < 1 ? 1 : totalMins;
  const hours = Math.floor(effectiveMins / 60);
  const mins = effectiveMins % 60;
  return `${hours}h ${mins}m`;
}

export function formatSessionDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${month} ${day}, ${year} ${hours}:${minutes}`;
}

export function CashManagementView() {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [history, setHistory] = useState<CashSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Live timer tick to keep duration accurate
  const [, setTick] = useState<number>(0);

  // Close Session Modal state
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [countedCash, setCountedCash] = useState<string>('0.00');
  const [closeNotes, setCloseNotes] = useState<string>('');
  const [isClosing, setIsClosing] = useState<boolean>(false);

  // Open Session Modal state
  const [showOpenModal, setShowOpenModal] = useState<boolean>(false);
  const [openingFloat, setOpeningFloat] = useState<string>('1000.00');
  const [openNotes, setOpenNotes] = useState<string>('');
  const [isOpening, setIsOpening] = useState<boolean>(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getCashSessions();
      setActiveSession(res.active_session || null);
      setHistory(Array.isArray(res.history) ? res.history : []);
    } catch (err: any) {
      console.error('[CashManagement loadData error]', err);
      setError(err.message || 'Failed to load cash sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpening(true);
    setError(null);
    try {
      const floatVal = parseFloat(openingFloat) || 1000.0;
      const res = await api.openCashSession({
        opening_float: floatVal,
        notes: openNotes.trim() || undefined
      });
      setActiveSession(res.session);
      setShowOpenModal(false);
      setOpenNotes('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to open cash session');
    } finally {
      setIsOpening(false);
    }
  };

  const handleOpenCloseModal = () => {
    if (!activeSession) return;
    setCountedCash('0.00');
    setCloseNotes('');
    setShowCloseModal(true);
  };

  const handleCloseSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    setIsClosing(true);
    try {
      const closingVal = parseFloat(countedCash) || 0.0;
      await api.closeCashSession(activeSession.id, {
        closing_cash: closingVal,
        notes: closeNotes.trim() || undefined
      });
      setShowCloseModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to close cash session');
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 w-full space-y-6 font-sans">
      {/* 1. Page Header & Subtitle */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 font-sans tracking-tight">Cash Management</h1>
        <p className="text-xs text-gray-500 font-sans mt-0.5">
          Track cash sessions and reconcile daily balances.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="text-xs font-semibold underline text-red-800 hover:text-red-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Current Session Card (State A vs State C) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Top Header Row of Card */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-800">
            <Wallet className="w-4 h-4 stroke-[1.8]" />
            <span className="text-sm font-bold text-gray-900 font-sans">Current Session</span>
          </div>

          {activeSession ? (
            <span className="text-xs font-semibold text-[#16803d] font-sans">
              Session Active
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-gray-500 text-[11px] font-medium font-sans border border-gray-200/60">
              No Active Session
            </span>
          )}
        </div>

        {/* Card Body */}
        {isLoading ? (
          <div className="p-5 space-y-4" aria-hidden="true">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-gray-200/80 bg-white flex items-center gap-3.5">
                  <SkeletonBar className="h-10 w-10 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <SkeletonBar className="h-2.5 w-20" />
                    <SkeletonBar className="h-5 w-28" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeSession ? (
          /* STATE A: ACTIVE SESSION VIEW (Reference Image 1) */
          <div className="p-5 space-y-5">
            {/* Top 3-Column Row: Opening Float, Time Open, Opened By */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Opening Float */}
              <div className="p-4 rounded-xl border border-gray-200/80 bg-white flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#EBF3EE] text-[#16803d] flex items-center justify-center font-bold text-base font-sans shrink-0">
                  $
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-sans block leading-tight">Opening Float</span>
                  <span className="text-base font-bold text-gray-900 font-mono tabular-nums leading-tight mt-1 block">
                    {formatCurrency(activeSession.opening_float)}
                  </span>
                </div>
              </div>

              {/* Card 2: Time Open */}
              <div className="p-4 rounded-xl border border-gray-200/80 bg-white flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-sans block leading-tight">Time Open</span>
                  <span className="text-base font-medium text-gray-900 font-mono tabular-nums leading-tight mt-1 block">
                    {formatSessionDuration(activeSession.opened_at, activeSession.closed_at)}
                  </span>
                </div>
              </div>

              {/* Card 3: Opened By */}
              <div className="p-4 rounded-xl border border-gray-200/80 bg-white flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0">
                  <ArrowUpCircle className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-sans block leading-tight">Opened By</span>
                  <span className="text-sm font-bold text-gray-900 font-sans leading-tight mt-1 block truncate">
                    {activeSession.opened_by_name || user?.full_name || 'Staff'}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle 4-Column Breakdown Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200/80 border-t border-b border-gray-200/80 py-3.5">
              <div className="px-4 py-1">
                <span className="text-xs text-gray-500 font-sans block">Cash sales</span>
                <span className="text-base font-bold text-gray-900 font-mono tabular-nums mt-1 block">
                  {formatCurrency(activeSession.cash_sales)}
                </span>
              </div>

              <div className="px-4 py-1">
                <span className="text-xs text-gray-500 font-sans block">Telebirr sales</span>
                <span className="text-base font-bold text-gray-900 font-mono tabular-nums mt-1 block">
                  {formatCurrency(activeSession.telebirr_sales)}
                </span>
              </div>

              <div className="px-4 py-1">
                <span className="text-xs text-gray-500 font-sans block">Total sales</span>
                <span className="text-base font-bold text-gray-900 font-mono tabular-nums mt-1 block">
                  {formatCurrency(activeSession.total_sales)}
                </span>
              </div>

              <div className="px-4 py-1">
                <span className="text-xs text-gray-500 font-sans block">Should be in drawer</span>
                <span className="text-base font-bold text-gray-900 font-mono tabular-nums mt-1 block">
                  {formatCurrency(activeSession.expected_cash)}
                </span>
              </div>
            </div>

            {/* Helper Text & Action Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <p className="text-xs text-gray-400 font-sans">
                Telebirr never enters the drawer, so only cash is counted against it.
              </p>

              <button
                type="button"
                onClick={handleOpenCloseModal}
                className="px-4 py-2 bg-[#9E3127] hover:bg-[#85271F] text-white rounded-md text-xs font-medium transition-colors shadow-xs cursor-pointer self-end sm:self-auto"
              >
                Close Session
              </button>
            </div>
          </div>
        ) : (
          /* STATE C: NO ACTIVE SESSION VIEW (Reference Image 3) */
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#EBF3EE] text-[#245239] flex items-center justify-center shadow-xs">
              <Wallet className="w-5 h-5 stroke-[2]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-900 font-sans">No Active Session</h3>
              <p className="text-xs text-gray-500 font-sans max-w-sm">
                Open a cash session to start tracking today&apos;s cash flow.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowOpenModal(true)}
              className="mt-2 px-4 py-2 bg-[#234233] hover:bg-[#1A3327] text-white rounded-md text-xs font-medium transition-colors shadow-xs cursor-pointer"
            >
              Open Session
            </button>
          </div>
        )}
      </div>

      {/* 3. Session History Table (Synced Across All States) */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-900 font-sans tracking-tight">Session History</h2>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-gray-100">
              <thead className="bg-[#FAF9F7] text-gray-500 uppercase tracking-wider text-[10px] font-sans font-semibold">
                <tr>
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4">OPENED BY</th>
                  <th className="py-3 px-4">DURATION</th>
                  <th className="py-3 px-4">OPENING</th>
                  <th className="py-3 px-4">TOTAL SALES</th>
                  <th className="py-3 px-4">EXPECTED</th>
                  <th className="py-3 px-4">CLOSING</th>
                  <th className="py-3 px-4">DIFF</th>
                  <th className="py-3 px-4">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <SkeletonTableRows cols={9} rows={5} />
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-gray-400 font-sans">
                      No cash sessions recorded yet.
                    </td>
                  </tr>
                ) : (
                  history.map((session) => {
                    const isOpen = session.status === 'open';
                    const diff = session.difference !== null && session.difference !== undefined ? session.difference : null;

                    return (
                      <tr key={session.id} className="hover:bg-gray-50/60 transition-colors">
                        {/* DATE */}
                        <td className="py-3.5 px-4 font-sans text-gray-800 whitespace-nowrap">
                          {formatSessionDate(session.opened_at)}
                        </td>

                        {/* OPENED BY */}
                        <td className="py-3.5 px-4 font-sans text-gray-800 whitespace-nowrap">
                          {session.opened_by_name || 'Staff'}
                        </td>

                        {/* DURATION */}
                        <td className="py-3.5 px-4 font-mono tabular-nums text-gray-600 whitespace-nowrap">
                          {formatSessionDuration(session.opened_at, session.closed_at)}
                        </td>

                        {/* OPENING */}
                        <td className="py-3.5 px-4 font-mono tabular-nums text-gray-900 font-semibold whitespace-nowrap">
                          {formatCurrency(session.opening_float)}
                        </td>

                        {/* TOTAL SALES */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-mono tabular-nums text-gray-900 font-semibold block">
                            {formatCurrency(session.total_sales)}
                          </span>
                          {Number(session.telebirr_sales || 0) > 0 && (
                            <span className="text-[10px] text-gray-400 font-mono tabular-nums block mt-0.5">
                              Telebirr sales {formatCurrency(session.telebirr_sales)}
                            </span>
                          )}
                        </td>

                        {/* EXPECTED */}
                        <td className="py-3.5 px-4 font-mono tabular-nums text-gray-900 font-semibold whitespace-nowrap">
                          {formatCurrency(session.expected_cash)}
                        </td>

                        {/* CLOSING */}
                        <td className="py-3.5 px-4 font-mono tabular-nums text-gray-900 font-semibold whitespace-nowrap">
                          {isOpen ? (
                            <span className="text-gray-400 font-normal">--</span>
                          ) : session.closing_cash !== null && session.closing_cash !== undefined ? (
                            formatCurrency(session.closing_cash)
                          ) : (
                            '--'
                          )}
                        </td>

                        {/* DIFF */}
                        <td className="py-3.5 px-4 font-mono tabular-nums whitespace-nowrap">
                          {isOpen ? (
                            <span className="text-gray-400 font-normal">--</span>
                          ) : diff !== null ? (
                            diff >= 0 ? (
                              <span className="text-[#16803d] font-semibold">
                                +{formatCurrency(diff)}
                              </span>
                            ) : (
                              <span className="text-[#DC2626] font-semibold">
                                -{formatCurrency(Math.abs(diff))}
                              </span>
                            )
                          ) : (
                            '--'
                          )}
                        </td>

                        {/* STATUS */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isOpen ? (
                            <span className="text-[#16803d] text-xs font-medium font-sans">
                              Open
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium font-sans">
                              Closed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* STATE B: CLOSE CASH SESSION MODAL (Reference Image 2)           */}
      {/* ============================================================== */}
      {showCloseModal && activeSession && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-gray-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            {/* Modal Header with Close (x) button */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-sans">Close Cash Session</h3>
                <p className="text-xs text-gray-500 font-sans mt-0.5">
                  Count the cash in your register and enter the total below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary Box (4 stacked rows in a bordered container) */}
            <div className="border border-gray-200 rounded-lg p-3.5 space-y-2.5 bg-white">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-700 font-sans">Opening Float</span>
                <span className="font-mono tabular-nums text-gray-900 font-semibold">
                  {formatCurrency(activeSession.opening_float)}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-700 font-sans">Total sales</span>
                <span className="font-mono tabular-nums text-gray-900 font-semibold">
                  {formatCurrency(activeSession.total_sales)}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs pl-3">
                <span className="text-gray-500 font-sans">Cash sales</span>
                <span className="font-mono tabular-nums text-gray-900 font-semibold">
                  {formatCurrency(activeSession.cash_sales)}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs pt-2.5 border-t border-gray-100">
                <span className="font-bold text-gray-900 font-sans">Should be in drawer</span>
                <span className="font-bold font-mono tabular-nums text-gray-900 text-sm">
                  {formatCurrency(activeSession.expected_cash)}
                </span>
              </div>
            </div>

            {/* Form Inputs */}
            <form onSubmit={handleCloseSessionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1 font-sans">
                  Counted Cash (ETB)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono tabular-nums text-sm text-gray-900 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1 font-sans">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Any notes about the session..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-gray-400 transition-colors font-sans"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isClosing}
                  className="px-4 py-2 bg-[#BA7067] hover:bg-[#A8635B] text-white rounded-md text-xs font-medium transition-colors shadow-xs cursor-pointer font-sans disabled:opacity-50"
                >
                  {isClosing ? 'Closing...' : 'Close Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* OPEN CASH SESSION MODAL (Triggered from State C)               */}
      {/* ============================================================== */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-gray-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-sans">Open Cash Session</h3>
                <p className="text-xs text-gray-500 font-sans mt-0.5">
                  Set the starting cash float for the register drawer.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOpenModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleOpenSessionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1 font-sans">
                  Opening Float (ETB) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  placeholder="1000.00"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono tabular-nums text-sm text-gray-900 focus:outline-none focus:border-gray-400 transition-colors"
                />
                <span className="text-[11px] text-gray-400 mt-1 block font-sans">
                  Default: 1,000.00 ETB
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1 font-sans">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  placeholder="e.g. Morning drawer register opening"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-gray-400 transition-colors font-sans"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isOpening}
                  className="px-4 py-2 bg-[#234233] hover:bg-[#1A3327] text-white rounded-md text-xs font-medium transition-colors shadow-xs cursor-pointer font-sans disabled:opacity-50"
                >
                  {isOpening ? 'Opening...' : 'Open Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Re-export as default and ShiftView for backwards-compatible routing
export default CashManagementView;
export { CashManagementView as ShiftView };
