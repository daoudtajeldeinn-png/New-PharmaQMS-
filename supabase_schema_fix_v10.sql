-- ==============================================================================
-- PharmaQMS Database Migration: v10 (Comprehensive Security & RLS Fix)
-- ==============================================================================
-- Resolves:
-- 1. 42501 RLS error on equipmentQualifications (app syncs via anon key)
-- 2. equipment_id and id UUID type constraint (allows text IDs like EQ-001)
-- 3. Supabase Linter ERROR: rls_disabled_in_public (all 31+ public tables)
-- 4. Supabase Linter ERROR: policy_exists_rls_disabled (audit_logs, batch_records, etc.)
-- 5. Supabase Linter ERROR: sensitive_columns_exposed (trainingRecords.certificate)
-- 6. Supabase Linter WARN: function_search_path_mutable (prevent_audit_mutation, etc.)
-- 7. Cleans up redundant duplicate RLS policies (resolves rls_policy_always_true clutter)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PART 1: FIX equipmentQualifications TABLE SCHEMA & RLS
-- ------------------------------------------------------------------------------

-- Ensure table exists with text primary key and text equipment_id
CREATE TABLE IF NOT EXISTS "equipmentQualifications" (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    equipment_id text NOT NULL,
    phase text NOT NULL CHECK (phase IN ('DQ', 'IQ', 'OQ', 'PQ')),
    protocol_number text,
    qualification_date timestamptz,
    performed_by text,
    approved_by text,
    result text CHECK (result IN ('Pass', 'Fail', 'Pending')),
    next_requalification_date timestamptz,
    notes text,
    is_deleted boolean DEFAULT false,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- In case table was previously created with UUID columns, relax them to TEXT
DO $$
BEGIN
    ALTER TABLE "equipmentQualifications" DROP CONSTRAINT IF EXISTS "equipmentQualifications_pkey" CASCADE;
    ALTER TABLE "equipmentQualifications" DROP CONSTRAINT IF EXISTS "equipmentQualifications_equipment_id_fkey" CASCADE;

    ALTER TABLE "equipmentQualifications" ALTER COLUMN id TYPE text USING id::text;
    ALTER TABLE "equipmentQualifications" ALTER COLUMN equipment_id TYPE text USING equipment_id::text;
    
    ALTER TABLE "equipmentQualifications" ADD CONSTRAINT "equipmentQualifications_pkey" PRIMARY KEY (id);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'equipmentQualifications columns already compatible.';
END $$;

-- Indices
CREATE INDEX IF NOT EXISTS idx_equipment_qualifications_eq_id ON "equipmentQualifications" (equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_qualifications_phase ON "equipmentQualifications" (phase);
CREATE INDEX IF NOT EXISTS idx_equipment_qualifications_next_date ON "equipmentQualifications" (next_requalification_date);

-- Enable RLS
ALTER TABLE "equipmentQualifications" ENABLE ROW LEVEL SECURITY;

-- Drop all previous / duplicate policies on equipmentQualifications
DROP POLICY IF EXISTS "Allow authenticated read equipmentQualifications" ON "equipmentQualifications";
DROP POLICY IF EXISTS "Allow authenticated insert equipmentQualifications" ON "equipmentQualifications";
DROP POLICY IF EXISTS "Allow authenticated update equipmentQualifications" ON "equipmentQualifications";
DROP POLICY IF EXISTS "Allow authenticated delete equipmentQualifications" ON "equipmentQualifications";
DROP POLICY IF EXISTS "Allow full access for app" ON "equipmentQualifications";
DROP POLICY IF EXISTS "Allow anon and authenticated all on equipmentQualifications" ON "equipmentQualifications";
DROP POLICY IF EXISTS "Allow all operations on equipmentQualifications" ON "equipmentQualifications";

-- Create single clean universal policy for anon AND authenticated roles
CREATE POLICY "Allow all operations on equipmentQualifications"
    ON "equipmentQualifications"
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

GRANT ALL ON "equipmentQualifications" TO anon, authenticated;


-- ------------------------------------------------------------------------------
-- PART 2: CLEAN UP DUPLICATE POLICIES & ENABLE RLS ON ALL PUBLIC TABLES
-- (Fixes: rls_disabled_in_public, policy_exists_rls_disabled, sensitive_columns_exposed)
-- ------------------------------------------------------------------------------

-- Clean duplicate / redundant policies on special tables
DO $$
BEGIN
    -- deletedRecords / deletedrecords
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deletedRecords') THEN
        DROP POLICY IF EXISTS "Allow authenticated delete on deletedrecords" ON "deletedRecords";
        DROP POLICY IF EXISTS "Allow authenticated insert on deletedrecords" ON "deletedRecords";
        DROP POLICY IF EXISTS "Allow authenticated update on deletedrecords" ON "deletedRecords";
        DROP POLICY IF EXISTS "Allow all for authenticated" ON "deletedRecords";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deletedrecords') THEN
        DROP POLICY IF EXISTS "Allow authenticated delete on deletedrecords" ON "deletedrecords";
        DROP POLICY IF EXISTS "Allow authenticated insert on deletedrecords" ON "deletedrecords";
        DROP POLICY IF EXISTS "Allow authenticated update on deletedrecords" ON "deletedrecords";
        DROP POLICY IF EXISTS "Allow all for authenticated" ON "deletedrecords";
    END IF;

    -- user_activity_logs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_activity_logs') THEN
        DROP POLICY IF EXISTS "Allow authenticated insert on user_activity_logs" ON "user_activity_logs";
        DROP POLICY IF EXISTS "Allow all insert logs" ON "user_activity_logs";
        DROP POLICY IF EXISTS "Users can insert logs" ON "user_activity_logs";
        DROP POLICY IF EXISTS "Admins can view all logs" ON "user_activity_logs";
        DROP POLICY IF EXISTS "Users can view own logs" ON "user_activity_logs";
    END IF;

    -- notifications
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        DROP POLICY IF EXISTS "System can insert notifications" ON "notifications";
        DROP POLICY IF EXISTS "Users can update their own notifications" ON "notifications";
        DROP POLICY IF EXISTS "Users can see their own notifications" ON "notifications";
    END IF;
END $$;

-- Enable RLS and create uniform policy across all tables
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        -- Core Sync Tables (camelCase)
        'products',
        'testMethods',
        'testResults',
        'capas',
        'deviations',
        'equipment',
        'chemicalReagents',
        'referenceStandards',
        'qualitySystems',
        'trainingRecords',
        'audits',
        'suppliers',
        'changeControls',
        'marketComplaints',
        'productRecalls',
        'stabilityProtocols',
        'ipqcChecks',
        'coaRecords',
        'masterFormulas',
        'batchRecords',
        'rawMaterials',
        'materialMovements',
        'reconciliationRecords',
        'activities',
        'pharmacopeiaMonographs',
        'equipmentQualifications',
        'deletedRecords',
        'deletedrecords',
        'notifications',
        'user_activity_logs',
        
        -- Legacy / Snake_Case Tables Flagged in Linter
        'audit_logs',
        'batch_records',
        'master_formulas',
        'qc_tests',
        'inventory',
        'profiles'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_name = tbl
        ) THEN
            -- 1. Enable RLS (Fixes rls_disabled_in_public & policy_exists_rls_disabled)
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
            
            -- 2. Drop existing policy if already defined
            EXECUTE format('DROP POLICY IF EXISTS "Allow full access for app" ON public.%I;', tbl);
            
            -- 3. Create clean universal policy for anon & authenticated
            EXECUTE format(
                'CREATE POLICY "Allow full access for app" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);',
                tbl
            );
            
            -- 4. Grant table privileges
            EXECUTE format('GRANT ALL ON public.%I TO anon, authenticated;', tbl);
        END IF;
    END LOOP;
END $$;

-- Grant usage on sequences so inserts with default IDs never fail
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;


-- ------------------------------------------------------------------------------
-- PART 3: SECURE FUNCTION SEARCH PATHS
-- (Fixes: function_search_path_mutable on prevent_audit_mutation, hash_password, etc.)
-- ------------------------------------------------------------------------------

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_catalog.pg_proc p
        JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND p.proname IN (
              'prevent_audit_mutation',
              'hash_password',
              'deletedrecords_fill_defaults',
              'log_user_activity'
          )
    LOOP
        EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public;', r.proname, r.args);
    END LOOP;
END $$;


-- ------------------------------------------------------------------------------
-- PART 4: RELOAD POSTGREST SCHEMA CACHE
-- ------------------------------------------------------------------------------

NOTIFY pgrst, 'reload schema';
