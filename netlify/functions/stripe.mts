import { contarLlamadas } from "../lib/uso-airtable.mts";
import { instalarSupabase, supabaseActivo } from "../lib/supabase-airtable.mts";
// Suscripción CoachBase AI PRO (9,99 €/mes) con Stripe Checkout.
// Todo el estado vive en la tabla Suscripciones (tblb6s8eKcLK9LCw9): en
// Supabase si están SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (este archivo
// sigue hablando la API de Airtable y netlify/lib/supabase-airtable.mts la
// contesta desde Supabase), y si no, en Airtable.
//
//   POST ?action=checkout  -> crea la sesión de pago y devuelve { url }
//   POST ?action=portal    -> portal de cliente para gestionar o cancelar
//   GET  ?action=estado&email=…  -> ¿tiene PRO? { pro: true|false, estado, periodoFin }
//   POST ?action=webhook   -> endpoint del webhook de Stripe (escribe en Airtable)
//
// Variables de entorno en Netlify:
//   STRIPE_SECRET_KEY      -> sk_live_… o sk_test_…
//   STRIPE_PRICE_ID        -> price_1TxatlHuBVT1cFkv7MVZ5Zjv
//   STRIPE_WEBHOOK_SECRET  -> whsec_… del endpoint del webhook
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY -> las mismas que usa airtable.mts
//   AIRTABLE_TOKEN         -> el mismo PAT que usa airtable.mts (sin Supabase)
//   AIRTABLE_BASE          -> (opcional) appDVtUWdtfzkV1sA
//   APP_URL                -> https://coachbase-ai.netlify.app

/* ================= SESIÓN =================
   Antes NINGUNA acción de este archivo comprobaba quién llamaba: bastaba con
   saber (o adivinar) el email de alguien para consultar por "estado" si paga,
   ver su Stripe customerId, y con ese id abrir su portal de facturación -
   desde donde se puede ver el método de pago o CANCELAR la suscripción de
   otro club sin ser quien paga. Aquí se exige el mismo token firmado que ya
   usa airtable.mts (el propio cbFetch del frontend ya lo manda en todas las
   llamadas a este archivo, así que no hace falta tocar nada más), y el
   email de la cuenta sale SIEMPRE de la sesión verificada, nunca de lo que
   mande el cliente en el cuerpo o en la URL. */
const AUTH_SECRET = () =>
  Netlify.env.get("AUTH_SECRET") || Netlify.env.get("AIRTABLE_TOKEN") || Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const unb64u = (t: string) => {
  const p = t.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(p + "=".repeat((4 - (p.length % 4)) % 4)), (c) => c.charCodeAt(0));
};
const b64u = (b: Uint8Array) =>
  btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function hmacSesion(msg: string): Promise<string> {
  const k = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(AUTH_SECRET()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64u(new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg))));
}
const eqSegSesion = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};
async function leerSesion(req: Request): Promise<any | null> {
  const t = req.headers.get("x-cb-token") || "";
  const i = t.indexOf(".");
  if (i < 1) return null;
  const cuerpo = t.slice(0, i), firma = t.slice(i + 1);
  if (!eqSegSesion(await hmacSesion(cuerpo), firma)) return null;
  try {
    const p = JSON.parse(new TextDecoder().decode(unb64u(cuerpo)));
    return p && p.exp && p.exp > Date.now() ? p : null;
  } catch { return null; }
}

const KEY = () => Netlify.env.get("STRIPE_SECRET_KEY");
const PRICE = () => Netlify.env.get("STRIPE_PRICE_ID") || "price_1TxatlHuBVT1cFkv7MVZ5Zjv";
/* Catalogo de planes (Stripe live, cuenta EBLDigital) */
const PLANES: Record<string, string> = {
  mensual:   "price_1TxatlHuBVT1cFkv7MVZ5Zjv",
  temporada: "price_1TxtqeHuBVT1cFkvF1XzDMcP",
  club_s:    "price_1TxtqkHuBVT1cFkv2X2R9Q69",
  club_m:    "price_1TxtqsHuBVT1cFkvSnpwAwgY",
  club_l:    "price_1TxtqxHuBVT1cFkvTeJDrEkK",
};
const precioDe = (plan?: string) => (plan ? PLANES[plan] : PLANES.mensual) || PRICE();
const APP = () => Netlify.env.get("APP_URL") || "https://coachbase-ai.netlify.app";
const BASE = () => Netlify.env.get("AIRTABLE_BASE") || "appDVtUWdtfzkV1sA";
const AT_TOKEN = () => Netlify.env.get("AIRTABLE_TOKEN");
/* ¿Hay dónde guardar? En Supabase, o en Airtable con su token. */
const hayDatos = () => supabaseActivo() || !!AT_TOKEN();

const T_SUBS = "tblb6s8eKcLK9LCw9";
const T_USUARIOS = "tblZf4dFeq4FCjHGJ";
const T_CLUBES = "tblc2wLfnbbJg8KkI";
const S = {
  email: "fldVivShmbaSNuCcC", estado: "fldKsbWLFhmwWGjjX", customer: "fld9VDGUvRR4oLSqc",
  sub: "fldEqj4wCOCQK6T86", price: "fldCnl3Bf54HU6N8b", importe: "fldkIp45fn7xXWI60",
  fin: "fldSJpmXi4bmtriIs", cancelar: "fldJVihH0K2INwMta", actualizado: "fld8DIxvodpTddvMs",
  usuario: "fldqN9PDei93K4GZ7",
};
const U_EMAIL = "fldJWlJ17YuZNe4Jx";
const U_CLUB = "fldV2DDL6v5szs0y3";
const CL_LIMITE = "fldiIev3Pd9eWhulJ";

/* Plazas de cuerpo técnico que desbloquea cada plan de club. 0 = sin límite.
   Tienen que ser las MISMAS que promete la pantalla de precios (PLANES_CLUB
   en App.jsx: 20, 50 e ilimitadas). Aquí ponía 5 y 12 -el tope de EQUIPOS,
   no de personas-, así que un club que pagaba 249 € por "20 accesos" se
   quedaba con 5 y no podía dar de alta ni a su cuerpo técnico. */
const PLAZAS_CLUB: Record<string, number> = { club_s: 20, club_m: 50, club_l: 0 };
/* Al perder el pago (cancelación), el club vuelve al plan gratuito: 2
   accesos, los mismos que anuncia ("1 para el club y 1 para un entrenador").
   No se borra a nadie, pero no se pueden dar más altas hasta pagar de nuevo
   o hasta que el Master lo autorice a mano. */
const PLAZAS_SIN_PAGO = 2;

/* Si el precio de la suscripción es uno de club_s/m/l, actualiza el límite
   de plazas del club al que pertenece quien paga (localizado por su email en
   Usuarios). Nunca toca clubes de planes individuales (mensual/temporada). */
async function actualizarLimiteClub(email: string, priceId: string | undefined, activo: boolean) {
  const tierKey = Object.keys(PLANES).find((k) => PLANES[k] === priceId);
  if (!tierKey || !(tierKey in PLAZAS_CLUB)) return;
  const usuarios = await atList(T_USUARIOS);
  const u = usuarios.find((r) => norm(r.fields[U_EMAIL]) === norm(email));
  const clubId = (u?.fields[U_CLUB] || [])[0];
  if (!clubId) return;
  const plazas = activo ? PLAZAS_CLUB[tierKey] : PLAZAS_SIN_PAGO;
  await atWrite(`${atUrl(T_CLUBES)}/${clubId}`, "PATCH", { [CL_LIMITE]: plazas });
}

const ESTADOS: Record<string, string> = {
  active: "Activa", trialing: "Periodo de prueba", past_due: "Impago",
  unpaid: "Impago", canceled: "Cancelada", incomplete: "Ninguna", incomplete_expired: "Cancelada",
};
const CON_PRO = ["Activa", "Periodo de prueba"];

const j = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });

const norm = (v: unknown) => String(v || "").trim().toLowerCase();

async function stripe(path: string, body?: Record<string, string>, method = "POST") {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${KEY()}`, "content-type": "application/x-www-form-urlencoded" },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.error?.message || `Stripe ${r.status}`);
  return d;
}

/* ---------- Airtable ---------- */
const atHeaders = () => ({ Authorization: `Bearer ${AT_TOKEN()}`, "content-type": "application/json" });
const atUrl = (t: string) => `https://api.airtable.com/v0/${BASE()}/${t}`;

/* Pagina (Airtable da 100 filas como mucho por página) y pide los campos por
   id, que es como se leen en todo este archivo (S.email, U_EMAIL…): sin
   returnFieldsByFieldId llegan por nombre y cada r.fields[S.x] vale undefined.
   Si Airtable no contesta, lanza en vez de devolver una lista vacía: vacía se
   leía como "no existe" y acababa creando filas duplicadas o dando por
   procesado un webhook que no se había guardado. */
async function atList(t: string) {
  const out: any[] = [];
  let offset = "";
  for (let i = 0; i < 20; i++) {
    const r = await fetch(`${atUrl(t)}?pageSize=100&returnFieldsByFieldId=true${offset ? `&offset=${encodeURIComponent(offset)}` : ""}`, { headers: atHeaders() });
    if (!r.ok) throw new Error(`Airtable ${r.status}`);
    const d = await r.json();
    out.push(...((d.records || []) as any[]));
    offset = d.offset || "";
    if (!offset) break;
  }
  return out;
}
async function atWrite(url: string, method: string, fields: Record<string, unknown>) {
  const r = await fetch(url, { method, headers: atHeaders(), body: JSON.stringify({ fields, typecast: true }) });
  if (!r.ok) throw new Error(`Airtable ${r.status}`);
}

async function buscarSuscripcion(email: string) {
  const recs = await atList(T_SUBS);
  return recs.find((r) => norm(r.fields[S.email]) === norm(email)) || null;
}

async function guardarSuscripcion(email: string, campos: Record<string, unknown>) {
  if (!hayDatos() || !email) return;
  const fields: Record<string, unknown> = {
    [S.email]: email, [S.actualizado]: new Date().toISOString(), ...campos,
  };
  const existente = await buscarSuscripcion(email);
  if (existente) {
    await atWrite(`${atUrl(T_SUBS)}/${existente.id}`, "PATCH", fields);
    return;
  }
  // enlaza con el usuario si ya está registrado
  const usuarios = await atList(T_USUARIOS);
  const u = usuarios.find((r) => norm(r.fields[U_EMAIL]) === norm(email));
  if (u) fields[S.usuario] = [u.id];
  try {
    await atWrite(atUrl(T_SUBS), "POST", fields);
  } catch (e) {
    /* Stripe manda checkout.session.completed y subscription.created a la
       vez: los dos veían que no había fila y los dos la creaban. En Supabase
       hay un índice único por email (migración 20261107120000), así que el
       segundo INSERT falla; entonces la fila ya la ha creado el otro aviso y
       basta con actualizarla. */
    const ahora = await buscarSuscripcion(email);
    if (!ahora) throw e;
    await atWrite(`${atUrl(T_SUBS)}/${ahora.id}`, "PATCH", fields);
  }
}

/* Verificación de la firma del webhook (HMAC-SHA256, sin SDK) */
const VENTANA_FIRMA = 15 * 60; // segundos

async function firmaValida(payload: string, header: string, secret: string) {
  /* Stripe manda t=… y uno o VARIOS v1=… (mientras se rota el secreto viajan
     los dos, el viejo y el nuevo). Antes el header se leía con
     Object.fromEntries, que se queda solo con el ÚLTIMO v1: si el bueno
     venía el primero, una firma válida se daba por mala. */
  let t = "";
  const firmas: string[] = [];
  for (const parte of header.split(",")) {
    const i = parte.indexOf("=");
    if (i < 1) continue;
    const clave = parte.slice(0, i).trim(), valor = parte.slice(i + 1).trim();
    if (clave === "t") t = valor;
    else if (clave === "v1") firmas.push(valor);
  }
  if (!t || !firmas.length) return false;
  /* La hora iba en la firma pero no se miraba: quien capturase una petición
     válida podía repetirla para siempre. Stripe firma de nuevo cada
     reintento, así que la ventana no corta ninguna entrega legítima. */
  const edad = Math.abs(Date.now() / 1000 - Number(t));
  if (!Number.isFinite(edad) || edad > VENTANA_FIRMA) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${payload}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return firmas.some((v1) => {
    if (hex.length !== v1.length) return false;
    let diff = 0;
    for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
    return diff === 0;
  });
}

/* ¿Este evento es de CoachBase?
   La cuenta de Stripe (EBLDigital) cobra para varias apps -CoachBase y
   TestudoTracker-, y en Stripe un endpoint recibe TODOS los eventos de la
   cuenta: no se pueden filtrar por app. Así que desde que TestudoTracker
   empezó a cobrar (2 nov 2026), sus suscripciones llegaban aquí; sin este
   filtro, un cliente de la app de tortugas se habría guardado en la tabla
   Suscripciones como un PRO de CoachBase.
   Primero lo que dice el propio evento (metadata.app, que pone el checkout
   de abajo) y, si no lo lleva -una suscripción creada a mano en el panel-,
   el precio: si no es uno de los nuestros, no es nuestro. */
const APP_ID = "coachbase-ai";
const esNuestro = (o: any, priceId?: string) => {
  const app = o?.metadata?.app;
  if (app) return String(app) === APP_ID;
  return !!priceId && [...Object.values(PLANES), PRICE()].includes(priceId);
};
/* De otra app: 200 y a otra cosa. Con un 400 o un 500 Stripe lo reintenta
   durante días y acaba avisando de que va a apagar el endpoint -que es el
   correo que llegó el 5 de noviembre-. */
const ignorado = (ev: any) => {
  console.log(`[stripe webhook] ${ev.type} de otra app (${ev?.data?.object?.metadata?.app || "sin metadata"}): ignorado`);
  return j({ received: true, ignorado: true });
};

const atender = async (req: Request) => {
  instalarSupabase();
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "checkout";

  /* ---------- ESTADO (lo consulta la app al entrar) ---------- */
  if (action === "estado") {
    const sesion = await leerSesion(req);
    if (!sesion?.email) return j({ error: "no_autorizado" }, 401);
    /* El email es SIEMPRE el de la sesión verificada, nunca el que venga en
       la URL: antes se podía consultar si CUALQUIER email pagaba, y de paso
       se conseguía su Stripe customerId. */
    const email = String(sesion.email);
    if (!hayDatos() || !email) return j({ pro: false });
    let rec: any;
    try { rec = await buscarSuscripcion(email); } catch { return j({ pro: false, error: "airtable" }); }
    const estado = rec?.fields?.[S.estado] || "Ninguna";
    const fin = rec?.fields?.[S.fin] || null;
    const vigente = CON_PRO.includes(estado) && (!fin || new Date(fin) > new Date());
    return j({
      pro: !!vigente, estado, periodoFin: fin,
      customerId: rec?.fields?.[S.customer] || null,
      cancelarAlFinal: !!rec?.fields?.[S.cancelar],
    });
  }

  /* ---------- WEBHOOK ---------- */
  if (action === "webhook") {
    const secret = Netlify.env.get("STRIPE_WEBHOOK_SECRET") || "";
    const raw = await req.text();
    const sig = req.headers.get("stripe-signature") || "";
    /* Los secretos de Stripe empiezan por whsec_. Si no, en Netlify sigue el
       texto de ejemplo de las instrucciones de arriba sin sustituir, que es
       justo lo que pasaba: TODOS los avisos se rechazaban con un 400 y en el
       registro no quedaba por qué. Se dice en claro, que es barato de leer. */
    if (!secret.startsWith("whsec_")) {
      console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET sin configurar en Netlify (no empieza por whsec_)");
      return j({ error: "webhook sin configurar" }, 400);
    }
    if (!(await firmaValida(raw, sig, secret))) {
      console.error("[stripe webhook] firma no válida (¿secreto de otro endpoint, o reloj desfasado?)");
      return j({ error: "firma no válida" }, 400);
    }

    const ev = JSON.parse(raw);
    const o = ev.data?.object || {};
    try {
      if (ev.type === "checkout.session.completed") {
        /* Si el propio evento ya dice que es de otra app, ni se le pregunta
           el precio a Stripe. */
        if (o.metadata?.app && String(o.metadata.app) !== APP_ID) return ignorado(ev);
        /* El precio real de la compra. El objeto de la sesión no lo trae, así
           que hay que pedir sus line_items. Antes se escribía PRICE() a secas
           —el mensual por defecto—, así que quien compraba Temporada o
           cualquier plan de club quedaba en Airtable con el plan equivocado.
           El evento customer.subscription.created que llega detrás lo
           corregía, pero solo si llegaba después: los webhooks no garantizan
           el orden, y si la sesión aterrizaba la última el dato erróneo se
           quedaba fijo.
           Si la llamada falla, se omite el campo: mejor dejarlo a lo que diga
           el evento de la suscripción que escribir un precio inventado. */
        let priceId: string | undefined;
        try {
          const li = await stripe(`checkout/sessions/${o.id}/line_items?limit=1`, undefined, "GET");
          priceId = li.data?.[0]?.price?.id;
        } catch { /* se omite el campo */ }
        if (!esNuestro(o, priceId)) return ignorado(ev);
        await guardarSuscripcion(o.customer_details?.email || o.customer_email, {
          [S.customer]: o.customer, [S.sub]: o.subscription,
          ...(priceId ? { [S.price]: priceId } : {}),
          [S.estado]: "Activa",
          ...(o.amount_total != null ? { [S.importe]: o.amount_total / 100 } : {}),
        });
      }
      if (ev.type === "customer.subscription.created" || ev.type === "customer.subscription.updated") {
        const priceId = o.items?.data?.[0]?.price?.id;
        /* Antes de pedirle nada a Stripe: las suscripciones de otra app se
           reconocen con lo que ya trae el evento. */
        if (!esNuestro(o, priceId)) return ignorado(ev);
        const cust = await stripe(`customers/${o.customer}`, undefined, "GET");
        const estado = ESTADOS[o.status] || "Ninguna";
        await guardarSuscripcion(cust.email, {
          [S.customer]: o.customer, [S.sub]: o.id,
          [S.price]: priceId,
          [S.importe]: (o.items?.data?.[0]?.price?.unit_amount || 999) / 100,
          [S.estado]: estado,
          /* Desde la API 2025-06-30.basil el periodo va en cada línea de la
             suscripción y ya no en la suscripción: leyendo solo
             o.current_period_end la fecha quedaba siempre vacía. */
          [S.fin]: (() => {
            const fin = o.items?.data?.[0]?.current_period_end ?? o.current_period_end;
            return fin ? new Date(fin * 1000).toISOString() : null;
          })(),
          [S.cancelar]: !!o.cancel_at_period_end,
        });
        /* Si es un plan de CLUB (no individual) y está en un estado que da
           acceso (Activa/Periodo de prueba), sube el límite de plazas del
           club automáticamente — sin que el Master tenga que tocar nada. */
        await actualizarLimiteClub(cust.email, priceId, CON_PRO.includes(estado));
      }
      if (ev.type === "customer.subscription.deleted") {
        const priceId = o.items?.data?.[0]?.price?.id;
        if (!esNuestro(o, priceId)) return ignorado(ev);
        const cust = await stripe(`customers/${o.customer}`, undefined, "GET");
        await guardarSuscripcion(cust.email, { [S.estado]: "Cancelada", [S.cancelar]: false });
        /* Baja del pago: el club vuelve al techo gratuito de 1 plaza. */
        await actualizarLimiteClub(cust.email, priceId, false);
      }
    } catch (e) {
      /* 500 y no 200: con un 200 Stripe da el aviso por entregado y no lo
         repite nunca, así que un pago que llegaba con Airtable caída se
         perdía para siempre. Con un 500 Stripe lo reintenta durante días. */
      console.error(`[stripe webhook] ${ev.type}: ${String(e)}`);
      return j({ received: false, error: String(e) }, 500);
    }
    return j({ received: true });
  }

  if (!KEY()) return j({ error: "STRIPE_SECRET_KEY no configurada en Netlify" }, 500);
  if (req.method !== "POST") return j({ error: "Usa POST" }, 405);
  /* Portal y checkout son acciones sobre LA PROPIA suscripción: hace falta
     sesión, y el email con el que se opera es el de esa sesión, nunca el que
     mande el cuerpo. Antes bastaba con conocer -o adivinar- el customerId de
     alguien para abrir su portal de facturación y cancelarle el pago. */
  const authSesion = await leerSesion(req);
  if (!authSesion?.email) return j({ error: "no_autorizado" }, 401);
  const miEmail = String(authSesion.email);
  const body = await req.json().catch(() => ({}));

  /* ---------- PORTAL DE CLIENTE ---------- */
  if (action === "portal") {
    let rec: any;
    try { rec = await buscarSuscripcion(miEmail); } catch { return j({ error: "El servidor no puede consultar tu suscripción ahora mismo. Vuelve a intentarlo en unos minutos." }, 503); }
    const customer = rec?.fields?.[S.customer];
    if (!customer) return j({ error: "No encuentro tu suscripción" }, 400);
    const p = await stripe("billing_portal/sessions", { customer, return_url: `${APP()}/?portal=ok` });
    return j({ url: p.url });
  }

  /* ---------- CHECKOUT ---------- */
  try {
    const plan = String(body.plan || "mensual");
    if (!PLANES[plan]) return j({ error: "Plan no válido" }, 400);
    const params: Record<string, string> = {
      mode: "subscription",
      "line_items[0][price]": precioDe(plan),
      "line_items[0][quantity]": "1",
      success_url: `${APP()}/?pro=ok&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP()}/?pro=cancel`,
      allow_promotion_codes: "true",
      locale: "es",
      customer_email: miEmail,
      /* La app, también en la propia sesión y no solo en la suscripción: el
         evento checkout.session.completed trae la metadata de la sesión, y
         con ella el webhook sabe que es nuestro sin preguntarle el precio a
         Stripe (ver esNuestro). */
      "metadata[app]": APP_ID,
      "subscription_data[metadata][app]": APP_ID,
      "subscription_data[metadata][plan]": plan,
      /* Mismo mes de prueba que el resto de la app (ver fechaTrial30 en
         airtable.mts): Stripe no cobra la tarjeta hasta que pasen 30 días,
         así que quien paga por primera vez tiene el mismo margen que quien
         entra sin pagar todavía. */
      "subscription_data[trial_period_days]": "30",
    };
    /* Código de descuento propio: "ilimitado" = 100 % de descuento para siempre
       (Stripe no pide tarjeta si el total es 0). Se crea en Stripe la primera
       vez que se usa, así que no hay que tocar el panel. Cualquier otro código
       lo sigue gestionando el campo de códigos de la propia página de Stripe. */
    const codigo = norm(body.codigo);
    if (codigo === "ilimitado") {
      try {
        const ya = await stripe(`promotion_codes?code=${encodeURIComponent(codigo)}&active=true&limit=1`, undefined, "GET");
        let promo = ya?.data?.[0]?.id as string | undefined;
        if (!promo) {
          const cupon = await stripe("coupons", { percent_off: "100", duration: "forever", name: "ilimitado" });
          promo = (await stripe("promotion_codes", { coupon: cupon.id, code: codigo })).id;
        }
        delete params.allow_promotion_codes;
        params["discounts[0][promotion_code]"] = promo!;
        params.payment_method_collection = "if_required";
        delete params["subscription_data[trial_period_days]"];
      } catch (e) {
        return j({ error: `No se pudo aplicar el código: ${String(e)}` }, 500);
      }
    } else if (codigo) {
      return j({ error: "codigo_no_valido" }, 400);
    }
    if (body.club) params["subscription_data[metadata][club]"] = String(body.club);
    if (body.equipo) params["subscription_data[metadata][equipo]"] = String(body.equipo);
    const checkoutSesion = await stripe("checkout/sessions", params);
    return j({ url: checkoutSesion.url, id: checkoutSesion.id });
  } catch (e) {
    return j({ error: String(e) }, 500);
  }
};

/* Cuenta las llamadas a Airtable de cada petición (ver netlify/lib/uso-airtable.mts). */
export default contarLlamadas("stripe", atender);
