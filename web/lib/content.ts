import 'server-only';
import { createClient } from '@supabase/supabase-js';
import seed from '@/content/seed.json';

export type Category = 'novias' | 'social' | 'egresadas' | 'editorial';
export type Section = 'portfolio' | 'portada' | 'sobre_mi' | 'contacto' | 'maletin';

export interface PhotoRow {
  id: string;
  section: Section;
  category: Category | null;
  alt: string;
  base_path: string;
  widths: number[];
  ext?: string;
  width: number;
  height: number;
  blur: string | null;
  sort: number;
}

/** Foto lista para mostrar: URLs por tamaño ya armadas. */
export interface Photo {
  id: string;
  alt: string;
  category: Category | null;
  src: string;
  srcSet: string;
  width: number;
  height: number;
  blur: string | null;
}

export interface ServiceRow {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  duration_label: string;
  price_prefix: string | null;
  price_label: string;
  featured: boolean;
}

export interface KitItem {
  id: string;
  x: number;
  y: number;
  category: string;
  brand: string;
  name: string;
  use_text: string;
  tip: string;
}

export interface KitScene {
  id: string;
  label: string;
  hint: string;
  photo: Photo | null;
  items: KitItem[];
}

export interface Review {
  id: string;
  author: string;
  when_label: string;
  rating: number;
  body: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export interface Settings {
  google: { rating: number | null; count: number | null; url: string; review_url: string };
  contact: { whatsapp: string; whatsapp_label: string; email: string; instagram: string; tiktok: string };
}

export interface SiteContent {
  hero: Photo | null;
  about: Photo | null;
  contactBg: Photo | null;
  portfolio: Photo[];
  services: ServiceRow[];
  kit: KitScene[];
  reviews: Review[];
  faqs: Faq[];
  settings: Settings;
}

const SB_URL = process.env.SUPABASE_URL?.trim().replace(/\/$/, '');
const SB_KEY = process.env.SUPABASE_ANON_KEY?.trim();

function photoUrl(base: string, w: number, ext = 'webp') {
  if (base.startsWith('/')) return `${base}/${w}.${ext}`;
  return `${SB_URL}/storage/v1/object/public/web/${base}/${w}.${ext}`;
}

export function toPhoto(r: PhotoRow): Photo {
  const widths = [...(r.widths?.length ? r.widths : [960])].sort((a, b) => a - b);
  const mid = widths.find((w) => w >= 960) ?? widths[widths.length - 1];
  return {
    id: r.id,
    alt: r.alt,
    category: r.category,
    src: photoUrl(r.base_path, mid, r.ext),
    srcSet: widths.map((w) => `${photoUrl(r.base_path, w, r.ext)} ${Math.min(w, r.width || w)}w`).join(', '),
    width: r.width || 1000,
    height: r.height || 1250,
    blur: r.blur,
  };
}

interface Raw {
  photos: PhotoRow[];
  services: ServiceRow[];
  scenes: { id: string; label: string; hint: string; photo_id: string | null; sort: number }[];
  items: (KitItem & { scene_id: string; sort: number })[];
  reviews: Review[];
  faqs: Faq[];
  settings: Partial<Settings>;
}

const DEFAULT_SETTINGS = seed.settings as Settings;

async function fromSupabase(): Promise<Raw | null> {
  if (!SB_URL || !SB_KEY) return null;
  const db = createClient(SB_URL, SB_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 60 } } as RequestInit) },
  });
  const [photos, services, scenes, items, reviews, faqs, settings] = await Promise.all([
    db.from('web_photos').select('*').eq('visible', true).order('sort'),
    db.from('web_services').select('*').eq('visible', true).order('sort'),
    db.from('web_kit_scenes').select('*').eq('visible', true).order('sort'),
    db.from('web_kit_items').select('*').order('sort'),
    db.from('web_reviews').select('*').eq('visible', true).order('sort'),
    db.from('web_faqs').select('*').eq('visible', true).order('sort'),
    db.from('web_settings').select('key, value'),
  ]);
  const err = [photos, services, scenes, items, reviews, faqs, settings].find((r) => r.error);
  if (err?.error) {
    console.error('Supabase:', err.error.message);
    return null;
  }
  // Base vacía (todavía sin cargar): usamos el contenido inicial.
  if (!photos.data?.length && !services.data?.length) return null;
  const s: Partial<Settings> = {};
  for (const row of settings.data ?? []) (s as Record<string, unknown>)[row.key] = row.value;
  return {
    photos: (photos.data ?? []) as PhotoRow[],
    services: (services.data ?? []) as ServiceRow[],
    scenes: scenes.data ?? [],
    items: (items.data ?? []).map((i) => ({ ...i, x: Number(i.x), y: Number(i.y) })),
    reviews: (reviews.data ?? []) as Review[],
    faqs: (faqs.data ?? []) as Faq[],
    settings: s,
  };
}

export async function getContent(): Promise<SiteContent> {
  let raw: Raw | null = null;
  try {
    raw = await fromSupabase();
  } catch (e) {
    console.error('No se pudo leer Supabase', e);
  }
  if (!raw) raw = seed as unknown as Raw;

  const photos = raw.photos.slice().sort((a, b) => a.sort - b.sort);
  const bySection = (s: Section) => photos.filter((p) => p.section === s);
  const byId = new Map(photos.map((p) => [p.id, p]));
  const first = (s: Section) => {
    const p = bySection(s)[0];
    return p ? toPhoto(p) : null;
  };

  const kit: KitScene[] = raw.scenes
    .slice()
    .sort((a, b) => a.sort - b.sort)
    .map((sc) => {
      const ph = sc.photo_id ? byId.get(sc.photo_id) : undefined;
      return {
        id: sc.id,
        label: sc.label,
        hint: sc.hint,
        photo: ph ? toPhoto(ph) : null,
        items: raw!.items
          .filter((i) => i.scene_id === sc.id)
          .sort((a, b) => a.sort - b.sort)
          .map(({ id, x, y, category, brand, name, use_text, tip }) => ({ id, x, y, category, brand, name, use_text, tip })),
      };
    })
    .filter((sc) => sc.photo && sc.items.length);

  return {
    hero: first('portada'),
    about: first('sobre_mi'),
    contactBg: first('contacto'),
    portfolio: bySection('portfolio').map(toPhoto),
    services: raw.services,
    kit,
    reviews: raw.reviews,
    faqs: raw.faqs,
    settings: {
      google: { ...DEFAULT_SETTINGS.google, ...(raw.settings.google ?? {}) },
      contact: { ...DEFAULT_SETTINGS.contact, ...(raw.settings.contact ?? {}) },
    },
  };
}
