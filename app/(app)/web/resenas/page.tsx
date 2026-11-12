'use client';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase/client';
import { swapSort, useTable, type WebReview } from '@/lib/web';

const EMPTY = { author: '', when_label: '', rating: 5, body: '' };

export default function ReviewsPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useTable<WebReview>('web_reviews');
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState(EMPTY);
  const [g, setG] = useState({ rating: '', count: '', url: '', review_url: '' });

  useEffect(() => {
    supabase().from('web_settings').select('value').eq('key', 'google').maybeSingle().then(({ data }) => {
      const v = (data?.value ?? {}) as { rating?: number; count?: number; url?: string; review_url?: string };
      setG({ rating: v.rating != null ? String(v.rating) : '', count: v.count != null ? String(v.count) : '', url: v.url ?? '', review_url: v.review_url ?? '' });
    });
  }, []);

  async function saveGoogle(e: React.FormEvent) {
    e.preventDefault();
    const value = {
      rating: g.rating ? Math.min(5, Math.max(1, Number(g.rating.replace(',', '.')))) : null,
      count: g.count ? Math.max(0, Math.round(Number(g.count))) : null,
      url: g.url.trim(),
      review_url: g.review_url.trim(),
    };
    const { error } = await supabase().from('web_settings').upsert({ key: 'google', value, updated_at: new Date().toISOString() });
    toast(error ? `No se pudo guardar: ${error.message}` : 'Datos de Google guardados');
  }

  function start(r?: WebReview) {
    setEditing(r ? r.id : 'new');
    setF(r ? { author: r.author, when_label: r.when_label, rating: r.rating, body: r.body } : EMPTY);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.author.trim() || !f.body.trim()) return toast('Completá el nombre y el texto de la reseña');
    const db = supabase().from('web_reviews');
    const payload = { ...f, author: f.author.trim(), body: f.body.trim() };
    const { error } = editing === 'new' ? await db.insert({ ...payload, sort: (data.at(-1)?.sort ?? 0) + 1 }) : await db.update(payload).eq('id', editing!);
    if (error) return toast(`No se pudo guardar: ${error.message}`);
    toast('Reseña guardada');
    setEditing(null);
    reload();
  }

  return (
    <div className="grid" style={{ gap: 18 }}>
      <section className="card">
        <h2>Tu perfil de Google</h2>
        <p className="muted small" style={{ marginTop: 0 }}>Copiá la calificación y la cantidad de reseñas de tu perfil, y los dos links que te da Google (ver perfil y “Pedir reseñas”).</p>
        <form className="form" onSubmit={saveGoogle}>
          <div className="fields fields-2">
            <div className="field"><label htmlFor="gr">Calificación</label><input id="gr" className="input" inputMode="decimal" placeholder="5,0" value={g.rating} onChange={(e) => setG({ ...g, rating: e.target.value })} /></div>
            <div className="field"><label htmlFor="gc">Cantidad de reseñas</label><input id="gc" className="input" inputMode="numeric" placeholder="24" value={g.count} onChange={(e) => setG({ ...g, count: e.target.value })} /></div>
          </div>
          <div className="field"><label htmlFor="gu">Link a tu perfil de Google</label><input id="gu" className="input" type="url" placeholder="https://maps.app.goo.gl/…" value={g.url} onChange={(e) => setG({ ...g, url: e.target.value })} /></div>
          <div className="field"><label htmlFor="gw">Link para dejar una reseña</label><input id="gw" className="input" type="url" placeholder="https://g.page/r/…/review" value={g.review_url} onChange={(e) => setG({ ...g, review_url: e.target.value })} /></div>
          <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn btn-primary">Guardar</button></div>
        </form>
      </section>

      <div className="spread">
        <p className="muted small" style={{ margin: 0 }}>Copiá acá las reseñas de Google que quieras mostrar (con el nombre como aparece en Google).</p>
        <button className="btn btn-primary" onClick={() => start()}>+ Reseña</button>
      </div>

      {editing && (
        <section className="card">
          <form className="form" onSubmit={save}>
            <div className="fields fields-3">
              <div className="field"><label htmlFor="ra">Nombre</label><input id="ra" className="input" value={f.author} onChange={(e) => setF({ ...f, author: e.target.value })} /></div>
              <div className="field"><label htmlFor="rw">Cuándo</label><input id="rw" className="input" placeholder="hace 2 semanas" value={f.when_label} onChange={(e) => setF({ ...f, when_label: e.target.value })} /></div>
              <div className="field"><label htmlFor="rr">Estrellas</label>
                <select id="rr" className="select" value={f.rating} onChange={(e) => setF({ ...f, rating: Number(e.target.value) })}>
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
                </select>
              </div>
            </div>
            <div className="field"><label htmlFor="rb">Texto</label><textarea id="rb" className="textarea" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></div>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
              <button className="btn btn-primary">Guardar</button>
            </div>
          </form>
        </section>
      )}

      {error && <div className="alert alert-err">No se pudieron cargar: {error}</div>}
      <section className="card">
        {loading ? <p className="empty">Cargando…</p> : data.length === 0 ? <p className="empty">Sin reseñas cargadas. Mientras tanto la web invita a dejar una en Google.</p> : (
          <ul className="list">
            {data.map((r, i) => (
              <li key={r.id} className="item" style={{ opacity: r.visible ? 1 : 0.5, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div className="item-main" style={{ minWidth: 220 }}>
                  <div className="item-title">{r.author} · {'★'.repeat(r.rating)}</div>
                  <div className="muted small">{r.when_label}</div>
                  <p className="small" style={{ margin: '6px 0 0' }}>{r.body}</p>
                </div>
                <div className="row-wrap">
                  <button className="btn btn-ghost btn-sm btn-icon" aria-label="Subir" disabled={i === 0} onClick={async () => { await swapSort('web_reviews', r, data[i - 1]); reload(); }}>↑</button>
                  <button className="btn btn-ghost btn-sm btn-icon" aria-label="Bajar" disabled={i === data.length - 1} onClick={async () => { await swapSort('web_reviews', r, data[i + 1]); reload(); }}>↓</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => start(r)}>Editar</button>
                  <button className="btn btn-ghost btn-sm" onClick={async () => { await supabase().from('web_reviews').update({ visible: !r.visible }).eq('id', r.id); reload(); }}>{r.visible ? 'Ocultar' : 'Mostrar'}</button>
                  <button className="btn btn-danger btn-sm" onClick={async () => { if (confirm('¿Borrar esta reseña?')) { await supabase().from('web_reviews').delete().eq('id', r.id); reload(); } }}>Borrar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
