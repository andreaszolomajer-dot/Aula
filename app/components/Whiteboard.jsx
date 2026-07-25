'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

const enc = new TextEncoder();
const dec = new TextDecoder();
const BOARD_BG = '#FFFFFF';
const COLORS = ['#1B2330', '#F2555A', '#2F6BFF', '#1FA97A', '#F5A742', '#8B5CF6'];
const SIZES = [2, 4, 8];

export default function Whiteboard() {
  const room = useRoomContext();
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState('#1B2330');
  const [size, setSize] = useState(4);
  const [eraser, setEraser] = useState(false);

  const canvasRef = useRef(null);
  const strokesRef = useRef([]); // {id,color,size,eraser,pts:[{x,y}]}
  const drawingId = useRef(null);
  const toolRef = useRef({ color, size, eraser });
  toolRef.current = { color, size, eraser };

  const publish = useCallback(
    (msg) => {
      const lp = room?.localParticipant;
      if (!lp) return;
      try {
        lp.publishData(enc.encode(JSON.stringify(msg)), { reliable: true, topic: 'whiteboard' });
      } catch (e) {}
    },
    [room]
  );

  const getStroke = (id) => strokesRef.current.find((s) => s.id === id);

  const drawSeg = (stroke, from, to) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.strokeStyle = stroke.eraser ? BOARD_BG : stroke.color;
    ctx.lineWidth = stroke.size * (stroke.eraser ? 3 : 1);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x * c.width, from.y * c.height);
    ctx.lineTo(to.x * c.width, to.y * c.height);
    ctx.stroke();
  };

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.fillStyle = BOARD_BG;
    ctx.fillRect(0, 0, c.width, c.height);
    for (const s of strokesRef.current) {
      for (let i = 1; i < s.pts.length; i++) drawSeg(s, s.pts[i - 1], s.pts[i]);
    }
  }, []);

  const sizeCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    c.width = Math.max(1, Math.floor(rect.width));
    c.height = Math.max(1, Math.floor(rect.height));
    redraw();
  }, [redraw]);

  // ---- Receive ----
  useEffect(() => {
    if (!room) return;
    const handler = (payload, _p, _k, topic) => {
      if (topic !== 'whiteboard') return;
      let m;
      try { m = JSON.parse(dec.decode(payload)); } catch { return; }
      if (m.t === 'start') {
        strokesRef.current.push({ id: m.id, color: m.color, size: m.size, eraser: m.eraser, pts: [{ x: m.x, y: m.y }] });
      } else if (m.t === 'point') {
        let s = getStroke(m.id);
        if (!s) { s = { id: m.id, color: '#1B2330', size: 4, eraser: false, pts: [] }; strokesRef.current.push(s); }
        const prev = s.pts[s.pts.length - 1];
        s.pts.push({ x: m.x, y: m.y });
        if (prev && open) drawSeg(s, prev, { x: m.x, y: m.y });
      } else if (m.t === 'clear') {
        strokesRef.current = [];
        if (open) redraw();
      } else if (m.t === 'req') {
        if (strokesRef.current.length) {
          setTimeout(() => publish({ t: 'state', strokes: strokesRef.current }), 200 + Math.random() * 400);
        }
      } else if (m.t === 'state') {
        if (strokesRef.current.length < (m.strokes?.length || 0)) {
          strokesRef.current = m.strokes;
          if (open) redraw();
        }
      }
    };
    room.on(RoomEvent.DataReceived, handler);
    return () => room.off(RoomEvent.DataReceived, handler);
  }, [room, open, redraw, publish]);

  // ---- On open: size + request current state ----
  useEffect(() => {
    if (!open) return;
    sizeCanvas();
    publish({ t: 'req' });
    const onResize = () => sizeCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, sizeCanvas, publish]);

  // ---- Pointer drawing ----
  const norm = (e) => {
    const c = canvasRef.current;
    const rect = c.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  };

  const onDown = (e) => {
    const p = norm(e);
    const id = Math.random().toString(36).slice(2);
    drawingId.current = id;
    const t = toolRef.current;
    const stroke = { id, color: t.color, size: t.size, eraser: t.eraser, pts: [p] };
    strokesRef.current.push(stroke);
    publish({ t: 'start', id, color: t.color, size: t.size, eraser: t.eraser, x: p.x, y: p.y });
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!drawingId.current) return;
    const s = getStroke(drawingId.current);
    if (!s) return;
    const p = norm(e);
    const prev = s.pts[s.pts.length - 1];
    if (prev) {
      const d = Math.hypot(p.x - prev.x, p.y - prev.y);
      if (d < 0.003) return; // skip micro-moves
      drawSeg(s, prev, p);
    }
    s.pts.push(p);
    publish({ t: 'point', id: s.id, x: p.x, y: p.y });
  };
  const onUp = () => { drawingId.current = null; };

  const clearBoard = () => {
    strokesRef.current = [];
    redraw();
    publish({ t: 'clear' });
  };

  return (
    <>
      {!open && (
        <button className="wb-toggle" onClick={() => setOpen(true)}>🖊 Tablă</button>
      )}

      {open && (
        <div className="wb-stage">
          <div className="wb-toolbar">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`wb-color ${color === c && !eraser ? 'on' : ''}`}
                style={{ background: c }}
                onClick={() => { setColor(c); setEraser(false); }}
              />
            ))}
            <span className="wb-div" />
            {SIZES.map((s) => (
              <button
                key={s}
                className={`wb-size ${size === s ? 'on' : ''}`}
                onClick={() => setSize(s)}
              >
                <span style={{ width: s + 4, height: s + 4 }} />
              </button>
            ))}
            <span className="wb-div" />
            <button className={`wb-tool ${eraser ? 'on' : ''}`} onClick={() => setEraser((v) => !v)}>Radieră</button>
            <button className="wb-tool" onClick={clearBoard}>Șterge tot</button>
            <button className="wb-tool close" onClick={() => setOpen(false)}>✕ Închide</button>
          </div>
          <div className="wb-board">
            <canvas
              ref={canvasRef}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerLeave={onUp}
            />
          </div>
        </div>
      )}
    </>
  );
}
