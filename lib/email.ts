// Envío de mails con Resend (https://resend.com), sin librerías extra.
import { emailContent } from './messages';
import type { BookingFull, MessageKind } from './types';

export type MailKind = Exclude<MessageKind, 'prueba'>;

export async function sendBookingEmail(kind: MailKind, b: BookingFull): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return { ok: false, error: 'Falta configurar RESEND_API_KEY o EMAIL_FROM en Vercel' };
  const to = b.clients?.email;
  if (!to) return { ok: false, error: 'La clienta no tiene mail cargado' };

  const { subject, html } = emailContent(kind, b);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      reply_to: process.env.EMAIL_REPLY_TO || undefined,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body?.message || `Resend respondió ${res.status}` };
  }
  return { ok: true };
}
