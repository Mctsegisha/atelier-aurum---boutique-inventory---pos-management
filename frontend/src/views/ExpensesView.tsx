import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api.ts';
import { Expense } from '../types.ts';
import { formatCurrency } from '../lib/currency.ts';
import {
  Plus,
  Calendar,
  Trash2,
  X,
  Check,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Electricity',
  'Internet & phone',
  'Licences & fees',
  'Maintenance',
  'Other',
  'Rent',
  'Salaries',
  'Transport',
  'Water',
  'Sample operating costs',
  'Sample rent'
];

export function ExpensesView() {
  const { role, user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; description?: string }[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal: Record an Expense
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Custom Category Creation (+ Button)
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [isCreatingCategory, setIsCreatingCategory] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, [selectedCat]);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [exps, cats] = await Promise.all([
        api.getExpenses({ categoryId: selectedCat }),
        api.getExpenseCategories()
      ]);
      setExpenses(Array.isArray(exps) ? exps : []);

      // Merge and ensure all 11 default categories exist in list
      const loadedCats = Array.isArray(cats) ? [...cats] : [];
      for (const defName of DEFAULT_EXPENSE_CATEGORIES) {
        if (!loadedCats.some(c => c.name.toLowerCase() === defName.toLowerCase())) {
          loadedCats.push({
            id: `ec_${defName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            name: defName
          });
        }
      }
      loadedCats.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(loadedCats);
    } catch (err: any) {
      console.error('[ExpensesView loadData error]', err);
      setErrorMessage(err.message || 'Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    setIsCreatingCategory(true);
    try {
      const created = await api.createExpenseCategory({ name: trimmed });
      const newCat = {
        id: created.id || `ec_${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: created.name || trimmed
      };

      setCategories(prev => {
        const next = [...prev.filter(c => c.name.toLowerCase() !== newCat.name.toLowerCase()), newCat];
        next.sort((a, b) => a.name.localeCompare(b.name));
        return next;
      });

      setCategoryId(newCat.id);
      setNewCategoryName('');
      setIsAddingCustomCategory(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      alert('Please choose an expense category.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCategoryObj = categories.find(c => c.id === categoryId);
      const catName = selectedCategoryObj?.name || 'Operating Expense';
      const noteTrimmed = note.trim();

      await api.createExpense({
        category_id: categoryId,
        amount: numAmount,
        expense_date: expenseDate,
        date: expenseDate,
        note: noteTrimmed || undefined,
        description: noteTrimmed || undefined,
        title: noteTrimmed ? `${catName} - ${noteTrimmed}` : catName
      });

      setShowAddModal(false);
      setAmount('');
      setNote('');
      setCategoryId('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      await loadData();
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
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-gray-200">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-[#B89B65] font-semibold font-sans">
            Store Operational Disbursements
          </span>
          <h1 className="text-2xl font-bold font-sans text-gray-900 mt-0.5 tracking-tight">Operating Expenses</h1>
          <p className="text-xs text-gray-500 font-sans mt-0.5">
            Track store utilities, packaging, supplies, maintenance, and operating costs.
          </p>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-sans">Period Total</span>
            <p className="text-xl font-bold font-mono text-gray-900 tabular-nums mt-0.5">
              {formatCurrency(totalExpenseAmount)}
            </p>
          </div>

          <button
            onClick={() => {
              setAmount('');
              setNote('');
              setCategoryId('');
              setExpenseDate(new Date().toISOString().split('T')[0]);
              setIsAddingCustomCategory(false);
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-[#234233] hover:bg-[#1A3327] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer font-sans"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between font-sans">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={loadData}
            className="text-xs font-semibold underline text-red-800 hover:text-red-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Categories Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        <button
          onClick={() => setSelectedCat('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer font-sans ${
            selectedCat === 'all'
              ? 'bg-[#234233] text-white shadow-xs'
              : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          All Categories
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer font-sans ${
              selectedCat === c.id
                ? 'bg-[#234233] text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-gray-100">
            <thead className="bg-[#FAF9F7] text-gray-500 uppercase tracking-wider text-[10px] font-sans font-semibold">
              <tr>
                <th className="py-3 px-4">Expense / Category</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Note / Details</th>
                <th className="py-3 px-4">Recorded By</th>
                <th className="py-3 px-4">Amount</th>
                {role === 'admin' && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-sans">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-gray-300" />
                      <span>Loading expense records...</span>
                    </div>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-sans">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                expenses.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-xs text-gray-900">{e.title}</p>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-gray-700">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px]">
                        {e.category_name}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-gray-600 font-sans">
                      {e.expense_date}
                    </td>

                    <td className="py-3.5 px-4 text-gray-600">
                      {e.description ? (
                        <span className="text-[11px] text-gray-600 line-clamp-1">{e.description}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-gray-600">
                      {e.recorded_by_name || 'Staff'}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-gray-900 tabular-nums">
                      {formatCurrency(e.amount)}
                    </td>

                    {role === 'admin' && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteExpense(e.id, e.title)}
                          title="Delete expense"
                          className="p-1.5 text-gray-400 hover:text-red-700 rounded-md transition-colors cursor-pointer"
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
      {/* MODAL: Record an expense (Exact match to specification)        */}
      {/* ============================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-gray-200 max-w-md w-full p-6 space-y-5 shadow-2xl">
            {/* 1. Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-sans">Record an expense</h3>
                <p className="text-xs text-gray-500 font-sans mt-0.5">
                  This comes off gross profit to give the net figure in Reports.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Form Fields */}
            <form onSubmit={handleCreateExpense} className="space-y-4">
              {/* Category Field with paired square + button */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1 font-sans">
                  Category *
                </label>

                {isAddingCustomCategory ? (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-100">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Enter new category name..."
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateCategory();
                        } else if (e.key === 'Escape') {
                          setIsAddingCustomCategory(false);
                          setNewCategoryName('');
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-gray-500 font-sans"
                    />
                    <button
                      type="button"
                      disabled={isCreatingCategory || !newCategoryName.trim()}
                      onClick={() => handleCreateCategory()}
                      className="px-3 py-2 bg-[#234233] hover:bg-[#1A3327] text-white rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 shrink-0 font-sans"
                    >
                      {isCreatingCategory ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCustomCategory(false);
                        setNewCategoryName('');
                      }}
                      className="p-2 border border-gray-300 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <select
                      required
                      value={categoryId}
                      onChange={e => setCategoryId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-gray-500 bg-white font-sans cursor-pointer"
                    >
                      <option value="">Choose a category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setIsAddingCustomCategory(true)}
                      title="Add a new custom category"
                      className="w-9 h-9 border border-gray-300 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Amount (ETB) */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1 font-sans">
                  Amount (ETB) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono tabular-nums text-sm text-gray-900 focus:outline-none focus:border-gray-500 transition-colors"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1 font-sans">
                  Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={e => setExpenseDate(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-gray-500 transition-colors font-sans"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Note (optional) */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1 font-sans">
                  Note (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. September rent"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-gray-500 transition-colors font-sans"
                />
              </div>

              {/* 3. Footer */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#234233] hover:bg-[#1A3327] text-white rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer font-sans disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Record expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpensesView;
