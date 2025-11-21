import axios from 'axios';
import type {
  Product,
  Customer,
  Sale,
  User,
  AuthResponse,
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

// Request interceptor - Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>('/api/auth/login', { username, password }),

  logout: () =>
    api.post<ApiResponse<void>>('/api/auth/logout'),

  getCurrentUser: () =>
    api.get<ApiResponse<User>>('/api/auth/me'),

  register: (data: {
    username: string;
    email: string;
    password: string;
    full_name: string;
    role?: string;
  }) => api.post<ApiResponse<User>>('/api/auth/register', data),

  getAllUsers: () =>
    api.get<ApiResponse<User[]>>('/api/auth/users'),

  updateUser: (id: number, data: Partial<User> & { password?: string }) =>
    api.put<ApiResponse<User>>(`/api/auth/users/${id}`, data),

  deleteUser: (id: number) =>
    api.delete<ApiResponse<void>>(`/api/auth/users/${id}`),
};

export default api;
