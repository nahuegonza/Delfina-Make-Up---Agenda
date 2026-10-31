import type { Booking, BookingFull } from './types';
import { endTime, hhmm } from './format';

/**
 * Normaliza un celular argentino al formato internacional que usa WhatsApp.
 * "11 6467-4417" → "5491164674417"; "+54 9 11 6467 4417" → "5491164674417".
 */
export function waNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let d = phone.replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('54')) {
    if (!d.startsWith('549')) d = '549' + d.slice(2);
    return d;
  }
  if (d.startsWith('0')) d = d.slice(1);
  // Si es un número de otro país muy largo, lo dejamos como está.
  if (d.length > 10) return d;
  return '549' + d;
}

export function whatsappUrl(phone: string | null | undefined, text: string): string | null {
  const n = waNumber(phone);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

export function mapsUrl(address: string | null | undefined): string | null {
  if (!address) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function gcalStamp(date: string, time: string): string {
  return `${date.replace(/-/g, '')}T${hhmm(time).replace(':', '')}00`;
}

/** Link para agregar el turno al Google Calendar personal (incluye el traslado). */
export function googleCalendarUrl(b: BookingFull | (Booking & { clients?: { name: string } | null })): string {
  const startMin = hhmm(b.start_time);
  const end = endTime(startMin, b.duration_min);
  const title = `💄 ${b.service_name} — ${b.clients?.name ?? 'Clienta'}`;
  const details = [
    b.ready_time ? `Lista a las ${hhmm(b.ready_time)}` : '',
    b.zone ? `Zona: ${b.zone}` : '',
    `Traslado estimado: ${b.travel_min} min`,
  ]
    .filter(Boolean)
    .join('\n');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${gcalStamp(b.date, startMin)}/${gcalStamp(b.date, end)}`,
    ctz: 'America/Argentina/Buenos_Aires',
    details,
  });
  if (b.address) params.set('location', b.address);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
