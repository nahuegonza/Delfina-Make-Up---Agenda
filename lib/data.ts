'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase/client';
import { BOOKING_SELECT, DEFAULT_SERVICES, type BookingFull, type Channel, type MessageKind, type Service } from './types';

/** Carga reservas (con clienta, servicio y mensajes) entre dos fechas, ambas incluidas. */
export function useBookings(from: string | null, to: string | null) {
  const [data, setData] = useState<BookingFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    let q = supabase().from('bookings').select(BOOKING_SELECT).order('date').order('start_time');
    if (from) q = q.gte('date', from);
    if (to) q = q.lte('date', to);
    const { data, error } = await q;
    if (error) setError(error.message);
    else {
      setError(null);
      setData((data ?? []) as BookingFull[]);
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}

export async function fetchBooking(id: string): Promise<BookingFull | null> {
  const { data } = await supabase().from('bookings').select(BOOKING_SELECT).eq('id', id).maybeSingle();
  return (data as BookingFull) ?? null;
}

let seeding: Promise<unknown> | null = null;

/** Servicios activos; si no hay ninguno (primer uso), carga los predeterminados. */
export function useServices(includeInactive = false) {
  const [data, setData] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const db = supabase();
    let { data } = await db.from('services').select('*').order('sort').order('name');
    if (data && data.length === 0) {
      seeding ??= Promise.resolve(db.from('services').insert(DEFAULT_SERVICES));
      await seeding;
      ({ data } = await db.from('services').select('*').order('sort').order('name'));
    }
    const list = (data ?? []) as Service[];
    setData(includeInactive ? list : list.filter((s) => s.active));
    setLoading(false);
  }, [includeInactive]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, reload };
}

/** Registra un mensaje como enviado (no falla si ya estaba registrado). */
export async function logMessage(bookingId: string, kind: MessageKind, channel: Channel) {
  return supabase()
    .from('message_log')
    .upsert({ booking_id: bookingId, kind, channel }, { onConflict: 'booking_id,kind,channel', ignoreDuplicates: true });
}

/** Pide al servidor que mande un mail a la clienta. */
export async function sendEmail(bookingId: string, kind: MessageKind): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, kind }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: json.error || 'No se pudo enviar el mail' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Sin conexión' };
  }
}
