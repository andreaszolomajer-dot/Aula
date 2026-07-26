'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authedFetch } from '../../lib/api';

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await authedFetch('/api/schedule');
        const data = await res.json();
        setMeetings(data.meetings || []);
        setConfigured(data.configured !== false);
      } catch (e) {
        setConfigured(false);
      }
      setLoading(false);
    })();
  }, []);

  const fmt = (iso) =>
    new Date(iso).toLocaleString('ro-RO', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="landing" style={{ justifyContent: 'flex-start', paddingTop: 48 }}>
      <div className="brand" style={{ fontSize: 24 }}>
        <span className="dot">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </span>
        Ședințele mele
      </div>
      <p className="tagline">Ședințele programate care urmează.</p>

      <div style={{ width: '100%', maxWidth: 460 }}>
        {loading && <p className="foot" style={{ textAlign: 'center' }}>Se încarcă…</p>}

        {!loading && !configured && (
          <div className="card">
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>
              Baza de date nu e configurată încă. Adaugă cheile Supabase în{' '}
              <code>.env.local</code> ca să vezi aici ședințele salvate. Poți totuși
              programa ședințe — vei primi linkul de intrare direct.
            </p>
          </div>
        )}

        {!loading && configured && meetings.length === 0 && (
          <div className="card" style={{ alignItems: 'center', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)' }}>Nicio ședință programată încă.</p>
            <Link href="/schedule">
              <button style={{ marginTop: 8 }}>Programează prima ședință</button>
            </Link>
          </div>
        )}

        {!loading &&
          meetings.map((m) => (
            <div
              key={m.id}
              className="card"
              style={{ marginBottom: 12, gap: 8 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ fontSize: 15 }}>{m.title}</b>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {m.duration_minutes} min
                </span>
              </div>
              <span style={{ fontSize: 13, color: 'var(--mint)' }}>📅 {fmt(m.start_time)}</span>
              {m.host_name && (
                <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  Organizator: {m.host_name}
                </span>
              )}
              {m.invitees?.length > 0 && (
                <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  {m.invitees.length} invitați
                </span>
              )}
              <button
                onClick={() => router.push(`/room/${m.room}?username=${encodeURIComponent(m.host_name || 'Gazdă')}`)}
                style={{ marginTop: 4 }}
              >
                Intră în ședință
              </button>
            </div>
          ))}
      </div>

      <div className="foot" style={{ display: 'flex', gap: 18 }}>
        <Link href="/" style={{ color: 'var(--muted)' }}>← Acasă</Link>
        <Link href="/schedule" style={{ color: 'var(--muted)' }}>Programează</Link>
      </div>
    </div>
  );
}
