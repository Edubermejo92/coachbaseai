/* El adaptador de Supabase (netlify/lib/supabase-airtable.mts) en lo que las
   pruebas de siempre no tocan: adjuntos, conversión de tipos, errores con la
   forma de Airtable, fórmulas y Supabase caído. Solo tiene sentido con
   PRUEBAS_SUPABASE=1; sin él no hace nada. */
import { fake, login, call, T } from "./run.mjs";
let ok = 0, mal = 0;
const dice = (n, c, e = "") => { (c ? ok++ : mal++); console.log(`${c ? "✓" : "✗"} ${n}${e ? "  → " + e : ""}`); };

if (process.env.PRUEBAS_SUPABASE !== "1") {
  console.log("(solo con PRUEBAS_SUPABASE=1)\n\n0 correctas · 0 fallos");
  process.exit(0);
}

const tEnt = await login("ent@a.com");
dice("inicia sesión contra Postgres", !!tEnt);
/* Tras la primera petición el desvío ya está puesto: un fetch a Airtable
   desde aquí lo contesta el adaptador, igual que dentro de la función. */
const AT = "https://api.airtable.com/v0/appDVtUWdtfzkV1sA";
const at = async (ruta, init = {}) => {
  const r = await fetch(AT + ruta, { ...init, headers: { "content-type": "application/json" } });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};

/* ---- login: email con mayúsculas y espacios ---- */
await fake.pg.query(`update usuarios set email = '  Ent@A.com ' where id = 'recENT'`);
await fake.refrescar();
dice("el login encuentra el email aunque esté guardado con mayúsculas y espacios", !!(await login("ent@a.com")));
await fake.pg.query(`update usuarios set email = 'ent@a.com' where id = 'recENT'`);
await fake.refrescar();

/* ---- crear con typecast, leer por nombre y por id ---- */
let r = await at(`/${T.JUGADORES}`, { method: "POST", body: JSON.stringify({ fields: { Nombre: "Prueba", Dorsal: "23", Estado: "Duda", "Inscripcion pagada": false, Equipo: ["recIB"] }, typecast: true }) });
const nuevo = r.body.id;
dice("crea con id de Airtable", /^rec[A-Za-z0-9]{14}$/.test(nuevo || ""), nuevo);
dice("el número llega como número", r.body.fields?.Dorsal === 23, JSON.stringify(r.body.fields?.Dorsal));
dice("la casilla sin marcar no se devuelve (como Airtable)", !("Inscripcion pagada" in (r.body.fields || {})));
dice("trae createdTime", !Number.isNaN(Date.parse(r.body.createdTime || "")));
r = await at(`/${T.EQUIPOS}/recIB?returnFieldsByFieldId=true`);
dice("el equipo lista al jugador nuevo (enlace inverso)", (r.body.fields?.fldMYcnPB43koZxlA || []).includes(nuevo));
dice("por id, los campos van con su fld…", r.body.fields?.fldmjUkaMwwLbPO89 === "Infantil B");

/* ---- errores con la forma de Airtable ---- */
r = await at(`/${T.JUGADORES}/${nuevo}`, { method: "PATCH", body: JSON.stringify({ fields: { "Fecha inscripcion": "Viernes 31" } }) });
dice("una fecha imposible da 422, como en Airtable", r.status === 422, String(r.status));
r = await at(`/${T.JUGADORES}/${nuevo}`, { method: "PATCH", body: JSON.stringify({ fields: { "Campo que no existe": 1 } }) });
dice("un campo desconocido da 422 UNKNOWN_FIELD_NAME", r.status === 422 && r.body.error?.type === "UNKNOWN_FIELD_NAME");
r = await at(`/${T.JUGADORES}/recNOEXISTE12345`);
dice("un registro que no existe da 404", r.status === 404);
r = await at(`/${T.JUGADORES}?filterByFormula=${encodeURIComponent("{Dorsal}>3")}`);
dice("una fórmula no soportada da 422 (el backend ya sabe recuperarse)", r.status === 422);
r = await at(`/${T.JUGADORES}/listRecords`, { method: "POST", body: JSON.stringify({ filterByFormula: `FIND("," & RECORD_ID() & ",", ",recJ3,recJ1,${nuevo},")` }) });
dice("la fórmula de ids devuelve esas filas, en el orden de la tabla",
  (r.body.records || []).map((x) => x.id).join() === `recJ1,recJ3,${nuevo}`, (r.body.records || []).map((x) => x.id).join());

/* ---- vaciar y fechas ---- */
r = await at(`/${T.JUGADORES}/${nuevo}`, { method: "PATCH", body: JSON.stringify({ fields: { Estado: "", Equipo: [], "Fecha inscripcion": "2026-10-12T15:00:00.000Z" } }) });
dice("vaciar un texto lo quita de la respuesta", !("Estado" in (r.body.fields || {})));
dice("la fecha se queda en AAAA-MM-DD", r.body.fields?.["Fecha inscripcion"] === "2026-10-12", r.body.fields?.["Fecha inscripcion"]);
r = await at(`/${T.EQUIPOS}/recIB?returnFieldsByFieldId=true`);
dice("y al soltar el enlace, el equipo deja de listarlo", !(r.body.fields?.fldMYcnPB43koZxlA || []).includes(nuevo));

/* ---- adjuntos ---- */
const png = Buffer.from("89504e470d0a1a0a", "hex").toString("base64");
r = await call(`?res=foto-jugador&id=recJ2`, { method: "POST", token: tEnt, body: { file: png, contentType: "image/png", filename: "cara.png" } });
dice("subir la foto de un jugador funciona", r.body.ok === true && /\/storage\/v1\/object\/sign\/coachbase\//.test(r.body.url || ""), JSON.stringify(r.body).slice(0, 120));
dice("el archivo está en el bucket privado", [...fake.archivos.keys()].some((k) => k.startsWith("jugadores/recJ2/fldVAopJcEmx4J1zw/")));
r = await at(`/${T.JUGADORES}/recJ2`);
dice("al leer, la foto trae enlace firmado y nombre", (r.body.fields?.Foto || [])[0]?.url?.includes("token=") && r.body.fields.Foto[0].filename === "cara.png");

const tMaster = await login("ebldigital92@gmail.com");
r = await call(`?res=escudo&id=recCLUBA&tipo=club`, { method: "POST", token: tMaster, body: { file: png, contentType: "image/png", filename: "escudo.png" } });
dice("el escudo del club se copia a sus equipos sin escudo", r.body.ok === true && r.body.equiposActualizados >= 1, JSON.stringify(r.body).slice(0, 120));
const [{ escudo }] = (await fake.pg.query(`select escudo from equipos where id = 'recIB'`)).rows;
dice("y en el equipo se guarda la RUTA, no el enlace que caduca", escudo?.[0]?.path?.startsWith("clubes/recCLUBA/") && !escudo[0].url, JSON.stringify(escudo));

/* ---- borrar en lote ---- */
r = await at(`/${T.JUGADORES}?records[]=${nuevo}&records[]=recNOEXISTE12345`, { method: "DELETE" });
dice("borrar en lote devuelve los borrados", (r.body.records || []).length === 1 && r.body.records[0].id === nuevo);

/* ---- Supabase caído: nunca "contraseña incorrecta" ---- */
const guardado = fake.fetchSupabase;
fake.fetchSupabase = async () => { throw new Error("sin red"); };
const rl = await (await import("./run.mjs")).handler(new Request("https://x/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "login", email: "ent@a.com", password: "coach1234" }) }));
const dl = await rl.json();
dice("si Supabase no responde, el login dice 'servicio no disponible', no 'contraseña mal'", dl.reason === "service_unavailable", JSON.stringify(dl));
fake.fetchSupabase = guardado;

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
