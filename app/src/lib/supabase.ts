import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xxlxfhlliojkplrcvukc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bHhmaGxsaW9qa3BscmN2dWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Mzc4NzYsImV4cCI6MjA4NTIxMzg3Nn0.Cvvlo_9WfpfdfiFn4ytF_xSViJE0ouimzypbznoUFFE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
