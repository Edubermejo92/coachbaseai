/* ============================================================
   Pizarra 3D
   ------------------------------------------------------------
   Pinta la jugada de la pizarra (fichas y trazos del campo entero, 1000×640)
   sobre un campo 3D a escala real (105×68 m): jugadores con su dorsal, balón,
   conos, flechas de movimiento, pases y conducciones, zonas y textos.
   Cámara libre (girar, acercar, desplazar) y vistas de partido: tribuna,
   cenital, detrás de cada portería y esquina. Los pasos de la jugada se
   animan moviendo a cada jugador de un paso al siguiente, y las jugadas
   hechas con acciones (pase, desmarque, conducción… ver jugada3d.js) se
   reproducen paso a paso con el balón de pie en pie. Se puede tocar el campo
   para elegir jugadores y puntos.

   Sin React, como sincro.js y superwall.js: la app lo carga con import()
   solo cuando se abre la vista 3D, así que Three.js no pesa en el resto.
   ============================================================ */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/* Campo reglamentario de 105×68 m. En la pizarra, las bandas y las líneas de
   gol son el rectángulo (12,12)-(988,628) del tablero de 1000×640: se lleva ese
   rectángulo al campo 3D, así una ficha pegada a la cal sigue pegada a la cal. */
const LARGO = 105, ANCHO = 68;
const B0 = 12, BW = 976, BH = 616;
const aMetros = (p) => ({ x: ((p.x - B0) / BW) * LARGO - LARGO / 2, z: ((p.y - B0) / BH) * ANCHO - ANCHO / 2 });
const aTablero = (v) => ({ x: Math.round(((v.x + LARGO / 2) / LARGO) * BW + B0), y: Math.round(((v.z + ANCHO / 2) / ANCHO) * BH + B0) });

/* Los jugadores y el balón van algo más grandes que en la realidad: a escala
   real, desde la tribuna, un jugador es un punto. Es lo que hacen todas las
   pizarras tácticas de televisión. */
const EXAGERA = 1.9;

const brillo = (hex) => {
  const c = new THREE.Color(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
};

/* ---------- texturas dibujadas en un canvas ---------- */
function texturaCesped(lineas = "#F4F6F2") {
  const PX = 20; // píxeles por metro
  const W = Math.round((LARGO + 8) * PX), H = Math.round((ANCHO + 8) * PX);
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  /* franjas de corte del césped */
  const franjas = 14;
  for (let i = 0; i < franjas; i++) {
    g.fillStyle = i % 2 ? "#2F7A3B" : "#348443";
    g.fillRect((i * W) / franjas, 0, W / franjas + 1, H);
  }
  /* algo de grano para que no parezca plástico */
  const img = g.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  /* líneas reglamentarias */
  const o = 4 * PX; // margen
  const X = (m) => o + m * PX, Y = (m) => o + m * PX;
  g.strokeStyle = lineas; g.lineWidth = 0.12 * PX * 1.6; g.lineCap = "round";
  g.strokeRect(X(0), Y(0), LARGO * PX, ANCHO * PX);
  g.beginPath(); g.moveTo(X(LARGO / 2), Y(0)); g.lineTo(X(LARGO / 2), Y(ANCHO)); g.stroke();
  g.beginPath(); g.arc(X(LARGO / 2), Y(ANCHO / 2), 9.15 * PX, 0, Math.PI * 2); g.stroke();
  g.fillStyle = lineas;
  const punto = (x, y) => { g.beginPath(); g.arc(X(x), Y(y), 0.22 * PX, 0, Math.PI * 2); g.fill(); };
  punto(LARGO / 2, ANCHO / 2);
  for (const lado of [0, 1]) {
    const x0 = lado ? LARGO : 0, s = lado ? -1 : 1;
    const area = (prof, ancho) => {
      g.beginPath();
      g.moveTo(X(x0), Y(ANCHO / 2 - ancho / 2));
      g.lineTo(X(x0 + s * prof), Y(ANCHO / 2 - ancho / 2));
      g.lineTo(X(x0 + s * prof), Y(ANCHO / 2 + ancho / 2));
      g.lineTo(X(x0), Y(ANCHO / 2 + ancho / 2));
      g.stroke();
    };
    area(16.5, 40.32);
    area(5.5, 18.32);
    punto(x0 + s * 11, ANCHO / 2);
    /* semicírculo del área: la parte del círculo de 9,15 m fuera del área */
    const ang = Math.acos(5.5 / 9.15);
    g.beginPath();
    if (lado) g.arc(X(x0 - 11), Y(ANCHO / 2), 9.15 * PX, Math.PI - ang, Math.PI + ang);
    else g.arc(X(x0 + 11), Y(ANCHO / 2), 9.15 * PX, -ang, ang);
    g.stroke();
  }
  /* córners */
  [[0, 0, 0], [LARGO, 0, Math.PI / 2], [LARGO, ANCHO, Math.PI], [0, ANCHO, -Math.PI / 2]].forEach(([x, y, a]) => {
    g.beginPath(); g.arc(X(x), Y(y), 1 * PX, a, a + Math.PI / 2); g.stroke();
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { tex, w: LARGO + 8, h: ANCHO + 8 };
}

function spriteTexto(texto, { fondo = null, color = "#FFFFFF", borde = null, tam = 128, ancho = 256, negrita = true, sub = "" } = {}) {
  const cv = document.createElement("canvas");
  cv.width = ancho; cv.height = sub ? 200 : 128;
  const g = cv.getContext("2d");
  if (fondo) {
    g.fillStyle = fondo;
    const r = 56;
    g.beginPath(); g.arc(ancho / 2, 64, r, 0, Math.PI * 2); g.fill();
    if (borde) { g.lineWidth = 8; g.strokeStyle = borde; g.stroke(); }
  }
  g.fillStyle = color; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = `${negrita ? 700 : 500} ${fondo ? 64 : tam * 0.6}px "Barlow Condensed", "Arial Narrow", sans-serif`;
  g.fillText(texto, ancho / 2, 66);
  if (sub) {
    g.font = `600 44px "Barlow Condensed", "Arial Narrow", sans-serif`;
    g.lineWidth = 8; g.strokeStyle = "rgba(0,0,0,0.65)"; g.strokeText(sub, ancho / 2, 160);
    g.fillStyle = "#FFFFFF"; g.fillText(sub, ancho / 2, 160);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sp = new THREE.Sprite(mat);
  sp.userData.aspecto = cv.width / cv.height;
  return sp;
}

/* Valla LED: el rótulo repetido a lo largo. Una textura por valla, porque el
   número de repeticiones depende de lo larga que sea. */
function texturaValla(fondo, texto, largo) {
  const cv = document.createElement("canvas");
  cv.width = 2048; cv.height = 64;
  const g = cv.getContext("2d");
  g.fillStyle = fondo; g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = brillo(fondo) > 0.55 ? "#141414" : "#FFFFFF";
  g.textAlign = "center"; g.textBaseline = "middle";
  /* La fuente de la app puede no estar cargada todavía: se mide y se encoge
     hasta que el rótulo quepa en su hueco, sea cual sea la que pinte. */
  let px = 42;
  do { g.font = `700 ${px}px "Barlow Condensed", "Arial Narrow", sans-serif`; px -= 2; } while (g.measureText(texto).width > 440 && px > 16);
  for (let i = 0; i < 4; i++) g.fillText(texto, 256 + i * 512, 34);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  /* cada hueco de 512 px mide unos 7 m: el rótulo no sale estirado */
  t.repeat.set(Math.max(1, Math.round(largo / 28.8)), 1);
  t.anisotropy = 4;
  return t;
}

/* ---------- elementos del estadio ---------- */
function porteria(ancho = 7.32, alto = 2.44, fondo = 2) {
  const g = new THREE.Group();
  const blanco = new THREE.MeshStandardMaterial({ color: "#FFFFFF", roughness: 0.35, metalness: 0.1 });
  const r = 0.07;
  const palo = (x1, y1, z1, x2, y2, z2) => {
    const a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2);
    const len = a.distanceTo(b);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), blanco);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    m.castShadow = true;
    g.add(m);
  };
  palo(0, 0, -ancho / 2, 0, alto, -ancho / 2);
  palo(0, 0, ancho / 2, 0, alto, ancho / 2);
  palo(0, alto, -ancho / 2, 0, alto, ancho / 2);
  /* red: rejilla de líneas finas */
  const pts = [];
  const paso = 0.35;
  for (let z = -ancho / 2; z <= ancho / 2 + 1e-6; z += paso) { pts.push(0, alto, z, -fondo, alto * 0.8, z, -fondo, alto * 0.8, z, -fondo, 0, z); }
  for (let y = 0; y <= alto + 1e-6; y += paso) {
    const yy = Math.min(y, alto * 0.8);
    pts.push(-fondo, yy, -ancho / 2, -fondo, yy, ancho / 2);
    pts.push(0, y, -ancho / 2, -fondo, yy, -ancho / 2);
    pts.push(0, y, ancho / 2, -fondo, yy, ancho / 2);
  }
  for (let x = 0; x >= -fondo - 1e-6; x -= paso) {
    const y = alto - (alto * 0.2 * -x) / fondo;
    pts.push(x, y, -ancho / 2, x, y, ancho / 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  g.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: "#DDE3E6", transparent: true, opacity: 0.55 })));
  return g;
}

function torreFocos(x, z, alto = 26) {
  const g = new THREE.Group();
  const gris = new THREE.MeshStandardMaterial({ color: "#3A444A", roughness: 0.8 });
  const mastil = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, alto, 10), gris);
  mastil.position.y = alto / 2;
  g.add(mastil);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.4, 0.4), new THREE.MeshStandardMaterial({ color: "#F8F6E8", emissive: "#FFF6D8", emissiveIntensity: 1.4 }));
  panel.position.set(0, alto + 1, 0);
  panel.lookAt(-x, 0, -z);
  g.add(panel);
  g.position.set(x, 0, z);
  return g;
}

/* ---------- motor ---------- */
export function montarPizarra3D(contenedor, { acento = "#FFFFFF", nombres = {}, rotulo = "COACHBASE AI", alTocar = null } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.touchAction = "none";
  contenedor.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#0A1210");
  scene.fog = new THREE.Fog("#0A1210", 120, 260);

  const camara = new THREE.PerspectiveCamera(40, 1, 1, 600);
  camara.position.set(0, 48, 72);
  const controles = new OrbitControls(camara, renderer.domElement);
  controles.enableDamping = true;
  controles.dampingFactor = 0.08;
  controles.minDistance = 12;
  controles.maxDistance = 260;
  controles.maxPolarAngle = Math.PI * 0.47;
  controles.target.set(0, 0, 0);

  /* luces: cielo + "focos" del estadio, con sombras */
  scene.add(new THREE.HemisphereLight("#DCE8FF", "#1E3320", 0.85));
  const sol = new THREE.DirectionalLight("#FFFFFF", 2.1);
  sol.position.set(-40, 80, 30);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -65, right: 65, top: 45, bottom: -45, near: 10, far: 220 });
  sol.shadow.bias = -0.0005;
  scene.add(sol);
  const relleno = new THREE.DirectionalLight("#BFD4FF", 0.45);
  relleno.position.set(50, 40, -40);
  scene.add(relleno);

  /* suelo de alrededor, campo y estadio */
  /* El suelo y el césped se pintan los primeros y sin escribir profundidad:
     todo lo demás queda encima. Separarlos unos centímetros no basta: en
     móviles con búfer de profundidad de 16 bits, desde lejos, se pisaban y
     medio campo salía negro. */
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(400, 300), new THREE.MeshStandardMaterial({ color: "#16241A", roughness: 1, depthWrite: false }));
  suelo.rotation.x = -Math.PI / 2; suelo.position.y = -0.02; suelo.receiveShadow = true; suelo.renderOrder = -2;
  scene.add(suelo);
  const { tex, w, h } = texturaCesped();
  const campo = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, depthWrite: false }));
  campo.rotation.x = -Math.PI / 2; campo.receiveShadow = true; campo.renderOrder = -1;
  scene.add(campo);
  const pIzq = porteria(); pIzq.position.set(-LARGO / 2, 0, 0); pIzq.rotation.y = 0; scene.add(pIzq);
  const pDer = porteria(); pDer.position.set(LARGO / 2, 0, 0); pDer.rotation.y = Math.PI; scene.add(pDer);
  /* vallas publicitarias con el color del club */
  const colorValla = brillo(acento) > 0.85 ? "#24313A" : acento;
  [[0, -ANCHO / 2 - 3.2, LARGO + 6, 0], [0, ANCHO / 2 + 3.2, LARGO + 6, 0], [-LARGO / 2 - 3.2, 0, ANCHO, Math.PI / 2], [LARGO / 2 + 3.2, 0, ANCHO, Math.PI / 2]].forEach(([x, z, l, r]) => {
    const tv = texturaValla(colorValla, String(rotulo || "").toUpperCase(), l);
    const valla = new THREE.MeshStandardMaterial({ map: tv, emissive: "#FFFFFF", emissiveMap: tv, emissiveIntensity: 0.35, roughness: 0.6 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(l, 0.9, 0.15), valla);
    m.position.set(x, 0.45, z); m.rotation.y = r; m.castShadow = true;
    scene.add(m);
  });
  /* gradas, como bloques oscuros escalonados */
  const grada = [new THREE.MeshStandardMaterial({ color: "#26323D", roughness: 0.9 }), new THREE.MeshStandardMaterial({ color: "#1E2832", roughness: 0.9 })];
  [[0, -ANCHO / 2 - 14, LARGO + 30, 0], [0, ANCHO / 2 + 14, LARGO + 30, Math.PI]].forEach(([x, z, l, r]) => {
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(l, 1.2, 2.4), grada[i % 2]);
      const d = i * 2.2;
      m.position.set(x, 0.6 + i * 1.2, z + (z < 0 ? -d : d));
      m.rotation.y = r;
      scene.add(m);
    }
  });
  [[-72, -56], [72, -56], [-72, 56], [72, 56]].forEach(([x, z]) => scene.add(torreFocos(x, z)));

  /* ---------- la jugada ---------- */
  const capaJugada = new THREE.Group();
  scene.add(capaJugada);
  const fichas = new Map(); // id -> { obj, tipo }
  let capaTrazos = new THREE.Group();
  capaJugada.add(capaTrazos);

  const colLocal = brillo(acento) < 0.25 ? "#F2F4F1" : acento;
  const matLocal = new THREE.MeshStandardMaterial({ color: colLocal, roughness: 0.55 });
  const matLocal2 = new THREE.MeshStandardMaterial({ color: brillo(colLocal) > 0.7 ? "#1E2A30" : "#FFFFFF", roughness: 0.6 });
  const matRival = new THREE.MeshStandardMaterial({ color: "#36454F", roughness: 0.55 });
  const matRival2 = new THREE.MeshStandardMaterial({ color: "#E8EDE6", roughness: 0.6 });
  const matPiel = new THREE.MeshStandardMaterial({ color: "#E2B48E", roughness: 0.7 });

  const jugador3D = (tipo, etiqueta) => {
    const local = tipo === "home";
    const g = new THREE.Group();
    const camiseta = local ? matLocal : matRival, pantalon = local ? matLocal2 : matRival2;
    const piernas = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.62, 4, 10), pantalon);
    piernas.position.y = 0.5;
    const cuerpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.5, 4, 12), camiseta);
    cuerpo.position.y = 1.15;
    const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), matPiel);
    cabeza.position.y = 1.72;
    [piernas, cuerpo, cabeza].forEach((m) => { m.castShadow = true; g.add(m); });
    /* aro en el suelo con el color del equipo: se lee desde cualquier ángulo */
    const aro = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.58, 28), new THREE.MeshBasicMaterial({ color: local ? colLocal : "#36454F", transparent: true, opacity: 0.9 }));
    aro.rotation.x = -Math.PI / 2; aro.position.y = 0.03;
    g.add(aro);
    if (etiqueta) {
      const nombre = local ? (nombres[String(etiqueta)] || "") : "";
      const sp = spriteTexto(String(etiqueta), {
        fondo: local ? colLocal : "#36454F", borde: local ? "#141414" : "#FFFFFF",
        color: local ? (brillo(colLocal) > 0.6 ? "#141414" : "#FFFFFF") : "#FFFFFF",
        sub: nombre ? String(nombre).split(" ")[0].toUpperCase() : "",
      });
      const alto = nombre ? 1.8 : 1.2;
      sp.scale.set(alto * sp.userData.aspecto, alto, 1);
      sp.position.y = 2.3 + (nombre ? 0.35 : 0);
      sp.renderOrder = 10;
      g.add(sp);
    }
    /* Volumen invisible y generoso para poder tocar al jugador con el dedo. */
    const toque = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 2.6, 10), new THREE.MeshBasicMaterial({ visible: false }));
    toque.position.y = 1.3; toque.userData.toque = true;
    g.add(toque);
    g.scale.setScalar(EXAGERA);
    return g;
  };
  const balon3D = () => {
    const cv = document.createElement("canvas"); cv.width = 128; cv.height = 64;
    const c = cv.getContext("2d");
    c.fillStyle = "#FFFFFF"; c.fillRect(0, 0, 128, 64);
    c.fillStyle = "#1A1A1A";
    for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(10 + i * 22, i % 2 ? 18 : 46, 7, 0, Math.PI * 2); c.fill(); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.22 * EXAGERA, 24, 16), new THREE.MeshStandardMaterial({ map: t, roughness: 0.4 }));
    m.position.y = 0.22 * EXAGERA; m.castShadow = true;
    const g = new THREE.Group(); g.add(m); return g;
  };
  const cono3D = () => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 18), new THREE.MeshStandardMaterial({ color: "#FF7A1A", roughness: 0.5 }));
    m.position.y = 0.3; m.castShadow = true;
    const g = new THREE.Group(); g.add(m); g.scale.setScalar(1.3); return g;
  };
  const disco3D = () => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.08, 20), new THREE.MeshStandardMaterial({ color: "#F6D23A", roughness: 0.6 }));
    m.position.y = 0.04; m.castShadow = true;
    const g = new THREE.Group(); g.add(m); g.scale.setScalar(1.3); return g;
  };
  const miniPorteria3D = () => { const g = porteria(3, 1, 1); g.rotation.y = Math.PI; return g; };

  const crearFicha = (tk) => {
    if (tk.type === "ball") return balon3D();
    if (tk.type === "cone") return cono3D();
    if (tk.type === "disc") return disco3D();
    if (tk.type === "goal") return miniPorteria3D();
    return jugador3D(tk.type === "away" ? "away" : "home", tk.label);
  };

  /* Trazos en el suelo */
  let opacidadTrazo = 1;
  const matTrazo = (color) => new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.35, roughness: 0.5,
    ...(opacidadTrazo < 1 ? { transparent: true, opacity: opacidadTrazo, depthWrite: false } : {}),
  });
  const tubo = (pts, color, radio = 0.16) => {
    if (pts.length < 2) return null;
    const curva = new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.2);
    const m = new THREE.Mesh(new THREE.TubeGeometry(curva, Math.max(8, pts.length * 6), radio, 8, false), matTrazo(color));
    m.castShadow = opacidadTrazo >= 1;
    return m;
  };
  const punta = (desde, hasta, color) => {
    const dir = hasta.clone().sub(desde).normalize();
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.4, 14), matTrazo(color));
    m.position.copy(hasta);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return m;
  };
  const sobreSuelo = (p, y = 0.12) => { const m = aMetros(p); return new THREE.Vector3(m.x, y, m.z); };
  const ondulado = (a, b) => {
    const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz) || 1;
    const ux = dx / len, uz = dz / len, nx = -uz, nz = ux;
    const out = [a.clone()];
    const paso = 1.4, amp = 0.55;
    for (let d = paso, k = 0; d < len - paso; d += paso, k++) {
      const s = (k % 2 ? 1 : -1) * amp;
      out.push(new THREE.Vector3(a.x + ux * d + nx * s, a.y, a.z + uz * d + nz * s));
    }
    out.push(b.clone());
    return out;
  };
  const pintarTrazos = (shapes) => {
    capaJugada.remove(capaTrazos);
    capaTrazos.traverse((o) => { o.geometry?.dispose?.(); });
    capaTrazos = new THREE.Group();
    for (const s of shapes || []) {
      const color = s.color || "#FFFFFF";
      const pts = (s.pts || []).map((p) => sobreSuelo(p));
      if (!pts.length) continue;
      opacidadTrazo = s.opacidad != null ? Number(s.opacidad) : 1;
      if (s.tool === "text" && s.num) {
        /* número de paso: chapa redonda flotando sobre su trazo */
        const sp = spriteTexto(String(s.text || ""), { fondo: color, borde: "#141414", color: "#141414" });
        sp.material.opacity = opacidadTrazo;
        sp.scale.set(1.9 * sp.userData.aspecto, 1.9, 1);
        sp.position.set(pts[0].x, 2.2, pts[0].z);
        sp.renderOrder = 11;
        capaTrazos.add(sp);
        continue;
      }
      if (s.tool === "text") {
        const sp = spriteTexto(String(s.text || ""), { color, tam: 120, ancho: 512 });
        sp.scale.set(2.2 * sp.userData.aspecto, 2.2, 1);
        sp.position.set(pts[0].x, 3, pts[0].z);
        capaTrazos.add(sp);
        continue;
      }
      if (s.tool === "zone" && pts.length >= 2) {
        const a = pts[0], b = pts[1];
        const w = Math.abs(b.x - a.x), d = Math.abs(b.z - a.z);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false }));
        m.rotation.x = -Math.PI / 2; m.position.set((a.x + b.x) / 2, 0.06, (a.z + b.z) / 2);
        capaTrazos.add(m);
        const borde = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, d)), new THREE.LineBasicMaterial({ color }));
        borde.rotation.x = -Math.PI / 2; borde.position.copy(m.position).setY(0.07);
        capaTrazos.add(borde);
        continue;
      }
      if (s.tool === "circle" && pts.length >= 2) {
        const r = Math.hypot(pts[1].x - pts[0].x, pts[1].z - pts[0].z);
        const disco = new THREE.Mesh(new THREE.CircleGeometry(r, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.15, depthWrite: false }));
        disco.rotation.x = -Math.PI / 2; disco.position.set(pts[0].x, 0.06, pts[0].z);
        const aro = new THREE.Mesh(new THREE.RingGeometry(r - 0.12, r + 0.12, 64), new THREE.MeshBasicMaterial({ color }));
        aro.rotation.x = -Math.PI / 2; aro.position.set(pts[0].x, 0.07, pts[0].z);
        capaTrazos.add(disco, aro);
        continue;
      }
      if (s.tool === "pass") {
        /* pase: discontinuo y algo elevado, como la trayectoria del balón */
        const a = pts[0], b = pts[pts.length - 1];
        const len = a.distanceTo(b);
        const elev = Math.min(2.2, len * 0.06);
        const curva = new THREE.QuadraticBezierCurve3(a, a.clone().add(b).multiplyScalar(0.5).setY(elev + 0.12), b);
        const tramos = Math.max(3, Math.floor(len / 1.6));
        for (let i = 0; i < tramos; i += 2) {
          const t0 = i / tramos, t1 = Math.min(1, (i + 1) / tramos);
          const seg = tubo([curva.getPoint(t0), curva.getPoint(t1)], color, 0.13);
          if (seg) capaTrazos.add(seg);
        }
        capaTrazos.add(punta(curva.getPoint(0.93), b, color));
        continue;
      }
      const recorrido = s.tool === "dribble" ? ondulado(pts[0], pts[pts.length - 1]) : pts;
      const t = tubo(recorrido, color);
      if (t) capaTrazos.add(t);
      if (s.tool === "arrow" || s.tool === "dribble") {
        const n = recorrido.length;
        capaTrazos.add(punta(recorrido[Math.max(0, n - 2)], recorrido[n - 1], color));
      }
    }
    opacidadTrazo = 1;
    capaJugada.add(capaTrazos);
  };

  /* Coloca las fichas. Con `animar`, cada una viaja desde donde estaba.
     Devuelve una promesa que se cumple cuando las fichas han llegado (al
     momento si no hay nada que mover), para encadenar pasos. */
  let anim = null;
  const acabarAnim = () => {
    if (!anim) return;
    const a = anim; anim = null;
    for (const v of a.viajes) v.obj.position.copy(v.hasta);
    a.ok();
  };
  const ponerJugada = ({ tokens = [], shapes = [] }, { animar = false, duracion = 1.1 } = {}) => {
    acabarAnim(); acabarPaso();
    const vivos = new Set();
    const viajes = [];
    for (const tk of tokens) {
      const id = String(tk.id ?? `${tk.type}-${tk.label}-${tk.x}-${tk.y}`);
      vivos.add(id);
      const dest = aMetros(tk);
      let f = fichas.get(id);
      if (!f || f.tipo !== tk.type || f.etiqueta !== tk.label) {
        if (f) { capaJugada.remove(f.obj); }
        const obj = crearFicha(tk);
        obj.userData.fichaId = id;
        obj.position.set(dest.x, 0, dest.z);
        capaJugada.add(obj);
        f = { obj, tipo: tk.type, etiqueta: tk.label };
        fichas.set(id, f);
        continue;
      }
      if (animar) viajes.push({ obj: f.obj, desde: f.obj.position.clone(), hasta: new THREE.Vector3(dest.x, 0, dest.z) });
      else f.obj.position.set(dest.x, 0, dest.z);
    }
    for (const [id, f] of fichas) if (!vivos.has(id)) { capaJugada.remove(f.obj); fichas.delete(id); }
    /* Los jugadores miran hacia donde van; si no se mueven, hacia el balón. */
    const balon = tokens.find((t) => t.type === "ball");
    if (balon) {
      const b = aMetros(balon);
      for (const [, f] of fichas) if (f.tipo === "home" || f.tipo === "away") {
        const v = viajes.find((x) => x.obj === f.obj);
        const mira = v && v.desde.distanceTo(v.hasta) > 0.5 ? v.hasta : new THREE.Vector3(b.x, 0, b.z);
        f.obj.rotation.y = Math.atan2(mira.x - f.obj.position.x, mira.z - f.obj.position.z);
      }
    }
    if (animar && viajes.length) {
      pintarTrazos([]);
      return new Promise((ok) => { anim = { viajes, t0: performance.now(), dur: duracion * 1000, shapes, ok }; });
    }
    pintarTrazos(shapes);
    return Promise.resolve();
  };

  /* ---------- jugadas paso a paso (ver jugada3d.js) ----------
     Un paso trae quién corre (ruta, salida y duración) y por dónde va el
     balón: pegado al pie de quien conduce o por el aire en un pase o un tiro. */
  const fichaBalon = () => { for (const [, f] of fichas) if (f.tipo === "ball") return f; return null; };
  const ALTO_BALON = 0;
  let paso = null;
  const acabarPaso = () => {
    if (!paso) return;
    const p = paso; paso = null;
    for (const m of p.movs) {
      const fin = m.curva.getPointAt(1);
      m.obj?.position.set(fin.x, 0, fin.z);
    }
    if (p.balon && p.balonFinal) { const b = aMetros(p.balonFinal); p.balon.obj.position.set(b.x, ALTO_BALON, b.z); }
    p.ok();
  };
  const reproducirPaso = (fase, { velocidad = 1 } = {}) => {
    acabarAnim(); acabarPaso();
    const curvaDe = (ruta) => {
      const pts = ruta.map((q) => { const m = aMetros(q); return new THREE.Vector3(m.x, 0, m.z); });
      return pts.length > 2 ? new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.4) : new THREE.LineCurve3(pts[0], pts[pts.length - 1] || pts[0]);
    };
    const movs = (fase.movs || []).map((m) => ({ ...m, obj: fichas.get(String(m.id))?.obj, curva: curvaDe(m.ruta) })).filter((m) => m.obj);
    const b = fichaBalon();
    const segs = (fase.segs || []).map((sg) => ({
      ...sg,
      a: sg.desde && (() => { const m = aMetros(sg.desde); return new THREE.Vector3(m.x, ALTO_BALON, m.z); })(),
      b: sg.hasta && (() => { const m = aMetros(sg.hasta); return new THREE.Vector3(m.x, ALTO_BALON, m.z); })(),
    }));
    return new Promise((ok) => {
      paso = { movs, segs, balon: b, balonFinal: fase.balonFinal, dur: fase.dur, t0: performance.now(), vel: velocidad, ok };
    });
  };
  const tickPaso = (now) => {
    if (!paso) return;
    const t = ((now - paso.t0) / 1000) * paso.vel;
    for (const m of paso.movs) {
      if (t < m.t0) continue;
      const k = Math.min(1, (t - m.t0) / m.dur), e = suave(k);
      const p = m.curva.getPointAt(e);
      m.obj.position.set(p.x, 0, p.z);
      if (k < 1) { const tg = m.curva.getTangentAt(Math.min(0.999, e)); m.obj.rotation.y = Math.atan2(tg.x, tg.z); }
    }
    if (paso.balon) {
      const bo = paso.balon.obj;
      for (const sg of paso.segs) {
        if (t < sg.t0) continue;
        const k = Math.min(1, (t - sg.t0) / sg.dur);
        if (sg.tipo === "vuelo") {
          bo.position.lerpVectors(sg.a, sg.b, k);
          bo.position.y = ALTO_BALON + sg.alto * 4 * k * (1 - k);
          bo.rotation.x += 0.35;
        } else if (sg.tipo === "sigue") {
          const f = fichas.get(String(sg.id));
          if (f) {
            /* pegado al pie, por delante de hacia donde corre */
            const ry = f.obj.rotation.y;
            bo.position.set(f.obj.position.x + Math.sin(ry) * 0.75, ALTO_BALON, f.obj.position.z + Math.cos(ry) * 0.75);
            if (k < 1) bo.rotation.x += 0.2;
          }
        }
      }
    }
    if (t >= paso.dur) acabarPaso();
  };

  /* Aros de selección bajo los jugadores elegidos, y una marca en el suelo. */
  const matMarca = new THREE.MeshBasicMaterial({ color: "#FFD54A", transparent: true, opacity: 0.95, depthWrite: false });
  let marcas = [];
  const marcar = (ids = []) => {
    marcas.forEach((m) => m.parent?.remove(m));
    marcas = [];
    for (const id of ids) {
      const f = fichas.get(String(id));
      if (!f) continue;
      const aro = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.86, 32), matMarca);
      aro.rotation.x = -Math.PI / 2; aro.position.y = 0.05; aro.renderOrder = 5;
      f.obj.add(aro);
      marcas.push(aro);
    }
  };
  const marcaSuelo = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 32), matMarca);
  marcaSuelo.rotation.x = -Math.PI / 2; marcaSuelo.visible = false; marcaSuelo.renderOrder = 5;
  scene.add(marcaSuelo);
  const marcarPunto = (p) => {
    marcaSuelo.visible = !!p;
    if (p) { const m = aMetros(p); marcaSuelo.position.set(m.x, 0.06, m.z); }
  };

  /* La cámara acompaña al balón: desplaza el encuadre con él sin cambiar
     el ángulo que haya elegido el entrenador. */
  let seguir = false;
  const seguirBalon = (on) => { seguir = !!on; };
  const tickSeguir = () => {
    if (!seguir || vuelo) return;
    const b = fichaBalon();
    if (!b) return;
    const objetivo = new THREE.Vector3(b.obj.position.x, 0, b.obj.position.z);
    const delta = objetivo.sub(controles.target).multiplyScalar(0.06);
    controles.target.add(delta);
    camara.position.add(delta);
    /* y se acerca, como una cámara de televisión que sigue la jugada */
    const off = camara.position.clone().sub(controles.target);
    const len = off.length(), cerca = vertical ? 62 : 52;
    if (len > cerca + 0.5) camara.position.copy(controles.target).addScaledVector(off.normalize(), len + (cerca - len) * 0.03);
  };

  /* Tocar el campo: un toque corto sin arrastrar (arrastrar es girar la
     cámara). Devuelve el jugador tocado, si lo hay, y el punto del césped. */
  if (alTocar) {
    const dom = renderer.domElement;
    const rc = new THREE.Raycaster();
    const plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const dedos = new Set();
    let toque = null;
    dom.addEventListener("pointerdown", (e) => {
      dedos.add(e.pointerId);
      toque = dedos.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null;
    });
    const soltar = (e) => {
      dedos.delete(e.pointerId);
      const tq = toque; toque = null;
      if (!tq || e.type === "pointercancel") return;
      if (Math.hypot(e.clientX - tq.x, e.clientY - tq.y) > 9 || performance.now() - tq.t > 650) return;
      const r = dom.getBoundingClientRect();
      rc.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camara);
      const jugadores = [];
      for (const [, f] of fichas) if (f.tipo === "home" || f.tipo === "away") jugadores.push(f.obj);
      const hit = rc.intersectObjects(jugadores, true)[0];
      let o = hit?.object, ficha = null;
      while (o && ficha == null) { ficha = o.userData?.fichaId ?? null; o = o.parent; }
      const q = new THREE.Vector3();
      const punto = rc.ray.intersectPlane(plano, q) ? aTablero(q) : null;
      alTocar({ ficha, punto });
    };
    dom.addEventListener("pointerup", soltar);
    dom.addEventListener("pointercancel", soltar);
  }

  /* ---------- cámara ---------- */
  const VISTAS = {
    tribuna: { pos: [0, 48, 74], obj: [0, 0, 3] },
    cenital: { pos: [0, 112, 0.1], obj: [0, 0, 0] },
    porteriaIzq: { pos: [-82, 20, 0], obj: [0, 0, 0] },
    porteriaDer: { pos: [82, 20, 0], obj: [0, 0, 0] },
    esquina: { pos: [-64, 32, 46], obj: [-6, 0, 0] },
  };
  /* En un móvil en vertical el campo a lo ancho no cabe: las vistas se giran
     para mirarlo a lo largo, como se ve desde detrás de una portería. */
  const VISTAS_V = {
    tribuna: { pos: [-78, 100, 0], obj: [6, 0, 0] },
    cenital: { pos: [-0.1, 110, 0], obj: [0, 0, 0] },
    porteriaIzq: { pos: [-86, 22, 0], obj: [0, 0, 0] },
    porteriaDer: { pos: [86, 22, 0], obj: [0, 0, 0] },
    esquina: { pos: [-78, 46, 40], obj: [-2, 0, 0] },
  };
  let vertical = false, ultimaVista = "tribuna";
  let vuelo = null;
  /* Encuadre: las vistas dan el ángulo; la distancia se calcula para que el
     campo entero quepa en la pantalla que haya (ancha, vertical, o compartida
     con el panel de pasos) y quede centrado. Se busca la distancia mínima a la
     que caben las cuatro esquinas y se corre el punto de mira hasta que el
     campo queda a la misma altura por arriba que por abajo. */
  const ESQUINAS = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => new THREE.Vector3(a * (LARGO / 2 + 2), 0, b * (ANCHO / 2 + 2)));
  const encuadrar = (pos0, obj0) => {
    const dir = pos0.clone().sub(obj0).normalize();
    const cam = camara.clone();
    const obj = obj0.clone();
    const medir = (d) => {
      cam.position.copy(obj).addScaledVector(dir, d);
      cam.lookAt(obj); cam.updateMatrixWorld();
      let cabe = true, y0 = 9, y1 = -9;
      for (const e of ESQUINAS) {
        const p = e.clone().project(cam);
        if (p.z > 1 || Math.abs(p.x) > 0.92 || Math.abs(p.y) > 0.9) cabe = false;
        y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
      }
      return { cabe, centro: (y0 + y1) / 2 };
    };
    const adelante = new THREE.Vector3(-dir.x, 0, -dir.z);
    const puedeCorrer = adelante.lengthSq() > 0.01;
    if (puedeCorrer) adelante.normalize();
    let d = pos0.distanceTo(obj0);
    for (let it = 0; it < 4; it++) {
      let lo = 10, hi = 420;
      for (let n = 0; n < 22; n++) { const m = (lo + hi) / 2; if (medir(m).cabe) hi = m; else lo = m; }
      d = hi;
      const { centro } = medir(d);
      if (!puedeCorrer || Math.abs(centro) < 0.03) break;
      obj.addScaledVector(adelante, centro * d * 0.3);
    }
    return { pos: obj.clone().addScaledVector(dir, d), obj };
  };
  let enPreset = false;
  const vista = (k) => {
    ultimaVista = k;
    const tabla = vertical ? VISTAS_V : VISTAS;
    const v = tabla[k] || tabla.tribuna;
    let obj = new THREE.Vector3(...v.obj);
    let pos = new THREE.Vector3(...v.pos);
    if (k === "tribuna" || k === "esquina" || k === "cenital") ({ pos, obj } = encuadrar(pos, obj));
    vuelo = {
      t0: performance.now(), dur: 900,
      p0: camara.position.clone(), p1: pos,
      o0: controles.target.clone(), o1: obj,
    };
    enPreset = true;
  };
  /* Si el entrenador mueve la cámara a mano, ya no se le reencuadra. */
  controles.addEventListener("start", () => { if (!vuelo) enPreset = false; });
  let giro = false;
  const autoGiro = (on) => { giro = !!on; controles.autoRotate = giro; controles.autoRotateSpeed = 0.9; };

  const ajustar = () => {
    const w = contenedor.clientWidth || 1, h = contenedor.clientHeight || 1;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    camara.aspect = w / h;
    /* en vertical (móvil) se abre el ángulo para que quepa el campo */
    camara.fov = w / h < 1 ? 62 : 40;
    camara.updateProjectionMatrix();
    /* al girar el móvil, o si cambia mucho la forma de la pantalla, la vista
       elegida se vuelve a encuadrar */
    const v = w / h < 1;
    const forma = w / h;
    if (v !== vertical) { vertical = v; vista(ultimaVista); }
    else if (enPreset && formaPrevia && Math.abs(forma - formaPrevia) / formaPrevia > 0.12) vista(ultimaVista);
    formaPrevia = forma;
  };
  let formaPrevia = 0;
  const ro = new ResizeObserver(ajustar);
  ro.observe(contenedor);
  ajustar();

  const suave = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  let raf = 0;
  const bucle = (now) => {
    raf = requestAnimationFrame(bucle);
    if (vuelo) {
      const k = Math.min(1, (now - vuelo.t0) / vuelo.dur), e = suave(k);
      camara.position.lerpVectors(vuelo.p0, vuelo.p1, e);
      controles.target.lerpVectors(vuelo.o0, vuelo.o1, e);
      if (k >= 1) vuelo = null;
    }
    tickPaso(now);
    tickSeguir();
    if (marcas.length || marcaSuelo.visible) {
      const pulso = 1 + 0.12 * Math.sin(now / 180);
      marcas.forEach((m) => m.scale.setScalar(pulso));
      marcaSuelo.scale.setScalar(pulso);
    }
    if (anim) {
      const k = Math.min(1, (now - anim.t0) / anim.dur), e = suave(k);
      for (const v of anim.viajes) v.obj.position.lerpVectors(v.desde, v.hasta, e);
      if (k >= 1) { const a = anim; anim = null; pintarTrazos(a.shapes); a.ok(); }
    }
    controles.update();
    renderer.render(scene, camara);
  };
  raf = requestAnimationFrame(bucle);

  const foto = () => renderer.domElement.toDataURL("image/png");
  const lienzo = () => renderer.domElement;

  const destruir = () => {
    acabarAnim(); acabarPaso();
    cancelAnimationFrame(raf);
    ro.disconnect();
    controles.dispose();
    scene.traverse((o) => {
      o.geometry?.dispose?.();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      mats.forEach((m) => { m.map?.dispose?.(); m.dispose?.(); });
    });
    renderer.dispose();
    renderer.domElement.remove();
  };

  return { ponerJugada, reproducirPaso, marcar, marcarPunto, seguirBalon, vista, autoGiro, foto, lienzo, destruir };
}
