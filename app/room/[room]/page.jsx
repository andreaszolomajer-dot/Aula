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
import FileShare from '../../components/FileShare';
import QA from '../../components/QA';
import YouTubeVideo from '../../components/YouTubeVideo';
import CopyInvite from '../../components/CopyInvite';
import Dock from '../../components/Dock';
import { ToolsProvider } from '../../components/ToolsProvider';
import { useT } from '../../components/LangProvider';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';

export default function Room() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();

  const room = decodeURIComponent(params.room);
  const username = search.get('username') || 'Invitat';
  const hostKey = search.get('host') || '';
  const { t } = useT();

  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [canPub, setCanPub] = useState(true);
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  // Identitate stabilă pe sesiune (necesară pentru sala de așteptare)
  const identity = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const key = 'aula-id-' + room;
    let id = null;
    try { id = sessionStorage.getItem(key); } catch (e) {}
    if (!id) {
      id = (username.replace(/\s+/g, '_').slice(0, 20) || 'user') + '-' + Math.random().toString(36).slice(2, 8);
      try { sessionStorage.setItem(key, id); } catch (e) {}
    }
    return id;
  }, [room, username]);

  useEffect(() => {
    let active = true;
    let timer = null;
    const enc = encodeURIComponent;
    const tryJoin = async () => {
      try {
        const res = await fetch(`/api/token?room=${enc(room)}&username=${enc(username)}&identity=${enc(identity)}${hostKey ? `&host=${enc(hostKey)}` : ''}`);
        const data = await res.json();
        if (!active) return;
        if (data.error) { setError(data.error); return; }
        if (data.waiting) { setWaiting(true); timer = setTimeout(tryJoin, 4000); return; }
        setWaiting(false);
        setCanPub(data.isHost || !data.webinar);
        setToken(data.token);
      } catch (e) {
        if (active) setError('Nu am putut obține accesul la ședință.');
      }
    };
    tryJoin();
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [room, username, identity, hostKey]);

  if (error) {
    return (
      <div className="loading">
        {error} — verifică cheile LiveKit din fișierul .env.local
      </div>
    );
  }

  if (waiting) {
    return (
      <div className="loading" style={{ flexDirection: 'column', gap: 12, textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: 30 }}>⏳</div>
        <div style={{ color: 'var(--text)', fontSize: 18, fontFamily: "'Space Grotesk', sans-serif" }}>{t('lobbyTitle')}</div>
        <div>{t('lobbyText')}</div>
      </div>
    );
  }

  if (!token || !serverUrl) {
    return <div className="loading">{t('connecting')} „{room}”…</div>;
  }

  return (
    <div data-lk-theme="default" style={{ height: '100dvh' }}>
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        video={canPub}
        audio={canPub}
        onDisconnected={() => router.push('/')}
        options={{
          audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          publishDefaults: { red: true, dtx: true },
        }}
        style={{ height: '100%' }}
      >
        <ToolsProvider>
          <VideoConference />
          <CopyInvite />
          <RoomNotice />
          <Dock />
          <Captions />
          <BackgroundControl />
          <LivePresentation />
          <BreakoutRooms />
          <Reactions />
          <Recording />
          <Whiteboard />
          <Polls />
          <HostControls />
          <FileShare />
          <QA />
          <YouTubeVideo />
        </ToolsProvider>
      </LiveKitRoom>
    </div>
  );
}
