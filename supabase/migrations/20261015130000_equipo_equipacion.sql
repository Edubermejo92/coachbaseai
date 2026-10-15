-- Equipación de casa y de fuera del equipo (JSON), para el mensaje de la convocatoria.
alter table public.equipos add column if not exists equipacion text;
comment on column public.equipos.equipacion is 'Equipacion (fldEquipac1onKt7q)';
