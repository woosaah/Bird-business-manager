// Type definitions for The Birds Business Manager

export type UnitType = 'bag' | 'bottle' | 'kg' | 'each';
export type PricingType = 'per_unit' | 'per_kg';
export type CustomerType = 'retail' | 'wholesale' | 'mates';
export type PaymentStatus = 'paid' | 'partial' | 'owing';
export type SyncStatus = 'pending' | 'success' | 'failed';
export type UserRole = 'admin' | 'manager' | 'staff';

export interface Product {
  id: number;
  name: string;
  supplier_cost: number;
  sell_price: number;
  stock_quantity: number;
  unit_type: UnitType;
  pricing_type: PricingType;
  price_per_kg?: number;
  profit_margin: number;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  customer_type: CustomerType;
  discount_amount?: number;
  credit_limit: number;
  balance_owing: number;
  xero_contact_id?: string;
  is_active: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Sale {
  id: number;
  customer_id?: number;
  sale_date: Date;
  subtotal: number;
  gst_amount: number;
  total: number;
  payment_status: PaymentStatus;
  invoice_number: string;
  notes?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id?: number;
  product_name: string;
  quantity?: number;
  weight_kg?: number;
  unit_price: number;
  line_total: number;
  created_at: Date;
}

export interface Payment {
  id: number;
  sale_id: number;
  payment_date: Date;
  amount: number;
  payment_method?: string;
  notes?: string;
  created_at: Date;
}

export interface SupplierInvoice {
  id: number;
  invoice_number: string;
  invoice_date: Date;
  supplier: string;
  total_amount: number;
  items_json?: any;
  processed_at: Date;
  processed_by?: string;
  created_at: Date;
}

export interface AvailabilitySchedule {
  id: number;
  date: Date;
  start_time?: string;
  end_time?: string;
  is_open: boolean;
  notes?: string;
  posted_to_facebook: boolean;
  facebook_post_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface XeroSyncLog {
  id: number;
  sale_id: number;
  xero_invoice_id?: string;
  synced_at: Date;
  status: SyncStatus;
  error_message?: string;
  created_at: Date;
}

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserSession {
  id: number;
  user_id: number;
  token_hash: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: Date;
  created_at: Date;
}

// Request/Response interfaces
export interface CreateProductRequest {
  name: string;
  supplier_cost: number;
  sell_price?: number;
  stock_quantity?: number;
  unit_type: UnitType;
  pricing_type: PricingType;
  price_per_kg?: number;
  profit_margin?: number;
  description?: string;
}

export interface CreateSaleRequest {
  customer_id?: number;
  items: SaleItemRequest[];
  payment_method?: string;
  payment_amount?: number;
  notes?: string;
}

export interface SaleItemRequest {
  product_id: number;
  quantity?: number;
  weight_kg?: number;
  unit_price?: number; // optional override
}

export interface CalculatorRequest {
  operation: 'cost_to_price' | 'weight_price' | 'gst_add' | 'gst_remove' | 'profit';
  cost?: number;
  price?: number;
  margin?: number;
  weight?: number;
  price_per_kg?: number;
  amount?: number;
}

export interface DashboardStats {
  today_sales: number;
  week_sales: number;
  month_sales: number;
  total_owing: number;
  low_stock_count: number;
  pending_xero_sync: number;
}
