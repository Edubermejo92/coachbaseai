-- Retransmisión en directo del Modo partido.
-- Una fila por enlace: el código que va en /vivo/?c=…, el equipo que lo
-- creó y lo que ve el público (JSON: marcador, minuto, goles…). Solo la
-- lee y la escribe la función del servidor (service role): sin políticas,
-- nadie más llega a ella.
create table if not exists public.retransmisiones (
  codigo text primary key,
  equipo text not null,
  datos text not null default '{}',
  activa boolean not null default true,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);
create index if not exists retransmisiones_equipo_idx on public.retransmisiones (equipo, activa);
alter table public.retransmisiones enable row level security;

-- Móviles que han pedido "Avisarme de los goles" en la página pública. Sin
-- cuenta: solo la suscripción de push del navegador, ligada al enlace.
create table if not exists public.vivo_avisos (
  id bigserial primary key,
  codigo text not null references public.retransmisiones (codigo) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  creado timestamptz not null default now(),
  unique (codigo, endpoint)
);
alter table public.vivo_avisos enable row level security;
