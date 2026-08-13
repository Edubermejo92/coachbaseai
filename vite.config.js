import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/* La versión de package.json se incrusta en el bundle para poder verla en la
   pantalla de acceso. Sirve para comprobar de un vistazo QUÉ build está vivo:
   sin esto, saber si un deploy ha entrado obliga a ir buscando detalles de la
   interfaz a ojo. */
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

export default defineConfig({
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
});
