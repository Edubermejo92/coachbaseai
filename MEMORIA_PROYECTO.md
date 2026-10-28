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
  (PGlite = Postgres real + `pruebas/fakesupabase.mjs`). 2026-10-27: 354 ✓ / 454 ✓, 0 fallos.
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
