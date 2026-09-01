/* Cuentas de Familia: se registran solas -sin invitación-, pero eligen un
   equipo YA existente y dicen el nombre y el dorsal de su hijo dentro de esa
   plantilla; no crean nada. Nacen Pendientes y no ven ni un dato del menor
   hasta que alguien del club las activa. Y, pase lo que pase, no escriben
   nada en ningún recurso: son de solo lectura por diseño, no solo por
   interfaz. */
import { fake, login, call, T } from "./run.mjs";
let ok=0, mal=0;
const dice=(n,c,e="")=>{(c?ok++:mal++);console.log(`${c?"✓":"✗"} ${n}${e?"  → "+e:""}`);};
const F=(t,r)=>fake.db[t].find(x=>x.id===r).fields;

const tClub = await login("club@a.com");

/* ---- Registro: hace falta un equipo real y un hijo real dentro ---- */
let r = await call("", { method: "POST", body: { action: "register", plan: "familia", name: "Marta Arenas", email: "marta@familia.com", password: "familia1234" } });
dice("sin equipo no se puede registrar", r.status === 400 && r.body.reason === "falta_equipo", JSON.stringify(r.body));

r = await call("", { method: "POST", body: { action: "register", plan: "familia", name: "Marta Arenas", email: "marta@familia.com", password: "familia1234", teamRec: "recSEN", hijoNombre: "Jugador 99", hijoDorsal: 99 } });
dice("un hijo que no existe en esa plantilla no cuela", r.status === 404 && r.body.reason === "hijo_no_encontrado", JSON.stringify(r.body));

r = await call("", { method: "POST", body: { action: "register", plan: "familia", name: "Marta Arenas", email: "marta@familia.com", password: "familia1234", teamRec: "recSEN", hijoNombre: "jugador 5", hijoDorsal: 5 } });
dice("con el nombre y el dorsal exactos de la plantilla sí se registra", r.body.ok === true && !!r.body.token, JSON.stringify(r.body).slice(0, 120));
dice("nace Pendiente, no Activa", F(T.USUARIOS, r.body.rec).fldEkbPe6UgCx0Lfy === "Pendiente", F(T.USUARIOS, r.body.rec).fldEkbPe6UgCx0Lfy);
const tFamiliaPendiente = r.body.token;

r = await call("", { method: "POST", body: { action: "register", plan: "familia", name: "Otra vez", email: "marta@familia.com", password: "x", teamRec: "recSEN", hijoNombre: "jugador 5", hijoDorsal: 5 } });
dice("el mismo correo no se puede registrar dos veces", r.body.reason === "exists", JSON.stringify(r.body));

/* ---- Mientras está Pendiente, ?res=hijo no enseña nada ---- */
r = await call("?res=hijo", { token: tFamiliaPendiente });
dice("pendiente de aprobar, no ve ni un dato de su hijo", r.body.ok === true && r.body.pendiente === true && r.body.hijo === null, JSON.stringify(r.body));

/* ---- Familia no escribe NADA, en ningún recurso, ni Pendiente ni Activa ---- */
r = await call("?id=recJ5", { method: "PATCH", token: tFamiliaPendiente, body: { fields: { Nombre: "Hackeado" } } });
dice("una cuenta familiar no puede escribir aunque lo intente a mano", r.status === 403, `${r.status} ${r.body.reason || ""}`);
r = await call("?res=lesiones", { method: "POST", token: tFamiliaPendiente, body: {} });
dice("tampoco con otro recurso cualquiera", r.status === 403, String(r.status));

/* ---- El club activa la cuenta ---- */
r = await call("?id=" + fake.db[T.USUARIOS].find(u => u.fields.fldJWlJ17YuZNe4Jx === "marta@familia.com").id,
  { method: "PATCH", token: tClub, body: { estado: "Activo" } });
dice("el club activa la cuenta familiar", r.body.ok === true, JSON.stringify(r.body));

/* ---- Ya activa, ?res=hijo enseña la ficha del hijo -y solo la suya- ---- */
r = await call("?res=hijo", { token: tFamiliaPendiente });
dice("activa, ve la ficha de su hijo", r.body.ok === true && r.body.pendiente === false && r.body.hijo?.Nombre === "Jugador 5", JSON.stringify(r.body).slice(0, 150));
dice("con su dorsal", Number(r.body.hijo?.Dorsal) === 5, String(r.body.hijo?.Dorsal));
dice("y no la plantilla entera -solo un jugador-", !Array.isArray(r.body.hijo?.records), "ok");

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
