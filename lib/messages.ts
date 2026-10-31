// Textos de los mensajes a las clientas (WhatsApp y mail).
// Para cambiar un texto, editá este archivo: los cambios se aplican a todos los turnos.

import type { BookingFull, MessageKind } from './types';
import { ars, balanceUsd, firstName, hhmm, longDate, num, usd } from './format';

export const BRAND = {
  name: 'Delfina Acuña Makeup',
  signature: 'Delfi',
  instagram: '@delfinaamakeup',
  web: 'https://delfinamakeup.com',
  email: 'contacto@delfinamakeup.com',
  speech:
    'Cada rostro es una historia, y me encanta ser parte de la tuya. Combino técnica, creatividad y atención personalizada para que te veas y te sientas vos, en tu mejor versión.',
};

export const KIND_LABEL: Record<MessageKind, string> = {
  confirmacion: 'Confirmación',
  prueba: 'Coordinar prueba',
  indicaciones: 'Indicaciones previas',
  recordatorio: 'Recordatorio',
  agradecimiento: 'Agradecimiento',
};

function moneyLines(b: BookingFull): string[] {
  const lines: string[] = [];
  const deposit = num(b.deposit_usd);
  const saldo = balanceUsd(b);
  const viaticos = num(b.travel_cost_ars);
  if (deposit > 0) lines.push(`Seña recibida: ${usd(deposit)}`);
  if (b.price_usd !== null && b.price_usd !== undefined) {
    let s = `Saldo el día del servicio: ${usd(saldo)}`;
    if (viaticos > 0) s += ` + ${ars(viaticos)} de viáticos`;
    lines.push(s);
  } else if (viaticos > 0) {
    lines.push(`Viáticos: ${ars(viaticos)}`);
  }
  return lines;
}

function timeLine(b: BookingFull): string {
  const date = longDate(b.date);
  if (b.ready_time) return `${date} — empiezo a las ${hhmm(b.start_time)} para que estés lista a las ${hhmm(b.ready_time)}`;
  return `${date} a las ${hhmm(b.start_time)}`;
}

/** Texto de WhatsApp para cada tipo de mensaje. */
export function whatsappText(kind: MessageKind, b: BookingFull): string {
  const nombre = firstName(b.clients?.name);
  const dir = b.address || 'la dirección que me pasaste';
  switch (kind) {
    case 'confirmacion': {
      const lines = [
        `¡Hola ${nombre}! Soy ${BRAND.signature}, de ${BRAND.name} 💕 Te confirmo tu turno:`,
        `✨ ${b.service_name}`,
        `📅 ${timeLine(b)}`,
        `📍 ${dir}`,
        ...moneyLines(b),
        '',
        `${BRAND.speech} Unos días antes te mando algunas indicaciones para que la piel quede perfecta. ¡Cualquier cosa escribime!`,
      ];
      return lines.join('\n');
    }
    case 'indicaciones':
      return `¡Hola ${nombre}! Se acerca tu día ✨ Algunas recomendaciones: hidratá bien la piel estos días, evitá tratamientos o productos nuevos, y el día del servicio tené la cara limpia, sin cremas pesadas. Si podés, prepará un lugar con buena luz y una silla cómoda. ¡Nos vemos el ${longDate(b.date)}!`;
    case 'recordatorio':
      return `¡Hola ${nombre}! Te recuerdo que mañana, ${longDate(b.date)}, a las ${hhmm(b.start_time)} paso por ${dir}. ¿Está todo ok? 💕`;
    case 'agradecimiento':
      return `¡Gracias ${nombre} por elegirme! Espero que hayas disfrutado tu día 💕 Si te gustó, me ayudarías muchísimo dejando una reseña en mi web (${BRAND.web}) o etiquetándome en Instagram ${BRAND.instagram}.`;
    case 'prueba':
      return `¡Hola ${nombre}! ¿Cómo estás? Se acerca tu gran día y quería coordinar la prueba de maquillaje 💕 ¿Qué días y horarios te quedan cómodos?`;
  }
}

// ---------------------------------------------------------------------
// Mails
// ---------------------------------------------------------------------

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#fff8f8;font-family:'Work Sans',Helvetica,Arial,sans-serif;color:#3a2022;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f8;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4d2d4;border-radius:16px;">
<tr><td style="padding:32px 32px 8px 32px;">
<p style="margin:0 0 8px 0;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#cd9ca6;">— ${esc(BRAND.name)}</p>
<h1 style="margin:0;font-family:'Instrument Serif',Georgia,serif;font-weight:400;font-size:32px;line-height:1.15;color:#3a2022;">${title}</h1>
</td></tr>
<tr><td style="padding:16px 32px 32px 32px;font-size:15px;line-height:1.6;color:#3a2022;">${bodyHtml}</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #f7e7e8;font-size:12px;color:#785a5e;">
${esc(BRAND.name)} · Maquillaje a domicilio en CABA y GBA<br>
<a href="${BRAND.web}" style="color:#8a4959;">delfinamakeup.com</a> · Instagram ${esc(BRAND.instagram)} · ${esc(BRAND.email)}
</td></tr></table></td></tr></table></body></html>`;
}

function detailsTable(b: BookingFull): string {
  const rows: [string, string][] = [
    ['Servicio', b.service_name],
    ['Fecha', longDate(b.date)],
    ['Hora de inicio', hhmm(b.start_time)],
  ];
  if (b.ready_time) rows.push(['Lista a las', hhmm(b.ready_time)]);
  if (b.address) rows.push(['Dirección', b.address]);
  for (const line of moneyLines(b)) {
    const [k, ...v] = line.split(': ');
    rows.push([k, v.join(': ')]);
  }
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;background:#fff8f8;border-radius:12px;">
${rows
  .map(
    ([k, v]) =>
      `<tr><td style="padding:8px 16px;font-size:13px;color:#785a5e;width:40%;">${esc(k)}</td><td style="padding:8px 16px;font-size:14px;color:#3a2022;">${esc(v)}</td></tr>`,
  )
  .join('')}
</table>`;
}

/** Asunto y HTML del mail para cada tipo de mensaje. */
export function emailContent(kind: Exclude<MessageKind, 'prueba'>, b: BookingFull): { subject: string; html: string } {
  const nombre = esc(firstName(b.clients?.name));
  switch (kind) {
    case 'confirmacion':
      return {
        subject: `Tu turno está confirmado — ${longDate(b.date)}`,
        html: layout(
          `Tu turno está <em style="color:#8a4959;">confirmado</em>`,
          `<p style="margin:0 0 8px 0;">¡Hola ${nombre}! Te confirmo los datos de tu turno:</p>
${detailsTable(b)}
<p style="margin:0 0 12px 0;">${esc(BRAND.speech)}</p>
<p style="margin:0;">Unos días antes te escribo con algunas indicaciones para que la piel quede perfecta. Si necesitás cambiar algo, respondé este mail o escribime por WhatsApp.</p>
<p style="margin:16px 0 0 0;">Con cariño,<br><em style="font-family:'Instrument Serif',Georgia,serif;font-size:20px;color:#8a4959;">${esc(BRAND.signature)}</em></p>`,
        ),
      };
    case 'indicaciones':
      return {
        subject: 'Se acerca tu día ✨ Algunas recomendaciones',
        html: layout(
          `Se acerca <em style="color:#8a4959;">tu día</em>`,
          `<p style="margin:0 0 12px 0;">¡Hola ${nombre}! Para que el maquillaje quede impecable y dure todo el evento:</p>
<ul style="margin:0 0 12px 0;padding-left:20px;">
<li>Hidratá bien la piel estos días.</li>
<li>Evitá tratamientos o productos nuevos.</li>
<li>El día del servicio, tené la cara limpia y sin cremas pesadas.</li>
<li>Si podés, prepará un lugar con buena luz y una silla cómoda.</li>
</ul>
<p style="margin:0;">Nos vemos el <strong>${esc(longDate(b.date))}</strong> a las <strong>${esc(hhmm(b.start_time))}</strong>.</p>
<p style="margin:16px 0 0 0;"><em style="font-family:'Instrument Serif',Georgia,serif;font-size:20px;color:#8a4959;">${esc(BRAND.signature)}</em></p>`,
        ),
      };
    case 'recordatorio':
      return {
        subject: `Mañana nos vemos 💕 ${hhmm(b.start_time)} h`,
        html: layout(
          `Mañana <em style="color:#8a4959;">nos vemos</em>`,
          `<p style="margin:0 0 8px 0;">¡Hola ${nombre}! Te recuerdo tu turno de mañana:</p>
${detailsTable(b)}
<p style="margin:0;">Si hay algún cambio, respondé este mail o escribime por WhatsApp.</p>`,
        ),
      };
    case 'agradecimiento':
      return {
        subject: '¡Gracias por elegirme! 💕',
        html: layout(
          `¡Gracias por <em style="color:#8a4959;">elegirme</em>!`,
          `<p style="margin:0 0 12px 0;">¡Hola ${nombre}! Espero que hayas disfrutado muchísimo tu día.</p>
<p style="margin:0 0 20px 0;">Si te gustó el resultado, me ayudarías un montón dejando una reseña o etiquetándome en Instagram <strong>${esc(BRAND.instagram)}</strong>.</p>
<p style="margin:0;"><a href="${BRAND.web}" style="display:inline-block;background:#8a4959;color:#fff8f8;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;">Dejar una reseña</a></p>`,
        ),
      };
  }
}
