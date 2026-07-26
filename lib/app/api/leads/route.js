import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '../../../lib/authUser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Neautentificat.' }, { status: 401 });

  const admins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!admins.includes((user.email || '').toLowerCase())) {
    return NextResponse.json({ error: 'Acces interzis.' }, { status: 403 });
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return NextResponse.json({ leads: [] });

  const admin = createClient(url, service);
  const leads = [];
  let page = 1;
  const perPage = 1000;
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) break;
    const users = data?.users || [];
    for (const u of users) {
      if (u.user_metadata?.marketing_opt_in) {
        leads.push({ email: u.email, created_at: u.created_at });
      }
    }
    if (users.length < perPage) break;
    page++;
  }

  return NextResponse.json({ leads });
}
