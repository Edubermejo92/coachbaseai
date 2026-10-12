# Memoria del proyecto — CoachBase AI

Última actualización: 2026-10-12

## Qué es
App web (React + Vite, `src/App.jsx` ~23k líneas) desplegada en Netlify, con funciones
serverless en `netlify/functions/`. Versión actual: 2.66.0.

## Backend de datos (estado actual: Airtable)
- Base Airtable **COACHBASE AI** `appDVtUWdtfzkV1sA`, 16 tablas:
  Clubes, Equipos, Jugadores, Usuarios, Normativa, Incidencias, Firmas, Galeria,
  Suscripciones, Partidos, Convocatorias, Entrenamientos, Propuestas,
  Partes de entreno, Config, Actas.
- Muchos campos son JSON guardado como texto (Planificacion, Jugadas, Asistencia,
  Alineacion, Datos…). Hay adjuntos (Escudo, Foto, Documento, Archivo, Fotos de material).
- El frontend **solo** habla con `/.netlify/functions/airtable` (constante `AIR` en App.jsx).
  La migración queda contenida en el backend:
  - `netlify/functions/airtable.mts` (~3.2k líneas: login, registro, usuarios, CRUD)
  - `netlify/functions/stripe.mts` (webhook → tabla Suscripciones)
  - `netlify/lib/uso-airtable.mts`
  - Pruebas: `pruebas/*.mjs` usan un Airtable falso (`pruebas/fakeair.mjs`). `npm test`.
- Auth propia: contraseñas SHA-256 + pepper en el campo Password; sesiones firmadas con
  `AUTH_SECRET` (o derivado de `AIRTABLE_TOKEN`).
- Variables de entorno: AIRTABLE_TOKEN, AIRTABLE_BASE, AUTH_SECRET, RESEND_API_KEY,
  MAIL_FROM, APP_URL, STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_WEBHOOK_SECRET.

## Supabase (cuenta de Edu, org `acudznspixnotjeqmppz`, región eu-central-1)
- `vjsowjjdeufpeiwmtnmr` "Edubermejo92's Project" — INACTIVO (pausado)
- `vwdnipvfjqeeezuhjstk` "Cat Health Tracker" — activo
- `fdlcdzlvvxqhzougcjwd` "PadelPulse Live" — activo; tablas profiles(4), matches(0),
  players(0), settings(4). **PadelPulse ya está en Supabase, no en Airtable.**
- Plan gratuito: máximo 2 proyectos activos → ya están los 2 ocupados.

## Otras bases Airtable (no son de este repo)
- `appHdsn9XmJrbnCem` Gestión de Campañas y CRM Chatbot
- `appGthxV35Lb9qih6` EBL Social Images Relay
- `appreBtChstRh79je` WhatsApp · EBLDigital

## Decisiones
- 2026-10-12: migrar solo CoachBase AI; auth propia se mantiene; app solo con datos de prueba.
- (pendiente) Proyecto Supabase destino para la migración de CoachBase AI de Airtable a Supabase — ver ACCIONES_FUTURAS.md
