'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { useRouter } from 'next/navigation';

export default function BreakoutRooms() {
  const room = useRoomContext();
  const router = useRouter();

  const roomName = room?.name || '';
  const username = room?.localParticipant?.name || 'Invitat';
  const isBreakout = roomName.includes('--');
  const main = isBreakout ? roomName.split('--')[0] : roomName;
  const currentSlug = isBreakout ? roomName.split('--').slice(1).join('--') : null;

  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [configured, setConfigured] = useState(true);
  const [name, setName] = useState('');
  const joinedAt = useRef(Date.now());

  const goTo = (target) =>
    router.push(`/room/${encodeURIComponent(target)}?username=${encodeURIComponent(username)}`);

  const load = useCallback(async () => {
    if (!main) return;
    try {
      const r = await fetch(`/api/breakouts?main=${encodeURIComponent(main)}`);
      const d = await r.json();
      setRooms(d.rooms || []);
      setConfigured(d.configured !== false);
      // Dacă gazda a chemat pe toți înapoi și eu sunt într-o cameră separată → revin
      if (isBreakout && d.recall_at && d.recall_at > joinedAt.current) {
        goTo(main);
      }
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [main, isBreakout]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  const create = async () => {
    if (!name.trim()) return;
    await fetch('/api/breakouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ main, action: 'create', name: name.trim() }),
    });
    setName('');
    load();
  };
  const del = async (slug) => {
    await fetch('/api/breakouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ main, action: 'delete', slug }),
    });
    load();
  };
  const recall = async () => {
    await fetch('/api/breakouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ main, action: 'recall' }),
    });
  };

  return (
    <div className="br-control">
      <button className="br-toggle" onClick={() => setOpen((v) => !v)}>
        🚪 Camere{rooms.length ? ` (${rooms.length})` : ''}
      </button>

      {open && (
        <div className="br-panel">
          {isBreakout && (
            <button className="br-main" onClick={() => goTo(main)}>
              ← Înapoi în sala principală
            </button>
          )}

          <div className="br-head">Camere separate</div>

          {!configured && (
            <p className="br-muted">
              Necesită Supabase configurat (vezi README). Coordonează cine intră unde.
            </p>
          )}

          {configured && rooms.length === 0 && (
            <p className="br-muted">Nicio cameră separată încă. Creează una mai jos.</p>
          )}

          {rooms.map((r) => (
            <div key={r.slug} className="br-item">
              <span className="br-name">{r.name}</span>
              {currentSlug === r.slug ? (
                <span className="br-here">Ești aici</span>
              ) : (
                <button className="br-join" onClick={() => goTo(`${main}--${r.slug}`)}>
                  Intră
                </button>
              )}
              <button className="br-del" onClick={() => del(r.slug)} title="Șterge">
                ✕
              </button>
            </div>
          ))}

          {configured && (
            <>
              <div className="br-create">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && create()}
                  placeholder="Nume grup (ex. Echipa A)"
                />
                <button onClick={create}>+</button>
              </div>
              <button className="br-recall" onClick={recall}>
                📣 Cheamă pe toți în sala principală
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
