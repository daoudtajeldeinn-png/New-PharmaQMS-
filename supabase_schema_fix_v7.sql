-- Supabase Schema Fix (v7 - chemicalReagents)
-- Resolves: PGRST204 "Could not find the 'batchNumber' column of 'chemicalReagents'
-- in the schema cache" (400 Bad Request when CloudSyncService upserts chemicalReagents).
--
-- The cloud "chemicalReagents" table was missing columns that the app's
-- ChemicalReagent record pushes (id, name, casNumber, grade, manufacturer,
-- supplier, batchNumber, quantity, unit, storageConditions, expiryDate,
-- dateReceived, location, safetyInfo, status).
--
-- Execute this script in your Supabase SQL Editor.

-- 1. Make sure the table exists (no-op if it already does)
CREATE TABLE IF NOT EXISTS "chemicalReagents" (
  "id" text PRIMARY KEY
);

-- 2. Add every column the app may push (camelCase + lowercase variants for safety)
ALTER TABLE "chemicalReagents"
  ADD COLUMN IF NOT EXISTS "name" text,
  ADD COLUMN IF NOT EXISTS "casNumber" text,
  ADD COLUMN IF NOT EXISTS "casnumber" text,
  ADD COLUMN IF NOT EXISTS "grade" text,
  ADD COLUMN IF NOT EXISTS "manufacturer" text,
  ADD COLUMN IF NOT EXISTS "supplier" text,
  ADD COLUMN IF NOT EXISTS "batchNumber" text,
  ADD COLUMN IF NOT EXISTS "batchnumber" text,
  ADD COLUMN IF NOT EXISTS "quantity" numeric,
  ADD COLUMN IF NOT EXISTS "unit" text,
  ADD COLUMN IF NOT EXISTS "storageConditions" text,
  ADD COLUMN IF NOT EXISTS "storageconditions" text,
  ADD COLUMN IF NOT EXISTS "expiryDate" text,
  ADD COLUMN IF NOT EXISTS "expirydate" text,
  ADD COLUMN IF NOT EXISTS "dateReceived" text,
  ADD COLUMN IF NOT EXISTS "datereceived" text,
  ADD COLUMN IF NOT EXISTS "location" text,
  ADD COLUMN IF NOT EXISTS "safetyInfo" jsonb,
  ADD COLUMN IF NOT EXISTS "safetyinfo" jsonb,
  ADD COLUMN IF NOT EXISTS "status" text;

-- 3. Enable RLS and allow authenticated users (matches other synced tables)
ALTER TABLE "chemicalReagents" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON "chemicalReagents";
CREATE POLICY "Allow all for authenticated" ON "chemicalReagents" FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON "chemicalReagents" TO authenticated;

-- 4. Force PostgREST to refresh and see the new columns!
NOTIFY pgrst, 'reload schema';
