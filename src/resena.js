/* ============================================================
   Pedir una reseña en Google Play, con cabeza
   ------------------------------------------------------------
   La app de Android es un Median.co (co.median.android.coachbaseai) que
   carga esta misma web en un WebView. Median trae el plugin «App Review»,
   que envuelve la API de reseñas in-app de Google: desde aquí se llama con
   `median.appreview.prompt(...)` y el diálogo lo pinta Play, no nosotros.

   Google limita cuántas veces puede aparecer ese diálogo y no dice si lo ha
   enseñado. Si se gasta el cupo con gente que acaba de entrar, cuando llegue
   un entrenador contento ya no habrá diálogo que enseñar. Por eso aquí no se
   pide nunca «porque sí»: solo después de que a alguien le acabe de salir
   bien algo que le ha costado trabajo, y solo si lleva tiempo usando la app.

   Fuera de la app de Android no hace absolutamente nada: en el navegador no
   existe el puente y la función se va por donde ha venido.
   ============================================================ */

/* ---- Umbrales. Todo lo que se puede querer ajustar, aquí arriba. ---- */
/* Quién puede ver el diálogo. Las familias NO: no eligen la app, se la pone
   el club, y una reseña pedida a quien no decidió nada no dice nada. El
   jugador tampoco (menor), ni el Master, ni la cuenta del club. */
export const ROLES_RESENA = ["director", "entrenador", "segundo", "delegado"];
/* Días desde el primer uso que registramos (la primera acción positiva). */
export const DIAS_PRIMER_USO = 7;
/* Acciones positivas acumuladas antes de pedir nada. */
export const ACCIONES_MINIMAS = 3;
/* Y una vez pedida, no se vuelve a pedir en mucho tiempo. */
export const DIAS_ENTRE_PETICIONES = 90;

/* Las tres cosas que cuentan como «le ha salido bien». Son trabajo de verdad
   terminado, no clics sueltos: ver dónde se llaman en App.jsx. */
export const MOTIVOS = ["partido", "convocatoria", "entrenamiento"];

const DIA = 86400000;
const clave = (id) => `cb_review_${id}`;

/* localStorage puede no estar (modo privado, almacenamiento bloqueado) y
   puede traer basura de una versión anterior: nunca debe tumbar un guardado
   que acaba de salir bien. */
const leer = (id) => {
  try {
    const d = JSON.parse(localStorage.getItem(clave(id)) || "{}");
    return d && typeof d === "object" ? d : {};
  } catch { return {}; }
};
const escribir = (id, datos) => {
  try { localStorage.setItem(clave(id), JSON.stringify(datos)); } catch { /* sin almacenamiento: esta vez no se cuenta */ }
};

/* El puente nativo, si lo hay. Primero el de Median, que es el que lleva la
   app; `window.AndroidReview` queda por si algún día se empaqueta con un
   WebView propio y una clase ReviewBridge. */
const puente = () => {
  try {
    if (typeof window === "undefined") return null;
    const m = window.median;
    if (m && m.appreview && typeof m.appreview.prompt === "function") return () => m.appreview.prompt({});
    const a = window.AndroidReview;
    if (a && typeof a.requestReview === "function") return () => a.requestReview();
  } catch { /* un puente que estalla al mirarlo es como no tenerlo */ }
  return null;
};

/* Acaba de salir bien algo (`motivo`). Lo apunta y, si toca, pide la reseña.
   Devuelve por qué ha hecho lo que ha hecho, que es lo que miran las pruebas
   y lo que deja rastro si algún día hay que depurarlo:
     "pedida" · "sin-puente" · "sin-sesion" · "demo" · "rol" · "pocos-dias"
     · "pocas-acciones" · "reciente"
   Nunca lanza: el sitio desde el que se llama acaba de guardar algo y no se
   puede quedar a medias porque la reseña falle. */
export function pedirResena(motivo, sesion, ahora = Date.now()) {
  try {
    const lanzar = puente();
    if (!lanzar) return "sin-puente";
    if (!sesion) return "sin-sesion";
    if (sesion.email === "demo") return "demo";
    if (sesion.role === "master" || !ROLES_RESENA.includes(sesion.role)) return "rol";

    const id = sesion.userId || sesion.email;
    if (!id) return "sin-sesion";
    const datos = leer(id);

    /* El primer uso es la primera vez que alguien llega hasta aquí: la
       primera acción positiva. Contarlo desde el registro sería más fiel,
       pero este dato no existía antes y así no hay nada que migrar; además
       se peca de tarde, que es el lado bueno por el que equivocarse. */
    const desde = Number(datos.desde) || ahora;
    const acciones = (Number(datos.acciones) || 0) + 1;
    const pedida = Number(datos.pedida) || 0;
    escribir(id, { ...datos, desde, acciones, ultimoMotivo: motivo });

    if (ahora - desde < DIAS_PRIMER_USO * DIA) return "pocos-dias";
    if (acciones < ACCIONES_MINIMAS) return "pocas-acciones";
    if (pedida && ahora - pedida < DIAS_ENTRE_PETICIONES * DIA) return "reciente";

    /* Se apunta ANTES de abrir el diálogo: si Google decide no enseñarlo
       -que no lo cuenta-, no se puede volver a intentar a la siguiente
       acción. Gastar el intento es justo lo que hay que evitar. */
    escribir(id, { ...datos, desde, acciones, ultimoMotivo: motivo, pedida: ahora });
    lanzar();
    return "pedida";
  } catch { return "sin-puente"; }
}
