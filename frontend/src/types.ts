export type Role = 'admin' | 'store_person' | 'sales';

export type AppView =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'inventory'
  | 'sales'
  | 'customers'
  | 'suppliers'
  | 'expenses'
  | 'reports'
  | 'employees'
  | 'settings'
  | 'audit'
  | 'shift'
  | 'profile';

export const ROLE_ALLOWED_VIEWS: Record<Role, readonly AppView[]> = {
  admin: [
    'dashboard',
    'pos',
    'products',
    'inventory',
    'sales',
    'customers',
    'suppliers',
    'expenses',
    'reports',
    'employees',
    'settings',
    'audit',
    'shift',
    'profile'
  ],
  store_person: [
    'dashboard',
    'pos',
    'products',
    'inventory',
    'sales',
    'customers',
    'suppliers',
    'expenses',
    'reports',
    'shift',
    'profile'
  ],
  sales: [
    'pos',
    'sales',
    'customers',
    'shift',
    'profile'
  ]
};

export const ROLE_DEFAULT_VIEW: Record<Role, AppView> = {
  admin: 'dashboard',
  store_person: 'dashboard',
  sales: 'pos'
};

export function isViewAllowedForRole(role: Role | null | undefined, view: string | null | undefined): boolean {
  if (!role || !view || typeof view !== 'string') return false;
  if (!Object.prototype.hasOwnProperty.call(ROLE_ALLOWED_VIEWS, role)) return false;
  const allowed = ROLE_ALLOWED_VIEWS[role];
  if (!Array.isArray(allowed)) return false;
  return (allowed as readonly string[]).includes(view);
}

export function getDefaultViewForRole(role: Role | null | undefined): AppView {
  if (!role || !Object.prototype.hasOwnProperty.call(ROLE_DEFAULT_VIEW, role)) {
    return 'pos';
  }
  return ROLE_DEFAULT_VIEW[role];
}

export function getAllowedViewsForRole(role: Role | null | undefined): readonly AppView[] {
  if (!role || !Object.prototype.hasOwnProperty.call(ROLE_ALLOWED_VIEWS, role)) {
    return [];
  }
  return ROLE_ALLOWED_VIEWS[role];
}

export function validateAndSanitizeView(
  role: Role | null | undefined,
  requestedView: string | null | undefined
): AppView {
  if (!role || !Object.prototype.hasOwnProperty.call(ROLE_DEFAULT_VIEW, role)) {
    return 'pos';
  }
  if (requestedView && isViewAllowedForRole(role, requestedView)) {
    return requestedView as AppView;
  }
  return getDefaultViewForRole(role);
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: number;
  phone?: string;
  avatar_url?: string;
  permissions?: string[];
  created_at?: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: number;
  product_count?: number;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active?: number;
  product_count?: number;
  subcategories?: Subcategory[];
}

export interface Brand {
  id: string;
  name: string;
  country?: string;
}

export interface Variant {
  id: string;
  product_id: string;
  sku: string;
  barcode?: string;
  size: string;
  color: string;
  color_code?: string;
  variant_name?: string;
  attributes?: Record<string, any> | string;
  purchase_price?: number;
  selling_price: number;
  stock_quantity?: number;
  location?: string;
  min_threshold?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category_id?: string;
  category_name?: string;
  category_slug?: string;
  subcategory_id?: string;
  subcategory_name?: string;
  subcategory_slug?: string;
  brand_id?: string;
  brand_name?: string;
  supplier_id?: string;
  supplier_name?: string;
  purchase_price?: number;
  selling_price: number;
  wholesale_price?: number;
  tax_rate?: number;
  min_stock_level: number;
  image_url?: string;
  status: 'active' | 'archived' | 'draft' | 'pending_approval' | 'rejected';
  is_simple?: number | boolean;
  season?: string;
  collection?: string;
  gender?: string;
  material?: string;
  attributes?: Record<string, any> | string;
  created_by?: string;
  created_by_name?: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  total_stock?: number;
  variants: Variant[];
  created_at: string;
}

export interface InventoryItem {
  inventory_id: string;
  variant_id: string;
  product_id: string;
  product_name: string;
  image_url?: string;
  product_status: string;
  sku: string;
  barcode?: string;
  size: string;
  color: string;
  color_code?: string;
  quantity: number;
  location: string;
  min_threshold: number;
  variant_price: number;
  variant_cost?: number;
  category_name?: string;
  brand_name?: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  variant_id: string;
  sku: string;
  barcode?: string;
  size: string;
  color: string;
  product_name: string;
  image_url?: string;
  user_name?: string;
  previous_quantity: number;
  quantity_changed: number;
  new_quantity: number;
  movement_type: 'sale' | 'adjustment' | 'received' | 'transfer' | 'damage' | 'return';
  reason: string;
  reference_id?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  birthday?: string;
  loyalty_points: number;
  total_spent: number;
  notes?: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  variant_id: string;
  product_name: string;
  variant_details: string;
  quantity: number;
  unit_price: number;
  cost_price?: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  receipt_number: string;
  cashier_id: string;
  cashier_name?: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  subtotal: number;
  discount_amount: number;
  discount_type: 'fixed' | 'percentage';
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  payment_status: 'completed' | 'refunded' | 'partial_refund';
  payment_method: 'cash' | 'card' | 'transfer' | 'mobile';
  notes?: string;
  is_refunded: number;
  refunded_amount: number;
  item_count?: number;
  created_at: string;
}

export interface Supplier {
  id: string;
  company_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  products_supplied?: string;
  balance_due: number;
  product_count?: number;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  supplier_name?: string;
  status: 'draft' | 'pending' | 'received' | 'cancelled';
  total_cost: number;
  expected_date?: string;
  received_date?: string;
  created_by_name?: string;
  item_count?: number;
  notes?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  category_id: string;
  category_name?: string;
  title: string;
  description?: string;
  amount: number;
  payment_method: string;
  expense_date: string;
  recorded_by_name?: string;
  created_at: string;
}

export interface Shift {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  starting_cash: number;
  ending_cash?: number;
  cash_sales: number;
  card_sales: number;
  total_sales: number;
  status: 'active' | 'closed';
  notes?: string;
}

export interface BusinessSettings {
  id: string;
  business_name: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  currency_code: string;
  currency_symbol: string;
  tax_rate: number;
  low_stock_threshold: number;
  receipt_header?: string;
  receipt_footer?: string;
  allow_negative_inventory: number;
  return_policy_days: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: number;
  link?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  user_role?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: string;
  new_values?: string;
  ip_address?: string;
  created_at: string;
}
