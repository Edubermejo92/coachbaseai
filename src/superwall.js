/* ============================================================
   Superwall en la web (paywalls y tests A/B)
   ------------------------------------------------------------
   Superwall decide QUÉ paywall se enseña, a quién y cuándo (campañas,
   audiencias, experimentos) desde su panel. Quien cobra y quien decide si
   alguien es PRO sigue siendo nuestro Stripe:
   - El botón de compra de un paywall no cobra en Superwall: el SDK avisa con
     `transaction_start` y aquí se abre nuestro checkout de Stripe con el plan
     que corresponda (ver PLAN_DE_PRODUCTO).
   - Si alguien es PRO lo dice nuestro backend, y se le pasa a Superwall con
     setSubscriptionStatus. Por eso va con un PurchaseController propio: el
     automático de Superwall llevaría su propia cuenta de suscripciones.

   Sin VITE_SUPERWALL_WEB_KEY no se carga nada (ni el código del SDK, que va
   aparte con import() dinámico) y todas las funciones de aquí no hacen nada:
   la app se comporta como siempre. La clave es la pública (pk_…) de una app
   de tipo Web en el panel de Superwall; las de iOS y Android no sirven aquí.

   Sin React a propósito, como sincro.js: App.jsx le pasa lo que necesita
   (abrir el checkout, volver a leer la suscripción, abrir un apartado).
   ============================================================ */

/* El motor de reglas de Superwall (WebAssembly) se sirve como archivo propio:
   ver superscriptSoloUrl en vite.config.js. `?url` solo da la dirección; el
   archivo no se descarga hasta que Superwall evalúa una regla. */
import superscriptWasmUrl from "../node_modules/@superwall/superscript/dist/target/web/superscript_bg.wasm?url";

const CLAVE = String(import.meta.env?.VITE_SUPERWALL_WEB_KEY || "").trim();

/* Producto del paywall -> plan de nuestro Stripe (la misma clave que
   entiende stripe.mts). En el panel de Superwall, los productos de los
   paywalls de CoachBase tienen que llamarse así (o con el price_id de Stripe)
   y NO ir con el checkout de Stripe de Superwall: si no, cobraría Superwall. */
const PLAN_DE_PRODUCTO = {
  mensual: "mensual",
  temporada: "temporada",
  club_s: "club_s",
  club_m: "club_m",
  club_l: "club_l",
  price_1TxatlHuBVT1cFkv7MVZ5Zjv: "mensual",
  price_1TxtqeHuBVT1cFkvF1XzDMcP: "temporada",
  price_1TxtqkHuBVT1cFkv2X2R9Q69: "club_s",
  price_1TxtqsHuBVT1cFkvSnpwAwgY: "club_m",
  price_1TxtqxHuBVT1cFkvTeJDrEkK: "club_l",
};
export const planDeProducto = (id) => PLAN_DE_PRODUCTO[String(id || "").trim()] || null;

/* Lo que da el PRO, como "entitlement" de Superwall. Un solo nivel: con
   cualquiera de nuestros planes de pago se tiene todo. */
const ENTITLEMENT_PRO = {
  id: "pro",
  type: "SERVICE_LEVEL",
  isActive: true,
  productIds: ["mensual", "temporada", "club_s", "club_m", "club_l"],
};

/* Vista previa de paywalls en el propio navegador: abrir la app con
   ?sw_test=1 pone el SDK en modo prueba (compras simuladas, sin pasar por
   Stripe) hasta cerrar la pestaña; ?sw_test=0 lo quita. */
const leerModoPrueba = () => {
  if (typeof window === "undefined") return false;
  try {
    const q = new URLSearchParams(window.location.search).get("sw_test");
    if (q === "1") sessionStorage.setItem("cb_sw_test", "1");
    if (q === "0") sessionStorage.removeItem("cb_sw_test");
    return sessionStorage.getItem("cb_sw_test") === "1";
  } catch { return false; }
};

let arranque = null;   // Promise<Superwall|null>
let acciones = {};     // { checkout(plan), restaurar(): Promise<boolean|null>, abrirApartado(k) }
let ultimoCheckout = 0;

export const superwallConfigurable = () => !!CLAVE;

/* Un solo checkout por toque: el SDK puede avisar por dos caminos (el
   evento y el PurchaseController) de la misma compra. */
const lanzarCheckout = (plan) => {
  if (!plan || !acciones.checkout) return false;
  if (Date.now() - ultimoCheckout < 4000) return true;
  ultimoCheckout = Date.now();
  acciones.checkout(plan);
  return true;
};

const conSuperwall = async (fn) => {
  if (!arranque) return null;
  const sw = await arranque;
  if (!sw) return null;
  try { return await fn(sw); } catch (e) { console.warn("[superwall]", e); return null; }
};

/* Configurar Superwall. Se llama al entrar con una cuenta del cuerpo técnico
   (nunca familias, jugadores ni la demo). Llamarla otra vez solo actualiza
   las acciones. */
export function iniciarSuperwall(nuevasAcciones) {
  acciones = { ...acciones, ...nuevasAcciones };
  if (!CLAVE || typeof window === "undefined") return null;
  if (arranque) return arranque;
  const modoPrueba = leerModoPrueba();
  globalThis.SUPERWALL_SUPERSCRIPT_WASM_URL = superscriptWasmUrl;
  arranque = import("@superwall/paywalls-js")
    .then(({ createSuperwall }) => {
      const sw = createSuperwall({
        apiKey: CLAVE,
        purchaseController: {
          async purchase(product) {
            return lanzarCheckout(planDeProducto(product?.id))
              ? { type: "pending" }
              : { type: "failed", error: new Error(`Producto sin plan de CoachBase: ${product?.id}`) };
          },
          async restorePurchases() {
            const pro = await acciones.restaurar?.();
            return pro == null
              ? { type: "failed", error: new Error("No se pudo consultar la suscripción") }
              : { type: "restored" };
          },
        },
        delegate: {
          /* Enlaces del paywall a un apartado de la app: ?tab=… o
             coachbase://alineacion */
          onPaywallWillOpenDeepLink(url) {
            const k = apartadoDeEnlace(url);
            if (k) { sw.dismiss("systemLogic"); acciones.abrirApartado?.(k); }
          },
        },
        options: {
          testModeBehavior: modoPrueba ? "always" : "automatic",
          isSandbox: modoPrueba,
          logging: { level: modoPrueba ? "debug" : "warn" },
        },
      });
      /* El botón de compra del paywall: el SDK no cobra, avisa. Lo cobra
         nuestro Stripe. En modo prueba la compra es simulada y no se toca. */
      sw.events.addEventListener("transaction_start", (e) => {
        if (modoPrueba) return;
        lanzarCheckout(planDeProducto(e?.detail?.product?.id));
      });
      return sw.ready.then(() => sw, () => sw);
    })
    .catch((e) => { console.warn("[superwall] no se pudo cargar", e); return null; });
  return arranque;
}

const apartadoDeEnlace = (url) => {
  try {
    const u = new URL(String(url), window.location.origin);
    if (u.protocol === "coachbase:") return (u.host || u.pathname.replace(/^\/+/, "")).split("/")[0] || null;
    return u.searchParams.get("tab");
  } catch { return null; }
};

/* Quién es: el id de la cuenta (aleatorio y estable, no el correo). */
export const identificarSuperwall = (userId) =>
  conSuperwall(async (sw) => {
    if (!userId) return;
    if (sw.user.id.value === String(userId)) return;
    await sw.user.identify(String(userId), { restorePaywallAssignments: true });
  });

/* Al cerrar sesión: olvidar al usuario en este navegador. */
export const resetSuperwall = () => conSuperwall((sw) => sw.reset());

/* Si tiene el PRO, según NUESTRO backend. null = todavía no se sabe. */
export const estadoSuscripcionSuperwall = (pro) =>
  conSuperwall((sw) => {
    sw.purchases.setSubscriptionStatus(
      pro == null ? { status: "UNKNOWN" }
        : pro ? { status: "ACTIVE", entitlements: [ENTITLEMENT_PRO] }
          : { status: "INACTIVE" },
    );
  });

/* Atributos para las audiencias del panel (rol, plan, días de prueba…).
   Nada de datos de jugadores ni de familias. */
export const atributosSuperwall = (attrs) => conSuperwall((sw) => sw.user.setAttributes(attrs));

/* Vista de un apartado, para reglas de audiencia por pantalla. */
export const paginaSuperwall = (nombre) => conSuperwall((sw) => sw.page(nombre));

/* Enseñar el paywall de una placement. Si Superwall no está puesto, no hay
   campaña para esta persona o algo falla, se hace lo de siempre (`siNo`):
   la pantalla de Premium o el aviso de función PRO. */
export async function mostrarPaywall(placement, params, siNo) {
  const r = await conSuperwall((sw) => sw.register({ placement, params }));
  if (!r || r.type !== "presented") siNo?.();
  return r;
}
