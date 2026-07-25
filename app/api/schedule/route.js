import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabase } from '../../../lib/supabase';
import { getUserFromRequest } from '../../../lib/authUser';
import { buildIcs } from '../../../lib/ics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function slugify(text) {
  return (
    (text || 'sedinta')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30) || 'sedinta'
  );
}

// ---- Creează o ședință programată + trimite invitații ----
export async function POST(req) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Cerere invalidă.' }, { status: 400 });
  }

  const { title, date, time, duration, hostName } = body;
  let invitees = body.invitees || [];
  if (typeof invitees === 'string') {
    invitees = invitees.split(/[\n,;]+/);
  }
  invitees = invitees.map((e) => e.trim()).filter(Boolean);

  if (!title || !date || !time) {
    return NextResponse.json(
      { error: 'Titlul, data și ora sunt obligatorii.' },
      { status: 400 }
    );
  }

  const durationMinutes = Number(duration) || 30;
  const start = new Date(`${date}T${time}`);
  if (isNaN(start.getTime())) {
    return NextResponse.json({ error: 'Data sau ora nu sunt valide.' }, { status: 400 });
  }

  const room = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const joinUrl = `${appUrl}/room/${room}`;
  const uid = `${room}@aula`;

  // 1) Salvează în baza de date (dacă e configurată)
  const supabase = getSupabase();
  const user = await getUserFromRequest(req);
  let saved = false;
  if (supabase) {
    const { error } = await supabase.from('meetings').insert({
      title,
      room,
      start_time: start.toISOString(),
      duration_minutes: durationMinutes,
      host_name: hostName || null,
      invitees,
      user_id: user?.id || null,
    });
    if (!error) saved = true;
  }

  // 2) Construiește invitația de calendar (.ics)
  const ics = buildIcs({
    title,
    description: `Intră în ședință: ${joinUrl}`,
    start,
    durationMinutes,
    url: joinUrl,
    uid,
  });
  const icsBase64 = Buffer.from(ics, 'utf-8').toString('base64');

  // 3) Trimite emailuri (dacă Resend e configurat)
  let emailsSent = 0;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Aula <onboarding@resend.dev>';

  if (resendKey && invitees.length) {
    const resend = new Resend(resendKey);
    const whenLabel = start.toLocaleString('ro-RO', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto">
        <h2 style="color:#6D74F0">Ai o invitație la o ședință Aula</h2>
        <p><b>${title}</b></p>
        <p>📅 ${whenLabel} · ⏱ ${durationMinutes} min</p>
        ${hostName ? `<p>Organizator: ${hostName}</p>` : ''}
        <p style="margin:24px 0">
          <a href="${joinUrl}" style="background:#6D74F0;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600">
            Intră în ședință
          </a>
        </p>
        <p style="color:#8A97AB;font-size:13px">Sau copiază linkul: ${joinUrl}</p>
        <p style="color:#8A97AB;font-size:12px">Fișierul atașat adaugă ședința în calendarul tău.</p>
      </div>`;

    for (const to of invitees) {
      try {
        await resend.emails.send({
          from,
          to,
          subject: `Invitație: ${title}`,
          html,
          attachments: [{ filename: 'invitatie.ics', content: icsBase64 }],
        });
        emailsSent++;
      } catch (e) {
        // continuă cu următorul destinatar
      }
    }
  }

  return NextResponse.json({
    ok: true,
    room,
    joinUrl,
    saved,
    emailsSent,
    invited: invitees.length,
  });
}

// ---- Listează ședințele viitoare ----
export async function GET(req) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ meetings: [], configured: false });
  }
  const user = await getUserFromRequest(req);
  let q = supabase.from('meetings').select('*');
  q = user ? q.eq('user_id', user.id) : q.is('user_id', null);
  const { data, error } = await q.order('start_time', { ascending: true });

  if (error) {
    return NextResponse.json({ meetings: [], configured: true, error: error.message });
  }
  return NextResponse.json({ meetings: data || [], configured: true });
}
