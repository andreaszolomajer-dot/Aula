'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { useTools } from './ToolsProvider';

const enc = new TextEncoder();
const dec = new TextDecoder();
const EMOJIS = ['👍', '❤️', '😂', '🎉', '👏', '🔥'];

export default function Reactions() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const { activeTool } = useTools();
  const open = activeTool === 'reactii';
  const myName = localParticipant?.name || 'Tu';
  const myId = localParticipant?.identity || 'me';

  const [floats, setFloats] = useState([]);
  const [hands, setHands] = useState({});
  const [myHand, setMyHand] = useState(false);

  const spawn = useCallback((emoji) => {
    const id = Math.random().toString(36).slice(2);
    const x = 6 + Math.random() * 30;
    setFloats((f) => [...f, { id, emoji, x }]);
    setTimeout(() => setFloats((f) => f.filter((it) => it.id !== id)), 2600);
  }, []);

  const send = useCallback((payload, reliable) => {
    if (!localParticipant) return;
    try { localParticipant.publishData(enc.encode(JSON.stringify(payload)), { reliable, topic: 'reactions' }); } catch (e) {}
  }, [localParticipant]);

  useEffect(() => {
    if (!room) return;
    const handler = (payload, participant, _k, topic) => {
      if (topic !== 'reactions') return;
      let data; try { data = JSON.parse(dec.decode(payload)); } catch { return; }
      if (data.kind === 'emoji') spawn(data.emoji);
      if (data.kind === 'hand') {
        const id = participant?.identity || 'x';
        const name = participant?.name || 'Cineva';
        setHands((h) => { const next = { ...h }; if (data.raised) next[id] = name; else delete next[id]; return next; });
      }
    };
    room.on(RoomEvent.DataReceived, handler);
    return () => room.off(RoomEvent.DataReceived, handler);
  }, [room, spawn]);

  const react = (emoji) => { spawn(emoji); send({ kind: 'emoji', emoji }, false); };
  const toggleHand = () => {
    const raised = !myHand;
    setMyHand(raised);
    setHands((h) => { const next = { ...h }; if (raised) next[myId] = myName; else delete next[myId]; return next; });
    send({ kind: 'hand', raised, name: myName }, true);
  };

  const handNames = Object.values(hands);

  return (
    <>
      <div className="rx-floats">
        {floats.map((f) => (
          <span key={f.id} className="rx-float" style={{ left: `${f.x}%` }}>{f.emoji}</span>
        ))}
      </div>

      {(open || handNames.length > 0) && (
        <div className="rx-stack">
          {handNames.length > 0 && (
            <div className="rx-hands">✋ {handNames.slice(0, 3).join(', ')}{handNames.length > 3 ? ` +${handNames.length - 3}` : ''}</div>
          )}
          {open && (
            <div className="rx-bar">
              {EMOJIS.map((e) => (<button key={e} onClick={() => react(e)} className="rx-emoji">{e}</button>))}
              <button className={`rx-hand ${myHand ? 'on' : ''}`} onClick={toggleHand} title="Ridică mâna">✋</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
