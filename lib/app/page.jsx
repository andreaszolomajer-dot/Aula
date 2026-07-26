'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './components/AuthProvider';
import { useT } from './components/LangProvider';
import LangSwitch from './components/LangSwitch';

export default function Home() {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const router = useRouter();
  const { user, configured, signOut } = useAuth();
  const { t } = useT();

  const join = () => {
    if (!name.trim() || !room.trim()) return;
    router.push(`/room/${encodeURIComponent(room.trim())}?username=${encodeURIComponent(name.trim())}`);
  };
  const onKey = (e) => { if (e.key === 'Enter') join(); };
  const newRoom = () => setRoom(Math.random().toString(36).slice(2, 8));

  return (
    <div className="landing">
      <div className="topbar-utils">
        <LangSwitch />
        {configured && (
          <div className="acct-chip">
            {user ? (<><span>{user.email}</span><button onClick={signOut}>{t('logout')}</button></>) : (<Link href="/login">{t('login')}</Link>)}
          </div>
        )}
      </div>

      <div className="brand">
        <span className="dot">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4">
            <path d="M15 10l4.5-2.5v9L15 14M4 8h8a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2z" />
          </svg>
        </span>
        Aula
      </div>
      <p className="tagline">{t('tagline')}</p>

      <div className="card">
        <label>{t('yourName')}</label>
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={onKey} placeholder={t('exName')} />

        <label>{t('roomName')}</label>
        <input value={room} onChange={(e) => setRoom(e.target.value)} onKeyDown={onKey} placeholder={t('exRoom')} />

        <button onClick={join} disabled={!name.trim() || !room.trim()}>{t('join')}</button>
        <button onClick={newRoom} style={{ background: 'var(--accent-soft)', color: 'var(--accent)', marginTop: 0 }}>{t('newRoom')}</button>
      </div>

      <div className="foot" style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/schedule" style={{ color: 'var(--accent)' }}>{t('navSchedule')}</Link>
        <Link href="/meetings" style={{ color: 'var(--muted)' }}>{t('navMeetings')}</Link>
        <Link href="/slides" style={{ color: 'var(--muted)' }}>{t('navSlides')}</Link>
        <Link href="/contacte" style={{ color: 'var(--muted)' }}>{t('navContacts')}</Link>
      </div>
      <p className="foot" style={{ marginTop: 10 }}>{t('sameRoomNote')}</p>
      <p className="foot" style={{ marginTop: 6, fontSize: 11.5 }}>
        {t('acceptLegal')}{' '}
        <Link href="/confidentialitate" style={{ color: 'var(--muted)' }}>{t('privacyPolicy')}</Link>{' '}
        <Link href="/termeni" style={{ color: 'var(--muted)' }}>{t('andTerms')}</Link>.
      </p>
    </div>
  );
}
