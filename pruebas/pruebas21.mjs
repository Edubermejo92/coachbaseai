/* Alineación de cada partido del calendario: el once preparado para la
   jornada 7 contra tal, guardado con el equipo para recuperarlo en
   Alineación ese día. Mismo patrón documento-por-equipo que las favoritas. */
import { login, call } from "./run.mjs";
import { clasificar } from "../src/sincro.js";
let ok = 0, mal = 0;
const dice = (n, c, e = "") => { (c ? ok++ : mal++); console.log(`${c ? "✓" : "✗"} ${n}${e ? "  → " + e : ""}`); };

const tEnt = await login("ent@a.com");   // entrenador de recSEN
const tDirB = await login("dir@b.com");  // director de otro club

let r = await call("?res=alineaciones-partidos", { token: tEnt });
dice("sin equipo, 400", r.status === 400 && r.body.error === "falta_equipo", JSON.stringify(r.body));

r = await call("?res=alineaciones-partidos&team=recSEN", { token: tEnt });
dice("al principio no hay ninguna", r.body.alineaciones === "", JSON.stringify(r.body));

const doc = {
  recPARTIDO7: { lineup: { GK: "recJ0", RB: "recJ1" }, sysCode: "4-3-3", fecha: "2026-11-07", j: "7", rival: "A.D. Villa Rosa", capitanes: ["recJ0"] },
  "8008": { lineup: { GK: "recJ2" }, sysCode: "4-4-2", fecha: "2026-10-31", j: "6", rival: "C.D. Canillas" },
};
r = await call("?res=alineaciones-partidos&team=recSEN", { method: "POST", token: tEnt, body: { alineaciones: JSON.stringify(doc) } });
dice("el entrenador guarda el once de dos partidos", r.body.ok === true, JSON.stringify(r.body));

r = await call("?res=alineaciones-partidos&team=recSEN", { token: tEnt });
const leido = JSON.parse(r.body.alineaciones || "{}");
dice("se relee cada una con su partido", leido.recPARTIDO7?.j === "7" && leido.recPARTIDO7.lineup.GK === "recJ0" && leido["8008"]?.sysCode === "4-4-2", r.body.alineaciones);

r = await call("?res=alineaciones-partidos&team=recSEN", { method: "POST", token: tDirB, body: { alineaciones: JSON.stringify(doc) } });
dice("el director de otro club no puede tocarlas", r.status === 403, JSON.stringify(r.body));

r = await call("?res=alineaciones-partidos&team=recSEN", { method: "POST", token: tEnt, body: { alineaciones: JSON.stringify([doc.recPARTIDO7]) } });
dice("una lista en vez de un objeto no se guarda", r.status === 400 && r.body.reason === "formato_invalido");
r = await call("?res=alineaciones-partidos&team=recSEN", { method: "POST", token: tEnt, body: { alineaciones: JSON.stringify({ x: { sysCode: "4-3-3" } }) } });
dice("una entrada sin once no se guarda", r.status === 400);
const muchas = Object.fromEntries(Array.from({ length: 81 }, (_, i) => [`p${i}`, { lineup: {} }]));
r = await call("?res=alineaciones-partidos&team=recSEN", { method: "POST", token: tEnt, body: { alineaciones: JSON.stringify(muchas) } });
dice("más de 80 partidos no se guarda", r.status === 400);
r = await call("?res=alineaciones-partidos&team=recSEN", { token: tEnt });
dice("y lo rechazado no ha pisado lo guardado", JSON.parse(r.body.alineaciones || "{}").recPARTIDO7?.j === "7");

r = await call("?res=alineaciones-partidos&team=recSEN", { method: "POST", token: tEnt, body: { alineaciones: "{}" } });
dice("se pueden quitar todas", r.body.ok === true);

/* ---- quién puede leer y escribir los documentos de un equipo ----
   Antes valía ser director o club de CUALQUIER club para leer y sobrescribir
   las cargas físicas, la asistencia o las alineaciones de un equipo ajeno. */
const tDirA = await login("dir@a.com");  // director del mismo club que recSEN
const cuerpo = {
  jugadas: { jugadas: "[]" }, plan: { plan: "{}" }, cargas: { cargas: "{}" },
  pretemporada: { pretemporada: JSON.stringify({ semanas: [] }) }, asistencia: { asistencia: "{}" },
  "pase-lista": { paseLista: "{}" }, alineacion: { alineacion: "{}" }, "alineaciones-favoritas": { favoritas: "[]" },
  "alineaciones-partidos": { alineaciones: "{}" }, "abp-corners": { abp: JSON.stringify({ ataque: [], defensa: [] }) },
};
for (const res of Object.keys(cuerpo)) {
  const leeOtro = await call(`?res=${res}&team=recSEN`, { token: tDirB });
  const escribeOtro = await call(`?res=${res}&team=recSEN`, { method: "POST", token: tDirB, body: cuerpo[res] });
  const leeSuClub = await call(`?res=${res}&team=recSEN`, { token: tDirA });
  dice(`${res}: otro club ni lee ni escribe; su director sí lee`, leeOtro.status === 403 && escribeOtro.status === 403 && leeSuClub.status === 200,
    `${leeOtro.status}/${escribeOtro.status}/${leeSuClub.status}`);
}

const AIR = "/.netlify/functions/airtable";
const c = clasificar(`${AIR}?res=alineaciones-partidos&team=recSEN`, "POST", JSON.stringify({ alineaciones: "{}" }));
dice("sin conexión va a la cola y la última sustituye a la anterior", c?.modo === "sustituir", JSON.stringify(c));

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
