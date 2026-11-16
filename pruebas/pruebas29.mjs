/* Convocatoria · lo que hay que saber antes de marcar a nadie
   (src/convocatoria.js).
   Dos cuentas que la pantalla de Convocatoria enseña debajo de cada nombre:
   a cuántos entrenos faltó cada uno esta semana y si se quedó fuera del
   partido anterior. Las reglas no son obvias y equivocarse se nota: decir
   que ha faltado quien no estaba en la lista de ese día, o que no fue al
   partido anterior quien todavía no estaba en el equipo, es peor que no
   decir nada. Son funciones puras: ni navegador ni servidor. */
import { MOTIVOS_DESCARTE, ESTADOS_JUGADOR, noConvocable, trasCambiarEstado,
  diasConListaReciente, faltasEnDias, ultimaConvocatoria } from "../src/convocatoria.js";

let ok = 0, mal = 0;
const dice = (n, c, e = "") => { (c ? ok++ : mal++); console.log(`${c ? "✓" : "✗"} ${n}${e ? "  → " + e : ""}`); };

const HOY = "2026-11-16";
const ASIST = {
  "2026-11-16": { 1: "presente", 2: "estudios", 3: "presente", 4: "presente" },  /* hoy */
  "2026-11-12": { 1: "presente", 2: "injustificada", 4: "presente" },           /* y 3 sin marcar */
  "2026-11-10": { 1: "lesion", 2: "presente", 3: "presente", 4: "presente" },
  "2026-11-09": {},                                               /* día sin lista */
  "2026-11-05": { 1: "estudios", 2: "estudios", 3: "estudios" },  /* fuera de la semana */
  "no-es-un-dia": { 1: "estudios" },
};

/* ---------- qué días cuentan ---------- */
const dias = diasConListaReciente(ASIST, HOY);
dice("solo los días de la última semana", dias.map(([d]) => d).join() === "2026-11-10,2026-11-12,2026-11-16", JSON.stringify(dias.map(([d]) => d)));
dice("un día que nadie abrió no cuenta", !dias.some(([d]) => d === "2026-11-09"));
dice("ni una clave que no es una fecha", !dias.some(([d]) => d === "no-es-un-dia"));
dice("van del más antiguo al más reciente", dias[0][0] < dias[dias.length - 1][0]);
dice("sin fecha de hoy válida no hay días", diasConListaReciente(ASIST, "ayer").length === 0);
dice("sin asistencia tampoco", diasConListaReciente(null, HOY).length === 0);
dice("la ventana se puede cambiar", diasConListaReciente(ASIST, HOY, 30).length === 4, String(diasConListaReciente(ASIST, HOY, 30).length));

/* ---------- a cuántos faltó cada uno ---------- */
dice("quien vino todos los días no sale avisado", faltasEnDias(dias, 4) === null, JSON.stringify(faltasEnDias(dias, 4)));
const f1 = faltasEnDias(dias, 1);
dice("una lesión también es una falta", f1?.n === 1 && f1.motivos.join() === "lesion", JSON.stringify(f1));
const f2 = faltasEnDias(dias, 2);
dice("se cuentan todas sus faltas", f2?.n === 2, JSON.stringify(f2));
dice("con el motivo de cada una, sin repetir", f2?.motivos.join() === "injustificada,estudios", JSON.stringify(f2?.motivos));
dice("y sobre cuántos días hubo lista", f2?.de === 3, String(f2?.de));
const f3 = faltasEnDias(dias, 3);
dice("un día en el que no le pasaron lista NO es una falta suya", f3 === null, JSON.stringify(f3));
dice("sin días con lista no se dice nada", faltasEnDias([], 2) === null);

/* ---------- el partido anterior ---------- */
const FILAS = [
  { Fecha: "2026-11-07", Rival: "Viejo FC", Convocados: ["recA", "recB"], Descartes: JSON.stringify({ recC: "tecnica" }) },
  { Fecha: "2026-11-14", Rival: "Rival FC", Convocados: ["recA"], Descartes: JSON.stringify({ recB: "viaje", recC: "inventado" }) },
  { Fecha: "2026-11-21", Rival: "El que viene", Convocados: ["recA", "recB", "recC"], Descartes: "{}" },
];
const prev = ultimaConvocatoria(FILAS, HOY);
dice("se coge la última mandada antes de hoy", prev?.fecha === "2026-11-14", JSON.stringify(prev?.fecha));
dice("no la del partido que viene", prev?.rival === "Rival FC", prev?.rival);
dice("con quién fue", prev?.convocados.has("recA") && !prev.convocados.has("recB"));
dice("y por qué no fue el que no fue", prev?.motivos.recB === "viaje", JSON.stringify(prev?.motivos));
dice("un motivo inventado se descarta", !("recC" in (prev?.motivos || {})), JSON.stringify(prev?.motivos));
dice("los cuatro motivos son los que valida el servidor",
  MOTIVOS_DESCARTE.join() === "tecnica,lesion,sancion,viaje", MOTIVOS_DESCARTE.join());

/* Casos en los que es mejor no decir nada que decir algo falso. */
dice("una convocatoria sin nadie dentro no sirve de referencia",
  ultimaConvocatoria([{ Fecha: "2026-11-14", Convocados: [] }], HOY) === null);
dice("la de hoy es la que se está preparando, no la anterior",
  ultimaConvocatoria([{ Fecha: HOY, Convocados: ["recA"] }], HOY) === null);
dice("sin ninguna convocatoria, nada", ultimaConvocatoria([], HOY) === null && ultimaConvocatoria(null, HOY) === null);
dice("un Descartes roto no se lleva por delante la lista",
  ultimaConvocatoria([{ Fecha: "2026-11-14", Convocados: ["recA"], Descartes: "no es json" }], HOY)?.convocados.has("recA") === true);

/* ---------- el lesionado no se convoca ---------- */
dice("los cuatro estados, y en orden",
  JSON.stringify(ESTADOS_JUGADOR) === '["disponible","duda","lesionado","sancionado"]');
dice("un lesionado no es convocable", noConvocable({ st: "lesionado" }) === true);
dice("una duda sí: se decide el sábado", noConvocable({ st: "duda" }) === false);
dice("un sancionado también viaja con el equipo", noConvocable({ st: "sancionado" }) === false);
dice("un disponible, por supuesto", noConvocable({ st: "disponible" }) === false);
dice("sin jugador no se revienta", noConvocable(null) === false && noConvocable(undefined) === false);

const traAnte = trasCambiarEstado(7, "lesionado", [5, 7, 9], { 5: "tecnica" });
dice("al lesionarse sale de la convocatoria",
  JSON.stringify(traAnte.convocados) === "[5,9]", JSON.stringify(traAnte.convocados));
dice("y su motivo pasa a ser la lesión", traAnte.descartes[7] === "lesion");
dice("sin tocar el motivo de los demás", traAnte.descartes[5] === "tecnica");
const traAlta = trasCambiarEstado(7, "disponible", [5, 9], { 7: "lesion", 5: "tecnica" });
dice("al recuperarse se le quita el motivo de lesión", traAlta.descartes[7] === undefined);
dice("pero no vuelve solo a la convocatoria: eso lo decide el entrenador",
  JSON.stringify(traAlta.convocados) === "[5,9]");
dice("un motivo puesto a mano no se borra por cambiar de estado",
  trasCambiarEstado(5, "duda", [9], { 5: "tecnica" }).descartes[5] === "tecnica");
dice("marcar lesionado a quien ya estaba fuera solo le pone el motivo",
  JSON.stringify(trasCambiarEstado(7, "lesionado", [5], {})) === '{"convocados":[5],"descartes":{"7":"lesion"}}',
  JSON.stringify(trasCambiarEstado(7, "lesionado", [5], {})));
dice("sin convocatoria ni motivos tampoco se rompe",
  JSON.stringify(trasCambiarEstado(7, "lesionado", null, null).convocados) === "[]");
dice("«lesion» es uno de los motivos que acepta el servidor", MOTIVOS_DESCARTE.includes("lesion"));

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
