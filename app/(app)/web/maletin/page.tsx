'use client';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase/client';
import { photoUrl, swapSort, uploadPhoto, useTable, type KitItem, type KitScene, type WebPhoto } from '@/lib/web';

type ItemForm = Omit<KitItem, 'id' | 'scene_id' | 'sort'>;
const EMPTY_ITEM: ItemForm = { x: 50, y: 50, category: '', brand: '', name: '', use_text: '', tip: '' };
const CATS = ['Preparación', 'Piel', 'Ojos', 'Cejas', 'Mejillas', 'Labios', 'Herramientas'];

export default function KitPage() {
  const toast = useToast();
  const scenes = useTable<KitScene>('web_kit_scenes');
  const photos = useTable<WebPhoto>('web_photos', { filter: ['section', 'maletin'] });
  const [sceneId, setSceneId] = useState<string | null>(null);
  const items = useTable<KitItem>('web_kit_items', { filter: ['scene_id', sceneId ?? 'none'] });
  const [sel, setSel] = useState<string | null>(null); // id del producto, 'new' o null
  const [f, setF] = useState<ItemForm>(EMPTY_ITEM);
  const [placing, setPlacing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sceneForm, setSceneForm] = useState<{ id: string | 'new'; label: string; hint: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!sceneId && scenes.data[0]) setSceneId(scenes.data[0].id);
  }, [scenes.data, sceneId]);

  const scene = scenes.data.find((s) => s.id === sceneId) ?? null;
  const photo = photos.data.find((p) => p.id === scene?.photo_id) ?? null;

  function pick(it?: KitItem) {
    setSel(it ? it.id : 'new');
    setF(it ? { x: Number(it.x), y: Number(it.y), category: it.category, brand: it.brand, name: it.name, use_text: it.use_text, tip: it.tip } : EMPTY_ITEM);
    setPlacing(!it);
  }

  // Tocar la foto ubica el punto del producto que estás cargando o editando.
  function onStageClick(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 1000) / 10;
    const y = Math.round(((e.clientY - r.top) / r.height) * 1000) / 10;
    if (!sel) {
      setSel('new');
      setF({ ...EMPTY_ITEM, x, y });
      setPlacing(false);
      return;
    }
    if (placing || sel === 'new') {
      setF((prev) => ({ ...prev, x, y }));
      setPlacing(false);
    }
  }

  async function saveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!scene) return;
    if (!f.name.trim()) return toast('Poné el nombre del producto');
    const payload = { ...f, name: f.name.trim(), brand: f.brand.trim(), x: Math.min(100, Math.max(0, f.x)), y: Math.min(100, Math.max(0, f.y)) };
    const db = supabase().from('web_kit_items');
    const { error } = sel === 'new'
      ? await db.insert({ ...payload, scene_id: scene.id, sort: (items.data.at(-1)?.sort ?? 0) + 1 })
      : await db.update(payload).eq('id', sel!);
    if (error) return toast(`No se pudo guardar: ${error.message}`);
    toast('Producto guardado');
    setSel(null);
    items.reload();
  }

  async function removeItem() {
    if (!sel || sel === 'new' || !confirm('¿Borrar este producto del maletín?')) return;
    await supabase().from('web_kit_items').delete().eq('id', sel);
    toast('Producto borrado');
    setSel(null);
    items.reload();
  }

  async function saveScene(e: React.FormEvent) {
    e.preventDefault();
    if (!sceneForm?.label.trim()) return toast('Poné un nombre para la vista');
    const db = supabase().from('web_kit_scenes');
    const payload = { label: sceneForm.label.trim(), hint: sceneForm.hint.trim() };
    const res = sceneForm.id === 'new'
      ? await db.insert({ ...payload, sort: (scenes.data.at(-1)?.sort ?? 0) + 1 }).select('id').single()
      : await db.update(payload).eq('id', sceneForm.id).select('id').single();
    if (res.error) return toast(`No se pudo guardar: ${res.error.message}`);
    setSceneForm(null);
    await scenes.reload();
    setSceneId(res.data.id);
  }

  async function removeScene() {
    if (!scene || !confirm(`¿Borrar la vista "${scene.label}" con todos sus productos?`)) return;
    await supabase().from('web_kit_scenes').delete().eq('id', scene.id);
    setSceneId(null);
    scenes.reload();
  }

  async function onPhoto(files: FileList | null) {
    const file = files?.[0];
    if (!file || !scene) return;
    setBusy(true);
    try {
      const { photo: p, saved } = await uploadPhoto(file, { section: 'maletin', alt: scene.label });
      await supabase().from('web_kit_scenes').update({ photo_id: p.id }).eq('id', scene.id);
      toast(`Foto cargada. ${saved}`);
      await Promise.all([photos.reload(), scenes.reload()]);
    } catch (err) {
      toast(`No se pudo subir: ${err instanceof Error ? err.message : err}`);
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  const dots = items.data.map((it) => (sel === it.id ? { ...it, x: f.x, y: f.y } : it));

  return (
    <div className="grid" style={{ gap: 18 }}>
      <section className="card">
        <div className="spread" style={{ flexWrap: 'wrap' }}>
          <div className="seg" role="tablist" aria-label="Vistas del maletín">
            {scenes.data.map((s) => (
              <button key={s.id} role="tab" aria-selected={s.id === sceneId} className={s.id === sceneId ? 'on' : ''} onClick={() => { setSceneId(s.id); setSel(null); }}>
                {s.label}{!s.visible ? ' (oculta)' : ''}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setSceneForm({ id: 'new', label: '', hint: '' })}>+ Vista</button>
        </div>
        {sceneForm && (
          <form className="form" onSubmit={saveScene} style={{ marginTop: 16 }}>
            <div className="fields fields-2">
              <div className="field"><label htmlFor="sl">Nombre de la vista</label><input id="sl" className="input" value={sceneForm.label} onChange={(e) => setSceneForm({ ...sceneForm, label: e.target.value })} placeholder="Labios y color" /></div>
              <div className="field"><label htmlFor="sh">Descripción corta</label><input id="sh" className="input" value={sceneForm.hint} onChange={(e) => setSceneForm({ ...sceneForm, hint: e.target.value })} /></div>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setSceneForm(null)}>Cancelar</button>
              <button className="btn btn-primary">Guardar</button>
            </div>
          </form>
        )}
      </section>

      {scene && (
        <div className="kit-admin">
          <section className="card">
            <div className="spread" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>{scene.label}</h2>
              <div className="row-wrap">
                <button className="btn btn-ghost btn-sm" onClick={() => setSceneForm({ id: scene.id, label: scene.label, hint: scene.hint })}>Renombrar</button>
                <button className="btn btn-ghost btn-sm" onClick={async () => { await supabase().from('web_kit_scenes').update({ visible: !scene.visible }).eq('id', scene.id); scenes.reload(); }}>{scene.visible ? 'Ocultar' : 'Mostrar'}</button>
                <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                  {busy ? 'Subiendo…' : photo ? 'Cambiar foto' : 'Subir foto'}
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files)} disabled={busy} />
                </label>
                <button className="btn btn-danger btn-sm" onClick={removeScene}>Borrar vista</button>
              </div>
            </div>
            {photo ? (
              <>
                <p className="muted small" style={{ marginTop: 0 }}>
                  {placing ? 'Tocá la foto donde está el producto.' : sel ? 'Para mover el punto, tocá “Mover punto” y después la foto.' : 'Tocá la foto para agregar un producto, o un número para editarlo.'}
                </p>
                <div className={`kit-stage-admin ${placing || sel === 'new' || !sel ? 'placing' : ''}`} onClick={onStageClick} style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
                  <img src={photoUrl(photo, 960)} alt={photo.alt} draggable={false} />
                  {dots.map((it, i) => (
                    <button key={it.id} type="button" className={`kit-dot ${sel === it.id ? 'on' : ''}`} style={{ left: `${it.x}%`, top: `${it.y}%` }} onClick={(e) => { e.stopPropagation(); pick(it); }} aria-label={`Editar ${it.name}`}>
                      {i + 1}
                    </button>
                  ))}
                  {sel === 'new' && <span className="kit-dot new" style={{ left: `${f.x}%`, top: `${f.y}%` }}>+</span>}
                </div>
              </>
            ) : (
              <p className="empty">Subí una foto del maletín para empezar a ubicar productos.</p>
            )}
          </section>

          <section className="card">
            {sel ? (
              <form className="form" onSubmit={saveItem}>
                <h2 style={{ margin: 0 }}>{sel === 'new' ? 'Nuevo producto' : 'Editar producto'}</h2>
                <div className="fields fields-2">
                  <div className="field"><label htmlFor="in">Producto</label><input id="in" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Prisme Libre" /></div>
                  <div className="field"><label htmlFor="ib">Marca</label><input id="ib" className="input" value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} placeholder="Givenchy" /></div>
                </div>
                <div className="field"><label htmlFor="ic">Categoría</label>
                  <input id="ic" className="input" list="cats" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
                  <datalist id="cats">{CATS.map((c) => <option key={c} value={c} />)}</datalist>
                </div>
                <div className="field"><label htmlFor="iu">Para qué lo uso</label><textarea id="iu" className="textarea" value={f.use_text} onChange={(e) => setF({ ...f, use_text: e.target.value })} /></div>
                <div className="field"><label htmlFor="it">Mi tip (opcional)</label><textarea id="it" className="textarea" value={f.tip} onChange={(e) => setF({ ...f, tip: e.target.value })} /></div>
                <div className="row-wrap" style={{ justifyContent: 'flex-end' }}>
                  {sel !== 'new' && <button type="button" className="btn btn-danger" onClick={removeItem}>Borrar</button>}
                  {sel !== 'new' && <button type="button" className="btn btn-ghost" onClick={() => setPlacing(true)}>{placing ? 'Tocá la foto…' : 'Mover punto'}</button>}
                  <button type="button" className="btn btn-ghost" onClick={() => { setSel(null); setPlacing(false); }}>Cancelar</button>
                  <button className="btn btn-primary">Guardar</button>
                </div>
              </form>
            ) : (
              <>
                <h2>Productos de esta vista</h2>
                {items.data.length === 0 ? <p className="empty">Todavía no hay productos.</p> : (
                  <ul className="list">
                    {items.data.map((it, i) => (
                      <li key={it.id} className="item">
                        <span className="index-num">{i + 1}</span>
                        <div className="item-main"><div className="item-title">{it.name}</div><div className="muted small">{it.brand} · {it.category}</div></div>
                        <div className="row">
                          <button className="btn btn-ghost btn-sm btn-icon" aria-label="Subir" disabled={i === 0} onClick={async () => { await swapSort('web_kit_items', it, items.data[i - 1]); items.reload(); }}>↑</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => pick(it)}>Editar</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => pick()} disabled={!photo}>+ Producto</button>
              </>
            )}
          </section>
        </div>
      )}
      {scenes.error && <div className="alert alert-err">No se pudo cargar el maletín: {scenes.error}</div>}
    </div>
  );
}
