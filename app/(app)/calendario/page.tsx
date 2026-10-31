'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import StatusPill from '@/components/StatusPill';
import { IconChevronLeft, IconChevronRight } from '@/components/Icons';
import { useBookings } from '@/lib/data';
import { MESES, addDays, endTime, hhmm, longDate, todayAR, weekday } from '@/lib/format';
import type { BookingFull } from '@/lib/types';

const WEEK = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

function monthGrid(year: number, month: number): string[] {
  const first = `${year}-${String(month).padStart(2, '0')}-01`;
  const offset = (weekday(first) + 6) % 7; // lunes primero
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export default function CalendarPage() {
  const today = todayAR();
  const [ym, setYm] = useState({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) });
  const [selected, setSelected] = useState(today);
  const [showCancelled, setShowCancelled] = useState(false);

  const days = useMemo(() => monthGrid(ym.y, ym.m), [ym]);
  const { data, loading } = useBookings(days[0], days[days.length - 1]);

  const visible = data.filter((b) => showCancelled || b.status !== 'cancelada');
  const byDay = useMemo(() => {
    const map = new Map<string, BookingFull[]>();
    for (const b of visible) map.set(b.date, [...(map.get(b.date) ?? []), b]);
    return map;
  }, [visible]);

  function move(delta: number) {
    const m0 = ym.m - 1 + delta;
    const y = ym.y + Math.floor(m0 / 12);
    const m = ((m0 % 12) + 12) % 12 + 1;
    setYm({ y, m });
  }

  function goToday() {
    setYm({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) });
    setSelected(today);
  }

  const dayBookings = byDay.get(selected) ?? [];
  const monthPrefix = `${ym.y}-${String(ym.m).padStart(2, '0')}`;
  const monthCount = visible.filter((b) => b.date.startsWith(monthPrefix) && b.status !== 'cancelada').length;

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="page-head">
        <div>
          <p className="eyebrow">— Calendario · {monthCount} {monthCount === 1 ? 'turno' : 'turnos'}</p>
          <h1>
            {MESES[ym.m - 1][0].toUpperCase() + MESES[ym.m - 1].slice(1)} <em>{ym.y}</em>
          </h1>
        </div>
        <div className="row">
          <button className="btn btn-ghost btn-sm" onClick={() => move(-1)} aria-label="Mes anterior"><IconChevronLeft /></button>
          <button className="btn btn-ghost btn-sm" onClick={goToday}>Hoy</button>
          <button className="btn btn-ghost btn-sm" onClick={() => move(1)} aria-label="Mes siguiente"><IconChevronRight /></button>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="card">
          <div className="cal">
            {WEEK.map((d) => <div key={d} className="cal-h">{d}</div>)}
            {days.map((d) => {
              const list = byDay.get(d) ?? [];
              const cls = ['cal-d', d.slice(0, 7) !== monthPrefix ? 'out' : '', d === today ? 'today' : '', d === selected ? 'sel' : ''].join(' ');
              return (
                <button key={d} type="button" className={cls} onClick={() => setSelected(d)} aria-label={`${longDate(d)}: ${list.length} turnos`}>
                  <span className="n num">{Number(d.slice(8))}</span>
                  <span className="dots">{list.slice(0, 4).map((b) => <span key={b.id} className={`dot st-${b.status}`} />)}</span>
                </button>
              );
            })}
          </div>
          <div className="row-wrap tiny muted" style={{ marginTop: 12 }}>
            <span className="row"><span className="dot st-consulta" /> Consulta</span>
            <span className="row"><span className="dot st-senada" /> Señada</span>
            <span className="row"><span className="dot st-confirmada" /> Confirmada</span>
            <span className="row"><span className="dot st-realizada" /> Realizada</span>
            <label className="check" style={{ marginLeft: 'auto', fontSize: 12 }}>
              <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} /> Ver cancelados
            </label>
          </div>
        </section>

        <section className="card">
          <div className="spread">
            <div>
              <p className="eyebrow" style={{ marginBottom: 2 }}>— Día</p>
              <h2 style={{ margin: 0 }}>{longDate(selected)}</h2>
            </div>
            <Link href={`/reservas/nueva?fecha=${selected}`} className="btn btn-soft btn-sm">+ Turno</Link>
          </div>
          <div className="timeline" style={{ marginTop: 12 }}>
            {loading ? (
              <p className="empty">Cargando…</p>
            ) : dayBookings.length === 0 ? (
              <p className="empty">Día libre.</p>
            ) : (
              dayBookings.map((b) => (
                <div key={b.id}>
                  {b.travel_min > 0 && (
                    <div className="slot">
                      <div className="slot-time num">{endTime(hhmm(b.start_time), -b.travel_min)}</div>
                      <div className="slot-travel">Traslado · {b.travel_min} min{b.zone ? ` · ${b.zone}` : ''}</div>
                    </div>
                  )}
                  <div className="slot">
                    <div className="slot-time num">{hhmm(b.start_time)}</div>
                    <Link href={`/reservas/${b.id}`} className="slot-body slot-booking">
                      <div className="spread">
                        <strong>{b.clients?.name}</strong>
                        <StatusPill status={b.status} />
                      </div>
                      <div className="small">{b.service_name} · hasta {endTime(hhmm(b.start_time), b.duration_min)}</div>
                      {b.ready_time && <div className="small muted">Lista a las {hhmm(b.ready_time)}</div>}
                      {b.address && <div className="small muted ellipsis">{b.address}</div>}
                    </Link>
                  </div>
                  {b.travel_min > 0 && (
                    <div className="slot">
                      <div className="slot-time num">{endTime(hhmm(b.start_time), b.duration_min)}</div>
                      <div className="slot-travel">Vuelta · {b.travel_min} min</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
