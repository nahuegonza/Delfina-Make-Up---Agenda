'use client';
import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase/client';
import { swapSort, useTable, type WebFaq } from '@/lib/web';

export default function FaqsPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useTable<WebFaq>('web_faqs');
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState({ question: '', answer: '' });

  function start(q?: WebFaq) {
    setEditing(q ? q.id : 'new');
    setF(q ? { question: q.question, answer: q.answer } : { question: '', answer: '' });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.question.trim() || !f.answer.trim()) return toast('Completá la pregunta y la respuesta');
    const db = supabase().from('web_faqs');
    const payload = { question: f.question.trim(), answer: f.answer.trim() };
    const { error } = editing === 'new' ? await db.insert({ ...payload, sort: (data.at(-1)?.sort ?? 0) + 1 }) : await db.update(payload).eq('id', editing!);
    if (error) return toast(`No se pudo guardar: ${error.message}`);
    toast('Pregunta guardada');
    setEditing(null);
    reload();
  }

  async function remove(q: WebFaq) {
    if (!confirm('¿Borrar esta pregunta?')) return;
    await supabase().from('web_faqs').delete().eq('id', q.id);
    toast('Pregunta borrada');
    reload();
  }

  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="spread">
        <p className="muted small" style={{ margin: 0 }}>Aparecen en la web y el chat de consultas las usa para responder.</p>
        <button className="btn btn-primary" onClick={() => start()}>+ Pregunta</button>
      </div>
      {editing && (
        <section className="card">
          <form className="form" onSubmit={save}>
            <div className="field"><label htmlFor="q">Pregunta</label><input id="q" className="input" value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} /></div>
            <div className="field"><label htmlFor="a">Respuesta</label><textarea id="a" className="textarea" value={f.answer} onChange={(e) => setF({ ...f, answer: e.target.value })} /></div>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
              <button className="btn btn-primary">Guardar</button>
            </div>
          </form>
        </section>
      )}
      {error && <div className="alert alert-err">No se pudieron cargar: {error}</div>}
      <section className="card">
        {loading ? <p className="empty">Cargando…</p> : data.length === 0 ? <p className="empty">Sin preguntas todavía.</p> : (
          <ul className="list">
            {data.map((q, i) => (
              <li key={q.id} className="item" style={{ opacity: q.visible ? 1 : 0.5, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div className="item-main" style={{ minWidth: 220 }}>
                  <div className="item-title">{q.question}</div>
                  <div className="muted small">{q.answer}</div>
                </div>
                <div className="row-wrap">
                  <button className="btn btn-ghost btn-sm btn-icon" aria-label="Subir" disabled={i === 0} onClick={async () => { await swapSort('web_faqs', q, data[i - 1]); reload(); }}>↑</button>
                  <button className="btn btn-ghost btn-sm btn-icon" aria-label="Bajar" disabled={i === data.length - 1} onClick={async () => { await swapSort('web_faqs', q, data[i + 1]); reload(); }}>↓</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => start(q)}>Editar</button>
                  <button className="btn btn-ghost btn-sm" onClick={async () => { await supabase().from('web_faqs').update({ visible: !q.visible }).eq('id', q.id); reload(); }}>{q.visible ? 'Ocultar' : 'Mostrar'}</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(q)}>Borrar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
