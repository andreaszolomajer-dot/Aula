'use client';

import { useState, useCallback, useRef } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { BackgroundBlur, VirtualBackground } from '@livekit/track-processors';
import { useTools } from './ToolsProvider';

const PRESETS = [
  { id: 'moon', label: 'Lună', src: '/backgrounds/moon.jpg' },
  { id: 'space', label: 'Spațiu', src: '/backgrounds/space.jpg' },
  { id: 'beach', label: 'Plajă', src: '/backgrounds/beach.jpg' },
  { id: 'aurora', label: 'Auroră', src: '/backgrounds/aurora.jpg' },
  { id: 'library', label: 'Bibliotecă', src: '/backgrounds/library.jpg' },
  { id: 'elegant', label: 'Elegant', src: '/backgrounds/elegant.jpg' },
  { id: 'blue', label: 'Albastru', src: '/backgrounds/blue.jpg' },
  { id: 'mint', label: 'Mentă', src: '/backgrounds/mint.jpg' },
];

export default function BackgroundControl() {
  const { localParticipant } = useLocalParticipant();
  const { activeTool, setActiveTool } = useTools();
  const open = activeTool === 'fundal';

  const [active, setActive] = useState('none');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const getCamTrack = useCallback(() => {
    const pub = localParticipant?.getTrackPublication(Track.Source.Camera);
    return pub?.track || null;
  }, [localParticipant]);

  const apply = useCallback(
    async (processor) => {
      const track = getCamTrack();
      if (!track) {
        setError('Pornește camera întâi, apoi alege fundalul.');
        return false;
      }
      setError('');
      setBusy(true);
      try {
        if (processor) await track.setProcessor(processor);
        else await track.stopProcessor();
        return true;
      } catch (e) {
        setError('Fundalul nu a putut fi aplicat pe acest dispozitiv.');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [getCamTrack]
  );

  const chooseNone = async () => { if (await apply(null)) setActive('none'); };
  const chooseBlur = async () => { if (await apply(BackgroundBlur(12))) setActive('blur'); };
  const choosePreset = async (p) => { if (await apply(VirtualBackground(p.src))) setActive(p.id); };
  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (await apply(VirtualBackground(url))) setActive('custom');
  };

  if (!open) return null;

  return (
    <div className="panel-float panel-left">
      <div className="panel-head">
        Fundal
        <button className="panel-x" onClick={() => setActiveTool(null)}>✕</button>
      </div>
      <div className="bg-row">
        <button className={active === 'none' ? 'on' : ''} onClick={chooseNone} disabled={busy}>Fără</button>
        <button className={active === 'blur' ? 'on' : ''} onClick={chooseBlur} disabled={busy}>Blur</button>
      </div>
      <div className="bg-grid">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            className={`bg-thumb ${active === p.id ? 'on' : ''}`}
            style={{ backgroundImage: `url(${p.src})` }}
            onClick={() => choosePreset(p)}
            disabled={busy}
            title={p.label}
          />
        ))}
      </div>
      <button className="bg-upload" onClick={() => fileRef.current?.click()} disabled={busy}>
        + Încarcă imaginea ta
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} style={{ display: 'none' }} />
      {error && <div className="bg-err">{error}</div>}
      {busy && <div className="bg-err" style={{ color: 'var(--muted)' }}>Se aplică…</div>}
    </div>
  );
}
