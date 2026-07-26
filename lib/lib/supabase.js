import { createClient } from '@supabase/supabase-js';

function cleanUrl(u) {
  return (u || '').trim().replace(/\/(rest|auth|storage|realtime)\/v1\/?$/, '').replace(/\/+$/, '');
}

// Client folosit doar pe server (folosește cheia service_role/secret).
export function getSupabase() {
  const url = cleanUrl(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
