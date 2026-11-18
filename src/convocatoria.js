/* ============================================================
   Convocatoria · lo que hay que saber antes de marcar a nadie
   ------------------------------------------------------------
   Dos cuentas que la pantalla de Convocatoria enseña debajo de cada nombre:
   a cuántos entrenos ha faltado esta semana, y si se quedó fuera del partido
   anterior y por qué. Viven aquí, fuera de App.jsx, porque las reglas no son
   obvias -qué cuenta como falta, cuál es "el partido anterior"- y así se
   pueden probar sin montar la app (ver pruebas/pruebas29).
   ============================================================ */

import { partidosConFicha, fichaEnPartido } from "./estadisticas.js";

/* Los motivos por los que alguien se queda fuera de una convocatoria. El
   servidor valida contra esta misma lista (ver airtable.mts). */
export const MOTIVOS_DESCARTE = ["tecnica", "lesion", "sancion", "viaje"];

/* Cómo llega un jugador. Es el campo Estado de su ficha, el mismo que se
   toca en Jugadores, en Lesiones y en Alineación. */
export const ESTADOS_JUGADOR = ["disponible", "duda", "lesionado", "sancionado"];
/* Lesionado o sancionado no se convoca: no es una preferencia del
   entrenador, es que no puede jugar ("el sancionado tampoco se puede
   convocar", Edu, 17 nov 2026). Una duda sí se convoca: eso se decide el
   sábado. */
export const ESTADOS_NO_CONVOCABLES = { lesionado: "lesion", sancionado: "sancion" };
export const noConvocable = (p) => !!p && !!ESTADOS_NO_CONVOCABLES[p.st];
/* Al marcar a alguien lesionado o sancionado deja de estar convocado en el
   acto y su motivo pasa a ser ese; al volver a estar disponible se le quita
   -si vuelve a quedarse fuera será por otra cosa, y la decide el entrenador-,
   pero solo si era el motivo que había puesto la app: un motivo escrito a
   mano por el entrenador no se toca. Por eso hace falta saber de qué estado
   viene. Devuelve la convocatoria y los motivos ya corregidos. */
export const trasCambiarEstado = (pid, estado, convocados, descartes, anterior) => {
  const ids = new Set(convocados || []);
  const mot = { ...(descartes || {}) };
  const motivo = ESTADOS_NO_CONVOCABLES[estado];
  if (motivo) { ids.delete(pid); mot[pid] = motivo; }
  else if (ESTADOS_NO_CONVOCABLES[anterior] && mot[pid] === ESTADOS_NO_CONVOCABLES[anterior]) delete mot[pid];
  return { convocados: [...ids], descartes: mot };
};

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

/* ---- Quién habría que mirar dos veces antes de convocar ----
   Tres señales, y las tres estaban en la app sin juntarse en ninguna parte:
   a quién faltó a los entrenos de la semana, a quién se quedó fuera del
   partido anterior y a quién expulsaron en el último -que no puede jugar el
   siguiente-. ("Posibles desconvocados los que falten al entreno y los que
   no fueron al partido anterior y los expulsados", Edu, 18 nov 2026.)
   El lesionado y el sancionado no entran aquí: esos no es que haya que
   mirarlos, es que ya no son convocables (ver `noConvocable`). */

/* El último partido con acta. Se ordena por fecha y no se da por hecho el
   orden del histórico: viene del más nuevo al más viejo, pero confiarse de
   eso es cómo se acaba enseñando el partido de hace tres jornadas. */
export const ultimoPartidoConFicha = (historial) => {
  const ps = partidosConFicha(historial);
  if (!ps.length) return null;
  return [...ps].sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")))[0];
};

/* ¿Le expulsaron en ese último partido? Roja directa o doble amarilla: en
   los dos casos se pierde el siguiente. */
export const expulsadoEnElAnterior = (historial, p) => {
  const m = ultimoPartidoConFicha(historial);
  if (!m || !p || p.apoyo) return null;
  const j = fichaEnPartido(m, p);
  if (!j) return null;
  const rojas = Number(j.rojas) || 0;
  const dobles = Number(j.dobleAmarilla) || 0;
  if (!rojas && !dobles) return null;
  return { tipo: rojas ? "roja" : "doble", fecha: m.fecha || "", rival: m.rival || "" };
};

/* Las razones por las que este jugador sale en "posibles descartes", de la
   más seria a la más leve: una expulsión no se discute, faltar al entreno
   es del entrenador, y no haber ido al anterior es solo un recordatorio. */
export const RAZONES_DESCARTE = ["expulsado", "faltas", "anterior"];
export const razonesDeDescarte = ({ faltas, fuera, expulsado } = {}) => {
  const out = [];
  if (expulsado) out.push("expulsado");
  if (faltas && Number(faltas.n) > 0) out.push("faltas");
  if (fuera) out.push("anterior");
  return out;
};
