// Suscripción CoachBase AI PRO (9,99 €/mes) con Stripe Checkout.
// Todo el estado vive en Airtable: tabla Suscripciones (tblb6s8eKcLK9LCw9).
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
//   AIRTABLE_TOKEN         -> el mismo PAT que usa airtable.mts
//   AIRTABLE_BASE          -> (opcional) appDVtUWdtfzkV1sA
//   APP_URL                -> https://coachbase-ai.netlify.app

/* ================= SESIÓN =================
   Antes NINGUNA acción de este archivo comprobaba quién llamaba: bastaba con
   saber (o adivinar) el email de alguien para consultar por "estado" si paga,
   ver su Stripe customerId, y con ese id abrir su portal de facturación -
   desde donde se puede ver el método de pago o CANCELAR la suscripción de
   otro club sin ser quien paga. Aquí se exige el mismo token firmado que ya
   usan airtable.mts y coach.mts (el propio cbFetch del frontend ya lo manda
   en todas las llamadas a este archivo, así que no hace falta tocar nada
   más), y el email de la cuenta sale SIEMPRE de la sesión verificada, nunca
   de lo que mande el cliente en el cuerpo o en la URL. */
const AUTH_SECRET = () => Netlify.env.get("AUTH_SECRET") || Netlify.env.get("AIRTABLE_TOKEN") || "";
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
   Reutiliza los mismos tramos que el tope de equipos de cada plan (5/12/∞),
   a falta de una cifra de "perfiles" propia y distinta en el catálogo de
   precios — si se quiere un número distinto de plazas por plan, cambiar aquí. */
const PLAZAS_CLUB: Record<string, number> = { club_s: 5, club_m: 12, club_l: 0 };
/* Al perder el pago (cancelación), el club vuelve al techo gratuito de 1
   plaza — no se borra a nadie, pero no se pueden dar más altas hasta pagar
   de nuevo o hasta que el Master lo autorice a mano. */
const PLAZAS_SIN_PAGO = 1;

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
  await fetch(`${atUrl(T_CLUBES)}/${clubId}`, {
    method: "PATCH", headers: atHeaders(), body: JSON.stringify({ fields: { [CL_LIMITE]: plazas }, typecast: true }),
  });
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

async function atList(t: string) {
  const r = await fetch(`${atUrl(t)}?pageSize=100`, { headers: atHeaders() });
  const d = await r.json().catch(() => ({}));
  return (d.records || []) as any[];
}

async function buscarSuscripcion(email: string) {
  const recs = await atList(T_SUBS);
  return recs.find((r) => norm(r.fields[S.email]) === norm(email)) || null;
}

async function guardarSuscripcion(email: string, campos: Record<string, unknown>) {
  if (!AT_TOKEN() || !email) return;
  const fields: Record<string, unknown> = {
    [S.email]: email, [S.actualizado]: new Date().toISOString(), ...campos,
  };
  const existente = await buscarSuscripcion(email);
  if (existente) {
    await fetch(`${atUrl(T_SUBS)}/${existente.id}`, {
      method: "PATCH", headers: atHeaders(), body: JSON.stringify({ fields, typecast: true }),
    });
    return;
  }
  // enlaza con el usuario si ya está registrado
  const usuarios = await atList(T_USUARIOS);
  const u = usuarios.find((r) => norm(r.fields[U_EMAIL]) === norm(email));
  if (u) fields[S.usuario] = [u.id];
  await fetch(atUrl(T_SUBS), {
    method: "POST", headers: atHeaders(), body: JSON.stringify({ fields, typecast: true }),
  });
}

/* Verificación de la firma del webhook (HMAC-SHA256, sin SDK) */
async function firmaValida(payload: string, header: string, secret: string) {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = parts["t"], v1 = parts["v1"];
  if (!t || !v1) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${payload}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

export default async (req: Request) => {
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
    if (!AT_TOKEN() || !email) return j({ pro: false });
    const rec = await buscarSuscripcion(email);
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
    const secret = Netlify.env.get("STRIPE_WEBHOOK_SECRET");
    const raw = await req.text();
    const sig = req.headers.get("stripe-signature") || "";
    if (!secret || !(await firmaValida(raw, sig, secret))) return j({ error: "firma no válida" }, 400);

    const ev = JSON.parse(raw);
    const o = ev.data?.object || {};
    try {
      if (ev.type === "checkout.session.completed") {
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
        await guardarSuscripcion(o.customer_details?.email || o.customer_email, {
          [S.customer]: o.customer, [S.sub]: o.subscription,
          ...(priceId ? { [S.price]: priceId } : {}),
          [S.estado]: "Activa",
          ...(o.amount_total != null ? { [S.importe]: o.amount_total / 100 } : {}),
        });
      }
      if (ev.type === "customer.subscription.created" || ev.type === "customer.subscription.updated") {
        const cust = await stripe(`customers/${o.customer}`, undefined, "GET");
        const priceId = o.items?.data?.[0]?.price?.id;
        const estado = ESTADOS[o.status] || "Ninguna";
        await guardarSuscripcion(cust.email, {
          [S.customer]: o.customer, [S.sub]: o.id,
          [S.price]: priceId,
          [S.importe]: (o.items?.data?.[0]?.price?.unit_amount || 999) / 100,
          [S.estado]: estado,
          [S.fin]: o.current_period_end ? new Date(o.current_period_end * 1000).toISOString() : null,
          [S.cancelar]: !!o.cancel_at_period_end,
        });
        /* Si es un plan de CLUB (no individual) y está en un estado que da
           acceso (Activa/Periodo de prueba), sube el límite de plazas del
           club automáticamente — sin que el Master tenga que tocar nada. */
        await actualizarLimiteClub(cust.email, priceId, CON_PRO.includes(estado));
      }
      if (ev.type === "customer.subscription.deleted") {
        const cust = await stripe(`customers/${o.customer}`, undefined, "GET");
        const priceId = o.items?.data?.[0]?.price?.id;
        await guardarSuscripcion(cust.email, { [S.estado]: "Cancelada", [S.cancelar]: false });
        /* Baja del pago: el club vuelve al techo gratuito de 1 plaza. */
        await actualizarLimiteClub(cust.email, priceId, false);
      }
    } catch (e) {
      return j({ received: true, warn: String(e) });
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
    const rec = await buscarSuscripcion(miEmail);
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
      "subscription_data[metadata][app]": "coachbase-ai",
      "subscription_data[metadata][plan]": plan,
    };
    if (body.club) params["subscription_data[metadata][club]"] = String(body.club);
    if (body.equipo) params["subscription_data[metadata][equipo]"] = String(body.equipo);
    const checkoutSesion = await stripe("checkout/sessions", params);
    return j({ url: checkoutSesion.url, id: checkoutSesion.id });
  } catch (e) {
    return j({ error: String(e) }, 500);
  }
};
