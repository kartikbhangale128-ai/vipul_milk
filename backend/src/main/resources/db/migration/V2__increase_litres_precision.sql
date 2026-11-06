-- V2__increase_litres_precision.sql
-- Increase decimal precision for milk litres to support 3 decimal places (e.g. 1.375, 0.625)

-- 1. Alter milk_entries morning_litres and evening_litres to NUMERIC(10, 3)
ALTER TABLE milk_entries 
    ALTER COLUMN morning_litres TYPE NUMERIC(10, 3),
    ALTER COLUMN evening_litres TYPE NUMERIC(10, 3);

-- 2. Alter monthly_bills litres columns to NUMERIC(10, 3)
ALTER TABLE monthly_bills 
    ALTER COLUMN milk_morning_litres TYPE NUMERIC(10, 3),
    ALTER COLUMN milk_evening_litres TYPE NUMERIC(10, 3),
    ALTER COLUMN milk_total_litres TYPE NUMERIC(10, 3);

-- 3. Alter product_entries quantity to NUMERIC(10, 3) for fractional weights/quantities (e.g. 0.375 kg)
ALTER TABLE product_entries 
    ALTER COLUMN quantity TYPE NUMERIC(10, 3);

