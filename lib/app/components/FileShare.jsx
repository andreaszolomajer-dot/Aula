'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { useTools } from './ToolsProvider';

const enc = new TextEncoder();
const dec = new TextDecoder();

export default function FileShare() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const { activeTool, setActiveTool } = useTools();
  const open = activeTool === 'fisiere';
  const myName = localParticipant?.name || 'Cineva';

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);
  const filesRef = useRef([]);
  filesRef.current = files;

  const publish = useCallback((msg) => {
    const lp = room?.localParticipant;
    if (!lp) return;
    try { lp.publishData(enc.encode(JSON.stringify(msg)), { reliable: true, topic: 'files' }); } catch (e) {}
  }, [room]);

  useEffect(() => {
    if (!room) return;
    const handler = (payload, _p, _k, topic) => {
      if (topic !== 'files') return;
      let m; try { m = JSON.parse(dec.decode(payload)); } catch { return; }
      if (m.t === 'file') {
        setFiles((f) => (f.some((x) => x.url === m.url) ? f : [...f, { name: m.name, url: m.url, by: m.by }]));
      } else if (m.t === 'req') {
        if (filesRef.current.length) setTimeout(() => publish({ t: 'state', files: filesRef.current }), 200 + Math.random() * 300);
      } else if (m.t === 'state') {
        if (filesRef.current.length < (m.files?.length || 0)) setFiles(m.files);
      }
    };
    room.on(RoomEvent.DataReceived, handler);
    return () => room.off(RoomEvent.DataReceived, handler);
  }, [room, publish]);

  useEffect(() => { if (open) publish({ t: 'req' }); }, [open, publish]);

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setErr('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/upload-file', { method: 'POST', body: fd });
      const d = await r.json();
      if (d.url) {
        setFiles((f) => [...f, { name: d.name, url: d.url, by: myName }]);
        publish({ t: 'file', name: d.name, url: d.url, by: myName });
      } else setErr(d.error || 'Încărcarea a eșuat.');
    } catch (e) { setErr('Încărcarea a eșuat.'); }
    setUploading(false);
    e.target.value = '';
  };

  if (!open) return null;

  return (
    <div className="panel-float panel-right">
      <div className="panel-head">
        Fișiere
        <button className="panel-x" onClick={() => setActiveTool(null)}>✕</button>
      </div>
      <button className="fs-upload" onClick={() => fileRef.current?.click()} disabled={uploading}>
        {uploading ? 'Se încarcă…' : '📎 Trimite un fișier'}
      </button>
      <input ref={fileRef} type="file" onChange={onUpload} style={{ display: 'none' }} />
      {err && <p className="br-muted" style={{ color: 'var(--warm, #F5A742)' }}>{err}</p>}
      {files.length === 0 && <p className="br-muted">Niciun fișier trimis încă.</p>}
      {files.map((f, i) => (
        <a key={i} className="fs-item" href={f.url} target="_blank" rel="noreferrer" download>
          <span className="fs-name">📄 {f.name}</span>
          <span className="fs-by">{f.by}</span>
        </a>
      ))}
    </div>
  );
}
