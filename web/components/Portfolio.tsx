'use client';
import { useState } from 'react';
import type { Photo as P } from '@/lib/content';
import Photo from './Photo';

const LABEL: Record<string, string> = { novias: 'Novias', social: 'Social', egresadas: 'Egresadas', editorial: 'Editorial' };

export default function Portfolio({ photos }: { photos: P[] }) {
  const cats = Array.from(new Set(photos.map((p) => p.category).filter(Boolean))) as string[];
  const filters = ['todas', ...['novias', 'social', 'egresadas', 'editorial'].filter((c) => cats.includes(c))];
  const [f, setF] = useState('todas');
  const [all, setAll] = useState(false);
  const shown = f === 'todas' ? photos : photos.filter((p) => p.category === f);

  return (
    <>
      <div className="head-row">
        <div className="reveal">
          <p className="eyebrow">— Mis trabajos</p>
          <h2>Portfolio <em>en movimiento.</em></h2>
        </div>
        {filters.length > 2 && (
          <div className="chips glass reveal" role="group" aria-label="Filtrar portfolio" style={{ ['--d' as string]: '0.1s' }}>
            {filters.map((c) => (
              <button key={c} type="button" className={`chip ${f === c ? 'on' : ''}`} aria-pressed={f === c} onClick={() => setF(c)}>
                {c === 'todas' ? 'Todas' : LABEL[c]}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={`pf ${all ? '' : 'short'}`} key={f}>
        {shown.map((p, i) => (
          <figure key={p.id} style={{ animationDelay: `${Math.min(i, 8) * 0.05}s` }}>
            <Photo photo={p} sizes="(max-width: 720px) 50vw, 25vw" style={{ aspectRatio: `${p.width} / ${p.height}` }} />
            {p.category && <figcaption className="glass-dark">{LABEL[p.category]}</figcaption>}
          </figure>
        ))}
      </div>
      {!all && shown.length > 6 && (
        <button type="button" className="btn btn-line pf-more" onClick={() => setAll(true)}>Ver los {shown.length} trabajos</button>
      )}
    </>
  );
}
