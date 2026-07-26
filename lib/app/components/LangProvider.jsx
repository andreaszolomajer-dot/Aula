'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { translate } from '../../lib/i18n';

const LangCtx = createContext({ lang: 'ro', setLang: () => {}, t: (k) => k });

export function LangProvider({ children }) {
  const [lang, setLang] = useState('ro');

  useEffect(() => {
    try {
      const s = localStorage.getItem('aula-lang');
      if (s) setLang(s);
    } catch (e) {}
  }, []);

  const change = (l) => {
    setLang(l);
    try { localStorage.setItem('aula-lang', l); } catch (e) {}
  };

  const t = (k) => translate(k, lang);

  return <LangCtx.Provider value={{ lang, setLang: change, t }}>{children}</LangCtx.Provider>;
}

export const useT = () => useContext(LangCtx);
