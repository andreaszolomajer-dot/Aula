'use client';

import { useState, useEffect } from 'react';
import { useT } from '../components/LangProvider';
import Link from 'next/link';
import { authedFetch } from '../../lib/api';
import { useAuth } from '../components/AuthProvider';

export default function Schedule() {
  const { t } = useT();
  const [form, setForm] = useState({
    title: '',
    date: '',
    time: '',
    duration: '30',
    hostName: '',
    invitees: '',
    lobby: false,
    webinar: false,
  });
  const [status, setStatus] = useState(null); // 'sending' | 'done' | 'error'
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await authedFetch('/api/contacts');
        const d = await res.json();
        setContacts(d.contacts || []);
      } catch (e) {}
    })();
  }, [user]);

  const addContact = (cEmail) => {
    setForm((f) => {
      const list = f.invitees.split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean);
      if (list.includes(cEmail)) return f;
      return { ...f, invitees: [...list, cEmail].join(', ') };
    });
  };

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
        {t('scPageTitle')}
      </div>
      <p className="tagline">{t('scSub')}</p>

      {status !== 'done' && (
        <div className="card" style={{ maxWidth: 440 }}>
          <label>{t('scTitleL')}</label>
          <input value={form.title} onChange={upd('title')} placeholder={t('scTitlePh')} />

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label>{t('scDate')}</label>
              <input type="date" value={form.date} onChange={upd('date')} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label>{t('scTime')}</label>
              <input type="time" value={form.time} onChange={upd('time')} />
            </div>
          </div>

          <label>{t('scDuration')}</label>
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
            <option value="15">{t('sc15')}</option>
            <option value="30">{t('sc30')}</option>
            <option value="45">{t('sc45')}</option>
            <option value="60">{t('sc60')}</option>
            <option value="90">{t('sc90')}</option>
            <option value="120">{t('sc120')}</option>
            <option value="180">{t('sc180')}</option>
            <option value="240">{t('sc240')}</option>
            <option value="480">{t('scAllDay')}</option>
          </select>

          <label>{t('scHostName')}</label>
          <input value={form.hostName} onChange={upd('hostName')} placeholder="ex. Andrei" />

          <label>{t('scInvitees')}</label>
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

          {contacts.length > 0 && (
            <div style={{ marginTop: -4 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{t('scFromContacts')}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 96, overflowY: 'auto' }}>
                {contacts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => addContact(c.email)}
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 99, padding: '5px 11px', fontSize: 12, color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    + {c.name || c.email}
                  </button>
                ))}
              </div>
              <Link href="/contacte" style={{ fontSize: 12, color: 'var(--accent)', display: 'inline-block', marginTop: 6 }}>{t('scManageContacts')}</Link>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 2 }}>
            <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 13, color: 'var(--muted)', fontWeight: 400, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.lobby} onChange={(e) => setForm({ ...form, lobby: e.target.checked })} style={{ marginTop: 2, accentColor: 'var(--accent)' }} />
              {t('scLobbyOpt')}
            </label>
            <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 13, color: 'var(--muted)', fontWeight: 400, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.webinar} onChange={(e) => setForm({ ...form, webinar: e.target.checked })} style={{ marginTop: 2, accentColor: 'var(--accent)' }} />
              {t('scWebinarOpt')}
            </label>
          </div>

          <button onClick={submit} disabled={!canSubmit || status === 'sending'}>
            {status === 'sending' ? t('scSubmitting') : t('scSubmit')}
          </button>

          {status === 'error' && (
            <p style={{ color: '#F2555A', fontSize: 13 }}>{result?.error}</p>
          )}
        </div>
      )}

      {status === 'done' && result && (
        <div className="card" style={{ maxWidth: 440 }}>
          <h3 style={{ color: 'var(--mint)', fontFamily: 'Space Grotesk' }}>
            {t('scDoneTitle')}
          </h3>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>
            {result.emailsSent > 0
              ? `${t('scSent')} ${result.emailsSent} ${t('scSentInvites')}`
              : t('scDoneNoResend')}
          </p>
          <label>{t('scGuestLink')}</label>
          <input readOnly value={result.joinUrl} onClick={(e) => e.target.select()} />
          <button onClick={copy}>{copied ? t('scCopied') : t('scCopyGuest')}</button>

          {result.hostUrl && (
            <>
              <label style={{ marginTop: 8, color: 'var(--mint)' }}>{t('scHostLink')}</label>
              <input readOnly value={result.hostUrl} onClick={(e) => e.target.select()} style={{ borderColor: 'var(--mint)' }} />
              <button
                style={{ background: 'var(--mint)', color: '#06231c' }}
                onClick={() => { navigator.clipboard.writeText(result.hostUrl); }}
              >
                {t('scCopyHost')}
              </button>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>{t('scHostHint')}</p>
            </>
          )}
          <Link href="/meetings" style={{ color: 'var(--accent)', fontSize: 14, textAlign: 'center' }}>
            {t('scSeeAllArrow')}
          </Link>
        </div>
      )}

      <div className="foot" style={{ display: 'flex', gap: 18 }}>
        <Link href="/" style={{ color: 'var(--muted)' }}>{t('navHome')}</Link>
        <Link href="/meetings" style={{ color: 'var(--muted)' }}>{t('scSeeAll')}</Link>
      </div>
    </div>
  );
}
