# Acciones futuras

## Migración Airtable → Supabase (CoachBase AI)
Hecho por Claude (2026-10-12, rama `ccr-70f0cfbb-b7o161`):
- [x] Proyecto Supabase `vjsowjjdeufpeiwmtnmr` reactivado; esquema viejo apartado a `coachbase_julio`.
- [x] 16 tablas + triggers de enlaces + RLS + bucket privado `coachbase` aplicados en Supabase.
- [x] Adaptador `netlify/lib/supabase-airtable.mts` enchufado en `airtable.mts` y `stripe.mts`.
- [x] Función de migración única `netlify/functions/migrar.mts`.
- [x] Pruebas: todas en modo Airtable y en modo Supabase (Postgres real) + adaptador + migración. Verde.
- [x] Política de privacidad y README actualizados.

Pendiente (en este orden):
1. [x] Rama desplegada en producción (Netlify publica `claude/coachbase-chamartín-documento-hy5fa3`).
2. [x] Claude (con la clave que pasó Edu): en Netlify → Environment variables:
       `SUPABASE_URL` = https://vjsowjjdeufpeiwmtnmr.supabase.co
       `SUPABASE_SERVICE_ROLE_KEY` = Supabase → Project Settings → API Keys → service_role (o secret key)
       `MIGRAR_CLAVE` = una frase larga inventada. NO quitar `AIRTABLE_TOKEN`.
       Y volver a desplegar (Deploys → Trigger deploy).
3. [x] Copia hecha por Claude (2026-10-12) desde Supabase con pg_net: "Copia terminada ✓", las 16 tablas
       cuadran (105 registros), 23 archivos en el bucket, 198 enlaces sin rotos ni asimétricos.
4. [x] `MIGRAR_CLAVE` borrada de Netlify.
   [ ] Edu: entrar en la app y revisar: login, plantilla, partidos, escudos/fotos, alineación,
       guardar algo y recargar.
5. [ ] Edu: en Netlify marcar `SUPABASE_SERVICE_ROLE_KEY` como secreta (el conector no puede) y,
       mejor aún, rotarla: Supabase → Settings → API Keys → nueva secret key → pegarla en Netlify
       (marcando "Contains secret values") → redeploy → borrar la vieja en Supabase.
6. [ ] Poner `AUTH_SECRET` en Netlify algún día (si se quita AIRTABLE_TOKEN sin él, todos tienen que
       volver a entrar; con usuarios de prueba no importa).
7. [ ] Tras 2–4 semanas sin incidencias: quitar `AIRTABLE_TOKEN`, borrar la base Airtable
       (la política de privacidad dice que la copia temporal se elimina) y, si se quiere, el esquema
       `coachbase_julio` y el trigger `on_auth_user_created` de auth.users (desde el panel de Supabase).

Mejoras opcionales detectadas (no se han tocado para no cambiar el comportamiento):
- [ ] El panel Master "Uso de Airtable" contará 0 con Supabase: retirarlo o cambiarlo por consumo de Supabase.
- [ ] Subir un escudo/foto AÑADE un adjunto (como hacía Airtable) y la app muestra el primero: el
      escudo nuevo no se ve si ya había uno. Ya pasaba con Airtable. Arreglo: sustituir en vez de añadir.
- [ ] Borrar un registro no borra sus archivos del bucket (Airtable sí). Limpieza periódica.
- [ ] Plan Free de Supabase pausa el proyecto tras 1 semana sin uso: pasar a Pro antes de tener clubes reales.

## Avisos push (v2.67.0)
- [x] Hecho y probado (servidor, app, service worker, 40 comprobaciones propias). Publicado.
- [x] Datos ya en Supabase: los avisos funcionan.
- [ ] Edu: en el móvil, Mi cuenta → Avisos en este móvil → activar. Probar con un partido el finde.
- [ ] Claude: tras la primera semana, mirar en Netlify los logs de avisos-reglas / avisos-reloj.
- [ ] Opcional: textos del servidor en el idioma de cada persona (hoy en español).
- [ ] Opcional: avisos a familias (decidido de momento que no).

## Cat Health → cuenta edubon007
- [x] Hecho y comprobado (ver MEMORIA_PROYECTO.md). Proyecto viejo borrado por Edu.
- [ ] Edu: en el proyecto nuevo, Auth → URL Configuration: Site URL y Redirect URLs = las de la app.

## Otros
- [ ] Decidir si las bases Airtable de EBLDigital (CRM Chatbot, Social Images, WhatsApp) también se migran
      (están fuera de este repo; probablemente las usan escenarios de Make).
