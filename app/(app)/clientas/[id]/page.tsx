'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BookingRow from '@/components/BookingRow';
import { useToast } from '@/components/Toast';
import { IconWhatsapp } from '@/components/Icons';
import { supabase } from '@/lib/supabase/client';
import { whatsappUrl } from '@/lib/links';
import { firstName, num, usd } from '@/lib/format';
import { BOOKING_SELECT, type BookingFull, type Client } from '@/lib/types';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [client, setClient] = useState<Client | null | undefined>(undefined);
  const [bookings, setBookings] = useState<BookingFull[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const db = supabase();
    db.from('clients').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      setClient(data as Client | null);
      if (data) setForm({ name: data.name ?? '', phone: data.phone ?? '', email: data.email ?? '', notes: data.notes ?? '' });
    });
    db.from('bookings').select(BOOKING_SELECT).eq('client_id', id).order('date', { ascending: false }).then(({ data }) => setBookings((data ?? []) as BookingFull[]));
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast('El nombre no puede quedar vacío');
    setSaving(true);
    const { error } = await supabase()
      .from('clients')
      .update({ name: form.name.trim(), phone: form.phone.trim() || null, email: form.email.trim() || null, notes: form.notes.trim() || null })
      .eq('id', id);
    setSaving(false);
    toast(error ? 'No se pudo guardar' : 'Datos guardados');
  }

  if (client === undefined) return <p className="empty">Cargando…</p>;
  if (client === null) return <p className="empty">No se encontró la clienta.</p>;

  const active = bookings.filter((b) => b.status !== 'cancelada');
  const total = active.filter((b) => b.status !== 'consulta').reduce((s, b) => s + num(b.price_usd), 0);
  const wa = whatsappUrl(form.phone, `¡Hola ${firstName(form.name)}! `);

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="page-head">
        <div>
          <p className="eyebrow">— Clienta · {active.length} {active.length === 1 ? 'turno' : 'turnos'} · {usd(total)}</p>
          <h1>{client.name.split(' ')[0]} <em>{client.name.split(' ').slice(1).join(' ')}</em></h1>
        </div>
        <div className="row-wrap">
          {wa && <a className="btn btn-wa" href={wa} target="_blank" rel="noreferrer"><IconWhatsapp /> Escribirle</a>}
          <Link className="btn btn-primary" href="/reservas/nueva">+ Turno</Link>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="card">
          <h2>Datos</h2>
          <form className="form" onSubmit={save}>
            <div className="field"><label htmlFor="n">Nombre</label><input id="n" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="fields fields-2">
              <div className="field"><label htmlFor="p">WhatsApp</label><input id="p" className="input" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="field"><label htmlFor="m">Mail</label><input id="m" className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="field">
              <label htmlFor="notes">Notas</label>
              <textarea id="notes" className="textarea" placeholder="Tipo de piel, sensibilidades, productos que le gustaron, looks anteriores…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
            </div>
          </form>
        </section>
        <section className="card">
          <h2>Historial</h2>
          {bookings.length === 0 ? <p className="empty">Sin turnos todavía.</p> : <ul className="list">{bookings.map((b) => <BookingRow key={b.id} b={b} />)}</ul>}
        </section>
      </div>
    </div>
  );
}
