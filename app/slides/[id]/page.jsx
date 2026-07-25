'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { THEMES, SlideView } from '../../components/SlideView';
import { authedFetch } from '../../../lib/api';

const LAYOUTS = [
  { id: 'title', label: 'Titlu' },
  { id: 'content', label: 'Titlu + puncte' },
  { id: 'two-col', label: 'Două coloane' },
  { id: 'section', label: 'Secțiune' },
  { id: 'blank', label: 'Liber' },
];

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

function newSlide(layout = 'content') {
  return { id: uid(), layout, title: 'Titlu nou', content: 'Primul punct\nAl doilea punct', content2: '' };
}

function defaultDeck() {
  return {
    theme: 0,
    slides: [
      { id: uid(), layout: 'title', title: 'Titlul prezentării', content: 'Subtitlu sau autor', content2: '' },
      { id: uid(), layout: 'content', title: 'Agendă', content: 'Primul subiect\nAl doilea subiect\nAl treilea subiect', content2: '' },
    ],
  };
}

export default function Editor() {
  const params = useParams();
  const id = params.id;

  const [title, setTitle] = useState('Prezentare nouă');
  const [deck, setDeck] = useState(defaultDeck());
  const [cur, setCur] = useState(0);
  const [saved, setSaved] = useState('');
  const [presenting, setPresenting] = useState(false);
  const [loading, setLoading] = useState(true);

  const theme = THEMES[deck.theme] || THEMES[0];
  const slide = deck.slides[cur] || deck.slides[0];

  // ---- Load ----
  useEffect(() => {
    (async () => {
      try {
        const res = await authedFetch(`/api/presentations?id=${id}`);
        const data = await res.json();
        if (data.item) {
          setTitle(data.item.title || 'Prezentare');
          if (data.item.data?.slides) setDeck(data.item.data);
        }
      } catch (e) {}
      setLoading(false);
    })();
  }, [id]);

  // ---- Save ----
  const save = async () => {
    setSaved('saving');
    try {
      const res = await authedFetch('/api/presentations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title, data: deck }),
      });
      const d = await res.json();
      setSaved(d.error ? 'error' : 'ok');
    } catch (e) {
      setSaved('error');
    }
    setTimeout(() => setSaved(''), 2000);
  };

  // ---- Slide ops ----
  const updateSlide = (patch) => {
    setDeck((d) => {
      const slides = [...d.slides];
      slides[cur] = { ...slides[cur], ...patch };
      return { ...d, slides };
    });
  };
  const addSlide = () => {
    setDeck((d) => {
      const slides = [...d.slides];
      slides.splice(cur + 1, 0, newSlide());
      return { ...d, slides };
    });
    setCur((c) => c + 1);
  };
  const duplicateSlide = () => {
    setDeck((d) => {
      const slides = [...d.slides];
      slides.splice(cur + 1, 0, { ...slides[cur], id: uid() });
      return { ...d, slides };
    });
    setCur((c) => c + 1);
  };
  const deleteSlide = () => {
    if (deck.slides.length <= 1) return;
    setDeck((d) => {
      const slides = d.slides.filter((_, i) => i !== cur);
      return { ...d, slides };
    });
    setCur((c) => Math.max(0, c - 1));
  };
  const move = (dir) => {
    setDeck((d) => {
      const j = cur + dir;
      if (j < 0 || j >= d.slides.length) return d;
      const slides = [...d.slides];
      [slides[cur], slides[j]] = [slides[j], slides[cur]];
      return { ...d, slides };
    });
    setCur((c) => Math.min(Math.max(0, c + dir), deck.slides.length - 1));
  };

  // ---- Present mode keyboard ----
  const presentingRef = useRef(presenting);
  presentingRef.current = presenting;
  useEffect(() => {
    const onKey = (e) => {
      if (!presentingRef.current) return;
      if (e.key === 'ArrowRight' || e.key === ' ') setCur((c) => Math.min(c + 1, deck.slides.length - 1));
      if (e.key === 'ArrowLeft') setCur((c) => Math.max(c - 1, 0));
      if (e.key === 'Escape') setPresenting(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deck.slides.length]);

  if (loading) {
    return <div className="loading">Se încarcă editorul…</div>;
  }

  return (
    <div className="editor">
      {/* Top bar */}
      <div className="ed-top">
        <Link href="/slides" className="ed-back">← Prezentări</Link>
        <input className="ed-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="ed-top-actions">
          <select
            value={deck.theme}
            onChange={(e) => setDeck((d) => ({ ...d, theme: Number(e.target.value) }))}
            title="Temă"
          >
            {THEMES.map((t, i) => (
              <option key={t.name} value={i}>🎨 {t.name}</option>
            ))}
          </select>
          <button className="ed-btn" onClick={save}>
            {saved === 'saving' ? 'Se salvează…' : saved === 'ok' ? 'Salvat ✓' : saved === 'error' ? 'Eroare' : 'Salvează'}
          </button>
          <button className="ed-btn primary" onClick={() => setPresenting(true)}>▶ Prezintă</button>
        </div>
      </div>

      <div className="ed-body">
        {/* Thumbnails */}
        <div className="ed-rail">
          {deck.slides.map((s, i) => (
            <div
              key={s.id}
              className={`ed-thumb ${i === cur ? 'active' : ''}`}
              onClick={() => setCur(i)}
            >
              <span className="ed-thumb-n">{i + 1}</span>
              <div className="ed-thumb-canvas" style={{ background: theme.bg, color: theme.text }}>
                <SlideView slide={s} theme={theme} scale />
              </div>
            </div>
          ))}
          <button className="ed-add" onClick={addSlide}>+ Slide</button>
        </div>

        {/* Canvas + editing */}
        <div className="ed-main">
          <div className="ed-canvas-wrap">
            <div className="ed-canvas" style={{ background: theme.bg, color: theme.text }}>
              <SlideEditor slide={slide} theme={theme} onChange={updateSlide} />
            </div>
          </div>

          <div className="ed-toolbar">
            <select value={slide.layout} onChange={(e) => updateSlide({ layout: e.target.value })}>
              {LAYOUTS.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
            <button className="ed-btn" onClick={() => move(-1)}>↑ Sus</button>
            <button className="ed-btn" onClick={() => move(1)}>↓ Jos</button>
            <button className="ed-btn" onClick={duplicateSlide}>Duplică</button>
            <button className="ed-btn danger" onClick={deleteSlide} disabled={deck.slides.length <= 1}>
              Șterge slide
            </button>
          </div>
        </div>
      </div>

      {/* Present mode */}
      {presenting && (
        <div className="present" onClick={(e) => {
          const half = window.innerWidth / 2;
          if (e.clientX > half) setCur((c) => Math.min(c + 1, deck.slides.length - 1));
          else setCur((c) => Math.max(c - 1, 0));
        }}>
          <div className="present-slide" style={{ background: theme.bg, color: theme.text }}>
            <SlideView slide={slide} theme={theme} />
          </div>
          <div className="present-bar">
            <button onClick={(e) => { e.stopPropagation(); setCur((c) => Math.max(c - 1, 0)); }}>‹</button>
            <span>{cur + 1} / {deck.slides.length}</span>
            <button onClick={(e) => { e.stopPropagation(); setCur((c) => Math.min(c + 1, deck.slides.length - 1)); }}>›</button>
            <button onClick={(e) => { e.stopPropagation(); setPresenting(false); }}>✕ Ieși</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Slide editing (textareas on canvas) ---------- */
function SlideEditor({ slide, theme, onChange }) {
  const ta = (val, key, ph, style) => (
    <textarea
      value={val}
      placeholder={ph}
      onChange={(e) => onChange({ [key]: e.target.value })}
      style={{ color: theme.text, ...style }}
      className="sv-edit"
    />
  );

  if (slide.layout === 'title') {
    return (
      <div className="sv center">
        {ta(slide.title, 'title', 'Titlu', { fontSize: '2.6em', fontWeight: 700, textAlign: 'center' })}
        {ta(slide.content, 'content', 'Subtitlu', { fontSize: '1.2em', color: theme.sub, textAlign: 'center' })}
      </div>
    );
  }
  if (slide.layout === 'section') {
    return (
      <div className="sv center" style={{ background: theme.accent }}>
        {ta(slide.title, 'title', 'Titlu secțiune', { fontSize: '2.4em', fontWeight: 700, textAlign: 'center', color: '#fff' })}
      </div>
    );
  }
  if (slide.layout === 'two-col') {
    return (
      <div className="sv">
        {ta(slide.title, 'title', 'Titlu', { fontSize: '1.8em', fontWeight: 600, color: theme.accent })}
        <div className="sv-cols">
          {ta(slide.content, 'content', 'Coloana 1\n(o linie = un punct)', { fontSize: '1.05em' })}
          {ta(slide.content2, 'content2', 'Coloana 2', { fontSize: '1.05em' })}
        </div>
      </div>
    );
  }
  if (slide.layout === 'blank') {
    return (
      <div className="sv">
        {ta(slide.content, 'content', 'Text liber…', { fontSize: '1.2em', minHeight: '70%' })}
      </div>
    );
  }
  return (
    <div className="sv">
      {ta(slide.title, 'title', 'Titlu', { fontSize: '1.8em', fontWeight: 600, color: theme.accent })}
      {ta(slide.content, 'content', 'Un punct pe linie…', { fontSize: '1.15em', flex: 1 })}
    </div>
  );
}
