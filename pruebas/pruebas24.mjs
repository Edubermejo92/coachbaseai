/* Guía de la app (src/guia.js): que la versión en inglés tenga lo mismo que
   la española -mismos pasos por rol, mismos apartados, mismas preguntas- y
   que cada «Abrir» lleve a un apartado que existe. Son datos: no hace falta
   la función de Netlify. */
import { textosGuia, pasosDe } from "../src/guia.js";
let ok = 0, mal = 0;
const dice = (n, c, e = "") => { (c ? ok++ : mal++); console.log(`${c ? "✓" : "✗"} ${n}${e ? "  → " + e : ""}`); };
/* Las pestañas de la app (TODAS_TABS en App.jsx). */
const TABS = ["inicio", "mihijo", "parte", "master", "equipos", "equipo", "jugadores", "calendario", "convocatoria",
  "alineacion", "partido", "liga", "temporada", "entrenamiento", "lesiones", "ejercicios", "pizarra",
  "asistencia", "disciplina", "normativa", "estadisticas", "usuarios", "material", "premium"];
const ES = textosGuia("es"), EN = textosGuia("en");
const forma = (g) => ({
  pasos: Object.fromEntries(Object.entries(g.pasos).map(([k, v]) => [k, v.map((p) => [p.id, p.tab || "", !!p.cuenta, p.soloSi || "", p.texto.length].join("|"))])),
  secciones: g.secciones.map((s) => [s.id, s.tab || "", !!s.cuenta, s.puntos.length].join("|")),
  faq: g.faq.map((f) => f.para || ""),
});
const fES = forma(ES), fEN = forma(EN);
dice("los cuatro grupos de pasos (cuerpo técnico, dirección, familia, jugador)", ["staff", "direccion", "familia", "jugador"].every((k) => ES.pasos[k]?.length && EN.pasos[k]?.length));
for (const k of Object.keys(fES.pasos)) dice(`pasos de ${k}: los mismos en inglés`, JSON.stringify(fES.pasos[k]) === JSON.stringify(fEN.pasos[k]));
dice("los mismos apartados en inglés", JSON.stringify(fES.secciones) === JSON.stringify(fEN.secciones));
dice("las mismas preguntas y para quién", JSON.stringify(fES.faq) === JSON.stringify(fEN.faq), `${fES.faq.length}/${fEN.faq.length}`);
const vacios = [];
for (const [l, g] of [["es", ES], ["en", EN]]) {
  for (const k of ["titulo", "intro", "introFamilia", "buscar", "sinResultados", "abrir", "hecho", "progreso", "cerrar"]) if (!g[k]) vacios.push(`${l}.${k}`);
  for (const k of ["pasos", "funciones", "faq"]) if (!g.pestanas[k]) vacios.push(`${l}.pestanas.${k}`);
  for (const [grupo, ps] of Object.entries(g.pasos)) for (const p of ps) if (!p.titulo || !p.texto.every(Boolean)) vacios.push(`${l}.${grupo}.${p.id}`);
  for (const s of g.secciones) if (!s.titulo || !s.resumen || !s.puntos.every(Boolean)) vacios.push(`${l}.${s.id}`);
  for (const f of g.faq) if (!f.q || !f.a) vacios.push(`${l}.faq`);
}
dice("ningún texto vacío", !vacios.length, vacios.join(", "));
const malos = [...Object.values(ES.pasos).flat(), ...ES.secciones].filter((x) => x.tab && !TABS.includes(x.tab)).map((x) => `${x.id}→${x.tab}`);
dice("cada «Abrir» lleva a un apartado de la app", !malos.length, malos.join(", "));
dice("ids sin repetir dentro de cada grupo", Object.values(ES.pasos).every((ps) => new Set(ps.map((p) => p.id)).size === ps.length) && new Set(ES.secciones.map((s) => s.id)).size === ES.secciones.length);
dice("las preguntas son para el cuerpo técnico, las familias o todos", ES.faq.every((f) => !f.para || ["staff", "familia"].includes(f.para)));
const conPermiso = pasosDe(ES, "staff", () => true).map((p) => p.id), sinPermiso = pasosDe(ES, "staff", (x) => x !== "createUsers").map((p) => p.id);
dice("dar de alta al cuerpo técnico solo a quien puede", conPermiso.includes("staff") && !sinPermiso.includes("staff") && sinPermiso.length === conPermiso.length - 1);
dice("un grupo desconocido usa los pasos del cuerpo técnico", pasosDe(ES, "otro", () => true).length === ES.pasos.staff.length);
dice("el resto de idiomas usan la guía en inglés", ["fr", "de", "pt"].every((l) => textosGuia(l) === EN));

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
