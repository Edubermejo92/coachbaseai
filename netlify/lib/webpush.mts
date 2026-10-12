/* ================= WEB PUSH SIN DEPENDENCIAS =================
   Envío de una notificación push a un navegador, con WebCrypto y fetch.
   No se usa la librería web-push: es CommonJS y, empaquetada como módulo ES
   en una función de Netlify, revienta con "Dynamic require of crypto".

   Dos piezas, las dos estándar:
   - VAPID (RFC 8292): un JWT firmado con ES256 que dice al servicio de push
     del navegador quién manda el aviso.
   - Cifrado aes128gcm (RFC 8291 + RFC 8188): el contenido va cifrado para
     ese navegador concreto; el servicio de push no lo puede leer.
   pruebas/pruebas18.mjs descifra lo que sale de aquí con la librería de
   referencia (http_ece) y verifica la firma, para que esto no sea un "parece
   que funciona". */

const te = new TextEncoder();
const b64u = (b: Uint8Array) =>
  btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const deB64u = (s: string) => {
  const p = s.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(p + "=".repeat((4 - (p.length % 4)) % 4)), (c) => c.charCodeAt(0));
};
const unir = (...partes: Uint8Array[]) => {
  const out = new Uint8Array(partes.reduce((n, p) => n + p.length, 0));
  let i = 0;
  for (const p of partes) { out.set(p, i); i += p.length; }
  return out;
};

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, bytes: number) {
  const k = await crypto.subtle.importKey("raw", ikm as BufferSource, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: salt as BufferSource, info: info as BufferSource }, k, bytes * 8));
}

/* JWT de VAPID. La clave privada es "d" (32 bytes) y la pública el punto
   sin comprimir (65 bytes: 0x04 + x + y), las dos en base64url, que es como
   las da cualquier generador de claves VAPID. */
async function jwtVapid(audiencia: string, sujeto: string, pub: string, priv: string) {
  const p = deB64u(pub);
  const clave = await crypto.subtle.importKey("jwk", {
    kty: "EC", crv: "P-256", d: priv, x: b64u(p.slice(1, 33)), y: b64u(p.slice(33, 65)), ext: true,
  }, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const cab = b64u(te.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const cuerpo = b64u(te.encode(JSON.stringify({ aud: audiencia, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: sujeto })));
  const firma = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, clave, te.encode(`${cab}.${cuerpo}`)));
  return `${cab}.${cuerpo}.${b64u(firma)}`;
}

/* Cifra el contenido para el navegador (RFC 8291, un solo registro). */
export async function cifrar(contenido: Uint8Array, p256dh: string, auth: string) {
  const uaPub = deB64u(p256dh);
  const secretoAuth = deB64u(auth);
  const efimera = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", efimera.publicKey));
  const uaClave = await crypto.subtle.importKey("raw", uaPub as BufferSource, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaClave }, efimera.privateKey, 256));
  const ikm = await hkdf(secretoAuth, ecdh, unir(te.encode("WebPush: info\0"), uaPub, asPub), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, te.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, te.encode("Content-Encoding: nonce\0"), 12);
  const k = await crypto.subtle.importKey("raw", cek as BufferSource, "AES-GCM", false, ["encrypt"]);
  /* 0x02 = último (y único) registro, sin relleno. */
  const cifrado = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce as BufferSource }, k, unir(contenido, new Uint8Array([2])) as BufferSource));
  const rs = new Uint8Array([0, 0, 16, 0]); // 4096
  return unir(salt, rs, new Uint8Array([asPub.length]), asPub, cifrado);
}

export type ResultadoPush = { estado: number; caducada: boolean; ok: boolean };
export async function enviarWebPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  contenido: string,
  vapid: { pub: string; priv: string; sujeto: string },
  opciones: { ttl?: number; urgencia?: "very-low" | "low" | "normal" | "high" } = {},
): Promise<ResultadoPush> {
  const u = new URL(sub.endpoint);
  const jwt = await jwtVapid(u.origin, vapid.sujeto, vapid.pub, vapid.priv);
  const cuerpo = await cifrar(te.encode(contenido), sub.p256dh, sub.auth);
  const r = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${jwt}, k=${vapid.pub}`,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: String(opciones.ttl ?? 3600),
      Urgency: opciones.urgencia || "high",
    },
    body: cuerpo,
  });
  return { estado: r.status, ok: r.status >= 200 && r.status < 300, caducada: r.status === 404 || r.status === 410 };
}
