'use client';

import Link from 'next/link';

export default function Privacy() {
  return (
    <div className="legal">
      <div className="legal-wrap">
        <Link href="/" className="legal-back">← Acasă</Link>
        <h1>Politica de confidențialitate</h1>
        <p className="legal-note">
          Date completate cu informațiile PFA. Recomandat: verifică o dată cu un avocat înainte de monetizare.
        </p>
        <p className="legal-updated">Ultima actualizare: iulie 2026 (actualizează la publicare)</p>

        <h2>1. Cine suntem</h2>
        <p>
          Operatorul de date pentru aplicația Aula este SZOLOMAJER ANDREA-ECATERINA PFA (CUI 47201140, nr. Reg. Com. F2022000847241), cu sediul în Sighetu Marmației, județul Maramureș, contact: andreaszolomajer@yahoo.com. Această politică explică ce date personale prelucrăm când
          folosești Aula și ce drepturi ai conform Regulamentului (UE) 2016/679 (GDPR).
        </p>

        <h2>2. Ce date prelucrăm</h2>
        <ul>
          <li>Numele afișat pe care îl alegi la intrarea într-o ședință.</li>
          <li>Adresele de email pe care le introduci când trimiți invitații.</li>
          <li>Conținutul audio și video din ședințe — transmis în timp real; nu îl stocăm decât dacă o ședință este înregistrată explicit.</li>
          <li>Transcrierile vocii, generate în browserul tău când activezi subtitrarea, pentru afișare și traducere.</li>
          <li>Fișierele (ex. PDF) pe care le încarci pentru prezentare.</li>
          <li>Date tehnice minime (adresă IP, tip de dispozitiv) necesare funcționării conexiunii.</li>
          <li>Titlurile, datele și orele ședințelor pe care le programezi.</li>
        </ul>

        <h2>3. De ce le prelucrăm (temeiuri legale)</h2>
        <ul>
          <li>Executarea serviciului pe care îl ceri (art. 6(1)(b) GDPR): conectarea la ședințe, trimiterea invitațiilor.</li>
          <li>Consimțământul tău (art. 6(1)(a)): activarea subtitrării/transcrierii și, dacă e cazul, înregistrarea.</li>
          <li>Interesul nostru legitim (art. 6(1)(f)): securitatea și buna funcționare a serviciului.</li>
        </ul>

        <h2>4. Cui transmitem datele (împuterniciți)</h2>
        <p>Folosim furnizori care prelucrează date în numele nostru:</p>
        <ul>
          <li>LiveKit — transmiterea audio/video în timp real.</li>
          <li>Supabase — baza de date și stocarea fișierelor.</li>
          <li>Vercel — găzduirea aplicației.</li>
          <li>Resend — trimiterea email-urilor de invitație.</li>
          <li>MyMemory / DeepL — traducerea subtitrărilor (doar textul transcris).</li>
        </ul>
        <p>
          Unii dintre acești furnizori pot prelucra date în afara Spațiului Economic European (ex. SUA).
          În aceste cazuri transferul se face pe baza clauzelor contractuale standard aprobate de
          Comisia Europeană. Ai încheiat acorduri de prelucrare a datelor (DPA) cu fiecare furnizor.
        </p>

        <h2>5. Cât timp păstrăm datele</h2>
        <p>
          Streamurile audio/video nu sunt stocate. Ședințele programate, prezentările și fișierele
          încărcate se păstrează până le ștergi sau maximum 12 luni. Poți cere ștergerea oricând.
        </p>

        <h2>6. Drepturile tale</h2>
        <p>
          Ai dreptul de acces, rectificare, ștergere, restricționare, portabilitate, opoziție și de a-ți
          retrage consimțământul. Pentru a le exercita, scrie la andreaszolomajer@yahoo.com. Ai de asemenea dreptul de a
          depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter
          Personal (ANSPDCP), www.dataprotection.ro.
        </p>

        <h2>7. Cookie-uri și stocare locală</h2>
        <p>
          Folosim doar stocare strict necesară funcționării (menținerea sesiunii video și a preferinței
          de consimțământ). Nu folosim cookie-uri de publicitate sau urmărire.
        </p>

        <h2>8. Securitate</h2>
        <p>
          Conexiunile sunt criptate (HTTPS/WebRTC). Aplicăm măsuri tehnice rezonabile pentru protejarea
          datelor, dar niciun sistem nu e complet lipsit de risc.
        </p>

        <h2>9. Minori</h2>
        <p>
          Aula nu este destinată persoanelor sub 16 ani fără acordul unui părinte sau tutore.
        </p>

        <h2>10. Modificări</h2>
        <p>Putem actualiza această politică; vom marca data ultimei modificări mai sus.</p>

        <h2>11. Contact</h2>
        <p>Pentru orice întrebare legată de datele tale: andreaszolomajer@yahoo.com.</p>

        <div className="legal-links">
          <Link href="/termeni">Termeni și condiții</Link>
          <Link href="/">Acasă</Link>
        </div>
      </div>
    </div>
  );
}
