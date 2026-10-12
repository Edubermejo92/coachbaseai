/* Genera supabase/migrations/…_coachbase.sql a partir de
   netlify/lib/esquema-coachbase.mts, para que la base de datos y el
   adaptador no puedan desincronizarse. Uso:  node supabase/generar-sql.mjs
   También comprueba el esquema: cada enlace tiene que tener su inverso
   apuntando de vuelta a él. */
import { execSync } from "node:child_process";
import fs from "node:fs";

const raiz = new URL("..", import.meta.url).pathname;
const tmp = new URL("./.esquema.mjs", import.meta.url).pathname;
execSync(`npx esbuild ${raiz}netlify/lib/esquema-coachbase.mts --format=esm --platform=node --outfile=${tmp}`, { stdio: "pipe" });
const { TABLAS, tablaPorNombre } = await import(tmp);
fs.rmSync(tmp);

/* ---- comprobaciones ---- */
const errores = [];
for (const t of TABLAS) {
  const cols = new Set();
  for (const c of t.campos) {
    if (cols.has(c.col)) errores.push(`${t.nombre}.${c.col} repetida`);
    cols.add(c.col);
    if (c.tipo !== "enlace") continue;
    const d = tablaPorNombre.get(c.destino);
    if (!d) { errores.push(`${t.nombre}.${c.col}: tabla ${c.destino} no existe`); continue; }
    const inv = d.campos.find((x) => x.col === c.inversaCol);
    if (!inv || inv.tipo !== "enlace") errores.push(`${t.nombre}.${c.col}: inverso ${c.destino}.${c.inversaCol} no es un enlace`);
    else if (inv.destino !== t.nombre || inv.inversaCol !== c.col) errores.push(`${t.nombre}.${c.col}: el inverso no apunta de vuelta`);
  }
}
if (errores.length) { console.error(errores.join("\n")); process.exit(1); }

const SQLTIPO = {
  texto: "text", num: "numeric", bool: "boolean not null default false", fecha: "date",
  fechahora: "timestamptz", multi: "text[] not null default '{}'",
  enlace: "text[] not null default '{}'", adjuntos: "jsonb not null default '[]'",
};
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;

let sql = `-- ═══════════════════════════════════════════════════════════
-- CoachBase AI en Supabase. GENERADO por supabase/generar-sql.mjs a partir
-- de netlify/lib/esquema-coachbase.mts: no editar a mano.
--
-- Una tabla por cada tabla de la base Airtable "COACHBASE AI", con el mismo
-- id de registro (rec…) y una columna por campo. Los enlaces se guardan por
-- los dos lados (text[] de ids) y un trigger mantiene el inverso, igual que
-- hace Airtable.
--
-- Nadie entra con la clave pública: RLS activado y sin políticas. Solo las
-- funciones de Netlify, con la clave secreta (service_role), leen y escriben.
-- ═══════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- Id con la forma de Airtable: "rec" + 14 letras/números. El backend valida
-- los ids con /^rec[A-Za-z0-9]+$/, así que tienen que seguir siendo así.
create or replace function public._nuevo_id() returns text
language sql volatile set search_path = '' as $$
  select 'rec' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
                                    1 + (get_byte(b, i) % 62), 1), '' order by i)
  from (select extensions.gen_random_bytes(14) as b) x, generate_series(0, 13) as i;
$$;

-- Qué columna enlaza con qué tabla y cuál es su inverso.
create table public._enlaces (
  tabla   text not null,
  columna text not null,
  destino text not null,
  inversa text not null,
  primary key (tabla, columna)
);
alter table public._enlaces enable row level security;

-- Mantiene el lado inverso de cada enlace al crear, cambiar o borrar una
-- fila. pg_trigger_depth() > 1 = esta escritura ya la ha hecho el propio
-- trigger desde el otro lado: no se vuelve a propagar.
create or replace function public._sincronizar_enlaces() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  e record;
  viejo text[];
  nuevo text[];
  mi_id text;
begin
  if pg_trigger_depth() > 1 then return null; end if;
  mi_id := coalesce(new.id, old.id);
  for e in select * from public._enlaces where tabla = tg_table_name loop
    viejo := case when tg_op = 'INSERT' then '{}'::text[]
                  else coalesce(array(select jsonb_array_elements_text(to_jsonb(old) -> e.columna)), '{}') end;
    nuevo := case when tg_op = 'DELETE' then '{}'::text[]
                  else coalesce(array(select jsonb_array_elements_text(to_jsonb(new) -> e.columna)), '{}') end;
    if tg_op = 'UPDATE' and viejo = nuevo then continue; end if;
    execute format('update public.%I set %I = array_append(%I, $1) where id = any($2) and not ($1 = any(%I))',
                   e.destino, e.inversa, e.inversa, e.inversa)
      using mi_id, array(select unnest(nuevo) except select unnest(viejo));
    execute format('update public.%I set %I = array_remove(%I, $1) where id = any($2)',
                   e.destino, e.inversa, e.inversa)
      using mi_id, array(select unnest(viejo) except select unnest(nuevo));
  end loop;
  return null;
end;
$$;
revoke execute on function public._sincronizar_enlaces() from anon, authenticated, public;
revoke execute on function public._nuevo_id() from anon, authenticated, public;
`;

for (const t of TABLAS) {
  const cols = t.campos.map((c) => `  ${c.col.padEnd(26)} ${SQLTIPO[c.tipo]}`).join(",\n");
  sql += `
-- ── ${t.nombre} (Airtable ${t.airtable}) ──
create table public.${t.nombre} (
  id                         text primary key default public._nuevo_id(),
  created_at                 timestamptz not null default now(),
  _orden                     bigint generated by default as identity,
${cols}
);
create index ${t.nombre}_orden_idx on public.${t.nombre} (_orden);
alter table public.${t.nombre} enable row level security;
create trigger ${t.nombre}_enlaces after insert or update or delete on public.${t.nombre}
  for each row execute function public._sincronizar_enlaces();
`;
  for (const c of t.campos) {
    sql += `comment on column public.${t.nombre}.${c.col} is ${lit(`${c.nombre} (${c.id})`)};\n`;
  }
}

/* El login busca por email sin mayúsculas ni espacios. */
sql += `\ncreate index usuarios_email_idx on public.usuarios (lower(trim(email)));\n`;
const enlacesRows = [];
for (const t of TABLAS) for (const c of t.campos) {
  if (c.tipo !== "enlace") continue;
  enlacesRows.push(`(${lit(t.nombre)}, ${lit(c.col)}, ${lit(c.destino)}, ${lit(c.inversaCol)})`);
}
sql += `\ninsert into public._enlaces (tabla, columna, destino, inversa) values\n  ${enlacesRows.join(",\n  ")};\n`;

sql += `
-- Adjuntos (escudos, fotos, documentos): bucket PRIVADO. Muchos son fotos de
-- menores; se sirven con enlaces firmados que caducan, como en Airtable.
insert into storage.buckets (id, name, public, file_size_limit)
values ('coachbase', 'coachbase', false, 20971520)
on conflict (id) do nothing;
`;

const destino = new URL("./migrations/20261012120000_coachbase.sql", import.meta.url).pathname;
fs.mkdirSync(new URL("./migrations/", import.meta.url).pathname, { recursive: true });
fs.writeFileSync(destino, sql);
console.log(`OK: ${TABLAS.length} tablas, ${enlacesRows.length} enlaces → ${destino}`);
