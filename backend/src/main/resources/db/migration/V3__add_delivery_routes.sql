-- V3__add_delivery_routes.sql
-- Add delivery_person to customers to support 'Ajay' and 'Rahul' delivery routes

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS delivery_person VARCHAR(50) DEFAULT 'Ajay';

CREATE INDEX IF NOT EXISTS idx_customers_delivery_person ON customers(delivery_person);

