'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authedFetch } from '../../lib/api';

export default function Schedule() {
  const [form, setForm] = useState({
    title: '',
    date: '',
    time: '',
    duration: '30',
    hostName: '',
    invitees: '',
  });
  const [status, setStatus] = useState(null); // 'sending' | 'done' | 'error'
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    setStatus('sending');
    setResult(null);
    try {
      const res = await authedFetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) {
        setResult(data);
        setStatus('error');
      } else {
        setResult(data);
        setStatus('done');
      }
    } catch (e) {
      setResult({ error: 'Nu am putut trimite cererea.' });
      setStatus('error');
    }
  };

  const copy = () => {
    if (result?.joinUrl) {
      navigator.clipboard.writeText(result.joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const canSubmit = form.title.trim() && form.date && form.time;

  return (
    <div className="landing" style={{ justifyContent: 'flex-start', paddingTop: 48 }}>
      <div className="brand" style={{ fontSize: 24 }}>
        <span className="dot">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </span>
        Programează o ședință
      </div>
      <p className="tagline">Alege data, invită oamenii pe email, gata.</p>

      {status !== 'done' && (
        <div className="card" style={{ maxWidth: 440 }}>
          <label>Titlul ședinței</label>
          <input value={form.title} onChange={upd('title')} placeholder="ex. Ședință de produs" />

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label>Data</label>
              <input type="date" value={form.date} onChange={upd('date')} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label>Ora</label>
              <input type="time" value={form.time} onChange={upd('time')} />
            </div>
          </div>

          <label>Durată</label>
          <select
            value={form.duration}
            onChange={upd('duration')}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 11,
              padding: '13px 14px',
              color: 'var(--text)',
              fontFamily: 'inherit',
              fontSize: 15,
            }}
          >
            <option value="15">15 minute</option>
            <option value="30">30 minute</option>
            <option value="45">45 minute</option>
            <option value="60">1 oră</option>
            <option value="90">1 oră 30 min</option>
          </select>

          <label>Numele tău (organizator)</label>
          <input value={form.hostName} onChange={upd('hostName')} placeholder="ex. Andrei" />

          <label>Invitați (emailuri, separate prin virgulă)</label>
          <textarea
            value={form.invitees}
            onChange={upd('invitees')}
            placeholder="maria@exemplu.ro, radu@exemplu.ro"
            rows={3}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 11,
              padding: '13px 14px',
              color: 'var(--text)',
              fontFamily: 'inherit',
              fontSize: 15,
              resize: 'vertical',
            }}
          />

          <button onClick={submit} disabled={!canSubmit || status === 'sending'}>
            {status === 'sending' ? 'Se trimite…' : 'Programează și trimite invitații'}
          </button>

          {status === 'error' && (
            <p style={{ color: '#F2555A', fontSize: 13 }}>{result?.error}</p>
          )}
        </div>
      )}

      {status === 'done' && result && (
        <div className="card" style={{ maxWidth: 440 }}>
          <h3 style={{ color: 'var(--mint)', fontFamily: 'Space Grotesk' }}>
            Ședință programată ✓
          </h3>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>
            {result.emailsSent > 0
              ? `Am trimis ${result.emailsSent} invitații pe email.`
              : 'Ședința e creată. (Trimiterea emailurilor necesită configurarea Resend.)'}
          </p>
          <label>Link de intrare</label>
          <input readOnly value={result.joinUrl} onClick={(e) => e.target.select()} />
          <button onClick={copy}>{copied ? 'Copiat ✓' : 'Copiază linkul'}</button>
          <Link href="/meetings" style={{ color: 'var(--accent)', fontSize: 14, textAlign: 'center' }}>
            Vezi toate ședințele →
          </Link>
        </div>
      )}

      <div className="foot" style={{ display: 'flex', gap: 18 }}>
        <Link href="/" style={{ color: 'var(--muted)' }}>← Acasă</Link>
        <Link href="/meetings" style={{ color: 'var(--muted)' }}>Ședințele mele</Link>
      </div>
    </div>
  );
}
