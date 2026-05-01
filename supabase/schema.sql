-- ==========================================
-- Supabase Schema for PharmaQMS
-- ==========================================

-- 1. Profiles (Users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'QA', 'QC', 'Production', 'Store')),
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone in the company."
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Audit Logs (Company-wide Activity Tracking)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT, -- Denormalized for quick querying
  action TEXT NOT NULL, -- e.g., 'APPROVED_RAW_MATERIAL', 'LOGGED_QC_TEST'
  entity_type TEXT NOT NULL, -- e.g., 'RawMaterial', 'BatchRecord'
  entity_id TEXT NOT NULL,
  details JSONB, -- Storing previous/new values or additional context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs are viewable by Admins and QA."
  ON public.audit_logs FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('Admin', 'QA')
    )
  );

CREATE POLICY "Anyone can insert audit logs."
  ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Master Formulas
CREATE TABLE public.master_formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT NOT NULL,
  name TEXT NOT NULL,
  dosage_form TEXT,
  batch_size_kg NUMERIC,
  batch_size_units NUMERIC,
  shelf_life_months INTEGER,
  status TEXT DEFAULT 'DRAFT',
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Batch Records (BMR)
CREATE TABLE public.batch_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT UNIQUE NOT NULL,
  product_id UUID REFERENCES public.master_formulas(id),
  mfr_no TEXT,
  production_date DATE,
  exp_date DATE,
  start_date DATE,
  finish_date DATE,
  batch_size_kg NUMERIC,
  batch_size_tablet NUMERIC,
  analysis_no TEXT,
  status TEXT DEFAULT 'PLANNED',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Inventory (Raw Materials & Products)
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_name TEXT NOT NULL,
  batch_number TEXT NOT NULL,
  type TEXT NOT NULL, -- e.g., 'API', 'Excipient', 'Packaging'
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  status TEXT DEFAULT 'QUARANTINE', -- 'QUARANTINE', 'APPROVED', 'REJECTED'
  mfg_date DATE,
  exp_date DATE,
  analysis_no TEXT,
  supplier_id TEXT,
  received_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. QC Tests
CREATE TABLE public.qc_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name TEXT NOT NULL,
  test_type TEXT NOT NULL,
  material_id UUID REFERENCES public.inventory(id),
  batch_record_id UUID REFERENCES public.batch_records(id),
  method_reference TEXT,
  specification_limits JSONB,
  result_value TEXT,
  overall_result TEXT CHECK (overall_result IN ('PASS', 'FAIL', 'PENDING')),
  tested_by UUID REFERENCES public.profiles(id),
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to automatically log inserts/updates (optional, can also be done via App)
-- For this migration, we will handle audit logging from the application layer to ensure rich context.

-- RLS Policies for other tables (Basic Implementation)
ALTER TABLE public.master_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view data" ON public.master_formulas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert data" ON public.master_formulas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update data" ON public.master_formulas FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view data" ON public.batch_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert data" ON public.batch_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update data" ON public.batch_records FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view data" ON public.inventory FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert data" ON public.inventory FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update data" ON public.inventory FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view data" ON public.qc_tests FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert data" ON public.qc_tests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update data" ON public.qc_tests FOR UPDATE USING (auth.role() = 'authenticated');

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_master_formulas_modtime BEFORE UPDATE ON public.master_formulas FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_batch_records_modtime BEFORE UPDATE ON public.batch_records FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_inventory_modtime BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_qc_tests_modtime BEFORE UPDATE ON public.qc_tests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
