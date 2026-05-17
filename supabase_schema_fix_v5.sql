-- Supabase Schema Fix for Missing Columns in Other User's Machine (v5)
-- Execute this script in your Supabase SQL Editor to resolve the testResults and coaRecords 400 Bad Request errors.

-- 1. Fix testResults
ALTER TABLE "testResults"
  ADD COLUMN IF NOT EXISTS "analystId" text,
  ADD COLUMN IF NOT EXISTS "sampleId" text,
  ADD COLUMN IF NOT EXISTS "productId" text,
  ADD COLUMN IF NOT EXISTS "testMethodId" text,
  ADD COLUMN IF NOT EXISTS "parameters" jsonb,
  ADD COLUMN IF NOT EXISTS "overallResult" text;

-- 2. Fix coaRecords (Adding the camelCase properties that the other user's Dexie DB is trying to push)
ALTER TABLE "coaRecords"
  ADD COLUMN IF NOT EXISTS "brandName" text,
  ADD COLUMN IF NOT EXISTS "genericName" text,
  ADD COLUMN IF NOT EXISTS "manufacturingDate" text,
  ADD COLUMN IF NOT EXISTS "analysisDate" text,
  ADD COLUMN IF NOT EXISTS "issueDate" text,
  ADD COLUMN IF NOT EXISTS "coaNumber" text,
  ADD COLUMN IF NOT EXISTS "analysisNo" text,
  ADD COLUMN IF NOT EXISTS "productName" text,
  ADD COLUMN IF NOT EXISTS "dosageForm" text,
  ADD COLUMN IF NOT EXISTS "batchNumber" text,
  ADD COLUMN IF NOT EXISTS "batchSize" text,
  ADD COLUMN IF NOT EXISTS "mfgDate" text,
  ADD COLUMN IF NOT EXISTS "expiryDate" text,
  ADD COLUMN IF NOT EXISTS "receivingDate" text,
  ADD COLUMN IF NOT EXISTS "testResults" jsonb,
  ADD COLUMN IF NOT EXISTS "marketComplaintStatus" text,
  ADD COLUMN IF NOT EXISTS "analyzedBy" text,
  ADD COLUMN IF NOT EXISTS "checkedBy" text,
  ADD COLUMN IF NOT EXISTS "approvedBy" text;

-- 3. Force the API to refresh and see the new columns!
NOTIFY pgrst, 'reload schema';
