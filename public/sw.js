/* Service worker mínimo: solo cachea el cascarón de la app (JS, CSS, iconos)
   para que abra offline o con mala cobertura en el campo de fútbol. Las
   llamadas a la API (Airtable, Coach AI, Stripe -todo bajo /.netlify/-)
   NUNCA se cachean: son datos en vivo, y servir una respuesta vieja de la
   plantilla o de una propuesta sería peor que no responder. */
const CACHE = "cb-shell-v1";

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
