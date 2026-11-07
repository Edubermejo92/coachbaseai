/* ¿Se sale algo de la pantalla a lo ancho?
   En un móvil basta con que un solo elemento no quepa para que la página
   entera se pueda arrastrar de lado y aparezca una franja en blanco a la
   derecha. Pasa siempre por lo mismo: un hijo de un contenedor flex sin
   `min-w-0`, que no encoge por debajo de su contenido. Y lo dispara el texto
   de la persona -el nombre de su canción, el de su club-, así que en la demo
   no se ve: por eso este script siembra un nombre de canción largo.

   Ya ha mordido dos veces: el título de las tarjetas (ver Card en App.jsx) y
   la columna de botones de la alineación (7 nov 2026).

       npx vite build
       npx vite preview --port 4173 &
       node herramientas/medir-ancho.cjs

   Sale con código 1 si alguna pestaña se sale, para poder encadenarlo. */
const { chromium } = require("playwright");

const URL_BASE = process.env.URL_BASE || "http://localhost:4173/";
const ANCHOS = [360, 390, 412]; // los móviles más comunes
const PESTANAS = [/^Inicio$/, /^Jugadores$/, /^Alineación$/, /^Convocatoria$/, /^Entrenamiento$/, /^Calendario$/];
const CANCION = "Wiz Khalifa - Black And Yellow [G-Mix] ft. Snoop Dogg, Juicy J & T-Pain.mp3";

const irA = async (p, re) => {
  const menu = p.locator('button:has-text("⋯")');
  for (let i = 0; i < (await menu.count()); i++) {
    if (await menu.nth(i).isVisible()) { await menu.nth(i).click(); break; }
  }
  await p.waitForTimeout(500);
  const b = p.getByRole("button", { name: re });
  for (let i = 0; i < (await b.count()); i++) {
    if (await b.nth(i).isVisible()) { await b.nth(i).click(); await p.waitForTimeout(1600); return true; }
  }
  await p.keyboard.press("Escape").catch(() => {});
  return false;
};

const medir = (p) => p.evaluate(() => {
  const de = document.documentElement, vw = de.clientWidth, fuera = [];
  document.querySelectorAll("*").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width && r.right > vw + 1) fuera.push({
      tag: el.tagName.toLowerCase(),
      cls: String(el.className?.baseVal ?? el.className ?? "").slice(0, 60),
      ancho: Math.round(r.width),
      txt: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40),
    });
  });
  return { vw, scrollWidth: de.scrollWidth, fuera: fuera.slice(0, 6) };
});

(async () => {
  const navegador = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  let malas = 0;
  for (const ancho of ANCHOS) {
    const ctx = await navegador.newContext({ viewport: { width: ancho, height: 820 }, locale: "es-ES" });
    const p = await ctx.newPage();
    /* Una canción propia con nombre largo, guardada antes de que arranque. */
    await p.addInitScript((n) => {
      localStorage.setItem("cb_video_musica", "propia");
      const r = indexedDB.open("cb-video", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("cancion");
      r.onsuccess = () => r.result.transaction("cancion", "readwrite").objectStore("cancion")
        .put({ nombre: n, tipo: "audio/mpeg", blob: new Blob([new Uint8Array(10)]) }, "propia");
    }, CANCION);
    await p.goto(URL_BASE, { waitUntil: "networkidle" });
    await p.getByText("Ver la demo sin registrarme").first().click();
    await p.waitForTimeout(700);
    await p.getByRole("button", { name: /Entrenador principal/ }).first().click();
    await p.waitForTimeout(1800);

    for (const re of PESTANAS) {
      if (!(await irA(p, re))) continue;
      const m = await medir(p);
      const nombre = String(re).replace(/[/^$]/g, "");
      if (m.scrollWidth > m.vw) {
        malas++;
        console.log(`✗ ${ancho}px · ${nombre}: se sale ${m.scrollWidth - m.vw} px`);
        m.fuera.forEach((c) => console.log(`      <${c.tag} class="${c.cls}"> w ${c.ancho} «${c.txt}»`));
      } else {
        console.log(`✓ ${ancho}px · ${nombre}`);
      }
    }
    await ctx.close();
  }
  console.log(malas ? `\n${malas} pantalla(s) se salen de ancho` : "\nNinguna pantalla se sale de ancho");
  await navegador.close();
  process.exit(malas ? 1 : 0);
})();
