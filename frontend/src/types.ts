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

export interface InventoryBatch {
  batch_number: string;
  variant_id: string;
  inventory_id: string;
  product_id: string;
  sku: string;
  barcode?: string;
  size: string;
  color: string;
  color_code?: string | null;
  variant_name: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
  min_threshold: number;
  location: string;
  updated_at: string;
}

export interface ParentInventoryProduct {
  product_id: string;
  product_name: string;
  category_id?: string;
  category_name: string;
  subcategory_name?: string;
  brand_name?: string;
  image_url?: string | null;
  is_simple: boolean;
  product_status: string;
  quantity: number;
  total_quantity: number;
  min_threshold: number;
  cost_price: number;
  selling_price: number;
  status: 'low_stock' | 'healthy';
  batch_count: number;
  batch_number: string;
  batches: InventoryBatch[];
}

export interface InventoryStats {
  total_products: number;
  total_value: number;
  total_cost_value: number;
  low_stock_count: number;
  slow_moving_count: number;
  total_stock: number;
  total_variants: number;
}

export interface SlowMovingInventoryItem {
  product_id: string;
  product_name: string;
  image_url?: string;
  category: string;
  stock_quantity: number;
  selling_price: number;
  units_sold: number;
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

export interface CashSession {
  id: string;
  opened_by_user_id?: string | null;
  opened_by_name: string;
  opened_at: string;
  closed_at?: string | null;
  opening_float: number;
  cash_sales: number;
  telebirr_sales: number;
  total_sales: number;
  expected_cash: number;
  closing_cash?: number | null;
  difference?: number | null;
  notes?: string | null;
  status: 'open' | 'closed';
  created_at?: string;
  updated_at?: string;
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

// ==========================================
// REPORTS MODULE V2 TYPED INTERFACES
// ==========================================

export interface SalesReportGroupedBar {
  date: string;
  label: string;
  sales_count: number;
  revenue: number;
  cost: number;
  gross_profit: number;
  margin_percent: number;
}

export interface SalesReportBreakdownRow {
  date: string;
  label: string;
  sales_count: number;
  revenue: number;
  cost: number;
  gross_profit: number;
  margin_percent: number;
}

export interface SalesReportTopEarner {
  product_name: string;
  units_sold: number;
  revenue: number;
  gross_profit: number;
}

export interface SalesReportHourlyPoint {
  hour: string;
  hour_24: number;
  sales_count: number;
  revenue: number;
}

export interface SalesReportResponse {
  kpis: {
    total_revenue: number;
    total_gross_profit: number;
    avg_daily_sales: number;
  };
  grouped_bars: SalesReportGroupedBar[];
  breakdown_table: SalesReportBreakdownRow[];
  insights: {
    average_sale: number;
    items_per_sale: number;
    money_in_stock_nothing_sold: number;
    at_risk_dead_stock: number;
    pareto_insight: string;
    busiest_insight: string;
    top_earners: SalesReportTopEarner[];
    hourly_distribution: SalesReportHourlyPoint[];
  };
}

export interface PnlExpenseCategory {
  category: string;
  amount: number;
}

export interface PnlProductProfit {
  product_name: string;
  qty_sold: number;
  revenue: number;
  cost: number;
  gross_profit: number;
  margin_percent: number;
}

export interface PnlReportResponse {
  statement: {
    revenue: number;
    sales_count: number;
    cogs: number;
    gross_profit: number;
    gross_margin_percent: number;
    operating_expenses: number;
    wastage_written_off: number;
    net_profit: number;
    net_margin_percent: number;
  };
  where_expenses_went: PnlExpenseCategory[];
  profit_by_product: PnlProductProfit[];
}

export interface StockValueReportResponse {
  cost_of_stock_on_hand: number;
  value_at_retail: number;
  markup_if_all_sells: number;
  markup_on_cost_percent: number;
  total_units: number;
  total_products: number;
  dead_stock_value: number;
  dead_stock_units: number;
}

export interface ChannelBreakdownItem {
  channel: string;
  channel_key: string;
  sales_count: number;
  share_percent: number;
  collected: number;
  note?: string;
}

export interface ChannelsReportResponse {
  taken_in_total: number;
  channels: ChannelBreakdownItem[];
}

export interface ReceivableCustomer {
  customer_id: string;
  customer_name: string;
  phone?: string;
  email?: string;
  due_date: string;
  outstanding: number;
  is_overdue: boolean;
  days_overdue?: number;
}

export interface OwedToUsReportResponse {
  total_owed: number;
  receivables: ReceivableCustomer[];
}

export interface WastageReasonBreakdown {
  reason: string;
  units: number;
  cost: number;
}

export interface WastageReportResponse {
  at_risk_value: number;
  at_risk_revenue: number;
  expired_not_written_off: number;
  written_off: number;
  total_lost: number;
  breakdown: WastageReasonBreakdown[];
}

