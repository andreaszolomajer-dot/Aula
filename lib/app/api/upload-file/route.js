import { NextResponse } from 'next/server';
import { getSupabase } from '../../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'files';

export async function POST(req) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Baza de date nu e configurată.' }, { status: 400 });

  let file;
  try {
    const form = await req.formData();
    file = form.get('file');
  } catch (e) {
    return NextResponse.json({ error: 'Fișier lipsă.' }, { status: 400 });
  }
  if (!file || typeof file === 'string') return NextResponse.json({ error: 'Fișier lipsă.' }, { status: 400 });

  const origName = file.name || 'fisier';
  const safe = origName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60);
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${safe}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  try { await supabase.storage.createBucket(BUCKET, { public: true }); } catch (e) {}

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(name, bytes, { contentType: file.type || 'application/octet-stream', upsert: true });
  if (error) {
    const m = /bucket|not found|exist/i.test(error.message || '')
      ? 'Creează întâi un bucket public numit „files” în Supabase → Storage.'
      : error.message;
    return NextResponse.json({ error: m }, { status: 500 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(name);
  return NextResponse.json({ url: data.publicUrl, name: origName });
}
