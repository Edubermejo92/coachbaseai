/* ================= CONSUMO DE AIRTABLE =================
   Airtable cobra por llamada a su API y no da el consumo por API, así que se
   cuenta aquí: cada petición a nuestras funciones cuenta cuántas veces llama
   a api.airtable.com y lo apunta en Netlify Blobs (no en Airtable: apuntarlo
   allí gastaría más llamadas).

   Una entrada por petición, con el recuento en la propia clave
   (l/<día>/<recurso>/<n>/<id>): así dos peticiones a la vez nunca se pisan
   -Blobs no tiene escrituras condicionales- y para sumar un día basta con
   listar las claves, sin leer ninguna. Los días cerrados se resumen en r/<día>
   la primera vez que se consultan. */
import { getStore } from "@netlify/blobs";

const STORE = "uso-airtable";
const store = () => getStore(STORE);

/* Día natural en Madrid (YYYY-MM-DD): el límite de Airtable es mensual y aquí
   se mira por días, así que el corte tiene que ser el de aquí, no el de UTC. */
export const diaMadrid = (d = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(d);

/* Contador de la petición en curso. Una instancia de una función de Netlify
   atiende una sola petición a la vez, así que basta con una variable de
   módulo que se pone a cero al empezar cada una. */
let llamadas = 0;
let instalado = false;
function instalarContador() {
  if (instalado) return;
  instalado = true;
  const original = globalThis.fetch.bind(globalThis);
  globalThis.fetch = ((input: any, init?: any) => {
    const u = typeof input === "string" ? input : input instanceof URL ? input.href : input?.url || "";
    if (u.startsWith("https://api.airtable.com/")) llamadas++;
    return original(input, init);
  }) as typeof fetch;
}

const limpio = (s: string) => s.toLowerCase().replace(/[^a-z0-9:-]/g, "").slice(0, 60) || "otro";

async function etiquetaDe(origen: string, req: Request) {
  const url = new URL(req.url);
  if (origen === "stripe") return limpio(`stripe:${url.searchParams.get("action") || "checkout"}`);
  const res = (url.searchParams.get("res") || "usuarios").toLowerCase();
  if (res === "usuarios" && req.method === "POST") {
    const accion = await req.clone().json().then((b: any) => String(b?.action || "")).catch(() => "");
    if (accion) return limpio(`usuarios:${accion}`);
  }
  return limpio(`${res}:${req.method.toLowerCase()}`);
}

async function apuntar(etiqueta: string, n: number) {
  const s = store();
  const dia = diaMadrid();
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  await s.set(`l/${dia}/${etiqueta}/${n}/${id}`, "");
  /* Desde cuándo se cuenta: los días anteriores no tienen datos, y no es lo
     mismo "0 llamadas" que "todavía no se contaba". */
  if (!(await s.get("inicio"))) await s.set("inicio", dia);
}

/* Envuelve el handler de una función para contar sus llamadas a Airtable. */
export const contarLlamadas = (origen: string, handler: (req: Request, ctx?: any) => Promise<Response>) =>
  async (req: Request, ctx?: any): Promise<Response> => {
    instalarContador();
    llamadas = 0;
    const etiqueta = await etiquetaDe(origen, req).catch(() => "otro");
    try {
      return await handler(req, ctx);
    } finally {
      const n = llamadas;
      llamadas = 0;
      if (n > 0) {
        const p = apuntar(etiqueta, n).catch(() => {});
        if (ctx?.waitUntil) ctx.waitUntil(p); else await p;
      }
    }
  };

type Dia = { dia: string; total: number; porRecurso: Record<string, number> };

async function sumarDia(dia: string): Promise<Dia> {
  const { blobs } = await store().list({ prefix: `l/${dia}/` });
  const porRecurso: Record<string, number> = {};
  let total = 0;
  for (const b of blobs) {
    const [, , etiqueta, n] = b.key.split("/");
    const v = Number(n) || 0;
    total += v;
    porRecurso[etiqueta] = (porRecurso[etiqueta] || 0) + v;
  }
  return { dia, total, porRecurso };
}

/* Los últimos `dias` días, del más antiguo al de hoy. */
export async function leerUso(dias = 31) {
  const s = store();
  const hoy = diaMadrid();
  const [y, m, d] = hoy.split("-").map(Number);
  const lista = Array.from({ length: dias }, (_, i) =>
    new Date(Date.UTC(y, m - 1, d - (dias - 1 - i))).toISOString().slice(0, 10));
  const inicio = (await s.get("inicio")) || null;
  const out = await Promise.all(lista.map(async (dia): Promise<Dia> => {
    if (!inicio || dia < inicio) return { dia, total: 0, porRecurso: {} };
    if (dia < hoy) {
      const r = await s.get(`r/${dia}`, { type: "json" }).catch(() => null);
      if (r) return r as Dia;
      const suma = await sumarDia(dia);
      await s.setJSON(`r/${dia}`, suma).catch(() => {});
      return suma;
    }
    return sumarDia(dia);
  }));
  return { desde: inicio, hoy, dias: out };
}
