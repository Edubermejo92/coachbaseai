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
  acta: [],
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

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
