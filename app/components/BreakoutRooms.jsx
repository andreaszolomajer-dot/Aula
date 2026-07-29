'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { useRouter } from 'next/navigation';
import { useTools } from './ToolsProvider';
import { useT } from './LangProvider';

export default function BreakoutRooms() {
  const room = useRoomContext();
  const router = useRouter();
  const { activeTool, setActiveTool } = useTools();
  const { t } = useT();
  const open = activeTool === 'camere';

  const roomName = room?.name || '';
  const username = room?.localParticipant?.name || 'Invitat';
  const isBreakout = roomName.includes('--');
  const main = isBreakout ? roomName.split('--')[0] : roomName;
  const currentSlug = isBreakout ? roomName.split('--').slice(1).join('--') : null;

  const [rooms, setRooms] = useState([]);
  const [configured, setConfigured] = useState(true);
  const [name, setName] = useState('');
  const joinedAt = useRef(Date.now());

  const goTo = (target) => router.push(`/room/${encodeURIComponent(target)}?username=${encodeURIComponent(username)}`);

  const load = useCallback(async () => {
    if (!main) return;
    try {
      const r = await fetch(`/api/breakouts?main=${encodeURIComponent(main)}`);
      const d = await r.json();
      setRooms(d.rooms || []);
      setConfigured(d.configured !== false);
      if (isBreakout && d.recall_at && d.recall_at > joinedAt.current) goTo(main);
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [main, isBreakout]);

  useEffect(() => { load(); const tm = setInterval(load, 4000); return () => clearInterval(tm); }, [load]);

  const create = async () => {
    if (!name.trim()) return;
    await fetch('/api/breakouts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ main, action: 'create', name: name.trim() }) });
    setName(''); load();
  };
  const del = async (slug) => { await fetch('/api/breakouts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ main, action: 'delete', slug }) }); load(); };
  const recall = async () => { await fetch('/api/breakouts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ main, action: 'recall' }) }); };

  if (!open) return null;

  return (
    <div className="panel-float panel-right">
      <div className="panel-head">{t('brTitle')}<button className="panel-x" onClick={() => setActiveTool(null)}>✕</button></div>
      {isBreakout && <button className="br-main" onClick={() => goTo(main)}>{t('brBack')}</button>}
      {!configured && <p className="br-muted">{t('brNeedDb')}</p>}
      {configured && rooms.length === 0 && <p className="br-muted">{t('brNone')}</p>}
      {rooms.map((r) => (
        <div key={r.slug} className="br-item">
          <span className="br-name">{r.name}</span>
          {currentSlug === r.slug ? <span className="br-here">{t('brHere')}</span> : <button className="br-join" onClick={() => goTo(`${main}--${r.slug}`)}>{t('brJoin')}</button>}
          <button className="br-del" onClick={() => del(r.slug)}>✕</button>
        </div>
      ))}
      {configured && (
        <>
          <div className="br-create">
            <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} placeholder={t('brNamePh')} />
            <button onClick={create}>+</button>
          </div>
          <button className="br-recall" onClick={recall}>{t('brRecall')}</button>
        </>
      )}
    </div>
  );
}
