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
  táctica y marketplace de material.
- Función serverless `netlify/functions/airtable.mts` → **login, registro y gestión de usuarios**
  y todos los datos de la app. Las contraseñas se guardan **hasheadas** (PBKDF2) en el servidor;
  nunca se devuelven al cliente.

## Dónde viven los datos: Supabase
Los datos están en **Supabase** (proyecto `vjsowjjdeufpeiwmtnmr`, Fráncfort): una tabla por cada
tabla de la antigua base Airtable **COACHBASE AI**, con los mismos ids (`rec…`).

- `netlify/lib/esquema-coachbase.mts` — la estructura: tablas, campos, tipos y enlaces.
- `supabase/migrations/` — el SQL, **generado** a partir del esquema con `npm run sql`.
- `netlify/lib/supabase-airtable.mts` — el backend sigue hablando la API de Airtable y este
  módulo la contesta desde Supabase. Se activa con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`;
  **sin ellas todo vuelve a ir a Airtable** (es la vuelta atrás si algo fallara).
- Adjuntos en el bucket privado `coachbase`, servidos con enlaces firmados de 7 días.
- Nadie entra con la clave pública: RLS activado y sin políticas; solo las funciones de Netlify.
- `netlify/functions/migrar.mts` — copia única Airtable → Supabase (ver más abajo).

Para añadir un campo: añádelo en `esquema-coachbase.mts`, crea la columna en Supabase con una
migración nueva (`alter table … add column …`) y regenera el SQL de referencia con `npm run sql`.

### Avisos con la app cerrada (Web Push)
Necesitan los datos en Supabase. Cada persona los activa en **Mi cuenta → Avisos en este móvil**
(o en Modo partido). En iPhone, solo con la app añadida a la pantalla de inicio.

| Aviso | Cuándo | A quién |
|---|---|---|
| Convocatoria pendiente | Jueves desde 18:00 y viernes desde 12:00, si hay partido el fin de semana y no se ha mandado | Cuerpo técnico del equipo |
| Día de partido | 3 h antes (a las 9:00 si no hay hora) | Cuerpo técnico |
| Parte de material | 21:30 de un día de entreno sin parte | Cuerpo técnico |
| Partes sin mandar (resumen) | 9:00, las categorías que ayer no mandaron parte | Cuenta del club y director |
| Propuesta pendiente | Al momento | Entrenador principal (o director) |
| Final de parte / descuento | A su hora, aunque el sistema haya cerrado la app | Quien lleva el Modo partido |

- `netlify/lib/avisos.mts` — reglas, envío y que nada llegue dos veces (`push_enviados`).
- `netlify/lib/webpush.mts` — Web Push sin dependencias (VAPID + cifrado aes128gcm con WebCrypto).
- `netlify/functions/avisos-reglas.mts` (cada 5 min) y `avisos-reloj.mts` (cada minuto). Solo corren
  en la versión publicada.
- Claves VAPID en **Supabase Vault** (`vapid_publica`, `vapid_privada`); nada en Netlify ni en el código.
- La convocatoria cuenta como mandada cuando se pulsa WhatsApp o Copiar: queda en la tabla Convocatorias.
- Horas de Madrid. Los textos del servidor van en español.

### Copiar los datos de Airtable a Supabase (una sola vez)
1. En Netlify, pon `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y una `MIGRAR_CLAVE` inventada
   (larga). Deja `AIRTABLE_TOKEN` puesto. Despliega.
2. Abre `https://coachbase-ai.netlify.app/.netlify/functions/migrar?clave=<MIGRAR_CLAVE>` y deja
   la página abierta: avanza sola tabla a tabla, sube los archivos y termina con una tabla que
   compara los recuentos de Airtable y de Supabase.
3. Borra `MIGRAR_CLAVE` de Netlify. Si Supabase ya tiene datos, la función se niega a empezar.

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

> ⚠️ El login es propio (PBKDF2 + sesiones firmadas), no Supabase Auth. Pasar a Supabase Auth
> obligaría a que todo el mundo restableciera su contraseña: los hashes no son compatibles.

## Desplegar (recomendado — todo funcional)
Requiere Node 18+ y la CLI de Netlify.

```bash
npm install
npm i -g netlify-cli        # si no la tienes
netlify login
netlify link --id 8d8defe2-ac0c-43d3-9b65-e2da6e8ba63c   # vincula al sitio coachbase-ai
netlify env:set SUPABASE_URL https://vjsowjjdeufpeiwmtnmr.supabase.co
netlify env:set SUPABASE_SERVICE_ROLE_KEY xxxxxxxx        # Supabase → Project Settings → API Keys
netlify deploy --build --prod
```

La clave es la **service_role** (o una *secret key* `sb_secret_…`): da acceso total a la base, así
que solo va en Netlify, nunca en el código ni en el navegador.

## Deploy rápido de prueba (drag & drop — SIN funciones)
```bash
npm install && npm run build
```
Arrastra la carpeta `dist/` a https://app.netlify.com/projects/coachbase-ai/deploys
> En esta variante **no se ejecutan las funciones**: el login/registro usa el
> modo demo local (no persiste en Airtable). Para todo funcional, usa el deploy con build de arriba.

## Variables de entorno
| Nombre | Para qué | Obligatoria |
|---|---|---|
| `SUPABASE_URL` | Base de datos (Supabase) | **sí** |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave secreta de Supabase (solo servidor) | **sí** |
| `AIRTABLE_TOKEN` | Solo sin Supabase, y para la migración. Sin `AUTH_SECRET`, firma las sesiones: quitarlo cierra la sesión de todo el mundo | mientras no haya `AUTH_SECRET` |
| `AIRTABLE_BASE` | Base Airtable (`appDVtUWdtfzkV1sA`) | no (hay valor por defecto) |
| `MIGRAR_CLAVE` | Activa la copia única Airtable → Supabase; bórrala al terminar | no |
| `AUTH_SECRET` | Firma de las sesiones y de los enlaces de recuperación | no (deriva de `AIRTABLE_TOKEN` o de la clave de Supabase) |
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
  deja de validar: es **de un solo uso sin guardar ningún token** en la base.
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
