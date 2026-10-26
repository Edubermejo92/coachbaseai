-- Alineación preparada para cada partido del calendario (JSON por equipo).
alter table public.equipos add column if not exists alineaciones_partidos text;
comment on column public.equipos.alineaciones_partidos is 'Alineaciones partidos (fldAlinPartidosQ8)';
