import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Traduce un text. Ordinea: DeepL (dacă ai cheie) → MyMemory (gratuit, fără cheie).
export async function POST(req) {
  const { q, source, target } = await req.json().catch(() => ({}));
  if (!q || !target) return NextResponse.json({ text: q || '' });
  if (source === target) return NextResponse.json({ text: q });

  // 1) DeepL (opțional, calitate mai bună) — https://www.deepl.com/pro-api (500.000 caractere/lună gratis)
  const deeplKey = process.env.DEEPL_API_KEY;
  if (deeplKey) {
    try {
      const params = new URLSearchParams();
      params.append('text', q);
      params.append('target_lang', target.toUpperCase());
      if (source) params.append('source_lang', source.toUpperCase());
      const r = await fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${deeplKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });
      const d = await r.json();
      const t = d?.translations?.[0]?.text;
      if (t) return NextResponse.json({ text: t });
    } catch (e) {
      /* trece la fallback */
    }
  }

  // 2) MyMemory — gratuit, fără cheie
  try {
    const langpair = `${source || 'en'}|${target}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      q
    )}&langpair=${encodeURIComponent(langpair)}`;
    const r = await fetch(url);
    const d = await r.json();
    const t = d?.responseData?.translatedText;
    if (t) return NextResponse.json({ text: t });
  } catch (e) {
    /* returnează originalul */
  }

  return NextResponse.json({ text: q });
}
