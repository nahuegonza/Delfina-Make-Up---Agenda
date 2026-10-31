'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useServices } from '@/lib/data';
import { durationLabel, endTime, fromMinutes, hhmm, num, toMinutes, todayAR, usd } from '@/lib/format';
import { STATUSES, ZONES, type Booking, type Client, type Status, type Zone } from '@/lib/types';

type Initial = Partial<Booking> & { clients?: Client | null };

const EVENT_TYPES = ['Casamiento', 'Cumpleaños', '15 años', 'Egresadas', 'Fiesta', 'Evento social', 'Sesión de fotos', 'Otro'];

export default function BookingForm({ initial, initialDate }: { initial?: Initial; initialDate?: string }) {
  const router = useRouter();
  const editing = Boolean(initial?.id);
  const { data: services } = useServices();
  const [clients, setClients] = useState<Client[]>([]);

  // Clienta
  const [clientId, setClientId] = useState<string | null>(initial?.client_id ?? null);
  const [name, setName] = useState(initial?.clients?.name ?? '');
  const [phone, setPhone] = useState(initial?.clients?.phone ?? '');
  const [email, setEmail] = useState(initial?.clients?.email ?? '');
  const [showSuggest, setShowSuggest] = useState(false);

  // Servicio y horario
  const [serviceId, setServiceId] = useState<string>(initial?.service_id ?? '');
  const [eventType, setEventType] = useState(initial?.event_type ?? '');
  const [extraPeople, setExtraPeople] = useState(String(initial?.extra_people ?? 0));
  const [date, setDate] = useState(initial?.date ?? initialDate ?? '');
  const [readyTime, setReadyTime] = useState(hhmm(initial?.ready_time));
  const [startTime, setStartTime] = useState(hhmm(initial?.start_time));
  const [startTouched, setStartTouched] = useState(Boolean(initial?.start_time && !initial?.ready_time));
  const [duration, setDuration] = useState(String(initial?.duration_min ?? ''));
  const [travel, setTravel] = useState(String(initial?.travel_min ?? 40));

  // Lugar y plata
  const [address, setAddress] = useState(initial?.address ?? '');
  const [zone, setZone] = useState<Zone | ''>(initial?.zone ?? '');
  const [price, setPrice] = useState(initial?.price_usd != null ? String(initial.price_usd) : '');
  const [deposit, setDeposit] = useState(initial?.deposit_usd != null ? String(initial.deposit_usd) : '');
  const [travelCost, setTravelCost] = useState(initial?.travel_cost_ars != null ? String(initial.travel_cost_ars) : '');
  const [status, setStatus] = useState<Status>(initial?.status ?? 'consulta');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const [conflicts, setConflicts] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase()
      .from('clients')
      .select('*')
      .order('name')
      .then(({ data }) => setClients((data ?? []) as Client[]));
  }, []);

  const service = services.find((s) => s.id === serviceId);

  // Al elegir un servicio se completan duración y precio.
  function pickService(id: string) {
    setServiceId(id);
    const s = services.find((x) => x.id === id);
    if (!s) return;
    setDuration(String(s.duration_min));
    setPrice(s.price_usd != null ? String(s.price_usd) : '');
    if (/egresad/i.test(s.name) && !eventType) setEventType('Egresadas');
    if (/quincea/i.test(s.name) && !eventType) setEventType('15 años');
    if (/novia/i.test(s.name) && !/prueba/i.test(s.name) && !eventType) setEventType('Casamiento');
  }

  // La hora de inicio se calcula hacia atrás desde la hora en que tiene que estar lista.
  useEffect(() => {
    if (!startTouched && readyTime && num(duration) > 0) {
      setStartTime(fromMinutes(toMinutes(readyTime) - num(duration)));
    }
  }, [readyTime, duration, startTouched]);

  // Choques con otros turnos del mismo día (incluye traslados).
  useEffect(() => {
    if (!date || !startTime || num(duration) <= 0) {
      setConflicts([]);
      return;
    }
    let cancelled = false;
    supabase()
      .from('bookings')
      .select('id, start_time, duration_min, travel_min, service_name, status, clients(name)')
      .eq('date', date)
      .neq('status', 'cancelada')
      .then(({ data }) => {
        if (cancelled) return;
        const t = num(travel);
        const a0 = toMinutes(startTime) - t;
        const a1 = toMinutes(startTime) + num(duration) + t;
        const hits = (data ?? [])
          .filter((o: any) => o.id !== initial?.id)
          .filter((o: any) => {
            const b0 = toMinutes(o.start_time) - o.travel_min;
            const b1 = toMinutes(o.start_time) + o.duration_min + o.travel_min;
            return a0 < b1 && b0 < a1;
          })
          .map((o: any) => `${hhmm(o.start_time)} · ${o.clients?.name ?? 'Clienta'} (${o.service_name})`);
        setConflicts(hits);
      });
    return () => {
      cancelled = true;
    };
  }, [date, startTime, duration, travel, initial?.id]);

  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (!q || clientId) return [];
    return clients.filter((c) => c.name.toLowerCase().includes(q) || (c.phone ?? '').replace(/\D/g, '').includes(q.replace(/\D/g, '') || '§')).slice(0, 6);
  }, [name, clients, clientId]);

  function pickClient(c: Client) {
    setClientId(c.id);
    setName(c.name);
    setPhone(c.phone ?? '');
    setEmail(c.email ?? '');
    setShowSuggest(false);
  }

  const balance = Math.max(0, num(price) - num(deposit));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Falta el nombre de la clienta.');
    if (!phone.trim()) return setError('Falta el WhatsApp de la clienta.');
    if (!service && !initial?.service_name) return setError('Elegí un servicio.');
    if (!date) return setError('Falta la fecha.');
    if (!startTime) return setError('Falta la hora (de inicio o en la que tiene que estar lista).');
    if (num(duration) <= 0) return setError('La duración tiene que ser mayor a 0.');

    setSaving(true);
    const db = supabase();
    try {
      // 1. Clienta: nueva o actualizada.
      let cid = clientId;
      const clientData = { name: name.trim(), phone: phone.trim() || null, email: email.trim() || null };
      if (cid) {
        const { error } = await db.from('clients').update(clientData).eq('id', cid);
        if (error) throw error;
      } else {
        const { data, error } = await db.from('clients').insert(clientData).select('id').single();
        if (error) throw error;
        cid = data.id;
      }

      // 2. Turno.
      const payload = {
        client_id: cid,
        service_id: service?.id ?? initial?.service_id ?? null,
        service_name: service?.name ?? initial?.service_name ?? '',
        event_type: eventType || null,
        extra_people: Math.max(0, Math.round(num(extraPeople))),
        date,
        start_time: startTime,
        ready_time: readyTime || null,
        duration_min: Math.round(num(duration)),
        travel_min: Math.max(0, Math.round(num(travel))),
        address: address.trim() || null,
        zone: zone || null,
        price_usd: price === '' ? null : num(price),
        deposit_usd: deposit === '' ? null : num(deposit),
        travel_cost_ars: travelCost === '' ? null : num(travelCost),
        status,
        notes: notes.trim() || null,
      };
      let id = initial?.id;
      if (id) {
        const { error } = await db.from('bookings').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await db.from('bookings').insert(payload).select('id').single();
        if (error) throw error;
        id = data.id;
      }
      router.push(`/reservas/${id}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo guardar.');
      setSaving(false);
    }
  }

  return (
    <form className="form" onSubmit={save} autoComplete="off">
      <section className="card">
        <fieldset>
          <legend>Clienta</legend>
          <div className="fields fields-3">
            <div className="field search">
              <label htmlFor="name">Nombre *</label>
              <input
                id="name"
                className="input"
                value={name}
                placeholder="Buscá o escribí un nombre nuevo"
                onChange={(e) => {
                  setName(e.target.value);
                  setClientId(null);
                  setShowSuggest(true);
                }}
                onFocus={() => setShowSuggest(true)}
                onBlur={() => window.setTimeout(() => setShowSuggest(false), 150)}
              />
              {showSuggest && suggestions.length > 0 && (
                <ul className="card list" style={{ position: 'absolute', zIndex: 10, left: 0, right: 0, marginTop: 4, padding: '4px 14px' }}>
                  {suggestions.map((c) => (
                    <li key={c.id}>
                      <button type="button" className="item" style={{ width: '100%', background: 'none', border: 0, textAlign: 'left', cursor: 'pointer' }} onMouseDown={() => pickClient(c)}>
                        <span className="item-main">
                          <span className="item-title">{c.name}</span>
                          <span className="muted small" style={{ display: 'block' }}>{c.phone}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="hint">{clientId ? 'Clienta existente ✓' : name.trim() ? 'Se va a crear como clienta nueva' : ''}</div>
            </div>
            <div className="field">
              <label htmlFor="phone">WhatsApp *</label>
              <input id="phone" className="input" inputMode="tel" placeholder="11 1234-5678" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <div className="hint">Con código de área, sin 0 ni 15.</div>
            </div>
            <div className="field">
              <label htmlFor="email">Mail</label>
              <input id="email" className="input" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <div className="hint">Para la confirmación y los recordatorios automáticos.</div>
            </div>
          </div>
        </fieldset>
      </section>

      <section className="card">
        <fieldset>
          <legend>Servicio y horario</legend>
          <div className="fields fields-2">
            <div className="field">
              <label htmlFor="service">Servicio *</label>
              <select id="service" className="select" value={serviceId} onChange={(e) => pickService(e.target.value)}>
                <option value="">{initial?.service_name && !serviceId ? initial.service_name : 'Elegí un servicio'}</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {durationLabel(s.duration_min)}
                    {s.price_usd != null ? ` · ${usd(s.price_usd)}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="event">Tipo de evento</label>
              <input id="event" className="input" list="event-types" value={eventType} onChange={(e) => setEventType(e.target.value)} />
              <datalist id="event-types">{EVENT_TYPES.map((t) => <option key={t} value={t} />)}</datalist>
            </div>
            <div className="field">
              <label htmlFor="date">Fecha *</label>
              <input id="date" className="input" type="date" min={editing ? undefined : todayAR()} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="extra">Personas adicionales</label>
              <input id="extra" className="input" type="number" min={0} inputMode="numeric" value={extraPeople} onChange={(e) => setExtraPeople(e.target.value)} />
              <div className="hint">Mamá, damas, etc. Ajustá la duración si hace falta.</div>
            </div>
          </div>
          <div className="fields fields-3" style={{ marginTop: 14 }}>
            <div className="field">
              <label htmlFor="ready">Tiene que estar lista a las</label>
              <input id="ready" className="input" type="time" value={readyTime} onChange={(e) => { setReadyTime(e.target.value); setStartTouched(false); }} />
            </div>
            <div className="field">
              <label htmlFor="start">Empezás a las *</label>
              <input id="start" className="input" type="time" value={startTime} onChange={(e) => { setStartTime(e.target.value); setStartTouched(true); }} />
              <div className="hint">{readyTime && !startTouched ? 'Calculada con la duración.' : ' '}</div>
            </div>
            <div className="field">
              <label htmlFor="dur">Duración (min) *</label>
              <input id="dur" className="input" type="number" min={10} step={10} inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} />
              <div className="hint">{startTime && num(duration) > 0 ? `Terminás a las ${endTime(startTime, num(duration))}` : ''}</div>
            </div>
          </div>
          {conflicts.length > 0 && (
            <div className="alert alert-warn" style={{ marginTop: 14 }}>
              <strong>Ojo: se superpone con otro turno</strong> (contando {num(travel)} min de traslado):
              <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{conflicts.map((c) => <li key={c}>{c}</li>)}</ul>
            </div>
          )}
        </fieldset>
      </section>

      <section className="card">
        <fieldset>
          <legend>Lugar</legend>
          <div className="fields fields-2">
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="address">Dirección</label>
              <input id="address" className="input" placeholder="Calle, número, piso, localidad" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="field">
              <label>Zona</label>
              <div className="seg">
                {ZONES.map((z) => (
                  <button type="button" key={z} className={zone === z ? 'on' : ''} onClick={() => setZone(zone === z ? '' : z)}>{z}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label htmlFor="travel">Traslado (min)</label>
              <input id="travel" className="input" type="number" min={0} step={5} inputMode="numeric" value={travel} onChange={(e) => setTravel(e.target.value)} />
              <div className="hint">Se bloquea antes y después del turno.</div>
            </div>
          </div>
        </fieldset>
      </section>

      <section className="card">
        <fieldset>
          <legend>Plata</legend>
          <div className="fields fields-3">
            <div className="field">
              <label htmlFor="price">Precio (USD)</label>
              <input id="price" className="input" type="number" min={0} step="any" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="deposit">Seña (USD)</label>
              <input id="deposit" className="input" type="number" min={0} step="any" inputMode="decimal" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
              {num(price) > 0 && (
                <div className="row" style={{ marginTop: 6 }}>
                  <button type="button" className="btn btn-soft btn-sm" onClick={() => setDeposit(String(Math.round(num(price) * 0.1)))}>10%</button>
                  <button type="button" className="btn btn-soft btn-sm" onClick={() => setDeposit(String(Math.round(num(price) * 0.15)))}>15%</button>
                </div>
              )}
            </div>
            <div className="field">
              <label htmlFor="viaticos">Viáticos ($ ARS)</label>
              <input id="viaticos" className="input" type="number" min={0} step="any" inputMode="decimal" value={travelCost} onChange={(e) => setTravelCost(e.target.value)} />
              <div className="hint">Según zona y precio del Uber al destino.</div>
            </div>
          </div>
          <p className="small" style={{ margin: '12px 0 0' }}>
            Saldo el día del servicio: <strong>{usd(balance)}</strong>
            {num(travelCost) > 0 ? ` + $ ${num(travelCost).toLocaleString('es-AR')} de viáticos` : ''}
          </p>
        </fieldset>
      </section>

      <section className="card">
        <fieldset>
          <legend>Estado y notas</legend>
          <div className="field">
            <div className="seg">
              {STATUSES.map((s) => (
                <button type="button" key={s.value} className={status === s.value ? 'on' : ''} onClick={() => setStatus(s.value)}>{s.label}</button>
              ))}
            </div>
            <div className="hint">{STATUSES.find((s) => s.value === status)?.hint}</div>
          </div>
          <div className="field" style={{ marginTop: 14 }}>
            <label htmlFor="notes">Notas internas</label>
            <textarea id="notes" className="textarea" placeholder="Referencias, tipo de piel, pedidos especiales…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </fieldset>
      </section>

      {error && <div className="alert alert-err">{error}</div>}
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-ghost" onClick={() => router.back()}>Cancelar</button>
        <button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar turno'}</button>
      </div>
    </form>
  );
}
