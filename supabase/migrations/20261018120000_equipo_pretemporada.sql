-- Plan de pretemporada de cada equipo (JSON: semanas, sesiones y bloques).
alter table public.equipos add column if not exists pretemporada text;
comment on column public.equipos.pretemporada is 'Pretemporada (fldPretemp0radaQ7)';
