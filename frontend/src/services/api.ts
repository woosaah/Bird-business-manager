import axios from 'axios';
import type {
  Product,
  Customer,
  Sale,
  DashboardStats,
  CreateSaleRequest,
  CalculatorRequest,
  ApiResponse
} from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Products API
export const productsApi = {
  getAll: (activeOnly = true) =>
    api.get<ApiResponse<Product[]>>(`/api/products?active_only=${activeOnly}`),

  getById: (id: number) =>
    api.get<ApiResponse<Product>>(`/api/products/${id}`),

  create: (data: Partial<Product>) =>
    api.post<ApiResponse<Product>>('/api/products', data),

  update: (id: number, data: Partial<Product>) =>
    api.put<ApiResponse<Product>>(`/api/products/${id}`, data),

  updateStock: (id: number, quantity: number, operation: 'add' | 'set') =>
    api.patch<ApiResponse<Product>>(`/api/products/${id}/stock`, { quantity, operation }),

  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`/api/products/${id}`),

  getLowStock: (threshold = 10) =>
    api.get<ApiResponse<Product[]>>(`/api/products/low-stock?threshold=${threshold}`),
};

// Customers API
export const customersApi = {
  getAll: (activeOnly = true) =>
    api.get<ApiResponse<Customer[]>>(`/api/customers?active_only=${activeOnly}`),

  getById: (id: number) =>
    api.get<ApiResponse<any>>(`/api/customers/${id}`),

  create: (data: Partial<Customer>) =>
    api.post<ApiResponse<Customer>>('/api/customers', data),

  update: (id: number, data: Partial<Customer>) =>
    api.put<ApiResponse<Customer>>(`/api/customers/${id}`, data),

  updateBalance: (id: number, amount: number, operation: 'add' | 'set') =>
    api.patch<ApiResponse<Customer>>(`/api/customers/${id}/balance`, { amount, operation }),

  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`/api/customers/${id}`),

  getWithBalance: () =>
    api.get<ApiResponse<Customer[]>>('/api/customers/with-balance'),
};

// Sales API
export const salesApi = {
  getAll: (params?: {
    customer_id?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }) => api.get<ApiResponse<Sale[]>>('/api/sales', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<Sale>>(`/api/sales/${id}`),

  create: (data: CreateSaleRequest) =>
    api.post<ApiResponse<Sale>>('/api/sales', data),

  addPayment: (id: number, payment: { amount: number; payment_method?: string; notes?: string }) =>
    api.post<ApiResponse<Sale>>(`/api/sales/${id}/payments`, payment),

  getStats: (params?: { start_date?: string; end_date?: string }) =>
    api.get<ApiResponse<any>>('/api/sales/stats', { params }),
};

// Dashboard API
export const dashboardApi = {
  getStats: () =>
    api.get<ApiResponse<DashboardStats>>('/api/dashboard/stats'),

  getTrends: (period: 'daily' | 'weekly' | 'monthly' = 'daily') =>
    api.get<ApiResponse<any[]>>('/api/dashboard/trends', { params: { period } }),

  getTopProducts: (limit = 10) =>
    api.get<ApiResponse<any[]>>('/api/dashboard/top-products', { params: { limit } }),

  getCustomerAnalytics: (limit = 10) =>
    api.get<ApiResponse<any>>('/api/dashboard/customer-analytics', { params: { limit } }),

  getInventory: () =>
    api.get<ApiResponse<any>>('/api/dashboard/inventory'),
};

// Calculator API
export const calculatorApi = {
  calculate: (data: CalculatorRequest) =>
    api.post<ApiResponse<any>>('/api/calculator', data),

  getWeightPrices: (pricePerKg: number) =>
    api.get<ApiResponse<Record<string, number>>>('/api/calculator/weight-prices', {
      params: { price_per_kg: pricePerKg }
    }),
};

export default api;
