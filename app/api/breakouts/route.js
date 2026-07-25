import { NextResponse } from 'next/server';
import { getSupabase } from '../../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function slugify(t) {
  return (
    (t || 'grup')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24) || 'grup'
  );
}

export async function GET(req) {
  const supabase = getSupabase();
  const main = req.nextUrl.searchParams.get('main');
  if (!supabase) return NextResponse.json({ configured: false, rooms: [], recall_at: 0 });
  if (!main) return NextResponse.json({ configured: true, rooms: [], recall_at: 0 });

  const { data } = await supabase
    .from('breakout_sessions')
    .select('*')
    .eq('main_room', main)
    .maybeSingle();

  return NextResponse.json({
    configured: true,
    rooms: data?.rooms || [],
    recall_at: Number(data?.recall_at || 0),
  });
}

export async function POST(req) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Baza de date nu e configurată.' }, { status: 400 });

  const body = await req.json().catch(() => null);
  const main = body?.main;
  const action = body?.action;
  if (!main || !action) return NextResponse.json({ error: 'Parametri lipsă.' }, { status: 400 });

  const { data } = await supabase
    .from('breakout_sessions')
    .select('*')
    .eq('main_room', main)
    .maybeSingle();

  let rooms = data?.rooms || [];
  let recall_at = Number(data?.recall_at || 0);

  if (action === 'create') {
    const name = (body.name || 'Grup').trim();
    const base = slugify(name);
    let slug = base;
    let n = 1;
    while (rooms.some((r) => r.slug === slug)) slug = `${base}-${++n}`;
    rooms = [...rooms, { slug, name }];
  } else if (action === 'delete') {
    rooms = rooms.filter((r) => r.slug !== body.slug);
  } else if (action === 'recall') {
    recall_at = Date.now();
  }

  const { error } = await supabase.from('breakout_sessions').upsert({
    main_room: main,
    rooms,
    recall_at,
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, rooms, recall_at });
}
