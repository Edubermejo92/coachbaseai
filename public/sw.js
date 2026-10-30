/* Service worker mínimo: solo cachea el cascarón de la app (JS, CSS, iconos)
   para que abra offline o con mala cobertura en el campo de fútbol. Las
   llamadas a la API (Airtable, Coach AI, Stripe -todo bajo /.netlify/-)
   NUNCA se cachean: son datos en vivo, y servir una respuesta vieja de la
   plantilla o de una propuesta sería peor que no responder. */
const CACHE = "cb-shell-v4";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/.netlify/")) return;
  /* La comprobación de versión nueva de la app (App.jsx): siempre a la red. */
  if (url.searchParams.has("cb-version")) return;

  /* Navegación (abrir la app): red primero, y si no hay red, el índice
     cacheado -para que al menos arranque y avise de que está offline. */
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  /* Resto de estáticos (JS, CSS, iconos): cache primero por velocidad,
     refrescando en segundo plano para que la próxima carga ya esté al día. */
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fresh = fetch(e.request).then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});

/* ---- Avisos del sistema ----
   Unos los lanza la app (registration.showNotification) mientras sigue viva
   en segundo plano; otros llegan por push desde el servidor (más abajo).
   Al tocarlos: si la app ya está abierta en alguna pestaña se trae al frente
   y se lleva al apartado del aviso (?tab=…); si no, se abre ahí. */
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const destino = e.notification.data?.url || "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
      /* Un aviso de una retransmisión en directo (/vivo/…) abre esa página, y
         no se lleva por delante la app si estaba abierta en otra pestaña. */
      const vivo = destino.startsWith("/vivo/");
      for (const c of cs) {
        const esVivo = new URL(c.url).pathname.startsWith("/vivo/");
        if ("focus" in c && esVivo === vivo) { c.navigate?.(destino); return c.focus(); }
      }
      return self.clients.openWindow(destino);
    })
  );
});

/* Push de verdad: lo manda el servidor (netlify/lib/avisos.mts) y llega
   aunque la app esté cerrada del todo: convocatoria pendiente, día de
   partido, parte de material, propuestas y el reloj del Modo partido.
   Si el mismo aviso ya está en pantalla -la app, viva en segundo plano, lo
   lanzó a su hora y el servidor llega un poco después- se cambia en silencio
   en vez de volver a sonar: los dos llevan la misma `clave`. */
self.addEventListener("push", (e) => {
  let d = { title: "COACHBASE", body: "" };
  try { d = { ...d, ...(e.data ? e.data.json() : {}) }; } catch { d.body = e.data ? e.data.text() : ""; }
  const tag = d.tag || "cb";
  e.waitUntil(
    self.registration.getNotifications({ tag }).then((previas) => {
      const repetida = !!d.clave && previas.some((n) => n.data && n.data.clave === d.clave);
      return self.registration.showNotification(d.title, {
        body: d.body, icon: "/icon-192.png", badge: "/icon-192.png", tag,
        renotify: !repetida, silent: repetida,
        data: { url: d.url || "/", clave: d.clave || "" },
      });
    })
  );
});

/* El navegador puede renovar la suscripción por su cuenta. La app se vuelve
   a apuntar sola en cuanto se abre (ver activarPush en App.jsx). */
