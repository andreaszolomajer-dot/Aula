import { createClient } from '@supabase/supabase-js';

// Client folosit doar pe server (folosește cheia service_role).
// Nu importa acest fișier în cod care rulează în browser.
export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
