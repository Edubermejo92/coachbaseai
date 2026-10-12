/* Avisos con la app cerrada (netlify/lib/avisos.mts): suscribirse, reglas
   con la hora de Madrid, que nada llegue dos veces, reloj del Modo partido,
   propuesta nueva y convocatoria marcada como enviada. Solo con Supabase. */
import { execSync } from "node:child_process";
import fs from "node:fs";
import { fake, login, call, T } from "./run.mjs";
let ok = 0, mal = 0;
const dice = (n, c, e = "") => { (c ? ok++ : mal++); console.log(`${c ? "✓" : "✗"} ${n}${e ? "  → " + e : ""}`); };

if (process.env.PRUEBAS_SUPABASE !== "1") {
  console.log("(solo con PRUEBAS_SUPABASE=1)\n\n0 correctas · 0 fallos");
  process.exit(0);
}

const OUT = new URL("avisos.tmp.mjs", import.meta.url).pathname;
execSync(`npx esbuild ${new URL("../netlify/lib/avisos.mts", import.meta.url).pathname} --bundle --format=esm --platform=node --target=node20 --outfile=${OUT}`, { stdio: "pipe" });
const A = await import(OUT);
fs.rmSync(OUT);

const q = async (sql, p) => (await fake.pg.query(sql, p)).rows;
await q(`insert into vault.decrypted_secrets values ('vapid_publica', 'BPUBLICA'), ('vapid_privada', 'privada')`);

/* Envío de mentira: apunta a quién y qué; un endpoint "caducado" contesta 410. */
let enviados = [];
globalThis.__enviarPushPrueba = async (sub, aviso) => {
  if (sub.endpoint.includes("caducado")) return "caducada";
  enviados.push({ usuario: sub.usuario, ...aviso });
  return "ok";
};
const sub = (n) => ({ endpoint: `https://push.test/${n}`, keys: { p256dh: "p", auth: "a" } });
const deQuien = () => enviados.map((e) => e.usuario).sort().join(",");

/* ---- suscribirse ---- */
const tEnt = await login("ent@a.com"), tDir = await login("dir@a.com"), tClub = await login("club@a.com");
let r = await call("?res=push", { token: tEnt });
dice("la app pide la clave pública", r.body.clave === "BPUBLICA", JSON.stringify(r.body));
r = await call("?res=push", { method: "POST", token: tEnt, body: { sub: sub("ent") } });
dice("el entrenador se apunta", r.body.ok === true && (await q(`select usuario from push_suscripciones where endpoint = 'https://push.test/ent'`))[0]?.usuario === "recENT");
r = await call("?res=push", { method: "POST", token: tEnt, body: { sub: { endpoint: "http://inseguro" } } });
dice("una suscripción mal formada no entra", r.body.reason === "suscripcion_invalida");
await call("?res=push", { method: "POST", token: tDir, body: { sub: sub("dir") } });
await call("?res=push", { method: "POST", token: tClub, body: { sub: sub("club") } });
r = await call("?res=push", { token: "" });
dice("sin sesión no hay clave", r.status === 401);

/* ---- convocatoria pendiente: jueves 15/10/2026 18:10 en Madrid (UTC+2) ---- */
dice("(el 15/10/2026 es jueves)", new Date("2026-10-15T12:00:00Z").getUTCDay() === 4);
await q(`insert into partidos (id, fecha, hora, local, visitante, lugar, equipo) values ('recPSABADO000001', '2026-10-17', '11:30', 'Chamartín', 'Rival FC', 'La Concepción', '{recSEN}')`);
let h = await A.revisarReglas(new Date("2026-10-15T16:10:00Z"));
dice("el jueves por la tarde avisa de la convocatoria pendiente", h.convocatoria === 1 && deQuien() === "recENT", `${JSON.stringify(h)} ${deQuien()}`);
dice("y dice qué partido es", /sábado a las 11:30: Chamartín – Rival FC/.test(enviados[0]?.cuerpo || ""), enviados[0]?.cuerpo);
enviados = [];
h = await A.revisarReglas(new Date("2026-10-15T16:15:00Z"));
dice("la siguiente pasada no lo repite", h.convocatoria === 0 && enviados.length === 0);
enviados = [];
h = await A.revisarReglas(new Date("2026-10-15T15:50:00Z"));
dice("antes de las 18:00 no avisa", h.convocatoria === 0);

r = await call("?res=convocatoria-enviada", { method: "POST", token: tEnt, body: { team: "recSEN", fecha: "2026-10-17", hora: "11:30", rival: "Rival FC", lugar: "La Concepción", convocados: ["recJ1", "recJ2", "inventado"] } });
dice("al mandar la convocatoria queda apuntada", r.body.ok === true, JSON.stringify(r.body));
const conv = await q(`select fecha::text, convocados, equipo from convocatorias`);
dice("con el día, el equipo y los convocados (solo ids reales)", conv.length === 1 && conv[0].fecha === "2026-10-17" && conv[0].convocados.join() === "recJ1,recJ2" && conv[0].equipo.join() === "recSEN", JSON.stringify(conv));
r = await call("?res=convocatoria-enviada", { method: "POST", token: tEnt, body: { team: "recSEN", fecha: "2026-10-17", rival: "Rival FC", convocados: ["recJ3"] } });
dice("mandarla otra vez la actualiza, no la duplica", (await q(`select count(*)::int n from convocatorias`))[0].n === 1);
r = await call("?res=convocatoria-enviada", { method: "POST", token: tEnt, body: { team: "recOTRO", fecha: "2026-10-17" } });
dice("no se puede apuntar en un equipo ajeno", r.status === 403);
enviados = [];
h = await A.revisarReglas(new Date("2026-10-16T10:05:00Z"));
dice("el viernes ya no avisa: la convocatoria está enviada", h.convocatoria === 0 && !enviados.some((e) => /Convocatoria/.test(e.titulo)), JSON.stringify(h));

/* ---- día de partido: 3 horas antes de las 11:30 (09:30 UTC) ---- */
enviados = [];
h = await A.revisarReglas(new Date("2026-10-17T06:20:00Z"));
dice("a las 8:20 todavía no avisa del partido", h.partido === 0);
h = await A.revisarReglas(new Date("2026-10-17T06:35:00Z"));
dice("a las 8:35 avisa del partido al cuerpo técnico", h.partido === 1 && deQuien() === "recENT", JSON.stringify(h));
dice("con la hora y el campo", enviados[0]?.titulo === "Partido hoy a las 11:30" && /La Concepción/.test(enviados[0]?.cuerpo), JSON.stringify(enviados[0]));

/* ---- parte de material: martes y jueves ---- */
await q(`update equipos set dias_de_entreno = '[2,4]' where id = 'recSEN'`);
await q(`insert into partes_entreno (fecha, equipo) values ('2026-10-13', '{recSEN}')`);
enviados = [];
h = await A.revisarReglas(new Date("2026-10-13T19:40:00Z"));
dice("el martes había parte: no avisa", h.parte === 0);
h = await A.revisarReglas(new Date("2026-10-15T19:40:00Z"));
dice("el jueves a las 21:40 sin parte: avisa al cuerpo técnico", h.parte === 1 && deQuien() === "recENT", JSON.stringify(h));
enviados = [];
h = await A.revisarReglas(new Date("2026-10-16T07:05:00Z"));
dice("el viernes a las 9:05 avisa al club y al director del parte que faltó", h.resumenClub === 2 && deQuien() === "recCLU,recDIR", `${JSON.stringify(h)} ${deQuien()}`);
dice("diciendo qué categoría", /Senior A/.test(enviados[0]?.cuerpo || ""), enviados[0]?.cuerpo);

/* ---- propuesta nueva del segundo ---- */
await q(`insert into usuarios (id, nombre, email, rol, estado, club, equipo, password)
         select 'recSEGUNDO000001', 'Segundo', 'seg@a.com', 'Segundo entrenador', 'Activo', '{recCLUBA}', '{recSEN}', password from usuarios where id = 'recENT'`);
await fake.refrescar();
const tSeg = await login("seg@a.com");
enviados = [];
r = await call("?res=propuestas", { method: "POST", token: tSeg, body: { team: "recSEN", type: "lineup", data: { x: 1 } } });
dice("la propuesta se crea", r.body.ok === true, JSON.stringify(r.body));
dice("y avisa al entrenador principal al momento", deQuien() === "recENT" && enviados[0]?.titulo === "Propuesta pendiente", deQuien());

/* ---- reloj del Modo partido ---- */
const ahora = Date.now();
r = await call("?res=push-reloj", { method: "POST", token: tEnt, body: { endpoint: "https://push.test/ent", avisos: [
  { en: new Date(ahora + 60000).toISOString(), titulo: "Final de 1ª parte", cuerpo: "1-0", clave: "1T-fin" },
  { en: new Date(ahora + 120000).toISOString(), titulo: "Descuento", cuerpo: "", clave: "1T-desc" },
] } });
dice("el móvil programa los avisos del reloj", r.body.programados === 2, JSON.stringify(r.body));
r = await call("?res=push-reloj", { method: "POST", token: tEnt, body: { endpoint: "https://push.test/ent", avisos: [
  { en: new Date(ahora + 60000).toISOString(), titulo: "Final de 1ª parte", cuerpo: "2-0", clave: "1T-fin" },
] } });
dice("al cambiar el reloj se sustituyen, no se suman", (await q(`select count(*)::int n from push_programados`))[0].n === 1);
r = await call("?res=push-reloj", { method: "POST", token: tDir, body: { endpoint: "https://push.test/ent", avisos: [] } });
dice("nadie puede tocar los avisos de otro móvil", r.body.reason === "sin_suscripcion" && (await q(`select count(*)::int n from push_programados`))[0].n === 1);
enviados = [];
let e = await A.enviarProgramados(new Date(ahora));
dice("antes de su hora no sale", e.enviados === 0 && enviados.length === 0);
e = await A.enviarProgramados(new Date(ahora + 61000));
dice("a su hora sale una vez, con el marcador nuevo", e.enviados === 1 && enviados[0]?.cuerpo === "2-0" && enviados[0]?.tag === "cb-reloj", JSON.stringify(enviados));
e = await A.enviarProgramados(new Date(ahora + 120000));
dice("y no se repite", e.enviados === 0 && enviados.length === 1);
await call("?res=push-reloj", { method: "POST", token: tEnt, body: { endpoint: "https://push.test/ent", avisos: [{ en: new Date(ahora + 60000).toISOString(), titulo: "X", cuerpo: "", clave: "2T-fin" }] } });
e = await A.enviarProgramados(new Date(ahora + 20 * 60000));
dice("uno que llega con 20 minutos de retraso ya no se manda", e.enviados === 0 && (await q(`select count(*)::int n from push_programados`))[0].n === 0);
r = await call("?res=push-reloj", { method: "POST", token: tEnt, body: { endpoint: "https://push.test/ent", avisos: [] } });
dice("parar el reloj los cancela", r.body.ok === true && (await q(`select count(*)::int n from push_programados`))[0].n === 0);

/* ---- suscripción caducada ---- */
await call("?res=push", { method: "POST", token: tEnt, body: { sub: sub("caducado") } });
await A.avisarUsuarios(["recENT"], { titulo: "x", cuerpo: "y", tag: "t", clave: "prueba-caducada" });
dice("si el navegador da la suscripción por muerta, se borra", (await q(`select count(*)::int n from push_suscripciones where endpoint like '%caducado'`))[0].n === 0);
r = await call("?res=push", { method: "DELETE", token: tEnt, body: { endpoint: "https://push.test/ent" } });
dice("desactivar los avisos borra la suscripción", (await q(`select count(*)::int n from push_suscripciones where usuario = 'recENT'`))[0].n === 0);

/* ---- la hora de Madrid, también el día del cambio de hora ---- */
dice("11:30 en Madrid en verano son las 9:30 UTC", A.deMadrid("2026-10-17", "11:30").toISOString() === "2026-10-17T09:30:00.000Z");
dice("y en invierno las 10:30 UTC", A.deMadrid("2026-11-07", "11:30").toISOString() === "2026-11-07T10:30:00.000Z");
dice("el domingo del cambio de hora también cuadra", A.deMadrid("2026-10-25", "12:00").toISOString() === "2026-10-25T11:00:00.000Z");

/* ---- el cifrado y la firma, comprobados con la librería de referencia ---- */
{
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  const nodeCrypto = require("node:crypto");
  const ece = require("http_ece");
  const webpushRef = require("web-push");
  const OUTW = new URL("webpush.tmp.mjs", import.meta.url).pathname;
  execSync(`npx esbuild ${new URL("../netlify/lib/webpush.mts", import.meta.url).pathname} --format=esm --platform=node --outfile=${OUTW}`, { stdio: "pipe" });
  const W = await import(OUTW);
  fs.rmSync(OUTW);
  /* Un "navegador": sus claves de suscripción. */
  const ua = nodeCrypto.createECDH("prime256v1"); ua.generateKeys();
  const authSecret = nodeCrypto.randomBytes(16);
  const b64 = (b) => Buffer.from(b).toString("base64url");
  const texto = JSON.stringify({ title: "Final de 1ª parte", body: "Chamartín 2-0 Rival · ñ € 🏆" });
  const cifrado = await W.cifrar(new TextEncoder().encode(texto), b64(ua.getPublicKey()), b64(authSecret));
  let claro = "";
  try { claro = ece.decrypt(Buffer.from(cifrado), { version: "aes128gcm", privateKey: ua, authSecret }).toString("utf8"); } catch (e) { claro = String(e); }
  dice("el navegador descifra el aviso con la librería de referencia (RFC 8291)", claro === texto, claro.slice(0, 80));

  const v = webpushRef.generateVAPIDKeys();
  let peticion = null;
  const fetchAntes = globalThis.fetch;
  globalThis.fetch = async (u, i) => { peticion = { u: String(u), i }; return new Response(null, { status: 201 }); };
  const res = await W.enviarWebPush({ endpoint: "https://fcm.googleapis.com/fcm/send/abc", p256dh: b64(ua.getPublicKey()), auth: b64(authSecret) }, texto, { pub: v.publicKey, priv: v.privateKey, sujeto: "https://coachbase-ai.netlify.app" });
  globalThis.fetch = fetchAntes;
  const autoriza = peticion?.i?.headers?.Authorization || "";
  const [, jwt, k] = autoriza.match(/^vapid t=([^,]+), k=(.+)$/) || [];
  const [h64, c64, f64] = (jwt || "..").split(".");
  const claims = JSON.parse(Buffer.from(c64 || "", "base64url").toString() || "{}");
  const pubRaw = Buffer.from(v.publicKey, "base64url");
  const clavePub = nodeCrypto.createPublicKey({ key: { kty: "EC", crv: "P-256", x: b64(pubRaw.subarray(1, 33)), y: b64(pubRaw.subarray(33)) }, format: "jwk" });
  const firmaOk = !!jwt && nodeCrypto.verify("sha256", Buffer.from(`${h64}.${c64}`), { key: clavePub, dsaEncoding: "ieee-p1363" }, Buffer.from(f64, "base64url"));
  dice("la firma VAPID es válida (RFC 8292)", firmaOk && k === v.publicKey && claims.aud === "https://fcm.googleapis.com" && claims.exp > Date.now() / 1000, JSON.stringify(claims));
  dice("cabeceras de Web Push correctas", res.ok && peticion.i.headers["Content-Encoding"] === "aes128gcm" && peticion.i.headers.TTL === "3600");
  const desc = ece.decrypt(Buffer.from(peticion.i.body), { version: "aes128gcm", privateKey: ua, authSecret }).toString("utf8");
  dice("y lo que sale por la red también se descifra", desc === texto);
}

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
