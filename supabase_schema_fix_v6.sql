-- Supabase Schema Fix (v6 - Comprehensive Sync)
-- This script adds every possible case variation (camelCase and lowercase) that older local databases might send.

-- 1. Fix testResults
ALTER TABLE "testResults"
  ADD COLUMN IF NOT EXISTS "analystId" text,
  ADD COLUMN IF NOT EXISTS "analystid" text,
  ADD COLUMN IF NOT EXISTS "sampleId" text,
  ADD COLUMN IF NOT EXISTS "sampleid" text,
  ADD COLUMN IF NOT EXISTS "productId" text,
  ADD COLUMN IF NOT EXISTS "productid" text,
  ADD COLUMN IF NOT EXISTS "testMethodId" text,
  ADD COLUMN IF NOT EXISTS "testmethodid" text,
  ADD COLUMN IF NOT EXISTS "parameters" jsonb,
  ADD COLUMN IF NOT EXISTS "overallResult" text,
  ADD COLUMN IF NOT EXISTS "overallresult" text,
  ADD COLUMN IF NOT EXISTS "completionDate" text,
  ADD COLUMN IF NOT EXISTS "completiondate" text,
  ADD COLUMN IF NOT EXISTS "oosInvestigation" jsonb,
  ADD COLUMN IF NOT EXISTS "oosinvestigation" jsonb,
  ADD COLUMN IF NOT EXISTS "reviewedBy" text,
  ADD COLUMN IF NOT EXISTS "reviewedby" text,
  ADD COLUMN IF NOT EXISTS "reviewDate" text,
  ADD COLUMN IF NOT EXISTS "reviewdate" text,
  ADD COLUMN IF NOT EXISTS "approvedBy" text,
  ADD COLUMN IF NOT EXISTS "approvedby" text,
  ADD COLUMN IF NOT EXISTS "approvalDate" text,
  ADD COLUMN IF NOT EXISTS "approvaldate" text,
  ADD COLUMN IF NOT EXISTS "attachments" jsonb;

-- 2. Fix coaRecords (Adding both lowercase and camelCase)
ALTER TABLE "coaRecords"
  ADD COLUMN IF NOT EXISTS "brandName" text,
  ADD COLUMN IF NOT EXISTS "brandname" text,
  ADD COLUMN IF NOT EXISTS "genericName" text,
  ADD COLUMN IF NOT EXISTS "genericname" text,
  ADD COLUMN IF NOT EXISTS "manufacturingDate" text,
  ADD COLUMN IF NOT EXISTS "manufacturingdate" text,
  ADD COLUMN IF NOT EXISTS "analysisDate" text,
  ADD COLUMN IF NOT EXISTS "analysisdate" text,
  ADD COLUMN IF NOT EXISTS "issueDate" text,
  ADD COLUMN IF NOT EXISTS "issuedate" text,
  ADD COLUMN IF NOT EXISTS "coaNumber" text,
  ADD COLUMN IF NOT EXISTS "coanumber" text,
  ADD COLUMN IF NOT EXISTS "analysisNo" text,
  ADD COLUMN IF NOT EXISTS "analysisno" text,
  ADD COLUMN IF NOT EXISTS "productName" text,
  ADD COLUMN IF NOT EXISTS "productname" text,
  ADD COLUMN IF NOT EXISTS "dosageForm" text,
  ADD COLUMN IF NOT EXISTS "dosageform" text,
  ADD COLUMN IF NOT EXISTS "batchNumber" text,
  ADD COLUMN IF NOT EXISTS "batchnumber" text,
  ADD COLUMN IF NOT EXISTS "batchSize" text,
  ADD COLUMN IF NOT EXISTS "batchsize" text,
  ADD COLUMN IF NOT EXISTS "mfgDate" text,
  ADD COLUMN IF NOT EXISTS "mfgdate" text,
  ADD COLUMN IF NOT EXISTS "expiryDate" text,
  ADD COLUMN IF NOT EXISTS "expirydate" text,
  ADD COLUMN IF NOT EXISTS "receivingDate" text,
  ADD COLUMN IF NOT EXISTS "receivingdate" text,
  ADD COLUMN IF NOT EXISTS "testResults" jsonb,
  ADD COLUMN IF NOT EXISTS "testresults" jsonb,
  ADD COLUMN IF NOT EXISTS "marketComplaintStatus" text,
  ADD COLUMN IF NOT EXISTS "marketcomplaintstatus" text,
  ADD COLUMN IF NOT EXISTS "analyzedBy" text,
  ADD COLUMN IF NOT EXISTS "analyzedby" text,
  ADD COLUMN IF NOT EXISTS "checkedBy" text,
  ADD COLUMN IF NOT EXISTS "checkedby" text,
  ADD COLUMN IF NOT EXISTS "approvedBy" text,
  ADD COLUMN IF NOT EXISTS "approvedby" text,
  ADD COLUMN IF NOT EXISTS "quantity" text;

-- 3. Fix reconciliationRecords
ALTER TABLE "reconciliationRecords"
  ADD COLUMN IF NOT EXISTS "batchId" text,
  ADD COLUMN IF NOT EXISTS "batchid" text,
  ADD COLUMN IF NOT EXISTS "productName" text,
  ADD COLUMN IF NOT EXISTS "productname" text,
  ADD COLUMN IF NOT EXISTS "theoreticalYield" numeric,
  ADD COLUMN IF NOT EXISTS "theoreticalyield" numeric,
  ADD COLUMN IF NOT EXISTS "actualYield" numeric,
  ADD COLUMN IF NOT EXISTS "actualyield" numeric,
  ADD COLUMN IF NOT EXISTS "verifiedBy" text,
  ADD COLUMN IF NOT EXISTS "verifiedby" text,
  ADD COLUMN IF NOT EXISTS "verifiedAt" text,
  ADD COLUMN IF NOT EXISTS "verifiedat" text,
  ADD COLUMN IF NOT EXISTS "lossReason" text,
  ADD COLUMN IF NOT EXISTS "lossreason" text;

-- 4. Create deletedRecords table for centralized tombstones
CREATE TABLE IF NOT EXISTS "deletedRecords" (
  "id" text PRIMARY KEY, -- table_name + '__' + record_id
  "record_id" text NOT NULL,
  "table_name" text NOT NULL,
  "deleted_at" text NOT NULL,
  "deleted_by" text NOT NULL,
  "reason" text,
  "snapshot" text,
  "recovered" boolean DEFAULT false,
  "recovered_by" text,
  "recovered_at" text
);

-- Enable RLS and add policy to allow all actions for authenticated users
ALTER TABLE "deletedRecords" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON "deletedRecords";
CREATE POLICY "Allow all for authenticated" ON "deletedRecords" FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON "deletedRecords" TO authenticated;

-- 5. Force the API to refresh and see the new columns!
NOTIFY pgrst, 'reload schema';
