# Acciones futuras

## Migración Airtable → Supabase (CoachBase AI)
Estado: **esperando a Edu: elegir proyecto Supabase destino** (org en plan Free = máx. 2 activos).

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

## Otros
- [ ] Decidir si las bases Airtable de EBLDigital (CRM Chatbot, Social Images, WhatsApp) también se migran
      (están fuera de este repo; probablemente las usan escenarios de Make).
