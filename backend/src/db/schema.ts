import { pgTable, text, integer, doublePrecision, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Roles
export const roles = pgTable('roles', {
  id: text('id').primaryKey(),
  name: text('name').unique().notNull(),
  description: text('description'),
});

// 2. Permissions
export const permissions = pgTable('permissions', {
  id: text('id').primaryKey(),
  key: text('key').unique().notNull(),
  description: text('description'),
  category: text('category').notNull(),
});

// 3. Role Permissions
export const rolePermissions = pgTable('role_permissions', {
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: text('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.roleId, table.permissionId] }),
]);

// 4. Profiles (Staff & Users)
export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(), // User ID or Firebase UID
  username: text('username').unique().notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull().default('sales').references(() => roles.id),
  isActive: integer('is_active').notNull().default(1),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 5. User Sessions
export const userSessions = pgTable('user_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. Categories
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').unique().notNull(),
  slug: text('slug').unique().notNull(),
  description: text('description'),
  isActive: integer('is_active').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow(),
});

// 6b. Subcategories
export const subcategories = pgTable('subcategories', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  isActive: integer('is_active').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_subcategories_category').on(table.categoryId),
]);

// 7. Brands
export const brands = pgTable('brands', {
  id: text('id').primaryKey(),
  name: text('name').unique().notNull(),
  country: text('country'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 8. Suppliers
export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey(),
  companyName: text('company_name').notNull(),
  contactPerson: text('contact_person'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  productsSupplied: text('products_supplied'),
  balanceDue: doublePrecision('balance_due').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. Products
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  description: text('description'),
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
  subcategoryId: text('subcategory_id').references(() => subcategories.id, { onDelete: 'set null' }),
  brandId: text('brand_id').references(() => brands.id, { onDelete: 'set null' }),
  supplierId: text('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  purchasePrice: doublePrecision('purchase_price').notNull().default(0),
  sellingPrice: doublePrecision('selling_price').notNull().default(0),
  wholesalePrice: doublePrecision('wholesale_price').default(0),
  taxRate: doublePrecision('tax_rate').default(0.15),
  minStockLevel: integer('min_stock_level').notNull().default(5),
  imageUrl: text('image_url'),
  status: text('status').notNull().default('active'), // active, archived, draft
  isSimple: integer('is_simple').notNull().default(0), // 1 = simple product, 0 = has variants
  season: text('season'),
  collection: text('collection'),
  gender: text('gender'),
  material: text('material'),
  attributes: text('attributes'), // Dynamic category-specific attributes JSON
  createdBy: text('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  approvedBy: text('approved_by').references(() => profiles.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 10. Product Variants
export const productVariants = pgTable('product_variants', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sku: text('sku').unique().notNull(),
  barcode: text('barcode').unique(),
  size: text('size').notNull(),
  color: text('color').notNull(),
  colorCode: text('color_code'),
  variantName: text('variant_name'),
  attributes: text('attributes'), // Dynamic variant-specific attributes JSON
  purchasePrice: doublePrecision('purchase_price'),
  sellingPrice: doublePrecision('selling_price'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_product_variants_sku').on(table.sku),
  index('idx_product_variants_barcode').on(table.barcode),
  index('idx_product_variants_product').on(table.productId),
]);

// 11. Inventory
export const inventory = pgTable('inventory', {
  id: text('id').primaryKey(),
  variantId: text('variant_id').unique().notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(0),
  location: text('location').default('Main Storefront'),
  minThreshold: integer('min_threshold').default(3),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('idx_inventory_variant').on(table.variantId),
]);

// 12. Inventory Movements
export const inventoryMovements = pgTable('inventory_movements', {
  id: text('id').primaryKey(),
  variantId: text('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  previousQuantity: integer('previous_quantity').notNull(),
  quantityChanged: integer('quantity_changed').notNull(),
  newQuantity: integer('new_quantity').notNull(),
  movementType: text('movement_type').notNull(), // 'sale', 'adjustment', 'received', 'transfer', 'damage', 'return'
  reason: text('reason').notNull(),
  referenceId: text('reference_id'),
  userId: text('user_id').references(() => profiles.id),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_inventory_movements_variant').on(table.variantId),
]);

// 13. Customers
export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  phone: text('phone').unique(),
  email: text('email'),
  address: text('address'),
  birthday: text('birthday'),
  loyaltyPoints: integer('loyalty_points').default(0),
  totalSpent: doublePrecision('total_spent').default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 14. Sales
export const sales = pgTable('sales', {
  id: text('id').primaryKey(),
  receiptNumber: text('receipt_number').unique().notNull(),
  cashierId: text('cashier_id').notNull().references(() => profiles.id),
  customerId: text('customer_id').references(() => customers.id),
  subtotal: doublePrecision('subtotal').notNull(),
  discountAmount: doublePrecision('discount_amount').default(0),
  discountType: text('discount_type').default('fixed'),
  taxRate: doublePrecision('tax_rate').default(0.15),
  taxAmount: doublePrecision('tax_amount').default(0),
  totalAmount: doublePrecision('total_amount').notNull(),
  paymentStatus: text('payment_status').notNull().default('completed'), // 'completed', 'refunded', 'partial_refund'
  paymentMethod: text('payment_method').notNull(), // 'cash', 'card', 'transfer', 'mobile'
  notes: text('notes'),
  isRefunded: integer('is_refunded').default(0),
  refundedAmount: doublePrecision('refunded_amount').default(0),
  idempotencyKey: text('idempotency_key').unique(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_sales_receipt').on(table.receiptNumber),
  index('idx_sales_cashier').on(table.cashierId),
  index('idx_sales_created').on(table.createdAt),
]);

// 15. Sale Items
export const saleItems = pgTable('sale_items', {
  id: text('id').primaryKey(),
  saleId: text('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
  variantId: text('variant_id').notNull().references(() => productVariants.id),
  productName: text('product_name').notNull(),
  variantDetails: text('variant_details').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: doublePrecision('unit_price').notNull(),
  costPrice: doublePrecision('cost_price').notNull(),
  discount: doublePrecision('discount').default(0),
  total: doublePrecision('total').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_sale_items_sale').on(table.saleId),
  index('idx_sale_items_variant').on(table.variantId),
]);

// 16. Payments
export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  saleId: text('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
  paymentMethod: text('payment_method').notNull(),
  amount: doublePrecision('amount').notNull(),
  status: text('status').notNull().default('completed'),
  transactionRef: text('transaction_ref'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 17. Refunds
export const refunds = pgTable('refunds', {
  id: text('id').primaryKey(),
  saleId: text('sale_id').notNull().references(() => sales.id),
  receiptNumber: text('receipt_number').notNull(),
  authorizedById: text('authorized_by_id').notNull().references(() => profiles.id),
  cashierId: text('cashier_id').notNull().references(() => profiles.id),
  refundAmount: doublePrecision('refund_amount').notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 18. Refund Items
export const refundItems = pgTable('refund_items', {
  id: text('id').primaryKey(),
  refundId: text('refund_id').notNull().references(() => refunds.id, { onDelete: 'cascade' }),
  saleItemId: text('sale_item_id').notNull().references(() => saleItems.id),
  variantId: text('variant_id').notNull().references(() => productVariants.id),
  quantity: integer('quantity').notNull(),
  restockItem: integer('restock_item').default(1),
  refundAmount: doublePrecision('refund_amount').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 19. Purchase Orders
export const purchaseOrders = pgTable('purchase_orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').unique().notNull(),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id),
  status: text('status').notNull().default('pending'), // 'draft', 'pending', 'received', 'cancelled'
  totalCost: doublePrecision('total_cost').default(0),
  expectedDate: text('expected_date'),
  receivedDate: text('received_date'),
  createdById: text('created_by_id').notNull().references(() => profiles.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 20. Purchase Order Items
export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: text('id').primaryKey(),
  poId: text('po_id').notNull().references(() => purchaseOrders.id, { onDelete: 'cascade' }),
  variantId: text('variant_id').notNull().references(() => productVariants.id),
  quantityOrdered: integer('quantity_ordered').notNull(),
  quantityReceived: integer('quantity_received').default(0),
  unitCost: doublePrecision('unit_cost').notNull(),
  totalCost: doublePrecision('total_cost').notNull(),
});

// 21. Expense Categories
export const expenseCategories = pgTable('expense_categories', {
  id: text('id').primaryKey(),
  name: text('name').unique().notNull(),
  description: text('description'),
});

// 22. Expenses
export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').notNull().references(() => expenseCategories.id),
  title: text('title').notNull(),
  description: text('description'),
  amount: doublePrecision('amount').notNull(),
  paymentMethod: text('payment_method').notNull(), // 'cash', 'card', 'bank_transfer'
  expenseDate: text('expense_date').notNull(),
  recordedById: text('recorded_by_id').notNull().references(() => profiles.id),
  receiptUrl: text('receipt_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 23. Shifts
export const shifts = pgTable('shifts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => profiles.id),
  startTime: timestamp('start_time').defaultNow(),
  endTime: timestamp('end_time'),
  startingCash: doublePrecision('starting_cash').notNull().default(200),
  endingCash: doublePrecision('ending_cash'),
  cashSales: doublePrecision('cash_sales').default(0),
  cardSales: doublePrecision('card_sales').default(0),
  totalSales: doublePrecision('total_sales').default(0),
  status: text('status').notNull().default('active'), // 'active', 'closed'
  notes: text('notes'),
});

// 24. Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => profiles.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  oldValues: text('old_values'),
  newValues: text('new_values'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_audit_logs_user').on(table.userId),
]);

// 25. Business Settings
export const businessSettings = pgTable('business_settings', {
  id: text('id').primaryKey(),
  businessName: text('business_name').notNull(),
  tagline: text('tagline'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  currencyCode: text('currency_code').default('ETB'),
  currencySymbol: text('currency_symbol').default('ETB'),
  taxRate: doublePrecision('tax_rate').default(0.15),
  lowStockThreshold: integer('low_stock_threshold').default(5),
  receiptHeader: text('receipt_header'),
  receiptFooter: text('receipt_footer'),
  allowNegativeInventory: integer('allow_negative_inventory').default(0),
  returnPolicyDays: integer('return_policy_days').default(14),
});

// 26. Notifications
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'low_stock', 'new_sale', 'refund_request', 'po_received', 'system'
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: integer('is_read').default(0),
  link: text('link'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  subcategory: one(subcategories, {
    fields: [products.subcategoryId],
    references: [subcategories.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  supplier: one(suppliers, {
    fields: [products.supplierId],
    references: [suppliers.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  inventoryItem: one(inventory, {
    fields: [productVariants.id],
    references: [inventory.variantId],
  }),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  cashier: one(profiles, {
    fields: [sales.cashierId],
    references: [profiles.id],
  }),
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  items: many(saleItems),
  payments: many(payments),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  variant: one(productVariants, {
    fields: [saleItems.variantId],
    references: [productVariants.id],
  }),
}));
