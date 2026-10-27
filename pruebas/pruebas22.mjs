/* Sumar al club a un entrenador que ya tenía cuenta por su cuenta (plan
   personal, con su propio "club"): el alta normal le dice que el correo ya
   existe, así que el club le deja una invitación y él la acepta al entrar. */
import { login, call, fake, T } from "./run.mjs";
let ok = 0, mal = 0;
const dice = (n, c, e = "") => { (c ? ok++ : mal++); console.log(`${c ? "✓" : "✗"} ${n}${e ? "  → " + e : ""}`); };
const POST = (token, body) => call("", { method: "POST", token, body });
const invitar = (token, extra = {}) => POST(token, { action: "invitarAlClub", email: "yen@x.com", rol: "Entrenador principal", clubRec: "recCLUBA", teamRec: "recIB", ...extra });

let r = await POST("", { action: "register", plan: "gratis", name: "Yen Prueba", email: "yen@x.com", password: "coach1234", club: "Mi equipo", team: { name: "Alevín A", cat: "alevin" } });
dice("Yen se registra por su cuenta", r.body.ok === true && !!r.body.token, JSON.stringify(r.body).slice(0, 160));
let tYen = r.body.token;
const clubYen = r.body.clubRec, equipoYen = r.body.teamRec;

const tClub = await login("club@a.com"), tDir = await login("dir@a.com"), tEnt = await login("ent@a.com"), tDirB = await login("dir@b.com");

r = await POST(tClub, { action: "createUser", name: "Yen", email: "yen@x.com", rol: "Entrenador principal", clubRec: "recCLUBA", teamRec: "recIB" });
dice("el alta normal sigue diciendo que el correo ya existe", r.body.reason === "exists", JSON.stringify(r.body));

r = await invitar(tEnt);
dice("un entrenador no puede invitar al club", r.status === 403, JSON.stringify(r.body));
r = await invitar(tDirB);
dice("el director de otro club no puede invitar a este", r.status === 403, JSON.stringify(r.body));
r = await invitar(tClub, { teamRec: "recOTRO" });
dice("la categoría tiene que ser del club", r.status === 400 && r.body.reason === "equipo_no_valido", JSON.stringify(r.body));
r = await invitar(tClub, { rol: "Director deportivo" });
dice("no se invita como director: solo cuerpo técnico", r.status === 403 && r.body.reason === "rol_no_permitido", JSON.stringify(r.body));
r = await invitar(tClub, { email: "nadie@x.com" });
dice("un correo sin cuenta: hay que darlo de alta normal", r.body.reason === "no_existe", JSON.stringify(r.body));
r = await invitar(tClub, { email: "ent@a.com" });
dice("quien ya está en el club no se invita", r.body.reason === "ya_en_club", JSON.stringify(r.body));
r = await invitar(tClub, { email: "dir@b.com" });
dice("un director no es invitable", r.status === 409 && r.body.reason === "no_invitable", JSON.stringify(r.body));
r = await POST(tDirB, { action: "createUser", name: "Ent B", email: "entb@b.com", rol: "Entrenador principal", clubRec: "recCLUBB", teamRec: "recOTRO" });
r = await invitar(tClub, { email: "entb@b.com" });
dice("a un entrenador de otro club con dirección no se le puede llevar", r.status === 409 && r.body.reason === "otro_club", JSON.stringify(r.body));

/* Con Supabase, fake.db se rehace tras cada llamada: el club se busca cada
   vez, no se guarda la fila de antes. 0 = sin límite. */
const fijarLimite = (n) => { fake.db[T.CLUBES].find((c) => c.id === "recCLUBA").fields.fldiIev3Pd9eWhulJ = n; };
fijarLimite(fake.db[T.USUARIOS].filter((u) => (u.fields.fldV2DDL6v5szs0y3 || []).includes("recCLUBA")).length);
r = await invitar(tClub);
dice("con las plazas llenas no se invita", r.status === 403 && r.body.reason === "limite_alcanzado", JSON.stringify(r.body));
fijarLimite(0);

r = await invitar(tClub, { email: "  YEN@x.com " });
dice("el club invita a Yen (el correo da igual en mayúsculas)", r.body.ok === true, JSON.stringify(r.body));

r = await call("?res=usuarios&club=recCLUBA", { token: tClub });
const inv = r.body.invitados || [];
dice("el club la ve como invitación pendiente, no como usuario", inv.length === 1 && inv[0].email === "yen@x.com" && inv[0].teamName === "Infantil B" &&
  !(r.body.records || []).some((u) => u.email === "yen@x.com"), JSON.stringify(inv));

r = await POST("", { action: "login", email: "yen@x.com", password: "coach1234" });
tYen = r.body.token;
const vi = r.body.user?.invitacion;
dice("al entrar, Yen ve la invitación con el club, la categoría y el rol", vi?.club === "C.D. Chamartín Vergara" && vi?.equipo === "Infantil B" && vi?.rol === "Entrenador principal" && !!vi?.por,
  JSON.stringify(vi));
dice("y mientras no acepta sigue en su equipo", r.body.user?.clubRec === clubYen && r.body.user?.team?.rec === equipoYen);
r = await call("?res=jugadores&team=recIB", { token: tYen });
dice("sin aceptar no ve nada del Infantil B", r.status === 403, String(r.status));

r = await POST(tEnt, { action: "responderInvitacionClub", aceptar: true });
dice("quien no tiene invitación no puede aceptar nada", r.status === 404, JSON.stringify(r.body));

r = await POST(tYen, { action: "responderInvitacionClub", aceptar: true });
dice("Yen acepta", r.body.ok === true, JSON.stringify(r.body));
r = await call("?res=yo", { token: tYen });
const u = r.body.user || {};
dice("ya es del club, entrena el Infantil B y su cuenta es la del club", u.clubRec === "recCLUBA" && u.team?.rec === "recIB" && u.rol === "Entrenador principal" && u.plan === "Oficial" && !u.invitacion,
  JSON.stringify({ c: u.clubRec, t: u.team?.rec, rol: u.rol, plan: u.plan, inv: u.invitacion }));
const tYen2 = r.body.token;
r = await call("?res=jugadores&team=recIB", { token: tYen2 });
dice("con la sesión nueva ya ve su plantilla", r.status === 200, String(r.status));
r = await call("?res=usuarios&club=recCLUBA", { token: tDir });
dice("y sale en el cuerpo técnico del club, sin invitación pendiente", (r.body.records || []).some((x) => x.email === "yen@x.com") && (r.body.invitados || []).length === 0);
r = await POST(tYen2, { action: "responderInvitacionClub", aceptar: true });
dice("la invitación ya no vale una segunda vez", r.status === 404);
r = await invitar(tClub);
dice("y ya no se la puede volver a invitar", r.body.reason === "ya_en_club");

/* Rechazar y anular */
r = await POST("", { action: "register", plan: "gratis", name: "Otra", email: "otra@x.com", password: "coach1234", club: "Mi equipo", team: { name: "Alevín A", cat: "alevin" } });
const tOtra = r.body.token;
r = await invitar(tDir, { email: "otra@x.com", rol: "Segundo entrenador" });
dice("el director también puede invitar (aquí, de segundo)", r.body.ok === true, JSON.stringify(r.body));
r = await POST(tOtra, { action: "responderInvitacionClub", aceptar: false });
dice("ella la rechaza", r.body.ok === true);
r = await call("?res=yo", { token: tOtra });
dice("y sigue en lo suyo, sin invitación", r.body.user?.clubRec !== "recCLUBA" && !r.body.user?.invitacion, JSON.stringify(r.body.user?.invitacion));

r = await invitar(tClub, { email: "otra@x.com" });
r = await call("?res=usuarios&club=recCLUBA", { token: tClub });
const pendiente = (r.body.invitados || []).find((x) => x.email === "otra@x.com");
r = await POST(tDirB, { action: "anularInvitacionClub", usuarioRec: pendiente?.id });
dice("otro club no puede anularla", r.status === 403, JSON.stringify(r.body));
r = await POST(tClub, { action: "anularInvitacionClub", usuarioRec: pendiente?.id });
dice("el club la anula", r.body.ok === true, JSON.stringify(r.body));
r = await call("?res=yo", { token: tOtra });
dice("y a ella ya no le sale", !r.body.user?.invitacion);

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
