import { fake, login, call, T } from "./run.mjs";
let ok=0, mal=0;
const dice=(n,c,e="")=>{(c?ok++:mal++);console.log(`${c?"✓":"✗"} ${n}${e?"  → "+e:""}`);};
const F=(t,r)=>fake.db[t].find(x=>x.id===r).fields;
const tClub=await login("club@a.com"), tDir=await login("dir@a.com"), tEnt=await login("ent@a.com");
dice("la cuenta de Club inicia sesión", !!tClub);

/* ---- Por encima del director: puede nombrarlo ---- */
let r=await call("",{method:"POST",token:tClub,body:{action:"createUser",name:"Nuevo Director",email:"nd@a.com",rol:"Director deportivo",clubRec:"recCLUBA",teamRec:"recIB"}});
dice("el club NO puede nombrar un segundo director si ya hay uno", r.body.reason==="director_unico", r.body.reason||JSON.stringify(r.body));
/* se suspende al actual y ya sí */
F(T.USUARIOS,"recDIR").fldEkbPe6UgCx0Lfy="Suspendido";
r=await call("",{method:"POST",token:tClub,body:{action:"createUser",name:"Nuevo Director",email:"nd@a.com",rol:"Director deportivo",clubRec:"recCLUBA",teamRec:"recIB"}});
dice("el club nombra director deportivo", r.body.ok===true, r.body.reason||"");
F(T.USUARIOS,"recDIR").fldEkbPe6UgCx0Lfy="Activo";

r=await call("?id=recENT",{method:"PATCH",token:tClub,body:{rol:"Director deportivo"}});
dice("el club le cambia el nivel a alguien", r.body.ok===true, JSON.stringify(r.body));
F(T.USUARIOS,"recENT").fldIWSWMiwFsxJBiY="Entrenador principal";

r=await call("",{method:"POST",token:tDir,body:{action:"createUser",name:"X",email:"x@a.com",rol:"Club",clubRec:"recCLUBA",teamRec:"recIB"}});
dice("un director NO puede crear una cuenta de Club", r.body.reason==="rol_no_permitido"||r.status===403, r.body.reason||String(r.status));

r=await call("",{method:"POST",token:tEnt,body:{action:"createUser",name:"Y",email:"y@a.com",rol:"Director deportivo",clubRec:"recCLUBA",teamRec:"recSEN"}});
dice("un entrenador tampoco nombra director", r.body.reason==="rol_no_permitido"||r.status===403, r.body.reason||String(r.status));

/* ---- Alcance: el club llega a todas sus categorías, y a ninguna ajena ---- */
r=await call("?res=equipos&id=recSEN",{method:"PATCH",token:tClub,body:{encargado:"Luis García"}});
dice("el club nombra encargado de material en otra categoría suya", F(T.EQUIPOS,"recSEN").fld23b31P4y079j77==="Luis García");
r=await call("?res=equipos&id=recOTRO",{method:"PATCH",token:tClub,body:{encargado:"Nadie"}});
dice("pero no toca las de otro club", r.status===403, String(r.status));

r=await call("?res=partes-club&club=recCLUBA",{token:tClub});
dice("el club ve el control de material de todo el club", Array.isArray(r.body.categorias), JSON.stringify(r.body).slice(0,60));
r=await call("?res=partes-club&club=recCLUBB",{token:tClub});
dice("y no el de otro club", r.status===403, String(r.status));

r=await call("?res=parte-sancion&id=recPA1",{method:"PATCH",token:tClub,body:{tarde:true}});
dice("el club anota sanciones", r.body.ok===true, JSON.stringify(r.body));

/* ---- Nadie del club reparte el rol Club: eso es del Master ----
   La regla de "una sola cuenta de club por club" vive detrás de esta puerta y
   se comprueba arriba con su gemela, la del director único: son el mismo
   trozo de código con el rol como parámetro. */
r=await call("",{method:"POST",token:tClub,body:{action:"createUser",name:"Otro Club",email:"otro@a.com",rol:"Club",clubRec:"recCLUBA",teamRec:"recIB"}});
dice("ni el propio club reparte el rol Club", r.body.reason==="rol_no_permitido", r.body.reason||JSON.stringify(r.body));

/* ---- Quien funda un club entra como Club, no como director ---- */
r=await call("",{method:"POST",body:{action:"register",name:"Fundador",email:"fun@nuevo.com",password:"coach1234",plan:"club",club:"C.D. Nuevo",comunidad:"Comunidad de Madrid",team:{name:"Infantil A",cat:"infantil"}}});
dice("quien funda un club entra como Club", r.body.rol==="Club", r.body.rol||JSON.stringify(r.body).slice(0,80));

/* ---- Contraseña inicial al dar de alta ---- */
r=await call("",{method:"POST",token:tClub,body:{action:"createUser",name:"Sin Clave",email:"sinclave@a.com",rol:"Entrenador principal",clubRec:"recCLUBA",teamRec:"recIB"}});
const sinClave=fake.db[T.USUARIOS].find(u=>u.fields.fldJWlJ17YuZNe4Jx==="sinclave@a.com");
dice("sin contraseña, la ficha queda Pendiente y sin clave",
  r.body.activa===false && sinClave.fields.fldEkbPe6UgCx0Lfy==="Pendiente" && !sinClave.fields.fldVX372lPNj7Bab8);

r=await call("",{method:"POST",token:tClub,body:{action:"createUser",name:"Con Clave",email:"conclave@a.com",rol:"Entrenador principal",clubRec:"recCLUBA",teamRec:"recIB",password:"ab"}});
dice("una contraseña de dos letras se rechaza", r.body.reason==="pass_corta", r.body.reason||"");

r=await call("",{method:"POST",token:tClub,body:{action:"createUser",name:"Con Clave",email:"conclave@a.com",rol:"Entrenador principal",clubRec:"recCLUBA",teamRec:"recIB",password:"chv12345"}});
const conClave=fake.db[T.USUARIOS].find(u=>u.fields.fldJWlJ17YuZNe4Jx==="conclave@a.com");
dice("con contraseña, la ficha entra ya Activa", r.body.activa===true && conClave.fields.fldEkbPe6UgCx0Lfy==="Activo");
dice("y la contraseña se guarda cifrada, no en claro",
  String(conClave.fields.fldVX372lPNj7Bab8||"").startsWith("pbkdf2$") && !String(conClave.fields.fldVX372lPNj7Bab8||"").includes("chv12345"),
  String(conClave.fields.fldVX372lPNj7Bab8||"").slice(0,22));
const tNuevo=await login("conclave@a.com","chv12345");
dice("y esa persona puede iniciar sesión al momento", !!tNuevo);

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal?1:0);
