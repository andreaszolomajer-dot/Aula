'use client';

import { useState } from 'react';
import { useT } from '../components/LangProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowser } from '../../lib/supabaseClient';
import { useAuth } from '../components/AuthProvider';

export default function Login() {
  const { t } = useT();
  const supabase = getSupabaseBrowser();
  const { configured } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const submit = async () => {
    if (!supabase) return;
    setBusy(true);
    setMsg('');
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: { data: { marketing_opt_in: marketingOptIn } },
        });
        if (error) setMsg(error.message);
        else setMsg(t('logCreated'));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) setMsg(error.message);
        else router.push('/');
      }
    } catch (e) {
      setMsg(t('logErr'));
    }
    setBusy(false);
  };

  const magic = async () => {
    if (!supabase || !email) return;
    setBusy(true);
    setMsg('');
    const { error } = await supabase.auth.signInWithOtp({ email });
    setMsg(error ? error.message : t('logLinkSent'));
    setBusy(false);
  };

  return (
    <div className="landing">
      <div className="brand" style={{ fontSize: 26 }}>
        <span className="dot">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4">
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" />
          </svg>
        </span>
        {mode === 'signup' ? t('logNewAcc') : t('logSignin')}
      </div>
      <p className="tagline">{t('logSub')}</p>

      {!configured ? (
        <div className="card">
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>
            Autentificarea nu e configurată încă. Adaugă <code>NEXT_PUBLIC_SUPABASE_URL</code> și{' '}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> în <code>.env.local</code> (vezi README).
          </p>
          <Link href="/" style={{ color: 'var(--accent)', textAlign: 'center' }}>{t('navHome')}</Link>
        </div>
      ) : (
        <div className="card">
          <label>{t('logEmail')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@exemplu.ro"
          />
          <label>{t('logPass')}</label>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="••••••••"
          />

          {mode === 'signup' && (
            <label
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer',
                fontSize: 12.5, color: 'var(--muted)', fontWeight: 400, marginBottom: 0,
              }}
            >
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                style={{ width: 16, height: 16, marginTop: 1, flexShrink: 0, accentColor: 'var(--accent)' }}
              />
              {t('logOptin')}
            </label>
          )}

          <button onClick={submit} disabled={busy || !email || !pass}>
            {busy ? t('logProcessing') : mode === 'signup' ? t('logCreateAcc') : t('logEnterAcc')}
          </button>

          <button
            onClick={magic}
            disabled={busy || !email}
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)', marginTop: 0 }}
          >
            {t('logMagic')}
          </button>

          {msg && <p style={{ fontSize: 13, color: 'var(--mint)' }}>{msg}</p>}

          <button
            onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}
          >
            {mode === 'signup' ? t('logHaveAcc') : t('logNoAcc')}
          </button>
        </div>
      )}

      <div className="foot">
        <Link href="/" style={{ color: 'var(--muted)' }}>{t('navHome')}</Link>
      </div>
    </div>
  );
}
