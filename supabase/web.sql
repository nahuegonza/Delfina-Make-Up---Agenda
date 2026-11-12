-- =====================================================================
-- Web pública delfinamakeup.com — contenido editable desde la agenda.
-- Se puede correr más de una vez sin romper nada. No toca las tablas de turnos.
-- Lectura pública (solo lo visible); edición solo con la sesión de Delfina.
-- =====================================================================

create extension if not exists pgcrypto;

-- Dueña por defecto: la usuaria de la agenda (para filas que crea el servidor).
create or replace function public.web_default_owner() returns uuid
language sql stable security definer set search_path = public, auth as $$
  select coalesce(auth.uid(), (select id from auth.users order by created_at limit 1));
$$;

-- ---------- Fotos (portfolio, portada, sobre mí, contacto, maletín) ----------
create table if not exists public.web_photos (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default public.web_default_owner() references auth.users(id) on delete cascade,
  section     text not null default 'portfolio'
              check (section in ('portfolio','portada','sobre_mi','contacto','maletin')),
  category    text check (category in ('novias','social','egresadas','editorial')),
  alt         text not null default '',
  base_path   text not null,               -- carpeta en Storage (o /seed/... para las fotos iniciales)
  widths      int[] not null default '{480,960,1600}',
  ext         text not null default 'webp' check (ext in ('webp','jpg')),
  width       int not null default 0,      -- tamaño original (para reservar el espacio y evitar saltos)
  height      int not null default 0,
  blur        text,                        -- miniatura borrosa (data URL) para el efecto de carga
  sort        int not null default 0,
  visible     boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.web_photos add column if not exists ext text not null default 'webp';
create index if not exists web_photos_section_idx on public.web_photos (section, sort);

-- ---------- Servicios de la web ----------
create table if not exists public.web_services (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default public.web_default_owner() references auth.users(id) on delete cascade,
  title          text not null,
  eyebrow        text not null default '',
  description    text not null default '',
  duration_label text not null default '',
  price_prefix   text,                     -- 'desde' o vacío
  price_label    text not null default 'Consultar',
  featured       boolean not null default false,
  sort           int not null default 0,
  visible        boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ---------- Maletín: escenas (fotos) y productos (puntos) ----------
create table if not exists public.web_kit_scenes (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default public.web_default_owner() references auth.users(id) on delete cascade,
  label       text not null,
  hint        text not null default '',
  photo_id    uuid references public.web_photos(id) on delete set null,
  sort        int not null default 0,
  visible     boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.web_kit_items (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default public.web_default_owner() references auth.users(id) on delete cascade,
  scene_id    uuid not null references public.web_kit_scenes(id) on delete cascade,
  x           numeric(5,2) not null check (x between 0 and 100),
  y           numeric(5,2) not null check (y between 0 and 100),
  category    text not null default '',
  brand       text not null default '',
  name        text not null,
  use_text    text not null default '',
  tip         text not null default '',
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists web_kit_items_scene_idx on public.web_kit_items (scene_id, sort);

-- ---------- Reseñas de Google ----------
create table if not exists public.web_reviews (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default public.web_default_owner() references auth.users(id) on delete cascade,
  author      text not null,
  when_label  text not null default '',
  rating      int not null default 5 check (rating between 1 and 5),
  body        text not null,
  sort        int not null default 0,
  visible     boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- Preguntas frecuentes (también las usa el chat) ----------
create table if not exists public.web_faqs (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default public.web_default_owner() references auth.users(id) on delete cascade,
  question    text not null,
  answer      text not null,
  sort        int not null default 0,
  visible     boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- Ajustes (Google, contacto) ----------
create table if not exists public.web_settings (
  key         text primary key,
  owner_id    uuid not null default public.web_default_owner() references auth.users(id) on delete cascade,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ---------- Consultas que llegan desde el formulario de la web ----------
create table if not exists public.web_inquiries (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default public.web_default_owner() references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 120),
  email       text check (email is null or char_length(email) <= 200),
  phone       text check (phone is null or char_length(phone) <= 40),
  event_date  date,
  service     text check (service is null or char_length(service) <= 120),
  zone        text check (zone is null or char_length(zone) <= 40),
  message     text check (message is null or char_length(message) <= 2000),
  status      text not null default 'nueva' check (status in ('nueva','respondida','archivada')),
  email_sent  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists web_inquiries_created_idx on public.web_inquiries (created_at desc);

-- ---------- Seguridad ----------
do $$
declare t text;
begin
  foreach t in array array['web_photos','web_services','web_kit_scenes','web_kit_items','web_reviews','web_faqs','web_settings','web_inquiries'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "owner_all" on public.%I', t);
    execute format(
      'create policy "owner_all" on public.%I for all to authenticated
         using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t);
  end loop;
  -- La web (sin sesión) solo lee lo visible. Las consultas no se pueden leer sin sesión.
  foreach t in array array['web_photos','web_services','web_kit_scenes','web_reviews','web_faqs'] loop
    execute format('drop policy if exists "public_read" on public.%I', t);
    execute format('create policy "public_read" on public.%I for select to anon using (visible)', t);
  end loop;
end $$;

drop policy if exists "public_read" on public.web_kit_items;
create policy "public_read" on public.web_kit_items for select to anon
  using (exists (select 1 from public.web_kit_scenes s where s.id = scene_id and s.visible));
-- La web puede dejar consultas (solo agregar, nunca leer ni cambiar).
drop policy if exists "public_insert" on public.web_inquiries;
create policy "public_insert" on public.web_inquiries for insert to anon
  with check (status = 'nueva');
grant insert on public.web_inquiries to anon;

drop policy if exists "public_read" on public.web_settings;
create policy "public_read" on public.web_settings for select to anon using (true);

grant usage on schema public to anon, authenticated, service_role;
grant select on public.web_photos, public.web_services, public.web_kit_scenes, public.web_kit_items,
  public.web_reviews, public.web_faqs, public.web_settings to anon;
grant select, insert, update, delete on public.web_photos, public.web_services, public.web_kit_scenes,
  public.web_kit_items, public.web_reviews, public.web_faqs, public.web_settings, public.web_inquiries to authenticated;
grant all on public.web_photos, public.web_services, public.web_kit_scenes, public.web_kit_items,
  public.web_reviews, public.web_faqs, public.web_settings, public.web_inquiries to service_role;
grant execute on function public.web_default_owner() to anon, authenticated, service_role;

-- ---------- Fotos en Storage (carpeta pública "web") ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('web', 'web', true, 5242880, array['image/webp','image/jpeg','image/png','image/avif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "web_owner_insert" on storage.objects;
drop policy if exists "web_owner_update" on storage.objects;
drop policy if exists "web_owner_delete" on storage.objects;
create policy "web_owner_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'web');
create policy "web_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'web' and owner = auth.uid());
create policy "web_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'web' and owner = auth.uid());
