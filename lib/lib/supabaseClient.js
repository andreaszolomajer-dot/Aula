import { createClient } from '@supabase/supabase-js';

function cleanUrl(u) {
  return (u || '').trim().replace(/\/(rest|auth|storage|realtime)\/v1\/?$/, '').replace(/\/+$/, '');
}

let client = null;
export function getSupabaseBrowser() {
  if (client) return client;
  const url = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  if (!url || !anon) return null;
  client = createClient(url, anon);
  return client;
}
