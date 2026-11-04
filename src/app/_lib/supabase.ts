import { createClient, SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | undefined;

export function getSupabaseClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error('Supabase is not configured. Check the URL and publishable key in .env.local.');
  }

  browserClient = createClient(url, publishableKey);
  return browserClient;
}
