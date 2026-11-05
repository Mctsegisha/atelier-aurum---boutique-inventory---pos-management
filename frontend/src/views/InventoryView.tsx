import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api.ts';
import { InventoryItem, InventoryMovement } from '../types.ts';
import {
  Boxes,
  Search,
  AlertTriangle,
  ArrowUpDown,
  History,
  Plus,
  Minus,
  CheckCircle2,
  X,
  PackagePlus,
  Layers,
  FileText
} from 'lucide-react';

export function InventoryView() {
  const { role, user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Stock Adjustment Modal
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<string>('adjustment');
  const [newQuantityInput, setNewQuantityInput] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Movement History Drawer
  const [showMovementsDrawer, setShowMovementsDrawer] = useState<boolean>(false);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementFilterVariant, setMovementFilterVariant] = useState<string | null>(null);

  useEffect(() => {
    loadInventory();
  }, [lowStockOnly]);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const data = await api.getInventory({ lowStockOnly });
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const openAdjustModal = (item: InventoryItem) => {
    setSelectedItemForAdjust(item);
    setNewQuantityInput(item.quantity);
    setAdjustType('adjustment');
    setAdjustReason('');
    setAdjustError(null);
  };

  const handleConfirmAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAdjust) return;
    if (!adjustReason.trim() || adjustReason.trim().length < 3) {
      setAdjustError('A mandatory clear reason is required for inventory audit compliance.');
      return;
    }

    setIsAdjusting(true);
    setAdjustError(null);

    try {
      await api.adjustInventory({
        variant_id: selectedItemForAdjust.variant_id,
        new_quantity: Number(newQuantityInput),
        type: adjustType,
        reason: adjustReason.trim()
      });

      setSelectedItemForAdjust(null);
      loadInventory();
    } catch (err: any) {
      setAdjustError(err.message || 'Failed to adjust stock');
    } finally {
      setIsAdjusting(false);
    }
  };

  const openMovements = async (variantId?: string) => {
    setShowMovementsDrawer(true);
    setMovementFilterVariant(variantId || null);
    try {
      const res = await api.getInventoryMovements({ variant_id: variantId, limit: 100 });
      setMovements(res);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = items.filter(i =>
    !search ||
    i.product_name.toLowerCase().includes(search.toLowerCase()) ||
    i.sku.toLowerCase().includes(search.toLowerCase()) ||
    i.barcode?.includes(search) ||
    i.color.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = items.filter(i => i.quantity <= i.min_threshold).length;
  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E0D8]">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#B89B65] font-medium">
            Hirbit Store Inventory Control
          </span>
          <h1 className="text-3xl font-serif font-medium text-[#1A1A1A] mt-1">Inventory & Stock Movements</h1>
          <p className="text-xs text-[#716D66] mt-1">
            Real-time stock quantities across sizes, low-stock threshold triggers, and mandatory movement audit logging.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openMovements()}
            className="px-3.5 py-2 bg-white border border-[#E5E0D8] text-[#1A1A1A] hover:bg-[#F9F8F6] rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-[#B89B65]" />
            <span>Movement Audit Trail</span>
          </button>
        </div>
      </div>

      {/* KPI mini strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-lg border border-[#E5E0D8]">
          <span className="text-[11px] uppercase tracking-wider text-[#716D66] font-medium">Total Active SKUs</span>
          <p className="text-2xl font-serif font-semibold text-[#1A1A1A] tabular-nums mt-1">{items.length}</p>
        </div>
        <div className="p-4 bg-white rounded-lg border border-[#E5E0D8]">
          <span className="text-[11px] uppercase tracking-wider text-[#716D66] font-medium">Total On-Hand Units</span>
          <p className="text-2xl font-serif font-semibold text-[#1A1A1A] tabular-nums mt-1">{totalUnits}</p>
        </div>
        <div
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
            lowStockOnly
              ? 'bg-amber-100/70 border-amber-300'
              : 'bg-white border-[#E5E0D8] hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#716D66] font-medium">Low Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-serif font-semibold text-amber-800 tabular-nums mt-1">{lowStockCount}</p>
        </div>
        <div className="p-4 bg-white rounded-lg border border-[#E5E0D8]">
          <span className="text-[11px] uppercase tracking-wider text-[#716D66] font-medium">Primary Store Location</span>
          <p className="text-sm font-semibold text-[#1A1A1A] mt-2">Hawassa Piyassa Mall, 1st Floor</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8C8275] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search variant by SKU, barcode, color, garment name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E0D8] rounded-md text-xs focus:outline-none focus:border-[#B89B65]"
          />
        </div>

        <button
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`px-3 py-2 rounded-md text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
            lowStockOnly
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-white text-[#59554F] border-[#E5E0D8] hover:text-[#1A1A1A]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Stock Only ({lowStockCount})</span>
        </button>
      </div>

      {/* Stock Table */}
      <div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-[#E5E0D8]">
            <thead className="bg-[#F9F8F6] text-[#716D66] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Article & Variant Specifications</th>
                <th className="py-3 px-4">Department & Category</th>
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Available Stock</th>
                <th className="py-3 px-4">Min Threshold</th>
                <th className="py-3 px-4">Retail Price</th>
                {role === 'admin' && <th className="py-3 px-4">Cost Price</th>}
                <th className="py-3 px-4 text-right">Stock Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE8]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#716D66]">
                    Verifying current stock across locations...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#716D66]">
                    No inventory records match your criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isLow = item.quantity <= item.min_threshold;
                  const variantLabel = (item as any).variant_name || (item.size !== 'Standard' ? `${item.size} · ${item.color}` : 'Single Unit');
                  return (
                    <tr key={item.inventory_id} className="hover:bg-[#F9F8F6]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-[#F5F2EB] overflow-hidden shrink-0 border border-[#E5E0D8]">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#B89B65]">
                                <Boxes className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-serif text-sm font-semibold text-[#1A1A1A]">{item.product_name}</p>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#716D66] mt-0.5">
                              {item.color_code && item.color !== 'Standard' && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block shrink-0"
                                  style={{ backgroundColor: item.color_code }}
                                />
                              )}
                              <span>{variantLabel}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1A1A1A]/8 text-[#1A1A1A]">
                          {item.category_name || 'Boutique'}
                        </span>
                        {(item as any).subcategory_name && (
                          <p className="text-[10px] text-[#716D66] mt-0.5">{(item as any).subcategory_name}</p>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#59554F]">
                        <div>{item.sku}</div>
                        {item.barcode && <div className="text-[10px] text-[#8C8275]">{item.barcode}</div>}
                      </td>

                      <td className="py-3 px-4 text-[#716D66]">
                        {item.location}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-bold tabular-nums ${isLow ? 'text-amber-700' : 'text-[#1A1A1A]'}`}>
                            {item.quantity} units
                          </span>
                          {isLow && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium border border-amber-200">
                              Low
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[#716D66] tabular-nums">
                        {item.min_threshold} units
                      </td>

                      <td className="py-3 px-4 font-medium text-[#1A1A1A] tabular-nums">
                        ${Number(item.variant_price || 0).toFixed(2)}
                      </td>

                      {role === 'admin' && (
                        <td className="py-3 px-4 text-[#716D66] tabular-nums">
                          ${Number(item.variant_cost || 0).toFixed(2)}
                        </td>
                      )}

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {role !== 'sales' && (
                            <button
                              onClick={() => openAdjustModal(item)}
                              className="px-2.5 py-1 bg-[#EFECE6] hover:bg-[#1A1A1A] hover:text-white rounded text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              Adjust Stock
                            </button>
                          )}
                          <button
                            onClick={() => openMovements(item.variant_id)}
                            className="p-1 text-[#8C8275] hover:text-[#1A1A1A] rounded cursor-pointer"
                            title="View Variant Movements"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
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
      {/* MODAL: Stock Adjustment (Reason required by business policy)   */}
      {/* ============================================================== */}
      {selectedItemForAdjust && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#E5E0D8] max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#716D66]">Audited Stock Adjustment</span>
                <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">
                  {selectedItemForAdjust.product_name}
                </h3>
                <p className="text-xs text-[#716D66]">{selectedItemForAdjust.size} · {selectedItemForAdjust.color} ({selectedItemForAdjust.sku})</p>
              </div>
              <button
                onClick={() => setSelectedItemForAdjust(null)}
                className="text-[#716D66] hover:text-[#1A1A1A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {adjustError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded text-xs">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleConfirmAdjustment} className="space-y-4 text-xs">
              <div className="p-3 bg-[#F9F8F6] rounded-lg border border-[#E5E0D8] flex justify-between items-center">
                <div>
                  <span className="text-[11px] text-[#716D66] block">Current Count:</span>
                  <span className="text-lg font-bold text-[#1A1A1A] tabular-nums">{selectedItemForAdjust.quantity} units</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#716D66] block">Net Change:</span>
                  <span className="text-lg font-bold text-[#B89B65] tabular-nums">
                    {newQuantityInput - selectedItemForAdjust.quantity >= 0 ? '+' : ''}
                    {newQuantityInput - selectedItemForAdjust.quantity}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[#59554F] font-medium mb-1">New Verified On-Hand Quantity *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newQuantityInput}
                  onChange={e => setNewQuantityInput(Number(e.target.value))}
                  className="w-full p-2.5 border border-[#E5E0D8] rounded text-sm font-semibold tabular-nums focus:outline-none focus:border-[#B89B65]"
                />
              </div>

              <div>
                <label className="block text-[#59554F] font-medium mb-1">Movement Classification</label>
                <select
                  value={adjustType}
                  onChange={e => setAdjustType(e.target.value)}
                  className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none"
                >
                  <option value="adjustment">Manual Count Adjustment / Correction</option>
                  <option value="damage">Damaged Fabric / Garment Floor Defect</option>
                  <option value="returned">Customer Return Intake</option>
                  <option value="transfer">Inter-store Location Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-[#59554F] font-medium mb-1">
                  Mandatory Audit Reason *
                </label>
                <textarea
                  required
                  placeholder="e.g. Physical inventory cycle count; Stock inspection or floor restock..."
                  rows={2}
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 border border-[#E5E0D8] rounded focus:outline-none focus:border-[#B89B65]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E0D8]">
                <button
                  type="button"
                  onClick={() => setSelectedItemForAdjust(null)}
                  className="px-4 py-2 border border-[#E5E0D8] rounded hover:bg-[#F9F8F6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#B89B65] text-white rounded font-medium transition-colors cursor-pointer"
                >
                  {isAdjusting ? 'Recording Audit...' : 'Save Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DRAWER: Movement History Audit Trail                          */}
      {/* ============================================================== */}
      {showMovementsDrawer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-[#E5E0D8] flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">Inventory Movement Ledger</h3>
                <p className="text-xs text-[#716D66]">Immutable record of all stock adjustments, sales, and intake</p>
              </div>
              <button
                onClick={() => setShowMovementsDrawer(false)}
                className="text-[#716D66] hover:text-[#1A1A1A] p-1.5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#F0EDE8] p-5">
              {movements.length === 0 ? (
                <p className="text-xs text-[#716D66] py-12 text-center">No movement logs recorded yet.</p>
              ) : (
                movements.map(m => (
                  <div key={m.id} className="py-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#1A1A1A]">{m.product_name} ({m.size} · {m.color})</span>
                      <span className={`font-bold tabular-nums ${m.quantity_changed >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {m.quantity_changed >= 0 ? `+${m.quantity_changed}` : m.quantity_changed} units
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#716D66]">
                      <span className="uppercase font-semibold text-[#B89B65]">{m.movement_type}</span>
                      <span aria-hidden="true">·</span>
                      <span>Prev: {m.previous_quantity} &rarr; New: {m.new_quantity}</span>
                      <span aria-hidden="true">·</span>
                      <span>By: {m.user_name || 'Staff'}</span>
                    </div>

                    <p className="text-[11px] text-[#59554F] italic bg-[#F9F8F6] p-1.5 rounded border border-[#E5E0D8]/60 mt-1">
                      &ldquo;{m.reason}&rdquo;
                    </p>

                    <div className="text-[10px] text-[#8C8275] pt-0.5">
                      {new Date(m.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
