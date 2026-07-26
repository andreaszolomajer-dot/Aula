'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authedFetch } from '../../lib/api';
import { useAuth } from '../components/AuthProvider';

export default function Leads() {
  const { user, loading, configured } = useAuth();
  const [leads, setLeads] = useState([]);
  const [state, setState] = useState('loading'); // loading | ok | denied | error

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setState('denied');
      return;
    }
    (async () => {
      try {
        const res = await authedFetch('/api/leads');
        if (res.status === 403 || res.status === 401) {
          setState('denied');
          return;
        }
        const d = await res.json();
        setLeads(d.leads || []);
        setState('ok');
      } catch (e) {
        setState('error');
      }
    })();
  }, [user, loading]);

  const downloadCsv = () => {
    const rows = [['email', 'data_inregistrare'], ...leads.map((l) => [l.email, l.created_at])];
    const csv = rows.map((r) => r.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `leaduri-aula-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="landing" style={{ justifyContent: 'flex-start', paddingTop: 48 }}>
      <div className="brand" style={{ fontSize: 24 }}>Leaduri (opt-in)</div>
      <p className="tagline">Persoanele care au acceptat să primească emailuri.</p>

      <div style={{ width: '100%', maxWidth: 520 }}>
        {!configured && (
          <div className="card"><p style={{ color: 'var(--muted)', fontSize: 14 }}>Autentificarea nu e configurată.</p></div>
        )}
        {state === 'loading' && configured && (
          <p className="foot" style={{ textAlign: 'center' }}>Se încarcă…</p>
        )}
        {state === 'denied' && (
          <div className="card">
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              Această pagină e doar pentru administrator. Adaugă emailul tău în <code>ADMIN_EMAILS</code>{' '}
              (în <code>.env.local</code>) și conectează-te cu acel cont.
            </p>
            <Link href="/login" style={{ color: 'var(--accent)' }}>Conectează-te →</Link>
          </div>
        )}
        {state === 'ok' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b>{leads.length} leaduri</b>
              <button onClick={downloadCsv} disabled={!leads.length} style={{ margin: 0, width: 'auto', padding: '8px 14px' }}>
                ⬇ Descarcă CSV
              </button>
            </div>
            {leads.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 14 }}>Niciun lead încă.</p>}
            {leads.map((l, i) => (
              <div key={i} style={{ fontSize: 13.5, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                {l.email}
              </div>
            ))}
          </div>
        )}
        {state === 'error' && (
          <div className="card"><p style={{ color: 'var(--warm, #F5A742)' }}>Eroare la încărcare.</p></div>
        )}
      </div>

      <div className="foot"><Link href="/" style={{ color: 'var(--muted)' }}>← Acasă</Link></div>
    </div>
  );
}
