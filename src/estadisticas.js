/* ============================================================
   Estadísticas · lo que de verdad ha pasado esta temporada
   ------------------------------------------------------------
   Todo lo de aquí sale del HISTÓRICO de partidos: cada partido guardado
   lleva la ficha de cada jugador -titular, minutos, goles, tarjetas- y el
   acta entera, con el dorsal de quien dio cada pase de gol.

   Por qué vive aquí y no en App.jsx: hasta ahora la pantalla de
   Estadísticas enseñaba los minutos del campo "Minutos" de la ficha del
   jugador, y ese campo NO lo escribe nadie. Se lee de Airtable, se vuelve a
   guardar tal cual y nunca se suma: en un equipo de verdad salía 0' para
   todos, y la tarjeta "menor participación" era seis jugadores a cero
   ordenados por dorsal. La demo lo tapaba porque se lo inventa al arrancar.
   Los minutos de verdad llevaban ahí desde siempre, un nivel más abajo: en
   `historial[].jugadores[].minutos`, que es lo que ya mira el jugador en su
   propia ficha. Esto los saca de ahí, y de paso las asistencias de gol.

   Son funciones puras: se prueban sin navegador (ver pruebas/pruebas30).
   ============================================================ */

/* Un partido cuenta para las estadísticas cuando se guardó con la ficha de
   sus jugadores. Los de antes de que existiera esa ficha -o los que se
   anotaron solo con el resultado- no tienen nada que contar. */
export const partidosConFicha = (historial) =>
  (Array.isArray(historial) ? historial : []).filter((m) => Array.isArray(m?.jugadores) && m.jugadores.length);

/* La ficha de un jugador dentro de un partido. Se busca primero por el `rec`
   de Airtable, que es lo único que no cambia: el `id` es su puesto en la
   lista de ESTE dispositivo y puede bailar al reordenar la plantilla, y el
   dorsal puede cambiar a mitad de temporada. Por eso el dorsal va de último
   y solo como red de seguridad para lo guardado hace tiempo. */
export const fichaEnPartido = (m, p) => {
  if (!m || !p || !Array.isArray(m.jugadores)) return null;
  if (p.rec) {
    const x = m.jugadores.find((j) => j && j.rec && j.rec === p.rec);
    if (x) return x;
  }
  if (p.id != null) {
    const x = m.jugadores.find((j) => j && j.id != null && j.id === p.id);
    if (x) return x;
  }
  if (p.d != null && p.d !== "") {
    const x = m.jugadores.find((j) => j && String(j.d) === String(p.d));
    if (x) return x;
  }
  return null;
};

/* Las asistencias de gol no están en la ficha del jugador, sino en el acta:
   cada gol guarda el dorsal de quien dio el pase. Se cuentan igual que en la
   ficha del propio jugador, por dorsal y dentro de ese mismo partido. */
export const asistenciasEnPartido = (m, p) => {
  if (!m || !Array.isArray(m.acta) || p == null || p.d == null || p.d === "") return 0;
  return m.acta.filter((e) => e && e.type === "gol" && String(e.asistDorsal ?? "") === String(p.d)).length;
};

/* Todo lo de un jugador en la temporada. `convocado` son los partidos en los
   que aparece en el acta; `partidos` los que hay en total, para poder decir
   "convocado 5 de 7". */
export const totalesDe = (historial, p) => {
  const out = { partidos: 0, convocado: 0, titular: 0, minutos: 0, goles: 0, asistencias: 0, tarjetas: 0 };
  for (const m of partidosConFicha(historial)) {
    out.partidos += 1;
    const j = fichaEnPartido(m, p);
    if (j) {
      out.convocado += 1;
      out.titular += j.titular ? 1 : 0;
      out.minutos += Number(j.minutos) || 0;
      out.goles += Number(j.goles) || 0;
      out.tarjetas += Number(j.tarjetas) || 0;
    }
    out.asistencias += asistenciasEnPartido(m, p);
  }
  return out;
};

/* Los minutos de la temporada, que es lo que se pinta en "menor
   participación" y en la ficha del jugador. */
export const minutosDe = (historial, p) => totalesDe(historial, p).minutos;

/* La tabla de la temporada, una fila por jugador. Se construye desde los
   partidos y no desde la plantilla de hoy a propósito: quien se fue en
   enero jugó lo que jugó, y borrarlo de la tabla sería falsear la
   temporada. */
export const tablaTemporada = (historial) => {
  const mapa = new Map();
  for (const m of partidosConFicha(historial)) {
    /* Dentro de un partido, el dorsal sí identifica: es el que llevaba ese
       día. Así una asistencia va a quien la dio aunque haya cambiado de
       dorsal más adelante. */
    const porDorsal = new Map();
    for (const j of m.jugadores) {
      if (!j) continue;
      const k = j.rec || (j.id != null ? `id:${j.id}` : `dn:${j.d}-${j.n}`);
      const a = mapa.get(k) || { d: j.d, n: j.n, convocado: 0, titular: 0, minutos: 0, goles: 0, asistencias: 0, tarjetas: 0 };
      a.convocado += 1;
      a.titular += j.titular ? 1 : 0;
      a.minutos += Number(j.minutos) || 0;
      a.goles += Number(j.goles) || 0;
      a.tarjetas += Number(j.tarjetas) || 0;
      /* El dorsal y el nombre con los que se le llama son los del partido
         MÁS RECIENTE en el que aparece, no los del último que toque
         recorrer: el histórico llega del más nuevo al más viejo, y dar por
         hecho el orden es pedir que un día salga con el dorsal del año
         pasado. Se compara por fecha y punto. */
      if (!a._fecha || String(m.fecha || "") >= a._fecha) { a.d = j.d; a.n = j.n; a._fecha = String(m.fecha || ""); }
      mapa.set(k, a);
      if (j.d != null && j.d !== "") porDorsal.set(String(j.d), a);
    }
    for (const e of Array.isArray(m.acta) ? m.acta : []) {
      if (!e || e.type !== "gol") continue;
      const d = e.asistDorsal;
      if (d == null || d === "") continue;
      const a = porDorsal.get(String(d));
      if (a) a.asistencias += 1;
    }
  }
  return [...mapa.values()].map(({ _fecha, ...f }) => f).sort((x, y) =>
    y.goles - x.goles || y.asistencias - x.asistencias || y.minutos - x.minutos || y.titular - x.titular || x.d - y.d);
};

/* El balance de la temporada: lo primero que mira cualquier entrenador y lo
   único que no estaba en la pantalla. Solo cuenta lo que tiene resultado;
   los penaltis de una eliminatoria no cambian quién ganó el partido -eso es
   un empate con tanda, y así se cuenta aquí-. */
export const resumenTemporada = (historial) => {
  const out = { jugados: 0, ganados: 0, empatados: 0, perdidos: 0, gf: 0, gc: 0 };
  for (const m of Array.isArray(historial) ? historial : []) {
    /* `Number(null)` es 0, que es un número perfectamente finito: sin esta
       comprobación un partido anotado sin marcador contaría como 0-0. */
    if (m?.us == null || m?.them == null || m.us === "" || m.them === "") continue;
    const us = Number(m.us), them = Number(m.them);
    if (!Number.isFinite(us) || !Number.isFinite(them)) continue;
    out.jugados += 1;
    out.gf += us; out.gc += them;
    if (us > them) out.ganados += 1;
    else if (us < them) out.perdidos += 1;
    else out.empatados += 1;
  }
  return out;
};
