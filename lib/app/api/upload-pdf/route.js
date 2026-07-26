import { NextResponse } from 'next/server';
import { getSupabase } from '../../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'pdfs';

export async function POST(req) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Baza de date nu e configurată.' }, { status: 400 });
  }

  let file;
  try {
    const form = await req.formData();
    file = form.get('file');
  } catch (e) {
    return NextResponse.json({ error: 'Fișier lipsă.' }, { status: 400 });
  }
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Fișier lipsă.' }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;

  // Creează bucketul public dacă nu există (ignoră eroarea dacă există deja)
  try {
    await supabase.storage.createBucket(BUCKET, { public: true });
  } catch (e) {}

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(name, bytes, { contentType: 'application/pdf', upsert: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(name);
  return NextResponse.json({ url: data.publicUrl });
}
