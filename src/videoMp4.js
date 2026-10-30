/* ============================================================
   Vídeo MP4 de verdad: H.264 + AAC, montado en el propio móvil
   ------------------------------------------------------------
   MediaRecorder en Chrome graba WebM, que WhatsApp, Instagram, el iPhone y
   muchas galerías no aceptan ("el formato no es compatible", Edu, octubre
   2026); y su MP4 salió mudo en la galería de Android. Aquí se hace a mano:
   cada fotograma del lienzo pasa por el codificador H.264 del móvil
   (WebCodecs), la música se mezcla aparte -con su entrada y su salida, sin
   tener que sonar- y pasa por el de AAC, y mp4-muxer lo junta en un MP4
   normal (no fragmentado, con el índice al principio), el que abre todo el
   mundo. Si el navegador no tiene esos codificadores, se devuelve null y se
   graba como antes (videoMarca.js). ============================================================ */
import { Muxer, ArrayBufferTarget } from "mp4-muxer";

const FPS = 30;
/* Perfiles H.264 de más a menos compatible: el baseline lo reproduce hasta el
   móvil más viejo; si el codificador no lo tiene, main y luego high. El nivel
   va según el tamaño: 3.1 hasta 720p (los vídeos del once), 4.0 hasta 1080p
   y 5.1 para el lienzo 3D de una pantalla grande. */
const h264 = (ancho, alto) => {
  const mb = Math.ceil(ancho / 16) * Math.ceil(alto / 16);
  const nivel = mb <= 3600 ? "1F" : mb <= 8192 ? "28" : "33";
  return ["42E0", "4D40", "6400"].map((perfil) => `avc1.${perfil}${nivel}`);
};

const soporta = async (Clase, config) => {
  try { return (await Clase.isConfigSupported(config)).supported ? config : null; } catch { return null; }
};

/* La configuración con la que se puede hacer el MP4 en este navegador, o null.
   `__cbMp4Codecs` solo lo ponen las pruebas: el Chromium de pruebas no trae
   H.264 ni AAC y se comprueba el mismo camino con VP9 y Opus. */
export async function configMp4({ ancho, alto, conAudio, sampleRate = 48000 }) {
  if (typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined") return null;
  /* H.264 pide lados pares: a un lienzo impar se le recorta un píxel. */
  ancho -= ancho % 2; alto -= alto % 2;
  if (ancho < 16 || alto < 16) return null;
  const prueba = typeof window !== "undefined" ? window.__cbMp4Codecs : null;
  let video = null;
  for (const codec of prueba?.video ? [prueba.video] : h264(ancho, alto)) {
    video = await soporta(VideoEncoder, { codec, width: ancho, height: alto, bitrate: 4_000_000, framerate: FPS, ...(codec.startsWith("avc") ? { avc: { format: "avc" } } : {}) });
    if (video) break;
  }
  if (!video) return null;
  let audio = null;
  if (conAudio) {
    if (typeof AudioEncoder === "undefined" || typeof AudioData === "undefined") return null;
    for (const sr of [...new Set([sampleRate, 48000, 44100])]) {
      audio = await soporta(AudioEncoder, { codec: prueba?.audio || "mp4a.40.2", sampleRate: sr, numberOfChannels: 2, bitrate: 128_000 });
      if (audio) break;
    }
    /* Sin AAC, Opus dentro del MP4: lo reproducen Android, WhatsApp y la
       galería, y sigue siendo un MP4, que es lo que piden para compartirlo
       (un WebM lo mandan como documento o lo rechazan). */
    if (!audio) audio = await soporta(AudioEncoder, { codec: "opus", sampleRate: 48000, numberOfChannels: 2, bitrate: 128_000 });
    if (!audio) return null;
  }
  return { video, audio };
}

const codecMuxer = (codec) => (codec.startsWith("avc") ? "avc" : codec.startsWith("vp09") ? "vp9" : codec.startsWith("av01") ? "av1" : "hevc");

/* Graba el lienzo mientras `animar` dibuja (resuelve al acabar) y le pone el
   audio ya mezclado (`audio`: AudioBuffer o null). Devuelve { url, ext }. */
export async function grabarMp4(canvas, audio, animar, cfg) {
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target, fastStart: "in-memory", firstTimestampBehavior: "offset",
    video: { codec: codecMuxer(cfg.video.codec), width: cfg.video.width, height: cfg.video.height, frameRate: FPS },
    ...(audio && cfg.audio ? { audio: { codec: cfg.audio.codec === "opus" ? "opus" : "aac", numberOfChannels: 2, sampleRate: cfg.audio.sampleRate } } : {}),
  });
  let fallo = null;
  const ve = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: (e) => { fallo = fallo || e; } });
  ve.configure(cfg.video);

  /* El audio no depende del reloj: se codifica entero antes de empezar. */
  if (audio && cfg.audio) {
    const ae = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: (e) => { fallo = fallo || e; } });
    ae.configure(cfg.audio);
    const sr = audio.sampleRate, total = audio.length, BLOQUE = 1024;
    const izq = audio.getChannelData(0), der = audio.numberOfChannels > 1 ? audio.getChannelData(1) : izq;
    for (let i = 0; i < total && !fallo; i += BLOQUE) {
      const n = Math.min(BLOQUE, total - i);
      const datos = new Float32Array(n * 2);
      datos.set(izq.subarray(i, i + n), 0);
      datos.set(der.subarray(i, i + n), n);
      const ad = new AudioData({ format: "f32-planar", sampleRate: sr, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((i / sr) * 1e6), data: datos });
      ae.encode(ad);
      ad.close();
    }
    await ae.flush();
    ae.close();
  }

  /* Los fotogramas, a 30 por segundo, con la hora real de la animación: si el
     móvil va justo, se salta alguno pero el vídeo sigue cuadrando con la
     música. Si el codificador se atasca, se espera en vez de amontonar. */
  const t0 = performance.now();
  const W = cfg.video.width, H = cfg.video.height;
  const recorte = canvas.width !== W || canvas.height !== H ? { visibleRect: { x: 0, y: 0, width: W, height: H } } : {};
  let activo = true, ultimo = -1, n = 0;
  const tomar = () => {
    if (!activo || fallo) return;
    const t = performance.now() - t0;
    const k = Math.floor(t / (1000 / FPS));
    if (k > ultimo && ve.encodeQueueSize < 6) {
      ultimo = k;
      const f = new VideoFrame(canvas, { timestamp: Math.round(k * (1e6 / FPS)), duration: Math.round(1e6 / FPS), ...recorte });
      ve.encode(f, { keyFrame: n % (FPS * 2) === 0 });
      f.close();
      n++;
    }
    requestAnimationFrame(tomar);
  };
  tomar();
  try { await animar(); } finally { activo = false; }
  await ve.flush();
  ve.close();
  if (fallo) throw fallo;
  if (!n) throw new Error("vídeo vacío");
  muxer.finalize();
  return { url: URL.createObjectURL(new Blob([target.buffer], { type: "video/mp4" })), ext: "mp4" };
}
