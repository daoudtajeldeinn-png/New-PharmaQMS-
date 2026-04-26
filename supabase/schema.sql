-- ==========================================
-- PharmaQMS Enterprise: Supabase Cloud Schema
-- ==========================================

-- Enable the "uuid-ossp" extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'viewer',
    department TEXT NOT NULL DEFAULT 'General',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Centralized Audit Logs Table (For Admin Monitoring)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g., 'BMR_COMPLETED', 'MATERIAL_RECEIVED'
    module TEXT NOT NULL, -- e.g., 'Production', 'Store', 'QC'
    details JSONB DEFAULT '{}'::jsonb, -- Store specific changes here
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Master Formulas Table
CREATE TABLE IF NOT EXISTS public.master_formulas (
    id TEXT PRIMARY KEY, -- We use TEXT to match existing Dexie IDs
    mfr_number TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    version TEXT NOT NULL,
    status TEXT NOT NULL,
    data JSONB NOT NULL, -- The entire MFR object (ingredients, process steps, etc)
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Batch Records Table
CREATE TABLE IF NOT EXISTS public.batch_records (
    id TEXT PRIMARY KEY,
    batch_number TEXT UNIQUE NOT NULL,
    mfr_id TEXT REFERENCES public.master_formulas(id),
    status TEXT NOT NULL,
    data JSONB NOT NULL, -- The entire BMR object (executions, yields, etc)
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Inventory Table
CREATE TABLE IF NOT EXISTS public.inventory (
    id TEXT PRIMARY KEY,
    item_code TEXT NOT NULL,
    description TEXT NOT NULL,
    batch_lot TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    status TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. QC Tests Table
CREATE TABLE IF NOT EXISTS public.qc_tests (
    id TEXT PRIMARY KEY,
    reference_id TEXT NOT NULL, -- Could be an inventory ID or a batch ID
    test_type TEXT NOT NULL,
    status TEXT NOT NULL,
    data JSONB NOT NULL,
    tested_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- Set up Row Level Security (RLS) policies
-- ==========================================

-- Allow all authenticated users to read profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);

-- Allow all authenticated users to write to audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read audit_logs for admins" ON public.audit_logs FOR SELECT USING (true); -- In reality, restrict to role='admin'

-- Turn off RLS temporarily for other tables to ensure smooth migration
ALTER TABLE public.master_formulas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_tests DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- Enable Realtime for all tables
-- ==========================================
alter publication supabase_realtime add table public.audit_logs;
alter publication supabase_realtime add table public.batch_records;
alter publication supabase_realtime add table public.inventory;
alter publication supabase_realtime add table public.qc_tests;
