/* ================= RETRANSMISIÓN EN DIRECTO =================
   El entrenador activa la retransmisión desde el Modo partido y manda un
   enlace al grupo (/vivo/?c=…). Quien lo abre ve el marcador, el minuto y
   los goles con su asistente, sin cuenta y sin instalar nada; y si pulsa
   "Avisarme de los goles", le llega un aviso con cada gol, el descanso y el
   final aunque tenga el móvil bloqueado.

   Lo que sale al público lo compone limpiarDatos: una lista cerrada de
   campos, recortados. Nada de plantilla, notas, estadísticas ni datos de los
   jugadores más allá del nombre de quien marca, asiste, entra o sale, como lo
   haya elegido el entrenador (nombre e inicial, completo o solo el dorsal).

   Un enlace por equipo: sirve para todos los partidos hasta que el
   entrenador lo desactiva, y entre partido y partido sigue enseñando el
   último resultado. Solo con los datos en Supabase. */
import { rest } from "./supabase-airtable.mts";
import { avisarVivo, clavePublica } from "./avisos.mts";

const enc = encodeURIComponent;
export const CODIGO_OK = /^[A-Za-z0-9]{16}$/;
const ESTADOS = ["previa", "p1", "p2", "pr1", "pr2", "descanso", "pen", "final"];
const IDIOMAS = ["es", "en", "fr", "de", "pt"];

const txt = (v: unknown, n: number) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
const num = (v: unknown, min: number, max: number, def = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? Math.min(max, Math.max(min, Math.round(x))) : def;
};
/* Escudos: una dirección https o una ruta de la propia web; nunca data: ni
   javascript:. */
const escudo = (v: unknown) => {
  const s = String(v || "").trim();
  return /^https:\/\/[^\s"'<>]+$/.test(s) || /^\/[A-Za-z0-9._\-/]+$/.test(s) ? s.slice(0, 1500) : "";
};

export function limpiarDatos(d: any) {
  const ahora = Date.now();
  const r = d?.reloj || {};
  const desde = Number(r.desde);
  const goles = (Array.isArray(d?.goles) ? d.goles : []).slice(0, 40).map((g: any, i: number) => ({
    id: txt(g?.id, 40) || String(i),
    lado: g?.lado === "them" ? "them" : "us",
    min: txt(g?.min, 8),
    nombre: g?.lado === "them" ? "" : txt(g?.nombre, 60),
    asist: g?.lado === "them" ? "" : txt(g?.asist, 60),
  }));
  return {
    v: 1,
    lang: IDIOMAS.includes(d?.lang) ? d.lang : "es",
    partido: txt(d?.partido, 120),
    nos: { nombre: txt(d?.nos?.nombre, 80), sub: txt(d?.nos?.sub, 40), escudo: escudo(d?.nos?.escudo) },
    rival: { nombre: txt(d?.rival?.nombre, 80), escudo: escudo(d?.rival?.escudo) },
    casa: d?.casa !== false,
    competicion: txt(d?.competicion, 60),
    fecha: /^\d{4}-\d{2}-\d{2}$/.test(String(d?.fecha || "")) ? String(d.fecha) : "",
    hora: /^\d{1,2}:\d{2}$/.test(String(d?.hora || "")) ? String(d.hora) : "",
    lugar: txt(d?.lugar, 120),
    estado: ESTADOS.includes(d?.estado) ? d.estado : "previa",
    reloj: {
      base: num(r.base, 0, 20000),
      /* El ancla del reloj del móvil del entrenador: un instante de hoy, o
         nada si está parado. Una fecha absurda haría correr el minuto. */
      desde: Number.isFinite(desde) && Math.abs(desde - ahora) < 12 * 3600000 ? desde : null,
      periodBase: num(r.periodBase, 0, 200),
      periodLen: num(r.periodLen, 1, 90, 35),
    },
    score: { us: num(d?.score?.us, 0, 99), them: num(d?.score?.them, 0, 99) },
    pen: d?.pen ? { us: num(d.pen.us, 0, 30), them: num(d.pen.them, 0, 30) } : null,
    goles,
    /* Los cambios: minuto, quién entra y quién sale (con el formato de
       nombre que eligió el entrenador). Sin avisos push: serían demasiados. */
    cambios: (Array.isArray(d?.cambios) ? d.cambios : []).slice(0, 30).map((c: any, i: number) => ({
      id: txt(c?.id, 40) || `c${i}`,
      min: txt(c?.min, 8),
      entra: txt(c?.entra, 60),
      sale: txt(c?.sale, 60),
    })),
    t: ahora,
  };
}

const marcadorDe = (d: any) => {
  const a = d.casa ? d.nos.nombre : d.rival.nombre, b = d.casa ? d.rival.nombre : d.nos.nombre;
  const ga = d.casa ? d.score.us : d.score.them, gb = d.casa ? d.score.them : d.score.us;
  return `${a} ${ga}-${gb} ${b}`;
};

/* Qué ha pasado entre lo que había y lo nuevo que merece aviso: goles nuevos,
   el descanso y el final. */
export function avisosNuevos(codigo: string, viejo: any, nuevo: any) {
  const out: { titulo: string; cuerpo: string; tag: string; url: string; clave: string }[] = [];
  const base = { tag: `vivo-${codigo}`, url: `/vivo/?c=${codigo}` };
  const p = nuevo.partido || nuevo.fecha || "x";
  const mismoPartido = (viejo?.partido || "") === (nuevo.partido || "");
  const vistos = new Set(mismoPartido ? (viejo?.goles || []).map((g: any) => g.id) : []);
  for (const g of nuevo.goles) {
    if (vistos.has(g.id)) continue;
    const nuestro = g.lado === "us";
    out.push({
      ...base,
      titulo: nuestro ? `⚽ ¡GOL de ${nuevo.nos.nombre}!` : `Gol de ${nuevo.rival.nombre}`,
      cuerpo: `${marcadorDe(nuevo)}${nuestro && g.nombre ? ` · ${g.nombre}` : ""}${g.min ? `, ${g.min}′` : ""}`,
      clave: `vivo|${codigo}|${p}|gol|${g.id}`,
    });
  }
  if (nuevo.estado !== (mismoPartido ? viejo?.estado : "")) {
    if (nuevo.estado === "descanso") out.push({ ...base, titulo: "⏸ Descanso", cuerpo: marcadorDe(nuevo), clave: `vivo|${codigo}|${p}|descanso|${nuevo.reloj.periodBase}` });
    if (nuevo.estado === "final") out.push({ ...base, titulo: "🏁 Final del partido", cuerpo: marcadorDe(nuevo), clave: `vivo|${codigo}|${p}|final` });
  }
  return out;
}

const fila = async (codigo: string) =>
  (await rest(`retransmisiones?select=codigo,equipo,datos,activa,actualizado&codigo=eq.${enc(codigo)}`))[0] || null;
const json = (s: string) => { try { return JSON.parse(s || "{}"); } catch { return {}; } };
const nuevoCodigo = () => {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const b = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(b, (x) => abc[x % abc.length]).join("");
};

/* ---------- lo que hace el cuerpo técnico ---------- */
export const equipoDe = async (codigo: string) => (CODIGO_OK.test(codigo) ? (await fila(codigo))?.equipo || null : null);

export async function crearOReusar(equipo: string) {
  const ya = await rest(`retransmisiones?select=codigo&equipo=eq.${enc(equipo)}&activa=eq.true&order=creado.desc&limit=1`);
  if (ya[0]?.codigo) return { ok: true, codigo: ya[0].codigo };
  const codigo = nuevoCodigo();
  await rest("retransmisiones", { method: "POST", body: [{ codigo, equipo }], prefer: "return=minimal" });
  return { ok: true, codigo };
}

export async function actualizar(codigo: string, datos: unknown) {
  const f = await fila(codigo);
  if (!f) return { ok: false, reason: "no_existe" };
  if (!f.activa) return { ok: false, reason: "desactivada" };
  const nuevo = limpiarDatos(datos);
  await rest(`retransmisiones?codigo=eq.${enc(codigo)}`, {
    method: "PATCH", body: { datos: JSON.stringify(nuevo), actualizado: new Date().toISOString() }, prefer: "return=minimal",
  });
  let avisados = 0;
  for (const a of avisosNuevos(codigo, json(f.datos), nuevo)) avisados += await avisarVivo(codigo, a).catch(() => 0);
  return { ok: true, avisados };
}

export async function desactivar(codigo: string) {
  await rest(`retransmisiones?codigo=eq.${enc(codigo)}`, { method: "PATCH", body: { activa: false }, prefer: "return=minimal" });
  await rest(`vivo_avisos?codigo=eq.${enc(codigo)}`, { method: "DELETE" }).catch(() => {});
  return { ok: true };
}

/* ---------- lo que hace el público (sin cuenta) ---------- */
export async function leerPublico(codigo: string) {
  if (!CODIGO_OK.test(codigo)) return null;
  const f = await fila(codigo);
  if (!f) return null;
  return { ok: true, activa: !!f.activa, datos: f.activa ? json(f.datos) : null, clave: f.activa ? await clavePublica().catch(() => "") : "" };
}

/* ---------- lo que ve quien es del equipo, dentro de la app ---------- */
/* El directo activo de un equipo (el más reciente): la página de la familia
   lo enseña sin que haga falta el enlace de WhatsApp. */
export async function activaDeEquipo(equipo: string) {
  const f = (await rest(`retransmisiones?select=codigo,datos&equipo=eq.${enc(equipo)}&activa=eq.true&order=creado.desc&limit=1`))[0];
  if (!f) return { ok: true, activa: false, codigo: null, datos: null };
  return { ok: true, activa: true, codigo: f.codigo, datos: json(f.datos) };
}

export async function suscribirPublico(codigo: string, sub: any) {
  if (!CODIGO_OK.test(codigo)) return { ok: false, reason: "no_existe" };
  const f = await fila(codigo);
  if (!f?.activa) return { ok: false, reason: "no_existe" };
  const endpoint = String(sub?.endpoint || ""), p256dh = String(sub?.keys?.p256dh || ""), auth = String(sub?.keys?.auth || "");
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !p256dh || !auth || p256dh.length > 200 || auth.length > 100) {
    return { ok: false, reason: "suscripcion_no_valida" };
  }
  const n = await rest(`vivo_avisos?select=id&codigo=eq.${enc(codigo)}&limit=2000`);
  if (n.length >= 2000) return { ok: false, reason: "lleno" };
  await rest("vivo_avisos?on_conflict=codigo,endpoint", {
    method: "POST", body: [{ codigo, endpoint, p256dh, auth }], prefer: "resolution=merge-duplicates,return=minimal",
  });
  return { ok: true };
}

export async function desuscribirPublico(codigo: string, endpoint: string) {
  if (!CODIGO_OK.test(codigo) || !endpoint) return { ok: true };
  await rest(`vivo_avisos?codigo=eq.${enc(codigo)}&endpoint=eq.${enc(endpoint)}`, { method: "DELETE" }).catch(() => {});
  return { ok: true };
}
