/* La migración Airtable → Supabase (netlify/functions/migrar.mts) de punta a
   punta: un Airtable de mentira con datos de todos los tipos, la función
   ejecutada paso a paso como lo haría el navegador, y después cada registro
   leído a través del adaptador comparado con el original de Airtable.
   Corre igual en los dos modos (no depende de PRUEBAS_SUPABASE). */
import { execSync } from "node:child_process";
import fs from "node:fs";
import { crearFake, T } from "./fakeair.mjs";
import { crearFakeSupabase, SB } from "./fakesupabase.mjs";

let ok = 0, mal = 0;
const dice = (n, c, e = "") => { (c ? ok++ : mal++); console.log(`${c ? "✓" : "✗"} ${n}${e ? "  → " + e : ""}`); };

const OUT = new URL("migrar.tmp.mjs", import.meta.url).pathname;
execSync(`npx esbuild ${new URL("../netlify/functions/migrar.mts", import.meta.url).pathname} --bundle --format=esm --platform=node --target=node20 --outfile=${OUT}`, { stdio: "pipe" });

/* Datos con los dos lados de cada enlace, como los devuelve Airtable. */
const ADJ = (id, n) => [{ id, url: `https://v5.airtableusercontent.com/${id}`, filename: n, type: "image/png", size: 4 }];
const DATOS = {
  [T.CLUBES]: [
    { id: "recCLUB000000001", fields: { fldlUNDFkJyehw8x0: "Club Uno", fld0BUV86fvUDWOcU: "Madrid", fldHEc6mURQXD7HVH: ["recEQUI000000001", "recEQUI000000002"], fldf41Ef5smzPgD8S: ["recUSUA000000001"], fldX3CMkCrO54gUrV: ADJ("attCLUB1", "escudo.png"), fldiIev3Pd9eWhulJ: 20 } },
  ],
  [T.EQUIPOS]: [
    { id: "recEQUI000000001", fields: { fldmjUkaMwwLbPO89: "Infantil B", fldgTxdcJpju1jxt2: "Infantil", fldSQPSejXh45fRQ8: "Fútbol 11", fldFGQJQHzeNHi50l: ["recCLUB000000001"], fldMYcnPB43koZxlA: ["recJUGA000000002", "recJUGA000000001"], fldtQjwRnN7aQr439: ["recUSUA000000001"], fld0ShmGEK97QIhr8: "{\"lineup\":{\"GK\":\"recJUGA000000001\"},\"nota\":\"comillas \\\" y \\\\ barras\"}", flddC2z6uAHNSaGXX: "[1,3,4]", fldvQewYiQaYpOQEA: ["recPART000000001"] } },
    { id: "recEQUI000000002", fields: { fldmjUkaMwwLbPO89: "Senior", fldFGQJQHzeNHi50l: ["recCLUB000000001"] } },
  ],
  [T.JUGADORES]: [
    { id: "recJUGA000000002", fields: { fldBQDY3uEBh07hs7: "Álvaro Rey", fldj2NH8MAIHVs63U: 9, fldvqyIvhp66rynKc: "Lesionado", fldD7Dy6zT5uO6ivF: ["recEQUI000000001"], fldJopgp8dXWJEui7: true, fld0ga9ubLFQmfvlK: "2026-09-01", fldVAopJcEmx4J1zw: ADJ("attFOTO1", "cara.png") } },
    { id: "recJUGA000000001", fields: { fldBQDY3uEBh07hs7: "Joaquín ", fldj2NH8MAIHVs63U: 1, fldD7Dy6zT5uO6ivF: ["recEQUI000000001"], fldWmH6KHQGXmW2g5: ["recINCI000000001"] } },
  ],
  [T.USUARIOS]: [
    { id: "recUSUA000000001", fields: { fldSnD1rqmHptkRlA: "Dani", fldJWlJ17YuZNe4Jx: "dani@x.com", fldIWSWMiwFsxJBiY: "Director deportivo", fldEkbPe6UgCx0Lfy: "Activo", fldV2DDL6v5szs0y3: ["recCLUB000000001"], fldW8QHQvuOZv1zX8: ["recEQUI000000001"], fldVX372lPNj7Bab8: "pbkdf2$210000$00$ab", fldJRASqTraLecDMa: ["Segundo entrenador", "Delegado"], fldevbPLxMunBH9NR: "2026-12-31", fld4okYQmHxbEQ6C8: true, fldlwh06UwTeuU27k: ["recINCI000000001"] } },
  ],
  [T.INCIDENCIAS]: [
    { id: "recINCI000000001", fields: { fldv5Gtrpw2e6xopC: "2026-08-22 · #1", fldxhO3y8YcOA5XBI: "2026-08-22", fldMJW0knN3LXLVmk: ["Advertencia verbal", "Pérdida de minutos"], fldtnmGoPm5rji3Iv: 12.5, fld4CxW7BS48diYpQ: ["recJUGA000000001"], fld5X1iVtcR1uqPp8: ["recUSUA000000001"], fldCy8PlOikqwymWt: true } },
  ],
  [T.PARTIDOS]: [
    { id: "recPART000000001", fields: { fld2cYL3g3LaA8i2J: "2026-09-26 A - B", fldNokXcwb2qIyacc: "2026-09-26", fldau3FDAZZoerwR9: "11:30", fld8zIw50aAfD7k5G: ["recEQUI000000001"], fldG20ihRTGxgYXoX: 0, fld2IrVxm2Pwj8OWq: 3 } },
  ],
  [T.SUSCRIPCIONES]: [
    { id: "recSUSC000000001", fields: { fldVivShmbaSNuCcC: "dani@x.com", fldKsbWLFhmwWGjjX: "Activa", fldkIp45fn7xXWI60: 9.99, fldSJpmXi4bmtriIs: "2026-11-12T10:00:00.000Z", fldJVihH0K2INwMta: true } },
  ],
  [T.CONFIG]: [{ id: "recCONF000000001", fields: { fldK6DM4hrZsjS1DP: "global", fldrJOfAInJThfOZv: "[\"inicio\",\"premium\"]" } }],
  [T.PARTES]: [], [T.NORMATIVA]: [], [T.FIRMAS]: [], [T.GALERIA]: [], [T.CONVOCATORIAS]: [],
  [T.ENTRENAMIENTOS]: [], [T.PROPUESTAS]: [], [T.ACTAS]: [],
};
const air = crearFake(DATOS);
const sb = await crearFakeSupabase({});

const ENV = { AIRTABLE_TOKEN: "pat", SUPABASE_URL: SB, SUPABASE_SERVICE_ROLE_KEY: "sb_secret_pruebas", MIGRAR_CLAVE: "clave-larga-de-prueba" };
globalThis.Netlify = { env: { get: (k) => ENV[k] } };
const descargas = [];
globalThis.fetch = async (u, i) => {
  const url = String(u);
  if (url.startsWith(SB)) return sb.fetchSupabase(u, i);
  if (url.startsWith("https://api.airtable.com/")) return air.fetch(u, i);
  if (url.startsWith("https://v5.airtableusercontent.com/")) { descargas.push(url); return new Response(new Uint8Array([1, 2, 3, 4])); }
  throw new Error(`red no esperada: ${url}`);
};
const { default: migrar } = await import(OUT);
fs.rmSync(OUT);

/* ---- seguridad ---- */
let r = await migrar(new Request("https://app.test/.netlify/functions/migrar?clave=mala"));
dice("con la clave mala no hace nada", r.status === 403);
ENV.MIGRAR_CLAVE = "";
r = await migrar(new Request("https://app.test/.netlify/functions/migrar?clave="));
dice("sin MIGRAR_CLAVE en Netlify, la función no existe", r.status === 404);
ENV.MIGRAR_CLAVE = "clave-larga-de-prueba";

/* ---- recorrer los pasos como el navegador ---- */
let siguiente = "https://app.test/.netlify/functions/migrar?clave=clave-larga-de-prueba";
const titulos = [];
for (let i = 0; i < 60 && siguiente; i++) {
  const html = await (await migrar(new Request(siguiente))).text();
  titulos.push((html.match(/<h1[^>]*>([^<]*)/) || [])[1]);
  siguiente = ((html.match(/http-equiv="refresh" content="1;url=([^"]+)"/) || [])[1] || "").replace(/&amp;/g, "&");
  if (/Error/.test(titulos.at(-1))) { console.log(html); break; }
}
dice("la migración llega al final", /Copia terminada ✓/.test(titulos.at(-1) || ""), titulos.at(-1));
dice("ha subido los 2 adjuntos", descargas.length === 2 && sb.archivos.size === 2, `${descargas.length} descargas, ${sb.archivos.size} archivos`);

/* ---- comparar registro a registro, leyendo con el adaptador ---- */
const AD = new URL("adaptador.tmp.mjs", import.meta.url).pathname;
execSync(`npx esbuild ${new URL("../netlify/lib/supabase-airtable.mts", import.meta.url).pathname} --bundle --format=esm --platform=node --target=node20 --outfile=${AD}`, { stdio: "pipe" });
const { instalarSupabase } = await import(AD);
fs.rmSync(AD);
const leerAir = async (t) => (await (await air.fetch(`https://api.airtable.com/v0/b/${t}?returnFieldsByFieldId=true`)).json()).records;
instalarSupabase();
const leerSb = async (t) => (await (await fetch(`https://api.airtable.com/v0/b/${t}?returnFieldsByFieldId=true`)).json()).records;

const norm = (v) => Array.isArray(v) && v[0]?.filename ? v.map((a) => a.filename) : v;
let diferencias = [];
for (const t of Object.values(T)) {
  const [a, s] = [await leerAir(t), await leerSb(t)];
  if (a.map((x) => x.id).join() !== s.map((x) => x.id).join()) diferencias.push(`${t}: orden/ids ${a.map((x) => x.id)} vs ${s.map((x) => x.id)}`);
  for (const ra of a) {
    const rs = s.find((x) => x.id === ra.id);
    if (!rs) continue;
    for (const k of new Set([...Object.keys(ra.fields), ...Object.keys(rs.fields)])) {
      if (JSON.stringify(norm(ra.fields[k])) !== JSON.stringify(norm(rs.fields[k]))) {
        diferencias.push(`${t}/${ra.id}/${k}: ${JSON.stringify(ra.fields[k])} vs ${JSON.stringify(rs.fields[k])}`);
      }
    }
  }
}
dice("cada registro y cada campo es idéntico al de Airtable (ids, orden, tipos, enlaces, JSON)", diferencias.length === 0, diferencias.slice(0, 5).join(" | "));
const sus = (await leerSb(T.SUSCRIPCIONES))[0].fields;
dice("fecha con hora intacta", sus.fldSJpmXi4bmtriIs === "2026-11-12T10:00:00.000Z", sus.fldSJpmXi4bmtriIs);
const club = (await leerSb(T.CLUBES))[0].fields;
dice("el escudo ya sale de Supabase, no de Airtable", /\/storage\/v1\/object\/sign\/coachbase\/clubes\/recCLUB000000001\//.test(club.fldX3CMkCrO54gUrV?.[0]?.url || ""), club.fldX3CMkCrO54gUrV?.[0]?.url);

/* ---- no se puede repetir por error ---- */
const html = await (await migrar(new Request("https://app.test/.netlify/functions/migrar?clave=clave-larga-de-prueba"))).text();
dice("si Supabase ya tiene datos, se niega a empezar otra vez", /Supabase ya tiene datos/.test(html));

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
