/* Supabase de mentira para las pruebas: Postgres DE VERDAD (PGlite, con la
   migración real aplicada, triggers incluidos) detrás de una imitación de lo
   poco de la API de Supabase que usa netlify/lib/supabase-airtable.mts:
   PostgREST (GET/POST/PATCH/DELETE con eq, in, ilike, order, limit, offset)
   y Storage (subir y firmar).

   Expone la misma cara que fakeair.mjs para que TODAS las pruebas de siempre
   corran también contra el adaptador (npm run test:supabase):
   - db: espejo de la base con la forma de fakeair ({ id, fields } por tabla
     de Airtable), con cada campo bajo su id, su nombre real y el alias que
     le da fakeair. Se refresca tras cada llamada (run.mjs llama a refrescar).
   - guardar(): lo que una prueba cambie a mano en db, a Postgres. */
import { execSync } from "node:child_process";
import fs from "node:fs";
import { crearPg } from "./pg.mjs";
import { NOMBRE } from "./fakeair.mjs";

const tmp = new URL("./esquema.tmp.mjs", import.meta.url).pathname;
execSync(`npx esbuild ${new URL("../netlify/lib/esquema-coachbase.mts", import.meta.url).pathname} --format=esm --platform=node --outfile=${tmp}`, { stdio: "pipe" });
const { TABLAS } = await import(tmp);
fs.rmSync(tmp);

export const SB = "https://sb.test";
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });
const ident = (s) => {
  if (!/^[a-z_][a-z0-9_]*$/.test(s)) throw new Error(`identificador raro: ${s}`);
  return `"${s}"`;
};

/* Nombre de campo -> columna, aceptando también los alias de fakeair. */
function resolver(t, clave) {
  const c = t.porId.get(clave) || t.porNombre.get(clave)
    || t.campos.find((x) => NOMBRE[x.id] === clave);
  if (!c) throw new Error(`campo desconocido ${t.nombre}.${clave}`);
  return c;
}
function valorSemilla(c, v) {
  if (v === undefined || v === null || v === "") return c.tipo === "enlace" || c.tipo === "multi" ? [] : c.tipo === "adjuntos" ? [] : c.tipo === "bool" ? false : null;
  if (c.tipo === "num") return Number(v);
  if (c.tipo === "bool") return !!v;
  if (c.tipo === "enlace" || c.tipo === "multi") return Array.isArray(v) ? v : [v];
  if (c.tipo === "adjuntos") return v.map((a, i) => ({ id: a.id || `attSEMILLA${i}`, url: a.url, filename: a.filename || "x" }));
  return v;
}

export async function crearFakeSupabase(datos) {
  const pg = await crearPg();
  const archivos = new Map();
  const tablaAt = new Map(TABLAS.map((t) => [t.airtable, t]));
  const llamadas = [];

  const filas = async (sql, params = []) => {
    const r = await pg.query(sql, params);
    return r.rows;
  };
  const jsonDe = async (sql, params) => {
    const [r] = await filas(`with x as (${sql}) select coalesce(json_agg(x order by x._orden), '[]'::json)::text as j from x`, params);
    return JSON.parse(r.j);
  };

  /* ---- PostgREST ---- */
  async function rest(url, init) {
    const m = (init.method || "GET").toUpperCase();
    const tabla = url.pathname.split("/")[3];
    if (!TABLAS.some((t) => t.nombre === tabla)) return J({ message: `tabla ${tabla}` }, 404);
    const T = `public.${ident(tabla)}`;
    const conds = [], params = [];
    let limit = null, offset = 0;
    for (const [k, v] of url.searchParams) {
      if (k === "select" || k === "order") continue;
      if (k === "limit") { limit = Number(v); continue; }
      if (k === "offset") { offset = Number(v); continue; }
      const [op, ...resto] = v.split(".");
      const arg = resto.join(".");
      if (op === "eq") { params.push(arg); conds.push(`${T}.${ident(k)} = $${params.length}`); }
      else if (op === "in") { params.push(arg.replace(/^\(|\)$/g, "").split(",").filter(Boolean)); conds.push(`${T}.${ident(k)} = any($${params.length}::text[])`); }
      else if (op === "ilike") { params.push(arg.replace(/\*/g, "%")); conds.push(`${T}.${ident(k)} ilike $${params.length}`); }
      else return J({ message: `operador ${op}` }, 400);
    }
    const where = conds.length ? `where ${conds.join(" and ")}` : "";
    try {
      if (m === "GET") {
        return J(await jsonDe(`select * from ${T} ${where} order by _orden ${limit != null ? `limit ${limit}` : ""} offset ${offset}`, params));
      }
      const cuerpo = init.body ? JSON.parse(init.body) : null;
      if (m === "POST") {
        const out = [];
        for (const fila of Array.isArray(cuerpo) ? cuerpo : [cuerpo]) {
          const cols = Object.keys(fila).map(ident).join(", ");
          const [r] = await jsonDe(
            Object.keys(fila).length
              ? `insert into ${T} (${cols}) select ${cols} from json_populate_record(null::${T}, $1::json) returning *`
              : `insert into ${T} default values returning *`, Object.keys(fila).length ? [JSON.stringify(fila)] : []);
          out.push(r);
        }
        return J(out, 201);
      }
      if (m === "PATCH") {
        const sets = Object.keys(cuerpo).map((k) => `${ident(k)} = r.${ident(k)}`).join(", ");
        const desplazado = where.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + 1}`);
        return J(await jsonDe(`update ${T} set ${sets} from json_populate_record(null::${T}, $1::json) r ${desplazado} returning ${T}.*`, [JSON.stringify(cuerpo), ...params]));
      }
      if (m === "DELETE") return J(await jsonDe(`delete from ${T} ${where} returning *`, params));
    } catch (e) {
      return J({ code: e.code, message: e.message }, 400);
    }
    return J({ message: "?" }, 405);
  }

  /* ---- Storage ---- */
  async function storage(url, init) {
    const p = url.pathname.replace(/^\/storage\/v1\/object\//, "");
    if (p.startsWith("sign/")) {
      const { paths } = JSON.parse(init.body);
      return J(paths.map((path) => ({ path, signedURL: `/object/sign/coachbase/${path.split("/").map(encodeURIComponent).join("/")}?token=t`, error: archivos.has(path) ? null : "not found" })));
    }
    const [bucket, ...resto] = p.split("/");
    const ruta = resto.map(decodeURIComponent).join("/");
    if (bucket !== "coachbase") return J({ message: "bucket" }, 404);
    if (archivos.has(ruta)) return J({ message: "Duplicate" }, 409);
    archivos.set(ruta, { tipo: init.headers?.["content-type"], bytes: init.body });
    return J({ Key: `coachbase/${ruta}` });
  }

  async function fetchSupabase(u, init = {}) {
    const url = new URL(String(u));
    const m = (init.method || "GET").toUpperCase();
    llamadas.push(`${m} ${url.pathname}${url.search}`);
    const clave = init.headers?.apikey;
    if (clave !== "sb_secret_pruebas") return J({ message: "Invalid API key" }, 401);
    if (url.pathname.startsWith("/rest/v1/")) return rest(url, init);
    if (url.pathname.startsWith("/storage/v1/object/")) return storage(url, init);
    return J({ message: "?" }, 404);
  }

  /* ---- espejo con la forma de fakeair ---- */
  const db = {};
  let foto = "";
  function salidaCampo(c, v) {
    if (v === null || v === undefined || v === false || v === "" || (Array.isArray(v) && v.length === 0)) return undefined;
    if (c.tipo === "num") return Number(v);
    if (c.tipo === "fechahora") return new Date(v).toISOString();
    return v;
  }
  async function refrescar() {
    for (const t of TABLAS) {
      const rows = await jsonDe(`select * from public.${ident(t.nombre)} order by _orden`);
      db[t.airtable] = rows.map((r) => {
        const fields = {};
        for (const c of t.campos) {
          const v = salidaCampo(c, r[c.col]);
          if (v === undefined) continue;
          fields[c.id] = v;
          fields[c.nombre] = v;
          if (NOMBRE[c.id]) fields[NOMBRE[c.id]] = v;
        }
        return { id: r.id, fields };
      });
    }
    foto = JSON.stringify(db);
  }
  async function guardar() {
    const antes = JSON.parse(foto);
    for (const t of TABLAS) {
      for (const rec of db[t.airtable] || []) {
        const viejo = (antes[t.airtable] || []).find((x) => x.id === rec.id)?.fields || {};
        /* Un campo está bajo tres claves (id, nombre, alias): basta con que la
           prueba cambie -o borre con delete- cualquiera de ellas. */
        const cambios = {};
        for (const c of t.campos) {
          for (const k of new Set([c.id, c.nombre, NOMBRE[c.id]].filter(Boolean))) {
            if (JSON.stringify(viejo[k]) === JSON.stringify(rec.fields[k])) continue;
            cambios[c.col] = valorSemilla(c, rec.fields[k]);
            break;
          }
        }
        for (const k of Object.keys(rec.fields)) resolver(t, k);
        if (Object.keys(cambios).length) {
          await rest(new URL(`${SB}/rest/v1/${t.nombre}?id=eq.${rec.id}`), { method: "PATCH", body: JSON.stringify(cambios) });
        }
      }
    }
    await refrescar();
  }

  /* ---- semilla: primero las filas, luego los enlaces (el trigger pone el
     lado inverso al escribirlos, igual que al usar la app) ---- */
  const enlaces = [];
  for (const [tid, recs] of Object.entries(datos)) {
    const t = tablaAt.get(tid);
    if (!t) throw new Error(`tabla desconocida ${tid}`);
    for (const r of recs) {
      const fila = { id: r.id };
      const enl = {};
      for (const [k, v] of Object.entries(r.fields || {})) {
        const c = resolver(t, k);
        if (c.tipo === "enlace") enl[c.col] = valorSemilla(c, v);
        else fila[c.col] = valorSemilla(c, v);
      }
      const res = await rest(new URL(`${SB}/rest/v1/${t.nombre}`), { method: "POST", body: JSON.stringify(fila) });
      if (!res.ok) throw new Error(`semilla ${t.nombre}/${r.id}: ${await res.text()}`);
      if (Object.keys(enl).length) enlaces.push([t, r.id, enl]);
    }
  }
  for (const [t, id, enl] of enlaces) {
    const res = await rest(new URL(`${SB}/rest/v1/${t.nombre}?id=eq.${id}`), { method: "PATCH", body: JSON.stringify(enl) });
    if (!res.ok) throw new Error(`enlaces ${t.nombre}/${id}: ${await res.text()}`);
  }
  await refrescar();

  return {
    db, llamadas, pg, archivos, fetchSupabase, refrescar, guardar,
    /* Si algo llegara a Airtable con Supabase activo, es un fallo. */
    fetch: async (u) => { throw new Error(`llamada a Airtable con Supabase activo: ${u}`); },
  };
}
