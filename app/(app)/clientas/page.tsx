'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Client } from '@/lib/types';

interface Row extends Client {
  bookings: { date: string; status: string }[];
}

export default function ClientsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    supabase()
      .from('clients')
      .select('*, bookings(date, status)')
      .order('name')
      .then(({ data }) => {
        setRows((data ?? []) as Row[]);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(s) || (r.phone ?? '').includes(s) || (r.email ?? '').toLowerCase().includes(s));
  }, [rows, q]);

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="page-head">
        <div>
          <p className="eyebrow">— {rows.length} clientas</p>
          <h1>Mis <em>clientas</em></h1>
        </div>
      </div>
      <input className="input" placeholder="Buscar por nombre, teléfono o mail" value={q} onChange={(e) => setQ(e.target.value)} />
      <section className="card">
        {loading ? (
          <p className="empty">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="empty">{rows.length === 0 ? 'Las clientas se crean solas al cargar un turno.' : 'No hay coincidencias.'}</p>
        ) : (
          <ul className="list">
            {filtered.map((c) => {
              const done = c.bookings.filter((b) => b.status !== 'cancelada');
              const last = done.map((b) => b.date).sort().at(-1);
              return (
                <li key={c.id}>
                  <Link href={`/clientas/${c.id}`} className="item">
                    <div className="datebox" style={{ display: 'grid', placeItems: 'center', height: 44 }}>
                      <span className="serif" style={{ fontSize: 22, color: 'var(--rose)' }}>{c.name.slice(0, 1).toUpperCase()}</span>
                    </div>
                    <div className="item-main">
                      <div className="item-title ellipsis">{c.name}</div>
                      <div className="muted small ellipsis">{[c.phone, c.email].filter(Boolean).join(' · ') || 'Sin datos de contacto'}</div>
                    </div>
                    <div className="tiny muted" style={{ textAlign: 'right' }}>
                      {done.length} {done.length === 1 ? 'turno' : 'turnos'}
                      {last ? <div>último {last.split('-').reverse().join('/')}</div> : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
