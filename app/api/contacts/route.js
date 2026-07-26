import { NextResponse } from 'next/server';
import { getSupabase } from '../../../lib/supabase';
import { getUserFromRequest } from '../../../lib/authUser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

export async function GET(req) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ configured: false, contacts: [] });
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ configured: true, contacts: [], needsLogin: true });
  const { data } = await supabase.from('contacts').select('*').eq('user_id', user.id).order('email', { ascending: true });
  return NextResponse.json({ configured: true, contacts: data || [] });
}

export async function POST(req) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Baza de date nu e configurată.' }, { status: 400 });
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Trebuie să fii conectat.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  let entries = [];
  if (body.email) entries.push({ email: String(body.email).trim().toLowerCase(), name: body.name || null });
  if (body.text) {
    const found = String(body.text).match(EMAIL_RE) || [];
    for (const e of found) entries.push({ email: e.trim().toLowerCase(), name: null });
  }
  // dedupe în cerere
  const seen = new Set();
  entries = entries.filter((e) => e.email && !seen.has(e.email) && seen.add(e.email));
  if (!entries.length) return NextResponse.json({ error: 'Niciun email valid găsit.' }, { status: 400 });

  // exclude cele deja existente
  const { data: existing } = await supabase.from('contacts').select('email').eq('user_id', user.id);
  const have = new Set((existing || []).map((x) => x.email));
  const toInsert = entries.filter((e) => !have.has(e.email)).map((e) => ({ user_id: user.id, email: e.email, name: e.name }));

  if (toInsert.length) {
    await supabase.from('contacts').insert(toInsert);
  }
  const { data } = await supabase.from('contacts').select('*').eq('user_id', user.id).order('email', { ascending: true });
  return NextResponse.json({ ok: true, added: toInsert.length, contacts: data || [] });
}

export async function DELETE(req) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Baza de date nu e configurată.' }, { status: 400 });
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Trebuie să fii conectat.' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Lipsește id-ul.' }, { status: 400 });
  await supabase.from('contacts').delete().eq('id', id).eq('user_id', user.id);
  return NextResponse.json({ ok: true });
}
