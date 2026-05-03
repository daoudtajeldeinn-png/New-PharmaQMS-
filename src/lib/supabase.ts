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

/** Push activity to centralized audit logs */
export async function logActivity(activity: any) {
  try {
    const { error } = await supabase.from('audit_logs').insert([{
      id: activity.id,
      action: activity.type,
      module: 'General',
      details: { description: activity.description, user: activity.user },
      created_at: activity.timestamp
    }]);
    if (error) console.error('[Audit Log] Sync Error:', error.message);
  } catch (err) {
    console.error('[Audit Log] Failed to push to cloud:', err);
  }
}
