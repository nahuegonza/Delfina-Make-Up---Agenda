'use client';
import { supabase } from './supabase/client';
import { logMessage, sendEmail } from './data';
import { wasSent } from './reminders';
import type { BookingFull, MessageKind } from './types';

export interface ActionResult {
  message: string;
}

/**
 * Se llama después de tocar el botón de WhatsApp de un mensaje.
 * Registra el envío y, si es la confirmación, pasa el turno a "Confirmada"
 * y manda el mail de confirmación (si la clienta tiene mail).
 */
export async function afterWhatsapp(b: BookingFull, kind: MessageKind): Promise<ActionResult> {
  await logMessage(b.id, kind, kind === 'prueba' ? 'interno' : 'whatsapp');
  if (kind !== 'confirmacion') return { message: 'Marcado como enviado' };

  if (b.status === 'senada') {
    await supabase().from('bookings').update({ status: 'confirmada' }).eq('id', b.id);
  }
  if (b.clients?.email && !wasSent(b, 'confirmacion', 'email')) {
    const r = await sendEmail(b.id, 'confirmacion');
    return { message: r.ok ? 'Turno confirmado y mail enviado' : `Turno confirmado. Mail: ${r.error}` };
  }
  return { message: 'Turno confirmado' };
}
