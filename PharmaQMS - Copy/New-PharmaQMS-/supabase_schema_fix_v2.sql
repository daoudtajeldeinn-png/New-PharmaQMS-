-- Supabase Schema Fix for Missing Columns (Updated v2)
-- Execute this script in your Supabase SQL Editor to resolve the remaining 400 Bad Request errors.

-- 1. Fix MasterFormulas
ALTER TABLE "masterFormulas" 
  ALTER COLUMN "shelfLife" TYPE text,
  ADD COLUMN IF NOT EXISTS "checkedBy" text,
  ADD COLUMN IF NOT EXISTS "approvedBy" text;

-- If theoreticalYieldRange was added as text, convert it to jsonb
ALTER TABLE "masterFormulas" 
  ALTER COLUMN "theoreticalYieldRange" TYPE jsonb USING "theoreticalYieldRange"::jsonb;

-- 2. Fix BatchRecords
ALTER TABLE "batchRecords"
  ADD COLUMN IF NOT EXISTS "materialVerifications" jsonb,
  ADD COLUMN IF NOT EXISTS "actualYield" numeric;

-- 3. Verify other new tables have essential columns (Double Check)
ALTER TABLE "rawMaterials"
  ADD COLUMN IF NOT EXISTS "analysisNo" text;
