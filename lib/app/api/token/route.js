import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';
import { getSupabase } from '../../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const room = req.nextUrl.searchParams.get('room');
  const username = req.nextUrl.searchParams.get('username');
  const identity = req.nextUrl.searchParams.get('identity') || `${username || 'user'}-${Math.random().toString(36).slice(2, 7)}`;

  if (!room || !username) {
    return NextResponse.json({ error: 'Lipsesc parametrii "room" sau "username".' }, { status: 400 });
  }
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Serverul nu are cheile LiveKit configurate.' }, { status: 500 });
  }

  let isHost = true;
  let webinar = false;
  let lobby = false;

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: row } = await supabase.from('room_hosts').select('*').eq('room', room).maybeSingle();
      if (!row) {
        // Primul venit devine gazdă
        await supabase.from('room_hosts').insert({ room, host_identity: identity });
        isHost = true;
      } else {
        lobby = !!row.lobby;
        webinar = !!row.webinar;
        if (!row.host_identity) {
          await supabase.from('room_hosts').update({ host_identity: identity }).eq('room', room);
          isHost = true;
        } else {
          isHost = row.host_identity === identity;
        }
      }

      // Sală de așteptare pentru cei care nu sunt gazdă
      if (!isHost && lobby) {
        const { data: lr } = await supabase
          .from('lobby_requests')
          .select('*')
          .eq('room', room)
          .eq('identity', identity)
          .maybeSingle();
        if (!lr) {
          await supabase.from('lobby_requests').insert({ room, identity, name: username, admitted: false });
          return NextResponse.json({ waiting: true });
        }
        if (!lr.admitted) return NextResponse.json({ waiting: true });
      }
    } catch (e) {
      // Plasă de siguranță: dacă ceva eșuează, ședință normală (toți pot intra și vorbi)
      isHost = true; webinar = false; lobby = false;
    }
  }

  const canPublish = isHost || !webinar;
  const at = new AccessToken(apiKey, apiSecret, { identity, name: username });
  at.addGrant({ roomJoin: true, room, canPublish, canSubscribe: true, canPublishData: true });
  const token = await at.toJwt();

  return NextResponse.json({ token, isHost, webinar, lobby });
}
