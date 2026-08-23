import { fake, login, call, T } from "./run.mjs";
let ok=0, mal=0;
const dice=(n,c,e="")=>{(c?ok++:mal++);console.log(`${c?"✓":"✗"} ${n}${e?"  → "+e:""}`);};
const tDir=await login("dir@a.com"), tEnt=await login("ent@a.com"), tDirB=await login("dir@b.com");
const F=(tabla,rec)=>fake.db[tabla].find(x=>x.id===rec).fields;

/* ---- Sanciones del parte: las pone el club, no el entrenador ---- */
let r=await call("?res=parte-sancion&id=recPA1",{method:"PATCH",token:tEnt,body:{tarde:true,minutosTarde:15}});
dice("el entrenador NO se sanciona a sí mismo", r.status===403, String(r.status));
r=await call("?res=parte-sancion&id=recPA1",{method:"PATCH",token:tDirB,body:{tarde:true}});
dice("un director de otro club tampoco", r.status===403, String(r.status));
r=await call("?res=parte-sancion&id=recPA1",{method:"PATCH",token:tDir,body:{tarde:true,minutosTarde:15,telefono:true,penalizaciones:"Dejó los conos"}});
dice("el director SÍ la anota", r.body.ok===true);
dice("queda escrita en el parte", F(T.PARTES,"recPA1").fldPr3SR2b6PUIQUh===true && F(T.PARTES,"recPA1").fldoEoWloaBFd2VOT===15);

/* y el entrenador no puede borrársela reenviando el parte */
r=await call("?res=partes&id=recPA1",{method:"PATCH",token:tEnt,body:{fields:{"Entrenador tarde":false,"Minutos tarde":0,"Uso del telefono":false,"Balones salida":12}}});
dice("reenviar el parte NO borra la sanción",
  F(T.PARTES,"recPA1").fldPr3SR2b6PUIQUh===true && F(T.PARTES,"recPA1").fldoEoWloaBFd2VOT===15, JSON.stringify(r.body));

/* ---- Días de entreno: los guarda el equipo, normalizados ---- */
r=await call("?res=equipos&id=recSEN",{method:"PATCH",token:tEnt,body:{dias:[4,2,2,9,-1,"3"]}});
dice("el cuerpo técnico guarda los días de entreno", r.body.ok===true, JSON.stringify(r.body));
dice("y llegan limpios y ordenados", F(T.EQUIPOS,"recSEN").flddC2z6uAHNSaGXX==="[2,3,4]", F(T.EQUIPOS,"recSEN").flddC2z6uAHNSaGXX);
r=await call("?res=equipos&id=recOTRO",{method:"PATCH",token:tEnt,body:{dias:[1]}});
dice("no puede tocar los de otro club", r.status===403, String(r.status));

/* ---- Encargado de material: solo dirección del club ---- */
r=await call("?res=equipos&id=recIB",{method:"PATCH",token:tEnt,body:{encargado:"Yo Mismo"}});
dice("el entrenador no nombra encargado", !F(T.EQUIPOS,"recIB").fld23b31P4y079j77, F(T.EQUIPOS,"recIB").fld23b31P4y079j77||"(vacío)");
r=await call("?res=equipos&id=recIB",{method:"PATCH",token:tDir,body:{encargado:"Luis García"}});
dice("el director sí", F(T.EQUIPOS,"recIB").fld23b31P4y079j77==="Luis García");

/* ---- Pestaña de material del director: solo sobre su propia ficha ---- */
r=await call("?id=recENT",{method:"PATCH",token:tDir,body:{parteMat:true}});
dice("no se le impone a otro", r.status===403 || !F(T.USUARIOS,"recENT").fld4okYQmHxbEQ6C8, String(r.status));
r=await call("?id=recDIR",{method:"PATCH",token:tDir,body:{parteMat:true}});
dice("sobre la suya sí", F(T.USUARIOS,"recDIR").fld4okYQmHxbEQ6C8===true);

/* ---- Ficha para el rival ---- */
r=await call("?res=ficha&id=recP1",{method:"POST",token:tDirB,body:{club:"x"}});
dice("un club ajeno no publica ficha", r.status===403, String(r.status));
r=await call("?res=ficha&id=recP1",{method:"POST",token:tEnt,body:{
  club:"C.D. Chamartín Vergara", equipo:"Senior A", fecha:"2026-09-26", hora:"11:30", jornada:"1",
  local:"Chamartín Senior A", visitante:"Rival", lugar:"La Concepción", sistema:"4-3-3",
  convocados:[{d:1,n:"Ana",p:"POR",tel:"600111222",nac:"2012-04-01",estado:"lesionado"}],
  once:[{d:1,n:"Ana",p:"POR",s:"POR",foto:"http://x/a.jpg"}]}});
dice("el entrenador publica la ficha", r.body.ok===true && !!r.body.token, JSON.stringify(r.body.reason||""));
const tk=r.body.token;
dice("el código tiene 32 caracteres", (tk||"").length===32, String((tk||"").length));
const guardada=JSON.parse(F(T.PARTIDOS,"recP1").fldTCEB7wCHsidFMN);
dice("del jugador solo salen dorsal, nombre y posición",
  JSON.stringify(Object.keys(guardada.convocados[0]).sort())==='["d","n","p"]', JSON.stringify(guardada.convocados[0]));
dice("y del titular, esos tres más la demarcación",
  JSON.stringify(Object.keys(guardada.once[0]).sort())==='["d","n","p","s"]', JSON.stringify(guardada.once[0]));
dice("teléfono, fecha de nacimiento y estado NO viajan",
  !JSON.stringify(guardada).includes("600111222") && !JSON.stringify(guardada).includes("2012-04-01") && !JSON.stringify(guardada).includes("lesionado"));

r=await call(`?res=ficha&t=${tk}`);
dice("el rival la abre SIN sesión", r.body.ok===true && r.body.ficha?.local==="Chamartín Senior A");
r=await call("?res=ficha&t=corto");
dice("un código corto no abre nada", r.status===404, String(r.status));
r=await call("?res=ficha&t="+"z".repeat(32));
dice("un código que no existe tampoco", r.status===404, String(r.status));

const tk2=(await call("?res=ficha&id=recP1",{method:"POST",token:tEnt,body:{club:"x",convocados:[],once:[]}})).body.token;
dice("volver a publicar NO cambia el enlace", tk2===tk);
r=await call("?res=ficha&id=recP1",{method:"DELETE",token:tEnt});
dice("se puede retirar", r.body.ok===true);
r=await call(`?res=ficha&t=${tk}`);
dice("y el enlace muere al momento", r.status===404, String(r.status));

/* ---- Foto del material: la prueba de todo el módulo ---- */
r=await call("?res=parte-foto&id=recPA1&campo=salida",{method:"POST",token:tEnt,body:{file:"AAA",contentType:"image/jpeg"}});
dice("el entrenador SÍ puede subir la foto de su parte", r.status!==403, `${r.status} ${r.body.reason||""}`);
r=await call("?res=parte-foto&id=recPA1&campo=salida",{method:"POST",token:tDirB,body:{file:"AAA"}});
dice("uno de otro club no", r.status===403, String(r.status));

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal?1:0);
