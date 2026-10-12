/* ================= AVISOS CON LA APP CERRADA (WEB PUSH) =================
   Lo que la app no puede hacer sola: avisar a alguien que no la tiene
   abierta. Tres caminos, todos aquí:

   1. Reglas que revisa una función programada cada 5 minutos (avisos-reglas):
      - Convocatoria pendiente: hay partido el sábado o el domingo y la
        convocatoria de ese día no se ha mandado. Jueves desde las 18:00 y
        viernes desde las 12:00 (hora de Madrid).
      - Día de partido: 3 horas antes del inicio (a las 9:00 si no hay hora).
      - Parte de material: a las 21:30, si hoy tocaba entreno (Dias de
        entreno del equipo) y no hay parte.
      - Resumen al club: a las 9:00, las categorías que ayer no mandaron parte.
   2. Avisos a hora fija que pide un móvil (avisos-reloj, cada minuto): el
      final de la parte y el descuento del Modo partido, para que suenen
      aunque el sistema haya cerrado la app.
   3. Avisos al momento: una propuesta nueva del segundo entrenador avisa a
      quien tiene que aprobarla.

   Convocatoria, partido y parte de material van al cuerpo técnico del equipo
   (entrenador, segundo y delegado, también como rol adicional); nunca a
   familias ni jugadores. Solo funciona con los datos en Supabase.

   Cada aviso tiene una clave: se apunta en push_enviados ANTES de mandarlo,
   así que aunque la función pase diez veces por la misma ventana, llega una
   vez. Si el envío falla, se borra la marca y se reintenta en la siguiente
   pasada. */
import { rest } from "./supabase-airtable.mts";
import { enviarWebPush } from "./webpush.mts";

const TZ = "Europe/Madrid";
const STAFF = ["Entrenador principal", "Segundo entrenador", "Delegado"];
const ES_REC = /^rec[A-Za-z0-9]+$/;
const enc = encodeURIComponent;

export type Aviso = { titulo: string; cuerpo: string; tag: string; url?: string; clave: string };

/* ---------- claves VAPID (en Supabase Vault) ---------- */
let vapid: { pub: string; priv: string } | null = null;
async function claves() {
  if (vapid) return vapid;
  const [pub, priv] = await Promise.all([
    rest("rpc/_secreto", { method: "POST", body: { nombre: "vapid_publica" } }),
    rest("rpc/_secreto", { method: "POST", body: { nombre: "vapid_privada" } }),
  ]);
  if (!pub || !priv) throw new Error("Faltan las claves VAPID en Supabase Vault (vapid_publica / vapid_privada)");
  vapid = { pub: String(pub), priv: String(priv) };
  return vapid;
}
export const clavePublica = async () => (await claves()).pub;

/* ---------- envío ---------- */
type Sub = { endpoint: string; p256dh: string; auth: string; usuario: string };
async function mandar(sub: Sub, aviso: Aviso): Promise<"ok" | "caducada" | "error"> {
  /* Las pruebas cambian el envío real por uno de mentira. */
  const prueba = (globalThis as any).__enviarPushPrueba;
  if (prueba) return prueba(sub, aviso);
  const { pub, priv } = await claves();
  try {
    const r = await enviarWebPush(
      sub,
      JSON.stringify({ title: aviso.titulo, body: aviso.cuerpo, tag: aviso.tag, url: aviso.url || "/", clave: aviso.clave }),
      { pub, priv, sujeto: Netlify.env.get("APP_URL") || "https://coachbase-ai.netlify.app" },
    );
    /* 404/410: el navegador ya no reconoce esa suscripción (se desinstaló la
       app, se borraron datos…). Se quita para no insistir. */
    if (r.caducada) return "caducada";
    if (!r.ok) { console.error(`[avisos] el servicio de push contestó ${r.estado}`); return "error"; }
    return "ok";
  } catch (e: any) {
    console.error(`[avisos] envío fallido: ${String(e?.message || e).slice(0, 200)}`);
    return "error";
  }
}

/* true si la clave es nueva (y queda apuntada); false si ya se mandó. */
async function marcar(clave: string): Promise<boolean> {
  const filas = await rest("push_enviados?on_conflict=clave", {
    method: "POST", body: [{ clave }], prefer: "resolution=ignore-duplicates,return=representation",
  });
  return Array.isArray(filas) && filas.length > 0;
}
const desmarcar = (clave: string) => rest(`push_enviados?clave=eq.${enc(clave)}`, { method: "DELETE" }).catch(() => {});
const borrarSub = (endpoint: string) => rest(`push_suscripciones?endpoint=eq.${enc(endpoint)}`, { method: "DELETE" }).catch(() => {});

/* Manda un aviso a estas personas (a todos sus móviles), una sola vez cada
   una. Devuelve a cuántas les ha llegado. */
export async function avisarUsuarios(usuarios: string[], aviso: Aviso): Promise<number> {
  const ids = [...new Set(usuarios.filter((x) => ES_REC.test(x)))];
  if (!ids.length) return 0;
  const subs: Sub[] = await rest(`push_suscripciones?select=endpoint,p256dh,auth,usuario&usuario=in.(${ids.join(",")})`);
  let n = 0;
  for (const u of ids) {
    const suyas = subs.filter((s) => s.usuario === u);
    if (!suyas.length) continue;
    const clave = `${aviso.clave}|${u}`;
    if (!(await marcar(clave))) continue;
    let alguno = false, fallo = false;
    for (const s of suyas) {
      const r = await mandar(s, aviso);
      if (r === "ok") alguno = true;
      else if (r === "caducada") await borrarSub(s.endpoint);
      else fallo = true;
    }
    if (alguno) n++;
    else if (fallo) await desmarcar(clave);
  }
  return n;
}

/* ---------- quién es quién ---------- */
const tieneAlguno = (u: any, roles: string[]) =>
  roles.includes(u.rol) || (u.roles_adicionales || []).some((r: string) => roles.includes(r));
async function personasDe(campo: "equipo" | "club", id: string, roles: string[]): Promise<string[]> {
  if (!ES_REC.test(id)) return [];
  const us = await rest(`usuarios?select=id,rol,roles_adicionales&estado=eq.Activo&${campo}=cs.${enc(`{${id}}`)}`);
  return us.filter((u: any) => tieneAlguno(u, roles)).map((u: any) => u.id);
}
export const staffDe = (equipo: string) => personasDe("equipo", equipo, STAFF);

/* ---------- la hora de Madrid ---------- */
const fmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short",
});
const DOW: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
export function enMadrid(d: Date) {
  const p: Record<string, string> = {};
  for (const x of fmt.formatToParts(d)) p[x.type] = x.value;
  return { fecha: `${p.year}-${p.month}-${p.day}`, dow: DOW[p.weekday], min: Number(p.hour) * 60 + Number(p.minute) };
}
/* "2026-10-17" + "11:30" en Madrid → el instante UTC. Dos vueltas bastan
   para caer en el desfase correcto también los días de cambio de hora. */
export function deMadrid(fecha: string, hhmm: string): Date {
  const [y, m, d] = fecha.split("-").map(Number);
  const [hh, mi] = hhmm.split(":").map(Number);
  const objetivo = Date.UTC(y, m - 1, d, hh, mi);
  let t = objetivo;
  for (let i = 0; i < 2; i++) {
    const l = enMadrid(new Date(t));
    const [ly, lm, ld] = l.fecha.split("-").map(Number);
    t += objetivo - Date.UTC(ly, lm - 1, ld, Math.floor(l.min / 60), l.min % 60);
  }
  return new Date(t);
}
const sumarDias = (fecha: string, n: number) => {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
const NOMBRE_DIA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const diaDe = (fecha: string) => NOMBRE_DIA[new Date(`${fecha}T12:00:00Z`).getUTCDay()];
const horaDe = (h: unknown) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(h || "").trim());
  return m && Number(m[1]) < 24 && Number(m[2]) < 60 ? `${m[1].padStart(2, "0")}:${m[2]}` : "";
};
const diasEntreno = (v: unknown): number[] => {
  try { const a = JSON.parse(String(v || "[]")); return Array.isArray(a) ? a.map(Number).filter((x) => x >= 0 && x <= 6) : []; }
  catch { return []; }
};
const partidoTxt = (p: any) => `${p.local || "?"} – ${p.visitante || "?"}`;

/* ---------- 1. reglas ---------- */
export async function revisarReglas(ahora = new Date()) {
  const m = enMadrid(ahora);
  const hechos = { convocatoria: 0, partido: 0, parte: 0, resumenClub: 0 };
  const P = "id,fecha,hora,local,visitante,lugar,equipo";

  /* Convocatoria pendiente: jueves desde las 18:00 y viernes desde las 12:00. */
  const momento = m.dow === 4 && m.min >= 18 * 60 ? "jue" : m.dow === 5 && m.min >= 12 * 60 ? "vie" : "";
  if (momento) {
    const sab = sumarDias(m.fecha, 6 - m.dow), dom = sumarDias(sab, 1);
    const partidos = await rest(`partidos?select=${P}&fecha=in.(${sab},${dom})`);
    if (partidos.length) {
      const convs = await rest(`convocatorias?select=equipo,fecha&fecha=in.(${sab},${dom})`);
      for (const p of partidos) for (const eq of p.equipo || []) {
        if (convs.some((c: any) => c.fecha === p.fecha && (c.equipo || []).includes(eq))) continue;
        const h = horaDe(p.hora);
        hechos.convocatoria += await avisarUsuarios(await staffDe(eq), {
          titulo: "Convocatoria pendiente",
          cuerpo: `El ${diaDe(p.fecha)}${h ? ` a las ${h}` : ""}: ${partidoTxt(p)}. Todavía no has mandado la convocatoria.`,
          tag: `conv-${p.id}`, url: "/?tab=convocatoria", clave: `conv|${p.id}|${eq}|${momento}`,
        });
      }
    }
  }

  /* Día de partido: 3 horas antes; sin hora, a las 9:00. */
  const deHoy = await rest(`partidos?select=${P}&fecha=eq.${m.fecha}`);
  for (const p of deHoy) {
    const h = horaDe(p.hora);
    const inicio = h ? deMadrid(p.fecha, h) : null;
    const desde = inicio ? new Date(inicio.getTime() - 3 * 3600000) : deMadrid(p.fecha, "09:00");
    const hasta = inicio || deMadrid(p.fecha, "23:59");
    if (ahora < desde || ahora >= hasta) continue;
    for (const eq of p.equipo || []) {
      hechos.partido += await avisarUsuarios(await staffDe(eq), {
        titulo: h ? `Partido hoy a las ${h}` : "Partido hoy",
        cuerpo: `${partidoTxt(p)}${p.lugar ? ` · ${p.lugar}` : ""}`,
        tag: `dia-${p.id}`, url: "/?tab=partido", clave: `dia|${p.id}|${eq}`,
      });
    }
  }

  /* Partes de material: el del día a las 21:30 y el resumen al club a las 9:00. */
  const tocaParte = m.min >= 21 * 60 + 30, tocaResumen = m.min >= 9 * 60;
  if (tocaParte || tocaResumen) {
    const equipos = await rest(`equipos?select=id,nombre,club,dias_de_entreno`);
    if (tocaParte) {
      const hoyToca = equipos.filter((e: any) => diasEntreno(e.dias_de_entreno).includes(m.dow));
      if (hoyToca.length) {
        const partes = await rest(`partes_entreno?select=equipo&fecha=eq.${m.fecha}`);
        for (const e of hoyToca) {
          if (partes.some((x: any) => (x.equipo || []).includes(e.id))) continue;
          hechos.parte += await avisarUsuarios(await staffDe(e.id), {
            titulo: "Parte de material",
            cuerpo: `Hoy tocaba entreno de ${e.nombre || "tu categoría"} y no hay parte de material. Mándalo antes de acabar el día.`,
            tag: `parte-${e.id}`, url: "/?tab=parte", clave: `parte|${e.id}|${m.fecha}`,
          });
        }
      }
    }
    if (tocaResumen) {
      const ayer = sumarDias(m.fecha, -1), dowAyer = (m.dow + 6) % 7;
      const tocabaAyer = equipos.filter((e: any) => diasEntreno(e.dias_de_entreno).includes(dowAyer));
      if (tocabaAyer.length) {
        const partes = await rest(`partes_entreno?select=equipo&fecha=eq.${ayer}`);
        const faltan = tocabaAyer.filter((e: any) => !partes.some((x: any) => (x.equipo || []).includes(e.id)));
        const porClub = new Map<string, string[]>();
        for (const e of faltan) for (const c of e.club || []) porClub.set(c, [...(porClub.get(c) || []), e.nombre || "?"]);
        for (const [club, nombres] of porClub) {
          hechos.resumenClub += await avisarUsuarios(await personasDe("club", club, ["Club", "Director deportivo"]), {
            titulo: "Partes de material sin mandar",
            cuerpo: `Ayer (${diaDe(ayer)}) faltó el parte en: ${nombres.join(", ")}.`,
            tag: `partes-club-${club}`, url: "/?tab=equipo", clave: `partes-club|${club}|${ayer}`,
          });
        }
      }
    }
  }

  /* Las marcas de más de 40 días ya no evitan ninguna repetición. */
  await rest(`push_enviados?enviado_en=lt.${enc(new Date(ahora.getTime() - 40 * 86400000).toISOString())}`, { method: "DELETE" }).catch(() => {});
  return hechos;
}

/* ---------- 2. avisos a hora fija (reloj del Modo partido) ---------- */
export async function enviarProgramados(ahora = new Date()) {
  /* 20 s de adelanto: la función pasa una vez por minuto, así el aviso cae
     en la pasada más cercana y no en la siguiente. */
  const limite = new Date(ahora.getTime() + 20000).toISOString();
  const debidos = await rest(`push_programados?select=*&enviar_en=lte.${enc(limite)}&order=enviar_en.asc`);
  if (!debidos.length) return { enviados: 0 };
  const endpoints = [...new Set(debidos.map((x: any) => x.endpoint))] as string[];
  const subs: Sub[] = [];
  for (const e of endpoints) subs.push(...(await rest(`push_suscripciones?select=endpoint,p256dh,auth,usuario&endpoint=eq.${enc(e)}`)));
  let enviados = 0;
  for (const a of debidos) {
    /* Uno que lleva más de 10 minutos atrasado (la función estuvo parada)
       ya no sirve: avisar del final de la parte con el partido acabado
       confunde más que ayuda. */
    const tarde = ahora.getTime() - new Date(a.enviar_en).getTime() > 10 * 60000;
    const s = subs.find((x) => x.endpoint === a.endpoint);
    if (!tarde && s && (await marcar(`prog|${a.endpoint}|${a.clave}`))) {
      const r = await mandar(s, { titulo: a.titulo, cuerpo: a.cuerpo, tag: a.tag, url: "/?tab=partido", clave: a.clave });
      if (r === "ok") enviados++;
      else if (r === "caducada") await borrarSub(a.endpoint);
    }
    await rest(`push_programados?id=eq.${a.id}`, { method: "DELETE" });
  }
  return { enviados };
}

/* Sustituye los avisos del reloj de este móvil por los que manda ahora (o
   ninguno, si se ha parado el reloj). */
export async function programarReloj(usuario: string, endpoint: string, avisos: any[]) {
  const suya = await rest(`push_suscripciones?select=endpoint&endpoint=eq.${enc(endpoint)}&usuario=eq.${enc(usuario)}`);
  if (!suya.length) return { ok: false, reason: "sin_suscripcion" };
  await rest(`push_programados?endpoint=eq.${enc(endpoint)}&tag=eq.cb-reloj`, { method: "DELETE" });
  const ahora = Date.now();
  const filas = (Array.isArray(avisos) ? avisos : []).slice(0, 6).map((a) => ({
    usuario, endpoint, tag: "cb-reloj",
    enviar_en: new Date(a?.en).toISOString(),
    titulo: String(a?.titulo || "").slice(0, 120), cuerpo: String(a?.cuerpo || "").slice(0, 240),
    clave: String(a?.clave || "").slice(0, 120),
  })).filter((f) => f.titulo && f.clave && Date.parse(f.enviar_en) > ahora - 60000 && Date.parse(f.enviar_en) < ahora + 5 * 3600000);
  if (filas.length) await rest("push_programados", { method: "POST", body: filas, prefer: "return=minimal" });
  return { ok: true, programados: filas.length };
}

/* ---------- 3. al momento: propuesta nueva ---------- */
export async function avisarPropuesta(propuesta: string, equipo: string, tipo: string) {
  let a = await personasDe("equipo", equipo, ["Entrenador principal"]);
  if (!a.length) {
    const [eq] = await rest(`equipos?select=club&id=eq.${enc(equipo)}`);
    for (const c of eq?.club || []) a.push(...(await personasDe("club", c, ["Director deportivo"])));
  }
  return avisarUsuarios(a, {
    titulo: "Propuesta pendiente",
    cuerpo: `El segundo entrenador ha propuesto un cambio de ${tipo.toLowerCase()}. Revísalo para aprobarlo o rechazarlo.`,
    tag: `prop-${propuesta}`, url: "/?tab=inicio", clave: `prop|${propuesta}`,
  });
}

/* ---------- suscripciones ---------- */
export async function suscribir(usuario: string, sub: any, userAgent: string) {
  const endpoint = String(sub?.endpoint || "");
  const p256dh = String(sub?.keys?.p256dh || ""), auth = String(sub?.keys?.auth || "");
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !p256dh || !auth) return { ok: false, reason: "suscripcion_invalida" };
  /* Un móvil puede cambiar de cuenta: la suscripción pasa a quien la manda. */
  await rest("push_suscripciones?on_conflict=endpoint", {
    method: "POST", prefer: "resolution=merge-duplicates,return=minimal",
    body: [{ usuario, endpoint, p256dh, auth, user_agent: String(userAgent || "").slice(0, 300), actualizado: new Date().toISOString() }],
  });
  return { ok: true };
}
export async function desuscribir(usuario: string, endpoint: string) {
  await rest(`push_suscripciones?endpoint=eq.${enc(endpoint)}&usuario=eq.${enc(usuario)}`, { method: "DELETE" });
  return { ok: true };
}
