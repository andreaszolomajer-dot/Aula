'use client';

import { useState } from 'react';
import { useT } from './LangProvider';

// Buton mereu vizibil în cameră: copiază linkul CURAT de invitat
// (adresa camerei, fără „?host=..." și fără „?username=..."), ca să-l poți
// trimite pe loc celor care ți-l cer, fără să treci prin bara de adrese.
export default function CopyInvite() {
  const { t } = useT();
  const [copied, setCopied] = useState(false);

  const inviteLink = () => {
    if (typeof window === 'undefined') return '';
    // pathname = „/room/<nume>” — fără query, deci fără cheia de gazdă
    return `${window.location.origin}${window.location.pathname}`;
  };

  const onCopy = async () => {
    const link = inviteLink();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      // fallback dacă browserul nu permite clipboard
      window.prompt(t('ciCopy'), link);
    }
  };

  return (
    <button
      onClick={onCopy}
      title={inviteLink()}
      style={{
        position: 'fixed',
        top: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 48,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        borderRadius: 999,
        border: '1px solid var(--border)',
        background: copied ? 'var(--mint, #38d9a9)' : 'var(--surface, #12151d)',
        color: copied ? '#06231c' : 'var(--text, #eaf0f7)',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        whiteSpace: 'nowrap',
      }}
    >
      {copied ? t('ciCopied') : t('ciCopy')}
    </button>
  );
}
