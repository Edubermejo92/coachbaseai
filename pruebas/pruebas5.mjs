/* El módulo del Master: quién es de verdad el Master (por correo exacto, no
   por lo que diga el campo Rol) y el interruptor de qué pestañas son gratis y
   cuáles Premium (?res=config), que hasta ahora vivía fijo en el código. */
import { fake, login, call, T } from "./run.mjs";
let ok=0, mal=0;
const dice=(n,c,e="")=>{(c?ok++:mal++);console.log(`${c?"✓":"✗"} ${n}${e?"  → "+e:""}`);};
const F=(t,r)=>fake.db[t].find(x=>x.id===r).fields;

/* ---- El Master es UN correo, no un valor del campo Rol ---- */
const tMaster = await login("ebldigital92@gmail.com");
dice("el Master de verdad inicia sesión", !!tMaster);

const tImpostor = await login("impostor@a.com");
dice("otra cuenta con Rol=Master también inicia sesión", !!tImpostor);
let r = await call("?res=yo", { token: tImpostor });
dice("pero se le trata como director, no como Master", r.body.user?.rol === "Director deportivo", r.body.user?.rol || "");

r = await call("?res=yo", { token: tMaster });
dice("y al Master real sí se le reconoce como tal", r.body.user?.rol === "Master", r.body.user?.rol || "");

/* ---- ?res=config: todavía no hay registro ---- */
r = await call("?res=config", { token: tMaster });
dice("sin registro en Airtable, config responde tabsGratis:null (no bloquea nada)",
  r.status === 200 && r.body.tabsGratis === null, JSON.stringify(r.body));

/* ---- Solo el Master puede escribir ---- */
r = await call("?res=config", { method: "PATCH", token: tImpostor, body: { tabsGratis: ["inicio"] } });
dice("un director no puede tocar qué es gratis y qué es Premium", r.status === 403, String(r.status));

r = await call("?res=config", { method: "PATCH", token: tMaster, body: { tabsGratis: "no-es-un-array" } });
dice("y el propio Master no puede mandar cualquier cosa", r.status === 400, String(r.status));

/* ---- El Master marca una lista, con basura mezclada dentro ---- */
r = await call("?res=config", { method: "PATCH", token: tMaster, body: { tabsGratis: ["jugadores", "calendario", "master", "no-existe", 42, "asistencia"] } });
dice("guarda solo las claves válidas de la lista", r.body.ok === true, JSON.stringify(r.body));
dice("descarta 'master' -no es una pestaña que se pueda marcar-", !r.body.tabsGratis.includes("master"), JSON.stringify(r.body.tabsGratis));
dice("descarta la clave inventada y el número sueltos", !r.body.tabsGratis.includes("no-existe") && r.body.tabsGratis.length === 5,
  JSON.stringify(r.body.tabsGratis));
dice("y añade 'inicio' y 'premium' aunque no se hayan pedido -no se pueden bloquear-",
  r.body.tabsGratis.includes("inicio") && r.body.tabsGratis.includes("premium"), JSON.stringify(r.body.tabsGratis));

/* ---- La lectura ahora refleja lo guardado, para cualquier sesión ---- */
r = await call("?res=config", { token: tImpostor });
dice("cualquier cuenta logueada lee la config ya guardada",
  r.body.tabsGratis?.includes("jugadores") && r.body.tabsGratis?.includes("calendario"), JSON.stringify(r.body.tabsGratis));
dice("un solo registro en Airtable, no uno nuevo por cada guardado", fake.db[T.CONFIG].length === 1, String(fake.db[T.CONFIG].length));

/* ---- Un segundo guardado del Master reemplaza, no acumula ---- */
r = await call("?res=config", { method: "PATCH", token: tMaster, body: { tabsGratis: ["convocatoria"] } });
dice("un segundo guardado sustituye la lista entera",
  JSON.stringify(r.body.tabsGratis.slice().sort()) === JSON.stringify(["convocatoria", "inicio", "premium"].sort()),
  JSON.stringify(r.body.tabsGratis));
dice("y sigue habiendo un único registro", fake.db[T.CONFIG].length === 1, String(fake.db[T.CONFIG].length));

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
