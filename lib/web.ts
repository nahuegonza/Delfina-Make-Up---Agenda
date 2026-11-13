'use client';
// Admin de la web (delfinamakeup.com): tipos, carga de datos y optimización de fotos.
import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase/client';

export type WebSection = 'portfolio' | 'portada' | 'sobre_mi' | 'contacto' | 'maletin';
export type WebCategory = 'novias' | 'social' | 'egresadas' | 'editorial';

export interface WebPhoto {
  id: string;
  section: WebSection;
  category: WebCategory | null;
  alt: string;
  base_path: string;
  widths: number[];
  ext: string;
  width: number;
  height: number;
  blur: string | null;
  sort: number;
  visible: boolean;
}
export interface WebService {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  duration_label: string;
  price_prefix: string | null;
  price_label: string;
  featured: boolean;
  sort: number;
  visible: boolean;
}
export interface KitScene { id: string; label: string; hint: string; photo_id: string | null; sort: number; visible: boolean }
export interface KitItem { id: string; scene_id: string; x: number; y: number; category: string; brand: string; name: string; use_text: string; tip: string; sort: number }
export interface WebReview { id: string; author: string; when_label: string; rating: number; body: string; sort: number; visible: boolean }
export interface WebFaq { id: string; question: string; answer: string; sort: number; visible: boolean }
export interface Inquiry {
  id: string; name: string; email: string | null; phone: string | null; event_date: string | null;
  service: string | null; zone: string | null; message: string | null; status: 'nueva' | 'respondida' | 'archivada'; email_sent: boolean; created_at: string;
}

export const SECTIONS: { value: WebSection; label: string; hint: string; single?: boolean }[] = [
  { value: 'portada', label: 'Portada', hint: 'La foto grande del inicio', single: true },
  { value: 'portfolio', label: 'Portfolio', hint: 'Tus trabajos, con su categoría' },
  { value: 'sobre_mi', label: 'Sobre mí', hint: 'Tu foto de la sección Sobre mí', single: true },
  { value: 'contacto', label: 'Contacto', hint: 'Fondo del formulario', single: true },
  { value: 'maletin', label: 'Maletín', hint: 'Fotos del maletín para ubicar productos' },
];
export const CATEGORIES: { value: WebCategory; label: string }[] = [
  { value: 'novias', label: 'Novias' },
  { value: 'social', label: 'Social' },
  { value: 'egresadas', label: 'Egresadas' },
  { value: 'editorial', label: 'Editorial' },
];

/** URL de una foto en el tamaño pedido (las iniciales viven en la web, las nuevas en Supabase). */
export function photoUrl(p: Pick<WebPhoto, 'base_path' | 'widths' | 'ext'>, want = 480) {
  const w = [...p.widths].sort((a, b) => a - b).find((x) => x >= want) ?? p.widths[p.widths.length - 1];
  if (p.base_path.startsWith('/')) {
    const site = (process.env.NEXT_PUBLIC_WEB_URL || 'https://delfina-makeup.netlify.app').replace(/\/$/, '');
    return `${site}${p.base_path}/${w}.${p.ext || 'webp'}`;
  }
  return supabase().storage.from('web').getPublicUrl(`${p.base_path}/${w}.${p.ext || 'webp'}`).data.publicUrl;
}

/** Carga una tabla ordenada, con recarga. */
export function useTable<T>(table: string, opts?: { order?: string; ascending?: boolean; filter?: [string, string] }) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const order = opts?.order ?? 'sort';
  const asc = opts?.ascending ?? true;
  const fk = opts?.filter?.[0];
  const fv = opts?.filter?.[1];
  const reload = useCallback(async () => {
    setLoading(true);
    let q = supabase().from(table).select('*').order(order, { ascending: asc });
    if (fk && fv) q = q.eq(fk, fv);
    const { data, error } = await q;
    setError(error ? error.message : null);
    setData((data ?? []) as T[]);
    setLoading(false);
  }, [table, order, asc, fk, fv]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, setData, loading, error, reload };
}

/** Intercambia el orden de dos filas. */
export async function swapSort(table: string, a: { id: string; sort: number }, b: { id: string; sort: number }) {
  const db = supabase();
  const sa = a.sort === b.sort ? a.sort + 1 : b.sort;
  await Promise.all([db.from(table).update({ sort: sa }).eq('id', a.id), db.from(table).update({ sort: a.sort }).eq('id', b.id)]);
}

// ---------------------------------------------------------------------------
// Optimización de fotos: se hace en el celular antes de subir.
// Cada foto queda en 3 tamaños (480, 960 y 1600 px de ancho) en WebP,
// más una miniatura borrosa para el efecto de carga en la web.
// ---------------------------------------------------------------------------

const WIDTHS = [480, 960, 1600];

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      await img.decode();
      return img;
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
}

function canvasBlob(c: HTMLCanvasElement, type: string, q: number) {
  return new Promise<Blob | null>((res) => c.toBlob(res, type, q));
}

export interface Optimized {
  files: { width: number; blob: Blob }[];
  ext: 'webp' | 'jpg';
  width: number;
  height: number;
  blur: string;
  originalKB: number;
  totalKB: number;
}

export async function optimizePhoto(file: File): Promise<Optimized> {
  const src = await loadBitmap(file);
  const W = 'naturalWidth' in src ? src.naturalWidth : src.width;
  const H = 'naturalHeight' in src ? src.naturalHeight : src.height;
  if (!W || !H) throw new Error('No se pudo leer la foto');

  // ¿El navegador sabe hacer WebP? (Safari viejo no: usamos JPG)
  const probe = document.createElement('canvas');
  probe.width = probe.height = 2;
  const webpOk = (await canvasBlob(probe, 'image/webp', 0.8))?.type === 'image/webp';
  const type = webpOk ? 'image/webp' : 'image/jpeg';

  const widths = WIDTHS.filter((w, i) => i === 0 || WIDTHS[i - 1] < W);
  const files: Optimized['files'] = [];
  for (const target of widths) {
    const w = Math.min(target, W);
    const h = Math.round((H * w) / W);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, w, h);
    const blob = await canvasBlob(c, type, target >= 1600 ? 0.72 : 0.78);
    if (!blob) throw new Error('No se pudo comprimir la foto');
    files.push({ width: target, blob });
  }
  const t = document.createElement('canvas');
  t.width = 16;
  t.height = Math.max(1, Math.round((H * 16) / W));
  t.getContext('2d')!.drawImage(src, 0, 0, t.width, t.height);
  const blur = t.toDataURL('image/jpeg', 0.5);
  if ('close' in src) src.close();

  return {
    files,
    ext: webpOk ? 'webp' : 'jpg',
    width: W,
    height: H,
    blur,
    originalKB: Math.round(file.size / 1024),
    totalKB: Math.round(files.reduce((a, f) => a + f.blob.size, 0) / 1024),
  };
}

// Descripción automática si la dejás vacía (sirve para Google y para quienes usan lector de pantalla).
const DEFAULT_ALT: Record<string, string> = {
  novias: 'Maquillaje de novia por Delfina Acuña',
  social: 'Maquillaje social por Delfina Acuña',
  egresadas: 'Maquillaje de egresada por Delfina Acuña',
  editorial: 'Maquillaje editorial por Delfina Acuña',
  portada: 'Delfina Acuña maquillando a una clienta',
  sobre_mi: 'Delfina Acuña, maquilladora profesional',
  contacto: '',
  maletin: 'Productos del maletín de Delfina Acuña',
};
export function defaultAlt(section: WebSection, category?: WebCategory | null) {
  return section === 'portfolio' ? DEFAULT_ALT[category ?? 'social'] : DEFAULT_ALT[section];
}

/** Optimiza, sube a Storage y crea la fila en web_photos. */
export async function uploadPhoto(
  file: File,
  meta: { section: WebSection; category?: WebCategory | null; alt?: string; sort?: number },
): Promise<{ photo: WebPhoto; saved: string }> {
  const opt = await optimizePhoto(file);
  const db = supabase();
  const folder = `photos/${crypto.randomUUID()}`;
  for (const f of opt.files) {
    const { error } = await db.storage.from('web').upload(`${folder}/${f.width}.${opt.ext}`, f.blob, {
      contentType: opt.ext === 'webp' ? 'image/webp' : 'image/jpeg',
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) {
      await db.storage.from('web').remove(opt.files.map((x) => `${folder}/${x.width}.${opt.ext}`));
      throw new Error(error.message);
    }
  }
  const { data, error } = await db
    .from('web_photos')
    .insert({
      section: meta.section,
      category: meta.section === 'portfolio' ? meta.category ?? 'social' : null,
      alt: meta.alt?.trim() || defaultAlt(meta.section, meta.category),
      base_path: folder,
      widths: opt.files.map((f) => f.width),
      ext: opt.ext,
      width: opt.width,
      height: opt.height,
      blur: opt.blur,
      sort: meta.sort ?? 0,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  const pct = opt.originalKB ? Math.max(0, Math.round(100 - (opt.totalKB / 3 / opt.originalKB) * 100)) : 0;
  return { photo: data as WebPhoto, saved: `${opt.originalKB} KB → ${Math.round(opt.totalKB / opt.files.length)} KB por tamaño (${pct}% menos)` };
}

/** Borra la foto de Storage (si es una subida) y su fila. */
export async function deletePhoto(p: WebPhoto) {
  const db = supabase();
  if (!p.base_path.startsWith('/')) {
    await db.storage.from('web').remove(p.widths.map((w) => `${p.base_path}/${w}.${p.ext || 'webp'}`));
  }
  return db.from('web_photos').delete().eq('id', p.id);
}
