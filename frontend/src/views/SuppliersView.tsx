import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api.ts';
import { Supplier, PurchaseOrder, Product } from '../types.ts';
import { formatCurrency } from '../lib/currency.ts';
import {
  Truck,
  Plus,
  PackageCheck,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X
} from 'lucide-react';

export function SuppliersView() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<'suppliers' | 'orders'>('suppliers');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal Add Supplier
  const [showAddSupplierModal, setShowAddSupplierModal] = useState<boolean>(false);
  const [companyName, setCompanyName] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [productsSupplied, setProductsSupplied] = useState<string>('');

  // Modal Add Purchase Order
  const [showAddPoModal, setShowAddPoModal] = useState<boolean>(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [poNotes, setPoNotes] = useState<string>('');
  const [poItems, setPoItems] = useState<{ variant_id: string; quantity_ordered: number; unit_cost: number }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sups, pos, prods] = await Promise.all([
        api.getSuppliers(),
        api.getPurchaseOrders(),
        api.getProducts()
      ]);
      setSuppliers(sups);
      setOrders(pos);
      setProducts(prods);

      if (sups.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(sups[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    try {
      await api.createSupplier({
        company_name: companyName.trim(),
        contact_person: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        products_supplied: productsSupplied.trim() || undefined
      });
      setShowAddSupplierModal(false);
      setCompanyName('');
      setContactPerson('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save supplier');
    }
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || poItems.length === 0) {
      alert('Please select a supplier and add at least one line item.');
      return;
    }

    try {
      await api.createPurchaseOrder({
        supplier_id: selectedSupplierId,
        notes: poNotes,
        items: poItems
      });
      setShowAddPoModal(false);
      setPoNotes('');
      setPoItems([]);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create purchase order');
    }
  };

  const handleReceivePo = async (poId: string, orderNumber: string) => {
    if (!confirm(`Verify delivery and receive stock for Purchase Order ${orderNumber}? This will auto-update inventory levels.`)) return;

    try {
      await api.receivePurchaseOrder(poId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to receive purchase order');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E0D8]">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#B89B65] font-medium">
            Supply Chain & Product Vendors
          </span>
          <h1 className="text-3xl font-serif font-medium text-[#1A1A1A] mt-1">Suppliers & Purchase Orders</h1>
          <p className="text-xs text-[#716D66] mt-1">
            Manage product vendors, wholesale suppliers, purchase orders, and stock delivery intake.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'suppliers' ? (
            <button
              onClick={() => setShowAddSupplierModal(true)}
              className="px-4 py-2 bg-[#1A1A1A] text-white hover:bg-[#B89B65] rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Supplier</span>
            </button>
          ) : (
            <button
              onClick={() => {
                // Initialize default item
                const allVars = products.flatMap(p => p.variants || []);
                if (allVars.length > 0) {
                  setPoItems([{ variant_id: allVars[0].id, quantity_ordered: 10, unit_cost: 150 }]);
                }
                setShowAddPoModal(true);
              }}
              className="px-4 py-2 bg-[#1A1A1A] text-white hover:bg-[#B89B65] rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Purchase Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E0D8]">
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border-b-2 -mb-px ${
            activeTab === 'suppliers'
              ? 'border-[#1A1A1A] text-[#1A1A1A]'
              : 'border-transparent text-[#716D66] hover:text-[#1A1A1A]'
          }`}
        >
          Suppliers ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border-b-2 -mb-px ${
            activeTab === 'orders'
              ? 'border-[#1A1A1A] text-[#1A1A1A]'
              : 'border-transparent text-[#716D66] hover:text-[#1A1A1A]'
          }`}
        >
          Purchase Orders ({orders.length})
        </button>
      </div>

      {/* TAB 1: Suppliers List */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {suppliers.map(s => (
            <div key={s.id} className="p-5 bg-white rounded-xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#B89B65] font-medium block">
                  Artisan Partner
                </span>
                <h4 className="font-serif font-semibold text-lg text-[#1A1A1A] mt-0.5">{s.company_name}</h4>
                <p className="text-xs text-[#59554F] font-medium mt-1">Contact: {s.contact_person || 'Representative'}</p>

                <div className="mt-3 space-y-1.5 text-xs text-[#716D66]">
                  {s.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                  {s.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{s.email}</span>
                    </div>
                  )}
                  {s.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{s.address}</span>
                    </div>
                  )}
                </div>

                {s.products_supplied && (
                  <p className="text-[11px] text-[#716D66] bg-[#F9F8F6] p-2 rounded border border-[#E5E0D8] mt-3">
                    {s.products_supplied}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#F0EDE8] flex items-center justify-between text-xs">
                <span className="text-[#716D66]">{s.product_count || 0} Catalog items</span>
                <span className="font-medium text-[#1A1A1A] tabular-nums">
                  Balance: {formatCurrency(s.balance_due)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: Purchase Orders */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-[#E5E0D8]">
              <thead className="bg-[#F9F8F6] text-[#716D66] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Total Cost</th>
                  <th className="py-3 px-4">Items Count</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDE8]">
                {orders.map(po => (
                  <tr key={po.id} className="hover:bg-[#F9F8F6]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-[#1A1A1A]">
                      {po.order_number}
                    </td>
                    <td className="py-3.5 px-4 font-serif font-semibold text-sm text-[#1A1A1A]">
                      {po.supplier_name}
                    </td>
                    <td className="py-3.5 px-4 text-[#716D66]">
                      {new Date(po.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#1A1A1A] tabular-nums">
                      {formatCurrency(po.total_cost)}
                    </td>
                    <td className="py-3.5 px-4 text-[#716D66]">
                      {po.item_count || 1} lines
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                        po.status === 'received'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {po.status === 'pending' && (
                        <button
                          onClick={() => handleReceivePo(po.id, po.order_number)}
                          className="px-3 py-1 bg-[#1A1A1A] hover:bg-[#B89B65] text-white rounded text-xs font-medium transition-colors cursor-pointer"
                        >
                          Receive Stock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Add Supplier                                           */}
      {/* ============================================================== */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#E5E0D8] max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
              <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">Add Artisan Supplier</h3>
              <button onClick={() => setShowAddSupplierModal(false)} className="text-[#716D66] hover:text-[#1A1A1A] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#59554F] font-medium mb-1">Company / Mill Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Biella Woolen Mills SPA"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
                />
              </div>

              <div>
                <label className="block text-[#59554F] font-medium mb-1">Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Alessandro Moretti"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#59554F] font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
                  />
                </div>
                <div>
                  <label className="block text-[#59554F] font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#59554F] font-medium mb-1">Mill Location / Address</label>
                <input
                  type="text"
                  placeholder="Via Roma 10, Biella, Italy"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
                />
              </div>

              <div>
                <label className="block text-[#59554F] font-medium mb-1">Materials / Products Supplied</label>
                <input
                  type="text"
                  placeholder="e.g. 100% Super 150s Merino Wool fabrics, silk linings"
                  value={productsSupplied}
                  onChange={e => setProductsSupplied(e.target.value)}
                  className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E0D8]">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 border border-[#E5E0D8] rounded hover:bg-[#F9F8F6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#B89B65] text-white rounded font-medium transition-colors cursor-pointer"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: New Purchase Order                                      */}
      {/* ============================================================== */}
      {showAddPoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#E5E0D8] max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
              <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">Create Purchase Order</h3>
              <button onClick={() => setShowAddPoModal(false)} className="text-[#716D66] hover:text-[#1A1A1A] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#59554F] font-medium mb-1">Select Supplier *</label>
                <select
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.company_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#59554F] font-medium mb-1">Order Notes / Delivery Terms</label>
                <input
                  type="text"
                  placeholder="e.g. Net 30 terms, courier delivery to flagship loading dock"
                  value={poNotes}
                  onChange={e => setPoNotes(e.target.value)}
                  className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none"
                />
              </div>

              {/* Items Line */}
              <div className="space-y-2">
                <span className="font-semibold text-[#1A1A1A]">Order Items</span>
                {poItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#F9F8F6] border border-[#E5E0D8] rounded space-y-2">
                    <div>
                      <label className="block text-[11px] text-[#716D66] mb-1">Variant</label>
                      <select
                        value={item.variant_id}
                        onChange={e => {
                          const val = e.target.value;
                          setPoItems(prev => prev.map((it, i) => i === idx ? { ...it, variant_id: val } : it));
                        }}
                        className="w-full p-1.5 bg-white border border-[#E5E0D8] rounded text-xs"
                      >
                        {products.flatMap(p => p.variants || []).map(v => (
                          <option key={v.id} value={v.id}>
                            {v.sku} ({v.size} · {v.color})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-[#716D66] mb-0.5">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity_ordered}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setPoItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity_ordered: val } : it));
                          }}
                          className="w-full p-1.5 bg-white border border-[#E5E0D8] rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#716D66] mb-0.5">Unit Cost (ETB)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_cost}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setPoItems(prev => prev.map((it, i) => i === idx ? { ...it, unit_cost: val } : it));
                          }}
                          className="w-full p-1.5 bg-white border border-[#E5E0D8] rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E0D8]">
                <button
                  type="button"
                  onClick={() => setShowAddPoModal(false)}
                  className="px-4 py-2 border border-[#E5E0D8] rounded hover:bg-[#F9F8F6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#B89B65] text-white rounded font-medium transition-colors cursor-pointer"
                >
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
