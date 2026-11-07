/* El bundle arranca de verdad (jsdom).
   `vite build` solo comprueba que el código se puede empaquetar: no ejecuta
   nada, así que un fallo al inicializar -una constante que se usa antes de
   declararse, un acceso a window en el cuerpo de un módulo- pasa el build y
   revienta en el móvil de un entrenador. Aquí se monta el bundle ya
   construido en un DOM de mentira y se mira que React pinte algo y que no
   quede ningún error en la consola.
   jsdom 24 a propósito: de la 25 en adelante cambia la API que se usa aquí.
   Si no hay dist/ todavía, la prueba se salta sola (npm test no construye). */
import fs from "node:fs";
import path from "node:path";

let ok = 0, mal = 0;
const dice = (n, c, e = "") => { (c ? ok++ : mal++); console.log(`${c ? "✓" : "✗"} ${n}${e ? "  → " + e : ""}`); };

const raiz = new URL("..", import.meta.url).pathname;
const dist = path.join(raiz, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("· sin dist/: se salta (constrúyelo con `npx vite build`)");
  console.log("\n0 correctas · 0 fallos");
  process.exit(0);
}

const { JSDOM, VirtualConsole } = await import("jsdom");
const errores = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => errores.push(`jsdomError: ${e.message}`));
vc.on("error", (...a) => errores.push(`console.error: ${a.join(" ")}`));

/* El bundle pide fuentes, el service worker y la API: nada de eso existe
   aquí y no es lo que se está probando. Se contesta a todo con un 404 vacío
   para que ningún fetch quede colgado. */
globalThis.fetch = async () => new Response("", { status: 404 });

const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const dom = new JSDOM(html, {
  url: "https://coachbase-ai.netlify.app/",
  runScripts: "dangerously",
  resources: undefined,
  pretendToBeVisual: true,
  virtualConsole: vc,
});
const { window } = dom;
/* jsdom no trae estas dos y la app las usa al arrancar (el menú lateral mide
   la cabecera, y el tema mira el modo oscuro del sistema). */
window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
window.ResizeObserver = window.ResizeObserver || class { observe() {} unobserve() {} disconnect() {} };
window.scrollTo = () => {};
window.fetch = globalThis.fetch;

/* El <script type="module"> del index no lo ejecuta jsdom: se carga el
   bundle a mano, que es justo el código que llega al móvil. */
const entrada = (html.match(/<script[^>]*type="module"[^>]*src="([^"]+)"/) || [])[1];
dice("el index construido apunta a un bundle", !!entrada, entrada || "ninguno");
let js = fs.readFileSync(path.join(dist, entrada.replace(/^\//, "")), "utf8");
dice("el helper de reseñas ha entrado en el bundle", js.includes("cb_review_"));
dice("y llama al plugin de Median, no a una API inventada", js.includes("appreview"));

/* El bundle es un módulo ES y `eval` no admite `export`: se le quita la
   línea de exportaciones del final, que solo existe para los trozos que se
   cargan aparte (la guía, la pizarra 3D) y que al arrancar no se piden. */
js = js.replace(/\bexport\s*\{[^{}]*\}\s*;?\s*$/, "");
dice("se ha podido quitar la exportación final para evaluarlo", !/\bexport\s*\{/.test(js.slice(-4000)));
window.eval(js);
await new Promise((r) => setTimeout(r, 1500));

const raiz0 = window.document.getElementById("root");
dice("React ha pintado la app", !!raiz0 && raiz0.children.length > 0, `hijos: ${raiz0 ? raiz0.children.length : "sin #root"}`);
dice("y se ve la pantalla de acceso", /COACHBASE/i.test(window.document.body.textContent || ""));
dice("sin errores al arrancar", errores.length === 0, errores.slice(0, 3).join(" | "));

/* Fuera de la app de Android el puente no existe: nada debe haberlo creado. */
dice("en el navegador no hay puente de reseñas inventado",
  typeof window.median === "undefined" && typeof window.AndroidReview === "undefined");

dom.window.close();
console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
