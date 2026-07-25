'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './components/AuthProvider';

export default function Home() {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const router = useRouter();
  const { user, configured, signOut } = useAuth();

  const join = () => {
    if (!name.trim() || !room.trim()) return;
    router.push(
      `/room/${encodeURIComponent(room.trim())}?username=${encodeURIComponent(name.trim())}`
    );
  };

  const onKey = (e) => {
    if (e.key === 'Enter') join();
  };

  const newRoom = () => {
    const id = Math.random().toString(36).slice(2, 8);
    setRoom(id);
  };

  return (
    <div className="landing">
      {configured && (
        <div className="acct-chip">
          {user ? (
            <>
              <span>{user.email}</span>
              <button onClick={signOut}>Ieși</button>
            </>
          ) : (
            <Link href="/login">Conectează-te</Link>
          )}
        </div>
      )}
      <div className="brand">
        <span className="dot">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4">
            <path d="M15 10l4.5-2.5v9L15 14M4 8h8a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2z" />
          </svg>
        </span>
        Aula
      </div>
      <p className="tagline">Întâlniri video, chat și conferințe. Gratuit.</p>

      <div className="card">
        <label>Numele tău</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onKey}
          placeholder="ex. Andrei"
        />

        <label>Numele sălii</label>
        <input
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          onKeyDown={onKey}
          placeholder="ex. sedinta-produs"
        />

        <button onClick={join} disabled={!name.trim() || !room.trim()}>
          Intră în ședință
        </button>
        <button
          onClick={newRoom}
          style={{
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            marginTop: 0,
          }}
        >
          Generează o sală nouă
        </button>
      </div>

      <div className="foot" style={{ display: 'flex', gap: 18 }}>
        <Link href="/schedule" style={{ color: 'var(--accent)' }}>
          📅 Programează o ședință
        </Link>
        <Link href="/meetings" style={{ color: 'var(--muted)' }}>
          Ședințele mele
        </Link>
        <Link href="/slides" style={{ color: 'var(--muted)' }}>
          Prezentări
        </Link>
      </div>
      <p className="foot" style={{ marginTop: 10 }}>
        Oricine intră cu <b>același nume de sală</b> se vede și se aude în timp real.
      </p>
      <p className="foot" style={{ marginTop: 6, fontSize: 11.5 }}>
        Prin intrarea în ședință accepți{' '}
        <Link href="/confidentialitate" style={{ color: 'var(--muted)' }}>Politica de confidențialitate</Link>{' '}
        și{' '}
        <Link href="/termeni" style={{ color: 'var(--muted)' }}>Termenii</Link>.
      </p>
    </div>
  );
}
