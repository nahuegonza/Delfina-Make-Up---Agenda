'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Photo } from '@/lib/content';
import { IClose } from './Icons';

const LABEL: Record<string, string> = { novias: 'Novias', social: 'Social', egresadas: 'Egresadas', editorial: 'Editorial' };

/** Visor a pantalla completa: flechas, deslizar con el dedo, teclado (← → Esc) y precarga de las fotos vecinas. */
export default function Lightbox({ photos, index, onClose }: { photos: Photo[]; index: number; onClose: () => void }) {
  const [i, setI] = useState(index);
  const [dx, setDx] = useState(0);
  const [ready, setReady] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const drag = useRef(0);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const n = photos.length;
  const go = useCallback((d: number) => { setReady(false); setI((v) => (v + d + n) % n); }, [n]);
  const p = photos[i];

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus();
    };
  }, [go, onClose]);

  // Precarga la anterior y la siguiente para que el deslizamiento sea instantáneo.
  useEffect(() => {
    [photos[(i + 1) % n], photos[(i - 1 + n) % n]].forEach((q) => {
      if (!q) return;
      const img = new Image();
      img.sizes = '100vw';
      if (q.srcSet) img.srcset = q.srcSet;
      img.src = q.src;
    });
  }, [i, n, photos]);

  const onTouchStart = (e: React.TouchEvent) => { start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!start.current) return;
    const x = e.touches[0].clientX - start.current.x;
    const y = e.touches[0].clientY - start.current.y;
    if (Math.abs(x) > Math.abs(y)) { drag.current = x; setDx(x); }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!start.current) return;
    const y = e.changedTouches[0].clientY - start.current.y;
    const x = drag.current;
    start.current = null;
    drag.current = 0;
    if (x < -60) go(1);
    else if (x > 60) go(-1);
    else if (y > 110 && Math.abs(x) < 40) onClose(); // deslizar hacia abajo cierra
    setDx(0);
  };

  return createPortal(
    <div className="lb" role="dialog" aria-modal="true" aria-label="Portfolio en pantalla completa" onClick={onClose}>
      <div className="lb-top" onClick={(e) => e.stopPropagation()}>
        <span className="lb-count">{i + 1} / {n}{p.category ? ` · ${LABEL[p.category]}` : ''}</span>
        <button ref={closeBtn} type="button" className="lb-btn" aria-label="Cerrar" onClick={onClose}><IClose /></button>
      </div>
      <div className="lb-stage" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <img
          key={p.id}
          className={`lb-img ${ready ? 'ready' : ''}`}
          src={p.src}
          srcSet={p.srcSet}
          sizes="100vw"
          alt={p.alt}
          width={p.width}
          height={p.height}
          style={{ transform: dx ? `translateX(${dx}px)` : undefined, transition: dx ? 'none' : undefined }}
          onLoad={() => setReady(true)}
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
      </div>
      {n > 1 && (
        <>
          <button type="button" className="lb-btn lb-prev" aria-label="Foto anterior" onClick={(e) => { e.stopPropagation(); go(-1); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button type="button" className="lb-btn lb-next" aria-label="Foto siguiente" onClick={(e) => { e.stopPropagation(); go(1); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}
      <p className="lb-hint" aria-hidden>Deslizá para ver más</p>
    </div>,
    document.body,
  );
}
