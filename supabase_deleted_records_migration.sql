-- Run once in Supabase SQL Editor to enable cross-device deletion tombstones.
-- PostgREST REST path: /rest/v1/deletedrecords (lowercase)

CREATE TABLE IF NOT EXISTS public.deletedrecords (
  id text PRIMARY KEY,
  record_id text NOT NULL,
  table_name text NOT NULL,
  deleted_at text NOT NULL,
  deleted_by text NOT NULL,
  reason text,
  snapshot text,
  recovered boolean DEFAULT false,
  recovered_by text,
  recovered_at text
);

ALTER TABLE public.deletedrecords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.deletedrecords;
CREATE POLICY "Allow all for authenticated" ON public.deletedrecords
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.deletedrecords TO authenticated;
GRANT ALL ON public.deletedrecords TO anon;

NOTIFY pgrst, 'reload schema';
