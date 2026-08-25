'use client';

import { useEffect, useState, useRef } from 'react';
import { useT } from '../components/LangProvider';
import Link from 'next/link';
import { authedFetch } from '../../lib/api';
import { useAuth } from '../components/AuthProvider';

export default function Contacts() {
  const { t } = useT();
  const { user, loading, configured } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [state, setState] = useState('loading');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [paste, setPaste] = useState('');
  const [msg, setMsg] = useState('');
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const res = await authedFetch('/api/contacts');
      const d = await res.json();
      if (d.needsLogin || !user) { setState('login'); return; }
      setContacts(d.contacts || []);
      setState('ok');
    } catch (e) { setState('error'); }
  };

  useEffect(() => { if (!loading) { if (!user) setState('login'); else load(); } }, [user, loading]);

  const addOne = async () => {
    if (!email.trim()) return;
    setMsg('');
    const res = await authedFetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, name }) });
    const d = await res.json();
    if (d.error) setMsg(d.error); else { setContacts(d.contacts || []); setEmail(''); setName(''); setMsg(t('ctAdded')); }
  };

  const addMany = async (text) => {
    setMsg('');
    const res = await authedFetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    const d = await res.json();
    if (d.error) setMsg(d.error); else { setContacts(d.contacts || []); setPaste(''); setMsg(`${t('ctIadded')} ${d.added} ${t('ctAddedN')}`); }
  };

  const onCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    addMany(text);
    e.target.value = '';
  };

  const del = async (id) => {
    await authedFetch(`/api/contacts?id=${id}`, { method: 'DELETE' });
    setContacts((c) => c.filter((x) => x.id !== id));
  };

  return (
    <div className="landing" style={{ justifyContent: 'flex-start', paddingTop: 48 }}>
      <div className="brand" style={{ fontSize: 24 }}>{t('ctTitle')}</div>
      <p className="tagline">{t('ctSub')}</p>

      <div style={{ width: '100%', maxWidth: 480 }}>
        {!configured && <div className="card"><p style={{ color: 'var(--muted)', fontSize: 14 }}>{t('ctNoAuth')}</p></div>}

        {state === 'login' && (
          <div className="card">
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>{t('ctLoginPrompt')}</p>
            <Link href="/login"><button style={{ marginTop: 6 }}>{t('logSignin')}</button></Link>
          </div>
        )}

        {state === 'ok' && (
          <>
            <div className="card">
              <label>{t('ctAddOne')}</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplu.ro" />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('ctNamePh')} />
              <button onClick={addOne} disabled={!email.trim()}>{t('ctAdd')}</button>

              <label style={{ marginTop: 8 }}>{t('ctPasteLabel')}</label>
              <textarea
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                rows={3}
                placeholder={t('ctPastePh')}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: '12px 14px', color: 'var(--text)', fontFamily: 'inherit', fontSize: 14, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => addMany(paste)} disabled={!paste.trim()} style={{ flex: 1 }}>{t('ctAddText')}</button>
                <button onClick={() => fileRef.current?.click()} style={{ flex: 1, background: 'var(--accent-soft)', color: 'var(--accent)' }}>{t('ctImportCsv')}</button>
              </div>
              <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" onChange={onCsv} style={{ display: 'none' }} />
              {msg && <p style={{ fontSize: 13, color: 'var(--mint)' }}>{msg}</p>}
            </div>

            <div className="card" style={{ marginTop: 12 }}>
              <b>{contacts.length} {t('ctContacts')}</b>
              {contacts.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>{t('ctNone')}</p>}
              {contacts.map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</div>
                    {c.name && <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{c.name}</div>}
                  </div>
                  <button onClick={() => del(c.id)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 7, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>{t('ctDelete')}</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="foot" style={{ display: 'flex', gap: 18 }}>
        <Link href="/" style={{ color: 'var(--muted)' }}>{t('navHome')}</Link>
        <Link href="/schedule" style={{ color: 'var(--muted)' }}>{t('mtSchedule')}</Link>
      </div>
    </div>
  );
}
