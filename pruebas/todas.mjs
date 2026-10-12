/* Lanza todas las pruebas, una por proceso, en los dos modos:
     airtable  -> la función contra el Airtable de mentira (fakeair.mjs)
     supabase  -> la misma función con los datos en Postgres de verdad
                  (PGlite + fakesupabase.mjs), a través del adaptador
   Uso: node pruebas/todas.mjs [airtable|supabase]   (sin nada: los dos) */
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const dir = new URL(".", import.meta.url).pathname;
const archivos = fs.readdirSync(dir)
  .filter((f) => /^pruebas\d*\.mjs$/.test(f))
  .sort((a, b) => (Number(a.match(/\d+/)?.[0] || 1)) - (Number(b.match(/\d+/)?.[0] || 1)));
const modos = process.argv[2] ? [process.argv[2]] : ["airtable", "supabase"];

let fallidos = 0;
for (const modo of modos) {
  let total = 0;
  for (const f of archivos) {
    const r = spawnSync(process.execPath, [dir + f], {
      encoding: "utf8",
      env: { ...process.env, PRUEBAS_SUPABASE: modo === "supabase" ? "1" : "" },
    });
    const salida = `${r.stdout || ""}${r.stderr || ""}`;
    const resumen = salida.trim().split("\n").pop();
    total += Number(resumen.match(/(\d+) correctas/)?.[1] || 0);
    if (r.status !== 0) {
      fallidos++;
      console.log(`✗ [${modo}] ${f}\n${salida.split("\n").filter((l) => l.startsWith("✗") || /Error/.test(l)).join("\n") || salida.slice(-2000)}`);
    }
  }
  console.log(`[${modo}] ${total} comprobaciones correctas en ${archivos.length} archivos`);
}
process.exit(fallidos ? 1 : 0);
