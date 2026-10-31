'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StatusPill from '@/components/StatusPill';
import { IconEdit, IconGcal, IconMail, IconPin, IconWhatsapp } from '@/components/Icons';
import { useToast } from '@/components/Toast';
import { afterWhatsapp } from '@/lib/actions';
import { fetchBooking, sendEmail } from '@/lib/data';
import { ars, balanceUsd, durationLabel, endTime, hhmm, longDate, num, relativeDay, shortDate, usd } from '@/lib/format';
import { googleCalendarUrl, mapsUrl, whatsappUrl } from '@/lib/links';
import { KIND_LABEL, whatsappText } from '@/lib/messages';
import { applicableKinds, dueDate, wasSent } from '@/lib/reminders';
import { supabase } from '@/lib/supabase/client';
import { STATUSES, type BookingFull, type MessageKind, type Status } from '@/lib/types';

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [b, setB] = useState<BookingFull | null | undefined>(undefined);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => fetchBooking(id).then(setB), [id]);
  useEffect(() => {
    load();
  }, [load]);

  if (b === undefined) return <p className="empty">Cargando…</p>;
  if (b === null) return <p className="empty">No se encontró el turno. <Link href="/" style={{ color: 'var(--rose)' }}>Volver</Link></p>;
  const booking = b;

  async function setStatus(s: Status) {
    if (s === booking.status) return;
    if (s === 'cancelada' && !confirm('¿Cancelar este turno? La fecha queda libre.')) return;
    setBusy('status');
    const { error } = await supabase().from('bookings').update({ status: s }).eq('id', booking.id);
    setBusy(null);
    if (error) return toast('No se pudo cambiar el estado');
    toast(`Estado: ${STATUSES.find((x) => x.value === s)?.label}`);
    load();
  }

  async function onWhatsapp(kind: MessageKind) {
    const r = await afterWhatsapp(booking, kind);
    toast(r.message);
    load();
  }

  async function onEmail(kind: MessageKind) {
    setBusy(`mail-${kind}`);
    const r = await sendEmail(booking.id, kind);
    setBusy(null);
    toast(r.ok ? 'Mail enviado' : r.error ?? 'No se pudo enviar');
    load();
  }

  async function remove() {
    if (!confirm('¿Eliminar este turno definitivamente? Si solo no se hace, mejor marcalo como Cancelado.')) return;
    const { error } = await supabase().from('bookings').delete().eq('id', booking.id);
    if (error) return toast('No se pudo eliminar');
    router.replace('/calendario');
  }

  const c = booking.clients;
  const kinds = applicableKinds(booking);
  const saldo = balanceUsd(booking);
  const maps = mapsUrl(booking.address);
  const waGeneric = whatsappUrl(c?.phone, `¡Hola ${c?.name?.split(' ')[0] ?? ''}! `);

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="page-head">
        <div>
          <p className="eyebrow">— {longDate(booking.date)} · {relativeDay(booking.date)}</p>
          <h1>
            {c?.name ?? 'Clienta'} <em>· {booking.service_name}</em>
          </h1>
        </div>
        <div className="row-wrap">
          <Link href={`/reservas/${booking.id}/editar`} className="btn btn-ghost"><IconEdit /> Editar</Link>
        </div>
      </div>

      <section className="card">
        <div className="spread" style={{ marginBottom: 10 }}>
          <h2 style={{ margin: 0 }}>Estado</h2>
          <StatusPill status={booking.status} />
        </div>
        <div className="seg">
          {STATUSES.map((s) => (
            <button key={s.value} type="button" className={booking.status === s.value ? 'on' : ''} disabled={busy === 'status'} onClick={() => setStatus(s.value)}>
              {s.label}
            </button>
          ))}
        </div>
        {booking.status === 'senada' && (
          <div className="alert alert-warn" style={{ marginTop: 14 }}>
            Seña recibida. Mandale la confirmación por WhatsApp: el turno pasa a <strong>Confirmada</strong>
            {c?.email ? ' y le llega el mail automáticamente.' : '.'}
          </div>
        )}
      </section>

      <div className="grid-2">
        <section className="card">
          <h2>Detalle</h2>
          <dl className="kv">
            <dt>Horario</dt>
            <dd>
              {hhmm(booking.start_time)} a {endTime(hhmm(booking.start_time), booking.duration_min)} ({durationLabel(booking.duration_min)})
              {booking.ready_time ? <div className="muted small">Lista a las {hhmm(booking.ready_time)}</div> : null}
            </dd>
            <dt>Traslado</dt>
            <dd>{booking.travel_min} min antes y después · salir ~{endTime(hhmm(booking.start_time), -booking.travel_min)}</dd>
            {booking.event_type && (<><dt>Evento</dt><dd>{booking.event_type}</dd></>)}
            {booking.extra_people > 0 && (<><dt>Personas extra</dt><dd>{booking.extra_people}</dd></>)}
            <dt>Dirección</dt>
            <dd>
              {booking.address ?? <span className="muted">Sin cargar</span>}
              {booking.zone ? <div className="muted small">{booking.zone}</div> : null}
            </dd>
            {booking.notes && (<><dt>Notas</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{booking.notes}</dd></>)}
          </dl>
          <div className="row-wrap" style={{ marginTop: 16 }}>
            {maps && <a className="btn btn-ghost btn-sm" href={maps} target="_blank" rel="noreferrer"><IconPin /> Cómo llegar</a>}
            <a className="btn btn-ghost btn-sm" href={googleCalendarUrl(booking)} target="_blank" rel="noreferrer"><IconGcal /> Agregar a Google Calendar</a>
          </div>
        </section>

        <section className="card">
          <h2>Clienta y <em>plata</em></h2>
          <dl className="kv">
            <dt>Clienta</dt>
            <dd><Link href={`/clientas/${booking.client_id}`} style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>{c?.name}</Link></dd>
            <dt>WhatsApp</dt>
            <dd>{c?.phone ? (waGeneric ? <a href={waGeneric} target="_blank" rel="noreferrer" style={{ color: 'var(--rose)' }}>{c.phone}</a> : c.phone) : <span className="muted">Sin cargar</span>}</dd>
            <dt>Mail</dt>
            <dd>{c?.email ?? <span className="muted">Sin cargar</span>}</dd>
          </dl>
          <div className="divider" />
          <dl className="kv num">
            <dt>Precio</dt><dd>{usd(booking.price_usd)}</dd>
            <dt>Seña</dt><dd>{usd(booking.deposit_usd)}</dd>
            <dt>Viáticos</dt><dd>{ars(booking.travel_cost_ars)}</dd>
            <dt>A cobrar el día</dt>
            <dd><strong>{usd(saldo)}</strong>{num(booking.travel_cost_ars) > 0 ? ` + ${ars(booking.travel_cost_ars)}` : ''}</dd>
          </dl>
        </section>
      </div>

      <section className="card">
        <h2>Mensajes</h2>
        {kinds.length === 0 ? (
          <p className="empty">
            {booking.status === 'cancelada'
              ? 'El turno está cancelado.'
              : 'Cuando marques la seña como recibida, acá vas a tener la confirmación y los recordatorios.'}
          </p>
        ) : (
          <ul className="list">
            {kinds.map((kind) => {
              const internal = kind === 'prueba';
              const sentWa = wasSent(booking, kind, internal ? 'interno' : 'whatsapp');
              const sentMail = wasSent(booking, kind, 'email');
              const due = kind === 'confirmacion' ? null : dueDate(booking, kind);
              const wa = whatsappUrl(c?.phone, whatsappText(kind, booking));
              const mailable = !internal && Boolean(c?.email);
              return (
                <li key={kind} className="item" style={{ flexWrap: 'wrap' }}>
                  <div className="item-main" style={{ minWidth: 180 }}>
                    <div className="item-title">{KIND_LABEL[kind]}</div>
                    <div className="muted small">
                      {due ? `${shortDate(due)} (${relativeDay(due)})` : 'Al recibir la seña'}
                      {' · '}
                      {internal ? (sentWa ? 'Coordinada ✓' : 'Pendiente') : `WhatsApp ${sentWa ? '✓' : '—'}`}
                      {mailable ? ` · Mail ${sentMail ? '✓' : kind === 'confirmacion' ? '—' : 'automático'}` : ''}
                    </div>
                  </div>
                  <div className="row-wrap">
                    {wa && (
                      <a className={`btn btn-sm ${sentWa ? 'btn-ghost' : 'btn-wa'}`} href={wa} target="_blank" rel="noreferrer" onClick={() => window.setTimeout(() => onWhatsapp(kind), 400)}>
                        <IconWhatsapp /> {sentWa ? 'Reenviar' : 'WhatsApp'}
                      </a>
                    )}
                    {internal && !sentWa && (
                      <button className="btn btn-ghost btn-sm" onClick={() => onWhatsapp(kind)}>Marcar coordinada</button>
                    )}
                    {mailable && (
                      <button className="btn btn-ghost btn-sm" disabled={busy === `mail-${kind}`} onClick={() => onEmail(kind)}>
                        <IconMail /> {busy === `mail-${kind}` ? 'Enviando…' : sentMail ? 'Reenviar mail' : 'Mail'}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {!c?.email && kinds.length > 0 && (
          <p className="muted small" style={{ marginBottom: 0 }}>Cargá el mail de la clienta para que le lleguen también los mails automáticos.</p>
        )}
      </section>

      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-danger btn-sm" onClick={remove}>Eliminar turno</button>
      </div>
    </div>
  );
}

