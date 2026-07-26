'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { useTools } from './ToolsProvider';

const enc = new TextEncoder();
const dec = new TextDecoder();

export default function Polls() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const { activeTool, setActiveTool } = useTools();
  const myId = localParticipant?.identity || 'me';

  const [poll, setPoll] = useState(null);
  const [votes, setVotes] = useState({});
  const [myVote, setMyVote] = useState(null);
  const [q, setQ] = useState('');
  const [opts, setOpts] = useState(['', '']);

  const creating = activeTool === 'sondaj' && !poll;

  const pollRef = useRef(poll);
  const votesRef = useRef(votes);
  pollRef.current = poll;
  votesRef.current = votes;

  const publish = useCallback((msg) => {
    const lp = room?.localParticipant;
    if (!lp) return;
    try { lp.publishData(enc.encode(JSON.stringify(msg)), { reliable: true, topic: 'poll' }); } catch (e) {}
  }, [room]);

  useEffect(() => {
    if (!room) return;
    const handler = (payload, participant, _k, topic) => {
      if (topic !== 'poll') return;
      let m; try { m = JSON.parse(dec.decode(payload)); } catch { return; }
      if (m.t === 'new') { setPoll({ id: m.id, q: m.q, options: m.options, by: m.by, closed: false }); setVotes({}); setMyVote(null); }
      else if (m.t === 'vote') { const voter = participant?.identity || m.voter || 'x'; setVotes((v) => ({ ...v, [voter]: m.option })); }
      else if (m.t === 'close') { setPoll((p) => (p && p.id === m.id ? { ...p, closed: true } : p)); }
      else if (m.t === 'end') { setPoll(null); }
      else if (m.t === 'req') { if (pollRef.current) setTimeout(() => publish({ t: 'state', poll: pollRef.current, votes: votesRef.current }), 200 + Math.random() * 300); }
      else if (m.t === 'state') { if (!pollRef.current && m.poll) { setPoll(m.poll); setVotes(m.votes || {}); } }
    };
    room.on(RoomEvent.DataReceived, handler);
    return () => room.off(RoomEvent.DataReceived, handler);
  }, [room, publish]);

  useEffect(() => { const t = setTimeout(() => publish({ t: 'req' }), 800); return () => clearTimeout(t); }, [publish]);

  const start = () => {
    const clean = opts.map((o) => o.trim()).filter(Boolean);
    if (!q.trim() || clean.length < 2) return;
    const id = Math.random().toString(36).slice(2);
    setPoll({ id, q: q.trim(), options: clean, by: myId, closed: false });
    setVotes({}); setMyVote(null);
    publish({ t: 'new', id, q: q.trim(), options: clean, by: myId });
    setQ(''); setOpts(['', '']); setActiveTool(null);
  };

  const vote = (i) => {
    if (myVote !== null || poll?.closed) return;
    setMyVote(i);
    setVotes((v) => ({ ...v, [myId]: i }));
    publish({ t: 'vote', id: poll.id, option: i, voter: myId });
  };

  const closePoll = () => publish({ t: 'close', id: poll.id });
  const endPoll = () => { publish({ t: 'end', id: poll.id }); setPoll(null); };

  const isCreator = poll && poll.by === myId;
  const counts = poll ? poll.options.map((_, i) => Object.values(votes).filter((x) => x === i).length) : [];
  const total = Object.keys(votes).length;
  const showResults = poll && (myVote !== null || poll.closed || isCreator);

  return (
    <>
      {creating && (
        <div className="pl-card">
          <div className="pl-head">Sondaj nou <button className="panel-x" onClick={() => setActiveTool(null)}>✕</button></div>
          <input className="pl-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Întrebarea ta" />
          {opts.map((o, i) => (
            <input key={i} className="pl-input" value={o} onChange={(e) => setOpts((a) => a.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`Opțiunea ${i + 1}`} />
          ))}
          {opts.length < 4 && (<button className="pl-add" onClick={() => setOpts((a) => [...a, ''])}>+ Opțiune</button>)}
          <div className="pl-row">
            <button className="pl-btn" onClick={() => setActiveTool(null)}>Anulează</button>
            <button className="pl-btn primary" onClick={start}>Pornește</button>
          </div>
        </div>
      )}

      {poll && (
        <div className="pl-card">
          <div className="pl-head">
            📊 {poll.closed ? 'Rezultate finale' : 'Sondaj'}
            {isCreator && (<button className="pl-x" onClick={endPoll} title="Închide">✕</button>)}
          </div>
          <div className="pl-q">{poll.q}</div>
          {poll.options.map((o, i) => {
            const c = counts[i] || 0;
            const pct = total ? Math.round((c / total) * 100) : 0;
            if (showResults) {
              return (
                <div key={i} className="pl-result">
                  <div className="pl-result-top"><span>{o}{myVote === i ? ' ✓' : ''}</span><span>{pct}%</span></div>
                  <div className="pl-bar"><div style={{ width: `${pct}%` }} /></div>
                </div>
              );
            }
            return (<button key={i} className="pl-opt" onClick={() => vote(i)}>{o}</button>);
          })}
          <div className="pl-foot">
            <span>{total} {total === 1 ? 'vot' : 'voturi'}</span>
            {isCreator && !poll.closed && (<button className="pl-close" onClick={closePoll}>Închide votul</button>)}
          </div>
        </div>
      )}
    </>
  );
}
