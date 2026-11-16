/* ============================================================
   Convocatoria · lo que hay que saber antes de marcar a nadie
   ------------------------------------------------------------
   Dos cuentas que la pantalla de Convocatoria enseña debajo de cada nombre:
   a cuántos entrenos ha faltado esta semana, y si se quedó fuera del partido
   anterior y por qué. Viven aquí, fuera de App.jsx, porque las reglas no son
   obvias -qué cuenta como falta, cuál es "el partido anterior"- y así se
   pueden probar sin montar la app (ver pruebas/pruebas29).
   ============================================================ */

/* Los motivos por los que alguien se queda fuera de una convocatoria. El
   servidor valida contra esta misma lista (ver airtable.mts). */
export const MOTIVOS_DESCARTE = ["tecnica", "lesion", "sancion", "viaje"];

const ES_DIA = /^\d{4}-\d{2}-\d{2}$/;
const restarDias = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  const f = new Date(y, m - 1, d, 12, 0, 0);
  f.setDate(f.getDate() - n);
  const p = (x) => String(x).padStart(2, "0");
  return `${f.getFullYear()}-${p(f.getMonth() + 1)}-${p(f.getDate())}`;
};

/* Los días de los que hay lista pasada en la última semana (hoy incluido).
   Un día que nadie abrió no es falta de nadie, así que los días vacíos no
   cuentan ni como denominador. */
export const diasConListaReciente = (asistencia, hoy, dias = 7) => {
  if (!ES_DIA.test(String(hoy || ""))) return [];
  const desde = restarDias(hoy, dias - 1);
  return Object.entries(asistencia || {})
    .filter(([d, m]) => ES_DIA.test(d) && d >= desde && d <= hoy && m && Object.keys(m).length > 0)
    .sort((a, b) => a[0].localeCompare(b[0]));
};

/* A cuántos de esos días faltó un jugador, y por qué. Sin marca ese día no
   es una falta: es que a él no le pasaron lista, no que no viniera. Devuelve
   null cuando no faltó a ninguno, para no enseñar un aviso vacío. */
export const faltasEnDias = (diasConLista, pid) => {
  if (!diasConLista?.length) return null;
  const faltas = diasConLista.filter(([, m]) => m[pid] && m[pid] !== "presente");
  if (!faltas.length) return null;
  return { n: faltas.length, de: diasConLista.length, motivos: [...new Set(faltas.map(([, m]) => m[pid]))] };
};

/* La última convocatoria mandada antes de hoy. Las filas llegan del servidor
   con los campos por nombre (Fecha, Rival, Convocados, Descartes).
   Una convocatoria sin nadie dentro no sirve de referencia: diría que no fue
   toda la plantilla. Y una de hoy o de mañana tampoco: es la que se está
   preparando, no el partido anterior. */
export const ultimaConvocatoria = (filas, hoy) => {
  if (!ES_DIA.test(String(hoy || ""))) return null;
  const previas = (filas || [])
    .filter((c) => ES_DIA.test(String(c?.Fecha || "")) && String(c.Fecha) < hoy && (c.Convocados || []).length)
    .sort((a, b) => String(b.Fecha).localeCompare(String(a.Fecha)));
  const c = previas[0];
  if (!c) return null;
  let motivos = {};
  try {
    const d = JSON.parse(c.Descartes || "{}");
    if (d && typeof d === "object" && !Array.isArray(d)) {
      for (const [k, v] of Object.entries(d)) if (MOTIVOS_DESCARTE.includes(v)) motivos[k] = v;
    }
  } catch { /* json roto: se queda sin motivos, pero la lista sigue valiendo */ }
  return { fecha: String(c.Fecha), rival: String(c.Rival || ""), convocados: new Set(c.Convocados), motivos };
};
