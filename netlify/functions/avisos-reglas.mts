/* Cada 5 minutos: convocatoria pendiente, día de partido y partes de
   material (ver netlify/lib/avisos.mts). Solo con los datos en Supabase.
   Las funciones programadas solo corren en la versión publicada. */
import { supabaseActivo } from "../lib/supabase-airtable.mts";
import { revisarReglas } from "../lib/avisos.mts";

export default async () => {
  if (!supabaseActivo()) return new Response("sin Supabase", { status: 200 });
  const hechos = await revisarReglas(new Date());
  console.log(`[avisos-reglas] ${JSON.stringify(hechos)}`);
  return new Response("ok");
};

export const config = { schedule: "*/5 * * * *" };
