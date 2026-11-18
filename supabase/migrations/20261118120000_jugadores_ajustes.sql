-- Minutos, goles y asistencias puestos a mano para un jugador
-- (JSON: { "minutos": 90, "goles": 2, "asistencias": 1 }).
-- Se SUMAN a lo que digan las actas, no las sustituyen: sirven para los
-- partidos que no se llevaron con la app, y si uno de esos se registra más
-- adelante lo nuevo se añade en vez de quedarse congelado.
alter table public.jugadores add column if not exists ajustes text;
comment on column public.jugadores.ajustes is 'Ajustes (fldAjustesJug0rX2)';
