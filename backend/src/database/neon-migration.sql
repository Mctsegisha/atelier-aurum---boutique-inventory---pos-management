-- ====================================================================
-- Hirbit Store - Neon PostgreSQL Master Migration Script
-- Production-Ready 26-Table Relational Schema with Composite Indexes,
-- Foreign Keys, Cascade Constraints, and RBAC Role Seeding.
-- Location: Hawassa Piyassa Mall, 1st Floor (Near Kibiru Hospital), Hawassa
-- Primary Currency: Ethiopian Birr (ETB)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 4. Profiles (Staff & User Accounts)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'sales' REFERENCES roles(id),
  is_active INTEGER NOT NULL DEFAULT 1,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6b. Subcategories
CREATE TABLE IF NOT EXISTS subcategories (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id);

-- 7. Brands
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  products_supplied TEXT,
  balance_due NUMERIC(12, 2) DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id TEXT REFERENCES subcategories(id) ON DELETE SET NULL,
  brand_id TEXT REFERENCES brands(id) ON DELETE SET NULL,
  supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
  purchase_price NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
  selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
  wholesale_price NUMERIC(10, 2) DEFAULT 0.0,
  tax_rate NUMERIC(5, 4) DEFAULT 0.15,
  min_stock_level INTEGER NOT NULL DEFAULT 5,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_simple INTEGER NOT NULL DEFAULT 0,
  season TEXT,
  collection TEXT,
  gender TEXT,
  material TEXT,
  attributes TEXT,
  created_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category_id, status);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- 10. Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT UNIQUE,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  color_code TEXT,
  variant_name TEXT,
  attributes TEXT,
  purchase_price NUMERIC(10, 2),
  selling_price NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_barcode ON product_variants(barcode);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);

-- 11. Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  variant_id TEXT UNIQUE NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  location TEXT DEFAULT 'Main Storefront',
  min_threshold INTEGER DEFAULT 3,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventory_variant ON inventory(variant_id);

-- 12. Inventory Movements
CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  variant_id TEXT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  previous_quantity INTEGER NOT NULL,
  quantity_changed INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  movement_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  reference_id TEXT,
  user_id TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_movements_variant_date ON inventory_movements(variant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_movements_user ON inventory_movements(user_id);

-- 13. Customers
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  address TEXT,
  birthday DATE,
  loyalty_points INTEGER DEFAULT 0,
  total_spent NUMERIC(12, 2) DEFAULT 0.0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- 14. Sales
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  receipt_number TEXT UNIQUE NOT NULL,
  cashier_id TEXT NOT NULL REFERENCES profiles(id),
  customer_id TEXT REFERENCES customers(id),
  subtotal NUMERIC(12, 2) NOT NULL,
  discount_amount NUMERIC(10, 2) DEFAULT 0.0,
  discount_type TEXT DEFAULT 'fixed',
  tax_rate NUMERIC(5, 4) DEFAULT 0.15,
  tax_amount NUMERIC(10, 2) DEFAULT 0.0,
  total_amount NUMERIC(12, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'completed',
  payment_method TEXT NOT NULL,
  notes TEXT,
  is_refunded INTEGER DEFAULT 0,
  refunded_amount NUMERIC(12, 2) DEFAULT 0.0,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sales_cashier_date ON sales(cashier_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_receipt ON sales(receipt_number);

-- 15. Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL REFERENCES product_variants(id),
  product_name TEXT NOT NULL,
  variant_details TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  cost_price NUMERIC(10, 2) NOT NULL,
  discount NUMERIC(10, 2) DEFAULT 0.0,
  total NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_variant ON sale_items(variant_id);

-- 16. Payments
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  transaction_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_sale ON payments(sale_id);

-- 17. Refunds
CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id),
  receipt_number TEXT NOT NULL,
  authorized_by_id TEXT NOT NULL REFERENCES profiles(id),
  cashier_id TEXT NOT NULL REFERENCES profiles(id),
  refund_amount NUMERIC(12, 2) NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refunds_sale ON refunds(sale_id);
CREATE INDEX IF NOT EXISTS idx_refunds_auth_user ON refunds(authorized_by_id);

-- 18. Refund Items
CREATE TABLE IF NOT EXISTS refund_items (
  id TEXT PRIMARY KEY,
  refund_id TEXT NOT NULL REFERENCES refunds(id) ON DELETE CASCADE,
  sale_item_id TEXT NOT NULL REFERENCES sale_items(id),
  variant_id TEXT NOT NULL REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  restock_item INTEGER DEFAULT 1,
  refund_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  status TEXT NOT NULL DEFAULT 'pending',
  total_cost NUMERIC(12, 2) DEFAULT 0.0,
  expected_date DATE,
  received_date TIMESTAMPTZ,
  created_by_id TEXT NOT NULL REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);

-- 20. Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY,
  po_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL REFERENCES product_variants(id),
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  unit_cost NUMERIC(10, 2) NOT NULL,
  total_cost NUMERIC(12, 2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(po_id);

-- 21. Expense Categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- 22. Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES expense_categories(id),
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  expense_date DATE NOT NULL,
  recorded_by_id TEXT NOT NULL REFERENCES profiles(id),
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);

-- 23. Shifts
CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id),
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  starting_cash NUMERIC(10, 2) NOT NULL DEFAULT 200.0,
  ending_cash NUMERIC(10, 2),
  cash_sales NUMERIC(12, 2) DEFAULT 0.0,
  card_sales NUMERIC(12, 2) DEFAULT 0.0,
  total_sales NUMERIC(12, 2) DEFAULT 0.0,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_shifts_user_status ON shifts(user_id, status);

-- 24. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_user_action ON audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);

-- 25. Business Settings
CREATE TABLE IF NOT EXISTS business_settings (
  id TEXT PRIMARY KEY DEFAULT 'cfg_default',
  business_name TEXT NOT NULL,
  tagline TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  currency_code TEXT DEFAULT 'ETB',
  currency_symbol TEXT DEFAULT 'ETB',
  tax_rate NUMERIC(5, 4) DEFAULT 0.15,
  low_stock_threshold INTEGER DEFAULT 5,
  receipt_header TEXT,
  receipt_footer TEXT,
  allow_negative_inventory INTEGER DEFAULT 0,
  return_policy_days INTEGER DEFAULT 14
);

-- 26. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- ====================================================================
-- SEED DATA: Roles, Permissions, and Default Demo Profiles
-- ====================================================================
INSERT INTO roles (id, name, description) VALUES
  ('admin', 'System Administrator', 'Full business authority, financial visibility, role assignment, and system configuration'),
  ('store_person', 'Store Manager', 'Daily store & inventory management, stock receiving, catalog adjustments, and sales oversight'),
  ('sales', 'Sales Associate', 'Point of sale checkout, customer lookup, shift reconciliation, and receipt handling')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO profiles (id, username, email, password_hash, full_name, role, is_active, phone, avatar_url) VALUES
  ('u_admin', 'vivienne_owner', 'admin@hirbitstore.com', '$2b$10$7SF7.iXYS98DIg0bU6Ww3.54zgvvPSSGxttLOXx1jgO0jCOKNVgc.', 'Vivienne Laurent', 'admin', 1, '+251 91 123 4567', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
  ('u_manager', 'julian_store', 'storeperson@hirbitstore.com', '$2b$10$7SF7.iXYS98DIg0bU6Ww3.54zgvvPSSGxttLOXx1jgO0jCOKNVgc.', 'Julian Vance', 'store_person', 1, '+251 91 123 4568', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
  ('u_cashier', 'camille_sales', 'sales@hirbitstore.com', '$2b$10$7SF7.iXYS98DIg0bU6Ww3.PRLLzeFNAFtfOpELH4gF6mIJKss8gPS', 'Camille Moreau', 'sales', 1, '+251 91 123 4569', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, email = EXCLUDED.email, full_name = EXCLUDED.full_name;

INSERT INTO business_settings (id, business_name, tagline, phone, email, address, currency_code, currency_symbol, tax_rate, low_stock_threshold, receipt_header, receipt_footer, allow_negative_inventory, return_policy_days) VALUES
  ('cfg_default', 'Hirbit Store', 'Retail Inventory & Quality Goods', '+251 91 123 4567', 'contact@hirbitstore.com', 'Hawassa Piyassa Mall, 1st Floor (Near Kibiru Hospital), Hawassa', 'ETB', 'ETB', 0.1500, 3, '*** HIRBIT STORE · HAWASSA ***\nPiyassa Mall, 1st Floor (Near Kibiru Hospital)', 'Merchandise in original condition may be exchanged within 14 days.\nThank you for choosing Hirbit Store!', 0, 14)
ON CONFLICT (id) DO UPDATE SET business_name = EXCLUDED.business_name, address = EXCLUDED.address, currency_code = EXCLUDED.currency_code, currency_symbol = EXCLUDED.currency_symbol, receipt_header = EXCLUDED.receipt_header, receipt_footer = EXCLUDED.receipt_footer;

