/* Postgres de verdad (PGlite, compilado a WebAssembly) con la migración de
   CoachBase aplicada, para probar el adaptador sin tocar Supabase.
   Imita lo justo del entorno de Supabase: el esquema "extensions" con
   pgcrypto y la tabla storage.buckets que la migración rellena. */
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import fs from "node:fs";

export async function crearPg() {
  const pg = new PGlite({ extensions: { pgcrypto } });
  await pg.exec(`
    create schema extensions;
    create extension pgcrypto schema extensions;
    create role anon; create role authenticated;
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint);
  `);
  const dir = new URL("../supabase/migrations/", import.meta.url).pathname;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
    await pg.exec(fs.readFileSync(dir + f, "utf8"));
  }
  return pg;
}
