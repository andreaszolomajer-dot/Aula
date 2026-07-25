import { createClient } from '@supabase/supabase-js';

// Verifică tokenul trimis de client și întoarce utilizatorul autentificat (sau null).
export async function getUserFromRequest(req) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  try {
    const client = createClient(url, anon);
    const { data, error } = await client.auth.getUser(token);
    if (error) return null;
    return data.user || null;
  } catch (e) {
    return null;
  }
}
