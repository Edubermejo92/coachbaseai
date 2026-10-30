/* Marca y música de los vídeos que hace la app (el del once y el de cada
   jugador): el logo «CoachBase AI by EBLDigital» y la banda sonora.

   Música: por defecto la pista propia de CoachBase (public/musica, compuesta
   para la app con herramientas/componer-musica.py: sin derechos de nadie).
   El entrenador puede elegir una canción de su móvil; se guarda solo en ese
   dispositivo (IndexedDB) y nunca se sube: la app no reparte música de
   terceros. También puede quitarla. */

import { configMp4, grabarMp4, avisarDiag } from "./videoMp4.js";

const LOGO_URL = "/marca/coachbase-ebl.png";
const MUSICA_URL = "/musica/coachbase-intro.mp3";
export const MAX_CANCION = 25 * 1024 * 1024;

/* ---------- logo ---------- */
let logoPromesa = null;
export const cargarLogo = () => {
  if (!logoPromesa) {
    logoPromesa = new Promise((res) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => { logoPromesa = null; res(null); };
      img.src = LOGO_URL;
    });
  }
  return logoPromesa;
};

const rectRedondo = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

/* El logo es azul marino y los vídeos son oscuros: va sobre una tarjeta
   blanca. (cx, cy) es el centro de la tarjeta y `ancho` su ancho; el alto
   sale de la proporción del logo. */
export const pintarLogo = (ctx, img, cx, cy, ancho, alfa = 1) => {
  if (!img || alfa <= 0) return;
  const pad = Math.max(6, Math.round(ancho * 0.045));
  const w = ancho - pad * 2;
  const h = (w * img.height) / img.width;
  const alto = h + pad * 2;
  const x = cx - ancho / 2, y = cy - alto / 2;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alfa);
  ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 3;
  ctx.fillStyle = "#FFFFFF";
  rectRedondo(ctx, x, y, ancho, alto, Math.min(14, alto * 0.2));
  ctx.fill();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.drawImage(img, x + pad, y + pad, w, h);
  ctx.restore();
};

/* ---------- qué música (preferencia de este dispositivo) ---------- */
const CLAVE = "cb_video_musica";
export const OPCIONES_MUSICA = ["coachbase", "propia", "no"];
export const leerOpcionMusica = () => {
  try { const v = localStorage.getItem(CLAVE); return OPCIONES_MUSICA.includes(v) ? v : "coachbase"; }
  catch { return "coachbase"; }
};
export const guardarOpcionMusica = (v) => { try { localStorage.setItem(CLAVE, v); } catch { /* sin almacenamiento */ } };

/* ---------- la canción propia, en este dispositivo ---------- */
let cancionEnMemoria = null; // por si IndexedDB no está (modo privado de Safari)
const abrirDB = () => new Promise((res, rej) => {
  const r = indexedDB.open("cb-video", 1);
  r.onupgradeneeded = () => r.result.createObjectStore("cancion");
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
const enDB = async (modo, accion) => {
  const db = await abrirDB();
  try {
    return await new Promise((res, rej) => {
      const tx = db.transaction("cancion", modo);
      const r = accion(tx.objectStore("cancion"));
      tx.oncomplete = () => res(r?.result);
      tx.onerror = () => rej(tx.error);
      tx.onabort = () => rej(tx.error);
    });
  } finally { db.close(); }
};
export const guardarCancion = async (file) => {
  const c = { nombre: file.name || "canción", tipo: file.type || "", blob: file };
  cancionEnMemoria = c;
  try { await enDB("readwrite", (s) => s.put(c, "propia")); } catch { /* se queda en memoria */ }
  return c;
};
export const leerCancion = async () => {
  if (cancionEnMemoria) return cancionEnMemoria;
  try { cancionEnMemoria = (await enDB("readonly", (s) => s.get("propia"))) || null; } catch { /* sin IndexedDB */ }
  return cancionEnMemoria;
};

/* ---------- audio para grabar ---------- */
/* Hay que crearlo DENTRO del clic, antes de cualquier await: Safari solo deja
   sonar un AudioContext nacido de un gesto. */
export const crearAudio = () => {
  const Ctx = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
  if (!Ctx) return null;
  try { const ac = new Ctx(); ac.resume?.().catch(() => {}); return ac; } catch { return null; }
};

const decodificar = (ac, datos) => new Promise((res, rej) => {
  /* La forma con callbacks la entiende también el Safari antiguo. */
  const p = ac.decodeAudioData(datos, res, rej);
  if (p?.then) p.then(res, rej);
});
/* De un MP3 largo basta con el principio: el vídeo más largo dura ~35 s, y
   descomprimir entera una canción de 5 minutos son más de 100 MB de memoria
   en el móvil. Un MP3 se puede cortar por cualquier sitio (va en tramas
   sueltas); se respeta la etiqueta ID3 del principio, que puede traer la
   carátula. Lo que no sea MP3 (m4a…) se lee entero. */
const PRINCIPIO_MP3 = 2.5 * 1024 * 1024;
const principioMp3 = async (c) => {
  const esMp3 = /mpeg|mp3/i.test(c.tipo || "") || /\.mp3$/i.test(c.nombre || "");
  if (!esMp3 || c.blob.size <= PRINCIPIO_MP3 * 1.5) return null;
  const cab = new Uint8Array(await c.blob.slice(0, 10).arrayBuffer());
  const id3 = cab[0] === 0x49 && cab[1] === 0x44 && cab[2] === 0x33
    ? 10 + (((cab[6] & 0x7f) << 21) | ((cab[7] & 0x7f) << 14) | ((cab[8] & 0x7f) << 7) | (cab[9] & 0x7f))
    : 0;
  return c.blob.slice(0, id3 + PRINCIPIO_MP3).arrayBuffer();
};
const leerAudio = async (ac, opcion) => {
  if (opcion === "propia") {
    const c = await leerCancion();
    if (c?.blob) {
      try {
        const trozo = await principioMp3(c);
        if (trozo) {
          const b = await decodificar(ac, trozo);
          if (b.duration >= 40) return { buffer: b, origen: "propia" };
        }
      } catch { /* se prueba entera */ }
      try { return { buffer: await decodificar(ac, await c.blob.arrayBuffer()), origen: "propia" }; }
      catch { /* va la de CoachBase */ }
    }
  }
  const r = await fetch(MUSICA_URL);
  if (!r.ok) throw new Error(String(r.status));
  return { buffer: await decodificar(ac, await r.arrayBuffer()), origen: "coachbase" };
};

/* Deja lista la música para mezclarla en la grabación. null = vídeo mudo
   (sin música elegida, sin Web Audio o sin poder leer nada). Si la canción
   propia no se puede leer, se usa la de CoachBase y `origen` lo dice. */
export const prepararMusica = async (ac, opcion) => {
  if (!ac || opcion === "no") { try { ac?.close(); } catch { /* nada */ } return null; }
  let leido = null;
  try { leido = await leerAudio(ac, opcion); } catch { /* sin música */ }
  if (!leido) { try { ac.close(); } catch { /* nada */ } return null; }
  const { buffer, origen } = leido;
  const destino = ac.createMediaStreamDestination();
  const volumen = ac.createGain();
  volumen.gain.value = 0;
  /* El medidor va en medio: deja pasar el sonido tal cual y permite saber
     después si la música llegó a sonar de verdad en la grabación. */
  const medidor = ac.createAnalyser();
  medidor.fftSize = 1024;
  volumen.connect(medidor);
  medidor.connect(destino);
  const muestras = new Uint8Array(medidor.fftSize);
  let fuente = null, reloj = null, pico = 0;
  return {
    origen,
    buffer,
    pidioPropia: opcion === "propia",
    pista: destino.stream.getAudioTracks()[0],
    /* ¿Ha sonado algo? Si no, el navegador no dejó sonar la música y el
       vídeo ha salido mudo: mejor decirlo que entregarlo sin avisar. */
    get sono() { return pico > 0.01; },
    /* La misma mezcla (entra en 0,25 s y se funde el último segundo), hecha
       sin que tenga que sonar: para el MP4 que se monta a mano (videoMp4.js).
       Así la música no depende de que el navegador deje sonar el audio. */
    async renderizar(duracion, sampleRate = buffer.sampleRate) {
      const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const fin = Math.max(0.5, duracion);
      const oac = new Offline(2, Math.ceil(fin * sampleRate), sampleRate);
      const f = oac.createBufferSource();
      f.buffer = buffer;
      f.loop = true;
      const g = oac.createGain();
      f.connect(g);
      g.connect(oac.destination);
      g.gain.setValueAtTime(0, 0);
      g.gain.linearRampToValueAtTime(0.9, 0.25);
      g.gain.setValueAtTime(0.9, Math.max(0.3, fin - 1));
      g.gain.linearRampToValueAtTime(0, fin);
      f.start(0);
      const mezcla = await oac.startRendering();
      const d = mezcla.getChannelData(0);
      for (let i = 0; i < d.length && pico <= 0.01; i += 64) pico = Math.max(pico, Math.abs(d[i]));
      return mezcla;
    },
    /* Arranca con la grabación: entra en 0,25 s y se funde el último segundo. */
    empezar(duracion) {
      fuente = ac.createBufferSource();
      fuente.buffer = buffer;
      fuente.loop = true;
      fuente.connect(volumen);
      const t = ac.currentTime;
      const fin = t + Math.max(0.5, duracion);
      volumen.gain.setValueAtTime(0, t);
      volumen.gain.linearRampToValueAtTime(0.9, t + 0.25);
      volumen.gain.setValueAtTime(0.9, Math.max(t + 0.3, fin - 1));
      volumen.gain.linearRampToValueAtTime(0, fin);
      fuente.start(t);
      reloj = setInterval(() => {
        medidor.getByteTimeDomainData(muestras);
        for (let i = 0; i < muestras.length; i++) pico = Math.max(pico, Math.abs(muestras[i] - 128) / 128);
      }, 200);
    },
    parar() {
      clearInterval(reloj);
      try { fuente?.stop(); } catch { /* ya parada */ }
      try { ac.close(); } catch { /* ya cerrado */ }
    },
  };
};

/* ---------- formato del vídeo (si no se puede el MP4 de videoMp4.js) ---------- */
/* Último recurso, y aun así MP4 antes que WebM: un WebM no se puede mandar
   por WhatsApp (Edu, 30 oct 2026). Chrome graba MP4 con MediaRecorder desde
   la versión 126; con Opus, no con AAC: con AAC el vídeo salió MUDO en la
   galería de Edu (Android, octubre 2026) aunque el navegador decía que lo
   admitía. WebM solo si no queda otra; el MP4 a secas es para Safari. */
const CON_AUDIO = ["video/mp4;codecs=avc1,opus", "video/mp4;codecs=vp9,opus", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
const SIN_AUDIO = ["video/mp4;codecs=avc1", "video/mp4;codecs=vp9", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
export const tipoGrabacion = (conAudio) =>
  (conAudio ? CON_AUDIO : SIN_AUDIO).find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(m)) || "";
export const extensionDe = (tipo) => (String(tipo).startsWith("video/mp4") ? "mp4" : "webm");

/* Graba el lienzo (y la música, si hay) mientras `animar` dibuja; devuelve
   { url, ext } del vídeo. `animar` recibe la duración y resuelve al acabar.
   Primero, MP4 de verdad (H.264 + AAC, videoMp4.js), el que acepta todo el
   mundo; si el navegador no tiene esos codificadores, MediaRecorder. */
export const grabarLienzo = async (canvas, musica, duracion, animar) => {
  let cfg = null;
  try { cfg = await configMp4({ ancho: canvas.width, alto: canvas.height, conAudio: !!musica, sampleRate: musica?.buffer?.sampleRate, lienzo: canvas }); }
  catch { cfg = null; }
  if (cfg) {
    try {
      const audio = musica ? (sr) => musica.renderizar(duracion, sr) : null;
      const r = await grabarMp4(canvas, audio, animar, cfg);
      musica?.parar();
      return r;
    } catch (e) { console.warn("[vídeo] el MP4 no ha salido, se graba con MediaRecorder", e); }
  }
  const stream = canvas.captureStream(30);
  if (musica?.pista) stream.addTrack(musica.pista);
  const tipo = tipoGrabacion(!!musica?.pista);
  avisarDiag({ ruta: "mediarecorder", tipo });
  const opciones = { videoBitsPerSecond: 4_000_000, ...(musica?.pista ? { audioBitsPerSecond: 128_000 } : {}) };
  let rec;
  try { rec = new MediaRecorder(stream, tipo ? { mimeType: tipo, ...opciones } : opciones); }
  catch (e) { musica?.parar(); throw e; }
  const trozos = [];
  rec.ondataavailable = (e) => { if (e.data.size) trozos.push(e.data); };
  const hecho = new Promise((res, rej) => {
    rec.onstop = () => {
      musica?.parar();
      const mime = (rec.mimeType || tipo || "video/webm").split(";")[0];
      const blob = new Blob(trozos, { type: mime });
      /* Si el codificador falla a mitad, el vídeo sale vacío: mejor el
         mensaje de error que un archivo en blanco. */
      if (!blob.size) { rej(new Error("vídeo vacío")); return; }
      res({ url: URL.createObjectURL(blob), ext: extensionDe(mime) });
    };
  });
  rec.start(250);
  musica?.empezar(duracion);
  await animar();
  if (rec.state === "recording") rec.stop();
  return hecho;
};
