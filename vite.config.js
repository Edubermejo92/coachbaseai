import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/* La versión de package.json se incrusta en el bundle para poder verla en la
   pantalla de acceso. Sirve para comprobar de un vistazo QUÉ build está vivo:
   sin esto, saber si un deploy ha entrado obliga a ir buscando detalles de la
   interfaz a ojo. */
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

/* Superwall (src/superwall.js) evalúa sus reglas con un WebAssembly
   (@superwall/superscript) que intenta cargar de tres formas, en orden:
   1) `import * as wasm from "x.wasm"` (integración ESM de wasm): Vite no la
      soporta sin plugins y rompe el build;
   2) el wasm metido en base64 en un JS de 1,6 MB;
   3) el .wasm de una URL (globalThis.SUPERWALL_SUPERSCRIPT_WASM_URL).
   Se anulan las dos primeras para quedarse con la tercera: el .wasm sale como
   archivo propio en /assets (1,2 MB, comprimido por Netlify) y solo se
   descarga si Superwall está activo. */
const superscriptSoloUrl = () => ({
  name: "superscript-solo-url",
  enforce: "pre",
  resolveId(id, importer) {
    if (!importer || !importer.includes("@superwall/superscript")) return null;
    if (id.endsWith("/target/browser/superscript.js") || id.endsWith("/target/web/superscript_bg_inline.js")) {
      return "\0superscript-anulado";
    }
    return null;
  },
  load(id) {
    if (id === "\0superscript-anulado") {
      return 'throw new Error("CoachBase: carga del wasm solo por URL (ver vite.config.js)");';
    }
    return null;
  },
});

export default defineConfig({
  plugins: [react(), superscriptSoloUrl()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
});
