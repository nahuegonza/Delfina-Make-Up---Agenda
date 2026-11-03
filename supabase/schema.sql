-- =====================================================================
-- Agenda Delfina Acuña Makeup — esquema de base de datos (Supabase)
-- Pegá todo este archivo en Supabase → SQL Editor → New query → Run.
-- Se puede correr más de una vez sin romper nada.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Servicios ----------
create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name         text not null,
  duration_min int  not null check (duration_min > 0),
  price_usd    numeric(10,2),
  has_trial    boolean not null default false,   -- novias / quinceañeras: recordar coordinar la prueba
  sends_tips   boolean not null default true,    -- mandar indicaciones previas 7 días antes
  active       boolean not null default true,
  sort         int not null default 0,
  created_at   timestamptz not null default now()
);

-- ---------- Clientas ----------
create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null,
  phone       text,
  email       text,
  notes       text,
  created_at  timestamptz not null default now()
);

-- ---------- Reservas / turnos ----------
create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id       uuid not null references public.clients(id) on delete restrict,
  service_id      uuid references public.services(id) on delete set null,
  service_name    text not null,                 -- copia del nombre por si el servicio cambia
  event_type      text,
  extra_people    int  not null default 0 check (extra_people >= 0),
  date            date not null,
  start_time      time not null,
  ready_time      time,                          -- hora en que la clienta tiene que estar lista
  duration_min    int  not null check (duration_min > 0),
  travel_min      int  not null default 40 check (travel_min >= 0),
  address         text,
  zone            text check (zone in ('CABA','GBA Norte','GBA Oeste','GBA Sur')),
  price_usd       numeric(10,2),
  deposit_usd     numeric(10,2),
  travel_cost_ars numeric(12,2),                 -- viáticos (Uber al destino)
  status          text not null default 'consulta'
                  check (status in ('consulta','senada','confirmada','realizada','cobrada','cancelada')),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists bookings_owner_date_idx on public.bookings (owner_id, date);
create index if not exists bookings_client_idx on public.bookings (client_id);

-- ---------- Registro de mensajes enviados ----------
create table if not exists public.message_log (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  kind        text not null check (kind in ('confirmacion','prueba','indicaciones','recordatorio','agradecimiento')),
  channel     text not null check (channel in ('whatsapp','email','interno')),
  created_at  timestamptz not null default now(),
  unique (booking_id, kind, channel)
);

-- ---------- updated_at automático ----------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists bookings_touch on public.bookings;
create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();

-- ---------- Seguridad: cada usuaria ve solo lo suyo ----------
alter table public.services    enable row level security;
alter table public.clients     enable row level security;
alter table public.bookings    enable row level security;
alter table public.message_log enable row level security;

do $$
declare t text;
begin
  foreach t in array array['services','clients','bookings','message_log'] loop
    execute format('drop policy if exists "owner_all" on public.%I', t);
    execute format(
      'create policy "owner_all" on public.%I for all to authenticated
         using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t);
  end loop;
end $$;

-- ---------- Permisos para la app ----------
-- Desde mayo de 2026 Supabase no da acceso automático a las tablas nuevas:
-- sin esto la app no puede leer ni guardar servicios, clientas ni turnos.
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.services, public.clients, public.bookings, public.message_log to authenticated;
grant all on public.services, public.clients, public.bookings, public.message_log to service_role;
