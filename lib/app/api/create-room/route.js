import { NextResponse } from 'next/server';
import { getSupabase } from '../../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const room = (body.room && String(body.room).trim()) || Math.random().toString(36).slice(2, 8);
  const hostKey = Math.random().toString(36).slice(2, 10);
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('room_hosts').upsert({
        room,
        host_key: hostKey,
        host_identity: null,
        cohosts: [],
        lobby: !!body.lobby,
        webinar: !!body.webinar,
      });
      try { await supabase.from('lobby_requests').delete().eq('room', room); } catch (e) {}
    } catch (e) {}
  }
  return NextResponse.json({ room, hostKey });
}
