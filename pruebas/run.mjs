import { crearFake, T } from "./fakeair.mjs";
import { crearFakeSupabase, SB } from "./fakesupabase.mjs";
/* PRUEBAS_SUPABASE=1: las mismas pruebas, pero con los datos en Postgres
   (netlify/lib/supabase-airtable.mts contesta en lugar de Airtable). */
const SUPA = process.env.PRUEBAS_SUPABASE === "1";
import fs from "node:fs";
import { execSync } from "node:child_process";
const FN = process.env.FN || new URL("../netlify/functions/airtable.mts", import.meta.url).pathname;

/* La función es TypeScript: se transpila con esbuild a un módulo que podamos
   importar, y se le dan los globales que espera (Netlify.env). */
const OUT = new URL("fn.mjs", import.meta.url).pathname;
/* --bundle: la función importa netlify/lib/uso-airtable.mts por ruta
   relativa, que desde pruebas/ no existe. */
execSync(`npx esbuild ${FN} --bundle --format=esm --platform=node --target=node20 --outfile=${OUT}`, { stdio: "pipe" });

const DATOS = {
  [T.CLUBES]: [
    { id:"recCLUBA", fields:{ fldlUNDFkJyehw8x0:"C.D. Chamartín Vergara", fld0BUV86fvUDWOcU:"Comunidad de Madrid" } },
    { id:"recCLUBB", fields:{ fldlUNDFkJyehw8x0:"C.D. Otro Club", fld0BUV86fvUDWOcU:"Comunidad de Madrid" } },
  ],
  [T.EQUIPOS]: [
    { id:"recIB",  fields:{ fldmjUkaMwwLbPO89:"Infantil B", fldgTxdcJpju1jxt2:"Infantil", fldFGQJQHzeNHi50l:["recCLUBA"] } },
    { id:"recSEN", fields:{ fldmjUkaMwwLbPO89:"Senior A",  fldgTxdcJpju1jxt2:"Sénior / Aficionado", fldFGQJQHzeNHi50l:["recCLUBA"] } },
    { id:"recOTRO",fields:{ fldmjUkaMwwLbPO89:"Juvenil A", fldgTxdcJpju1jxt2:"Juvenil", fldFGQJQHzeNHi50l:["recCLUBB"] } },
  ],
  [T.USUARIOS]: [
    { id:"recDIR", fields:{ fldSnD1rqmHptkRlA:"Laura Vega", fldJWlJ17YuZNe4Jx:"dir@a.com", fldIWSWMiwFsxJBiY:"Director deportivo", fldEkbPe6UgCx0Lfy:"Activo", fldV2DDL6v5szs0y3:["recCLUBA"], fldW8QHQvuOZv1zX8:["recIB"] } },
    { id:"recENT", fields:{ fldSnD1rqmHptkRlA:"Emilio Bermejo", fldJWlJ17YuZNe4Jx:"ent@a.com", fldIWSWMiwFsxJBiY:"Entrenador principal", fldEkbPe6UgCx0Lfy:"Activo", fldV2DDL6v5szs0y3:["recCLUBA"], fldW8QHQvuOZv1zX8:["recSEN"] } },
    { id:"recDIRB",fields:{ fldSnD1rqmHptkRlA:"Otro Director", fldJWlJ17YuZNe4Jx:"dir@b.com", fldIWSWMiwFsxJBiY:"Director deportivo", fldEkbPe6UgCx0Lfy:"Activo", fldV2DDL6v5szs0y3:["recCLUBB"], fldW8QHQvuOZv1zX8:["recOTRO"] } },
    { id:"recCLU", fields:{ fldSnD1rqmHptkRlA:"C.D. Chamartín Vergara", fldJWlJ17YuZNe4Jx:"club@a.com", fldIWSWMiwFsxJBiY:"Club", fldEkbPe6UgCx0Lfy:"Activo", fldV2DDL6v5szs0y3:["recCLUBA"], fldW8QHQvuOZv1zX8:["recIB"] } },
    { id:"recMASTER", fields:{ fldSnD1rqmHptkRlA:"EBLDigital", fldJWlJ17YuZNe4Jx:"ebldigital92@gmail.com", fldIWSWMiwFsxJBiY:"Master", fldEkbPe6UgCx0Lfy:"Activo" } },
    { id:"recFALSOMASTER", fields:{ fldSnD1rqmHptkRlA:"No es el Master", fldJWlJ17YuZNe4Jx:"impostor@a.com", fldIWSWMiwFsxJBiY:"Master", fldEkbPe6UgCx0Lfy:"Activo" } },
  ],
  [T.JUGADORES]: Array.from({length:19},(_,i)=>({ id:"recJ"+i, fields:{ Nombre:"Jugador "+(i+1), Dorsal:i+1, Equipo:["recSEN"] } })),
  [T.PARTIDOS]: [{ id:"recP1", fields:{ Fecha:"2026-09-26", Hora:"11:30", Jornada:"1", Local:"Chamartín Senior A", Visitante:"Rival", Lugar:"La Concepción", Equipo:["recSEN"] } }],
  [T.PARTES]: [{ id:"recPA1", fields:{ fldUyP4Qia9GM6lCR:"2026-08-20", fldEyuA5hqm0GjxZX:"Emilio Bermejo", fldbDBmH77g1DpW7g:12, fldy8c534xQZAbyNW:10, fldXvt940m1HPQ3uH:["recSEN"] } }],
  [T.CONVOCATORIAS]: [], [T.ENTRENAMIENTOS]: [], [T.INCIDENCIAS]: [],
  [T.NORMATIVA]: [], [T.PROPUESTAS]: [], [T.FIRMAS]: [], [T.GALERIA]: [], [T.SUSCRIPCIONES]: [], [T.CONFIG]: [],
};

const fake = SUPA ? await crearFakeSupabase(DATOS) : crearFake(DATOS);
const ENV = {
  AIRTABLE_TOKEN: "fake", AIRTABLE_BASE: "appDVtUWdtfzkV1sA", CB_SESSION_SECRET: "secreto-de-pruebas",
  ...(SUPA ? { SUPABASE_URL: SB, SUPABASE_SERVICE_ROLE_KEY: "sb_secret_pruebas" } : {}),
};
globalThis.Netlify = { env: { get: (k) => ENV[k] } };
const realFetch = globalThis.fetch;
globalThis.fetch = (u, i) => {
  const url = String(u);
  if (SUPA && url.startsWith(SB)) return fake.fetchSupabase(u, i);
  if (url.includes("api.airtable.com")) return fake.fetch(u, i);
  /* Las fotos van al endpoint de contenido de Airtable, otro host. */
  if (url.includes("content.airtable.com")) return Promise.resolve(new Response(JSON.stringify({ fields: {} }), { status: 200, headers: { "content-type":"application/json" } }));
  return realFetch(u, i);
};
const { default: handler } = await import(OUT);

/* Firmamos una sesión con el mismo mecanismo que la función, llamando a login.
   Como no sabemos la contraseña, la ponemos nosotros en la base primero. */
const hashDe = async (pw) => {
  const salt = "00".repeat(16);
  const clave = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name:"PBKDF2", salt:Uint8Array.from(salt.match(/../g).map(h=>parseInt(h,16))), iterations:210000, hash:"SHA-256" }, clave, 256);
  return `pbkdf2$210000$${salt}$${[...new Uint8Array(bits)].map(x=>x.toString(16).padStart(2,"0")).join("")}`;
};
const pw = await hashDe("coach1234");
for (const u of fake.db[T.USUARIOS]) u.fields["fldVX372lPNj7Bab8"] = pw;
if (fake.guardar) await fake.guardar();

/* Con Supabase, lo que una prueba haya cambiado a mano en fake.db se lleva a
   Postgres antes de cada llamada, y el espejo se refresca después. */
const login = async (email, password = "coach1234") => {
  if (fake.guardar) await fake.guardar();
  const r = await handler(new Request("https://x/api", { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({ action:"login", email, password }) }));
  const d = await r.json();
  if (fake.refrescar) await fake.refrescar();
  return d.token;
};
const call = async (qs, { method="GET", token="", body } = {}) => {
  const h = {}; if (token) h["x-cb-token"] = token; if (body) h["content-type"]="application/json";
  if (fake.guardar) await fake.guardar();
  const r = await handler(new Request("https://x/api"+qs, { method, headers:h, ...(body?{body:JSON.stringify(body)}:{}) }));
  const out = { status:r.status, body: await r.json().catch(()=>({})) };
  if (fake.refrescar) await fake.refrescar();
  return out;
};
export { handler, fake, login, call, T };
