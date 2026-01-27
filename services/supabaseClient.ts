import { createClient } from '@supabase/supabase-js';

// Support both VITE_ prefixed (local) and non-prefixed (Vercel) env vars
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your environment configuration.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
