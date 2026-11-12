'use client';
import { useRef, useState } from 'react';
import type { ServiceRow } from '@/lib/content';
import { waLink } from '@/lib/links';
import { ICheck, IWhatsapp } from './Icons';

const ZONES = ['CABA', 'GBA Norte', 'GBA Oeste', 'GBA Sur'];

type State = 'idle' | 'sending' | 'done' | 'error';

/** Formulario de reserva: la consulta llega por mail a contacto@ y queda guardada en la agenda. */
export default function ContactForm({ services, whatsapp }: { services: ServiceRow[]; whatsapp: string }) {
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');
  const [f, setF] = useState({ name: '', email: '', phone: '', event_date: '', service: services[0]?.title ?? '', zone: 'CABA', message: '', website: '' });
  const started = useRef(Date.now());
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const waText = [
    '¡Hola Delfi! Quiero reservar una fecha.',
    f.name && `Nombre: ${f.name}`,
    f.event_date && `Fecha: ${f.event_date.split('-').reverse().join('/')}`,
    `Servicio: ${f.service}`,
    `Zona: ${f.zone}`,
    f.message,
  ].filter(Boolean).join('\n');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!f.name.trim()) return setError('Contame tu nombre.');
    if (!f.email.trim() && !f.phone.trim()) return setError('Dejame un mail o un teléfono para responderte.');
    setState('sending');
    try {
      const res = await fetch('/api/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, elapsed: Date.now() - started.current }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'No se pudo enviar');
      setState('done');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'No se pudo enviar');
    }
  }

  if (state === 'done') {
    return (
      <div className="form glass-dark" aria-live="polite">
        <div className="form-done">
          <span className="check"><ICheck /></span>
          <h3>¡Gracias, {f.name.split(' ')[0]}!</h3>
          <p>Recibí tu consulta y te respondo dentro de las 24 horas. Si es urgente, escribime por WhatsApp.</p>
          <a className="btn btn-wa" href={waLink(whatsapp, waText)} target="_blank" rel="noopener"><IWhatsapp /> Escribir por WhatsApp</a>
        </div>
      </div>
    );
  }

  return (
    <form className="form glass-dark" aria-label="Reservá tu fecha" onSubmit={submit} noValidate>
      <h3>Reservá tu fecha</h3>
      <label className="field">Nombre<input name="name" autoComplete="name" placeholder="Tu nombre" value={f.name} onChange={set('name')} required maxLength={120} /></label>
      <label className="field">Fecha del evento<input type="date" name="event_date" value={f.event_date} onChange={set('event_date')} /></label>
      <label className="field">Mail<input type="email" name="email" autoComplete="email" inputMode="email" placeholder="tu@mail.com" value={f.email} onChange={set('email')} maxLength={200} /></label>
      <label className="field">Teléfono<input type="tel" name="phone" autoComplete="tel" inputMode="tel" placeholder="11 2345 6789" value={f.phone} onChange={set('phone')} maxLength={40} /></label>
      <label className="field">Servicio
        <select name="service" value={f.service} onChange={set('service')}>
          {services.map((s) => <option key={s.id}>{s.title}</option>)}
        </select>
      </label>
      <label className="field">Zona
        <select name="zone" value={f.zone} onChange={set('zone')}>
          {ZONES.map((z) => <option key={z}>{z}</option>)}
        </select>
      </label>
      <label className="field full">Contame tu evento<textarea name="message" placeholder="Tipo de evento, horario, cantidad de personas…" value={f.message} onChange={set('message')} maxLength={2000} /></label>
      <label className="hp" aria-hidden="true">No completar<input tabIndex={-1} autoComplete="off" name="website" value={f.website} onChange={set('website')} /></label>
      {error && (
        <div className="form-msg" role="alert">
          {error}{' '}
          {state === 'error' && <a href={waLink(whatsapp, waText)} target="_blank" rel="noopener" style={{ color: '#fff', fontWeight: 600 }}>Enviar por WhatsApp</a>}
        </div>
      )}
      <button className="btn btn-send" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? (<><span className="spinner" aria-hidden="true" /> Enviando…</>) : 'Enviar consulta'}
      </button>
      <small>Te respondo dentro de las 24 horas. También podés <a href={waLink(whatsapp, waText)} target="_blank" rel="noopener" style={{ color: '#fff' }}>escribirme por WhatsApp</a>.</small>
    </form>
  );
}
