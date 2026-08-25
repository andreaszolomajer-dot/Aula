'use client';

import { useState, useRef, useEffect } from 'react';
import { useTools } from './ToolsProvider';
import { useT } from './LangProvider';

export default function Recording() {
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

  const cleanup = () => {
    streamsRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    streamsRef.current = [];
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch (e) {} audioCtxRef.current = null; }
  };

  const stop = () => {
    if (recRef.current && recRef.current.state !== 'inactive') { try { recRef.current.stop(); } catch (e) {} }
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const start = async () => {
    setErr(''); setDownloadUrl('');
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
      let mic = null;
      try { mic = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) {}
      let audioTrack = null;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC && (display.getAudioTracks().length || mic)) {
        const ctx = new AC(); audioCtxRef.current = ctx;
        const dest = ctx.createMediaStreamDestination();
        if (display.getAudioTracks().length) ctx.createMediaStreamSource(new MediaStream(display.getAudioTracks())).connect(dest);
        if (mic) ctx.createMediaStreamSource(mic).connect(dest);
        audioTrack = dest.stream.getAudioTracks()[0];
      }
      const tracks = [display.getVideoTracks()[0]];
      if (audioTrack) tracks.push(audioTrack); else if (display.getAudioTracks()[0]) tracks.push(display.getAudioTracks()[0]);
      const combined = new MediaStream(tracks);
      streamsRef.current = [display, mic].filter(Boolean);
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
      const rec = new MediaRecorder(combined, { mimeType: mime });
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
      setTimeout(() => setErr(''), 4000);
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
