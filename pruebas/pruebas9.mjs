/* Alineación oficial en la nube: antes no se guardaba en ningún sitio -vivía
   solo en memoria del navegador de quien la montara, y desaparecía al
   recargar o al mirarla desde otro dispositivo-. Ahora es un documento por
   equipo en Airtable, mismo patrón que cargas y asistencia. */
import { login, call } from "./run.mjs";
let ok=0, mal=0;
const dice=(n,c,e="")=>{(c?ok++:mal++);console.log(`${c?"✓":"✗"} ${n}${e?"  → "+e:""}`);};

const tEnt = await login("ent@a.com");   // entrenador de recSEN
const tDir = await login("dir@a.com");   // director deportivo de C.D. Chamartín Vergara (recCLUBA)

let r = await call("?res=alineacion", { token: tEnt });
dice("sin equipo, 400", r.status === 400 && r.body.error === "falta_equipo", JSON.stringify(r.body));

r = await call("?res=alineacion&team=recSEN", { token: tEnt });
dice("al principio, vacía", r.body.alineacion === "", JSON.stringify(r.body));

const once = { GK: "1", RB: "2", DC: "5" };
r = await call("?res=alineacion&team=recSEN", { method: "POST", token: tEnt, body: { alineacion: JSON.stringify(once) } });
dice("el entrenador del equipo guarda la alineación", r.body.ok === true, JSON.stringify(r.body));

r = await call("?res=alineacion&team=recSEN", { token: tEnt });
dice("se relee lo guardado", JSON.parse(r.body.alineacion).GK === "1", r.body.alineacion);

r = await call("?res=alineacion&team=recIB", { method: "POST", token: tEnt, body: { alineacion: "{}" } });
dice("un entrenador no puede tocar la alineación de un equipo que no es el suyo", r.status === 403 && r.body.reason === "no_autorizado", JSON.stringify(r.body));

r = await call("?res=alineacion&team=recSEN", { method: "POST", token: tDir, body: { alineacion: JSON.stringify({ GK: "3" }) } });
dice("el director deportivo del club sí puede", r.body.ok === true, JSON.stringify(r.body));

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
