import { createBrowserClient as createSsrBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const createBrowserSupabaseClient = () => createSsrBrowserClient(supabaseUrl, supabaseAnonKey);
export const createBrowserClient = createBrowserSupabaseClient;
export const createClient = createBrowserSupabaseClient;
