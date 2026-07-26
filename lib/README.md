# Aula — întâlniri video, gratuit

Aplicație de conferințe video reală, construită cu Next.js + LiveKit.
Funcționează cu **video, audio, chat, partajare ecran, listă de participanți și mute** — totul din componenta oficială LiveKit.

Poți rula și publica totul **fără să plătești nimic** (nivel gratuit LiveKit + Vercel).

---

## Ce îți trebuie (o singură dată)

1. **Node.js** instalat pe calculator — descarcă de la https://nodejs.org (versiunea LTS).
2. Un cont **gratuit** LiveKit Cloud — https://cloud.livekit.io

---

## Pasul 1 — Cheile gratuite LiveKit

1. Intră pe https://cloud.livekit.io și fă un cont gratuit (planul **Build** = 0 lei, 5.000 minute/lună).
2. Creează un proiect nou.
3. Mergi la **Settings → Keys** și copiază:
   - `API Key`
   - `API Secret`
   - URL-ul proiectului (arată ca `wss://ceva.livekit.cloud`)

## Pasul 2 — Configurează proiectul

În folderul aplicației, copiază fișierul de exemplu și completează cheile:

```bash
cp .env.example .env.local
```

Deschide `.env.local` și pune valorile tale:

```
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
NEXT_PUBLIC_LIVEKIT_URL=wss://proiectul-tau.livekit.cloud
```

## Pasul 3 — Pornește local

```bash
npm install
npm run dev
```

Deschide http://localhost:3000, scrie un nume și o sală, apasă „Intră în ședință”.
Deschide același link într-o a doua fereastră (sau pe alt calculator) cu **același nume de sală** — vă veți vedea și auzi în timp real.

---

## Pasul 4 — Publică GRATUIT online (ca să intre oricine, de oriunde)

1. Pune codul pe **GitHub** (repository nou).
2. Intră pe https://vercel.com, cont gratuit, „Import Project” → alege repo-ul.
3. La **Environment Variables** adaugă aceleași 3 variabile din `.env.local`.
4. Apasă **Deploy**.

În ~1 minut primești un link public de forma `https://aula-xxx.vercel.app` pe care îl poți trimite oricui.

> Notă: planul gratuit Vercel (Hobby) e pentru proiecte necomerciale. Când începi să încasezi bani, treci pe planul Pro (~20 $/lună). Până atunci — gratuit.

---

---

## Programare ședințe + invitații pe email (opțional)

Această parte are nevoie de două conturi gratuite în plus. **Dacă nu le configurezi, restul aplicației merge normal** — doar programarea rămâne inactivă.

### A) Baza de date — Supabase (gratuit)
1. Cont gratuit pe https://supabase.com → proiect nou.
2. Mergi la **SQL Editor**, lipește conținutul din `supabase-schema.sql` și apasă **Run** (creează tabelul `meetings`).
3. Mergi la **Project Settings → API** și copiază:
   - `Project URL` → `SUPABASE_URL`
   - cheia `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### B) Emailuri — Resend (gratuit, 3.000/lună)
1. Cont gratuit pe https://resend.com → **API Keys** → creează o cheie → `RESEND_API_KEY`.
2. Pentru **testare**, lasă `EMAIL_FROM=Aula <onboarding@resend.dev>` (trimite doar către adresa contului tău).
3. Pentru trimitere **reală către oricine**, verifică un domeniu al tău în Resend (**Domains → Add**) și pune-l în `EMAIL_FROM`.

Adaugă toate aceste valori în `.env.local` (vezi `.env.example`).
Apoi accesează `/schedule` în aplicație: completezi titlul, data, invitații — și pleacă emailurile cu link de intrare + fișier de calendar (.ics).

---

## Ce e inclus deja
- Apel video/audio multi-participant (LiveKit gestionează WebRTC-ul greu)
- Chat text în ședință
- Partajare ecran
- Mute microfon / oprire cameră
- Listă participanți
- Buton de ieșire
- **Programare ședințe + invitații pe email cu fișier de calendar**
- **Listă cu ședințele viitoare**
- **Subtitrare live cu traducere în 7 limbi** (RO, EN, ES, FR, DE, HU, IT)
- **Editor de prezentări** (tip PowerPoint): slide-uri, layout-uri, teme, mod de prezentare pe tot ecranul
- **Fundal virtual**: blur, 4 fundaluri gata făcute sau imaginea ta încărcată
- **Prezentare sincronizată live**: prezentatorul controlează slide-urile, ele apar la toți în timp real (fără partajare de ecran)
- **Camere separate (breakout rooms)**: creezi grupuri, participanții se împart în ele și revin în sala principală; buton „cheamă pe toți înapoi"
- **Import PDF / PowerPoint**: încarci un PDF (exportă din PowerPoint: Fișier → Salvare ca → PDF) și îl prezinți live tuturor, cu designul tău păstrat exact
- **Pagini legale (GDPR)**: confidențialitate, termeni, banner de cookies și notificare de consimțământ (vezi `LEGAL.md`)
- **Reacții + ridică mâna**: emoji-uri care plutesc pe ecranul tuturor și indicator „mână ridicată"
- **Conturi de utilizator** (opțional): autentificare gratuită prin Supabase Auth; ședințele și prezentările devin per-utilizator
- **Înregistrare ședință**: înregistrează în browser (fereastra/tab-ul ședinței + microfon) și descarci un fișier video `.webm`
- **Opt-in marketing + leaduri**: la înregistrare, o bifă opțională „vreau noutăți pe email"; adminii văd și exportă leadurile la `/leads`
- **Tablă albă partajată**: desenezi împreună în timp real (culori, grosimi, radieră, șterge tot)
- **Sondaje**: creezi o întrebare cu opțiuni, toți votează și rezultatele apar live
- **Controale de gazdă**: primul venit devine gazdă și poate opri microfonul tuturor, da mute individual sau scoate un participant

### Despre leaduri (lead magnet)
Bifa de la înregistrare (nebifată implicit) stochează consimțământul pentru marketing în contul utilizatorului. Doar emailurile celor care bifează pot fi folosite pentru newslettere — nu și emailurile invitaților la ședințe. Adaugă emailul tău în `ADMIN_EMAILS` (în `.env.local`) ca să vezi lista la `/leads` și s-o exporți în CSV, pe care apoi îl poți importa într-o platformă de email marketing (Brevo, MailerLite, Mailchimp).

### Despre înregistrare
Butonul „⏺ Înregistrează" din colțul dreapta-jos. Alegi fereastra/tab-ul de partajat (bifează „partajează sunetul tab-ului"), iar la oprire se descarcă un `.webm`. Merge cel mai bine în Chrome/Edge. Fiecare persoană își face propria înregistrare, local — nu costă nimic. Informează participanții înainte de a înregistra (notificarea de la intrare acoperă asta).

### Despre conturi
Adaugă cheile publice `NEXT_PUBLIC_SUPABASE_URL` și `NEXT_PUBLIC_SUPABASE_ANON_KEY` în `.env.local` (din Supabase → Project Settings → API), apoi în Supabase → Authentication activează Email. Pagina `/login` permite creare cont, conectare cu parolă sau link magic. Când ești conectat, ședințele și prezentările tale sunt legate de contul tău. Intrarea invitaților într-o ședință rămâne fără cont (prin link). Un singur proiect Supabase poate alimenta autentificarea în toate aplicațiile tale (login unic / SSO).

### Despre importul PDF
În ședință: „📽 Prezintă live" → „📄 Încarcă PDF". Fișierul se salvează în Supabase Storage (bucketul `pdfs`, creat automat), iar către participanți se trimite doar linkul + pagina curentă. Fiecare randează pagina local cu pdf.js. Necesită Supabase configurat. Pe Vercel gratuit, fișierele foarte mari (>4 MB) pot fi respinse — exportă PDF-uri de dimensiune rezonabilă.

### Despre subtitrare
Fiecare participant apasă butonul **CC** din bara de subtitrare, alege limba pe care o vorbește și limba în care vrea să vadă. Vocea e transcrisă în browser (gratuit), trimisă celorlalți și tradusă automat.
- Merge cel mai bine în **Chrome** sau **Edge** (folosesc Web Speech API). Firefox/Safari au suport limitat.
- Traducerea e gratuită prin MyMemory (fără cont). Pune o cheie `DEEPL_API_KEY` pentru calitate mai bună.
- Necesită HTTPS — merge pe `localhost` și după deploy pe Vercel.

### Despre fundalul virtual
Butonul „🖼 Fundal" din colțul stânga-sus al ședinței. Pornește camera, apoi alegi blur, un fundal presetat sau încarci propria imagine. Rulează în browser (MediaPipe).

## Aplicație desktop (Windows / Mac / Linux)
În folderul `desktop/` ai o aplicație nativă (Tauri) care deschide Aula într-o fereastră proprie, ca un program instalabil. Vezi `desktop/README-desktop.md`. Pe scurt: pui linkul tău Vercel în config, instalezi Rust, rulezi `npm install` + `npm run build`, și obții un instalator (`.msi`/`.exe` pe Windows).

## Ce adăugăm în etapele următoare
- Sală de așteptare (lobby): gazda admite participanții
- Conturi și niveluri plătite (Stripe)

## Redenumire
Ca să schimbi numele „Aula”, caută-l în `app/layout.jsx`, `app/page.jsx` și `README.md`.
