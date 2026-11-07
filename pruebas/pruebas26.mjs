/* Pedir reseña en Google Play (src/resena.js).
   Google limita cuántas veces se puede enseñar el diálogo y no dice si lo ha
   enseñado: si se gasta el cupo con quien acaba de entrar, cuando llegue un
   entrenador contento ya no quedará diálogo. Así que lo que se comprueba
   aquí es sobre todo cuándo NO se pide.
   Son funciones puras sobre localStorage: no hace falta ni navegador ni la
   función de Netlify, basta con fingir window y localStorage. */
let ok = 0, mal = 0;
const dice = (n, c, e = "") => { (c ? ok++ : mal++); console.log(`${c ? "✓" : "✗"} ${n}${e ? "  → " + e : ""}`); };

const DIA = 86400000;
let almacen = {};
globalThis.localStorage = {
  getItem: (k) => (k in almacen ? almacen[k] : null),
  setItem: (k, v) => { almacen[k] = String(v); },
  removeItem: (k) => { delete almacen[k]; },
};
let pedidas = [];
globalThis.window = {};
const conPuenteMedian = () => { window.median = { appreview: { prompt: (o) => pedidas.push(o) } }; delete window.AndroidReview; };
const sinPuente = () => { delete window.median; delete window.AndroidReview; };
const limpiar = () => { almacen = {}; pedidas = []; };

const { pedirResena, ROLES_RESENA, DIAS_PRIMER_USO, ACCIONES_MINIMAS, DIAS_ENTRE_PETICIONES } = await import("../src/resena.js");

const ENTRENADOR = { userId: "recENT", email: "ent@a.com", role: "entrenador" };
const T0 = Date.UTC(2026, 0, 10);
const VIEJO = T0 + (DIAS_PRIMER_USO + 1) * DIA;
/* Deja la cuenta con `n` acciones ya hechas y la antigüedad suficiente. */
const conHistorial = (n, extra = {}) => {
  almacen[`cb_review_${ENTRENADOR.userId}`] = JSON.stringify({ desde: T0, acciones: n, ...extra });
};

/* ---- fuera de la app de Android no pasa nada ---- */
limpiar(); sinPuente();
dice("sin puente nativo (navegador normal) no se pide nada",
  pedirResena("partido", ENTRENADOR, VIEJO) === "sin-puente" && pedidas.length === 0);
dice("y tampoco se escribe nada en el dispositivo", Object.keys(almacen).length === 0);

/* ---- quién no entra ---- */
conPuenteMedian();
limpiar(); conHistorial(ACCIONES_MINIMAS);
dice("el Master no ve el diálogo", pedirResena("partido", { ...ENTRENADOR, role: "master" }, VIEJO) === "rol" && !pedidas.length);
limpiar(); conHistorial(ACCIONES_MINIMAS);
dice("la demo tampoco", pedirResena("partido", { ...ENTRENADOR, email: "demo" }, VIEJO) === "demo" && !pedidas.length);
limpiar(); conHistorial(ACCIONES_MINIMAS);
dice("una familia tampoco: no eligió la app, se la puso el club",
  pedirResena("partido", { ...ENTRENADOR, role: "familia" }, VIEJO) === "rol" && !pedidas.length);
limpiar(); conHistorial(ACCIONES_MINIMAS);
dice("ni un jugador (es menor)", pedirResena("partido", { ...ENTRENADOR, role: "jugador" }, VIEJO) === "rol" && !pedidas.length);
limpiar(); conHistorial(ACCIONES_MINIMAS);
dice("ni la cuenta del club", pedirResena("partido", { ...ENTRENADOR, role: "club" }, VIEJO) === "rol" && !pedidas.length);
limpiar();
dice("sin sesión no revienta", pedirResena("partido", null, VIEJO) === "sin-sesion" && !pedidas.length);

/* ---- los cuatro roles que sí ---- */
for (const rol of ROLES_RESENA) {
  limpiar(); conHistorial(ACCIONES_MINIMAS);
  dice(`${rol}: con antigüedad y acciones de sobra, se pide`,
    pedirResena("partido", { ...ENTRENADOR, role: rol }, VIEJO) === "pedida" && pedidas.length === 1);
}

/* ---- hay que haberla usado ---- */
limpiar();
dice("la primera acción no pide nada (ni días ni acciones)", pedirResena("partido", ENTRENADOR, T0) === "pocos-dias" && !pedidas.length);
limpiar(); conHistorial(ACCIONES_MINIMAS);
dice("con muchas acciones pero recién llegado, tampoco",
  pedirResena("partido", ENTRENADOR, T0 + 2 * DIA) === "pocos-dias" && !pedidas.length);
limpiar(); conHistorial(ACCIONES_MINIMAS - 2); // esta llamada suma la que falta para quedarse en 2
dice(`con ${ACCIONES_MINIMAS - 1} acciones no se pide`, pedirResena("partido", ENTRENADOR, VIEJO) === "pocas-acciones" && !pedidas.length);
dice(`y a la ${ACCIONES_MINIMAS}ª sí`, pedirResena("convocatoria", ENTRENADOR, VIEJO) === "pedida" && pedidas.length === 1);

/* ---- las acciones se van acumulando solas ---- */
limpiar(); conHistorial(0); // lleva tiempo con la app, pero aún no ha hecho nada
const pasos = ["partido", "convocatoria", "entrenamiento"].map((m) => pedirResena(m, ENTRENADOR, VIEJO));
dice("tres acciones de alguien veterano: solo la tercera la pide",
  pasos.join(",") === "pocas-acciones,pocas-acciones,pedida" && pedidas.length === 1, pasos.join(", "));

/* El contador sube aunque todavía no toque pedir: si no, nunca llegaría a 3. */
limpiar(); conHistorial(0);
pedirResena("partido", ENTRENADOR, VIEJO);
dice("cada acción se apunta aunque no se pida nada",
  Number(JSON.parse(almacen[`cb_review_${ENTRENADOR.userId}`]).acciones) === 1);

/* La cuenta atrás de los 7 días arranca en la primera acción, no antes. */
limpiar();
dice("a quien empieza hoy se le empieza a contar hoy",
  pedirResena("partido", ENTRENADOR, T0) === "pocos-dias" &&
  Number(JSON.parse(almacen[`cb_review_${ENTRENADOR.userId}`]).desde) === T0);

/* ---- y no se repite ---- */
limpiar(); conHistorial(ACCIONES_MINIMAS);
pedirResena("partido", ENTRENADOR, VIEJO);
dice("justo después no se vuelve a pedir",
  pedirResena("convocatoria", ENTRENADOR, VIEJO + DIA) === "reciente" && pedidas.length === 1);
dice(`ni a los ${DIAS_ENTRE_PETICIONES - 1} días`,
  pedirResena("partido", ENTRENADOR, VIEJO + (DIAS_ENTRE_PETICIONES - 1) * DIA) === "reciente" && pedidas.length === 1);
dice(`a los ${DIAS_ENTRE_PETICIONES + 1} sí`,
  pedirResena("partido", ENTRENADOR, VIEJO + (DIAS_ENTRE_PETICIONES + 1) * DIA) === "pedida" && pedidas.length === 2);

/* ---- detalles de la cuenta y del dispositivo ---- */
limpiar(); conHistorial(ACCIONES_MINIMAS);
pedirResena("partido", ENTRENADOR, VIEJO);
dice("la fecha se apunta ANTES de abrir el diálogo (Google no dice si lo enseñó)",
  Number(JSON.parse(almacen[`cb_review_${ENTRENADOR.userId}`]).pedida) === VIEJO);
limpiar(); conHistorial(ACCIONES_MINIMAS);
pedirResena("partido", ENTRENADOR, VIEJO);
dice("cada cuenta lleva su propia cuenta atrás",
  pedirResena("partido", { ...ENTRENADOR, userId: "recOTRO" }, VIEJO) === "pocos-dias" && pedidas.length === 1);

limpiar();
almacen[`cb_review_${ENTRENADOR.userId}`] = "{{ esto no es JSON";
dice("un dato corrupto no tumba el guardado que acaba de salir bien",
  pedirResena("partido", ENTRENADOR, VIEJO) === "pocos-dias");

limpiar(); conHistorial(ACCIONES_MINIMAS);
const guardar = globalThis.localStorage.setItem;
globalThis.localStorage.setItem = () => { throw new Error("almacenamiento bloqueado"); };
const r = pedirResena("partido", ENTRENADOR, VIEJO);
globalThis.localStorage.setItem = guardar;
dice("con el almacenamiento bloqueado tampoco revienta", ["pedida", "sin-puente"].includes(r), r);

/* ---- el otro puente, por si algún día se empaqueta a mano ---- */
limpiar(); conHistorial(ACCIONES_MINIMAS);
delete window.median;
let nativas = 0;
window.AndroidReview = { requestReview: () => { nativas++; } };
dice("si hubiera un WebView propio con AndroidReview, también vale",
  pedirResena("partido", ENTRENADOR, VIEJO) === "pedida" && nativas === 1);

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
