import type { Context } from "@netlify/functions";

/**
 * Proxy seguro a la API de Anthropic para Coach AI.
 * La API key vive SOLO en la variable de entorno ANTHROPIC_API_KEY
 * (Netlify → Project configuration → Environment variables).
 * El navegador nunca la ve.
 *
 * Antes este endpoint estaba abierto: cualquiera con la URL podía mandar
 * mensajes y gastar el saldo de Anthropic. Ahora exige el mismo token de
 * sesión firmado que emite airtable.mts al iniciar sesión, y limita el
 * tamaño de la petición.
 */
const AUTH_SECRET = () =>
  Netlify.env.get("AUTH_SECRET") || Netlify.env.get("AIRTABLE_TOKEN") || "";

const unb64u = (t: string) => {
  const p = t.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(p + "=".repeat((4 - (p.length % 4)) % 4)), (c) => c.charCodeAt(0));
};
const b64u = (b: Uint8Array) =>
  btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function hmac(msg: string): Promise<string> {
  const k = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(AUTH_SECRET()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64u(new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg))));
}
const eqSeg = (a: string, b: string) => {
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
  if (!eqSeg(await hmac(cuerpo), firma)) return null;
  try {
    const p = JSON.parse(new TextDecoder().decode(unb64u(cuerpo)));
    return p && p.exp && p.exp > Date.now() ? p : null;
  } catch { return null; }
}

const j = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });

/* Tope de tamaño: sin esto, una sola petición podía mandar megas de texto */
const MAX_CHARS = 12000;
/* Modelo del asistente. Sonnet 5 es el equilibrio razonable para respuestas
   cortas de banquillo; para respuestas más elaboradas basta con poner aquí
   "claude-opus-5" (cuesta más por consulta). */
const MODELO = "claude-sonnet-5";

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const sesion = await leerSesion(req);
  if (!sesion) {
    return j({ error: "no_autorizado", reason: "Sesión no válida o caducada. Vuelve a iniciar sesión." }, 401);
  }

  const key = Netlify.env.get("ANTHROPIC_API_KEY");
  if (!key) {
    return j({ content: [{ type: "text", text: "Falta configurar ANTHROPIC_API_KEY en Netlify." }] }, 200);
  }
  /* La demo entra con un pase firmado sin cuenta detrás. Se le contesta igual,
     pero con menos tokens: es una prueba, no una temporada. */
  const esDemo = !!sesion.demo;
  let body: any;
  try { body = await req.json(); } catch { return new Response("Bad Request", { status: 400 }); }
  const { system, messages } = body ?? {};
  if (!Array.isArray(messages) || !messages.length) {
    return j({ error: "peticion_invalida" }, 400);
  }
  const largo = JSON.stringify({ system, messages }).length;
  if (largo > MAX_CHARS) {
    return j({ content: [{ type: "text", text: "La conversación es demasiado larga. Empieza una nueva consulta." }] }, 200);
  }

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODELO,
      max_tokens: Math.min(Number(body.maxTokens) || 1000, esDemo ? 500 : 2000),
      system,
      messages,
    }),
  });

  const data = await r.json().catch(() => null);
  /* Si Anthropic devuelve un error, hasta ahora se reenviaba tal cual con su
     código: la app veía una respuesta sin `content`, escribía "…" y no había
     forma de saber qué había pasado. Ahora el motivo queda en los registros de
     la función (nunca la clave) y al usuario le llega una frase entendible. */
  if (!r.ok || !data?.content) {
    const motivo = data?.error?.message || `HTTP ${r.status}`;
    console.error(`[coach] Anthropic ${r.status}: ${String(motivo).slice(0, 300)}`);
    const texto = r.status === 401 || r.status === 403
      ? "La clave de Anthropic no es válida o no tiene acceso. Revísala en las variables de entorno."
      : r.status === 429
      ? "El asistente está saturado ahora mismo. Prueba otra vez en un minuto."
      : "El asistente no ha podido responder. Vuelve a intentarlo en un minuto.";
    return j({ content: [{ type: "text", text: texto }] }, 200);
  }
  return Response.json(data, { status: 200 });
};

export const config = { path: "/.netlify/functions/coach" };
