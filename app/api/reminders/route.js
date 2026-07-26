import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabase } from '../../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function emailHtml({ title, whenLabel, durationMinutes, hostName, joinUrl, kind }) {
  const head = kind === '24h' ? 'Îți amintim: ai o ședință mâine' : 'Ședința ta începe în curând';
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto">
      <h2 style="color:#6D74F0">${head}</h2>
      <p><b>${title}</b></p>
      <p>📅 ${whenLabel} · ⏱ ${durationMinutes} min</p>
      ${hostName ? `<p>Organizator: ${hostName}</p>` : ''}
      <p style="margin:24px 0">
        <a href="${joinUrl}" style="background:#6D74F0;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600">Intră în ședință</a>
      </p>
      <p style="color:#8A97AB;font-size:13px">Sau copiază linkul: ${joinUrl}</p>
    </div>`;
}

// Apelat periodic de un cron extern gratuit (ex. cron-job.org) la ~15 min.
export async function GET(req) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  const resendKey = process.env.RESEND_API_KEY;
  if (!supabase || !resendKey) {
    return NextResponse.json({ ok: true, sent: 0, note: 'Supabase sau Resend lipsă.' });
  }

  const resend = new Resend(resendKey);
  const from = process.env.EMAIL_FROM || 'Aula <onboarding@resend.dev>';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const now = Date.now();

  const windows = [
    { flag: 'reminded_24h', minMs: 23 * 3600e3, maxMs: 24 * 3600e3, kind: '24h' },
    { flag: 'reminded_1h', minMs: 0, maxMs: 3600e3, kind: '1h' },
  ];

  let sent = 0;
  for (const w of windows) {
    const fromT = new Date(now + w.minMs).toISOString();
    const toT = new Date(now + w.maxMs).toISOString();
    let meetings = [];
    try {
      const { data } = await supabase
        .from('meetings')
        .select('*')
        .eq(w.flag, false)
        .gte('start_time', fromT)
        .lte('start_time', toT);
      meetings = data || [];
    } catch (e) {
      continue;
    }

    for (const m of meetings) {
      const invitees = (m.invitees || []).filter(Boolean);
      const start = new Date(m.start_time);
      const whenLabel = start.toLocaleString('ro-RO', { dateStyle: 'full', timeStyle: 'short' });
      const joinUrl = `${appUrl}/room/${m.room}`;
      const html = emailHtml({ title: m.title, whenLabel, durationMinutes: m.duration_minutes, hostName: m.host_name, joinUrl, kind: w.kind });
      for (const to of invitees) {
        try { await resend.emails.send({ from, to, subject: `Reminder: ${m.title}`, html }); sent++; } catch (e) {}
      }
      try { await supabase.from('meetings').update({ [w.flag]: true }).eq('id', m.id); } catch (e) {}
    }
  }

  return NextResponse.json({ ok: true, sent });
}
