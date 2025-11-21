-- The Birds Business Manager Database Schema

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS xero_sync_log CASCADE;
DROP TABLE IF EXISTS availability_schedule CASCADE;
DROP TABLE IF EXISTS supplier_invoices CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TYPE IF EXISTS unit_type_enum CASCADE;
DROP TYPE IF EXISTS pricing_type_enum CASCADE;
DROP TYPE IF EXISTS customer_type_enum CASCADE;
DROP TYPE IF EXISTS payment_status_enum CASCADE;
DROP TYPE IF EXISTS sync_status_enum CASCADE;
DROP TYPE IF EXISTS user_role_enum CASCADE;

-- Create ENUM types
CREATE TYPE unit_type_enum AS ENUM ('bag', 'bottle', 'kg', 'each');
CREATE TYPE pricing_type_enum AS ENUM ('per_unit', 'per_kg');
CREATE TYPE customer_type_enum AS ENUM ('retail', 'wholesale', 'mates');
CREATE TYPE payment_status_enum AS ENUM ('paid', 'partial', 'owing');
CREATE TYPE sync_status_enum AS ENUM ('pending', 'success', 'failed');
CREATE TYPE user_role_enum AS ENUM ('admin', 'manager', 'staff');

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'staff',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table (for JWT token management)
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    supplier_cost DECIMAL(10, 2) NOT NULL, -- inc GST
    sell_price DECIMAL(10, 2) NOT NULL,
    stock_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0, -- can be units or kg
    unit_type unit_type_enum NOT NULL DEFAULT 'each',
    pricing_type pricing_type_enum NOT NULL DEFAULT 'per_unit',
    price_per_kg DECIMAL(10, 2), -- nullable, only for per_kg pricing
    profit_margin DECIMAL(5, 2) DEFAULT 33.7, -- percentage
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    customer_type customer_type_enum NOT NULL DEFAULT 'retail',
    discount_amount DECIMAL(10, 2), -- nullable, fixed discount per item
    credit_limit DECIMAL(10, 2) DEFAULT 0,
    balance_owing DECIMAL(10, 2) DEFAULT 0,
    xero_contact_id VARCHAR(255), -- for Xero sync
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales table
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10, 2) NOT NULL, -- ex GST
    gst_amount DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL, -- inc GST
    payment_status payment_status_enum DEFAULT 'owing',
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sale items table
CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL, -- store name in case product deleted
    quantity DECIMAL(10, 2), -- for units, nullable
    weight_kg DECIMAL(10, 3), -- for kg-based sales, nullable
    unit_price DECIMAL(10, 2) NOT NULL, -- price per unit or per kg
    line_total DECIMAL(10, 2) NOT NULL, -- inc GST
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50), -- cash, eftpos, bank transfer, etc.
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supplier invoices table
CREATE TABLE supplier_invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    supplier VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    items_json JSONB, -- store invoice items as JSON
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Availability schedule table
CREATE TABLE availability_schedule (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_open BOOLEAN DEFAULT TRUE,
    notes TEXT,
    posted_to_facebook BOOLEAN DEFAULT FALSE,
    facebook_post_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Xero sync log table
CREATE TABLE xero_sync_log (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    xero_invoice_id VARCHAR(255),
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status sync_status_enum DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_pricing_type ON products(pricing_type);
CREATE INDEX idx_customers_type ON customers(customer_type);
CREATE INDEX idx_customers_active ON customers(is_active);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_status ON sales(payment_status);
CREATE INDEX idx_sales_invoice ON sales(invoice_number);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);
CREATE INDEX idx_payments_sale ON payments(sale_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_availability_date ON availability_schedule(date);
CREATE INDEX idx_xero_sync_sale ON xero_sync_log(sale_id);
CREATE INDEX idx_xero_sync_status ON xero_sync_log(status);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_updated_at BEFORE UPDATE ON availability_schedule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default products for testing
INSERT INTO products (name, supplier_cost, sell_price, stock_quantity, unit_type, pricing_type, profit_margin) VALUES
('Wild Bird Seed Mix 20kg', 45.00, 60.00, 50, 'bag', 'per_unit', 33.7),
('Canary Seed 20kg', 50.00, 67.00, 30, 'bag', 'per_unit', 33.7),
('Breeding Aid 1L', 25.00, 33.50, 20, 'bottle', 'per_unit', 33.7);

INSERT INTO products (name, supplier_cost, sell_price, stock_quantity, unit_type, pricing_type, price_per_kg, profit_margin) VALUES
('Cuttlefish', 30.00, 40.00, 25, 'kg', 'per_kg', 40.00, 33.7);

-- Insert a test customer
INSERT INTO customers (name, email, phone, customer_type, credit_limit) VALUES
('Walk-in Customer', NULL, NULL, 'retail', 0),
('John Smith', 'john@example.com', '021-123-4567', 'retail', 500),
('Bob the Breeder', 'bob@birds.com', '021-987-6543', 'mates', 1000);

-- Update balance owing for mate's customer
UPDATE customers SET discount_amount = 5.00 WHERE customer_type = 'mates';

-- Insert default admin user
-- Username: admin, Password: admin123 (CHANGE THIS IN PRODUCTION!)
-- Password hash is bcrypt of 'admin123' with salt rounds 10
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@birdsmanager.local', '$2b$10$rBV2IQ/p4YJdJVsS9z7HuOGEKXkH8JYzJYJ8YN3LZ3YZ5LQZJYJ8Y', 'System Administrator', 'admin');

-- Insert test staff user
-- Username: staff, Password: staff123 (CHANGE THIS IN PRODUCTION!)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('staff', 'staff@birdsmanager.local', '$2b$10$rBV2IQ/p4YJdJVsS9z7HuOGEKXkH8JYzJYJ8YN3LZ3YZ5LQZJYJ8Y', 'Staff User', 'staff');
