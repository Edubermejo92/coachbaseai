/* Alineaciones favoritas: hasta 3 onces guardados como plantilla -"con
   lesionados", "ida", "vuelta"...- para elegir uno y ponerlo en el partido
   sin rehacerlo cada vez. Mismo patrón de documento-por-equipo que la
   alineación oficial, pero es una lista aparte: no confundir una con otra. */
import { login, call } from "./run.mjs";
let ok=0, mal=0;
const dice=(n,c,e="")=>{(c?ok++:mal++);console.log(`${c?"✓":"✗"} ${n}${e?"  → "+e:""}`);};

const tEnt = await login("ent@a.com");   // entrenador de recSEN
const tDir = await login("dir@a.com");   // director deportivo de C.D. Chamartín Vergara (recCLUBA)

let r = await call("?res=alineaciones-favoritas", { token: tEnt });
dice("sin equipo, 400", r.status === 400 && r.body.error === "falta_equipo", JSON.stringify(r.body));

r = await call("?res=alineaciones-favoritas&team=recSEN", { token: tEnt });
dice("al principio, vacía", r.body.favoritas === "", JSON.stringify(r.body));

const favoritas = [
  { id: "f1", nombre: "Titular", lineup: { GK: "recJ0", RB: "recJ1" }, sysCode: "4-3-3" },
  { id: "f2", nombre: "Con lesionados", lineup: { GK: "recJ2" }, sysCode: "4-4-2" },
];
r = await call("?res=alineaciones-favoritas&team=recSEN", { method: "POST", token: tEnt, body: { favoritas: JSON.stringify(favoritas) } });
dice("el entrenador del equipo guarda sus favoritas", r.body.ok === true, JSON.stringify(r.body));

r = await call("?res=alineaciones-favoritas&team=recSEN", { token: tEnt });
dice("se relee lo guardado", JSON.parse(r.body.favoritas)[0].nombre === "Titular", r.body.favoritas);

r = await call("?res=alineaciones-favoritas&team=recIB", { method: "POST", token: tEnt, body: { favoritas: "[]" } });
dice("un entrenador no puede tocar las favoritas de un equipo que no es el suyo", r.status === 403 && r.body.reason === "no_autorizado", JSON.stringify(r.body));

r = await call("?res=alineaciones-favoritas&team=recSEN", { method: "POST", token: tEnt, body: { favoritas: JSON.stringify(Array.from({ length: 4 }, (_, i) => ({ id: "f" + i, nombre: "x", lineup: {}, sysCode: "4-3-3" }))) } });
dice("no caben más de 3", r.status === 400 && r.body.reason === "formato_invalido", JSON.stringify(r.body));

r = await call("?res=alineaciones-favoritas&team=recSEN", { method: "POST", token: tEnt, body: { favoritas: "no es json" } });
dice("un JSON roto tampoco cuela", r.status === 400 && r.body.reason === "formato_invalido", JSON.stringify(r.body));

r = await call("?res=alineaciones-favoritas&team=recSEN", { method: "POST", token: tDir, body: { favoritas: JSON.stringify([{ id: "f1", nombre: "Del director", lineup: {}, sysCode: "4-3-3" }]) } });
dice("el director deportivo del club sí puede", r.body.ok === true, JSON.stringify(r.body));

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
