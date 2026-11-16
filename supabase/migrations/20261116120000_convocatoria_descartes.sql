-- Por qué no fue cada uno de los que se quedaron fuera de una convocatoria
-- (JSON: { recJugador: "tecnica" | "lesion" | "sancion" | "viaje" }).
-- Lo usa la pantalla de Convocatoria para avisar, al preparar la siguiente,
-- de quién se quedó fuera del partido anterior y por qué.
alter table public.convocatorias add column if not exists descartes text;
comment on column public.convocatorias.descartes is 'Descartes (fldDescartesCv01)';
