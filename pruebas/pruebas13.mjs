/* ABP · balón parado: córner, falta y penalti, cada uno a favor y en contra.
   No es una alineación -los jugadores son los mismos del once- sino dónde se
   pone cada uno dentro del área, y se guarda por situación porque lo que vale
   para atacar no vale para defender. Hasta 5 de cada una de las seis. Mismo
   patrón de documento-por-equipo que el plan o las jugadas.
   El recurso sigue llamándose "abp-corners": nació cuando el córner era lo
   único que había y lo usan las versiones ya instaladas en los móviles. */
import { login, call } from "./run.mjs";
let ok=0, mal=0;
const dice=(n,c,e="")=>{(c?ok++:mal++);console.log(`${c?"✓":"✗"} ${n}${e?"  → "+e:""}`);};

const tEnt = await login("ent@a.com");   // entrenador de recSEN
const tDir = await login("dir@a.com");   // director deportivo del club

let r = await call("?res=abp-corners", { token: tEnt });
dice("sin equipo, 400", r.status === 400 && r.body.error === "falta_equipo", JSON.stringify(r.body));

r = await call("?res=abp-corners&team=recSEN", { token: tEnt });
dice("al principio, vacío", r.body.abp === "", JSON.stringify(r.body));

/* Lo que se guarda de cada colocación es DÓNDE está cada ficha: el jugador
   sale de la alineación oficial, aquí solo viaja el sitio que ocupa. */
const doc = {
  ataque: [{ id: "a1", nombre: "Primer palo", pos: { GK: { x: 50, y: 88 }, L2_0: { x: 34, y: 22 } } }],
  defensa: [{ id: "d1", nombre: "Zonal + 2 palos", pos: { GK: { x: 50, y: 12 }, L0_0: { x: 40, y: 18 } } }],
};
r = await call("?res=abp-corners&team=recSEN", { method: "POST", token: tEnt, body: { abp: JSON.stringify(doc) } });
dice("el entrenador del equipo guarda sus córners", r.body.ok === true, JSON.stringify(r.body));

r = await call("?res=abp-corners&team=recSEN", { token: tEnt });
const vuelta = JSON.parse(r.body.abp || "{}");
dice("se relee lo guardado", vuelta.ataque?.[0]?.nombre === "Primer palo", r.body.abp);
dice("y vuelve la colocación, ficha a ficha", vuelta.ataque?.[0]?.pos?.L2_0?.x === 34 && vuelta.defensa?.[0]?.pos?.GK?.y === 12, JSON.stringify(vuelta.ataque?.[0]?.pos));

/* Atacar y defender un córner son dos cosas distintas y se guardan aparte:
   meter una colocación de ataque no puede llevarse por delante las de
   defensa, ni al revés. */
const dosListas = { ataque: [...doc.ataque, { id: "a2", nombre: "Segundo palo", pos: {} }], defensa: doc.defensa };
r = await call("?res=abp-corners&team=recSEN", { method: "POST", token: tEnt, body: { abp: JSON.stringify(dosListas) } });
r = await call("?res=abp-corners&team=recSEN", { token: tEnt });
const dos = JSON.parse(r.body.abp || "{}");
dice("añadir una de ataque no toca las de defensa", dos.ataque.length === 2 && dos.defensa.length === 1, r.body.abp);

r = await call("?res=abp-corners&team=recIB", { method: "POST", token: tEnt, body: { abp: JSON.stringify(doc) } });
dice("un entrenador no puede tocar los córners de un equipo que no es el suyo", r.status === 403 && r.body.reason === "no_autorizado", JSON.stringify(r.body));

const seis = { ataque: Array.from({ length: 6 }, (_, i) => ({ id: "a" + i, nombre: "x", pos: {} })), defensa: [] };
r = await call("?res=abp-corners&team=recSEN", { method: "POST", token: tEnt, body: { abp: JSON.stringify(seis) } });
dice("no caben más de 5 en ataque", r.status === 400 && r.body.reason === "formato_invalido", JSON.stringify(r.body));

const seisDef = { ataque: [], defensa: Array.from({ length: 6 }, (_, i) => ({ id: "d" + i, nombre: "x", pos: {} })) };
r = await call("?res=abp-corners&team=recSEN", { method: "POST", token: tEnt, body: { abp: JSON.stringify(seisDef) } });
dice("ni más de 5 en defensa", r.status === 400 && r.body.reason === "formato_invalido", JSON.stringify(r.body));

r = await call("?res=abp-corners&team=recSEN", { method: "POST", token: tEnt, body: { abp: JSON.stringify({ ataque: [] }) } });
dice("faltando una situación tampoco cuela", r.status === 400 && r.body.reason === "formato_invalido", JSON.stringify(r.body));

r = await call("?res=abp-corners&team=recSEN", { method: "POST", token: tEnt, body: { abp: "no es json" } });
dice("un JSON roto tampoco cuela", r.status === 400 && r.body.reason === "formato_invalido", JSON.stringify(r.body));

/* Y lo guardado sigue en su sitio después de todos los intentos fallidos. */
r = await call("?res=abp-corners&team=recSEN", { token: tEnt });
dice("lo válido no se ha perdido por el camino", JSON.parse(r.body.abp || "{}").ataque?.length === 2, r.body.abp);

r = await call("?res=abp-corners&team=recSEN", { method: "POST", token: tDir, body: { abp: JSON.stringify(doc) } });
dice("el director deportivo del club sí puede", r.body.ok === true, JSON.stringify(r.body));

/* ---- Faltas y penaltis (8 nov 2026) ----
   Seis situaciones y no dos. Cada una guarda las suyas: la falta en contra
   -la barrera- no se parece en nada al córner a favor. */
const unaCol = (id) => [{ id, nombre: id, pos: { GK: { x: 50, y: 12 } } }];
const seisSit = {
  ataque: unaCol("ca"), defensa: unaCol("cd"),
  faltaAtaque: unaCol("fa"), faltaDefensa: unaCol("fd"),
  penaltiAtaque: unaCol("pa"), penaltiDefensa: unaCol("pd"),
};
r = await call("?res=abp-corners&team=recSEN", { method: "POST", token: tEnt, body: { abp: JSON.stringify(seisSit) } });
dice("se guardan las seis situaciones", r.body.ok === true, JSON.stringify(r.body));

r = await call("?res=abp-corners&team=recSEN", { token: tEnt });
const seisV = JSON.parse(r.body.abp || "{}");
dice("y vuelven las seis",
  ["ataque", "defensa", "faltaAtaque", "faltaDefensa", "penaltiAtaque", "penaltiDefensa"]
    .every((k) => seisV[k]?.length === 1), r.body.abp);

/* Guardar una falta no puede llevarse por delante el córner. */
const masFalta = { ...seisSit, faltaAtaque: [...unaCol("fa"), { id: "fa2", nombre: "Dos lanzadores", pos: {} }] };
r = await call("?res=abp-corners&team=recSEN", { method: "POST", token: tEnt, body: { abp: JSON.stringify(masFalta) } });
r = await call("?res=abp-corners&team=recSEN", { token: tEnt });
const tras = JSON.parse(r.body.abp || "{}");
dice("añadir una falta no toca el córner", tras.faltaAtaque.length === 2 && tras.ataque.length === 1, r.body.abp);

const seisPen = { ...seisSit, penaltiDefensa: Array.from({ length: 6 }, (_, i) => ({ id: "p" + i, nombre: "x", pos: {} })) };
r = await call("?res=abp-corners&team=recSEN", { method: "POST", token: tEnt, body: { abp: JSON.stringify(seisPen) } });
dice("tampoco caben más de 5 en un penalti", r.status === 400 && r.body.reason === "formato_invalido", JSON.stringify(r.body));

/* Una clave que no es ninguna de las seis es un error o un documento de otra
   versión: no se guarda, porque machacaría lo que hay. */
r = await call("?res=abp-corners&team=recSEN", { method: "POST", token: tEnt, body: { abp: JSON.stringify({ ...seisSit, saqueDeBanda: [] }) } });
dice("una situación inventada no cuela", r.status === 400 && r.body.reason === "formato_invalido", JSON.stringify(r.body));

/* Una app anterior a las faltas y los penaltis manda solo las dos del
   córner: tiene que seguir guardando. */
r = await call("?res=abp-corners&team=recSEN", { method: "POST", token: tEnt, body: { abp: JSON.stringify({ ataque: unaCol("viejo"), defensa: [] }) } });
dice("una app antigua, que solo manda el córner, sigue guardando", r.body.ok === true, JSON.stringify(r.body));

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
