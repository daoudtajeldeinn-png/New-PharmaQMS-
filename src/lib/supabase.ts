import { createClient } from '@supabase/supabase-js';

// Real project: https://supabase.com/dashboard/project/xxlxfhlliojkplrcvukc
const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL ?? 'https://xxlxfhlliojkplrcvukc.supabase.co';
const supabaseKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ??
  'sb_publishable_3s-eCcZhjvfTwFaO__DvEw_yppOQyrC';

export const supabase = createClient(supabaseUrl, supabaseKey);

/** Quick connectivity check (safe – ignores "table not found" gracefully) */
export async function checkSupabaseHealth(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.warn('[Supabase] Health check warning:', error.message);
      return false;
    }
    return !!data;
  } catch (err) {
    console.error('[Supabase] Connection failed:', err);
    return false;
  }
}
