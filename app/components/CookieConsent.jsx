'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem('aula-consent')) setShow(true);
    } catch (e) {
      setShow(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem('aula-consent', '1');
    } catch (e) {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="cc-banner">
      <p>
        Folosim doar stocare strict necesară funcționării (sesiunea video și această preferință).
        Fără cookie-uri de publicitate. Detalii în{' '}
        <Link href="/confidentialitate">Politica de confidențialitate</Link>.
      </p>
      <button onClick={accept}>Am înțeles</button>
    </div>
  );
}
