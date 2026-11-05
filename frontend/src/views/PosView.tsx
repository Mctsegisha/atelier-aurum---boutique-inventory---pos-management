import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api.ts';
import { Product, Variant, Customer } from '../types.ts';
import { formatCurrency } from '../lib/currency.ts';
import {
  Search,
  Barcode,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle,
  Printer,
  X,
  AlertCircle,
  Tag
} from 'lucide-react';

interface CartItem {
  variant_id: string;
  product_id: string;
  product_name: string;
  details: string;
  size: string;
  color: string;
  unit_price: number;
  quantity: number;
  stock_quantity: number;
  image_url?: string;
}

export function PosView() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [taxRate, setTaxRate] = useState<number>(0.15); // Standard 15% Ethiopian VAT
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');

  // Variant Modal State (when clicking a product card)
  const [activeProductForVariant, setActiveProductForVariant] = useState<Product | null>(null);

  // Payment / Receipt State
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'mobile' | 'transfer'>('card');
  const [completedReceipt, setCompletedReceipt] = useState<any | null>(null);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCatalog();
    loadCustomers();
    loadStoreSettings();
  }, []);

  const loadStoreSettings = async () => {
    try {
      const s = await api.getSettings();
      if (s && s.tax_rate !== undefined && s.tax_rate !== null) {
        const rate = Number(s.tax_rate);
        if (!isNaN(rate) && rate >= 0) {
          setTaxRate(rate);
        }
      }
    } catch {
      // Default to 15% VAT
    }
  };

  const loadCatalog = async () => {
    setIsLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        api.getProducts({ status: 'active' }),
        api.getCategories()
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await api.getCustomers();
      setCustomers(res);
    } catch (err) {
      console.error(err);
    }
  };

  // Barcode / SKU Scan Handler
  const handleBarcodeScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    setBarcodeError(null);

    try {
      const item = await api.lookupBarcode(barcodeInput.trim());
      const detailsLabel = item.variant_name || (item.size !== 'Standard' ? `${item.size} · ${item.color}` : item.product_name);
      addToCart({
        variant_id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        details: detailsLabel,
        size: item.size,
        color: item.color,
        unit_price: Number(item.selling_price || item.product_price),
        quantity: 1,
        stock_quantity: item.stock_quantity ?? 0,
        image_url: item.image_url
      });
      setBarcodeInput('');
    } catch (err: any) {
      setBarcodeError(err.message || `No item matching barcode/SKU: ${barcodeInput}`);
    }
  };

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.variant_id === item.variant_id);
      if (existing) {
        if (existing.quantity >= item.stock_quantity) {
          alert(`Cannot exceed available stock of ${item.stock_quantity} units.`);
          return prev;
        }
        return prev.map(i =>
          i.variant_id === item.variant_id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, item];
    });
  };

  const updateQuantity = (variant_id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => {
          if (i.variant_id === variant_id) {
            const nextQty = i.quantity + delta;
            if (nextQty > i.stock_quantity) {
              alert(`Only ${i.stock_quantity} units available.`);
              return i;
            }
            return { ...i, quantity: nextQty };
          }
          return i;
        })
        .filter(i => i.quantity > 0)
    );
  };

  const removeFromCart = (variant_id: string) => {
    setCart(prev => prev.filter(i => i.variant_id !== variant_id));
  };

  const handleSelectProductCard = (product: Product) => {
    if (!product.variants || product.variants.length === 0) {
      alert('This product has no active inventory.');
      return;
    }
    // If simple product or single variant, add directly to cart!
    if (product.is_simple || product.variants.length === 1) {
      const v = product.variants[0];
      const detailsLabel = v.variant_name || (v.size !== 'Standard' ? `${v.size} · ${v.color}` : product.name);
      addToCart({
        variant_id: v.id,
        product_id: product.id,
        product_name: product.name,
        details: detailsLabel,
        size: v.size || 'Standard',
        color: v.color || 'Default',
        unit_price: Number(v.selling_price || product.selling_price || 0),
        quantity: 1,
        stock_quantity: Number(v.stock_quantity ?? 0),
        image_url: product.image_url
      });
    } else {
      setActiveProductForVariant(product);
    }
  };

  // Calculations
  const subtotal = cart.reduce((acc, it) => acc + it.unit_price * it.quantity, 0);

  let calculatedDiscount = 0;
  if (discountType === 'percentage') {
    calculatedDiscount = (subtotal * Math.min(100, Math.max(0, discountAmount))) / 100;
  } else {
    calculatedDiscount = Math.min(subtotal, Math.max(0, discountAmount));
  }

  const taxableAmount = Math.max(0, subtotal - calculatedDiscount);
  const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;
  const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

  // Checkout process with idempotency
  const handleConfirmPayment = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    setErrorMessage(null);

    const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    try {
      const res = await api.checkout({
        cart_items: cart.map(i => ({ variant_id: i.variant_id, quantity: i.quantity })),
        customer_id: selectedCustomer?.id,
        payment_method: paymentMethod,
        discount_amount: calculatedDiscount,
        discount_type: 'fixed',
        notes: orderNotes,
        idempotency_key: idempotencyKey
      });

      setCompletedReceipt(res.receipt);
      setCart([]);
      setSelectedCustomer(null);
      setDiscountAmount(0);
      setOrderNotes('');
      setShowPaymentModal(false);
      loadCatalog(); // Refresh available inventory levels
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment processing failed.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleCreateFastCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;

    try {
      const created = await api.createCustomer({
        full_name: newCustomerName.trim(),
        phone: newCustomerPhone.trim() || undefined
      });
      setCustomers(prev => [created, ...prev]);
      setSelectedCustomer(created);
      setShowCustomerModal(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCat =
      selectedCategory === 'all' ||
      p.category_id === selectedCategory ||
      p.category_slug === selectedCategory ||
      p.category_name?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSubcat =
      selectedSubcategory === 'all' ||
      p.subcategory_id === selectedSubcategory ||
      p.subcategory_slug === selectedSubcategory ||
      p.subcategory_name?.toLowerCase() === selectedSubcategory.toLowerCase();

    if (!matchesCat || !matchesSubcat) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = p.name.toLowerCase().includes(q);
    const catMatch = p.category_name?.toLowerCase().includes(q);
    const subcatMatch = p.subcategory_name?.toLowerCase().includes(q);
    const brandMatch = p.brand_name?.toLowerCase().includes(q);
    const matMatch = p.material?.toLowerCase().includes(q);
    const variantMatch = p.variants?.some(v =>
      v.sku?.toLowerCase().includes(q) ||
      v.barcode?.toLowerCase().includes(q) ||
      v.variant_name?.toLowerCase().includes(q) ||
      v.size?.toLowerCase().includes(q) ||
      v.color?.toLowerCase().includes(q)
    );

    return nameMatch || catMatch || subcatMatch || brandMatch || matMatch || variantMatch;
  });

  const filteredCustomers = customers.filter(c =>
    !customerSearch ||
    c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.includes(customerSearch)
  );

  return (
    <div className="h-[calc(100vh-61px)] flex flex-col lg:flex-row overflow-hidden bg-[#F9F8F6]">
      {/* ============================================================== */}
      {/* LEFT SECTION: Catalog, Categories, Barcode Scan, Product Cards */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-[#E5E0D8]">
        {/* Top Controls Bar */}
        <div className="p-4 bg-white border-b border-[#E5E0D8] space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8C8275] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search collection by title, SKU, barcode, metal, note..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#F9F8F6] border border-[#E5E0D8] rounded-md text-xs focus:outline-none focus:border-[#B89B65] transition-colors"
              />
            </div>

            {/* Instant Barcode Scanner input */}
            <form onSubmit={handleBarcodeScan} className="relative sm:w-64">
              <Barcode className="w-4 h-4 text-[#8C8275] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan barcode / SKU [Enter]"
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-[#F9F8F6] border border-[#E5E0D8] rounded-md text-xs font-mono focus:outline-none focus:border-[#B89B65] transition-colors"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#B89B65] font-semibold uppercase hover:underline cursor-pointer"
              >
                Scan
              </button>
            </form>
          </div>

          {barcodeError && (
            <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded border border-red-200">
              {barcodeError}
            </p>
          )}

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSubcategory('all');
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#1A1A1A] text-[#F9F8F6]'
                  : 'bg-[#EFECE6] text-[#59554F] hover:text-[#1A1A1A]'
              }`}
            >
              All Departments ({products.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedSubcategory('all');
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#1A1A1A] text-[#F9F8F6]'
                    : 'bg-[#EFECE6] text-[#59554F] hover:text-[#1A1A1A]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-xs text-[#716D66]">
              Loading luxury collection...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-xs text-[#716D66]">
              No boutique items found matching criteria.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => {
                const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock_quantity || 0), 0) ?? 0;
                const isOutOfStock = totalStock <= 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && handleSelectProductCard(product)}
                    className={`group bg-white rounded-xl border border-[#E5E0D8] overflow-hidden flex flex-col justify-between transition-all duration-200 ${
                      isOutOfStock
                        ? 'opacity-60 cursor-not-allowed'
                        : 'cursor-pointer hover:border-[#B89B65] hover:shadow-sm'
                    }`}
                  >
                    {/* Image Slot */}
                    <div className="aspect-4/3 w-full bg-[#F5F2EB] relative overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#B89B65]">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-[#1A1A1A]/80 text-[#F9F8F6] text-[10px] px-2 py-0.5 rounded backdrop-blur-xs">
                        {isOutOfStock ? 'Sold Out' : `${totalStock} in stock`}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="p-3 text-left">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] uppercase tracking-wider text-[#716D66] font-medium truncate block">
                          {product.category_name || 'Boutique'}
                        </span>
                        {product.subcategory_name && (
                          <span className="text-[9px] text-[#B89B65] font-semibold truncate shrink-0">
                            {product.subcategory_name}
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif font-semibold text-sm text-[#1A1A1A] line-clamp-1 group-hover:text-[#B89B65] transition-colors mt-0.5">
                        {product.name}
                      </h4>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F0EDE8]">
                        <span className="text-sm font-semibold text-[#1A1A1A] tabular-nums">
                          {formatCurrency(product.selling_price)}
                        </span>
                        <span className="text-[11px] text-[#B89B65] font-medium">
                          {product.is_simple
                            ? 'Instant Add'
                            : product.variants?.length > 1
                            ? `${product.variants.length} Options`
                            : 'Select'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* RIGHT SECTION: Cart, Customer, Discounts, Settlement Controls  */}
      {/* ============================================================== */}
      <div className="w-full lg:w-96 xl:w-[420px] bg-white flex flex-col h-full border-t lg:border-t-0 shadow-xs shrink-0">
        {/* Cart Header */}
        <div className="p-4 border-b border-[#E5E0D8] flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">Curated Bag</h3>
            <span className="text-xs text-[#716D66]">{cart.reduce((a, b) => a + b.quantity, 0)} Items Selected</span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs text-red-600 hover:underline cursor-pointer"
            >
              Clear Bag
            </button>
          )}
        </div>

        {/* Customer Attachment Bar */}
        <div className="px-4 py-2.5 bg-[#F9F8F6] border-b border-[#E5E0D8] flex items-center justify-between text-xs">
          {selectedCustomer ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#B89B65] text-white flex items-center justify-center text-[10px] font-semibold">
                  {selectedCustomer.full_name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-[#1A1A1A] leading-tight">{selectedCustomer.full_name}</p>
                  <p className="text-[10px] text-[#716D66]">{selectedCustomer.loyalty_points} Loyalty Pts · {selectedCustomer.phone || 'VIP'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-[#8C8275] hover:text-[#1A1A1A] p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomerModal(true)}
              className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-[#59554F] hover:text-[#1A1A1A] hover:bg-[#EFECE6] rounded border border-dashed border-[#D8D2C7] transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Attach VIP Client Profile</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#F0EDE8] p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-[#716D66] py-12">
              <ShoppingBag className="w-10 h-10 text-[#D8D2C7] stroke-[1.5] mb-2" />
              <p className="text-sm font-serif text-[#1A1A1A]">Your shopping bag is empty</p>
              <p className="text-xs text-[#8C8275] mt-1">Scan a barcode or click any garment to add</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.variant_id} className="py-3 flex items-start gap-3">
                <div className="w-12 h-12 rounded bg-[#F5F2EB] overflow-hidden shrink-0 border border-[#E5E0D8]">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#B89B65]">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="text-xs font-semibold text-[#1A1A1A] truncate">{item.product_name}</h5>
                    <span className="text-xs font-medium text-[#1A1A1A] tabular-nums shrink-0">
                      {formatCurrency(item.unit_price * item.quantity)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#716D66] mt-0.5">{item.details}</p>

                  <div className="flex items-center justify-between mt-2">
                    {/* Stepper */}
                    <div className="flex items-center border border-[#E5E0D8] rounded bg-[#F9F8F6]">
                      <button
                        onClick={() => updateQuantity(item.variant_id, -1)}
                        className="p-1 text-[#716D66] hover:text-[#1A1A1A] cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-medium tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.variant_id, 1)}
                        className="p-1 text-[#716D66] hover:text-[#1A1A1A] cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.variant_id)}
                      className="text-[#8C8275] hover:text-red-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Totals & Settlement */}
        <div className="p-4 bg-[#F9F8F6] border-t border-[#E5E0D8] space-y-3">
          {/* Discount Field */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#E5E0D8] rounded text-xs">
              <Tag className="w-3.5 h-3.5 text-[#8C8275]" />
              <input
                type="number"
                placeholder="Discount"
                value={discountAmount || ''}
                onChange={e => setDiscountAmount(Number(e.target.value))}
                className="w-full text-xs focus:outline-none"
              />
            </div>
            <select
              value={discountType}
              onChange={e => setDiscountType(e.target.value as any)}
              className="bg-white border border-[#E5E0D8] rounded text-xs px-2 py-1.5 focus:outline-none"
            >
              <option value="fixed">ETB (Fixed)</option>
              <option value="percentage">% (Rate)</option>
            </select>
          </div>

          {/* Breakdown */}
          <div className="space-y-1.5 text-xs text-[#59554F] pt-2 border-t border-[#E5E0D8]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="tabular-nums font-medium text-[#1A1A1A]">{formatCurrency(subtotal)}</span>
            </div>
            {calculatedDiscount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount</span>
                <span className="tabular-nums font-medium">-{formatCurrency(calculatedDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax (VAT {Math.round(taxRate * 100)}%)</span>
              <span className="tabular-nums font-medium text-[#1A1A1A]">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-serif font-bold text-[#1A1A1A] pt-2 border-t border-[#E5E0D8]">
              <span>Grand Total</span>
              <span className="tabular-nums">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Payment CTA Button */}
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0}
            className={`w-full py-3 px-4 rounded-lg font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              cart.length === 0
                ? 'bg-[#E5E0D8] text-[#8C8275] cursor-not-allowed'
                : 'bg-[#1A1A1A] text-[#F9F8F6] hover:bg-[#B89B65] shadow-sm'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Process Payment ({formatCurrency(grandTotal)})</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: Variant Selector (when a product has multiple sizes)    */}
      {/* ============================================================== */}
      {activeProductForVariant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#E5E0D8] max-w-md w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#716D66]">Select Variant</span>
                <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">{activeProductForVariant.name}</h3>
              </div>
              <button
                onClick={() => setActiveProductForVariant(null)}
                className="text-[#716D66] hover:text-[#1A1A1A] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {(activeProductForVariant?.variants || []).map(v => {
                const stock = Number(v.stock_quantity ?? 0);
                const outOfStock = stock <= 0;
                const price = Number(v.selling_price || activeProductForVariant?.selling_price || 0);
                return (
                  <button
                    key={v.id}
                    disabled={outOfStock}
                    onClick={() => {
                      const detailsLabel = v.variant_name || `${v.size} · ${v.color}`;
                      addToCart({
                        variant_id: v.id,
                        product_id: activeProductForVariant.id,
                        product_name: activeProductForVariant.name,
                        details: detailsLabel,
                        size: v.size || 'Standard',
                        color: v.color || 'Default',
                        unit_price: price,
                        quantity: 1,
                        stock_quantity: stock,
                        image_url: activeProductForVariant.image_url
                      });
                      setActiveProductForVariant(null);
                    }}
                    className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                      outOfStock
                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-[#E5E0D8] hover:border-[#B89B65] hover:bg-[#F9F8F6]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: v.color_code || '#B89B65' }}
                        />
                        <span className="text-xs font-semibold text-[#1A1A1A]">
                          {v.variant_name || `${v.size} · ${v.color}`}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#716D66] font-mono mt-0.5 block">{v.sku}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-[#1A1A1A] tabular-nums block">
                        {formatCurrency(price)}
                      </span>
                      <span className={`text-[10px] ${outOfStock ? 'text-red-600' : 'text-[#716D66]'}`}>
                        {outOfStock ? 'Out of Stock' : `${stock} available`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Customer Attachment / Fast Registration                */}
      {/* ============================================================== */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#E5E0D8] max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
              <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">Attach VIP Client Profile</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-[#716D66] hover:text-[#1A1A1A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Existing Customers search */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#8C8275] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search existing VIPs by name or phone..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F9F8F6] border border-[#E5E0D8] rounded-md text-xs focus:outline-none focus:border-[#B89B65]"
                />
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-[#F0EDE8] border border-[#E5E0D8] rounded-md">
                {filteredCustomers.length === 0 ? (
                  <p className="p-3 text-xs text-[#716D66] text-center">No client found</p>
                ) : (
                  filteredCustomers.map(c => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomer(c);
                        setShowCustomerModal(false);
                      }}
                      className="p-2.5 hover:bg-[#F9F8F6] flex items-center justify-between cursor-pointer text-xs"
                    >
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{c.full_name}</p>
                        <p className="text-[11px] text-[#716D66]">{c.phone || 'No phone'} · {c.email || 'No email'}</p>
                      </div>
                      <span className="text-[11px] text-[#B89B65] font-semibold">{c.loyalty_points} Points</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Fast Register New Customer */}
            <form onSubmit={handleCreateFastCustomer} className="pt-3 border-t border-[#E5E0D8] space-y-2">
              <span className="text-[11px] uppercase tracking-wider text-[#716D66] font-medium block">
                Or Register New Client
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={newCustomerName}
                  onChange={e => setNewCustomerName(e.target.value)}
                  className="p-2 border border-[#E5E0D8] rounded text-xs focus:outline-none focus:border-[#B89B65]"
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={newCustomerPhone}
                  onChange={e => setNewCustomerPhone(e.target.value)}
                  className="p-2 border border-[#E5E0D8] rounded text-xs focus:outline-none focus:border-[#B89B65]"
                />
              </div>
              <button
                type="submit"
                disabled={!newCustomerName.trim()}
                className="w-full py-2 bg-[#EFECE6] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white rounded text-xs font-medium transition-colors cursor-pointer"
              >
                Register & Attach to Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Payment Settlement                                      */}
      {/* ============================================================== */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#E5E0D8] max-w-md w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#716D66]">Checkout Settlement</span>
                <h3 className="font-serif text-xl font-semibold text-[#1A1A1A]">Select Payment Tender</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-[#716D66] hover:text-[#1A1A1A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Total Display */}
            <div className="p-4 bg-[#F9F8F6] rounded-lg border border-[#E5E0D8] text-center">
              <span className="text-xs uppercase tracking-wider text-[#716D66]">Amount Due</span>
              <div className="text-3xl font-serif font-bold text-[#1A1A1A] tabular-nums mt-0.5">
                {formatCurrency(grandTotal)}
              </div>
              {selectedCustomer && (
                <p className="text-[11px] text-[#B89B65] mt-1">Client: {selectedCustomer.full_name}</p>
              )}
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'card', label: 'Credit Card / EMV', icon: CreditCard },
                { id: 'cash', label: 'Cash Tender', icon: Banknote },
                { id: 'mobile', label: 'Apple Pay / Mobile', icon: Smartphone },
                { id: 'transfer', label: 'Bank Wire / ACH', icon: CheckCircle }
              ].map(pm => {
                const Icon = pm.icon;
                const isSel = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id as any)}
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSel
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F8F6]'
                        : 'border-[#E5E0D8] hover:border-[#B89B65] bg-white text-[#1A1A1A]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSel ? 'text-[#B89B65]' : 'text-[#716D66]'}`} />
                    <span className="text-xs font-semibold">{pm.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Notes */}
            <div>
              <input
                type="text"
                placeholder="Optional order notes / private salon reference..."
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                className="w-full p-2.5 border border-[#E5E0D8] rounded text-xs focus:outline-none focus:border-[#B89B65]"
              />
            </div>

            {/* Confirm Payment CTA */}
            <button
              onClick={handleConfirmPayment}
              disabled={isCheckingOut}
              className="w-full py-3 bg-[#B89B65] hover:bg-[#9E7E45] text-white font-medium text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isCheckingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing Transaction...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Authorize & Issue Receipt ({formatCurrency(grandTotal)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Printable Luxury Receipt Slip                          */}
      {/* ============================================================== */}
      {completedReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#E5E0D8] max-w-md w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Printable Receipt Container */}
            <div id="printable-receipt" className="text-center font-sans space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] tracking-[0.25em] uppercase text-[#716D66] font-medium block">
                  {completedReceipt.settings?.receipt_header || '*** HIRBIT STORE · HAWASSA ***\nPiyassa Mall, 1st Floor (Near Kibiru Hospital)'}
                </span>
                <h2 className="font-serif text-2xl font-semibold text-[#1A1A1A]">Hirbit Store</h2>
                <p className="text-[11px] text-[#716D66]">{completedReceipt.settings?.address || 'Hawassa Piyassa Mall, 1st Floor (Near Kibiru Hospital), Hawassa'}</p>
                <p className="text-[11px] text-[#716D66]">{completedReceipt.settings?.phone || '+251 91 123 4567'}</p>
              </div>

              <div className="py-2 border-y border-[#E5E0D8] text-left text-[11px] space-y-1 text-[#716D66]">
                <div className="flex justify-between">
                  <span>Receipt No:</span>
                  <span className="font-mono text-[#1A1A1A] font-medium">{completedReceipt.receipt_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date(completedReceipt.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span>{completedReceipt.cashier_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tender:</span>
                  <span className="capitalize">{completedReceipt.payment_method}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="text-left text-xs divide-y divide-[#F0EDE8]">
                {completedReceipt.items?.map((it: any, idx: number) => (
                  <div key={idx} className="py-2 flex justify-between">
                    <div>
                      <p className="font-medium text-[#1A1A1A]">{it.product_name}</p>
                      <span className="text-[11px] text-[#716D66]">{it.variant_details} · Qty: {it.quantity} @ {formatCurrency(it.unit_price)}</span>
                    </div>
                    <span className="font-medium text-[#1A1A1A] tabular-nums">{formatCurrency(it.total)}</span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="pt-2 border-t border-[#E5E0D8] text-xs space-y-1 text-right">
                <div className="flex justify-between text-[#716D66]">
                  <span>Subtotal:</span>
                  <span className="tabular-nums">{formatCurrency(completedReceipt.subtotal)}</span>
                </div>
                {Number(completedReceipt.discount_amount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span className="tabular-nums">-{formatCurrency(completedReceipt.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#716D66]">
                  <span>Tax ({Math.round(Number(completedReceipt.tax_rate ?? taxRate) * 100)}%):</span>
                  <span className="tabular-nums">{formatCurrency(completedReceipt.tax_amount)}</span>
                </div>
                <div className="flex justify-between font-serif text-lg font-bold text-[#1A1A1A] pt-1 border-t border-[#E5E0D8]">
                  <span>Total Paid:</span>
                  <span className="tabular-nums">{formatCurrency(completedReceipt.total_amount)}</span>
                </div>
              </div>

              {/* Footer Note */}
              <p className="text-[10px] text-[#716D66] leading-relaxed pt-2 border-t border-[#E5E0D8]">
                {completedReceipt.settings?.receipt_footer}
              </p>
            </div>

            {/* Print & Close Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-[#E5E0D8]">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#B89B65] rounded-lg text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setCompletedReceipt(null)}
                className="px-4 py-2.5 bg-[#EFECE6] text-[#1A1A1A] hover:bg-[#E5E0D8] rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
