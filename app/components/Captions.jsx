'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

const LANGS = [
  { code: 'ro', bcp: 'ro-RO', label: '🇷🇴 Română' },
  { code: 'en', bcp: 'en-US', label: '🇬🇧 English' },
  { code: 'es', bcp: 'es-ES', label: '🇪🇸 Español' },
  { code: 'fr', bcp: 'fr-FR', label: '🇫🇷 Français' },
  { code: 'de', bcp: 'de-DE', label: '🇩🇪 Deutsch' },
  { code: 'hu', bcp: 'hu-HU', label: '🇭🇺 Magyar' },
  { code: 'it', bcp: 'it-IT', label: '🇮🇹 Italiano' },
];

const bcpFor = (code) => LANGS.find((l) => l.code === code)?.bcp || 'en-US';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function translate(text, source, target) {
  if (!text || source === target) return text;
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source, target }),
    });
    const d = await res.json();
    return d.text || text;
  } catch (e) {
    return text;
  }
}

export default function Captions() {
  const room = useRoomContext();
  const [on, setOn] = useState(false);
  const [myLang, setMyLang] = useState('ro'); // limba vorbită de mine
  const [showLang, setShowLang] = useState('ro'); // limba în care vreau să văd
  const [caption, setCaption] = useState(null); // { speaker, text }
  const [error, setError] = useState('');

  const recRef = useRef(null);
  const onRef = useRef(on);
  const showLangRef = useRef(showLang);
  const clearTimer = useRef(null);
  onRef.current = on;
  showLangRef.current = showLang;

  const showCaption = useCallback((speaker, text) => {
    setCaption({ speaker, text });
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => setCaption(null), 6000);
  }, []);

  const publish = useCallback(
    (payload) => {
      const lp = room?.localParticipant;
      if (!lp) return;
      try {
        lp.publishData(encoder.encode(JSON.stringify(payload)), {
          reliable: payload.final === true,
          topic: 'captions',
        });
      } catch (e) {
        /* ignoră */
      }
    },
    [room]
  );

  // ---- Primește subtitrări de la ceilalți ----
  useEffect(() => {
    if (!room) return;
    const handler = async (payload, participant, _kind, topic) => {
      if (topic && topic !== 'captions') return;
      let data;
      try {
        data = JSON.parse(decoder.decode(payload));
      } catch {
        return;
      }
      if (!data?.text) return;
      const speaker = participant?.name || participant?.identity || 'Cineva';
      const target = showLangRef.current;
      let text = data.text;
      if (data.final && data.lang && data.lang !== target) {
        text = await translate(data.text, data.lang, target);
      }
      showCaption(speaker, text);
    };
    room.on(RoomEvent.DataReceived, handler);
    return () => room.off(RoomEvent.DataReceived, handler);
  }, [room, showCaption]);

  // ---- Transcrie vocea mea (Web Speech API) ----
  useEffect(() => {
    if (!on) {
      if (recRef.current) {
        recRef.current.onend = null;
        try {
          recRef.current.stop();
        } catch (e) {}
        recRef.current = null;
      }
      return;
    }

    const SR =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      setError('Recunoașterea vocală merge în Chrome/Edge. Folosește unul dintre ele.');
      setOn(false);
      return;
    }
    setError('');

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = bcpFor(myLang);

    rec.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      const me = room?.localParticipant?.name || 'Tu';
      if (interim) {
        showCaption(me, interim);
        publish({ text: interim, lang: myLang, final: false });
      }
      if (final) {
        showCaption(me, final);
        publish({ text: final, lang: myLang, final: true });
      }
    };

    rec.onerror = () => {};
    rec.onend = () => {
      if (onRef.current) {
        try {
          rec.start();
        } catch (e) {}
      }
    };

    try {
      rec.start();
    } catch (e) {}
    recRef.current = rec;

    return () => {
      rec.onend = null;
      try {
        rec.stop();
      } catch (e) {}
    };
  }, [on, myLang, room, publish, showCaption]);

  return (
    <div className="cap-bar">
      <div className="cap-controls">
        <button
          className={`cc ${on ? 'active' : ''}`}
          onClick={() => setOn((v) => !v)}
          title="Pornește/oprește subtitrarea vocii tale"
        >
          CC {on ? 'ON' : 'OFF'}
        </button>
        <span className="cap-lbl">Vorbesc:</span>
        <select value={myLang} onChange={(e) => setMyLang(e.target.value)}>
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
        <span className="cap-lbl">Afișez:</span>
        <select value={showLang} onChange={(e) => setShowLang(e.target.value)}>
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="cap-text err">{error}</div>}

      {caption && !error && (
        <div className="cap-text">
          <b>{caption.speaker}:</b> {caption.text}
        </div>
      )}
    </div>
  );
}
