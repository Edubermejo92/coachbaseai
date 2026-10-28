/* ============================================================
   Jugadas 3D de ejemplo
   ------------------------------------------------------------
   Montar una jugada desde cero (colocar a todos, elegir quién tiene el
   balón, apuntar cada pase y cada desmarque) cuesta, y más en el móvil.
   Estas vienen hechas: se abren en el creador 3D, se reproducen, se graban
   en vídeo y se retocan como cualquier otra; al guardarlas pasan a ser una
   jugada propia en Jugadas (la de ejemplo no se toca).

   Mismo formato que el creador (ver jugada3d.js): fichas en la pizarra de
   1000×640 -cal de 12 a 988 en x (105 m) y de 12 a 628 en y (68 m)-, quién
   tiene el balón y la lista de acciones. Atacamos siempre hacia la derecha,
   así que nuestra banda derecha es la de abajo (y grande).
   ============================================================ */

const L = (n, x, y) => ({ id: `l${n}`, type: "home", label: String(n), x, y });
const R = (n, x, y) => ({ id: `r${n}`, type: "away", label: String(n), x, y });
const BALON = (x, y) => ({ id: "balon", type: "ball", label: "", x, y });
/* Los ids de las acciones solo sirven de clave en la lista de pasos. */
const conIds = (id, acciones) => acciones.map((a, i) => ({ id: `${id}-${i + 1}`, ...a }));

/* `vista`: la cámara con la que se abre. Detrás de la portería a la que se
   ataca se ve la jugada de cerca y de frente; la salida de balón, que pasa en
   nuestro campo, desde detrás de la nuestra. */
const modelo = (id, cat, nombre, desc, tokens, balonEn, acciones, vista = "porteriaDer") => ({ id, cat, nombre, desc, tokens, balonEn, acciones: conIds(id, acciones), vista });

export const CATEGORIAS_MODELO = {
  ataque: { es: "Ataque", en: "Attack", fr: "Attaque", de: "Angriff", pt: "Ataque" },
  salida: { es: "Salida de balón", en: "Build-up", fr: "Relance", de: "Spielaufbau", pt: "Saída de bola" },
  transicion: { es: "Transición", en: "Transition", fr: "Transition", de: "Umschalten", pt: "Transição" },
  abp: { es: "Balón parado", en: "Set piece", fr: "Coup de pied arrêté", de: "Standard", pt: "Bola parada" },
};

export const JUGADAS_MODELO = [
  modelo("pared", "ataque",
    { es: "Pared y tiro", en: "One-two and shot", fr: "Une-deux et frappe", de: "Doppelpass und Abschluss", pt: "Tabela e remate" },
    { es: "El 10 la toca con el 9 de espaldas, rompe al espacio y le llega de vuelta para tirar.",
      en: "10 plays it into 9 (back to goal), runs into space and gets it back to shoot.",
      fr: "Le 10 joue avec le 9 dos au but, plonge dans l'espace et reçoit en retour pour frapper.",
      de: "Die 10 spielt auf die 9 mit dem Rücken zum Tor, startet in den Raum und schließt nach dem Rückpass ab.",
      pt: "O 10 joga no 9 de costas, ataca o espaço e recebe de volta para rematar." },
    [L(1, 60, 320), L(4, 430, 250), L(5, 430, 390), L(6, 560, 320), L(8, 630, 210), L(10, 700, 340), L(9, 795, 300), L(7, 720, 540), L(11, 720, 110),
      R(1, 968, 320), R(4, 840, 270), R(5, 840, 375), R(2, 820, 490), R(3, 820, 150), R(6, 755, 400), R(8, 720, 230), BALON(707, 342)],
    "l10",
    [{ tipo: "pase", a: "l9" },
      { tipo: "desmarque", j: "l10", hasta: { x: 880, y: 360 } }, { tipo: "pase", a: "l10", junto: true },
      { tipo: "tiro" }]),

  modelo("desdoble", "ataque",
    { es: "Desdoble del lateral", en: "Full-back overlap", fr: "Débordement du latéral", de: "Hinterlaufen des Außenverteidigers", pt: "Desdobramento do lateral" },
    { es: "El extremo recibe, el lateral dobla por fuera, centra al primer palo y el 9 remata.",
      en: "The winger receives, the full-back overlaps, crosses to the near post and 9 finishes.",
      fr: "L'ailier reçoit, le latéral déborde par l'extérieur, centre au premier poteau et le 9 conclut.",
      de: "Der Flügel bekommt den Ball, der Außenverteidiger hinterläuft, flankt an den ersten Pfosten und die 9 schließt ab.",
      pt: "O extremo recebe, o lateral desdobra por fora, cruza ao primeiro poste e o 9 finaliza." },
    [L(1, 60, 320), L(2, 560, 545), L(4, 420, 390), L(5, 420, 250), L(6, 540, 320), L(8, 640, 430), L(7, 700, 560), L(10, 700, 280), L(9, 800, 320), L(11, 740, 110),
      R(1, 968, 320), R(3, 800, 525), R(4, 845, 400), R(5, 845, 260), R(2, 815, 130), R(6, 740, 385), R(8, 720, 250), BALON(647, 432)],
    "l8",
    [{ tipo: "pase", a: "l7" },
      { tipo: "doblar", j: "l2", comp: "l7", hasta: { x: 885, y: 575 } }, { tipo: "pase", a: "l2", junto: true },
      { tipo: "desmarque", j: "l9", hasta: { x: 930, y: 345 } }, { tipo: "pase", a: "l9", junto: true },
      { tipo: "tiro" }]),

  modelo("salida", "salida",
    { es: "Salida de balón desde el portero", en: "Build-up from the goalkeeper", fr: "Relance depuis le gardien", de: "Spielaufbau über den Torwart", pt: "Saída de bola desde o guarda-redes" },
    { es: "El portero abre al central, el pivote baja a ayudar ante la presión y el lateral progresa por banda.",
      en: "The keeper finds the centre-back, the pivot drops in against the press and the full-back carries it up the wing.",
      fr: "Le gardien trouve le central, la sentinelle décroche face au pressing et le latéral progresse dans le couloir.",
      de: "Der Torwart spielt den Innenverteidiger an, der Sechser lässt sich gegen das Pressing fallen und der Außenverteidiger rückt über die Seite auf.",
      pt: "O guarda-redes abre no central, o pivô baixa para ajudar contra a pressão e o lateral progride pela ala." },
    [L(1, 40, 320), L(5, 150, 215), L(4, 150, 425), L(2, 260, 560), L(3, 260, 90), L(6, 250, 320), L(8, 380, 420), L(10, 380, 230), L(7, 480, 560), L(11, 480, 90), L(9, 520, 320),
      R(9, 245, 255), R(10, 270, 405), R(7, 360, 520), R(11, 360, 140), R(6, 430, 330), R(8, 450, 230), R(1, 968, 320), BALON(47, 322)],
    "l1",
    [{ tipo: "pase", a: "l4" },
      { tipo: "presion", j: "r10" }, { tipo: "desmarque", j: "l6", hasta: { x: 215, y: 340 }, junto: true },
      { tipo: "pase", a: "l6" },
      { tipo: "desmarque", j: "l2", hasta: { x: 390, y: 575 } }, { tipo: "pase", a: "l2", junto: true },
      { tipo: "conduccion", hasta: { x: 500, y: 570 } },
      { tipo: "desmarque", j: "l7", hasta: { x: 610, y: 505 } }, { tipo: "pase", a: "l7", junto: true }],
    "porteriaIzq"),

  modelo("segundo-palo", "ataque",
    { es: "Centro al segundo palo", en: "Cross to the far post", fr: "Centre au second poteau", de: "Flanke an den zweiten Pfosten", pt: "Cruzamento ao segundo poste" },
    { es: "El extremo encara hasta línea de fondo; el 9 arrastra al central al primer palo y el 7 entra solo por el segundo.",
      en: "The winger drives to the byline; 9 drags the centre-back to the near post and 7 arrives free at the far post.",
      fr: "L'ailier va jusqu'à la ligne de but ; le 9 attire le central au premier poteau et le 7 arrive seul au second.",
      de: "Der Flügel dribbelt bis zur Grundlinie; die 9 zieht den Innenverteidiger zum ersten Pfosten und die 7 kommt frei am zweiten.",
      pt: "O extremo leva a bola até à linha de fundo; o 9 arrasta o central ao primeiro poste e o 7 aparece sozinho ao segundo." },
    [L(1, 60, 320), L(4, 420, 400), L(5, 420, 250), L(6, 540, 330), L(8, 640, 250), L(3, 580, 80), L(11, 720, 100), L(10, 720, 330), L(9, 800, 300), L(7, 760, 500),
      R(1, 968, 320), R(2, 800, 115), R(4, 845, 265), R(5, 845, 365), R(3, 830, 480), R(6, 750, 300), R(8, 720, 420), BALON(727, 102)],
    "l11",
    [{ tipo: "conduccion", hasta: { x: 905, y: 120 } },
      { tipo: "arrastre", j: "l9", def: "r4", hasta: { x: 935, y: 275 }, junto: true },
      { tipo: "desmarque", j: "l7", hasta: { x: 905, y: 395 }, junto: true },
      { tipo: "pase", a: "l7" },
      { tipo: "tiro" }]),

  modelo("tercer-hombre", "ataque",
    { es: "Tercer hombre", en: "Third man run", fr: "Troisième homme", de: "Dritter Mann", pt: "Terceiro homem" },
    { es: "El central la mete al 9 de espaldas, que la deja de primeras al 10, que llega lanzado a la espalda del pivote.",
      en: "The centre-back plays into 9 (back to goal), who lays it first time to 10 arriving at speed behind the midfield.",
      fr: "Le central trouve le 9 dos au but, qui remise en une touche pour le 10 lancé dans le dos du milieu.",
      de: "Der Innenverteidiger spielt die 9 mit dem Rücken zum Tor an, die direkt auf die heranstartende 10 ablegt.",
      pt: "O central mete no 9 de costas, que deixa de primeira para o 10, que chega lançado nas costas do meio-campo." },
    [L(1, 60, 320), L(4, 430, 400), L(5, 430, 240), L(2, 520, 580), L(3, 520, 70), L(6, 560, 330), L(8, 600, 450), L(10, 640, 240), L(9, 760, 320), L(7, 720, 540), L(11, 720, 110),
      R(1, 968, 320), R(4, 840, 280), R(5, 840, 380), R(2, 820, 500), R(3, 820, 150), R(6, 720, 320), R(8, 690, 420), BALON(437, 402)],
    "l4",
    [{ tipo: "pase", a: "l9" },
      { tipo: "desmarque", j: "l10", hasta: { x: 830, y: 225 } }, { tipo: "pase", a: "l10", junto: true },
      { tipo: "conduccion", hasta: { x: 885, y: 275 } },
      { tipo: "tiro" }]),

  modelo("contraataque", "transicion",
    { es: "Contraataque 3 contra 2", en: "3 v 2 counter-attack", fr: "Contre-attaque à 3 contre 2", de: "Konter 3 gegen 2", pt: "Contra-ataque 3 contra 2" },
    { es: "Robo en el centro: el 6 conduce, los extremos abren y atacan el área; centro atrás y remate.",
      en: "Ball won in midfield: 6 carries, the wingers go wide and attack the box; cut-back and finish.",
      fr: "Récupération au centre : le 6 conduit, les ailiers s'écartent et attaquent la surface ; centre en retrait et frappe.",
      de: "Ballgewinn im Zentrum: die 6 treibt den Ball, die Flügel gehen breit und attackieren den Strafraum; Rückpass und Abschluss.",
      pt: "Recuperação ao centro: o 6 conduz, os extremos abrem e atacam a área; cruzamento atrasado e remate." },
    [L(1, 60, 320), L(4, 250, 380), L(5, 250, 260), L(6, 420, 320), L(7, 430, 540), L(11, 430, 100), L(8, 360, 430),
      R(1, 968, 320), R(4, 730, 280), R(5, 730, 380), R(8, 400, 250), R(10, 380, 410), R(6, 470, 360), BALON(427, 322)],
    "l6",
    [{ tipo: "conduccion", hasta: { x: 620, y: 320 } },
      { tipo: "desmarque", j: "l7", hasta: { x: 720, y: 530 }, junto: true },
      { tipo: "desmarque", j: "l11", hasta: { x: 720, y: 120 }, junto: true },
      { tipo: "pase", a: "l11" }, { tipo: "desmarque", j: "l7", hasta: { x: 880, y: 420 }, junto: true },
      { tipo: "conduccion", hasta: { x: 860, y: 175 } }, { tipo: "presion", j: "r4", junto: true },
      { tipo: "pase", a: "l7" },
      { tipo: "tiro" }]),

  modelo("cambio-orientacion", "ataque",
    { es: "Cambio de orientación", en: "Switch of play", fr: "Changement d'aile", de: "Spielverlagerung", pt: "Variação do centro de jogo" },
    { es: "El rival se vuelca a nuestra derecha; el pivote cambia el juego al extremo izquierdo, que ataca el espacio.",
      en: "The opponent shifts to our right; the pivot switches play to the left winger, who attacks the space.",
      fr: "L'adversaire bascule sur notre droite ; la sentinelle renverse le jeu vers l'ailier gauche, qui attaque l'espace.",
      de: "Der Gegner verschiebt auf unsere rechte Seite; der Sechser verlagert auf den linken Flügel, der in den Raum geht.",
      pt: "O adversário balança para a nossa direita; o pivô muda o jogo para o extremo esquerdo, que ataca o espaço." },
    [L(1, 60, 320), L(4, 400, 420), L(5, 400, 240), L(2, 560, 560), L(3, 560, 90), L(6, 520, 330), L(8, 620, 470), L(7, 730, 540), L(10, 680, 300), L(9, 800, 330), L(11, 740, 80),
      R(1, 968, 320), R(3, 800, 520), R(5, 830, 420), R(4, 840, 320), R(2, 820, 220), R(6, 720, 460), R(8, 700, 360), R(7, 660, 540), BALON(627, 472)],
    "l8",
    [{ tipo: "pase", a: "l6" },
      { tipo: "pase", a: "l11" },
      { tipo: "conduccion", hasta: { x: 860, y: 165 } }, { tipo: "presion", j: "r2", junto: true },
      { tipo: "desmarque", j: "l9", hasta: { x: 925, y: 305 } }, { tipo: "pase", a: "l9", junto: true },
      { tipo: "tiro" }]),

  modelo("espalda", "ataque",
    { es: "Balón a la espalda de la defensa", en: "Ball in behind the back line", fr: "Ballon dans le dos de la défense", de: "Ball hinter die Abwehrkette", pt: "Bola nas costas da defesa" },
    { es: "Con la defensa rival adelantada, el 8 la pone en largo y el 9 rompe a la espalda, conduce y define.",
      en: "With a high back line, 8 plays it long and 9 runs in behind, carries it and finishes.",
      fr: "Face à une défense haute, le 8 joue long et le 9 part dans le dos, conduit et conclut.",
      de: "Gegen eine hohe Abwehrkette spielt die 8 lang und die 9 startet hinter die Kette, treibt den Ball und schließt ab.",
      pt: "Com a defesa adiantada, o 8 joga em profundidade e o 9 rompe nas costas, conduz e finaliza." },
    [L(1, 60, 320), L(4, 380, 400), L(5, 380, 240), L(6, 470, 320), L(8, 560, 300), L(10, 620, 380), L(9, 720, 330), L(11, 700, 130), L(7, 700, 520),
      R(1, 968, 320), R(4, 745, 280), R(5, 745, 380), R(3, 735, 150), R(2, 735, 500), R(6, 640, 320), R(8, 620, 220), BALON(567, 302)],
    "l8",
    [{ tipo: "desmarque", j: "l9", hasta: { x: 870, y: 290 } }, { tipo: "pase", a: "l9", junto: true },
      { tipo: "conduccion", hasta: { x: 912, y: 310 } },
      { tipo: "tiro" }]),

  modelo("corner", "abp",
    { es: "Córner al primer palo", en: "Near-post corner", fr: "Corner au premier poteau", de: "Ecke an den ersten Pfosten", pt: "Canto ao primeiro poste" },
    { es: "El 9 arrastra a su marcador hacia el segundo palo y el central entra al primer palo a rematar.",
      en: "9 drags his marker to the far post and the centre-back attacks the near post to finish.",
      fr: "Le 9 entraîne son marqueur au second poteau et le central attaque le premier poteau pour reprendre.",
      de: "Die 9 zieht ihren Gegenspieler an den zweiten Pfosten und der Innenverteidiger attackiert den ersten Pfosten.",
      pt: "O 9 arrasta o marcador para o segundo poste e o central ataca o primeiro poste para finalizar." },
    [L(1, 60, 320), L(7, 982, 618), L(5, 850, 300), L(4, 860, 390), L(9, 880, 250), L(10, 840, 450), L(8, 800, 330), L(6, 720, 320), L(2, 600, 450), L(3, 600, 200), L(11, 930, 430),
      R(1, 972, 320), R(4, 900, 305), R(5, 900, 395), R(6, 925, 455), R(9, 870, 350), R(8, 885, 260), R(10, 820, 330), R(7, 950, 590), BALON(985, 622)],
    "l7",
    [{ tipo: "arrastre", j: "l9", def: "r8", hasta: { x: 950, y: 285 } },
      { tipo: "desmarque", j: "l5", hasta: { x: 942, y: 368 }, junto: true },
      { tipo: "pase", a: "l5", junto: true },
      { tipo: "tiro" }]),
];

/* Nombre y descripción en el idioma de la app (o en español). */
export const textoModelo = (m, lang = "es") => ({
  nombre: m.nombre[lang] || m.nombre.es,
  desc: m.desc[lang] || m.desc.es,
  cat: (CATEGORIAS_MODELO[m.cat] || {})[lang] || (CATEGORIAS_MODELO[m.cat] || {}).es || "",
});
