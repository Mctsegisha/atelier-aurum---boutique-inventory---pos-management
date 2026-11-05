import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { Customer } from '../types.ts';
import { formatCurrency } from '../lib/currency.ts';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Gift,
  ChevronRight,
  X,
  Calendar,
  DollarSign,
  Receipt
} from 'lucide-react';

export function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selected Customer for History & Profile
  const [activeCustomer, setActiveCustomer] = useState<{ customer: Customer; purchases: any[] } | null>(null);

  // Modal Create
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [birthday, setBirthday] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const openCustomerDetail = async (id: string) => {
    try {
      const detail = await api.getCustomerDetails(id);
      setActiveCustomer(detail);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setIsSubmitting(true);

    try {
      await api.createCustomer({
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        birthday: birthday || undefined,
        notes: notes.trim() || undefined
      });
      setShowAddModal(false);
      resetForm();
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setBirthday('');
    setNotes('');
  };

  const filtered = customers.filter(c =>
    !search ||
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E0D8]">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#B89B65] font-medium">
            Clientele & Private Salon Relations
          </span>
          <h1 className="text-3xl font-serif font-medium text-[#1A1A1A] mt-1">VIP Client Directory</h1>
          <p className="text-xs text-[#716D66] mt-1">
            Maintain curated client profiles, fitting preferences, cumulative loyalty points, and purchase histories.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#1A1A1A] text-white hover:bg-[#B89B65] rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register VIP Client</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#8C8275] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search client directory by name, phone, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E0D8] rounded-md text-xs focus:outline-none focus:border-[#B89B65]"
        />
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 text-center py-12 text-xs text-[#716D66]">
            Loading VIP directory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-xs text-[#716D66]">
            No client records found.
          </div>
        ) : (
          filtered.map(c => (
            <div
              key={c.id}
              onClick={() => openCustomerDetail(c.id)}
              className="p-5 bg-white rounded-xl border border-[#E5E0D8] shadow-xs hover:border-[#B89B65] transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EFECE6] border border-[#D8D2C7] flex items-center justify-center font-serif font-bold text-base text-[#1A1A1A]">
                      {c.full_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-serif font-semibold text-base text-[#1A1A1A]">{c.full_name}</h4>
                      <span className="text-[11px] text-[#B89B65] font-medium">VIP Tier · {c.loyalty_points} Points</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-xs text-[#59554F]">
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#8C8275]" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#8C8275]" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.notes && (
                    <p className="text-[11px] text-[#716D66] italic line-clamp-2 mt-2 pt-2 border-t border-[#F0EDE8]">
                      &ldquo;{c.notes}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0EDE8] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#8C8275] uppercase block">Lifetime Spend</span>
                  <span className="font-serif font-semibold text-sm text-[#1A1A1A] tabular-nums">
                    {formatCurrency(c.total_spent)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[#B89B65] font-medium">
                  <span>View History</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ============================================================== */}
      {/* DRAWER: Client Profile & Purchase History                     */}
      {/* ============================================================== */}
      {activeCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-6 border-b border-[#E5E0D8] flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#B89B65] font-medium">VIP Client Record</span>
                <h3 className="font-serif text-2xl font-semibold text-[#1A1A1A] mt-0.5">
                  {activeCustomer.customer.full_name}
                </h3>
                <p className="text-xs text-[#716D66]">{activeCustomer.customer.phone} · {activeCustomer.customer.email}</p>
              </div>
              <button
                onClick={() => setActiveCustomer(null)}
                className="text-[#716D66] hover:text-[#1A1A1A] p-1.5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#F9F8F6] rounded-lg border border-[#E5E0D8]">
                  <span className="text-[10px] text-[#716D66] uppercase">Lifetime Purchases</span>
                  <p className="text-xl font-serif font-bold text-[#1A1A1A] tabular-nums mt-0.5">
                    {formatCurrency(activeCustomer.customer.total_spent)}
                  </p>
                </div>
                <div className="p-3 bg-[#F9F8F6] rounded-lg border border-[#E5E0D8]">
                  <span className="text-[10px] text-[#716D66] uppercase">Loyalty Points</span>
                  <p className="text-xl font-serif font-bold text-[#B89B65] tabular-nums mt-0.5">
                    {activeCustomer.customer.loyalty_points} Pts
                  </p>
                </div>
              </div>

              {/* Address & Notes */}
              {activeCustomer.customer.address && (
                <div className="text-xs">
                  <span className="font-semibold text-[#1A1A1A] block mb-1">Residence / Delivery Address</span>
                  <p className="text-[#59554F]">{activeCustomer.customer.address}</p>
                </div>
              )}

              {activeCustomer.customer.notes && (
                <div className="text-xs">
                  <span className="font-semibold text-[#1A1A1A] block mb-1">Customer Notes</span>
                  <p className="text-[#59554F] italic bg-[#F9F8F6] p-3 rounded border border-[#E5E0D8]">
                    {activeCustomer.customer.notes}
                  </p>
                </div>
              )}

              {/* Purchase History */}
              <div className="space-y-3">
                <span className="font-serif font-semibold text-base text-[#1A1A1A] block">
                  Past Purchases ({activeCustomer.purchases.length})
                </span>

                <div className="divide-y divide-[#F0EDE8] border border-[#E5E0D8] rounded-lg overflow-hidden text-xs">
                  {activeCustomer.purchases.length === 0 ? (
                    <p className="p-4 text-center text-[#716D66]">No purchases recorded yet.</p>
                  ) : (
                    activeCustomer.purchases.map(p => (
                      <div key={p.id} className="p-3 bg-white flex items-center justify-between">
                        <div>
                          <p className="font-mono font-medium text-[#1A1A1A]">{p.receipt_number}</p>
                          <span className="text-[11px] text-[#716D66]">
                            {new Date(p.created_at).toLocaleDateString()} · {p.payment_method} · {p.cashier_name}
                          </span>
                        </div>
                        <span className="font-bold text-[#1A1A1A] tabular-nums">{formatCurrency(p.total_amount)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Register New VIP Client                                */}
      {/* ============================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#E5E0D8] max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#716D66]">New Client Registry</span>
                <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">Register VIP Profile</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#716D66] hover:text-[#1A1A1A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#59554F] font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Countess Tatiana von Bern"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#59554F] font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 012-3456"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
                  />
                </div>
                <div>
                  <label className="block text-[#59554F] font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="client@luxury.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#59554F] font-medium mb-1">Delivery Address / Residence</label>
                <input
                  type="text"
                  placeholder="Street, City, Postal Code"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
                />
              </div>

              <div>
                <label className="block text-[#59554F] font-medium mb-1">Stylist Notes, Color & Fit Preferences</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Prefers silk cowl necks, fits size 38/Small, loves champagne neutrals..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
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
                  {isSubmitting ? 'Registering...' : 'Save VIP Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
