import { NextResponse } from 'next/server';
import { sendBookingEmail, type MailKind } from '@/lib/email';
import { supabaseServer } from '@/lib/supabase/server';
import { BOOKING_SELECT, type BookingFull } from '@/lib/types';

const KINDS: MailKind[] = ['confirmacion', 'indicaciones', 'recordatorio', 'agradecimiento'];

// Manda un mail de un turno, a pedido de Delfina (requiere sesión iniciada).
export async function POST(request: Request) {
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sesión vencida, volvé a ingresar' }, { status: 401 });

  const { bookingId, kind } = (await request.json().catch(() => ({}))) as { bookingId?: string; kind?: MailKind };
  if (!bookingId || !kind || !KINDS.includes(kind)) return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 });

  // Por las reglas de seguridad, solo devuelve el turno si es de esta usuaria.
  const { data, error } = await db.from('bookings').select(BOOKING_SELECT).eq('id', bookingId).maybeSingle();
  if (error || !data) return NextResponse.json({ error: 'No se encontró el turno' }, { status: 404 });

  const result = await sendBookingEmail(kind, data as BookingFull);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });

  await db
    .from('message_log')
    .upsert({ booking_id: bookingId, kind, channel: 'email' }, { onConflict: 'booking_id,kind,channel', ignoreDuplicates: true });
  return NextResponse.json({ ok: true });
}
