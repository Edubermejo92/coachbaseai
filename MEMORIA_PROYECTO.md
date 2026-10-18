# Memoria del proyecto — CoachBase AI

Última actualización: 2026-10-12

## Qué es
App web (React + Vite, `src/App.jsx` ~23k líneas) desplegada en Netlify (sitio `coachbase-ai`),
con funciones serverless en `netlify/functions/`. Versión 2.66.0. Master = ebldigital92@gmail.com.

## Datos: de Airtable a Supabase (2026-10-12)
- **Supabase**: proyecto `vjsowjjdeufpeiwmtnmr` ("Edubermejo92's Project", eu-central-1, plan Free),
  org `acudznspixnotjeqmppz` (cuenta edubermejo92). 16 tablas en `public` con los mismos ids `rec…`
  que Airtable, una columna por campo, enlaces como `text[]` por los dos lados + trigger
  `_sincronizar_enlaces` (tabla `_enlaces`), `_orden` para conservar el orden de Airtable.
  RLS activado SIN políticas: solo la service_role (funciones de Netlify). Bucket privado `coachbase`.
- Un intento anterior (26-jul, sin datos) se apartó al esquema `coachbase_julio` (no se borró: el
  sistema de permisos de la sesión bloquea los DROP). Su trigger `on_auth_user_created` en
  auth.users sigue puesto apuntando a ese esquema (no tengo permiso sobre auth.users).
- **2026-10-12: la app ya funciona sobre Supabase** (copia completa y verificada; ver ACCIONES_FUTURAS).
- **Airtable** (base `appDVtUWdtfzkV1sA`, 16 tablas) sigue intacta como respaldo (ya no se escribe en ella).
- Arquitectura elegida: **adaptador**. `airtable.mts`/`stripe.mts` siguen llamando a la API REST de
  Airtable; `netlify/lib/supabase-airtable.mts` intercepta esas llamadas y contesta desde Supabase
  (PostgREST + Storage). Se activa solo con `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`; quitarlas
  = volver a Airtable. Motivo: no reescribir ~3.000 líneas de lógica de permisos sobre datos de menores.
- Fuente única de la estructura: `netlify/lib/esquema-coachbase.mts` → `npm run sql` genera
  `supabase/migrations/20261012120000_coachbase.sql` (ya aplicada en Supabase).
- Migración de datos: `netlify/functions/migrar.mts`, de un solo uso, por pasos (límite 10 s de
  Netlify), protegida con `MIGRAR_CLAVE`, se niega si Supabase ya tiene datos.
- Auth: propia (PBKDF2 + sesiones HMAC). AUTH_SECRET → si no existe, AIRTABLE_TOKEN → si no,
  SUPABASE_SERVICE_ROLE_KEY. Quitar AIRTABLE_TOKEN sin AUTH_SECRET cierra todas las sesiones.

## Avisos push (2026-10-12, v2.67.0)
- Web Push propio (`netlify/lib/webpush.mts`, sin la librería web-push: es CommonJS y rompe al
  empaquetar en Netlify). Verificado en pruebas con http_ece + firma VAPID.
- Tablas Supabase `push_suscripciones`, `push_programados`, `push_enviados`; `_secreto()` lee Vault.
  Claves VAPID en Vault de `vjsowjjdeufpeiwmtnmr` (`vapid_publica`, `vapid_privada`).
- Reglas en `netlify/lib/avisos.mts`; funciones programadas avisos-reglas (*/5) y avisos-reloj (cada min).
- La convocatoria se marca como enviada al pulsar WhatsApp/Copiar (`?res=convocatoria-enviada`
  → tabla Convocatorias, una por equipo y día).
- Pestaña de la app: `src/App.jsx` lee `?tab=` al entrar (solo si el rol tiene ese apartado).
- Decidido con Edu: avisos de convocatoria/partido solo al cuerpo técnico (no a familias).

## Sincronización sin conexión (2026-10-12, v2.68.0)
- Pedida por Edu "como Cat Health Tracker". Elegido: cola sin conexión + icono/botón + refresco
  entre dispositivos. NO elegido: subir a la nube lo que hoy vive solo en el móvil (jugadas de
  pizarra, borrador de entreno, historial de llamadas).
- `src/sincro.js` (sin React, probado en Node) + `cbFetch` en App.jsx decide qué va a la cola.
  Respuesta en cola = 202 `{ok:true, queued:true}`; los mensajes de guardado dicen "Guardado
  en este móvil · se subirá solo" en vez de "Sincronizado".
- Arreglado de paso: al abrir la app se subía la copia local de la asistencia y del pase de
  lista sin leer antes la de la nube (podía pisar lo de otro entrenador). Ahora solo se sube si
  el contenido cambió respecto a lo último leído (asistBaseRef / attBaseRef).
- Diferencia con Cat Health: allí todo vive en el móvil y se sube; aquí la nube manda y el móvil
  guarda lo pendiente. Las altas sin clave local (actas ya tenían su reintento, partes con foto)
  siguen sin cola.

## Superwall (paywalls y tests A/B en la web, v2.70.0)
- SDK web `@superwall/paywalls-js` 0.3.2 (fijado). Todo en `src/superwall.js`; App.jsx solo llama
  a sus funciones. **Sin `VITE_SUPERWALL_WEB_KEY` no se carga nada** (ni el código del SDK, que va
  con import() dinámico) y la app funciona como antes. La clave es la pk_ de una app **Web** del
  panel de Superwall: las de iOS (pk_uhuICu…) y Android (pk_xLJx1…) no valen para la web.
  Es de compilación (Vite): tras ponerla en Netlify hace falta un deploy nuevo.
- Decidido con Edu: **Stripe sigue cobrando y decidiendo quién es PRO**. PurchaseController propio;
  el botón de compra del paywall no cobra en Superwall: el SDK emite `transaction_start` y se abre
  nuestro checkout (`goCheckout`). Los productos del paywall deben llamarse `mensual`, `temporada`,
  `club_s|m|l` (o el price_id de Stripe) y NO usar el checkout de Stripe de Superwall.
  Estado: `setSubscriptionStatus` con `isPro` (entitlement `pro`). "Restaurar" = releer la suscripción.
- Solo cuerpo técnico con cuenta real: ni familias, ni jugadores, ni máster, ni demo.
  identify = `session.userId` (id rec… de la cuenta); reset al cerrar sesión.
- Placements: `funcion_pro` (param `funcion`: video, discipline, cargas, general o la clave del
  apartado bloqueado) y `fin_prueba` (param `dias`). Si no hay campaña, falla o no hay clave,
  se hace lo de siempre (aviso PRO / pantalla Premium).
- Atributos: rol, plan (pro/gratis), enPrueba, diasPrueba, enClub, categoria, futbol7, jugadores,
  idioma, comunidad. `sw.page(tab)` en cada cambio de apartado.
- Vista previa: abrir la app con `?sw_test=1` (modo prueba, compras simuladas) y `?sw_test=0` lo quita.
- Enlaces desde el paywall: `?tab=alineacion` o `coachbase://alineacion` abren ese apartado.
- WASM del motor de reglas: vite.config.js (`superscriptSoloUrl`) obliga a cargarlo por URL desde
  /assets (1,2 MB, solo si Superwall está activo); la carga por defecto rompe el build de Vite.
- Desde el contenedor de Claude no hay red a superwall.com (proxy 403): no se pudo leer la
  documentación ni ver un paywall real; probado que sin clave no cambia nada y que con clave
  (sin red) vuelve a lo de siempre sin errores.

## Pizarra 3D (v2.78.0)
- Motor en `src/pizarra3d.js` con Three.js 0.185.0 (fijado). Se carga con import() al pulsar «3D»
  en la pizarra: chunk aparte de ~145 KB gzip que no pesa en el resto de la app.
- Pinta la pizarra tal cual (fichas y trazos del campo entero 1000×640; el rectángulo de cal
  12..988 × 12..628 = campo de 105×68 m). Solo en el campo entero: los tableros de ABP tienen
  otra escala y avisan. Mismo candado PRO que PNG y vídeo.
- Vistas tribuna / cenital / detrás de cada portería / esquina, con juego propio en vertical
  (móvil) mirando el campo a lo largo. Pasos de la pizarra animados; foto PNG y vídeo
  (MediaRecorder del lienzo WebGL; mp4 si el navegador puede, si no webm).
- El visor va en un portal a <body>: la pizarra a pantalla completa en móvil va girada con
  transform y un fixed dentro de un padre transformado se descoloca.
- Creador de jugadas 3D (v2.79.0), pestaña «Crear jugada» del visor o Jugadas → «Nueva jugada
  3D»: campo a la izquierda y pasos a la derecha (debajo en móvil vertical). Acciones: pase,
  desmarque, conducción, arrastra defensa, dobla, presión y tiro; «a la vez» junta acciones en
  un paso. `src/jugada3d.js` (funciones puras) las convierte en movimientos con tiempos; el
  motor las reproduce (`reproducirPaso`) con el balón de pie en pie. Se eligen jugadores con
  botones o tocándolos en el 3D, y destinos tocando el césped.
- Se guarda como una jugada más (`plays`, con `jugada3d: { acciones, balonEn }` y las flechas
  numeradas como trazos 2D), así se comparte con el equipo y se ve en 2D. Vídeo con rótulos
  (nombre de la jugada + paso) compuestos en un lienzo 2D encima del 3D.

## Pretemporada por equipo (v2.81.0)
- Ya no hay plan fijo en la app: el de ejemplo (Infantil B, S1–S12 de septiembre) se retiró a
  petición de Edu ("cada entrenador tiene su forma de hacer pretemporada"). Cada equipo crea la
  suya en Temporada → Pretemporada: semanas (fase, desde/hasta, idea) con sesiones (minutos,
  RPE, prioridad, carga, objetivo, bloques). Se numeran solas S1, S2… y se reparten por los
  días de entreno; salen en Calendario y se cargan en Entrenamiento como antes.
- Nube: `equipos.pretemporada` (JSON, solo Supabase, fldPretemp0radaQ7), recurso
  `res=pretemporada` (mismas reglas que cargas; valida forma y tamaño), en la cola sin conexión.
- Edita quien tiene `editTraining`; la demo es de solo lectura.
- Limpieza hecha: en Supabase se quitaron las referencias `plan`/`p` al plan viejo en
  `cargas_fisicas` del Infantil B; en los dispositivos, un objetivo de Entrenamiento que
  venga del plan viejo ("S1 · Reentrada colectiva — …") se vacía al abrir (PT_EJEMPLO_RETIRADO).

## Netlify (lecciones)
- El conector MCP de Netlify (manage-env-vars) dice "upserted" pero NO guarda nada si se le pasan
  scopes parciales (p. ej. ["functions","runtime"]) o is_secret=true con scopes "all". Solo funciona
  con scopes ["all"], y nunca marca la variable como secreta: eso hay que hacerlo desde el panel.
  Comprobar siempre con getAllEnvVars después.
- Las variables solo llegan a las funciones tras un deploy nuevo (push a la rama de producción
  `claude/coachbase-chamartín-documento-hy5fa3`).

## Pruebas
- `npm test` = `pruebas/todas.mjs`: todas las pruebas en modo Airtable (fakeair) y en modo Supabase
  (PGlite = Postgres real + `pruebas/fakesupabase.mjs`). 2026-10-12: 263 ✓ / 326 ✓, 0 fallos.
- Desde la sesión de Claude NO hay red hacia airtable.com ni supabase.co (proxy 403): la prueba
  real contra Supabase la hace la propia app en Netlify.

## Otras apps / cuentas
- **PadelPulse Live**: Supabase `fdlcdzlvvxqhzougcjwd` (ya estaba en Supabase; no se tocó).
- **Cat Health Tracker**: movido a la cuenta **edubon007** → proyecto `drlqsrqgvdurrvllyvim`
  (org `olljrvfudamfvdhfjtyr`; edubermejo92 es Developer ahí, no cuenta para el límite Free).
  Esquema, Vault (VAPID + cron_secret), Edge Function `send-reminder-pushes`, usuario (mismo id y
  contraseña), datos y suscripción push copiados. App (repo Edubermejo92/Cat-Health-Tracker-Repo)
  apuntando al nuevo proyecto (commit 4c0dfe3 en main). Proyecto viejo `vwdnipvfjqeeezuhjstk` borrado.
- Bases Airtable de EBLDigital (no son de este repo): CRM Chatbot `appHdsn9XmJrbnCem`,
  Social Images Relay `appGthxV35Lb9qih6`, WhatsApp `appreBtChstRh79je`.
- Límite Supabase Free: 2 proyectos activos por usuario (sumando orgs donde es Owner/Admin).

## Decisiones
- 2026-10-12: migrar solo CoachBase AI; auth propia se mantiene; app solo con datos de prueba.
- 2026-10-12: CoachBase va al proyecto `vjsowjjdeufpeiwmtnmr`; Cat Health se va a edubon007.
- 2026-10-12: adaptador en vez de reescritura; tablas tipadas (no JSON genérico); adjuntos privados
  con enlaces firmados de 7 días.
