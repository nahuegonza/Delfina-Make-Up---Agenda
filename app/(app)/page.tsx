'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import BookingRow from '@/components/BookingRow';
import TaskRow from '@/components/TaskRow';
import { useBookings } from '@/lib/data';
import { MESES, addDays, ars, balanceUsd, hhmm, longDate, num, todayAR, usd } from '@/lib/format';
import { mapsUrl } from '@/lib/links';
import { pendingTasks } from '@/lib/reminders';
import { IconPin } from '@/components/Icons';

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

  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', hour12: false }).format(new Date()));
  const greeting = hour < 13 ? 'Buen día' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="page-head">
        <div>
          <p className="eyebrow">— {longDate(today)}</p>
          <h1>
            {greeting}, <em>Delfi</em>
          </h1>
        </div>
        <Link href="/reservas/nueva" className="btn btn-primary desktop-only">+ Nuevo turno</Link>
      </div>

      {error && <div className="alert alert-err">No se pudieron cargar los turnos: {error}</div>}

      <div className="stats">
        <div className="stat"><p className="eyebrow">Hoy</p><div className="v num">{todays.length}</div><div className="muted small">{todays.length === 1 ? 'servicio' : 'servicios'}</div></div>
        <div className="stat"><p className="eyebrow">{MESES[Number(today.slice(5, 7)) - 1]}</p><div className="v num">{monthBookings.length}</div><div className="muted small">servicios del mes</div></div>
        <div className="stat"><p className="eyebrow">Ingresos del mes</p><div className="v num">{usd(monthIncome)}</div><div className="muted small">sin contar viáticos</div></div>
        <div className="stat"><p className="eyebrow">Saldos por cobrar</p><div className="v num">{usd(pendingBalance)}</div><div className="muted small">en próximos turnos</div></div>
      </div>

      {todays.length > 0 && (
        <section className="card" style={{ background: 'var(--blush)', border: 0 }}>
          <h2>Tu día de <em>hoy</em></h2>
          <ul className="list">
            {todays.map((b) => (
              <li key={b.id} className="item">
                <div className="item-main">
                  <Link href={`/reservas/${b.id}`} className="item-title">{hhmm(b.start_time)} · {b.clients?.name}</Link>
                  <div className="small muted">
                    {b.service_name}
                    {b.ready_time ? ` · lista a las ${hhmm(b.ready_time)}` : ''} · salir ~{hhmm(addMinutes(b.start_time, -b.travel_min))}
                  </div>
                  <div className="small">
                    A cobrar: <strong>{usd(balanceUsd(b))}</strong>
                    {num(b.travel_cost_ars) > 0 ? ` + ${ars(b.travel_cost_ars)} viáticos` : ''}
                  </div>
                </div>
                {mapsUrl(b.address) && (
                  <a className="btn btn-ghost btn-sm" href={mapsUrl(b.address)!} target="_blank" rel="noreferrer"><IconPin /> Ir</a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid-2">
        <section className="card">
          <h2>Mensajes para <em>enviar</em></h2>
          {loading ? (
            <p className="empty">Cargando…</p>
          ) : tasks.length === 0 ? (
            <p className="empty">Nada pendiente por hoy ✨</p>
          ) : (
            <ul className="list">{tasks.map((t) => <TaskRow key={`${t.booking.id}-${t.kind}`} task={t} onDone={reload} />)}</ul>
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
