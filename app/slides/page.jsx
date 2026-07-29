'use client';

import { useEffect, useState } from 'react';
import { useT } from '../components/LangProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authedFetch } from '../../lib/api';

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export default function SlidesList() {
  const { t } = useT();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const router = useRouter();

  const load = async () => {
    try {
      const res = await authedFetch('/api/presentations');
      const data = await res.json();
      setItems(data.items || []);
      setConfigured(data.configured !== false);
    } catch (e) {
      setConfigured(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = () => router.push(`/slides/${uuid()}`);

  const remove = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(t('slDelConfirm'))) return;
    await authedFetch(`/api/presentations?id=${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="landing" style={{ justifyContent: 'flex-start', paddingTop: 48 }}>
      <div className="brand" style={{ fontSize: 24 }}>
        <span className="dot">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
            <rect x="3" y="4" width="18" height="12" rx="2" />
            <path d="M8 20h8M12 16v4M7 9l3 3 5-5" />
          </svg>
        </span>
        {t('slTitle')}
      </div>
      <p className="tagline">{t('slSub')}</p>

      <div style={{ width: '100%', maxWidth: 520 }}>
        <button onClick={create} style={btnPrimary}>
          {t('slNew')}
        </button>

        {loading && <p className="foot" style={{ textAlign: 'center' }}>{t('slLoading')}</p>}

        {!loading && !configured && (
          <div className="card" style={{ marginTop: 14 }}>
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>
              Pentru a salva prezentări, configurează Supabase în <code>.env.local</code>{' '}
              (vezi README). Poți totuși crea și prezenta acum — doar salvarea are nevoie de bază de date.
            </p>
          </div>
        )}

        {!loading &&
          items.map((p) => (
            <Link key={p.id} href={`/slides/${p.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <b style={{ color: 'var(--text)' }}>{p.title}</b>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                    {t('slModified')} {new Date(p.updated_at).toLocaleString('ro-RO')}
                  </div>
                </div>
                <button onClick={(e) => remove(p.id, e)} style={btnDelete}>
                  {t('slDelete')}
                </button>
              </div>
            </Link>
          ))}
      </div>

      <div className="foot">
        <Link href="/" style={{ color: 'var(--muted)' }}>{t('navHome')}</Link>
      </div>
    </div>
  );
}

const btnPrimary = {
  width: '100%',
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 11,
  padding: 14,
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 600,
  fontSize: 15,
  cursor: 'pointer',
};

const btnDelete = {
  background: 'transparent',
  color: 'var(--muted)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '7px 12px',
  fontSize: 12.5,
  cursor: 'pointer',
};
