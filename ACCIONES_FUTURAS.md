# Acciones futuras

## Reseñas de Google Play (v2.93.0, 7 nov 2026)
La parte web está hecha y desplegada; el puente nativo lo tiene que encender Edu.
1. [ ] **Edu — Median**: activar el plugin **App Review** en el panel de Median.co y reconstruir
       la app. Sin eso, `median.appreview.prompt` no existe y el helper no hace nada (que es lo
       que pasa hoy: en el navegador y en la app actual no se pide ninguna reseña).
2. [ ] **Edu — probar bien**: la API NO funciona con un APK de depuración instalado a mano. Hay
       que probarlo desde la **pista de prueba interna** o con la **compartición interna de
       apps** de Play Console, con la cuenta de Google que tenga acceso.
       Para forzar el diálogo sin esperar 7 días, borrar `cb_review_<userId>` de localStorage y
       bajar los umbrales a mano en `src/resena.js`, o usar el flujo de pruebas que documenta
       Google (FakeReviewManager no aplica aquí: el código nativo es de Median).
3. [ ] **A las 2–4 semanas**: mirar en Play Console → Calificaciones y reseñas si han entrado
       reseñas nuevas y qué nota traen. Si no entra ninguna, el problema es el cupo de Google o
       que el plugin no está activo, no los umbrales.
4. [ ] **Decidir si las familias entran en `ROLES_RESENA`**. Hoy NO están: no eligen la app, se
       la impone el club, así que su reseña dice poco de la app y mucho del club. Pero son la
       mayoría de los usuarios: si hacen falta reseñas en volumen, es la palanca. Se cambia en
       una línea de `src/resena.js`.
5. [ ] Si alguna vez se quiere un botón «Valóranos» en Mi cuenta, que abra
       `https://play.google.com/store/apps/details?id=co.median.android.coachbaseai`, NUNCA la
       API in-app: Google limita cuántas veces se enseña el diálogo y el botón parecería roto.

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

## Sincronización sin conexión (v2.68.0)
- [x] Cola sin conexión, icono ☁️ con estado y "Sincronizar ahora", refresco al volver a la app.
      Probado: 37 comprobaciones (pruebas19) + prueba en navegador sin red → con red.
- [ ] Edu: probarlo de verdad: modo avión, marcar asistencia o cambiar una lesión, ver el ☁️
      con el número, quitar el modo avión y comprobar en otro móvil que llega.
- [ ] Opcional: subir a la nube lo que hoy solo vive en un móvil (jugadas de pizarra, borrador
      del entreno, historial de llamadas). No se eligió esta vez.
- [ ] Opcional: partes de material con foto sin red (necesitan el rec para adjuntar la foto).
- [ ] Opcional: tiempo real (que el cambio de otro entrenador aparezca sin salir y volver).

## Cat Health → cuenta edubon007
- [x] Hecho y comprobado (ver MEMORIA_PROYECTO.md). Proyecto viejo borrado por Edu.
- [ ] Edu: en el proyecto nuevo, Auth → URL Configuration: Site URL y Redirect URLs = las de la app.

## Otros
- [ ] Decidir si las bases Airtable de EBLDigital (CRM Chatbot, Social Images, WhatsApp) también se migran
      (están fuera de este repo; probablemente las usan escenarios de Make).
