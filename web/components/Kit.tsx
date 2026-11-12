'use client';
import { useState } from 'react';
import type { KitScene } from '@/lib/content';
import Photo from './Photo';

export default function Kit({ scenes }: { scenes: KitScene[] }) {
  const [sceneId, setSceneId] = useState<string | undefined>(scenes[0]?.id);
  const scene = scenes.find((s) => s.id === sceneId) ?? scenes[0];
  const [itemId, setItemId] = useState<string | undefined>(scene?.items[0]?.id);
  if (!scene || !scene.photo) return null;
  const item = scene.items.find((i) => i.id === itemId) ?? scene.items[0];

  function pickScene(id: string) {
    const s = scenes.find((x) => x.id === id);
    setSceneId(id);
    setItemId(s?.items[0]?.id);
  }

  return (
    <div className="kit">
      <div className="kit-stage reveal">
        {scenes.length > 1 && (
          <div className="kit-tabs glass-dark" role="tablist" aria-label="Vistas del maletín">
            {scenes.map((s) => (
              <button key={s.id} type="button" role="tab" aria-selected={s.id === scene.id} className={`chip ${s.id === scene.id ? 'on' : ''}`} onClick={() => pickScene(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        )}
        <div className="kit-img">
          <Photo key={scene.id} photo={scene.photo} className="swap" sizes="(max-width: 900px) 100vw, 60vw" style={{ ['--ar' as string]: `${scene.photo.width} / ${scene.photo.height}` }} />
          {scene.items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              className={`dot ${it.id === item?.id ? 'on' : ''}`}
              style={{ left: `${it.x}%`, top: `${it.y}%` }}
              aria-label={`${i + 1}. ${it.name}${it.brand ? ', ' + it.brand : ''}`}
              aria-pressed={it.id === item?.id}
              onClick={() => setItemId(it.id)}
            >
              <i>{i + 1}</i>
            </button>
          ))}
        </div>
      </div>
      <aside className="kit-panel glass reveal" style={{ ['--d' as string]: '0.12s' }} aria-live="polite">
        {item && (
          <div className="kit-detail" key={item.id}>
            {item.category && <span className="kit-cat">{item.category}</span>}
            <h3>{item.name}</h3>
            {item.brand && <p className="kit-brand">{item.brand}</p>}
            {item.use_text && (
              <div className="kit-block"><h4>Para qué lo uso</h4><p>{item.use_text}</p></div>
            )}
            {item.tip && (
              <div className="kit-block"><h4>Mi tip</h4><p>{item.tip}</p></div>
            )}
          </div>
        )}
        <div className="kit-list">
          {scene.items.map((it, i) => (
            <button key={it.id} type="button" className={it.id === item?.id ? 'on' : ''} onClick={() => setItemId(it.id)}>
              {i + 1} · {it.name}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
