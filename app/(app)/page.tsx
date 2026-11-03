'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import BookingRow from '@/components/BookingRow';
import TaskRow from '@/components/TaskRow';
import { useBookings } from '@/lib/data';
import { MESES, addDays, ars, balanceUsd, firstName, hhmm, longDate, num, relativeDay, todayAR, usd } from '@/lib/format';
import { mapsUrl } from '@/lib/links';
import { pendingTasks } from '@/lib/reminders';
import { IconPin, IconWhatsapp } from '@/components/Icons';
import StatusPill from '@/components/StatusPill';
import { whatsappUrl } from '@/lib/links';
import type { BookingFull } from '@/lib/types';

export default function Dashboard() {
  const today = todayAR();
  // Desde 45 días atrás (agradecimientos y cobros pendientes) hasta un año adelante.
  const { data, loading, error, reload } = useBookings(addDays(today, -45), addDays(today, 400));

  const active = useMemo(() => data.filter((b) => b.status !== 'cancelada'), [data]);
  const tasks = useMemo(() => pendingTasks(active, today), [active, today]);
  const todays = active.filter((b) => b.date === today && b.status !== 'consulta');
  const upcoming = active.filter((b) => b.date > today).slice(0, 6);
  const toCollect = active.filter(
    (b) => (b.date < today && ['senada', 'confirmada', 'realizada'].includes(b.status)) || (b.date === today && b.status === 'realizada'),
  );
  const consultas = active.filter((b) => b.status === 'consulta' && b.date >= today);

  const monthKey = today.slice(0, 7);
  const monthBookings = active.filter((b) => b.date.startsWith(monthKey) && b.status !== 'consulta');
  const monthIncome = monthBookings.reduce((s, b) => s + num(b.price_usd), 0);
  const pendingBalance = active
    .filter((b) => b.date >= today && ['senada', 'confirmada'].includes(b.status))
    .reduce((s, b) => s + balanceUsd(b), 0);

  const heroes = todays.length > 0 ? todays : upcoming.slice(0, 1);
  const heroLabel = (b: BookingFull) => (b.date === today ? 'Hoy' : `Próximo · ${relativeDay(b.date)}`);
  const pendingMsgs = tasks.length;

  return (
    <div className="grid" style={{ gap: 22 }}>
      <div className="topbar">
        <span className="chip"><span className="dot-rose" />{longDate(today)[0].toUpperCase() + longDate(today).slice(1)}</span>
        <span className="avatar" aria-hidden="true">D</span>
      </div>

      <div className="page-head" style={{ marginBottom: 0 }}>
        <h1>
          Hola, <em>Delfi.</em>
          <span className="h1-sub">
            {todays.length === 0 ? 'Hoy tenés el día libre.' : `Hoy tenés ${todays.length} ${todays.length === 1 ? 'turno' : 'turnos'}.`}
          </span>
        </h1>
      </div>

      {error && <div className="alert alert-err">No se pudieron cargar los turnos: {error}</div>}

      <div className="stats">
        <div className="stat"><p className="eyebrow">{MESES[Number(today.slice(5, 7)) - 1]}</p><div className="v num">{monthBookings.length}</div><div className="muted small">servicios del mes</div></div>
        <div className="stat"><p className="eyebrow">Por cobrar</p><div className="v num">{num(pendingBalance).toLocaleString('es-AR')} <em>usd</em></div><div className="muted small">en próximos turnos</div></div>
        <div className="stat"><p className="eyebrow">Ingresos del mes</p><div className="v num">{num(monthIncome).toLocaleString('es-AR')} <em>usd</em></div><div className="muted small">sin contar viáticos</div></div>
        <div className="stat"><p className="eyebrow">Mensajes</p><div className="v num">{pendingMsgs}</div><div className="muted small">para enviar hoy</div></div>
      </div>

      {heroes.map((b) => {
        const maps = mapsUrl(b.address);
        const wa = whatsappUrl(b.clients?.phone, `¡Hola ${firstName(b.clients?.name)}! `);
        return (
          <section key={b.id} className="hero">
            <div className="spread">
              <span className="eyebrow" style={{ margin: 0 }}>{heroLabel(b)}</span>
              <StatusPill status={b.status} />
            </div>
            <Link href={`/reservas/${b.id}`} style={{ display: 'block', marginTop: 10 }}>
              <div className="hero-time num">{hhmm(b.start_time)}</div>
              <div style={{ fontSize: 17, fontWeight: 500, marginTop: 8 }}>{b.clients?.name}</div>
              <div className="hero-sub small">
                {b.service_name}
                {b.zone ? ` · ${b.zone}` : ''}
                {b.ready_time ? ` · lista ${hhmm(b.ready_time)}` : ''} · salir ~{hhmm(addMinutes(b.start_time, -b.travel_min))}
              </div>
              <div className="hero-sub small">
                Cobrar <strong style={{ color: 'var(--rose-ink)' }}>{usd(balanceUsd(b))}</strong>
                {num(b.travel_cost_ars) > 0 ? ` + ${ars(b.travel_cost_ars)} viáticos` : ''}
              </div>
            </Link>
            <div className="row" style={{ marginTop: 16 }}>
              {maps && (
                <a className="btn glass-on-color" style={{ flex: 1 }} href={maps} target="_blank" rel="noreferrer"><IconPin /> Cómo llegar</a>
              )}
              {wa && (
                <a className="btn btn-light" style={{ flex: 1 }} href={wa} target="_blank" rel="noreferrer"><IconWhatsapp /> Escribirle</a>
              )}
            </div>
          </section>
        );
      })}

      <div className="grid-2">
        <section className="card">
          <div className="section-head"><h2 style={{ margin: 0 }}>Para enviar <em>hoy</em></h2><span className="tiny muted">{pendingMsgs} {pendingMsgs === 1 ? 'mensaje' : 'mensajes'}</span></div>
          {loading ? (
            <p className="empty">Cargando…</p>
          ) : tasks.length === 0 ? (
            <p className="empty">Nada pendiente por hoy.</p>
          ) : (
            <ul className="list">{tasks.map((t, i) => <TaskRow key={`${t.booking.id}-${t.kind}`} task={t} index={i + 1} onDone={reload} />)}</ul>
          )}
        </section>

        <section className="card">
          <div className="spread"><h2>Próximos <em>turnos</em></h2><Link href="/calendario" className="small muted">Ver calendario →</Link></div>
          {loading ? (
            <p className="empty">Cargando…</p>
          ) : upcoming.length === 0 ? (
            <p className="empty">No hay turnos cargados. <Link href="/reservas/nueva" style={{ color: 'var(--rose)' }}>Cargar uno</Link></p>
          ) : (
            <ul className="list">{upcoming.map((b) => <BookingRow key={b.id} b={b} />)}</ul>
          )}
        </section>
      </div>

      {(toCollect.length > 0 || consultas.length > 0) && (
        <div className="grid-2">
          {toCollect.length > 0 && (
            <section className="card">
              <h2>Saldos <em>sin cobrar</em></h2>
              <p className="muted small" style={{ marginTop: -6 }}>Turnos que ya pasaron y todavía no marcaste como cobrados.</p>
              <ul className="list">{toCollect.map((b) => <BookingRow key={b.id} b={b} />)}</ul>
            </section>
          )}
          {consultas.length > 0 && (
            <section className="card">
              <h2>Consultas <em>sin seña</em></h2>
              <p className="muted small" style={{ marginTop: -6 }}>Fechas que todavía no están aseguradas.</p>
              <ul className="list">{consultas.map((b) => <BookingRow key={b.id} b={b} />)}</ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function addMinutes(t: string, m: number) {
  const [h, mi] = t.split(':').map(Number);
  const total = (((h * 60 + mi + m) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
