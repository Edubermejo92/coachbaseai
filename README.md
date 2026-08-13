# COACHBASE AI by EBLDigital

Prototipo de gestión para entrenadores de fútbol base (React + Vite), listo para desplegar en Netlify.
Sitio ya creado: **coachbase-ai.netlify.app** (equipo EBLDigital).

## Novedades v9
- **Biblioteca de ejercicios ampliada a 14**: rondos/posesión, finalización, presión/transición,
  salida de balón, ABP completo (córner, tiro libre, saque de banda, penalti), técnica individual,
  físico y trabajo de porteros. Filtro por categoría, con duración y material de cada uno.
  Nueva pestaña **Ejercicios**.
- **Modo entrenamiento**: planifica una sesión (fecha, hora, objetivo) añadiendo bloques desde la
  biblioteca o bloques libres, reordénalos, y obtén la duración y el material totales automáticamente.
  Guardado por dispositivo. Resumen copiable / para WhatsApp, igual que la convocatoria.
  El "próximo entrenamiento" de Inicio ahora refleja el plan real en vez de un texto fijo.
  Nueva pestaña **Entrenamiento**.
- **Estadísticas del equipo**: disponibilidad de la plantilla, distribución por línea (porteros/
  defensas/centrocampistas/delanteros), mayor asistencia a entrenamientos y menor participación
  en minutos. Nueva pestaña **Estadísticas**.
- **Acceso demo con selector de rol**: al pulsar "Entrar con usuario demo" ahora se elige con qué
  rol entrar (entrenador, segundo, delegado, director, presidente o familia) para ver la interfaz
  tal y como la vería esa persona.

## Novedades v8
- **Sistemas tácticos en la pizarra**: elige fútbol 11 o fútbol 7, y un sistema distinto para el
  equipo local y para el rival (4-3-3, 4-4-2, 4-2-3-1, 3-5-2, 3-4-3, 5-3-2 en F11; 2-3-1, 3-2-1,
  3-1-2, 1-4-1 en F7). La elección se **guarda automáticamente en este dispositivo** (localStorage,
  por equipo) y se recupera al volver a entrar.
- **Ejercicios recomendados en la pizarra**: 6 ejercicios (rondo, finalización por bandas, presión
  tras pérdida, salida de balón, córner ofensivo, circuito de conos). Al tocar uno, coloca fichas,
  conos y flechas ya preparados en el tablero.
- **Corregido: Coach AI no aparecía en el menú móvil** — el menú inferior recortaba a los 5 primeros
  accesos; ahora muestra todos con scroll horizontal.
- **Responsive revisado**: cabecera con `flex-wrap` (no se corta en pantallas muy estrechas),
  marcador del modo partido adaptado a móvil, selector de equipo en el registro a una columna en
  móvil, menú inferior con scroll en vez de recorte.
- **Acceso demo simplificado**: usuario **`demo`** / contraseña **`demo`**, con botón de un toque
  "Entrar con usuario demo" en la pantalla de acceso. Funciona siempre, con o sin backend desplegado
  (no depende de Airtable). Las credenciales sembradas (`coach1234`) se mantienen como alternativa.

## Qué incluye
- App React (`src/App.jsx`): **pantalla de carga (splash)** → **elegir Registro / Iniciar sesión** →
  **login real** (email + contraseña) contra Airtable. Dentro: acceso oficial vs plan gratis,
  roles y permisos, plantilla + import CSV, alineación 4-3-3 arrastrable, convocatoria WhatsApp,
  modo partido, perfiles con foto y vídeo de presentación, gestión de usuarios/accesos, pizarra
  táctica, Coach AI y marketplace de material.
- Función serverless `netlify/functions/coach.mts` → proxy a la API de Anthropic para **Coach AI**.
- Función serverless `netlify/functions/airtable.mts` → **login, registro y gestión de usuarios**
  contra la base Airtable **COACHBASE AI**. Las contraseñas se guardan **hasheadas** (SHA-256 + pepper)
  en el servidor; nunca se devuelven al cliente.

## Login y credenciales demo
**Acceso rápido**: usuario **`demo`** / contraseña **`demo`** (botón "Entrar con usuario demo" en la
pantalla de acceso) — elige con qué rol entrar (entrenador, segundo, delegado, director, presidente
o familia) para ver la interfaz tal y como la vería esa persona. Funciona siempre, no requiere Airtable.

También puedes probar cada rol con los usuarios sembrados en Airtable; su contraseña es **`coach1234`**:

| Rol | Email | Estado |
|---|---|---|
| Presidente | `presidente@eflasrozas.es` | Activo |
| Director deportivo | `direccion@eflasrozas.es` | Activo |
| Entrenador principal | `emilio@eflasrozas.es` | Activo |
| Segundo entrenador | `raul@eflasrozas.es` | Activo |
| Delegado | `marta@eflasrozas.es` | Activo |
| Familia (portal) | `familia.navarro@gmail.com` | Activo |
| Segundo (pendiente) | `andres.ponce@gmail.com` | **Pendiente** → muestra aviso |
| Familia (pendiente) | `familia.bravo@gmail.com` | **Pendiente** → muestra aviso |

- El **plan gratis** entra directo al registrarse (sin aprobación).
- El **registro oficial** queda *pendiente* hasta que el presidente/director lo apruebe.
- **En el preview del prototipo o con deploy por arrastrar `dist/`** (sin backend), el login funciona
  con estas mismas credenciales gracias a un modo demo local. El **login/registro real contra Airtable**
  (persistente) sólo funciona con deploy **con build** y `AIRTABLE_TOKEN` configurado.

> ⚠️ Guardar contraseñas en Airtable, aunque sea hasheadas, **no es un sistema de auth de producción**.
> Para producción real, migrar a Netlify Identity, Supabase Auth o Auth0.

## Desplegar (recomendado — todo funcional)
Requiere Node 18+ y la CLI de Netlify.

```bash
npm install
npm i -g netlify-cli        # si no la tienes
netlify login
netlify link --id 8d8defe2-ac0c-43d3-9b65-e2da6e8ba63c   # vincula al sitio coachbase-ai
netlify env:set ANTHROPIC_API_KEY sk-ant-...             # clave de api.anthropic.com (Coach AI)
netlify env:set AIRTABLE_TOKEN patXXXXXXXX               # PAT de Airtable (login/usuarios)
netlify env:set AIRTABLE_BASE appDVtUWdtfzkV1sA
netlify deploy --build --prod
```

El **Personal Access Token** de Airtable se crea en Airtable → Builder hub → Personal access tokens,
con scopes `data.records:read` y `data.records:write` y acceso a la base COACHBASE AI.

## Deploy rápido de prueba (drag & drop — SIN funciones)
```bash
npm install && npm run build
```
Arrastra la carpeta `dist/` a https://app.netlify.com/projects/coachbase-ai/deploys
> En esta variante **no se ejecutan las funciones**: Coach AI no responde y el login/registro usa el
> modo demo local (no persiste en Airtable). Para todo funcional, usa el deploy con build de arriba.

## Variables de entorno
| Nombre | Para qué | Obligatoria |
|---|---|---|
| `ANTHROPIC_API_KEY` | Coach AI | para Coach AI |
| `AIRTABLE_TOKEN` | Login / registro / usuarios | **sí** |
| `AIRTABLE_BASE` | Base Airtable (`appDVtUWdtfzkV1sA`) | no (hay valor por defecto) |
| `AUTH_SECRET` | Firma de las sesiones y de los enlaces de recuperación | no (deriva de `AIRTABLE_TOKEN`) |
| `RESEND_API_KEY` | Enviar el correo de "he olvidado mi contraseña" | **sí, para recuperar contraseña** |
| `MAIL_FROM` | Remitente, p. ej. `COACHBASE AI <acceso@tudominio.es>` | no (usa el remitente de pruebas) |
| `APP_URL` | Dominio al que apunta el enlace del correo | **sí, si no es coachbase-ai.netlify.app** |
| `STRIPE_SECRET_KEY` | Cobros de la suscripción PRO | para PRO |
| `STRIPE_PRICE_ID` | Precio por defecto (mensual) | no |
| `STRIPE_WEBHOOK_SECRET` | Verificar la firma del webhook | para PRO |

Todas se ponen en Netlify → Project configuration → Environment variables.

## Recuperar la contraseña
En la pantalla de acceso, **¿Has olvidado tu contraseña?** pide el correo y envía
un enlace para elegir una nueva. Una vez dentro, cualquiera puede cambiarla desde
**Mi cuenta** (se abre pulsando tu nombre en la cabecera).

Cómo está montado, por si hay que tocarlo:

- El enlace va firmado con HMAC usando una clave que incluye el **hash actual de
  la contraseña**. Al usarlo, la contraseña cambia, el hash cambia y la firma
  deja de validar: es **de un solo uso sin guardar ningún token** en Airtable.
  Caduca además a los 60 minutos.
- El token se borra de la URL nada más abrir la página, para que no quede en el
  historial del navegador ni en una captura de pantalla.
- `forgotPassword` responde **lo mismo exista o no la cuenta**, para que la
  pantalla no sirva para averiguar qué correos están dados de alta en el club.
- Cambiar el `AIRTABLE_TOKEN` (o el `AUTH_SECRET`) invalida los enlaces
  pendientes, igual que ya invalidaba las sesiones abiertas.

El correo sale por [Resend](https://resend.com). Con `RESEND_API_KEY` sin poner,
la app lo dice explícitamente en pantalla en vez de fingir que ha enviado algo.
El remitente de pruebas `onboarding@resend.dev` **solo entrega al correo del
titular de la cuenta de Resend**: para uso real hay que verificar un dominio y
poner `MAIL_FROM`.
