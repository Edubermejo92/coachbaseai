/* ================= SINCRONIZACIÓN (cola sin conexión) =================
   Igual que en Cat Health Tracker: lo que se guarda sin red no se pierde.
   Antes cada escritura iba directa al servidor y, si fallaba (vestuario sin
   cobertura, metro, 503 de Supabase), se descartaba en silencio con un
   .catch(() => {}). Ahora las escrituras que se pueden repetir sin riesgo
   se apuntan en una cola en localStorage y se envían solas al volver la
   conexión, al volver a la app o al pulsar "Sincronizar ahora".

   Qué entra en la cola (todo lo demás sigue como estaba: login, altas de
   usuarios, escudos, fotos... necesitan la respuesta en el momento):
   - Documentos que se guardan enteros (cargas, alineación, plan...): el
     último gana, así que dos guardados seguidos sin red se quedan en uno.
   - Cambios (PATCH) y bajas (DELETE) de registros: se fusionan por registro.
   - Altas que no necesitan la respuesta en el momento: las que llevan una
     clave local (jugador, partido, parte) y las incidencias. Una segunda
     alta con la misma clave sustituye a la primera en vez de duplicarla.

   El orden se respeta: mientras quede algo en la cola, lo nuevo también
   entra en ella detrás, para que un guardado viejo nunca pise a uno nuevo.

   Este módulo no sabe nada de React ni del navegador: recibe el almacén, la
   función que envía y cómo saber si hay red. Así se prueba en Node
   (pruebas/pruebas19.mjs). */

export const CLAVE_COLA = "cb_cola_v1";
export const CLAVE_ULTIMA = "cb_sincro_ultima_v1";
export const MAX_INTENTOS = 8;

/* Recursos que se guardan como un documento entero por equipo. */
const DOCS = new Set(["cargas", "abp-corners", "alineacion", "alineaciones-favoritas", "asistencia", "pase-lista", "plan", "jugadas", "pretemporada"]);
/* Recursos con registros sueltos que se pueden cambiar o borrar en diferido. */
const REGISTROS = new Set(["jugadores", "partidos", "incidencias", "partes", "actas", "plantillas", "convocatorias", "entrenamientos", "clubes", "equipos", "propuestas", "parte-sancion"]);
/* Escrituras POST idempotentes que no son documentos ni altas. */
const POST_IDEMPOTENTES = new Set(["datos-jugador", "convocatoria-enviada", "retransmision-datos"]);

const ES_FUNCION = /\/\.netlify\/functions\/airtable$/;

const json = (txt) => { try { return JSON.parse(txt); } catch { return null; } };

/* Une dos cuerpos de PATCH al mismo registro: lo nuevo gana campo a campo, y
   los envoltorios {fields} y {row} se unen por dentro. */
export function fusionar(viejo, nuevo) {
  const a = json(viejo), b = json(nuevo);
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return nuevo;
  const out = { ...a, ...b };
  for (const k of ["fields", "row"]) {
    if (a[k] && b[k] && typeof a[k] === "object" && typeof b[k] === "object") out[k] = { ...a[k], ...b[k] };
  }
  return JSON.stringify(out);
}

/* ¿Puede esperar esta escritura? Devuelve null si no, o cómo agruparla:
   { clave, modo: "sustituir" | "fusionar" | "unico", alta? }. */
export function clasificar(url, metodo, cuerpo, cola) {
  metodo = String(metodo || "GET").toUpperCase();
  if (metodo === "GET" || metodo === "HEAD") return null;
  let u;
  try { u = new URL(url, "http://x"); } catch { return null; }
  if (!ES_FUNCION.test(u.pathname)) return null;
  const res = u.searchParams.get("res");
  const id = u.searchParams.get("id");
  const team = u.searchParams.get("team") || "";

  /* Usuarios: airPatch / airDelete van con ?id= y sin ?res=. */
  if (!res) {
    if (!id) return null; // acciones (login, altas de cuenta...): nunca en cola
    if (metodo === "PATCH") return { clave: `PATCH ${id}`, modo: "fusionar", id };
    if (metodo === "DELETE") return { clave: `DELETE ${id}`, modo: "sustituir", id, baja: true };
    return null;
  }
  if (DOCS.has(res)) return metodo === "POST" ? { clave: `doc ${res} ${team}`, modo: "sustituir" } : null;
  if (POST_IDEMPOTENTES.has(res) && metodo === "POST") {
    if (res === "convocatoria-enviada") {
      const b = json(cuerpo) || {};
      return { clave: `conv ${b.team || ""} ${b.fecha || ""}`, modo: "sustituir" };
    }
    return { clave: `${res} ${id || ""}`, modo: "sustituir" };
  }
  if (!REGISTROS.has(res)) return null;
  if (metodo === "PATCH" && id) return { clave: `PATCH ${res} ${id}`, modo: "fusionar", id };
  if (metodo === "DELETE" && id) return { clave: `DELETE ${res} ${id}`, modo: "sustituir", id, baja: true };
  if (metodo === "POST" && !id) {
    if (cola && cola.alta) return { clave: `alta ${res} ${cola.alta}`, modo: "sustituir", alta: { res, local: String(cola.alta) } };
    const b = json(cuerpo);
    if (res === "incidencias" && b && b.action === "create") return { clave: `alta ${res} ${Math.random().toString(36).slice(2)}${Date.now()}`, modo: "unico" };
  }
  return null;
}

/* Fallos que merecen reintento: sin red, servidor caído o saturado. */
export const esTransitorio = (estado) => estado === 0 || estado === 408 || estado === 429 || estado >= 500;

export function crearSincro({ almacen, enviar, enLinea = () => true, ahora = () => Date.now() }) {
  const leer = (k, d) => { try { const v = almacen.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const escribir = (k, v) => { try { almacen.setItem(k, JSON.stringify(v)); } catch { /* almacén lleno o bloqueado */ } };

  let cola = leer(CLAVE_COLA, []);
  if (!Array.isArray(cola)) cola = [];
  let usuario = null;
  let enviando = null; // promesa del vaciado en curso
  let error = null;    // { tipo: "sesion" | "rechazo" | "red", texto }
  let ultima = leer(CLAVE_ULTIMA, null);
  const oyentes = new Set();
  const alCrearOyentes = new Set();

  const mia = (it) => !usuario || it.u === usuario;
  const estado = () => ({
    pendientes: cola.filter(mia).length,
    enviando: !!enviando,
    enLinea: !!enLinea(),
    ultima,
    error,
  });
  const avisar = () => { const e = estado(); oyentes.forEach((f) => { try { f(e); } catch { /* oyente roto */ } }); };
  const guardar = () => { escribir(CLAVE_COLA, cola); avisar(); };

  function encolar({ url, metodo, cuerpo, cabeceras }, clas) {
    const item = { url, metodo, cuerpo: cuerpo ?? null, cabeceras: cabeceras || {}, clave: clas.clave, u: usuario, t: ahora() };
    if (clas.alta) item.alta = clas.alta;
    if (clas.baja && clas.id) {
      /* Si se borra un registro, sus cambios pendientes ya no hacen falta. */
      cola = cola.filter((x) => !(x.u === usuario && x.metodo === "PATCH" && x.clave.endsWith(` ${clas.id}`)));
    }
    if (clas.modo !== "unico") {
      const i = cola.findIndex((x) => x.clave === item.clave && x.u === usuario);
      if (i >= 0) {
        if (clas.modo === "fusionar") item.cuerpo = fusionar(cola[i].cuerpo, item.cuerpo);
        /* Se quita de donde estaba y va al final: así el orden relativo con
           el resto de escrituras es el de la última vez que se tocó. */
        cola.splice(i, 1);
      }
    }
    cola.push(item);
    guardar();
    return item;
  }

  /* Quita de la cola el alta de algo que se ha borrado antes de subirlo. */
  function cancelarAlta(res, local) {
    const clave = `alta ${res} ${local}`;
    const antes = cola.length;
    cola = cola.filter((x) => !(x.clave === clave && x.u === usuario));
    if (cola.length !== antes) guardar();
  }

  async function vaciarUnaVez() {
    let enviados = 0;
    while (true) {
      const i = cola.findIndex(mia);
      if (i < 0) break;
      if (!enLinea()) { error = null; break; }
      const it = cola[i];
      let r = null, estadoHttp = 0, texto = "";
      try {
        r = await enviar(it);
        estadoHttp = r.status;
        texto = await r.text().catch(() => "");
      } catch (e) {
        estadoHttp = 0;
      }
      if (estadoHttp === 401) { error = { tipo: "sesion", texto: "" }; break; }
      /* Un error del servidor que se repite con el mismo cambio no es una
         caída pasajera: tras MAX_INTENTOS se da por rechazado, para que no
         tape para siempre todo lo que viene detrás. Sin red (estado 0) no
         cuenta: eso sí se espera lo que haga falta. */
      if (esTransitorio(estadoHttp) && !(estadoHttp >= 500 && (it.intentos = (it.intentos || 0) + 1) >= MAX_INTENTOS)) {
        if (estadoHttp) escribir(CLAVE_COLA, cola);
        error = { tipo: "red", texto: estadoHttp ? `HTTP ${estadoHttp}` : "" };
        break;
      }
      /* Ya no está en la cola pase lo que pase: o ha entrado, o el servidor
         lo ha rechazado de forma definitiva (permisos, registro borrado por
         otro...) y reintentarlo daría el mismo error para siempre. */
      cola = cola.filter((x) => x !== it);
      escribir(CLAVE_COLA, cola);
      if (estadoHttp >= 400) {
        const d = json(texto);
        error = { tipo: "rechazo", texto: (d && (d.reason || d.error)) || `HTTP ${estadoHttp}` };
      } else {
        enviados++;
        if (it.alta) {
          const d = json(texto);
          const rec = d && (d.rec || d.id || (d.record && d.record.id));
          if (rec) alCrearOyentes.forEach((f) => { try { f({ ...it.alta, rec }); } catch { /* oyente roto */ } });
        }
      }
      avisar();
    }
    /* Sin red no se puede dar nada por sincronizado, aunque la cola esté
       vacía: lo de los demás no se ha podido bajar. */
    if (enLinea() && !cola.some(mia) && (!error || error.tipo === "red")) {
      error = null;
      ultima = ahora();
      escribir(CLAVE_ULTIMA, ultima);
    }
    return enviados;
  }

  /* Envía la cola en orden. Si ya hay un vaciado en marcha, se espera a ese. */
  function vaciar() {
    if (enviando) return enviando;
    enviando = (async () => {
      avisar();
      try { return await vaciarUnaVez(); }
      finally { enviando = null; avisar(); }
    })();
    return enviando;
  }

  /* La cola es de quien la escribió. Al entrar otra persona en el mismo
     móvil, lo que dejó pendiente la anterior se descarta: se enviaría con
     la sesión equivocada. */
  function fijarUsuario(u) {
    usuario = u || null;
    if (usuario) {
      const antes = cola.length;
      cola = cola.filter((x) => x.u === usuario);
      if (cola.length !== antes) escribir(CLAVE_COLA, cola);
    }
    error = null;
    avisar();
  }

  function marcarSincronizado() { ultima = ahora(); escribir(CLAVE_ULTIMA, ultima); avisar(); }

  return {
    clasificar,
    encolar,
    vaciar,
    cancelarAlta,
    fijarUsuario,
    marcarSincronizado,
    estado,
    hayPendientes: () => cola.some(mia),
    suscribir: (f) => { oyentes.add(f); return () => oyentes.delete(f); },
    alCrear: (f) => { alCrearOyentes.add(f); return () => alCrearOyentes.delete(f); },
    _cola: () => cola,
  };
}
