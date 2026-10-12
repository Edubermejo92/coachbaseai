/* Cola de sincronización sin conexión (src/sincro.js): qué entra en la
   cola, cómo se agrupa, el orden al vaciarla, los reintentos, los rechazos,
   las altas con su rec y que la cola de una persona no la envíe otra. */
import { crearSincro, clasificar, fusionar, CLAVE_COLA, CLAVE_ULTIMA, MAX_INTENTOS } from "../src/sincro.js";
let ok = 0, mal = 0;
const dice = (n, c, e = "") => { (c ? ok++ : mal++); console.log(`${c ? "✓" : "✗"} ${n}${e ? "  → " + e : ""}`); };

const AIR = "/.netlify/functions/airtable";
const body = (o) => JSON.stringify(o);

/* ---- clasificar ---- */
dice("GET nunca va a la cola", clasificar(`${AIR}?res=jugadores&team=recT`, "GET") === null);
dice("login (POST sin res ni id) nunca va a la cola", clasificar(AIR, "POST", body({ action: "login" })) === null);
dice("escudo no va a la cola", clasificar(`${AIR}?res=escudo&id=recC`, "POST") === null);
dice("foto de jugador no va a la cola", clasificar(`${AIR}?res=foto-jugador&id=recJ`, "POST") === null);
dice("otra URL no va a la cola", clasificar(`/api/otra?res=cargas`, "POST") === null);
const doc = clasificar(`${AIR}?res=cargas&team=recT`, "POST", body({ cargas: "{}" }));
dice("documento: se sustituye por equipo", doc && doc.modo === "sustituir" && doc.clave === "doc cargas recT");
const pat = clasificar(`${AIR}?res=jugadores&id=recJ`, "PATCH", body({ fields: { Molestia: "x" } }));
dice("PATCH de registro: se fusiona", pat && pat.modo === "fusionar" && pat.clave === "PATCH jugadores recJ");
dice("PATCH de usuario (?id= sin res)", clasificar(`${AIR}?id=recU`, "PATCH", body({ rol: "x" }))?.clave === "PATCH recU");
dice("DELETE de registro", clasificar(`${AIR}?res=partidos&id=recP`, "DELETE")?.baja === true);
dice("alta sin clave local NO va a la cola", clasificar(`${AIR}?res=jugadores`, "POST", body({ fields: {} })) === null);
const alta = clasificar(`${AIR}?res=jugadores`, "POST", body({ fields: {} }), { alta: 17 });
dice("alta con clave local: va a la cola y se sustituye", alta && alta.clave === "alta jugadores 17" && alta.alta.local === "17");
const inc = clasificar(`${AIR}?res=incidencias`, "POST", body({ action: "create", row: {} }));
dice("alta de incidencia: va a la cola sin agrupar", inc && inc.modo === "unico");
dice("convocatoria enviada: una por equipo y fecha",
  clasificar(`${AIR}?res=convocatoria-enviada`, "POST", body({ team: "recT", fecha: "2026-10-18" }))?.clave === "conv recT 2026-10-18");
dice("fusionar une campos y {fields}",
  fusionar(body({ fields: { a: 1, b: 1 } }), body({ fields: { b: 2, c: 3 } })) === body({ fields: { a: 1, b: 2, c: 3 } }));

/* ---- cola ---- */
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m }; };
const resp = (status, obj = {}) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });

let red = false;
let enviados = [];
let contestar = () => resp(200, { ok: true });
const alm = mem();
const S = crearSincro({ almacen: alm, enLinea: () => red, enviar: async (it) => { enviados.push(it); return contestar(it); } });
S.fijarUsuario("a@club.es");
const en = (url, metodo, cuerpo, cola) => S.encolar({ url, metodo, cuerpo }, clasificar(url, metodo, cuerpo, cola));

en(`${AIR}?res=cargas&team=recT`, "POST", body({ cargas: "v1" }));
en(`${AIR}?res=jugadores&id=recJ`, "PATCH", body({ fields: { Estado: "Lesionado" } }));
en(`${AIR}?res=cargas&team=recT`, "POST", body({ cargas: "v2" }));
en(`${AIR}?res=jugadores&id=recJ`, "PATCH", body({ fields: { Molestia: "rodilla" } }));
dice("dos guardados del mismo documento se quedan en uno", S._cola().filter((x) => x.clave === "doc cargas recT").length === 1);
dice("se guarda el último", JSON.parse(S._cola().find((x) => x.clave === "doc cargas recT").cuerpo).cargas === "v2");
dice("dos PATCH al mismo jugador se fusionan",
  JSON.stringify(JSON.parse(S._cola().find((x) => x.clave === "PATCH jugadores recJ").cuerpo).fields) === JSON.stringify({ Estado: "Lesionado", Molestia: "rodilla" }));
dice("estado: 2 pendientes", S.estado().pendientes === 2);
dice("la cola sobrevive en el almacén", JSON.parse(alm.getItem(CLAVE_COLA)).length === 2);

await S.vaciar();
dice("sin red no se envía nada", enviados.length === 0 && S.estado().pendientes === 2);

/* Recargar la página: otra instancia lee la misma cola. */
const S2 = crearSincro({ almacen: alm, enLinea: () => red, enviar: async (it) => { enviados.push(it); return contestar(it); } });
S2.fijarUsuario("a@club.es");
dice("tras recargar sigue habiendo 2 pendientes", S2.estado().pendientes === 2);

red = true;
const n = await S2.vaciar();
dice("con red se envían los 2", n === 2 && enviados.length === 2 && S2.estado().pendientes === 0);
dice("en el orden de la última vez que se tocaron", enviados[0].clave === "doc cargas recT" && enviados[1].clave === "PATCH jugadores recJ");
dice("queda apuntada la última sincronización", typeof S2.estado().ultima === "number" && alm.getItem(CLAVE_ULTIMA));

/* Borrar un registro descarta sus cambios pendientes. */
red = false; enviados = [];
const en2 = (url, metodo, cuerpo, cola) => S2.encolar({ url, metodo, cuerpo }, clasificar(url, metodo, cuerpo, cola));
en2(`${AIR}?res=partidos&id=recP`, "PATCH", body({ fields: { Hora: "10:00" } }));
en2(`${AIR}?res=partidos&id=recP`, "DELETE", null);
dice("borrar un partido quita su PATCH pendiente", S2._cola().length === 1 && S2._cola()[0].metodo === "DELETE");

/* Fallo transitorio: se para y no se pierde nada. */
red = true; contestar = () => resp(503, { error: "SERVICE_UNAVAILABLE" });
await S2.vaciar();
dice("un 503 deja el cambio en la cola", S2.estado().pendientes === 1 && S2.estado().error?.tipo === "red");
contestar = () => { throw new TypeError("Failed to fetch"); };
await S2.vaciar();
dice("un corte de red deja el cambio en la cola", S2.estado().pendientes === 1);

/* Sesión caducada: se para y se conserva. */
contestar = () => resp(401, { error: "no_autorizado" });
await S2.vaciar();
dice("un 401 conserva la cola y avisa de la sesión", S2.estado().pendientes === 1 && S2.estado().error?.tipo === "sesion");

/* Rechazo definitivo: se descarta y se avisa, sin bloquear lo de detrás. */
en2(`${AIR}?res=cargas&team=recT`, "POST", body({ cargas: "v3" }));
let llamadas = 0;
contestar = () => (++llamadas === 1 ? resp(403, { reason: "Sin permiso" }) : resp(200, { ok: true }));
enviados = [];
await S2.vaciar();
dice("un 403 se descarta y lo siguiente se envía", S2.estado().pendientes === 0 && enviados.length === 2);
dice("y el motivo queda para enseñarlo", S2.estado().error?.tipo === "rechazo" && S2.estado().error.texto === "Sin permiso");

/* Altas: una sola aunque se guarde dos veces, y el rec vuelve a la app. */
red = false; contestar = () => resp(200, { rec: "recNUEVO" });
let creados = [];
const quita = S2.alCrear((x) => creados.push(x));
en2(`${AIR}?res=jugadores`, "POST", body({ fields: { Nombre: "Leo" } }), { alta: 42 });
en2(`${AIR}?res=jugadores`, "POST", body({ fields: { Nombre: "Leo M." } }), { alta: 42 });
dice("dos altas del mismo jugador local son una", S2._cola().filter((x) => x.clave === "alta jugadores 42").length === 1);
red = true; enviados = [];
await S2.vaciar();
dice("se envía el alta con los últimos datos", enviados.length === 1 && JSON.parse(enviados[0].cuerpo).fields.Nombre === "Leo M.");
dice("la app recibe el rec del jugador 42", creados.length === 1 && creados[0].res === "jugadores" && creados[0].local === "42" && creados[0].rec === "recNUEVO");
quita();

/* Cancelar un alta (se borra el jugador antes de subirlo). */
red = false;
en2(`${AIR}?res=partidos`, "POST", body({ fields: {} }), { alta: 7 });
S2.cancelarAlta("partidos", 7);
dice("borrar un partido aún no subido cancela su alta", S2.estado().pendientes === 0);

/* Otra persona entra en el mismo móvil: no envía lo de la anterior. */
en2(`${AIR}?res=cargas&team=recT`, "POST", body({ cargas: "de A" }));
S2.fijarUsuario("b@club.es");
dice("al entrar otra persona se descarta la cola de la anterior", S2.estado().pendientes === 0 && S2._cola().length === 0);

/* Dos vaciados a la vez no envían dos veces lo mismo. */
S2.fijarUsuario("b@club.es");
en2(`${AIR}?res=plan&team=recT`, "POST", body({ plan: "x" }));
red = true; enviados = []; contestar = async () => { await new Promise((r) => setTimeout(r, 20)); return resp(200, {}); };
await Promise.all([S2.vaciar(), S2.vaciar(), S2.vaciar()]);
dice("tres vaciados a la vez = un solo envío", enviados.length === 1);

/* Un 500 que se repite con el mismo cambio no tapa la cola para siempre. */
en2(`${AIR}?res=jugadores&id=recMALO`, "PATCH", body({ fields: { x: 1 } }));
en2(`${AIR}?res=plan&team=recT`, "POST", body({ plan: "detrás" }));
contestar = (it) => (it.clave === "PATCH jugadores recMALO" ? resp(500, { error: "boom" }) : resp(200, {}));
enviados = [];
for (let k = 0; k < MAX_INTENTOS - 1; k++) await S2.vaciar();
dice("antes del tope sigue en la cola y lo de detrás espera", S2.estado().pendientes === 2 && !enviados.some((x) => x.clave.startsWith("doc plan")));
await S2.vaciar();
dice("al llegar al tope se descarta y sale lo de detrás", S2.estado().pendientes === 0 && enviados.some((x) => x.clave === "doc plan recT"));
dice("y se avisa del rechazo", S2.estado().error?.tipo === "rechazo");
contestar = () => { throw new TypeError("Failed to fetch"); };
en2(`${AIR}?res=plan&team=recT`, "POST", body({ plan: "sin red" }));
for (let k = 0; k < MAX_INTENTOS + 2; k++) await S2.vaciar();
dice("sin red no hay tope: se espera lo que haga falta", S2.estado().pendientes === 1);
contestar = () => resp(200, {}); await S2.vaciar();

/* El estado avisa a quien escucha (el icono de la cabecera). */
let avisos = 0;
const des = S2.suscribir(() => avisos++);
en2(`${AIR}?res=plan&team=recT`, "POST", body({ plan: "y" }));
des();
dice("encolar avisa al icono", avisos > 0);

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
