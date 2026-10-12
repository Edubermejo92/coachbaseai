# Acciones futuras

## Migración Airtable → Supabase (CoachBase AI)
Estado: Edu eligió opción A (2026-10-12): pausar Cat Health Tracker y reactivar `vjsowjjdeufpeiwmtnmr`
para CoachBase. **Pendiente: Edu pausa Cat Health y reactiva el proyecto desde el panel de Supabase**
(desde la sesión de Claude el sistema de permisos bloqueó la pausa).

Enfoque técnico elegido: capa adaptadora `netlify/lib/` que imita la API de Airtable que ya usa
`airtable.mts` (list, get por id, create con typecast, PATCH simple/lote, DELETE simple/lote,
POST listRecords con FIND por ids, filtro por email, uploadAttachment, campos inversos de Equipos)
pero guarda en Supabase (tablas con columnas reales + Storage). Así no se reescriben ~3.000 líneas
de lógica de permisos y el frontend no cambia. `pruebas/fakeair.mjs` documenta exactamente esa superficie.

Decidido (2026-10-12): solo CoachBase AI (PadelPulse ya está en Supabase); se mantiene la auth propia
(hashes SHA-256+pepper copiados tal cual); no hay usuarios reales → cambio directo, sin modo paralelo.

Plan propuesto:
1. [ ] Elegir/crear proyecto Supabase destino (límite de 2 activos en plan gratis).
2. [ ] Crear esquema SQL (16 tablas, FKs en lugar de links, tablas puente para N:M, jsonb para los campos JSON).
3. [ ] Activar RLS en todas las tablas (acceso solo vía función con service_role).
4. [ ] Bucket de Storage para adjuntos (escudos, fotos, documentos, galería, material).
5. [ ] Script de migración de datos: Airtable → Supabase, conservando el id `rec…` como `airtable_id`.
6. [ ] Reescribir capa de datos de `airtable.mts`, `stripe.mts`, `uso-airtable.mts` contra Supabase,
       manteniendo la misma API hacia el frontend (sin tocar App.jsx salvo lo imprescindible).
7. [ ] Adaptar `pruebas/fakeair.mjs` → fake de Supabase y pasar `npm test` en verde.
8. [ ] Edu: añadir en Netlify `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (no se pueden leer desde aquí).
9. [ ] Desplegar en preview, probar login/registro/Stripe, y solo entonces producción.
10. [ ] Mantener Airtable en solo-lectura 2–4 semanas como respaldo antes de borrar nada.

## Cat Health → cuenta edubon007 (para liberar plaza en edubermejo92)
Proyecto nuevo: `drlqsrqgvdurrvllyvim` "Cat-Health-Tracker app" (org edubon007, eu-west-1).
edubermejo92 es Developer en esa org (no cuenta para el límite Free) → Claude tiene acceso por MCP.
- [x] Esquema (8 migraciones), bucket cat-photos, cron cada 5 min.
- [x] Vault: vapid_public_key, vapid_private_key, cron_secret (mismos valores que el viejo).
- [x] Edge Function send-reminder-pushes (verify_jwt=false), código idéntico; probada: 200 OK.
- [x] Usuario copiado con el mismo id y contraseña + perfil, 3 gatos, 2 registros, 6 recordatorios, suscripción push.
- [x] App apuntando al proyecto nuevo (commit 4c0dfe3 en main de Cat-Health-Tracker-Repo). Historial de migraciones
      del proyecto alineado con el repo (+ migración vacía 20261012123739_registro_historial_temporal).
- [ ] Edu: en el móvil, cerrar sesión y volver a entrar (el token antiguo no vale en el proyecto nuevo).
- [ ] Edu: Auth → URL Configuration del proyecto nuevo: Site URL y Redirect URLs = las de la app (como en el viejo).
- [ ] Edu: probar login + ver a Bambam; luego borrar "Cat Health Tracker" (`vwdnipvfjqeeezuhjstk`) en edubermejo92.
- [ ] Claude: reactivar `vjsowjjdeufpeiwmtnmr` y seguir con la migración de CoachBase.

## Otros
- [ ] Decidir si las bases Airtable de EBLDigital (CRM Chatbot, Social Images, WhatsApp) también se migran
      (están fuera de este repo; probablemente las usan escenarios de Make).
