'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRoomContext, useLocalParticipant, useParticipants } from '@livekit/components-react';

export default function HostControls() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();

  const roomName = room?.name || '';
  const myId = localParticipant?.identity || '';
  const myName = localParticipant?.name || 'Gazdă';

  const [isHost, setIsHost] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState('');

  const post = useCallback(
    async (action, extra = {}) => {
      try {
        const res = await fetch('/api/host', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room: roomName, identity: myId, name: myName, action, ...extra }),
        });
        return await res.json();
      } catch (e) {
        return { error: 'Eroare de rețea.' };
      }
    },
    [roomName, myId, myName]
  );

  // Revendică gazda la intrare
  useEffect(() => {
    if (!roomName || !myId) return;
    (async () => {
      const d = await post('claim');
      setIsHost(d.host_identity === myId);
    })();
  }, [roomName, myId, post]);

  if (!isHost) return null;

  const others = participants.filter((p) => p.identity !== myId);

  const muteAll = async () => {
    setBusy('all');
    await post('muteAll');
    setBusy('');
  };
  const muteOne = async (target) => {
    setBusy(target);
    await post('mute', { target });
    setBusy('');
  };
  const removeOne = async (target) => {
    if (!confirm('Scoți acest participant din ședință?')) return;
    setBusy(target);
    await post('remove', { target });
    setBusy('');
  };

  return (
    <div className="hc-control">
      {!open && (
        <button className="hc-toggle" onClick={() => setOpen(true)}>🛡 Gazdă</button>
      )}
      {open && (
        <div className="hc-panel">
          <div className="hc-head">
            Controale gazdă
            <button className="hc-x" onClick={() => setOpen(false)}>✕</button>
          </div>
          <button className="hc-muteall" onClick={muteAll} disabled={busy === 'all'}>
            🔇 {busy === 'all' ? 'Se aplică…' : 'Oprește microfonul tuturor'}
          </button>
          <div className="hc-list">
            {others.length === 0 && <p className="hc-muted">Niciun alt participant.</p>}
            {others.map((p) => (
              <div key={p.identity} className="hc-row">
                <span className="hc-name">{p.name || p.identity}</span>
                <button onClick={() => muteOne(p.identity)} disabled={busy === p.identity}>Mute</button>
                <button className="hc-remove" onClick={() => removeOne(p.identity)} disabled={busy === p.identity}>
                  Scoate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
