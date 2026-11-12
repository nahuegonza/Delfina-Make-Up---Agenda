'use client';
import { useRef, useState } from 'react';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase/client';
import { CATEGORIES, SECTIONS, deletePhoto, photoUrl, swapSort, uploadPhoto, useTable, type WebCategory, type WebPhoto, type WebSection } from '@/lib/web';

export default function PhotosPage() {
  const toast = useToast();
  const [section, setSection] = useState<WebSection>('portfolio');
  const [category, setCategory] = useState<WebCategory>('social');
  const [busy, setBusy] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const { data, loading, error, reload } = useTable<WebPhoto>('web_photos');
  const list = data.filter((p) => p.section === section);
  const info = SECTIONS.find((s) => s.value === section)!;

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
    let sort = (list.at(-1)?.sort ?? 0) + 1;
    let last = '';
    for (let i = 0; i < arr.length; i++) {
      setBusy(`Optimizando y subiendo ${i + 1} de ${arr.length}…`);
      try {
        const { saved } = await uploadPhoto(arr[i], { section, category, sort: info.single ? 0 : sort++ });
        last = saved;
        // Portada, Sobre mí y Contacto usan una sola foto: la nueva reemplaza a la anterior.
        if (info.single) for (const old of list) await deletePhoto(old);
      } catch (e) {
        toast(`No se pudo subir ${arr[i].name}: ${e instanceof Error ? e.message : e}`);
      }
    }
    setBusy(null);
    if (input.current) input.current.value = '';
    if (last) toast(`Listo. ${last}`);
    reload();
  }

  async function update(p: WebPhoto, patch: Partial<WebPhoto>) {
    const { error } = await supabase().from('web_photos').update(patch).eq('id', p.id);
    if (error) toast(`No se pudo guardar: ${error.message}`);
    reload();
  }

  async function remove(p: WebPhoto) {
    if (!confirm('¿Borrar esta foto de la web?')) return;
    const { error } = await deletePhoto(p);
    if (error) return toast(`No se pudo borrar: ${error.message}`);
    toast('Foto borrada');
    reload();
  }

  async function move(i: number, dir: -1 | 1) {
    const a = list[i];
    const b = list[i + dir];
    if (!a || !b) return;
    await swapSort('web_photos', a, b);
    reload();
  }

  return (
    <div className="grid" style={{ gap: 18 }}>
      <section className="card">
        <div className="seg" role="tablist" aria-label="Sección de la web">
          {SECTIONS.map((s) => (
            <button key={s.value} role="tab" aria-selected={section === s.value} className={section === s.value ? 'on' : ''} onClick={() => setSection(s.value)}>
              {s.label}
            </button>
          ))}
        </div>
        <p className="muted small" style={{ margin: '12px 0 0' }}>{info.hint}{info.single ? '. Al subir una nueva, reemplaza a la actual.' : '.'}</p>

        <div className="upload" style={{ marginTop: 16 }}>
          {section === 'portfolio' && (
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="cat">Categoría de las fotos nuevas</label>
              <select id="cat" className="select" value={category} onChange={(e) => setCategory(e.target.value as WebCategory)}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          )}
          <label className={`dropzone ${busy ? 'busy' : ''}`}>
            <input ref={input} type="file" accept="image/*" multiple={!info.single} onChange={(e) => onFiles(e.target.files)} disabled={!!busy} />
            {busy ? (
              <><span className="spin" aria-hidden="true" /> {busy}</>
            ) : (
              <><b>+ Subir {info.single ? 'foto' : 'fotos'}</b><span className="muted small">Desde el celular o la compu. Se achican y se convierten a WebP solas, en 3 tamaños.</span></>
            )}
          </label>
        </div>
      </section>

      {error && <div className="alert alert-err">No se pudieron cargar las fotos: {error}</div>}

      <section className="card">
        {loading ? (
          <p className="empty">Cargando…</p>
        ) : list.length === 0 ? (
          <p className="empty">Todavía no hay fotos en esta sección.</p>
        ) : (
          <ul className="photo-grid">
            {list.map((p, i) => (
              <li key={p.id} className={p.visible ? '' : 'hidden-photo'}>
                <img src={photoUrl(p, 480)} alt={p.alt} loading="lazy" style={{ aspectRatio: `${p.width} / ${p.height}` }} />
                <div className="photo-tools">
                  {section === 'portfolio' && (
                    <select className="select" aria-label="Categoría" value={p.category ?? 'social'} onChange={(e) => update(p, { category: e.target.value as WebCategory })}>
                      {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  )}
                  <input className="input" placeholder="Descripción (para Google y accesibilidad)" defaultValue={p.alt} onBlur={(e) => e.target.value !== p.alt && update(p, { alt: e.target.value })} />
                  <div className="row-wrap">
                    {!info.single && (
                      <>
                        <button className="btn btn-ghost btn-sm btn-icon" aria-label="Mover antes" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                        <button className="btn btn-ghost btn-sm btn-icon" aria-label="Mover después" disabled={i === list.length - 1} onClick={() => move(i, 1)}>↓</button>
                      </>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => update(p, { visible: !p.visible })}>{p.visible ? 'Ocultar' : 'Mostrar'}</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>Borrar</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
