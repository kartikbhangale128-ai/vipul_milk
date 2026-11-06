-- V4__add_customer_sort_order.sql
-- Add sort_order column to customers to support drag-and-drop order per delivery person / shift

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_customers_sort_order ON customers(delivery_person, sort_order);

