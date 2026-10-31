export type Status = 'consulta' | 'senada' | 'confirmada' | 'realizada' | 'cobrada' | 'cancelada';
export type Zone = 'CABA' | 'GBA Norte' | 'GBA Oeste' | 'GBA Sur';
export type MessageKind = 'confirmacion' | 'prueba' | 'indicaciones' | 'recordatorio' | 'agradecimiento';
export type Channel = 'whatsapp' | 'email' | 'interno';

export interface Service {
  id: string;
  name: string;
  duration_min: number;
  price_usd: number | null;
  has_trial: boolean;
  sends_tips: boolean;
  active: boolean;
  sort: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  client_id: string;
  service_id: string | null;
  service_name: string;
  event_type: string | null;
  extra_people: number;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM[:SS]
  ready_time: string | null;
  duration_min: number;
  travel_min: number;
  address: string | null;
  zone: Zone | null;
  price_usd: number | null;
  deposit_usd: number | null;
  travel_cost_ars: number | null;
  status: Status;
  notes: string | null;
  created_at: string;
}

export interface MessageLog {
  id: string;
  booking_id: string;
  kind: MessageKind;
  channel: Channel;
  created_at: string;
}

/** Reserva con su clienta y su servicio, como la devuelve la consulta con joins. */
export interface BookingFull extends Booking {
  clients: Client | null;
  services: Pick<Service, 'id' | 'name' | 'has_trial' | 'sends_tips'> | null;
  message_log?: MessageLog[];
}

export const BOOKING_SELECT =
  '*, clients(*), services(id, name, has_trial, sends_tips), message_log(*)';

export const STATUSES: { value: Status; label: string; hint: string }[] = [
  { value: 'consulta', label: 'Consulta', hint: 'Preguntó; la fecha todavía no está tomada' },
  { value: 'senada', label: 'Señada', hint: 'Llegó la seña; la fecha queda bloqueada' },
  { value: 'confirmada', label: 'Confirmada', hint: 'Se envió la confirmación' },
  { value: 'realizada', label: 'Realizada', hint: 'El servicio ya se hizo' },
  { value: 'cobrada', label: 'Cobrada', hint: 'Se cobró el saldo' },
  { value: 'cancelada', label: 'Cancelada', hint: 'Libera la agenda' },
];

export const ZONES: Zone[] = ['CABA', 'GBA Norte', 'GBA Oeste', 'GBA Sur'];

export const DEFAULT_SERVICES: Omit<Service, 'id'>[] = [
  { name: 'Maquillaje social', duration_min: 60, price_usd: 100, has_trial: false, sends_tips: true, active: true, sort: 1 },
  { name: 'Maquillaje social + peinado', duration_min: 120, price_usd: 150, has_trial: false, sends_tips: true, active: true, sort: 2 },
  { name: 'Egresadas', duration_min: 60, price_usd: 60, has_trial: false, sends_tips: true, active: true, sort: 3 },
  { name: 'Novias', duration_min: 120, price_usd: 250, has_trial: true, sends_tips: true, active: true, sort: 4 },
  { name: 'Quinceañeras', duration_min: 120, price_usd: 250, has_trial: true, sends_tips: true, active: true, sort: 5 },
  { name: 'Prueba de novia / quinceañera', duration_min: 180, price_usd: null, has_trial: false, sends_tips: false, active: true, sort: 6 },
  { name: 'Clase de automaquillaje (1 h)', duration_min: 60, price_usd: null, has_trial: false, sends_tips: false, active: true, sort: 7 },
  { name: 'Clase de automaquillaje (2 h)', duration_min: 120, price_usd: null, has_trial: false, sends_tips: false, active: true, sort: 8 },
  { name: 'Diseño de cejas', duration_min: 40, price_usd: null, has_trial: false, sends_tips: false, active: true, sort: 9 },
];
