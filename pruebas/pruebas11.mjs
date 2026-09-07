/* Pase de lista de Disciplina en la nube: antes solo vivía en el
   localStorage de quien pasaba lista, así que el delegado que marcaba un
   retraso desde su móvil no lo veía el entrenador desde el suyo. Mismo
   patrón que cargas, asistencia y alineación: un documento por equipo. */
import { login, call } from "./run.mjs";
let ok=0, mal=0;
const dice=(n,c,e="")=>{(c?ok++:mal++);console.log(`${c?"✓":"✗"} ${n}${e?"  → "+e:""}`);};

const tEnt = await login("ent@a.com");   // entrenador de recSEN
const tDir = await login("dir@a.com");   // director deportivo de C.D. Chamartín Vergara (recCLUBA)

let r = await call("?res=pase-lista", { token: tEnt });
dice("sin equipo, 400", r.status === 400 && r.body.error === "falta_equipo", JSON.stringify(r.body));

r = await call("?res=pase-lista&team=recSEN", { token: tEnt });
dice("al principio, vacío", r.body.paseLista === "", JSON.stringify(r.body));

const lista = { "1": "ok", "2": "late" };
r = await call("?res=pase-lista&team=recSEN", { method: "POST", token: tEnt, body: { paseLista: JSON.stringify(lista) } });
dice("el entrenador del equipo guarda el pase de lista", r.body.ok === true, JSON.stringify(r.body));

r = await call("?res=pase-lista&team=recSEN", { token: tEnt });
dice("se relee lo guardado", JSON.parse(r.body.paseLista)["1"] === "ok", r.body.paseLista);

r = await call("?res=pase-lista&team=recIB", { method: "POST", token: tEnt, body: { paseLista: "{}" } });
dice("un entrenador no puede tocar el pase de lista de un equipo que no es el suyo", r.status === 403 && r.body.reason === "no_autorizado", JSON.stringify(r.body));

r = await call("?res=pase-lista&team=recSEN", { method: "POST", token: tDir, body: { paseLista: JSON.stringify({ "3": "absent" }) } });
dice("el director deportivo del club sí puede", r.body.ok === true, JSON.stringify(r.body));

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
