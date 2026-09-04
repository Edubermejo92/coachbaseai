/* Padres/tutores y el propio jugador, vinculados desde la ficha del club:
   ya no hace falta que nadie se autorregistre adivinando nombre y dorsal.
   El club invita hasta 2 emails de familia y 1 del propio jugador -mismo
   candado de solo lectura, mismo "Es mi primera vez" para reclamar la
   cuenta que ya usa el resto del alta por invitación-. */
import { fake, login, call, T } from "./run.mjs";
let ok=0, mal=0;
const dice=(n,c,e="")=>{(c?ok++:mal++);console.log(`${c?"✓":"✗"} ${n}${e?"  → "+e:""}`);};
const F=(t,r)=>fake.db[t].find(x=>x.id===r).fields;

const tEnt = await login("ent@a.com");   // entrenador de recSEN
const tDir = await login("dir@a.com");   // director deportivo de C.D. Chamartín Vergara (recCLUBA)
const tDirB = await login("dir@b.com");  // director de otro club (recCLUBB)

/* ---- Sin jugador no hay nada que vincular ---- */
let r = await call("", { method: "POST", token: tEnt, body: { action: "vincularPariente", rol: "familia", name: "X", email: "x@x.com" } });
dice("sin jugador, 400", r.status === 400 && r.body.reason === "falta_jugador", JSON.stringify(r.body));

/* ---- El entrenador del equipo vincula al primer padre/madre ---- */
r = await call("", { method: "POST", token: tEnt, body: { action: "vincularPariente", jugadorRec: "recJ4", rol: "familia", name: "Marta Arenas", email: "marta8@familia.com" } });
dice("el entrenador del equipo vincula el primer email de familia", r.body.ok === true, JSON.stringify(r.body));
dice("nace Pendiente y sin contraseña", F(T.USUARIOS, r.body.rec).fldEkbPe6UgCx0Lfy === "Pendiente" && !F(T.USUARIOS, r.body.rec).fldVX372lPNj7Bab8, "ok");
const recFamilia1 = r.body.rec;

/* ---- Se ve en la lista de vinculados de ese jugador ---- */
r = await call("?res=parientes&jugador=recJ4", { token: tEnt });
dice("la ficha enseña el primer vinculado", r.body.ok === true && r.body.vinculados.length === 1 && r.body.vinculados[0].email === "marta8@familia.com", JSON.stringify(r.body));
dice("todavía sin reclamar", r.body.vinculados[0].reclamada === false, "ok");

/* ---- Un segundo padre/madre sí cabe (tope 2) ---- */
r = await call("", { method: "POST", token: tEnt, body: { action: "vincularPariente", jugadorRec: "recJ4", rol: "familia", name: "Pedro Arenas", email: "pedro8@familia.com" } });
dice("el segundo email de familia también entra", r.body.ok === true, JSON.stringify(r.body));

/* ---- Un tercero ya no cabe ---- */
r = await call("", { method: "POST", token: tEnt, body: { action: "vincularPariente", jugadorRec: "recJ4", rol: "familia", name: "Otro más", email: "otro8@familia.com" } });
dice("un tercer padre/madre para el mismo jugador se rechaza", r.status === 409 && r.body.reason === "tope_alcanzado", JSON.stringify(r.body));

/* ---- El propio jugador: un único acceso ---- */
r = await call("", { method: "POST", token: tEnt, body: { action: "vincularPariente", jugadorRec: "recJ4", rol: "jugador", name: "Jugador 5", email: "jugador5@club.com" } });
dice("se vincula el acceso del propio jugador", r.body.ok === true, JSON.stringify(r.body));
const recJugador5 = r.body.rec;
r = await call("", { method: "POST", token: tEnt, body: { action: "vincularPariente", jugadorRec: "recJ4", rol: "jugador", name: "Otra vez", email: "otro-jug@club.com" } });
dice("un segundo acceso de jugador para el mismo jugador se rechaza", r.status === 409 && r.body.reason === "tope_alcanzado", JSON.stringify(r.body));

/* ---- Email duplicado, rol inválido, datos que faltan ---- */
r = await call("", { method: "POST", token: tEnt, body: { action: "vincularPariente", jugadorRec: "recJ4", rol: "familia", name: "Duplicado", email: "marta8@familia.com" } });
dice("un email que ya tiene cuenta no se puede reusar", r.body.reason === "exists", JSON.stringify(r.body));
r = await call("", { method: "POST", token: tEnt, body: { action: "vincularPariente", jugadorRec: "recJ4", rol: "entrenador", name: "X", email: "colado@x.com" } });
dice("no se puede colar un rol que no sea familia o jugador", r.status === 400 && r.body.reason === "rol_no_permitido", JSON.stringify(r.body));
r = await call("", { method: "POST", token: tEnt, body: { action: "vincularPariente", jugadorRec: "recJ4", rol: "familia", name: "", email: "" } });
dice("faltan nombre y email", r.body.reason === "faltan_datos", JSON.stringify(r.body));

/* ---- Solo dentro del alcance de quien lo pide ---- */
r = await call("?res=jugadores&team=recIB", { method: "POST", token: tDir, body: { fields: { Nombre: "Jugador IB", Dorsal: 1, Equipo: ["recIB"] } } });
dice("se crea un jugador en Infantil B para probar el alcance", r.body.ok === true, JSON.stringify(r.body));
const jugIB = r.body.rec;
r = await call("", { method: "POST", token: tEnt, body: { action: "vincularPariente", jugadorRec: jugIB, rol: "familia", name: "X", email: "fuera-de-alcance@x.com" } });
dice("un entrenador no puede vincular en un equipo que no es el suyo", r.status === 403 && r.body.reason === "no_autorizado", JSON.stringify(r.body));
r = await call("", { method: "POST", token: tDirB, body: { action: "vincularPariente", jugadorRec: "recJ4", rol: "familia", name: "X", email: "otro-club@x.com" } });
dice("un director de OTRO club tampoco puede -aquí sí se comprueba el club-", r.status === 403 && r.body.reason === "no_autorizado", JSON.stringify(r.body));

/* ---- Familia y Jugador no pueden vincular ni desvincular nada -de solo lectura- ---- */
r = await call("?res=parientes&jugador=recJ4", { token: tEnt });
const totalAntes = r.body.vinculados.length;
r = await call("", { method: "POST", token: tEnt, body: { action: "vincularPariente", jugadorRec: "recJ4", rol: "familia", name: "X", email: "sobra@x.com" } });
dice("cuarto intento -por si acaso, sigue sin caber-", r.status === 409, String(r.status));

/* ---- Reclamar la cuenta: "Es mi primera vez", con el mismo correo ---- */
r = await call("", { method: "POST", body: { action: "register", plan: "oficial", name: "Marta Arenas", email: "marta8@familia.com", password: "familia1234" } });
dice("se reclama la cuenta con «Es mi primera vez»", r.body.ok === true && r.body.rol === "Familia" && !!r.body.token, JSON.stringify(r.body).slice(0, 140));
const tMarta = r.body.token;
r = await call("?res=hijo", { token: tMarta });
dice("ya activa, la madre ve la ficha del jugador vinculado", r.body.ok === true && r.body.hijo?.Nombre === "Jugador 5", JSON.stringify(r.body).slice(0, 120));

r = await call("", { method: "POST", body: { action: "register", plan: "oficial", name: "Jugador 5", email: "jugador5@club.com", password: "jugador1234" } });
dice("el propio jugador también reclama su cuenta igual", r.body.ok === true && r.body.rol === "Jugador", JSON.stringify(r.body).slice(0, 120));
const tJugador5 = r.body.token;
r = await call("?res=hijo", { token: tJugador5 });
dice("y ve su PROPIA ficha por el mismo camino", r.body.ok === true && r.body.hijo?.Nombre === "Jugador 5", JSON.stringify(r.body).slice(0, 120));

r = await call("?id=recJ5", { method: "PATCH", token: tMarta, body: { fields: { Nombre: "Hackeado" } } });
dice("una vez reclamada, sigue sin poder escribir nada", r.status === 403, String(r.status));
r = await call("?id=recJ5", { method: "PATCH", token: tJugador5, body: { fields: { Nombre: "Hackeado" } } });
dice("tampoco el propio jugador", r.status === 403, String(r.status));

/* ---- Leen lo de SU equipo -de eso viven sus pestañas- y nada más ----
   Familia y Jugador ven alineación, calendario, cargas, asistencia y
   disciplina del equipo de su hijo/suyo, así que necesitan LEER esos
   recursos. Lo que no pueden es asomarse a otra categoría del club. */
r = await call("?res=jugadores&team=recSEN", { token: tMarta });
dice("la familia lee la plantilla de SU equipo", r.status === 200 && (r.body.records || []).length === 19, `${r.status} ${(r.body.records || []).length}`);
r = await call("?res=asistencia&team=recSEN", { token: tJugador5 });
dice("y el jugador la asistencia de SU equipo", r.status === 200 && typeof r.body.asistencia === "string", JSON.stringify(r.body).slice(0, 80));
r = await call("?res=jugadores&team=recIB", { token: tMarta });
dice("pero no la plantilla de otra categoría del club", r.status === 403, String(r.status));
r = await call("?res=alineacion&team=recSEN", { token: tMarta });
dice("y la familia lee la alineación de SU equipo", r.status === 200, JSON.stringify(r.body));
r = await call("?res=alineacion&team=recSEN", { method: "POST", token: tJugador5, body: { alineacion: "{}" } });
dice("pero ni la familia ni el jugador pueden escribirla", r.status === 403, String(r.status));

/* ---- La ficha ya enseña quién ha reclamado y quién sigue Pendiente ---- */
r = await call("?res=parientes&jugador=recJ4", { token: tEnt });
const marta = r.body.vinculados.find((v) => v.email === "marta8@familia.com");
const pedro = r.body.vinculados.find((v) => v.email === "pedro8@familia.com");
dice("la madre ya sale reclamada", marta?.reclamada === true && marta?.estado === "Activo", JSON.stringify(marta));
dice("el padre sigue pendiente", pedro?.reclamada === false, JSON.stringify(pedro));

/* ---- Quitar el acceso ---- */
r = await call("", { method: "POST", token: "" , body: { action: "desvincularPariente", usuarioRec: recFamilia1 } });
dice("sin sesión no se puede desvincular", r.status === 403 || r.status === 401, String(r.status));
r = await call("", { method: "POST", token: tEnt, body: { action: "desvincularPariente", usuarioRec: recFamilia1 } });
dice("el entrenador del equipo quita un acceso", r.body.ok === true, JSON.stringify(r.body));
r = await call("?res=parientes&jugador=recJ4", { token: tEnt });
dice("ya no sale en la lista", !r.body.vinculados.some((v) => v.rec === recFamilia1), "ok");
dice("y ahora sí cabría un tercer email de familia", r.body.vinculados.filter((v) => v.rol === "familia").length === 1, JSON.stringify(r.body.vinculados));

/* ---- Desvincular queda reservado a Familia/Jugador: no cuela para colarse a borrar a nadie más ---- */
const recEnt = fake.db[T.USUARIOS].find((u) => u.fields.fldJWlJ17YuZNe4Jx === "ent@a.com").id;
r = await call("", { method: "POST", token: tDir, body: { action: "desvincularPariente", usuarioRec: recEnt } });
dice("no se puede usar este camino para borrar una cuenta de entrenador", r.status === 403 && r.body.reason === "no_autorizado", JSON.stringify(r.body));

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
