/* Cada minuto: los avisos a hora fija que ha pedido un móvil (final de la
   parte y descuento del Modo partido), para que suenen aunque el sistema
   haya cerrado la app. Ver netlify/lib/avisos.mts. */
import { supabaseActivo } from "../lib/supabase-airtable.mts";
import { enviarProgramados } from "../lib/avisos.mts";

export default async () => {
  if (!supabaseActivo()) return new Response("sin Supabase", { status: 200 });
  const r = await enviarProgramados(new Date());
  if (r.enviados) console.log(`[avisos-reloj] ${r.enviados} enviados`);
  return new Response("ok");
};

export const config = { schedule: "* * * * *" };
