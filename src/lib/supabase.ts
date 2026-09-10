import { createClient } from '@supabase/supabase-js';

// Default to live project credentials if environment variables are not set in the hosting provider
const defaultSupabaseUrl = 'https://xgcamlpkbgjulkfknpud.supabase.co';
const defaultSupabaseAnonKey = 'sb_publishable_3rbDSN4ONrtCxacboVfEdA_3nkUt82f';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
  defaultSupabaseUrl;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
  defaultSupabaseAnonKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : defaultSupabaseUrl,
  isSupabaseConfigured ? supabaseAnonKey : defaultSupabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

export default supabase;
