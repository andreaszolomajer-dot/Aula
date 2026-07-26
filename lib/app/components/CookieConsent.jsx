'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useT } from './LangProvider';

export default function CookieConsent() {
  const { t } = useT();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try { if (!localStorage.getItem('aula-consent')) setShow(true); } catch (e) { setShow(true); }
  }, []);

  const accept = () => {
    try { localStorage.setItem('aula-consent', '1'); } catch (e) {}
    setShow(false);
  };

  if (!show) return null;
  return (
    <div className="cc-banner">
      <p>{t('cookieText')} <Link href="/confidentialitate">{t('privacyPolicy')}</Link>.</p>
      <button onClick={accept}>{t('understood')}</button>
    </div>
  );
}
