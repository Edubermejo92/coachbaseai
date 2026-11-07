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

## Superwall (paywalls y tests A/B en la web, v2.70.0)
- SDK web `@superwall/paywalls-js` 0.3.2 (fijado). Todo en `src/superwall.js`; App.jsx solo llama
  a sus funciones. **Sin `VITE_SUPERWALL_WEB_KEY` no se carga nada** (ni el código del SDK, que va
  con import() dinámico) y la app funciona como antes. La clave es la pk_ de una app **Web** del
  panel de Superwall: las de iOS (pk_uhuICu…) y Android (pk_xLJx1…) no valen para la web.
  Es de compilación (Vite): tras ponerla en Netlify hace falta un deploy nuevo.
- Decidido con Edu: **Stripe sigue cobrando y decidiendo quién es PRO**. PurchaseController propio;
  el botón de compra del paywall no cobra en Superwall: el SDK emite `transaction_start` y se abre
  nuestro checkout (`goCheckout`). Los productos del paywall deben llamarse `mensual`, `temporada`,
  `club_s|m|l` (o el price_id de Stripe) y NO usar el checkout de Stripe de Superwall.
  Estado: `setSubscriptionStatus` con `isPro` (entitlement `pro`). "Restaurar" = releer la suscripción.
- Solo cuerpo técnico con cuenta real: ni familias, ni jugadores, ni máster, ni demo.
  identify = `session.userId` (id rec… de la cuenta); reset al cerrar sesión.
- Placements: `funcion_pro` (param `funcion`: video, discipline, cargas, general o la clave del
  apartado bloqueado) y `fin_prueba` (param `dias`). Si no hay campaña, falla o no hay clave,
  se hace lo de siempre (aviso PRO / pantalla Premium).
- Atributos: rol, plan (pro/gratis), enPrueba, diasPrueba, enClub, categoria, futbol7, jugadores,
  idioma, comunidad. `sw.page(tab)` en cada cambio de apartado.
- Vista previa: abrir la app con `?sw_test=1` (modo prueba, compras simuladas) y `?sw_test=0` lo quita.
- Enlaces desde el paywall: `?tab=alineacion` o `coachbase://alineacion` abren ese apartado.
- WASM del motor de reglas: vite.config.js (`superscriptSoloUrl`) obliga a cargarlo por URL desde
  /assets (1,2 MB, solo si Superwall está activo); la carga por defecto rompe el build de Vite.
- Desde el contenedor de Claude no hay red a superwall.com (proxy 403): no se pudo leer la
  documentación ni ver un paywall real; probado que sin clave no cambia nada y que con clave
  (sin red) vuelve a lo de siempre sin errores.

## Pizarra 3D (v2.78.0)
- Motor en `src/pizarra3d.js` con Three.js 0.185.0 (fijado). Se carga con import() al pulsar «3D»
  en la pizarra: chunk aparte de ~145 KB gzip que no pesa en el resto de la app.
- Pinta la pizarra tal cual (fichas y trazos del campo entero 1000×640; el rectángulo de cal
  12..988 × 12..628 = campo de 105×68 m). Solo en el campo entero: los tableros de ABP tienen
  otra escala y avisan. Mismo candado PRO que PNG y vídeo.
- Vistas tribuna / cenital / detrás de cada portería / esquina, con juego propio en vertical
  (móvil) mirando el campo a lo largo. Pasos de la pizarra animados; foto PNG y vídeo
  (MediaRecorder del lienzo WebGL; mp4 si el navegador puede, si no webm).
- El visor va en un portal a <body>: la pizarra a pantalla completa en móvil va girada con
  transform y un fixed dentro de un padre transformado se descoloca.
- Creador de jugadas 3D (v2.79.0), pestaña «Crear jugada» del visor o Jugadas → «Nueva jugada
  3D»: campo a la izquierda y pasos a la derecha (debajo en móvil vertical). Acciones: pase,
  desmarque, conducción, arrastra defensa, dobla, presión y tiro; «a la vez» junta acciones en
  un paso. `src/jugada3d.js` (funciones puras) las convierte en movimientos con tiempos; el
  motor las reproduce (`reproducirPaso`) con el balón de pie en pie. Se eligen jugadores con
  botones o tocándolos en el 3D, y destinos tocando el césped.
- Se guarda como una jugada más (`plays`, con `jugada3d: { acciones, balonEn }` y las flechas
  numeradas como trazos 2D), así se comparte con el equipo y se ve en 2D. Vídeo con rótulos
  (nombre de la jugada + paso) compuestos en un lienzo 2D encima del 3D.

## Pretemporada por equipo (v2.81.0)
- Ya no hay plan fijo en la app: el de ejemplo (Infantil B, S1–S12 de septiembre) se retiró a
  petición de Edu ("cada entrenador tiene su forma de hacer pretemporada"). Cada equipo crea la
  suya en Temporada → Pretemporada: semanas (fase, desde/hasta, idea) con sesiones (minutos,
  RPE, prioridad, carga, objetivo, bloques). Se numeran solas S1, S2… y se reparten por los
  días de entreno; salen en Calendario y se cargan en Entrenamiento como antes.
- Nube: `equipos.pretemporada` (JSON, solo Supabase, fldPretemp0radaQ7), recurso
  `res=pretemporada` (mismas reglas que cargas; valida forma y tamaño), en la cola sin conexión.
- Edita quien tiene `editTraining`; la demo es de solo lectura.
- Limpieza hecha: en Supabase se quitaron las referencias `plan`/`p` al plan viejo en
  `cargas_fisicas` del Infantil B; en los dispositivos, un objetivo de Entrenamiento que
  venga del plan viejo ("S1 · Reentrada colectiva — …") se vacía al abrir (PT_EJEMPLO_RETIRADO).

## Retransmisión en directo (v2.82.0)
- Idea sacada del anuncio de la competencia (DirigeTuClub): en Modo partido, «📡 Retransmitir»
  crea un enlace por equipo (`/vivo/?c=<16 letras>`) que se manda por WhatsApp. La familia lo abre
  sin cuenta: marcador, minuto en marcha, goles con asistencia, «Avisarme de los goles» (push)
  y el «¡GOOOL!» a pantalla completa con sonido/vibración opcional.
- Página aparte y estática `public/vivo/index.html` (no carga la app). Lee `res=vivo` cada 4 s
  (15 s en segundo plano); la respuesta va cacheada 3 s en el CDN de Netlify por código, así mil
  espectadores no son mil lecturas en Supabase. `?demo=1` enseña un partido de ejemplo.
- Nube (solo Supabase): tablas `retransmisiones` (codigo, equipo, datos JSON, activa) y
  `vivo_avisos` (suscripciones push del público, máx. 2000 por enlace). `netlify/lib/vivo.mts`
  limpia lo que llega (lista blanca: nada de plantilla ni notas; del rival no sale ningún nombre;
  escudos solo https o "/") y decide los avisos: gol, descanso y final, una sola vez cada uno
  (`push_enviados`, `avisarVivo` en avisos.mts).
- Recursos: `res=vivo` (público: GET datos / m=1 manifiesto / POST y DELETE suscripción),
  `res=retransmision` (crear o desactivar, con puedeEquipo) y `res=retransmision-datos`
  (el estado del partido; en la cola sin conexión).
- En la app: el estado sale del partido en curso (`datosVivo()`), se manda solo con 0,9 s de
  calma. Al marcar un gol propio pregunta «¿Asistencia de…?». Nombres por defecto «nombre e
  inicial» (menores), se puede cambiar a completo o dorsal. Guardar el acta = final. El enlace
  sigue valiendo para los siguientes partidos hasta que se desactiva (y entonces caen las
  suscripciones). En iPhone el aviso solo llega con la página añadida a la pantalla de inicio.

## Alineación: el dedo no desplazaba, y actualizar más a lo bruto (v2.93.3)
- Edu: "en alineación se hace difícil desplazar". El contenedor del campo llevaba `touch-none`,
  que apaga el desplazamiento táctil en TODA su superficie, y en un móvil el campo es casi la
  pantalla entera: solo se podía desplazar agarrando las franjas de alrededor.
- Arreglado sin perder el arrastre: el campo pasa a **`touch-pan-y`** y el `touch-none` se mueve
  a **cada ficha**, y solo si `can("editLineup")`. Un `touch-action` de un hijo manda sobre el
  del padre, así que el dedo sobre el césped desplaza la página y sobre una ficha la arrastra.
- Comprobado con gestos táctiles de verdad (CDP `Input.dispatchTouchEvent`, no el ratón, que no
  pasa por `touch-action`): césped → la página se desplaza (763→950) y las fichas no se mueven;
  ficha → la ficha se mueve y la página se queda quieta. En la demo las fichas no llevan
  `touch-none` porque ahí no se puede editar, así que para probarlo hay que quitar `esDemo` de
  `can` con una marca PRUEBA-TEMPORAL y volver a ponerlo.
- Edu avisó de que el aviso de versión nueva seguía saliendo: sus capturas eran de antes de que
  se desplegara el arreglo, pero por si acaso **«Actualizar» ya no hace `reload()`**, que en un
  WebView puede volver a servir lo que ya tenía. Navega a la misma dirección con un `?cb=<hora>`
  que no se puede sacar de ninguna caché, y el parámetro se quita de la barra nada más cargar.

## La alineación se iba de lado en el móvil (v2.93.2)
- Edu mandó una captura: la pantalla arrastrada hacia un lado, el contenido cortado por la
  izquierda y una franja blanca ocupando un cuarto de la derecha. En la demo no se reproducía.
- Lo dispara **el nombre de su canción**: «Wiz Khalifa - Black And Yellow [G-Mix] ft. Snoop Dogg,
  Juicy J & T-Pain.mp3». Medido en el navegador con esa canción sembrada: a 390 px de ventana,
  `scrollWidth` daba **505** — la página entera 115 px más ancha que la pantalla.
- Causa: un hijo de un contenedor flex no encoge por debajo de su contenido salvo que lleve
  `min-w-0` (su `min-width` vale `auto`). La columna de botones de la alineación medía 472 px
  dentro de un padre de 324, y por eso el `truncate` del nombre no hacía nada: no tenía contra
  qué recortar. Arreglado con `min-w-0` en esa columna (`flex flex-col items-stretch`) y en la
  raíz del selector de música. Ahora el nombre se recorta con puntos suspensivos y la página
  vuelve a medir justo lo que la pantalla.
- Es la **tercera vez** que muerde lo mismo (antes: el título de las tarjetas, ver `Card`). Por
  eso queda `herramientas/medir-ancho.cjs`: recorre 6 pestañas a 360, 390 y 412 px con un nombre
  de canción largo sembrado y dice qué elemento se sale. 18 combinaciones, todas limpias.
  No entra en `npm test` porque necesita navegador y el servidor de vista previa.

## El aviso de versión nueva no se podía quitar (v2.93.1)
- Edu mandó una captura: la franja «Hay una versión nueva de CoachBase · ACTUALIZAR» ocupando dos
  líneas enteras arriba del móvil. Comprobado en el navegador que NO es un falso positivo (con la
  misma versión no sale): el aviso era correcto —el WebView de Median mantiene la página viva
  días y yo había desplegado— pero estaba mal hecho.
- Tres fallos, los tres míos (v2.90.3): **no se podía apartar** (el único botón era Actualizar);
  **volvía en cada despliegue**, y aquí se despliega varias veces al día; y si la recarga no traía
  el JS nuevo, la franja se quedaba **para siempre y sin salida**.
- Arreglado:
  - Se guarda QUÉ versión se ha visto (`versionNueva`, el src del bundle) en vez de un sí/no, y
    un ✕ «Ahora no» la aparta anotándola en `localStorage.cb_version_oculta`. No vuelve por esa
    versión; por la siguiente sí.
  - `actualizarVersion()`: antes de recargar borra TODAS las cachés y da de baja el service
    worker (main.jsx lo vuelve a registrar al cargar). Recargar a secas no bastaba: el SW seguía
    sirviendo el JS guardado y en un WebView eso dura días. Si algo de eso falla, recarga igual.
  - Franja de una línea: de ~115 px a **38 px** medidos, texto más corto («Hay una versión
    nueva») y truncado si no cabe.
- Probado en el navegador: sale con versión nueva; el ✕ la quita y no vuelve con la misma pero sí
  con una posterior; y con una marca metida a mano en la caché `cb-shell-v4` se comprueba que
  Actualizar la tira de verdad antes de recargar.

## Reseñas de Google Play dentro de la app (v2.93.0)
- **Arquitectura detectada (importante):** la app de Android NO está en este repositorio. Es un
  **Median.co** (`co.median.android.coachbaseai`) que carga la web de Netlify **en remoto** en un
  WebView; no hay `build.gradle`, ni `AndroidManifest.xml`, ni `gradlew`, ni keystore en ningún
  sitio, y el AAB lo compila Median desde su panel. Por eso aquí NO se puede escribir la clase
  Kotlin `ReviewBridge` con `addJavascriptInterface`, ni subir el `versionCode`, ni correr
  `./gradlew bundleRelease`: no existe el proyecto. versionCode/versionName/targetSdk viven en el
  panel de Median y en Play Console.
- Camino elegido con Edu: el **plugin oficial «App Review» de Median**, que envuelve la API de
  reseñas in-app de Google. Se activa en el panel de Median y desde la web se llama con
  `median.appreview.prompt({...})`. Estado en Play (5 nov 2026): **solo pruebas internas**.
- **`src/resena.js`** — un único sitio, con los umbrales como constantes exportadas arriba:
  `ROLES_RESENA = ["director","entrenador","segundo","delegado"]` (familias fuera: no eligen la
  app, se la pone el club; jugador fuera por menor; Master y cuenta de club fuera),
  `DIAS_PRIMER_USO = 7`, `ACCIONES_MINIMAS = 3`, `DIAS_ENTRE_PETICIONES = 90`.
  `pedirResena(motivo, sesion, ahora)` apunta la acción y, solo si se cumple TODO, llama al
  puente. Devuelve el motivo de la decisión ("pedida", "sin-puente", "demo", "rol", "pocos-dias",
  "pocas-acciones", "reciente"), que es lo que miran las pruebas. Nunca lanza: lo llama código
  que acaba de guardar algo. Prefiere el puente de Median y acepta `window.AndroidReview` por si
  algún día se empaqueta a mano.
- Estado por cuenta en `localStorage`, clave `cb_review_<userId>` (`{ desde, acciones, pedida,
  ultimoMotivo }`), todo entre try/catch. La fecha de petición se escribe **antes** de abrir el
  diálogo: Google no dice si lo ha enseñado y el cupo se gasta igual.
- **Los 7 días cuentan desde la primera acción positiva**, no desde el registro: ese dato no
  existía y así no hay nada que migrar. Se peca de tarde, que es el lado bueno.
- Dónde se llama (localizado y confirmado en `src/App.jsx`), siempre justo DESPUÉS de que la
  acción salga bien, nunca al abrir la app ni en mitad de la pizarra o del cronómetro:
  - **Partido**: botón de cerrar el acta en Modo partido (`pedirResena("partido", session)` tras
    `guardarEnHistorico()` + `setActaGuardada(true)`).
  - **Convocatoria**: `marcarConvocatoriaEnviada()`, después de su guardia (no cuenta en la demo
    ni sin partido real). Cubre los tres sitios desde los que se manda.
  - **Entrenamiento**: `guardarPlantilla()` y `publicarSesion()`, ambos solo con `out.ok`. Una
    propuesta del segundo entrenador NO cuenta: todavía no hay sesión guardada.
- PROHIBIDO un botón «Valóranos» con esta API: Google limita cuántas veces aparece el diálogo y
  el botón parecería roto. Si se quiere botón, que abra la ficha de Play.
- Pruebas: `pruebas/pruebas26.mjs` (27 ✓) con window y localStorage fingidos — sin puente no
  llama, Master/demo/familia/jugador/club no llaman, 2 acciones no, la 3ª sí, no repite antes de
  90 días, cada cuenta su contador, dato corrupto y almacenamiento bloqueado no tumban nada.
  `pruebas/pruebas27.mjs` (8 ✓) monta el bundle ya construido en **jsdom 24** (de la 25 en
  adelante cambia la API): React pinta, sale la pantalla de acceso y no queda ningún error de
  arranque, que es justo lo que `vite build` no detecta. Se salta sola si no hay `dist/`.

## Ver la app como quien no paga (v2.92.0 · v2.92.1)
- Edu: "pon a edubermejo92 sin ser PRO" —para poder probar el muro de pago y el checkout de
  Stripe con una cuenta de verdad—. Dos pegas: su cuenta es PRO por el club (Chamartín Vergara
  lo tiene regalado por código, `esClubChamartinVergara` dentro de `isPro`) Y porque **las 11
  cuentas de la base tienen `prueba_hasta` = 2099-12-31**, así que hoy no hay nadie "no PRO" en
  toda la app. Quitárselo de verdad exigía tocar código igualmente.
- Elegido con él, frente a quitarle el PRO a la cuenta en permanente (perdería vídeos y Modo
  partido en su día a día con el Infantil B) o a quitar el PRO regalado del club (afectaría a
  Fidel, Manuel y el director): un **interruptor** en Mi cuenta, "Ver la app como gratis".
- `verGratis` en App.jsx: localStorage `cb_ver_gratis:<email>`, por dispositivo y por cuenta.
  Mientras está puesto, `isPro` y `pagaDeVerdad` son false, `trialDaysLeft` es 0 (si no, saltaban
  los avisos de "te quedan N días") y `lim` pasa a `LIMITS.free`. No toca la base ni a nadie más.
- Franja ámbar arriba mientras está encendido, con botón para quitarlo: sin eso es cuestión de
  tiempo que alguien lo deje puesto y crea que la app se ha roto.
- **Solo para las cuentas de `PRUEBAN_SIN_PRO`** (Edu, v2.92.1): es una herramienta para probar
  el cobro, no una opción que deba ver el cuerpo técnico de un club. Se compara contra
  `session.userId` —el id de la ficha de Usuarios— y NO contra el correo, porque el repositorio
  es público y ahí no se deja una dirección personal escrita. `sesionConYo` ya traía `userId`; se
  añadió también al entrar, para que esté sin esperar al refresco de `?res=yo`. Si una cuenta
  deja de estar en la lista, lo que tenga guardado en el móvil deja de surtir efecto.
- Ojo al probarlo en la demo: su objeto de sesión lleva `userId: 1` más abajo del todo y pisa
  cualquier id que se ponga antes. Para una prueba, añadir el `1` a `PRUEBAN_SIN_PRO` y quitarlo.
- Probado en el navegador (demo, entrenador principal): 0 candados ★ en el menú antes, 8 después;
  la cabecera pasa a "VERSIÓN BÁSICA" + "IR A PREMIUM"; Premium ofrece pagar; se apaga desde la
  franja y vuelve todo; aguanta la recarga; sin errores de JS.

## El webhook de Stripe fallaba: eventos de OTRA app y claves de ejemplo (v2.91.1)
- Stripe avisó por correo (5 nov): 35 entregas fallidas al webhook de CoachBase desde el 2 nov
  21:10:35 UTC, y amenaza con apagar el endpoint el 11 nov. En los registros de Netlify las 35
  peticiones **sí llegaban** y la función contestaba **400** = "firma no válida".
- Dos causas, independientes:
  1. **La cuenta de Stripe (EBLDigital) es compartida.** El 2 nov a las 11:59 se creó el webhook
     de TestudoTracker (`we_1UXJu2…`), y ese mismo día a las 21:10 alguien se suscribió a
     TestudoTracker Premium. En Stripe un endpoint recibe TODOS los eventos de la cuenta —no se
     pueden filtrar por app—, así que los `customer.subscription.*` de las tortugas llegaban al
     endpoint de CoachBase (`we_1TxbaJ…`), que tiene los mismos 4 tipos de evento activados.
  2. **Las claves de Stripe en Netlify siguen siendo el texto de ejemplo** de las instrucciones
     de la cabecera de stripe.mts: `STRIPE_WEBHOOK_SECRET` y `STRIPE_SECRET_KEY` valen
     `<tu_…>` en todos los contextos (producción incluida), puestos el 28/07/2026 y nunca
     sustituidos. Por eso la firma no cuadraba nunca. Consecuencia mayor: **el cobro de
     CoachBase no ha funcionado nunca**; en toda la cuenta live hay 1 sola suscripción y es de
     TestudoTracker, así que no se ha perdido ningún pago.
- Arreglado en el código (lo segundo lo tiene que poner Edu en Netlify):
  - `esNuestro()` + `ignorado()`: lo que no es de CoachBase se contesta con **200** y sin gastar
    ni una llamada a Stripe o Airtable. Se mira `metadata.app` y, si el evento no la lleva (una
    suscripción creada a mano en el panel), el price_id contra PLANES. Sin esto, en cuanto la
    firma funcionara, un cliente de TestudoTracker se habría guardado como PRO de CoachBase.
  - El checkout marca también la **sesión** con `metadata[app]`, no solo la suscripción: así
    `checkout.session.completed` se reconoce sin preguntarle el precio a Stripe.
  - `firmaValida()`: Stripe manda uno o **varios** `v1=` (mientras se rota el secreto van el
    viejo y el nuevo) y el header se leía con `Object.fromEntries`, que se queda con el último
    —una firma buena en primera posición se rechazaba—. Ahora se prueban todas. Y la `t` de la
    firma, que viajaba sin mirarse, se comprueba contra una ventana de 15 min: sin eso una
    petición válida capturada se podía repetir para siempre.
  - Si `STRIPE_WEBHOOK_SECRET` no empieza por `whsec_`, el registro lo dice con todas las
    letras en vez de un 400 mudo.
- `pruebas/pruebas25.mjs` (17 ✓, el primer test de stripe.mts): construye la función con esbuild
  y sustituye `fetch` para afirmar que un evento de TestudoTracker sale con 200 y **cero**
  llamadas, que uno de CoachBase sí se guarda, y los casos de firma (otro secreto, dos `v1` con
  la buena primero, `v0` de acompañante, firma vieja, secreto de ejemplo).
- **Secreto del webhook, resuelto (5 nov, 22:10)**: el signing secret de un endpoint solo lo
  enseña Stripe al CREARLO (`GET /v1/webhook_endpoints/{id}` no lo devuelve), así que se creó uno
  nuevo por API —`we_1UYYr0HuBVT1cFkvhtIXPhC6`, misma URL y mismos 4 eventos—, su secreto se
  guardó en `STRIPE_WEBHOOK_SECRET` de Netlify (contextos dev/branch-deploy/deploy-preview/
  production; `dev-server` se queda con el texto viejo, no lo admite la API) y el antiguo
  `we_1TxbaJ…` se dejó **desactivado** (no hay operación de borrado en el MCP de Stripe). Con eso
  los reintentos y el aviso del 11 nov se acaban.
- **Sigue pendiente de Edu**: `STRIPE_SECRET_KEY`. Stripe NO tiene API para crear ni leer una
  clave secreta —solo el panel—, así que hay que copiarla a mano en Netlify. Sin ella el webhook
  acepta y descarta bien lo de otras apps, pero una compra de CoachBase daría 500 (el handler
  llama a `customers/…` y a `line_items`), y el checkout tampoco se puede crear.

## Guía de la app para los nuevos (v2.91.0)
- Edu: "Crea un tutorial para los nuevos donde indiques funcionalidades y primeros pasos como
  añadir jugadores, dar accesos a familias, todo de la app y que puedan verlo después en
  cualquier momento".
- Textos en `src/guia.js` (ES y EN; fr/de/pt usan el inglés): `pasos` por grupo (staff,
  direccion, familia, jugador; `soloSi` = permiso de `can`), `secciones` (cada apartado con su
  `tab` para «Abrir» y para enseñar solo los del menú de ese rol; `cuenta: true` abre Mi cuenta),
  `faq` (`para: "staff" | "familia"`). Los nombres de botones son los de la app tal cual: si se
  cambia uno, cambiarlo también ahí. `pruebas/pruebas24.mjs` comprueba que ES y EN tienen lo
  mismo y que cada `tab` existe.
- Ventana `src/Guia.jsx` (React.lazy: 7,6 kB + 34 kB de textos, solo al abrirla): pestañas
  Primeros pasos (con progreso) · Funciones · Preguntas (familias: sin Funciones), buscador sin
  tildes en las tres a la vez, Esc cierra. Pinta con funciones, no componentes internos.
- Dónde se abre: «📘 Guía» al final del menú ⋯ del móvil y del lateral del ordenador; botón
  «Guía de la app» en Mi cuenta; enlace al final de la página de la familia/jugador; tarjeta
  «Primeros pasos» arriba en Inicio (equipo y club): progreso, el siguiente paso (abre la guía en
  él), «Ver la guía» y «Ocultar» (localStorage `cb_guia_oculta:<email>`). Desaparece sola cuando
  está todo lo comprobable.
- Se marcan solos (`hechosGuia` en App.jsx): plantilla (hay jugadores), fotos (alguno con
  foto), calendario (algún partido que no sea aviso PT), staff (más de un usuario), once (7+ en
  la alineación), avisos (`notisOk`), instalar (display-mode standalone); club: categorías
  (usuarios > 1), escudo; «dar acceso a las familias» no se comprueba.
- Grupo: familia/jugador por rol; dirección = cuenta del club o director/master sin rol de
  entrenador (mismo criterio que el texto de avisos de Mi cuenta); el resto, cuerpo técnico.

## El vídeo del once seguía en WebM en el móvil de Edu (v2.90.3)
- Edu (30/10, minutos después de publicar la v2.90.2) mandó el vídeo del once: WebM de
  MediaRecorder (VP9+Opus, 540x676, sin duración). O el móvil seguía con la versión anterior
  abierta, o algún codificador falló y se cayó en silencio a MediaRecorder. No se sabe cuál.
- `videoMp4.js` ya no se fía de `isConfigSupported`: prueba de verdad cada codificador antes de
  empezar. Vídeo: H.264 al tamaño justo → H.264 a múltiplos de 16 (redimensionado en un lienzo
  aparte) → H.264 por software → VP9 dentro del MP4 (Chrome lo trae siempre). Cada uno se prueba
  con un fotograma (sin error, saca algo, trae la cabecera avcC / el colorSpace del VP9). Con
  `lienzo` en `configMp4` la prueba se hace ahí y quien llama sabe antes de empezar si tiene que
  ir por MediaRecorder. Audio: se codifica entero con AAC (48k/44,1k) y si falla, no trae
  cabecera o sale mudo (se decodifica el tramo central con AudioDecoder y se compara con el pico
  de la música), Opus. Tiempos máximos en los flush (algún codificador se cuelga).
- Último recurso (MediaRecorder): MP4 con Opus antes que WebM (`video/mp4;codecs=avc1,opus`,
  Chrome 126+), nunca MP4 con AAC (salió mudo en Android). La pizarra 2D también.
- Probado (Chromium de pruebas, sin H.264 ni AAC, sin el gancho `__cbMp4Codecs`): once en MP4
  VP9+Opus con música (-17,7 dB de media); un navegador que "admite" H.264 y AAC pero fallan →
  los prueba todos y sale VP9+Opus en MP4; un audio mudo → se detecta y sale el MP4 de
  MediaRecorder. 2D y 3D en MP4.
- Registro: cada vídeo dispara `cb:video` (ruta, codificadores, intentos fallidos) y la app lo
  manda a `res=diag-video`, que solo hace `console.log("[diag-video]", …)` en la función (id de
  cuenta, versión, navegador; sin datos personales). Se lee en los logs de Netlify.
- Versión nueva: la app instalada se queda abierta días. Al volver a ella y cada 10 min pide
  `/?cb-version=…` (el service worker no lo cachea, `cb-shell-v4`) y si el JS del índice es
  otro, franja arriba «Hay una versión nueva de CoachBase · Actualizar» (recarga a mano, no sola).

## Vídeos en MP4 de verdad (v2.90.2)
- Edu: "El formato de archivo de los vídeos con música no es compatible". Desde la v2.83.2 los
  vídeos con música salían en WebM (VP9+Opus) para que sonara la música en Android; WebM no lo
  aceptan WhatsApp, Instagram, el iPhone ni muchas galerías.
- `src/videoMp4.js` (+ dependencia `mp4-muxer@5.2.2`): WebCodecs. Cada fotograma del lienzo pasa
  por el VideoEncoder H.264 del móvil (perfil baseline→main→high, nivel según tamaño) a 30 fps con
  la hora real; la música se mezcla aparte con OfflineAudioContext (`musica.renderizar()` en
  videoMarca.js, misma entrada/salida que antes) y pasa por AudioEncoder AAC (si no hay AAC, Opus
  dentro del MP4). mp4-muxer `fastStart: "in-memory"` → MP4 normal (ftyp, moov, mdat), no el
  fragmentado de MediaRecorder. Lados impares: se recorta un píxel (visibleRect).
- Lo usan: vídeo del once y vídeo de cada jugador (`grabarLienzo`, si `configMp4` da null →
  MediaRecorder como antes), los vídeos del 3D (`grabarVideo` en Pizarra3D) y el de la pizarra 2D
  (`startRecording`, con un recorder de mentira para pararlo igual).
- El Chromium de pruebas no tiene H.264 ni AAC: se probó el mismo camino con
  `window.__cbMp4Codecs = { video: "vp09.00.10.08", audio: "opus" }` y ffprobe: once 33,4 s con
  vídeo y audio cuadrados, música con entrada y salida; 3D y 2D en MP4 con moov al principio.
  Sin WebCodecs sigue saliendo el WebM de antes.

## Avisos: comprobación y aviso de prueba (v2.90.1)
- Edu: "Comprueba que funcionan los avisos" (captura de Mi cuenta con «Avisos activados").
- Estado real en producción (28/10): claves VAPID en Vault ✓; avisos-reloj ~1440 pasadas/día y
  avisos-reglas ~288/día ✓; 7 avisos enviados con éxito (resumen de partes al club, 12-27 oct, a
  DANI BERMEJO, director). Solo hay 2 suscripciones en toda la app, las dos de DANI BERMEJO; el
  cuerpo técnico del Infantil B (FIDEL entrenador, EDUARDO y MANUEL segundos) no tiene ninguna,
  así que convocatoria/partido/material no le llegan a nadie hasta que activen los avisos en sus
  móviles con su cuenta. El director no recibe los de categoría (por diseño, STAFF en avisos.mts).
- Nuevo: `res=push-prueba` → `programarPrueba()` (avisos.mts) mete en push_programados un aviso
  `cb-prueba` a 30 s para ESE móvil (solo si la suscripción es suya; uno pendiente por móvil) y
  sale por avisos-reloj, como los de verdad: se puede cerrar la app y ver que llega.
  enviarProgramados: url "/?tab=partido" solo para `cb-reloj`. Pruebas en pruebas18 (+4).
- Mi cuenta → Avisos: «✓ Este móvil está apuntado en el servidor» cuando `pushEstado === "ok"`
  (antes el botón solo reflejaba el permiso del navegador), botón «📨 Enviar aviso de prueba» y
  texto según el rol (`p.notiHintClub` para club/director sin rol de cuerpo técnico).

## Jugadas 3D de ejemplo y vídeo de un toque (v2.90.0)
- Edu: "Crea varias jugadas predeterminadas 3D que luego se puedan editar, porque ahora es difícil
  crear una jugada 3D o 2D y que se guarde en vídeo".
- `src/jugadasModelo.js`: 9 jugadas (pared y tiro, desdoble, salida desde el portero, centro al
  segundo palo, tercer hombre, contraataque 3x2, cambio de orientación, balón a la espalda, córner
  al primer palo). Formato del creador (fichas `l9`/`r4` + `balon`, `balonEn`, acciones), atacando
  a la derecha; nombre/descripción en 5 idiomas, categoría y `vista` de cámara (detrás de la
  portería que se ataca; la salida, detrás de la nuestra). pruebas23.mjs (47) las monta todas.
- Pizarra3D: `base` ahora es estado (antes, las fichas de la pizarra sin más). «📚 Jugadas de
  ejemplo» en el panel de crear (abierto de entrada si no hay jugadores), en Jugadas →
  «📚 Jugadas 3D de ejemplo» (`ver3D = "modelos"`) y en el aviso de pizarra vacía del modo ver.
  Al elegir una: fichas, pasos, nombre, cámara y se reproduce sola (`arrancar`). Se edita como
  cualquier otra; al guardar va con `nueva: true` → jugada nueva (no pisa la abierta).
- 2D: `pasosDeJugada()` (jugada3d.js) saca los pasos de la pizarra de una jugada 3D; se ponen al
  guardarla y al abrir una jugada con `jugada3d`. «⏺ Vídeo» de la pizarra con ≥2 pasos graba una
  sola pasada y se descarga solo al acabar (`recRef.unaVuelta`, `pasoRef`); el archivo lleva el
  nombre de la jugada. Probado: mp4 del 3D y webm del 2D se descargan sin tocar nada más.

## Accesos rápidos legibles en el ordenador (v2.89.1)
- Edu: "Los accesos rápidos no se leen bien en escritorio". En el ordenador la tarjeta de Inicio
  va en la columna estrecha (230-360 px) y seguía con tres botones por fila (60-100 px cada uno):
  "ASISTENCI-A", "MATERIA-L". Ahora: `lg:grid-cols-1` con icono al lado; tablet, tres por fila;
  móvil, dos por fila con el icono encima (al lado, "Estadísticas" no cabía en 158 px). Medido sin
  cortes de 390 a 1920 px.

## Invitar al club a quien ya tiene cuenta · menú · sin cargas (v2.89.0)
- Edu: "Quiero poder añadir desde club a un entrenador registrado aparte (Yen en el Chamartín)".
  Yen Fabricio Mesa se registró solo (plan Gratis) en el "club" «Mi equipo» con un «Alevín A»
  vacío; createUser contestaba `exists` ("Ese correo ya tiene ficha") y no había salida.
- Invitación con aceptación, no traspaso directo (si no, cualquier club se llevaría la cuenta
  de otro con saber su correo). `usuarios.invitacion_club` (JSON, fldInvitaClubQ9, migración
  20261027120000, aplicada en producción): { club, equipo, rol, rolesExtra, por, fecha }.
  - `invitarAlClub` (club/director/master; rol entrenador/segundo/delegado; categoría del club;
    plazas): no_existe · ya_en_club · no_invitable (familia/club/director) · otro_club (su club
    tiene cuenta Club o director activos) · limite_alcanzado. Devuelve `rec`.
  - `responderInvitacionClub {aceptar}`: aceptar = club, equipo (o el primero del club), rol,
    roles extra, plan Oficial y se borra la invitación; su equipo anterior no se toca.
  - `anularInvitacionClub {usuarioRec}`: solo el club que invitó.
  - login y `res=yo` devuelven `user.invitacion` (nombres, sin ids); GET usuarios por club
    devuelve `invitados` (solo a quien dirige el club; el correo, no el nombre).
- App: en Usuarios, si el alta dice `exists` y quien da de alta dirige el club, sale «Invitar al
  club» con el mismo rol y categoría; lista «Invitaciones pendientes» con «Anular». Quien está
  invitado ve arriba (cualquier pestaña) «{club} te invita a unirte» con Aceptar/Rechazar; al
  aceptar se pide `yo`, se guarda la sesión (`sesionConYo`, también la usa el refresco al
  arrancar) y se recarga. Pruebas: pruebas22.mjs (29).
- Menú lateral de ordenador: el atajo de WhatsApp de Convocatoria va en una línea propia debajo
  (`atajoWaConvocatoria(alPulsar, enLinea)`); al lado dejaba 131 px y con la fuente de respaldo
  de Windows "Convocatoria" salía cortada. En el móvil sigue al lado.
- Cargas físicas fuera de Lesiones (Edu): se quitaron renderCargas/renderHistorico/
  renderMolestias, el semáforo de la ficha, la columna de la plantilla, los puntos de la
  alineación y la línea de la lista PRO. Se mantienen `cargas`/`setCargas` y su sincronización:
  la pretemporada guarda ahí `_sesion` (qué sesión del plan toca). Los datos viejos siguen en
  `equipos.cargas_fisicas` por si se quieren recuperar.

## Asistencia solo en días de entreno o partido (v2.88.0)
- Edu: "Solo se pasa lista días de entrenamiento y partidos, el resto de días no aparece claro".
- `queHayElDia(fecha)` (App.jsx, junto a renderAsistencia): partidos del día sin los avisos PT,
  y entreno si el día está en `trainDays`, hay sesión publicada con esa fecha o el borrador de
  Entrenamiento es de ese día. OJO: `sesionDelDia` ya existe (pretemporada), no reutilizar el
  nombre. `diaConSesion(desde, ±1)` busca hasta 62 días el anterior/siguiente con sesión o con
  lista ya pasada; `etiquetasSesion(fecha)` da las chapas (Partido · J6 · rival · hora /
  Entrenamiento · hora / Sesión extra).
- Asistencia: chapas bajo la fecha; las flechas saltan entre días con sesión (la fecha sigue
  abriendo cualquier día). Día sin sesión y sin lista: tarjeta «Sin entreno ni partido» con los
  días fijos, botones Anterior/Siguiente y «Hubo sesión extra: pasar lista igualmente» (solo
  editSquad; `asistExtra` = esa fecha). Sin resumen del día en esos días. Día futuro con sesión:
  aviso «aún no ha llegado» en vez de «no se pasó lista». Historial con las chapas por día.
- Inicio («Asistencia de hoy»): día sin sesión → «Hoy no hay entreno ni partido» + próximo; día
  con sesión → «Hoy: Entrenamiento · 18:30» encima de «Pasar lista».
- Disciplina → Pasar lista: al cambiar la fecha elige solo Partido/Entrenamiento si el día solo
  tiene uno, y avisa si ese día no hay nada en el calendario.

## Jugadas 3D animadas (v2.87.0)
- `jugador3D` (src/pizarra3d.js) es ahora un muñeco articulado: cadera → muslos → rodillas
  (gemelo con el color de la camiseta y bota), torso → hombros → codos, cabeza con pelo.
  Geometrías compartidas; el estado va en `obj.userData.anim`. Sigue con aro, rótulo y
  cilindro de toque, y a escala EXAGERA.
- `tickCuerpos` (cada fotograma) saca la velocidad del desplazamiento de la ficha (un salto
  de >4 m en un fotograma es recolocar, no correr) y mezcla carrera procedimental (zancada,
  brazos a la contra, inclinación, bote) con reposo (respira y mira al balón). Encima van
  gestos con duración (`DUR_GESTO`): chut, control, celebra y estirada del portero.
- Sincronía en `tickPaso`: los `vuelo` llevan `de`/`para` (src/jugada3d.js). El chut arranca
  ARMADO (0,26 s) antes de que salga el balón; si el pase sale nada más empezar el paso, el
  reloj se adelanta (`adelanto`) para que se vea armar la pierna. Quien recibe controla al
  llegar; tras un tiro, el tirador celebra y el contrario más cercano a donde va (≤14 m) se
  estira ~0,35 s antes de que llegue. El balón rueda (`tickBalon`, gira sobre el eje
  perpendicular a su marcha) y en conducción va a toques al ritmo de la zancada.
- Vale para «Reproducir», la animación de pasos y el vídeo (todo pasa por el mismo bucle).
  En el Chromium sin GPU del entorno de pruebas va a 5–9 fps; en un móvil va a lo normal.

## Cambios con marca y animación (v2.86.0)
- Modo partido (hacerCambio → `cambioAnim` ~4 s): en el campo pequeño el que sale (ficha
  fantasma roja) se va hacia la banda y después el que entra llega a su puesto (cb-entra +
  onda verde); aviso arriba «⇄ Cambio min · ↑ entra · ↓ sale» (portal a body). Todo el
  partido: flecha ↑ en la ficha de quien entró y chips «↑ min′» / «↓ min′» en la plantilla
  (`marcasDeCambios()` a partir de los eventos). Keyframes en src/index.css; con «reducir
  movimiento» no hay animación ni fantasma. Los cambios antes del saque (cambiarTitular) no
  se animan: no son cambios del acta.
- Directo: datosVivo manda `cambios` (min, entra, sale con el formato de nombre elegido),
  limpiarDatos los admite (máx. 30) y NO generan push. /vivo los lista («Cambios» con ▲/▼) y
  saca un rótulo abajo, tipo tele, al llegar uno nuevo. Demo de /vivo: cambio a los 20 s.

## Retransmisión: familias con cuenta y botón visible (v2.85.0)
- La familia y el jugador ven el directo en su página (DirectoEquipo, arriba del todo) sin el
  enlace: marcador, minuto que corre, último gol y «Ver el directo». Se pregunta una vez a
  `GET res=retransmision&team` (puedeEquipo; vivo.mts activaDeEquipo) y luego se sigue por
  `res=vivo&c=` (cacheado en la CDN). Cada 8 s en juego, cada minuto si no. Solo se enseña
  en juego, en el descanso, el día del partido antes de empezar y 6 h tras el final.
  Componente propio para que el segundero no repinte toda la app.
- En Modo partido el botón ya no es una píldora en la esquina: barra ancha arriba
  («📡 Retransmitir a las familias»; en directo, verde «En directo para las familias»).

## Liga y alineación por partido (v2.84.0)
- Pestaña «Liga» (`tab` "liga", en «Día de partido"): todos los partidos del calendario
  (filtro Liga = jornada numérica / Todos) con resultado, G-E-P, resumen de la temporada
  (jugados, G/E/P, GF/GC, puntos) y, al tocar uno, su acta del Modo partido (cronología,
  jugadores con titular/minutos/goles/tarjetas, árbitro) y su alineación guardada.
- Enlace acta↔partido: las actas nuevas guardan `partido` (rec o id del partido; lo pone
  matchInfo.partido al venir del calendario); las viejas se reconocen por jornada + rival o
  fecha. Las que no casan con ningún partido salen en «Otros partidos con acta». El acta
  ahora guarda también la asistencia de cada gol (`asist`).
- Alineación por partido: `equipos.alineaciones_partidos` (JSON, solo Supabase,
  fldAlinPartidosQ8), recurso `res=alineaciones-partidos` (hasta 80 partidos, 300 KB, en la
  cola sin conexión). En Alineación, fila «Por partido» (selector con ✓, Cargar / Guardar
  la actual / ✕); también desde el detalle del partido en Liga.
- El menú por rol guardado por el Master en `config` no tenía «liga»: se añadió a mano en
  Supabase (director, entrenador, segundo, delegado) tras publicar. Una pestaña nueva NO
  aparece sola si hay menú personalizado guardado: hay que añadirla ahí también.
- Seguridad (arreglado aquí): los documentos por equipo (cargas, asistencia, pase-lista,
  plan, jugadas, pretemporada, alineacion, favoritas, abp-corners) dejaban leer y escribir a
  cualquier director/club de CUALQUIER club. Ahora todos usan `puedeEquipo(team)`.
- Demo: J1–J4 de liga jugadas con acta (LIGA_DEMO) y J5 con resultado sin acta.

## Vídeos con logo y música (v2.83.0)
- El vídeo del once y el de cada jugador llevan el logo «CoachBase AI by EBLDigital»
  (`public/marca/coachbase-ebl.png`, sobre tarjeta blanca): en el del once, en la portada,
  como marca de agua arriba a la derecha y en grande al cierre; en el individual, pequeño
  abajo y 1 s final en grande (el vídeo pasa de 5 a 6 s).
- Música: por defecto la pista propia `public/musica/coachbase-intro.mp3` (38,7 s, en bucle,
  compuesta con `herramientas/componer-musica.py`, sin derechos de terceros). El entrenador
  puede elegir «Mi canción» del móvil: se guarda solo en su dispositivo (IndexedDB) y nunca
  se sube. Edu pasó «Dakota» de Stereophonics: NO se metió en el repo (es público y la web
  la repartiría a todos los clubes); puede elegirla él como canción propia.
- `src/videoMarca.js`: logo, música (Web Audio → MediaStreamDestination, el AudioContext se
  crea dentro del clic por Safari) y `grabarLienzo`. Lienzo de 540×676: alto PAR, H.264 no
  admite medidas impares.
- Formato (v2.83.2): WebM VP9/VP8 + Opus primero. Con MP4, Chrome en Android usa el AAC del
  teléfono y el vídeo de Edu (Android, Chrome, «Mi canción» = Dakota) salió MUDO en la
  galería. El MP4 queda para Safari, que no graba WebM. Un medidor (AnalyserNode) comprueba
  que la música suena al grabar; si no, avisa (`vm.silent`) en vez de entregar un vídeo mudo.
  De un MP3 largo solo se descomprime el principio (2,5 MB tras la etiqueta ID3).
- Arreglado de paso: el vídeo individual pintaba nombre/club en gris oscuro y el dorsal en el
  acento tal cual, ilegibles sobre el fondo oscuro con un club de color oscuro; y la foto se
  cargaba sin crossOrigin (lienzo "manchado" con fotos de Supabase).

## Netlify (lecciones)
- El conector MCP de Netlify (manage-env-vars) dice "upserted" pero NO guarda nada si se le pasan
  scopes parciales (p. ej. ["functions","runtime"]) o is_secret=true con scopes "all". Solo funciona
  con scopes ["all"], y nunca marca la variable como secreta: eso hay que hacerlo desde el panel.
  Comprobar siempre con getAllEnvVars después.
- Las variables solo llegan a las funciones tras un deploy nuevo (push a la rama de producción
  `claude/coachbase-chamartín-documento-hy5fa3`).

## Pruebas
- `npm test` = `pruebas/todas.mjs`: todas las pruebas en modo Airtable (fakeair) y en modo Supabase
  (PGlite = Postgres real + `pruebas/fakesupabase.mjs`). 2026-11-07: 467 ✓ / 573 ✓, 0 fallos.
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
