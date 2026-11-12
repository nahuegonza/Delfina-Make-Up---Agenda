'use client';
import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase/client';
import { swapSort, useTable, type WebService } from '@/lib/web';

type Form = Omit<WebService, 'id' | 'sort' | 'visible'>;
const EMPTY: Form = { title: '', eyebrow: '', description: '', duration_label: '', price_prefix: null, price_label: '', featured: false };

export default function WebServicesPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useTable<WebService>('web_services');
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState<Form>(EMPTY);

  function start(s?: WebService) {
    setEditing(s ? s.id : 'new');
    setF(s ? { title: s.title, eyebrow: s.eyebrow, description: s.description, duration_label: s.duration_label, price_prefix: s.price_prefix, price_label: s.price_label, featured: s.featured } : EMPTY);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) return toast('Poné el nombre del servicio');
    const payload = { ...f, title: f.title.trim(), price_label: f.price_label.trim() || 'Consultar', price_prefix: f.price_prefix || null };
    const db = supabase().from('web_services');
    const { error } = editing === 'new' ? await db.insert({ ...payload, sort: (data.at(-1)?.sort ?? 0) + 1 }) : await db.update(payload).eq('id', editing!);
    if (error) return toast(`No se pudo guardar: ${error.message}`);
    toast('Servicio guardado');
    setEditing(null);
    reload();
  }

  async function remove(s: WebService) {
    if (!confirm(`¿Borrar "${s.title}" de la web?`)) return;
    const { error } = await supabase().from('web_services').delete().eq('id', s.id);
    if (error) return toast(`No se pudo borrar: ${error.message}`);
    toast('Servicio borrado');
    if (editing === s.id) setEditing(null);
    reload();
  }

  async function toggle(s: WebService) {
    await supabase().from('web_services').update({ visible: !s.visible }).eq('id', s.id);
    reload();
  }

  async function move(i: number, dir: -1 | 1) {
    if (!data[i + dir]) return;
    await swapSort('web_services', data[i], data[i + dir]);
    reload();
  }

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="spread">
        <p className="muted small" style={{ margin: 0 }}>Son las tarjetas de servicios de la web, con precio orientativo. No cambian los servicios de tus turnos.</p>
        <button className="btn btn-primary" onClick={() => start()}>+ Servicio</button>
      </div>

      {editing && (
        <section className="card">
          <h2>{editing === 'new' ? 'Nuevo servicio' : 'Editar servicio'}</h2>
          <form className="form" onSubmit={save}>
            <div className="fields fields-2">
              <div className="field"><label htmlFor="t">Nombre</label><input id="t" className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Maquillaje social" /></div>
              <div className="field"><label htmlFor="e">Etiqueta chiquita</label><input id="e" className="input" value={f.eyebrow} onChange={(e) => setF({ ...f, eyebrow: e.target.value })} placeholder="Fiestas y eventos" /></div>
            </div>
            <div className="field"><label htmlFor="d">Descripción</label><textarea id="d" className="textarea" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
            <div className="fields fields-3">
              <div className="field"><label htmlFor="du">Duración</label><input id="du" className="input" value={f.duration_label} onChange={(e) => setF({ ...f, duration_label: e.target.value })} placeholder="1 h" /></div>
              <div className="field">
                <label htmlFor="pp">Antes del precio</label>
                <select id="pp" className="select" value={f.price_prefix ?? ''} onChange={(e) => setF({ ...f, price_prefix: e.target.value || null })}>
                  <option value="">Nada</option>
                  <option value="desde">desde</option>
                </select>
              </div>
              <div className="field"><label htmlFor="pl">Precio</label><input id="pl" className="input" value={f.price_label} onChange={(e) => setF({ ...f, price_label: e.target.value })} placeholder="USD 100 o Consultar" /></div>
            </div>
            <label className="check"><input type="checkbox" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} /> Destacado (tarjeta en bordó)</label>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
              <button className="btn btn-primary">Guardar</button>
            </div>
          </form>
        </section>
      )}

      {error && <div className="alert alert-err">No se pudieron cargar: {error}</div>}
      <section className="card">
        {loading ? <p className="empty">Cargando…</p> : data.length === 0 ? <p className="empty">Todavía no hay servicios en la web.</p> : (
          <ul className="list">
            {data.map((s, i) => (
              <li key={s.id} className="item" style={{ opacity: s.visible ? 1 : 0.5, flexWrap: 'wrap' }}>
                <div className="item-main" style={{ minWidth: 200 }}>
                  <div className="item-title">{s.title}{s.featured ? ' · destacado' : ''}</div>
                  <div className="muted small">{s.duration_label} · {s.price_prefix ? `${s.price_prefix} ` : ''}{s.price_label}{!s.visible ? ' · oculto' : ''}</div>
                </div>
                <div className="row-wrap">
                  <button className="btn btn-ghost btn-sm btn-icon" aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                  <button className="btn btn-ghost btn-sm btn-icon" aria-label="Bajar" disabled={i === data.length - 1} onClick={() => move(i, 1)}>↓</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => start(s)}>Editar</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggle(s)}>{s.visible ? 'Ocultar' : 'Mostrar'}</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(s)}>Borrar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
