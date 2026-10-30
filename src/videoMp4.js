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
   graba como antes (videoMarca.js).

   Que el navegador diga que un codificador "está" no quiere decir que
   funcione: el del móvil de Edu decía que sí y el vídeo del once siguió
   saliendo en WebM (30 oct 2026). Por eso se prueban todos de verdad antes
   de empezar -un fotograma de vídeo; el audio entero, y que suene- y se pasa
   al siguiente: H.264 al tamaño justo, H.264 a múltiplos de 16 (lo que
   piden muchos codificadores de móvil), H.264 por software y, si no, VP9,
   que Chrome lleva siempre y que dentro de un MP4 también se comparte.
   ============================================================ */
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
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
/* Algún codificador de móvil se queda colgado en vez de fallar. */
const aTiempo = (p, ms, que) => Promise.race([p, espera(ms).then(() => { throw new Error(`${que}: no responde`); })]);

/* Lo que ha pasado en la última grabación, para el registro del servidor
   (App.jsx escucha "cb:video"): qué codificadores se han probado, cuáles
   han fallado y por dónde ha salido. Sin datos de nadie, solo técnica. */
const intentos = [];
const anota = (x) => { if (intentos.length < 24) intentos.push(String(x?.message || x).slice(0, 160)); };
export const avisarDiag = (detalle) => {
  try { window.dispatchEvent(new CustomEvent("cb:video", { detail: { ...detalle, intentos: intentos.splice(0) } })); } catch { /* sin ventana */ }
};

/* Las configuraciones con las que se puede intentar el MP4 en este navegador,
   de mejor a peor, o null. Con `lienzo`, el vídeo ya se prueba aquí y queda
   solo el codificador que funciona: así quien llama sabe antes de empezar
   si tiene que grabar de otra forma. `__cbMp4Codecs` solo lo ponen las
   pruebas: el Chromium de pruebas no trae H.264 ni AAC y se comprueba el
   mismo camino con VP9 y Opus. */
export async function configMp4({ ancho, alto, conAudio, sampleRate = 48000, lienzo = null }) {
  intentos.length = 0;
  if (typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined") { anota("sin WebCodecs"); return null; }
  /* H.264 pide lados pares: a un lienzo impar se le recorta un píxel. */
  const W = ancho - (ancho % 2), H = alto - (alto % 2);
  if (W < 16 || H < 16) return null;
  const m16 = (n) => Math.max(16, Math.round(n / 16) * 16);
  const prueba = typeof window !== "undefined" ? window.__cbMp4Codecs : null;
  const avc = (codec) => (codec.startsWith("avc") ? { avc: { format: "avc" } } : {});
  const base = (codec, w, h) => ({ codec, width: w, height: h, bitrate: 4_000_000, framerate: FPS, ...avc(codec) });
  const candidatos = prueba?.video
    ? [base(prueba.video, W, H)]
    : [
        ...h264(W, H).map((c) => base(c, W, H)),
        ...(W % 16 || H % 16 ? h264(m16(W), m16(H)).map((c) => base(c, m16(W), m16(H))) : []),
        ...h264(W, H).map((c) => ({ ...base(c, W, H), hardwareAcceleration: "prefer-software" })),
        base("vp09.00.31.08", W, H),
      ];
  let videos = [];
  for (const c of candidatos) {
    const ok = await soporta(VideoEncoder, c);
    if (ok) videos.push(ok); else anota(`no admite ${nombreV(c)}`);
  }
  if (lienzo) {
    const vale = await primeroQueFunciona(lienzo, videos);
    videos = vale ? [vale] : [];
  }
  if (!videos.length) return null;

  const audios = [];
  if (conAudio) {
    if (typeof AudioEncoder === "undefined" || typeof AudioData === "undefined") { anota("sin AudioEncoder"); return null; }
    const vistos = new Set();
    const cand = [
      ...[...new Set([sampleRate, 48000, 44100])].map((sr) => ({ codec: prueba?.audio || "mp4a.40.2", sampleRate: sr })),
      /* Sin AAC, Opus dentro del MP4: lo reproducen Android, WhatsApp y la
         galería, y sigue siendo un MP4, que es lo que piden para compartirlo
         (un WebM lo mandan como documento o lo rechazan). */
      { codec: "opus", sampleRate: 48000 },
    ];
    for (const { codec, sampleRate: sr } of cand) {
      if (vistos.has(`${codec}@${sr}`)) continue;
      vistos.add(`${codec}@${sr}`);
      const ok = await soporta(AudioEncoder, { codec, sampleRate: sr, numberOfChannels: 2, bitrate: 128_000 });
      if (ok) audios.push(ok); else anota(`no admite ${codec}@${sr}`);
    }
    if (!audios.length) return null;
  }
  return { videos, audios, video: videos[0], audio: audios[0] || null, probado: !!lienzo };
}

const codecMuxer = (codec) => (codec.startsWith("avc") ? "avc" : codec.startsWith("vp09") ? "vp9" : codec.startsWith("av01") ? "av1" : "hevc");

/* El pico de una parte del audio (0…1). */
const picoDe = (datos, desde = 0, hasta = datos.length) => {
  let p = 0;
  for (let i = desde; i < hasta; i += 7) { const v = Math.abs(datos[i]); if (v > p) p = v; }
  return p;
};

/* Codifica el audio entero con una configuración. Devuelve los trozos o
   lanza si el codificador falla, no da la cabecera que necesita el MP4 o
   devuelve silencio cuando la música suena (el MP4 mudo de Android). */
async function codificarAudio(buffer, cfgA) {
  const trozos = [];
  let fallo = null;
  const ae = new AudioEncoder({ output: (c, m) => trozos.push({ c, m }), error: (e) => { fallo = fallo || e; } });
  ae.configure(cfgA);
  const sr = buffer.sampleRate, total = buffer.length, BLOQUE = 1024;
  const izq = buffer.getChannelData(0), der = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : izq;
  for (let i = 0; i < total && !fallo; i += BLOQUE) {
    const n = Math.min(BLOQUE, total - i);
    const datos = new Float32Array(n * 2);
    datos.set(izq.subarray(i, i + n), 0);
    datos.set(der.subarray(i, i + n), n);
    const ad = new AudioData({ format: "f32-planar", sampleRate: sr, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((i / sr) * 1e6), data: datos });
    ae.encode(ad);
    ad.close();
    /* Que no se acumule todo el audio en la cola del codificador. */
    if (ae.encodeQueueSize > 64) await espera(0);
  }
  await aTiempo(ae.flush(), 30000, "audio");
  try { ae.close(); } catch { /* ya cerrado */ }
  if (fallo) throw fallo;
  if (!trozos.length) throw new Error("audio vacío");
  const dc = trozos.find((x) => x.m?.decoderConfig)?.m.decoderConfig;
  if (cfgA.codec.startsWith("mp4a") && !dc?.description?.byteLength) throw new Error("AAC sin cabecera");

  /* ¿Suena? Se decodifica el tramo del medio y se compara con la música. */
  const mitad = Math.floor(total / 2), ventana = Math.min(total, sr * 4);
  const picoFuente = picoDe(izq, Math.max(0, mitad - ventana / 2), Math.min(total, mitad + ventana / 2));
  if (picoFuente > 0.02 && typeof AudioDecoder !== "undefined" && dc) {
    let pico = 0, falloDec = false;
    const dec = new AudioDecoder({
      output: (d) => {
        try { const a = new Float32Array(d.numberOfFrames); d.copyTo(a, { planeIndex: 0, format: "f32-planar" }); pico = Math.max(pico, picoDe(a)); }
        catch { falloDec = true; }
        d.close();
      },
      error: () => { falloDec = true; },
    });
    try {
      dec.configure({ codec: dc.codec || cfgA.codec, sampleRate: dc.sampleRate || cfgA.sampleRate, numberOfChannels: dc.numberOfChannels || 2, ...(dc.description ? { description: dc.description } : {}) });
      const centro = Math.floor(trozos.length / 2), n = Math.ceil(ventana / BLOQUE / 2);
      for (const { c } of trozos.slice(Math.max(0, centro - n), centro + n)) dec.decode(c);
      await aTiempo(dec.flush(), 8000, "decodificador");
    } catch { falloDec = true; }
    try { dec.close(); } catch { /* ya cerrado */ }
    /* Si no se puede decodificar aquí, no se sabe: se da por bueno. */
    if (!falloDec && pico < picoFuente * 0.05) throw new Error(`${cfgA.codec} sale mudo (${pico.toFixed(4)} de ${picoFuente.toFixed(3)})`);
  }
  return { trozos, dc };
}

/* De dónde sale cada fotograma: el lienzo tal cual, recortado un píxel si es
   impar, o redimensionado en un lienzo aparte (múltiplos de 16). */
const fuenteDe = (canvas, w, h) => {
  if (canvas.width === w && canvas.height === h) return (o) => new VideoFrame(canvas, o);
  if (Math.abs(canvas.width - w) <= 1 && Math.abs(canvas.height - h) <= 1 && canvas.width >= w && canvas.height >= h) {
    return (o) => new VideoFrame(canvas, { ...o, visibleRect: { x: 0, y: 0, width: w, height: h } });
  }
  const aux = document.createElement("canvas");
  aux.width = w; aux.height = h;
  const ctx = aux.getContext("2d");
  return (o) => { ctx.drawImage(canvas, 0, 0, w, h); return new VideoFrame(aux, o); };
};

/* Prueba un codificador de vídeo con un fotograma de verdad. */
async function probarVideo(canvas, cfgV) {
  let fallo = null, meta = null, salida = 0;
  const ve = new VideoEncoder({ output: (c, m) => { salida++; if (m?.decoderConfig) meta = m.decoderConfig; }, error: (e) => { fallo = fallo || e; } });
  try {
    ve.configure(cfgV);
    const f = fuenteDe(canvas, cfgV.width, cfgV.height)({ timestamp: 0, duration: Math.round(1e6 / FPS) });
    ve.encode(f, { keyFrame: true });
    f.close();
    await aTiempo(ve.flush(), 5000, "vídeo");
  } catch (e) { fallo = fallo || e; }
  try { ve.close(); } catch { /* ya cerrado */ }
  if (fallo) throw fallo;
  if (!salida) throw new Error("no saca fotogramas");
  if (cfgV.codec.startsWith("avc") && !meta?.description?.byteLength) throw new Error("H.264 sin cabecera");
  if (cfgV.codec.startsWith("vp09") && !meta?.colorSpace) throw new Error("VP9 sin espacio de color");
}

const nombreV = (v) => `${v.codec} ${v.width}x${v.height}${v.hardwareAcceleration ? " sw" : ""}`;
async function primeroQueFunciona(canvas, videos) {
  for (const v of videos) {
    try { await probarVideo(canvas, v); return v; }
    catch (e) { anota(`${nombreV(v)}: ${e?.message || e}`); }
  }
  return null;
}

/* Graba el lienzo mientras `animar` dibuja (resuelve al acabar) y le pone el
   audio ya mezclado. `audio`: AudioBuffer, función (sampleRate) => Promise
   <AudioBuffer> o null. Devuelve { url, ext }. */
export async function grabarMp4(canvas, audio, animar, cfg) {
  const videos = cfg.videos || [cfg.video];
  const audios = cfg.audios || (cfg.audio ? [cfg.audio] : []);

  /* 1 · El audio, entero y comprobado, antes de empezar: no depende del reloj. */
  let pistaAudio = null, cfgA = null;
  if (audio && audios.length) {
    const buffers = new Map();
    for (const a of audios) {
      try {
        if (!buffers.has(a.sampleRate)) buffers.set(a.sampleRate, typeof audio === "function" ? await audio(a.sampleRate) : audio);
        pistaAudio = await codificarAudio(buffers.get(a.sampleRate), a);
        cfgA = a;
        break;
      } catch (e) { anota(`${a.codec}@${a.sampleRate}: ${e?.message || e}`); }
    }
    if (!pistaAudio) throw new Error("ningún codificador de audio funciona");
  }

  /* 2 · El primer codificador de vídeo que funciona de verdad (si
     configMp4 no lo ha probado ya). */
  const cfgV = cfg.probado ? videos[0] : await primeroQueFunciona(canvas, videos);
  if (!cfgV) throw new Error("ningún codificador de vídeo funciona");

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target, fastStart: "in-memory", firstTimestampBehavior: "offset",
    video: { codec: codecMuxer(cfgV.codec), width: cfgV.width, height: cfgV.height, frameRate: FPS },
    ...(pistaAudio ? { audio: { codec: cfgA.codec === "opus" ? "opus" : "aac", numberOfChannels: 2, sampleRate: cfgA.sampleRate } } : {}),
  });
  if (pistaAudio) for (const { c, m } of pistaAudio.trozos) muxer.addAudioChunk(c, m);

  let fallo = null;
  const ve = new VideoEncoder({ output: (c, m) => { try { muxer.addVideoChunk(c, m); } catch (e) { fallo = fallo || e; } }, error: (e) => { fallo = fallo || e; } });
  ve.configure(cfgV);

  /* 3 · Los fotogramas, a 30 por segundo, con la hora real de la animación:
     si el móvil va justo, se salta alguno pero el vídeo sigue cuadrando con
     la música. Si el codificador se atasca, se espera en vez de amontonar. */
  const fotograma = fuenteDe(canvas, cfgV.width, cfgV.height);
  const t0 = performance.now();
  let activo = true, ultimo = -1, n = 0;
  const tomar = () => {
    if (!activo || fallo) return;
    const k = Math.floor((performance.now() - t0) / (1000 / FPS));
    if (k > ultimo && ve.encodeQueueSize < 6) {
      ultimo = k;
      try {
        const f = fotograma({ timestamp: Math.round(k * (1e6 / FPS)), duration: Math.round(1e6 / FPS) });
        ve.encode(f, { keyFrame: n % (FPS * 2) === 0 });
        f.close();
        n++;
      } catch (e) { fallo = fallo || e; }
    }
    requestAnimationFrame(tomar);
  };
  tomar();
  try { await animar(); } finally { activo = false; }
  try { await aTiempo(ve.flush(), 20000, "vídeo"); } catch (e) { fallo = fallo || e; }
  try { ve.close(); } catch { /* ya cerrado */ }
  if (fallo) { anota(`grabando con ${cfgV.codec}: ${fallo?.message || fallo}`); throw fallo; }
  if (!n) throw new Error("vídeo vacío");
  muxer.finalize();
  avisarDiag({ ruta: "mp4", video: nombreV(cfgV), audio: cfgA ? `${cfgA.codec}@${cfgA.sampleRate}` : "", fotogramas: n });
  return { url: URL.createObjectURL(new Blob([target.buffer], { type: "video/mp4" })), ext: "mp4" };
}
