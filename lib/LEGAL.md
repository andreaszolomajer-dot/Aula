# Partea legală — ce ai de făcut

Aula include pagini legale ca **șabloane**. Nu sunt sfat juridic. Înainte să iei bani pe serviciu,
completează câmpurile de mai jos și cere unui avocat să confirme.

## 1. Completează câmpurile [între paranteze]
În `app/confidentialitate/page.jsx` și `app/termeni/page.jsx` înlocuiește:
- `[NUMELE COMPANIEI / PERSOANEI]`, `[ADRESA]`, `[EMAIL]`
- `[DATA]`, `[PERIOADA]`, `[ȚARA/JUDEȚUL]`, `[16]`

## 2. Semnează acorduri de prelucrare (DPA) cu furnizorii
GDPR cere un DPA cu fiecare împuternicit. Toți oferă unul standard, de obicei din contul tău:
- LiveKit, Supabase, Vercel, Resend, DeepL (dacă îl folosești).
MyMemory: dacă rămâne varianta gratuită fără cont, evită să trimiți date sensibile prin subtitrare
sau treci pe DeepL (are DPA și opțiune EU).

## 3. Transferuri în afara UE
Unii furnizori procesează în SUA. Asigură-te că folosești clauzele contractuale standard (SCC),
incluse de obicei în DPA-ul lor. Unde e posibil, alege regiune EU (Supabase permite regiune EU;
Resend menționează originea trimiterii în Irlanda).

## 4. Consimțământ pentru înregistrare/transcriere
- Subtitrarea pornește doar când utilizatorul apasă „CC" — consimțământ prin acțiune.
- La intrarea în ședință apare o notificare (`RoomNotice`) care informează despre transcriere/înregistrare.
- Dacă adaugi înregistrarea automată, cere consimțământ explicit înainte de pornire.

## 5. Autoritatea din România
Nu mai e nevoie de „notificare" la ANSPDCP (abrogată prin GDPR), dar trebuie să respecți drepturile
persoanelor și, la cerere, să poți dovedi conformitatea (registru de prelucrări, temeiuri, DPA-uri).

## 6. Cookie-uri
Aula folosește doar stocare esențială (sesiune + preferință de consimțământ). Bannerul `CookieConsent`
informează utilizatorii. Dacă adaugi analytics sau marketing, ai nevoie de consimțământ prealabil și
de opțiune de refuz — actualizează bannerul și politica.

---
Rezumat: șabloanele îți dau structura corectă; personalizarea + confirmarea unui avocat te fac conform.
