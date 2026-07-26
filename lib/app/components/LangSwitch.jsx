'use client';

import { useT } from './LangProvider';
import { LANGS } from '../../lib/i18n';

export default function LangSwitch() {
  const { lang, setLang } = useT();
  return (
    <div className="lang-switch">
      {LANGS.map((l) => (
        <button key={l.code} className={lang === l.code ? 'on' : ''} onClick={() => setLang(l.code)}>
          {l.label}
        </button>
      ))}
    </div>
  );
}
