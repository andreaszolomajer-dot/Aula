'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { useTools } from './ToolsProvider';
import { useT } from './LangProvider';

const enc = new TextEncoder();
const dec = new TextDecoder();
const BOARD_BG = '#FFFFFF';
const COLORS = ['#1B2330', '#F2555A', '#2F6BFF', '#1FA97A', '#F5A742', '#8B5CF6'];
const SIZES = [2, 4, 8];

export default function Whiteboard() {
  const room = useRoomContext();
  const { activeTool, setActiveTool } = useTools();
  const { t } = useT();
  const open = activeTool === 'tabla';

  const [color, setColor] = useState('#1B2330');
  const [size, setSize] = useState(4);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser' | 'text'
  const [textInput, setTextInput] = useState(null); // {nx, ny, left, top}
  const [textVal, setTextVal] = useState('');

  const canvasRef = useRef(null);
  const boardRef = useRef(null);
  const textInputRef = useRef(null);
  const itemsRef = useRef([]); // {kind:'stroke'|'text', ...}
  const drawingId = useRef(null);
  const toolRef = useRef({ color, size, tool });
  toolRef.current = { color, size, tool };

  const publish = useCallback(
    (msg) => {
      const lp = room?.localParticipant;
      if (!lp) return;
      try { lp.publishData(enc.encode(JSON.stringify(msg)), { reliable: true, topic: 'whiteboard' }); } catch (e) {}
    },
    [room]
  );

  const getStroke = (id) => itemsRef.current.find((s) => s.id === id && s.kind === 'stroke');

  const drawSeg = (stroke, from, to) => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d');
    ctx.strokeStyle = stroke.eraser ? BOARD_BG : stroke.color;
    ctx.lineWidth = stroke.size * (stroke.eraser ? 3 : 1);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x * c.width, from.y * c.height);
    ctx.lineTo(to.x * c.width, to.y * c.height);
    ctx.stroke();
  };

  const drawText = (item) => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d');
    const fpx = 14 + item.size * 3.2;
    ctx.fillStyle = item.color;
    ctx.font = `600 ${fpx}px Inter, system-ui, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(item.text, item.x * c.width, item.y * c.height);
  };

  const redraw = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d');
    ctx.fillStyle = BOARD_BG;
    ctx.fillRect(0, 0, c.width, c.height);
    for (const it of itemsRef.current) {
      if (it.kind === 'text') drawText(it);
      else for (let i = 1; i < it.pts.length; i++) drawSeg(it, it.pts[i - 1], it.pts[i]);
    }
  }, []);

  const sizeCanvas = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const rect = c.getBoundingClientRect();
    c.width = Math.max(1, Math.floor(rect.width));
    c.height = Math.max(1, Math.floor(rect.height));
    redraw();
  }, [redraw]);

  useEffect(() => {
    if (!room) return;
    const handler = (payload, _p, _k, topic) => {
      if (topic !== 'whiteboard') return;
      let m; try { m = JSON.parse(dec.decode(payload)); } catch { return; }
      if (m.t === 'start') {
        itemsRef.current.push({ kind: 'stroke', id: m.id, color: m.color, size: m.size, eraser: m.eraser, pts: [{ x: m.x, y: m.y }] });
      } else if (m.t === 'point') {
        let s = getStroke(m.id);
        if (!s) { s = { kind: 'stroke', id: m.id, color: '#1B2330', size: 4, eraser: false, pts: [] }; itemsRef.current.push(s); }
        const prev = s.pts[s.pts.length - 1];
        s.pts.push({ x: m.x, y: m.y });
        if (prev && open) drawSeg(s, prev, { x: m.x, y: m.y });
      } else if (m.t === 'text') {
        const it = { kind: 'text', id: m.id, color: m.color, size: m.size, x: m.x, y: m.y, text: m.text };
        itemsRef.current.push(it);
        if (open) drawText(it);
      } else if (m.t === 'clear') {
        itemsRef.current = []; if (open) redraw();
      } else if (m.t === 'req') {
        if (itemsRef.current.length) setTimeout(() => publish({ t: 'state', items: itemsRef.current }), 200 + Math.random() * 400);
      } else if (m.t === 'state') {
        if (itemsRef.current.length < (m.items?.length || 0)) { itemsRef.current = m.items; if (open) redraw(); }
      }
    };
    room.on(RoomEvent.DataReceived, handler);
    return () => room.off(RoomEvent.DataReceived, handler);
  }, [room, open, redraw, publish]);

  useEffect(() => {
    if (!open) return;
    sizeCanvas();
    publish({ t: 'req' });
    const onResize = () => sizeCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, sizeCanvas, publish]);

  useEffect(() => {
    if (textInput) {
      const id = setTimeout(() => textInputRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
  }, [textInput]);

  const norm = (e) => {
    const c = canvasRef.current;
    const rect = c.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
      px: e.clientX - rect.left,
      py: e.clientY - rect.top,
    };
  };

  const onDown = (e) => {
    if (toolRef.current.tool === 'text') {
      const p = norm(e);
      setTextInput({ nx: p.x, ny: p.y, left: p.px, top: p.py });
      setTextVal('');
      return;
    }
    const p = norm(e);
    const id = Math.random().toString(36).slice(2);
    drawingId.current = id;
    const t = toolRef.current;
    itemsRef.current.push({ kind: 'stroke', id, color: t.color, size: t.size, eraser: t.tool === 'eraser', pts: [{ x: p.x, y: p.y }] });
    publish({ t: 'start', id, color: t.color, size: t.size, eraser: t.tool === 'eraser', x: p.x, y: p.y });
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!drawingId.current) return;
    const s = getStroke(drawingId.current);
    if (!s) return;
    const p = norm(e);
    const prev = s.pts[s.pts.length - 1];
    if (prev) { if (Math.hypot(p.x - prev.x, p.y - prev.y) < 0.003) return; drawSeg(s, prev, p); }
    s.pts.push({ x: p.x, y: p.y });
    publish({ t: 'point', id: s.id, x: p.x, y: p.y });
  };
  const onUp = () => { drawingId.current = null; };

  const commitText = () => {
    const v = textVal.trim();
    if (v && textInput) {
      const id = Math.random().toString(36).slice(2);
      const it = { kind: 'text', id, color: toolRef.current.color, size: toolRef.current.size, x: textInput.nx, y: textInput.ny, text: v };
      itemsRef.current.push(it);
      drawText(it);
      publish({ t: 'text', id, color: it.color, size: it.size, x: it.x, y: it.y, text: v });
    }
    setTextInput(null); setTextVal('');
  };

  const clearBoard = () => { itemsRef.current = []; redraw(); publish({ t: 'clear' }); };

  if (!open) return null;

  return (
    <div className="wb-stage">
      <div className="wb-toolbar">
        {COLORS.map((c) => (
          <button key={c} className={`wb-color ${color === c ? 'on' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
        ))}
        <span className="wb-div" />
        {SIZES.map((s) => (
          <button key={s} className={`wb-size ${size === s ? 'on' : ''}`} onClick={() => setSize(s)}>
            <span style={{ width: s + 4, height: s + 4 }} />
          </button>
        ))}
        <span className="wb-div" />
        <button className={`wb-tool ${tool === 'pen' ? 'on' : ''}`} onClick={() => setTool('pen')}>{t('wbDraw')}</button>
        <button className={`wb-tool ${tool === 'text' ? 'on' : ''}`} onClick={() => setTool('text')}>{t('wbText')}</button>
        <button className={`wb-tool ${tool === 'eraser' ? 'on' : ''}`} onClick={() => setTool('eraser')}>{t('wbEraser')}</button>
        <button className="wb-tool" onClick={clearBoard}>{t('wbClear')}</button>
        <button className="wb-tool close" onClick={() => setActiveTool(null)}>{t('wbClose')}</button>
      </div>
      <div className="wb-board" ref={boardRef} style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          style={{ cursor: tool === 'text' ? 'text' : 'crosshair' }}
        />
        {textInput && (
          <div className="wb-textbox" style={{ left: textInput.left, top: textInput.top }}>
            <input
              ref={textInputRef}
              autoFocus
              value={textVal}
              onChange={(e) => setTextVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') commitText(); if (e.key === 'Escape') { setTextInput(null); setTextVal(''); } }}
              style={{ color, fontSize: 14 + size * 3.2 }}
              placeholder={t('wbWrite')}
            />
            <button className="wb-textok" onMouseDown={(e) => e.preventDefault()} onClick={commitText}>OK</button>
            <button className="wb-textcancel" onMouseDown={(e) => e.preventDefault()} onClick={() => { setTextInput(null); setTextVal(''); }}>✕</button>
          </div>
        )}
      </div>
    </div>
  );
}
