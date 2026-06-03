-- Supabase Schema Fix for Missing Columns (Updated v3)
-- Execute this script in your Supabase SQL Editor to resolve the remaining 400 Bad Request errors.

-- 1. Fix ReconciliationRecords
ALTER TABLE "reconciliationRecords"
  ADD COLUMN IF NOT EXISTS "actualYield" numeric,
  ADD COLUMN IF NOT EXISTS "verifiedBy" text,
  ADD COLUMN IF NOT EXISTS "verifiedAt" text,
  ADD COLUMN IF NOT EXISTS "lossReason" text;

-- 2. Fix RawMaterials
ALTER TABLE "rawMaterials"
  ADD COLUMN IF NOT EXISTS "department" text,
  ADD COLUMN IF NOT EXISTS "productionDate" text,
  ADD COLUMN IF NOT EXISTS "manufacturingDate" text,
  ADD COLUMN IF NOT EXISTS "analysisDate" text,
  ADD COLUMN IF NOT EXISTS "issueDate" text;
