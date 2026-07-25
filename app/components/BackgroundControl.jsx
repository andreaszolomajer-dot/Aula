'use client';

import { useState, useCallback, useRef } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { BackgroundBlur, VirtualBackground } from '@livekit/track-processors';

const PRESETS = [
  { id: 'blue', label: 'Albastru', src: '/backgrounds/blue.jpg' },
  { id: 'warm', label: 'Cald', src: '/backgrounds/warm.jpg' },
  { id: 'studio', label: 'Studio', src: '/backgrounds/studio.jpg' },
  { id: 'mint', label: 'Mentă', src: '/backgrounds/mint.jpg' },
];

export default function BackgroundControl() {
  const { localParticipant } = useLocalParticipant();
  const [open, setOpen] = useState(false);
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

  const chooseNone = async () => {
    if (await apply(null)) setActive('none');
  };
  const chooseBlur = async () => {
    if (await apply(BackgroundBlur(12))) setActive('blur');
  };
  const choosePreset = async (p) => {
    if (await apply(VirtualBackground(p.src))) setActive(p.id);
  };
  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (await apply(VirtualBackground(url))) setActive('custom');
  };

  return (
    <div className="bg-control">
      <button className="bg-toggle" onClick={() => setOpen((v) => !v)}>
        🖼 Fundal
      </button>

      {open && (
        <div className="bg-panel">
          <div className="bg-row">
            <button className={active === 'none' ? 'on' : ''} onClick={chooseNone} disabled={busy}>
              Fără
            </button>
            <button className={active === 'blur' ? 'on' : ''} onClick={chooseBlur} disabled={busy}>
              Blur
            </button>
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
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onUpload}
            style={{ display: 'none' }}
          />

          {error && <div className="bg-err">{error}</div>}
          {busy && <div className="bg-err" style={{ color: 'var(--muted)' }}>Se aplică…</div>}
        </div>
      )}
    </div>
  );
}
