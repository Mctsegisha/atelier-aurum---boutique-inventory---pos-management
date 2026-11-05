-- Hirbit Store Database Schema (SQLite / PostgreSQL Compatible)

-- 1. Roles
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- 2. Permissions
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL
);

-- 3. Role Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL,
  permission_id TEXT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 4. Profiles (Staff & Users)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'sales',
  is_active INTEGER NOT NULL DEFAULT 1,
  phone TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role) REFERENCES roles(id)
);

-- 5. User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 6. Categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6b. Subcategories
CREATE TABLE IF NOT EXISTS subcategories (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 7. Brands
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  country TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  productsSupplied TEXT,
  balance_due REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id TEXT,
  subcategory_id TEXT,
  brand_id TEXT,
  supplier_id TEXT,
  purchase_price REAL NOT NULL DEFAULT 0.0,
  selling_price REAL NOT NULL DEFAULT 0.0,
  wholesale_price REAL DEFAULT 0.0,
  tax_rate REAL DEFAULT 0.15,
  min_stock_level INTEGER NOT NULL DEFAULT 5,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, archived, draft
  is_simple INTEGER NOT NULL DEFAULT 0, -- 1 = simple product, 0 = has variants
  season TEXT,
  collection TEXT,
  gender TEXT, -- Women, Men, Unisex, Kids
  material TEXT,
  attributes TEXT, -- Dynamic attributes JSON
  created_by TEXT,
  approved_by TEXT,
  approved_at DATETIME,
  rejection_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- 10. Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT UNIQUE,
  size TEXT NOT NULL, -- XS, S, M, L, shoe size, volume ml, length in, or Standard
  color TEXT NOT NULL,
  color_code TEXT,
  variant_name TEXT,
  attributes TEXT, -- Dynamic variant attributes JSON
  purchase_price REAL,
  selling_price REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 11. Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  variant_id TEXT UNIQUE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  location TEXT DEFAULT 'Main Storefront',
  min_threshold INTEGER DEFAULT 3,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
);

-- 12. Inventory Movements
CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  variant_id TEXT NOT NULL,
  previous_quantity INTEGER NOT NULL,
  quantity_changed INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  movement_type TEXT NOT NULL, -- 'sale', 'adjustment', 'received', 'transfer', 'damage', 'return'
  reason TEXT NOT NULL,
  reference_id TEXT, -- sale_id, po_id, or adjustment_ref
  user_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES profiles(id)
);

-- 13. Customers
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  address TEXT,
  birthday TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_spent REAL DEFAULT 0.0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 14. Sales
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  receipt_number TEXT UNIQUE NOT NULL,
  cashier_id TEXT NOT NULL,
  customer_id TEXT,
  subtotal REAL NOT NULL,
  discount_amount REAL DEFAULT 0.0,
  discount_type TEXT DEFAULT 'fixed',
  tax_rate REAL DEFAULT 0.15,
  tax_amount REAL DEFAULT 0.0,
  total_amount REAL NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'refunded', 'partial_refund'
  payment_method TEXT NOT NULL, -- 'cash', 'card', 'transfer', 'mobile'
  notes TEXT,
  is_refunded INTEGER DEFAULT 0,
  refunded_amount REAL DEFAULT 0.0,
  idempotency_key TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cashier_id) REFERENCES profiles(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- 15. Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  variant_details TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  cost_price REAL NOT NULL,
  discount REAL DEFAULT 0.0,
  total REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

-- 16. Payments
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  transaction_ref TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

-- 17. Refunds
CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  receipt_number TEXT NOT NULL,
  authorized_by_id TEXT NOT NULL,
  cashier_id TEXT NOT NULL,
  refund_amount REAL NOT NULL,
  reason TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id),
  FOREIGN KEY (authorized_by_id) REFERENCES profiles(id),
  FOREIGN KEY (cashier_id) REFERENCES profiles(id)
);

-- 18. Refund Items
CREATE TABLE IF NOT EXISTS refund_items (
  id TEXT PRIMARY KEY,
  refund_id TEXT NOT NULL,
  sale_item_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  restock_item INTEGER DEFAULT 1,
  refund_amount REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (refund_id) REFERENCES refunds(id) ON DELETE CASCADE,
  FOREIGN KEY (sale_item_id) REFERENCES sale_items(id)
);

-- 19. Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  supplier_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'draft', 'pending', 'received', 'cancelled'
  total_cost REAL DEFAULT 0.0,
  expected_date TEXT,
  received_date TEXT,
  created_by_id TEXT NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (created_by_id) REFERENCES profiles(id)
);

-- 20. Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY,
  po_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  unit_cost REAL NOT NULL,
  total_cost REAL NOT NULL,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

-- 21. Expense Categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- 22. Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL, -- 'cash', 'card', 'bank_transfer'
  expense_date TEXT NOT NULL,
  recorded_by_id TEXT NOT NULL,
  receipt_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES expense_categories(id),
  FOREIGN KEY (recorded_by_id) REFERENCES profiles(id)
);

-- 23. Shifts
CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_time DATETIME,
  starting_cash REAL NOT NULL DEFAULT 200.0,
  ending_cash REAL,
  cash_sales REAL DEFAULT 0.0,
  card_sales REAL DEFAULT 0.0,
  total_sales REAL DEFAULT 0.0,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'closed'
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES profiles(id)
);

-- 24. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values TEXT,
  new_values TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id)
);

-- 25. Business Settings
CREATE TABLE IF NOT EXISTS business_settings (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  tagline TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  currency_code TEXT DEFAULT 'ETB',
  currency_symbol TEXT DEFAULT 'ETB',
  tax_rate REAL DEFAULT 0.15,
  low_stock_threshold INTEGER DEFAULT 5,
  receipt_header TEXT,
  receipt_footer TEXT,
  allow_negative_inventory INTEGER DEFAULT 0,
  return_policy_days INTEGER DEFAULT 14
);

-- 26. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'low_stock', 'new_sale', 'refund_request', 'po_received', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  link TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning-fast queries, POS barcode searches, and reporting
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_barcode ON product_variants(barcode);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_variant ON inventory(variant_id);
CREATE INDEX IF NOT EXISTS idx_sales_receipt ON sales(receipt_number);
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_variant ON sale_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant ON inventory_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_sales_cashier_created ON sales(cashier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity_min ON inventory(quantity, min_threshold);
CREATE INDEX IF NOT EXISTS idx_shifts_user_status ON shifts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_products_status_category ON products(status, category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_date ON expenses(category_id, expense_date);
