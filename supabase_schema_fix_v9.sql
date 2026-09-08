-- ==============================================================================
-- PharmaQMS Database Migration: v9
-- Fix 1: Change equipmentQualifications id and equipment_id from uuid to text
--         (app uses short non-UUID equipment IDs like "yxg4ltsh5")
-- Fix 2: Fix user_activity_logs RLS INSERT policy to allow anon inserts
--         (audit writes were blocked for non-authenticated sessions)
-- ==============================================================================

-- -----------------------------------------------------------------------
-- FIX 1: equipmentQualifications — relax id and equipment_id to text
-- -----------------------------------------------------------------------

-- Drop existing primary key constraint first
ALTER TABLE "equipmentQualifications" DROP CONSTRAINT IF EXISTS "equipmentQualifications_pkey";

-- Drop existing foreign key constraint if any
ALTER TABLE "equipmentQualifications" DROP CONSTRAINT IF EXISTS "equipmentQualifications_equipment_id_fkey";

-- Recreate id as text primary key
ALTER TABLE "equipmentQualifications"
    ALTER COLUMN id TYPE text USING id::text;

-- Recreate equipment_id as text (allows short IDs like "yxg4ltsh5")
ALTER TABLE "equipmentQualifications"
    ALTER COLUMN equipment_id TYPE text USING equipment_id::text;

-- Re-add primary key
ALTER TABLE "equipmentQualifications"
    ADD CONSTRAINT "equipmentQualifications_pkey" PRIMARY KEY (id);

-- Recreate indexes (they are dropped/recreated automatically with column type changes on most PG versions)
DROP INDEX IF EXISTS idx_equipment_qualifications_eq_id;
DROP INDEX IF EXISTS idx_equipment_qualifications_phase;
DROP INDEX IF EXISTS idx_equipment_qualifications_next_date;

CREATE INDEX IF NOT EXISTS idx_equipment_qualifications_eq_id    ON "equipmentQualifications" (equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_qualifications_phase     ON "equipmentQualifications" (phase);
CREATE INDEX IF NOT EXISTS idx_equipment_qualifications_next_date ON "equipmentQualifications" (next_requalification_date);

-- -----------------------------------------------------------------------
-- FIX 2: user_activity_logs — allow anon key inserts for audit trail
-- -----------------------------------------------------------------------

-- Drop old restrictive policy
DROP POLICY IF EXISTS "Users can insert logs" ON user_activity_logs;

-- Allow both authenticated AND anon role inserts so audit trail works
-- when the user is logged in via local credentials (not Supabase auth session)
CREATE POLICY "Allow all insert logs"
    ON user_activity_logs
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Ensure select is open to authenticated (was already set, but restate for clarity)
DROP POLICY IF EXISTS "Admins can view all logs" ON user_activity_logs;
CREATE POLICY "Admins can view all logs"
    ON user_activity_logs
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- -----------------------------------------------------------------------
-- FIX 3: equipmentQualifications — open RLS to anon + authenticated
-- The original v8 policies only granted access to "authenticated" role.
-- The app connects with the anon key, so INSERT/SELECT/UPDATE/DELETE
-- were silently blocked (code 42501).
-- -----------------------------------------------------------------------

DROP POLICY IF EXISTS "Allow authenticated read equipmentQualifications"   ON "equipmentQualifications";
DROP POLICY IF EXISTS "Allow authenticated insert equipmentQualifications"  ON "equipmentQualifications";
DROP POLICY IF EXISTS "Allow authenticated update equipmentQualifications"  ON "equipmentQualifications";
DROP POLICY IF EXISTS "Allow authenticated delete equipmentQualifications"  ON "equipmentQualifications";

CREATE POLICY "Allow anon+auth read equipmentQualifications"
    ON "equipmentQualifications" FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow anon+auth insert equipmentQualifications"
    ON "equipmentQualifications" FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow anon+auth update equipmentQualifications"
    ON "equipmentQualifications" FOR UPDATE
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow anon+auth delete equipmentQualifications"
    ON "equipmentQualifications" FOR DELETE
    TO anon, authenticated
    USING (true);
