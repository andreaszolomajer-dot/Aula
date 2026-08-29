'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { useTools } from './ToolsProvider';
import { useT } from './LangProvider';

const enc = new TextEncoder();
const dec = new TextDecoder();

let ytApiPromise = null;
function loadYТApi() {
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.YT && window.YT.Player) { resolve(window.YT); return; }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) { try { prev(); } catch (e) {} } resolve(window.YT); };
    if (!document.getElementById('yt-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
    const iv = setInterval(() => { if (window.YT && window.YT.Player) { clearInterval(iv); resolve(window.YT); } }, 300);
  });
  return ytApiPromise;
}

function extractId(url) {
  if (!url) return '';
  const u = url.trim();
  const m = u.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  if (m) return m[1];
  if (/^[\w-]{11}$/.test(u)) return u;
  return '';
}

export default function YouTubeVideo() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const { activeTool, setActiveTool } = useTools();
  const { t } = useT();
  const username = localParticipant?.name || 'Prezentator';

  const [role, setRole] = useState('none'); // 'presenter' | 'viewer' | 'none'
  const [videoId, setVideoId] = useState('');
  const [url, setUrl] = useState('');
  const [presenterName, setPresenterName] = useState('');
  const [hidden, setHidden] = useState(false);
  const [err, setErr] = useState('');

  const roleRef = useRef(role);
  const videoIdRef = useRef(videoId);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  roleRef.current = role;
  videoIdRef.current = videoId;

  const broadcast = useCallback((msg, reliable = true) => {
    const lp = room?.localParticipant;
    if (!lp) return;
    try { lp.publishData(enc.encode(JSON.stringify(msg)), { reliable, topic: 'video' }); } catch (e) {}
  }, [room]);

  const active = role === 'presenter' || role === 'viewer';

  // ---- Create / update player ----
  useEffect(() => {
    if (!active || !videoId) return;
    let cancelled = false;
    (async () => {
      const YT = await loadYТApi();
      if (cancelled || !containerRef.current) return;
      const isPresenter = roleRef.current === 'presenter';
      if (!playerRef.current) {
        playerRef.current = new YT.Player(containerRef.current, {
          videoId,
          playerVars: { rel: 0, modestbranding: 1, controls: 1 },
          events: {
            onStateChange: (e) => {
              if (roleRef.current !== 'presenter' || !playerRef.current) return;
              const time = playerRef.current.getCurrentTime();
              if (e.data === YT.PlayerState.PLAYING) broadcast({ t: 'play', time });
              else if (e.data === YT.PlayerState.PAUSED) broadcast({ t: 'pause', time });
            },
          },
        });
      } else {
        try { playerRef.current.loadVideoById(videoId); } catch (e) {}
      }
    })();
    return () => { cancelled = true; };
  }, [active, videoId, broadcast]);

  // ---- Presenter heartbeat (keeps everyone in sync + late joiners) ----
  useEffect(() => {
    if (role !== 'presenter') return;
    const iv = setInterval(() => {
      const p = playerRef.current;
      if (!p || !p.getCurrentTime) return;
      let playing = false;
      try { playing = p.getPlayerState() === 1; } catch (e) {}
      broadcast({ t: 'sync', videoId: videoIdRef.current, playing, time: p.getCurrentTime(), by: username }, false);
    }, 3000);
    return () => clearInterval(iv);
  }, [role, broadcast, username]);

  // ---- Receive ----
  useEffect(() => {
    if (!room) return;
    const applyPlay = (time, play) => {
      const p = playerRef.current;
      if (!p || !p.seekTo) return;
      try {
        if (typeof time === 'number' && Math.abs(p.getCurrentTime() - time) > 2.2) p.seekTo(time, true);
        if (play) p.playVideo(); else p.pauseVideo();
      } catch (e) {}
    };
    const handler = (payload, participant, _k, topic) => {
      if (topic !== 'video') return;
      if (roleRef.current === 'presenter') return;
      let m; try { m = JSON.parse(dec.decode(payload)); } catch { return; }
      if (m.t === 'load') {
        setRole('viewer'); setPresenterName(m.by || ''); setHidden(false); setVideoId(m.videoId);
      } else if (m.t === 'sync') {
        if (m.videoId && videoIdRef.current !== m.videoId) { setRole('viewer'); setPresenterName(m.by || ''); setVideoId(m.videoId); }
        else applyPlay(m.time, m.playing);
      } else if (m.t === 'play') { applyPlay(m.time, true); }
      else if (m.t === 'pause') { applyPlay(m.time, false); }
      else if (m.t === 'end') { closeAll(); }
    };
    room.on(RoomEvent.DataReceived, handler);
    return () => room.off(RoomEvent.DataReceived, handler);
  }, [room]);

  const startVideo = () => {
    const id = extractId(url);
    if (!id) { setErr(t('ytBad')); return; }
    setErr('');
    setRole('presenter'); setVideoId(id); videoIdRef.current = id;
    broadcast({ t: 'load', videoId: id, by: username });
  };

  const closeAll = () => {
    if (playerRef.current) { try { playerRef.current.destroy(); } catch (e) {} playerRef.current = null; }
    setRole('none'); setVideoId(''); setActiveTool(null);
  };
  const stopForAll = () => { broadcast({ t: 'end' }); closeAll(); };

  // ---- Loader card (presenter picks a video) ----
  if (activeTool === 'video' && role === 'none') {
    return (
      <div className="panel-float panel-left" style={{ top: 90 }}>
        <div className="panel-head">{t('ytTitle')} <button className="panel-x" onClick={() => setActiveTool(null)}>✕</button></div>
        <p className="br-muted">{t('ytHint')}</p>
        <input className="pl-input" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && startVideo()} placeholder="https://youtu.be/..." />
        <button className="fs-upload" onClick={startVideo}>{t('ytPlay')}</button>
        {err && <p className="br-muted" style={{ color: 'var(--warm, #F5A742)' }}>{err}</p>}
      </div>
    );
  }

  if (active && role === 'viewer' && hidden) {
    return <button className="lp-trigger" onClick={() => setHidden(false)}>{t('ytShow')}</button>;
  }

  if (!active) return null;

  return (
    <div className="lp-stage">
      <div className="yt-frame"><div ref={containerRef} /></div>
      <div className="lp-bar">
        {role === 'presenter' ? (
          <>
            <span className="lp-live" style={{ color: 'var(--mint)' }}>{t('ytPlaying')}</span>
            <button className="lp-stop" onClick={stopForAll}>{t('ytStop')}</button>
          </>
        ) : (
          <>
            <span className="lp-live">● LIVE · {presenterName}</span>
            <button onClick={() => setHidden(true)}>{t('ytHide')}</button>
          </>
        )}
      </div>
    </div>
  );
}
