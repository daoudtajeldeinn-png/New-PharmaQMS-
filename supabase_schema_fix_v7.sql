-- Supabase Schema Fix (v7 - chemicalReagents)
-- Resolves the chemicalReagents cloud-sync failure.
--
-- Root cause: every other synced table is created with a camelCase name
-- (e.g. "testResults", "referenceStandards"), but "chemicalReagents" was
-- created as an UNQUOTED identifier, so Postgres folded it to lowercase
-- ("chemicalreagents"). PostgREST table lookups are case-sensitive, so the
-- app's `supabase.from('chemicalReagents')` cannot find it:
--   PGRST205  Could not find the table 'public.chemicalReagents' ...
--             (Perhaps you meant the table 'public.chemicalreagents')
-- and earlier (when only some columns were missing) it surfaced as:
--   PGRST204  Could not find the 'batchNumber' column of 'chemicalReagents'
--
-- This script renames the existing lowercase table to the camelCase name the
-- app expects (preserving its rows), ensures all camelCase columns exist, and
-- backfills them from the legacy lowercase columns so existing data is visible.
--
-- Execute this script once in your Supabase SQL Editor.

-- 1. Rename the legacy lowercase table to the camelCase name the app uses,
--    only if the camelCase table does not already exist (preserves data).
DO $$
BEGIN
  IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'chemicalreagents'
      )
     AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'chemicalReagents'
      )
  THEN
    ALTER TABLE "chemicalreagents" RENAME TO "chemicalReagents";
  END IF;
END $$;

-- 2. Create the table if it didn't exist at all.
CREATE TABLE IF NOT EXISTS "chemicalReagents" (
  "id" text PRIMARY KEY
);

-- 3. Ensure every column the app pushes exists (camelCase the app uses, plus
--    lowercase legacy variants that may already hold data).
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
  ADD COLUMN IF NOT EXISTS "safetyinfo" text,
  ADD COLUMN IF NOT EXISTS "status" text;

-- 4. Backfill camelCase columns from any legacy lowercase data so existing
--    rows remain visible to the app.
UPDATE "chemicalReagents" SET
  "casNumber"         = COALESCE("casNumber", "casnumber"),
  "batchNumber"       = COALESCE("batchNumber", "batchnumber"),
  "storageConditions" = COALESCE("storageConditions", "storageconditions"),
  "expiryDate"        = COALESCE("expiryDate", "expirydate"),
  "dateReceived"      = COALESCE("dateReceived", "datereceived"),
  "safetyInfo"        = COALESCE("safetyInfo", to_jsonb("safetyinfo"));

-- 5. Enable RLS and allow authenticated users (matches other synced tables).
ALTER TABLE "chemicalReagents" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON "chemicalReagents";
CREATE POLICY "Allow all for authenticated" ON "chemicalReagents" FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON "chemicalReagents" TO authenticated;

-- 6. Force PostgREST to refresh and see the new table/columns!
NOTIFY pgrst, 'reload schema';
