import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Traduce un text. Ordinea de calitate: DeepL (dacă ai cheie) → Google (gratuit,
// fără cheie, foarte bun pe ro↔hu) → MyMemory (ultima soluție).
// Motivul rescrierii: MyMemory se blochează repede la subtitrare continuă și
// returnează textul original (de asta "dacă vorbeai română, tot română scria").

// Cache scurt în memorie ca să nu retraducem aceleași fraze (reduce cererile).
const CACHE = new Map();
const CACHE_MAX = 500;
function cacheGet(k) {
  const v = CACHE.get(k);
  if (v !== undefined) { CACHE.delete(k); CACHE.set(k, v); } // reîmprospătează ordinea
  return v;
}
function cacheSet(k, v) {
  CACHE.set(k, v);
  if (CACHE.size > CACHE_MAX) CACHE.delete(CACHE.keys().next().value);
}

function looksBroken(text, original) {
  if (!text) return true;
  const up = text.toUpperCase();
  if (up.includes('MYMEMORY WARNING')) return true;
  if (up.includes('QUOTA') && up.includes('USED')) return true;
  if (up.includes('INVALID') && up.includes('LANGUAGE')) return true;
  return false;
}

// --- DeepL (opțional, cea mai bună calitate) ---
async function viaDeepL(q, source, target, key) {
  const params = new URLSearchParams();
  params.append('text', q);
  params.append('target_lang', target.toUpperCase());
  if (source && source !== 'auto') params.append('source_lang', source.toUpperCase());
  const r = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  const d = await r.json();
  return d?.translations?.[0]?.text || '';
}

// --- Google (gratuit, fără cont) — endpoint public folosit de widgetul web ---
async function viaGoogle(q, source, target) {
  const sl = source && source !== 'auto' ? source : 'auto';
  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx' +
    `&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) return '';
  const d = await r.json();
  // Format: [[["tradus","original",...],["tradus2","original2",...]], ...]
  if (!Array.isArray(d) || !Array.isArray(d[0])) return '';
  return d[0].map((seg) => (seg && seg[0]) || '').join('');
}

// --- MyMemory (ultima soluție, gratuit) ---
async function viaMyMemory(q, source, target) {
  const langpair = `${source && source !== 'auto' ? source : 'en'}|${target}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${encodeURIComponent(langpair)}`;
  const r = await fetch(url);
  const d = await r.json();
  return d?.responseData?.translatedText || '';
}

export async function POST(req) {
  const { q, source, target } = await req.json().catch(() => ({}));
  if (!q || !target) return NextResponse.json({ text: q || '' });
  if (source && source === target) return NextResponse.json({ text: q });

  const key = `${source || 'auto'}|${target}|${q}`;
  const cached = cacheGet(key);
  if (cached !== undefined) return NextResponse.json({ text: cached, cached: true });

  const deeplKey = process.env.DEEPL_API_KEY;

  // 1) DeepL
  if (deeplKey) {
    try {
      const t = await viaDeepL(q, source, target, deeplKey);
      if (t && !looksBroken(t, q)) { cacheSet(key, t); return NextResponse.json({ text: t, via: 'deepl' }); }
    } catch (e) { /* fallback */ }
  }

  // 2) Google
  try {
    const t = await viaGoogle(q, source, target);
    if (t && !looksBroken(t, q)) { cacheSet(key, t); return NextResponse.json({ text: t, via: 'google' }); }
  } catch (e) { /* fallback */ }

  // 3) MyMemory
  try {
    const t = await viaMyMemory(q, source, target);
    if (t && !looksBroken(t, q)) { cacheSet(key, t); return NextResponse.json({ text: t, via: 'mymemory' }); }
  } catch (e) { /* returnează originalul */ }

  return NextResponse.json({ text: q, via: 'none' });
}
