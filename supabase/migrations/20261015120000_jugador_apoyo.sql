-- Jugador de apoyo: de otro equipo, viene a ayudar. Se convoca, pero no
-- cuenta como desconvocado, ni en la asistencia ni en las estadísticas.
alter table public.jugadores add column if not exists apoyo boolean not null default false;
comment on column public.jugadores.apoyo is 'Apoyo (fldApoyoJug0rX9q1)';
