/* Histórico de partidos en la nube (tabla Actas). Lo escribe el cuerpo
   técnico; lo lee su club; una familia NO lee las actas -llevan los minutos
   de todos los convocados-, solo la línea de su hijo a través de ?res=hijo. */
import { fake, login, call, T } from "./run.mjs";
let ok=0, mal=0;
const dice=(n,c,e="")=>{(c?ok++:mal++);console.log(`${c?"✓":"✗"} ${n}${e?"  → "+e:""}`);};

const tEnt  = await login("ent@a.com");    // entrenador del Senior A (recSEN)
const tDirB = await login("dir@b.com");    // director de OTRO club
const tClub = await login("club@a.com");

const partido = {
  id: 1, fecha: "2026-09-26", rival: "Rival FC", casa: true, us: 3, them: 1,
  jugadores: [
    { id: 5, rec: "recJ4", d: 5, n: "Jugador 5", titular: true, minutos: 70, goles: 2, tarjetas: 0 },
    { id: 6, rec: "recJ5", d: 6, n: "Jugador 6", titular: false, minutos: 20, goles: 1, tarjetas: 1 },
  ],
  /* Las asistencias de gol no están en la ficha de cada jugador: se apuntan
     en el acta, en el propio gol. Dos de Jugador 5 (una por dorsal, otra de
     un acta antigua que solo guardaba el nombre) y una de su compañero. */
  acta: [
    { type: "gol", player: "Jugador 6", dorsal: 6, asist: "Jugador 5", asistDorsal: 5 },
    { type: "gol", player: "Jugador 6", dorsal: 6, asist: "Jugador 5", asistDorsal: null },
    { type: "gol", player: "Jugador 5", dorsal: 5, asist: "Jugador 6", asistDorsal: 6 },
    { type: "tarjeta", player: "Jugador 6", dorsal: 6, asist: "Jugador 5", asistDorsal: 5 },
  ],
};
let r = await call("?res=actas", { method: "POST", token: tEnt, body: { fields: {
  Referencia: "2026-09-26 · Rival FC", Fecha: "2026-09-26", Equipo: ["recSEN"], Rival: "Rival FC",
  "Goles favor": 3, "Goles contra": 1, Datos: JSON.stringify(partido) } } });
dice("el entrenador guarda el acta en la nube", r.body.ok === true && !!r.body.rec, JSON.stringify(r.body));

r = await call("?res=actas", { method: "POST", token: tDirB, body: { fields: { Referencia: "x", Equipo: ["recSEN"], Datos: "{}" } } });
dice("otro club no puede escribir actas de este equipo", r.status === 403, String(r.status));

r = await call("?res=actas&team=recSEN", { token: tEnt });
dice("el cuerpo técnico la lee", r.status === 200 && r.body.records?.length === 1, JSON.stringify(r.body).slice(0, 120));
dice("con el partido completo dentro", JSON.parse(r.body.records?.[0]?.Datos || "{}").jugadores?.length === 2);

r = await call("?res=actas&team=recSEN", { token: tDirB });
dice("otro club no la lee", r.status === 403, String(r.status));

/* ---- Familia de Jugador 5 ---- */
r = await call("", { method: "POST", body: { action: "register", plan: "familia", name: "Marta", email: "marta@familia.com", password: "familia1234", teamRec: "recSEN", hijoNombre: "jugador 5", hijoDorsal: 5 } });
const tFam = r.body.token;
await call("?id=" + r.body.rec, { method: "PATCH", token: tClub, body: { estado: "Activo" } });

r = await call("?res=actas&team=recSEN", { token: tFam });
dice("la familia NO lee las actas de todo el equipo", r.status === 403, String(r.status));

r = await call("?res=hijo", { token: tFam });
const ps = r.body.partidos || [];
dice("en la ficha de su hijo ve sus partidos", r.body.ok === true && ps.length === 1, JSON.stringify(r.body.partidos));
dice("con sus minutos, si fue titular y sus goles", ps[0]?.minutos === 70 && ps[0]?.titular === true && ps[0]?.goles === 2, JSON.stringify(ps[0]));
dice("y nada de sus compañeros", !JSON.stringify(r.body).includes("Jugador 6"), "ok");
/* Dos asistencias: la del gol con su dorsal y la del acta antigua que solo
   guardaba el nombre. Ni la del gol que dio su compañero, ni la tarjeta. */
dice("se le cuentan sus asistencias de gol, del acta", ps[0]?.asistencias === 2, String(ps[0]?.asistencias));

/* ---- Próximo partido y si está convocado (8 nov 2026) ----
   Sale de la convocatoria que el cuerpo técnico guarda al mandarla. */
const dia = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
r = await call("?res=hijo", { token: tFam });
dice("sin convocatoria guardada no hay próximo partido", r.body.proxima === null, JSON.stringify(r.body.proxima));

/* Una pasada (ayer) y la de verdad (dentro de 5 días): tiene que coger la
   que viene, no la vieja. */
await call("?res=convocatoria-enviada", { method: "POST", token: tEnt, body: {
  team: "recSEN", fecha: dia(-1), hora: "10:00", rival: "Partido de ayer", lugar: "Viejo", convocados: ["recJ4"] } });
r = await call("?res=convocatoria-enviada", { method: "POST", token: tEnt, body: {
  team: "recSEN", fecha: dia(5), hora: "11:30", rival: "Rival FC", lugar: "La Concepción", convocados: ["recJ4", "recJ5"] } });
dice("el entrenador guarda la convocatoria al mandarla", r.body.ok === true, JSON.stringify(r.body));

r = await call("?res=hijo", { token: tFam });
const px = r.body.proxima;
dice("el jugador ve el próximo partido, no el de ayer", px?.fecha === dia(5), JSON.stringify(px));
dice("con hora, rival y campo", px?.hora === "11:30" && px?.rival === "Rival FC" && px?.lugar === "La Concepción", JSON.stringify(px));
dice("y si está convocado", px?.convocado === true, JSON.stringify(px));
dice("pero NO quién más está convocado",
  !JSON.stringify(px).includes("recJ5") && !("convocados" in (px || {})), JSON.stringify(px));

/* Fuera de la lista: su propio no, sin decir por qué. */
await call("?res=convocatoria-enviada", { method: "POST", token: tEnt, body: {
  team: "recSEN", fecha: dia(5), hora: "11:30", rival: "Rival FC", lugar: "La Concepción", convocados: ["recJ5"] } });
r = await call("?res=hijo", { token: tFam });
dice("si se queda fuera, lo ve", r.body.proxima?.convocado === false, JSON.stringify(r.body.proxima));

/* ---- A qué entrenos faltó ----
   El porcentaje solo no dice nada; lo que se quiere saber es qué días
   faltó y por qué. Del documento de asistencia del equipo sale SU casilla
   de cada día, nunca la de un compañero. El jugador se guarda por su
   puesto en la plantilla: recJ4 es el quinto, o sea "5". */
await call("?res=asistencia&team=recSEN", { method: "POST", token: tEnt, body: { asistencia: JSON.stringify({
  "2026-10-01": { 5: "presente", 6: "presente" },
  "2026-10-03": { 5: "estudios", 6: "presente" },
  "2026-10-08": { 5: "presente", 6: "injustificada" },
  "2026-10-10": {},
}) } });
r = await call("?res=hijo", { token: tFam });
const dias = r.body.asistDias || [];
dice("ve su asistencia día a día", dias.length === 3, JSON.stringify(dias));
dice("del más reciente al más antiguo", dias[0]?.d === "2026-10-08" && dias[2]?.d === "2026-10-01", JSON.stringify(dias.map((x) => x.d)));
dice("con el motivo del día que faltó", dias.find((x) => x.d === "2026-10-03")?.e === "estudios", JSON.stringify(dias));
dice("los días sin lista no cuentan", !dias.some((x) => x.d === "2026-10-10"), JSON.stringify(dias));
dice("y no se cuela lo de su compañero", !dias.some((x) => x.e === "injustificada"), JSON.stringify(dias));
dice("el porcentaje sigue cuadrando", r.body.asistencia?.pct === 67 && r.body.asistencia?.dias === 3, JSON.stringify(r.body.asistencia));

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
