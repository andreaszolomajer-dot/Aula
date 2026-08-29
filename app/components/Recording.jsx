'use client';

import { useState, useRef, useEffect } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { useTools } from './ToolsProvider';
import { useT } from './LangProvider';

export default function Recording() {
  const room = useRoomContext();
  const { activeTool, setActiveTool } = useTools();
  const { t } = useT();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [err, setErr] = useState('');

  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const streamsRef = useRef([]);
  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const destRef = useRef(null);
  const addedRef = useRef(new Set());   // sid-urile deja adăugate în mix
  const subHandlerRef = useRef(null);

  const cleanup = () => {
    streamsRef.current.forEach((s) => s.getTracks().forEach((tr) => tr.stop()));
    streamsRef.current = [];
    if (subHandlerRef.current && room) {
      room.off(RoomEvent.TrackSubscribed, subHandlerRef.current);
      subHandlerRef.current = null;
    }
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch (e) {} audioCtxRef.current = null; }
    destRef.current = null;
    addedRef.current = new Set();
  };

  const stop = () => {
    if (recRef.current && recRef.current.state !== 'inactive') { try { recRef.current.stop(); } catch (e) {} }
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Adaugă o pistă audio (mediaStreamTrack) în mixul de înregistrare
  const addTrack = (mst, sid, gainVal) => {
    const ctx = audioCtxRef.current, dest = destRef.current;
    if (!ctx || !dest || !mst) return;
    const id = sid || mst.id;
    if (addedRef.current.has(id)) return;
    try {
      const src = ctx.createMediaStreamSource(new MediaStream([mst]));
      const g = ctx.createGain(); g.gain.value = gainVal ?? 1.0;
      src.connect(g).connect(dest);
      addedRef.current.add(id);
    } catch (e) {}
  };

  // Adună toate vocile din cameră: microfonul meu (pista publicată) + fiecare participant
  const mixRoomAudio = () => {
    if (!room) return;
    try {
      const lp = room.localParticipant;
      lp?.audioTrackPublications?.forEach((pub) => {
        const mst = pub.track?.mediaStreamTrack;
        if (mst) addTrack(mst, pub.trackSid, 1.0);
      });
      room.remoteParticipants?.forEach((rp) => {
        rp.audioTrackPublications?.forEach((pub) => {
          if (pub.isSubscribed && pub.track?.mediaStreamTrack) addTrack(pub.track.mediaStreamTrack, pub.trackSid, 1.0);
        });
      });
    } catch (e) {}
  };

  const start = async () => {
    setErr(''); setDownloadUrl('');
    try {
      // Video: ecranul (prezentare / galerie). Sunetul NU-l luăm de aici.
      const display = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 24 }, audio: false });

      const AC = window.AudioContext || window.webkitAudioContext;
      let ctx;
      try { ctx = new AC({ sampleRate: 48000 }); } catch (e) { ctx = new AC(); }
      audioCtxRef.current = ctx;
      const dest = ctx.createMediaStreamDestination();
      destRef.current = dest;

      // 1) vocile curate din conferință (eu + toți)
      mixRoomAudio();

      // 2) participanții care intră/pornesc microfonul ÎN TIMPUL înregistrării
      const onSub = (track, pub, participant) => {
        if (track?.kind === 'audio' && track.mediaStreamTrack) addTrack(track.mediaStreamTrack, pub?.trackSid, 1.0);
      };
      subHandlerRef.current = onSub;
      room?.on(RoomEvent.TrackSubscribed, onSub);

      // 3) plasă de siguranță: dacă nu s-a prins nicio pistă (ex. microfon nepublicat),
      //    deschidem microfonul direct ca să existe măcar vocea ta.
      let micStream = null;
      if (addedRef.current.size === 0) {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
          });
          addTrack(micStream.getAudioTracks()[0], 'local-mic', 1.0);
        } catch (e) {}
      }

      const mixedAudio = dest.stream.getAudioTracks()[0];
      const tracks = [display.getVideoTracks()[0]];
      if (mixedAudio) tracks.push(mixedAudio);
      const combined = new MediaStream(tracks);
      streamsRef.current = [display, micStream].filter(Boolean);

      const pick = (m) => (MediaRecorder.isTypeSupported(m) ? m : null);
      const mime = pick('video/webm;codecs=vp9,opus') || pick('video/webm;codecs=vp8,opus') || pick('video/webm') || '';
      let rec;
      try {
        rec = new MediaRecorder(combined, { mimeType: mime, audioBitsPerSecond: 128000, videoBitsPerSecond: 2500000 });
      } catch (e) {
        rec = new MediaRecorder(combined, mime ? { mimeType: mime } : undefined);
      }
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => { setDownloadUrl(URL.createObjectURL(new Blob(chunksRef.current, { type: 'video/webm' }))); cleanup(); };
      rec.start(1000);
      recRef.current = rec;
      display.getVideoTracks()[0].addEventListener('ended', stop);
      setRecording(true); setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (e) {
      setErr(t('recErr'));
      cleanup();
      setTimeout(() => setErr(''), 5000);
    }
  };

  // Pornit din dock
  useEffect(() => {
    if (activeTool === 'inregistrare' && !recording) {
      start();
      setActiveTool(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); cleanup(); }, []);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (!recording && !downloadUrl && !err) return null;

  return (
    <div className="rec-control">
      {recording && (
        <button className="rec-btn on" onClick={stop}><span className="rec-dot" /> {fmt(seconds)} · {t('recStop')}</button>
      )}
      {downloadUrl && !recording && (
        <a className="rec-download" href={downloadUrl} download={`aula-inregistrare-${Date.now()}.webm`} onClick={() => setTimeout(() => setDownloadUrl(''), 1500)}>{t('recDownload')}</a>
      )}
      {err && <div className="rec-err">{err}</div>}
    </div>
  );
}
