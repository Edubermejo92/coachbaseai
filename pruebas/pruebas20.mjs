/* Retransmisión en directo (netlify/lib/vivo.mts): el enlace del equipo, lo
   que ve el público sin cuenta, los avisos de gol / descanso / final que
   llegan una sola vez y quién puede tocar qué. Solo con Supabase. */
import { fake, login, call } from "./run.mjs";
let ok = 0, mal = 0;
const dice = (n, c, e = "") => { (c ? ok++ : mal++); console.log(`${c ? "✓" : "✗"} ${n}${e ? "  → " + e : ""}`); };

if (process.env.PRUEBAS_SUPABASE !== "1") {
  console.log("(solo con PRUEBAS_SUPABASE=1)\n\n0 correctas · 0 fallos");
  process.exit(0);
}

const q = async (sql, p) => (await fake.pg.query(sql, p)).rows;
await q(`insert into vault.decrypted_secrets values ('vapid_publica', 'BPUBLICA'), ('vapid_privada', 'privada')`);
let enviados = [];
globalThis.__enviarPushPrueba = async (sub, aviso) => {
  if (sub.endpoint.includes("caducado")) return "caducada";
  enviados.push({ endpoint: sub.endpoint, ...aviso });
  return "ok";
};

const tEnt = await login("ent@a.com"), tDirB = await login("dir@b.com"), tDirA = await login("dir@a.com");

/* ---- crear el enlace ---- */
let r = await call("?res=retransmision", { method: "POST", token: tEnt, body: { accion: "crear", team: "recSEN" } });
const codigo = r.body.codigo;
dice("el entrenador crea el enlace de su equipo", r.body.ok === true && /^[A-Za-z0-9]{16}$/.test(codigo || ""), JSON.stringify(r.body));
r = await call("?res=retransmision", { method: "POST", token: tEnt, body: { accion: "crear", team: "recSEN" } });
dice("volver a pedirlo da el mismo enlace", r.body.codigo === codigo);
r = await call("?res=retransmision", { method: "POST", token: tEnt, body: { accion: "crear", team: "recOTRO" } });
dice("no se crea para un equipo que no es suyo", r.status === 403);
r = await call("?res=retransmision", { method: "POST", body: { accion: "crear", team: "recSEN" } });
dice("sin sesión no se crea", r.status === 401);

/* ---- lo que ve el público ---- */
r = await call(`?res=vivo&c=${codigo}`);
dice("el público lo abre sin cuenta", r.status === 200 && r.body.activa === true && r.body.clave === "BPUBLICA", JSON.stringify(r.body));
r = await call(`?res=vivo&c=NOEXISTE12345678`);
dice("un código que no existe da 404", r.status === 404);

const base = {
  lang: "es", partido: "2026-10-24|Rival FC", casa: true, fecha: "2026-10-24", hora: "11:00", lugar: "La Concepción",
  nos: { nombre: "C.D. Chamartín Vergara", sub: "Senior A", escudo: "/escudo-chamartin.png" }, rival: { nombre: "Rival FC", escudo: "javascript:alert(1)" },
  estado: "p1", reloj: { base: 0, desde: Date.now(), periodBase: 0, periodLen: 45 }, score: { us: 0, them: 0 }, goles: [],
  plantilla: ["Jugador 1", "Jugador 2"], notas: "secreto",
};
r = await call("?res=retransmision-datos", { method: "POST", token: tEnt, body: { codigo, datos: base } });
dice("el entrenador manda el estado del partido", r.body.ok === true, JSON.stringify(r.body));
r = await call(`?res=vivo&c=${codigo}`);
const d = r.body.datos || {};
dice("el público ve marcador, parte y equipos", d.estado === "p1" && d.nos.nombre === "C.D. Chamartín Vergara" && d.score.us === 0);
dice("y nada más: ni plantilla ni notas", !("plantilla" in d) && !("notas" in d));
dice("un escudo con javascript: no pasa", d.rival.escudo === "");
r = await call("?res=retransmision-datos", { method: "POST", token: tDirB, body: { codigo, datos: base } });
dice("el director de otro club no puede tocarlo", r.status === 403);

/* ---- avisos ---- */
r = await call(`?res=vivo&c=${codigo}`, { method: "POST", body: { sub: { endpoint: "https://push.test/abuela", keys: { p256dh: "p", auth: "a" } } } });
dice("la familia se apunta a los goles sin cuenta", r.body.ok === true, JSON.stringify(r.body));
await call(`?res=vivo&c=${codigo}`, { method: "POST", body: { sub: { endpoint: "https://push.test/caducado", keys: { p256dh: "p", auth: "a" } } } });
r = await call(`?res=vivo&c=${codigo}`, { method: "POST", body: { sub: { endpoint: "http://inseguro", keys: { p256dh: "p", auth: "a" } } } });
dice("una suscripción mal formada no entra", r.body.reason === "suscripcion_no_valida");

const gol1 = { ...base, score: { us: 1, them: 0 }, goles: [{ id: "g1", lado: "us", min: "12", nombre: "Hugo M.", asist: "Pablo R." }] };
enviados = [];
await call("?res=retransmision-datos", { method: "POST", token: tEnt, body: { codigo, datos: gol1 } });
dice("con un gol nuestro, aviso de ¡GOL!", enviados.length === 1 && enviados[0].titulo.includes("¡GOL de C.D. Chamartín Vergara!") && /1-0 Rival FC · Hugo M\., 12′/.test(enviados[0].cuerpo), JSON.stringify(enviados));
dice("el aviso abre la página del partido", enviados[0]?.url === `/vivo/?c=${codigo}`);
dice("la suscripción caducada se borra", (await q(`select count(*)::int n from vivo_avisos where endpoint like '%caducado%'`))[0].n === 0);
enviados = [];
await call("?res=retransmision-datos", { method: "POST", token: tEnt, body: { codigo, datos: gol1 } });
dice("mandar lo mismo otra vez no repite el aviso", enviados.length === 0);
r = await call(`?res=vivo&c=${codigo}`);
dice("el público ve el gol con su asistente", r.body.datos.goles[0]?.nombre === "Hugo M." && r.body.datos.goles[0]?.asist === "Pablo R.");

/* ---- dentro de la app: el directo del equipo, sin enlace ---- */
r = await call("?res=retransmision&team=recSEN", { token: tEnt });
dice("quien es del equipo ve su directo sin el enlace", r.body.activa === true && r.body.codigo === codigo && r.body.datos?.score?.us === 1, JSON.stringify(r.body).slice(0, 120));
r = await call("?res=retransmision&team=recSEN", { token: tDirA });
dice("la dirección de su club también", r.body.activa === true);
r = await call("?res=retransmision&team=recSEN", { token: tDirB });
dice("otro club no", r.status === 403);
r = await call("?res=retransmision&team=recSEN");
dice("sin sesión no", r.status === 401);

const descanso = { ...gol1, estado: "descanso", score: { us: 1, them: 1 }, goles: [...gol1.goles, { id: "g2", lado: "them", min: "30", nombre: "Alguien" }] };
enviados = [];
await call("?res=retransmision-datos", { method: "POST", token: tEnt, body: { codigo, datos: descanso } });
dice("gol del rival y descanso, dos avisos", enviados.length === 2 && enviados.some((e) => e.titulo === "Gol de Rival FC") && enviados.some((e) => e.titulo === "⏸ Descanso"), JSON.stringify(enviados.map((e) => e.titulo)));
r = await call(`?res=vivo&c=${codigo}`);
dice("del rival no sale el nombre de nadie", r.body.datos.goles[1]?.nombre === "");
enviados = [];
await call("?res=retransmision-datos", { method: "POST", token: tEnt, body: { codigo, datos: { ...descanso, estado: "final" } } });
dice("y el final", enviados.length === 1 && enviados[0].titulo === "🏁 Final del partido");

/* ---- manifiesto ---- */
const mres = await (await import("./run.mjs")).handler(new Request(`https://x/api?res=vivo&c=${codigo}&m=1`));
const man = await mres.json();
dice("cada enlace tiene su manifiesto para la pantalla de inicio", man.start_url === `/vivo/?c=${codigo}` && /manifest/.test(mres.headers.get("content-type") || ""));

/* ---- desactivar ---- */
r = await call("?res=retransmision", { method: "POST", token: tDirB, body: { accion: "desactivar", codigo } });
dice("otro club no puede desactivarlo", r.status === 403);
r = await call("?res=retransmision", { method: "POST", token: tEnt, body: { accion: "desactivar", codigo } });
dice("el entrenador lo desactiva", r.body.ok === true);
r = await call(`?res=vivo&c=${codigo}`);
dice("desactivado ya no enseña el partido", r.body.activa === false && r.body.datos === null);
r = await call("?res=retransmision&team=recSEN", { token: tEnt });
dice("y en la app el equipo deja de tener directo", r.body.activa === false && r.body.codigo === null);
dice("y se olvidan las suscripciones", (await q(`select count(*)::int n from vivo_avisos where codigo = $1`, [codigo]))[0].n === 0);
r = await call("?res=retransmision-datos", { method: "POST", token: tEnt, body: { codigo, datos: gol1 } });
dice("a un enlace desactivado no se le mandan datos", r.body.reason === "desactivada");
r = await call("?res=retransmision", { method: "POST", token: tEnt, body: { accion: "crear", team: "recSEN" } });
dice("al volver a retransmitir sale un enlace nuevo", r.body.ok === true && r.body.codigo !== codigo);

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
