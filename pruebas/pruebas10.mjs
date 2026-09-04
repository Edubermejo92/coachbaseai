/* Foto y datos personales (nombre, posición) de UN jugador: la única
   excepción a que Familia y Jugador sean de solo lectura, y solo para la
   ficha a la que están vinculados -nunca la de un compañero-. */
import { fake, login, call, T } from "./run.mjs";
let ok=0, mal=0;
const dice=(n,c,e="")=>{(c?ok++:mal++);console.log(`${c?"✓":"✗"} ${n}${e?"  → "+e:""}`);};

const tEnt = await login("ent@a.com");   // entrenador de recSEN

/* ---- Se registra y activa una familia vinculada a Jugador 5 (recJ4) ---- */
let r = await call("", { method: "POST", body: { action: "register", plan: "familia", name: "Marta Arenas", email: "marta10@familia.com", password: "familia1234", teamRec: "recSEN", hijoNombre: "jugador 5", hijoDorsal: 5 } });
dice("se registra la familia de Jugador 5", r.body.ok === true, JSON.stringify(r.body).slice(0, 100));
const tFamilia = r.body.token;
r = await call("?id=" + fake.db[T.USUARIOS].find((u) => u.fields.fldJWlJ17YuZNe4Jx === "marta10@familia.com").id,
  { method: "PATCH", token: tEnt, body: { estado: "Activo" } });
dice("el entrenador activa la cuenta familiar", r.body.ok === true, JSON.stringify(r.body));

/* ---- Foto: la familia SÍ puede subirla, pero solo la de su hijo ---- */
r = await call("?res=foto-jugador&id=recJ4", { method: "POST", token: tFamilia, body: { file: "ZmFrZQ==", contentType: "image/jpeg", filename: "x.jpg" } });
dice("la familia sube la foto de SU hijo", r.body.ok === true, JSON.stringify(r.body));
r = await call("?res=foto-jugador&id=recJ0", { method: "POST", token: tFamilia, body: { file: "ZmFrZQ==", contentType: "image/jpeg" } });
dice("pero no la de un compañero", r.status === 403 && r.body.error === "no_autorizado", JSON.stringify(r.body));
r = await call("?res=foto-jugador", { method: "POST", token: tFamilia, body: {} });
dice("sin id de jugador, 400", r.status === 400, String(r.status));

/* ---- Datos personales: nombre y posición, solo del hijo propio ---- */
r = await call("?res=datos-jugador&id=recJ4", { method: "POST", token: tFamilia, body: { nombre: "Jugador Cinco", posicion: "DC" } });
dice("la familia cambia el nombre y la posición de SU hijo", r.body.ok === true, JSON.stringify(r.body));
dice("y queda guardado de verdad", fake.db[T.JUGADORES].find((j) => j.id === "recJ4").fields.Nombre === "Jugador Cinco", fake.db[T.JUGADORES].find((j) => j.id === "recJ4").fields.Nombre);
r = await call("?res=datos-jugador&id=recJ0", { method: "POST", token: tFamilia, body: { nombre: "Hackeado" } });
dice("pero no los de un compañero", r.status === 403 && r.body.error === "no_autorizado", JSON.stringify(r.body));
r = await call("?res=datos-jugador&id=recJ4", { method: "POST", token: tFamilia, body: { nombre: "" } });
dice("un nombre vacío se rechaza", r.body.reason === "falta_nombre", JSON.stringify(r.body));
r = await call("?res=datos-jugador&id=recJ4", { method: "POST", token: tFamilia, body: { nombre: "Jugador Cinco", posicion: "Portero-estrella; DROP TABLE" } });
dice("una posición inventada se rechaza -no se cuela como opción nueva-", r.status === 400 && r.body.reason === "posicion_no_valida", JSON.stringify(r.body));

/* ---- Sigue sin poder tocar nada más: la excepción es solo esos dos recursos ---- */
r = await call("?id=recJ4", { method: "PATCH", token: tFamilia, body: { fields: { Estado: "Lesionado" } } });
dice("el estado del jugador sigue fuera de su alcance", r.status === 403, String(r.status));
r = await call("?res=asistencia&team=recSEN", { method: "POST", token: tFamilia, body: { asistencia: "{}" } });
dice("y cualquier otro recurso también", r.status === 403, String(r.status));

/* ---- El cuerpo técnico conserva su acceso de siempre ---- */
r = await call("?res=foto-jugador&id=recJ0", { method: "POST", token: tEnt, body: { file: "ZmFrZQ==", contentType: "image/jpeg" } });
dice("el entrenador sube la foto de cualquiera de su plantilla", r.body.ok === true, JSON.stringify(r.body));
r = await call("?res=datos-jugador&id=recJ0", { method: "POST", token: tEnt, body: { nombre: "Jugador Uno", posicion: "POR" } });
dice("y le cambia nombre y posición igual que siempre", r.body.ok === true, JSON.stringify(r.body));

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
