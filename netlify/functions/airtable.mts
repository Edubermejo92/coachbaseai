// Proxy serverless entre la app y Airtable.
//   ?res=(vacío)      -> Usuarios: login, registro real (crea club y equipo), alta/baja, roles
//   ?res=equipos      -> Equipos: listar, crear y editar (rol Master)
//   ?res=clubes       -> Clubes: listar
//   ?res=escudo&id=   -> subir el escudo de un equipo (adjunto en el registro de Equipos)
//   ?res=incidencias  -> módulo de comportamiento (Código Disciplinario)
//   ?res=normativa | firmas | galeria
//   ?res=config       -> qué pestañas son gratis y cuáles Premium (solo Master edita)
//
// Variables de entorno en Netlify:
//   AIRTABLE_TOKEN -> Personal Access Token (data.records:read y data.records:write sobre la base)
//   AIRTABLE_BASE  -> (opcional) id de la base; por defecto la base COACHBASE AI
const BASE = () => Netlify.env.get("AIRTABLE_BASE") || "appDVtUWdtfzkV1sA";
const TOKEN = () => Netlify.env.get("AIRTABLE_TOKEN");
const PEPPER = "coachbase-2026";

const T_USUARIOS = "tblZf4dFeq4FCjHGJ";
const T_JUGADORES = "tblsZpNBzo2DXlt6X";
const T_CLUBES = "tblc2wLfnbbJg8KkI";
const T_EQUIPOS = "tbl7h2mhoWr0W9aSU";
/* Partes de entreno: uno por sesión y entrenador. Es el control de material
   del club —qué saca, qué devuelve, qué se pierde— más las incidencias del
   día. Va en tabla propia y no en un JSON del equipo porque el club necesita
   leerlo agregado de TODAS sus categorías a la vez. */
const T_PARTES = "tblBM9evPnnjD3prf";
const T_INCIDENCIAS = "tblQHTqaiSED689xd";
const T_NORMATIVA = "tblNgKxTA0TUq93Oa";
const T_FIRMAS = "tblCiJo9zi21Yeaf7";
const T_GALERIA = "tblwMuinSKzjvkhk7";
const T_PARTIDOS = "tblwOCRaTwkZVzVxq";
/* Ficha que se comparte con el equipo rival de un partido: una copia congelada
   de la convocatoria y la alineación, y el código del enlace que la abre.
   Congelada a propósito: compartir es un acto puntual, no una ventana abierta
   a la app —si el rival viera los cambios en vivo, cada retoque de la
   alineación del sábado se le estaría enseñando según se hace. */
const PARTIDO_FICHA = "fldTCEB7wCHsidFMN";
const PARTIDO_TOKEN = "fld6Q79obeJa46rOf";
const T_CONVOCATORIAS = "tbl4ahEyv6FpMsYL0";
/* Cambios propuestos por el segundo entrenador que requieren aprobación del
   entrenador principal (o director/master) antes de aplicarse. */
const T_PROPUESTAS = "tbl6cVRLXukqg1iFQ";
const PR = {
  ref: "fldmOwGOnzTLj0YwB", tipo: "fldcg1NtOgnd1dPgm", estado: "fldTp6KiLsX1Ct0zq",
  datos: "fldLyjvNJYFl9L44F", equipo: "fldNDgGcg66K5KLGT",
  propuestoPor: "fldtb0FrZmgtdhOoI", aprobadoPor: "fldeJt8lKbxm0TCdA",
  fechaProp: "fldrRDvRP5IBIcbwG", fechaRes: "fldEZxwoA1k4HLWji",
  motivo: "fldNre3sjgcXmLIig",
};
const T_ENTRENAMIENTOS = "tblinm3lV3FTUcL62";
/* Plantillas de entrenamiento reutilizables. Viven en la misma tabla que las
   sesiones (Entrenamientos): una sesión con Plantilla=true no tiene fecha, es
   un guion que se puede volver a cargar. Compartida=true la abre a todos los
   equipos del club. Usos permite ordenar por "más usadas". */
const EN = {
  ref: "fldegGMXJRVzKb3FX", fecha: "fldmm7Wu8dsiYXp5v", hora: "fldyjODX19T63snIp",
  objetivo: "flddMRTxwDf4HNE0J", duracion: "fldDitygMo9IAlx5P", bloques: "fldqKH4tfgYpFBKto",
  equipo: "fldVpgy3PMoFg1Wef", plantilla: "fld1Jb0vPATGxESTF", compartida: "fldz3tCDJkRuqrgXr",
  club: "fldokrqbCdfZBKMeY", usos: "fldtpmWpEyHfhx5Ud",
};

const U = {
  nombre: "fldSnD1rqmHptkRlA", email: "fldJWlJ17YuZNe4Jx", rol: "fldIWSWMiwFsxJBiY",
  estado: "fldEkbPe6UgCx0Lfy", plan: "fldATfWgaJOvmd6ep", club: "fldV2DDL6v5szs0y3",
  equipo: "fldW8QHQvuOZv1zX8", pass: "fldVX372lPNj7Bab8",
  /* Modo de prueba: hasta esta fecha la persona tiene la app completa sin
     pagar. Lo pone el Master a mano en Airtable. */
  prueba: "fldevbPLxMunBH9NR",
  /* Roles extra, ademas del Rol principal: permite que una misma persona sea
     a la vez, por ejemplo, Segundo entrenador Y Delegado en su categoria. */
  rolesExtra: "fldJRASqTraLecDMa",
  /* Solo para el director deportivo: si está marcada, además de revisar el
     control de material del club tiene su propia pestaña Control de material
     para mandar partes de la categoría que entrene. La activa el propio
     director. El entrenador, el segundo y el delegado la tienen siempre y no
     dependen de esta casilla. */
  parteMat: "fld4okYQmHxbEQ6C8",
  /* Faltas de material que el club le anota a esta persona, en JSON. Van en su
     ficha y no en la del parte porque la falta que de verdad importa —no mandó
     el parte, no hizo las fotos— es justo la de un día en que NO hay parte al
     que colgarla. Las escribe solo la dirección del club. */
  faltas: "fldqlZapTFUOOLaQl",
  /* Solo para el Rol Familia: qué jugador de la plantilla es su hijo/a. Lo
     escribe el propio registro; nadie más lo toca. */
  hijo: "fldOlXL957BafrlfE",
};

/* El Master es UNA cuenta, la de EBLDigital, y no se reparte desde la app.
   Aunque alguien se ponga "Master" en el campo Rol de Airtable, si su correo
   no es este se le trata como director: el rol Master da acceso a todos los
   clubes y a los datos de todos los menores, así que no puede depender de
   que nadie edite una celda por error. */
const MASTER_EMAIL = "ebldigital92@gmail.com";
const rolReal = (rolCampo: unknown, email: unknown) => {
  const k = rolKey(rolCampo);
  if (k === "master" && norm(email) !== MASTER_EMAIL) return "director";
  return k;
};
/* Días que le quedan de prueba (0 si no tiene). Se compara a mediodía para
   que el cambio de hora no reste un día entero. */
const pruebaDias = (v: unknown) => {
  const s = String(v || "");
  if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return 0;
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  const fin = new Date(y, m - 1, d, 23, 59, 59);
  return Math.max(0, Math.ceil((fin.getTime() - Date.now()) / 86400000));
};
/* Fecha (YYYY-MM-DD) de dentro de 30 días, para el campo "Prueba hasta".
   Toda cuenta que se crea a partir de ahora -invitada por su club o de alta
   libre- arranca con un mes de prueba automático, sin que el Master tenga
   que ponerlo a mano registro a registro. */
const fechaTrial30 = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
};
const CL = {
  nombre: "fldlUNDFkJyehw8x0", comunidad: "fld0BUV86fvUDWOcU",
  escudo: "fldX3CMkCrO54gUrV", campo: "fldVH4NDAN2Odlzwe",
  direccion: "fld6XKOF4q9Kf5bKa", maps: "fld2KQW6HDKsW3wCZ",
  limite: "fldiIev3Pd9eWhulJ",
};
/* Suscripciones: la escribe el webhook de Stripe (stripe.mts), la lee este
   archivo solo para mostrar al Master si un club está pagando o no. */
const T_SUSCRIPCIONES = "tblb6s8eKcLK9LCw9";
const SUS = {
  email: "fldVivShmbaSNuCcC", estado: "fldKsbWLFhmwWGjjX", precio: "fldCnl3Bf54HU6N8b",
  importe: "fldkIp45fn7xXWI60", periodoFin: "fldSJpmXi4bmtriIs", cancelarFin: "fldJVihH0K2INwMta",
  usuario: "fldqN9PDei93K4GZ7",
};
/* Configuración global de la app: hoy solo guarda qué pestañas son gratis y
   cuáles Premium, decidido por el Master desde su panel en vez de venir fijo
   en el código. Un único registro, Clave="global". */
const T_CONFIG = "tblctORB081jr1lDO";
const CFG = { clave: "fldK6DM4hrZsjS1DP", gratis: "fldrJOfAInJThfOZv", porRol: "fld6I6dRA9myjjleR" };
const CLAVE_CONFIG_GLOBAL = "global";
/* Pestañas que el Master puede marcar como gratis o Premium. "master" se
   queda fuera a propósito: es la única cuenta que la ve y no puede depender
   de un interruptor que ella misma gestiona. */
const TABS_CONFIGURABLES = [
  "inicio", "parte", "equipos", "equipo", "jugadores", "calendario", "convocatoria",
  "alineacion", "partido", "analisis", "temporada", "entrenamiento", "lesiones", "ejercicios", "pizarra",
  "asistencia", "disciplina", "normativa", "estadisticas", "usuarios", "coachai", "material", "premium",
];
/* "inicio" y "premium" no se pueden quitar del gratis: sin inicio no hay
   portada, y sin premium nadie ve cómo pasarse a la versión de pago. */
const TABS_GRATIS_FORZADAS = ["inicio", "premium"];
/* Roles a los que el Master les puede editar el menú. Master mismo no está
   -su menú no depende de esto- y "equipos" (alta de clubes) queda fuera de
   lo que se les puede activar: es una pantalla exclusiva de Master pase lo
   que pase aquí, así que dejarla marcable solo crearía una entrada de menú
   muerta para cualquier otro rol. */
const ROLES_TABS_EDITABLES = ["club", "director", "entrenador", "segundo", "delegado"];
const TABS_ROL_CONFIGURABLES = TABS_CONFIGURABLES.filter((k) => k !== "equipos");
/* "inicio" tampoco se le puede quitar a ningún rol: sin ella no hay portada
   a la que volver dentro de la app. */
const TABS_ROL_FORZADAS = ["inicio"];
const EQ = {
  nombre: "fldmjUkaMwwLbPO89", categoria: "fldgTxdcJpju1jxt2", formato: "fldSQPSejXh45fRQ8",
  sistema: "fldl20r9arDXNdZdC", club: "fldFGQJQHzeNHi50l", escudo: "fldZ8Eow86UczBCCr",
  web: "fldnk9J5mmwx4ac36", maps: "fldmCTjJcpercjAVl",
  /* Quién responde del material de esta categoría. Lo nombra el director
     deportivo y lo puede cambiar la dirección del club; sale en el control de
     material para saber a quién preguntar cuando falta un balón. */
  encargado: "fld23b31P4y079j77",
  /* Planificación de temporada en JSON. Vive en el equipo y no en una tabla
     propia porque es un único documento por equipo, no una lista de filas:
     una tabla entera para guardar diez meses sería más ruido que ayuda. */
  plan: "fldflPuhPqSecZ3rp",
  /* Jugadas y ABP de la pizarra, en JSON y por el mismo motivo que el plan:
     es un documento por equipo, no una lista de filas. Compartirlas es lo que
     hace que el segundo entrenador y el delegado vean en el banquillo la misma
     jugada que preparó el entrenador el martes. */
  jugadas: "fldAMfVva4jTk0PCH",
  /* Cargas físicas de pretemporada por jugador (semáforo, % de carga y nota),
     en JSON y por el mismo motivo que el plan: un documento por equipo. Lo
     rellena a diario quien pasa el control de bienestar —en el reparto del
     plan físico, el delegado— y lo lee el cuerpo técnico antes de la sesión. */
  cargas: "fld57z5y3QWsk1DnF",
  /* Días de la semana en los que entrena esta categoría, en JSON (0=domingo …
     6=sábado). Lo guarda el cuerpo técnico desde el calendario. El club lo
     necesita para el control de material: sin saber qué días toca entrenar no
     se puede decir que falte un parte, y el aviso de "no ha avisado ni antes
     ni después del entreno" sería adivinar. */
  dias: "flddC2z6uAHNSaGXX",
  /* Asistencia diaria del equipo, en JSON y por el mismo motivo que las
     cargas: un documento por equipo, no una fila por día. Antes vivía solo en
     el móvil de quien pasaba lista; con esto lo ve el resto del cuerpo
     técnico y, más adelante, la familia del jugador. */
  asistencia: "fldXjBDGFcYDkEn9M",
};
const PA = {
  ref: "fldVKBSHxPEqCuVk2", fecha: "fldUyP4Qia9GM6lCR", equipo: "fldXvt940m1HPQ3uH",
  entrenador: "fldIi957OqvZF1lCA", entrenadorNombre: "fldEyuA5hqm0GjxZX",
  salida: "fldbDBmH77g1DpW7g", entrada: "fldy8c534xQZAbyNW", perdidos: "fldc8hWR8DntfHlSi",
  fotoSalida: "fldYt0QLeWUmsyWBm", fotoEntrada: "fldc0syR36oJ1iRPW",
  desperfectos: "fld9cfPju0jijEqRu", tarde: "fldPr3SR2b6PUIQUh", minutosTarde: "fldoEoWloaBFd2VOT",
  telefono: "fldeoeOvw3mPJivEv", penalizaciones: "fldrcKIaP9UgyjmFP",
  jugTarde: "fld7GphfCy25HceMW", jugMolestias: "fldL3yZEsiTDkhs9s", notas: "fldL8rT0LpKV1E9mt",
};
const I = {
  ref: "fldv5Gtrpw2e6xopC", fecha: "fldxhO3y8YcOA5XBI", ctx: "fldRG05YcO16bs8Mu",
  grav: "fld5AgFwLmneooEvl", norma: "fldOUESP4lLZ5f3kr", tarjeta: "fld7sPzGhay95hWgZ",
  desc: "fldUJuIQH32pCVkwS", medida: "fldMJW0knN3LXLVmk", importe: "fldtnmGoPm5rji3Iv",
  pago: "fldHgEScNF2H3m1ai", estado: "fld7gsbHHhts3FegF", jugador: "fld4CxW7BS48diYpQ",
  fam: "fldCy8PlOikqwymWt",
  /* Enlace directo al equipo. Existe en la tabla desde el principio, pero
     este proxy no lo usaba: por eso las incidencias -el dato más sensible de
     toda la app, expedientes de conducta de menores- se leían sin ningún
     filtro por equipo. Las incidencias creadas antes de este cambio no lo
     tienen relleno; para esas se resuelve el equipo a través del jugador
     (equipoDeJugador), y a partir de ahora se rellena siempre al crear. */
  equipo: "fldq8MwUXVY0LjPOp",
};

// Categorías de la app -> etiquetas de Airtable
const CAT_LABEL: Record<string, string> = {
  prebenjamin: "Prebenjamín", benjamin: "Benjamín", alevin: "Alevín",
  infantil: "Infantil", cadete: "Cadete", juvenil: "Juvenil", senior: "Sénior",
};
const CAT_KEY = (v: string) => Object.keys(CAT_LABEL).find((k) => CAT_LABEL[k] === v) || "infantil";
const CAT_HALF: Record<string, number> = {
  prebenjamin: 20, benjamin: 25, alevin: 30, infantil: 35, cadete: 35, juvenil: 40, senior: 45,
};
const CAT_SUB: Record<string, string> = {
  prebenjamin: "Sub-8", benjamin: "Sub-10", alevin: "Sub-12",
  infantil: "Sub-14", cadete: "Sub-16", juvenil: "Sub-19", senior: "Absoluto",
};

const NORM_LABEL: Record<string, string> = {
  L1: "L1 Puntualidad", L2: "L2 Comunicación de ausencias", L3: "L3 Atención en explicaciones",
  L4: "L4 Uso correcto del material", L5: "L5 Orden y limpieza", L6: "L6 Dispositivos electrónicos",
  L7: "L7 Imagen deportiva", L8: "L8 Tarjetas por protestar", G1: "G1 Faltas de respeto",
  G2: "G2 Conducta antideportiva", G3: "G3 Abandono del entrenamiento", G4: "G4 Daños intencionados",
  G5: "G5 Incumplimiento reiterado", G6: "G6 Actitud y compromiso",
};
const CARD_LABEL: Record<string, string> = {
  none: "Ninguna", yellow: "Amarilla interna", red: "Roja interna",
  fedYellow: "Amarilla federativa", fedRed: "Roja federativa",
};
const STATE_LABEL: Record<string, string> = {
  registrada: "Registrada", validada: "Validada por cuerpo técnico", anulada: "Anulada",
};
const PAY_LABEL: Record<string, string> = {
  na: "No aplica", pendiente: "Pendiente", pagada: "Pagada", condonada: "Condonada",
};
const inv = (m: Record<string, string>, v: string) => Object.keys(m).find((k) => m[k] === v) || "";

const j = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });

async function sha(t: string): Promise<string> {
  const b = new TextEncoder().encode(t);
  const h = await crypto.subtle.digest("SHA-256", b);
  return [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
const norm = (v: unknown) => String(v || "").trim().toLowerCase();

/* ================= CONTRASEÑAS =================
   Antes se guardaba sha256(contraseña + PEPPER): una sola vuelta de un hash
   rápido, y el mismo "pepper" para todo el mundo -escrito además en el propio
   código fuente, así que en la práctica no era secreto para nadie con acceso
   al repositorio. Si la base de Airtable se filtrara algún día, esas
   contraseñas se agrietan en cuestión de minutos con hardware normal.
   Ahora se guarda con PBKDF2-HMAC-SHA256, con sal propia por persona y
   suficientes vueltas para que agrietarla en serio cueste horas de cálculo
   por cada contraseña, no segundos. El formato se autodescribe
   ("pbkdf2$vueltas$sal$hash") para poder subir el número de vueltas en el
   futuro sin romper lo ya guardado.
   Las contraseñas antiguas se seguirán aceptando -conviven las dos formas- y
   en cuanto alguien inicia sesión o cambia la suya, se reescribe sola en el
   formato nuevo. Nadie tiene que resetear nada. */
const PBKDF2_ITERACIONES = 210000; // referencia OWASP (2023) para PBKDF2-HMAC-SHA256
const hexA_bytes = (hex: string): Uint8Array => {
  const pares = hex.match(/.{1,2}/g) || [];
  const out = new Uint8Array(pares.length);
  pares.forEach((h, i) => { out[i] = parseInt(h, 16); });
  return out;
};
const bytesAHex = (b: Uint8Array): string => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
async function pbkdf2(password: string, saltHex: string, iteraciones: number): Promise<string> {
  const clave = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexA_bytes(saltHex) as BufferSource, iterations: iteraciones, hash: "SHA-256" }, clave, 256);
  return bytesAHex(new Uint8Array(bits));
}
async function hashPassword(password: string): Promise<string> {
  const salt = bytesAHex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERACIONES);
  return `pbkdf2$${PBKDF2_ITERACIONES}$${salt}$${hash}`;
}
async function verificaPassword(password: string, guardado: string): Promise<{ ok: boolean; anticuado: boolean }> {
  const s = String(guardado || "");
  if (s.startsWith("pbkdf2$")) {
    const [, iterTxt, salt, hash] = s.split("$");
    if (!salt || !hash) return { ok: false, anticuado: false };
    const calc = await pbkdf2(password, salt, Number(iterTxt) || PBKDF2_ITERACIONES);
    return { ok: calc.length === hash.length && eqSeg(calc, hash), anticuado: false };
  }
  /* Formato de antes de este cambio: un único sha256(contraseña + pepper). */
  const legado = await sha(password + PEPPER);
  return { ok: s.length > 0 && eqSeg(legado, s), anticuado: true };
}

/* ================= ROLES =================
   Airtable guarda la ETIQUETA ("Director deportivo") y la app trabaja con la
   CLAVE ("director"). Antes la sesión se firmaba con la etiqueta normalizada,
   así que la comprobación de permisos buscaba "director" y encontraba
   "director deportivo": el director deportivo no podía dar de alta a nadie.
   rolKey() traduce, y deja pasar tal cual lo que ya es una clave, para que
   las sesiones firmadas antes de este cambio sigan valiendo. */
const ROL_KEY: Record<string, string> = {
  "entrenador principal": "entrenador", "segundo entrenador": "segundo",
  "delegado": "delegado", "director deportivo": "director",
  "club": "club", "master": "master",
};
const rolKey = (v: unknown) => ROL_KEY[norm(v)] || norm(v);
const ROL_LABEL: Record<string, string> = {
  entrenador: "Entrenador principal", segundo: "Segundo entrenador",
  delegado: "Delegado", director: "Director deportivo",
  club: "Club", master: "Master", familia: "Familia", jugador: "Jugador",
};
/* Quién dirige el club: la cuenta del propio club, el director deportivo y el
   Master. Se pregunta por aquí y no rol a rol porque son quince los sitios que
   lo comprueban: añadir un nivel por encima no puede depender de acordarse de
   los quince. El club está por encima del director —lo nombra y le cambia el
   nivel—, pero en lo que este archivo autoriza, los dos mandan igual sobre su
   propio club. */
const NIVEL_CLUB = ["master", "club", "director"];
const dirigeElClub = (sesion: any) => NIVEL_CLUB.includes(rolKey(sesion?.rol));
/* Qué roles puede repartir cada rol. Espejo de ROLES_ASIGNABLES en la app: el
   cliente ya limita el desplegable, pero eso solo evita el error honrado —
   quien manda un POST a mano se salta el desplegable entero.
   "master" no está en ninguna lista: no se reparte desde la app. */
const ASIGNABLES: Record<string, string[]> = {
  master: ["club", "director", "entrenador", "segundo", "delegado"],
  /* El club nombra a su director deportivo y le cambia el nivel: es
     justamente lo que lo pone por encima. */
  club: ["director", "entrenador", "segundo", "delegado"],
  /* El director también puede nombrar a otro director: un club puede tener
     que traspasar la dirección deportiva cuando alguien lo deja, y la app ya
     lo ofrecía en su desplegable —pero aquí se rechazaba, así que el intento
     acababa en un 403 sin explicación. */
  director: ["director", "entrenador", "segundo", "delegado"],
  entrenador: ["segundo", "delegado"],
};

/* Traduce las etiquetas del campo "Roles adicionales" (multipleSelects) a
   claves internas. Permite que una misma persona sea, por ejemplo, Segundo
   entrenador (Rol principal) Y Delegado (Rol adicional) a la vez. */
const rolesExtraKeys = (v: unknown): string[] =>
  (Array.isArray(v) ? v : []).map((x) => rolKey(x)).filter(Boolean);
/* true si esta sesion tiene esa clave de rol, ya sea como Rol principal o
   como uno de sus Roles adicionales. */
const tieneRol = (sesion: any, clave: string): boolean =>
  rolKey(sesion?.rol) === clave || (Array.isArray(sesion?.rolesExtra) && sesion.rolesExtra.includes(clave));

/* ================= SESIONES FIRMADAS =================
   Antes este endpoint estaba abierto: cualquiera con la URL podía leer y
   escribir toda la base, incluidos los datos de menores. Ahora el login
   devuelve un token firmado (HMAC-SHA256) que la app manda en x-cb-token, y
   sin token válido solo se responde a login, registro y a los NOMBRES de
   clubes y equipos (que hacen falta para el formulario de alta y no son
   datos personales).
   El secreto sale de AUTH_SECRET; si no está puesto se deriva del propio
   AIRTABLE_TOKEN, para no depender de otra variable en Netlify. Rotar el
   token de Airtable invalida las sesiones abiertas: es lo deseable. */
const AUTH_SECRET = () => Netlify.env.get("AUTH_SECRET") || TOKEN() || "";
/* Antes 30 días: con eso, un cuerpo técnico que abre la app una vez por
   semana veía "sesión caducada" a mitad de temporada, en plena convocatoria,
   sin ningún aviso de que el cambio no se había guardado hasta que aparecía
   el cartel. Un año cubre una temporada entera sin volver a pedir login. */
const TOKEN_DIAS = 365;
const b64u = (b: Uint8Array) =>
  btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (t: string) => {
  const p = t.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(p + "=".repeat((4 - (p.length % 4)) % 4)), (c) => c.charCodeAt(0));
};
async function hmac(msg: string): Promise<string> {
  const k = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(AUTH_SECRET()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64u(new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg))));
}
/* comparación en tiempo constante: no filtra por dónde deja de coincidir */
const eqSeg = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};
async function firmarSesion(p: Record<string, unknown>): Promise<string> {
  const cuerpo = b64u(new TextEncoder().encode(JSON.stringify({ ...p, exp: Date.now() + TOKEN_DIAS * 86400000 })));
  return `${cuerpo}.${await hmac(cuerpo)}`;
}
async function leerSesion(req: Request): Promise<any | null> {
  const t = req.headers.get("x-cb-token") || "";
  const i = t.indexOf(".");
  if (i < 1) return null;
  const cuerpo = t.slice(0, i), firma = t.slice(i + 1);
  if (!eqSeg(await hmac(cuerpo), firma)) return null;
  try {
    const p = JSON.parse(new TextDecoder().decode(unb64u(cuerpo)));
    return p && p.exp && p.exp > Date.now() ? p : null;
  } catch { return null; }
}

/* ================= RECUPERAR CONTRASEÑA =================
   El enlace que se manda por correo va firmado con una clave que incluye el
   hash ACTUAL de la contraseña. En cuanto se usa, la contraseña cambia, el
   hash cambia y la firma deja de validar: queda de un solo uso sin guardar
   ningún token en Airtable. Caduca además por tiempo.
   Cambiar el AIRTABLE_TOKEN (o el AUTH_SECRET) invalida también los enlaces
   pendientes, igual que ya pasa con las sesiones abiertas. */
const RESET_MIN = 60;
async function hmacCon(clave: string, msg: string): Promise<string> {
  const k = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(clave), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64u(new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg))));
}
const claveReset = (hashActual: string) => `${AUTH_SECRET()}|reset|${hashActual || ""}`;
async function firmarReset(uid: string, hashActual: string): Promise<string> {
  const cuerpo = b64u(new TextEncoder().encode(JSON.stringify({ uid, exp: Date.now() + RESET_MIN * 60000 })));
  return `${cuerpo}.${await hmacCon(claveReset(hashActual), cuerpo)}`;
}
/* Lee el uid SIN validar la firma: hace falta para saber a qué usuario mirarle
   el hash con el que después sí se valida. No confiar en esto para nada más. */
const cuerpoReset = (tk: string): { uid?: string; exp?: number } | null => {
  const i = String(tk || "").indexOf(".");
  if (i < 1) return null;
  try { return JSON.parse(new TextDecoder().decode(unb64u(tk.slice(0, i)))); } catch { return null; }
};
async function resetValido(tk: string, hashActual: string): Promise<boolean> {
  const i = String(tk || "").indexOf(".");
  if (i < 1) return false;
  const cuerpo = tk.slice(0, i), firma = tk.slice(i + 1);
  if (!eqSeg(await hmacCon(claveReset(hashActual), cuerpo), firma)) return false;
  const p = cuerpoReset(tk);
  return !!(p && p.exp && p.exp > Date.now());
}

/* ================= CORREO (Resend) =================
   RESEND_API_KEY es obligatoria para que funcione "he olvidado mi contraseña".
   MAIL_FROM debe ser un remitente de un dominio verificado en Resend; el
   onboarding@resend.dev de pruebas solo entrega al correo del titular de la
   cuenta de Resend, así que en producción hay que cambiarlo. */
const MAIL_KEY = () => Netlify.env.get("RESEND_API_KEY");
const MAIL_FROM = () => Netlify.env.get("MAIL_FROM") || "COACHBASE AI <onboarding@resend.dev>";
const APP_URL = () => Netlify.env.get("APP_URL") || "https://coachbase-ai.netlify.app";
/* Al usuario se le responde siempre lo mismo (no se puede decir si la cuenta
   existe), así que el ÚNICO sitio donde se puede ver por qué no sale un correo
   es el log de la función. Antes esto se tragaba el error de Resend en
   silencio y dejaba el fallo sin forma de diagnosticar: si Resend rechaza el
   envío, aquí queda escrito el motivo exacto.
   Se registra el motivo y el destinatario, nunca la clave. */
async function enviarCorreo(to: string, subject: string, html: string): Promise<boolean> {
  if (!MAIL_KEY()) {
    console.error("[correo] RESEND_API_KEY no configurada");
    return false;
  }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${MAIL_KEY()}`, "content-type": "application/json" },
      body: JSON.stringify({ from: MAIL_FROM(), to: [to], subject, html }),
    });
    const cuerpo = await r.text().catch(() => "");
    if (!r.ok) {
      console.error(`[correo] Resend ${r.status} al enviar a ${to} desde "${MAIL_FROM()}": ${cuerpo.slice(0, 400)}`);
      return false;
    }
    console.log(`[correo] enviado a ${to} desde "${MAIL_FROM()}" · ${cuerpo.slice(0, 200)}`);
    return true;
  } catch (e) {
    console.error(`[correo] no se pudo contactar con Resend: ${String(e).slice(0, 200)}`);
    return false;
  }
}
const correoReset = (nombre: string, enlace: string) => `
<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#0E1512;color:#E8EDE6;padding:32px">
  <div style="max-width:520px;margin:0 auto;background:#16201B;border:1px solid rgba(232,237,230,.14);border-radius:16px;padding:28px">
    <div style="font-size:22px;font-weight:700;letter-spacing:.02em">COACHBASE AI</div>
    <p style="color:#8FA096;font-size:13px;margin:4px 0 24px">by EBLDigital</p>
    <p style="font-size:15px;margin:0 0 16px">Hola${nombre ? " " + nombre : ""}, has pedido recuperar tu contraseña.</p>
    <p style="font-size:15px;margin:0 0 24px">Pulsa el botón para elegir una nueva. El enlace caduca en ${RESET_MIN} minutos y solo se puede usar una vez.</p>
    <a href="${enlace}" style="display:inline-block;background:#FFB020;color:#141414;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px">Elegir nueva contraseña</a>
    <p style="color:#8FA096;font-size:12px;margin:24px 0 0">Si no has sido tú, ignora este correo: tu contraseña actual sigue siendo válida.</p>
  </div>
</div>`;

export default async (req: Request) => {
  const token = TOKEN();
  if (!token) return j({ error: "AIRTABLE_TOKEN no configurado en Netlify" }, 500);

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const res = (url.searchParams.get("res") || "usuarios").toLowerCase();
  const H = { Authorization: `Bearer ${token}`, "content-type": "application/json" };

  /* --- puerta de entrada --- */
  const cuerpo = req.method === "POST" ? await req.clone().json().catch(() => ({})) : {};
  const accion = String((cuerpo as any)?.action || "");
  /* forgotPassword y resetPassword van abiertas por necesidad: quien no
     recuerda su contraseña no puede tener sesión. Su seguridad no está en
     esta puerta sino en el enlace firmado que se manda al correo. */
  const abierto =
    (req.method === "POST" && ["login", "register", "forgotPassword", "resetPassword", "demoToken"].includes(accion)) ||
    (req.method === "GET" && (res === "clubes" || res === "equipos")) ||
    /* La ficha para el rival se abre sin cuenta: el delegado del otro equipo no
       tiene por qué registrarse en COACHBASE para ver a quién se enfrenta. Lo
       que la protege es el código del enlace, y lo que hay detrás es lo mismo
       que se entrega en el acta: dorsal, nombre y posición. */
    (req.method === "GET" && res === "ficha");
  const sesion = await leerSesion(req);
  if (!abierto && !sesion) {
    return j({ error: "no_autorizado", reason: "Sesión no válida o caducada. Vuelve a iniciar sesión." }, 401);
  }
  /* La sesión ya se firmó con el rol real (ver rolReal), así que aquí basta
     con mirarlo; no se vuelve a consultar Airtable en cada petición. */
  const esMaster = rolKey(sesion?.rol) === "master";
  /* Crear, editar y borrar equipos era exclusivo del Master, y con esa puerta
     cerrada aquí arriba no llegaba a ejecutarse NADA de lo de más abajo: ni el
     director podía nombrar al encargado de material de una categoría de su
     club, ni el cuerpo técnico guardar los días de entreno de su equipo, aunque
     las dos cosas tuvieran su comprobación propia dentro. Ahora el permiso se
     decide en cada rama —PATCH pide puedeEquipo, DELETE pide dirección del
     club, POST pide dirección del club— en vez de con esta única puerta que
     tapaba las tres. */
  const dirigeClub = dirigeElClub(sesion);
  /* Familia y Jugador son de solo lectura, en todo: no hay ni un botón de
     escritura en su pantalla, pero esto es lo que de verdad lo garantiza, no
     la interfaz. Una sola comprobación aquí arriba, antes de que la petición
     llegue a ningún recurso concreto, en vez de acordarse de excluir a estos
     dos roles en cada PATCH/POST/DELETE que se escriba de aquí en adelante. */
  if (["familia", "jugador"].includes(rolKey(sesion?.rol)) && req.method !== "GET") {
    return j({ error: "no_autorizado", reason: "Esta cuenta es de solo lectura." }, 403);
  }
  if (res === "equipos" && ["POST", "DELETE"].includes(req.method) && !dirigeClub) {
    return j({ error: "no_autorizado", reason: "Solo la dirección del club puede crear o eliminar categorías." }, 403);
  }
  /* borrar usuarios queda reservado al Master */
  if (req.method === "DELETE" && res === "usuarios" && !esMaster) {
    return j({ error: "no_autorizado", reason: "Solo el Master puede eliminar usuarios." }, 403);
  }
  const table = (t: string) => `https://api.airtable.com/v0/${BASE()}/${t}`;
  /* Airtable devuelve los campos indexados por NOMBRE salvo que se pida
     returnFieldsByFieldId. Todo este archivo los indexa por ID (U.email,
     CL.nombre…), así que sin este parámetro cada r.fields[...] valía undefined:
     las escrituras funcionaban y las lecturas no. Ese era el motivo de que el
     registro apareciera en Airtable pero el login no encontrara nunca al
     usuario, y de que cada alta creara un club duplicado en vez de reutilizarlo.
     Se pagina además con offset: Airtable devuelve 100 registros como mucho. */
  /* Los recursos genéricos (jugadores, partidos, convocatorias, entrenamientos)
     los consume el frontend por NOMBRE de campo (r.Nombre, r.Dorsal, r.Estado…),
     no por ID. La v44 puso returnFieldsByFieldId=true en list() para arreglar el
     login, y de paso rompió esto: el filtro por Equipo dejaba de encontrar nada
     y los campos llegaban con clave fldXXX. Esta variante devuelve nombres, que
     es el contrato que el frontend ya tenía. */
  const listByName = async (t: string) => {
    const out: any[] = [];
    let offset = "";
    for (let i = 0; i < 20; i++) {
      const u = `${table(t)}?pageSize=100${offset ? `&offset=${encodeURIComponent(offset)}` : ""}`;
      const r = await fetch(u, { headers: H });
      const d = await r.json();
      out.push(...((d.records || []) as any[]));
      offset = d.offset || "";
      if (!offset) break;
    }
    return out;
  };

  const list = async (t: string) => {
    const out: any[] = [];
    let offset = "";
    for (let i = 0; i < 20; i++) {
      const u = `${table(t)}?pageSize=100&returnFieldsByFieldId=true${offset ? `&offset=${encodeURIComponent(offset)}` : ""}`;
      const r = await fetch(u, { headers: H });
      const d = await r.json();
      out.push(...((d.records || []) as any[]));
      offset = d.offset || "";
      if (!offset) break;
    }
    return out;
  };
  const create = async (t: string, fields: Record<string, unknown>) => {
    const r = await fetch(table(t), { method: "POST", headers: H, body: JSON.stringify({ fields, typecast: true }) });
    return await r.json().catch(() => ({}));
  };
  const teamOut = (r: any, clubs: any[] = []) => {
    const cat = CAT_KEY(r.fields[EQ.categoria] || "Infantil");
    const clubRec = (r.fields[EQ.club] || [])[0];
    const club = clubs.find((c) => c.id === clubRec);
    return {
      rec: r.id, id: r.id, name: r.fields[EQ.nombre] || "", cat, f7: (r.fields[EQ.formato] || "") === "Fútbol 7",
      half: CAT_HALF[cat] || 35, sub: `${CAT_SUB[cat]} · ${r.fields[EQ.formato] || "Fútbol 11"} · ${CAT_HALF[cat] || 35}′ por parte`,
      crest: (r.fields[EQ.escudo] || [])[0]?.url || null,
      web: r.fields[EQ.web] || "", maps: r.fields[EQ.maps] || "",
      encargado: r.fields[EQ.encargado] || "",
      dias: r.fields[EQ.dias] || "",
      clubRec: clubRec || null, club: club ? club.fields[CL.nombre] : "",
      comunidad: club ? club.fields[CL.comunidad] : "",
    };
  };

  /* ================= ALCANCE POR EQUIPO =================
     Todo dato de un equipo -jugadores, partidos, convocatorias,
     entrenamientos, incidencias, normativa, firmas, galería, el propio
     listado de usuarios- tiene que quedar dentro de quien puede verlo: el
     equipo propio, el club entero si eres director o master, o nada si no
     eres ninguno de los dos.
     Antes esto NO se comprobaba en casi ningún sitio: cualquier sesión con un
     token válido -incluido el pase de la demo- podía leer o escribir los
     datos de CUALQUIER equipo con solo mandar su id en la URL. Este bloque es
     el único sitio donde se decide el alcance, para no repetir (y
     desincronizar) el mismo criterio en cada recurso. */
  let _equiposCache: any[] | null = null;
  const equiposTodos = async () => {
    if (!_equiposCache) _equiposCache = await list(T_EQUIPOS);
    return _equiposCache;
  };
  const clubDeEquipo = async (teamId: string): Promise<string | null> => {
    if (!teamId) return null;
    const eq = (await equiposTodos()).find((e) => e.id === teamId);
    return eq ? ((eq.fields[EQ.club] || [])[0] || null) : null;
  };
  /* El club de la propia sesión no viaja en el token (se firmó antes de que
     hiciera falta), así que se resuelve aquí, una vez.
     Se sacaba SOLO del equipo propio, y eso dejaba fuera justo a la cuenta que
     más lo necesita: la del club, que no tiene ninguna categoría asignada
     —porque no entrena a ninguna—. Con el equipo vacío, miClub() devolvía null,
     puedeClub() decía que no a su propio club y ?res=partes-club le respondía
     403: el club no podía ver ni sus categorías ni el control de material de su
     propio club. Si no hay equipo, se mira el club de su ficha. */
  let _miClubCache: string | null | undefined;
  const miClub = async (): Promise<string | null> => {
    if (_miClubCache !== undefined) return _miClubCache;
    if (sesion?.equipo) {
      _miClubCache = await clubDeEquipo(String(sesion.equipo));
      if (_miClubCache) return _miClubCache;
    }
    if (sesion?.id) {
      /* list() —y no el allUsers() de más abajo, que vive en otro bloque—:
         devuelve los campos por ID, que es como se leen aquí. */
      const yo = (await list(T_USUARIOS)).find((r: any) => r.id === sesion.id);
      _miClubCache = ((yo?.fields[U.club] || [])[0] as string) || null;
    } else {
      _miClubCache = null;
    }
    return _miClubCache;
  };
  const puedeEquipo = async (teamId: string): Promise<boolean> => {
    if (!teamId) return false;
    if (esMaster) return true;
    if (sesion?.equipo && String(sesion.equipo) === teamId) return true;
    /* La cuenta del club alcanza a todas sus categorías, igual que el
       director: es el nivel de arriba del club, no de una categoría. */
    if (["director", "club"].includes(rolKey(sesion?.rol))) {
      const [clubDelEquipo, clubPropio] = await Promise.all([clubDeEquipo(teamId), miClub()]);
      return !!clubDelEquipo && !!clubPropio && clubDelEquipo === clubPropio;
    }
    return false;
  };
  /* Un solo registro por id, con los campos por NOMBRE (igual que
     listByName): hace falta para saber a qué equipo pertenece YA una fila
     antes de dejar editarla o borrarla. */
  const unoPorId = async (t: string, recId: string): Promise<any | null> => {
    if (!recId) return null;
    const r = await fetch(`${table(t)}/${recId}`, { headers: H });
    if (!r.ok) return null;
    return await r.json().catch(() => null);
  };
  /* A qué equipo pertenece un jugador. Sirve para las tablas que no enlazan
     el equipo directamente (Firmas, Galería) y para las incidencias
     anteriores a que este proxy supiera guardar el enlace directo. */
  const equipoDeJugador = async (jugId: string): Promise<string | null> => {
    if (!jugId) return null;
    const jg = await unoPorId(T_JUGADORES, jugId);
    return jg ? ((jg.fields?.Equipo || [])[0] || null) : null;
  };
  /* Igual que puedeEquipo, pero para acciones que se piden por CLUB
     directamente (editar su ficha), no por equipo. */
  const puedeClub = async (clubId: string): Promise<boolean> => {
    if (!clubId) return false;
    if (esMaster) return true;
    return (await miClub()) === clubId;
  };

  try {
    /* ================= EQUIPOS (gestión del Master) ================= */
    if (res === "equipos") {
      if (req.method === "GET") {
        const [eqs, clubs] = await Promise.all([list(T_EQUIPOS), list(T_CLUBES)]);
        return j({ records: eqs.map((r) => teamOut(r, clubs)) });
      }
      if (req.method === "PATCH" && id) {
        /* Antes no había ninguna comprobación aquí: bastaba con mandar el id de
           cualquier equipo, propio o ajeno, para cambiarle el nombre, la
           categoría o el sistema. Ahora hace falta el mismo alcance que para
           el resto de datos de un equipo. */
        if (!(await puedeEquipo(id))) {
          return j({ error: "no_autorizado", reason: "No puedes editar un equipo que no es el tuyo." }, 403);
        }
        const b = await req.json();
        const f: Record<string, unknown> = {};
        /* Nombrar al encargado de material es cosa de la dirección del club, no
           de cada entrenador: si no, cualquiera podría quitarse el encargo. */
        if (b.encargado !== undefined) {
          if (!dirigeElClub(sesion)) {
            return j({ error: "no_autorizado", reason: "Solo la dirección del club nombra al encargado de material." }, 403);
          }
          f[EQ.encargado] = String(b.encargado || "");
        }
        if (b.name) f[EQ.nombre] = b.name;
        if (b.cat) f[EQ.categoria] = CAT_LABEL[b.cat] || b.cat;
        if (typeof b.f7 === "boolean") f[EQ.formato] = b.f7 ? "Fútbol 7" : "Fútbol 11";
        if (b.sistema) f[EQ.sistema] = b.sistema;
        if (b.web !== undefined) f[EQ.web] = b.web;
        if (b.maps !== undefined) f[EQ.maps] = b.maps;
        /* Días de entreno. Se normalizan aquí y no se guarda lo que llegue: es
           lo que decide si el club ve un aviso por parte que falta, así que un
           valor con basura dentro se traduciría en avisos falsos. */
        if (b.dias !== undefined) {
          const ds = Array.isArray(b.dias) ? b.dias : [];
          const limpios = [...new Set(ds.map((n: any) => Number(n)).filter((n: number) => Number.isInteger(n) && n >= 0 && n <= 6))].sort();
          f[EQ.dias] = JSON.stringify(limpios);
        }
        const r = await fetch(`${table(T_EQUIPOS)}/${id}`, { method: "PATCH", headers: H, body: JSON.stringify({ fields: f, typecast: true }) });
        return j({ ok: r.ok }, r.ok ? 200 : 400);
      }
      if (req.method === "POST") {
        const b = await req.json();
        const clubs = await list(T_CLUBES);
        let clubId = b.clubRec;
        if (!clubId && b.club) {
          const hit = clubs.find((c) => norm(c.fields[CL.nombre]) === norm(b.club));
          /* Crear un CLUB sigue siendo solo del Master: un club es el nivel de
             arriba y darlo de alta es una decisión de EBLDigital, no de un
             director. Al abrir este POST a la dirección del club se coló, de
             rebote, la posibilidad de fundar clubes desde aquí. */
          clubId = hit ? hit.id
            : (esMaster ? (await create(T_CLUBES, { [CL.nombre]: b.club, [CL.comunidad]: b.comunidad || "" }))?.id : null);
        }
        /* Y una categoría solo se crea DENTRO del club propio. Sin esto, un
           director podía colgar categorías del club de al lado con solo mandar
           su clubRec: la comprobación de arriba solo miraba el rol, no de qué
           club. */
        if (!esMaster) {
          const mio = await miClub();
          if (!mio) return j({ ok: false, reason: "sin_club" }, 400);
          if (clubId && clubId !== mio) return j({ ok: false, reason: "no_autorizado" }, 403);
          clubId = mio;
        }
        const d = await create(T_EQUIPOS, {
          [EQ.nombre]: b.name, [EQ.categoria]: CAT_LABEL[b.cat] || "Infantil",
          [EQ.formato]: b.f7 ? "Fútbol 7" : "Fútbol 11", ...(clubId ? { [EQ.club]: [clubId] } : {}),
          ...(b.web ? { [EQ.web]: b.web } : {}), ...(b.maps ? { [EQ.maps]: b.maps } : {}),
        });
        return j({ ok: !!d?.id, rec: d?.id }, d?.id ? 200 : 400);
      }

      /* ---- Eliminar una categoría del club ----
         Un club retira el Sénior y quiere que deje de estar. Borrar solo la
         fila del equipo dejaría en la base los jugadores, los partidos, las
         convocatorias, los partes y las incidencias apuntando a un equipo que
         ya no existe: invisibles en la app y ahí para siempre. Así que se
         borra también lo que cuelga de él.

         Por eso va en dos pasos. Sin `confirmar` NO borra nada: cuenta lo que
         se llevaría por delante y lo devuelve, para que quien lo pide lo vea
         escrito antes de decidir. Con `confirmar` (y el nombre exacto de la
         categoría) borra.

         El cuerpo técnico NO se borra: son personas con cuenta propia. Se les
         quita el enlace a esta categoría y el club los reasigna. */
      if (req.method === "DELETE" && id) {
        if (!(await puedeEquipo(id))) {
          return j({ ok: false, reason: "No puedes eliminar una categoría que no es de tu club." }, 403);
        }
        /* Por id de campo y no por nombre: unoPorId devuelve los campos por
           NOMBRE y este bloque los leía por ID (EQ.nombre, EQ.club), así que
           el nombre salía vacío, la comprobación de "escribe el nombre exacto"
           no cuadraba nunca y el borrado no llegaba a hacerse jamás. Se lee de
           la misma lista que hace falta para contar las categorías hermanas. */
        const todosEquipos = await list(T_EQUIPOS);
        const eq = todosEquipos.find((e: any) => e.id === id);
        if (!eq) return j({ ok: false, reason: "no_existe" }, 404);
        const nombreEq = String(eq.fields?.[EQ.nombre] || "");
        const clubDelEq = (eq.fields?.[EQ.club] || [])[0] || null;

        /* Un club sin ninguna categoría no es un club: se queda sin plantilla,
           sin calendario y sin sitio al que volver a entrar. */
        if (clubDelEq) {
          const hermanas = todosEquipos.filter((e: any) => (e.fields[EQ.club] || []).includes(clubDelEq));
          if (hermanas.length <= 1) {
            return j({ ok: false, reason: "ultima_categoria" }, 409);
          }
        }
        /* Borrar la categoría en la que estás trabajando dejaría la sesión
           apuntando a algo que ya no existe. */
        if (sesion?.equipo && String(sesion.equipo) === id) {
          return j({ ok: false, reason: "categoria_actual" }, 409);
        }

        /* Las tablas "genéricas" se leen por NOMBRE de columna, igual que en el
           resto del archivo (r.fields.Equipo); las demás por id de campo, que
           es como están mapeadas aquí arriba. Mezclar los dos criterios fue el
           motivo de que en su día las lecturas devolvieran undefined, así que
           cada tabla se lee como se lee en su propio sitio. */
        const [jugadores, partidos, convocatorias, entrenamientos, partes,
               incidencias, normativa, propuestas, usuarios, firmas, galeria] =
          await Promise.all([
            listByName(T_JUGADORES), listByName(T_PARTIDOS), listByName(T_CONVOCATORIAS),
            listByName(T_ENTRENAMIENTOS), listByName(T_PARTES),
            list(T_INCIDENCIAS), list(T_NORMATIVA), list(T_PROPUESTAS), list(T_USUARIOS),
            list(T_FIRMAS), list(T_GALERIA),
          ]);
        const porNombre = (rows: any[]) => rows.filter((r: any) => (r.fields?.Equipo || []).includes(id));
        const porId = (rows: any[], campo: string) => rows.filter((r: any) => (r.fields[campo] || []).includes(id));
        const misJugadores = porNombre(jugadores);
        const idsJug = new Set(misJugadores.map((r: any) => r.id));
        const deJugador = (rows: any[], campo: string) =>
          rows.filter((r: any) => (r.fields[campo] || []).some((x: string) => idsJug.has(x)));
        const misFirmas = deJugador(firmas, "fldVmYVSgZoa9A8I3");
        const miGaleria = deJugador(galeria, "fldcNQ8FQFYAv4NTk");
        /* Las incidencias anteriores a que este proxy guardara el enlace
           directo al equipo solo lo tienen a través del jugador. */
        const misIncidencias = incidencias.filter((r: any) =>
          (r.fields[I.equipo] || []).includes(id) || (r.fields[I.jugador] || []).some((x: string) => idsJug.has(x)));
        const misUsuarios = usuarios.filter((r: any) => (r.fields[U.equipo] || []).includes(id));
        const misPartidos = porNombre(partidos);
        const misConvocatorias = porNombre(convocatorias);
        const misEntrenamientos = porNombre(entrenamientos);
        const misPartes = porNombre(partes);
        const miNormativa = porId(normativa, "fldOGmAE882lecjEE");
        const misPropuestas = porId(propuestas, PR.equipo);
        const lotes: Array<[string, any[]]> = [
          [T_FIRMAS, misFirmas],
          [T_GALERIA, miGaleria],
          [T_INCIDENCIAS, misIncidencias],
          [T_JUGADORES, misJugadores],
          [T_PARTIDOS, misPartidos],
          [T_CONVOCATORIAS, misConvocatorias],
          [T_ENTRENAMIENTOS, misEntrenamientos],
          [T_PARTES, misPartes],
          [T_NORMATIVA, miNormativa],
          [T_PROPUESTAS, misPropuestas],
        ];
        const resumen = {
          nombre: nombreEq,
          jugadores: misJugadores.length,
          partidos: misPartidos.length,
          convocatorias: misConvocatorias.length,
          entrenamientos: misEntrenamientos.length,
          partes: misPartes.length,
          incidencias: misIncidencias.length,
          normativa: miNormativa.length,
          propuestas: misPropuestas.length,
          firmas: misFirmas.length,
          galeria: miGaleria.length,
          usuarios: misUsuarios.length,
        };
        /* En la URL y no en el cuerpo: un DELETE con cuerpo lo admite el
           estándar, pero hay proxies que lo descartan por el camino. */
        if (url.searchParams.get("confirmar") !== "1") return j({ ok: false, revision: true, resumen });
        /* El nombre exacto, escrito a mano. Es la única barrera entre "quería
           mirar qué pasaba si le doy" y perder una temporada entera. */
        if (norm(url.searchParams.get("nombre") || "") !== norm(nombreEq)) {
          return j({ ok: false, reason: "nombre_no_coincide", resumen }, 400);
        }

        /* Airtable borra de diez en diez. Se va de dentro afuera: primero lo
           que cuelga del jugador, luego el jugador, y el equipo el último; si
           algo falla a media faena, lo que queda sigue teniendo a quién
           apuntar en vez de quedarse suelto. */
        const borrarLote = async (t: string, recs: any[]) => {
          for (let i = 0; i < recs.length; i += 10) {
            const trozo = recs.slice(i, i + 10);
            const qs = trozo.map((r: any) => `records[]=${encodeURIComponent(r.id)}`).join("&");
            await fetch(`${table(t)}?${qs}`, { method: "DELETE", headers: H });
          }
        };
        for (const [t, recs] of lotes) if (recs.length) await borrarLote(t, recs);
        /* El cuerpo técnico se queda: solo se le suelta el enlace. */
        for (let i = 0; i < misUsuarios.length; i += 10) {
          const trozo = misUsuarios.slice(i, i + 10);
          await fetch(table(T_USUARIOS), {
            method: "PATCH", headers: H,
            body: JSON.stringify({ records: trozo.map((r: any) => ({ id: r.id, fields: { [U.equipo]: [] } })), typecast: true }),
          });
        }
        const rDel = await fetch(`${table(T_EQUIPOS)}/${id}`, { method: "DELETE", headers: H });
        return j({ ok: rDel.ok, resumen }, rDel.ok ? 200 : 400);
      }
      return j({ error: "Petición no soportada" }, 400);
    }

    /* ================= ESCUDO (adjunto del equipo) ================= */
    /* ============ PLANTILLAS DE ENTRENAMIENTO ============
       GET    ?res=plantillas&team=recX[&club=recY]  -> las del equipo + las
              compartidas de su club, ordenadas por más usadas
       POST   ?res=plantillas   { nombre, objetivo, duracion, bloques, teamRec, clubRec, compartida }
       PATCH  ?res=plantillas&id=recZ&usar=1  -> suma 1 a Usos (al cargarla)
       PATCH  ?res=plantillas&id=recZ         { compartida } -> cambia el compartir
       DELETE ?res=plantillas&id=recZ */
    /* ================= PLANIFICACIÓN DE TEMPORADA =================
       Un documento JSON por equipo. Lo lee todo el cuerpo técnico del equipo
       y lo escribe quien puede planificar. Va aparte de ?res=equipos porque
       ese está reservado al Master: un entrenador tiene que poder guardar la
       planificación de SU equipo sin poder tocar el resto de la ficha. */
    /* ============ JUGADAS COMPARTIDAS DE LA PIZARRA ============
       GET  ?res=jugadas&team=recX -> el JSON guardado
       POST ?res=jugadas&team=recX { jugadas }
       Mismas reglas que el plan de temporada: lo lee todo el equipo y lo
       escribe el propio equipo (o Master/director). */
    if (res === "jugadas") {
      const team = url.searchParams.get("team") || "";
      if (!team) return j({ error: "falta_equipo" }, 400);
      if (req.method === "GET") {
        const r = await fetch(`${table(T_EQUIPOS)}/${team}?returnFieldsByFieldId=true`, { headers: H });
        if (!r.ok) return j({ error: "no_encontrado" }, 404);
        const d = await r.json().catch(() => ({}));
        return j({ jugadas: d?.fields?.[EQ.jugadas] || "" });
      }
      if (req.method === "POST") {
        const suyo = String(sesion?.equipo || "") === team;
        const puede = suyo || dirigeElClub(sesion);
        if (!puede) return j({ ok: false, reason: "no_autorizado" }, 403);
        const b = await req.json();
        const r = await fetch(`${table(T_EQUIPOS)}/${team}`, {
          method: "PATCH", headers: H,
          body: JSON.stringify({ fields: { [EQ.jugadas]: String(b.jugadas || "") }, typecast: true }),
        });
        if (!r.ok) {
          const err = await r.text().catch(() => "");
          console.error(`[jugadas] Airtable ${r.status}: ${err.slice(0, 300)}`);
          return j({ ok: false, reason: "airtable" }, 400);
        }
        return j({ ok: true });
      }
      return j({ error: "Petición no soportada" }, 400);
    }

    if (res === "plan") {
      const team = url.searchParams.get("team") || "";
      if (!team) return j({ error: "falta_equipo" }, 400);
      if (req.method === "GET") {
        const r = await fetch(`${table(T_EQUIPOS)}/${team}?returnFieldsByFieldId=true`, { headers: H });
        if (!r.ok) return j({ error: "no_encontrado" }, 404);
        const d = await r.json().catch(() => ({}));
        return j({ plan: d?.fields?.[EQ.plan] || "" });
      }
      if (req.method === "POST") {
        /* Solo el propio equipo: sin esto, cualquiera con sesión podría
           sobrescribir la planificación de otro equipo mandando su id. */
        const suyo = String(sesion?.equipo || "") === team;
        const puede = suyo || dirigeElClub(sesion);
        if (!puede) return j({ ok: false, reason: "no_autorizado" }, 403);
        const b = await req.json();
        const r = await fetch(`${table(T_EQUIPOS)}/${team}`, {
          method: "PATCH", headers: H,
          body: JSON.stringify({ fields: { [EQ.plan]: String(b.plan || "") }, typecast: true }),
        });
        if (!r.ok) {
          const err = await r.text().catch(() => "");
          console.error(`[plan] Airtable ${r.status}: ${err.slice(0, 300)}`);
          return j({ ok: false, reason: "airtable" }, 400);
        }
        return j({ ok: true });
      }
      return j({ error: "Petición no soportada" }, 400);
    }

    /* ============ CARGAS FÍSICAS DE PRETEMPORADA ============
       GET  ?res=cargas&team=recX -> el JSON guardado
       POST ?res=cargas&team=recX { cargas }
       Mismas reglas que el plan de temporada y las jugadas: un documento por
       equipo, lo lee el cuerpo técnico y lo escribe el propio equipo. Aquí
       "el propio equipo" incluye al delegado a propósito: en el plan físico
       es quien pasa el semáforo diario y avisa de amarillos y rojos antes de
       empezar, así que si no pudiera escribir, el control no existiría. */
    if (res === "cargas") {
      const team = url.searchParams.get("team") || "";
      if (!team) return j({ error: "falta_equipo" }, 400);
      if (req.method === "GET") {
        const r = await fetch(`${table(T_EQUIPOS)}/${team}?returnFieldsByFieldId=true`, { headers: H });
        if (!r.ok) return j({ error: "no_encontrado" }, 404);
        const d = await r.json().catch(() => ({}));
        return j({ cargas: d?.fields?.[EQ.cargas] || "" });
      }
      if (req.method === "POST") {
        const suyo = String(sesion?.equipo || "") === team;
        const puede = suyo || dirigeElClub(sesion);
        if (!puede) return j({ ok: false, reason: "no_autorizado" }, 403);
        const b = await req.json();
        const r = await fetch(`${table(T_EQUIPOS)}/${team}`, {
          method: "PATCH", headers: H,
          body: JSON.stringify({ fields: { [EQ.cargas]: String(b.cargas || "") }, typecast: true }),
        });
        if (!r.ok) {
          const err = await r.text().catch(() => "");
          console.error(`[cargas] Airtable ${r.status}: ${err.slice(0, 300)}`);
          return j({ ok: false, reason: "airtable" }, 400);
        }
        return j({ ok: true });
      }
      return j({ error: "Petición no soportada" }, 400);
    }

    /* ============ ASISTENCIA DIARIA ============
       GET  ?res=asistencia&team=recX -> el JSON guardado
       POST ?res=asistencia&team=recX { asistencia }
       Mismas reglas que las cargas físicas: un documento por equipo, lo lee
       el cuerpo técnico y lo escribe quien pasa lista (el propio equipo,
       delegado incluido). Antes esto solo vivía en el móvil de quien
       marcaba: ahora es la nube quien manda, para que el resto del cuerpo
       técnico -y la ficha del jugador que ve su familia- vean la misma
       asistencia sin importar el dispositivo. */
    if (res === "asistencia") {
      const team = url.searchParams.get("team") || "";
      if (!team) return j({ error: "falta_equipo" }, 400);
      if (req.method === "GET") {
        const r = await fetch(`${table(T_EQUIPOS)}/${team}?returnFieldsByFieldId=true`, { headers: H });
        if (!r.ok) return j({ error: "no_encontrado" }, 404);
        const d = await r.json().catch(() => ({}));
        return j({ asistencia: d?.fields?.[EQ.asistencia] || "" });
      }
      if (req.method === "POST") {
        const suyo = String(sesion?.equipo || "") === team;
        const puede = suyo || dirigeElClub(sesion);
        if (!puede) return j({ ok: false, reason: "no_autorizado" }, 403);
        const b = await req.json();
        const r = await fetch(`${table(T_EQUIPOS)}/${team}`, {
          method: "PATCH", headers: H,
          body: JSON.stringify({ fields: { [EQ.asistencia]: String(b.asistencia || "") }, typecast: true }),
        });
        if (!r.ok) {
          const err = await r.text().catch(() => "");
          console.error(`[asistencia] Airtable ${r.status}: ${err.slice(0, 300)}`);
          return j({ ok: false, reason: "airtable" }, 400);
        }
        return j({ ok: true });
      }
      return j({ error: "Petición no soportada" }, 400);
    }

    /* ============ PARTES DEL CLUB (vista agregada) ============
       GET ?res=partes-club&club=recX -> los partes de todas las categorías del
       club, ya con el nombre de la categoría puesto. Existe aparte del recurso
       genérico porque ese exige un equipo y aquí hace falta justo lo contrario:
       cruzar todas las categorías para poder comparar entrenadores. Lo lee
       quien dirige el club, no cada entrenador. */
    /* ================= FICHA PARA EL EQUIPO RIVAL =================
       Lo único que sale de la app hacia fuera. Cuando hay partido, el otro
       equipo puede ver a quién se enfrenta: la convocatoria y la alineación
       de ESE partido, y nada más. Es lo mismo que se entrega en el acta.

       GET    ?res=ficha&t=<código>        -> pública, sin cuenta
       POST   ?res=ficha&id=<recPartido>   -> publica (o actualiza) la ficha
       DELETE ?res=ficha&id=<recPartido>   -> retira el enlace

       La ficha se guarda congelada en el propio partido, no se calcula al
       vuelo: compartir es un acto puntual y no una ventana abierta a la app.
       Si el rival viera los cambios en vivo, cada retoque de la alineación del
       sábado se le estaría enseñando según se hace. */
    if (res === "ficha") {
      if (req.method === "GET") {
        const tk = (url.searchParams.get("t") || "").trim();
        /* Un token corto o vacío abriría la ficha de cualquiera a base de
           probar: se exige la longitud con la que se generan. */
        if (tk.length < 24) return j({ error: "no_existe" }, 404);
        const partidos = await list(T_PARTIDOS);
        const hit = partidos.find((r: any) => String(r.fields[PARTIDO_TOKEN] || "") === tk);
        if (!hit) return j({ error: "no_existe" }, 404);
        const crudo = String(hit.fields[PARTIDO_FICHA] || "");
        if (!crudo) return j({ error: "no_existe" }, 404);
        try { return j({ ok: true, ficha: JSON.parse(crudo) }); }
        catch { return j({ error: "no_existe" }, 404); }
      }
      if (!id) return j({ error: "falta_id" }, 400);
      const partido = await unoPorId(T_PARTIDOS, id);
      if (!partido) return j({ ok: false, reason: "no_existe" }, 404);
      const equipoDelPartido = (partido.fields?.Equipo || [])[0] || "";
      if (!(await puedeEquipo(equipoDelPartido))) {
        return j({ ok: false, reason: "no_autorizado" }, 403);
      }
      if (req.method === "DELETE") {
        const r = await fetch(`${table(T_PARTIDOS)}/${id}`, {
          method: "PATCH", headers: H,
          body: JSON.stringify({ fields: { [PARTIDO_FICHA]: "", [PARTIDO_TOKEN]: "" }, typecast: true }),
        });
        return j({ ok: r.ok }, r.ok ? 200 : 400);
      }
      if (req.method === "POST") {
        const b = await req.json().catch(() => ({}));
        /* Se compone aquí y no se acepta lo que mande el navegador tal cual:
           así la lista de lo que sale de la app está escrita en un solo sitio
           y no depende de que el front recuerde no mandar de más. De cada
           jugador salen tres cosas —dorsal, nombre y posición— y ninguna más:
           ni fecha de nacimiento, ni teléfono, ni estado físico, ni foto. */
        const limpioJug = (x: any) => ({
          d: Number(x?.d) || 0,
          n: String(x?.n || "").slice(0, 60),
          p: String(x?.p || "").slice(0, 20),
        });
        const ficha = {
          club: String(b.club || "").slice(0, 80),
          equipo: String(b.equipo || "").slice(0, 80),
          fecha: String(b.fecha || "").slice(0, 10),
          hora: String(b.hora || "").slice(0, 5),
          jornada: String(b.jornada || "").slice(0, 12),
          local: String(b.local || "").slice(0, 80),
          visitante: String(b.visitante || "").slice(0, 80),
          lugar: String(b.lugar || "").slice(0, 120),
          sistema: String(b.sistema || "").slice(0, 12),
          convocados: (Array.isArray(b.convocados) ? b.convocados : []).slice(0, 30).map(limpioJug),
          once: (Array.isArray(b.once) ? b.once : []).slice(0, 11).map((x: any) => ({
            ...limpioJug(x), s: String(x?.s || "").slice(0, 6),
          })),
          publicada: new Date().toISOString(),
        };
        /* El token se conserva si ya existe: volver a publicar la ficha
           —porque cambió la alineación— no debe romper el enlace que el rival
           ya tiene guardado. */
        const tokenPrevio = String(partido.fields?.["Token rival"] || "").trim();
        const token = tokenPrevio || bytesAHex(crypto.getRandomValues(new Uint8Array(16)));
        const r = await fetch(`${table(T_PARTIDOS)}/${id}`, {
          method: "PATCH", headers: H,
          body: JSON.stringify({ fields: { [PARTIDO_FICHA]: JSON.stringify(ficha), [PARTIDO_TOKEN]: token }, typecast: true }),
        });
        return j({ ok: r.ok, token }, r.ok ? 200 : 400);
      }
      return j({ error: "Petición no soportada" }, 400);
    }

    /* ---- Sanciones de un parte, solo para la dirección del club ----
       El entrenador no va a declarar que llegó tarde o que estuvo con el
       teléfono; eso lo anota el club. Va en su propio recurso, y no como un
       campo más del parte, justo para que el rol se compruebe: la única
       manera de escribir estos cuatro campos es pasando por aquí. */
    if (res === "parte-sancion") {
      if (req.method !== "PATCH" || !id) return j({ error: "Petición no soportada" }, 400);
      if (!dirigeElClub(sesion)) {
        return j({ ok: false, reason: "Solo la dirección del club anota sanciones." }, 403);
      }
      const actual = await unoPorId(T_PARTES, id);
      const equipoActual = (actual?.fields?.Equipo || [])[0] || "";
      if (!equipoActual || !(await puedeEquipo(equipoActual))) return j({ ok: false, reason: "no_autorizado" }, 403);
      const b = await req.json();
      const fields: Record<string, unknown> = {};
      if (b.tarde !== undefined) fields[PA.tarde] = !!b.tarde;
      if (b.minutosTarde !== undefined) fields[PA.minutosTarde] = Math.max(0, Math.min(999, Number(b.minutosTarde) || 0));
      if (b.telefono !== undefined) fields[PA.telefono] = !!b.telefono;
      if (b.penalizaciones !== undefined) fields[PA.penalizaciones] = String(b.penalizaciones || "").slice(0, 500);
      if (!Object.keys(fields).length) return j({ ok: false, reason: "nada_que_guardar" }, 400);
      const r = await fetch(`${table(T_PARTES)}/${id}`, { method: "PATCH", headers: H, body: JSON.stringify({ fields, typecast: true }) });
      return j({ ok: r.ok }, r.ok ? 200 : 400);
    }

    /* ================= QUIÉN SOY =================
       GET ?res=yo -> la misma ficha que devuelve el login, para el token que
       traes.

       Hace falta porque la app guarda la sesión entera en el navegador
       (localStorage) y la restauraba tal cual al abrir, sin volver a
       preguntar. Esa foto se queda congelada para siempre: si tu categoría, tu
       rol o tu plan cambian en Airtable —o si un día una versión anterior te
       inventó una categoría—, la app sigue enseñando lo de entonces hasta que
       cierras sesión y vuelves a entrar. De ahí que la cuenta del club
       apareciera "Trabajando con Infantil B" teniendo la casilla de Equipo
       vacía en Airtable. */
    if (res === "yo") {
      if (req.method !== "GET") return j({ error: "Petición no soportada" }, 400);
      if (!sesion?.id) return j({ ok: false, reason: "no_autorizado" }, 401);
      const recs = await list(T_USUARIOS);
      const rec = recs.find((r: any) => r.id === sesion.id);
      if (!rec) return j({ ok: false, reason: "no_existe" }, 404);
      const [eqs, clubs] = await Promise.all([list(T_EQUIPOS), list(T_CLUBES)]);
      const eqRec = (rec.fields[U.equipo] || [])[0];
      const clRec = (rec.fields[U.club] || [])[0];
      const eq = eqs.find((e: any) => e.id === eqRec);
      const cl = clubs.find((c: any) => c.id === clRec);
      const rolDeSesion = rolReal(rec.fields[U.rol], rec.fields[U.email]);
      const rolesExtraDeSesion = rolesExtraKeys(rec.fields[U.rolesExtra]);
      return j({
        ok: true,
        /* Token nuevo: si te han movido de categoría, el que traías apunta a la
           anterior y el alcance por equipo seguiría siendo el de antes. */
        token: await firmarSesion({ id: rec.id, email: norm(rec.fields[U.email]), rol: rolDeSesion, equipo: eqRec || null, rolesExtra: rolesExtraDeSesion }),
        user: {
          id: rec.id, name: rec.fields[U.nombre] || "", email: rec.fields[U.email] || "",
          rol: ROL_LABEL[rolDeSesion] || rec.fields[U.rol] || "", estado: rec.fields[U.estado] || "",
          rolesExtra: rolesExtraDeSesion,
          parteMat: !!rec.fields[U.parteMat],
          plan: rec.fields[U.plan] || "Oficial",
          prueba: pruebaDias(rec.fields[U.prueba]),
          club: cl ? cl.fields[CL.nombre] : "", comunidad: cl ? cl.fields[CL.comunidad] : "",
          clubRec: clRec || null,
          crest: cl ? (cl.fields[CL.escudo]?.[0]?.url || null) : null,
          team: eq ? teamOut(eq, clubs) : null,
        },
      });
    }

    /* ================= FAMILIA / JUGADOR: UNA SOLA FICHA =================
       Un solo jugador, el que se enlazó al registrarse (Familia) o el que se
       vinculó desde el club (Jugador) -no la plantilla entera del equipo,
       que dejaría ver a un padre o a un compañero los datos médicos de los
       demás-. Por eso no reutiliza ?res=jugadores: ese responde con el
       equipo completo y aquí solo puede salir uno. Mientras la cuenta siga
       Pendiente -el nombre y el dorsal que se tecleó al registrarse no
       prueban que sea de verdad el padre o la madre; y para Jugador, hasta
       que reclama la cuenta con su contraseña- no se da ningún dato, solo
       que está pendiente. */
    if (res === "hijo") {
      if (req.method !== "GET") return j({ error: "Petición no soportada" }, 400);
      if (!["familia", "jugador"].includes(rolKey(sesion?.rol))) return j({ ok: false, reason: "no_autorizado" }, 403);
      const recs = await list(T_USUARIOS);
      const yo = recs.find((r: any) => r.id === sesion.id);
      if (!yo) return j({ ok: false, reason: "no_existe" }, 404);
      if (norm(yo.fields[U.estado]) !== "activo") return j({ ok: true, pendiente: true, hijo: null });
      const hijoRec = (yo.fields[U.hijo] || [])[0] || null;
      if (!hijoRec) return j({ ok: true, pendiente: false, hijo: null });
      const jg = await unoPorId(T_JUGADORES, hijoRec);
      if (!jg) return j({ ok: true, pendiente: false, hijo: null });
      /* Asistencia del hijo: el documento de asistencia del equipo se guarda
         por posición en la plantilla (mismo id que usa la app en pantalla),
         no por el id de Airtable, así que hay que recalcular esa posición
         aquí con el mismo orden -sin ordenar- con el que la app arma la
         plantilla, y de ahí sacar solo el dato de este jugador: nunca la
         plantilla ni la asistencia de sus compañeros. */
      let asistencia: { pct: number; dias: number } | null = null;
      const equipoHijo = (jg.fields.Equipo || [])[0] || null;
      if (equipoHijo) {
        const roster = (await listByName(T_JUGADORES)).filter((r: any) => (r.fields?.Equipo || []).includes(equipoHijo));
        const idx = roster.findIndex((r: any) => r.id === hijoRec);
        if (idx >= 0) {
          const pid = String(idx + 1);
          const rEq = await fetch(`${table(T_EQUIPOS)}/${equipoHijo}?returnFieldsByFieldId=true`, { headers: H });
          if (rEq.ok) {
            const dEq = await rEq.json().catch(() => ({}));
            try {
              const todo = JSON.parse(dEq?.fields?.[EQ.asistencia] || "{}") || {};
              const dias = Object.values(todo).filter((d: any) => d && Object.keys(d).length > 0);
              if (dias.length) {
                const presentes = dias.filter((d: any) => d[pid] === "presente").length;
                asistencia = { pct: Math.round((presentes / dias.length) * 100), dias: dias.length };
              }
            } catch { /* json roto en Airtable: se ignora */ }
          }
        }
      }
      return j({ ok: true, pendiente: false, hijo: { rec: hijoRec, ...jg.fields }, asistencia });
    }

    /* ================= PARIENTES DE UN JUGADOR (vista del club) =================
       Quién tiene acceso de solo lectura a la ficha de este jugador -hasta
       2 padres/tutores y el propio jugador-, para que el club sepa qué email
       falta por invitar o si alguno sigue Pendiente de reclamar su cuenta.
       Nunca la contraseña, ni siquiera si está puesta. */
    if (res === "parientes") {
      if (req.method !== "GET") return j({ error: "Petición no soportada" }, 400);
      const jugadorRec = url.searchParams.get("jugador") || "";
      if (!jugadorRec) return j({ error: "falta_jugador" }, 400);
      const teamDelJugador = await equipoDeJugador(jugadorRec);
      if (!teamDelJugador || !(await puedeEquipo(teamDelJugador))) {
        return j({ ok: false, reason: "no_autorizado" }, 403);
      }
      const recs = await list(T_USUARIOS);
      const vinculados = recs
        .filter((r: any) => (r.fields[U.hijo] || []).includes(jugadorRec) && ["familia", "jugador"].includes(rolKey(r.fields[U.rol])))
        .map((r: any) => ({
          rec: r.id, nombre: r.fields[U.nombre] || "", email: r.fields[U.email] || "",
          rol: rolKey(r.fields[U.rol]), estado: r.fields[U.estado] || "",
          reclamada: !!r.fields[U.pass],
        }));
      return j({ ok: true, vinculados });
    }

    if (res === "partes-club") {
      const club = url.searchParams.get("club") || "";
      if (!club) return j({ error: "falta_club" }, 400);
      if (req.method !== "GET") return j({ error: "Petición no soportada" }, 400);
      if (!(await puedeClub(club)) || !dirigeElClub(sesion)) {
        return j({ error: "no_autorizado", reason: "Solo la dirección del club ve el control de material." }, 403);
      }
      const equipos = (await list(T_EQUIPOS)).filter((e: any) => (e.fields[EQ.club] || []).includes(club));
      const nombrePorEq = new Map(equipos.map((e: any) => [e.id, e.fields[EQ.nombre] || "Sin nombre"]));
      const encargadoPorEq = new Map(equipos.map((e: any) => [e.id, e.fields[EQ.encargado] || ""]));
      const recs = await listByName(T_PARTES);
      const out = recs
        .filter((r: any) => (r.fields?.Equipo || []).some((id: string) => nombrePorEq.has(id)))
        .map((r: any) => ({
          rec: r.id,
          ...r.fields,
          equipoRec: (r.fields?.Equipo || [])[0] || "",
          equipoNombre: nombrePorEq.get((r.fields?.Equipo || [])[0]) || "",
          encargado: encargadoPorEq.get((r.fields?.Equipo || [])[0]) || "",
        }));
      /* Las categorías van aparte de los partes: el club tiene que poder ver y
         cambiar el encargado de una categoría aunque todavía no haya mandado
         ningún parte. */
      return j({
        records: out,
        categorias: equipos.map((e: any) => ({
          rec: e.id, nombre: e.fields[EQ.nombre] || "Sin nombre", encargado: e.fields[EQ.encargado] || "",
          dias: e.fields[EQ.dias] || "",
        })),
      });
    }

    /* ============ FOTOS DE UN PARTE ============
       POST ?res=parte-foto&id=<recParte>&campo=salida|entrada con el base64.
       Mismo mecanismo que el escudo: Airtable no acepta un data: URL en un
       adjunto, hay que subirlo por su endpoint de contenido. */
    if (res === "parte-foto") {
      if (req.method !== "POST" || !id) return j({ error: "Falta el id del parte" }, 400);
      const campo = url.searchParams.get("campo") === "entrada" ? PA.fotoEntrada : PA.fotoSalida;
      const actual = await unoPorId(T_PARTES, id);
      /* Por NOMBRE de columna: unoPorId no pide returnFieldsByFieldId, así que
         leerlo por id de campo (PA.equipo) daba SIEMPRE undefined, el equipo
         salía vacío y puedeEquipo("") deniega siempre. Resultado: subir las
         fotos del material devolvía 403 en todos los casos y las dos fotos
         —que son la prueba de todo el módulo— no llegaban nunca a Airtable. */
      const equipoDelParte = (actual?.fields?.Equipo || [])[0] || "";
      if (!(await puedeEquipo(equipoDelParte))) {
        return j({ error: "no_autorizado", reason: "Ese parte no es de tu equipo." }, 403);
      }
      const b = await req.json();
      const r = await fetch(`https://content.airtable.com/v0/${BASE()}/${id}/${campo}/uploadAttachment`, {
        method: "POST", headers: H,
        body: JSON.stringify({ contentType: b.contentType || "image/jpeg", file: b.file, filename: b.filename || "material.jpg" }),
      });
      const d = await r.json().catch(() => ({}));
      return j({ ok: r.ok, url: d?.fields?.[campo]?.[0]?.url || null }, r.ok ? 200 : 400);
    }

    if (res === "plantillas") {
      const team = url.searchParams.get("team") || "";
      const club = url.searchParams.get("club") || "";
      if (req.method === "GET") {
        const recs = await list(T_ENTRENAMIENTOS);
        /* Antes esta lista excluía todo lo que no fuera un guion reutilizable
           (plantilla:true): una sesión concreta guardada con "Guardar sesión
           completa" -o, ahora, aprobada de una propuesta del segundo-
           quedaba escrita en Airtable pero invisible para siempre, en
           cualquier apartado y en cualquier dispositivo que no fuera el que
           la guardó. Ahora se devuelven las dos cosas, marcadas con
           `plantilla`, para que el front pueda separar "guiones para
           reutilizar" de "la sesión de tal día". */
        const out = recs
          .filter((r: any) => {
            const suya = team && (r.fields[EN.equipo] || []).includes(team);
            const delClub = r.fields[EN.compartida] && club && (r.fields[EN.club] || []).includes(club);
            return suya || delClub;
          })
          .map((r: any) => ({
            rec: r.id,
            nombre: r.fields[EN.ref] || "Sin nombre",
            objetivo: r.fields[EN.objetivo] || "",
            duracion: Number(r.fields[EN.duracion]) || 0,
            bloques: r.fields[EN.bloques] || "[]",
            compartida: !!r.fields[EN.compartida],
            usos: Number(r.fields[EN.usos]) || 0,
            propia: !!(team && (r.fields[EN.equipo] || []).includes(team)),
            plantilla: !!r.fields[EN.plantilla],
            fecha: r.fields[EN.fecha] || "",
            hora: r.fields[EN.hora] || "",
          }))
          .sort((a: any, b: any) => {
            if (a.plantilla !== b.plantilla) return a.plantilla ? -1 : 1;
            if (!a.plantilla) return (a.fecha || "9999-99-99").localeCompare(b.fecha || "9999-99-99");
            return b.usos - a.usos || a.nombre.localeCompare(b.nombre);
          });
        return j({ records: out });
      }
      if (req.method === "POST") {
        const b = await req.json();
        if (!b.nombre) return j({ ok: false, reason: "falta_nombre" }, 400);
        /* plantilla:false guarda una SESIÓN concreta (la del día, con su hora)
           en vez de un guion reutilizable. Antes esto estaba fijado a true y
           no había forma de guardar el entrenamiento ya montado.
           La fecha solo se manda a Airtable si viene en formato de fecha real:
           el campo del formulario es libre ("Viernes 31") y un campo date de
           Airtable no lo traga. Cuando no cuadra, la fecha ya va dentro del
           nombre, que es lo que se lee luego en el listado. */
        const esPlantilla = b.plantilla !== false;
        const fechaISO = /^\d{4}-\d{2}-\d{2}$/.test(String(b.fecha || "")) ? String(b.fecha) : "";
        const d = await create(T_ENTRENAMIENTOS, {
          [EN.ref]: b.nombre, [EN.objetivo]: b.objetivo || "",
          [EN.duracion]: Number(b.duracion) || 0,
          [EN.bloques]: typeof b.bloques === "string" ? b.bloques : JSON.stringify(b.bloques || []),
          [EN.plantilla]: esPlantilla, [EN.compartida]: !!b.compartida, [EN.usos]: 0,
          ...(fechaISO ? { [EN.fecha]: fechaISO } : {}),
          ...(b.hora ? { [EN.hora]: String(b.hora) } : {}),
          ...(b.teamRec ? { [EN.equipo]: [b.teamRec] } : {}),
          ...(b.clubRec ? { [EN.club]: [b.clubRec] } : {}),
        });
        return j({ ok: !!d?.id, rec: d?.id }, d?.id ? 200 : 400);
      }
      if (req.method === "PATCH" && id) {
        const fields: Record<string, unknown> = {};
        if (url.searchParams.get("usar") === "1") {
          /* Leer y sumar: Airtable no tiene incremento atómico. Con un solo
             entrenador tocando su plantilla el riesgo de pisarse es nulo. */
          const actual = await fetch(`${table(T_ENTRENAMIENTOS)}/${id}?returnFieldsByFieldId=true`, { headers: H }).then((r) => r.json());
          fields[EN.usos] = (Number(actual?.fields?.[EN.usos]) || 0) + 1;
        } else {
          const b = await req.json().catch(() => ({}));
          if (b.compartida !== undefined) fields[EN.compartida] = !!b.compartida;
          if (b.nombre) fields[EN.ref] = b.nombre;
          if (b.bloques !== undefined) fields[EN.bloques] = typeof b.bloques === "string" ? b.bloques : JSON.stringify(b.bloques);
          if (b.duracion !== undefined) fields[EN.duracion] = Number(b.duracion) || 0;
          if (b.objetivo !== undefined) fields[EN.objetivo] = b.objetivo;
        }
        const r = await fetch(`${table(T_ENTRENAMIENTOS)}/${id}`, {
          method: "PATCH", headers: H, body: JSON.stringify({ fields, typecast: true }),
        });
        return j({ ok: r.ok }, r.ok ? 200 : 400);
      }
      if (req.method === "DELETE" && id) {
        const r = await fetch(`${table(T_ENTRENAMIENTOS)}/${id}`, { method: "DELETE", headers: H });
        return j({ ok: r.ok }, r.ok ? 200 : 400);
      }
      return j({ error: "Petición no soportada" }, 400);
    }

    if (res === "escudo") {
      if (req.method !== "POST" || !id) return j({ error: "Falta el id del equipo o club" }, 400);
      const b = await req.json();
      const esClub = url.searchParams.get("tipo") === "club";
      /* Subir el escudo del club a todos sus equipos de golpe queda reservado
         al Master: es el mismo criterio que crear/editar equipos, y aquí toca
         de un plumazo a todos los equipos del club. */
      if (esClub && !esMaster) {
        return j({ error: "no_autorizado", reason: "Solo el Master puede subir el escudo del club." }, 403);
      }
      /* El escudo de UN equipo (no del club entero) lo puede subir quien
         pertenece a ese equipo, o su director/master. Antes bastaba con
         mandar el id de cualquier equipo -propio o ajeno- para sobrescribir
         su escudo. */
      if (!esClub && !(await puedeEquipo(id))) {
        return j({ error: "no_autorizado", reason: "No puedes cambiar el escudo de un equipo que no es el tuyo." }, 403);
      }
      const campoEscudo = esClub ? CL.escudo : EQ.escudo;
      // b.file = base64 sin cabecera data:, b.contentType = image/png…
      const r = await fetch(`https://content.airtable.com/v0/${BASE()}/${id}/${campoEscudo}/uploadAttachment`, {
        method: "POST", headers: H,
        body: JSON.stringify({ contentType: b.contentType || "image/png", file: b.file, filename: b.filename || "escudo.png" }),
      });
      const d = await r.json().catch(() => ({}));
      const urlOut = d?.fields?.[campoEscudo]?.[0]?.url || null;

      /* Propagar a los equipos del club. Por defecto solo a los que NO tienen
         escudo propio (b.forzarTodos=true lo aplica también a los que ya
         tenían uno, para renovar de golpe el escudo institucional). Se
         reutiliza la URL recién subida: Airtable la vuelve a alojar como
         adjunto propio de cada equipo al hacer PATCH con {url}, así que no
         hace falta volver a mandar el base64 por cada equipo. */
      let equiposActualizados = 0;
      if (esClub && r.ok && urlOut) {
        const equipos = await list(T_EQUIPOS);
        const delClub = equipos.filter((e) => (e.fields[EQ.club] || []).includes(id));
        const objetivo = b.forzarTodos ? delClub : delClub.filter((e) => !(e.fields[EQ.escudo] || []).length);
        for (const eq of objetivo) {
          const rp = await fetch(`${table(T_EQUIPOS)}/${eq.id}`, {
            method: "PATCH", headers: H,
            body: JSON.stringify({ fields: { [EQ.escudo]: [{ url: urlOut, filename: b.filename || "escudo.png" }] }, typecast: true }),
          });
          if (rp.ok) equiposActualizados++;
        }
      }
      return j({ ok: r.ok, url: urlOut, equiposActualizados }, r.ok ? 200 : 400);
    }

    /* ================= CLUBES ================= */
    if (res === "clubes") {
      if (req.method === "PATCH" && id) {
        /* Editar el campo, la dirección o el mapa del club lo puede hacer
           cualquiera de ese club -es información compartida del día a día,
           no una decisión de administración-, pero solo del SUYO. Antes
           bastaba con mandar el id de cualquier club, propio o ajeno, para
           tocar su ficha. */
        if (!(await puedeClub(id))) {
          return j({ error: "no_autorizado", reason: "No puedes editar la ficha de un club que no es el tuyo." }, 403);
        }
        const b = await req.json();
        const f: Record<string, unknown> = {};
        if (b.campo !== undefined) f[CL.campo] = b.campo;
        if (b.direccion !== undefined) f[CL.direccion] = b.direccion;
        if (b.maps !== undefined) f[CL.maps] = b.maps;
        if (b.comunidad !== undefined) f[CL.comunidad] = b.comunidad;
        const r = await fetch(`${table(T_CLUBES)}/${id}`, { method: "PATCH", headers: H, body: JSON.stringify({ fields: f, typecast: true }) });
        return j({ ok: r.ok }, r.ok ? 200 : 400);
      }
      const recs = await list(T_CLUBES);
      return j({
        records: recs.map((r) => ({
          rec: r.id,
          name: r.fields[CL.nombre] || "",
          comunidad: r.fields[CL.comunidad] || "",
          crest: r.fields[CL.escudo]?.[0]?.url || null,
          campo: r.fields[CL.campo] || "",
          direccion: r.fields[CL.direccion] || "",
          maps: r.fields[CL.maps] || "",
        })),
      });
    }

    /* ================= CONFIGURACIÓN GLOBAL (gratis / Premium, menú por rol) ================= */
    if (res === "config") {
      const recs = await list(T_CONFIG);
      const actual = recs.find((r: any) => r.fields[CFG.clave] === CLAVE_CONFIG_GLOBAL) || recs[0] || null;
      if (req.method === "PATCH") {
        if (!esMaster) {
          return j({ error: "no_autorizado", reason: "Solo el Master puede cambiar la configuración de la app." }, 403);
        }
        const b = await req.json();
        if (b.tabsGratis === undefined && b.rolesTabs === undefined) {
          return j({ error: "nada_que_guardar" }, 400);
        }
        const fields: Record<string, unknown> = {};
        let tabsGratisOut: string[] | undefined;
        let rolesTabsOut: Record<string, string[]> | undefined;
        if (b.tabsGratis !== undefined) {
          if (!Array.isArray(b.tabsGratis)) return j({ error: "tabsGratis debe ser un array" }, 400);
          const limpio = Array.from(new Set(
            (b.tabsGratis as unknown[]).filter((k): k is string => typeof k === "string" && TABS_CONFIGURABLES.includes(k))
          ));
          for (const k of TABS_GRATIS_FORZADAS) if (!limpio.includes(k)) limpio.push(k);
          fields[CFG.gratis] = JSON.stringify(limpio);
          tabsGratisOut = limpio;
        }
        if (b.rolesTabs !== undefined) {
          if (typeof b.rolesTabs !== "object" || b.rolesTabs === null || Array.isArray(b.rolesTabs)) {
            return j({ error: "rolesTabs debe ser un objeto" }, 400);
          }
          const limpio: Record<string, string[]> = {};
          for (const rk of ROLES_TABS_EDITABLES) {
            const lista = (b.rolesTabs as any)[rk];
            if (!Array.isArray(lista)) return j({ error: `falta rolesTabs.${rk}` }, 400);
            const filtrada = Array.from(new Set(
              (lista as unknown[]).filter((k): k is string => typeof k === "string" && TABS_ROL_CONFIGURABLES.includes(k))
            ));
            for (const k of TABS_ROL_FORZADAS) if (!filtrada.includes(k)) filtrada.push(k);
            limpio[rk] = filtrada;
          }
          fields[CFG.porRol] = JSON.stringify(limpio);
          rolesTabsOut = limpio;
        }
        if (actual) {
          const r = await fetch(`${table(T_CONFIG)}/${actual.id}`, { method: "PATCH", headers: H, body: JSON.stringify({ fields, typecast: true }) });
          return j({ ok: r.ok, tabsGratis: tabsGratisOut, rolesTabs: rolesTabsOut }, r.ok ? 200 : 400);
        }
        const creado = await create(T_CONFIG, { [CFG.clave]: CLAVE_CONFIG_GLOBAL, ...fields });
        return j({ ok: !!creado.id, tabsGratis: tabsGratisOut, rolesTabs: rolesTabsOut }, creado.id ? 200 : 400);
      }
      /* Lectura: si falta el registro, o su JSON no se puede leer, se devuelve
         null -no un array ni un objeto vacío- para que el frontend sepa
         distinguir "no hay config todavía" de "el Master lo ha dejado todo
         en Premium" o "sin ningún apartado", y en ese caso se quede con sus
         valores por defecto en vez de bloquear la app entera. */
      let tabsGratis: string[] | null = null;
      try {
        const raw = actual ? JSON.parse(String(actual.fields[CFG.gratis] || "")) : null;
        if (Array.isArray(raw)) tabsGratis = raw.filter((k) => typeof k === "string" && TABS_CONFIGURABLES.includes(k));
      } catch { tabsGratis = null; }
      let rolesTabs: Record<string, string[]> | null = null;
      try {
        const raw = actual ? JSON.parse(String(actual.fields[CFG.porRol] || "")) : null;
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
          const limpio: Record<string, string[]> = {};
          for (const rk of ROLES_TABS_EDITABLES) {
            const lista = (raw as any)[rk];
            if (Array.isArray(lista)) limpio[rk] = lista.filter((k) => typeof k === "string" && TABS_ROL_CONFIGURABLES.includes(k));
          }
          if (Object.keys(limpio).length === ROLES_TABS_EDITABLES.length) rolesTabs = limpio;
        }
      } catch { rolesTabs = null; }
      return j({ tabsGratis, rolesTabs });
    }

    /* ================= INCIDENCIAS ================= */
    if (res === "incidencias") {
      /* El expediente de conducta de un menor: el dato más sensible de toda
         la app, y hasta ahora el único sin ningún filtro por equipo -
         cualquier sesión con token, incluida la demo, veía las incidencias de
         TODOS los equipos de TODOS los clubes. El enlace directo a Equipo
         (I.equipo) ya existía en la tabla pero este proxy no lo usaba; ahora
         se rellena siempre al crear y se exige siempre al leer o al validar.
         Las incidencias de antes de este cambio no tienen ese enlace, así que
         para ellas se resuelve el equipo a través del jugador. */
      const equipoDeIncidencia = async (r: any): Promise<string | null> =>
        (r.fields[I.equipo] || [])[0] || (await equipoDeJugador((r.fields[I.jugador] || [])[0] || ""));
      if (req.method === "GET") {
        const team = url.searchParams.get("team") || "";
        if (!team) return j({ error: "falta_equipo" }, 400);
        if (!(await puedeEquipo(team))) {
          return j({ error: "no_autorizado", reason: "No tienes acceso a las incidencias de ese equipo." }, 403);
        }
        const recs = await list(T_INCIDENCIAS);
        const conEquipo = await Promise.all(recs.map(async (r) => ({ r, eq: await equipoDeIncidencia(r) })));
        const out = conEquipo.filter((x) => x.eq === team).map(({ r }, n) => ({
          id: n + 1, rec: r.id, pid: 0, player: r.fields[I.ref] || "", date: r.fields[I.fecha] || "",
          ctx: r.fields[I.ctx] || "Entrenamiento", norm: inv(NORM_LABEL, r.fields[I.norma] || "") || "L1",
          card: inv(CARD_LABEL, r.fields[I.tarjeta] || "") || "none", measure: r.fields[I.medida] || [],
          amount: Number(r.fields[I.importe] || 0), pay: inv(PAY_LABEL, r.fields[I.pago] || "") || "na",
          desc: r.fields[I.desc] || "", state: inv(STATE_LABEL, r.fields[I.estado] || "") || "registrada",
          fam: !!r.fields[I.fam],
        }));
        return j({ records: out });
      }
      if (req.method === "POST") {
        /* El equipo se toma SIEMPRE de la sesión, nunca de lo que mande el
           cliente: es lo único que garantiza que una incidencia no se pueda
           colar en el equipo de otro. */
        if (!sesion?.equipo) return j({ ok: false, reason: "no_autorizado" }, 403);
        const b = await req.json();
        const row = b.row || {};
        let link: string[] | undefined;
        if (row.player) {
          const name = String(row.player).replace(/^#\d+\s*/, "").trim().toLowerCase();
          const js = await list(T_JUGADORES);
          const hit = js.find((r) => norm(Object.values(r.fields)[0]) === name);
          if (hit) link = [hit.id];
        }
        const fields: Record<string, unknown> = {
          [I.ref]: `${row.date || ""} · ${row.player || ""}`.trim(),
          [I.fecha]: row.date || null, [I.ctx]: row.ctx || "Entrenamiento",
          [I.grav]: String(row.norm || "L1").startsWith("G") ? "Grave" : "Leve",
          [I.norma]: NORM_LABEL[row.norm] || NORM_LABEL.L1,
          [I.tarjeta]: CARD_LABEL[row.card] || "Ninguna", [I.desc]: row.desc || "",
          [I.medida]: row.measure || [], [I.importe]: Number(row.amount) || 0,
          [I.pago]: PAY_LABEL[row.pay] || "No aplica", [I.estado]: STATE_LABEL[row.state] || "Registrada",
          [I.fam]: !!row.fam, [I.equipo]: [String(sesion.equipo)],
        };
        if (link) fields[I.jugador] = link;
        const d = await create(T_INCIDENCIAS, fields);
        return j({ ok: !!d?.id, rec: d?.id }, d?.id ? 200 : 400);
      }
      if (req.method === "PATCH" && id) {
        const actual = await unoPorId(T_INCIDENCIAS, id);
        if (!actual) return j({ ok: false, reason: "no_existe" }, 404);
        /* unoPorId trae los campos por NOMBRE; el enlace a jugador y a equipo
           se leen igual, por nombre de columna, no por el id de campo. */
        const equipoActual = (actual.fields?.Equipo || [])[0] || await equipoDeJugador((actual.fields?.Jugador || [])[0] || "");
        if (!(await puedeEquipo(equipoActual || ""))) return j({ ok: false, reason: "no_autorizado" }, 403);
        const b = await req.json();
        const row = b.row || {};
        const fields: Record<string, unknown> = {};
        if (row.state) fields[I.estado] = STATE_LABEL[row.state] || row.state;
        if (row.pay) fields[I.pago] = PAY_LABEL[row.pay] || row.pay;
        if (typeof row.fam === "boolean") fields[I.fam] = row.fam;
        const r = await fetch(`${table(T_INCIDENCIAS)}/${id}`, { method: "PATCH", headers: H, body: JSON.stringify({ fields, typecast: true }) });
        return j({ ok: r.ok }, r.ok ? 200 : 400);
      }
      return j({ error: "Petición no soportada" }, 400);
    }

    /* ================= NORMATIVA / FIRMAS / GALERÍA ================= */
    /* Recursos con CRUD generico. Se filtran por equipo con ?team=<recId> para que
       cada equipo solo vea lo suyo; DELETE permite borrar filas desde la app. */
    const GENERICOS: Record<string, string> = {
      jugadores: T_JUGADORES,
      partes: T_PARTES,
      partidos: T_PARTIDOS,
      convocatorias: T_CONVOCATORIAS,
      entrenamientos: T_ENTRENAMIENTOS,
    };
    if (GENERICOS[res]) {
      /* Jugadores, partidos, convocatorias y entrenamientos son datos de UN
         equipo -nombres y dorsales de menores incluidos-, y antes se leían y
         escribían con solo mandar el id del equipo que fuera, propio o ajeno:
         no había ninguna comprobación de que la sesión perteneciera a ese
         equipo. Ahora hace falta el mismo alcance que para cualquier otro
         dato de equipo (el propio, o el club entero si eres director o
         master), tanto para leer como para escribir. */
      const t = GENERICOS[res];
      const team = url.searchParams.get("team") || "";
      if (req.method === "GET") {
        if (!team) return j({ error: "falta_equipo" }, 400);
        if (!(await puedeEquipo(team))) {
          return j({ error: "no_autorizado", reason: "No tienes acceso a los datos de ese equipo." }, 403);
        }
        const recs = await listByName(t);
        const out = recs
          .filter((r: any) => (r.fields?.Equipo || []).includes(team))
          .map((r: any) => ({ rec: r.id, ...r.fields }));
        return j({ records: out });
      }
      if (req.method === "POST") {
        const b = await req.json();
        const equipoNuevo = (b.fields?.Equipo || [])[0] || "";
        if (!(await puedeEquipo(equipoNuevo))) return j({ ok: false, reason: "no_autorizado" }, 403);
        const d = await create(t, b.fields || {});
        return j({ ok: !!d?.id, rec: d?.id }, d?.id ? 200 : 400);
      }
      if (req.method === "PATCH" && id) {
        const actual = await unoPorId(t, id);
        const equipoActual = (actual?.fields?.Equipo || [])[0] || "";
        if (!(await puedeEquipo(equipoActual))) return j({ ok: false, reason: "no_autorizado" }, 403);
        const b = await req.json();
        /* Las sanciones de un parte -llegó tarde, usó el teléfono, otras- las
           pone la dirección del club y NO el propio entrenador: si pudiera
           tocarlas desde aquí, le bastaría con volver a mandar el parte para
           borrarse la sanción. Se escriben solo por res=parte-sancion, que
           comprueba el rol. Aquí se descartan en silencio: el entrenador no
           las manda nunca, así que si aparecen es que alguien ha construido la
           petición a mano. */
        if (res === "partes" && b.fields) {
          for (const f of [PA.tarde, PA.minutosTarde, PA.telefono, PA.penalizaciones,
            "Entrenador tarde", "Minutos tarde", "Uso del telefono", "Penalizaciones"]) delete b.fields[f];
        }
        /* La inscripción pagada de un jugador es de la dirección del club, por
           el mismo motivo que las sanciones del parte: es un apunte de dinero,
           y quien lo cobra no es quien entrena. Guardar la plantilla manda al
           jugador entero, así que sin esto bastaría con pulsar "Guardar
           plantilla" para marcar —o desmarcar— pagos sin querer. Se descartan
           en silencio salvo que quien escribe dirija el club. */
        if (res === "jugadores" && b.fields && !dirigeClub) {
          for (const f of ["Inscripcion pagada", "Fecha inscripcion"]) delete b.fields[f];
        }
        if (b.fields?.Equipo) {
          const equipoNuevo = (b.fields.Equipo || [])[0] || "";
          if (!(await puedeEquipo(equipoNuevo))) return j({ ok: false, reason: "no_autorizado" }, 403);
        }
        const r = await fetch(`${table(t)}/${id}`, { method: "PATCH", headers: H, body: JSON.stringify({ fields: b.fields || {}, typecast: true }) });
        return j({ ok: r.ok }, r.ok ? 200 : 400);
      }
      if (req.method === "DELETE" && id) {
        const actual = await unoPorId(t, id);
        const equipoActual = (actual?.fields?.Equipo || [])[0] || "";
        if (!(await puedeEquipo(equipoActual))) return j({ ok: false, reason: "no_autorizado" }, 403);
        const r = await fetch(`${table(t)}/${id}`, { method: "DELETE", headers: H });
        return j({ ok: r.ok }, r.ok ? 200 : 400);
      }
      return j({ error: "Petición no soportada" }, 400);
    }

    if (res === "normativa" || res === "firmas" || res === "galeria") {
      /* La galería son fotos y vídeos reales de menores ("Visibilidad
         restringida, nunca pública", según su propia descripción en
         Airtable) y las firmas quién ha aceptado qué normativa. Ninguna de
         las tres comprobaba el equipo: cualquier sesión con token las veía
         TODAS, de cualquier club. El frontend no usa hoy este recurso
         directamente (la pantalla de normativa vive de una lista local), pero
         el endpoint es real y queda accesible por su cuenta, así que se cierra
         igual que el resto. Normativa enlaza el equipo directamente; firmas y
         galería enlazan al jugador, y de ahí se saca el equipo. */
      const NORM_EQUIPO = "fldOGmAE882lecjEE";
      const FIRMA_JUGADOR = "fldVmYVSgZoa9A8I3";
      const GALERIA_JUGADOR = "fldcNQ8FQFYAv4NTk";
      const t = res === "normativa" ? T_NORMATIVA : res === "firmas" ? T_FIRMAS : T_GALERIA;
      const equipoDe = async (r: any): Promise<string | null> => {
        if (res === "normativa") return (r.fields[NORM_EQUIPO] || [])[0] || null;
        const campo = res === "firmas" ? FIRMA_JUGADOR : GALERIA_JUGADOR;
        return equipoDeJugador((r.fields[campo] || [])[0] || "");
      };
      /* Solo quien ya puede gestionar la normativa del club escribe aquí
         (mismo criterio que manageDocs en el frontend: director, entrenador y
         delegado, además del Master). */
      const puedeEscribir = esMaster || ["club", "director", "entrenador", "delegado"].includes(rolKey(sesion?.rol));
      if (req.method === "GET") {
        const team = url.searchParams.get("team") || "";
        if (!team) return j({ error: "falta_equipo" }, 400);
        if (!(await puedeEquipo(team))) return j({ error: "no_autorizado" }, 403);
        const recs = await list(t);
        const conEquipo = await Promise.all(recs.map(async (r) => ({ r, eq: await equipoDe(r) })));
        const out = conEquipo.filter((x) => x.eq === team).map(({ r }) => ({ rec: r.id, ...r.fields }));
        return j({ records: out });
      }
      if (req.method === "POST") {
        if (!puedeEscribir) return j({ ok: false, reason: "no_autorizado" }, 403);
        const b = await req.json();
        const d = await create(t, b.fields || {});
        return j({ ok: !!d?.id, rec: d?.id }, d?.id ? 200 : 400);
      }
      if (req.method === "PATCH" && id) {
        if (!puedeEscribir) return j({ ok: false, reason: "no_autorizado" }, 403);
        const b = await req.json();
        const r = await fetch(`${table(t)}/${id}`, { method: "PATCH", headers: H, body: JSON.stringify({ fields: b.fields || {}, typecast: true }) });
        return j({ ok: r.ok }, r.ok ? 200 : 400);
      }
      return j({ error: "Petición no soportada" }, 400);
    }

    /* ================= PROPUESTAS =================
       Cambios que el segundo entrenador (Rol principal o adicional) propone
       en alineación, plantilla, calendario, convocatoria o entrenamiento, y
       que requieren aprobación del entrenador principal, el director o el
       master antes de aplicarse de verdad.
       GET   ?res=propuestas&team=recX            -> propuestas de ese equipo
       POST  ?res=propuestas { team, tipo, datos } -> crea una Pendiente
       PATCH ?res=propuestas&id=recY { estado }    -> "aprobada" | "rechazada" */
    const TIPO_PROPUESTA_LABEL: Record<string, string> = {
      lineup: "Alineación", squad: "Plantilla", calendar: "Calendario", call: "Convocatoria", training: "Entrenamiento",
    };
    const ESTADO_PROPUESTA_LABEL: Record<string, string> = {
      pending: "Pendiente", approved: "Aprobada", rejected: "Rechazada",
    };
    const estadoPropuestaKey = (v: unknown) => inv(ESTADO_PROPUESTA_LABEL, String(v || "")) || "pending";
    const tipoPropuestaKey = (v: unknown) => inv(TIPO_PROPUESTA_LABEL, String(v || "")) || "";
    const propuestaOut = (r: any) => ({
      id: r.id,
      type: tipoPropuestaKey(r.fields[PR.tipo]),
      status: estadoPropuestaKey(r.fields[PR.estado]),
      data: (() => { try { return JSON.parse(r.fields[PR.datos] || "null"); } catch { return null; } })(),
      teamRec: (r.fields[PR.equipo] || [])[0] || null,
      proposedBy: (r.fields[PR.propuestoPor] || [])[0] || null,
      approvedBy: (r.fields[PR.aprobadoPor] || [])[0] || null,
      date: r.fields[PR.fechaProp] || null,
      resolvedDate: r.fields[PR.fechaRes] || null,
      motivo: r.fields[PR.motivo] || null,
    });
    /* Quien puede aprobar o rechazar: el entrenador principal, el director o
       el master del equipo al que pertenece la propuesta. El segundo y el
       delegado nunca, aunque tengan ambos roles a la vez. */
    const puedeResolverPropuestas = () =>
      esMaster || ["director", "club"].includes(rolKey(sesion?.rol)) || tieneRol(sesion, "entrenador");

    if (res === "propuestas") {
      if (req.method === "GET") {
        const team = url.searchParams.get("team") || "";
        if (!team) return j({ error: "falta_equipo" }, 400);
        if (!(await puedeEquipo(team))) return j({ error: "no_autorizado" }, 403);
        const recs = await list(T_PROPUESTAS);
        const out = recs.filter((r) => (r.fields[PR.equipo] || []).includes(team)).map(propuestaOut);
        return j({ records: out });
      }
      if (req.method === "POST") {
        /* Solo quien tiene el rol de segundo -principal o adicional- puede
           proponer. El entrenador, director y master editan directamente y no
           pasan por aquí (lo decide el frontend), pero se repite el criterio
           en el servidor porque el cliente no es una barrera de seguridad. */
        if (!tieneRol(sesion, "segundo")) return j({ ok: false, reason: "no_autorizado" }, 403);
        const b = await req.json();
        const team = String(b.team || "");
        if (!team || !(await puedeEquipo(team))) return j({ ok: false, reason: "no_autorizado" }, 403);
        const tipoLabel = TIPO_PROPUESTA_LABEL[String(b.type || "")];
        if (!tipoLabel) return j({ ok: false, reason: "tipo_no_valido" }, 400);
        const d = await create(T_PROPUESTAS, {
          [PR.ref]: `PR-${Date.now()}`,
          [PR.tipo]: tipoLabel,
          [PR.estado]: "Pendiente",
          [PR.datos]: JSON.stringify(b.data ?? null),
          [PR.equipo]: [team],
          [PR.propuestoPor]: sesion?.id ? [sesion.id] : [],
          [PR.fechaProp]: new Date().toISOString(),
        });
        return j({ ok: !!d?.id, rec: d?.id }, d?.id ? 200 : 400);
      }
      if (req.method === "PATCH" && id) {
        if (!puedeResolverPropuestas()) return j({ ok: false, reason: "no_autorizado" }, 403);
        const b = await req.json();
        const nuevoEstado = String(b.estado || b.status || "");
        const label = nuevoEstado === "approved" || nuevoEstado === "aprobada" ? "Aprobada"
          : nuevoEstado === "rejected" || nuevoEstado === "rechazada" ? "Rechazada" : "";
        if (!label) return j({ ok: false, reason: "estado_no_valido" }, 400);
        /* Rechazar exige motivo: sin él, quien propuso se queda sin saber qué
           cambiar y vuelve a mandar lo mismo o se cansa de proponer. */
        const motivo = String(b.motivo || "").trim();
        if (label === "Rechazada" && !motivo) return j({ ok: false, reason: "falta_motivo" }, 400);
        /* La propuesta tiene que ser de un equipo al que este usuario tenga
           alcance -su equipo, o su club si es director/master- para que el
           entrenador de un equipo no pueda resolver la propuesta de otro.
           returnFieldsByFieldId=true: unoPorId() devuelve los campos por
           NOMBRE, y aquí se indexan por ID (PR.equipo). */
        const actualR = await fetch(`${table(T_PROPUESTAS)}/${id}?returnFieldsByFieldId=true`, { headers: H });
        if (!actualR.ok) return j({ ok: false, reason: "no_encontrada" }, 404);
        const actual = await actualR.json().catch(() => null);
        const teamDeProp = (actual?.fields?.[PR.equipo] || [])[0] || null;
        if (!teamDeProp || !(await puedeEquipo(teamDeProp))) return j({ ok: false, reason: "no_autorizado" }, 403);
        const r = await fetch(`${table(T_PROPUESTAS)}/${id}`, {
          method: "PATCH", headers: H,
          body: JSON.stringify({
            fields: {
              [PR.estado]: label,
              [PR.aprobadoPor]: sesion?.id ? [sesion.id] : [],
              [PR.fechaRes]: new Date().toISOString(),
              ...(label === "Rechazada" ? { [PR.motivo]: motivo } : {}),
            }, typecast: true,
          }),
        });
        if (!r.ok) {
          const err = await r.text().catch(() => "");
          console.error(`[propuestas] Airtable ${r.status}: ${err.slice(0, 300)}`);
          return j({ ok: false, reason: "airtable" }, 400);
        }
        return j({ ok: true });
      }
      return j({ error: "Petición no soportada" }, 400);
    }

    /* ================= USUARIOS ================= */
    const api = table(T_USUARIOS);
    const allUsers = () => list(T_USUARIOS);

    if (req.method === "POST") {
      const b = await req.json();

      // ---- LOGIN ----
      if (b.action === "login") {
        const email = norm(b.email);
        const recs = await allUsers();
        /* Antes esto era un find() a secas. Con la lectura rota se colaron
           cuentas duplicadas con el mismo email (el control de "ya existe"
           nunca saltaba), y con varias coincidencias el login caía en una u
           otra según el orden que devolviera Airtable. Desempate: primero las
           Activas, y entre ellas la más reciente. Lo correcto sigue siendo no
           tener duplicados; esto solo evita que el acceso sea una lotería. */
        const cand = recs
          .filter((r) => norm(r.fields[U.email]) === email)
          .sort((a, c) => {
            const act = (x: any) => (norm(x.fields[U.estado]) === "activo" ? 0 : 1);
            return act(a) - act(c) || String(c.createdTime || "").localeCompare(String(a.createdTime || ""));
          });
        const rec = cand[0];
        if (!rec || !rec.fields[U.pass]) return j({ ok: false, reason: "bad" });
        const verif = await verificaPassword(String(b.password || ""), String(rec.fields[U.pass] || ""));
        if (!verif.ok) return j({ ok: false, reason: "bad" });
        /* La contraseña era buena pero venía en el formato antiguo: se
           reescribe sola al nuevo, sin que la persona tenga que hacer nada.
           Se espera a que termine -en una función serverless no hay garantía
           de que un trabajo "en segundo plano" siga vivo una vez respondida
           la petición, así que la única forma fiable de que se guarde es
           esperarlo aquí. Es un coste único, la primera vez que cada persona
           inicia sesión después de este cambio. */
        if (verif.anticuado) {
          const nuevo = await hashPassword(String(b.password || ""));
          await fetch(`${table(T_USUARIOS)}/${rec.id}`, { method: "PATCH", headers: H, body: JSON.stringify({ fields: { [U.pass]: nuevo }, typecast: true }) });
        }

        const [eqs, clubs] = await Promise.all([list(T_EQUIPOS), list(T_CLUBES)]);
        const eqRec = (rec.fields[U.equipo] || [])[0];
        const clRec = (rec.fields[U.club] || [])[0];
        const eq = eqs.find((e) => e.id === eqRec);
        const cl = clubs.find((c) => c.id === clRec);
        /* El rol de la sesión pasa por rolReal: traduce la etiqueta de
           Airtable a la clave interna y, sobre todo, impide que nadie sea
           Master salvo la cuenta de EBLDigital. */
        const rolDeSesion = rolReal(rec.fields[U.rol], rec.fields[U.email]);
        const rolesExtraDeSesion = rolesExtraKeys(rec.fields[U.rolesExtra]);
        return j({
          ok: true,
          token: await firmarSesion({ id: rec.id, email, rol: rolDeSesion, equipo: eqRec || null, rolesExtra: rolesExtraDeSesion }),
          user: {
            id: rec.id, name: rec.fields[U.nombre] || "", email: rec.fields[U.email] || "",
            rol: ROL_LABEL[rolDeSesion] || rec.fields[U.rol] || "", estado: rec.fields[U.estado] || "",
            rolesExtra: rolesExtraDeSesion,
            parteMat: !!rec.fields[U.parteMat],
            plan: rec.fields[U.plan] || "Oficial",
            /* Días de prueba que le quedan según Airtable. 0 = sin prueba. */
            prueba: pruebaDias(rec.fields[U.prueba]),
            club: cl ? cl.fields[CL.nombre] : "", comunidad: cl ? cl.fields[CL.comunidad] : "",
            /* El REGISTRO del club, no solo su nombre. La app lo buscaba
               emparejando el nombre contra la lista de clubes, y si no cuadraba
               letra a letra se quedaba con el primero de la lista —el club
               equivocado— o sin ninguno; a partir de ahí todo lo que se pide
               "de mi club" fallaba en silencio. Quien sabe de qué club es cada
               ficha es el servidor: que lo diga él. */
            clubRec: clRec || null,
            crest: cl ? (cl.fields[CL.escudo]?.[0]?.url || null) : null,
            team: eq ? teamOut(eq, clubs) : null,
          },
        });
      }

      // ---- HE OLVIDADO MI CONTRASEÑA ----
      /* Responde SIEMPRE lo mismo exista o no la cuenta. Si el mensaje
         cambiara, esta ruta valdría para averiguar qué correos están dados de
         alta en el club — justo lo que no queremos publicar. La única
         distinción que sí se devuelve es si falta configurar el correo en el
         servidor, porque eso no dice nada de ninguna cuenta concreta. */
      if (b.action === "forgotPassword") {
        if (!MAIL_KEY()) return j({ ok: true, sinCorreo: true });
        const email = norm(b.email);
        if (!email) return j({ ok: true });
        const recs = await allUsers();
        const rec = recs
          .filter((r) => norm(r.fields[U.email]) === email)
          .sort((a, c) => {
            const act = (x: any) => (norm(x.fields[U.estado]) === "activo" ? 0 : 1);
            return act(a) - act(c) || String(c.createdTime || "").localeCompare(String(a.createdTime || ""));
          })[0];
        if (!rec) return j({ ok: true });
        const tk = await firmarReset(rec.id, String(rec.fields[U.pass] || ""));
        const enlace = `${APP_URL()}/?reset=${encodeURIComponent(tk)}`;
        await enviarCorreo(
          String(rec.fields[U.email] || email),
          "Recupera tu contraseña · COACHBASE AI",
          correoReset(String(rec.fields[U.nombre] || ""), enlace),
        );
        return j({ ok: true });
      }

      // ---- ELEGIR NUEVA CONTRASEÑA DESDE EL ENLACE ----
      if (b.action === "resetPassword") {
        /* Cada motivo se distingue y se registra. Antes todos los fallos
           devolvían "token" y el usuario leía siempre "el enlace ya no vale",
           daba igual que hubiera caducado, que estuviera mal formado o que
           Airtable hubiera rechazado la escritura: tres problemas distintos
           con el mismo mensaje y sin rastro en ninguna parte. */
        const tk = String(b.token || "");
        const nueva = String(b.password || "");
        if (nueva.length < 6) return j({ ok: false, reason: "corta" });
        const p = cuerpoReset(tk);
        if (!p?.uid) {
          console.error("[reset] token ilegible o sin uid");
          return j({ ok: false, reason: "token" });
        }
        /* Caducado se comprueba aparte de la firma para poder decirlo tal
           cual: es el fallo más probable y tiene solución obvia (pedir otro). */
        if (!p.exp || p.exp <= Date.now()) {
          console.error(`[reset] enlace caducado hace ${Math.round((Date.now() - (p.exp || 0)) / 60000)} min`);
          return j({ ok: false, reason: "caducado" });
        }
        const recs = await allUsers();
        const rec = recs.find((r) => r.id === p.uid);
        if (!rec) {
          console.error(`[reset] no existe el usuario ${p.uid}`);
          return j({ ok: false, reason: "token" });
        }
        if (!(await resetValido(tk, String(rec.fields[U.pass] || "")))) {
          /* Firma que no cuadra: el enlace ya se usó (la contraseña cambió y
             con ella la clave de firma) o el AIRTABLE_TOKEN se ha rotado. */
          console.error(`[reset] firma no válida para ${p.uid}: enlace ya usado o AUTH_SECRET/AIRTABLE_TOKEN rotado`);
          return j({ ok: false, reason: "usado" });
        }
        const r = await fetch(`${api}/${rec.id}`, {
          method: "PATCH", headers: H,
          body: JSON.stringify({ fields: { [U.pass]: await hashPassword(nueva) }, typecast: true }),
        });
        if (!r.ok) {
          const err = await r.text().catch(() => "");
          console.error(`[reset] Airtable ${r.status} al guardar la contraseña: ${err.slice(0, 300)}`);
          return j({ ok: false, reason: "airtable" }, 400);
        }
        console.log(`[reset] contraseña actualizada para ${rec.fields[U.email]}`);
        return j({ ok: true });
      }

      // ---- CAMBIAR LA CONTRASEÑA DESDE EL PERFIL (con sesión) ----
      if (b.action === "changePassword") {
        if (!sesion?.id) return j({ ok: false, reason: "no_autorizado" }, 401);
        const nueva = String(b.next || "");
        if (nueva.length < 6) return j({ ok: false, reason: "corta" });
        const recs = await allUsers();
        const rec = recs.find((r) => r.id === sesion.id);
        if (!rec) return j({ ok: false, reason: "no_autorizado" }, 401);
        /* Se exige la actual aunque haya sesión: si alguien deja el móvil
           abierto, que no pueda cambiarla y quedarse con la cuenta. */
        if (!(await verificaPassword(String(b.current || ""), String(rec.fields[U.pass] || ""))).ok) {
          return j({ ok: false, reason: "bad" });
        }
        const r = await fetch(`${api}/${rec.id}`, {
          method: "PATCH", headers: H,
          body: JSON.stringify({ fields: { [U.pass]: await hashPassword(nueva) }, typecast: true }),
        });
        return j({ ok: r.ok }, r.ok ? 200 : 400);
      }

      // ---- CAMBIAR DE EQUIPO (uno mismo) ----
      /* Cambiarse de equipo es cosa de cada uno: la gente cambia de equipo a
         mitad de temporada y no puede depender de que el Master esté
         disponible. Solo se toca el campo Equipo de la PROPIA ficha. */
      if (b.action === "cambiarEquipo") {
        if (!sesion?.id) return j({ ok: false, reason: "no_autorizado" }, 401);
        const teamRec = String(b.teamRec || "");
        if (!teamRec) return j({ ok: false, reason: "falta_equipo" }, 400);
        const eqs = await list(T_EQUIPOS);
        const eq = eqs.find((e) => e.id === teamRec);
        if (!eq) return j({ ok: false, reason: "no_existe" }, 404);
        /* Solo dentro del propio club: "cambiarse de equipo" es pasar de
           Infantil A a Infantil B del mismo club, no entrar en la categoría
           de un club cualquiera con solo conocer su id. Antes esto no se
           comprobaba -bastaba con mandar el id de CUALQUIER equipo de
           CUALQUIER club para que la sesión pasara a pertenecer a él, y desde
           ahí se leían y escribían sus datos como si se fuera de casa. */
        if (!esMaster) {
          const recsYo = await allUsers();
          const yo = recsYo.find((r) => r.id === sesion.id);
          const clubPropio = (yo?.fields[U.club] || [])[0] || null;
          const clubDestino = (eq.fields[EQ.club] || [])[0] || null;
          if (!clubPropio || !clubDestino || clubPropio !== clubDestino) {
            return j({ ok: false, reason: "otro_club" }, 403);
          }
        }
        const r = await fetch(`${api}/${sesion.id}`, {
          method: "PATCH", headers: H,
          body: JSON.stringify({ fields: { [U.equipo]: [teamRec] }, typecast: true }),
        });
        if (!r.ok) {
          const err = await r.text().catch(() => "");
          console.error(`[equipo] Airtable ${r.status}: ${err.slice(0, 300)}`);
          return j({ ok: false, reason: "airtable" }, 400);
        }
        /* Token nuevo: el equipo viaja dentro de la sesión firmada y si no se
           refresca seguiría mandando el anterior en las siguientes peticiones. */
        return j({ ok: true, token: await firmarSesion({ id: sesion.id, email: sesion.email, rol: sesion.rol, equipo: teamRec, rolesExtra: sesion.rolesExtra || [] }) });
      }

      // ---- CREAR EQUIPO Y PASARSE A ÉL ----
      /* Crear equipos estaba reservado al Master, y eso deja tirado a quien
         llega y no encuentra el suyo en la lista. Ahora cualquiera puede
         crear el suyo dentro de SU club, y se pasa a él automáticamente. */
      if (b.action === "crearEquipo") {
        if (!sesion?.id) return j({ ok: false, reason: "no_autorizado" }, 401);
        const nombre = String(b.nombre || "").trim();
        if (!nombre) return j({ ok: false, reason: "falta_nombre" }, 400);
        const recs = await allUsers();
        const yo = recs.find((r) => r.id === sesion.id);
        const clubRec = (yo?.fields[U.club] || [])[0];
        /* Una categoría SIEMPRE cuelga de un club: "Juvenil A" no es un equipo
           independiente, es una categoría del Chamartín Vergara. Si la ficha no
           tiene club, no se crea nada suelto — los clubs los da de alta el
           Master, y hasta que no te asigne uno no hay dónde colgar la categoría. */
        if (!clubRec) return j({ ok: false, reason: "sin_club" }, 400);
        const eqs = await list(T_EQUIPOS);
        /* Si ya existe uno con ese nombre en el club, se reutiliza en vez de
           duplicarlo: dos "Infantil A" en el mismo club solo traen líos. */
        const ya = eqs.find((e) => norm(e.fields[EQ.nombre]) === norm(nombre)
          && (!clubRec || (e.fields[EQ.club] || []).includes(clubRec)));
        let rec = ya?.id;
        if (!rec) {
          const d = await create(T_EQUIPOS, {
            [EQ.nombre]: nombre,
            ...(b.categoria ? { [EQ.categoria]: String(b.categoria) } : {}),
            ...(b.formato ? { [EQ.formato]: String(b.formato) } : {}),
            ...(clubRec ? { [EQ.club]: [clubRec] } : {}),
          });
          if (!d?.id) return j({ ok: false, reason: "airtable" }, 400);
          rec = d.id;
        }
        /* Crear una categoría desde "Mi cuenta" significa "me paso a ella", y
           por eso se reasigna a quien la crea. Pero la dirección del club
           también la crea para meter a OTRA persona —al dar de alta a alguien
           del Sénior—, y ahí moverla de categoría sería sacarla de la suya sin
           avisar. Con `quedarme` se crea sin tocar la ficha de quien la pide. */
        if (b.quedarme) return j({ ok: true, rec, reutilizado: !!ya });
        await fetch(`${api}/${sesion.id}`, {
          method: "PATCH", headers: H,
          body: JSON.stringify({ fields: { [U.equipo]: [rec] }, typecast: true }),
        });
        return j({ ok: true, rec, reutilizado: !!ya, token: await firmarSesion({ id: sesion.id, email: sesion.email, rol: sesion.rol, equipo: rec, rolesExtra: sesion.rolesExtra || [] }) });
      }

      // ---- SESIÓN DE LA DEMO ----
      /* La demo no tiene cuenta en Airtable, así que no puede firmar sesión al
         entrar y Coach AI le respondía 401. Aquí se emite un pase firmado que
         solo sirve para eso: dura dos horas, no lleva id ni equipo, y el propio
         asistente lo trata como demo (respuestas más cortas). No da acceso a
         ningún dato: todas las lecturas de Airtable exigen id o equipo. */
      if (b.action === "demoToken") {
        const cuerpo = b64u(new TextEncoder().encode(JSON.stringify({
          demo: true, rol: "Demo", exp: Date.now() + 2 * 3600000,
        })));
        return j({ ok: true, token: `${cuerpo}.${await hmac(cuerpo)}` });
      }

      // ---- CREAR UN CLUB (SOLO MASTER) ----
      /* El club es el nivel de arriba: el Chamartín Vergara, no sus categorías.
         Solo lo crea el Master; cada usuario añade después SUS categorías
         dentro del club al que pertenece. */
      if (b.action === "crearClub") {
        if (!esMaster) return j({ ok: false, reason: "no_autorizado" }, 403);
        const nombre = String(b.nombre || "").trim();
        if (!nombre) return j({ ok: false, reason: "falta_nombre" }, 400);
        const clubes = await list(T_CLUBES);
        const ya = clubes.find((c) => norm(c.fields[CL.nombre]) === norm(nombre));
        if (ya) return j({ ok: true, rec: ya.id, reutilizado: true });
        const d = await create(T_CLUBES, { [CL.nombre]: nombre, [CL.comunidad]: String(b.comunidad || "") });
        if (!d?.id) return j({ ok: false, reason: "airtable" }, 400);
        return j({ ok: true, rec: d.id });
      }

      // ---- ELIMINAR UN CLUB (SOLO MASTER) ----
      /* Solo si está vacío. Borrar un club con categorías o con gente dentro
         dejaría fichas huérfanas apuntando a un registro que ya no existe, y
         eso no se ve hasta que alguien intenta entrar. */
      if (b.action === "borrarClub") {
        if (!esMaster) return j({ ok: false, reason: "no_autorizado" }, 403);
        const clubRec = String(b.clubRec || "");
        if (!clubRec) return j({ ok: false, reason: "falta_club" }, 400);
        const [eqs, usuarios] = await Promise.all([list(T_EQUIPOS), allUsers()]);
        const categorias = eqs.filter((e) => (e.fields[EQ.club] || []).includes(clubRec)).length;
        const personas = usuarios.filter((u) => (u.fields[U.club] || []).includes(clubRec)).length;
        if (categorias || personas) return j({ ok: false, reason: "no_vacio", categorias, personas }, 409);
        const r = await fetch(`${table(T_CLUBES)}/${clubRec}`, { method: "DELETE", headers: H });
        return j({ ok: r.ok }, r.ok ? 200 : 400);
      }

      // ---- ELIMINAR LA PROPIA CUENTA ----
      if (b.action === "borrarmeCuenta") {
        if (!sesion?.id) return j({ ok: false, reason: "no_autorizado" }, 401);
        /* El Master no puede borrarse: es la única cuenta con acceso total y
           sin ella nadie podría volver a administrar nada. */
        if (rolKey(sesion?.rol) === "master") return j({ ok: false, reason: "master" }, 403);
        const recs = await allUsers();
        const yo = recs.find((r) => r.id === sesion.id);
        if (!yo) return j({ ok: false, reason: "no_autorizado" }, 401);
        /* Se exige la contraseña actual: un móvil abierto encima de la mesa no
           puede bastar para borrar una cuenta sin vuelta atrás. */
        if (!(await verificaPassword(String(b.password || ""), String(yo.fields[U.pass] || ""))).ok) {
          return j({ ok: false, reason: "bad" });
        }
        const r = await fetch(`${api}/${sesion.id}`, { method: "DELETE", headers: H });
        if (!r.ok) {
          const err = await r.text().catch(() => "");
          console.error(`[cuenta] Airtable ${r.status} al borrar: ${err.slice(0, 300)}`);
          return j({ ok: false, reason: "airtable" }, 400);
        }
        console.log(`[cuenta] eliminada a peticion de ${yo.fields[U.email]}`);
        return j({ ok: true });
      }

      // ---- REGISTER (crea club y equipo si no existen) ----
      /* ================= ALTA DE USUARIO POR EL CLUB =================
         El director deportivo o el Master crean la ficha (nombre, email, rol y
         equipo) SIN contraseña y en estado Pendiente. La persona la reclama
         después registrándose con ese mismo correo. */
      if (b.action === "createUser") {
        const puede = ASIGNABLES[rolKey(sesion?.rol)] || [];
        if (puede.length === 0) return j({ ok: false, reason: "no_autorizado" }, 403);
        /* El rol pedido tiene que estar entre los que este rol reparte. Sin
           esto, un entrenador podría nombrarse director mandando el POST a
           mano: el desplegable del cliente no es una barrera de seguridad. */
        const pedido = rolKey(b.rol);
        if (!puede.includes(pedido)) return j({ ok: false, reason: "rol_no_permitido" }, 403);
        const email = norm(b.email);
        if (!email || !b.name) return j({ ok: false, reason: "faltan_datos" }, 400);
        const recs = await allUsers();
        if (recs.some((r) => norm(r.fields[U.email]) === email)) return j({ ok: false, reason: "exists" });
        /* El club al que se da de alta tiene que ser el propio de quien lo
           está haciendo: sin esto, un entrenador con permiso para dar de alta
           a su segundo podía colar una ficha en el club de otro con solo
           mandar su id -el desplegable del cliente no es una barrera. */
        if (!esMaster) {
          const yo = recs.find((r) => r.id === sesion?.id);
          const clubYo = (yo?.fields[U.club] || [])[0] || null;
          if (!clubYo || String(b.clubRec || "") !== clubYo) {
            return j({ ok: false, reason: "no_autorizado" }, 403);
          }
        }
        /* Y si además se le asigna una categoría, que sea una categoría de
           ESE club, no de cualquier otro. */
        if (b.teamRec) {
          const eqDestino = (await equiposTodos()).find((e) => e.id === b.teamRec);
          const clubDelEquipo = (eqDestino?.fields[EQ.club] || [])[0] || null;
          if (!eqDestino || (b.clubRec && clubDelEquipo !== b.clubRec)) {
            return j({ ok: false, reason: "equipo_no_valido" }, 400);
          }
        }
        /* Un club tiene un único director deportivo: es quien lo dirige y
           reparte el resto de altas, no un cargo compartido. Sin esto, el
           Master podría dar de alta sin querer a un segundo director en un
           club que ya tiene el suyo. */
        if (["director", "club"].includes(pedido) && b.clubRec) {
          const yaHay = recs.some((r) =>
            rolKey(r.fields[U.rol]) === pedido &&
            (r.fields[U.club] || []).includes(b.clubRec) &&
            norm(r.fields[U.estado]) !== "suspendido",
          );
          if (yaHay) return j({ ok: false, reason: pedido === "club" ? "club_unico" : "director_unico" }, 409);
        }
        /* Tope de plazas del club: cuentan Activas y Pendientes (una invitación
           sin reclamar ya ocupa la plaza). Vacío/0 en Limite usuarios = sin límite. */
        if (b.clubRec) {
          const clubes = await list(T_CLUBES);
          const club = clubes.find((c) => c.id === b.clubRec);
          const limite = Number(club?.fields[CL.limite]) || 0;
          if (limite > 0) {
            const ocupadas = recs.filter((r) => (r.fields[U.club] || []).includes(b.clubRec)).length;
            if (ocupadas >= limite) {
              return j({ ok: false, reason: "limite_alcanzado", limite, ocupadas }, 403);
            }
          }
        }
        /* Roles adicionales (p.ej. Segundo Y Delegado a la vez): solo se
           aceptan claves que este rol también podría repartir como rol
           principal — mismo criterio que "pedido" arriba. */
        const extrasPedidos = (Array.isArray(b.rolesExtra) ? b.rolesExtra : [])
          .map((x: unknown) => rolKey(x)).filter((k: string) => puede.includes(k) && k !== pedido);
        /* Contraseña inicial, opcional. Por defecto la ficha se crea SIN
           contraseña y la elige la propia persona en su primera entrada, que
           es lo mejor: nadie más la conoce nunca. Pero eso obliga a que la
           persona esté delante, y hay casos en los que no lo está —dar de alta
           la cuenta del club, o a alguien que no maneja el correo—. Cuando se
           manda una, la ficha entra ya Activa y esa persona puede iniciar
           sesión de inmediato.
           Se guarda con el mismo hash que el resto (PBKDF2, sal propia): ni
           siquiera queda legible para quien la ha puesto. */
        const inicial = String(b.password || "");
        if (inicial && inicial.length < 4) return j({ ok: false, reason: "pass_corta" }, 400);
        const d = await create(T_USUARIOS, {
          [U.nombre]: b.name, [U.email]: email, [U.rol]: b.rol || "Entrenador principal",
          [U.estado]: inicial ? "Activo" : "Pendiente", [U.plan]: "Oficial", [U.prueba]: fechaTrial30(),
          ...(inicial ? { [U.pass]: await hashPassword(inicial) } : {}),
          ...(b.clubRec ? { [U.club]: [b.clubRec] } : {}),
          ...(b.teamRec ? { [U.equipo]: [b.teamRec] } : {}),
          ...(extrasPedidos.length ? { [U.rolesExtra]: extrasPedidos.map((k: string) => ROL_LABEL[k]) } : {}),
        });
        return j({ ok: !!d?.id, rec: d?.id, activa: !!inicial }, d?.id ? 200 : 400);
      }

      /* ================= FAMILIA / JUGADOR: VINCULAR DESDE LA FICHA =================
         El club invita directamente desde la ficha del jugador -hasta 2 emails
         de padres/tutores y 1 del propio jugador-, sin que nadie tenga que
         autorregistrarse ni el club tenga que confiar en que quien se
         autorregistra dijo el nombre y el dorsal exactos. Nace Pendiente y SIN
         contraseña, igual que cualquier alta del club: la reclama quien sea
         con "Es mi primera vez" y ese mismo correo. No cuenta contra el
         límite de plazas: como el autorregistro de familias, este acceso es
         siempre gratuito. Puede darla de alta cualquiera con alcance sobre el
         equipo del jugador -no hace falta ser director, el propio entrenador
         que conoce a la familia también debería poder-. */
      if (b.action === "vincularPariente") {
        const jugadorRec = String(b.jugadorRec || "");
        if (!jugadorRec) return j({ ok: false, reason: "falta_jugador" }, 400);
        const teamDelJugador = await equipoDeJugador(jugadorRec);
        if (!teamDelJugador || !(await puedeEquipo(teamDelJugador))) {
          return j({ ok: false, reason: "no_autorizado" }, 403);
        }
        const pedido = rolKey(b.rol);
        if (!["familia", "jugador"].includes(pedido)) return j({ ok: false, reason: "rol_no_permitido" }, 400);
        const email = norm(b.email);
        if (!email || !b.name) return j({ ok: false, reason: "faltan_datos" }, 400);
        const recs = await allUsers();
        if (recs.some((r) => norm(r.fields[U.email]) === email)) return j({ ok: false, reason: "exists" });
        /* Tope: dos padres/tutores como mucho, y un único acceso del propio
           jugador -no tiene sentido que "el jugador" sea más de una cuenta-. */
        const yaVinculados = recs.filter((r) =>
          (r.fields[U.hijo] || []).includes(jugadorRec) && rolKey(r.fields[U.rol]) === pedido);
        const tope = pedido === "jugador" ? 1 : 2;
        if (yaVinculados.length >= tope) return j({ ok: false, reason: "tope_alcanzado", tope }, 409);
        const clubDelJugador = await clubDeEquipo(teamDelJugador);
        const d = await create(T_USUARIOS, {
          [U.nombre]: b.name, [U.email]: email, [U.rol]: ROL_LABEL[pedido], [U.estado]: "Pendiente",
          ...(clubDelJugador ? { [U.club]: [clubDelJugador] } : {}),
          [U.equipo]: [teamDelJugador], [U.hijo]: [jugadorRec],
        });
        return j({ ok: !!d?.id, rec: d?.id }, d?.id ? 200 : 400);
      }

      /* Quitar el acceso: solo a cuentas Familia o Jugador, y solo dentro del
         alcance de quien lo pide -mismo criterio que darlas de alta-. Borra
         la ficha entera, no solo el enlace: una invitación sin reclamar no
         tiene nada más que conservar, y una ya reclamada es la cuenta de esa
         persona, no un dato del jugador que deba sobrevivirle. */
      if (b.action === "desvincularPariente") {
        const usuarioRec = String(b.usuarioRec || "");
        if (!usuarioRec) return j({ ok: false, reason: "falta_usuario" }, 400);
        const recs = await allUsers();
        const objetivo = recs.find((r) => r.id === usuarioRec);
        if (!objetivo) return j({ ok: false, reason: "no_existe" }, 404);
        if (!["familia", "jugador"].includes(rolKey(objetivo.fields[U.rol]))) {
          return j({ ok: false, reason: "no_autorizado" }, 403);
        }
        const teamDelObjetivo = (objetivo.fields[U.equipo] || [])[0] || "";
        if (!teamDelObjetivo || !(await puedeEquipo(teamDelObjetivo))) {
          return j({ ok: false, reason: "no_autorizado" }, 403);
        }
        const r = await fetch(`${table(T_USUARIOS)}/${usuarioRec}`, { method: "DELETE", headers: H });
        if (!r.ok) return j({ ok: false, reason: "airtable" }, 400);
        return j({ ok: true });
      }

      /* ================= ADMINISTRACIÓN DE CLUB (solo Master) =================
         Límite de plazas y estado de pago. El pago se deduce de la tabla
         Suscripciones cruzándola con los usuarios del club: no hace falta un
         campo nuevo, ya que Suscripciones ya enlaza con Usuarios y Usuarios ya
         enlaza con Clubes. */
      if (b.action === "clubAdmin") {
        if (!esMaster) return j({ ok: false, reason: "no_autorizado" }, 403);
        const clubRec = String(b.clubRec || "");
        if (!clubRec) return j({ ok: false, reason: "falta_club" }, 400);
        if (b.limite !== undefined) {
          const r = await fetch(`${table(T_CLUBES)}/${clubRec}`, {
            method: "PATCH", headers: H,
            body: JSON.stringify({ fields: { [CL.limite]: b.limite === null ? null : Number(b.limite) || 0 }, typecast: true }),
          });
          if (!r.ok) return j({ ok: false, reason: "error" }, 400);
        }
        const [club, usuarios, subs] = await Promise.all([
          fetch(`${table(T_CLUBES)}/${clubRec}?returnFieldsByFieldId=true`, { headers: H }).then((r) => r.json()),
          allUsers(), list(T_SUSCRIPCIONES),
        ]);
        const delClub = usuarios.filter((u) => (u.fields[U.club] || []).includes(clubRec));
        const emailsClub = new Set(delClub.map((u) => norm(u.fields[U.email])));
        /* La suscripción vigente más relevante entre los emails del club: activa
           primero, y si hay varias, la de fecha "Periodo fin" más lejana. */
        const candidatas = subs.filter((s) => emailsClub.has(norm(s.fields[SUS.email])));
        candidatas.sort((a, c) => {
          const act = (x: any) => (norm(x.fields[SUS.estado]) === "activa" || norm(x.fields[SUS.estado]) === "active" ? 0 : 1);
          return act(a) - act(c) || String(c.fields[SUS.periodoFin] || "").localeCompare(String(a.fields[SUS.periodoFin] || ""));
        });
        const mejor = candidatas[0];
        return j({
          ok: true,
          limite: Number(club?.fields?.[CL.limite]) || 0,
          ocupadas: delClub.length,
          activos: delClub.filter((u) => norm(u.fields[U.estado]) === "activo").length,
          pendientes: delClub.filter((u) => norm(u.fields[U.estado]) === "pendiente").length,
          suscripcion: mejor ? {
            estado: mejor.fields[SUS.estado] || "", email: mejor.fields[SUS.email] || "",
            precio: mejor.fields[SUS.precio] || "", importe: mejor.fields[SUS.importe] || null,
            periodoFin: mejor.fields[SUS.periodoFin] || null, cancelarFin: !!mejor.fields[SUS.cancelarFin],
          } : null,
        });
      }

      if (b.action === "register") {
        const email = norm(b.email);
        const recs = await allUsers();
        const previo = recs.find((r) => norm(r.fields[U.email]) === email);
        const modo = norm(b.plan);
        const independent = modo === "gratis" || modo === "free";
        const fundaClub = modo === "club";
        const esFamilia = modo === "familia";

        /* --- Cuenta de familia: elige el equipo de su hijo/a de los que ya
           existen -no crea ninguno- y dice su nombre y dorsal para
           encontrarlo en esa plantilla. No prueba parentesco: cualquiera que
           conozca el nombre y el dorsal de un compañero podría escribirlos.
           Lo que de verdad protege el dato del menor es que la cuenta nace
           Pendiente -sin ver nada todavía, ver res=hijo- hasta que alguien
           del club la active a mano. Tampoco cuenta contra el límite de
           plazas del club: el portal de familias es siempre gratuito. */
        if (esFamilia) {
          if (previo) return j({ ok: false, reason: "exists" });
          const teamRec = String(b.teamRec || "");
          if (!teamRec) return j({ ok: false, reason: "falta_equipo" }, 400);
          const equipos = await list(T_EQUIPOS);
          const equipo = equipos.find((e) => e.id === teamRec);
          if (!equipo) return j({ ok: false, reason: "equipo_no_existe" }, 400);
          const clubId = (equipo.fields[EQ.club] || [])[0] || null;
          if (!clubId) return j({ ok: false, reason: "equipo_sin_club" }, 400);
          const nombreBuscado = norm(b.hijoNombre);
          const dorsalBuscado = Number(b.hijoDorsal) || 0;
          if (!nombreBuscado || !dorsalBuscado) return j({ ok: false, reason: "faltan_datos_hijo" }, 400);
          const jugadoresEquipo = (await listByName(T_JUGADORES)).filter((r) => (r.fields?.Equipo || []).includes(teamRec));
          const candidatos = jugadoresEquipo.filter((r) =>
            norm(r.fields?.Nombre) === nombreBuscado && Number(r.fields?.Dorsal) === dorsalBuscado);
          if (candidatos.length !== 1) return j({ ok: false, reason: "hijo_no_encontrado" }, 404);
          const hijoRec = candidatos[0].id;
          const d = await create(T_USUARIOS, {
            [U.nombre]: b.name, [U.email]: email, [U.rol]: "Familia", [U.estado]: "Pendiente",
            [U.pass]: await hashPassword(String(b.password || "")),
            [U.club]: [clubId], [U.equipo]: [teamRec], [U.hijo]: [hijoRec],
          });
          return j({
            ok: !!d?.id, rec: d?.id, clubRec: clubId, teamRec, estado: "Pendiente", rol: "Familia", name: b.name,
            token: d?.id ? await firmarSesion({ id: d.id, email, rol: "familia", equipo: teamRec }) : null,
          }, d?.id ? 200 : 400);
        }

        /* --- Club nuevo: autoservicio, PERO nunca sobre un club que ya tiene
           gente dentro ---
           El nombre se elige de una lista de clubes ya existentes (para no
           duplicar), pero solo se puede "fundar" un club vacío: uno nuevo, o
           uno que el Master ya haya precreado con equipos pero sin nadie de
           alta todavía. Si el club elegido ya tiene algún usuario, esto NO es
           una vía de entrada — hace falta invitación, igual que para unirse a
           cualquier otro club con gente dentro. La plaza inicial es SIEMPRE 1
           (gratis): si se eligió un plan de pago, el límite real solo lo sube
           el webhook de Stripe cuando el cobro se confirma, nunca lo que
           declare el propio formulario. */
        if (fundaClub) {
          if (previo) return j({ ok: false, reason: "exists" });
          if (!b.club) return j({ ok: false, reason: "falta_club" }, 400);
          const clubs = await list(T_CLUBES);
          const existente = clubs.find((c) => norm(c.fields[CL.nombre]) === norm(b.club));
          if (existente) {
            const ocupado = recs.some((r) => (r.fields[U.club] || []).includes(existente.id));
            if (ocupado) return j({ ok: false, reason: "club_ocupado" }, 409);
          }
          const clubId = existente
            ? existente.id
            : (await create(T_CLUBES, { [CL.nombre]: b.club, [CL.comunidad]: b.comunidad || "", [CL.limite]: 1 }))?.id;
          if (!clubId) return j({ ok: false, reason: "error" }, 400);
          if (existente && !(Number(existente.fields[CL.limite]) > 0)) {
            /* club precreado por el Master sin límite fijado: arranca en 1 hasta que pague */
            await fetch(`${table(T_CLUBES)}/${clubId}`, { method: "PATCH", headers: H, body: JSON.stringify({ fields: { [CL.limite]: 1 }, typecast: true }) });
          }
          const eqsDelClub = (await list(T_EQUIPOS)).filter((e) => (e.fields[EQ.club] || []).includes(clubId));
          let eqId = eqsDelClub[0]?.id;
          if (!eqId) {
            eqId = (await create(T_EQUIPOS, {
              [EQ.nombre]: b.team?.name || "Primer equipo",
              [EQ.categoria]: CAT_LABEL[b.team?.cat] || "Infantil",
              [EQ.formato]: b.team?.f7 ? "Fútbol 7" : "Fútbol 11",
              [EQ.club]: [clubId],
            }))?.id;
          }
          /* Quien funda el club ES el club, no su director deportivo. Antes se
             le daba de alta como director y el club se quedaba sin cuenta
             propia: no había nadie por encima que pudiera nombrar al director,
             cambiarle el nivel o darlo de baja. Ahora entra como Club y desde
             ahí invita a su director. Las cuentas de director ya existentes no
             se tocan: esto solo afecta a los clubes que se registren a partir
             de ahora. */
          const d = await create(T_USUARIOS, {
            [U.nombre]: b.name, [U.email]: email, [U.rol]: "Club", [U.estado]: "Activo",
            [U.plan]: "Oficial", [U.pass]: await hashPassword(String(b.password || "")), [U.prueba]: fechaTrial30(),
            [U.club]: [clubId], ...(eqId ? { [U.equipo]: [eqId] } : {}),
          });
          const [eqsF, clubsF] = await Promise.all([list(T_EQUIPOS), list(T_CLUBES)]);
          const eqF = eqsF.find((e) => e.id === eqId);
          return j({
            ok: !!d?.id, rec: d?.id, clubRec: clubId, teamRec: eqId, estado: "Activo", rol: "Club", name: b.name,
            token: d?.id ? await firmarSesion({ id: d.id, email, rol: "club", equipo: eqId || null }) : null,
            team: eqF ? teamOut(eqF, clubsF) : null,
          }, d?.id ? 200 : 400);
        }

        /* --- Cuenta de club: SOLO por invitación ---
           Un entrenador ya no puede meterse solo en un equipo oficial. Tiene que
           existir una ficha creada antes por el director deportivo o el Master;
           al registrarse la reclama poniéndole contraseña. */
        if (!independent) {
          if (!previo) return j({ ok: false, reason: "sin_invitacion" });
          if (previo.fields[U.pass]) return j({ ok: false, reason: "exists" });
          const eqIdPrev = (previo.fields[U.equipo] || [])[0] || null;
          const clubIdPrev = (previo.fields[U.club] || [])[0] || null;
          const r = await fetch(`${table(T_USUARIOS)}/${previo.id}`, {
            method: "PATCH", headers: H,
            body: JSON.stringify({ fields: {
              [U.pass]: await hashPassword(String(b.password || "")),
              [U.estado]: "Activo",
              ...(b.name ? { [U.nombre]: b.name } : {}),
            }, typecast: true }),
          });
          if (!r.ok) return j({ ok: false, reason: "error" }, 400);
          const [eqs2, clubs2] = await Promise.all([list(T_EQUIPOS), list(T_CLUBES)]);
          const eq2 = eqs2.find((e) => e.id === eqIdPrev);
          return j({
            ok: true, rec: previo.id, clubRec: clubIdPrev, teamRec: eqIdPrev, estado: "Activo",
            rol: previo.fields[U.rol] || "",
            name: b.name || previo.fields[U.nombre] || "",
            token: await firmarSesion({ id: previo.id, email, rol: norm(previo.fields[U.rol]), equipo: eqIdPrev, rolesExtra: rolesExtraKeys(previo.fields[U.rolesExtra]) }),
            team: eq2 ? teamOut(eq2, clubs2) : null,
          });
        }

        /* --- Cuenta personal (plan gratis): sigue siendo libre --- */
        if (previo) return j({ ok: false, reason: "exists" });
        const clubs = await list(T_CLUBES);
        let clubId: string | undefined;
        if (b.club) {
          const hit = clubs.find((c) => norm(c.fields[CL.nombre]) === norm(b.club));
          clubId = hit ? hit.id : (await create(T_CLUBES, { [CL.nombre]: b.club, [CL.comunidad]: b.comunidad || "" }))?.id;
        }
        let eqId: string | undefined;
        if (b.team?.name) {
          const eqs = await list(T_EQUIPOS);
          const hit = eqs.find((e) => norm(e.fields[EQ.nombre]) === norm(b.team.name) &&
            (!clubId || (e.fields[EQ.club] || []).includes(clubId)));
          eqId = hit ? hit.id : (await create(T_EQUIPOS, {
            [EQ.nombre]: b.team.name, [EQ.categoria]: CAT_LABEL[b.team.cat] || "Infantil",
            [EQ.formato]: b.team.f7 ? "Fútbol 7" : "Fútbol 11", ...(clubId ? { [EQ.club]: [clubId] } : {}),
          }))?.id;
        }
        const d = await create(T_USUARIOS, {
          [U.nombre]: b.name, [U.email]: email, [U.rol]: "Entrenador principal", [U.estado]: "Activo",
          [U.plan]: "Gratis", [U.pass]: await hashPassword(String(b.password || "")), [U.prueba]: fechaTrial30(),
          ...(clubId ? { [U.club]: [clubId] } : {}), ...(eqId ? { [U.equipo]: [eqId] } : {}),
        });
        const eqs3 = await list(T_EQUIPOS);
        const eq3 = eqs3.find((t) => t.id === eqId);
        return j({ ok: !!d?.id, rec: d?.id, clubRec: clubId, teamRec: eqId, estado: "Activo",
          rol: "Entrenador principal", name: b.name,
          token: d?.id ? await firmarSesion({ id: d.id, email, rol: "entrenador", equipo: eqId || null }) : null,
          team: eq3 ? teamOut(eq3, clubs) : null }, d?.id ? 200 : 400);
      }

      return j({ ok: false, reason: "bad_request" }, 400);
    }

    if (req.method === "GET") {
      /* Nombre, email y rol de cada persona son datos reales de personas, no
         solo de equipo: antes cualquier sesión con token -incluida la demo-
         podía listar TODO el personal de CUALQUIER equipo, o de la app
         entera si no mandaba ninguno. Ahora hace falta el mismo alcance que
         para cualquier otro dato de equipo. */
      const requestedTeam = url.searchParams.get("team") || "";
      const requestedClub = url.searchParams.get("club") || "";
      /* Por CLUB o por EQUIPO. La dirección del club necesita a todo su cuerpo
         técnico, no solo el de una categoría: pidiéndolo por equipo, el club
         solo veía a la gente de la categoría en la que estuviera, y a su propia
         cuenta —que no tiene por qué estar en ninguna— no la veía nunca. */
      if (!requestedTeam && !requestedClub) return j({ error: "falta_equipo" }, 400);
      let filtro: (rec: any) => boolean;
      if (requestedClub) {
        if (!(await puedeClub(requestedClub))) {
          return j({ error: "no_autorizado", reason: "No tienes acceso a los usuarios de ese club." }, 403);
        }
        filtro = (rec) => (rec.fields[U.club] || []).includes(requestedClub);
      } else {
        if (!(await puedeEquipo(requestedTeam))) {
          return j({ error: "no_autorizado", reason: "No tienes acceso a los usuarios de ese equipo." }, 403);
        }
        filtro = (rec) => (rec.fields[U.equipo] || []).includes(requestedTeam);
      }
      const eqsNombre = new Map((await list(T_EQUIPOS)).map((e: any) => [e.id, e.fields[EQ.nombre] || ""]));
      const rows = (await allUsers()).filter(filtro)
        /* El Master es la cuenta de EBLDigital, no cuerpo técnico de nadie: no
           tiene por qué salir en la plantilla de un club. */
        .filter((rec) => rolReal(rec.fields[U.rol], rec.fields[U.email]) !== "master")
        .map((rec) => ({
          id: rec.id, name: rec.fields[U.nombre] || "", email: rec.fields[U.email] || "",
          rol: rec.fields[U.rol] || "", estado: rec.fields[U.estado] || "", teamRec: (rec.fields[U.equipo] || [])[0] || null,
          teamName: eqsNombre.get((rec.fields[U.equipo] || [])[0]) || "",
          rolesExtra: rolesExtraKeys(rec.fields[U.rolesExtra]),
          parteMat: !!rec.fields[U.parteMat],
          faltas: rec.fields[U.faltas] || "",
        }));
      return j({ records: rows });
    }

    if (req.method === "PATCH" && id) {
      /* Cambiar el rol o el estado de alguien es justo el tipo de escritura
         que más hay que vigilar: antes cualquier sesión con un token válido
         -incluido el pase de la demo- podía ascender a cualquiera a Director
         o reactivar una cuenta que el club había suspendido, con solo mandar
         su id. Aquí se exige lo mismo que ya exige dar de alta (createUser):
         el rol que se pide tiene que estar entre los que este rol reparte, y
         el objetivo tiene que ser de tu propio club -salvo que seas Master,
         que administra cualquiera. */
      const puedeAsignar = ASIGNABLES[rolKey(sesion?.rol)] || [];
      if (puedeAsignar.length === 0) return j({ ok: false, reason: "no_autorizado" }, 403);
      const b = await req.json();
      const fields: Record<string, unknown> = {};
      if (b.rol) {
        const pedido = rolKey(b.rol);
        if (!puedeAsignar.includes(pedido)) return j({ ok: false, reason: "rol_no_permitido" }, 403);
        fields[U.rol] = b.rol;
      }
      if (Array.isArray(b.rolesExtra)) {
        const extras = b.rolesExtra.map((x: unknown) => rolKey(x)).filter((k: string) => puedeAsignar.includes(k));
        fields[U.rolesExtra] = extras.map((k: string) => ROL_LABEL[k]);
      }
      if (b.estado) fields[U.estado] = b.estado;
      /* Cambiar de categoría a alguien del cuerpo técnico. Faltaba: el club
         podía cambiarle el rol y el estado, pero no moverlo del Infantil B al
         Cadete A, que es lo primero que se hace cada temporada. Es de la
         dirección del club —un entrenador no reparte a la gente por las
         categorías— y la categoría de destino tiene que ser de SU club: si no,
         bastaría con mandar el id de un equipo ajeno para colar a alguien
         dentro de otro club. */
      if (b.equipoRec !== undefined) {
        if (!dirigeElClub(sesion)) return j({ ok: false, reason: "no_autorizado" }, 403);
        const destino = String(b.equipoRec || "");
        if (destino) {
          if (!(await puedeEquipo(destino))) return j({ ok: false, reason: "equipo_ajeno" }, 403);
          fields[U.equipo] = [destino];
        } else {
          fields[U.equipo] = [];
        }
      }
      /* Faltas de material anotadas por el club. Solo la dirección: el sentido
         de esto es que el entrenador no pueda borrarse la suya. Se guarda el
         JSON entero tal cual llega, con un tope para que una petición a mano no
         pueda dejar la celda inservible. */
      if (b.faltas !== undefined) {
        if (!dirigeElClub(sesion)) return j({ ok: false, reason: "no_autorizado" }, 403);
        const crudo = String(b.faltas || "");
        if (crudo.length > 20000) return j({ ok: false, reason: "faltas_largas" }, 400);
        try { if (crudo && !Array.isArray(JSON.parse(crudo))) throw new Error("no es lista"); }
        catch { return j({ ok: false, reason: "faltas_invalidas" }, 400); }
        fields[U.faltas] = crudo;
      }
      /* La pestaña propia de Control de material del director deportivo. Es
         opcional y se la pone él: solo se acepta sobre la propia ficha —o
         desde el Master—, para que un director no se la imponga a otro. */
      if (b.parteMat !== undefined) {
        if (!esMaster && id !== sesion?.id) return j({ ok: false, reason: "no_autorizado" }, 403);
        fields[U.parteMat] = !!b.parteMat;
      }
      if (!esMaster) {
        const recs = await allUsers();
        const yo = recs.find((r) => r.id === sesion?.id);
        const objetivo = recs.find((r) => r.id === id);
        const clubYo = (yo?.fields[U.club] || [])[0] || null;
        const clubObjetivo = (objetivo?.fields[U.club] || [])[0] || null;
        if (!clubYo || !clubObjetivo || clubYo !== clubObjetivo) {
          return j({ ok: false, reason: "no_autorizado" }, 403);
        }
      }
      const r = await fetch(`${api}/${id}`, { method: "PATCH", headers: H, body: JSON.stringify({ fields, typecast: true }) });
      return j({ ok: r.ok }, r.ok ? 200 : 400);
    }

    if (req.method === "DELETE" && id) {
      const r = await fetch(`${api}/${id}`, { method: "DELETE", headers: H });
      return j({ ok: r.ok }, r.ok ? 200 : 400);
    }

    return j({ error: "Petición no soportada" }, 400);
  } catch (e) {
    return j({ error: String(e) }, 500);
  }
};
