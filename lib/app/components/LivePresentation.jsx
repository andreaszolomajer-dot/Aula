'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { THEMES, SlideView } from './SlideView';
import PdfSlide from './PdfSlide';
import { authedFetch } from '../../lib/api';
import { useTools } from './ToolsProvider';
import { useT } from './LangProvider';

const enc = new TextEncoder();
const dec = new TextDecoder();

export default function LivePresentation() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const { activeTool, setActiveTool } = useTools();
  const { t } = useT();
  const username = localParticipant?.name || 'Prezentator';

  const [picker, setPicker] = useState(false);
  const [list, setList] = useState([]);
  const [role, setRole] = useState('none'); // 'presenter' | 'viewer' | 'none'
  const [mode, setMode] = useState('deck'); // 'deck' | 'pdf'
  const [presenterName, setPresenterName] = useState('');
  const [hidden, setHidden] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  // deck mode
  const [deck, setDeck] = useState(null);
  const [index, setIndex] = useState(0);
  // pdf mode
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfPages, setPdfPages] = useState(1);

  const fileRef = useRef(null);

  const roleRef = useRef(role);
  const modeRef = useRef(mode);
  const deckRef = useRef(deck);
  const indexRef = useRef(index);
  const pdfUrlRef = useRef(pdfUrl);
  const pdfPageRef = useRef(pdfPage);
  const pdfPagesRef = useRef(pdfPages);
  roleRef.current = role;
  modeRef.current = mode;
  deckRef.current = deck;
  indexRef.current = index;
  pdfUrlRef.current = pdfUrl;
  pdfPageRef.current = pdfPage;
  pdfPagesRef.current = pdfPages;

  const broadcast = useCallback(
    (state) => {
      if (!localParticipant) return;
      try {
        localParticipant.publishData(enc.encode(JSON.stringify(state)), {
          reliable: true,
          topic: 'present',
        });
      } catch (e) {}
    },
    [localParticipant]
  );

  const sendCurrent = useCallback(() => {
    if (modeRef.current === 'pdf') {
      broadcast({ presenting: true, mode: 'pdf', url: pdfUrlRef.current, page: pdfPageRef.current, by: username });
    } else {
      broadcast({ presenting: true, mode: 'deck', deck: deckRef.current, index: indexRef.current, by: username });
    }
  }, [broadcast, username]);

  // ---- Receive (viewers) ----
  useEffect(() => {
    if (!room) return;
    const handler = (payload, participant, _k, topic) => {
      if (topic !== 'present') return;
      if (roleRef.current === 'presenter') return;
      let data;
      try {
        data = JSON.parse(dec.decode(payload));
      } catch {
        return;
      }
      if (data.presenting) {
        setRole('viewer');
        setPresenterName(data.by || '');
        setHidden(false);
        if (data.mode === 'pdf') {
          setMode('pdf');
          setPdfUrl(data.url || '');
          setPdfPage(data.page || 1);
        } else {
          setMode('deck');
          setDeck(data.deck || null);
          setIndex(data.index || 0);
        }
      } else {
        setRole('none');
        setDeck(null);
        setPdfUrl('');
      }
    };
    room.on(RoomEvent.DataReceived, handler);
    return () => room.off(RoomEvent.DataReceived, handler);
  }, [room]);

  // ---- Presenter heartbeat ----
  useEffect(() => {
    if (role !== 'presenter') return;
    const t = setInterval(sendCurrent, 4000);
    return () => clearInterval(t);
  }, [role, sendCurrent]);

  const openPicker = async () => {
    setErr('');
    setPicker(true);
    try {
      const r = await authedFetch('/api/presentations');
      const d = await r.json();
      setList(d.items || []);
    } catch (e) {}
  };

  const startDeck = async (id) => {
    try {
      const r = await authedFetch(`/api/presentations?id=${id}`);
      const d = await r.json();
      const dk = d.item?.data;
      if (dk?.slides?.length) {
        setMode('deck'); modeRef.current = 'deck';
        setDeck(dk); deckRef.current = dk;
        setIndex(0); indexRef.current = 0;
        setRole('presenter'); setPicker(false);
        broadcast({ presenting: true, mode: 'deck', deck: dk, index: 0, by: username });
      }
    } catch (e) {}
  };

  const onPdfFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/upload-pdf', { method: 'POST', body: fd });
      const d = await r.json();
      if (d.url) {
        setMode('pdf'); modeRef.current = 'pdf';
        setPdfUrl(d.url); pdfUrlRef.current = d.url;
        setPdfPage(1); pdfPageRef.current = 1;
        setRole('presenter'); setPicker(false);
        broadcast({ presenting: true, mode: 'pdf', url: d.url, page: 1, by: username });
      } else {
        setErr(d.error || t('lpFail'));
      }
    } catch (e) {
      setErr(t('lpFail'));
    }
    setUploading(false);
    e.target.value = '';
  };

  const navDeck = useCallback(
    (dir) => {
      const len = deckRef.current?.slides?.length || 1;
      const ni = Math.min(Math.max(0, indexRef.current + dir), len - 1);
      indexRef.current = ni; setIndex(ni);
      broadcast({ presenting: true, mode: 'deck', deck: deckRef.current, index: ni, by: username });
    },
    [broadcast, username]
  );

  const navPdf = useCallback(
    (dir) => {
      const total = pdfPagesRef.current || 1;
      const np = Math.min(Math.max(1, pdfPageRef.current + dir), total);
      pdfPageRef.current = np; setPdfPage(np);
      broadcast({ presenting: true, mode: 'pdf', url: pdfUrlRef.current, page: np, by: username });
    },
    [broadcast, username]
  );

  const nav = useCallback((dir) => (modeRef.current === 'pdf' ? navPdf(dir) : navDeck(dir)), [navPdf, navDeck]);

  const stop = useCallback(() => {
    broadcast({ presenting: false });
    setRole('none');
    setDeck(null);
    setPdfUrl('');
  }, [broadcast]);

  // ---- Presenter keyboard ----
  useEffect(() => {
    if (role !== 'presenter') return;
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nav(1);
      if (e.key === 'ArrowLeft') nav(-1);
      if (e.key === 'Escape') stop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [role, nav, stop]);

  useEffect(() => {
    if (activeTool === 'prezinta' && role === 'none') {
      openPicker();
      setActiveTool(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool]);

  const onPdfPages = useCallback((n) => setPdfPages(n), []);

  const theme = deck ? THEMES[deck.theme] || THEMES[0] : THEMES[0];
  const deckSlide = deck?.slides?.[index];
  const live =
    (role === 'presenter' || role === 'viewer') &&
    (mode === 'pdf' ? !!pdfUrl : !!deckSlide);

  const total = mode === 'pdf' ? pdfPages : deck?.slides?.length || 1;
  const pos = mode === 'pdf' ? pdfPage : index + 1;

  return (
    <>
      {picker && (
        <div className="lp-picker-overlay" onClick={() => setPicker(false)}>
          <div className="lp-picker" onClick={(e) => e.stopPropagation()}>
            <h3>{t('lpTitle')}</h3>

            <button className="lp-pdf" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? t('lpUploading') : t('lpUploadPdf')}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              onChange={onPdfFile}
              style={{ display: 'none' }}
            />
            {err && <p className="lp-muted" style={{ color: '#F5A742' }}>{err}</p>}

            <div className="lp-sep">{t('lpSaved')}</div>

            {list.length === 0 && (
              <p className="lp-muted">{t('lpNone')}</p>
            )}
            {list.map((p) => (
              <button key={p.id} className="lp-item" onClick={() => startDeck(p.id)}>
                {p.title}
              </button>
            ))}
            <button className="lp-cancel" onClick={() => setPicker(false)}>
              Anulează
            </button>
          </div>
        </div>
      )}

      {live && role === 'viewer' && hidden && (
        <button className="lp-trigger" onClick={() => setHidden(false)}>
          📽 Arată prezentarea
        </button>
      )}

      {live && !(role === 'viewer' && hidden) && (
        <div className="lp-stage">
          <div
            className="lp-slide"
            style={mode === 'pdf' ? { background: '#000' } : { background: theme.bg, color: theme.text }}
          >
            {mode === 'pdf' ? (
              <PdfSlide url={pdfUrl} page={pdfPage} onPages={onPdfPages} />
            ) : (
              <SlideView slide={deckSlide} theme={theme} />
            )}
          </div>
          <div className="lp-bar">
            {role === 'presenter' ? (
              <>
                <button onClick={() => nav(-1)}>‹</button>
                <span>{pos} / {total}</span>
                <button onClick={() => nav(1)}>›</button>
                <button className="lp-stop" onClick={stop}>{t('lpStop')}</button>
              </>
            ) : (
              <>
                <span className="lp-live">● LIVE · {presenterName}</span>
                <span>{pos} / {total}</span>
                <button onClick={() => setHidden(true)}>Ascunde</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
