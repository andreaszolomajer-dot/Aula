import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';
import { getSupabase } from '../../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function roomIsEmpty(room) {
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL;
  if (!wsUrl) return true;
  try {
    const httpUrl = wsUrl.replace('wss://', 'https://').replace('ws://', 'http://');
    const svc = new RoomServiceClient(httpUrl, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
    const parts = await svc.listParticipants(room);
    return !parts || parts.length === 0;
  } catch (e) {
    return true; // sala nu există încă => goală
  }
}

export async function GET(req) {
  const room = req.nextUrl.searchParams.get('room');
  const username = req.nextUrl.searchParams.get('username');
  const hostKey = req.nextUrl.searchParams.get('host') || '';
  const identity = req.nextUrl.searchParams.get('identity') || `${username || 'user'}-${Math.random().toString(36).slice(2, 7)}`;

  if (!room || !username) return NextResponse.json({ error: 'Lipsesc parametrii "room" sau "username".' }, { status: 400 });
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) return NextResponse.json({ error: 'Serverul nu are cheile LiveKit configurate.' }, { status: 500 });

  let isHost = true;
  let webinar = false;
  let lobby = false;

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: row } = await supabase.from('room_hosts').select('*').eq('room', room).maybeSingle();
      const empty = await roomIsEmpty(room);

      if (!row) {
        await supabase.from('room_hosts').insert({ room, host_identity: identity });
        isHost = true;
      } else {
        lobby = !!row.lobby;
        webinar = !!row.webinar;
        if (row.host_key) {
          // Ședință cu link de gazdă: doar cine are cheia corectă e gazdă (indiferent de ordine)
          if (hostKey && hostKey === row.host_key) {
            isHost = true;
            if (row.host_identity !== identity) {
              await supabase.from('room_hosts').update({ host_identity: identity }).eq('room', room);
            }
          } else {
            isHost = false;
          }
        } else if (!row.host_identity || empty) {
          // Fără link de gazdă: sesiune nouă (sală goală) => prima persoană devine gazdă
          await supabase.from('room_hosts').update({ host_identity: identity, cohosts: [] }).eq('room', room);
          try { await supabase.from('lobby_requests').delete().eq('room', room); } catch (e) {}
          isHost = true;
        } else {
          isHost = row.host_identity === identity;
        }
      }

      // Sală de așteptare pentru cei care nu sunt gazdă
      if (!isHost && lobby) {
        const { data: lr } = await supabase.from('lobby_requests').select('*').eq('room', room).eq('identity', identity).maybeSingle();
        if (!lr) {
          await supabase.from('lobby_requests').insert({ room, identity, name: username, admitted: false });
          return NextResponse.json({ waiting: true });
        }
        if (!lr.admitted) return NextResponse.json({ waiting: true });
      }
    } catch (e) {
      isHost = true; webinar = false; lobby = false;
    }
  }

  const canPublish = isHost || !webinar;
  const at = new AccessToken(apiKey, apiSecret, { identity, name: username });
  at.addGrant({ roomJoin: true, room, canPublish, canSubscribe: true, canPublishData: true });
  const token = await at.toJwt();

  return NextResponse.json({ token, isHost, webinar, lobby });
}
