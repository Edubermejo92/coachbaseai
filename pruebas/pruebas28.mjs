/* ABP · balón parado (src/abp.js).
   Seis situaciones -córner, falta y penalti, cada una a favor y en contra-
   con su colocación de salida. Lo que se comprueba aquí:
   · que las claves del córner siguen llamándose "ataque" y "defensa", que es
     lo que tienen guardado en la nube los equipos desde la primera versión;
   · que ninguna colocación de salida pone dos fichas tan juntas que no se
     puedan coger con el dedo, que es el motivo de que las tablas no estén a
     escala (una barrera de verdad son cuatro jugadores pegados);
   · que al jugador se le dice bien dónde le toca ponerse.
   Son funciones puras: no hace falta navegador ni la función de Netlify. */
import {
  JUGADAS_ABP, CLAVES_ABP, TABLAS_ABP, claveAbp, ladoDeAbp, jugadaDeAbp, ETIQUETA_JUGADA,
  nombreAbp, abpPorDefecto, abpConSlots, abpSoloPos, zonaAbp,
  profundidadAbp, abpATablero, tokensAbp3d, balonAbp,
  MISIONES_ABP, misionesDe, ETIQUETA_MISION, misionesLimpias, textoMision, MAX_NOTA_ABP,
  ABP_ANCHO, ABP_ALTO, ABP_CORTE, yAbp, yAbpU, yAbpInv,
} from "../src/abp.js";

let ok = 0, mal = 0;
const dice = (n, c, e = "") => { (c ? ok++ : mal++); console.log(`${c ? "✓" : "✗"} ${n}${e ? "  → " + e : ""}`); };

/* ---------- las claves ---------- */
dice("el córner sigue siendo «ataque» y «defensa»",
  claveAbp("corner", "ataque") === "ataque" && claveAbp("corner", "defensa") === "defensa");
dice("la falta y el penalti tienen clave propia",
  claveAbp("falta", "ataque") === "faltaAtaque" && claveAbp("penalti", "defensa") === "penaltiDefensa");

const generadas = JUGADAS_ABP.flatMap((j) => ["ataque", "defensa"].map((l) => claveAbp(j, l)));
dice("las seis claves son exactamente las de CLAVES_ABP",
  JSON.stringify([...generadas].sort()) === JSON.stringify([...CLAVES_ABP].sort()), generadas.join(","));

dice("de cada clave se vuelve a sacar su lado y su jugada",
  generadas.every((k) => claveAbp(jugadaDeAbp(k), ladoDeAbp(k)) === k));
dice("cada jugada tiene etiqueta", JUGADAS_ABP.every((j) => !!ETIQUETA_JUGADA[j]));
dice("el nombre de la situación junta jugada y lado",
  nombreAbp((k) => k, "faltaDefensa") === "ln.abpFalta ln.abpDefensa", nombreAbp((k) => k, "faltaDefensa"));

/* ---------- las colocaciones de salida ---------- */
dice("hay una tabla por situación", CLAVES_ABP.every((k) => Array.isArray(TABLAS_ABP[k])));
dice("todas traen once sitios", CLAVES_ABP.every((k) => TABLAS_ABP[k].length === 11),
  CLAVES_ABP.map((k) => `${k}:${TABLAS_ABP[k].length}`).join(" "));
dice("ninguna coordenada se sale del campo",
  CLAVES_ABP.every((k) => TABLAS_ABP[k].every(([x, y]) => x >= 2 && x <= 98 && y >= 2 && y <= 98)));

/* ---------- el estirón del tablero ----------
   La portería y el área se ven más grandes sin que ninguna ficha cambie de
   sitio: lo que se estira es el dibujo, no las coordenadas. Por eso se
   comprueba por separado que `yAbp` solo cambia el dibujo y que lo guardado
   se puede volver a leer tal cual. */
dice("el fondo y el medio campo siguen siendo los extremos del tablero",
  yAbp(0) === 0 && yAbp(100) === 100);
dice("el borde del área cae más abajo que antes del estirón",
  yAbp(ABP_CORTE) > ABP_CORTE + 8, `${yAbp(ABP_CORTE).toFixed(1)}% en vez de ${ABP_CORTE}%`);
dice("el área se dibuja más alta de lo que era",
  (yAbpU(ABP_CORTE) - yAbpU(7.6)) / (174 - 26) > 1.4,
  `×${((yAbpU(ABP_CORTE) - yAbpU(7.6)) / (174 - 26)).toFixed(2)}`);
dice("la mitad de atrás conserva las mismas unidades de dibujo",
  Math.abs((yAbpU(100) - yAbpU(ABP_CORTE)) - (340 - 174)) < 0.5,
  `${(yAbpU(100) - yAbpU(ABP_CORTE)).toFixed(1)}u`);
dice("el dibujo no se adelanta ni se retrasa: a más profundidad, más abajo",
  Array.from({ length: 100 }, (_, i) => i).every((i) => yAbp(i) < yAbp(i + 1)));
dice("lo que pinta el tablero se vuelve a leer igual al arrastrar",
  [0, 7.6, 22.4, 36.8, 51.2, 60, 78, 94, 100].every((y) => Math.abs(yAbpInv(yAbp(y)) - y) < 1e-9));
dice("una profundidad rota no rompe el dibujo", yAbp("ni idea") === 0 && yAbp(undefined) === 0);

/* La regla del dedo: en un móvil de 390px de ancho el tablero mide
   390 × ABP_ALTO/ABP_ANCHO de alto y una ficha son 44px. Dos fichas a menos
   de eso se tapan y la de debajo no se puede arrastrar. Se mide sobre el
   tablero PINTADO -por `yAbp`-, que es lo que ve el dedo. */
const ANCHO = 390, ALTO = (390 * ABP_ALTO) / ABP_ANCHO, FICHA = 44;
for (const k of CLAVES_ABP) {
  let min = Infinity, par = "";
  const tabla = TABLAS_ABP[k];
  for (let i = 0; i < tabla.length; i++) for (let j = i + 1; j < tabla.length; j++) {
    const d = Math.hypot(((tabla[i][0] - tabla[j][0]) / 100) * ANCHO,
      ((yAbp(tabla[i][1]) - yAbp(tabla[j][1])) / 100) * ALTO);
    if (d < min) { min = d; par = `${i}-${j}`; }
  }
  dice(`en «${k}» se puede coger cada ficha con el dedo`, min >= FICHA, `${Math.round(min)}px entre ${par}`);
}
/* Y que el estirón no haya juntado a nadie: de la tabla al dibujo, ninguna
   pareja puede quedarse más cerca de lo que estaba. */
for (const k of CLAVES_ABP) {
  const tabla = TABLAS_ABP[k];
  let peor = 0, par = "";
  for (let i = 0; i < tabla.length; i++) for (let j = i + 1; j < tabla.length; j++) {
    const antes = Math.abs(tabla[i][1] - tabla[j][1]) * ((340 / 400) * ANCHO) / 100;
    const ahora = Math.abs(yAbp(tabla[i][1]) - yAbp(tabla[j][1])) * ALTO / 100;
    if (antes - ahora > peor) { peor = antes - ahora; par = `${i}-${j}`; }
  }
  dice(`el estirón no junta a nadie en «${k}»`, peor < 0.5, `${peor.toFixed(1)}px en ${par}`);
}

/* ---------- repartir las coordenadas entre los puestos ---------- */
const SLOTS11 = Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`s${i}`, { label: `P${i}`, x: 0, y: 0 }]));
const SLOTS7 = Object.fromEntries(Array.from({ length: 7 }, (_, i) => [`s${i}`, { label: `P${i}`, x: 0, y: 0 }]));
const porDef = abpPorDefecto("faltaDefensa", SLOTS11);
dice("cada puesto recibe su sitio, en orden",
  porDef.s0.x === TABLAS_ABP.faltaDefensa[0][0] && porDef.s10.y === TABLAS_ABP.faltaDefensa[10][1]);
dice("y conserva la demarcación del sistema", porDef.s3.label === "P3");
dice("en fútbol 7 sobran coordenadas y no pasa nada", Object.keys(abpPorDefecto("ataque", SLOTS7)).length === 7);
const SLOTS13 = { ...SLOTS11, s11: { label: "P11", x: 0, y: 0 }, s12: { label: "P12", x: 0, y: 0 } };
dice("con más puestos que coordenadas, los que sobran caen al frontal",
  abpPorDefecto("ataque", SLOTS13).s12.x === 50 && abpPorDefecto("ataque", SLOTS13).s12.y === 55);
dice("una situación desconocida no revienta: cae al córner a favor",
  abpPorDefecto("noExiste", SLOTS11).s0.x === TABLAS_ABP.ataque[0][0]);

/* ---------- lo guardado se cruza con el sistema de ahora ---------- */
const guardado = { s0: { x: 11, y: 22 }, sViejo: { x: 90, y: 90 } };
const cruzado = abpConSlots(guardado, SLOTS11, "ataque");
dice("se respeta el sitio guardado", cruzado.s0.x === 11 && cruzado.s0.y === 22);
dice("un puesto que ya no existe se descarta", !("sViejo" in cruzado));
dice("un puesto nuevo cae en su sitio por defecto", cruzado.s1.x === TABLAS_ABP.ataque[1][0]);
dice("la demarcación la pone el sistema, no lo guardado", cruzado.s0.label === "P0");
dice("sin nada guardado, la colocación de salida",
  abpConSlots(null, SLOTS11, "defensa").s0.y === TABLAS_ABP.defensa[0][1]);
dice("un sitio a medias se descarta y cae al de salida",
  abpConSlots({ s0: { x: 11 } }, SLOTS11, "ataque").s0.x === TABLAS_ABP.ataque[0][0]);
dice("a la nube solo viaja el sitio, no la demarcación",
  JSON.stringify(abpSoloPos({ s0: { label: "POR", x: 1, y: 2 } })) === '{"s0":{"x":1,"y":2}}');

/* ---------- dónde le toca ponerse, con palabras ---------- */
const zonas = [
  [50, 9, "abz.porteria", "el portero en la línea"],
  [8, 13, "abz.corner", "el que saca el córner"],
  [34, 18, "abz.paloIzq", "el primer palo"],
  [66, 18, "abz.paloDer", "el segundo palo"],
  [50, 18, "abz.areaPequena", "el área pequeña"],
  [50, 36, "abz.penalti", "el punto de penalti"],
  [80, 42, "abz.area", "dentro del área, escorado"],
  [50, 56, "abz.frontal", "el frontal"],
  [16, 54, "abz.bandaIzq", "la banda izquierda"],
  [84, 62, "abz.bandaDer", "la banda derecha"],
  [50, 78, "abz.lejos", "lejos del área"],
  [50, 94, "abz.atras", "el portero en la otra área"],
];
for (const [x, y, esperada, que] of zonas) {
  dice(`${que} se dice «${esperada.replace("abz.", "")}»`, zonaAbp(x, y) === esperada, zonaAbp(x, y));
}
/* El portero de cada situación tiene que leerse como portero -o como el de
   atrás del todo cuando la portería de arriba es la del rival-. */
dice("en las seis situaciones el portero se lee como portero",
  CLAVES_ABP.every((k) => ["abz.porteria", "abz.atras"].includes(zonaAbp(...TABLAS_ABP[k][0]))),
  CLAVES_ABP.map((k) => `${k}:${zonaAbp(...TABLAS_ABP[k][0])}`).join(" "));
/* Y ninguna ficha se queda sin frase. */
dice("ninguna ficha se queda sin zona",
  CLAVES_ABP.every((k) => TABLAS_ABP[k].every(([x, y]) => typeof zonaAbp(x, y) === "string" && zonaAbp(x, y).startsWith("abz."))));

/* ---------- el paso al 3D ----------
   El tablero 2D no está a escala -se estira a lo ancho para poder coger las
   fichas con el dedo-. Al llevarlo al campo 3D, de 105×68 m, el área tiene
   que medir lo que mide de verdad o la jugada sale deformada. */
const cerca = (a, b, tol = 0.15) => Math.abs(a - b) <= tol;
dice("la línea de gol está a 0 m", cerca(profundidadAbp(7.6), 0));
dice("el área pequeña, a 5,5 m", cerca(profundidadAbp(22.4), 5.5));
dice("el punto de penalti, a 11 m", cerca(profundidadAbp(36.8), 11), `${profundidadAbp(36.8).toFixed(2)} m`);
dice("el borde del área, a 16,5 m", cerca(profundidadAbp(51.2), 16.5));
dice("y el fondo del tablero, en el medio campo", cerca(profundidadAbp(97.6), 52.5));
dice("la profundidad nunca retrocede",
  Array.from({ length: 96 }, (_, i) => profundidadAbp(i + 2)).every((v, i, a) => i === 0 || v >= a[i - 1]));

const esq = abpATablero({ x: 2, y: 7.6 }), centro = abpATablero({ x: 50, y: 7.6 });
dice("la portería de la jugada es la de la derecha del tablero", Math.round(centro.x) === 988 && Math.round(centro.y) === 320,
  JSON.stringify(centro));
dice("el banderín de córner cae en la esquina", Math.round(esq.x) === 988 && Math.round(esq.y) === 12, JSON.stringify(esq));
dice("la otra banda, en la esquina de enfrente", Math.round(abpATablero({ x: 98, y: 7.6 }).y) === 628);
dice("el medio campo cae en el centro del tablero", Math.round(abpATablero({ x: 50, y: 97.6 }).x) === 500);

const posDemo = abpPorDefecto("ataque", SLOTS11);
const tk = tokensAbp3d(posDemo, (slot) => ({ s0: 1, s1: 2 })[slot] ?? "");
dice("salen once fichas para el 3D", tk.length === 11);
dice("todas son del equipo propio", tk.every((x) => x.type === "home"));
dice("cada ficha conserva su puesto como id", tk[0].id === "s0" && tk[1].id === "s1");
dice("y lleva el dorsal de quien ocupa ese puesto", tk[0].label === "1" && tk[1].label === "2" && tk[2].label === "");
dice("ninguna ficha se sale del campo del tablero",
  tk.every((x) => x.x >= 12 && x.x <= 988 && x.y >= 12 && x.y <= 628));

dice("en el penalti el balón va al punto de penalti",
  Math.round(balonAbp("penaltiAtaque").x) === 885 && Math.round(balonAbp("penaltiDefensa").y) === 320,
  JSON.stringify(balonAbp("penaltiAtaque")));
dice("en el córner, al banderín", Math.round(balonAbp("ataque").x) === 988 && Math.round(balonAbp("defensa").y) === 12);
dice("en una falta no se pinta balón: nadie sabe dónde se pitó",
  balonAbp("faltaAtaque") === null && balonAbp("faltaDefensa") === null);

/* ---------- la misión de cada puesto ----------
   Saber dónde ponerse es la mitad; la otra mitad es qué hacer ahí. Las
   listas van por lado porque "barrera" no pinta nada en un córner a favor
   y "bloquea al portero" no pinta nada defendiendo. */
dice("a favor y en contra no ofrecen lo mismo",
  misionesDe("ataque").join() !== misionesDe("defensa").join());
dice("la barrera solo se ofrece defendiendo",
  !misionesDe("ataque").includes("barrera") && misionesDe("faltaDefensa").includes("barrera"));
dice("bloquear al portero solo atacando",
  misionesDe("ataque").includes("bloquea") && !misionesDe("defensa").includes("bloquea"));
dice("el penalti tiene su propia lista",
  misionesDe("penaltiAtaque").includes("lanza") && misionesDe("penaltiDefensa").includes("para")
  && misionesDe("penaltiAtaque").join() === misionesDe("penaltiDefensa").join());
dice("la falta usa la misma lista que el córner del mismo lado",
  misionesDe("faltaAtaque").join() === misionesDe("ataque").join());
dice("ninguna situación se queda sin misiones", CLAVES_ABP.every((k) => misionesDe(k).length > 0));
dice("cada misión tiene su clave de traducción", ETIQUETA_MISION("zona") === "ab.zona");
dice("una situación desconocida no revienta", misionesDe("noExiste").length > 0);
dice("no hay misiones repetidas dentro de una lista",
  Object.values(MISIONES_ABP).every((l) => new Set(l).size === l.length));

/* Lo que se guarda: solo lo que el entrenador ha dicho de verdad. */
const SLOTS = { s0: 1, s1: 1, s2: 1 };
const sucio = {
  s0: { m: "primerPalo", n: "  entra desde atrás  " },
  s1: { m: "barrera" },                       /* no vale atacando */
  s2: { m: "", n: "   " },                    /* vacío del todo */
  sViejo: { m: "rechace" },                   /* puesto que ya no existe */
};
const limpio = misionesLimpias(sucio, "ataque", SLOTS);
dice("se queda la misión válida, con la nota recortada",
  limpio.s0?.m === "primerPalo" && limpio.s0?.n === "entra desde atrás", JSON.stringify(limpio.s0));
dice("una misión que no es de esta situación se descarta", limpio.s1 === undefined, JSON.stringify(limpio.s1));
dice("un puesto sin nada no se guarda", !("s2" in limpio));
dice("ni un puesto que ya no existe en el sistema", !("sViejo" in limpio));
dice("una nota sin misión sí se guarda: también es una instrucción",
  misionesLimpias({ s0: { m: "", n: "tú al palo" } }, "ataque", SLOTS).s0?.n === "tú al palo");
dice("la nota se corta y no crece sin fin",
  misionesLimpias({ s0: { n: "x".repeat(200) } }, "ataque", SLOTS).s0.n.length === MAX_NOTA_ABP);
dice("sin misiones, nada", JSON.stringify(misionesLimpias(null, "ataque", SLOTS)) === "{}");
dice("sin sistema con el que cruzar, no se descarta ningún puesto",
  "sViejo" in misionesLimpias(sucio, "ataque", null));

dice("la misión en palabras junta lista y nota",
  textoMision((k) => k, { m: "zona", n: "al primer palo" }) === "ab.zona · al primer palo");
dice("solo con la lista, solo la lista", textoMision((k) => k, { m: "zona" }) === "ab.zona");
dice("solo con la nota, solo la nota", textoMision((k) => k, { n: "sube tú" }) === "sube tú");
dice("sin nada, cadena vacía", textoMision((k) => k, null) === "" && textoMision((k) => k, {}) === "");

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
