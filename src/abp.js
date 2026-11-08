/* ============================================================
   ABP · balón parado
   ------------------------------------------------------------
   Las seis situaciones (córner, falta y penalti, cada una a favor y en
   contra), su colocación de salida y las cuentas que las acompañan.
   Vive aparte de App.jsx por dos motivos: lo usan la pantalla del
   entrenador -que coloca las fichas- y la del jugador -que mira dónde le
   toca ponerse-, y así se puede probar de verdad (ver pruebas/pruebas28).
   Lo que NO está aquí es el dibujo: el campo es JSX y se queda en App.jsx.
   ============================================================ */
/* ================= ABP · BALÓN PARADO =================
   El mismo once, colocado de otra manera. Un córner no se defiende ni se
   ataca con el dibujo del sistema: los centrales suben al área, el portero
   se pega al palo y alguien se queda arriba para la contra. Por eso las
   posiciones de ABP viven aparte de `slotPos` y no lo tocan -volver al once
   después de preparar un balón parado tiene que devolver el equipo tal y
   como estaba.
   Hay seis situaciones: córner, falta y penalti, cada una a favor y en
   contra. Cada una guarda su propia colocación y sus propias colocaciones
   guardadas, porque no se parecen en nada entre sí.
   Las listas de abajo son el punto de partida que se ofrece al entrar: una
   colocación razonable que el entrenador mueve a su gusto, no una propuesta
   táctica cerrada. En todas la portería está arriba: la que se ataca cuando
   el balón parado es a favor, la que se defiende cuando es en contra. */
export const CORNER_ATAQUE = [
  [50, 94],                     /* portero: atrás del todo, si se pierde el balón el córner es del rival */
  [25, 75], [75, 75],           /* dos que se quedan para la contra */
  [8, 13],                      /* el que saca, en el banderín */
  [34, 18], [66, 18],           /* primer y segundo palo */
  [50, 34],                     /* punto de penalti */
  [50, 56],                     /* frontal, para el rechace */
  [26, 55], [80, 42],           /* segunda jugada y llegada desde atrás */
  [17, 35],                     /* saque en corto */
];
export const CORNER_DEFENSA = [
  [50, 8],                      /* portero, en la línea */
  [30, 14], [70, 14],           /* los dos palos */
  [24, 34], [41, 34], [59, 34], [76, 34],   /* la zona, delante del área pequeña */
  [14, 56], [86, 56],           /* al hombre */
  [50, 56],                     /* el frontal, para el rechace */
  [50, 82],                     /* el que se queda arriba */
];
/* Nota sobre estas dos tablas: en un córner de verdad los dos de los palos
   están pegados a la zona, y el portero a un metro de ellos. Dibujado a
   escala eso son tres fichas una encima de otra en un móvil, y una ficha
   tapada no se puede arrastrar. Se separan lo justo para que cada una se
   pueda coger con el dedo -medido: ninguna pareja a menos del diámetro de
   una ficha en una pantalla de 390px-, y a partir de ahí el entrenador las
   junta tanto como quiera. */
/* ---- Faltas ----
   Una falta a favor cerca del área: el que la saca marca donde está el
   balón -no hay una ficha aparte para el balón, la ficha del lanzador ES el
   balón-, dos remates a los palos, uno al punto de penalti, las llegadas y
   dos que se quedan atrás por si el rival sale a la contra. */
/* El orden importa: las coordenadas se reparten entre los puestos del sistema
   tal y como están dibujados -portero, defensas, medios, delanteros-, así que
   el que saca la falta cae en un medio y los dos que remiten a los palos en
   los delanteros, que es lo normal. */
export const FALTA_ATAQUE = [
  [50, 94],                     /* portero: en su área, el balón está en la otra mitad */
  [22, 78], [78, 78],           /* los dos defensas que se quedan por si hay contra */
  [27, 36], [73, 36],           /* las dos llegadas desde atrás */
  [40, 60],                     /* el que la saca: aquí está el balón */
  [59, 66],                     /* el segundo lanzador, para el engaño */
  [50, 47],                     /* frontal del área, para el rechace */
  [37, 19], [63, 19],           /* primer y segundo palo */
  [50, 29],                     /* punto de penalti */
];
/* Una falta en contra: barrera, marcas en el área y uno al balón para que no
   la saquen en corto. La barrera de verdad va hombro con hombro; dibujada a
   escala serían cuatro fichas pegadas y una ficha tapada no se puede
   arrastrar, así que se separa lo justo para cogerla con el dedo. */
export const FALTA_DEFENSA = [
  [50, 10],                     /* portero, tapando su palo */
  [20, 26], [36, 26], [64, 26], [80, 26],   /* los defensas, a las marcas del área */
  [26, 46], [42, 46], [58, 46], [74, 46],   /* la barrera */
  [50, 60],                     /* al balón, para que no la saquen en corto */
  [50, 82],                     /* el que se queda arriba */
];
/* En la fila del borde del área las fichas van en zigzag, una arriba y otra
   abajo. Puestas todas a la misma altura caben -se tocan pero no se tapan-,
   pero el cartel con el nombre de cada una es más ancho que la ficha y los
   nombres se montaban unos encima de otros. */
/* ---- Penaltis ----
   En un penalti el reglamento coloca al equipo: solo el lanzador y el
   portero rival dentro del área, y los demás fuera y por detrás del balón.
   Lo que sí decide el entrenador es QUIÉN lanza y quién se queda cerca del
   borde del área para el rechace, que es lo que se prepara aquí. */
export const PENALTI_ATAQUE = [
  [50, 94],                     /* portero: en su área */
  [25, 78], [50, 78], [75, 78], /* los defensas atrás, por si falla y sale la contra */
  [16, 54],                     /* el cuarto defensa, ya en el borde del área */
  [29, 62], [42, 54], [58, 62], /* los medios, al rechace */
  [50, 42],                     /* el lanzador, detrás del balón */
  [71, 54], [84, 62],           /* los otros dos de arriba, al rechace */
];
export const PENALTI_DEFENSA = [
  [50, 9],                      /* portero, en la línea */
  [16, 54], [29, 62], [42, 54], [58, 62],   /* los defensas, fuera del área y a por el rechace */
  [71, 54], [84, 62], [30, 78], /* los medios */
  [50, 78], [70, 78],           /* la segunda línea */
  [50, 92],                     /* el que se queda arriba para la contra */
];

/* Las seis situaciones. La clave es la que viaja a la nube y la que indexa
   `abpPos` y `abpGuardadas`; "ataque" y "defensa" son el córner y se llaman
   así desde la primera versión, cuando el córner era lo único que había: se
   mantienen tal cual para no perder lo que ya tiene guardado un equipo. */
export const JUGADAS_ABP = ["corner", "falta", "penalti"];
export const CLAVES_ABP = ["ataque", "defensa", "faltaAtaque", "faltaDefensa", "penaltiAtaque", "penaltiDefensa"];
export const claveAbp = (jugada, lado) => (jugada === "corner" ? lado : `${jugada}${lado === "defensa" ? "Defensa" : "Ataque"}`);
export const ladoDeAbp = (sit) => (sit === "defensa" || String(sit).endsWith("Defensa") ? "defensa" : "ataque");
export const jugadaDeAbp = (sit) => (String(sit).startsWith("falta") ? "falta" : String(sit).startsWith("penalti") ? "penalti" : "corner");
export const ETIQUETA_JUGADA = { corner: "ln.abpCorner", falta: "ln.abpFalta", penalti: "ln.abpPenalti" };
/* "Córner a favor", "Falta en contra"... el nombre de la situación tal y como
   se ve en la tarjeta, en la imagen que se comparte y en el texto. */
export const nombreAbp = (t, sit) => `${t(ETIQUETA_JUGADA[jugadaDeAbp(sit)])} ${t(ladoDeAbp(sit) === "defensa" ? "ln.abpDefensa" : "ln.abpAtaque")}`;
export const TABLAS_ABP = {
  ataque: CORNER_ATAQUE, defensa: CORNER_DEFENSA,
  faltaAtaque: FALTA_ATAQUE, faltaDefensa: FALTA_DEFENSA,
  penaltiAtaque: PENALTI_ATAQUE, penaltiDefensa: PENALTI_DEFENSA,
};
/* Reparte esas coordenadas entre los puestos del sistema que se esté usando,
   en el orden en el que están dibujados en el campo (portero primero). Si el
   sistema tuviera más puestos que coordenadas -no ocurre en 11 ni en 7- los
   que sobren se quedan en el frontal, que es donde menos estorban. */
export const abpPorDefecto = (sit, slots) => {
  const tabla = TABLAS_ABP[sit] || CORNER_ATAQUE;
  const out = {};
  Object.entries(slots).forEach(([id, s], i) => {
    const [x, y] = tabla[i] || [50, 55];
    out[id] = { label: s.label, x, y };
  });
  return out;
};
/* Lo que llega de la nube trae solo el sitio de cada ficha: la demarcación
   sale del sistema que se esté usando ahora, que es el que manda. Un puesto
   guardado que ya no exista -se ha cambiado de sistema- se descarta, y uno
   nuevo cae en su posición por defecto. */
export const abpConSlots = (guardado, slots, sit) => {
  const base = abpPorDefecto(sit, slots);
  if (!guardado || typeof guardado !== "object") return base;
  const out = {};
  Object.keys(base).forEach((id) => {
    const g = guardado[id];
    out[id] = Number.isFinite(g?.x) && Number.isFinite(g?.y)
      ? { label: base[id].label, x: g.x, y: g.y }
      : base[id];
  });
  return out;
};
/* Al revés: a la nube solo viaja el sitio. La demarcación no se guarda porque
   no es de la jugada, es del sistema. */
export const abpSoloPos = (pos) => {
  const out = {};
  Object.entries(pos || {}).forEach(([id, s]) => { out[id] = { x: s.x, y: s.y }; });
  return out;
};

/* Dónde está una ficha, dicho con palabras. Un jugador que abre su ficha no
   quiere interpretar un punto en un dibujo: quiere leer "segundo palo".
   Las referencias son las del campo de arriba: la línea de gol en el 7,6%,
   el área pequeña hasta el 22,4%, el área grande hasta el 51,2% y el punto
   de penalti en el 36,8%. */
export const zonaAbp = (x, y) => {
  if (y >= 85) return "abz.atras";
  if (y <= 12 && x >= 40 && x <= 60) return "abz.porteria";
  if (y <= 16 && (x <= 14 || x >= 86)) return "abz.corner";
  if (y <= 24) return x < 40 ? "abz.paloIzq" : x > 60 ? "abz.paloDer" : "abz.areaPequena";
  if (y <= 44 && x >= 40 && x <= 60) return "abz.penalti";
  if (y <= 44 && x >= 11.5 && x <= 88.5) return "abz.area";
  /* El frontal se come un poco de dentro y un poco de fuera del área a
     propósito: para quien juega, el frontal es la zona del arco, esté la
     ficha un metro por dentro de la línea o un metro por fuera. */
  if (y <= 66 && x >= 30 && x <= 70) return "abz.frontal";
  if (y <= 51 && x >= 11.5 && x <= 88.5) return "abz.area";
  if (x <= 30) return "abz.bandaIzq";
  if (x >= 70) return "abz.bandaDer";
  return "abz.lejos";
};

/* ---- El mismo balón parado, pero en el campo entero (para el 3D) ----
   La pizarra 3D pinta sobre el tablero de la pizarra, 1000×640, donde el
   rectángulo (12,12)-(988,628) son los 105×68 m de un campo reglamentario.
   El tablero de ABP, en cambio, es media cancha apaisada y NO está a escala:
   se estira a lo ancho para que once fichas se puedan coger con el dedo. Al
   pasar al 3D hay que deshacer ese estirón o el área sale deformada.
   · A lo ancho es proporcional: del 2% al 98% son los 68 m de banda a banda.
   · A lo largo, del 7,6% (línea de gol) al 51,2% (borde del área) van los
     16,5 m del área, exactos: es donde se juega la jugada y donde importa
     que la distancia sea la de verdad -el punto de penalti cae en los 11 m y
     el área pequeña en los 5,5-. Lo que queda por debajo se reparte hasta el
     medio campo, que es la misma licencia que ya se toma el tablero 2D.
   La portería de la jugada va siempre a la derecha, que es hacia donde se
   ataca en cualquier pizarra, y es la que mira la cámara por defecto. */
export const profundidadAbp = (y) => (y <= 51.2
  ? ((y - 7.6) / 43.6) * 16.5
  : 16.5 + ((y - 51.2) / 46.4) * 36);
export const abpATablero = ({ x, y }) => ({
  x: 988 - (profundidadAbp(y) / 105) * 976,
  y: 12 + ((x - 2) / 96) * 616,
});
/* Las fichas tal y como las espera la pizarra 3D. `dorsalDe` saca el dorsal
   del puesto: el jugador sale de la alineación oficial, no de la jugada. */
export const tokensAbp3d = (pos, dorsalDe) => Object.entries(pos || {}).map(([slot, s]) => {
  const b = abpATablero(s);
  return { id: slot, type: "home", label: String(dorsalDe(slot) ?? ""), x: Math.round(b.x), y: Math.round(b.y) };
});
/* Dónde está el balón, cuando lo dice el reglamento: en el punto de penalti
   o en el banderín del córner. En una falta lo decide dónde se pitó, que no
   está guardado en ninguna parte, así que no se pinta ningún balón. */
export const balonAbp = (sit) => {
  const j = jugadaDeAbp(sit);
  if (j === "penalti") return abpATablero({ x: 50, y: 36.8 });
  if (j === "corner") return abpATablero({ x: 2, y: 7.6 });
  return null;
};
