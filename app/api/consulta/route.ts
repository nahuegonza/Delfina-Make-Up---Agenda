import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Recibe las consultas del formulario de delfinamakeup.com:
// las guarda en la agenda (Mi web → Consultas) y las manda por mail a contacto@.

const ALLOWED = (process.env.WEB_ORIGINS || 'https://delfinamakeup.com,https://www.delfinamakeup.com')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

function cors(origin: string | null) {
  const ok = origin && (ALLOWED.includes(origin) || /^https:\/\/[a-z0-9-]+--delfina-makeup\.netlify\.app$/.test(origin) || origin === 'https://delfina-makeup.netlify.app' || /^http:\/\/localhost:\d+$/.test(origin));
  return {
    'Access-Control-Allow-Origin': ok ? origin! : ALLOWED[0] ?? '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: cors(request.headers.get('origin')) });
}

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
  const headers = cors(request.headers.get('origin'));
  const fail = (error: string, status = 400) => NextResponse.json({ error }, { status, headers });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return fail('Pedido inválido');

  // Trampas para robots: campo oculto completo o envío demasiado rápido.
  if (clean(body.website, 200) || Number(body.elapsed) < 2500) return NextResponse.json({ ok: true }, { headers });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'sin-ip';
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

  const db = supabaseAdmin();
  const { data: row, error } = await db
    .from('web_inquiries')
    .insert({ name, email: email || null, phone: phone || null, event_date, service: service || null, zone: zone || null, message: message || null })
    .select('id')
    .single();
  if (error) {
    console.error('consulta: no se pudo guardar', error.message);
    return fail('No se pudo enviar. Probá de nuevo o escribime por WhatsApp.', 500);
  }

  // Mail a Delfina (si falla, la consulta igual queda guardada en la agenda).
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const to = process.env.EMAIL_INQUIRIES_TO || 'contacto@delfinamakeup.com';
  if (key && from) {
    const fecha = event_date ? event_date.split('-').reverse().join('/') : 'sin fecha';
    const rows: [string, string][] = [
      ['Nombre', name], ['Fecha del evento', fecha], ['Servicio', service || '—'], ['Zona', zone || '—'],
      ['Mail', email || '—'], ['Teléfono', phone || '—'],
    ];
    const wa = phone ? `https://wa.me/${phone.replace(/\D/g, '').replace(/^(?!54)/, '549')}` : null;
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
        body: JSON.stringify({
          from, to: [to], subject: `Consulta web: ${name} · ${service || 'servicio'} · ${fecha}`, html,
          reply_to: email || undefined,
        }),
      });
      if (res.ok) await db.from('web_inquiries').update({ email_sent: true }).eq('id', row.id);
      else console.error('consulta: Resend respondió', res.status, await res.text().catch(() => ''));
    } catch (e) {
      console.error('consulta: no se pudo mandar el mail', e);
    }
  }

  return NextResponse.json({ ok: true }, { headers });
}
