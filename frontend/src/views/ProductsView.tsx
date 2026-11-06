import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api.ts';
import { Product, Category, Subcategory, Brand, Supplier, Variant } from '../types.ts';
import { formatCurrency } from '../lib/currency.ts';
import {
  BOUTIQUE_CATEGORIES_CONFIG,
  VARIANT_TEMPLATES,
  getCategoryConfig
} from '../lib/productCategories.ts';
import {
  Search,
  Plus,
  Filter,
  DollarSign,
  Package,
  Trash2,
  Edit,
  X,
  Check,
  Download,
  AlertCircle,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Tag,
  Eye,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';

interface VariantFormRow {
  id?: string;
  size: string;
  color: string;
  color_code: string;
  variant_name?: string;
  sku?: string;
  barcode?: string;
  purchase_price?: number;
  selling_price?: number;
  quantity: number;
}

export function ProductsView() {
  const { role } = useAuth();
  const canManageCatalog = role === 'admin' || role === 'store_person';
  const isSales = role === 'sales';

  // Catalog Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Filtering & Search
  const [search, setSearch] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Add / Edit Product Modal State
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formCatId, setFormCatId] = useState<string>('');
  const [formSubcatId, setFormSubcatId] = useState<string>('');
  const [formBrandId, setFormBrandId] = useState<string>('');
  const [formSupplierId, setFormSupplierId] = useState<string>('');
  const [formPurchasePrice, setFormPurchasePrice] = useState<number>(100);
  const [formSellingPrice, setFormSellingPrice] = useState<number>(250);
  const [formWholesalePrice, setFormWholesalePrice] = useState<number>(180);
  const [formTaxRate, setFormTaxRate] = useState<number>(0.15);
  const [formMinStock, setFormMinStock] = useState<number>(3);
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'active' | 'archived' | 'draft' | 'pending_approval' | 'rejected'>('active');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [rejectingProduct, setRejectingProduct] = useState<Product | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState<string>('');
  const [isProcessingApproval, setIsProcessingApproval] = useState<boolean>(false);
  const [formIsSimple, setFormIsSimple] = useState<boolean>(false);
  const [formSimpleStock, setFormSimpleStock] = useState<number>(10);
  const [formSimpleSku, setFormSimpleSku] = useState<string>('');
  const [formSimpleBarcode, setFormSimpleBarcode] = useState<string>('');
  const [formBarcode, setFormBarcode] = useState<string>('');

  // Dynamic Attributes & Custom Attributes
  const [dynamicAttributes, setDynamicAttributes] = useState<Record<string, string>>({});
  const [customAttributesList, setCustomAttributesList] = useState<{ key: string; value: string }[]>([]);

  // Multi-variant Rows
  const [variantsList, setVariantsList] = useState<VariantFormRow[]>([
    { size: 'S', color: 'Noir Black', color_code: '#111111', quantity: 5 },
    { size: 'M', color: 'Noir Black', color_code: '#111111', quantity: 8 },
    { size: 'L', color: 'Noir Black', color_code: '#111111', quantity: 4 }
  ]);

  // Category & Subcategory Management Modal State
  const [showCatManagerModal, setShowCatManagerModal] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatDesc, setNewCatDesc] = useState<string>('');
  const [targetCatForSubcat, setTargetCatForSubcat] = useState<string>('');
  const [newSubcatName, setNewSubcatName] = useState<string>('');
  const [newSubcatDesc, setNewSubcatDesc] = useState<string>('');

  // Selected product for quick details modal
  const [viewProductDetails, setViewProductDetails] = useState<Product | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedCategoryFilter, selectedSubcategoryFilter, statusFilter, brandFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, cats, subcats, brs, sups, countRes] = await Promise.all([
        api.getProducts({
          category: selectedCategoryFilter,
          subcategory: selectedSubcategoryFilter,
          brand: brandFilter,
          status: statusFilter
        }),
        api.getCategories(),
        api.getSubcategories(),
        api.getBrands(),
        !isSales ? api.getSuppliers().catch(() => []) : Promise.resolve([]),
        !isSales ? api.getPendingProductCount().catch(() => ({ count: 0 })) : Promise.resolve({ count: 0 })
      ]);

      setProducts(prods);
      setCategories(cats);
      setSubcategories(subcats);
      setBrands(brs);
      setSuppliers(sups);
      setPendingCount(countRes?.count ?? 0);

      if (!formCatId && cats.length > 0) {
        setFormCatId(cats[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load catalog data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Subcategories available for current form category
  const activeCategoryConfig = useMemo(() => {
    const matchedCategory = categories.find(c => c.id === formCatId);
    return getCategoryConfig(matchedCategory?.slug || matchedCategory?.id || formCatId);
  }, [formCatId, categories]);

  const availableSubcategoriesForForm = useMemo(() => {
    if (!formCatId) return [];
    return subcategories.filter(s => s.category_id === formCatId && s.is_active !== 0);
  }, [formCatId, subcategories]);

  // When form category changes, adjust subcategory and attributes defaults
  const handleCategoryChange = (newCatId: string) => {
    setFormCatId(newCatId);
    const catSubs = subcategories.filter(s => s.category_id === newCatId && s.is_active !== 0);
    setFormSubcatId(catSubs.length > 0 ? catSubs[0].id : '');

    // Reset dynamic attributes for this category
    const matchedCat = categories.find(c => c.id === newCatId);
    const cfg = getCategoryConfig(matchedCat?.slug || matchedCat?.id || newCatId);
    if (cfg) {
      const newAttrs: Record<string, string> = {};
      cfg.attributeSchema.forEach(f => {
        newAttrs[f.key] = f.options ? f.options[0] : '';
      });
      setDynamicAttributes(newAttrs);

      // Pre-set suggested variant template if multi-variant
      if (VARIANT_TEMPLATES[cfg.suggestedVariantType]) {
        setVariantsList(VARIANT_TEMPLATES[cfg.suggestedVariantType]);
      }
      if (cfg.suggestedVariantType === 'simple') {
        setFormIsSimple(true);
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setFormName('');
    setFormDesc('');
    const firstCat = categories[0]?.id || 'cat_clothing';
    handleCategoryChange(firstCat);
    setFormBrandId(brands[0]?.id || '');
    setFormSupplierId(suppliers[0]?.id || '');
    setFormPurchasePrice(120);
    setFormSellingPrice(295);
    setFormWholesalePrice(210);
    setFormTaxRate(0.15);
    setFormMinStock(3);
    setFormImageUrl(BOUTIQUE_CATEGORIES_CONFIG[0]?.sampleImages[0]?.url || '');
    setFormStatus('active');
    setFormIsSimple(false);
    setFormSimpleStock(12);
    setFormSimpleSku('');
    setFormSimpleBarcode('');
    setFormBarcode('');
    setCustomAttributesList([]);
    setFormError(null);
    setShowProductModal(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProductId(product.id);
    setFormName(product.name);
    setFormDesc(product.description || '');
    setFormCatId(product.category_id || categories[0]?.id || '');
    setFormSubcatId(product.subcategory_id || '');
    setFormBrandId(product.brand_id || '');
    setFormSupplierId(product.supplier_id || '');
    setFormPurchasePrice(Number(product.purchase_price) || 0);
    setFormSellingPrice(Number(product.selling_price) || 0);
    setFormWholesalePrice(Number(product.wholesale_price) || 0);
    setFormTaxRate(product.tax_rate !== undefined && product.tax_rate !== null ? Number(product.tax_rate) : 0.15);
    setFormMinStock(product.min_stock_level || 3);
    setFormImageUrl(product.image_url || '');
    setFormStatus(product.status || 'active');
    setFormIsSimple(Boolean(product.is_simple));
    setFormBarcode(product.barcode || '');

    // Parse attributes
    let existingAttrs: Record<string, any> = {};
    if (product.attributes) {
      if (typeof product.attributes === 'object') {
        existingAttrs = product.attributes;
      } else {
        try {
          existingAttrs = JSON.parse(product.attributes);
        } catch (e) {}
      }
    }
    setDynamicAttributes(existingAttrs);

    // Variants
    if (product.variants && product.variants.length > 0) {
      setVariantsList(
        product.variants.map(v => ({
          id: v.id,
          size: v.size || 'One Size',
          color: v.color || 'Standard',
          color_code: v.color_code || '#B89B65',
          variant_name: v.variant_name || `${v.size} · ${v.color}`,
          sku: v.sku,
          barcode: v.barcode,
          purchase_price: v.purchase_price,
          selling_price: v.selling_price,
          quantity: v.stock_quantity ?? 0
        }))
      );
      if (product.is_simple) {
        setFormSimpleStock(product.variants[0]?.stock_quantity ?? 0);
        setFormSimpleSku(product.variants[0]?.sku || '');
        setFormSimpleBarcode(product.variants[0]?.barcode || '');
      }
    }
    setCustomAttributesList([]);
    setFormError(null);
    setShowProductModal(true);
  };

  const handleApplyVariantTemplate = (type: keyof typeof VARIANT_TEMPLATES) => {
    if (VARIANT_TEMPLATES[type]) {
      setVariantsList(VARIANT_TEMPLATES[type]);
    }
  };

  const handleAddVariantRow = () => {
    setVariantsList(prev => [
      ...prev,
      {
        size: prev[prev.length - 1]?.size || 'M',
        color: 'Champagne Gold',
        color_code: '#B89B65',
        quantity: 5
      }
    ]);
  };

  const handleRemoveVariantRow = (index: number) => {
    if (variantsList.length <= 1) return;
    setVariantsList(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAddCustomAttribute = () => {
    setCustomAttributesList(prev => [...prev, { key: '', value: '' }]);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSellingPrice) {
      setFormError('Product title and retail selling price are required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    // Merge dynamic category attributes with custom attributes
    const finalAttributes: Record<string, any> = { ...dynamicAttributes };
    customAttributesList.forEach(item => {
      if (item.key.trim()) {
        finalAttributes[item.key.trim()] = item.value;
      }
    });

    const payload = {
      name: formName.trim(),
      description: formDesc.trim(),
      category_id: formCatId || null,
      subcategory_id: formSubcatId || null,
      brand_id: formBrandId || null,
      supplier_id: formSupplierId || null,
      purchase_price: Number(formPurchasePrice) || 0,
      selling_price: Number(formSellingPrice),
      wholesale_price: Number(formWholesalePrice) || 0,
      tax_rate: Number(formTaxRate),
      min_stock_level: Number(formMinStock) || 3,
      image_url: formImageUrl.trim(),
      status: formStatus,
      is_simple: formIsSimple ? 1 : 0,
      attributes: finalAttributes,
      // If simple product: pass single stock quantity, sku and barcode
      initial_stock: formIsSimple ? Number(formSimpleStock) : undefined,
      sku: formIsSimple ? formSimpleSku : undefined,
      barcode: formIsSimple ? (formSimpleBarcode || formBarcode || undefined) : (formBarcode || undefined),
      // If multi-variant:
      variants: !formIsSimple
        ? variantsList.map(v => ({
            id: v.id,
            size: v.size || 'One Size',
            color: v.color || 'Standard',
            color_code: v.color_code || '#B89B65',
            variant_name: v.variant_name || `${v.size} · ${v.color}`,
            sku: v.sku,
            barcode: v.barcode,
            purchase_price: v.purchase_price !== undefined ? Number(v.purchase_price) : Number(formPurchasePrice),
            selling_price: v.selling_price !== undefined ? Number(v.selling_price) : Number(formSellingPrice),
            quantity: Number(v.quantity) || 0
          }))
        : []
    };

    try {
      if (editingProductId) {
        await api.updateProduct(editingProductId, payload);
        setSuccessMsg(`"${formName}" updated successfully.`);
      } else {
        await api.createProduct(payload);
        setSuccessMsg(`"${formName}" registered successfully.`);
      }

      setShowProductModal(false);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive "${name}"? Archived items are removed from active POS and catalog listings.`)) return;
    try {
      await api.archiveProduct(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to archive product.');
    }
  };

  // Administrator Product Approval Workflow Handlers
  const handleApproveProduct = async (id: string, name: string) => {
    setIsProcessingApproval(true);
    try {
      const res = await api.approveProduct(id);
      setSuccessMsg(res.message || `"${name}" approved successfully. It is now active on POS.`);
      await loadData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to approve product.');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleOpenRejectModal = (product: Product) => {
    setRejectingProduct(product);
    setRejectionReasonText('Pricing or category specifications need revision before sales launch.');
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingProduct) return;
    setIsProcessingApproval(true);
    try {
      const res = await api.rejectProduct(rejectingProduct.id, rejectionReasonText.trim());
      setSuccessMsg(res.message || `"${rejectingProduct.name}" rejected.`);
      setRejectingProduct(null);
      await loadData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to reject product.');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // Subcategory management handlers
  const handleCreateNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.createCategory({ name: newCatName.trim(), description: newCatDesc.trim() });
      setNewCatName('');
      setNewCatDesc('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create category.');
    }
  };

  const handleCreateNewSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCatForSubcat || !newSubcatName.trim()) {
      alert('Please select parent category and enter subcategory name.');
      return;
    }
    try {
      await api.createSubcategory({
        category_id: targetCatForSubcat,
        name: newSubcatName.trim(),
        description: newSubcatDesc.trim()
      });
      setNewSubcatName('');
      setNewSubcatDesc('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create subcategory.');
    }
  };

  const handleToggleSubcategoryActive = async (sub: Subcategory) => {
    const nextState = sub.is_active === 1 ? 0 : 1;
    try {
      await api.updateSubcategory(sub.id, { is_active: nextState });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update subcategory.');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Category', 'Subcategory', 'Brand', 'Selling Price', 'Cost Price', 'Total Stock', 'Status'];
    const rows = products.map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category_name || '',
      p.subcategory_name || '',
      p.brand_name || '',
      p.selling_price,
      p.purchase_price ?? '',
      p.total_stock ?? 0,
      p.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `atelier_aurum_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* View Header & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E5E0D8] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1A1A1A]">Product Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#B89B65]/15 text-[#8C733E]">
              10 Department Catalog
            </span>
          </div>
          <p className="text-xs text-[#716D66] mt-1">
            Universal boutique inventory across Apparel, Footwear, Leather, Fine Jewelry, Beauty, Hair & Gifts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {canManageCatalog && (
            <button
              onClick={() => {
                setTargetCatForSubcat(categories[0]?.id || '');
                setShowCatManagerModal(true);
              }}
              className="px-3 py-2 bg-white border border-[#E5E0D8] hover:border-[#B89B65] text-[#1A1A1A] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FolderTree className="w-3.5 h-3.5 text-[#B89B65]" />
              <span>Categories & Subcategories</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white border border-[#E5E0D8] hover:border-[#B89B65] text-[#1A1A1A] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#716D66]" />
            <span>Export CSV</span>
          </button>

          {canManageCatalog && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#B89B65] text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Admin Review Banner if pending approvals exist */}
      {role === 'admin' && pendingCount > 0 && (
        <div className="p-4 bg-[#FFFDF7] border border-[#F2DEAC] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FAF0D7] border border-[#E8CE8B] flex items-center justify-center shrink-0 text-[#8C733E]">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-2">
                Administrator Approval Queue
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B89B65] text-white">
                  {pendingCount} Pending
                </span>
              </h4>
              <p className="text-[11px] text-[#716D66] mt-0.5">
                Store Persons registered new items that require your approval before appearing on the POS sales screen.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setStatusFilter('pending_approval')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                statusFilter === 'pending_approval'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-white border border-[#E5E0D8] text-[#1A1A1A] hover:border-[#B89B65]'
              }`}
            >
              Review Pending Items ({pendingCount})
            </button>
          </div>
        </div>
      )}

      {/* Workflow Status Filter Tabs */}
      {!isSales && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] font-semibold text-[#8C8275] uppercase tracking-wider pr-1">Status:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-white border border-[#E5E0D8] text-[#59554F] hover:text-[#1A1A1A]'
            }`}
          >
            All Products
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'active'
                ? 'bg-emerald-700 text-white'
                : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <span>Live in POS</span>
          </button>
          <button
            onClick={() => setStatusFilter('pending_approval')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'pending_approval'
                ? 'bg-amber-600 text-white'
                : 'bg-white border border-amber-300 text-amber-800 hover:bg-amber-50'
            }`}
          >
            <span>Pending Review</span>
            {pendingCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                statusFilter === 'pending_approval' ? 'bg-white text-amber-700' : 'bg-amber-500 text-white'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              statusFilter === 'rejected'
                ? 'bg-rose-700 text-white'
                : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              statusFilter === 'archived'
                ? 'bg-gray-700 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Archived
          </button>
        </div>
      )}

      {/* Filter Tabs by Category (All 10 Categories) */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => {
              setSelectedCategoryFilter('all');
              setSelectedSubcategoryFilter('all');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              selectedCategoryFilter === 'all'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'bg-white border border-[#E5E0D8] text-[#59554F] hover:text-[#1A1A1A] hover:border-[#B89B65]'
            }`}
          >
            All Departments ({products.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategoryFilter(cat.id);
                setSelectedSubcategoryFilter('all');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategoryFilter === cat.id
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'bg-white border border-[#E5E0D8] text-[#59554F] hover:text-[#1A1A1A] hover:border-[#B89B65]'
              }`}
            >
              <span>{cat.name}</span>
              {cat.product_count !== undefined && cat.product_count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategoryFilter === cat.id ? 'bg-[#B89B65] text-white' : 'bg-[#EFECE6] text-[#716D66]'
                  }`}
                >
                  {cat.product_count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Subcategory Pills (when a category is selected) */}
        {selectedCategoryFilter !== 'all' && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 bg-[#F9F8F6] rounded-lg border border-[#EFECE6]">
            <span className="text-[11px] font-semibold text-[#8C8275] pl-2 pr-1 uppercase tracking-wider shrink-0">
              Subcategory:
            </span>
            <button
              onClick={() => setSelectedSubcategoryFilter('all')}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                selectedSubcategoryFilter === 'all'
                  ? 'bg-[#B89B65] text-white font-medium'
                  : 'text-[#59554F] hover:text-[#1A1A1A]'
              }`}
            >
              All Subcategories
            </button>
            {subcategories
              .filter(s => s.category_id === selectedCategoryFilter && s.is_active !== 0)
              .map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategoryFilter(sub.id)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                    selectedSubcategoryFilter === sub.id
                      ? 'bg-[#B89B65] text-white font-medium'
                      : 'text-[#59554F] hover:text-[#1A1A1A]'
                  }`}
                >
                  {sub.name}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-3.5 rounded-xl border border-[#E5E0D8]">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-[#716D66] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, SKU, barcode, metal, material, or subcategory..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F9F8F6] border border-[#E5E0D8] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B89B65]"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#F9F8F6] border border-[#E5E0D8] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B89B65]"
          >
            <option value="all">All Designer Houses / Brands</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.country || 'Global'})
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3 flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#F9F8F6] border border-[#E5E0D8] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B89B65]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active (Live in POS)</option>
            <option value="pending_approval">Pending Approval {pendingCount > 0 ? `(${pendingCount})` : ''}</option>
            <option value="rejected">Rejected by Admin</option>
            <option value="draft">Draft Review</option>
            <option value="archived">Archived</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setSelectedCategoryFilter('all');
              setSelectedSubcategoryFilter('all');
              setBrandFilter('all');
              setStatusFilter('all');
            }}
            title="Reset Filters"
            className="p-2 border border-[#E5E0D8] rounded-lg text-[#716D66] hover:text-[#1A1A1A] hover:bg-[#F9F8F6] transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-[#E5E0D8] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F9F8F6] border-b border-[#E5E0D8] text-[11px] font-semibold text-[#59554F] uppercase tracking-wider">
                <th className="py-3.5 px-4">Item & Specifications</th>
                <th className="py-3.5 px-3">Department & Category</th>
                <th className="py-3.5 px-3">Brand / House</th>
                <th className="py-3.5 px-3 text-right">Retail Price</th>
                {!isSales && <th className="py-3.5 px-3 text-right">Cost Price</th>}
                <th className="py-3.5 px-3 text-center">Variants</th>
                <th className="py-3.5 px-3 text-right">Available Stock</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D8]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-[#716D66]">
                    Loading boutique catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-xs text-[#716D66]">
                    No items found matching the selected filters.
                  </td>
                </tr>
              ) : (
                products.map(product => {
                  const totalStock =
                    product.total_stock !== undefined
                      ? product.total_stock
                      : product.variants?.reduce((sum, v) => sum + (v.stock_quantity || 0), 0) ?? 0;
                  const isOutOfStock = totalStock <= 0;
                  const isLowStock = totalStock <= (product.min_stock_level || 3);

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-[#FAF9F6] transition-colors group"
                    >
                      {/* Product Name & Image */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg bg-[#F5F2EB] border border-[#E5E0D8] overflow-hidden shrink-0 flex items-center justify-center">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-[#B89B65]" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <h4 className="font-medium text-[#1A1A1A] truncate text-xs">{product.name}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#716D66]">
                              {product.is_simple ? (
                                <span className="text-[10px] bg-[#EFECE6] text-[#59554F] px-1.5 py-0.2 rounded font-mono">
                                  Simple Item
                                </span>
                              ) : (
                                <span className="text-[10px] bg-[#F5EEDB] text-[#8C733E] px-1.5 py-0.2 rounded font-mono">
                                  {product.variants?.length || 0} Variants
                                </span>
                              )}
                              {product.material && <span className="truncate">· {product.material}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department & Subcategory */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1A1A1A]/8 text-[#1A1A1A]">
                            {product.category_name || 'Boutique'}
                          </span>
                          {product.subcategory_name && (
                            <p className="text-[11px] text-[#716D66] font-medium">{product.subcategory_name}</p>
                          )}
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="py-3 px-3">
                        <span className="text-xs text-[#1A1A1A] font-medium">
                          {product.brand_name || 'Hirbit Store Collection'}
                        </span>
                      </td>

                      {/* Retail Price */}
                      <td className="py-3 px-3 text-right tabular-nums font-semibold text-[#1A1A1A]">
                        {formatCurrency(product.selling_price)}
                      </td>

                      {/* Cost Price */}
                      {!isSales && (
                        <td className="py-3 px-3 text-right tabular-nums text-[#716D66]">
                          {formatCurrency(product.purchase_price)}
                        </td>
                      )}

                      {/* Variants Preview */}
                      <td className="py-3 px-3 text-center">
                        {product.variants && product.variants.length > 0 ? (
                          <div className="flex items-center justify-center gap-1 flex-wrap max-w-28 mx-auto">
                            {product.variants.slice(0, 3).map((v, i) => (
                              <span
                                key={i}
                                className="inline-block text-[10px] bg-[#F9F8F6] border border-[#E5E0D8] px-1.5 py-0.5 rounded text-[#59554F]"
                                title={`${v.size} - ${v.color} (${v.stock_quantity ?? 0} in stock)`}
                              >
                                {v.size}
                              </span>
                            ))}
                            {product.variants.length > 3 && (
                              <span className="text-[10px] text-[#8C8275]">+{product.variants.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#8C8275]">—</span>
                        )}
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-semibold tabular-nums text-xs px-2 py-0.5 rounded-full ${
                            isOutOfStock
                              ? 'bg-red-50 text-red-700'
                              : isLowStock
                              ? 'bg-amber-50 text-amber-700'
                              : 'text-[#1A1A1A]'
                          }`}
                        >
                          {totalStock} units
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {product.status === 'active' && (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active (In POS)
                          </span>
                        )}
                        {product.status === 'pending_approval' && (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              Pending Approval
                            </span>
                            {product.created_by_name && (
                              <span className="text-[9px] text-[#8C8275] mt-0.5 whitespace-nowrap">
                                by {product.created_by_name}
                              </span>
                            )}
                          </div>
                        )}
                        {product.status === 'rejected' && (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Rejected
                            </span>
                            {product.rejection_reason && (
                              <span
                                className="text-[9px] text-rose-600 mt-0.5 max-w-28 truncate cursor-help"
                                title={product.rejection_reason}
                              >
                                {product.rejection_reason}
                              </span>
                            )}
                          </div>
                        )}
                        {product.status === 'draft' && (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Draft
                          </span>
                        )}
                        {product.status === 'archived' && (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-500">
                            Archived
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Admin One-Click Approval & Reject Actions */}
                          {role === 'admin' && product.status === 'pending_approval' && (
                            <>
                              <button
                                onClick={() => handleApproveProduct(product.id, product.name)}
                                disabled={isProcessingApproval}
                                title="Approve Product for POS Sales"
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleOpenRejectModal(product)}
                                disabled={isProcessingApproval}
                                title="Reject with Reason"
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {/* Store Person Fix & Resubmit for Rejected items */}
                          {role === 'store_person' && product.status === 'rejected' && (
                            <button
                              onClick={() => handleOpenEditModal(product)}
                              title="Edit & Resubmit for Approval"
                              className="px-2 py-1 bg-[#1A1A1A] hover:bg-[#B89B65] text-white rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Fix & Resubmit</span>
                            </button>
                          )}

                          <button
                            onClick={() => setViewProductDetails(product)}
                            title="Quick View"
                            className="p-1.5 text-[#716D66] hover:text-[#1A1A1A] hover:bg-[#EFECE6] rounded transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canManageCatalog && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(product)}
                                title="Edit Product & Attributes"
                                className="p-1.5 text-[#716D66] hover:text-[#B89B65] hover:bg-[#EFECE6] rounded transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {product.status !== 'archived' && (
                                <button
                                  onClick={() => handleArchive(product.id, product.name)}
                                  title="Archive Product"
                                  className="p-1.5 text-[#716D66] hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
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
      {/* MODAL: ADD / EDIT PRODUCT                                      */}
      {/* ============================================================== */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-2xl border border-[#E5E0D8] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E5E0D8] bg-[#F9F8F6] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B89B65]">
                  {editingProductId ? 'Edit Boutique Article' : 'New Article Creation'}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
                  {editingProductId ? `Edit "${formName || 'Article'}"` : 'Register Product into Luxury Catalog'}
                </h3>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1.5 text-[#716D66] hover:text-[#1A1A1A] rounded-lg hover:bg-[#EFECE6] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Store Person Workflow Callout */}
              {role === 'store_person' && !editingProductId && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-amber-900">Store Person Approval Workflow</h5>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Newly registered products will be placed in <strong>Pending Approval</strong> status. An Administrator must review and approve this item before it appears on the sales dashboard and POS for selling.
                    </p>
                  </div>
                </div>
              )}

              {/* Rejection Notice if resubmitting */}
              {editingProductId && formStatus === 'rejected' && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-rose-900">Administrator Rejection Feedback</h5>
                    <p className="text-[11px] text-rose-800 mt-0.5">
                      <strong>Reason:</strong> {products.find(p => p.id === editingProductId)?.rejection_reason || 'Product requires correction.'}
                    </p>
                    <p className="text-[10px] text-rose-700 mt-1 font-medium">
                      Saving your edits will automatically resubmit this product for Administrator review.
                    </p>
                  </div>
                </div>
              )}

              {/* Section 1: Basic Information & Department */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#EFECE6] pb-2">
                  <h4 className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#B89B65]" />
                    1. Department & Classification
                  </h4>
                  {/* Simple vs Multi-variant switch */}
                  <div className="flex items-center bg-[#EFECE6] p-0.5 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setFormIsSimple(false)}
                      className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                        !formIsSimple ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-[#716D66]'
                      }`}
                    >
                      Multi-Variant (Sizes / Colors / Notes)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormIsSimple(true)}
                      className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                        formIsSimple ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-[#716D66]'
                      }`}
                    >
                      Simple Item (Single SKU)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                      Department / Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formCatId}
                      onChange={e => handleCategoryChange(e.target.value)}
                      className="w-full p-2 bg-[#F9F8F6] border border-[#E5E0D8] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B89B65]"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                      Subcategory / Silhouette <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formSubcatId}
                      onChange={e => setFormSubcatId(e.target.value)}
                      className="w-full p-2 bg-[#F9F8F6] border border-[#E5E0D8] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B89B65]"
                    >
                      <option value="">Select Subcategory</option>
                      {availableSubcategoriesForForm.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                      Product Title / Model Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., The Seraphine Silk Slip Gown or Saint-Honoré Satin Pointed Pumps"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="w-full p-2 bg-[#F9F8F6] border border-[#E5E0D8] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B89B65]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1A1A1A] mb-1">Status</label>
                    {role === 'store_person' && !editingProductId ? (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-semibold flex items-center justify-between">
                        <span>Pending Approval</span>
                        <span className="text-[10px] text-amber-700 font-normal">Requires Admin</span>
                      </div>
                    ) : (
                      <select
                        value={formStatus}
                        onChange={e => setFormStatus(e.target.value as any)}
                        className="w-full p-2 bg-[#F9F8F6] border border-[#E5E0D8] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B89B65]"
                      >
                        <option value="active">Active (Available on POS)</option>
                        <option value="pending_approval">Pending Approval</option>
                        <option value="draft">Draft (Backstage Review)</option>
                        <option value="archived">Archived</option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#1A1A1A] mb-1">Designer House / Brand</label>
                    <select
                      value={formBrandId}
                      onChange={e => setFormBrandId(e.target.value)}
                      className="w-full p-2 bg-[#F9F8F6] border border-[#E5E0D8] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B89B65]"
                    >
                      <option value="">No Designer Specified</option>
                      {brands.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.country || 'Global'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1A1A1A] mb-1">Primary Supplier / Artisan</label>
                    <select
                      value={formSupplierId}
                      onChange={e => setFormSupplierId(e.target.value)}
                      className="w-full p-2 bg-[#F9F8F6] border border-[#E5E0D8] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B89B65]"
                    >
                      <option value="">No Supplier Assigned</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.company_name} ({s.contact_person || 'Representative'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1A1A1A] mb-1">Editorial Description</label>
                  <textarea
                    rows={2}
                    placeholder="Artisan craftsmanship notes, styling advice, composition and provenance..."
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    className="w-full p-2 bg-[#F9F8F6] border border-[#E5E0D8] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B89B65]"
                  />
                </div>
              </div>

              {/* Section 2: Financials & Pricing */}
              <div className="space-y-4">
                <div className="border-b border-[#EFECE6] pb-2">
                  <h4 className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#B89B65]" />
                    2. Pricing & Financials
                  </h4>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                      Selling Price (ETB) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formSellingPrice}
                      onChange={e => setFormSellingPrice(Number(e.target.value))}
                      className="w-full p-2 bg-[#F9F8F6] border border-[#E5E0D8] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B89B65]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                      Cost Price (ETB)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formPurchasePrice}
                      onChange={e => setFormPurchasePrice(Number(e.target.value))}
                      className="w-full p-2 bg-[#F9F8F6] border border-[#E5E0D8] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B89B65]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1A1A1A] mb-1">Wholesale Price (ETB)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formWholesalePrice}
                      onChange={e => setFormWholesalePrice(Number(e.target.value))}
                      className="w-full p-2 bg-[#F9F8F6] border border-[#E5E0D8] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B89B65]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1A1A1A] mb-1">Tax Rate (e.g. 0.15)</label>
                    <input
                      type="number"
                      step="0.005"
                      value={formTaxRate}
                      onChange={e => setFormTaxRate(Number(e.target.value))}
                      className="w-full p-2 bg-[#F9F8F6] border border-[#E5E0D8] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B89B65]"
                    />
                  </div>
                </div>

                {/* Barcode field — always visible at product level */}
                <div>
                  <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                    Barcode / EAN-13
                  </label>
                  <input
                    type="text"
                    placeholder="Scan or enter barcode (leave blank to auto-generate)"
                    value={formBarcode}
                    onChange={e => setFormBarcode(e.target.value)}
                    className="w-full p-2 bg-[#F9F8F6] border border-[#E5E0D8] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B89B65]"
                  />
                </div>
              </div>

              {/* Section 3: Dynamic Category-Specific Attributes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#EFECE6] pb-2">
                  <h4 className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#B89B65]" />
                    3. Dynamic Category Attributes ({activeCategoryConfig?.name || 'Category Specific'})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddCustomAttribute}
                    className="text-[11px] text-[#B89B65] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Custom Specification</span>
                  </button>
                </div>

                {activeCategoryConfig ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F9F8F6] p-4 rounded-xl border border-[#E5E0D8]">
                    {activeCategoryConfig.attributeSchema.map(field => (
                      <div key={field.key}>
                        <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                          {field.label}
                        </label>
                        {field.type === 'select' && field.options ? (
                          <select
                            value={dynamicAttributes[field.key] || field.options[0]}
                            onChange={e =>
                              setDynamicAttributes(prev => ({ ...prev, [field.key]: e.target.value }))
                            }
                            className="w-full p-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B89B65]"
                          >
                            {field.options.map(opt => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder={field.placeholder}
                            value={dynamicAttributes[field.key] || ''}
                            onChange={e =>
                              setDynamicAttributes(prev => ({ ...prev, [field.key]: e.target.value }))
                            }
                            className="w-full p-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B89B65]"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#716D66] italic">Select a category above to configure specifications.</p>
                )}

                {/* Custom Key-Value Pairs added dynamically */}
                {customAttributesList.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-semibold text-[#716D66] uppercase">Custom Specifications:</span>
                    {customAttributesList.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Specification Name (e.g. Waterproof Rating)"
                          value={item.key}
                          onChange={e => {
                            const val = e.target.value;
                            setCustomAttributesList(prev =>
                              prev.map((it, i) => (i === idx ? { ...it, key: val } : it))
                            );
                          }}
                          className="flex-1 p-2 bg-[#F9F8F6] border border-[#E5E0D8] rounded-lg text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Value (e.g. 50M Water Resistant)"
                          value={item.value}
                          onChange={e => {
                            const val = e.target.value;
                            setCustomAttributesList(prev =>
                              prev.map((it, i) => (i === idx ? { ...it, value: val } : it))
                            );
                          }}
                          className="flex-1 p-2 bg-[#F9F8F6] border border-[#E5E0D8] rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setCustomAttributesList(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 4: Variants & Stock Allocation */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#EFECE6] pb-2">
                  <h4 className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#B89B65]" />
                    4. {formIsSimple ? 'Inventory & Barcode' : 'Variant Matrix & Inventory Allocation'}
                  </h4>

                  {!formIsSimple && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#716D66]">Quick Preset:</span>
                      <button
                        type="button"
                        onClick={() => handleApplyVariantTemplate('clothing')}
                        className="text-[10px] bg-[#EFECE6] px-2 py-0.5 rounded hover:bg-[#B89B65] hover:text-white transition-colors cursor-pointer"
                      >
                        Clothing (XS-L)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyVariantTemplate('shoes')}
                        className="text-[10px] bg-[#EFECE6] px-2 py-0.5 rounded hover:bg-[#B89B65] hover:text-white transition-colors cursor-pointer"
                      >
                        Shoe Sizes (37-40)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyVariantTemplate('perfume')}
                        className="text-[10px] bg-[#EFECE6] px-2 py-0.5 rounded hover:bg-[#B89B65] hover:text-white transition-colors cursor-pointer"
                      >
                        Perfume (50/100ml)
                      </button>
                    </div>
                  )}
                </div>

                {formIsSimple ? (
                  /* Simple Product Inventory Config */
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#F9F8F6] p-4 rounded-xl border border-[#E5E0D8]">
                    <div>
                      <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                        Initial Stock On Hand <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formSimpleStock}
                        onChange={e => setFormSimpleStock(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-[#E5E0D8] rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1A1A1A] mb-1">Custom SKU (Optional)</label>
                      <input
                        type="text"
                        placeholder="Leave blank to auto-generate"
                        value={formSimpleSku}
                        onChange={e => setFormSimpleSku(e.target.value)}
                        className="w-full p-2 bg-white border border-[#E5E0D8] rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                        Barcode / EAN-13 (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Leave blank to auto-generate"
                        value={formSimpleBarcode}
                        onChange={e => setFormSimpleBarcode(e.target.value)}
                        className="w-full p-2 bg-white border border-[#E5E0D8] rounded-lg text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  /* Multi-Variant Table */
                  <div className="space-y-2">
                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                      {variantsList.map((v, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2.5 bg-[#F9F8F6] rounded-xl border border-[#E5E0D8] text-xs"
                        >
                          <div className="w-24">
                            <input
                              type="text"
                              placeholder="Size / Vol"
                              value={v.size}
                              onChange={e => {
                                const val = e.target.value;
                                setVariantsList(prev =>
                                  prev.map((it, i) => (i === idx ? { ...it, size: val } : it))
                                );
                              }}
                              className="w-full p-1.5 bg-white border border-[#E5E0D8] rounded text-xs"
                            />
                          </div>

                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Color / Shade / Note"
                              value={v.color}
                              onChange={e => {
                                const val = e.target.value;
                                setVariantsList(prev =>
                                  prev.map((it, i) => (i === idx ? { ...it, color: val } : it))
                                );
                              }}
                              className="w-full p-1.5 bg-white border border-[#E5E0D8] rounded text-xs"
                            />
                          </div>

                          <div className="w-10">
                            <input
                              type="color"
                              value={v.color_code || '#B89B65'}
                              onChange={e => {
                                const val = e.target.value;
                                setVariantsList(prev =>
                                  prev.map((it, i) => (i === idx ? { ...it, color_code: val } : it))
                                );
                              }}
                              className="w-full h-8 p-0 border border-[#E5E0D8] rounded cursor-pointer"
                              title="Color swatch picker"
                            />
                          </div>

                          <div className="w-20">
                            <input
                              type="number"
                              placeholder="Stock"
                              value={v.quantity}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setVariantsList(prev =>
                                  prev.map((it, i) => (i === idx ? { ...it, quantity: val } : it))
                                );
                              }}
                              className="w-full p-1.5 bg-white border border-[#E5E0D8] rounded text-xs font-semibold text-right"
                            />
                          </div>

                          {variantsList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveVariantRow(idx)}
                              className="p-1.5 text-red-500 hover:text-red-700 cursor-pointer shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddVariantRow}
                      className="text-xs font-medium text-[#B89B65] hover:underline flex items-center gap-1.5 cursor-pointer py-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Variant Row</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Section 5: Media & Image Selection */}
              <div className="space-y-4">
                <div className="border-b border-[#EFECE6] pb-2">
                  <h4 className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#B89B65]" />
                    5. Product Imagery & Presets
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[#1A1A1A] mb-1">Image URL</label>
                      <input
                        type="url"
                        placeholder="https://... or select preset below"
                        value={formImageUrl}
                        onChange={e => setFormImageUrl(e.target.value)}
                        className="w-full p-2 bg-[#F9F8F6] border border-[#E5E0D8] rounded-lg text-xs"
                      />
                    </div>

                    {/* Curated Presets for active category */}
                    {activeCategoryConfig && activeCategoryConfig.sampleImages.length > 0 && (
                      <div>
                        <span className="text-[10px] font-semibold text-[#716D66] uppercase block mb-1.5">
                          1-Click Category Image Presets:
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {activeCategoryConfig.sampleImages.map((img, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setFormImageUrl(img.url)}
                              className={`flex items-center gap-1.5 p-1 rounded-lg border text-[11px] cursor-pointer transition-all ${
                                formImageUrl === img.url
                                  ? 'border-[#B89B65] bg-[#B89B65]/10 text-[#1A1A1A] font-medium'
                                  : 'border-[#E5E0D8] bg-[#F9F8F6] text-[#59554F] hover:border-[#B89B65]'
                              }`}
                            >
                              <img src={img.url} alt={img.label} className="w-5 h-5 rounded object-cover" />
                              <span>{img.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preview Box */}
                  <div className="flex flex-col items-center justify-center p-3 border border-[#E5E0D8] rounded-xl bg-[#F9F8F6]">
                    <span className="text-[10px] font-semibold text-[#716D66] uppercase mb-2">Live Preview</span>
                    <div className="w-28 h-28 rounded-lg bg-white border border-[#E5E0D8] overflow-hidden flex items-center justify-center">
                      {formImageUrl ? (
                        <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-[#D8D2C7]" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t border-[#E5E0D8]">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 border border-[#E5E0D8] rounded-lg text-xs font-medium text-[#59554F] hover:bg-[#F9F8F6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#1A1A1A] hover:bg-[#B89B65] text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Saving...</span>
                  ) : editingProductId ? (
                    formStatus === 'rejected' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Update & Resubmit for Approval</span>
                      </>
                    ) : (
                      <span>Update Product & Specifications</span>
                    )
                  ) : role === 'store_person' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Submit for Admin Approval</span>
                    </>
                  ) : (
                    <span>Save & Publish Product (Active)</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Administrator Rejection Feedback */}
      {rejectingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E0D8] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <h3 className="font-semibold text-sm text-[#1A1A1A]">Reject Product Registration</h3>
              </div>
              <button
                onClick={() => setRejectingProduct(null)}
                className="p-1 text-[#716D66] hover:text-[#1A1A1A] rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#59554F]">
              Rejecting <strong className="text-[#1A1A1A]">"{rejectingProduct.name}"</strong> will prevent it from appearing on the POS sales screen. Please specify the reason so the Store Person can revise and resubmit:
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReasonText}
                  onChange={e => setRejectionReasonText(e.target.value)}
                  placeholder="e.g. Retail pricing does not meet minimum markup requirements, or subcategory classification is incorrect."
                  className="w-full p-2.5 bg-[#F9F8F6] border border-[#E5E0D8] rounded-lg text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B89B65]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E0D8]">
                <button
                  type="button"
                  onClick={() => setRejectingProduct(null)}
                  className="px-3.5 py-2 border border-[#E5E0D8] rounded-lg text-xs font-medium text-[#59554F] hover:bg-[#F9F8F6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingApproval || !rejectionReasonText.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isProcessingApproval ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CATEGORY & SUBCATEGORY MANAGEMENT (ADMIN & STORE MGR)   */}
      {/* ============================================================== */}
      {showCatManagerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-2xl border border-[#E5E0D8] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[#E5E0D8] bg-[#F9F8F6] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B89B65]">
                  Boutique Catalog Hierarchy
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Departments & Subcategories Manager</h3>
              </div>
              <button
                onClick={() => setShowCatManagerModal(false)}
                className="p-1.5 text-[#716D66] hover:text-[#1A1A1A] rounded-lg hover:bg-[#EFECE6] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Add New Department / Subcategory Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-[#E5E0D8]">
                {/* Create Category */}
                <form onSubmit={handleCreateNewCategory} className="space-y-3 bg-[#F9F8F6] p-4 rounded-xl border border-[#E5E0D8]">
                  <h4 className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-[#B89B65]" />
                    <span>Create New Department</span>
                  </h4>
                  <input
                    type="text"
                    required
                    placeholder="Department Name (e.g. Fine Fragrance)"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E5E0D8] rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Description (Optional)"
                    value={newCatDesc}
                    onChange={e => setNewCatDesc(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E5E0D8] rounded-lg text-xs"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-[#1A1A1A] hover:bg-[#B89B65] text-white rounded-lg text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Add Department
                  </button>
                </form>

                {/* Create Subcategory */}
                <form onSubmit={handleCreateNewSubcategory} className="space-y-3 bg-[#F9F8F6] p-4 rounded-xl border border-[#E5E0D8]">
                  <h4 className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-[#B89B65]" />
                    <span>Create Subcategory</span>
                  </h4>
                  <select
                    value={targetCatForSubcat}
                    onChange={e => setTargetCatForSubcat(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E5E0D8] rounded-lg text-xs"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Subcategory Name (e.g. Cocktail Dresses)"
                    value={newSubcatName}
                    onChange={e => setNewSubcatName(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E5E0D8] rounded-lg text-xs"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-[#1A1A1A] hover:bg-[#B89B65] text-white rounded-lg text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Add Subcategory
                  </button>
                </form>
              </div>

              {/* Existing Departments & Subcategories Tree */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">
                  Active Departments & Subcategories
                </h4>
                <div className="space-y-3">
                  {categories.map(cat => {
                    const catSubs = subcategories.filter(s => s.category_id === cat.id);
                    return (
                      <div key={cat.id} className="p-3.5 rounded-xl border border-[#E5E0D8] bg-[#FDFCFB] space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#B89B65]" />
                            <h5 className="font-semibold text-xs text-[#1A1A1A]">{cat.name}</h5>
                            <span className="text-[10px] text-[#716D66] font-mono">({cat.slug})</span>
                          </div>
                          <span className="text-[10px] bg-[#EFECE6] text-[#59554F] px-2 py-0.5 rounded font-mono">
                            {catSubs.length} Subcategories · {cat.product_count ?? 0} Products
                          </span>
                        </div>

                        {catSubs.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1 pl-4 border-l-2 border-[#E5E0D8]">
                            {catSubs.map(sub => (
                              <div
                                key={sub.id}
                                className={`px-2.5 py-1 rounded text-[11px] border flex items-center gap-2 ${
                                  sub.is_active !== 0
                                    ? 'bg-white border-[#E5E0D8] text-[#1A1A1A]'
                                    : 'bg-gray-100 border-gray-200 text-gray-400 line-through'
                                }`}
                              >
                                <span>{sub.name}</span>
                                <button
                                  onClick={() => handleToggleSubcategoryActive(sub)}
                                  title={sub.is_active !== 0 ? 'Deactivate' : 'Reactivate'}
                                  className="text-[10px] text-[#8C8275] hover:text-[#1A1A1A] cursor-pointer"
                                >
                                  {sub.is_active !== 0 ? '×' : '✓'}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#E5E0D8] bg-[#F9F8F6] text-right">
              <button
                onClick={() => setShowCatManagerModal(false)}
                className="px-5 py-2 bg-[#1A1A1A] text-white rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* QUICK DETAILS MODAL                                            */}
      {/* ============================================================== */}
      {viewProductDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-[#E5E0D8] max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-semibold text-[#B89B65] uppercase tracking-wider">
                  {viewProductDetails.category_name} · {viewProductDetails.subcategory_name || 'Item'}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">{viewProductDetails.name}</h3>
              </div>
              <button
                onClick={() => setViewProductDetails(null)}
                className="p-1 text-[#716D66] hover:text-[#1A1A1A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-16/9 rounded-xl overflow-hidden bg-[#F5F2EB] border border-[#E5E0D8]">
              {viewProductDetails.image_url ? (
                <img
                  src={viewProductDetails.image_url}
                  alt={viewProductDetails.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#B89B65]">
                  <Package className="w-8 h-8" />
                </div>
              )}
            </div>

            <p className="text-xs text-[#59554F] leading-relaxed">
              {viewProductDetails.description || 'No detailed editorial notes recorded.'}
            </p>

            {/* Specifications summary */}
            {viewProductDetails.attributes && (
              <div className="p-3 bg-[#F9F8F6] rounded-xl border border-[#E5E0D8] space-y-1 text-xs">
                <span className="text-[10px] font-semibold uppercase text-[#716D66]">Specifications:</span>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-[#1A1A1A]">
                  {Object.entries(
                    typeof viewProductDetails.attributes === 'object'
                      ? viewProductDetails.attributes
                      : JSON.parse(viewProductDetails.attributes || '{}')
                  ).map(([k, v]) => (
                    <div key={k} className="truncate">
                      <span className="text-[#8C8275] capitalize">{k.replace(/_/g, ' ')}:</span> {String(v)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Variants table */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-semibold uppercase text-[#716D66]">
                Sellable Variants & Inventory:
              </span>
              <div className="max-h-40 overflow-y-auto divide-y divide-[#EFECE6] border border-[#E5E0D8] rounded-lg">
                {viewProductDetails.variants?.map((v, i) => (
                  <div key={i} className="p-2 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#1A1A1A]">
                        {v.size} · {v.color}
                      </p>
                      <p className="text-[10px] font-mono text-[#8C8275]">{v.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#1A1A1A]">{formatCurrency(v.selling_price)}</p>
                      <p className="text-[10px] text-[#716D66]">{v.stock_quantity ?? 0} in stock</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
