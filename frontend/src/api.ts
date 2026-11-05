import { User, Product, Category, Subcategory, Brand, InventoryItem, InventoryMovement, Customer, Sale, Supplier, PurchaseOrder, Expense, BusinessSettings, Notification, AuditLog } from './types.ts';

const TOKEN_KEY = 'aurum_jwt_token';

// Base URL resolution: Reads VITE_API_BASE_URL (standard) or VITE_API_URL, falling back to relative ''
const rawBaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL)
    : '') || '';

export const API_BASE_URL = String(rawBaseUrl).replace(/\/$/, '');

export class ApiError extends Error {
  public status: number;
  public details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Dispatch a client-side notification toast event
 */
export function emitToast(type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('hirbit:toast', {
        detail: { type, message, title, timestamp: Date.now() }
      })
    );
    window.dispatchEvent(
      new CustomEvent('aurum:toast', {
        detail: { type, message, title, timestamp: Date.now() }
      })
    );
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Normalize full URL
  const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  // Request Interceptor: Attach headers and Bearer token
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (networkErr: any) {
    const errorMsg = `Unable to connect to Hirbit Store API server at ${url}. Please check your connection.`;
    emitToast('error', errorMsg, 'Network Disconnected');
    throw new ApiError(errorMsg, 0);
  }

  const data = await response.json().catch(() => null);

  // Response Interceptors
  if (!response.ok) {
    let errorMessage = data?.error || data?.message || `HTTP error ${response.status}`;

    // Format Zod field validation errors if present
    if (data?.details && Array.isArray(data.details)) {
      const fieldErrors = data.details.map((d: any) => `${d.path ? d.path.join('.') + ': ' : ''}${d.message}`).join('; ');
      if (fieldErrors) {
        errorMessage = `${errorMessage} (${fieldErrors})`;
      }
    }

    // 401 Unauthorized Interceptor: Expired or invalid token
    if (response.status === 401) {
      clearStoredToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('aurum:auth_expired'));
        window.dispatchEvent(new CustomEvent('hirbit:auth_expired'));
        emitToast('warning', 'Your session has expired. Please sign in again.', 'Session Expired');
      }
    }

    // 403 Forbidden Interceptor: Insufficient RBAC role privileges
    if (response.status === 403) {
      emitToast('error', errorMessage || 'Access denied: your assigned role cannot perform this action.', 'Restricted Policy');
    }

    // 500 Server Error Interceptor
    if (response.status >= 500) {
      emitToast('error', errorMessage || 'An unexpected backend server error occurred.', 'Server Fault');
    }

    throw new ApiError(errorMessage, response.status, data?.details);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credential: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ credential, password })
    }),

  quickSwitch: (targetRole: 'admin' | 'store_person' | 'sales') =>
    request<{ token: string; user: User }>('/api/auth/quick-switch', {
      method: 'POST',
      body: JSON.stringify({ targetRole })
    }),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    }),

  // Products
  getProducts: (params?: { category?: string; subcategory?: string; search?: string; brand?: string; status?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request<Product[]>(`/api/products${query ? `?${query}` : ''}`);
  },

  lookupBarcode: (barcode: string) =>
    request<any>(`/api/products/barcode/${encodeURIComponent(barcode)}`),

  createProduct: (data: any) =>
    request<{ id: string; message: string }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateProduct: (id: string, data: any) =>
    request<{ message: string }>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  archiveProduct: (id: string) =>
    request<{ message: string }>(`/api/products/${id}`, {
      method: 'DELETE'
    }),

  approveProduct: (id: string) =>
    request<{ message: string }>(`/api/products/${id}/approve`, {
      method: 'POST'
    }),

  rejectProduct: (id: string, reason?: string) =>
    request<{ message: string }>(`/api/products/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),

  getPendingProductCount: () =>
    request<{ count: number }>('/api/products/approval/pending-count'),

  getCategories: () => request<Category[]>('/api/products/categories/all'),
  createCategory: (data: { name: string; description?: string }) =>
    request<Category>('/api/products/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: { name?: string; description?: string; is_active?: number }) =>
    request<{ message: string }>(`/api/products/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getSubcategories: (params?: { category_id?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request<Subcategory[]>(`/api/products/subcategories/all${query ? `?${query}` : ''}`);
  },
  createSubcategory: (data: { category_id: string; name: string; description?: string }) =>
    request<Subcategory>('/api/products/subcategories', { method: 'POST', body: JSON.stringify(data) }),
  updateSubcategory: (id: string, data: { name?: string; description?: string; is_active?: number }) =>
    request<{ message: string }>(`/api/products/subcategories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubcategory: (id: string) =>
    request<{ message: string }>(`/api/products/subcategories/${id}`, { method: 'DELETE' }),

  getBrands: () => request<Brand[]>('/api/products/brands/all'),
  createBrand: (data: { name: string; country?: string }) =>
    request<Brand>('/api/products/brands', { method: 'POST', body: JSON.stringify(data) }),

  // Inventory
  getInventory: (params?: { lowStockOnly?: boolean; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<InventoryItem[]>(`/api/inventory${query ? `?${query}` : ''}`);
  },

  adjustInventory: (data: { variant_id: string; new_quantity?: number; quantity_change?: number; type?: string; reason: string }) =>
    request<any>('/api/inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),

  receiveInventory: (data: { po_number?: string; notes?: string; items: { variant_id: string; quantity_received: number }[] }) =>
    request<any>('/api/inventory/receive', { method: 'POST', body: JSON.stringify(data) }),

  getInventoryMovements: (params?: { variant_id?: string; type?: string; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<InventoryMovement[]>(`/api/inventory/movements${query ? `?${query}` : ''}`);
  },

  // POS
  checkout: (data: {
    cart_items: { variant_id: string; quantity: number }[];
    customer_id?: string;
    payment_method: string;
    discount_amount?: number;
    discount_type?: 'fixed' | 'percentage';
    notes?: string;
    idempotency_key?: string;
  }) => request<{ message: string; receipt: any }>('/api/pos/checkout', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Sales
  getSales: (params?: { startDate?: string; endDate?: string; cashierId?: string; paymentMethod?: string; status?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<Sale[]>(`/api/sales${query ? `?${query}` : ''}`);
  },

  getSaleDetails: (id: string) =>
    request<{ sale: Sale; items: any[]; payments: any[]; refunds: any[] }>(`/api/sales/${id}`),

  refundSale: (id: string, data: { items?: any[]; reason: string; refund_amount?: number }) =>
    request<any>(`/api/sales/${id}/refund`, { method: 'POST', body: JSON.stringify(data) }),

  // Customers
  getCustomers: (params?: { search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<Customer[]>(`/api/customers${query ? `?${query}` : ''}`);
  },

  getCustomerDetails: (id: string) =>
    request<{ customer: Customer; purchases: any[] }>(`/api/customers/${id}`),

  createCustomer: (data: Partial<Customer>) =>
    request<Customer>('/api/customers', { method: 'POST', body: JSON.stringify(data) }),

  updateCustomer: (id: string, data: Partial<Customer>) =>
    request<Customer>(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Suppliers & POs
  getSuppliers: () => request<Supplier[]>('/api/suppliers'),
  createSupplier: (data: Partial<Supplier>) =>
    request<Supplier>('/api/suppliers', { method: 'POST', body: JSON.stringify(data) }),

  getPurchaseOrders: () => request<PurchaseOrder[]>('/api/suppliers/purchase-orders/all'),
  createPurchaseOrder: (data: any) =>
    request<any>('/api/suppliers/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  receivePurchaseOrder: (id: string) =>
    request<any>(`/api/suppliers/purchase-orders/${id}/receive`, { method: 'POST' }),

  // Expenses
  getExpenses: (params?: { categoryId?: string; startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<Expense[]>(`/api/expenses${query ? `?${query}` : ''}`);
  },
  getExpenseCategories: () => request<any[]>('/api/expenses/categories/all'),
  createExpense: (data: any) =>
    request<any>('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),
  deleteExpense: (id: string) =>
    request<any>(`/api/expenses/${id}`, { method: 'DELETE' }),

  // Reports
  getDashboardReports: (period = '30d', startDate?: string, endDate?: string) => {
    const query = new URLSearchParams({ period, ...(startDate ? { startDate } : {}), ...(endDate ? { endDate } : {}) }).toString();
    return request<any>(`/api/reports/dashboard?${query}`);
  },

  // Users (Admin only)
  getUsers: () => request<User[]>('/api/users'),
  createUser: (data: any) => request<User>('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) => request<User>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleUserActive: (id: string) => request<any>(`/api/users/${id}/toggle-active`, { method: 'PATCH' }),

  // Settings
  getSettings: () => request<BusinessSettings>('/api/settings'),
  updateSettings: (data: Partial<BusinessSettings>) =>
    request<BusinessSettings>('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Shifts
  getCurrentShift: () => request<{ shift: any | null }>('/api/shifts/current'),
  startShift: (data: { starting_cash: number; notes?: string }) =>
    request<any>('/api/shifts/start', { method: 'POST', body: JSON.stringify(data) }),
  closeShift: (data: { ending_cash: number; notes?: string }) =>
    request<any>('/api/shifts/close', { method: 'POST', body: JSON.stringify(data) }),

  // Audit & Notifications
  getAuditLogs: (params?: { action?: string; entityType?: string; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<AuditLog[]>(`/api/audit/logs${query ? `?${query}` : ''}`);
  },
  getNotifications: () => request<Notification[]>('/api/audit/notifications'),
  markNotificationRead: (id: string) => request<any>(`/api/audit/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<any>('/api/audit/notifications/read-all', { method: 'POST' })
};
