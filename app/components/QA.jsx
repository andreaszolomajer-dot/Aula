'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { useTools } from './ToolsProvider';

const enc = new TextEncoder();
const dec = new TextDecoder();

export default function QA() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const { activeTool, setActiveTool } = useTools();
  const open = activeTool === 'qa';
  const myName = localParticipant?.name || 'Anonim';
  const myId = localParticipant?.identity || 'me';

  const [questions, setQuestions] = useState([]);
  const [text, setText] = useState('');
  const qRef = useRef(questions);
  qRef.current = questions;

  const publish = useCallback((msg) => {
    const lp = room?.localParticipant;
    if (!lp) return;
    try { lp.publishData(enc.encode(JSON.stringify(msg)), { reliable: true, topic: 'qa' }); } catch (e) {}
  }, [room]);

  useEffect(() => {
    if (!room) return;
    const handler = (payload, _p, _k, topic) => {
      if (topic !== 'qa') return;
      let m; try { m = JSON.parse(dec.decode(payload)); } catch { return; }
      if (m.t === 'q') {
        setQuestions((qs) => (qs.some((x) => x.id === m.id) ? qs : [...qs, { id: m.id, text: m.text, by: m.by, votes: {}, answered: false }]));
      } else if (m.t === 'v') {
        setQuestions((qs) => qs.map((q) => (q.id === m.id ? { ...q, votes: { ...q.votes, [m.voter]: 1 } } : q)));
      } else if (m.t === 'a') {
        setQuestions((qs) => qs.map((q) => (q.id === m.id ? { ...q, answered: !q.answered } : q)));
      } else if (m.t === 'req') {
        if (qRef.current.length) setTimeout(() => publish({ t: 'state', questions: qRef.current }), 200 + Math.random() * 300);
      } else if (m.t === 'state') {
        if (qRef.current.length < (m.questions?.length || 0)) setQuestions(m.questions);
      }
    };
    room.on(RoomEvent.DataReceived, handler);
    return () => room.off(RoomEvent.DataReceived, handler);
  }, [room, publish]);

  useEffect(() => { if (open) publish({ t: 'req' }); }, [open, publish]);

  const ask = () => {
    const v = text.trim();
    if (!v) return;
    const id = Math.random().toString(36).slice(2);
    setQuestions((qs) => [...qs, { id, text: v, by: myName, votes: {}, answered: false }]);
    publish({ t: 'q', id, text: v, by: myName });
    setText('');
  };
  const upvote = (id) => {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, votes: { ...q.votes, [myId]: 1 } } : q)));
    publish({ t: 'v', id, voter: myId });
  };
  const toggleAnswered = (id) => publish({ t: 'a', id });

  if (!open) return null;

  const sorted = [...questions].sort((a, b) => {
    if (a.answered !== b.answered) return a.answered ? 1 : -1;
    return Object.keys(b.votes).length - Object.keys(a.votes).length;
  });

  return (
    <div className="panel-float panel-right">
      <div className="panel-head">
        Întrebări (Q&A)
        <button className="panel-x" onClick={() => setActiveTool(null)}>✕</button>
      </div>
      <div className="qa-ask">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ask()} placeholder="Pune o întrebare…" />
        <button onClick={ask}>Trimite</button>
      </div>
      {sorted.length === 0 && <p className="br-muted">Nicio întrebare încă.</p>}
      {sorted.map((q) => (
        <div key={q.id} className={`qa-item ${q.answered ? 'done' : ''}`}>
          <button className="qa-vote" onClick={() => upvote(q.id)} title="Votează">▲ {Object.keys(q.votes).length}</button>
          <div className="qa-body">
            <div className="qa-text">{q.text}</div>
            <div className="qa-meta">{q.by}</div>
          </div>
          <button className="qa-done" onClick={() => toggleAnswered(q.id)} title="Marchează răspuns">{q.answered ? '↩' : '✓'}</button>
        </div>
      ))}
    </div>
  );
}
