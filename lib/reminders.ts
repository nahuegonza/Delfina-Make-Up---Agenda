// Calcula qué mensajes corresponden a cada turno y cuáles están pendientes.
import type { BookingFull, Channel, MessageKind } from './types';
import { addDays, daysBetween, todayAR } from './format';

/** Días respecto de la fecha del turno en que se manda cada mensaje. */
export const SCHEDULE: Record<Exclude<MessageKind, 'confirmacion'>, number> = {
  prueba: -30,
  indicaciones: -7,
  recordatorio: -1,
  agradecimiento: 1,
};

const ACTIVE = ['senada', 'confirmada', 'realizada', 'cobrada'];

export interface Task {
  booking: BookingFull;
  kind: MessageKind;
  due: string; // fecha en que corresponde
  overdue: boolean;
}

export function wasSent(b: BookingFull, kind: MessageKind, channel: Channel): boolean {
  return (b.message_log ?? []).some((m) => m.kind === kind && m.channel === channel);
}

/** Mensajes que aplican a un turno (independientemente de si ya se mandaron). */
export function applicableKinds(b: BookingFull): MessageKind[] {
  if (!ACTIVE.includes(b.status)) return [];
  const isTrial = /prueba/i.test(b.service_name);
  const kinds: MessageKind[] = ['confirmacion'];
  if (b.services?.has_trial) kinds.push('prueba');
  if (b.services ? b.services.sends_tips : !isTrial) kinds.push('indicaciones');
  kinds.push('recordatorio');
  if (!isTrial) kinds.push('agradecimiento');
  return kinds;
}

export function dueDate(b: BookingFull, kind: MessageKind): string {
  if (kind === 'confirmacion') return b.created_at.slice(0, 10);
  return addDays(b.date, SCHEDULE[kind]);
}

/**
 * Tareas de WhatsApp pendientes para hoy (o atrasadas pero todavía útiles).
 * - Confirmación: mientras el turno no pasó.
 * - Prueba: desde 30 días antes hasta 3 días antes del evento.
 * - Indicaciones y recordatorio: desde su fecha hasta el día del turno.
 * - Agradecimiento: hasta 7 días después del turno.
 */
export function pendingTasks(bookings: BookingFull[], today = todayAR()): Task[] {
  const tasks: Task[] = [];
  for (const b of bookings) {
    for (const kind of applicableKinds(b)) {
      const channel: Channel = kind === 'prueba' ? 'interno' : 'whatsapp';
      if (wasSent(b, kind, channel)) continue;
      // La confirmación por WhatsApp solo se pide si todavía no está confirmada.
      if (kind === 'confirmacion' && b.status !== 'senada') continue;
      const due = kind === 'confirmacion' ? today : dueDate(b, kind);
      if (due > today) continue;
      const untilEvent = daysBetween(today, b.date);
      if (kind === 'agradecimiento') {
        if (untilEvent < -7) continue;
      } else if (kind === 'prueba') {
        if (untilEvent < 3) continue; // a pocos días del evento ya no tiene sentido
      } else if (untilEvent < 0) {
        continue;
      }
      tasks.push({ booking: b, kind, due, overdue: due < today });
    }
  }
  const order: MessageKind[] = ['recordatorio', 'confirmacion', 'indicaciones', 'prueba', 'agradecimiento'];
  return tasks.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.booking.date.localeCompare(b.booking.date));
}
