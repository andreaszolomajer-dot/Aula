'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { BackgroundBlur, VirtualBackground } from '@livekit/track-processors';
import { useTools } from './ToolsProvider';
import { useT } from './LangProvider';

const PRESETS = [
  { id: 'moon', k: 'bgMoon', src: '/backgrounds/moon.jpg' },
  { id: 'space', k: 'bgSpace', src: '/backgrounds/space.jpg' },
  { id: 'beach', k: 'bgBeach', src: '/backgrounds/beach.jpg' },
  { id: 'aurora', k: 'bgAurora', src: '/backgrounds/aurora.jpg' },
  { id: 'library', k: 'bgLibrary', src: '/backgrounds/library.jpg' },
  { id: 'elegant', k: 'bgElegant', src: '/backgrounds/elegant.jpg' },
  { id: 'blue', k: 'bgBlue', src: '/backgrounds/blue.jpg' },
  { id: 'mint', k: 'bgMint', src: '/backgrounds/mint.jpg' },
];

export default function BackgroundControl() {
  const { localParticipant } = useLocalParticipant();
  const { activeTool, setActiveTool } = useTools();
  const { t } = useT();
  const open = activeTool === 'fundal';

  const [active, setActive] = useState('none');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    const isImg = active !== 'none' && active !== 'blur';
    document.body.classList.toggle('bg-image-active', isImg);
  }, [active]);
  useEffect(() => () => document.body.classList.remove('bg-image-active'), []);

  const getCamTrack = useCallback(() => {
    const pub = localParticipant?.getTrackPublication(Track.Source.Camera);
    return pub?.track || null;
  }, [localParticipant]);

  const apply = useCallback(async (processor) => {
    const track = getCamTrack();
    if (!track) { setError(t('bgNeedCam')); return false; }
    setError(''); setBusy(true);
    try {
      if (processor) await track.setProcessor(processor); else await track.stopProcessor();
      return true;
    } catch (e) { setError(t('bgErr')); return false; } finally { setBusy(false); }
  }, [getCamTrack, t]);

  const chooseNone = async () => { if (await apply(null)) setActive('none'); };
  const chooseBlur = async () => { if (await apply(BackgroundBlur(12))) setActive('blur'); };
  const choosePreset = async (p) => { if (await apply(VirtualBackground(p.src))) setActive(p.id); };
  const onUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    if (await apply(VirtualBackground(url))) setActive('custom');
  };

  if (!open) return null;

  return (
    <div className="panel-float panel-left">
      <div className="panel-head">{t('bgTitle')}<button className="panel-x" onClick={() => setActiveTool(null)}>✕</button></div>
      <div className="bg-row">
        <button className={active === 'none' ? 'on' : ''} onClick={chooseNone} disabled={busy}>{t('bgNone')}</button>
        <button className={active === 'blur' ? 'on' : ''} onClick={chooseBlur} disabled={busy}>{t('bgBlur')}</button>
      </div>
      <div className="bg-grid">
        {PRESETS.map((p) => (
          <button key={p.id} className={`bg-thumb ${active === p.id ? 'on' : ''}`} style={{ backgroundImage: `url(${p.src})` }} onClick={() => choosePreset(p)} disabled={busy} title={t(p.k)} />
        ))}
      </div>
      <button className="bg-upload" onClick={() => fileRef.current?.click()} disabled={busy}>{t('bgUpload')}</button>
      <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} style={{ display: 'none' }} />
      {error && <div className="bg-err">{error}</div>}
      {busy && <div className="bg-err" style={{ color: 'var(--muted)' }}>{t('bgApplying')}</div>}
    </div>
  );
}
