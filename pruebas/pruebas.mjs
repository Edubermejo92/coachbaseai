import { fake, login, call, T } from "./run.mjs";
let ok=0, mal=0;
const dice = (nombre, cond, extra="") => { (cond?ok++:mal++); console.log(`${cond?"✓":"✗"} ${nombre}${extra?"  → "+extra:""}`); };

const tDir  = await login("dir@a.com");    // director del Chamartín
const tEnt  = await login("ent@a.com");    // entrenador del Senior A
const tDirB = await login("dir@b.com");    // director de OTRO club
dice("los tres inician sesión", !!tDir && !!tEnt && !!tDirB);

/* ---- 1. Crear categoría: solo dentro del club propio, y sin fundar clubes ---- */
let r = await call("?res=equipos", { method:"POST", token:tDir, body:{ name:"Cadete B", cat:"cadete", clubRec:"recCLUBB" } });
dice("el director NO puede crear en otro club", r.status===403, `${r.status} ${r.body.reason||""}`);

r = await call("?res=equipos", { method:"POST", token:tDir, body:{ name:"Club Inventado FC", cat:"cadete", club:"Club Inventado FC" } });
const clubesTras = fake.db[T.CLUBES].length;
dice("el director NO puede fundar un club", clubesTras===2, `${clubesTras} clubes`);
const creada = fake.db[T.EQUIPOS].find(e=>e.fields.Nombre==="Club Inventado FC");
dice("y si crea, cuelga de SU club", !creada || creada.fields.Club[0]==="recCLUBA", creada?creada.fields.Club[0]:"—");

r = await call("?res=equipos", { method:"POST", token:tEnt, body:{ name:"Alevín A", cat:"alevin" } });
dice("un entrenador NO crea categorías", r.status===403, String(r.status));

/* ---- 2. Borrar categoría ---- */
r = await call("?res=equipos&id=recSEN", { method:"DELETE", token:tEnt });
dice("un entrenador NO borra categorías", r.status===403, String(r.status));

r = await call("?res=equipos&id=recOTRO", { method:"DELETE", token:tDir });
dice("el director NO borra la de otro club", r.status===403, String(r.status));

r = await call("?res=equipos&id=recIB", { method:"DELETE", token:tDir });
dice("no borra la categoría en la que trabaja", r.body.reason==="categoria_actual", r.body.reason||"");

r = await call("?res=equipos&id=recSEN", { method:"DELETE", token:tDir });
dice("primer paso: NO borra y devuelve el recuento", r.body.revision===true && fake.db[T.EQUIPOS].some(e=>e.id==="recSEN"));
dice("el recuento trae el nombre real", r.body.resumen?.nombre==="Senior A", r.body.resumen?.nombre||"(vacío)");
dice("cuenta los 19 jugadores", r.body.resumen?.jugadores===19, String(r.body.resumen?.jugadores));
dice("cuenta el partido y el parte", r.body.resumen?.partidos===1 && r.body.resumen?.partes===1);
dice("avisa del técnico que se queda sin categoría", r.body.resumen?.usuarios===1, String(r.body.resumen?.usuarios));

r = await call("?res=equipos&id=recSEN&confirmar=1&nombre=Senior%20B", { method:"DELETE", token:tDir });
dice("con el nombre equivocado NO borra", r.body.reason==="nombre_no_coincide" && fake.db[T.EQUIPOS].some(e=>e.id==="recSEN"));

r = await call("?res=equipos&id=recSEN&confirmar=1&nombre=Senior%20A", { method:"DELETE", token:tDir });
dice("con el nombre exacto SÍ borra", r.body.ok===true && !fake.db[T.EQUIPOS].some(e=>e.id==="recSEN"), JSON.stringify(r.body.reason||""));
dice("arrastra los 19 jugadores", fake.db[T.JUGADORES].length===0, String(fake.db[T.JUGADORES].length));
dice("arrastra el partido y el parte", fake.db[T.PARTIDOS].length===0 && fake.db[T.PARTES].length===0);
dice("NO borra al entrenador, lo deja sin categoría",
  fake.db[T.USUARIOS].some(u=>u.id==="recENT") && (fake.db[T.USUARIOS].find(u=>u.id==="recENT").fields.Equipo||[]).length===0);

r = await call("?res=equipos&id=recIB&confirmar=1&nombre=Infantil%20B", { method:"DELETE", token:tDir });
dice("no deja al club sin ninguna categoría", ["ultima_categoria","categoria_actual"].includes(r.body.reason), r.body.reason||"");

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal?1:0);
