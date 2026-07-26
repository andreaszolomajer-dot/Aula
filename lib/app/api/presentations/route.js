import { NextResponse } from 'next/server';
import { getSupabase } from '../../../lib/supabase';
import { getUserFromRequest } from '../../../lib/authUser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/presentations           -> listă (ale utilizatorului, sau publice dacă nu e conectat)
// GET /api/presentations?id=UUID   -> o prezentare
export async function GET(req) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ configured: false, items: [], item: null });

  const user = await getUserFromRequest(req);
  const id = req.nextUrl.searchParams.get('id');

  if (id) {
    let q = supabase.from('presentations').select('*').eq('id', id);
    const { data } = await q.maybeSingle();
    return NextResponse.json({ configured: true, item: data || null });
  }

  let q = supabase.from('presentations').select('id, title, updated_at');
  q = user ? q.eq('user_id', user.id) : q.is('user_id', null);
  const { data } = await q.order('updated_at', { ascending: false });
  return NextResponse.json({ configured: true, items: data || [] });
}

// POST /api/presentations  { id, title, data } -> salvează (upsert), legat de utilizator
export async function POST(req) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Baza de date nu e configurată.' }, { status: 400 });

  const user = await getUserFromRequest(req);
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: 'Lipsește id-ul.' }, { status: 400 });

  const { error } = await supabase.from('presentations').upsert({
    id: body.id,
    title: body.title || 'Prezentare',
    data: body.data || {},
    user_id: user?.id || null,
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/presentations?id=UUID
export async function DELETE(req) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Baza de date nu e configurată.' }, { status: 400 });

  const user = await getUserFromRequest(req);
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Lipsește id-ul.' }, { status: 400 });

  let q = supabase.from('presentations').delete().eq('id', id);
  if (user) q = q.eq('user_id', user.id);
  await q;
  return NextResponse.json({ ok: true });
}
