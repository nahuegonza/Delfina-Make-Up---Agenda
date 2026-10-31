// Utilidades de fechas, horas y plata. Todas las fechas se manejan como texto
// 'YYYY-MM-DD' en hora de Buenos Aires, para no tener sorpresas de zona horaria.

export const TZ = 'America/Argentina/Buenos_Aires';

/** Fecha de hoy en Buenos Aires, 'YYYY-MM-DD'. */
export function todayAR(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

/** Hora actual en Buenos Aires, 'HH:MM'. */
export function nowTimeAR(): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
}

function toUTC(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUTC(dt: Date): string {
  return dt.toISOString().slice(0, 10);
}

export function addDays(date: string, n: number): string {
  const dt = toUTC(date);
  dt.setUTCDate(dt.getUTCDate() + n);
  return fromUTC(dt);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUTC(to).getTime() - toUTC(from).getTime()) / 86400000);
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function weekday(date: string): number {
  return toUTC(date).getUTCDay();
}

/** "sábado 14 de noviembre" */
export function longDate(date: string): string {
  const dt = toUTC(date);
  return `${DIAS[dt.getUTCDay()]} ${dt.getUTCDate()} de ${MESES[dt.getUTCMonth()]}`;
}

/** "sáb 14/11" */
export function shortDate(date: string): string {
  const dt = toUTC(date);
  return `${DIAS_CORTOS[dt.getUTCDay()]} ${dt.getUTCDate()}/${dt.getUTCMonth() + 1}`;
}

/** Texto relativo: hoy, mañana, en 5 días, hace 2 días. */
export function relativeDay(date: string, today = todayAR()): string {
  const d = daysBetween(today, date);
  if (d === 0) return 'hoy';
  if (d === 1) return 'mañana';
  if (d === -1) return 'ayer';
  if (d > 1) return `en ${d} días`;
  return `hace ${-d} días`;
}

/** '16:00:00' → '16:00' */
export function hhmm(t: string | null | undefined): string {
  return t ? t.slice(0, 5) : '';
}

export function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function fromMinutes(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function endTime(start: string, durationMin: number): string {
  return fromMinutes(toMinutes(start) + durationMin);
}

export function durationLabel(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function usd(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  return `USD ${Number(n).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
}

export function ars(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  return `$ ${Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
}

export function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Saldo en USD: precio menos seña. */
export function balanceUsd(b: { price_usd: number | null; deposit_usd: number | null }): number {
  return Math.max(0, num(b.price_usd) - num(b.deposit_usd));
}

export function firstName(name: string | null | undefined): string {
  return (name || '').trim().split(/\s+/)[0] || '';
}
