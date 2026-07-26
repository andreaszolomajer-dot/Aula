import { getSupabaseBrowser } from './supabaseClient';

// Ca fetch, dar adaugă tokenul utilizatorului dacă e conectat.
export async function authedFetch(url, options = {}) {
  const supabase = getSupabaseBrowser();
  let token = null;
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token || null;
    } catch (e) {}
  }
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}
