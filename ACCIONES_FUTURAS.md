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
- [x] Archivo SQL con los datos (1 perfil, 3 gatos, 2 registros, 6 recordatorios) entregado a Edu.
- [ ] Edu: crear cuenta edubon007, proyecto nuevo, desplegar esquema desde GitHub, registrarse en la app y ejecutar el SQL.
- [ ] Edu: en el proyecto nuevo, crear la Edge Function de avisos push, sus secretos (VAPID) y el cron
      `send-reminder-pushes` (*/5 * * * *) si no vienen en el repo. Reactivar las notificaciones en el móvil.
- [ ] Edu: comprobar que todo funciona y luego pausar/borrar "Cat Health Tracker" en edubermejo92.
- [ ] Claude: reactivar `vjsowjjdeufpeiwmtnmr` y seguir con la migración de CoachBase.

## Otros
- [ ] Decidir si las bases Airtable de EBLDigital (CRM Chatbot, Social Images, WhatsApp) también se migran
      (están fuera de este repo; probablemente las usan escenarios de Make).
