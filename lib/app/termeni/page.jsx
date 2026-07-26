'use client';

import Link from 'next/link';

export default function Terms() {
  return (
    <div className="legal">
      <div className="legal-wrap">
        <Link href="/" className="legal-back">← Acasă</Link>
        <h1>Termeni și condiții</h1>
        <p className="legal-note">
          Adaptat serviciului. Recomandat: verifică o dată cu un avocat înainte de monetizare.
        </p>
        <p className="legal-updated">Ultima actualizare: iulie 2026 (actualizează la publicare)</p>

        <h2>1. Acceptarea termenilor</h2>
        <p>
          Prin folosirea aplicației Aula, oferită de SZOLOMAJER ANDREA-ECATERINA PFA (CUI 47201140, nr. Reg. Com. F2022000847241), accepți acești
          termeni. Dacă nu ești de acord, te rugăm să nu folosești serviciul.
        </p>

        <h2>2. Serviciul</h2>
        <p>
          Aula oferă ședințe video, chat, programare, subtitrare, prezentări și camere separate.
          Putem modifica sau întrerupe funcții cu o notificare rezonabilă.
        </p>

        <h2>3. Utilizare corectă</h2>
        <ul>
          <li>Nu folosi serviciul pentru activități ilegale, hărțuire sau conținut dăunător.</li>
          <li>Nu înregistra sau transcrie participanți fără a-i informa, conform legii.</li>
          <li>Ești responsabil de conținutul pe care îl partajezi și de fișierele pe care le încarci.</li>
        </ul>

        <h2>4. Conturi</h2>
        <p>
          Dacă oferim conturi, ești responsabil de păstrarea în siguranță a datelor tale de acces.
        </p>

        <h2>5. Plăți (dacă e cazul)</h2>
        <p>
          Funcțiile plătite, prețurile și condițiile de reînnoire/anulare vor fi prezentate clar înainte
          de cumpărare. [Completează detaliile abonamentelor.]
        </p>

        <h2>6. Limitarea răspunderii</h2>
        <p>
          Serviciul e oferit „ca atare". În limitele permise de lege, nu răspundem pentru pierderi
          indirecte rezultate din folosirea serviciului.
        </p>

        <h2>7. Legea aplicabilă</h2>
        <p>Acești termeni sunt guvernați de legea din România.</p>

        <h2>8. Contact</h2>
        <p>Întrebări: andreaszolomajer@yahoo.com.</p>

        <div className="legal-links">
          <Link href="/confidentialitate">Politica de confidențialitate</Link>
          <Link href="/">Acasă</Link>
        </div>
      </div>
    </div>
  );
}
