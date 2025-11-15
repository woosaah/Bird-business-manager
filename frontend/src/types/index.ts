// Type definitions for The Birds Business Manager Frontend

export type UnitType = 'bag' | 'bottle' | 'kg' | 'each';
export type PricingType = 'per_unit' | 'per_kg';
export type CustomerType = 'retail' | 'wholesale' | 'mates';
export type PaymentStatus = 'paid' | 'partial' | 'owing';

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
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: number;
  customer_id?: number;
  customer_name?: string;
  sale_date: string;
  subtotal: number;
  gst_amount: number;
  total: number;
  payment_status: PaymentStatus;
  invoice_number: string;
  notes?: string;
  created_at: string;
  items?: SaleItem[];
  payments?: Payment[];
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
}

export interface Payment {
  id: number;
  sale_id: number;
  payment_date: string;
  amount: number;
  payment_method?: string;
  notes?: string;
}

export interface DashboardStats {
  today_sales: number;
  week_sales: number;
  month_sales: number;
  total_owing: number;
  low_stock_count: number;
  pending_xero_sync: number;
  recent_sales: Sale[];
}

export interface CreateSaleItem {
  product_id: number;
  quantity?: number;
  weight_kg?: number;
  unit_price?: number;
}

export interface CreateSaleRequest {
  customer_id?: number;
  items: CreateSaleItem[];
  payment_method?: string;
  payment_amount?: number;
  notes?: string;
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
