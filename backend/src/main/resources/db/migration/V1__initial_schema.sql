-- V1__initial_schema.sql
-- VIPUL MILK - DAIRY MANAGEMENT & BILLING SYSTEM SCHEMA

-- 1. Owner table (Single owner application)
CREATE TABLE IF NOT EXISTS owner (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. App Settings table (Business profile & contact)
CREATE TABLE IF NOT EXISTS app_settings (
    id BIGSERIAL PRIMARY KEY,
    business_name VARCHAR(150) NOT NULL DEFAULT 'VIPUL MILK',
    tagline VARCHAR(255) DEFAULT 'Fresh & Pure Farm Milk Dairy',
    owner_name VARCHAR(150) DEFAULT 'Vipul Milk Dairy',
    contact_phone VARCHAR(50) DEFAULT '+91 9876543210',
    address TEXT DEFAULT 'Main Dairy Center, Market Road',
    gst_or_license VARCHAR(100),
    bank_details TEXT,
    upi_id VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Customers table
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    customer_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_customers_active ON customers(is_active);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_phone ON customers(phone);

-- 4. Milk Rates table (Historical versioning)
CREATE TABLE IF NOT EXISTS milk_rates (
    id BIGSERIAL PRIMARY KEY,
    rate_per_litre NUMERIC(10, 2) NOT NULL CHECK (rate_per_litre > 0),
    effective_from DATE NOT NULL UNIQUE,
    note VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_milk_rates_effective_from ON milk_rates(effective_from);

-- 5. Products table
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    unit VARCHAR(30) NOT NULL, -- kg, litre, piece, gram
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. Product Prices table (Historical versioning)
CREATE TABLE IF NOT EXISTS product_prices (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    effective_from DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_product_effective_from UNIQUE (product_id, effective_from)
);

CREATE INDEX idx_product_prices_product_date ON product_prices(product_id, effective_from);

-- 7. Milk Entries table (Daily consumption: Morning & Evening)
CREATE TABLE IF NOT EXISTS milk_entries (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    entry_date DATE NOT NULL,
    morning_litres NUMERIC(8, 2) NOT NULL DEFAULT 0.0 CHECK (morning_litres >= 0),
    evening_litres NUMERIC(8, 2) NOT NULL DEFAULT 0.0 CHECK (evening_litres >= 0),
    milk_rate NUMERIC(10, 2) NOT NULL CHECK (milk_rate > 0),
    morning_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.0 CHECK (morning_amount >= 0),
    evening_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.0 CHECK (evening_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_customer_entry_date UNIQUE (customer_id, entry_date)
);

CREATE INDEX idx_milk_entries_customer_date ON milk_entries(customer_id, entry_date);
CREATE INDEX idx_milk_entries_date ON milk_entries(entry_date);

-- 8. Product Entries table (Purchases)
CREATE TABLE IF NOT EXISTS product_entries (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    purchase_date DATE NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    notes VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_product_entries_customer_date ON product_entries(customer_id, purchase_date);
CREATE INDEX idx_product_entries_date ON product_entries(purchase_date);

-- 9. Monthly Bills table
CREATE TABLE IF NOT EXISTS monthly_bills (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    billing_month INT NOT NULL CHECK (billing_month BETWEEN 1 AND 12),
    billing_year INT NOT NULL CHECK (billing_year >= 2000),
    milk_morning_litres NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    milk_evening_litres NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    milk_total_litres NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    morning_total NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    evening_total NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    milk_total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    product_total NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    grand_total NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    bill_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, FINALIZED
    customer_snapshot JSONB,
    bill_snapshot JSONB,
    pdf_path VARCHAR(500),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    finalized_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_customer_monthly_bill UNIQUE (customer_id, billing_month, billing_year)
);

CREATE INDEX idx_monthly_bills_period ON monthly_bills(billing_year, billing_month);
CREATE INDEX idx_monthly_bills_customer ON monthly_bills(customer_id);

-- Initial default settings row
INSERT INTO app_settings (id, business_name, tagline, owner_name, contact_phone, address, upi_id)
VALUES (1, 'VIPUL MILK', 'Fresh & Pure Farm Milk Dairy', 'Vipul Patel', '+91 9876543210', 'Main Dairy Center, Anand, Gujarat', 'vipulmilk@upi')
ON CONFLICT (id) DO NOTHING;

