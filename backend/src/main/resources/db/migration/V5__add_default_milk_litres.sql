-- V5__add_default_milk_litres.sql
-- Add default_morning_litres and default_evening_litres to customers

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS default_morning_litres NUMERIC(8, 3) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS default_evening_litres NUMERIC(8, 3) DEFAULT 0.0;

