'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRoomContext, useLocalParticipant, useParticipants } from '@livekit/components-react';
import { useTools } from './ToolsProvider';

export default function HostControls() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const { activeTool, setActiveTool } = useTools();
  const open = activeTool === 'gazda';

  const roomName = room?.name || '';
  const myId = localParticipant?.identity || '';
  const myName = localParticipant?.name || 'Gazdă';

  const [isHost, setIsHost] = useState(false);
  const [lobby, setLobby] = useState(false);
  const [webinar, setWebinar] = useState(false);
  const [waitingList, setWaitingList] = useState([]);
  const [busy, setBusy] = useState('');

  const post = useCallback(async (action, extra = {}) => {
    try {
      const res = await fetch('/api/host', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room: roomName, identity: myId, name: myName, action, ...extra }) });
      return await res.json();
    } catch (e) { return { error: 'Eroare de rețea.' }; }
  }, [roomName, myId, myName]);

  useEffect(() => {
    if (!roomName || !myId) return;
    (async () => {
      const d = await post('status');
      setIsHost(d.host_identity === myId);
      setLobby(!!d.lobby);
      setWebinar(!!d.webinar);
    })();
  }, [roomName, myId, post]);

  // Reîmprospătează lista de așteptare când e gazdă cu sala pornită
  useEffect(() => {
    if (!isHost || !lobby) return;
    let t;
    const load = async () => { const d = await post('lobbyList'); setWaitingList(d.waiting || []); };
    load();
    t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [isHost, lobby, post]);

  if (!open) return null;

  const others = participants.filter((p) => p.identity !== myId);

  const setMode = async (nextLobby, nextWebinar) => {
    setLobby(nextLobby); setWebinar(nextWebinar);
    await post('setMode', { lobby: nextLobby, webinar: nextWebinar });
  };
  const admit = async (target) => { setBusy(target); await post('admit', { target }); setWaitingList((w) => w.filter((x) => x.identity !== target)); setBusy(''); };
  const muteAll = async () => { setBusy('all'); await post('muteAll'); setBusy(''); };
  const muteOne = async (target) => { setBusy(target); await post('mute', { target }); setBusy(''); };
  const removeOne = async (target) => { if (!confirm('Scoți acest participant din ședință?')) return; setBusy(target); await post('remove', { target }); setBusy(''); };

  return (
    <div className="panel-float panel-left">
      <div className="panel-head">
        Controale gazdă
        <button className="panel-x" onClick={() => setActiveTool(null)}>✕</button>
      </div>

      {!isHost ? (
        <p className="hc-muted">Doar gazda ședinței are aceste controale. Gazda este prima persoană care a intrat.</p>
      ) : (
        <>
          <div className="hc-modes">
            <label className="hc-toggle">
              <input type="checkbox" checked={lobby} onChange={(e) => setMode(e.target.checked, webinar)} />
              <span><b>Sală de așteptare</b><br /><small>Admiți tu pe fiecare (consultații, curs plătit)</small></span>
            </label>
            <label className="hc-toggle">
              <input type="checkbox" checked={webinar} onChange={(e) => setMode(lobby, e.target.checked)} />
              <span><b>Mod webinar</b><br /><small>Participanții doar ascultă; doar tu vorbești</small></span>
            </label>
          </div>

          {lobby && (
            <div className="hc-wait">
              <div className="hc-sub">În așteptare ({waitingList.length})</div>
              {waitingList.length === 0 && <p className="hc-muted">Nimeni nu așteaptă.</p>}
              {waitingList.map((w) => (
                <div key={w.identity} className="hc-row">
                  <span className="hc-name">{w.name}</span>
                  <button className="hc-admit" onClick={() => admit(w.identity)} disabled={busy === w.identity}>Admite</button>
                </div>
              ))}
            </div>
          )}

          <button className="hc-muteall" onClick={muteAll} disabled={busy === 'all'}>🔇 {busy === 'all' ? 'Se aplică…' : 'Oprește microfonul tuturor'}</button>
          <div className="hc-list">
            <div className="hc-sub">Participanți</div>
            {others.length === 0 && <p className="hc-muted">Niciun alt participant.</p>}
            {others.map((p) => (
              <div key={p.identity} className="hc-row">
                <span className="hc-name">{p.name || p.identity}</span>
                <button onClick={() => muteOne(p.identity)} disabled={busy === p.identity}>Mute</button>
                <button className="hc-remove" onClick={() => removeOne(p.identity)} disabled={busy === p.identity}>Scoate</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
