/* Asistencia diaria en la nube: antes vivía solo en el móvil de quien pasaba
   lista (localStorage), así que ni el propio entrenador la veía si la había
   marcado el delegado desde otro dispositivo. Ahora es un documento por
   equipo en Airtable -mismo patrón que las cargas físicas de pretemporada-,
   y la familia puede ver el % de asistencia de su hijo/a sin que se le
   enseñe ni un dato de sus compañeros. */
import { fake, login, call, T } from "./run.mjs";
let ok=0, mal=0;
const dice=(n,c,e="")=>{(c?ok++:mal++);console.log(`${c?"✓":"✗"} ${n}${e?"  → "+e:""}`);};

const tEnt = await login("ent@a.com");   // entrenador de recSEN
const tDir = await login("dir@a.com");   // director deportivo de C.D. Chamartín Vergara (recCLUBA)

/* ---- Sin equipo no hay endpoint que valga ---- */
let r = await call("?res=asistencia", { token: tEnt });
dice("sin equipo, 400", r.status === 400 && r.body.error === "falta_equipo", JSON.stringify(r.body));

/* ---- Al principio no hay nada guardado ---- */
r = await call("?res=asistencia&team=recSEN", { token: tEnt });
dice("al principio, vacío", r.body.asistencia === "", JSON.stringify(r.body));

/* ---- El propio equipo puede escribir ---- */
const dia1 = { "2026-09-01": { "1": "presente", "2": "presente", "5": "enfermedad" } };
r = await call("?res=asistencia&team=recSEN", { method: "POST", token: tEnt, body: { asistencia: JSON.stringify(dia1) } });
dice("el entrenador del equipo guarda la asistencia del día", r.body.ok === true, JSON.stringify(r.body));

/* ---- Y se lee tal cual desde cualquier sesión con acceso ---- */
r = await call("?res=asistencia&team=recSEN", { token: tEnt });
dice("se relee lo guardado", JSON.parse(r.body.asistencia)["2026-09-01"]["1"] === "presente", r.body.asistencia);

/* ---- Un entrenador de OTRO equipo (sin nivel de club) no puede tocarla ---- */
r = await call("?res=asistencia&team=recIB", { method: "POST", token: tEnt, body: { asistencia: "{}" } });
dice("un entrenador no puede escribir la asistencia de un equipo que no es el suyo", r.status === 403 && r.body.reason === "no_autorizado", JSON.stringify(r.body));

/* ---- El director deportivo del mismo club sí puede, aunque no sea su equipo ---- */
const dia2 = { ...dia1, "2026-09-02": { "1": "presente", "2": "ausencia_injustificada" } };
r = await call("?res=asistencia&team=recSEN", { method: "POST", token: tDir, body: { asistencia: JSON.stringify(dia2) } });
dice("el director deportivo del club sí puede escribir en cualquier equipo suyo", r.body.ok === true, JSON.stringify(r.body));

/* ---- Cuentas familiares: de solo lectura, ni aquí tampoco ---- */
r = await call("", { method: "POST", body: { action: "register", plan: "familia", name: "Marta Arenas", email: "marta7@familia.com", password: "familia1234", teamRec: "recSEN", hijoNombre: "jugador 5", hijoDorsal: 5 } });
dice("se registra la cuenta familiar del jugador 5", r.body.ok === true, JSON.stringify(r.body).slice(0, 120));
const tFamilia = r.body.token;
r = await call("?res=asistencia&team=recSEN", { method: "POST", token: tFamilia, body: { asistencia: "{}" } });
dice("una cuenta familiar no puede escribir asistencia", r.status === 403, String(r.status));

/* ---- Y una vez activada, ve el % de asistencia de SU hijo, no la lista entera ---- */
r = await call("?id=" + fake.db[T.USUARIOS].find(u => u.fields.fldJWlJ17YuZNe4Jx === "marta7@familia.com").id,
  { method: "PATCH", token: tDir, body: { estado: "Activo" } });
dice("el club activa la cuenta familiar", r.body.ok === true, JSON.stringify(r.body));

r = await call("?res=hijo", { token: tFamilia });
/* Jugador 5 (recJ4, dorsal 5) es el 5º de la plantilla -índice 4, pid "5"-,
   y en dia2 tiene "5":"enfermedad" el 2026-09-01 y nada el 2026-09-02: de
   los 2 días con lista pasada, 0 de 2 como presente = 0%. */
dice("ve el % de asistencia de su hijo, no la plantilla", r.body.hijo?.Nombre === "Jugador 5", JSON.stringify(r.body.hijo).slice(0, 80));
dice("con el cálculo correcto (0 de 2 días presente)", r.body.asistencia?.pct === 0 && r.body.asistencia?.dias === 2, JSON.stringify(r.body.asistencia));
dice("y no la asistencia de sus compañeros", !("1" in (r.body.asistencia || {})), "ok");

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
