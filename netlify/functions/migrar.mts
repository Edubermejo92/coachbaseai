/* ================= MIGRACIÓN ÚNICA: AIRTABLE → SUPABASE =================
   Copia la base Airtable "COACHBASE AI" a Supabase con los mismos ids (rec…)
   y en el mismo orden, y vuelve a alojar los adjuntos (escudos, fotos,
   documentos) en el bucket privado de Supabase: los enlaces de Airtable
   caducan a las pocas horas.

   Se usa UNA vez, desde el navegador:
     https://<la app>/.netlify/functions/migrar?clave=<MIGRAR_CLAVE>
   La página avanza sola paso a paso (Netlify corta cada llamada a los 10 s)
   y al final enseña cuántos registros hay en cada lado.

   Seguridad: sin la variable MIGRAR_CLAVE en Netlify esta función no existe
   (404), y con ella exige esa misma clave en la URL. Si Supabase ya tiene
   datos se niega a empezar: re-ejecutarla después de usar la app pisaría
   lo nuevo con lo de Airtable. Al terminar, borra MIGRAR_CLAVE de Netlify.

   Variables: AIRTABLE_TOKEN, AIRTABLE_BASE (opcional), SUPABASE_URL,
   SUPABASE_SERVICE_ROLE_KEY, MIGRAR_CLAVE. */
import { TABLAS, type Tabla } from "../lib/esquema-coachbase.mts";
import { rest, convertir, cabeceras, SB_URL, BUCKET } from "../lib/supabase-airtable.mts";

const BASE = () => Netlify.env.get("AIRTABLE_BASE") || "appDVtUWdtfzkV1sA";
const AT_TOKEN = () => Netlify.env.get("AIRTABLE_TOKEN") || "";
/* Adjuntos que se suben por llamada: cada uno es una descarga de Airtable y
   una subida a Supabase, y la llamada entera tiene que caber en 10 s. */
const ADJUNTOS_POR_PASO = 6;

const esc = (s: unknown) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const pagina = (titulo: string, cuerpo: string, siguiente?: string) => new Response(
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
${siguiente ? `<meta http-equiv="refresh" content="1;url=${esc(siguiente)}">` : ""}
<title>${esc(titulo)}</title>
<body style="font-family:system-ui,sans-serif;max-width:640px;margin:24px auto;padding:0 16px;line-height:1.5">
<h1 style="font-size:20px">${esc(titulo)}</h1>${cuerpo}
${siguiente ? `<p style="color:#666">Siguiente paso en 1 segundo… <a href="${esc(siguiente)}">o pulsa aquí</a>. No cierres esta página.</p>` : ""}
</body>`,
  { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
);
const igualSeguro = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

async function leerAirtable(t: Tabla): Promise<any[]> {
  const out: any[] = [];
  let offset = "";
  for (let i = 0; i < 100; i++) {
    const u = `https://api.airtable.com/v0/${BASE()}/${t.airtable}?pageSize=100&returnFieldsByFieldId=true${offset ? `&offset=${encodeURIComponent(offset)}` : ""}`;
    const r = await fetch(u, { headers: { Authorization: `Bearer ${AT_TOKEN()}` } });
    if (!r.ok) throw new Error(`Airtable ${t.nombre}: ${r.status} ${(await r.text()).slice(0, 200)}`);
    const d = await r.json();
    out.push(...(d.records || []));
    offset = d.offset || "";
    if (!offset) return out;
  }
  throw new Error(`Airtable ${t.nombre}: demasiadas páginas`);
}

/* Una fila de Postgres a partir de un registro de Airtable. Van TODAS las
   columnas (las vacías con su valor por defecto) para que PostgREST acepte
   el lote entero. Los adjuntos se guardan con la url de Airtable y la marca
   "pendiente": el paso de adjuntos los descarga y los sube a Supabase. */
function aFila(t: Tabla, rec: any) {
  const fila: Record<string, unknown> = { id: rec.id, created_at: rec.createdTime };
  for (const c of t.campos) {
    const v = rec.fields?.[c.id];
    if (c.tipo === "adjuntos") {
      fila[c.col] = (Array.isArray(v) ? v : []).map((a: any) => ({
        id: a.id, url: a.url, filename: a.filename || "archivo", type: a.type, size: a.size, pendiente: true,
      }));
    } else {
      fila[c.col] = convertir(c, v);
    }
  }
  return fila;
}

/* Supabase devuelve como mucho 1000 filas por consulta: se cuenta por páginas. */
async function contar(t: Tabla): Promise<number> {
  let n = 0;
  for (let desde = 0; ; desde += 1000) {
    const filas = await rest(`${t.nombre}?select=id&order=_orden.asc&limit=1000&offset=${desde}`);
    n += filas.length;
    if (filas.length < 1000) return n;
  }
}

/* Paso N de tablas: copia la tabla N entera (upsert por id). */
async function pasoTabla(i: number) {
  const t = TABLAS[i];
  const recs = await leerAirtable(t);
  const filas = recs.map((r) => aFila(t, r));
  for (let k = 0; k < filas.length; k += 200) {
    await rest(`${t.nombre}?on_conflict=id`, {
      method: "POST", body: filas.slice(k, k + 200), prefer: "resolution=merge-duplicates,return=minimal",
    });
  }
  return recs.length;
}

/* Paso de adjuntos: sube los siguientes pendientes. Devuelve cuántos quedan. */
async function pasoAdjuntos(): Promise<{ subidos: number; quedan: number; errores: string[] }> {
  let subidos = 0, quedan = 0;
  const errores: string[] = [];
  for (const t of TABLAS) {
    const cols = t.campos.filter((c) => c.tipo === "adjuntos");
    if (!cols.length) continue;
    const filas = await rest(`${t.nombre}?select=id,${cols.map((c) => c.col).join(",")}&order=_orden.asc`);
    for (const f of filas) {
      for (const c of cols) {
        const lista: any[] = f[c.col] || [];
        if (!lista.some((a) => a.pendiente)) continue;
        if (subidos >= ADJUNTOS_POR_PASO) { quedan += lista.filter((a) => a.pendiente).length; continue; }
        const nueva = [];
        for (const a of lista) {
          if (!a.pendiente || subidos >= ADJUNTOS_POR_PASO) {
            if (a.pendiente) quedan++;
            nueva.push(a);
            continue;
          }
          try {
            const bajada = await fetch(a.url);
            if (!bajada.ok) throw new Error(`descarga ${bajada.status}`);
            const bytes = new Uint8Array(await bajada.arrayBuffer());
            const nombre = String(a.filename || "archivo").replace(/[^\w.\-]+/g, "_").slice(-80) || "archivo";
            const ruta = `${t.nombre}/${f.id}/${c.id}/${a.id}-${nombre}`;
            const r = await fetch(`${SB_URL()}/storage/v1/object/${BUCKET}/${ruta.split("/").map(encodeURIComponent).join("/")}`, {
              method: "POST",
              headers: cabeceras({ "content-type": a.type || "application/octet-stream", "x-upsert": "true" }),
              body: bytes,
            });
            if (!r.ok) throw new Error(`subida ${r.status} ${(await r.text()).slice(0, 120)}`);
            nueva.push({ id: a.id, path: ruta, filename: a.filename, type: a.type, size: bytes.length });
            subidos++;
          } catch (e) {
            /* Se deja como estaba (con la url de Airtable) y se apunta: no
               bloquea el resto. Se puede reintentar con &paso=adjuntos. */
            errores.push(`${t.nombre}/${f.id}/${c.nombre}/${a.filename}: ${e}`);
            nueva.push({ ...a, pendiente: false, error: String(e) });
          }
        }
        await rest(`${t.nombre}?id=eq.${encodeURIComponent(f.id)}`, { method: "PATCH", body: { [c.col]: nueva }, prefer: "return=minimal" });
      }
    }
  }
  return { subidos, quedan, errores };
}

export default async (req: Request) => {
  const clave = Netlify.env.get("MIGRAR_CLAVE") || "";
  const url = new URL(req.url);
  if (!clave) return new Response("Not found", { status: 404 });
  if (!igualSeguro(url.searchParams.get("clave") || "", clave)) return new Response("Clave incorrecta", { status: 403 });
  if (!AT_TOKEN() || !SB_URL() || !Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
    return pagina("Faltan variables", "<p>Hacen falta AIRTABLE_TOKEN, SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Netlify.</p>");
  }
  const base = `${url.origin}${url.pathname}?clave=${encodeURIComponent(clave)}`;
  const paso = url.searchParams.get("paso") || "inicio";

  try {
    if (paso === "inicio") {
      const conDatos: string[] = [];
      for (const t of TABLAS) if ((await contar(t)) > 0) conDatos.push(t.nombre);
      if (conDatos.length && url.searchParams.get("forzar") !== "1") {
        return pagina("Supabase ya tiene datos",
          `<p>Estas tablas ya tienen registros: <b>${esc(conDatos.join(", "))}</b>.</p>
           <p>No sigo para no pisar nada. Si estás seguro de que quieres volver a copiar desde Airtable
           (lo de Airtable sustituye a lo que haya con el mismo id), añade <code>&amp;forzar=1</code> a la dirección.</p>`);
      }
      return pagina("Empezando la copia", `<p>${TABLAS.length} tablas y después los archivos.</p>`, `${base}&paso=0`);
    }
    if (/^\d+$/.test(paso)) {
      const i = Number(paso);
      const n = await pasoTabla(i);
      const sig = i + 1 < TABLAS.length ? `${base}&paso=${i + 1}` : `${base}&paso=adjuntos`;
      return pagina(`Tabla ${i + 1} de ${TABLAS.length}: ${TABLAS[i].nombre}`, `<p>${n} registros copiados.</p>`, sig);
    }
    if (paso === "adjuntos") {
      const r = await pasoAdjuntos();
      const errores = r.errores.length ? `<p style="color:#b00">Con error (se quedan con el enlace de Airtable):</p><ul>${r.errores.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>` : "";
      return pagina("Archivos", `<p>${r.subidos} subidos en este paso, quedan ${r.quedan}.</p>${errores}`,
        r.quedan > 0 ? `${base}&paso=adjuntos` : `${base}&paso=comprobar`);
    }
    if (paso === "comprobar") {
      let filasHtml = "", todoBien = true;
      for (const t of TABLAS) {
        const [a, s] = [(await leerAirtable(t)).length, await contar(t)];
        if (a !== s) todoBien = false;
        filasHtml += `<tr><td>${esc(t.nombre)}</td><td align="right">${a}</td><td align="right">${s}</td><td>${a === s ? "✓" : "✗"}</td></tr>`;
      }
      return pagina(todoBien ? "Copia terminada ✓" : "Copia terminada con diferencias ✗",
        `<table cellpadding="4" style="border-collapse:collapse"><tr><th align="left">Tabla</th><th>Airtable</th><th>Supabase</th><th></th></tr>${filasHtml}</table>
         <p>${todoBien ? "Todo cuadra." : "Algún recuento no cuadra: avisa antes de usar la app."}
         Ahora borra la variable <b>MIGRAR_CLAVE</b> en Netlify.</p>`);
    }
    return pagina("Paso desconocido", `<p>${esc(paso)}</p>`);
  } catch (e: any) {
    const msg = e?.message || (e?.status ? `${e.status} ${e.type}: ${String(e.message || "").slice(0, 300)}` : String(e));
    return pagina("Error", `<p style="color:#b00">${esc(msg)}</p><p><a href="${esc(`${base}&paso=${paso}`)}">Reintentar este paso</a></p>`);
  }
};
