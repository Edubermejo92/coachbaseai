/* ============================================================
   Jugadas 3D: de una lista de acciones a un guion animable
   ------------------------------------------------------------
   El entrenador describe la jugada como se la contaría a sus jugadores:
   "el 6 tiene el balón, se la pasa al 8, el 9 se desmarca arrastrando al
   central, el 3 dobla al 7…". Aquí se traduce eso a lo que el motor 3D sabe
   hacer: quién corre, por dónde, cuándo sale y cuánto tarda, y por dónde va
   el balón.

   Todo en coordenadas de la pizarra (1000×640; la cal es el rectángulo
   12..988 × 12..628, un campo de 105×68 m). Sin Three.js ni React: son
   funciones puras, así que se pueden probar sueltas.

   Acción = { id, tipo, junto?, ...datos }:
     pase       { a }              el que tiene el balón se la da a `a`
     desmarque  { j, hasta }       `j` corre a `hasta` (si es el que lleva el
                                   balón, conduce)
     conduccion { hasta }          el que tiene el balón conduce hasta `hasta`
     arrastre   { j, def, hasta }  `j` corre y el defensa `def` le sigue
     doblar     { j, comp, hasta } `j` pasa por detrás y por fuera de `comp`
     presion    { j }              el rival `j` sale a por el que tiene el balón
     tiro       {}                 el que tiene el balón tira a portería
   `junto: true` la hace a la vez que la anterior: las dos forman un paso.
   ============================================================ */

export const TIPOS_JUGADA = ["pase", "desmarque", "conduccion", "arrastre", "doblar", "presion", "tiro"];

/* Qué hay que elegir para cada acción, en orden. "local"/"rival" = un
   jugador de ese equipo; "punto" = un sitio del campo. */
export const PIDE = {
  pase: [["a", "local"]],
  desmarque: [["j", "local"], ["hasta", "punto"]],
  conduccion: [["hasta", "punto"]],
  arrastre: [["j", "local"], ["def", "rival"], ["hasta", "punto"]],
  doblar: [["j", "local"], ["comp", "local"], ["hasta", "punto"]],
  presion: [["j", "rival"]],
  tiro: [],
};
/* Las que necesitan que alguien tenga el balón. */
export const CON_BALON = new Set(["pase", "conduccion", "presion", "tiro"]);

const M_X = 105 / 976, M_Y = 68 / 616;
const metros = (a, b) => Math.hypot((b.x - a.x) * M_X, (b.y - a.y) * M_Y);
const lim = (v, a, b) => Math.max(a, Math.min(b, v));
const largoRuta = (r) => r.slice(1).reduce((s, p, i) => s + metros(r[i], p), 0);
const dentro = (p) => ({ x: lim(p.x, 6, 994), y: lim(p.y, 6, 634) });
const unit = (a, b) => {
  const dx = (b.x - a.x) * M_X, dy = (b.y - a.y) * M_Y, n = Math.hypot(dx, dy) || 1;
  return { x: dx / n / M_X, y: dy / n / M_Y }; // un metro, en unidades de la pizarra
};

/* Tiempos, en segundos. Algo más lentos que en un partido: es una pizarra,
   tiene que dar tiempo a verlo. */
const T_CARRERA = (m) => lim(m / 6.5, 0.8, 3.4);
const T_CONDUCCION = (m) => lim(m / 5.2, 0.9, 3.6);
const T_PASE = (m) => lim(m / 16, 0.45, 1.9);
const T_TIRO = (m) => lim(m / 26, 0.45, 1.3);
const ALTO_PASE = (m) => (m < 18 ? 0.25 : lim(m * 0.07, 1.5, 4.5));

/* Hacia qué portería ataca el local: hacia donde no está su gente. */
export function direccionAtaque(tokens = []) {
  const media = (tipo) => {
    const xs = tokens.filter((t) => t.type === tipo).map((t) => t.x);
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  };
  const casa = media("home"), fuera = media("away");
  if (casa != null && fuera != null && Math.abs(casa - fuera) > 20) return casa < fuera ? 1 : -1;
  return casa != null && casa > 560 ? -1 : 1;
}

/* El balón en los pies: un poco por delante, hacia donde se ataca. */
const alPie = (p, dir) => ({ x: p.x + dir * 7, y: p.y + 2 });

export function construirJugada(tokens = [], acciones = [], balonEn = null) {
  const dir = direccionAtaque(tokens);
  const tipoDe = {};
  const pos = {};
  for (const t of tokens) {
    if (t.type !== "home" && t.type !== "away") continue;
    const id = String(t.id);
    pos[id] = { x: t.x, y: t.y };
    tipoDe[id] = t.type;
  }
  const bTk = tokens.find((t) => t.type === "ball");
  let poseedor = balonEn != null && pos[String(balonEn)] ? String(balonEn) : null;
  let balon = poseedor ? alPie(pos[poseedor], dir) : bTk ? { x: bTk.x, y: bTk.y } : null;
  const foto = () => ({ pos: Object.fromEntries(Object.entries(pos).map(([k, v]) => [k, { ...v }])), balon: balon && { ...balon }, poseedor });

  const estados = [foto()];
  const fases = [];
  const faseDeAccion = [];
  const errores = [];
  const info = [];

  /* Pasos: una acción y las que van "a la vez" detrás de ella. */
  const grupos = [];
  acciones.forEach((a, i) => {
    if (a?.junto && grupos.length) grupos[grupos.length - 1].push(i);
    else grupos.push([i]);
  });

  for (const g of grupos) {
    const ini = Object.fromEntries(Object.entries(pos).map(([k, v]) => [k, { ...v }]));
    const movs = [];
    const segs = [];
    const finDe = {}; // id -> { hasta, fin } de quien corre en este paso
    const esLocal = (id) => tipoDe[id] === "home";
    const esRival = (id) => tipoDe[id] === "away";
    const correr = (id, ruta, i, clase, t0 = 0, durFn = T_CARRERA) => {
      const r = ruta.map(dentro);
      const dur = durFn(largoRuta(r));
      movs.push({ id, ruta: r, t0, dur, clase, accion: i });
      finDe[id] = { hasta: r[r.length - 1], fin: t0 + dur };
    };
    const fase = fases.length;
    let cursorBalon = 0;
    /* Las que se hacen con el balón en los pies: se deciden con quien lo
       tiene al empezar el paso, no con quien lo acabe teniendo. */
    const conduce = new Set();

    /* 1) Quien corre sin balón. Sale al empezar el paso. */
    for (const i of g) {
      const a = acciones[i] || {};
      faseDeAccion[i] = fase;
      info[i] = { ...(info[i] || {}) };
      errores[i] = null;
      const j = a.j != null ? String(a.j) : null;
      if (a.tipo === "desmarque") {
        if (!j || !pos[j]) { errores[i] = "sinJugador"; continue; }
        if (!a.hasta) { errores[i] = "sinDestino"; continue; }
        if (j === poseedor) { conduce.add(i); continue; } // va con el balón: más abajo
        correr(j, [ini[j], a.hasta], i, esRival(j) ? "defensa" : "ataque");
      } else if (a.tipo === "arrastre") {
        const d = a.def != null ? String(a.def) : null;
        if (!j || !pos[j] || !d || !pos[d]) { errores[i] = "sinJugador"; continue; }
        if (!a.hasta) { errores[i] = "sinDestino"; continue; }
        if (j === poseedor) conduce.add(i);
        else correr(j, [ini[j], a.hasta], i, "ataque");
        /* El defensa le sigue pegado, por el lado por el que le marcaba, y
           sale un instante tarde: reacciona al movimiento. */
        const lado = unit(ini[j], ini[d]);
        const destino = { x: a.hasta.x + lado.x * 2.6, y: a.hasta.y + lado.y * 2.6 };
        correr(d, [ini[d], destino], i, "defensa", 0.25);
        info[i].def = d;
      } else if (a.tipo === "conduccion") {
        conduce.add(i);
      } else if (a.tipo === "doblar") {
        const c = a.comp != null ? String(a.comp) : null;
        if (!j || !pos[j] || !c || !pos[c]) { errores[i] = "sinJugador"; continue; }
        if (j === c) { errores[i] = "mismo"; continue; }
        if (!a.hasta) { errores[i] = "sinDestino"; continue; }
        /* Por detrás y por fuera del compañero: "fuera" es hacia la banda
           que tiene más cerca. */
        const cp = ini[c];
        const s = cp.y < 320 ? -1 : 1;
        const ruta = [ini[j], { x: cp.x - dir * 22, y: cp.y + s * 12 }, { x: cp.x + dir * 12, y: cp.y + s * 40 }, a.hasta];
        correr(j, ruta, i, "ataque");
      }
    }

    /* 2) El balón, en el orden en que se han apuntado. */
    for (const i of g) {
      const a = acciones[i] || {};
      if (errores[i]) continue;
      if (conduce.has(i)) {
        if (!poseedor) { errores[i] = "sinBalon"; continue; }
        if (!a.hasta) { errores[i] = "sinDestino"; continue; }
        const p = poseedor;
        info[i].de = p;
        /* Si acaba de recibir corriendo, conduce desde donde la recibe. */
        const antes = finDe[p];
        correr(p, [antes ? antes.hasta : ini[p], a.hasta], i, "conduccion", Math.max(cursorBalon, antes ? antes.fin : 0), T_CONDUCCION);
        const m = movs[movs.length - 1];
        segs.push({ tipo: "sigue", id: p, t0: m.t0, dur: m.dur, dir, accion: i });
        cursorBalon = m.t0 + m.dur;
        balon = alPie(m.ruta[m.ruta.length - 1], dir);
      } else if (a.tipo === "pase") {
        const r = a.a != null ? String(a.a) : null;
        if (!poseedor) { errores[i] = "sinBalon"; continue; }
        if (!r || !pos[r]) { errores[i] = "sinJugador"; continue; }
        if (r === poseedor) { errores[i] = "mismo"; continue; }
        info[i].de = poseedor;
        /* Si el que recibe está corriendo en este mismo paso, el pase va al
           espacio: a donde llega, y sale para que lleguen los dos a la vez. */
        const corre = finDe[r];
        const destino = alPie(corre ? corre.hasta : ini[r], dir);
        const desde = balon || alPie(ini[poseedor], dir);
        const m = metros(desde, destino);
        const dur = T_PASE(m);
        const t0 = Math.max(cursorBalon, corre ? corre.fin - dur : 0);
        /* `de` golpea y `para` recibe: el 3D anima el chut y el control. */
        segs.push({ tipo: "vuelo", desde, hasta: destino, alto: ALTO_PASE(m), t0, dur, accion: i, de: poseedor, para: r });
        /* El que la da no se va antes de soltarla. */
        for (const mv of movs) if (mv.id === poseedor && mv.t0 < t0) { mv.t0 = t0; finDe[mv.id].fin = t0 + mv.dur; }
        cursorBalon = t0 + dur;
        poseedor = r;
        balon = destino;
      } else if (a.tipo === "tiro") {
        if (!poseedor) { errores[i] = "sinBalon"; continue; }
        info[i].de = poseedor;
        const desde = balon || alPie(ini[poseedor], dir);
        /* Al palo largo: es lo que se enseña. */
        const destino = { x: dir > 0 ? 994 : 6, y: 320 + (desde.y < 320 ? 24 : -24) };
        const m = metros(desde, destino);
        segs.push({ tipo: "vuelo", desde, hasta: destino, alto: 1.4, t0: cursorBalon, dur: T_TIRO(m), accion: i, tiro: true, de: poseedor });
        cursorBalon += T_TIRO(m);
        poseedor = null;
        balon = destino;
      }
    }

    /* 3) La presión, que va a por quien tenga el balón al acabar el paso. */
    for (const i of g) {
      const a = acciones[i] || {};
      if (a.tipo !== "presion" || errores[i]) continue;
      const j = a.j != null ? String(a.j) : null;
      if (!j || !pos[j] || !esRival(j)) { errores[i] = "sinJugador"; continue; }
      if (!poseedor) { errores[i] = "sinBalon"; continue; }
      info[i].de = poseedor;
      const objetivo = finDe[poseedor]?.hasta || ini[poseedor];
      const lado = unit(objetivo, ini[j]);
      correr(j, [ini[j], { x: objetivo.x + lado.x * 1.6, y: objetivo.y + lado.y * 1.6 }], i, "defensa", 0.1);
    }

    for (const [id, f] of Object.entries(finDe)) pos[id] = { ...f.hasta };
    if (poseedor && !segs.some((s) => s.tipo === "vuelo" && s.tiro)) balon = alPie(pos[poseedor], dir);
    const fin = Math.max(0, ...movs.map((m) => m.t0 + m.dur), ...segs.map((s) => s.t0 + s.dur));
    fases.push({ movs, segs, dur: fin + 0.25, acciones: g, balonFinal: balon && { ...balon } });
    estados.push(foto());
  }

  return { fases, estados, faseDeAccion, errores, info, dir, sinLocales: !Object.values(tipoDe).includes("home") };
}

/* Las fichas de la pizarra tal y como están en un momento de la jugada. Si la
   pizarra no tenía balón y la jugada lo usa, se añade uno. */
export function tokensDeEstado(tokens = [], estado) {
  if (!estado) return tokens;
  const out = tokens.map((t) => {
    const p = estado.pos[String(t.id)];
    if (p) return { ...t, x: p.x, y: p.y };
    if (t.type === "ball" && estado.balon) return { ...t, x: estado.balon.x, y: estado.balon.y };
    return t;
  });
  if (estado.balon && !tokens.some((t) => t.type === "ball")) out.push({ id: "balon3d", type: "ball", x: estado.balon.x, y: estado.balon.y, label: "" });
  return out;
}

/* Los trazos de la jugada, en el formato de la pizarra (flecha, pase,
   conducción y el número de cada paso), así salen igual en 2D y en 3D.
   `resaltar` = índice del paso que se está mirando: los demás van tenues. */
export function trazosJugada(jug, { resaltar = null, solo = null, color = "#FFFFFF", rival = "#FF7A6B" } = {}) {
  const out = [];
  jug.fases.forEach((f, n) => {
    if (solo != null && n !== solo) return;
    const tenue = resaltar != null && n !== resaltar ? { opacidad: 0.3 } : {};
    const sitios = [];
    for (const m of f.movs) {
      const col = m.clase === "defensa" ? rival : color;
      out.push({ id: `j3-${n}-${m.id}-${m.accion}`, tool: m.clase === "conduccion" ? "dribble" : "arrow", pts: m.ruta, color: col, width: 4, ...tenue });
      sitios.push(m.ruta[Math.floor(m.ruta.length / 2)]);
    }
    f.segs.forEach((s, k) => {
      if (s.tipo !== "vuelo") return;
      out.push({ id: `j3-${n}-b${k}`, tool: "pass", pts: [s.desde, s.hasta], color: s.tiro ? "#FFD54A" : color, width: 4, ...tenue });
      sitios.push({ x: (s.desde.x + s.hasta.x) / 2, y: (s.desde.y + s.hasta.y) / 2 });
    });
    if (sitios.length) {
      const p = sitios[0];
      out.push({ id: `j3-${n}-n`, tool: "text", num: true, text: String(n + 1), pts: [{ x: p.x + 10, y: p.y - 12 }], color: "#FFD54A", width: 3, ...tenue });
    }
  });
  return out;
}

/* Los pasos de la pizarra 2D sacados de la jugada: una foto por momento, con
   las flechas de lo que pasa a continuación (la última, sin flechas). Así una
   jugada hecha en 3D también se reproduce y se graba en vídeo en 2D. */
export function pasosDeJugada(tokens = [], acciones = [], balonEn = null) {
  const jug = construirJugada(tokens, acciones, balonEn);
  if (!jug.fases.length) return [];
  return jug.estados.map((e, n) => ({
    tokens: tokensDeEstado(tokens, e),
    shapes: n < jug.fases.length ? trazosJugada(jug, { solo: n }).map(({ opacidad, ...s }) => s) : [], // eslint-disable-line no-unused-vars
  }));
}
