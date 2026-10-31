import { NextResponse } from 'next/server';
import { sendBookingEmail, type MailKind } from '@/lib/email';
import { addDays, todayAR } from '@/lib/format';
import { applicableKinds, wasSent } from '@/lib/reminders';
import { supabaseAdmin } from '@/lib/supabase/server';
import { BOOKING_SELECT, type BookingFull } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Vercel llama a esta ruta todos los días a las 9:00 (hora de Buenos Aires).
// Manda por mail las indicaciones (7 días antes), el recordatorio (1 día antes)
// y el agradecimiento (1 día después) a las clientas que tienen mail cargado.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const today = todayAR();
  const targets: Record<string, MailKind> = {
    [addDays(today, 7)]: 'indicaciones',
    [addDays(today, 1)]: 'recordatorio',
    [addDays(today, -1)]: 'agradecimiento',
  };

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('bookings')
    .select(BOOKING_SELECT)
    .in('date', Object.keys(targets))
    .in('status', ['senada', 'confirmada', 'realizada', 'cobrada']);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: { booking: string; kind: string; ok: boolean; error?: string }[] = [];
  for (const raw of (data ?? []) as (BookingFull & { owner_id: string })[]) {
    const kind = targets[raw.date];
    if (!raw.clients?.email) continue;
    if (!applicableKinds(raw).includes(kind)) continue;
    if (wasSent(raw, kind, 'email')) continue;

    const r = await sendBookingEmail(kind, raw);
    if (r.ok) {
      await db
        .from('message_log')
        .upsert({ owner_id: raw.owner_id, booking_id: raw.id, kind, channel: 'email' }, { onConflict: 'booking_id,kind,channel', ignoreDuplicates: true });
    }
    results.push({ booking: raw.id, kind, ok: r.ok, error: r.ok ? undefined : r.error });
  }

  return NextResponse.json({ date: today, sent: results.filter((r) => r.ok).length, results });
}
