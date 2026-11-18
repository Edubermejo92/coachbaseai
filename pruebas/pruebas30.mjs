/* ============================================================
   pruebas30 · Estadísticas
   ------------------------------------------------------------
   Lo que se comprueba aquí es que la pantalla de Estadísticas cuenta lo que
   de verdad pasó: los minutos salen del acta de cada partido y no de un
   campo que nadie escribe, las asistencias de gol se le cuentan a quien las
   dio, y a un jugador se le sigue la pista aunque cambie de dorsal o se
   reordene la plantilla.
   Son funciones puras: ni navegador ni servidor.
   ============================================================ */
import {
  partidosConFicha, fichaEnPartido, asistenciasEnPartido,
  totalesDe, minutosDe, tablaTemporada, resumenTemporada,
  ajusteDe, hayAjuste, marcadoresDelCalendario,
} from "../src/estadisticas.js";

let ok = 0, mal = 0;
const dice = (n, c, e = "") => { (c ? ok++ : mal++); console.log(`${c ? "✓" : "✗"} ${n}${e ? "  → " + e : ""}`); };

/* Dos partidos. Diego (rec recA, dorsal 9) juega los dos; en el segundo ha
   cambiado de dorsal al 10. Samuel (recB, dorsal 10 y luego 11) le da un
   pase de gol en cada uno. Teo entró de suplente en el primero. */
const P1 = {
  id: 1, fecha: "2026-09-05", rival: "Norte", us: 3, them: 1,
  jugadores: [
    { id: 9, rec: "recA", d: 9, n: "Diego Q.", titular: true, minutos: 70, goles: 2, tarjetas: 0 },
    { id: 10, rec: "recB", d: 10, n: "Samuel P.", titular: true, minutos: 70, goles: 1, tarjetas: 1 },
    { id: 14, rec: "recC", d: 14, n: "Teo V.", titular: false, minutos: 15, goles: 0, tarjetas: 0 },
  ],
  acta: [
    { type: "gol", disp: "12", dorsal: 9, asist: "Samuel P.", asistDorsal: 10 },
    { type: "gol", disp: "40", dorsal: 9, asist: null, asistDorsal: null },
    { type: "gol", disp: "66", dorsal: 10, asist: "Diego Q.", asistDorsal: 9 },
    { type: "golRival", disp: "80" },
  ],
};
const P2 = {
  id: 2, fecha: "2026-09-12", rival: "Sur", us: 1, them: 1,
  jugadores: [
    { id: 9, rec: "recA", d: 10, n: "Diego Q.", titular: true, minutos: 60, goles: 1, tarjetas: 0 },
    { id: 10, rec: "recB", d: 11, n: "Samuel P.", titular: false, minutos: 30, goles: 0, tarjetas: 0 },
  ],
  acta: [{ type: "gol", disp: "55", dorsal: 10, asist: "Samuel P.", asistDorsal: 11 }],
};
/* Un partido antiguo, de cuando no se guardaba la ficha: solo resultado. */
const P0 = { id: 0, fecha: "2026-08-29", rival: "Viejo", us: 0, them: 2 };
const HIST = [P2, P1, P0];

/* ---------- qué partidos cuentan ---------- */
dice("solo cuentan los partidos con ficha de jugadores",
  partidosConFicha(HIST).length === 2);
dice("un histórico vacío o roto no revienta",
  partidosConFicha([]).length === 0 && partidosConFicha(null).length === 0 && partidosConFicha(undefined).length === 0);

/* ---------- encontrar a un jugador en un partido ---------- */
dice("se le encuentra por su rec de Airtable",
  fichaEnPartido(P1, { rec: "recA", id: 999, d: 77 })?.n === "Diego Q.");
dice("y si no tiene rec, por el id de este dispositivo",
  fichaEnPartido(P1, { id: 14, d: 77 })?.n === "Teo V.");
dice("y de último, por el dorsal",
  fichaEnPartido(P1, { d: 10 })?.n === "Samuel P.");
dice("quien no jugó ese partido no aparece", fichaEnPartido(P2, { rec: "recC" }) === null);
dice("sin partido ni jugador, nada",
  fichaEnPartido(null, { rec: "recA" }) === null && fichaEnPartido(P1, null) === null);
/* El caso que justifica buscar por rec: Diego cambió del 9 al 10, y el 10 del
   primer partido era Samuel. Por dorsal se le contarían los goles del otro. */
dice("un cambio de dorsal no le atribuye a nadie lo del compañero",
  fichaEnPartido(P1, { rec: "recA", d: 10 })?.rec === "recA");

/* ---------- las asistencias salen del acta ---------- */
dice("el pase de gol se le cuenta a quien lo dio",
  asistenciasEnPartido(P1, { d: 10 }) === 1, String(asistenciasEnPartido(P1, { d: 10 })));
dice("y el goleador no se lleva su propia asistencia",
  asistenciasEnPartido(P1, { d: 9 }) === 1);
dice("un partido sin acta no da asistencias",
  asistenciasEnPartido({ jugadores: [] }, { d: 9 }) === 0);
dice("sin dorsal no se le puede contar ninguna",
  asistenciasEnPartido(P1, { d: null }) === 0 && asistenciasEnPartido(P1, {}) === 0);

/* ---------- los totales de un jugador ---------- */
const diego = totalesDe(HIST, { rec: "recA", d: 10 });
dice("los minutos se suman de los dos partidos", diego.minutos === 130, String(diego.minutos));
dice("los goles también", diego.goles === 3, String(diego.goles));
dice("convocado en los dos, de dos con ficha",
  diego.convocado === 2 && diego.partidos === 2);
dice("titular en los dos", diego.titular === 2);
const teo = totalesDe(HIST, { rec: "recC", d: 14 });
dice("un suplente suma sus minutos y ningún titular", teo.minutos === 15 && teo.titular === 0);
dice("y solo cuenta el partido en el que estuvo", teo.convocado === 1 && teo.partidos === 2);
const nadie = totalesDe(HIST, { rec: "recZ", d: 99 });
dice("quien no ha jugado nada sale a cero, no roto",
  nadie.minutos === 0 && nadie.goles === 0 && nadie.convocado === 0);
dice("minutosDe es el atajo de lo mismo", minutosDe(HIST, { rec: "recA" }) === 130);
dice("sin histórico, cero minutos", minutosDe([], { rec: "recA" }) === 0 && minutosDe(null, { rec: "recA" }) === 0);
/* La razón de ser de todo esto: el campo "Minutos" de la ficha no lo escribe
   nadie, así que un jugador con min=0 tiene que seguir teniendo sus minutos. */
dice("los minutos NO dependen del campo de la ficha",
  minutosDe(HIST, { rec: "recA", min: 0 }) === 130);

/* ---------- la tabla de la temporada ---------- */
const tabla = tablaTemporada(HIST);
dice("una fila por jugador, no una por partido", tabla.length === 3, String(tabla.length));
const fDiego = tabla.find((x) => x.n === "Diego Q.");
const fSamuel = tabla.find((x) => x.n === "Samuel P.");
dice("Diego: 3 goles y 130 minutos", fDiego.goles === 3 && fDiego.minutos === 130);
dice("y se le llama por su dorsal de ahora, el del último partido", fDiego.d === 10, String(fDiego.d));
dice("Samuel: dos asistencias, una con cada dorsal",
  fSamuel.asistencias === 2, String(fSamuel.asistencias));
dice("Diego también tiene la suya", fDiego.asistencias === 1);
dice("las tarjetas se suman", fSamuel.tarjetas === 1);
dice("la tabla va por goles y luego por asistencias",
  tabla[0].n === "Diego Q." && tabla[1].n === "Samuel P.");
dice("quien ya no está en la plantilla sigue en la tabla: jugó lo que jugó",
  tabla.some((x) => x.n === "Teo V."));
dice("sin partidos, tabla vacía", tablaTemporada([]).length === 0 && tablaTemporada(null).length === 0);

/* ---------- el balance ---------- */
const r = resumenTemporada(HIST);
dice("cuenta los tres resultados",
  r.ganados === 1 && r.empatados === 1 && r.perdidos === 1, JSON.stringify(r));
dice("y cuenta también el partido sin ficha: tiene resultado", r.jugados === 3);
dice("goles a favor y en contra", r.gf === 4 && r.gc === 4);
dice("un partido sin marcador no cuenta",
  resumenTemporada([{ us: null, them: 2 }, { us: 1, them: 0 }]).jugados === 1);
dice("sin histórico, todo a cero",
  JSON.stringify(resumenTemporada(null)) === JSON.stringify({ jugados: 0, ganados: 0, empatados: 0, perdidos: 0, gf: 0, gc: 0 }));

/* ---------- lo que no pasó por la app ---------- */
dice("sin ajuste, todo a cero",
  JSON.stringify(ajusteDe({})) === '{"minutos":0,"goles":0,"asistencias":0}');
dice("el ajuste llega como texto desde la nube",
  ajusteDe({ ajustes: '{"minutos":90,"goles":2,"asistencias":1}' }).minutos === 90);
dice("y también como objeto", ajusteDe({ ajustes: { goles: 3 } }).goles === 3);
dice("un ajuste roto no revienta nada",
  JSON.stringify(ajusteDe({ ajustes: "esto no es json" })) === JSON.stringify(ajusteDe(null)));
dice("no se admiten números negativos ni decimales",
  ajusteDe({ ajustes: { minutos: -30, goles: 1.7 } }).minutos === 0
  && ajusteDe({ ajustes: { goles: 1.7 } }).goles === 2);
dice("hayAjuste distingue el cero del dato",
  hayAjuste({ ajustes: { minutos: 0 } }) === false && hayAjuste({ ajustes: { minutos: 1 } }) === true);

const conAjuste = totalesDe(HIST, { rec: "recC", d: 14, ajustes: { minutos: 70, goles: 1 } });
dice("el ajuste se SUMA a lo del acta, no la sustituye",
  conAjuste.minutos === 85 && conAjuste.goles === 1, JSON.stringify(conAjuste));
dice("y queda marcado como puesto a mano", conAjuste.aMano === true);
dice("sin ajuste no se marca", totalesDe(HIST, { rec: "recC" }).aMano === false);
dice("los minutos del atajo también lo llevan",
  minutosDe(HIST, { rec: "recC", ajustes: { minutos: 70 } }) === 85);

const conPlantilla = tablaTemporada(HIST, [
  { rec: "recA", d: 10, n: "Diego Q.", ajustes: { minutos: 50, asistencias: 1 } },
  { rec: "recZ", d: 21, n: "Nuevo N.", ajustes: { minutos: 140, goles: 2 } },
]);
const fD = conPlantilla.find((x) => x.rec === "recA");
dice("en la tabla, el ajuste se suma a lo del acta",
  fD.minutos === 180 && fD.asistencias === 2, JSON.stringify({ m: fD.minutos, a: fD.asistencias }));
dice("y la fila queda marcada", fD.aMano === true);
const fZ = conPlantilla.find((x) => x.rec === "recZ");
dice("quien no tiene ni un partido con acta pero sí ajuste entra en la tabla",
  !!fZ && fZ.minutos === 140 && fZ.goles === 2 && fZ.convocado === 0);
dice("sin plantilla, la tabla es la de siempre",
  tablaTemporada(HIST).length === 3 && tablaTemporada(HIST, []).length === 3);

/* ---------- los resultados escritos en el calendario ---------- */
const FIX = [
  { id: 9001, rec: "fixA", hg: 2, ag: 1, casa: true },    /* ganado en casa */
  { id: 9002, rec: "fixB", hg: 3, ag: 0, casa: false },   /* perdido fuera */
  { id: 9003, rec: "fixC", hg: null, ag: null, casa: true }, /* sin jugar */
  { id: 9004, rec: "fixD", hg: 1, ag: 1, casa: true },    /* este SÍ tiene acta */
];
const HIST2 = [{ ...P1, partido: "fixD" }];
const extra = marcadoresDelCalendario(FIX, HIST2);
dice("solo entran los que tienen resultado", extra.length === 2, JSON.stringify(extra));
dice("el que ya tiene acta no se cuenta dos veces",
  !extra.some((x) => x.us === 1 && x.them === 1));
/* El caso que se escapaba: un partido llevado con la app pero sin enlazar a
   su jornada -un amistoso- no tiene `partido`, y su resultado está también
   en el calendario. Por fecha se le reconoce. */
dice("un partido con acta pero sin enlazar tampoco, si cae el mismo día",
  marcadoresDelCalendario([{ id: 7001, fecha: "2026-09-05", hg: 3, ag: 1, casa: true }], HIST).length === 0);
dice("y uno de otro día sí entra",
  marcadoresDelCalendario([{ id: 7002, fecha: "2026-10-01", hg: 3, ag: 1, casa: true }], HIST).length === 1);
dice("fuera de casa, el marcador se da la vuelta",
  extra.some((x) => x.us === 0 && x.them === 3), JSON.stringify(extra));
dice("en casa, no", extra.some((x) => x.us === 2 && x.them === 1));
dice("vienen marcados como del calendario", extra.every((x) => x.deCalendario === true));
dice("sin calendario no pasa nada",
  marcadoresDelCalendario(null, HIST2).length === 0 && marcadoresDelCalendario([], null).length === 0);
const conCalendario = resumenTemporada([...HIST, ...marcadoresDelCalendario(FIX, HIST)]);
dice("y el balance los suma a los partidos con acta",
  conCalendario.jugados === 6 && conCalendario.ganados === 2 && conCalendario.perdidos === 2,
  JSON.stringify(conCalendario));

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
