import { createClient } from '@supabase/supabase-js';

// Get the environment variables from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xxlxfhlliojkplrcvukc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_PLACEHOLDER';

/**
 * Enterprise Supabase Client
 * Used for Audit Trails, Workflow States, and Centralized Data Storage
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check connection health
export async function checkSupabaseHealth() {
  try {
    const { data, error } = await supabase.from('_health_check').select('*').limit(1);
    if (error && error.code !== 'PGRST116') { // Ignore "no rows" errors
      console.warn('Supabase Health Check Warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase Connection Failed:', err);
    return false;
  }
}
