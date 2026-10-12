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
- **Airtable** (base `appDVtUWdtfzkV1sA`, 16 tablas) sigue intacta como respaldo.
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

## Pruebas
- `npm test` = `pruebas/todas.mjs`: todas las pruebas en modo Airtable (fakeair) y en modo Supabase
  (PGlite = Postgres real + `pruebas/fakesupabase.mjs`). 2026-10-12: 263 ✓ / 286 ✓, 0 fallos.
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
