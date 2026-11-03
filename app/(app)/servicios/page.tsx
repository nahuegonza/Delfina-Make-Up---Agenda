'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { useServices } from '@/lib/data';
import { durationLabel, usd } from '@/lib/format';
import { supabase } from '@/lib/supabase/client';
import type { Service } from '@/lib/types';

const EMPTY = { name: '', duration_min: '60', price_usd: '', has_trial: false, sends_tips: true };

export default function ServicesPage() {
  const toast = useToast();
  const router = useRouter();
  const { data, loading, error, reload } = useServices(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  function startEdit(s?: Service) {
    if (s) {
      setEditing(s.id);
      setForm({ name: s.name, duration_min: String(s.duration_min), price_usd: s.price_usd != null ? String(s.price_usd) : '', has_trial: s.has_trial, sends_tips: s.sends_tips });
    } else {
      setEditing('new');
      setForm(EMPTY);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      duration_min: Math.max(5, Math.round(Number(form.duration_min) || 0)),
      price_usd: form.price_usd === '' ? null : Number(form.price_usd),
      has_trial: form.has_trial,
      sends_tips: form.sends_tips,
    };
    if (!payload.name) return toast('Poné un nombre');
    const db = supabase().from('services');
    const { error } =
      editing === 'new'
        ? await db.insert({ ...payload, sort: (data.at(-1)?.sort ?? 0) + 1 })
        : await db.update(payload).eq('id', editing!);
    if (error) return toast(`No se pudo guardar: ${error.message}`);
    toast('Servicio guardado');
    setEditing(null);
    reload();
  }

  async function toggle(s: Service) {
    const { error } = await supabase().from('services').update({ active: !s.active }).eq('id', s.id);
    if (error) toast(`No se pudo cambiar: ${error.message}`);
    reload();
  }

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="page-head">
        <div>
          <p className="eyebrow">— Configuración</p>
          <h1>Mis <em>servicios</em></h1>
        </div>
        <div className="row">
          <button
            className="btn btn-ghost"
            onClick={async () => {
              await supabase().auth.signOut();
              router.replace('/login');
            }}
          >
            Salir
          </button>
          <button className="btn btn-primary" onClick={() => startEdit()}>+ Servicio</button>
        </div>
      </div>
      <p className="muted small" style={{ marginTop: -8 }}>
        La duración y el precio se completan solos al cargar un turno, y después los podés ajustar en cada uno.
      </p>

      {editing && (
        <section className="card">
          <h2>{editing === 'new' ? 'Nuevo servicio' : 'Editar servicio'}</h2>
          <form className="form" onSubmit={save}>
            <div className="fields fields-3">
              <div className="field"><label htmlFor="sn">Nombre</label><input id="sn" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="field"><label htmlFor="sd">Duración (min)</label><input id="sd" className="input" type="number" min={5} step={5} value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} /></div>
              <div className="field"><label htmlFor="sp">Precio (USD)</label><input id="sp" className="input" type="number" min={0} step="any" placeholder="A definir" value={form.price_usd} onChange={(e) => setForm({ ...form, price_usd: e.target.value })} /></div>
            </div>
            <label className="check"><input type="checkbox" checked={form.has_trial} onChange={(e) => setForm({ ...form, has_trial: e.target.checked })} /> Lleva prueba previa (te recuerda coordinarla 30 días antes)</label>
            <label className="check"><input type="checkbox" checked={form.sends_tips} onChange={(e) => setForm({ ...form, sends_tips: e.target.checked })} /> Mandar indicaciones previas 7 días antes</label>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
              <button className="btn btn-primary">Guardar</button>
            </div>
          </form>
        </section>
      )}

      {error && <div className="alert alert-err">No se pudieron cargar los servicios: {error}</div>}

      <section className="card">
        {loading ? (
          <p className="empty">Cargando…</p>
        ) : (
          <ul className="list">
            {data.map((s) => (
              <li key={s.id} className="item" style={{ opacity: s.active ? 1 : 0.5 }}>
                <div className="item-main">
                  <div className="item-title">{s.name}</div>
                  <div className="muted small">
                    {durationLabel(s.duration_min)} · {s.price_usd != null ? usd(s.price_usd) : 'precio a definir'}
                    {s.has_trial ? ' · con prueba' : ''}
                    {!s.active ? ' · oculto' : ''}
                  </div>
                </div>
                <div className="row">
                  <button className="btn btn-ghost btn-sm" onClick={() => startEdit(s)}>Editar</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggle(s)}>{s.active ? 'Ocultar' : 'Mostrar'}</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
