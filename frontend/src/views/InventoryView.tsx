import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api.ts';
import {
  ParentInventoryProduct,
  InventoryBatch,
  InventoryMovement,
  InventoryStats,
  SlowMovingInventoryItem,
  Category
} from '../types.ts';
import { SkeletonTableRows } from '../components/common/SkeletonLoader.tsx';
import {
  Search,
  AlertTriangle,
  History,
  X,
  Package,
  Layers,
  TrendingDown,
  Clock,
  ChevronDown,
  ChevronUp,
  Edit2,
  DollarSign,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  Boxes,
  Tag,
  AlertOctagon
} from 'lucide-react';

export function InventoryView() {
  const { role, user } = useAuth();

  // Active subnavigation tab: 'stock_levels' | 'adjustments' | 'slow_moving'
  const [activeTab, setActiveTab] = useState<'stock_levels' | 'adjustments' | 'slow_moving'>('stock_levels');

  // Main inventory state
  const [items, setItems] = useState<ParentInventoryProduct[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    total_products: 0,
    total_value: 0,
    total_cost_value: 0,
    low_stock_count: 0,
    slow_moving_count: 0,
    total_stock: 0,
    total_variants: 0
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Accordion expanded rows state
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  // Stock Adjustment Modal state
  const [adjustModalProduct, setAdjustModalProduct] = useState<ParentInventoryProduct | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [adjustDirection, setAdjustDirection] = useState<'add' | 'remove'>('add');
  const [adjustQuantityInput, setAdjustQuantityInput] = useState<string>('0');
  const [adjustReasonOption, setAdjustReasonOption] = useState<string>('');
  const [adjustNote, setAdjustNote] = useState<string>('');
  const [showNoteField, setShowNoteField] = useState<boolean>(false);
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Edit Parent Product Modal state
  const [editingParent, setEditingParent] = useState<{
    productId: string;
    name: string;
    categoryId: string;
    minThreshold: number;
    sellingPrice: number;
    costPrice: number;
  } | null>(null);
  const [isSavingParent, setIsSavingParent] = useState<boolean>(false);
  const [parentEditError, setParentEditError] = useState<string | null>(null);

  // Edit Child Variant Modal state
  const [editingVariant, setEditingVariant] = useState<{
    variantId: string;
    productId: string;
    productName: string;
    sku: string;
    barcode: string;
    size: string;
    color: string;
    sellingPrice: number;
    costPrice: number;
    minThreshold: number;
  } | null>(null);
  const [isSavingVariant, setIsSavingVariant] = useState<boolean>(false);
  const [variantEditError, setVariantEditError] = useState<string | null>(null);

  // Adjustments & Movement Audit Ledger state
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementFilterType, setMovementFilterType] = useState<string>('all');
  const [movementSearch, setMovementSearch] = useState<string>('');
  const [isLoadingMovements, setIsLoadingMovements] = useState<boolean>(false);

  // Slow Moving Stock state
  const [slowMovingItems, setSlowMovingItems] = useState<SlowMovingInventoryItem[]>([]);
  const [isLoadingSlowMoving, setIsLoadingSlowMoving] = useState<boolean>(false);

  useEffect(() => {
    loadCategories();
    loadInventory();
    loadStats();
  }, [lowStockOnly]);

  useEffect(() => {
    if (activeTab === 'adjustments') {
      loadMovements();
    } else if (activeTab === 'slow_moving') {
      loadSlowMoving();
    }
  }, [activeTab, movementFilterType]);

  const loadCategories = async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const loadStats = async () => {
    try {
      const res = await api.getInventoryStats();
      if (res) setStats(res);
    } catch (err) {
      console.error('Failed to fetch inventory stats', err);
    }
  };

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const data = await api.getInventory({ lowStockOnly });
      setItems(data || []);
    } catch (err) {
      console.error('Failed to fetch inventory', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMovements = async () => {
    setIsLoadingMovements(true);
    try {
      const res = await api.getInventoryMovements({
        type: movementFilterType !== 'all' ? movementFilterType : undefined,
        limit: 100
      });
      setMovements(res || []);
    } catch (err) {
      console.error('Failed to load movements', err);
    } finally {
      setIsLoadingMovements(false);
    }
  };

  const loadSlowMoving = async () => {
    setIsLoadingSlowMoving(true);
    try {
      const res = await api.getSlowMovingInventory();
      setSlowMovingItems(res || []);
    } catch (err) {
      console.error('Failed to load slow-moving inventory', err);
    } finally {
      setIsLoadingSlowMoving(false);
    }
  };

  // Toggle row accordion expansion
  const toggleRowExpand = (productId: string) => {
    setExpandedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Open adjustment modal for a child batch/variant
  const handleOpenAdjustBatch = (product: ParentInventoryProduct, batch: InventoryBatch) => {
    setAdjustModalProduct(product);
    setSelectedBatchId(batch.variant_id);
    setAdjustDirection('add');
    setAdjustQuantityInput('0');
    setAdjustReasonOption('');
    setAdjustNote('');
    setShowNoteField(false);
    setAdjustError(null);
  };

  // Open adjustment modal for a parent product (picks first variant or opens picker)
  const handleOpenAdjustParent = (product: ParentInventoryProduct) => {
    if (product.batches.length === 0) return;
    setAdjustModalProduct(product);
    setSelectedBatchId(product.batches[0]?.variant_id || '');
    setAdjustDirection('add');
    setAdjustQuantityInput('0');
    setAdjustReasonOption('');
    setAdjustNote('');
    setShowNoteField(false);
    setAdjustError(null);
  };

  // Confirm and persist stock adjustment
  const handleConfirmAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalProduct) return;

    if (!selectedBatchId) {
      setAdjustError('Please select a batch.');
      return;
    }

    const qty = parseInt(adjustQuantityInput, 10);
    if (isNaN(qty) || qty <= 0) {
      setAdjustError('Please enter a positive quantity greater than 0.');
      return;
    }

    if (!adjustReasonOption) {
      setAdjustError('Please select a reason for the adjustment.');
      return;
    }

    const selectedBatch = adjustModalProduct.batches.find(b => b.variant_id === selectedBatchId);
    if (adjustDirection === 'remove' && selectedBatch && qty > selectedBatch.quantity) {
      setAdjustError(`Cannot remove ${qty} units. Current stock for batch ${selectedBatch.batch_number} is only ${selectedBatch.quantity}.`);
      return;
    }

    setIsAdjusting(true);
    setAdjustError(null);

    // Map reason to movement type
    let movementType = 'adjustment';
    if (adjustReasonOption === 'Damaged' || adjustReasonOption === 'Lost') {
      movementType = 'damage';
    } else if (adjustReasonOption === 'Found') {
      movementType = 'received';
    } else if (adjustReasonOption === 'Count Correction') {
      movementType = 'adjustment';
    }

    const fullReason = adjustNote.trim()
      ? `${adjustReasonOption} - ${adjustNote.trim()}`
      : adjustReasonOption;

    try {
      await api.adjustInventory({
        variant_id: selectedBatchId,
        adjustment_type: adjustDirection === 'add' ? 'add' : 'subtract',
        quantity: qty,
        type: movementType,
        reason: fullReason
      });

      const batchLabel = selectedBatch ? `${selectedBatch.batch_number} (${selectedBatch.size} · ${selectedBatch.color})` : '';
      setSuccessMsg(`Stock successfully ${adjustDirection === 'add' ? 'added to' : 'removed from'} "${adjustModalProduct.product_name}" ${batchLabel}.`);
      setTimeout(() => setSuccessMsg(null), 4000);

      setAdjustModalProduct(null);
      await Promise.all([loadInventory(), loadStats()]);
      if (activeTab === 'adjustments') loadMovements();
    } catch (err: any) {
      setAdjustError(err.message || 'Failed to adjust stock');
    } finally {
      setIsAdjusting(false);
    }
  };

  // Open Edit modal for parent product
  const handleOpenEditParent = (product: ParentInventoryProduct) => {
    setEditingParent({
      productId: product.product_id,
      name: product.product_name,
      categoryId: product.category_id || '',
      minThreshold: product.min_threshold,
      sellingPrice: product.selling_price,
      costPrice: product.cost_price
    });
    setParentEditError(null);
  };

  // Save parent product edits
  const handleSaveParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParent) return;

    setIsSavingParent(true);
    setParentEditError(null);

    try {
      await api.updateProduct(editingParent.productId, {
        name: editingParent.name.trim(),
        category_id: editingParent.categoryId || undefined,
        min_stock_level: Number(editingParent.minThreshold),
        selling_price: Number(editingParent.sellingPrice),
        purchase_price: Number(editingParent.costPrice)
      });

      setSuccessMsg(`Product "${editingParent.name}" updated successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);

      setEditingParent(null);
      await Promise.all([loadInventory(), loadStats()]);
    } catch (err: any) {
      setParentEditError(err.message || 'Failed to update product');
    } finally {
      setIsSavingParent(false);
    }
  };

  // Open Edit modal for child batch/variant
  const handleOpenEditVariant = (product: ParentInventoryProduct, batch: InventoryBatch) => {
    setEditingVariant({
      variantId: batch.variant_id,
      productId: product.product_id,
      productName: product.product_name,
      sku: batch.sku || batch.batch_number,
      barcode: batch.barcode || '',
      size: batch.size,
      color: batch.color,
      sellingPrice: batch.selling_price,
      costPrice: batch.cost_price,
      minThreshold: batch.min_threshold
    });
    setVariantEditError(null);
  };

  // Save child batch/variant edits
  const handleSaveVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;

    setIsSavingVariant(true);
    setVariantEditError(null);

    try {
      await api.updateInventoryVariant(editingVariant.variantId, {
        sku: editingVariant.sku.trim(),
        barcode: editingVariant.barcode.trim() || undefined,
        size: editingVariant.size.trim(),
        color: editingVariant.color.trim(),
        selling_price: Number(editingVariant.sellingPrice),
        purchase_price: Number(editingVariant.costPrice),
        min_threshold: Number(editingVariant.minThreshold)
      });

      setSuccessMsg(`Variant "${editingVariant.sku}" updated successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);

      setEditingVariant(null);
      await Promise.all([loadInventory(), loadStats()]);
    } catch (err: any) {
      setVariantEditError(err.message || 'Failed to update variant');
    } finally {
      setIsSavingVariant(false);
    }
  };

  // Filtered parent items for Stock Levels view
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchesProduct = item.product_name.toLowerCase().includes(query);
        const matchesCategory = item.category_name.toLowerCase().includes(query);
        const matchesBatches = item.batches.some(b =>
          (b.sku && b.sku.toLowerCase().includes(query)) ||
          (b.batch_number && b.batch_number.toLowerCase().includes(query)) ||
          (b.barcode && b.barcode.includes(query)) ||
          (b.size && b.size.toLowerCase().includes(query)) ||
          (b.color && b.color.toLowerCase().includes(query))
        );
        if (!matchesProduct && !matchesCategory && !matchesBatches) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && item.category_id !== selectedCategory && item.category_name !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'low_stock' && item.status !== 'low_stock') return false;
        if (selectedStatus === 'healthy' && item.status !== 'healthy') return false;
      }

      return true;
    });
  }, [items, search, selectedCategory, selectedStatus]);

  // Filtered movements for Adjustments view
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      if (movementSearch.trim()) {
        const q = movementSearch.toLowerCase().trim();
        return (
          m.product_name.toLowerCase().includes(q) ||
          (m.sku && m.sku.toLowerCase().includes(q)) ||
          (m.reason && m.reason.toLowerCase().includes(q)) ||
          (m.user_name && m.user_name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [movements, movementSearch]);

  const formatCurrency = (val: number) => {
    return Number(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="p-6 lg:p-8 w-full space-y-6 font-sans">
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#1E3A34] text-white px-4 py-3 rounded-xl shadow-lg border border-emerald-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{successMsg}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. Page Header & Subnavigation Tabs                           */}
      {/* ============================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Inventory</h1>
            <p className="text-xs text-gray-500 mt-0.5">Track and manage stock levels across all branches.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadInventory();
                loadStats();
                if (activeTab === 'adjustments') loadMovements();
                if (activeTab === 'slow_moving') loadSlowMoving();
              }}
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Refresh inventory data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Subnavigation Pill Tabs */}
        <div className="inline-flex p-1 bg-gray-100/90 rounded-lg text-xs font-medium border border-gray-200/60 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('stock_levels')}
            className={`px-4 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'stock_levels'
                ? 'bg-white text-gray-900 font-semibold shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Stock Levels
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('adjustments')}
            className={`px-4 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'adjustments'
                ? 'bg-white text-gray-900 font-semibold shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Adjustments
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('slow_moving')}
            className={`px-4 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'slow_moving'
                ? 'bg-white text-gray-900 font-semibold shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Slow Moving Stock
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. Top KPI Summary Cards Grid                                  */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Products */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">
              Total Products
            </span>
            <p className="text-2xl font-bold font-mono tabular-nums text-gray-900 mt-0.5">
              {stats.total_products}
            </p>
          </div>
        </div>

        {/* Card 2: Total Value (Selling Price) */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-emerald-50/70 border border-emerald-100/80 flex items-center justify-center text-emerald-700 shrink-0">
            <DollarSign className="w-5 h-5 font-bold" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">
              Total Value
            </span>
            <p className="text-2xl font-bold font-mono tabular-nums text-gray-900 mt-0.5 truncate">
              {formatCurrency(stats.total_value)} <span className="text-xs font-semibold text-gray-500 font-sans">ETB</span>
            </p>
          </div>
        </div>

        {/* Card 3: Low Stock Items */}
        <div
          onClick={() => {
            setActiveTab('stock_levels');
            setLowStockOnly(!lowStockOnly);
          }}
          className={`bg-white rounded-xl border p-4 shadow-2xs flex items-center gap-3.5 cursor-pointer transition-all ${
            lowStockOnly
              ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/20'
              : 'border-gray-200/80 hover:border-amber-300'
          }`}
        >
          <div className="w-11 h-11 rounded-lg bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600 shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">
              Low Stock Items
            </span>
            <p className="text-2xl font-bold font-mono tabular-nums text-amber-600 mt-0.5">
              {stats.low_stock_count}
            </p>
          </div>
        </div>

        {/* Card 4: Dead Stock / Slow-Moving Items */}
        <div
          onClick={() => setActiveTab('slow_moving')}
          className={`bg-white rounded-xl border p-4 shadow-2xs flex items-center gap-3.5 cursor-pointer transition-all ${
            activeTab === 'slow_moving'
              ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-400/20'
              : 'border-gray-200/80 hover:border-rose-300'
          }`}
        >
          <div className="w-11 h-11 rounded-lg bg-rose-50 border border-rose-200/70 flex items-center justify-center text-rose-600 shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">
              Slow Moving Stock
            </span>
            <p className="text-2xl font-bold font-mono tabular-nums text-rose-600 mt-0.5">
              {stats.slow_moving_count}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. SUBNAV VIEW: STOCK LEVELS (Expandable Parent-Child Table)    */}
      {/* ============================================================== */}
      {activeTab === 'stock_levels' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#B89B65] shadow-2xs placeholder:text-gray-400"
                />
              </div>

              {/* Low Stock Toggle Button */}
              <button
                type="button"
                onClick={() => setLowStockOnly(!lowStockOnly)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  lowStockOnly
                    ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                <span>Low Stock</span>
                {stats.low_stock_count > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 bg-amber-200/60 text-amber-900 rounded-full text-[10px] font-mono">
                    {stats.low_stock_count}
                  </span>
                )}
              </button>

              {/* Category Filter Dropdown */}
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-[#B89B65] cursor-pointer shadow-2xs"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Status Filter Dropdown */}
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-[#B89B65] cursor-pointer shadow-2xs"
              >
                <option value="all">All Statuses</option>
                <option value="healthy">Healthy</option>
                <option value="low_stock">Low Stock</option>
              </select>
            </div>

            {/* Expand / Collapse All */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (expandedProductIds.size === filteredItems.length) {
                    setExpandedProductIds(new Set());
                  } else {
                    setExpandedProductIds(new Set(filteredItems.map(i => i.product_id)));
                  }
                }}
                className="text-xs text-gray-500 hover:text-gray-900 font-medium px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {expandedProductIds.size === filteredItems.length ? 'Collapse All' : 'Expand All'}
              </button>
            </div>
          </div>

          {/* Expandable Parent-Child Inventory Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-gray-200">
                <thead className="bg-[#FAF9F7] text-gray-500 uppercase tracking-wider text-[10px] font-semibold">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center"></th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Batch #</th>
                    <th className="py-3 px-4 text-right">Available Stock</th>
                    <th className="py-3 px-4 text-right">Min Threshold</th>
                    <th className="py-3 px-4 text-right">Cost Price</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <SkeletonTableRows cols={9} rows={8} />
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-gray-500">
                        <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-medium text-gray-700">No inventory products found</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Try adjusting your search or active filter toggles.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map(item => {
                      const isExpanded = expandedProductIds.has(item.product_id);
                      const isLowStock = item.status === 'low_stock';

                      return (
                        <React.Fragment key={item.product_id}>
                          {/* ================================================= */}
                          {/* PARENT ROW                                        */}
                          {/* ================================================= */}
                          <tr
                            className={`group transition-colors ${
                              isExpanded ? 'bg-gray-50/70' : 'hover:bg-gray-50/50'
                            }`}
                          >
                            {/* Expand Chevron Column */}
                            <td className="py-3.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => toggleRowExpand(item.product_id)}
                                className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
                                title={isExpanded ? 'Collapse Batches' : 'Expand Batches'}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-700" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </td>

                            {/* PRODUCT */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">
                                  {item.image_url ? (
                                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p
                                    onClick={() => toggleRowExpand(item.product_id)}
                                    className="font-medium text-gray-900 hover:text-[#B89B65] transition-colors cursor-pointer truncate"
                                  >
                                    {item.product_name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                                    <span className="font-mono text-[10px] text-gray-400">
                                      {item.batches.length} {item.batches.length === 1 ? 'batch' : 'batches'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* CATEGORY */}
                            <td className="py-3.5 px-4 text-gray-600">
                              <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700">
                                {item.category_name}
                              </span>
                              {item.subcategory_name && (
                                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{item.subcategory_name}</p>
                              )}
                            </td>

                            {/* BATCH # */}
                            <td className="py-3.5 px-4 font-mono text-[11px] text-gray-600">
                              {item.batches.length === 1
                                ? item.batches[0].batch_number
                                : `${item.batches.length} Batches`}
                            </td>

                            {/* AVAILABLE STOCK (Aggregated) */}
                            <td className="py-3.5 px-4 text-right">
                              <span className="font-mono text-sm font-semibold tabular-nums text-gray-900">
                                {item.total_quantity}
                              </span>
                            </td>

                            {/* MIN THRESHOLD */}
                            <td className="py-3.5 px-4 text-right">
                              <span className="font-mono text-xs tabular-nums text-gray-500">
                                {item.min_threshold}
                              </span>
                            </td>

                            {/* COST PRICE */}
                            <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums text-gray-600">
                              {formatCurrency(item.cost_price)} ETB
                            </td>

                            {/* STATUS */}
                            <td className="py-3.5 px-4">
                              {isLowStock ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                  Low Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Healthy
                                </span>
                              )}
                            </td>

                            {/* ACTIONS */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {role !== 'sales' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAdjustParent(item)}
                                    className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-md text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                                  >
                                    Adjust
                                  </button>
                                )}
                                {role === 'admin' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditParent(item)}
                                    className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors cursor-pointer"
                                    title="Edit Product Details"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* ================================================= */}
                          {/* EXPANDED CHILD ACCORDION: BATCH VARIANTS TABLE     */}
                          {/* ================================================= */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={9} className="p-0 bg-slate-50/70 border-y border-gray-200/80">
                                <div className="pl-14 pr-6 py-3">
                                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-2xs">
                                    <table className="w-full text-left text-xs divide-y divide-gray-100">
                                      <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-semibold">
                                        <tr>
                                          <th className="py-2.5 px-4">Batch #</th>
                                          <th className="py-2.5 px-4">Specifications / Variant</th>
                                          <th className="py-2.5 px-4 text-right">Quantity</th>
                                          <th className="py-2.5 px-4 text-right">Cost Price</th>
                                          <th className="py-2.5 px-4 text-right">Selling Price</th>
                                          <th className="py-2.5 px-4 text-right">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100 font-mono text-xs">
                                        {item.batches.map(batch => (
                                          <tr key={batch.variant_id} className="hover:bg-gray-50/70 transition-colors">
                                            {/* Batch # */}
                                            <td className="py-2.5 px-4 font-mono font-medium text-gray-800">
                                              {batch.batch_number}
                                            </td>

                                            {/* Specifications */}
                                            <td className="py-2.5 px-4 font-sans text-gray-700">
                                              <div className="flex items-center gap-2">
                                                {batch.color_code && (
                                                  <span
                                                    className="w-2.5 h-2.5 rounded-full border border-black/15 inline-block shrink-0"
                                                    style={{ backgroundColor: batch.color_code }}
                                                  />
                                                )}
                                                <span className="font-medium">{batch.variant_name}</span>
                                                {batch.barcode && (
                                                  <span className="text-[10px] text-gray-400 font-mono ml-1">
                                                    [{batch.barcode}]
                                                  </span>
                                                )}
                                              </div>
                                            </td>

                                            {/* Quantity */}
                                            <td className="py-2.5 px-4 text-right">
                                              <span
                                                className={`font-mono font-semibold tabular-nums ${
                                                  batch.quantity <= batch.min_threshold
                                                    ? 'text-amber-600'
                                                    : 'text-gray-900'
                                                }`}
                                              >
                                                {batch.quantity}
                                              </span>
                                            </td>

                                            {/* Cost Price */}
                                            <td className="py-2.5 px-4 text-right font-mono tabular-nums text-gray-600">
                                              {formatCurrency(batch.cost_price)} ETB
                                            </td>

                                            {/* Selling Price */}
                                            <td className="py-2.5 px-4 text-right font-mono tabular-nums text-gray-900 font-medium">
                                              {formatCurrency(batch.selling_price)} ETB
                                            </td>

                                            {/* Actions */}
                                            <td className="py-2.5 px-4 text-right font-sans">
                                              <div className="flex items-center justify-end gap-1">
                                                {role !== 'sales' && (
                                                  <button
                                                    type="button"
                                                    onClick={() => handleOpenAdjustBatch(item, batch)}
                                                    className="px-2 py-0.5 text-[11px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors cursor-pointer"
                                                  >
                                                    Adjust
                                                  </button>
                                                )}
                                                {role === 'admin' && (
                                                  <button
                                                    type="button"
                                                    onClick={() => handleOpenEditVariant(item, batch)}
                                                    className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors cursor-pointer"
                                                    title="Edit Batch / Variant"
                                                  >
                                                    <Edit2 className="w-3 h-3" />
                                                  </button>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. SUBNAV VIEW: ADJUSTMENTS (Movement Audit Ledger)            */}
      {/* ============================================================== */}
      {activeTab === 'adjustments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audit trail by product, SKU, operator, or reason..."
                value={movementSearch}
                onChange={e => setMovementSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#B89B65] shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={movementFilterType}
                onChange={e => setMovementFilterType(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-[#B89B65] cursor-pointer shadow-2xs"
              >
                <option value="all">All Movement Types</option>
                <option value="adjustment">Manual Adjustment</option>
                <option value="received">Stock Intake / PO</option>
                <option value="sale">POS Sale Deduction</option>
                <option value="damage">Damaged Floor Stock</option>
                <option value="return">Customer Return</option>
                <option value="transfer">Store Transfer</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-gray-200">
                <thead className="bg-[#FAF9F7] text-gray-500 uppercase tracking-wider text-[10px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Article & Variant</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Previous</th>
                    <th className="py-3 px-4 text-right">Delta</th>
                    <th className="py-3 px-4 text-right">New Quantity</th>
                    <th className="py-3 px-4">Operator</th>
                    <th className="py-3 px-4">Audit Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoadingMovements ? (
                    <SkeletonTableRows cols={9} rows={6} />
                  ) : filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-gray-500">
                        <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-medium text-gray-700">No movement audit logs found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                          {new Date(m.created_at || (m as any).timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {m.product_name}
                          <span className="text-[11px] text-gray-500 font-normal ml-1">
                            ({m.size} · {m.color})
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-600">
                          {m.sku}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-semibold tracking-wider bg-gray-100 text-gray-700">
                            {m.movement_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-gray-500">
                          {m.previous_quantity}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                          <span className={m.quantity_changed >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {m.quantity_changed >= 0 ? `+${m.quantity_changed}` : m.quantity_changed}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-gray-900">
                          {m.new_quantity}
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-[11px]">
                          {m.user_name || (m as any).operator_name || 'Staff'}
                        </td>
                        <td className="py-3 px-4 text-gray-500 italic max-w-xs truncate">
                          &ldquo;{m.reason}&rdquo;
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
      {/* 5. SUBNAV VIEW: SLOW MOVING STOCK                              */}
      {/* ============================================================== */}
      {activeTab === 'slow_moving' && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900">Slow-Moving & Dead Stock Analysis</h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Calculated dynamically from active inventory records and 30-day sales history. These articles have available stock on hand but low or zero transactions in the observation window.
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-gray-200">
                <thead className="bg-[#FAF9F7] text-gray-500 uppercase tracking-wider text-[10px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Article</th>
                    <th className="py-3 px-4">Department / Category</th>
                    <th className="py-3 px-4 text-right">Available Stock</th>
                    <th className="py-3 px-4 text-right">30-Day Sales</th>
                    <th className="py-3 px-4 text-right">Retail Unit Price</th>
                    <th className="py-3 px-4 text-right">Capital Tied Up</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoadingSlowMoving ? (
                    <SkeletonTableRows cols={7} rows={5} />
                  ) : slowMovingItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-gray-500">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="font-medium text-gray-700">No stagnant or dead stock detected</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">All inventory articles are maintaining healthy sales velocity.</p>
                      </td>
                    </tr>
                  ) : (
                    slowMovingItems.map(item => {
                      const capitalTiedUp = item.stock_quantity * item.selling_price;
                      return (
                        <tr key={item.product_id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">
                                {item.image_url ? (
                                  <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                              <span className="font-medium text-gray-900">{item.product_name}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700">
                              {item.category}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-gray-900">
                            {item.stock_quantity} units
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-rose-600">
                            {item.units_sold} sold
                          </td>

                          <td className="py-3 px-4 text-right font-mono tabular-nums text-gray-700">
                            {formatCurrency(item.selling_price)} ETB
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-gray-900">
                            {formatCurrency(capitalTiedUp)} ETB
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('stock_levels');
                                setSearch(item.product_name);
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-md transition-colors cursor-pointer shadow-2xs"
                            >
                              View Stock
                            </button>
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
      )}

      {/* ============================================================== */}
      {/* MODAL 1: Stock Adjustment Modal                                */}
      {/* ============================================================== */}
      {adjustModalProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 tracking-tight">Adjust Stock</h3>
                <p className="text-xs text-gray-500 mt-0.5">Record a real stock increase or decrease.</p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustModalProduct(null)}
                className="text-gray-400 hover:text-gray-600 p-1 -mr-1 -mt-1 rounded-lg cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {adjustError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleConfirmAdjustment} className="space-y-4 text-xs">
              {/* "What changed?" Toggle Cards */}
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-2">What changed?</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Add stock card */}
                  <button
                    type="button"
                    onClick={() => setAdjustDirection('add')}
                    className={`text-left p-3.5 rounded-xl transition-all cursor-pointer border ${
                      adjustDirection === 'add'
                        ? 'border-[#759A8B] bg-[#EBF3EF] shadow-2xs'
                        : 'border-gray-200 bg-white hover:bg-gray-50/50'
                    }`}
                  >
                    <div className={`text-xs font-bold ${adjustDirection === 'add' ? 'text-[#244234]' : 'text-gray-900'}`}>
                      Add stock
                    </div>
                    <div className={`text-[11px] mt-0.5 ${adjustDirection === 'add' ? 'text-[#4D6D5E]' : 'text-gray-500'}`}>
                      Received or found
                    </div>
                  </button>

                  {/* Remove stock card */}
                  <button
                    type="button"
                    onClick={() => setAdjustDirection('remove')}
                    className={`text-left p-3.5 rounded-xl transition-all cursor-pointer border ${
                      adjustDirection === 'remove'
                        ? 'border-[#759A8B] bg-[#EBF3EF] shadow-2xs'
                        : 'border-gray-200 bg-white hover:bg-gray-50/50'
                    }`}
                  >
                    <div className={`text-xs font-bold ${adjustDirection === 'remove' ? 'text-[#244234]' : 'text-gray-900'}`}>
                      Remove stock
                    </div>
                    <div className={`text-[11px] mt-0.5 ${adjustDirection === 'remove' ? 'text-[#4D6D5E]' : 'text-gray-500'}`}>
                      Damaged, expired, or lost
                    </div>
                  </button>
                </div>
              </div>

              {/* Quantity and Reason Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={adjustQuantityInput}
                    onChange={e => setAdjustQuantityInput(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:border-[#759A8B] focus:ring-1 focus:ring-[#759A8B]"
                  />
                  <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
                    Enter a positive number; the action above sets the direction.
                  </p>
                </div>

                {/* Reason Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={adjustReasonOption}
                      onChange={e => setAdjustReasonOption(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:border-[#759A8B] focus:ring-1 focus:ring-[#759A8B] cursor-pointer appearance-none pr-9"
                    >
                      <option value="" disabled>Select reason</option>
                      <option value="Damaged">Damaged</option>
                      <option value="Lost">Lost</option>
                      <option value="Found">Found</option>
                      <option value="Count Correction">Count Correction</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Batch # Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                  Batch # <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={selectedBatchId}
                    onChange={e => setSelectedBatchId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:border-[#759A8B] focus:ring-1 focus:ring-[#759A8B] cursor-pointer appearance-none pr-9"
                  >
                    <option value="" disabled>Select batch</option>
                    {adjustModalProduct.batches.map(batch => (
                      <option key={batch.variant_id} value={batch.variant_id}>
                        {batch.batch_number} {batch.size ? `· ${batch.size}` : ''} {batch.color ? `· ${batch.color}` : ''} ({batch.quantity} on hand)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Which physical batch the change applies to.
                </p>
              </div>

              {/* Collapsible "Add a note" container */}
              <div className="border border-gray-200 rounded-2xl bg-white p-3.5 transition-all">
                <button
                  type="button"
                  onClick={() => setShowNoteField(prev => !prev)}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 shrink-0 shadow-2xs">
                      <SlidersHorizontal className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">Add a note</div>
                      <div className="text-[11px] text-gray-500">Record context for the audit trail.</div>
                    </div>
                  </div>
                  {showNoteField ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {showNoteField && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <textarea
                      placeholder="Record context for the audit trail..."
                      rows={2}
                      value={adjustNote}
                      onChange={e => setAdjustNote(e.target.value)}
                      className="w-full p-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#759A8B] focus:bg-white resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="px-5 py-2.5 bg-[#759A8B] hover:bg-[#628476] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  {isAdjusting ? 'Processing...' : adjustDirection === 'add' ? 'Add stock' : 'Remove stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: Edit Parent Product Modal                             */}
      {/* ============================================================== */}
      {editingParent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-500">
                  Catalog Inventory Specifications
                </span>
                <h3 className="font-bold text-base text-gray-900 mt-0.5">Edit Product Parameters</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingParent(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {parentEditError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium">
                {parentEditError}
              </div>
            )}

            <form onSubmit={handleSaveParent} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editingParent.name}
                  onChange={e => setEditingParent({ ...editingParent, name: e.target.value })}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#B89B65]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Department / Category</label>
                <select
                  value={editingParent.categoryId}
                  onChange={e => setEditingParent({ ...editingParent, categoryId: e.target.value })}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#B89B65] cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Selling Price (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingParent.sellingPrice}
                    onChange={e => setEditingParent({ ...editingParent, sellingPrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg font-mono text-xs tabular-nums focus:outline-none focus:border-[#B89B65]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Cost Price (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingParent.costPrice}
                    onChange={e => setEditingParent({ ...editingParent, costPrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg font-mono text-xs tabular-nums focus:outline-none focus:border-[#B89B65]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Reorder / Low-Stock Threshold</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={editingParent.minThreshold}
                  onChange={e => setEditingParent({ ...editingParent, minThreshold: Number(e.target.value) })}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-lg font-mono text-xs tabular-nums focus:outline-none focus:border-[#B89B65]"
                />
                <p className="text-[10px] text-gray-400 mt-1">Triggers low-stock warnings when total stock drops to or below this level.</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingParent(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingParent}
                  className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#B89B65] text-white rounded-lg font-medium transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSavingParent ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: Edit Child Variant / Batch Modal                      */}
      {/* ============================================================== */}
      {editingVariant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-500">
                  Batch Variant Control
                </span>
                <h3 className="font-bold text-base text-gray-900 mt-0.5">
                  Edit Batch: {editingVariant.sku}
                </h3>
                <p className="text-xs text-gray-500">{editingVariant.productName}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingVariant(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {variantEditError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium">
                {variantEditError}
              </div>
            )}

            <form onSubmit={handleSaveVariant} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Batch # / SKU</label>
                  <input
                    type="text"
                    required
                    value={editingVariant.sku}
                    onChange={e => setEditingVariant({ ...editingVariant, sku: e.target.value })}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg font-mono text-xs focus:outline-none focus:border-[#B89B65]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Barcode / EAN</label>
                  <input
                    type="text"
                    value={editingVariant.barcode}
                    onChange={e => setEditingVariant({ ...editingVariant, barcode: e.target.value })}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg font-mono text-xs focus:outline-none focus:border-[#B89B65]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Size / Volume</label>
                  <input
                    type="text"
                    value={editingVariant.size}
                    onChange={e => setEditingVariant({ ...editingVariant, size: e.target.value })}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#B89B65]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Color / Finish</label>
                  <input
                    type="text"
                    value={editingVariant.color}
                    onChange={e => setEditingVariant({ ...editingVariant, color: e.target.value })}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#B89B65]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Selling Price (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingVariant.sellingPrice}
                    onChange={e => setEditingVariant({ ...editingVariant, sellingPrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg font-mono text-xs tabular-nums focus:outline-none focus:border-[#B89B65]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Cost Price (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingVariant.costPrice}
                    onChange={e => setEditingVariant({ ...editingVariant, costPrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg font-mono text-xs tabular-nums focus:outline-none focus:border-[#B89B65]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Min Threshold (Units)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={editingVariant.minThreshold}
                  onChange={e => setEditingVariant({ ...editingVariant, minThreshold: Number(e.target.value) })}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-lg font-mono text-xs tabular-nums focus:outline-none focus:border-[#B89B65]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingVariant(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingVariant}
                  className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#B89B65] text-white rounded-lg font-medium transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSavingVariant ? 'Saving...' : 'Save Batch Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
