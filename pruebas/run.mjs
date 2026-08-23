import { crearFake, T } from "./fakeair.mjs";
import fs from "node:fs";
import { execSync } from "node:child_process";
const FN = process.env.FN || new URL("../netlify/functions/airtable.mts", import.meta.url).pathname;

/* La función es TypeScript: se transpila con esbuild a un módulo que podamos
   importar, y se le dan los globales que espera (Netlify.env). */
const OUT = new URL("fn.mjs", import.meta.url).pathname;
execSync(`npx esbuild ${FN} --format=esm --platform=node --target=node20 --outfile=${OUT}`, { stdio: "pipe" });

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
  ],
  [T.JUGADORES]: Array.from({length:19},(_,i)=>({ id:"recJ"+i, fields:{ Nombre:"Jugador "+(i+1), Dorsal:i+1, Equipo:["recSEN"] } })),
  [T.PARTIDOS]: [{ id:"recP1", fields:{ Fecha:"2026-09-26", Hora:"11:30", Jornada:"1", Local:"Chamartín Senior A", Visitante:"Rival", Lugar:"La Concepción", Equipo:["recSEN"] } }],
  [T.PARTES]: [{ id:"recPA1", fields:{ fldUyP4Qia9GM6lCR:"2026-08-20", fldEyuA5hqm0GjxZX:"Emilio Bermejo", fldbDBmH77g1DpW7g:12, fldy8c534xQZAbyNW:10, fldXvt940m1HPQ3uH:["recSEN"] } }],
  [T.CONVOCATORIAS]: [], [T.ENTRENAMIENTOS]: [], [T.INCIDENCIAS]: [],
  [T.NORMATIVA]: [], [T.PROPUESTAS]: [], [T.FIRMAS]: [], [T.GALERIA]: [], [T.SUSCRIPCIONES]: [],
};

const fake = crearFake(DATOS);
globalThis.Netlify = { env: { get: (k) => (k === "AIRTABLE_TOKEN" ? "fake" : k === "AIRTABLE_BASE" ? "appDVtUWdtfzkV1sA" : k === "CB_SESSION_SECRET" ? "secreto-de-pruebas" : undefined) } };
const realFetch = globalThis.fetch;
globalThis.fetch = (u, i) => {
  const url = String(u);
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

const login = async (email) => {
  const r = await handler(new Request("https://x/api", { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({ action:"login", email, password:"coach1234" }) }));
  const d = await r.json();
  return d.token;
};
const call = async (qs, { method="GET", token="", body } = {}) => {
  const h = {}; if (token) h["x-cb-token"] = token; if (body) h["content-type"]="application/json";
  const r = await handler(new Request("https://x/api"+qs, { method, headers:h, ...(body?{body:JSON.stringify(body)}:{}) }));
  return { status:r.status, body: await r.json().catch(()=>({})) };
};
export { handler, fake, login, call, T };
