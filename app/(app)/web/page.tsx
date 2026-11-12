'use client';
import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { IconMail, IconWhatsapp } from '@/components/Icons';
import { supabase } from '@/lib/supabase/client';
import { useTable, type Inquiry } from '@/lib/web';

const STATUS: { value: Inquiry['status']; label: string }[] = [
  { value: 'nueva', label: 'Nuevas' },
  { value: 'respondida', label: 'Respondidas' },
  { value: 'archivada', label: 'Archivadas' },
];

const fmtDate = (d: string | null) => (d ? d.split('-').reverse().join('/') : 'Sin fecha');
const waNumber = (p: string) => {
  const n = p.replace(/\D/g, '');
  return n.startsWith('54') ? n : `549${n.replace(/^0/, '').replace(/^15/, '')}`;
};

export default function InquiriesPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Inquiry['status']>('nueva');
  const { data, loading, error, reload } = useTable<Inquiry>('web_inquiries', { order: 'created_at', ascending: false });
  const list = data.filter((q) => q.status === tab);

  async function setStatus(q: Inquiry, status: Inquiry['status']) {
    const { error } = await supabase().from('web_inquiries').update({ status }).eq('id', q.id);
    if (error) return toast(`No se pudo cambiar: ${error.message}`);
    toast(status === 'respondida' ? 'Marcada como respondida' : status === 'archivada' ? 'Archivada' : 'Vuelve a nuevas');
    reload();
  }

  return (
    <section className="card">
      <div className="spread" style={{ flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ margin: 0 }}>Consultas desde la web</h2>
        <div className="seg">
          {STATUS.map((s) => (
            <button key={s.value} className={tab === s.value ? 'on' : ''} onClick={() => setTab(s.value)}>
              {s.label} {s.value === 'nueva' && data.filter((q) => q.status === 'nueva').length ? `(${data.filter((q) => q.status === 'nueva').length})` : ''}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="alert alert-err" style={{ marginTop: 12 }}>No se pudieron cargar: {error}</div>}
      {loading ? (
        <p className="empty">Cargando…</p>
      ) : list.length === 0 ? (
        <p className="empty">{tab === 'nueva' ? 'No hay consultas nuevas. Cuando alguien complete el formulario de la web, aparece acá y te llega un mail a contacto@.' : 'Nada por acá.'}</p>
      ) : (
        <ul className="list">
          {list.map((q) => (
            <li key={q.id} className="item" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div className="item-main" style={{ minWidth: 220 }}>
                <div className="item-title">{q.name}</div>
                <div className="muted small">
                  {q.service || 'Servicio sin elegir'} · {fmtDate(q.event_date)} · {q.zone || 'Zona sin elegir'}
                </div>
                {q.message && <p className="small" style={{ margin: '8px 0 0', whiteSpace: 'pre-line' }}>{q.message}</p>}
                <div className="tiny muted" style={{ marginTop: 6 }}>
                  Recibida el {new Date(q.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  {q.email ? ` · ${q.email}` : ''}{q.phone ? ` · ${q.phone}` : ''}{!q.email_sent ? ' · el mail no se envió' : ''}
                </div>
              </div>
              <div className="row-wrap">
                {q.phone && (
                  <a className="btn btn-wa btn-sm" href={`https://wa.me/${waNumber(q.phone)}?text=${encodeURIComponent(`¡Hola ${q.name.split(' ')[0]}! Soy Delfi, te escribo por tu consulta en la web.`)}`} target="_blank" rel="noopener"><IconWhatsapp /> WhatsApp</a>
                )}
                {q.email && (
                  <a className="btn btn-ghost btn-sm" href={`mailto:${q.email}?subject=${encodeURIComponent('Tu consulta · Delfina Acuña Makeup')}`}><IconMail /> Mail</a>
                )}
                {q.status !== 'respondida' && <button className="btn btn-soft btn-sm" onClick={() => setStatus(q, 'respondida')}>Respondida</button>}
                {q.status !== 'archivada' ? (
                  <button className="btn btn-ghost btn-sm" onClick={() => setStatus(q, 'archivada')}>Archivar</button>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={() => setStatus(q, 'nueva')}>Recuperar</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
