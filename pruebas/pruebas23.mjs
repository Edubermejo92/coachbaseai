/* Jugadas 3D de ejemplo (src/jugadasModelo.js): que todas se puedan montar
   con el motor de jugadas tal cual está, sin errores y dentro del campo, y
   que salgan también como pasos de la pizarra 2D. Son funciones puras: no
   hace falta la función de Netlify. */
import { construirJugada, direccionAtaque, pasosDeJugada } from "../src/jugada3d.js";
import { JUGADAS_MODELO, CATEGORIAS_MODELO, textoModelo } from "../src/jugadasModelo.js";
let ok = 0, mal = 0;
const dice = (n, c, e = "") => { (c ? ok++ : mal++); console.log(`${c ? "✓" : "✗"} ${n}${e ? "  → " + e : ""}`); };
const IDIOMAS = ["es", "en", "fr", "de", "pt"];
const VISTAS = ["tribuna", "cenital", "porteriaIzq", "porteriaDer", "esquina"];

dice("hay varias jugadas de ejemplo", JUGADAS_MODELO.length >= 8, String(JUGADAS_MODELO.length));
const idsModelo = JUGADAS_MODELO.map((m) => m.id);
dice("cada una con su id", new Set(idsModelo).size === idsModelo.length);

for (const m of JUGADAS_MODELO) {
  const n = textoModelo(m).nombre;
  const jug = construirJugada(m.tokens, m.acciones, m.balonEn);
  const errores = jug.errores.map((e, i) => e && `${i}:${e}`).filter(Boolean);
  const ids = m.tokens.map((t) => t.id);
  const fueraIni = m.tokens.filter((t) => t.x < 12 || t.x > 988 || t.y < 12 || t.y > 628).map((t) => t.id);
  const fueraFin = Object.entries(jug.estados.at(-1).pos).filter(([, p]) => p.x < 6 || p.x > 994 || p.y < 6 || p.y > 634).map(([k]) => k);
  const quien = m.tokens.find((t) => t.id === m.balonEn);
  const pasos = pasosDeJugada(m.tokens, m.acciones, m.balonEn);
  dice(`${n}: se monta sin errores y con el balón en un jugador nuestro`,
    !errores.length && quien?.type === "home" && jug.fases.length > 0, errores.join(",") || m.balonEn);
  dice(`${n}: fichas únicas, en el campo al empezar y al acabar`, new Set(ids).size === ids.length && !fueraIni.length && !fueraFin.length,
    [...fueraIni, ...fueraFin].join(","));
  dice(`${n}: atacamos hacia la derecha`, direccionAtaque(m.tokens) === 1);
  dice(`${n}: sale en 2D con un paso por momento`, pasos.length === jug.fases.length + 1 && pasos.every((p) => p.tokens.length >= m.tokens.length),
    `${pasos.length} pasos 2D / ${jug.fases.length} fases`);
  dice(`${n}: nombre y descripción en los cinco idiomas, categoría y cámara conocidas`,
    IDIOMAS.every((l) => m.nombre[l] && m.desc[l]) && !!CATEGORIAS_MODELO[m.cat] && VISTAS.includes(m.vista));
}

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
