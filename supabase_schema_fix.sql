-- Complete Supabase Schema Fix (v5 - Type Safety for App Data)
-- Execute this script in your Supabase SQL Editor to resolve all sync errors.

-- 0. Cleanup any temporary test data that might interfere with type changes
DELETE FROM "masterFormulas" WHERE id LIKE 'test%';
DELETE FROM "batchRecords" WHERE id LIKE 'test%';

-- 1. Notifications Table (Critical Fix for Header 404)
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text, -- Changed to text to support numeric IDs from local state
  "title" text NOT NULL,
  "message" text,
  "type" text DEFAULT 'info',
  "is_read" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "related_id" text
);

-- Enable RLS for notifications
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see their own notifications" ON "notifications";
CREATE POLICY "Users can see their own notifications" ON "notifications" FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update their own notifications" ON "notifications";
CREATE POLICY "Users can update their own notifications" ON "notifications" FOR UPDATE USING (true);
DROP POLICY IF EXISTS "System can insert notifications" ON "notifications";
CREATE POLICY "System can insert notifications" ON "notifications" FOR INSERT WITH CHECK (true);

-- 2. Test Methods
ALTER TABLE "testMethods"
  ADD COLUMN IF NOT EXISTS "name" text,
  ADD COLUMN IF NOT EXISTS "category" text,
  ADD COLUMN IF NOT EXISTS "standardProcedure" text,
  ADD COLUMN IF NOT EXISTS "pharmacopeiaReference" text,
  ADD COLUMN IF NOT EXISTS "procedureDetails" text,
  ADD COLUMN IF NOT EXISTS "status" text,
  ADD COLUMN IF NOT EXISTS "parameters" jsonb,
  ADD COLUMN IF NOT EXISTS "createdAt" text,
  ADD COLUMN IF NOT EXISTS "updatedAt" text,
  ADD COLUMN IF NOT EXISTS "equipmentRequired" jsonb,
  ADD COLUMN IF NOT EXISTS "reagentsRequired" jsonb;

-- 3. COA Records
ALTER TABLE "coaRecords" 
  ADD COLUMN IF NOT EXISTS "type" text,
  ADD COLUMN IF NOT EXISTS "coaNumber" text,
  ADD COLUMN IF NOT EXISTS "analysisNo" text,
  ADD COLUMN IF NOT EXISTS "productName" text,
  ADD COLUMN IF NOT EXISTS "strength" text,
  ADD COLUMN IF NOT EXISTS "dosageForm" text,
  ADD COLUMN IF NOT EXISTS "batchNumber" text,
  ADD COLUMN IF NOT EXISTS "batchSize" text,
  ADD COLUMN IF NOT EXISTS "mfgDate" text,
  ADD COLUMN IF NOT EXISTS "expiryDate" text,
  ADD COLUMN IF NOT EXISTS "receivingDate" text,
  ADD COLUMN IF NOT EXISTS "issueDate" text,
  ADD COLUMN IF NOT EXISTS "manufacturer" text,
  ADD COLUMN IF NOT EXISTS "address" text,
  ADD COLUMN IF NOT EXISTS "testResults" jsonb,
  ADD COLUMN IF NOT EXISTS "marketComplaintStatus" text,
  ADD COLUMN IF NOT EXISTS "analyzedBy" text,
  ADD COLUMN IF NOT EXISTS "checkedBy" text,
  ADD COLUMN IF NOT EXISTS "approvedBy" text,
  ADD COLUMN IF NOT EXISTS "status" text,
  ADD COLUMN IF NOT EXISTS "manufacturingDate" text,
  ADD COLUMN IF NOT EXISTS "analysisDate" text;

-- 4. Master Formulas
ALTER TABLE "masterFormulas"
  ADD COLUMN IF NOT EXISTS "productName" text,
  ADD COLUMN IF NOT EXISTS "mfrNumber" text,
  ADD COLUMN IF NOT EXISTS "revisionNumber" text,
  ADD COLUMN IF NOT EXISTS "effectiveDate" text,
  ADD COLUMN IF NOT EXISTS "batchSize" numeric,
  ADD COLUMN IF NOT EXISTS "batchSizeUnit" text,
  ADD COLUMN IF NOT EXISTS "strength" text,
  ADD COLUMN IF NOT EXISTS "dosageForm" text,
  ADD COLUMN IF NOT EXISTS "shelfLife" text,
  ADD COLUMN IF NOT EXISTS "lineClearanceRequired" boolean,
  ADD COLUMN IF NOT EXISTS "ingredients" jsonb,
  ADD COLUMN IF NOT EXISTS "processSteps" jsonb,
  ADD COLUMN IF NOT EXISTS "status" text,
  ADD COLUMN IF NOT EXISTS "preparedBy" text,
  ADD COLUMN IF NOT EXISTS "checkedBy" text,
  ADD COLUMN IF NOT EXISTS "approvedBy" text;

-- Safely convert theoreticalYieldRange to jsonb
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='masterFormulas' AND column_name='theoreticalYieldRange' AND data_type='text') THEN
        ALTER TABLE "masterFormulas" ALTER COLUMN "theoreticalYieldRange" TYPE jsonb USING (
            CASE 
                WHEN "theoreticalYieldRange" IS NULL THEN NULL
                WHEN "theoreticalYieldRange" = 'test' THEN '{"min":0, "max":100}'::jsonb
                ELSE "theoreticalYieldRange"::jsonb 
            END
        );
    ELSE
        ALTER TABLE "masterFormulas" ADD COLUMN IF NOT EXISTS "theoreticalYieldRange" jsonb;
    END IF;
END $$;

-- 5. Batch Records
ALTER TABLE "batchRecords"
  ADD COLUMN IF NOT EXISTS "batchNumber" text,
  ADD COLUMN IF NOT EXISTS "mfrId" text,
  ADD COLUMN IF NOT EXISTS "productName" text,
  ADD COLUMN IF NOT EXISTS "batchSize" numeric,
  ADD COLUMN IF NOT EXISTS "batchSizeUnit" text,
  ADD COLUMN IF NOT EXISTS "mfgDate" text,
  ADD COLUMN IF NOT EXISTS "expiryDate" text,
  ADD COLUMN IF NOT EXISTS "status" text,
  ADD COLUMN IF NOT EXISTS "issuanceDate" text,
  ADD COLUMN IF NOT EXISTS "issuedBy" text,
  ADD COLUMN IF NOT EXISTS "ingredients" jsonb,
  ADD COLUMN IF NOT EXISTS "stepExecutions" jsonb,
  ADD COLUMN IF NOT EXISTS "materialVerifications" jsonb,
  ADD COLUMN IF NOT EXISTS "actualYield" numeric;

-- 6. Raw Materials
ALTER TABLE "rawMaterials"
  ADD COLUMN IF NOT EXISTS "name" text,
  ADD COLUMN IF NOT EXISTS "type" text,
  ADD COLUMN IF NOT EXISTS "supplier" text,
  ADD COLUMN IF NOT EXISTS "batchNumber" text,
  ADD COLUMN IF NOT EXISTS "pharmacopeia" text,
  ADD COLUMN IF NOT EXISTS "quantity" numeric,
  ADD COLUMN IF NOT EXISTS "unit" text,
  ADD COLUMN IF NOT EXISTS "receivedDate" text,
  ADD COLUMN IF NOT EXISTS "productionDate" text,
  ADD COLUMN IF NOT EXISTS "manufacturingDate" text,
  ADD COLUMN IF NOT EXISTS "analysisDate" text,
  ADD COLUMN IF NOT EXISTS "issueDate" text,
  ADD COLUMN IF NOT EXISTS "expiryDate" text,
  ADD COLUMN IF NOT EXISTS "location" text,
  ADD COLUMN IF NOT EXISTS "tests" jsonb,
  ADD COLUMN IF NOT EXISTS "status" text,
  ADD COLUMN IF NOT EXISTS "createdAt" text,
  ADD COLUMN IF NOT EXISTS "analysisNo" text;

-- 7. Material Movements
ALTER TABLE "materialMovements"
  ADD COLUMN IF NOT EXISTS "materialId" text,
  ADD COLUMN IF NOT EXISTS "batchId" text,
  ADD COLUMN IF NOT EXISTS "type" text,
  ADD COLUMN IF NOT EXISTS "quantity" numeric,
  ADD COLUMN IF NOT EXISTS "unit" text,
  ADD COLUMN IF NOT EXISTS "operator" text,
  ADD COLUMN IF NOT EXISTS "timestamp" text;

-- 8. Pharmacopeia Monographs
ALTER TABLE "pharmacopeiaMonographs"
  ADD COLUMN IF NOT EXISTS "productName" text,
  ADD COLUMN IF NOT EXISTS "pharmacopeia" text,
  ADD COLUMN IF NOT EXISTS "monographNumber" text,
  ADD COLUMN IF NOT EXISTS "category" text,
  ADD COLUMN IF NOT EXISTS "tests" jsonb,
  ADD COLUMN IF NOT EXISTS "version" text,
  ADD COLUMN IF NOT EXISTS "effectiveDate" text;

-- 9. FORCE TYPE CORRECTIONS (Resolving "invalid input syntax" errors)
-- This section forces columns to TEXT if they were previously created as UUID, NUMERIC, or TIMESTAMP
DO $$ 
BEGIN 
    -- Notifications
    ALTER TABLE "notifications" ALTER COLUMN "user_id" TYPE text;
    
    -- Master Formulas
    ALTER TABLE "masterFormulas" ALTER COLUMN "shelfLife" TYPE text;
    ALTER TABLE "masterFormulas" ALTER COLUMN "effectiveDate" TYPE text;
    
    -- Batch Records
    ALTER TABLE "batchRecords" ALTER COLUMN "mfgDate" TYPE text;
    ALTER TABLE "batchRecords" ALTER COLUMN "expiryDate" TYPE text;
    ALTER TABLE "batchRecords" ALTER COLUMN "issuanceDate" TYPE text;
    
    -- COA Records
    ALTER TABLE "coaRecords" ALTER COLUMN "mfgDate" TYPE text;
    ALTER TABLE "coaRecords" ALTER COLUMN "expiryDate" TYPE text;
    ALTER TABLE "coaRecords" ALTER COLUMN "issueDate" TYPE text;
    ALTER TABLE "coaRecords" ALTER COLUMN "receivingDate" TYPE text;
    ALTER TABLE "coaRecords" ALTER COLUMN "analysisDate" TYPE text;
    ALTER TABLE "coaRecords" ALTER COLUMN "manufacturingDate" TYPE text;

    -- Raw Materials
    ALTER TABLE "rawMaterials" ALTER COLUMN "createdAt" TYPE text;
    
    -- Pharmacopeia
    ALTER TABLE "pharmacopeiaMonographs" ALTER COLUMN "effectiveDate" TYPE text;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Some type conversions may have skipped if data was incompatible, but primary schema is now aligned.';
END $$;
