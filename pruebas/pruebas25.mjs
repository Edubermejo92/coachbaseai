/* El webhook de Stripe (netlify/functions/stripe.mts).
   Esta cuenta de Stripe cobra para varias apps -CoachBase y TestudoTracker-,
   y un endpoint recibe TODOS los eventos de la cuenta: lo de otra app tiene
   que salir por la puerta con un 200, y lo nuestro guardarse. Más la firma,
   que es lo único que separa un aviso de Stripe de uno inventado.
   No toca la red: se sustituye fetch y se mira a quién se llama. */
import crypto from "node:crypto";
import fs from "node:fs";
import { execSync } from "node:child_process";

let ok = 0, mal = 0;
/* El resumen de cada archivo se lee de la última línea (ver todas.mjs), así
   que lo que escriba la propia función se guarda aparte en vez de salir por
   en medio -y por stderr, que llegaba después del resumen-. */
const escribe = console.log.bind(console);
const registro = [];
console.log = (...a) => registro.push(a.join(" "));
console.error = (...a) => registro.push(a.join(" "));
const dice = (n, c, e = "") => { (c ? ok++ : mal++); escribe(`${c ? "✓" : "✗"} ${n}${e ? "  → " + e : ""}`); };
const ultimoRegistro = () => registro[registro.length - 1] || "";

const FN = new URL("../netlify/functions/stripe.mts", import.meta.url).pathname;
const OUT = new URL("fn-stripe.mjs", import.meta.url).pathname;
execSync(`npx esbuild ${FN} --bundle --format=esm --platform=node --target=node20 --outfile=${OUT}`, { stdio: "pipe" });

const SECRETO = "whsec_pruebaDeSecretoDeFirma0123456789";
const ENV = {
  STRIPE_WEBHOOK_SECRET: SECRETO,
  STRIPE_SECRET_KEY: "sk_live_deMentira",
  AIRTABLE_TOKEN: "patDeMentira",
  AIRTABLE_BASE: "appDVtUWdtfzkV1sA",
  APP_URL: "https://coachbase-ai.netlify.app",
};
globalThis.Netlify = { env: { get: (k) => ENV[k] } };

/* Lo que se le pide a cada servidor, para poder afirmar que un evento de
   otra app no gasta ni una llamada. */
let llamadas = [];
globalThis.fetch = async (url, init = {}) => {
  llamadas.push(`${init.method || "GET"} ${String(url)}`);
  const u = String(url);
  if (u.includes("api.stripe.com") && u.includes("customers/")) {
    return new Response(JSON.stringify({ id: "cus_1", email: "ent@a.com" }), { status: 200 });
  }
  if (u.includes("api.stripe.com") && u.includes("line_items")) {
    return new Response(JSON.stringify({ data: [{ price: { id: "price_1TxatlHuBVT1cFkv7MVZ5Zjv" } }] }), { status: 200 });
  }
  if (u.includes("api.airtable.com")) {
    return new Response(JSON.stringify({ records: [] }), { status: 200 });
  }
  return new Response("{}", { status: 200 });
};

const { default: handler } = await import(OUT);

const firmar = (cuerpo, { secreto = SECRETO, t = Math.floor(Date.now() / 1000), extra = "" } = {}) => {
  const v1 = crypto.createHmac("sha256", secreto).update(`${t}.${cuerpo}`).digest("hex");
  return `t=${t}${extra ? "," + extra : ""},v1=${v1}`;
};
const avisar = async (evento, opciones = {}) => {
  llamadas = [];
  const cuerpo = JSON.stringify(evento);
  const r = await handler(new Request("https://x/.netlify/functions/stripe?action=webhook", {
    method: "POST",
    headers: { "stripe-signature": opciones.firma ?? firmar(cuerpo, opciones) },
    body: cuerpo,
  }));
  return { status: r.status, body: await r.json().catch(() => ({})), llamadas };
};

/* Los dos eventos de verdad del 2 de noviembre, tal como los mandó Stripe. */
const subTestudo = {
  id: "evt_tt", type: "customer.subscription.updated",
  data: { object: {
    id: "sub_1UXSOsHuBVT1cFkvLXCa3ZJ3", customer: "cus_VYZXYkDFeQSnzR", status: "trialing",
    metadata: { app: "testudotracker" },
    items: { data: [{ price: { id: "price_1UXPHoHuBVT1cFkv452wmAeG", unit_amount: 199 } }] },
  } },
};
const subNuestra = {
  id: "evt_cb", type: "customer.subscription.updated",
  data: { object: {
    id: "sub_cb", customer: "cus_1", status: "active",
    metadata: { app: "coachbase-ai", plan: "mensual" },
    items: { data: [{ price: { id: "price_1TxatlHuBVT1cFkv7MVZ5Zjv", unit_amount: 999 } }] },
    current_period_end: 1800000000, cancel_at_period_end: false,
  } },
};

/* ---- lo de otra app se ignora, y sin gastar llamadas ---- */
let r = await avisar(subTestudo);
dice("una suscripción de TestudoTracker se ignora con un 200 (si no, Stripe reintenta días)",
  r.status === 200 && r.body.ignorado === true, `${r.status} ${JSON.stringify(r.body)}`);
dice("y no se le pregunta nada ni a Stripe ni a Airtable",
  r.llamadas.length === 0, r.llamadas.join(" | "));

r = await avisar({ ...subTestudo, type: "customer.subscription.deleted" });
dice("tampoco cuando la de otra app se da de baja", r.status === 200 && r.body.ignorado === true && !r.llamadas.length);

r = await avisar({
  id: "evt_tt2", type: "checkout.session.completed",
  data: { object: { id: "cs_tt", metadata: { app: "testudotracker" }, customer_details: { email: "tortugas@a.com" } } },
});
dice("ni cuando alguien compra en la otra app", r.status === 200 && r.body.ignorado === true && !r.llamadas.length,
  r.llamadas.join(" | "));

/* Una suscripción sin metadata (creada a mano en el panel) se juzga por el
   precio: el de la otra app no es nuestro. */
r = await avisar({
  id: "evt_x", type: "customer.subscription.updated",
  data: { object: { id: "sub_x", customer: "cus_x", status: "active", items: { data: [{ price: { id: "price_1UXPHoHuBVT1cFkv452wmAeG" } }] } } },
});
dice("sin metadata, manda el precio: uno que no es nuestro se ignora", r.status === 200 && r.body.ignorado === true);

/* ---- lo nuestro se guarda ---- */
r = await avisar(subNuestra);
dice("la suscripción de CoachBase sí se procesa", r.status === 200 && !r.body.ignorado, JSON.stringify(r.body));
dice("y se escribe en la tabla de suscripciones",
  r.llamadas.some((l) => l.includes("api.airtable.com")), r.llamadas.join(" | "));

r = await avisar({
  id: "evt_cb2", type: "checkout.session.completed",
  data: { object: { id: "cs_cb", metadata: { app: "coachbase-ai" }, customer: "cus_1", subscription: "sub_cb", customer_details: { email: "ent@a.com" }, amount_total: 999 } },
});
dice("una compra de CoachBase se procesa y se le pide el precio real a Stripe",
  r.status === 200 && !r.body.ignorado && r.llamadas.some((l) => l.includes("line_items")), r.llamadas.join(" | "));

/* Una suscripción nuestra creada a mano, sin metadata: la salva el precio. */
r = await avisar({
  id: "evt_cb3", type: "customer.subscription.updated",
  data: { object: { id: "sub_cb3", customer: "cus_1", status: "active", items: { data: [{ price: { id: "price_1TxtqeHuBVT1cFkvF1XzDMcP" } }] } } },
});
dice("sin metadata, un precio nuestro (Temporada) sí se procesa", r.status === 200 && !r.body.ignorado);

/* ---- la firma ---- */
r = await avisar(subNuestra, { secreto: "whsec_otroDistinto" });
dice("una firma de otro secreto se rechaza", r.status === 400 && !r.llamadas.length);

r = await avisar(subNuestra, { firma: "" });
dice("sin firma, tampoco pasa", r.status === 400);

const cuerpoN = JSON.stringify(subNuestra);
const buena = crypto.createHmac("sha256", SECRETO).update(`${Math.floor(Date.now() / 1000)}.${cuerpoN}`).digest("hex");
const t = Math.floor(Date.now() / 1000);
r = await avisar(subNuestra, { firma: `t=${t},v1=${crypto.createHmac("sha256", SECRETO).update(`${t}.${cuerpoN}`).digest("hex")},v1=${"b".repeat(64)}` });
dice("con el secreto en rotación Stripe manda dos v1: vale que la buena sea la PRIMERA",
  r.status === 200, `${r.status} (antes se leía solo la última y se caía)`);

r = await avisar(subNuestra, { extra: `v0=${"a".repeat(64)}` });
dice("el v0 que acompaña a la firma no estorba", r.status === 200);

r = await avisar(subNuestra, { t: Math.floor(Date.now() / 1000) - 3600 });
dice("una firma de hace una hora se rechaza (no se puede repetir una petición vieja)", r.status === 400);

/* ---- el fallo de Edu: el secreto de ejemplo sin sustituir ---- */
ENV.STRIPE_WEBHOOK_SECRET = "<tu_signing_secret_del_webhook>";
r = await avisar(subNuestra, { secreto: "<tu_signing_secret_del_webhook>" });
dice("con el texto de ejemplo en Netlify se rechaza y el registro dice por qué",
  r.status === 400 && ultimoRegistro().includes("STRIPE_WEBHOOK_SECRET sin configurar"), ultimoRegistro());
ENV.STRIPE_WEBHOOK_SECRET = SECRETO;

/* ---- el checkout marca la app, que es de donde sale todo lo anterior ---- */
const fuente = fs.readFileSync(FN, "utf8");
dice("el checkout marca la sesión con la app", fuente.includes('"metadata[app]": APP_ID'));
dice("y también la suscripción", fuente.includes('"subscription_data[metadata][app]": APP_ID'));

escribe(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
