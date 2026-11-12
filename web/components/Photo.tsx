'use client';
import { useEffect, useRef, useState } from 'react';
import type { Photo as P } from '@/lib/content';

interface Props {
  photo: P;
  sizes: string;
  className?: string;
  priority?: boolean;
  alt?: string;
  style?: React.CSSProperties;
}

/** Foto con miniatura borrosa mientras carga, aparición suave y el tamaño justo para cada pantalla. */
export default function Photo({ photo, sizes, className = '', priority, alt, style }: Props) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Si la foto ya estaba en caché antes de que React tomara el control.
    if (ref.current?.complete && ref.current.naturalWidth) setLoaded(true);
  }, [photo.src]);

  return (
    <div
      className={`ph ${photo.blur ? '' : 'ph-shimmer'} ${loaded ? 'loaded' : ''} ${className}`}
      style={{ backgroundImage: photo.blur ? `url("${photo.blur}")` : undefined, ...style }}
    >
      <img
        ref={ref}
        src={photo.src}
        srcSet={photo.srcSet}
        sizes={sizes}
        width={photo.width}
        height={photo.height}
        alt={alt ?? photo.alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
