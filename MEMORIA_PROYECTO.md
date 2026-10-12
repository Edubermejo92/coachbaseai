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
