import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api.ts';
import { Expense } from '../types.ts';
import { formatCurrency } from '../lib/currency.ts';
import {
  ReceiptText,
  Plus,
  DollarSign,
  Calendar,
  CreditCard,
  Trash2,
  X,
  FileCheck
} from 'lucide-react';

export function ExpensesView() {
  const { role, user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal Add Expense
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<number>(150);
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, [selectedCat]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [exps, cats] = await Promise.all([
        api.getExpenses({ categoryId: selectedCat }),
        api.getExpenseCategories()
      ]);
      setExpenses(exps);
      setCategories(cats);
      if (cats.length > 0 && !categoryId) {
        setCategoryId(cats[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;
    setIsSubmitting(true);

    try {
      await api.createExpense({
        category_id: categoryId,
        title: title.trim(),
        description: description.trim() || undefined,
        amount: Number(amount),
        payment_method: paymentMethod,
        expense_date: expenseDate
      });
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string, expTitle: string) => {
    if (!confirm(`Delete expense record "${expTitle}"?`)) return;
    try {
      await api.deleteExpense(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E0D8]">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#B89B65] font-medium">
            Store Operational Disbursements
          </span>
          <h1 className="text-3xl font-serif font-medium text-[#1A1A1A] mt-1">Operating Expenses</h1>
          <p className="text-xs text-[#716D66] mt-1">
            Track store utilities, packaging, supplies, maintenance, and operating costs.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-[#716D66]">Period Total</span>
            <p className="text-2xl font-serif font-semibold text-[#1A1A1A] tabular-nums mt-0.5">
              {formatCurrency(totalExpenseAmount)}
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#1A1A1A] text-white hover:bg-[#B89B65] rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCat('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
            selectedCat === 'all'
              ? 'bg-[#1A1A1A] text-[#F9F8F6]'
              : 'bg-white border border-[#E5E0D8] text-[#59554F] hover:text-[#1A1A1A]'
          }`}
        >
          All Expense Categories
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              selectedCat === c.id
                ? 'bg-[#1A1A1A] text-[#F9F8F6]'
                : 'bg-white border border-[#E5E0D8] text-[#59554F] hover:text-[#1A1A1A]'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-[#E5E0D8]">
            <thead className="bg-[#F9F8F6] text-[#716D66] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Expense Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Recorded By</th>
                <th className="py-3 px-4">Amount</th>
                {role === 'admin' && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE8]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#716D66]">
                    Loading expense records...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#716D66]">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                expenses.map(e => (
                  <tr key={e.id} className="hover:bg-[#F9F8F6]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-sm text-[#1A1A1A]">{e.title}</p>
                      {e.description && (
                        <p className="text-[11px] text-[#716D66] mt-0.5 line-clamp-1">{e.description}</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-[#59554F]">
                      {e.category_name}
                    </td>

                    <td className="py-3.5 px-4 text-[#716D66]">
                      {e.expense_date}
                    </td>

                    <td className="py-3.5 px-4 capitalize text-[#59554F]">
                      {e.payment_method.replace('_', ' ')}
                    </td>

                    <td className="py-3.5 px-4 text-[#716D66]">
                      {e.recorded_by_name || 'Staff'}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-sm text-[#1A1A1A] tabular-nums">
                      {formatCurrency(e.amount)}
                    </td>

                    {role === 'admin' && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteExpense(e.id, e.title)}
                          className="p-1.5 text-[#8C8275] hover:text-red-700 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: Add Expense                                             */}
      {/* ============================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#E5E0D8] max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
              <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">Record Operational Expense</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#716D66] hover:text-[#1A1A1A] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#59554F] font-medium mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Orchids & Peonies for Dressing Salon"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#59554F] font-medium mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#59554F] font-medium mb-1">Amount (ETB) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65] font-bold tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#59554F] font-medium mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none"
                  >
                    <option value="card">Corporate Card</option>
                    <option value="bank_transfer">Wire / Bank Transfer</option>
                    <option value="cash">Petty Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#59554F] font-medium mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={e => setExpenseDate(e.target.value)}
                    className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#59554F] font-medium mb-1">Description / Vendor Details</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Weekly vendor delivery from Midtown Florist..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E0D8]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#E5E0D8] rounded hover:bg-[#F9F8F6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#B89B65] text-white rounded font-medium transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Recording...' : 'Record Disbursement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
