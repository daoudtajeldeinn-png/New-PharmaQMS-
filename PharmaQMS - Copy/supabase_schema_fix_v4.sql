-- Supabase Schema Fix for Missing Columns (Updated v4)
-- Execute this script in your Supabase SQL Editor to resolve the remaining 400 Bad Request errors.

-- 1. Fix ALL ReconciliationRecords columns
ALTER TABLE "reconciliationRecords"
  ADD COLUMN IF NOT EXISTS "batchId" text,
  ADD COLUMN IF NOT EXISTS "productName" text,
  ADD COLUMN IF NOT EXISTS "theoreticalYield" numeric,
  ADD COLUMN IF NOT EXISTS "actualYield" numeric,
  ADD COLUMN IF NOT EXISTS "status" text,
  ADD COLUMN IF NOT EXISTS "timestamp" text,
  ADD COLUMN IF NOT EXISTS "verifiedBy" text,
  ADD COLUMN IF NOT EXISTS "verifiedAt" text,
  ADD COLUMN IF NOT EXISTS "lossReason" text;

-- 2. Force the API to refresh and see the new columns!
NOTIFY pgrst, 'reload schema';
