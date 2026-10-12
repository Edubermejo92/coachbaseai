-- ═══════════════════════════════════════════════════════════
-- Avisos con la app cerrada (Web Push). Escrito a mano: no viene de
-- Airtable, así que no pasa por esquema-coachbase.mts.
--
-- push_suscripciones: un móvil/navegador que ha aceptado avisos, de qué
--   usuario es y sus claves de cifrado. El endpoint lo da el navegador.
-- push_programados: avisos con hora fija pedidos por un móvil concreto
--   (el final de la parte en Modo partido). Los envía una función de
--   Netlify que pasa cada minuto.
-- push_enviados: lo ya mandado, para no repetir un aviso aunque la función
--   pase varias veces por la misma ventana.
-- Igual que el resto: RLS sin políticas, solo la clave secreta entra.
-- ═══════════════════════════════════════════════════════════

create table public.push_suscripciones (
  id          bigint generated always as identity primary key,
  usuario     text not null references public.usuarios(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now()
);
create index push_suscripciones_usuario_idx on public.push_suscripciones (usuario);
alter table public.push_suscripciones enable row level security;

create table public.push_programados (
  id        bigint generated always as identity primary key,
  usuario   text not null references public.usuarios(id) on delete cascade,
  endpoint  text not null references public.push_suscripciones(endpoint) on delete cascade,
  enviar_en timestamptz not null,
  titulo    text not null,
  cuerpo    text not null default '',
  tag       text not null default 'cb',
  clave     text not null,
  creado    timestamptz not null default now()
);
create index push_programados_enviar_idx on public.push_programados (enviar_en);
alter table public.push_programados enable row level security;

create table public.push_enviados (
  clave       text primary key,
  enviado_en  timestamptz not null default now()
);
create index push_enviados_fecha_idx on public.push_enviados (enviado_en);
alter table public.push_enviados enable row level security;

-- Las claves VAPID viven cifradas en Vault, no en el código ni en Netlify.
-- Solo la clave secreta (service_role) puede leerlas por RPC.
create or replace function public._secreto(nombre text) returns text
language sql stable security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = nombre limit 1;
$$;
revoke execute on function public._secreto(text) from anon, authenticated, public;
grant execute on function public._secreto(text) to service_role;
