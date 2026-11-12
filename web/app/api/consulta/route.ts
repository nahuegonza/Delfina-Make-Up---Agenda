import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Recibe las consultas del formulario: las manda por mail a contacto@ (Resend)
// y las guarda en Supabase para verlas en la agenda (Mi web → Consultas).
export const dynamic = 'force-dynamic';

// Límite simple por IP (por instancia): 5 consultas cada 10 minutos.
const hits = new Map<string, number[]>();
function tooMany(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 5;
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function POST(request: Request) {
  const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

  // Solo desde esta misma web.
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host && new URL(origin).host !== host) return fail('Origen no permitido', 403);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return fail('Pedido inválido');

  // Trampas para robots: campo oculto completo o envío demasiado rápido.
  if (clean(body.website, 200) || Number(body.elapsed) < 2500) return NextResponse.json({ ok: true });
  const ip = request.headers.get('x-nf-client-connection-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'sin-ip';
  if (tooMany(ip)) return fail('Recibí varias consultas seguidas. Probá en unos minutos o escribime por WhatsApp.', 429);

  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 40);
  const service = clean(body.service, 120);
  const zone = clean(body.zone, 40);
  const message = clean(body.message, 2000);
  const date = clean(body.event_date, 10);
  const event_date = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;

  if (!name) return fail('Contame tu nombre.');
  if (!email && !phone) return fail('Dejame un mail o un teléfono para responderte.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Revisá el mail, parece que tiene un error.');

  // 1) Mail a Delfina
  let emailSent = false;
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Delfina Acuña Makeup <contacto@delfinamakeup.com>';
  const to = process.env.EMAIL_INQUIRIES_TO || 'contacto@delfinamakeup.com';
  const fecha = event_date ? event_date.split('-').reverse().join('/') : 'sin fecha';
  if (key) {
    const rows: [string, string][] = [
      ['Nombre', name], ['Fecha del evento', fecha], ['Servicio', service || '—'], ['Zona', zone || '—'],
      ['Mail', email || '—'], ['Teléfono', phone || '—'],
    ];
    const digits = phone.replace(/\D/g, '');
    const wa = digits ? `https://wa.me/${digits.startsWith('54') ? digits : '549' + digits.replace(/^0/, '')}` : null;
    const html = `<div style="font-family:Arial,sans-serif;color:#2a0f1f;max-width:560px">
<h2 style="font-weight:400;color:#7b024d">Nueva consulta desde la web</h2>
<table style="border-collapse:collapse;width:100%">${rows.map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#6b4757">${k}</td><td style="padding:6px 0"><b>${esc(v)}</b></td></tr>`).join('')}</table>
${message ? `<p style="margin-top:16px;padding:14px;background:#fbf1f4;border-radius:12px;white-space:pre-line">${esc(message)}</p>` : ''}
<p style="margin-top:20px">${email ? 'Respondé este mail para contestarle directamente.' : ''}${wa ? ` <a href="${wa}" style="color:#7b024d">Escribirle por WhatsApp</a>` : ''}</p>
<p style="color:#9a7f8b;font-size:12px">También la tenés en la agenda, en Mi web → Consultas.</p></div>`;
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject: `Consulta web: ${name} · ${service || 'servicio'} · ${fecha}`, html, reply_to: email || undefined }),
      });
      emailSent = res.ok;
      if (!res.ok) console.error('consulta: Resend respondió', res.status, await res.text().catch(() => ''));
    } catch (e) {
      console.error('consulta: no se pudo mandar el mail', e);
    }
  }

  // 2) Guardarla para la agenda
  let saved = false;
  const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, '');
  const anon = process.env.SUPABASE_ANON_KEY?.trim();
  if (url && anon) {
    const db = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await db.from('web_inquiries').insert({
      name, email: email || null, phone: phone || null, event_date, service: service || null, zone: zone || null, message: message || null, email_sent: emailSent,
    });
    saved = !error;
    if (error) console.error('consulta: no se pudo guardar', error.message);
  }

  if (!emailSent && !saved) return fail('No se pudo enviar. Probá de nuevo o escribime por WhatsApp.', 500);
  return NextResponse.json({ ok: true });
}
