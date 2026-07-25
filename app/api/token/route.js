import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

// LiveKit server SDK needs the Node.js runtime (not Edge).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const room = req.nextUrl.searchParams.get('room');
  const username = req.nextUrl.searchParams.get('username');

  if (!room || !username) {
    return NextResponse.json(
      { error: 'Lipsesc parametrii "room" sau "username".' },
      { status: 400 }
    );
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'Serverul nu are cheile LiveKit configurate.' },
      { status: 500 }
    );
  }

  // Identitatea trebuie să fie unică per participant.
  const identity = `${username}-${Math.random().toString(36).slice(2, 7)}`;

  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name: username,
  });

  at.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const token = await at.toJwt();

  return NextResponse.json({ token });
}
