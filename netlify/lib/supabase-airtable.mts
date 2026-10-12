/* ================= SUPABASE CON LA CARA DE AIRTABLE =================
   CoachBase guarda sus datos en Supabase, pero airtable.mts y stripe.mts
   siguen hablando la API REST de Airtable (unas 60 llamadas, con toda la
   lógica de permisos alrededor). En vez de reescribir esa lógica -y arriesgar
   un fallo de permisos sobre datos de menores-, este módulo contesta a esas
   mismas llamadas como lo haría Airtable, leyendo y escribiendo en Supabase.

   Se activa solo si Netlify tiene SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.
   Sin ellas todo sigue yendo a Airtable, que es también la vuelta atrás si
   algo fallara: quitar las dos variables.

   Lo que imita, porque es lo que usa el backend:
   - listar (GET y POST /listRecords), leer uno, crear, editar uno o varios
     (PATCH), borrar uno o varios;
   - campos por NOMBRE, o por id con returnFieldsByFieldId;
   - typecast: textos, números, fechas, selecciones y enlaces escritos como
     llegan;
   - los campos vacíos no se devuelven (Airtable los omite);
   - dos fórmulas: la de "estos ids" y la del email del login. Cualquier otra
     contesta 422, como una fórmula inválida en Airtable;
   - subir adjuntos (content.airtable.com …/uploadAttachment), que van a un
     bucket privado de Supabase Storage y se sirven con enlaces firmados.
   El lado inverso de los enlaces lo mantiene un trigger de Postgres (ver
   supabase/migrations). */
import { tablaPorAirtable, tablaPorNombre, tablaDeCampo, type Tabla, type Campo } from "./esquema-coachbase.mts";

export const SB_URL = () => (Netlify.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
const SB_KEY = () => Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
export const BUCKET = "coachbase";
/* Los enlaces de los adjuntos caducan, como los de Airtable. Una semana da
   margen a lo que la app guarde en caché (el escudo, por ejemplo). */
const FIRMA_SEGUNDOS = 7 * 24 * 3600;
const ES_REC = /^rec[A-Za-z0-9]+$/;

export const supabaseActivo = () => !!(SB_URL() && SB_KEY());

let fetchReal: typeof fetch | null = null;
/* El fetch de verdad: el que había antes del desvío, o el global si el
   desvío no está puesto (la función de migración no lo instala). */
const red = () => fetchReal || globalThis.fetch;
/* Desvía a Supabase las llamadas a Airtable de esta función. Se llama al
   empezar cada petición; solo instala el desvío una vez. */
export function instalarSupabase() {
  if (fetchReal || !supabaseActivo()) return;
  fetchReal = globalThis.fetch.bind(globalThis);
  globalThis.fetch = ((input: any, init?: any) => {
    const u = typeof input === "string" ? input : input instanceof URL ? input.href : input?.url || "";
    if (u.startsWith("https://api.airtable.com/v0/") || u.startsWith("https://content.airtable.com/v0/")) {
      return comoAirtable(u, init || {});
    }
    return fetchReal!(input, init);
  }) as typeof fetch;
}

/* ---------- errores con la forma de Airtable ---------- */
type Fallo = { status: number; type: string; message: string };
const fallo = (status: number, type: string, message = ""): Fallo => ({ status, type, message });
const J = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });

/* ---------- PostgREST ---------- */
export function cabeceras(extra: Record<string, string> = {}) {
  /* La clave va en las dos cabeceras. Con la secreta nueva (sb_secret_…) el
     gateway de Supabase cambia ese "Bearer sb_…" por su JWT interno de
     service_role; con la antigua (JWT "eyJ…") la deja pasar tal cual. Storage
     necesita Authorization: sin ella, la subida de fotos no estaría
     autorizada. */
  return { apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}`, ...extra };
}
export async function rest(ruta: string, opt: { method?: string; body?: unknown; prefer?: string } = {}, intento = 0): Promise<any> {
  let r: Response;
  try {
    r = await red()(`${SB_URL()}/rest/v1/${ruta}`, {
      method: opt.method || "GET",
      headers: cabeceras({
        "content-type": "application/json",
        ...(opt.prefer ? { Prefer: opt.prefer } : {}),
      }),
      ...(opt.body !== undefined ? { body: JSON.stringify(opt.body) } : {}),
    });
  } catch (e) {
    throw fallo(503, "SERVICE_UNAVAILABLE", String(e));
  }
  const txt = await r.text();
  /* "JWT issued at future" (PGRST303): el gateway de Supabase firma su token
     interno con un reloj unos segundos adelantado respecto a PostgREST. Pasa
     a ratos y se arregla solo: se reintenta una vez tras un segundo. */
  if (r.status === 401 && txt.includes("PGRST303") && intento === 0) {
    await new Promise((ok) => setTimeout(ok, 1000));
    return rest(ruta, opt, 1);
  }
  if (!r.ok) {
    console.error(`[supabase] ${opt.method || "GET"} ${ruta.split("?")[0]} → ${r.status}: ${txt.slice(0, 300)}`);
    /* Un dato que Postgres no acepta (fecha inválida…) es lo que en Airtable
       sería un 422; lo demás, el servicio caído. */
    if (r.status >= 500 || r.status === 401 || r.status === 403) throw fallo(503, "SERVICE_UNAVAILABLE", txt);
    throw fallo(422, "INVALID_VALUE_FOR_COLUMN", txt);
  }
  return txt ? JSON.parse(txt) : null;
}

const enLista = (ids: string[]) => `in.(${ids.map((x) => encodeURIComponent(x)).join(",")})`;
const PAGINA = 1000;
async function todas(t: Tabla, filtro = ""): Promise<any[]> {
  const out: any[] = [];
  for (let desde = 0; ; desde += PAGINA) {
    const filas = await rest(`${t.nombre}?select=*${filtro}&order=_orden.asc&limit=${PAGINA}&offset=${desde}`);
    out.push(...filas);
    if (filas.length < PAGINA) return out;
  }
}
async function porIds(t: Tabla, ids: string[]): Promise<any[]> {
  const validos = [...new Set(ids.filter((x) => ES_REC.test(x)))];
  const out: any[] = [];
  for (let i = 0; i < validos.length; i += 200) {
    out.push(...(await todas(t, `&id=${enLista(validos.slice(i, i + 200))}`)));
  }
  return out.sort((a, b) => Number(a._orden) - Number(b._orden));
}
async function una(t: Tabla, rec: string): Promise<any | null> {
  if (!ES_REC.test(rec)) return null;
  const filas = await rest(`${t.nombre}?select=*&id=eq.${encodeURIComponent(rec)}`);
  return filas[0] || null;
}

/* ---------- fórmulas ---------- */
async function filtrar(t: Tabla, formula: string): Promise<any[]> {
  const f = formula.trim();
  if (!f) return todas(t);
  /* FIND("," & RECORD_ID() & ",", ",rec1,rec2,") — las filas de un equipo. */
  const porId = f.match(/^FIND\(\s*","\s*&\s*RECORD_ID\(\)\s*&\s*","\s*,\s*"(,[^"]*,)"\s*\)$/);
  if (porId) return porIds(t, porId[1].split(",").filter(Boolean));
  /* LOWER(TRIM({Campo}))='valor' — el email del login. */
  const igual = f.match(/^LOWER\(TRIM\(\{([^}]+)\}\)\)\s*=\s*'((?:[^'\\]|\\.)*)'$/);
  if (igual) {
    const campo = t.porNombre.get(igual[1]);
    if (!campo || campo.tipo !== "texto") throw fallo(422, "INVALID_FILTER_BY_FORMULA", f);
    const valor = igual[2].replace(/\\(.)/g, "$1");
    /* El ilike solo acota (con comodines por si hubiera espacios); la
       comparación exacta, igual que la fórmula, se hace aquí. */
    const patron = `*${valor.replace(/[\\%_*]/g, (c) => `\\${c}`)}*`;
    const filas = await todas(t, `&${campo.col}=ilike.${encodeURIComponent(patron)}`);
    return filas.filter((r) => String(r[campo.col] ?? "").trim().toLowerCase() === valor);
  }
  throw fallo(422, "INVALID_FILTER_BY_FORMULA", `Fórmula no soportada: ${f}`);
}

/* ---------- de Airtable a Postgres ---------- */
const nuevoIdAdjunto = () => "att" + crypto.randomUUID().replace(/-/g, "").slice(0, 14);
const RUTA_FIRMADA = new RegExp(`/storage/v1/object/sign/${BUCKET}/([^?]+)`);

export function convertir(c: Campo, v: unknown): unknown {
  const vacio = v === null || v === undefined || v === "";
  switch (c.tipo) {
    case "texto":
      if (vacio) return null;
      if (typeof v === "object") {
        /* Una selección escrita como {name: …}. */
        const n = (v as any)?.name;
        if (typeof n === "string") return n;
        throw fallo(422, "INVALID_VALUE_FOR_COLUMN", `${c.nombre}: no es texto`);
      }
      return String(v);
    case "num": {
      if (vacio) return null;
      const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
      if (!Number.isFinite(n)) throw fallo(422, "INVALID_VALUE_FOR_COLUMN", `${c.nombre}: no es un número`);
      return n;
    }
    case "bool":
      return v === true || v === 1 || v === "true" || v === "1";
    case "fecha": {
      if (vacio) return null;
      const s = String(v);
      if (/^\d{4}-\d{2}-\d{2}$/.test(s.slice(0, 10)) && !Number.isNaN(Date.parse(s.slice(0, 10)))) return s.slice(0, 10);
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) throw fallo(422, "INVALID_VALUE_FOR_COLUMN", `${c.nombre}: fecha no válida`);
      return d.toISOString().slice(0, 10);
    }
    case "fechahora": {
      if (vacio) return null;
      const d = new Date(String(v));
      if (Number.isNaN(d.getTime())) throw fallo(422, "INVALID_VALUE_FOR_COLUMN", `${c.nombre}: fecha no válida`);
      return d.toISOString();
    }
    case "multi":
      if (vacio) return [];
      if (Array.isArray(v)) return v.map((x) => (typeof x === "object" && x ? (x as any).name : String(x))).filter(Boolean);
      return String(v).split(",").map((x) => x.trim()).filter(Boolean);
    case "enlace": {
      if (vacio) return [];
      const lista = Array.isArray(v) ? v : [v];
      return [...new Set(lista.map((x) => (typeof x === "object" && x ? (x as any).id : String(x))).filter(Boolean))];
    }
    default:
      throw fallo(422, "INVALID_VALUE_FOR_COLUMN", c.nombre);
  }
}

/* Adjuntos: {id} conserva uno que ya estaba; {url} añade uno nuevo. Si la
   url es un enlace firmado de nuestro propio bucket (el escudo del club que
   se copia a sus equipos), se guarda la ruta, no el enlace, que caduca. */
function convertirAdjuntos(c: Campo, v: unknown, actuales: any[]): any[] {
  if (v === null || v === undefined || v === "") return [];
  if (!Array.isArray(v)) throw fallo(422, "INVALID_ATTACHMENT_OBJECT", c.nombre);
  return v.map((a: any) => {
    if (a && a.id && !a.url) {
      const previo = actuales.find((x) => x.id === a.id);
      if (!previo) throw fallo(422, "INVALID_ATTACHMENT_OBJECT", `${c.nombre}: adjunto ${a.id} no existe`);
      return previo;
    }
    if (!a || typeof a.url !== "string") throw fallo(422, "INVALID_ATTACHMENT_OBJECT", c.nombre);
    const propia = a.url.match(RUTA_FIRMADA);
    const base = { id: nuevoIdAdjunto(), filename: a.filename || (propia ? decodeURIComponent(propia[1]).split("/").pop() : "archivo") };
    return propia ? { ...base, path: decodeURIComponent(propia[1]), type: a.type || undefined } : { ...base, url: a.url };
  });
}

function campoDe(t: Tabla, clave: string): Campo {
  const c = t.porId.get(clave) || t.porNombre.get(clave);
  if (!c) throw fallo(422, "UNKNOWN_FIELD_NAME", `Unknown field name: "${clave}"`);
  return c;
}
function aFila(t: Tabla, fields: Record<string, unknown>, actual: any | null): Record<string, unknown> {
  const fila: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields || {})) {
    const c = campoDe(t, k);
    fila[c.col] = c.tipo === "adjuntos" ? convertirAdjuntos(c, v, actual?.[c.col] || []) : convertir(c, v);
  }
  return fila;
}

/* ---------- de Postgres a Airtable ---------- */
async function firmar(rutas: string[]): Promise<Map<string, string>> {
  const m = new Map<string, string>();
  const unicas = [...new Set(rutas)];
  if (!unicas.length) return m;
  try {
    const r = await red()(`${SB_URL()}/storage/v1/object/sign/${BUCKET}`, {
      method: "POST",
      headers: cabeceras({ "content-type": "application/json" }),
      body: JSON.stringify({ expiresIn: FIRMA_SEGUNDOS, paths: unicas }),
    });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    for (const x of (await r.json()) as any[]) {
      if (x?.signedURL) m.set(x.path, `${SB_URL()}/storage/v1${x.signedURL}`);
    }
  } catch (e) {
    /* Sin enlace firmado el adjunto sale sin url: la app pinta el hueco, pero
       el resto de la respuesta (que es lo importante) llega entera. */
    console.error(`[supabase] firmar adjuntos: ${e}`);
  }
  return m;
}

async function salida(t: Tabla, filas: any[], porId: boolean): Promise<any[]> {
  const adj = t.campos.filter((c) => c.tipo === "adjuntos");
  const rutas = filas.flatMap((f) => adj.flatMap((c) => (f[c.col] || []).map((a: any) => a.path).filter(Boolean)));
  const firmadas = await firmar(rutas);
  return filas.map((f) => {
    const fields: Record<string, unknown> = {};
    for (const c of t.campos) {
      let v = f[c.col];
      if (v === null || v === undefined || v === false || v === "" || (Array.isArray(v) && v.length === 0)) continue;
      if (c.tipo === "num") v = Number(v);
      else if (c.tipo === "fechahora") v = new Date(String(v)).toISOString();
      else if (c.tipo === "adjuntos") {
        v = (v as any[]).map((a) => {
          const url = a.path ? firmadas.get(a.path) : a.url;
          return { id: a.id, ...(url ? { url } : {}), filename: a.filename, ...(a.size ? { size: a.size } : {}), ...(a.type ? { type: a.type } : {}) };
        });
      }
      fields[porId ? c.id : c.nombre] = v;
    }
    return { id: f.id, createdTime: new Date(f.created_at).toISOString(), fields };
  });
}

/* ---------- operaciones ---------- */
async function crear(t: Tabla, fields: Record<string, unknown>): Promise<any> {
  const filas = await rest(t.nombre, { method: "POST", body: aFila(t, fields, null), prefer: "return=representation" });
  return filas[0];
}
async function editar(t: Tabla, rec: string, fields: Record<string, unknown>): Promise<any> {
  const conAdjuntos = Object.keys(fields || {}).some((k) => campoDe(t, k).tipo === "adjuntos");
  const actual = conAdjuntos ? await una(t, rec) : null;
  if (conAdjuntos && !actual) throw fallo(404, "NOT_FOUND", rec);
  if (!ES_REC.test(rec)) throw fallo(404, "NOT_FOUND", rec);
  const fila = aFila(t, fields, actual);
  /* PATCH sin campos: Airtable devuelve el registro tal cual. */
  if (!Object.keys(fila).length) {
    const f = actual || (await una(t, rec));
    if (!f) throw fallo(404, "NOT_FOUND", rec);
    return f;
  }
  const filas = await rest(`${t.nombre}?id=eq.${encodeURIComponent(rec)}`, { method: "PATCH", body: fila, prefer: "return=representation" });
  if (!filas.length) throw fallo(404, "NOT_FOUND", rec);
  return filas[0];
}
async function borrar(t: Tabla, ids: string[]): Promise<string[]> {
  const validos = ids.filter((x) => ES_REC.test(x));
  if (!validos.length) return [];
  const filas = await rest(`${t.nombre}?id=${enLista(validos)}`, { method: "DELETE", prefer: "return=representation" });
  return filas.map((f: any) => f.id);
}

/* uploadAttachment: añade el archivo al campo (no sustituye: Airtable
   tampoco) y devuelve el registro con los campos por id. */
async function subirAdjunto(rec: string, fieldId: string, b: any): Promise<Response> {
  const t = tablaDeCampo(fieldId);
  const c = t?.porId.get(fieldId);
  if (!t || !c || c.tipo !== "adjuntos") return J({ error: { type: "INVALID_FIELD", message: fieldId } }, 422);
  const actual = await una(t, rec);
  if (!actual) return J({ error: "NOT_FOUND" }, 404);
  const b64 = String(b?.file || "").replace(/^data:[^,]*,/, "");
  if (!b64) return J({ error: { type: "INVALID_REQUEST", message: "falta el archivo" } }, 422);
  const bytes = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
  const tipo = String(b?.contentType || "application/octet-stream");
  const nombre = String(b?.filename || "archivo").replace(/[^\w.\-]+/g, "_").slice(-80) || "archivo";
  const ruta = `${t.nombre}/${rec}/${fieldId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${nombre}`;
  const r = await red()(`${SB_URL()}/storage/v1/object/${BUCKET}/${ruta.split("/").map(encodeURIComponent).join("/")}`, {
    method: "POST",
    headers: cabeceras({ "content-type": tipo, "x-upsert": "false" }),
    body: bytes,
  });
  if (!r.ok) {
    console.error(`[supabase] subir ${ruta} → ${r.status}: ${(await r.text()).slice(0, 300)}`);
    return J({ error: { type: "UPLOAD_FAILED", message: String(r.status) } }, r.status === 413 ? 413 : 422);
  }
  const lista = [...(actual[c.col] || []), { id: nuevoIdAdjunto(), path: ruta, filename: b?.filename || nombre, type: tipo, size: bytes.length }];
  const filas = await rest(`${t.nombre}?id=eq.${encodeURIComponent(rec)}`, { method: "PATCH", body: { [c.col]: lista }, prefer: "return=representation" });
  const [out] = await salida(t, filas, true);
  return J(out);
}

/* ---------- el despachador ---------- */
async function comoAirtable(u: string, init: RequestInit): Promise<Response> {
  try {
    const url = new URL(u);
    const m = String(init.method || "GET").toUpperCase();
    const cuerpo = init.body ? JSON.parse(String(init.body)) : {};
    const p = url.pathname.split("/").filter(Boolean).map(decodeURIComponent); // v0 / base / …

    if (url.hostname === "content.airtable.com") {
      if (m !== "POST" || p[4] !== "uploadAttachment") return J({ error: "NOT_FOUND" }, 404);
      return await subirAdjunto(p[2], p[3], cuerpo);
    }

    const t = tablaPorAirtable.get(p[2]) || tablaPorNombre.get(p[2]);
    if (!t) return J({ error: { type: "TABLE_NOT_FOUND", message: p[2] } }, 404);
    const rec = p[3] || "";
    const porId = url.searchParams.get("returnFieldsByFieldId") === "true" || cuerpo?.returnFieldsByFieldId === true;

    if (rec === "listRecords" && m === "POST") {
      return J({ records: await salida(t, await filtrar(t, String(cuerpo?.filterByFormula || "")), porId) });
    }
    if (!rec) {
      if (m === "GET") return J({ records: await salida(t, await filtrar(t, url.searchParams.get("filterByFormula") || ""), porId) });
      if (m === "POST") {
        if (Array.isArray(cuerpo?.records)) {
          const creadas = [];
          for (const x of cuerpo.records) creadas.push(await crear(t, x?.fields || {}));
          return J({ records: await salida(t, creadas, porId) });
        }
        const [out] = await salida(t, [await crear(t, cuerpo?.fields || {})], porId);
        return J(out);
      }
      if (m === "PATCH") {
        const hechas = [];
        for (const x of cuerpo?.records || []) hechas.push(await editar(t, String(x?.id || ""), x?.fields || {}));
        return J({ records: await salida(t, hechas, porId) });
      }
      if (m === "DELETE") {
        const ids = url.searchParams.getAll("records[]");
        const borrados = await borrar(t, ids);
        return J({ records: borrados.map((id) => ({ id, deleted: true })) });
      }
    } else {
      if (m === "GET") {
        const f = await una(t, rec);
        if (!f) return J({ error: "NOT_FOUND" }, 404);
        const [out] = await salida(t, [f], porId);
        return J(out);
      }
      if (m === "PATCH") {
        const [out] = await salida(t, [await editar(t, rec, cuerpo?.fields || {})], porId);
        return J(out);
      }
      if (m === "DELETE") {
        const borrados = await borrar(t, [rec]);
        if (!borrados.length) return J({ error: "NOT_FOUND" }, 404);
        return J({ deleted: true, id: rec });
      }
    }
    return J({ error: { type: "INVALID_REQUEST", message: `${m} ${url.pathname}` } }, 400);
  } catch (e: any) {
    if (e && typeof e.status === "number") {
      if (e.status === 404) return J({ error: "NOT_FOUND" }, 404);
      return J({ error: { type: e.type, message: e.message } }, e.status);
    }
    console.error(`[supabase] ${e?.stack || e}`);
    return J({ error: { type: "SERVER_ERROR", message: String(e) } }, 500);
  }
}
