import { createClient } from '@supabase/supabase-js';

// Client pentru browser (folosește cheia publică anon). Sigur de expus.
let client = null;
export function getSupabaseBrowser() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  client = createClient(url, anon);
  return client;
}
