import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder')
);

if (!isSupabaseConfigured) {
  console.info(
    'FarmPilot is operating in Demo Mode with local mock data (Green Valley Farm). ' +
    'To connect to a live Supabase instance, provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Provide valid placeholder parameters if unconfigured to prevent createClient startup crash
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://demo-farmpilot.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'demo-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

export default supabase;
