'use client';

import '@livekit/components-styles';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import Captions from '../../components/Captions';
import BackgroundControl from '../../components/BackgroundControl';
import LivePresentation from '../../components/LivePresentation';
import BreakoutRooms from '../../components/BreakoutRooms';
import RoomNotice from '../../components/RoomNotice';
import Reactions from '../../components/Reactions';
import Recording from '../../components/Recording';
import Whiteboard from '../../components/Whiteboard';
import Polls from '../../components/Polls';
import HostControls from '../../components/HostControls';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';

export default function Room() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();

  const room = decodeURIComponent(params.room);
  const username = search.get('username') || 'Invitat';

  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/token?room=${encodeURIComponent(room)}&username=${encodeURIComponent(username)}`
        );
        const data = await res.json();
        if (!active) return;
        if (data.error) setError(data.error);
        else setToken(data.token);
      } catch (e) {
        if (active) setError('Nu am putut obține accesul la ședință.');
      }
    })();
    return () => {
      active = false;
    };
  }, [room, username]);

  if (error) {
    return (
      <div className="loading">
        {error} — verifică cheile LiveKit din fișierul .env.local
      </div>
    );
  }

  if (!token || !serverUrl) {
    return <div className="loading">Se conectează la „{room}”…</div>;
  }

  return (
    <div data-lk-theme="default" style={{ height: '100dvh' }}>
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        video={true}
        audio={true}
        onDisconnected={() => router.push('/')}
        style={{ height: '100%' }}
      >
        <VideoConference />
        <Captions />
        <BackgroundControl />
        <LivePresentation />
        <BreakoutRooms />
        <RoomNotice />
        <Reactions />
        <Recording />
        <Whiteboard />
        <Polls />
        <HostControls />
      </LiveKitRoom>
    </div>
  );
}
