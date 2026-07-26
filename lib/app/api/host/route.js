import { NextResponse } from 'next/server';
import { RoomServiceClient, TrackType } from 'livekit-server-sdk';
import { getSupabase } from '../../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function svcClient() {
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL;
  if (!wsUrl) return null;
  const httpUrl = wsUrl.replace('wss://', 'https://').replace('ws://', 'http://');
  return new RoomServiceClient(httpUrl, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
}
const isAudio = (t) => t.type === (TrackType?.AUDIO ?? 0);

async function getHost(supabase, room) {
  const { data } = await supabase.from('room_hosts').select('*').eq('room', room).maybeSingle();
  return data || null;
}

export async function POST(req) {
  const body = await req.json().catch(() => null);
  if (!body?.room || !body?.action) return NextResponse.json({ error: 'Parametri lipsă.' }, { status: 400 });
  const { room, action, identity, name, target, lobby, webinar } = body;
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Baza de date nu e configurată.' }, { status: 400 });

  // Revendicare / status
  if (action === 'claim' || action === 'status') {
    let host = await getHost(supabase, room);
    if (!host && action === 'claim') {
      await supabase.from('room_hosts').upsert({ room, host_identity: identity, host_name: name || null, claimed_at: new Date().toISOString() });
      host = { host_identity: identity, lobby: false, webinar: false };
    }
    return NextResponse.json({ host_identity: host?.host_identity || null, lobby: !!host?.lobby, webinar: !!host?.webinar });
  }

  // Acțiuni doar pentru gazdă
  const host = await getHost(supabase, room);
  if (!host || host.host_identity !== identity) {
    return NextResponse.json({ error: 'Doar gazda poate face asta.' }, { status: 403 });
  }

  if (action === 'setMode') {
    await supabase.from('room_hosts').update({ lobby: !!lobby, webinar: !!webinar }).eq('room', room);
    return NextResponse.json({ ok: true, lobby: !!lobby, webinar: !!webinar });
  }

  if (action === 'lobbyList') {
    const { data } = await supabase.from('lobby_requests').select('*').eq('room', room).eq('admitted', false).order('requested_at', { ascending: true });
    return NextResponse.json({ waiting: data || [] });
  }

  if (action === 'admit' && target) {
    await supabase.from('lobby_requests').update({ admitted: true }).eq('room', room).eq('identity', target);
    return NextResponse.json({ ok: true });
  }

  // Acțiuni LiveKit (mute/remove)
  const svc = svcClient();
  if (!svc) return NextResponse.json({ error: 'LiveKit neconfigurat.' }, { status: 400 });
  try {
    if (action === 'muteAll') {
      const parts = await svc.listParticipants(room);
      for (const p of parts) {
        if (p.identity === identity) continue;
        for (const t of p.tracks || []) if (isAudio(t) && !t.muted) { try { await svc.mutePublishedTrack(room, p.identity, t.sid, true); } catch (e) {} }
      }
      return NextResponse.json({ ok: true });
    }
    if (action === 'mute' && target) {
      const parts = await svc.listParticipants(room);
      const p = parts.find((x) => x.identity === target);
      if (p) for (const t of p.tracks || []) if (isAudio(t)) { try { await svc.mutePublishedTrack(room, target, t.sid, true); } catch (e) {} }
      return NextResponse.json({ ok: true });
    }
    if (action === 'remove' && target) {
      await svc.removeParticipant(room, target);
      return NextResponse.json({ ok: true });
    }
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
  return NextResponse.json({ error: 'Acțiune necunoscută.' }, { status: 400 });
}
