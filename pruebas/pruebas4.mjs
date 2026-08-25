/* La cuenta del club SIN categoría asignada, mover gente entre categorías y
   las faltas de material que anota el club. Todo esto nació de que el club de
   verdad —Graciela— no tiene ningún equipo en su ficha, porque no entrena a
   ninguno, y la función resolvía "de qué club eres" mirando SOLO tu equipo. */
import { fake, login, call, T } from "./run.mjs";
let ok=0, mal=0;
const dice=(n,c,e="")=>{(c?ok++:mal++);console.log(`${c?"✓":"✗"} ${n}${e?"  → "+e:""}`);};
const F=(t,r)=>fake.db[t].find(x=>x.id===r).fields;

/* ---- El club de verdad no tiene equipo: se le quita, como en Airtable ---- */
delete F(T.USUARIOS,"recCLU").fldW8QHQvuOZv1zX8;
const tClub=await login("club@a.com"), tEnt=await login("ent@a.com");
dice("la cuenta de Club sin categoría inicia sesión", !!tClub);

let r=await call("?res=partes-club&club=recCLUBA",{token:tClub});
dice("y ve el control de material de su club", r.status===200 && Array.isArray(r.body.categorias),
  `${r.status} ${JSON.stringify(r.body).slice(0,70)}`);
dice("con sus dos categorías", (r.body.categorias||[]).length===2,
  (r.body.categorias||[]).map(c=>c.nombre).join(", "));
r=await call("?res=partes-club&club=recCLUBB",{token:tClub});
dice("y sigue sin ver el de otro club", r.status===403, String(r.status));

r=await call("?res=usuarios&club=recCLUBA",{token:tClub});
dice("y ve a su cuerpo técnico", (r.body.records||[]).length>0, String((r.body.records||[]).length));

/* ---- Mover a alguien de categoría ---- */
r=await call("?id=recENT",{method:"PATCH",token:tClub,body:{equipoRec:"recIB"}});
dice("el club mueve a un entrenador a otra categoría suya",
  r.body.ok===true && JSON.stringify(F(T.USUARIOS,"recENT").fldW8QHQvuOZv1zX8)==='["recIB"]',
  JSON.stringify(r.body));
r=await call("?id=recENT",{method:"PATCH",token:tClub,body:{equipoRec:"recOTRO"}});
dice("pero no a una categoría de otro club", r.status===403 && r.body.reason==="equipo_ajeno",
  `${r.status} ${r.body.reason||""}`);
dice("y el entrenador se queda donde estaba",
  JSON.stringify(F(T.USUARIOS,"recENT").fldW8QHQvuOZv1zX8)==='["recIB"]',
  JSON.stringify(F(T.USUARIOS,"recENT").fldW8QHQvuOZv1zX8));
r=await call("?id=recENT",{method:"PATCH",token:tEnt,body:{equipoRec:"recSEN"}});
dice("un entrenador no reparte a nadie por las categorías", r.status===403, `${r.status} ${r.body.reason||""}`);
r=await call("?id=recENT",{method:"PATCH",token:tClub,body:{equipoRec:"recSEN"}});
dice("y el club lo devuelve a la suya", r.body.ok===true, JSON.stringify(r.body));

/* ---- Faltas de material: las anota el club y el entrenador no se las quita ---- */
const falta=[{f:"2026-08-25",t:"balones",n:3,eq:"Senior A"}];
r=await call("?id=recENT",{method:"PATCH",token:tClub,body:{faltas:JSON.stringify(falta)}});
dice("el club anota una falta de balones", r.body.ok===true && F(T.USUARIOS,"recENT").fldqlZapTFUOOLaQl===JSON.stringify(falta),
  JSON.stringify(r.body));
r=await call("?id=recENT",{method:"PATCH",token:tEnt,body:{faltas:"[]"}});
dice("y el entrenador NO puede borrársela", r.status===403, `${r.status} ${r.body.reason||""}`);
dice("la falta sigue ahí", F(T.USUARIOS,"recENT").fldqlZapTFUOOLaQl===JSON.stringify(falta));

r=await call("?id=recENT",{method:"PATCH",token:tClub,body:{faltas:"{\"no\":\"es una lista\"}"}});
dice("un JSON que no es una lista se rechaza", r.status===400 && r.body.reason==="faltas_invalidas", r.body.reason||String(r.status));
r=await call("?id=recENT",{method:"PATCH",token:tClub,body:{faltas:"x".repeat(20001)}});
dice("y uno gigante también", r.status===400 && r.body.reason==="faltas_largas", r.body.reason||String(r.status));

r=await call("?res=usuarios&club=recCLUBA",{token:tClub});
const ent=(r.body.records||[]).find(u=>u.email==="ent@a.com");
dice("las faltas viajan en el listado de usuarios", ent?.faltas===JSON.stringify(falta), ent?.faltas||"(vacío)");
dice("y el equipo de cada uno también", ent?.teamName==="Senior A", ent?.teamName||"(vacío)");

/* ---- Marcar "no hizo fotos" ---- */
const dos=[...falta,{f:"2026-08-26",t:"fotos",eq:"Senior A"}];
r=await call("?id=recENT",{method:"PATCH",token:tClub,body:{faltas:JSON.stringify(dos)}});
dice("el club marca además que no hizo las fotos",
  JSON.parse(F(T.USUARIOS,"recENT").fldqlZapTFUOOLaQl).length===2, JSON.stringify(r.body));

/* ---- Quitar la categoría a alguien ---- */
r=await call("?id=recENT",{method:"PATCH",token:tClub,body:{equipoRec:""}});
dice("el club puede dejar a alguien sin categoría",
  r.body.ok===true && (F(T.USUARIOS,"recENT").fldW8QHQvuOZv1zX8||[]).length===0, JSON.stringify(r.body));

/* ---- Inscripciones pagadas: las marca el club, no el entrenador ---- */
r=await call("?res=jugadores&id=recJ0",{method:"PATCH",token:tClub,body:{fields:{"Inscripcion pagada":true,"Fecha inscripcion":"2026-08-25"}}});
dice("el club marca la inscripción de un jugador",
  r.body.ok===true && F(T.JUGADORES,"recJ0")["Inscripcion pagada"]===true, JSON.stringify(r.body));
dice("y queda la fecha", F(T.JUGADORES,"recJ0")["Fecha inscripcion"]==="2026-08-25", String(F(T.JUGADORES,"recJ0")["Fecha inscripcion"]));

r=await call("?res=jugadores&id=recJ1",{method:"PATCH",token:tEnt,body:{fields:{Nombre:"Jugador 2 editado","Inscripcion pagada":true}}});
dice("un entrenador SÍ edita al jugador", r.body.ok===true && F(T.JUGADORES,"recJ1").Nombre==="Jugador 2 editado", JSON.stringify(r.body));
dice("pero NO puede marcarle la inscripción", !F(T.JUGADORES,"recJ1")["Inscripcion pagada"],
  String(F(T.JUGADORES,"recJ1")["Inscripcion pagada"]));

r=await call("?res=jugadores&id=recJ0",{method:"PATCH",token:tEnt,body:{fields:{"Inscripcion pagada":false}}});
dice("ni desmarcar una ya pagada", F(T.JUGADORES,"recJ0")["Inscripcion pagada"]===true,
  String(F(T.JUGADORES,"recJ0")["Inscripcion pagada"]));

r=await call("?res=jugadores&id=recJ0",{method:"PATCH",token:tClub,body:{fields:{"Inscripcion pagada":false,"Fecha inscripcion":null}}});
dice("y el club sí la desmarca", !F(T.JUGADORES,"recJ0")["Inscripcion pagada"], JSON.stringify(r.body));

r=await call("?res=jugadores&team=recSEN",{token:tClub});
dice("el club lee la plantilla de una categoría suya", (r.body.records||[]).length===19, String((r.body.records||[]).length));

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
