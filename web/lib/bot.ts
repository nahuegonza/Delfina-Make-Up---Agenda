// Respuestas automáticas del chat, armadas solo con los datos que Delfina carga en el admin
// (servicios y preguntas frecuentes). Lo que no sabe, lo deriva a WhatsApp.
import type { Faq, ServiceRow } from './content';

export interface BotReply {
  text: string;
  wa?: boolean;
}

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ\s]/g, ' ');

const STOP = new Set('que como cual cuales cuanto cuanta para porque por con sin una uno unos unas los las del de el la en es son hay tenes tengo hace haces sos mas muy mi mis tu tus su sus se me te le lo al a y o si no ya vos ustedes esta este estas estos eso esa'.split(' '));

// Palabras que significan lo mismo para buscar la pregunta frecuente correcta.
const SYN: Record<string, string> = {
  domicilio: 'zona', viatico: 'zona', viaticos: 'zona', barrio: 'zona', zonas: 'zona', caba: 'zona', gba: 'zona', provincia: 'zona', lejos: 'zona', venis: 'zona', vas: 'zona', llegas: 'zona',
  tiempo: 'dura', demora: 'dura', tarda: 'dura', duracion: 'dura', horas: 'dura', lleva: 'dura',
  sena: 'reserv', turno: 'reserv', reservo: 'reserv', reservar: 'reserv', reserva: 'reserv', transferencia: 'reserv', pago: 'reserv',
  productos: 'producto', marcas: 'producto', marca: 'producto', usas: 'producto', maletin: 'producto',
  preparo: 'llegar', piel: 'llegar', alergia: 'llegar', alergica: 'llegar', crema: 'llegar', limpia: 'llegar',
  clases: 'clase', curso: 'clase', aprender: 'clase', automaquillaje: 'clase',
};

function tokens(s: string) {
  return norm(s)
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => SYN[w] ?? (w.length > 5 ? w.slice(0, 5) : w));
}

const has = (t: string, ...w: string[]) => w.some((x) => t.includes(x));

function servicePrice(s: ServiceRow) {
  const p = s.price_prefix ? `${s.price_prefix} ${s.price_label}` : s.price_label;
  return s.duration_label ? `${p} (${s.duration_label})` : p;
}

export function botReply(q: string, services: ServiceRow[], faqs: Faq[]): BotReply {
  const t = norm(q);

  if (has(t, 'disponib', 'libre', 'agenda', 'tenes lugar', 'tenes fecha', 'mi fecha'))
    return { text: 'Para saber si tu fecha está libre, escribime por WhatsApp con la fecha, la zona y el servicio. Te respondo dentro de las 24 horas.', wa: true };

  // Un servicio puntual por nombre ("¿cuánto sale egresadas?")
  const named = services.find((s) => {
    const key = tokens(s.title).filter((w) => w !== 'maqui');
    return key.some((k) => tokens(q).includes(k));
  });
  const asksPrice = has(t, 'precio', 'cuanto', 'sale', 'cuesta', 'valor', 'tarifa', 'cobras', 'presupuesto');
  if (named && (asksPrice || tokens(q).length <= 3)) {
    return { text: `${named.title}: ${servicePrice(named)}.\n${named.description}\nA eso se le suman los viáticos según tu zona.` };
  }
  if (asksPrice) {
    const list = services.map((s) => `• ${s.title}: ${servicePrice(s)}`).join('\n');
    return { text: `Estos son los precios orientativos:\n${list}\nA todo se le suman los viáticos según tu zona.` };
  }

  // La pregunta frecuente que más se parece
  const qt = new Set(tokens(q));
  let best: { f: Faq; score: number } | null = null;
  for (const f of faqs) {
    const ft = new Set(tokens(f.question + ' ' + f.question + ' ' + f.answer));
    let score = 0;
    qt.forEach((w) => {
      if (ft.has(w)) score += tokens(f.question).includes(w) ? 2 : 1;
    });
    if (!best || score > best.score) best = { f, score };
  }
  if (best && best.score >= 2) return { text: best.f.answer };

  if (has(t, 'hola', 'buenas', 'buen dia', 'holi'))
    return { text: '¡Hola! ¿En qué te puedo ayudar? Podés preguntarme por precios, zonas, tiempos o cómo reservar.' };
  if (has(t, 'gracias', 'genial', 'perfecto', 'buenisimo'))
    return { text: '¡De nada! Si querés reservar, escribime por WhatsApp.', wa: true };
  if (has(t, 'whatsapp', 'hablar', 'persona', 'telefono', 'llamar'))
    return { text: 'Escribime por WhatsApp y te respondo dentro de las 24 horas.', wa: true };

  return { text: 'Esa prefiero respondértela personalmente. ¿Me escribís por WhatsApp?', wa: true };
}
