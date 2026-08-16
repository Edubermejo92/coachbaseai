import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/* ============================================================
   COACHBASE AI by EBLDigital — Prototipo v9
   Novedades v9 (sobre v8):
   - Biblioteca de ejercicios ampliada a 14 (rondos/posesión,
     finalización, presión/transición, salida de balón, ABP
     completo —córner, tiro libre, saque de banda, penalti—,
     técnica individual, físico y porteros), con filtro por
     categoría, duración y material. Nueva pestaña "Ejercicios".
   - Modo entrenamiento: planificador de sesión (fecha/hora/
     objetivo + bloques desde la biblioteca o libres, reordenables),
     con duración y material totales, guardado por dispositivo, y
     resumen copiable/WhatsApp. Nueva pestaña "Entrenamiento".
     El "próximo entrenamiento" de Inicio ahora refleja el plan real.
   - Estadísticas del equipo: disponibilidad, plantilla por línea,
     mayor asistencia y menor participación. Nueva pestaña.
   - Acceso demo: ahora se puede elegir con qué ROL entrar a probar
     la interfaz (selector de rol antes de entrar con demo/demo).
   Histórico: v4 marca+roles+usuarios · v5 multi-idioma+pizarra+
   marketplace · v6 conexión Airtable · v7 login/registro real ·
   v8 sistemas tácticos F11/F7 + ejercicios en pizarra + responsive.
   ============================================================ */

const EBL = "https://ebldigital.com.es";

/* ---------------- i18n (es / en / fr / de / pt) ---------------- */
/* Sin emoji de bandera: Windows no los renderiza y salen como letras sueltas
   ("ES", "GB"), que junto al codigo producian el feo "ES ES" / "GB EN". */
const LANGS = [
  { code: "es", name: "Español" }, { code: "en", name: "English" },
  { code: "fr", name: "Français" }, { code: "de", name: "Deutsch" }, { code: "pt", name: "Português" },
];
const DICT = {
  es: {
    "nav.inicio": "Inicio", "nav.jugadores": "Jugadores", "nav.alineacion": "Alineación", "nav.pizarra": "Pizarra", "nav.convocatoria": "Convocatoria", "nav.partido": "Modo partido", "nav.usuarios": "Usuarios", "nav.coachai": "Coach AI", "nav.material": "Material", "nav.entrenamiento": "Entrenamiento", "nav.ejercicios": "Ejercicios", "nav.estadisticas": "Estadísticas", "nav.calendario": "Calendario", "nav.equipos": "Clubes", "nav.premium": "Premium", "nav.disciplina": "Disciplina", "nav.normativa": "Normativa", "nav.familias": "Familias", "nav.equipo": "Club", "nav.asistencia": "Asistencia", "mt.toBoard": "Pizarra", "p.myTeam": "Mi club y mi categoría", "p.pickTeam": "Cambiar a otra categoría…", "p.changeTeam": "Cambiar de categoría", "p.newTeam": "Nombre de la categoría nueva", "p.newTeamPh": "Ej. Cadete B", "p.newTeamNote": "¿No está tu categoría en la lista? Créala dentro de tu club:", "p.createTeam": "Crear", "p.deleteAcc": "Eliminar mi cuenta", "p.deleteWarn": "Se borrará tu ficha y perderás el acceso. No se puede deshacer. Los datos del equipo no se borran.", "p.deleteGo": "Eliminar", "c.proTab": "Apartado PRO. Toca para verlo.", "a.resetAgain": "Pedir un enlace nuevo", "a.resetExp": "Este enlace ha caducado (dura una hora). Pide otro desde \"¿Has olvidado tu contraseña?\".", "a.resetUsed": "Este enlace ya se ha usado. Si no fuiste tú, pide otro y cámbiala cuanto antes.", "a.resetServer": "El servidor no pudo guardar la contraseña. Vuelve a intentarlo en un minuto.", "h.round": "Jornada", "h.howTo": "Cómo llegar", "h.today": "Hoy", "h.day": "Día", "h.days": "Días", "h.noDate": "Sin fecha", "h.noGoal": "Sesión sin objetivo", "h.noTrain": "No hay ningún entrenamiento planificado.", "h.planTrain": "Planificar", "h.noAlerts": "Nada que revisar. Plantilla al completo.", "h.aDoubt1": "duda", "h.aDoubtN": "dudas", "h.aInj1": "lesionado", "h.aInjN": "lesionados", "h.aDisc": "incidencia(s) pendientes de validar", "h.aSign": "sin firmar el código disciplinario", "h.fMatch": "El partido es a las {h}.", "h.fCalled": "Convocatoria publicada · {n} convocados.", "h.fNoCall": "Todavía no hay convocatoria publicada.", "h.fKit": "Lleva botella de agua y espinilleras.", "h.fNote": "Como familia solo ves lo que el entrenador comparte.", "nav.temporada": "Temporada", "se.title": "Pilares de la temporada", "se.hint": "Reparte el año entre los cuatro pilares. Marca en qué meses pesa cada uno y anota el objetivo concreto de cada mes.", "se.months": "meses", "se.calendar": "Mes a mes", "se.goal": "Objetivo de", "se.goalPh": "Objetivo del mes. Ej. salida de balón desde portero", "se.saved": "Planificación guardada y compartida con tu equipo.", "se.share": "Compartir con el equipo", "se.shareNote": "Se guarda en este dispositivo mientras la editas. Al compartirla, la ve todo tu cuerpo técnico desde cualquier móvil.", "mt.abp": "ABP guardados", "mt.abpTap": "Toca una jugada para abrirla en la pizarra grande.", "mt.abpEmpty": "Aún no has guardado ninguna jugada a balón parado. Créalas en la pizarra, en el menú ABP, y aquí las tendrás a un toque.", "nav.analisis": "Análisis", "pm.title": "Análisis post-partido", "pm.events": "eventos en el acta", "pm.empty": "Aún no hay acta de este partido. Registra el partido en Modo partido y vuelve aquí: el análisis sale de los goles, cambios y tarjetas que hayas ido marcando.", "pm.go": "Generar análisis", "pm.again": "Volver a generar", "pm.thinking": "Analizando el partido…", "pm.note": "Lo redacta Coach AI a partir del acta. Repásalo antes de compartirlo con nadie.", "mt.subs": "Tandas de cambios", "mt.subsTotal": "tandas en total", "mt.subsOne": "Tanda", "mt.subsUndo": "Quitar una tanda", "mt.subsOf": "de", "mt.subsLeft": "Te quedan {n} tandas.", "mt.subsNone": "Sin tandas disponibles.", "tr.target": "Duración de la sesión", "tr.left": "Faltan {n} min por completar.", "tr.over": "Te pasas {n} min del objetivo.", "tr.done": "Sesión completa.", "tr.saveSession": "Guardar sesión completa",
    "navg.equipo": "Equipo", "navg.partido": "Día de partido", "navg.entrenamiento": "Entrenamiento", "navg.delegado": "Delegado", "navg.estadisticas": "Estadísticas", "navg.roles": "Roles", "navg.coachai": "Coach AI",
    "role.entrenador": "Entrenador principal", "role.segundo": "Segundo entrenador", "role.delegado": "Delegado", "role.padre": "Padre / Madre / Tutor", "role.director": "Director deportivo", "role.master": "Master · EBLDigital", 
    "c.exit": "Salir", "c.planFree": "PLAN GRATIS", "c.upgrade": "Mejorar", "c.by": "Desarrollado por EBLDigital", "c.madeBy": "App creada por EBLDigital ·", "navg.master": "Master", "nav.master": "Panel Master", "c.pro": "Función PRO. Mejora a una cuenta oficial del club para desbloquearla.", "c.cancel": "Cancelar", "c.nav": "Navegación", "c.trialBadge": "PRUEBA PRO", "c.planCurrentFree": "Plan actual · Gratis", "c.goPro": "Ir a PRO",
    "a.tagline": "Gestión inteligente para entrenadores de fútbol base", "a.accOff": "Sí, entreno en un club", "a.accOffD": "Tu director deportivo o el Master ya te han dado de alta antes. Pon tu contraseña y entras al momento.", "a.accFree": "No, entreno por mi cuenta", "a.accFreeD": "Tu equipo es tuyo y no depende de nadie. Sin aprobaciones.", "a.have": "Ya soy usuario", "a.register": "Registrarme", "a.name": "Tu nombre", "a.fullname": "Nombre y apellidos", "a.email": "Email", "a.pass": "Contraseña", "a.region": "Comunidad autónoma", "a.clubMadrid": "Club (Comunidad de Madrid)", "a.choose": "Elige tu club…", "a.otherClub": "Nombre de tu club", "a.teamOff": "Equipo", "a.teamFree": "Tu equipo", "a.role": "Tu rol", "a.pending": "Entras al momento y puedes empezar a trabajar con tu equipo. Hasta que el club apruebe tu acceso no verás los datos compartidos del club ni la gestión de usuarios.", "a.freeInc": "Gratis para siempre: plantilla completa sin límite de jugadores, alineación, convocatoria, modo partido, pizarra y Coach AI.", "a.startFree": "Empezar gratis", "a.signin": "Iniciar sesión", "a.create": "Crear cuenta y entrar", "a.proto": "Prototipo — los datos no se guardan en ningún servidor", "a.choice": "¿Perteneces a un club?", "a.choiceD": "Las dos opciones son gratuitas. Solo cambia de quién dependen tus datos.", "a.back": "‹ Volver", "a.badCreds": "Email o contraseña incorrectos.", "a.accPending": "Tu cuenta está pendiente de aprobación por el club.", "a.accSusp": "Tu acceso está suspendido. Contacta con tu club.", "a.exists": "Ese email ya está registrado. Inicia sesión.", "a.registered": "¡Registro recibido! Tu acceso queda pendiente de aprobación por el club.", "a.loading": "Cargando…", "a.entering": "Entrando…", "a.demoHint": "Demo: usuario demo / contraseña demo", "a.demoBtn": "▶ Entrar con usuario demo", "a.demoPick": "¿Qué rol quieres ver?", "a.demoPickD": "Elige un rol para explorar la app tal y como lo vería esa persona.",
    "a.forgot": "¿Has olvidado tu contraseña?", "a.forgotTitle": "Recuperar contraseña", "a.forgotD": "Escribe tu email y te mandamos un enlace para elegir una nueva.", "a.forgotSend": "Enviar enlace", "a.sending": "Enviando…", "a.forgotSent": "Si ese email tiene cuenta, ya está el enlace enviado. Caduca en una hora y solo sirve una vez. Mira también en spam.", "a.forgotNoMail": "El envío de correo no está disponible ahora mismo. Avisa a tu club para que lo revise.", "a.resetTitle": "Elige tu nueva contraseña", "a.resetD": "Este enlace caduca en una hora y solo sirve una vez.", "a.newPass": "Nueva contraseña", "a.newPass2": "Repite la contraseña", "a.resetSave": "Guardar contraseña", "a.resetOk": "Contraseña actualizada. Ya puedes entrar con ella.", "a.resetBad": "Este enlace ya no vale: ha caducado o ya se ha usado. Pide otro.", "a.passRule": "Mínimo 6 caracteres, y las dos deben coincidir.", "a.noBackend": "No hay conexión con el servidor. Inténtalo más tarde.",
    "p.account": "Mi cuenta", "p.changePass": "Cambiar contraseña", "p.current": "Contraseña actual", "p.save": "Guardar", "p.saved": "Contraseña actualizada.", "p.badCurrent": "La contraseña actual no es correcta.", "p.close": "Cerrar",
    "h.nextMatch": "Próximo partido", "h.nextTrain": "Próximo entrenamiento", "h.available": "Disponibles", "h.lessMin": "Menos participación", "h.alerts": "Alertas", "h.quick": "Accesos rápidos", "h.family": "Avisos para las familias", "h.pending": "accesos pendientes de aprobar", "h.startMatch": "Iniciar partido", "as.title": "Asistencia del día", "as.subtitle": "Quién ha venido y por qué. Sin incidencias ni sanciones: eso sigue en Disciplina.", "as.today": "Hoy", "as.markAll": "✓ Marcar todos presentes", "as.present": "Presente", "as.unmarked": "Sin marcar", "as.studies": "Estudios", "as.noExcuse": "Sin explicación", "as.sick": "Enfermedad", "as.injured": "Lesión", "as.reset": "Quitar marca", "as.noPlayers": "No hay jugadores en la plantilla.", "as.discNote": "¿Retraso o falta con consecuencia disciplinaria? Eso se registra en Disciplina → Pasar lista, que además avisa al cuerpo técnico.", "as.homeTitle": "Asistencia de hoy", "as.homeEmpty": "Todavía no has pasado lista hoy.", "as.homeCta": "Pasar lista", "as.homeSee": "Ver asistencia", "as.homeAll": "Todos presentes.", "as.homeOf": "de",
    "w.title": "Pizarra táctica", "w.move": "Mover", "w.arrow": "Flecha", "w.pass": "Pase", "w.free": "Dibujo", "w.cone": "Cono", "w.ball": "Balón", "w.erase": "Borrar", "w.clear": "Limpiar", "w.home": "Local", "w.away": "Rival", "w.hint": "Elige herramienta · arrastra las fichas · dibuja sobre el campo", "w.form": "Colocar", "w.f11": "Fútbol 11", "w.f7": "Fútbol 7", "w.homeSys": "Sistema local", "w.awaySys": "Sistema rival", "w.exercises": "Ejercicios recomendados", "w.exHint": "Toca un ejercicio para colocarlo en la pizarra", "w.autoSave": "El sistema elegido se guarda automáticamente en este dispositivo",
    "ex.title": "Biblioteca de ejercicios", "ex.hint": "Filtra por categoría, mira duración y material, y úsalo en la pizarra o añádelo a un entrenamiento.", "ex.all": "Todos", "ex.cat.rondo": "Rondos y posesión", "ex.cat.finish": "Finalización", "ex.cat.press": "Presión y transición", "ex.cat.buildup": "Salida de balón", "ex.cat.setpiece": "Acciones a balón parado", "ex.cat.technique": "Técnica individual", "ex.cat.fitness": "Físico", "ex.cat.gk": "Porteros", "ex.cat.warmup": "Calentamiento", "ex.cat.defense": "Defensa", "ex.cat.cross": "Centros y remate", "ex.cat.duel": "Duelos 1v1", "ex.dur": "min", "ex.materials": "Material", "ex.useBoard": "Usar en la pizarra", "ex.addTrain": "Añadir a entrenamiento", "ex.added": "✓ Añadido",
    "tr.title": "Modo entrenamiento", "tr.hint": "Planifica la sesión añadiendo bloques desde la biblioteca de ejercicios o bloques libres.", "tr.date": "Fecha", "tr.time": "Hora", "tr.objective": "Objetivo de la sesión", "tr.objectivePh": "Ej. transiciones defensivas", "tr.addFromLib": "+ Añadir desde la biblioteca", "tr.addCustom": "+ Bloque libre", "tr.customName": "Nombre del bloque", "tr.customDur": "Duración (min)", "tr.noBlocks": "Aún no has añadido ningún bloque a esta sesión.", "tr.total": "Duración total", "tr.materials": "Material necesario", "tr.remove": "Quitar", "tr.up": "▲", "tr.down": "▼", "tr.sendBoard": "Ver en pizarra", "tr.summary": "Resumen para compartir", "tr.copy": "Copiar resumen", "tr.copied": "✓ Copiado", "tr.whatsapp": "Abrir WhatsApp", "tr.min": "min", "tr.close": "Cerrar", "tr.newBlock": "Nuevo bloque",
    "st.title": "Estadísticas del equipo", "st.availability": "Disponibilidad de la plantilla", "st.available": "Disponibles", "st.doubt": "Duda", "st.injured": "Lesionados", "st.topAtt": "Mayor asistencia a entrenamientos", "st.lowMin": "Menor participación (minutos)", "st.byPosition": "Plantilla por línea", "st.gkPos": "Porteros", "st.defPos": "Defensas", "st.midPos": "Centrocampistas", "st.fwdPos": "Delanteros", "st.players": "jugadores", "st.byRole": "Desglose por demarcación", "st.roleHint": "Reparto real de la plantilla, posición a posición, con el peso de cada una sobre el total.", "st.total": "Total plantilla", "st.player": "jugador",
    "m.title": "Material para el entrenador", "m.aff": "Enlace de afiliado", "m.note": "Enlaces de afiliado marcados claramente y adaptados a tu país. Una pequeña comisión ayuda a mantener la app; el precio para ti no cambia.", "m.all": "Todo", "m.training": "Entrenamiento", "m.gk": "Porteros", "m.medical": "Botiquín", "m.tech": "Tecnología", "m.apparel": "Vestuario", "m.view": "Ver oferta", "m.from": "desde",
    "u.canGrant": "Como director deportivo o Master das de alta al cuerpo técnico y decides el rol de cada uno.", "u.readonly": "Vista de solo lectura: solo el director deportivo o el Master dan de alta.", "u.approve": "Aprobar", "u.suspend": "Suspender", "u.note": "Solo el director deportivo o el Master pueden asignar el rol de entrenador.", "u.activo": "activo", "u.pendiente": "pendiente",

    /* v49 — cadenas que antes estaban en español a fuego */
    "sq.cloud": "Guardado en la nube",
    "sq.cloudOn": "● Guardado en la nube",
    "sq.cloudOff": "○ Solo en este dispositivo",
    "sq.saveSquad": "↑ Guardar plantilla",
    "sq.saveCal": "↑ Guardar calendario",
    "sq.cloudNote": "Sin guardar en la nube, los datos viven solo en este navegador: se pierden al vaciar la caché y no se ven desde otro dispositivo.",
    "sq.clubData": "Datos del club",
    "sq.crest": "Escudo",
    "sq.fieldName": "Nombre del campo",
    "sq.address": "Dirección",
    "sq.maps": "Enlace de Google Maps",
    "sq.importCsv": "+ Importar CSV",
    "sq.importTitle": "Importar plantilla desde CSV",
    "sq.oneLine": "Una línea por jugador:",
    "sq.csvCols": "nombre, apellidos, dorsal, posición",
    "sq.csvOpt": "(dorsal y posición opcionales).",
    "sq.replace": "Reemplazar plantilla actual",
    "sq.import": "Importar",
    "sq.close": "Cerrar",
    "sq.player": "Jugador",
    "sq.state": "Estado",
    "sq.min": "Min.",
    "sq.att": "Asist.",
    "ln.apply": "Aplicar",
    "ln.other": "Otro: 4-1-4-1",
    "ln.tapPos": "Toca una posición del campo y asigna un jugador",
    "cl.waMsg": "Mensaje para WhatsApp",
    "cl.waOpen": "Abrir WhatsApp",
    "cl.waLegend": "🧤 portero · dorsal en emoji · porteros primero",
    "mt.half2": "2ª parte",
    "mt.halfLen": "Duración de cada parte",
    "mt.added": "Tiempo añadido por el árbitro",
    "mt.events": "Eventos del partido",
    "mt.noEvents": "Aún no hay eventos.",
    "mt.who": "¿Quién?",
    "ca.title": "Calendario del equipo",
    "ca.empty": "Todavía no hay partidos. Importa el calendario de tu equipo abajo.",
    "ca.import": "Importar calendario",
    "ca.importBtn": "Importar",
    "ca.example": "Ver ejemplo",
    "ca.clear": "Vaciar",
    "ca.remove": "Quitar",
    "ca.useMatch": "Usar en modo partido", "ca.month": "Calendario del mes", "ca.dayHint": "Toca un día para ver su detalle.", "ca.dayEmpty": "No hay partidos ni entrenamiento programado este día.", "ca.dayTraining": "Día de entrenamiento", "ca.legendMatch": "Partido (del calendario importado)", "ca.legendTrain": "Entrenamiento", "ca.trainDaysLabel": "Días de entreno:",
    "ca.teamCrest": "Escudo del equipo",

    /* v50 — plantillas de entrenamiento */
    "pl.title": "Plantillas de entrenamiento",
    "pl.hint": "Guarda la sesión que tienes montada abajo como guion reutilizable. Las compartidas las pueden usar todos los equipos del club. Se ordenan por las más usadas.",
    "pl.namePh": "Nombre: p. ej. Rondos + finalización",
    "pl.shareClub": "Compartir con el club",
    "pl.save": "Guardar plantilla",
    "pl.saving": "Guardando…",
    "pl.needBlocks": "Añade ejercicios abajo para poder guardarla.",
    "pl.empty": "Todavía no hay plantillas guardadas.",
    "pl.use": "Usar",
    "pl.uses": "usos",
    "pl.shared": "Compartida",
    "pl.fromClub": "de otro equipo del club",
    "pl.delete": "Borrar plantilla",
    "nav.roleOne": "perfil",
    "nav.roleMany": "perfiles",
  },
  en: {
    "nav.inicio": "Home", "nav.jugadores": "Players", "nav.alineacion": "Line-up", "nav.pizarra": "Whiteboard", "nav.convocatoria": "Squad list", "nav.partido": "Match mode", "nav.usuarios": "Users", "nav.coachai": "Coach AI", "nav.material": "Store", "nav.entrenamiento": "Training", "nav.ejercicios": "Drills", "nav.estadisticas": "Stats", "nav.calendario": "Fixtures", "nav.equipos": "Clubs", "nav.premium": "Premium", "nav.disciplina": "Discipline", "nav.normativa": "Club rules", "nav.familias": "Families", "nav.equipo": "Club", "mt.toBoard": "Whiteboard", "p.myTeam": "My club and age group", "p.pickTeam": "Switch to another age group…", "p.changeTeam": "Change age group", "p.newTeam": "New age group name", "p.newTeamPh": "e.g. U16 B", "p.newTeamNote": "Yours not on the list? Create it inside your club:", "p.createTeam": "Create", "p.deleteAcc": "Delete my account", "p.deleteWarn": "Your profile will be deleted and you will lose access. This cannot be undone. Team data is not deleted.", "p.deleteGo": "Delete", "c.proTab": "PRO section. Tap to see it.", "a.resetAgain": "Request a new link", "a.resetExp": "This link has expired (it lasts one hour). Request a new one from \"Forgotten your password?\".", "a.resetUsed": "This link has already been used. If that was not you, request another and change it right away.", "a.resetServer": "The server could not save the password. Try again in a minute.", "h.round": "Round", "h.howTo": "Directions", "h.today": "Today", "h.day": "Day", "h.days": "Days", "h.noDate": "No date", "h.noGoal": "Session with no goal set", "h.noTrain": "No training session planned.", "h.planTrain": "Plan one", "h.noAlerts": "Nothing to review. Full squad available.", "h.aDoubt1": "doubt", "h.aDoubtN": "doubts", "h.aInj1": "injured", "h.aInjN": "injured", "h.aDisc": "incident(s) awaiting validation", "h.aSign": "have not signed the code of conduct", "h.fMatch": "Kick-off at {h}.", "h.fCalled": "Squad list published · {n} called up.", "h.fNoCall": "No squad list published yet.", "h.fKit": "Bring a water bottle and shin pads.", "h.fNote": "As a family you only see what the coach shares.", "nav.temporada": "Season", "se.title": "Season pillars", "se.hint": "Spread the year across the four pillars. Mark which months each one carries weight, and note the specific goal for each month.", "se.months": "months", "se.calendar": "Month by month", "se.goal": "Goal for", "se.goalPh": "Goal for the month. E.g. building out from the keeper", "se.saved": "Season plan saved and shared with your team.", "se.share": "Share with the team", "se.shareNote": "Kept on this device while you edit. Once shared, your whole coaching staff sees it from any phone.", "mt.abp": "Saved set pieces", "mt.abpTap": "Tap a play to open it on the full whiteboard.", "mt.abpEmpty": "No set-piece plays saved yet. Create them on the whiteboard, in the ABP menu, and they will be one tap away here.", "nav.analisis": "Analysis", "pm.title": "Post-match analysis", "pm.events": "events logged", "pm.empty": "No match log yet. Record the match in Match mode and come back: the analysis is built from the goals, subs and cards you logged.", "pm.go": "Generate analysis", "pm.again": "Generate again", "pm.thinking": "Analysing the match…", "pm.note": "Written by Coach AI from the match log. Read it over before sharing it.", "mt.subs": "Substitution windows", "mt.subsTotal": "windows in total", "mt.subsOne": "Window", "mt.subsUndo": "Remove one window", "mt.subsOf": "of", "mt.subsLeft": "{n} windows left.", "mt.subsNone": "No windows left.", "tr.target": "Session length", "tr.left": "{n} min still to fill.", "tr.over": "{n} min over target.", "tr.done": "Session complete.", "tr.saveSession": "Save full session",
    "navg.equipo": "Team", "navg.partido": "Matchday", "navg.entrenamiento": "Training", "navg.delegado": "Team manager", "navg.estadisticas": "Stats", "navg.roles": "Roles", "navg.coachai": "Coach AI",
    "role.entrenador": "Head coach", "role.segundo": "Assistant coach", "role.delegado": "Team manager", "role.padre": "Parent / Guardian", "role.director": "Sporting director", "role.master": "Master · EBLDigital", 
    "c.exit": "Log out", "c.planFree": "FREE PLAN", "c.upgrade": "Upgrade", "c.by": "Built by EBLDigital", "c.madeBy": "App built by EBLDigital ·", "navg.master": "Master", "nav.master": "Master panel", "c.pro": "PRO feature. Upgrade to an official club account to unlock it.", "c.cancel": "Cancel", "c.nav": "Navigation", "c.trialBadge": "TRIAL PRO", "c.planCurrentFree": "Current plan · Free", "c.goPro": "Go PRO",
    "a.tagline": "Smart management for grassroots football coaches", "a.accOff": "Yes, I coach at a club", "a.accOffD": "Your sporting director or the Master has already added you. Set your password and you're in right away.", "a.accFree": "No, I coach on my own", "a.accFreeD": "Your team is yours alone. No approvals.", "a.have": "I already have an account", "a.register": "Sign up", "a.name": "Your name", "a.fullname": "Full name", "a.email": "Email", "a.pass": "Password", "a.region": "Region", "a.clubMadrid": "Club (Madrid region)", "a.choose": "Choose your club…", "a.otherClub": "Your club name", "a.teamOff": "Team", "a.teamFree": "Your team", "a.role": "Your role", "a.pending": "When you sign up as an official user, your access stays pending until the sporting director or the Master approves it. Not every user can be a coach.", "a.freeInc": "Free forever: full squad with no player limit, line-up, squad list, match mode, whiteboard and Coach AI.", "a.startFree": "Start free", "a.signin": "Sign in", "a.create": "Create account & enter", "a.proto": "Prototype — no data is stored on any server", "a.choice": "Do you belong to a club?", "a.choiceD": "Both options are free. It only changes who owns your data.", "a.back": "‹ Back", "a.badCreds": "Wrong email or password.", "a.accPending": "Your account is pending approval by the club.", "a.accSusp": "Your access is suspended. Contact your club.", "a.exists": "That email is already registered. Sign in.", "a.registered": "Registration received! Your access is pending club approval.", "a.loading": "Loading…", "a.entering": "Entering…", "a.demoHint": "Demo: username demo / password demo", "a.demoBtn": "▶ Enter with demo account", "a.demoPick": "Which role do you want to see?", "a.demoPickD": "Pick a role to explore the app as that person would see it.",
    "a.forgot": "Forgotten your password?", "a.forgotTitle": "Reset password", "a.forgotD": "Enter your email and we'll send you a link to choose a new one.", "a.forgotSend": "Send link", "a.sending": "Sending…", "a.forgotSent": "If that email has an account, the link is on its way. It expires in an hour and works once. Check your spam folder too.", "a.forgotNoMail": "Email sending is unavailable right now. Let your club know so they can look into it.", "a.resetTitle": "Choose your new password", "a.resetD": "This link expires in an hour and works only once.", "a.newPass": "New password", "a.newPass2": "Repeat password", "a.resetSave": "Save password", "a.resetOk": "Password updated. You can sign in with it now.", "a.resetBad": "This link no longer works: it expired or was already used. Request a new one.", "a.passRule": "At least 6 characters, and both must match.", "a.noBackend": "No connection to the server. Try again later.",
    "p.account": "My account", "p.changePass": "Change password", "p.current": "Current password", "p.save": "Save", "p.saved": "Password updated.", "p.badCurrent": "That current password isn't right.", "p.close": "Close",
    "h.nextMatch": "Next match", "h.nextTrain": "Next training", "h.available": "Available", "h.lessMin": "Least game time", "h.alerts": "Alerts", "h.quick": "Quick access", "h.family": "Notices for families", "h.pending": "pending access requests", "h.startMatch": "Start match",
    "w.title": "Tactics board", "w.move": "Move", "w.arrow": "Arrow", "w.pass": "Pass", "w.free": "Draw", "w.cone": "Cone", "w.ball": "Ball", "w.erase": "Erase", "w.clear": "Clear", "w.home": "Home", "w.away": "Away", "w.hint": "Pick a tool · drag the tokens · draw on the pitch", "w.form": "Place", "w.f11": "11-a-side", "w.f7": "7-a-side", "w.homeSys": "Home system", "w.awaySys": "Away system", "w.exercises": "Recommended drills", "w.exHint": "Tap a drill to set it up on the board", "w.autoSave": "Your chosen system is saved automatically on this device",
    "ex.title": "Drill library", "ex.hint": "Filter by category, check duration and materials, and use it on the board or add it to a session.", "ex.all": "All", "ex.cat.rondo": "Rondos & possession", "ex.cat.finish": "Finishing", "ex.cat.press": "Pressing & transition", "ex.cat.buildup": "Build-up", "ex.cat.setpiece": "Set pieces", "ex.cat.technique": "Individual technique", "ex.cat.fitness": "Fitness", "ex.cat.gk": "Goalkeeping", "ex.cat.warmup": "Warm-up", "ex.cat.defense": "Defending", "ex.cat.cross": "Crossing & finishing", "ex.cat.duel": "1v1 duels", "ex.dur": "min", "ex.materials": "Materials", "ex.useBoard": "Use on the board", "ex.addTrain": "Add to training", "ex.added": "✓ Added",
    "tr.title": "Training mode", "tr.hint": "Plan the session by adding blocks from the drill library or free-text blocks.", "tr.date": "Date", "tr.time": "Time", "tr.objective": "Session objective", "tr.objectivePh": "E.g. defensive transitions", "tr.addFromLib": "+ Add from library", "tr.addCustom": "+ Free block", "tr.customName": "Block name", "tr.customDur": "Duration (min)", "tr.noBlocks": "You haven't added any blocks to this session yet.", "tr.total": "Total duration", "tr.materials": "Materials needed", "tr.remove": "Remove", "tr.up": "▲", "tr.down": "▼", "tr.sendBoard": "View on board", "tr.summary": "Shareable summary", "tr.copy": "Copy summary", "tr.copied": "✓ Copied", "tr.whatsapp": "Open WhatsApp", "tr.min": "min", "tr.close": "Close", "tr.newBlock": "New block",
    "st.title": "Team statistics", "st.availability": "Squad availability", "st.available": "Available", "st.doubt": "Doubtful", "st.injured": "Injured", "st.topAtt": "Highest training attendance", "st.lowMin": "Least game time (minutes)", "st.byPosition": "Squad by line", "st.gkPos": "Goalkeepers", "st.defPos": "Defenders", "st.midPos": "Midfielders", "st.fwdPos": "Forwards", "st.players": "players", "st.byRole": "Breakdown by position", "st.roleHint": "How the squad actually splits, position by position, with each one's share of the total.", "st.total": "Squad total", "st.player": "player",
    "m.title": "Coaching store", "m.aff": "Affiliate link", "m.note": "Affiliate links are clearly marked and adapted to your country. A small commission helps keep the app running; your price doesn't change.", "m.all": "All", "m.training": "Training", "m.gk": "Goalkeeping", "m.medical": "First aid", "m.tech": "Technology", "m.apparel": "Apparel", "m.view": "View deal", "m.from": "from",
    "u.canGrant": "As sporting director or Master you can add staff and assign each user's role.", "u.readonly": "Read-only view: only the sporting director or the Master can add people.", "u.approve": "Approve", "u.suspend": "Suspend", "u.note": "Only the sporting director or the Master can assign the coach role.", "u.activo": "active", "u.pendiente": "pending",

    /* v49 — cadenas que antes estaban en español a fuego */
    "sq.cloud": "Saved to the cloud",
    "sq.cloudOn": "● Saved to the cloud",
    "sq.cloudOff": "○ This device only",
    "sq.saveSquad": "↑ Save squad",
    "sq.saveCal": "↑ Save fixtures",
    "sq.cloudNote": "Without saving to the cloud, your data lives only in this browser: it is lost when you clear the cache and cannot be seen from another device.",
    "sq.clubData": "Club details",
    "sq.crest": "Crest",
    "sq.fieldName": "Ground name",
    "sq.address": "Address",
    "sq.maps": "Google Maps link",
    "sq.importCsv": "+ Import CSV",
    "sq.importTitle": "Import squad from CSV",
    "sq.oneLine": "One line per player:",
    "sq.csvCols": "first name, surname, number, position",
    "sq.csvOpt": "(number and position optional).",
    "sq.replace": "Replace current squad",
    "sq.import": "Import",
    "sq.close": "Close",
    "sq.player": "Player",
    "sq.state": "Status",
    "sq.min": "Mins",
    "sq.att": "Att.",
    "ln.apply": "Apply",
    "ln.other": "Other: 4-1-4-1",
    "ln.tapPos": "Tap a position on the pitch and assign a player",
    "cl.waMsg": "WhatsApp message",
    "cl.waOpen": "Open WhatsApp",
    "cl.waLegend": "🧤 goalkeeper · number as emoji · keepers first",
    "mt.half2": "2nd half",
    "mt.halfLen": "Length of each half",
    "mt.added": "Added time by the referee",
    "mt.events": "Match events",
    "mt.noEvents": "No events yet.",
    "mt.who": "Who?",
    "ca.title": "Team fixtures",
    "ca.empty": "No fixtures yet. Import your team's calendar below.",
    "ca.import": "Import fixtures",
    "ca.importBtn": "Import",
    "ca.example": "See example",
    "ca.clear": "Clear",
    "ca.remove": "Remove",
    "ca.useMatch": "Use in match mode", "ca.month": "Month calendar", "ca.dayHint": "Tap a day to see its detail.", "ca.dayEmpty": "No fixtures or training scheduled this day.", "ca.dayTraining": "Training day", "ca.legendMatch": "Fixture (from the imported calendar)", "ca.legendTrain": "Training", "ca.trainDaysLabel": "Training days:",
    "ca.teamCrest": "Team crest",

    /* v50 — plantillas de entrenamiento */
    "pl.title": "Training templates",
    "pl.hint": "Save the session you have built below as a reusable plan. Shared ones can be used by every team in the club. Sorted by most used.",
    "pl.namePh": "Name: e.g. Rondos + finishing",
    "pl.shareClub": "Share with the club",
    "pl.save": "Save template",
    "pl.saving": "Saving…",
    "pl.needBlocks": "Add drills below before saving.",
    "pl.empty": "No templates saved yet.",
    "pl.use": "Use",
    "pl.uses": "uses",
    "pl.shared": "Shared",
    "pl.fromClub": "from another team in the club",
    "pl.delete": "Delete template",
    "nav.roleOne": "profile",
    "nav.roleMany": "profiles",
    "nav.asistencia": "Attendance",
    "as.title": "Today's attendance",
    "as.subtitle": "Who showed up and why. No incidents or sanctions here — that still lives in Discipline.",
    "as.today": "Today",
    "as.markAll": "✓ Mark all present",
    "as.present": "Present",
    "as.unmarked": "Unmarked",
    "as.studies": "Studies",
    "as.noExcuse": "No excuse given",
    "as.sick": "Illness",
    "as.injured": "Injury",
    "as.reset": "Clear mark",
    "as.noPlayers": "There are no players in the squad.",
    "as.discNote": "Late arrival or absence with disciplinary consequences? That's recorded in Discipline → Roll call, which also notifies the coaching staff.",
    "as.homeTitle": "Today's attendance",
    "as.homeEmpty": "You haven't taken attendance today yet.",
    "as.homeCta": "Take attendance",
    "as.homeSee": "View attendance",
    "as.homeAll": "Everyone present.",
    "as.homeOf": "of",
  },
  fr: {
    "nav.inicio": "Accueil", "nav.jugadores": "Joueurs", "nav.alineacion": "Composition", "nav.pizarra": "Tableau", "nav.convocatoria": "Convocation", "nav.partido": "Mode match", "nav.usuarios": "Utilisateurs", "nav.coachai": "Coach AI", "nav.material": "Boutique", "nav.entrenamiento": "Entraînement", "nav.ejercicios": "Exercices", "nav.estadisticas": "Statistiques", "nav.calendario": "Calendrier", "nav.equipos": "Clubs", "nav.premium": "Premium", "nav.disciplina": "Discipline", "nav.normativa": "Règlement", "nav.familias": "Familles", "nav.equipo": "Club", "mt.toBoard": "Tableau", "p.myTeam": "Mon club et ma catégorie", "p.pickTeam": "Passer à une autre catégorie…", "p.changeTeam": "Changer de catégorie", "p.newTeam": "Nom de la nouvelle catégorie", "p.newTeamPh": "Ex. U16 B", "p.newTeamNote": "La vôtre n'est pas dans la liste ? Créez-la dans votre club :", "p.createTeam": "Créer", "p.deleteAcc": "Supprimer mon compte", "p.deleteWarn": "Votre fiche sera supprimée et vous perdrez l'accès. Irréversible. Les données de l'équipe ne sont pas supprimées.", "p.deleteGo": "Supprimer", "c.proTab": "Section PRO. Touchez pour voir.", "a.resetAgain": "Demander un nouveau lien", "a.resetExp": "Ce lien a expiré (il dure une heure). Demandez-en un autre.", "a.resetUsed": "Ce lien a déjà été utilisé. Si ce n'était pas vous, demandez-en un autre et changez-la sans tarder.", "a.resetServer": "Le serveur n'a pas pu enregistrer le mot de passe. Réessayez dans une minute.", "h.round": "Journée", "h.howTo": "Itinéraire", "h.today": "Aujourd'hui", "h.day": "Jour", "h.days": "Jours", "h.noDate": "Sans date", "h.noGoal": "Séance sans objectif", "h.noTrain": "Aucune séance planifiée.", "h.planTrain": "Planifier", "h.noAlerts": "Rien à signaler. Effectif au complet.", "h.aDoubt1": "incertain", "h.aDoubtN": "incertains", "h.aInj1": "blessé", "h.aInjN": "blessés", "h.aDisc": "incident(s) à valider", "h.aSign": "n'ont pas signé le règlement", "h.fMatch": "Le match est à {h}.", "h.fCalled": "Convocation publiée · {n} convoqués.", "h.fNoCall": "Pas encore de convocation.", "h.fKit": "Apporte une gourde et des protège-tibias.", "h.fNote": "En tant que famille, vous ne voyez que ce que l'entraîneur partage.", "nav.temporada": "Saison", "se.title": "Piliers de la saison", "se.hint": "Répartissez l'année entre les quatre piliers et notez l'objectif de chaque mois.", "se.months": "mois", "se.calendar": "Mois par mois", "se.goal": "Objectif de", "se.goalPh": "Objectif du mois. Ex. relance depuis le gardien", "se.saved": "Planification enregistrée et partagée avec l'équipe.", "se.share": "Partager avec l'équipe", "se.shareNote": "Conservée sur cet appareil pendant l'édition. Une fois partagée, tout le staff la voit.", "mt.abp": "Coups de pied arrêtés", "mt.abpTap": "Touchez une combinaison pour l’ouvrir sur le grand tableau.", "mt.abpEmpty": "Aucun coup de pied arrêté enregistré. Créez-les sur le tableau, menu ABP.", "nav.analisis": "Analyse", "pm.title": "Analyse d'après-match", "pm.events": "événements enregistrés", "pm.empty": "Pas encore de feuille de match. Enregistrez le match en Mode match et revenez ici.", "pm.go": "Générer l'analyse", "pm.again": "Régénérer", "pm.thinking": "Analyse du match…", "pm.note": "Rédigée par Coach AI à partir de la feuille de match. Relisez-la avant de la partager.", "mt.subs": "Fenêtres de remplacement", "mt.subsTotal": "fenêtres au total", "mt.subsOne": "Fenêtre", "mt.subsUndo": "Retirer une fenêtre", "mt.subsOf": "sur", "mt.subsLeft": "Il reste {n} fenêtres.", "mt.subsNone": "Plus de fenêtres.", "tr.target": "Durée de la séance", "tr.left": "Il reste {n} min à remplir.", "tr.over": "{n} min de plus que prévu.", "tr.done": "Séance complète.", "tr.saveSession": "Enregistrer la séance",
    "navg.equipo": "Équipe", "navg.partido": "Jour de match", "navg.entrenamiento": "Entraînement", "navg.delegado": "Délégué", "navg.estadisticas": "Statistiques", "navg.roles": "Rôles", "navg.coachai": "Coach AI",
    "role.entrenador": "Entraîneur principal", "role.segundo": "Entraîneur adjoint", "role.delegado": "Délégué", "role.padre": "Parent / Tuteur", "role.director": "Directeur sportif", "role.master": "Master · EBLDigital", 
    "c.exit": "Quitter", "c.planFree": "FORFAIT GRATUIT", "c.upgrade": "Améliorer", "c.by": "Développé par EBLDigital", "c.madeBy": "App créée par EBLDigital ·", "navg.master": "Master", "nav.master": "Panneau Master", "c.pro": "Fonction PRO. Passez à un compte officiel du club pour la débloquer.", "c.cancel": "Annuler", "c.nav": "Navigation", "c.trialBadge": "ESSAI PRO", "c.planCurrentFree": "Offre actuelle · Gratuite", "c.goPro": "Passer PRO",
    "a.tagline": "Gestion intelligente pour les éducateurs de football", "a.accOff": "Compte officiel du club", "a.accOffD": "Le directeur sportif ou le Master vous a déjà ajouté. Choisissez votre mot de passe pour accéder.", "a.accFree": "J'entraîne de mon côté", "a.accFreeD": "Gratuit, fonctions limitées.", "a.have": "J'ai déjà un compte", "a.register": "S'inscrire", "a.name": "Votre nom", "a.fullname": "Nom et prénom", "a.email": "E-mail", "a.pass": "Mot de passe", "a.region": "Région", "a.clubMadrid": "Club (région de Madrid)", "a.choose": "Choisissez votre club…", "a.otherClub": "Nom de votre club", "a.teamOff": "Équipe", "a.teamFree": "Votre équipe", "a.role": "Votre rôle", "a.pending": "En vous inscrivant comme utilisateur officiel, votre accès reste en attente jusqu'à validation par le directeur sportif ou le Master. Tous les utilisateurs ne peuvent pas être entraîneurs.", "a.freeInc": "Le forfait gratuit inclut jusqu'à 14 joueurs, la composition, la convocation, le mode match et Coach AI. Il n'inclut pas les vidéos de présentation, la gestion des utilisateurs ni les fonctions de club.", "a.startFree": "Commencer gratuitement", "a.signin": "Se connecter", "a.create": "Créer un compte et entrer", "a.proto": "Prototype — aucune donnée n'est enregistrée sur un serveur", "a.demoHint": "Démo : utilisateur demo / mot de passe demo", "a.demoBtn": "▶ Entrer avec le compte démo",
    "a.forgot": "Mot de passe oublié ?", "a.forgotTitle": "Récupérer le mot de passe", "a.forgotD": "Saisissez votre e-mail et nous vous enverrons un lien pour en choisir un nouveau.", "a.forgotSend": "Envoyer le lien", "a.sending": "Envoi…", "a.forgotSent": "Si cet e-mail a un compte, le lien est parti. Il expire dans une heure et ne sert qu'une fois. Vérifiez aussi vos spams.", "a.forgotNoMail": "L'envoi d'e-mails n'est pas disponible pour le moment. Prévenez votre club.", "a.resetTitle": "Choisissez votre nouveau mot de passe", "a.resetD": "Ce lien expire dans une heure et ne sert qu'une fois.", "a.newPass": "Nouveau mot de passe", "a.newPass2": "Répétez le mot de passe", "a.resetSave": "Enregistrer", "a.resetOk": "Mot de passe mis à jour. Vous pouvez vous connecter avec.", "a.resetBad": "Ce lien ne fonctionne plus : il a expiré ou a déjà été utilisé. Demandez-en un autre.", "a.passRule": "6 caractères minimum, et les deux doivent correspondre.", "a.noBackend": "Pas de connexion au serveur. Réessayez plus tard.",
    "p.account": "Mon compte", "p.changePass": "Changer le mot de passe", "p.current": "Mot de passe actuel", "p.save": "Enregistrer", "p.saved": "Mot de passe mis à jour.", "p.badCurrent": "Le mot de passe actuel est incorrect.", "p.close": "Fermer",
    "h.nextMatch": "Prochain match", "h.nextTrain": "Prochain entraînement", "h.available": "Disponibles", "h.lessMin": "Moins de temps de jeu", "h.alerts": "Alertes", "h.quick": "Accès rapides", "h.family": "Infos pour les familles", "h.pending": "accès en attente de validation", "h.startMatch": "Démarrer le match",
    "w.title": "Tableau tactique", "w.move": "Déplacer", "w.arrow": "Flèche", "w.pass": "Passe", "w.free": "Dessin", "w.cone": "Plot", "w.ball": "Ballon", "w.erase": "Effacer", "w.clear": "Tout effacer", "w.home": "Domicile", "w.away": "Adversaire", "w.hint": "Choisissez un outil · déplacez les jetons · dessinez sur le terrain", "w.form": "Placer", "w.f11": "Foot à 11", "w.f7": "Foot à 7", "w.homeSys": "Système domicile", "w.awaySys": "Système adverse", "w.exercises": "Exercices recommandés", "w.exHint": "Touchez un exercice pour le placer sur le tableau", "w.autoSave": "Le système choisi est enregistré automatiquement sur cet appareil",
    "m.title": "Boutique du coach", "m.aff": "Lien affilié", "m.note": "Liens affiliés clairement indiqués et adaptés à votre pays. Une petite commission aide à maintenir l'app ; votre prix ne change pas.", "m.all": "Tout", "m.training": "Entraînement", "m.gk": "Gardiens", "m.medical": "Premiers secours", "m.tech": "Technologie", "m.apparel": "Vêtements", "m.view": "Voir l'offre", "m.from": "à partir de",
    "u.canGrant": "En tant que directeur sportif ou Master, vous pouvez ajouter des membres et attribuer le rôle de chacun.", "u.readonly": "Lecture seule : seuls le directeur sportif ou le Master peuvent ajouter des membres.", "u.approve": "Approuver", "u.suspend": "Suspendre", "u.note": "Seuls le directeur sportif ou le Master peuvent attribuer le rôle d'entraîneur.", "u.activo": "actif", "u.pendiente": "en attente",

    /* v49 — cadenas que antes estaban en español a fuego */
    "sq.cloud": "Sauvegardé dans le cloud",
    "sq.cloudOn": "● Enregistré dans le cloud",
    "sq.cloudOff": "○ Cet appareil uniquement",
    "sq.saveSquad": "↑ Enregistrer l'effectif",
    "sq.saveCal": "↑ Enregistrer le calendrier",
    "sq.cloudNote": "Sans sauvegarde dans le cloud, les données ne vivent que dans ce navigateur : elles disparaissent si vous videz le cache et ne sont pas visibles depuis un autre appareil.",
    "sq.clubData": "Données du club",
    "sq.crest": "Écusson",
    "sq.fieldName": "Nom du terrain",
    "sq.address": "Adresse",
    "sq.maps": "Lien Google Maps",
    "sq.importCsv": "+ Importer CSV",
    "sq.importTitle": "Importer l'effectif depuis un CSV",
    "sq.oneLine": "Une ligne par joueur :",
    "sq.csvCols": "prénom, nom, numéro, poste",
    "sq.csvOpt": "(numéro et poste facultatifs).",
    "sq.replace": "Remplacer l'effectif actuel",
    "sq.import": "Importer",
    "sq.close": "Fermer",
    "sq.player": "Joueur",
    "sq.state": "Statut",
    "sq.min": "Min.",
    "sq.att": "Prés.",
    "ln.apply": "Appliquer",
    "ln.other": "Autre : 4-1-4-1",
    "ln.tapPos": "Touchez une position sur le terrain et affectez un joueur",
    "cl.waMsg": "Message pour WhatsApp",
    "cl.waOpen": "Ouvrir WhatsApp",
    "cl.waLegend": "🧤 gardien · numéro en emoji · gardiens d'abord",
    "mt.half2": "2e mi-temps",
    "mt.halfLen": "Durée de chaque mi-temps",
    "mt.added": "Temps additionnel de l'arbitre",
    "mt.events": "Événements du match",
    "mt.noEvents": "Pas encore d'événements.",
    "mt.who": "Qui ?",
    "ca.title": "Calendrier de l'équipe",
    "ca.empty": "Pas encore de matchs. Importez le calendrier de votre équipe ci-dessous.",
    "ca.import": "Importer le calendrier",
    "ca.importBtn": "Importer",
    "ca.example": "Voir un exemple",
    "ca.clear": "Vider",
    "ca.remove": "Retirer",
    "ca.useMatch": "Utiliser en mode match", "ca.month": "Calendrier du mois", "ca.dayHint": "Touchez un jour pour voir son détail.", "ca.dayEmpty": "Aucun match ni entraînement prévu ce jour.", "ca.dayTraining": "Jour d'entraînement", "ca.legendMatch": "Match (du calendrier importé)", "ca.legendTrain": "Entraînement", "ca.trainDaysLabel": "Jours d'entraînement :",
    "ca.teamCrest": "Écusson de l'équipe",

    /* v50 — plantillas de entrenamiento */
    "pl.title": "Modèles d'entraînement",
    "pl.hint": "Enregistrez la séance créée ci-dessous comme trame réutilisable. Les modèles partagés sont utilisables par toutes les équipes du club. Triés par les plus utilisés.",
    "pl.namePh": "Nom : ex. Rondos + finition",
    "pl.shareClub": "Partager avec le club",
    "pl.save": "Enregistrer le modèle",
    "pl.saving": "Enregistrement…",
    "pl.needBlocks": "Ajoutez des exercices ci-dessous avant d'enregistrer.",
    "pl.empty": "Aucun modèle enregistré pour l'instant.",
    "pl.use": "Utiliser",
    "pl.uses": "utilisations",
    "pl.shared": "Partagé",
    "pl.fromClub": "d'une autre équipe du club",
    "pl.delete": "Supprimer le modèle",
    "nav.roleOne": "profil",
    "nav.roleMany": "profils",
    "nav.asistencia": "Présences",
    "a.choice": "Faites-vous partie d'un club ?",
    "a.choiceD": "Les deux options sont gratuites. Seul change qui héberge vos données.",
    "a.back": "‹ Retour",
    "a.badCreds": "E-mail ou mot de passe incorrect.",
    "a.accPending": "Votre compte est en attente d'approbation par le club.",
    "a.accSusp": "Votre accès est suspendu. Contactez votre club.",
    "a.exists": "Cet e-mail est déjà enregistré. Connectez-vous.",
    "a.registered": "Inscription reçue ! Votre accès est en attente d'approbation par le club.",
    "a.loading": "Chargement…",
    "a.entering": "Connexion…",
    "a.demoPick": "Quel rôle voulez-vous voir ?",
    "a.demoPickD": "Choisissez un rôle pour découvrir l'application comme cette personne la verrait.",
    "as.title": "Présences du jour",
    "as.subtitle": "Qui est venu et pourquoi. Ni incidents ni sanctions ici : cela reste dans Discipline.",
    "as.today": "Aujourd'hui",
    "as.markAll": "✓ Marquer tous présents",
    "as.present": "Présent",
    "as.unmarked": "Non marqué",
    "as.studies": "Études",
    "as.noExcuse": "Sans justification",
    "as.sick": "Maladie",
    "as.injured": "Blessure",
    "as.reset": "Retirer la marque",
    "as.noPlayers": "Il n'y a aucun joueur dans l'effectif.",
    "as.discNote": "Retard ou absence avec conséquence disciplinaire ? Cela se déclare dans Discipline → Faire l'appel, qui avertit aussi le staff technique.",
    "as.homeTitle": "Présences du jour",
    "as.homeEmpty": "Vous n'avez pas encore fait l'appel aujourd'hui.",
    "as.homeCta": "Faire l'appel",
    "as.homeSee": "Voir les présences",
    "as.homeAll": "Tous présents.",
    "as.homeOf": "sur",
    "ex.title": "Bibliothèque d'exercices",
    "ex.hint": "Filtrez par catégorie, consultez la durée et le matériel, puis utilisez-le sur le tableau ou ajoutez-le à un entraînement.",
    "ex.all": "Tous",
    "ex.cat.rondo": "Rondos et possession",
    "ex.cat.finish": "Finition",
    "ex.cat.press": "Pressing et transition",
    "ex.cat.buildup": "Relance",
    "ex.cat.setpiece": "Phases arrêtées",
    "ex.cat.technique": "Technique individuelle",
    "ex.cat.fitness": "Physique",
    "ex.cat.gk": "Gardiens",
    "ex.cat.warmup": "Échauffement",
    "ex.cat.defense": "Défense",
    "ex.cat.cross": "Centres et finition",
    "ex.cat.duel": "Duels 1 contre 1",
    "ex.dur": "min",
    "ex.materials": "Matériel",
    "ex.useBoard": "Utiliser sur le tableau",
    "ex.addTrain": "Ajouter à l'entraînement",
    "ex.added": "✓ Ajouté",
    "tr.title": "Mode entraînement",
    "tr.hint": "Planifiez la séance en ajoutant des blocs depuis la bibliothèque d'exercices ou des blocs libres.",
    "tr.date": "Date",
    "tr.time": "Heure",
    "tr.objective": "Objectif de la séance",
    "tr.objectivePh": "Ex. transitions défensives",
    "tr.addFromLib": "+ Ajouter depuis la bibliothèque",
    "tr.addCustom": "+ Bloc libre",
    "tr.customName": "Nom du bloc",
    "tr.customDur": "Durée (min)",
    "tr.noBlocks": "Vous n'avez encore ajouté aucun bloc à cette séance.",
    "tr.total": "Durée totale",
    "tr.materials": "Matériel nécessaire",
    "tr.remove": "Retirer",
    "tr.up": "▲",
    "tr.down": "▼",
    "tr.sendBoard": "Voir sur le tableau",
    "tr.summary": "Résumé à partager",
    "tr.copy": "Copier le résumé",
    "tr.copied": "✓ Copié",
    "tr.whatsapp": "Ouvrir WhatsApp",
    "tr.min": "min",
    "tr.close": "Fermer",
    "tr.newBlock": "Nouveau bloc",
    "st.title": "Statistiques de l'équipe",
    "st.availability": "Disponibilité de l'effectif",
    "st.available": "Disponibles",
    "st.doubt": "Incertain",
    "st.injured": "Blessés",
    "st.topAtt": "Meilleure assiduité aux entraînements",
    "st.lowMin": "Moins de temps de jeu (minutes)",
    "st.byPosition": "Effectif par ligne",
    "st.gkPos": "Gardiens",
    "st.defPos": "Défenseurs",
    "st.midPos": "Milieux",
    "st.fwdPos": "Attaquants",
    "st.players": "joueurs",
    "st.byRole": "Répartition par poste",
    "st.roleHint": "Répartition réelle de l'effectif, poste par poste, avec le poids de chacun sur le total.",
    "st.total": "Effectif total",
    "st.player": "joueur",
  },
  de: {
    "nav.inicio": "Start", "nav.jugadores": "Spieler", "nav.alineacion": "Aufstellung", "nav.pizarra": "Taktiktafel", "nav.convocatoria": "Kader", "nav.partido": "Spielmodus", "nav.usuarios": "Benutzer", "nav.coachai": "Coach AI", "nav.material": "Shop", "nav.entrenamiento": "Training", "nav.ejercicios": "Übungen", "nav.estadisticas": "Statistik", "nav.calendario": "Spielplan", "nav.equipos": "Vereine", "nav.premium": "Premium", "nav.disciplina": "Disziplin", "nav.normativa": "Regelwerk", "nav.familias": "Familien", "nav.equipo": "Verein", "mt.toBoard": "Taktiktafel", "p.myTeam": "Mein Verein und meine Altersklasse", "p.pickTeam": "Andere Altersklasse wählen…", "p.changeTeam": "Altersklasse wechseln", "p.newTeam": "Name der neuen Altersklasse", "p.newTeamPh": "z. B. U16 B", "p.newTeamNote": "Deine ist nicht dabei? Leg sie in deinem Verein an:", "p.createTeam": "Anlegen", "p.deleteAcc": "Mein Konto löschen", "p.deleteWarn": "Dein Profil wird gelöscht und du verlierst den Zugang. Nicht rückgängig zu machen. Mannschaftsdaten bleiben erhalten.", "p.deleteGo": "Löschen", "c.proTab": "PRO-Bereich. Antippen zum Ansehen.", "a.resetAgain": "Neuen Link anfordern", "a.resetExp": "Dieser Link ist abgelaufen (er gilt eine Stunde). Fordere einen neuen an.", "a.resetUsed": "Dieser Link wurde bereits benutzt. Warst du das nicht, fordere einen neuen an und ändere sie sofort.", "a.resetServer": "Der Server konnte das Passwort nicht speichern. Versuch es in einer Minute noch einmal.", "h.round": "Spieltag", "h.howTo": "Anfahrt", "h.today": "Heute", "h.day": "Tag", "h.days": "Tage", "h.noDate": "Kein Datum", "h.noGoal": "Einheit ohne Ziel", "h.noTrain": "Keine Einheit geplant.", "h.planTrain": "Planen", "h.noAlerts": "Nichts zu prüfen. Kader komplett.", "h.aDoubt1": "fraglich", "h.aDoubtN": "fraglich", "h.aInj1": "verletzt", "h.aInjN": "verletzt", "h.aDisc": "Vorfall/Vorfälle zu prüfen", "h.aSign": "haben das Regelwerk nicht unterschrieben", "h.fMatch": "Anpfiff um {h}.", "h.fCalled": "Kader veröffentlicht · {n} nominiert.", "h.fNoCall": "Noch kein Kader veröffentlicht.", "h.fKit": "Trinkflasche und Schienbeinschoner mitbringen.", "h.fNote": "Als Familie siehst du nur, was der Trainer teilt.", "nav.temporada": "Saison", "se.title": "Säulen der Saison", "se.hint": "Verteile das Jahr auf die vier Säulen und notiere das Ziel jedes Monats.", "se.months": "Monate", "se.calendar": "Monat für Monat", "se.goal": "Ziel für", "se.goalPh": "Ziel des Monats. Z. B. Spielaufbau vom Torwart", "se.saved": "Planung gespeichert und mit der Mannschaft geteilt.", "se.share": "Mit der Mannschaft teilen", "se.shareNote": "Wird beim Bearbeiten auf diesem Gerät gehalten. Nach dem Teilen sieht sie das ganze Trainerteam.", "mt.abp": "Gespeicherte Standards", "mt.abpTap": "Tippe eine Variante an, um sie auf der großen Taktiktafel zu öffnen.", "mt.abpEmpty": "Noch keine Standardsituationen gespeichert. Lege sie auf der Taktiktafel im ABP-Menü an.", "nav.analisis": "Analyse", "pm.title": "Spielanalyse", "pm.events": "Ereignisse erfasst", "pm.empty": "Noch kein Spielbericht. Erfasse das Spiel im Spielmodus und komm zurück.", "pm.go": "Analyse erstellen", "pm.again": "Neu erstellen", "pm.thinking": "Spiel wird analysiert…", "pm.note": "Von Coach AI aus dem Spielbericht geschrieben. Vor dem Teilen durchlesen.", "mt.subs": "Wechselfenster", "mt.subsTotal": "Fenster insgesamt", "mt.subsOne": "Fenster", "mt.subsUndo": "Ein Fenster zurücknehmen", "mt.subsOf": "von", "mt.subsLeft": "Noch {n} Fenster.", "mt.subsNone": "Keine Fenster mehr.", "tr.target": "Dauer der Einheit", "tr.left": "Noch {n} min zu füllen.", "tr.over": "{n} min über dem Ziel.", "tr.done": "Einheit vollständig.", "tr.saveSession": "Einheit speichern",
    "navg.equipo": "Mannschaft", "navg.partido": "Spieltag", "navg.entrenamiento": "Training", "navg.delegado": "Betreuer", "navg.estadisticas": "Statistik", "navg.roles": "Rollen", "navg.coachai": "Coach AI",
    "role.entrenador": "Cheftrainer", "role.segundo": "Co-Trainer", "role.delegado": "Betreuer", "role.padre": "Elternteil / Vormund", "role.director": "Sportdirektor", "role.master": "Master · EBLDigital", 
    "c.exit": "Abmelden", "c.planFree": "GRATIS-PLAN", "c.upgrade": "Upgrade", "c.by": "Entwickelt von EBLDigital", "c.madeBy": "App entwickelt von EBLDigital ·", "navg.master": "Master", "nav.master": "Master-Panel", "c.pro": "PRO-Funktion. Für die Freischaltung auf ein offizielles Vereinskonto upgraden.", "c.cancel": "Abbrechen", "c.nav": "Navigation", "c.trialBadge": "TESTVERSION PRO", "c.planCurrentFree": "Aktueller Plan · Kostenlos", "c.goPro": "Zu PRO wechseln",
    "a.tagline": "Intelligentes Management für Jugendfußballtrainer", "a.accOff": "Offizielles Vereinskonto", "a.accOffD": "Der Sportdirektor oder der Master hat dich bereits hinzugefügt. Lege dein Passwort fest und leg direkt los.", "a.accFree": "Ich trainiere auf eigene Faust", "a.accFreeD": "Gratis, mit eingeschränkten Funktionen.", "a.have": "Ich habe bereits ein Konto", "a.register": "Registrieren", "a.name": "Dein Name", "a.fullname": "Vor- und Nachname", "a.email": "E-Mail", "a.pass": "Passwort", "a.region": "Region", "a.clubMadrid": "Verein (Region Madrid)", "a.choose": "Wähle deinen Verein…", "a.otherClub": "Name deines Vereins", "a.teamOff": "Mannschaft", "a.teamFree": "Deine Mannschaft", "a.role": "Deine Rolle", "a.pending": "Bei der Registrierung als offizieller Benutzer bleibt dein Zugang ausstehend, bis der Sportdirektor oder der Master ihn freigibt. Nicht jeder Benutzer kann Trainer sein.", "a.freeInc": "Der Gratis-Plan umfasst bis zu 14 Spieler, Aufstellung, Kader, Spielmodus und Coach AI. Nicht enthalten: Vorstellungsvideos, Benutzerverwaltung und Vereinsfunktionen.", "a.startFree": "Gratis starten", "a.signin": "Anmelden", "a.create": "Konto erstellen & starten", "a.proto": "Prototyp — es werden keine Daten auf einem Server gespeichert", "a.demoHint": "Demo: Benutzer demo / Passwort demo", "a.demoBtn": "▶ Mit Demo-Konto einloggen",
    "a.forgot": "Passwort vergessen?", "a.forgotTitle": "Passwort zurücksetzen", "a.forgotD": "Gib deine E-Mail ein und wir schicken dir einen Link für ein neues Passwort.", "a.forgotSend": "Link senden", "a.sending": "Wird gesendet…", "a.forgotSent": "Falls es zu dieser E-Mail ein Konto gibt, ist der Link unterwegs. Er läuft in einer Stunde ab und gilt nur einmal. Schau auch im Spam-Ordner.", "a.forgotNoMail": "Der E-Mail-Versand ist gerade nicht verfügbar. Sag deinem Verein Bescheid.", "a.resetTitle": "Wähle dein neues Passwort", "a.resetD": "Dieser Link läuft in einer Stunde ab und gilt nur einmal.", "a.newPass": "Neues Passwort", "a.newPass2": "Passwort wiederholen", "a.resetSave": "Passwort speichern", "a.resetOk": "Passwort aktualisiert. Du kannst dich jetzt damit anmelden.", "a.resetBad": "Dieser Link gilt nicht mehr: abgelaufen oder bereits benutzt. Fordere einen neuen an.", "a.passRule": "Mindestens 6 Zeichen, und beide müssen übereinstimmen.", "a.noBackend": "Keine Verbindung zum Server. Versuch es später noch einmal.",
    "p.account": "Mein Konto", "p.changePass": "Passwort ändern", "p.current": "Aktuelles Passwort", "p.save": "Speichern", "p.saved": "Passwort aktualisiert.", "p.badCurrent": "Das aktuelle Passwort stimmt nicht.", "p.close": "Schließen",
    "h.nextMatch": "Nächstes Spiel", "h.nextTrain": "Nächstes Training", "h.available": "Verfügbar", "h.lessMin": "Wenig Spielzeit", "h.alerts": "Warnungen", "h.quick": "Schnellzugriff", "h.family": "Infos für die Familien", "h.pending": "ausstehende Zugänge", "h.startMatch": "Spiel starten",
    "w.title": "Taktiktafel", "w.move": "Bewegen", "w.arrow": "Pfeil", "w.pass": "Pass", "w.free": "Zeichnen", "w.cone": "Hütchen", "w.ball": "Ball", "w.erase": "Löschen", "w.clear": "Alles löschen", "w.home": "Heim", "w.away": "Gegner", "w.hint": "Werkzeug wählen · Spielsteine ziehen · aufs Feld zeichnen", "w.form": "Aufstellen", "w.f11": "Fußball 11", "w.f7": "Fußball 7", "w.homeSys": "Heimsystem", "w.awaySys": "Gegnersystem", "w.exercises": "Empfohlene Übungen", "w.exHint": "Tippe auf eine Übung, um sie auf der Tafel aufzubauen", "w.autoSave": "Das gewählte System wird automatisch auf diesem Gerät gespeichert",
    "m.title": "Trainer-Shop", "m.aff": "Affiliate-Link", "m.note": "Affiliate-Links sind klar gekennzeichnet und an dein Land angepasst. Eine kleine Provision hilft, die App zu finanzieren; dein Preis ändert sich nicht.", "m.all": "Alle", "m.training": "Training", "m.gk": "Torwart", "m.medical": "Erste Hilfe", "m.tech": "Technik", "m.apparel": "Bekleidung", "m.view": "Angebot ansehen", "m.from": "ab",
    "u.canGrant": "Als Sportdirektor oder Master kannst du Mitglieder hinzufügen und Rollen zuweisen.", "u.readonly": "Nur-Lese-Ansicht: nur der Sportdirektor oder der Master können hinzufügen.", "u.approve": "Freigeben", "u.suspend": "Sperren", "u.note": "Nur der Sportdirektor oder der Master können die Trainerrolle vergeben.", "u.activo": "aktiv", "u.pendiente": "ausstehend",

    /* v49 — cadenas que antes estaban en español a fuego */
    "sq.cloud": "In der Cloud gespeichert",
    "sq.cloudOn": "● In der Cloud gespeichert",
    "sq.cloudOff": "○ Nur auf diesem Gerät",
    "sq.saveSquad": "↑ Kader speichern",
    "sq.saveCal": "↑ Spielplan speichern",
    "sq.cloudNote": "Ohne Speichern in der Cloud liegen die Daten nur in diesem Browser: Sie gehen beim Leeren des Caches verloren und sind auf anderen Geräten nicht sichtbar.",
    "sq.clubData": "Vereinsdaten",
    "sq.crest": "Wappen",
    "sq.fieldName": "Name des Platzes",
    "sq.address": "Adresse",
    "sq.maps": "Google-Maps-Link",
    "sq.importCsv": "+ CSV importieren",
    "sq.importTitle": "Kader aus CSV importieren",
    "sq.oneLine": "Eine Zeile pro Spieler:",
    "sq.csvCols": "Vorname, Nachname, Nummer, Position",
    "sq.csvOpt": "(Nummer und Position optional).",
    "sq.replace": "Aktuellen Kader ersetzen",
    "sq.import": "Importieren",
    "sq.close": "Schließen",
    "sq.player": "Spieler",
    "sq.state": "Status",
    "sq.min": "Min.",
    "sq.att": "Anw.",
    "ln.apply": "Anwenden",
    "ln.other": "Andere: 4-1-4-1",
    "ln.tapPos": "Tippe auf eine Position auf dem Platz und weise einen Spieler zu",
    "cl.waMsg": "Nachricht für WhatsApp",
    "cl.waOpen": "WhatsApp öffnen",
    "cl.waLegend": "🧤 Torwart · Nummer als Emoji · Torhüter zuerst",
    "mt.half2": "2. Halbzeit",
    "mt.halfLen": "Dauer jeder Halbzeit",
    "mt.added": "Nachspielzeit des Schiedsrichters",
    "mt.events": "Spielereignisse",
    "mt.noEvents": "Noch keine Ereignisse.",
    "mt.who": "Wer?",
    "ca.title": "Spielplan der Mannschaft",
    "ca.empty": "Noch keine Spiele. Importiere unten den Spielplan deiner Mannschaft.",
    "ca.import": "Spielplan importieren",
    "ca.importBtn": "Importieren",
    "ca.example": "Beispiel ansehen",
    "ca.clear": "Leeren",
    "ca.remove": "Entfernen",
    "ca.useMatch": "Im Spielmodus verwenden", "ca.month": "Monatskalender", "ca.dayHint": "Tippe auf einen Tag, um Details zu sehen.", "ca.dayEmpty": "An diesem Tag sind weder Spiele noch Training geplant.", "ca.dayTraining": "Trainingstag", "ca.legendMatch": "Spiel (aus importiertem Spielplan)", "ca.legendTrain": "Training", "ca.trainDaysLabel": "Trainingstage:",
    "ca.teamCrest": "Mannschaftswappen",

    /* v50 — plantillas de entrenamiento */
    "pl.title": "Trainingsvorlagen",
    "pl.hint": "Speichere die unten erstellte Einheit als wiederverwendbaren Ablauf. Geteilte Vorlagen können alle Mannschaften des Vereins nutzen. Sortiert nach Häufigkeit.",
    "pl.namePh": "Name: z. B. Rondos + Abschluss",
    "pl.shareClub": "Mit dem Verein teilen",
    "pl.save": "Vorlage speichern",
    "pl.saving": "Speichern…",
    "pl.needBlocks": "Füge unten Übungen hinzu, um zu speichern.",
    "pl.empty": "Noch keine Vorlagen gespeichert.",
    "pl.use": "Verwenden",
    "pl.uses": "Verwendungen",
    "pl.shared": "Geteilt",
    "pl.fromClub": "von einer anderen Mannschaft des Vereins",
    "pl.delete": "Vorlage löschen",
    "nav.roleOne": "Profil",
    "nav.roleMany": "Profile",
    "nav.asistencia": "Anwesenheit",
    "a.choice": "Gehörst du zu einem Verein?",
    "a.choiceD": "Beide Optionen sind kostenlos. Es ändert sich nur, wer deine Daten verwaltet.",
    "a.back": "‹ Zurück",
    "a.badCreds": "E-Mail oder Passwort falsch.",
    "a.accPending": "Dein Konto wartet auf die Freigabe durch den Verein.",
    "a.accSusp": "Dein Zugang ist gesperrt. Wende dich an deinen Verein.",
    "a.exists": "Diese E-Mail ist bereits registriert. Melde dich an.",
    "a.registered": "Registrierung erhalten! Dein Zugang wartet auf die Freigabe durch den Verein.",
    "a.loading": "Wird geladen…",
    "a.entering": "Anmeldung läuft…",
    "a.demoPick": "Welche Rolle möchtest du sehen?",
    "a.demoPickD": "Wähle eine Rolle, um die App so zu sehen, wie diese Person sie sehen würde.",
    "as.title": "Anwesenheit heute",
    "as.subtitle": "Wer da war und warum. Keine Vorfälle oder Sanktionen — das bleibt in Disziplin.",
    "as.today": "Heute",
    "as.markAll": "✓ Alle als anwesend markieren",
    "as.present": "Anwesend",
    "as.unmarked": "Nicht markiert",
    "as.studies": "Schule",
    "as.noExcuse": "Ohne Entschuldigung",
    "as.sick": "Krankheit",
    "as.injured": "Verletzung",
    "as.reset": "Markierung entfernen",
    "as.noPlayers": "Es gibt keine Spieler im Kader.",
    "as.discNote": "Verspätung oder Fehlen mit disziplinarischer Folge? Das wird unter Disziplin → Anwesenheit erfassen eingetragen und benachrichtigt zusätzlich das Trainerteam.",
    "as.homeTitle": "Anwesenheit heute",
    "as.homeEmpty": "Du hast heute noch keine Anwesenheit erfasst.",
    "as.homeCta": "Anwesenheit erfassen",
    "as.homeSee": "Anwesenheit ansehen",
    "as.homeAll": "Alle anwesend.",
    "as.homeOf": "von",
    "ex.title": "Übungsbibliothek",
    "ex.hint": "Filtere nach Kategorie, sieh dir Dauer und Material an und nutze sie auf der Taktiktafel oder füge sie einem Training hinzu.",
    "ex.all": "Alle",
    "ex.cat.rondo": "Rondos und Ballbesitz",
    "ex.cat.finish": "Abschluss",
    "ex.cat.press": "Pressing und Umschalten",
    "ex.cat.buildup": "Spielaufbau",
    "ex.cat.setpiece": "Standardsituationen",
    "ex.cat.technique": "Individualtechnik",
    "ex.cat.fitness": "Fitness",
    "ex.cat.gk": "Torhüter",
    "ex.cat.warmup": "Aufwärmen",
    "ex.cat.defense": "Verteidigung",
    "ex.cat.cross": "Flanken und Abschluss",
    "ex.cat.duel": "1-gegen-1-Duelle",
    "ex.dur": "Min",
    "ex.materials": "Material",
    "ex.useBoard": "Auf der Taktiktafel nutzen",
    "ex.addTrain": "Zum Training hinzufügen",
    "ex.added": "✓ Hinzugefügt",
    "tr.title": "Trainingsmodus",
    "tr.hint": "Plane die Einheit, indem du Blöcke aus der Übungsbibliothek oder freie Blöcke hinzufügst.",
    "tr.date": "Datum",
    "tr.time": "Uhrzeit",
    "tr.objective": "Ziel der Einheit",
    "tr.objectivePh": "Z. B. defensive Umschaltmomente",
    "tr.addFromLib": "+ Aus der Bibliothek hinzufügen",
    "tr.addCustom": "+ Freier Block",
    "tr.customName": "Name des Blocks",
    "tr.customDur": "Dauer (Min)",
    "tr.noBlocks": "Du hast dieser Einheit noch keinen Block hinzugefügt.",
    "tr.total": "Gesamtdauer",
    "tr.materials": "Benötigtes Material",
    "tr.remove": "Entfernen",
    "tr.up": "▲",
    "tr.down": "▼",
    "tr.sendBoard": "Auf der Taktiktafel ansehen",
    "tr.summary": "Zusammenfassung zum Teilen",
    "tr.copy": "Zusammenfassung kopieren",
    "tr.copied": "✓ Kopiert",
    "tr.whatsapp": "WhatsApp öffnen",
    "tr.min": "Min",
    "tr.close": "Schließen",
    "tr.newBlock": "Neuer Block",
    "st.title": "Vereinsstatistik",
    "st.availability": "Verfügbarkeit des Kaders",
    "st.available": "Verfügbar",
    "st.doubt": "Fraglich",
    "st.injured": "Verletzt",
    "st.topAtt": "Höchste Trainingsbeteiligung",
    "st.lowMin": "Wenigste Einsatzzeit (Minuten)",
    "st.byPosition": "Kader nach Linie",
    "st.gkPos": "Torhüter",
    "st.defPos": "Verteidiger",
    "st.midPos": "Mittelfeldspieler",
    "st.fwdPos": "Stürmer",
    "st.players": "Spieler",
    "st.byRole": "Aufteilung nach Position",
    "st.roleHint": "Tatsächliche Verteilung des Kaders, Position für Position, mit dem Anteil jeder Position am Gesamtkader.",
    "st.total": "Kader gesamt",
    "st.player": "Spieler",
  },
  pt: {
    "nav.inicio": "Início", "nav.jugadores": "Jogadores", "nav.alineacion": "Escalação", "nav.pizarra": "Quadro", "nav.convocatoria": "Convocatória", "nav.partido": "Modo jogo", "nav.usuarios": "Utilizadores", "nav.coachai": "Coach AI", "nav.material": "Loja", "nav.entrenamiento": "Treino", "nav.ejercicios": "Exercícios", "nav.estadisticas": "Estatísticas", "nav.calendario": "Calendário", "nav.equipos": "Clubes", "nav.premium": "Premium", "nav.disciplina": "Disciplina", "nav.normativa": "Regulamento", "nav.familias": "Famílias", "nav.equipo": "Clube", "mt.toBoard": "Quadro", "p.myTeam": "O meu clube e o meu escalão", "p.pickTeam": "Mudar para outro escalão…", "p.changeTeam": "Mudar de escalão", "p.newTeam": "Nome do escalão novo", "p.newTeamPh": "Ex. Sub-16 B", "p.newTeamNote": "O teu não está na lista? Cria-o dentro do teu clube:", "p.createTeam": "Criar", "p.deleteAcc": "Eliminar a minha conta", "p.deleteWarn": "A tua ficha será apagada e perdes o acesso. Não se pode desfazer. Os dados da equipa não se apagam.", "p.deleteGo": "Eliminar", "c.proTab": "Secção PRO. Toca para ver.", "a.resetAgain": "Pedir um link novo", "a.resetExp": "Este link expirou (dura uma hora). Pede outro.", "a.resetUsed": "Este link já foi usado. Se não foste tu, pede outro e muda-a quanto antes.", "a.resetServer": "O servidor não conseguiu guardar a palavra-passe. Tenta daqui a um minuto.", "h.round": "Jornada", "h.howTo": "Como chegar", "h.today": "Hoje", "h.day": "Dia", "h.days": "Dias", "h.noDate": "Sem data", "h.noGoal": "Sessão sem objetivo", "h.noTrain": "Não há treino planeado.", "h.planTrain": "Planear", "h.noAlerts": "Nada a rever. Plantel completo.", "h.aDoubt1": "dúvida", "h.aDoubtN": "dúvidas", "h.aInj1": "lesionado", "h.aInjN": "lesionados", "h.aDisc": "incidência(s) por validar", "h.aSign": "sem assinar o código disciplinar", "h.fMatch": "O jogo é às {h}.", "h.fCalled": "Convocatória publicada · {n} convocados.", "h.fNoCall": "Ainda não há convocatória.", "h.fKit": "Leva garrafa de água e caneleiras.", "h.fNote": "Como família só vês o que o treinador partilha.", "nav.temporada": "Temporada", "se.title": "Pilares da temporada", "se.hint": "Distribui o ano pelos quatro pilares e anota o objetivo de cada mês.", "se.months": "meses", "se.calendar": "Mês a mês", "se.goal": "Objetivo de", "se.goalPh": "Objetivo do mês. Ex. construção desde o guarda-redes", "se.saved": "Planificação guardada e partilhada com a equipa.", "se.share": "Partilhar com a equipa", "se.shareNote": "Fica neste dispositivo enquanto a editas. Ao partilhar, vê-a todo o teu staff.", "mt.abp": "Bolas paradas guardadas", "mt.abpTap": "Toca numa jogada para a abrir no quadro grande.", "mt.abpEmpty": "Ainda não guardaste nenhuma bola parada. Cria-as no quadro, no menu ABP.", "nav.analisis": "Análise", "pm.title": "Análise pós-jogo", "pm.events": "eventos na ficha", "pm.empty": "Ainda não há ficha deste jogo. Regista o jogo no Modo jogo e volta aqui.", "pm.go": "Gerar análise", "pm.again": "Gerar de novo", "pm.thinking": "A analisar o jogo…", "pm.note": "Escrita pelo Coach AI a partir da ficha. Revê antes de partilhar.", "mt.subs": "Janelas de substituição", "mt.subsTotal": "janelas no total", "mt.subsOne": "Janela", "mt.subsUndo": "Retirar uma janela", "mt.subsOf": "de", "mt.subsLeft": "Restam {n} janelas.", "mt.subsNone": "Sem janelas disponíveis.", "tr.target": "Duração da sessão", "tr.left": "Faltam {n} min por preencher.", "tr.over": "Passas {n} min do objetivo.", "tr.done": "Sessão completa.", "tr.saveSession": "Guardar sessão completa",
    "navg.equipo": "Equipa", "navg.partido": "Dia de jogo", "navg.entrenamiento": "Treino", "navg.delegado": "Delegado", "navg.estadisticas": "Estatísticas", "navg.roles": "Funções", "navg.coachai": "Coach AI",
    "role.entrenador": "Treinador principal", "role.segundo": "Treinador adjunto", "role.delegado": "Delegado", "role.padre": "Pai / Mãe / Tutor", "role.director": "Diretor desportivo", "role.master": "Master · EBLDigital", 
    "c.exit": "Sair", "c.planFree": "PLANO GRÁTIS", "c.upgrade": "Melhorar", "c.by": "Desenvolvido pela EBLDigital", "c.madeBy": "App criada pela EBLDigital ·", "navg.master": "Master", "nav.master": "Painel Master", "c.pro": "Função PRO. Muda para uma conta oficial do clube para a desbloquear.", "c.cancel": "Cancelar", "c.nav": "Navegação", "c.trialBadge": "TESTE PRO", "c.planCurrentFree": "Plano atual · Grátis", "c.goPro": "Ir para PRO",
    "a.tagline": "Gestão inteligente para treinadores de futebol de formação", "a.accOff": "Conta oficial do clube", "a.accOffD": "O diretor desportivo ou o Master já te deu de alta. Define a tua palavra-passe e entra já.", "a.accFree": "Treino por minha conta", "a.accFreeD": "Grátis, com funções limitadas.", "a.have": "Já tenho conta", "a.register": "Registar", "a.name": "O teu nome", "a.fullname": "Nome completo", "a.email": "Email", "a.pass": "Palavra-passe", "a.region": "Região", "a.clubMadrid": "Clube (região de Madrid)", "a.choose": "Escolhe o teu clube…", "a.otherClub": "Nome do teu clube", "a.teamOff": "Equipa", "a.teamFree": "A tua equipa", "a.role": "A tua função", "a.pending": "Ao registares-te como utilizador oficial, o teu acesso fica pendente até o diretor desportivo ou o Master o aprovarem. Nem todos os utilizadores podem ser treinadores.", "a.freeInc": "O plano grátis inclui até 14 jogadores, escalação, convocatória, modo jogo e Coach AI. Não inclui vídeo de apresentação, gestão de utilizadores nem funções de clube.", "a.startFree": "Começar grátis", "a.signin": "Entrar", "a.create": "Criar conta e entrar", "a.proto": "Protótipo — os dados não são guardados em nenhum servidor", "a.demoHint": "Demo: utilizador demo / palavra-passe demo", "a.demoBtn": "▶ Entrar com a conta demo",
    "a.forgot": "Esqueceste-te da palavra-passe?", "a.forgotTitle": "Recuperar palavra-passe", "a.forgotD": "Escreve o teu email e enviamos-te um link para escolheres uma nova.", "a.forgotSend": "Enviar link", "a.sending": "A enviar…", "a.forgotSent": "Se esse email tiver conta, o link já seguiu. Expira dentro de uma hora e só serve uma vez. Vê também o spam.", "a.forgotNoMail": "O envio de email não está disponível agora. Avisa o teu clube.", "a.resetTitle": "Escolhe a tua nova palavra-passe", "a.resetD": "Este link expira dentro de uma hora e só serve uma vez.", "a.newPass": "Nova palavra-passe", "a.newPass2": "Repete a palavra-passe", "a.resetSave": "Guardar palavra-passe", "a.resetOk": "Palavra-passe atualizada. Já podes entrar com ela.", "a.resetBad": "Este link já não é válido: expirou ou já foi usado. Pede outro.", "a.passRule": "Mínimo 6 caracteres, e as duas têm de coincidir.", "a.noBackend": "Sem ligação ao servidor. Tenta mais tarde.",
    "p.account": "A minha conta", "p.changePass": "Alterar palavra-passe", "p.current": "Palavra-passe atual", "p.save": "Guardar", "p.saved": "Palavra-passe atualizada.", "p.badCurrent": "A palavra-passe atual não está correta.", "p.close": "Fechar",
    "h.nextMatch": "Próximo jogo", "h.nextTrain": "Próximo treino", "h.available": "Disponíveis", "h.lessMin": "Menos participação", "h.alerts": "Alertas", "h.quick": "Acessos rápidos", "h.family": "Avisos para as famílias", "h.pending": "acessos pendentes de aprovação", "h.startMatch": "Iniciar jogo",
    "w.title": "Quadro tático", "w.move": "Mover", "w.arrow": "Seta", "w.pass": "Passe", "w.free": "Desenho", "w.cone": "Cone", "w.ball": "Bola", "w.erase": "Apagar", "w.clear": "Limpar", "w.home": "Casa", "w.away": "Adversário", "w.hint": "Escolhe uma ferramenta · arrasta as peças · desenha no campo", "w.form": "Colocar", "w.f11": "Futebol 11", "w.f7": "Futebol 7", "w.homeSys": "Sistema da casa", "w.awaySys": "Sistema do adversário", "w.exercises": "Exercícios recomendados", "w.exHint": "Toca num exercício para o colocar no quadro", "w.autoSave": "O sistema escolhido é guardado automaticamente neste dispositivo",
    "m.title": "Loja do treinador", "m.aff": "Link de afiliado", "m.note": "Links de afiliado claramente identificados e adaptados ao teu país. Uma pequena comissão ajuda a manter a app; o teu preço não muda.", "m.all": "Tudo", "m.training": "Treino", "m.gk": "Guarda-redes", "m.medical": "Primeiros socorros", "m.tech": "Tecnologia", "m.apparel": "Vestuário", "m.view": "Ver oferta", "m.from": "desde",

    /* v49 — cadenas que antes estaban en español a fuego */
    "sq.cloud": "Guardado na nuvem",
    "sq.cloudOn": "● Guardado na nuvem",
    "sq.cloudOff": "○ Apenas neste dispositivo",
    "sq.saveSquad": "↑ Guardar plantel",
    "sq.saveCal": "↑ Guardar calendário",
    "sq.cloudNote": "Sem guardar na nuvem, os dados vivem só neste navegador: perdem-se ao limpar a cache e não se veem noutro dispositivo.",
    "sq.clubData": "Dados do clube",
    "sq.crest": "Emblema",
    "sq.fieldName": "Nome do campo",
    "sq.address": "Morada",
    "sq.maps": "Link do Google Maps",
    "sq.importCsv": "+ Importar CSV",
    "sq.importTitle": "Importar plantel a partir de CSV",
    "sq.oneLine": "Uma linha por jogador:",
    "sq.csvCols": "nome, apelido, número, posição",
    "sq.csvOpt": "(número e posição opcionais).",
    "sq.replace": "Substituir plantel atual",
    "sq.import": "Importar",
    "sq.close": "Fechar",
    "sq.player": "Jogador",
    "sq.state": "Estado",
    "sq.min": "Min.",
    "sq.att": "Pres.",
    "ln.apply": "Aplicar",
    "ln.other": "Outro: 4-1-4-1",
    "ln.tapPos": "Toca numa posição do campo e atribui um jogador",
    "cl.waMsg": "Mensagem para WhatsApp",
    "cl.waOpen": "Abrir WhatsApp",
    "cl.waLegend": "🧤 guarda-redes · número em emoji · guarda-redes primeiro",
    "mt.half2": "2.ª parte",
    "mt.halfLen": "Duração de cada parte",
    "mt.added": "Tempo adicionado pelo árbitro",
    "mt.events": "Eventos do jogo",
    "mt.noEvents": "Ainda não há eventos.",
    "mt.who": "Quem?",
    "ca.title": "Calendário da equipa",
    "ca.empty": "Ainda não há jogos. Importa o calendário da tua equipa abaixo.",
    "ca.import": "Importar calendário",
    "ca.importBtn": "Importar",
    "ca.example": "Ver exemplo",
    "ca.clear": "Esvaziar",
    "ca.remove": "Remover",
    "ca.useMatch": "Usar no modo jogo", "ca.month": "Calendário do mês", "ca.dayHint": "Toca num dia para ver o detalhe.", "ca.dayEmpty": "Não há jogos nem treino marcado para este dia.", "ca.dayTraining": "Dia de treino", "ca.legendMatch": "Jogo (do calendário importado)", "ca.legendTrain": "Treino", "ca.trainDaysLabel": "Dias de treino:",
    "ca.teamCrest": "Emblema da equipa",

    /* v50 — plantillas de entrenamiento */
    "pl.title": "Modelos de treino",
    "pl.hint": "Guarda a sessão que montaste abaixo como guião reutilizável. Os partilhados podem ser usados por todas as equipas do clube. Ordenados pelos mais usados.",
    "pl.namePh": "Nome: p. ex. Rondos + finalização",
    "pl.shareClub": "Partilhar com o clube",
    "pl.save": "Guardar modelo",
    "pl.saving": "A guardar…",
    "pl.needBlocks": "Adiciona exercícios abaixo para poderes guardar.",
    "pl.empty": "Ainda não há modelos guardados.",
    "pl.use": "Usar",
    "pl.uses": "usos",
    "pl.shared": "Partilhado",
    "pl.fromClub": "de outra equipa do clube",
    "pl.delete": "Eliminar modelo",
    "nav.roleOne": "perfil",
    "nav.roleMany": "perfis",
    "nav.asistencia": "Presenças",
    "a.choice": "Pertences a um clube?",
    "a.choiceD": "As duas opções são gratuitas. Só muda quem gere os teus dados.",
    "a.back": "‹ Voltar",
    "a.badCreds": "Email ou palavra-passe incorretos.",
    "a.accPending": "A tua conta está pendente de aprovação pelo clube.",
    "a.accSusp": "O teu acesso está suspenso. Contacta o teu clube.",
    "a.exists": "Esse email já está registado. Inicia sessão.",
    "a.registered": "Registo recebido! O teu acesso fica pendente de aprovação pelo clube.",
    "a.loading": "A carregar…",
    "a.entering": "A entrar…",
    "a.demoPick": "Que perfil queres ver?",
    "a.demoPickD": "Escolhe um perfil para explorar a aplicação tal como essa pessoa a veria.",
    "as.title": "Presenças do dia",
    "as.subtitle": "Quem veio e porquê. Sem incidentes nem sanções: isso continua em Disciplina.",
    "as.today": "Hoje",
    "as.markAll": "✓ Marcar todos presentes",
    "as.present": "Presente",
    "as.unmarked": "Por marcar",
    "as.studies": "Estudos",
    "as.noExcuse": "Sem justificação",
    "as.sick": "Doença",
    "as.injured": "Lesão",
    "as.reset": "Remover marca",
    "as.noPlayers": "Não há jogadores no plantel.",
    "as.discNote": "Atraso ou falta com consequência disciplinar? Isso regista-se em Disciplina → Fazer chamada, que também avisa a equipa técnica.",
    "as.homeTitle": "Presenças de hoje",
    "as.homeEmpty": "Ainda não fizeste a chamada hoje.",
    "as.homeCta": "Fazer chamada",
    "as.homeSee": "Ver presenças",
    "as.homeAll": "Todos presentes.",
    "as.homeOf": "de",
    "ex.title": "Biblioteca de exercícios",
    "ex.hint": "Filtra por categoria, vê a duração e o material, e usa-o no quadro ou adiciona-o a um treino.",
    "ex.all": "Todos",
    "ex.cat.rondo": "Rondos e posse de bola",
    "ex.cat.finish": "Finalização",
    "ex.cat.press": "Pressão e transição",
    "ex.cat.buildup": "Saída de bola",
    "ex.cat.setpiece": "Bolas paradas",
    "ex.cat.technique": "Técnica individual",
    "ex.cat.fitness": "Físico",
    "ex.cat.gk": "Guarda-redes",
    "ex.cat.warmup": "Aquecimento",
    "ex.cat.defense": "Defesa",
    "ex.cat.cross": "Cruzamentos e remate",
    "ex.cat.duel": "Duelos 1x1",
    "ex.dur": "min",
    "ex.materials": "Material",
    "ex.useBoard": "Usar no quadro",
    "ex.addTrain": "Adicionar ao treino",
    "ex.added": "✓ Adicionado",
    "tr.title": "Modo treino",
    "tr.hint": "Planeia a sessão adicionando blocos da biblioteca de exercícios ou blocos livres.",
    "tr.date": "Data",
    "tr.time": "Hora",
    "tr.objective": "Objetivo da sessão",
    "tr.objectivePh": "Ex. transições defensivas",
    "tr.addFromLib": "+ Adicionar da biblioteca",
    "tr.addCustom": "+ Bloco livre",
    "tr.customName": "Nome do bloco",
    "tr.customDur": "Duração (min)",
    "tr.noBlocks": "Ainda não adicionaste nenhum bloco a esta sessão.",
    "tr.total": "Duração total",
    "tr.materials": "Material necessário",
    "tr.remove": "Remover",
    "tr.up": "▲",
    "tr.down": "▼",
    "tr.sendBoard": "Ver no quadro",
    "tr.summary": "Resumo para partilhar",
    "tr.copy": "Copiar resumo",
    "tr.copied": "✓ Copiado",
    "tr.whatsapp": "Abrir WhatsApp",
    "tr.min": "min",
    "tr.close": "Fechar",
    "tr.newBlock": "Novo bloco",
    "st.title": "Estatísticas da equipa",
    "st.availability": "Disponibilidade do plantel",
    "st.available": "Disponíveis",
    "st.doubt": "Dúvida",
    "st.injured": "Lesionados",
    "st.topAtt": "Maior assiduidade nos treinos",
    "st.lowMin": "Menor participação (minutos)",
    "st.byPosition": "Plantel por linha",
    "st.gkPos": "Guarda-redes",
    "st.defPos": "Defesas",
    "st.midPos": "Médios",
    "st.fwdPos": "Avançados",
    "st.players": "jogadores",
    "st.byRole": "Divisão por posição",
    "st.roleHint": "Distribuição real do plantel, posição a posição, com o peso de cada uma no total.",
    "st.total": "Total do plantel",
    "st.player": "jogador",
    "u.canGrant": "Como diretor desportivo ou Master dás de alta à equipa técnica e decides o perfil de cada um.",
    "u.readonly": "Vista apenas de leitura: só o diretor desportivo ou o Master podem dar altas.",
    "u.approve": "Aprovar",
    "u.suspend": "Suspender",
    "u.note": "Só o diretor desportivo ou o Master podem atribuir o perfil de treinador.",
    "u.activo": "ativo",
    "u.pendiente": "pendente",
  },
};
const T = (lang, k) => (DICT[lang] && DICT[lang][k]) || DICT.en[k] || DICT.es[k] || k;
const rLabel = (lang, key) => T(lang, "role." + key);

/* Selector de club: buscador + tira alfabetica + campo libre siempre disponible.
   Sustituye al <datalist> nativo, que no se puede estilizar (sale como popup blanco del SO). */
function ClubPicker({ value, onChange, options, placeholder, C, AC }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [letter, setLetter] = useState(null);
  const box = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const fuera = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fuera); document.removeEventListener("keydown", esc); };
  }, [open]);
  const norm = (str) => String(str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const letras = [...new Set(options.map((c) => norm(c)[0]?.toUpperCase()).filter(Boolean))].sort();
  /* Sin orden alfabetico: se respeta el orden del array de opciones (los 3 primeros
     y el ultimo son un orden fijo pedido explicitamente). */
  const filtrados = options
    .filter((c) => !q || norm(c).includes(norm(q)))
    .filter((c) => !letter || norm(c)[0]?.toUpperCase() === letter);
  const elegir = (c) => { onChange(c); setOpen(false); setQ(""); setLetter(null); };
  return (
    <div className="relative" ref={box}>
      <input ref={inputRef} value={value} onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)} placeholder={placeholder}
        className="w-full text-sm px-3 py-2.5 rounded-lg border bg-transparent"
        style={{ borderColor: C.line, color: C.chalk }} />
      <button type="button" onClick={() => { setOpen((v) => !v); inputRef.current?.focus(); }}
        aria-label="Ver sugerencias" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-1"
        style={{ color: C.dim }}>▼</button>
      {open && options.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 z-30 rounded-lg border overflow-hidden"
          style={{ background: C.panel, borderColor: C.line, boxShadow: `0 10px 28px ${C.sombra}` }}>
          <div className="p-2 border-b" style={{ borderColor: C.line }}>
            <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setLetter(null); }}
              placeholder="Buscar club…" className="w-full text-sm px-2.5 py-1.5 rounded border bg-transparent"
              style={{ borderColor: C.line, color: C.chalk }} />
          </div>
          <div className="flex" style={{ maxHeight: 220 }}>
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 220 }}>
              {filtrados.length === 0 && (
                <div className="px-3 py-3 text-[12px]" style={{ color: C.dim }}>
                  Sin resultados. Usa el nombre que has escrito: se guardará tal cual.
                </div>
              )}
              {filtrados.map((c) => (
                <button key={c} type="button" onClick={() => elegir(c)}
                  className="w-full text-left text-sm px-3 py-2 hover:opacity-80"
                  style={{ color: value === c ? AC : C.chalk, background: value === c ? "rgba(54,69,79,.10)" : "transparent" }}>
                  {c}
                </button>
              ))}
            </div>
            {letras.length > 4 && (
              <div className="flex flex-col overflow-y-auto shrink-0 border-l" style={{ borderColor: C.line, maxHeight: 220 }}>
                {letras.map((l) => (
                  <button key={l} type="button" onClick={() => setLetter((v) => (v === l ? null : l))}
                    className="text-[10px] w-6 py-1 font-display font-semibold"
                    style={{ color: letter === l ? C.sobre : C.dim, background: letter === l ? AC : "transparent" }}>
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="px-3 py-1.5 text-[10px] border-t" style={{ borderColor: C.line, color: C.dim }}>
            Sugerencias, no un listado cerrado. Si tu club no aparece, escríbelo arriba.
          </div>
        </div>
      )}
    </div>
  );
}

function LangPicker({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const actual = LANGS.find((l) => l.code === lang) || LANGS[0];
  useEffect(() => {
    if (!open) return;
    const fuera = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fuera); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div className="relative" ref={box}>
      <button onClick={() => setOpen((v) => !v)} aria-haspopup="listbox" aria-expanded={open}
        className="text-[12px] px-2.5 py-1.5 rounded-lg font-display font-semibold flex items-center gap-1.5 leading-none"
        style={{ background: "transparent", color: "#708090", border: "1px solid rgba(54,69,79,0.16)" }}>
        <span style={{ color: "#36454F" }}>{actual.code.toUpperCase()}</span>
        <span className="hidden sm:inline font-body font-normal">{actual.name}</span>
        <span className="text-[9px] leading-none" style={{ opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div role="listbox" className="absolute right-0 mt-1 z-30 rounded-lg border overflow-hidden min-w-[150px]"
          style={{ background: "#FFFFFF", borderColor: "rgba(54,69,79,0.16)", boxShadow: "0 8px 24px rgba(54,69,79,.14)" }}>
          {LANGS.map((l) => (
            <button key={l.code} role="option" aria-selected={lang === l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className="w-full text-left text-[13px] px-3 py-2 flex items-center gap-2 hover:opacity-80"
              style={{ background: lang === l.code ? "rgba(54,69,79,.07)" : "transparent", color: lang === l.code ? "#36454F" : "#708090" }}>
              <span className="font-display font-semibold text-[11px] w-6 shrink-0" style={{ opacity: 0.75 }}>{l.code.toUpperCase()}</span>
              <span className="flex-1">{l.name}</span>
              {lang === l.code && <span className="text-[11px]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const FONTS = `
/* ================= TIPOGRAFÍA · MODERN MINIMALIST =================
   Una sola familia, DejaVu Sans, en dos pesos. Antes eran dos fuentes traídas
   de Google (Barlow Condensed + Inter): dos peticiones a un tercero antes de
   pintar nada y ese aire de plantilla que dan las condensadas deportivas. La
   pila de respaldo cubre Windows, Mac, Linux y Android sin descargar nada. */
.font-display { font-family: "DejaVu Sans", Verdana, "Segoe UI", system-ui, sans-serif; font-weight: 700; letter-spacing: 0.01em; }
.font-body { font-family: "DejaVu Sans", Verdana, "Segoe UI", system-ui, sans-serif; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb { background: var(--linea); border-radius: 3px; }
.safe-bottom { padding-bottom: max(0.75rem, env(safe-area-inset-bottom)); }
/* Navegación: el hover apenas tiñe la fila de gris. Dónde estás se marca con el
   filete de la izquierda y el peso del texto, no con un fondo de color. */
.nav-item { transition: background-color .15s ease, color .15s ease; }
.nav-item:hover { background-color: color-mix(in srgb, var(--texto) 6%, transparent) !important; }
.nav-item[aria-current="page"]:hover { background-color: color-mix(in srgb, var(--texto) 10%, transparent) !important; }
:focus-visible { outline: 2px solid var(--texto); outline-offset: 2px; border-radius: 6px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
}
`;

/* ================= TEMA: MODERN MINIMALIST · CLARO Y OSCURO =================
   Una sola paleta en dos versiones. Carbón #36454F y gris pizarra #708090
   mandan en claro; en oscuro se invierten los papeles y el gris claro pasa a
   ser el color de mando. El color queda reservado para lo que SIGNIFICA algo
   —disponible / duda / lesión, ganado / perdido— y para las fichas del campo.

   `C` es un objeto que se MUTA al cambiar de tema (Object.assign) en vez de
   pasarse por contexto: toda la app lee `C.panel`, `C.chalk`… dentro de
   `style={{}}`, así que con volver a pintar el árbol basta y no hay que tocar
   trescientos sitios. El cambio de tema hace justo eso: muta y re-renderiza. */
const PALETAS = {
  /* Blanco fijo: fondo blanco, texto negro. Sin medias tintas azuladas: los
     grises intermedios son neutros, solo para separadores y texto secundario. */
  claro: {
    bg: "#FFFFFF", panel: "#FFFFFF", panel2: "#F4F4F4",
    line: "rgba(0,0,0,0.14)", chalk: "#000000", dim: "#5E5E5E",
    green: "#2F6B4F", red: "#A33A3E", warn: "#8A6A1F",
    mando: "#000000", sobre: "#FFFFFF",
    velo: "rgba(0,0,0,", sombra: "rgba(0,0,0,.18)",
  },
  /* Negro fijo: el mismo esquema del revés. Negro de verdad, no un gris
     oscuro: en el móvil, de noche y en pantallas OLED es lo que se lee. */
  oscuro: {
    bg: "#000000", panel: "#0B0B0B", panel2: "#161616",
    line: "rgba(255,255,255,0.16)", chalk: "#FFFFFF", dim: "#A3A3A3",
    green: "#77B394", red: "#E38B8E", warn: "#D3AC63",
    mando: "#FFFFFF", sobre: "#000000",
    velo: "rgba(255,255,255,", sombra: "rgba(0,0,0,.6)",
  },
};
const C = { ...PALETAS.claro };
const CARBON = "#36454F", PIZARRA_GRIS = "#708090", GRIS_CLARO = "#D3D3D3";
/* Aplica una de las dos versiones: muta C, deja el modo en el <html> para el
   CSS suelto (barras, hover del menú, foco) y pinta el fondo del documento. */
const aplicarTema = (modo) => {
  Object.assign(C, PALETAS[modo] || PALETAS.claro);
  if (typeof document !== "undefined") {
    document.documentElement.dataset.tema = modo;
    document.documentElement.style.setProperty("--bg", C.bg);
    document.documentElement.style.setProperty("--texto", C.chalk);
    document.documentElement.style.setProperty("--linea", C.line);
    document.body.style.background = C.bg;
  }
};
const TEMA_KEY = "cb_tema";
const temaGuardado = () => {
  try {
    const t = localStorage.getItem(TEMA_KEY);
    if (t === "claro" || t === "oscuro") return t;
  } catch { /* sin almacenamiento */ }
  return "claro";
};
/* Se aplica al cargar el módulo, antes del primer render: si se dejara para un
   efecto, la primera pintada saldría con la paleta clara y luego cambiaría. */
aplicarTema(temaGuardado());

/* ---------------- Roles ---------------- */
const ROLES = {
  /* Orden jerárquico: el director dirige el club, el entrenador su equipo, el
     segundo le asiste y el delegado lleva la logística. Se eliminó el rol
     "presidente" en la v45: sus permisos eran un subconjunto de los del
     director deportivo, así que no aportaba nada y duplicaba la gestión. */
  director: { label: "Director deportivo", color: "#36454F", icon: "✚",
    desc: "Dirige el club: acceso total a todo el sistema.",
    /* "equipo" (Club) faltaba y era el único rol del cuerpo técnico sin él:
       entrenador, segundo, delegado y master lo tenían. Justo al director
       deportivo —que es quien lleva los datos del club, el campo y las
       categorías, y cuya descripción aquí al lado dice "acceso total a todo el
       sistema"— le salía el apartado en gris y con el aviso de que su rol no
       tiene acceso. */
    tabs: ["inicio", "equipo", "jugadores", "alineacion", "pizarra", "ejercicios", "entrenamiento", "temporada", "estadisticas", "convocatoria", "calendario", "partido", "analisis", "asistencia", "disciplina", "normativa", "usuarios", "coachai", "material", "premium"],
    perms: ["editSquad", "editLineup", "editCall", "events", "ai", "viewUsers", "grantAccess", "createUsers", "editTraining", "viewStats", "discipline", "editDiscipline", "validateDiscipline", "viewDocs", "manageDocs", "editCal"] },
  entrenador: { label: "Entrenador principal", color: "#36454F", icon: "◆",
    desc: "Control total de su equipo: edición de todo excepto gestión de usuarios.",
    tabs: ["inicio", "equipo", "jugadores", "alineacion", "pizarra", "ejercicios", "entrenamiento", "temporada", "estadisticas", "convocatoria", "calendario", "partido", "analisis", "asistencia", "disciplina", "normativa", "usuarios", "coachai", "material", "premium"],
    perms: ["editSquad", "editLineup", "editCall", "events", "ai", "createUsers", "editTraining", "viewStats", "discipline", "editDiscipline", "viewDocs", "editCal"] },
  segundo: { label: "Segundo entrenador", color: "#36454F", icon: "◈",
    desc: "Asiste al entrenador: alineaciones, entrenamiento y partido.",
    tabs: ["inicio", "equipo", "jugadores", "alineacion", "pizarra", "ejercicios", "entrenamiento", "temporada", "estadisticas", "convocatoria", "calendario", "partido", "analisis", "asistencia", "disciplina", "normativa", "coachai", "material", "premium"],
    perms: ["editSquad", "editLineup", "events", "ai", "editTraining", "viewStats", "discipline", "editDiscipline", "viewDocs", "editCal"] },
  delegado: { label: "Delegado", color: "#36454F", icon: "▣",
    desc: "Logística del equipo: acta del partido, disciplina y normativa.",
    tabs: ["inicio", "equipo", "jugadores", "convocatoria", "calendario", "partido", "asistencia", "disciplina", "normativa", "coachai", "material", "premium"],
    perms: ["editSquad", "events", "ai", "discipline", "editDiscipline", "viewDocs", "manageDocs", "editCal"] },
  master: { label: "Master · EBLDigital", color: "#36454F", icon: "★",
    desc: "Administración total: crea los equipos oficiales y da de alta a cualquiera.",
    tabs: ["inicio", "master", "equipos", "equipo", "jugadores", "alineacion", "pizarra", "ejercicios", "entrenamiento", "temporada", "estadisticas", "convocatoria", "calendario", "partido", "analisis", "asistencia", "disciplina", "normativa", "usuarios", "coachai", "material"],
    perms: ["editSquad", "editLineup", "editCall", "events", "ai", "viewUsers", "grantAccess", "createUsers", "editTraining", "viewStats", "discipline", "editDiscipline", "validateDiscipline", "viewDocs", "manageDocs", "editCal", "master"] },
};

/* Qué roles puede repartir cada rol. No es lo mismo poder dar de alta que
   poder nombrar a cualquiera: el entrenador monta su cuerpo técnico, pero no
   se asciende a director ni nombra directores.
   "master" no aparece en NINGUNA lista a propósito: es la cuenta única de
   EBLDigital y no se reparte desde la app. */
const ROLES_ASIGNABLES = {
  master: ["director", "entrenador", "segundo", "delegado"],
  director: ["entrenador", "segundo", "delegado"],
  entrenador: ["segundo", "delegado"],
};
const asignables = (rol) => ROLES_ASIGNABLES[rol] || [];

/* Roles que se pueden elegir de verdad hoy.
   "master" no está: es la cuenta única de EBLDigital, no se elige ni se
   reparte, y el backend además comprueba el correo. */
const ROLES_ELEGIBLES = ["director", "entrenador", "segundo", "delegado"];
/* Solo para la demo: el Master también se puede probar, para ver de qué va
   ese panel. No es una vía para asignarlo de verdad —el backend lo sigue
   comprobando por correo, no por rol— y dentro de la demo se enseña el
   catálogo de clubes (ya es de lectura abierta en toda la app) pero se
   bloquea entrar en los datos reales de ningún equipo: eso queda para la
   cuenta real de EBLDigital. */
const ROLES_DEMO = [...ROLES_ELEGIBLES, "master"];

/* Sin acentos y en minúsculas, para comparar nombres de club sin que el
   formato exacto (con o sin punto, "C.D." vs "Club Deportivo", el año al
   final…) rompa la comparación. En Airtable el club real se llama "Club
   Deportivo Chamartín Vergara 1995"; en la demo/local es "C.D. Chamartín
   Vergara" — ninguno de los dos coincide con el otro letra a letra, así que
   la comparación es "contiene", no igualdad exacta. */
const normClub = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const esClubChamartinVergara = (club) => normClub(club).includes("chamartin vergara");

/* Qué apartados están disponibles según el ROL, no según el club: el filtro
   gratis/de pago ya lo hace el sistema PRO de verdad (TABS_GRATIS, isPro,
   PRO_FEATURES, la pantalla Premium) unas líneas más abajo, apto para
   cualquier club. Esta función bloqueaba TODO menos Inicio, Jugadores,
   Alineación y Pizarra para cualquier equipo que no fuera Chamartín Vergara,
   sin mirar si habían pagado o no -ni con el plan Oficial se desbloqueaba
   nada-, y encima con un cartel de "tu rol no tiene acceso" que no era
   cierto y no llevaba a ningún sitio para arreglarlo. Chamartín Vergara no
   pierde nada al quitarlo: ya tiene el PRO garantizado aparte, vía
   esClubChamartinVergara() dentro de isPro. */
const getAvailableTabs = (club, roleTabs) => roleTabs;

/* ================= QUÉ ES GRATIS Y QUÉ ES DE PAGO =================
   Apartados abiertos en el plan gratuito. Son los que permiten llevar un
   equipo el domingo: saber a quién tienes, convocarlo, ver el calendario y
   consultar la normativa. Todo lo que ahorra trabajo entre semana —preparar
   el partido, planificar, analizar, gestionar el club— es de pago.
   Para mover un apartado de un lado a otro, basta con sacarlo o meterlo en
   esta lista: no hay nada más que tocar.
   El Master, las familias y quien esté en modo de prueba lo tienen todo. */
const TABS_GRATIS = [
  "inicio", "equipo", "jugadores", "convocatoria", "calendario",
  "normativa", "material", "premium",
];
const esTabPro = (k) => !TABS_GRATIS.includes(k);


/* Plan gratis: rol entrenador pero con límites */
const LIMITS = {
  free: { players: 14, video: false, users: false, label: "PLAN GRATIS" },
  oficial: { players: 99, video: true, users: true, label: null },
};

/* ---------------- Modelo freemium ----------------
   El portal de las familias es SIEMPRE gratuito: nadie debería pagar por saber
   si su hijo está convocado. El plan PRO afecta al cuerpo técnico y a la directiva. */
const PRO_PRICE = "9,99 €";
/* Planes visibles en la pantalla Premium. La clave viaja al backend, que la traduce a price_id */
const PLANES = [
  { k: "mensual",   nombre: "Mensual",         precio: "9,99 €",  ciclo: "al mes",        nota: "Sin permanencia. Cancela cuando quieras." },
  { k: "temporada", nombre: "Temporada",       precio: "79 €",    ciclo: "al año",        nota: "7,90 €/mes. Pagas en septiembre y te olvidas.", destacado: true, ahorro: "Ahorras 41 €" },
];
const PLANES_CLUB = [
  { k: "club_s", nombre: "Club S", equipos: "Hasta 5 equipos",   precio: "249 €", porEquipo: "50 € por equipo" },
  { k: "club_m", nombre: "Club M", equipos: "Hasta 12 equipos",  precio: "449 €", porEquipo: "37 € por equipo", destacado: true },
  { k: "club_l", nombre: "Club L", equipos: "Equipos ilimitados", precio: "799 €", porEquipo: "Para clubes grandes" },
];
/* Topes del plan gratuito. Criterio: NUNCA limitar el montaje del equipo
   (limitarlo ahi expulsa el primer dia); apretar donde el valor ya se ha visto. */
const FREE_CAPS = { players: Infinity, exercises: 8, fixtures: 5, sessions: 1, aiMsgs: 10, plays: 0 };
/* Prueba PRO local: 14 dias desde el alta. Es solo el respaldo para el
   registro libre sin backend; la prueba de verdad la fija el Master en el
   campo "Prueba hasta" de Airtable y manda sobre esta. */
const TRIAL_DAYS = 14;
const trialKey = (email) => `cb_trial_${String(email || "anon").toLowerCase()}`;
const startTrial = (email) => {
  try {
    const k = trialKey(email);
    if (!localStorage.getItem(k)) localStorage.setItem(k, String(Date.now()));
  } catch { /* sin localStorage */ }
};
const trialLeft = (email) => {
  try {
    const raw = localStorage.getItem(trialKey(email));
    if (!raw) return 0;
    const days = TRIAL_DAYS - Math.floor((Date.now() - Number(raw)) / 86400000);
    return days > 0 ? days : 0;
  } catch { return 0; }
};
const PRO_FEATURES = [
  { k: "squad", icon: "👥", free: "Plantilla completa, sin límite de jugadores", pro: "Además: ficha ampliada y vídeo de presentación" },
  { k: "exercises", icon: "🎯", free: `${FREE_CAPS.exercises} ejercicios de la biblioteca`, pro: "Los 26 ejercicios, con filtros por categoría" },
  { k: "plays", icon: "🖊", free: "Pizarra completa: dibujar, sistemas, pantalla completa y brillo", pro: "Además: guardar jugadas, exportar PNG y paleta de colores" },
  { k: "training", icon: "🏋️", free: `${FREE_CAPS.sessions} sesión de entrenamiento guardada`, pro: "Sesiones ilimitadas y biblioteca propia" },
  { k: "discipline", icon: "⚖", free: "Pasar lista e incidencias individuales", pro: "Medidas colectivas, control económico y exportación CSV" },
  { k: "docs", icon: "📑", free: "Consultar la normativa", pro: "Matriz de firmas y control de sanciones" },
  { k: "calls", icon: "📋", free: "Convocatoria actual", pro: "Histórico completo de convocatorias" },
  { k: "calendar", icon: "📅", free: `${FREE_CAPS.fixtures} partidos en el calendario`, pro: "Calendario completo por CSV e ICS" },
  { k: "stats", icon: "📊", free: "Resumen básico", pro: "Estadísticas completas del equipo" },
  { k: "ai", icon: "✦", free: `${FREE_CAPS.aiMsgs} consultas al mes a Coach AI`, pro: "Coach AI sin límite" },
  { k: "video", icon: "🎬", free: "—", pro: "Vídeo de presentación de jugador" },
  { k: "users", icon: "🔑", free: "—", pro: "Gestión de usuarios y roles del club" },
];


/* ---------------- Código disciplinario del club (documento real) ---------------- */
/* Fuente: "Código Disciplinario — Régimen interno y normas de funcionamiento".
   Las consecuencias son las literales del documento: todas de carácter educativo. */
const NORMS = [
  { code: "L1", g: "leve", t: "Puntualidad", c: "Advertencia verbal. La reiteración podrá implicar tareas individuales o pérdida de minutos de juego." },
  { code: "L2", g: "leve", t: "Comunicación de ausencias", c: "Advertencia y valoración por parte del cuerpo técnico." },
  { code: "L3", g: "leve", t: "Atención durante las explicaciones", c: "Repetir la explicación al grupo o breve reflexión con el entrenador." },
  { code: "L4", g: "leve", t: "Uso correcto del material", c: "Recoger material al finalizar o colaborar en su preparación en la siguiente sesión." },
  { code: "L5", g: "leve", t: "Orden y limpieza", c: "Colaborar en las tareas de recogida y organización del material." },
  { code: "L6", g: "leve", t: "Uso de dispositivos electrónicos", c: "Advertencia." },
  { code: "L7", g: "leve", t: "Imagen deportiva", c: "El jugador no comenzará la actividad hasta solucionar la situación." },
  { code: "L8", g: "leve", t: "Tarjetas por protestar", c: "Valoración interna y conversación individual con el jugador." },
  { code: "G1", g: "grave", t: "Faltas de respeto", c: "Pérdida de minutos, no convocatoria o suspensión temporal de la actividad." },
  { code: "G2", g: "grave", t: "Conducta antideportiva", c: "No convocatoria y comunicación inmediata a la coordinación deportiva." },
  { code: "G3", g: "grave", t: "Abandono del entrenamiento", c: "Valoración deportiva y comunicación con la familia." },
  { code: "G4", g: "grave", t: "Daños intencionados", c: "Reparar o reponer lo dañado, además de la medida disciplinaria correspondiente." },
  { code: "G5", g: "grave", t: "Incumplimiento reiterado de las normas", c: "Pérdida de minutos o no convocatoria." },
  { code: "G6", g: "grave", t: "Actitud y compromiso", c: "Tratamiento individual con el jugador y su familia." },
];
const MEASURES = ["Advertencia verbal", "Conversación individual", "Comunicación con la familia", "Tareas de colaboración", "Pérdida de minutos", "No convocatoria", "Suspensión temporal", "Comunicación a coordinación"];
const CARDS = [
  { k: "none", label: "Sin tarjeta", short: "—", color: "#8FA096" },
  { k: "yellow", label: "Amonestación interna (amarilla)", short: "🟨", color: C.warn },
  { k: "red", label: "Amonestación interna (roja)", short: "🟥", color: "#E5484D" },
  { k: "fedYellow", label: "Amarilla federativa (acta)", short: "🟡", color: "#C9A54A" },
  { k: "fedRed", label: "Roja federativa (acta)", short: "🔴", color: "#B03038" },
];
const CONTEXTS = ["Entrenamiento", "Partido", "Convivencia/Viaje", "Otro"];
const cardOf = (k) => CARDS.find((c) => c.k === k) || CARDS[0];
const normOf = (code) => NORMS.find((n) => n.code === code) || NORMS[0];

const COMUNIDADES = [
  "Comunidad de Madrid", "Andalucía", "Aragón", "Principado de Asturias", "Illes Balears", "Canarias",
  "Cantabria", "Castilla-La Mancha", "Castilla y León", "Cataluña", "Comunitat Valenciana", "Extremadura",
  "Galicia", "La Rioja", "Comunidad Foral de Navarra", "País Vasco", "Región de Murcia", "Ceuta", "Melilla", "Otra",
];

/* Sugerencias de club por comunidad autónoma. NO es un listado exhaustivo ni una base de datos
   federativa (en España hay >20.000 clubes federados; no existe una fuente publica reutilizable
   sin acuerdo o API oficial). El campo es SIEMPRE libre: si el club no aparece, se escribe. */
/* Solo Comunidad de Madrid: es donde se lanza la app. Lista de sugerencias
   (clubes de fútbol base conocidos), NO exhaustiva ni oficial: el campo sigue
   siendo libre y admite cualquier nombre escribiéndolo. */
/* Orden fijo pedido por el usuario: Chamartín Vergara, Atlético de Madrid y Sporting
   de Hortaleza primero; Real Madrid al final de la lista completa. El picker respeta
   este orden (no reordena alfabeticamente por defecto). */
/* Escudo por defecto del club de casa. Vive en /public, así que se ve aunque
   el adjunto de Airtable esté vacío o el backend no responda. */
const ESCUDO_LOCAL = { "Club Deportivo Chamartín Vergara 1995": "/escudo-chamartin.png" };
const escudoDe = (club) => ESCUDO_LOCAL[club] || null;

/* ================= COLOR DE ACENTO DEL ESCUDO =================
   Idea: que el menú (barra lateral en escritorio, barra de abajo y cajón
   "Más" en móvil) se sienta del equipo, sin tocar el resto de la app —
   el negro/blanco actual sigue mandando en botones y en los colores que
   SIGNIFICAN algo (disponible/duda/lesión). Se extrae en el propio
   dispositivo, a partir del archivo que la persona acaba de elegir (nunca
   de una URL ya subida: leer píxeles de una imagen de otro origen sin
   cabeceras CORS permisivas rompe el canvas). */
const rgbAHsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, s, l];
};
const hslACss = (h, s, l) => `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
/* Añade transparencia a un color de acento sea cual sea su formato: hsl(...)
   -lo que sale de un escudo- o hexadecimal de 6 cifras -el negro/blanco de
   siempre-. El truco de "pegar dos cifras hex al final" que usa el resto de
   la app para las versiones translúcidas de AC solo vale para hex; con un
   acento de escudo (hsl) generaba un valor de color inválido y el fondo se
   quedaba sin pintar, sin avisar de nada. */
const conAlpha = (color, alphaPct) => {
  if (!color) return color;
  if (color.startsWith("hsl(")) return color.replace(/\)$/, ` / ${alphaPct}%)`);
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return `${color}${Math.round(alphaPct * 2.55).toString(16).padStart(2, "0")}`;
  return color;
};
/* Del color más frecuente y saturado del escudo a dos versiones ya seguras
   de leer: una para fondo claro (oscurecida si hacía falta) y otra para
   fondo oscuro (aclarada si hacía falta). Así no hace falta recalcular nada
   al cambiar de tema, ni arriesgarse a un acento ilegible. */
const acentosDesdeColor = (r, g, b) => {
  const [h, s] = rgbAHsl(r, g, b);
  const satMin = Math.max(s, 0.45); // el escudo puede traer un color algo apagado; se refuerza para que se note
  return {
    claro: hslACss(h, satMin, 0.34), // suficientemente oscuro sobre fondo blanco
    oscuro: hslACss(h, satMin, 0.68), // suficientemente claro sobre fondo negro
  };
};
/* Lee una imagen en un <canvas> del propio dispositivo (data: URL, mismo
   origen) y devuelve el color dominante entre los que de verdad aportan
   identidad: descarta blancos, negros y grises casi puros -el contorno y el
   fondo del escudo suelen ser justo eso, y si ganan la votación el "color
   del equipo" acaba siendo gris. */
const extraerAcentoDeEscudo = (dataUrl) => new Promise((resolve) => {
  try {
    const img = new Image();
    /* Necesario para escudos que ya no son un data: URL local sino la URL en
       la nube (Airtable), que es de otro origen: sin marcar la petición como
       CORS antes de fijar src, el canvas queda "contaminado" y getImageData
       revienta más abajo aunque el servidor sí permita leerlo. */
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const lado = 40;
        const cv = document.createElement("canvas");
        cv.width = lado; cv.height = lado;
        const ctx = cv.getContext("2d");
        ctx.drawImage(img, 0, 0, lado, lado);
        const { data } = ctx.getImageData(0, 0, lado, lado);
        const cuentas = new Map();
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 200) continue;
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          if (sat < 0.18) continue; // grisáceo: contorno, sombra o fondo
          if (max > 248 && min > 230) continue; // casi blanco
          if (max < 25) continue; // casi negro
          const clave = `${Math.round(r / 12) * 12},${Math.round(g / 12) * 12},${Math.round(b / 12) * 12}`;
          cuentas.set(clave, (cuentas.get(clave) || 0) + 1);
        }
        const top = [...cuentas.entries()].sort((x, y) => y[1] - x[1])[0];
        if (!top) { resolve(null); return; }
        const [r, g, b] = top[0].split(",").map(Number);
        resolve(acentosDesdeColor(r, g, b));
      } catch { resolve(null); } // canvas contaminado u otro fallo: sin acento, se sigue en blanco/negro
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  } catch { resolve(null); }
});
/* Normaliza texto escrito por personas para comparar: sin tildes, sin
   mayúsculas y sin espacios de más ("Chamartín Vergara" y "chamartin vergara"
   son el mismo club). Vive aquí arriba, a nivel de módulo, para que cualquier
   pantalla la pueda usar sin declarar su propia copia local: eso es justo lo
   que había pasado -alguna pantalla llamaba a `norm(...)` dando por hecho que
   existía aquí, y como no existía se caía entera con un ReferenceError. */
const norm = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const igualTexto = (a, b) => norm(a) === norm(b);

const CLUBES_MADRID = [
  "Club Deportivo Chamartín Vergara 1995", "Club Atlético de Madrid", "Sporting de Hortaleza",
  "Rayo Vallecano de Madrid", "Getafe CF", "CD Leganés", "AD Alcorcón", "EF Las Rozas",
  "CD Canillas", "AD Complutense", "CD Aluche", "Club Estudiantes de Madrid",
  "AD Colonia Moscardó", "CD Ciudad de Móstoles", "UD San Sebastián de los Reyes",
  "CD Parla", "Fuenlabrada CF", "CDE Torrejón CF", "AD Pinto", "CD Boadilla",
  "Real Sociedad Deportiva Alcalá", "CD Numancia de Tres Cantos", "AD Ciempozuelos",
  "CD Villaverde", "AD Nuevo Versalles", "CD Estrella Roja", "AD Colmenar Viejo",
  "CD Ursaria", "CD Brunete", "UD San Fernando de Henares", "CD Pozuelo de Alarcón",
  "Rivas Fútbol Club", "AD Nuevo Boadilla", "CD Guadalajara Villaverde", "CD Trival Valderas",
  "Atlético Pinto", "CD Cristo de Rivas", "Torrejón CF", "AD Parque Coimbra", "CDE La Salle Colegio",
  "Real Madrid CF",
];

/* Categorías oficiales del fútbol base español. `half` alimenta el cronómetro del modo partido. */
const CATEGORIAS = [
  { k: "prebenjamin", label: "Prebenjamín", sub: "Sub-8", f7: true, half: 20 },
  { k: "benjamin", label: "Benjamín", sub: "Sub-10", f7: true, half: 25 },
  { k: "alevin", label: "Alevín", sub: "Sub-12", f7: true, half: 30 },
  { k: "infantil", label: "Infantil", sub: "Sub-14", f7: false, half: 35 },
  { k: "cadete", label: "Cadete", sub: "Sub-16", f7: false, half: 35 },
  { k: "juvenil", label: "Juvenil", sub: "Sub-19", f7: false, half: 40 },
  { k: "senior", label: "Sénior / Aficionado", sub: "Absoluto", f7: false, half: 45 },
];
/* Un icono por categoría de edad: como el escudo es el mismo para todo el
   club (Infantil B, Juvenil A y Sénior comparten el del club), hace falta
   otra forma de distinguirlas de un vistazo al cambiar entre ellas. Progresión
   de círculo que se va llenando según se crece, más dos marcas para cadete y
   juvenil/sénior — misma familia geométrica que TAB_ICON ("marcas de tiza, no
   emoji"), para no romper el estilo del resto de la app. */
const CAT_ICON = {
  prebenjamin: "◔", benjamin: "◑", alevin: "◕", infantil: "●", cadete: "◆", juvenil: "⬟", senior: "■",
};
/* De un nombre de categoría libre ("Infantil B", "Juvenil A"…) a su icono:
   busca qué categoría oficial empieza el nombre, sin mirar mayúsculas ni
   acentos. Si no reconoce ninguna (categoría creada a mano con otro nombre),
   se queda con un icono neutro. */
const iconoDeCategoria = (nombre) => {
  const n = normClub(nombre);
  const hit = CATEGORIAS.find((c) => n.startsWith(normClub(c.label).split(" ")[0]));
  /* Devuelve la CLAVE del icono, no el carácter: lo pinta <Icono>, que no
     depende de que la fuente del dispositivo traiga ese glifo. */
  return hit ? `cat-${hit.k}` : "cat-otra";
};
const LETRAS = ["A", "B", "C", "D", "E"];
const makeTeam = (catKey, letra) => {
  const c = CATEGORIAS.find((x) => x.k === catKey) || CATEGORIAS[3];
  return {
    id: `${c.k}-${letra.toLowerCase()}`,
    name: `${c.label} ${letra}`,
    sub: `${c.sub} · ${c.f7 ? "Fútbol 7" : "Fútbol 11"} · ${c.half}′ por parte`,
    cat: c.k, f7: c.f7, half: c.half,
  };
};
/* Club de la cuenta demo: la demo SOLO muestra este club */
const DEMO_CLUB = "C.D. Chamartín Vergara";
/* Sugerencias al escribir el club. No es un listado cerrado: el campo es libre,
   así que cualquier club de cualquier federación puede registrarse escribiéndolo. */




/* Duración de cada parte por categoría (valor por defecto; editable en el modo partido) */
const HALF_BY_CAT = [
  { m: /juvenil/i, min: 40 },
  { m: /cadete/i, min: 35 },
  { m: /infantil/i, min: 35 },
  { m: /alev/i, min: 30 },
  { m: /benjam/i, min: 25 },
  { m: /prebenjam|querub/i, min: 20 },
];
const defaultHalf = (team) => {
  if (team && Number(team.half)) return Number(team.half);
  const n = typeof team === "string" ? team : team?.name;
  return (HALF_BY_CAT.find((x) => x.m.test(String(n || "")))?.min) || 35;
};
const ADDED_OPTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];


/* ---------------- Calendario del equipo (importación CSV / ICS) ---------------- */
const isoDate = (v) => {
  const x = String(v || "").trim();
  const dmy = x.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (dmy) {
    const y = dmy[3].length === 2 ? "20" + dmy[3] : dmy[3];
    return `${y}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : x;
};
const parseICS = (txt) =>
  txt.split(/BEGIN:VEVENT/i).slice(1).map((b, i) => {
    const g = (re) => (b.match(re)?.[1] || "").trim();
    const dt = g(/DTSTART[^:\r\n]*:([0-9TZ]+)/i);
    if (!dt) return null;
    const sum = g(/SUMMARY:([^\r\n]*)/i);
    const loc = g(/LOCATION:([^\r\n]*)/i);
    const parts = sum.split(/\s+(?:vs\.?|-|–|contra)\s+/i);
    return {
      id: Date.now() + i, j: "", date: `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}`,
      time: dt.length > 8 ? `${dt.slice(9, 11)}:${dt.slice(11, 13)}` : "",
      home: (parts[0] || sum).trim(), away: (parts[1] || "").trim(), place: loc,
    };
  }).filter(Boolean);
const parseFixtures = (txt) => {
  if (/BEGIN:VCALENDAR/i.test(txt)) return parseICS(txt);
  return String(txt).split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    .filter((l) => !/^jornada[;,\t]/i.test(l))
    .map((l, i) => {
      const sep = l.includes(";") ? ";" : l.includes("\t") ? "\t" : ",";
      const c = l.split(sep).map((x) => x.replace(/^"|"$/g, "").trim());
      return { id: Date.now() + i, j: c[0] || "", date: isoDate(c[1]), time: c[2] || "", home: c[3] || "", away: c[4] || "", place: c[5] || "" };
    })
    .filter((f) => /^\d{4}-\d{2}-\d{2}$/.test(f.date));
};
const CAL_SAMPLE = "1;06/09/2026;10:00;C.D. Chamartín Vergara;CD Norte;Campo Municipal\n2;13/09/2026;12:30;AD Sur;C.D. Chamartín Vergara;Ciudad Deportiva Sur";

/* Calendario real de Infantil B 26/27 (C.D. Chamartín Vergara - Alcobendas "B"):
   Primera Infantil, Grupo 6, RFFM. Las 30 jornadas de liga tal y como las
   publica la federación, más dos avisos de pretemporada en agosto (sin rival:
   la federación no publica amistosos, solo la liga). Mismos datos que en la
   tabla Partidos de Airtable — esto es lo que se ve sin conexión o en la demo;
   con sesión real y equipo en la nube, el efecto de sincronización lo
   sustituye por lo que haya en Airtable. */
const FIXTURES_INIT = [
  { id: 8001, j: "PT", date: "2026-08-12", time: "", home: "C.D. Chamartín Vergara - Alcobendas \"B\"", away: "Trabajo individual de pretemporada (ver Plan de Pretemporada en Normativa)", place: "" },
  { id: 8002, j: "PT", date: "2026-09-02", time: "", home: "C.D. Chamartín Vergara - Alcobendas \"B\"", away: "Inicio de la pretemporada de equipo", place: "" },
  { id: 8003, j: "1", date: "2026-09-26", time: "", home: "AULA C.F. - BREZO OSUNA \"A\"", away: "C.D. Chamartín Vergara - Alcobendas \"B\"", place: "" },
  { id: 8004, j: "2", date: "2026-10-03", time: "", home: "C.D. Chamartín Vergara - Alcobendas \"B\"", away: "C.F. VALDEBEBAS \"A\"", place: "" },
  { id: 8005, j: "3", date: "2026-10-10", time: "", home: "C.D. OLIMPICO DE HORTALEZA \"B\"", away: "C.D. Chamartín Vergara - Alcobendas \"B\"", place: "" },
  { id: 8006, j: "4", date: "2026-10-17", time: "", home: "C.D. Chamartín Vergara - Alcobendas \"B\"", away: "C.D. TRIVEMA NAVAL \"A\"", place: "" },
  { id: 8007, j: "5", date: "2026-10-24", time: "", home: "S.A.D. FUNDACIÓN C.D. RECUERDO \"B\"", away: "C.D. Chamartín Vergara - Alcobendas \"B\"", place: "" },
  { id: 8008, j: "6", date: "2026-10-31", time: "", home: "C.D. Chamartín Vergara - Alcobendas \"B\"", away: "C.D. CANILLAS \"C\"", place: "" },
  { id: 8009, j: "7", date: "2026-11-07", time: "", home: "A.D. VILLA ROSA \"B\"", away: "C.D. Chamartín Vergara - Alcobendas \"B\"", place: "" },
  { id: 8010, j: "8", date: "2026-11-14", time: "", home: "C.D. Chamartín Vergara - Alcobendas \"B\"", away: "A.D. SPORTING HORTALEZA \"D\"", place: "" },
  { id: 8011, j: "9", date: "2026-11-21", time: "", home: "CDE CHAMARTIN F.C. \"B\"", away: "C.D. Chamartín Vergara - Alcobendas \"B\"", place: "" },
  { id: 8012, j: "10", date: "2026-11-28", time: "", home: "C.D. Chamartín Vergara - Alcobendas \"B\"", away: "C.D. RUPE SAHAGUN \"A\"", place: "" },
  { id: 8013, j: "11", date: "2026-12-12", time: "", home: "C.D. Chamartín Vergara - Alcobendas \"B\"", away: "A.D. ESPERANZA \"B\"", place: "" },
  { id: 8014, j: "12", date: "2026-12-19", time: "", home: "C.D. SPARTAC DE MANOTERAS \"A\"", away: "C.D. Chamartín Vergara - Alcobendas \"B\"", place: "" },
  { id: 8015, j: "13", date: "2027-01-16", time: "", home: "C.D. Chamartín Vergara - Alcobendas \"B\"", away: "A.D. COLMENAR VIEJO \"C\"", place: "" },
  { id: 8016, j: "14", date: "2027-01-23", time: "", home: "CLUB SAN JOSE DEL PARQUE \"A\"", away: "C.D. Chamartín Vergara - Alcobendas \"B\"", place: "" },
  { id: 8017, j: "15", date: "2027-01-30", time: "", home: "C.D. Chamartín Vergara - Alcobendas \"B\"", away: "A.D. OÑA SANCHINARRO \"B\"", place: "" },
  { id: 8018, j: "16", date: "2027-02-06", time: "", home: "C.D. Chamartín Vergara - Alcobendas \"B\"", away: "AULA C.F. - BREZO OSUNA \"A\"", place: "" },
  { id: 8019, j: "17", date: "2027-02-13", time: "", home: "C.F. VALDEBEBAS \"A\"", away: "C.D. Chamartín Vergara - Alcobendas \"B\"", place: "" },
  { id: 8020, j: "18", date: "2027-02-20", time: "", home: "C.D. Chamartín Vergara - Alcobendas \"B\"", away: "C.D. OLIMPICO DE HORTALEZA \"B\"", place: "" },
  { id: 8021, j: "19", date: "2027-02-27", time: "", home: "C.D. TRIVEMA NAVAL \"A\"", away: "C.D. Chamartín Vergara - Alcobendas \"B\"", place: "" },
  { id: 8022, j: "20", date: "2027-03-06", time: "", home: "C.D. Chamartín Vergara - Alcobendas \"B\"", away: "S.A.D. FUNDACIÓN C.D. RECUERDO \"B\"", place: "" },
  { id: 8023, j: "21", date: "2027-03-13", time: "", home: "C.D. CANILLAS \"C\"", away: "C.D. Chamartín Vergara - Alcobendas \"B\"", place: "" },
  { id: 8024, j: "22", date: "2027-03-20", time: "", home: "C.D. Chamartín Vergara - Alcobendas \"B\"", away: "A.D. VILLA ROSA \"B\"", place: "" },
  { id: 8025, j: "23", date: "2027-04-03", time: "", home: "A.D. SPORTING HORTALEZA \"D\"", away: "C.D. Chamartín Vergara - Alcobendas \"B\"", place: "" },
  { id: 8026, j: "24", date: "2027-04-10", time: "", home: "C.D. Chamartín Vergara - Alcobendas \"B\"", away: "CDE CHAMARTIN F.C. \"B\"", place: "" },
  { id: 8027, j: "25", date: "2027-04-17", time: "", home: "C.D. RUPE SAHAGUN \"A\"", away: "C.D. Chamartín Vergara - Alcobendas \"B\"", place: "" },
  { id: 8028, j: "26", date: "2027-04-24", time: "", home: "A.D. ESPERANZA \"B\"", away: "C.D. Chamartín Vergara - Alcobendas \"B\"", place: "" },
  { id: 8029, j: "27", date: "2027-05-01", time: "", home: "C.D. Chamartín Vergara - Alcobendas \"B\"", away: "C.D. SPARTAC DE MANOTERAS \"A\"", place: "" },
  { id: 8030, j: "28", date: "2027-05-08", time: "", home: "A.D. COLMENAR VIEJO \"C\"", away: "C.D. Chamartín Vergara - Alcobendas \"B\"", place: "" },
  { id: 8031, j: "29", date: "2027-05-15", time: "", home: "C.D. Chamartín Vergara - Alcobendas \"B\"", away: "CLUB SAN JOSE DEL PARQUE \"A\"", place: "" },
  { id: 8032, j: "30", date: "2027-05-22", time: "", home: "A.D. OÑA SANCHINARRO \"B\"", away: "C.D. Chamartín Vergara - Alcobendas \"B\"", place: "" },
];

const TAB_LABEL = { inicio: "Inicio", jugadores: "Jugadores", alineacion: "Alineación", convocatoria: "Convocatoria", partido: "Modo partido", usuarios: "Usuarios", coachai: "Coach AI" };
/* ---------------- Airtable (conexión app <-> base) ---------------- */
const AIR = "/.netlify/functions/airtable";

/* ================= SESIÓN FIRMADA =================
   Las funciones serverless ya no aceptan peticiones anónimas. El login
   devuelve un token firmado por el backend y aquí se guarda para mandarlo
   en cada llamada. Si el backend responde 401 (caducado o manipulado) se
   borra y se avisa, en vez de caer en silencio al modo demo, que es lo que
   antes hacía parecer que "no detectaba el registro". */
const TOKEN_KEY = "cb_token";
let AUTH_TOKEN = null;
try { AUTH_TOKEN = localStorage.getItem(TOKEN_KEY) || null; } catch { /* noop */ }
const setAuthToken = (t) => {
  AUTH_TOKEN = t || null;
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* noop */ }
};
let onAuthExpired = () => {};
const setAuthExpiredHandler = (fn) => { onAuthExpired = fn; };
const cbFetch = async (url, init = {}) => {
  const headers = { ...(init.headers || {}) };
  if (AUTH_TOKEN) headers["x-cb-token"] = AUTH_TOKEN;
  const r = await fetch(url, { ...init, headers });
  if (r.status === 401) { setAuthToken(null); onAuthExpired(); }
  return r;
};
const ROL2LABEL = { entrenador: "Entrenador principal", segundo: "Segundo entrenador", delegado: "Delegado", director: "Director deportivo", master: "Master" };
const LABEL2ROL = { "Entrenador principal": "entrenador", "Segundo entrenador": "segundo", "Delegado": "delegado", "Director deportivo": "director", "Master": "master" };
const airUsers = async (teamRec = "") => { try { const r = await cbFetch(AIR + (teamRec ? `?team=${encodeURIComponent(teamRec)}` : "")); if (!r.ok) return null; const d = await r.json(); return d.records || null; } catch { return null; } };
const airCreate = (body) => { try { return cbFetch(AIR, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => {}); } catch { return null; } };
/* ================= PROPUESTAS (segundo entrenador -> aprobación) =================
   Persistidas en Airtable (tabla Propuestas): el segundo entrenador propone
   alineación/plantilla/calendario/convocatoria y el entrenador, director o
   master las aprueba o rechaza. Ver ?res=propuestas en airtable.mts. */
const airProposalsList = async (teamRec) => {
  try {
    const r = await cbFetch(`${AIR}?res=propuestas&team=${encodeURIComponent(teamRec)}`);
    if (!r.ok) return null;
    const d = await r.json();
    return d.records || null;
  } catch { return null; }
};
const airProposalCreate = async (teamRec, type, data) => {
  try {
    const r = await cbFetch(`${AIR}?res=propuestas`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ team: teamRec, type, data }),
    });
    return await r.json().catch(() => null);
  } catch { return null; }
};
const airProposalResolve = async (id, estado) => {
  try {
    const r = await cbFetch(`${AIR}?res=propuestas&id=${encodeURIComponent(id)}`, {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    return await r.json().catch(() => null);
  } catch { return null; }
};
/* Login y alta pasan por airPost como todo lo demás: así el motivo del fallo
   queda apuntado y el usuario lee por qué no ha podido entrar, en vez del
   mismo "no hay conexión" para un despliegue sin funciones y para un móvil
   sin cobertura. */
const airLogin = (email, password) => airPost({ action: "login", email, password });
const airRegister = (payload) => airPost({ action: "register", ...payload });
/* Recuperación de contraseña. airForgot devuelve lo mismo exista o no la
   cuenta (el backend no distingue a propósito), así que la app tampoco puede
   decirle al usuario si ese correo está o no dado de alta. */
/* Por qué falló la última llamada al servidor. Sin esto, un 404 —la función no
   está desplegada— y un corte de red daban exactamente el mismo mensaje, y no
   había forma de saber cuál de las dos cosas pasaba. */
let ultimoFalloAir = null;
const airPost = async (body) => {
  try {
    const r = await cbFetch(AIR, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (r.status === 404) { ultimoFalloAir = "no_desplegado"; return null; }
    if (r.status >= 500) { ultimoFalloAir = "servidor"; return null; }
    ultimoFalloAir = null;
    return await r.json().catch(() => null);
  } catch { ultimoFalloAir = "sin_red"; return null; }
};
const mensajeFalloAir = (t) =>
  ultimoFalloAir === "no_desplegado"
    ? "El servidor de la app no responde en esta dirección. El despliegue no incluye las funciones: súbelo con ellas (o conecta el repositorio en Netlify) y vuelve a intentarlo."
    : ultimoFalloAir === "servidor"
    ? "El servidor ha fallado al procesar la petición. Vuelve a intentarlo en un minuto."
    : t("a.noBackend");
/* Mínimo de caracteres de una contraseña. El backend valida lo mismo por su
   cuenta: esto es solo para avisar antes de enviar. */
const PASS_MIN = 6;
/* Lo inyecta vite.config.js desde package.json. El fallback es por si el
   archivo se abre fuera del build (tests, herramientas). */
const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";
/* Sello en la consola del navegador. Comprobar qué versión está viendo uno no
   debería obligar a buscar un número pequeño en una esquina: se abre la
   consola (F12) y ahí está, junto con si el logotipo sale del SVG o de un
   archivo. */
try { console.info(`COACHBASE Ai · v${APP_VERSION} · logotipo SVG integrado`); } catch {}
/* Planificación de temporada compartida con el cuerpo técnico. Vive en el
   equipo, en Airtable, además de en este dispositivo. */
const airPlanLeer = async (teamRec) => {
  try { const r = await cbFetch(`${AIR}?res=plan&team=${encodeURIComponent(teamRec)}`); if (!r.ok) return null; return await r.json(); } catch { return null; }
};
const airPlanGuardar = async (teamRec, plan) => {
  try {
    const r = await cbFetch(`${AIR}?res=plan&team=${encodeURIComponent(teamRec)}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan: JSON.stringify(plan) }),
    });
    return await r.json().catch(() => null);
  } catch { return null; }
};
/* Jugadas y ABP compartidos con el cuerpo técnico. Mismo mecanismo que la
   planificación: viven en el equipo, en la nube, además de en el dispositivo
   donde se dibujaron. Es lo que permite que el delegado abra el móvil en el
   banquillo y tenga el córner que preparó el entrenador el martes. */
const airJugadasLeer = async (teamRec) => {
  try {
    const r = await cbFetch(`${AIR}?res=jugadas&team=${encodeURIComponent(teamRec)}`);
    if (!r.ok) return null;
    const d = await r.json();
    const arr = JSON.parse(d?.jugadas || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch { return null; }
};
const airJugadasGuardar = async (teamRec, jugadas) => {
  try {
    const r = await cbFetch(`${AIR}?res=jugadas&team=${encodeURIComponent(teamRec)}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jugadas: JSON.stringify(jugadas) }),
    });
    return await r.json().catch(() => null);
  } catch { return null; }
};
/* Une las del equipo con las de este dispositivo sin duplicar: si una jugada
   está en los dos sitios manda la local, que es la que acabas de tocar. */
const mezclarJugadas = (locales, delEquipo) => {
  const vistas = new Set((locales || []).map((x) => String(x.id)));
  return [...(locales || []), ...(delEquipo || []).filter((x) => !vistas.has(String(x.id)))].slice(0, 30);
};

const airForgot = (email) => airPost({ action: "forgotPassword", email });
const airReset = (token, password) => airPost({ action: "resetPassword", token, password });
const airChangePass = (current, next) => airPost({ action: "changePassword", current, next });
/* Gestión de la propia cuenta: cambiar de equipo, crear el suyo si no está, y
   darse de baja. Las tres devuelven token nuevo o borran la sesión, así que
   quien las llama tiene que refrescar lo que corresponda. */
const airCambiarEquipo = (teamRec) => airPost({ action: "cambiarEquipo", teamRec });
const airCrearEquipo = (nombre, categoria, formato) => airPost({ action: "crearEquipo", nombre, categoria, formato });
const airBorrarmeCuenta = (password) => airPost({ action: "borrarmeCuenta", password });
/* Clubs: los crea y los borra solo el Master. Un club es el nivel de arriba
   (el Chamartín Vergara); sus categorías —Juvenil A, Infantil B— cuelgan de él
   y las añade cada usuario dentro de su propio club. */
const airDemoToken = () => airPost({ action: "demoToken" });
const airCrearClub = (nombre, comunidad) => airPost({ action: "crearClub", nombre, comunidad });
const airBorrarClub = (clubRec) => airPost({ action: "borrarClub", clubRec });
// Espejo de los usuarios sembrados en Airtable, para poder probar el login en el preview (sin backend). Contraseña demo: coach1234
const DEMO_PASS = "coach1234";
const DEMO_LOGIN = {
  "direccion@eflasrozas.es": { name: "Laura Vega", role: "director", estado: "activo" },
  "emilio@eflasrozas.es": { name: "Emilio Bermejo", role: "entrenador", estado: "activo" },
  "raul@eflasrozas.es": { name: "Raúl Sáez", role: "segundo", estado: "activo" },
  "marta@eflasrozas.es": { name: "Marta Gómez", role: "delegado", estado: "activo" },
  "andres.ponce@gmail.com": { name: "Andrés Ponce", role: "segundo", estado: "pendiente" },
};
/* Escudo con red de seguridad: las URL de adjunto de Airtable caducan a las
   pocas horas, y un <img> roto deja un hueco vacío. Si la imagen no carga se
   cae a las iniciales en vez de quedarse en blanco. */
const Crest = ({ src, name, size = 24 }) => {
  const [roto, setRoto] = useState(false);
  useEffect(() => { setRoto(false); }, [src]);
  const iniciales = String(name || "").split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  if (src && !roto) {
    return <img src={src} alt="" onError={() => setRoto(true)} className="rounded-md object-contain shrink-0" style={{ width: size, height: size }} />;
  }
  return (
    <div className="rounded-md shrink-0 flex items-center justify-center font-display font-bold"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42), background: "rgba(255,255,255,0.07)", color: "#8FA096" }}>
      {iniciales}
    </div>
  );
};

/* ================= PIZARRA PEQUEÑA (vista previa de un ABP) =================
   Miniatura de una jugada guardada, para verla desde el banquillo sin salir
   del modo partido. No es interactiva a propósito: en un córner se mira, se
   reconoce y se decide; si hace falta tocarla, el botón lleva a la pizarra.
   Encuadra sola la zona donde ocurre la jugada (los ABP pasan en una esquina
   del campo, así que dibujar los 1000×640 completos dejaría las fichas del
   tamaño de un grano de arroz). */
const MINI_COL = (ty) => (ty === "home" ? "#FFFFFF" : ty === "away" ? "#36454F" : ty === "ball" ? "#FFFFFF" : ty === "disc" ? "#9FB0BA" : ty === "goal" ? "#E6EAEC" : "#C0C8CD");
const miniPath = (pts) => (pts || []).map((q, i) => (i === 0 ? `M${q.x},${q.y}` : `L${q.x},${q.y}`)).join(" ");
/* Marco que contiene toda la jugada, con margen, ajustado a 25:16 (la
   proporción del campo) para que nada salga estirado. */
const miniEncuadre = (play) => {
  const ptos = [];
  for (const tk of play.tokens || []) ptos.push({ x: tk.x, y: tk.y });
  for (const sh of play.shapes || []) for (const q of sh.pts || []) ptos.push(q);
  if (ptos.length < 2) return { x: 0, y: 0, w: 1000, h: 640 };
  const xs = ptos.map((q) => q.x), ys = ptos.map((q) => q.y);
  let x0 = Math.min(...xs) - 60, x1 = Math.max(...xs) + 60;
  let y0 = Math.min(...ys) - 60, y1 = Math.max(...ys) + 60;
  /* Si la jugada pasa cerca de una portería —y un ABP siempre pasa cerca de
     una—, el encuadre llega hasta la línea de gol: sin el área dibujada, un
     puñado de fichas sueltas no se reconoce como un córner. */
  if ((x0 + x1) / 2 > 500) x1 = 1000; else x0 = 0;
  let w = Math.max(x1 - x0, 260), h = Math.max(y1 - y0, 166);
  if (w / h > 1000 / 640) h = w * 640 / 1000; else w = h * 1000 / 640;
  let x = (x0 + x1) / 2 - w / 2, y = (y0 + y1) / 2 - h / 2;
  /* Sin salirse del campo: un encuadre fuera de las líneas se lee como un
     error de dibujo, no como un zoom. */
  x = Math.max(0, Math.min(x, 1000 - Math.min(w, 1000)));
  y = Math.max(0, Math.min(y, 640 - Math.min(h, 640)));
  return { x, y, w, h };
};
const MiniPizarra = ({ play, ac, className = "" }) => {
  /* Si la jugada se dibujó en un tablero de balón parado, la miniatura usa ese
     mismo tablero entero: ya está encuadrado en la zona donde ocurre, no hay
     nada que recortar. Solo las del campo entero necesitan el recorte
     automático. */
  const tbk = TABLEROS[play.tablero] ? play.tablero : "campo";
  const tb = TABLEROS[tbk];
  const propio = tbk !== "campo";
  const v = propio ? { x: 0, y: 0, w: tb.w, h: tb.h } : miniEncuadre(play);
  /* El marcador de flecha necesita un id único por miniatura: si se repite,
     el navegador usa el primero y las demás salen sin punta. */
  const mk = `mini${play.id}`;
  const esc = v.w / 1000; // cuanto más cerrado el encuadre, más finos los trazos
  return (
    <svg viewBox={`${v.x} ${v.y} ${v.w} ${v.h}`} className={`w-full rounded-lg border ${className}`} aria-hidden="true"
      style={{ borderColor: "rgba(54,69,79,0.2)", aspectRatio: `${tb.w}/${tb.h}`, background: "#152219" }}>
      <defs>
        <marker id={mk} markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#FFFFFF" /></marker>
      </defs>
      {propio ? (
        <>
          <FranjasTablero tb={tb} />
          <MarcasTablero tb={tb} grosor={0.26 * tb.esc} />
        </>
      ) : (
        <>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={i * 125} y="0" width="125" height="640" fill={i % 2 ? "#17251D" : "#152219"} />)}
          <g stroke="rgba(255,255,255,0.5)" strokeWidth={2.5 * esc} fill="none">
            <rect x="12" y="12" width="976" height="616" /><line x1="500" y1="12" x2="500" y2="628" /><circle cx="500" cy="320" r="70" />
            <rect x="12" y="200" width="120" height="240" /><rect x="868" y="200" width="120" height="240" />
            <rect x="12" y="270" width="45" height="100" /><rect x="943" y="270" width="45" height="100" />
          </g>
        </>
      )}
      {(play.shapes || []).map((sh, i) => {
        const col = sh.color || "#FFFFFF";
        const co = { fill: "none", stroke: col, strokeWidth: (sh.width || 4), strokeLinecap: "round", strokeLinejoin: "round" };
        const k = sh.id ?? `s${i}`;
        if (sh.tool === "text") return <text key={k} x={sh.pts[0].x} y={sh.pts[0].y} fill={col} fontSize={22 + (sh.width || 4) * 2} fontFamily="Barlow Condensed, sans-serif" fontWeight="700">{sh.text}</text>;
        if (sh.tool === "zone") { const a = sh.pts[0], b = sh.pts[1]; return <rect key={k} x={Math.min(a.x, b.x)} y={Math.min(a.y, b.y)} width={Math.abs(b.x - a.x)} height={Math.abs(b.y - a.y)} {...co} fill={col} fillOpacity="0.13" strokeDasharray="8 6" />; }
        if (sh.tool === "circle") { const a = sh.pts[0], b = sh.pts[1]; return <circle key={k} cx={a.x} cy={a.y} r={Math.hypot(b.x - a.x, b.y - a.y)} {...co} fill={col} fillOpacity="0.10" />; }
        if (sh.tool === "pass") return <path key={k} d={miniPath(sh.pts)} strokeDasharray="10 10" markerEnd={`url(#${mk})`} {...co} />;
        if (sh.tool === "arrow" || sh.tool === "dribble") return <path key={k} d={miniPath(sh.pts)} markerEnd={`url(#${mk})`} {...co} />;
        return <path key={k} d={miniPath(sh.pts)} {...co} />;
      })}
      {(play.tokens || []).map((tk, i) => (
        <g key={tk.id ?? `t${i}`}>
          {tk.type === "cone"
            ? <path d={`M${tk.x},${tk.y - 16} L${tk.x + 14},${tk.y + 12} L${tk.x - 14},${tk.y + 12} Z`} fill={MINI_COL(tk.type)} stroke={tk.type === "away" ? "#FFFFFF" : "#36454F"} strokeWidth="2" />
            : tk.type === "disc"
            ? <ellipse cx={tk.x} cy={tk.y} rx="14" ry="7" fill={MINI_COL(tk.type)} stroke={tk.type === "away" ? "#FFFFFF" : "#36454F"} strokeWidth="2" />
            : tk.type === "goal"
            ? <g><rect x={tk.x - 30} y={tk.y - 12} width="60" height="24" fill="none" stroke={MINI_COL(tk.type)} strokeWidth="4" />
                <line x1={tk.x - 30} y1={tk.y - 12} x2={tk.x - 30} y2={tk.y + 12} stroke={MINI_COL(tk.type)} strokeWidth="4" />
                <line x1={tk.x + 30} y1={tk.y - 12} x2={tk.x + 30} y2={tk.y + 12} stroke={MINI_COL(tk.type)} strokeWidth="4" /></g>
            : <>
                <circle cx={tk.x} cy={tk.y} r={tk.type === "ball" ? 13 : 20} fill={MINI_COL(tk.type)} stroke={tk.type === "away" ? "#FFFFFF" : "#36454F"} strokeWidth={tk.type === "ball" ? 2 : 3} />
                {tk.label && <text x={tk.x} y={tk.y + 6} textAnchor="middle" fontSize="20" fontFamily="Barlow Condensed, sans-serif" fontWeight="700" fill={tk.type === "away" ? "#FFFFFF" : "#36454F"}>{tk.label}</text>}
              </>}
        </g>
      ))}
    </svg>
  );
};

/* Marca de la app: pizarra táctica en miniatura. SVG en línea, sin archivo. */
/* ================= LOGOTIPO DE LA MARCA =================
   Reproduce el lockup oficial —COACHBASE Ai, el filete, y "by e. EBLDigital"—
   en SVG en vez de con una imagen, por dos motivos: se ve nítido a cualquier
   tamaño y en cualquier pantalla, y hereda las fuentes de la app.

   Va en blanco tiza porque el original es azul marino sobre blanco y aquí el
   fondo es oscuro: tal cual no se vería. El distintivo de EBLDigital también
   se invierte (fondo claro, "e" oscura) por lo mismo, conservando el punto
   azul de la marca.

   Si algún día se quiere el archivo original exacto, basta con sustituir este
   componente por un <img src="/logo.svg" /> y dejar el archivo en public/. */
const MARCA_AZUL = "#3D4EDB";

/* Si existe public/logo.png se usa ese y no la reconstrucción de abajo. Así el
   archivo oficial se mete soltándolo en esa carpeta, sin tocar una línea.
   Debe tener FONDO TRANSPARENTE y el texto en claro: la cabecera es oscura y
   el logotipo original es azul marino sobre blanco, que ahí no se vería.
   Si el archivo no está, onError lo oculta y queda la versión en SVG. */
/* El logotipo se dibuja SIEMPRE aquí dentro, en SVG. Antes intentaba primero
   cargar /logo.png y caía al SVG si fallaba: como ese archivo no existe en el
   proyecto, cada pantalla pedía una imagen inexistente y, con la reescritura
   de la SPA, el servidor respondía el index.html con un 200, así que el
   navegador se quedaba con una imagen rota en vez de dar error y usar el
   respaldo. Resultado: no se veía el logotipo en ningún sitio.
   Dibujado en SVG no depende de ningún archivo ni de ninguna traducción: se
   ve igual al arrancar, en toda la app y en los cinco idiomas. */
const AppWordmark = ({ height = 46 }) => {
  /* El SVG se pinta SIEMPRE y es lo que se ve por defecto: no depende de
     ningún archivo, ni de la red, ni del idioma.
     Además, si alguien deja su logotipo en public/logo.png, se usa ese. La
     comprobación se hace cargando la imagen aparte y solo se cambia cuando ha
     terminado de decodificarse: así no hay un <img> roto en pantalla ni una
     petición fallida a la vista. Antes se ponía el <img> primero y se
     esperaba a que fallara, y como la reescritura de la SPA responde el
     index.html con un 200 a cualquier ruta, la imagen ni fallaba ni se veía. */
  const [archivo, setArchivo] = useState(null);
  useEffect(() => {
    let vivo = true;
    const img = new Image();
    img.onload = () => { if (vivo && img.naturalWidth > 0) setArchivo(img.src); };
    img.src = "/logo.png";
    return () => { vivo = false; };
  }, []);
  if (archivo) {
    return <img src={archivo} alt="COACHBASE Ai · by EBLDigital" style={{ height, width: "auto" }} className="shrink-0 object-contain" />;
  }
  return <AppWordmarkSVG height={height} />;
};

const AppWordmarkSVG = ({ height = 46 }) => (
  /* textLength fija el ancho de cada palabra en vez de dejarlo a merced de la
     fuente que acabe cargando: sin eso "COACHBASE" se comía la "Ai" cuando el
     navegador caía en una tipografía distinta a Inter. */
  <svg viewBox="0 0 352 150" height={height} width={(height * 352) / 150}
    role="img" aria-label="COACHBASE Ai by EBLDigital" className="shrink-0">
    <text x="0" y="58" fontFamily="Inter, system-ui, sans-serif" fontSize="56" fontWeight="500"
      textLength="286" lengthAdjust="spacingAndGlyphs" fill={C.chalk}>COACHBASE</text>
    {/* La "A" va sin travesaño, como en el logotipo */}
    <path d="M294 58 L312 16 L330 58" fill="none" stroke={C.chalk} strokeWidth="7" strokeLinejoin="miter" />
    <rect x="340" y="28" width="7" height="30" fill={C.chalk} />
    <circle cx="343.5" cy="18" r="4.5" fill={C.chalk} />
    <rect x="0" y="72" width="352" height="4" fill={C.chalk} />
    <text x="75" y="124" fontFamily="Inter, system-ui, sans-serif" fontSize="30" fontWeight="400"
      textLength="36" lengthAdjust="spacingAndGlyphs" fill={C.dim}>by</text>
    <rect x="119" y="96" width="34" height="34" rx="8" fill={C.chalk} />
    <text x="126" y="124" fontFamily="Inter, system-ui, sans-serif" fontSize="28" fontWeight="600" fill={C.bg}>e</text>
    <circle cx="147" cy="123" r="4" fill={MARCA_AZUL} />
    <text x="159" y="124" fontFamily="Inter, system-ui, sans-serif" fontSize="30" fontWeight="500"
      textLength="118" lengthAdjust="spacingAndGlyphs" fill={C.chalk}>EBLDigital</text>
  </svg>
);

const AppLogo = ({ size = 34, ac = C.mando }) => (
  <div className="shrink-0 rounded-lg flex items-center justify-center" style={{ width: size, height: size, background: ac }}>
    <svg viewBox="0 0 24 24" width={size * 0.68} height={size * 0.68} aria-hidden="true">
      <rect x="2" y="4.5" width="20" height="15" rx="1.5" fill="none" stroke="#141414" strokeWidth="1.6" />
      <line x1="12" y1="4.5" x2="12" y2="19.5" stroke="#141414" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="3" fill="none" stroke="#141414" strokeWidth="1.2" />
      <path d="M5 16.5 L9.5 9 L14 13" fill="none" stroke="#141414" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2.4 1.8" />
      <circle cx="5" cy="16.5" r="1.5" fill="#141414" />
    </svg>
  </div>
);
const airSub = async (email) => {
  try {
    const r = await cbFetch(`/.netlify/functions/stripe?action=estado&email=${encodeURIComponent(email)}`);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
};
const airTeams = async () => { try { const r = await cbFetch(AIR + "?res=equipos"); if (!r.ok) return null; const d = await r.json(); return d.records || null; } catch { return null; } };
/* Alta de un miembro del cuerpo técnico por el club: crea la ficha sin
   contraseña; la persona la reclama registrándose con ese mismo correo. */
const airUserCreate = async (body) => { try { const r = await cbFetch(AIR, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "createUser", ...body }) }); return await r.json().catch(() => null); } catch { return null; } };
/* Panel de administración de club (Master): límite de plazas y estado de
   pago. Sin `limite` en el body solo consulta; con `limite` también lo guarda. */
const airClubAdmin = async (clubRec, limite) => { try { const r = await cbFetch(AIR, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "clubAdmin", clubRec, ...(limite !== undefined ? { limite } : {}) }) }); return await r.json().catch(() => null); } catch { return null; } };
const airTeamPatch = async (rec, body) => { try { const r = await cbFetch(AIR + "?res=equipos&id=" + rec, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); return r.ok; } catch { return false; } };
const airClubs = async () => { try { const r = await cbFetch(AIR + "?res=clubes"); if (!r.ok) return null; const d = await r.json(); return d.records || null; } catch { return null; } };
const airTeamCreate = async (body) => { try { const r = await cbFetch(AIR + "?res=equipos", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); if (!r.ok) return null; return await r.json(); } catch { return null; } };
/* Escudo del club: se sube una vez y el backend lo copia a todos los equipos
   de ese club que aún no tengan escudo propio (o a todos, si forzarTodos). */
const airClubCrest = async (clubRec, file, contentType, filename, forzarTodos = false) => { try { const r = await cbFetch(AIR + "?res=escudo&id=" + clubRec + "&tipo=club", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ file, contentType, filename, forzarTodos }) }); if (!r.ok) return null; return await r.json(); } catch { return null; } };
const airClubPatch = (rec, body) => { try { return cbFetch(AIR + "?res=clubes&id=" + rec, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => {}); } catch { return null; } };
const airCrest = async (rec, file, contentType, filename) => { try { const r = await cbFetch(AIR + "?res=escudo&id=" + rec, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ file, contentType, filename }) }); if (!r.ok) return null; return await r.json(); } catch { return null; } };
const airRes = async (res, teamRec = "") => { try { const r = await cbFetch(AIR + "?res=" + res + (teamRec ? "&team=" + encodeURIComponent(teamRec) : "")); if (!r.ok) return null; const d = await r.json(); return d.records || null; } catch { return null; } };
const airResCreate = (res, row) => { try { return cbFetch(AIR + "?res=" + res, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "create", row }) }).catch(() => {}); } catch { return null; } };
const airResPatch = (res, rec, row) => { try { return cbFetch(AIR + "?res=" + res + "&id=" + rec, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ row }) }).catch(() => {}); } catch { return null; } };
/* ===== Sincronización con Airtable de plantilla, partidos, convocatorias y
   entrenamientos. Antes solo vivían en localStorage: al cambiar de dispositivo
   o vaciar caché se perdía todo. Ahora Airtable es la fuente de verdad y
   localStorage queda como copia local para funcionar sin conexión. ===== */
const airList = async (res, teamRec = "") => {
  try {
    const r = await cbFetch(`${AIR}?res=${res}${teamRec ? `&team=${encodeURIComponent(teamRec)}` : ""}`);
    if (!r.ok) return null;
    const d = await r.json();
    return d.records || null;
  } catch { return null; }
};
const airNew = async (res, fields) => {
  try {
    const r = await cbFetch(`${AIR}?res=${res}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fields }) });
    if (!r.ok) return null;
    const d = await r.json();
    return d.rec || null;
  } catch { return null; }
};
const airEdit = (res, rec, fields) => {
  try { return cbFetch(`${AIR}?res=${res}&id=${rec}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ fields }) }).catch(() => {}); } catch { return null; }
};
const airDrop = (res, rec) => {
  try { return cbFetch(`${AIR}?res=${res}&id=${rec}`, { method: "DELETE" }).catch(() => {}); } catch { return null; }
};

/* ---- Plantillas de entrenamiento reutilizables ----
   Guarda un guion de sesión sin fecha para volver a cargarlo. Si se marca como
   compartida, la ven todos los equipos del club. El backend las devuelve ya
   ordenadas por número de usos. */
const airPlantillas = async (teamRec, clubRec) => {
  try {
    const r = await cbFetch(`${AIR}?res=plantillas&team=${encodeURIComponent(teamRec || "")}&club=${encodeURIComponent(clubRec || "")}`);
    if (!r.ok) return null;
    return (await r.json()).records || null;
  } catch { return null; }
};
const airPlantillaNueva = async (body) => {
  try {
    const r = await cbFetch(`${AIR}?res=plantillas`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    return await r.json().catch(() => null);
  } catch { return null; }
};
const airPlantillaUsar = (rec) => { try { return cbFetch(`${AIR}?res=plantillas&id=${rec}&usar=1`, { method: "PATCH" }).catch(() => {}); } catch { return null; } };
const airPlantillaEditar = (rec, body) => { try { return cbFetch(`${AIR}?res=plantillas&id=${rec}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => {}); } catch { return null; } };
const airPlantillaBorrar = (rec) => { try { return cbFetch(`${AIR}?res=plantillas&id=${rec}`, { method: "DELETE" }).catch(() => {}); } catch { return null; } };
/* Conversión entre el modelo de la app y las columnas de Airtable */
const POS_OK = ["POR", "LD", "LI", "DFC", "MCD", "MC", "MCO", "ED", "EI", "DC", "MB"];
/* Nombre largo de cada demarcación, para el desglose de Estadísticas: en la
   tabla se lee "DFC" de un vistazo, pero un reparto de plantilla se lee mejor
   con el nombre entero, como en la ficha que pasa el club. */
const POS_NOMBRE = {
  POR: "Portero", DFC: "Central", LD: "Lateral derecho", LI: "Lateral izquierdo",
  MCD: "Mediocentro defensivo", MC: "Centrocampista", MCO: "Mediapunta",
  MB: "Interior", ED: "Extremo derecho", EI: "Extremo izquierdo", DC: "Delantero",
};
const jugToAir = (p, teamRec) => ({
  Nombre: p.n, Dorsal: Number(p.d) || 0,
  ...(POS_OK.includes(p.pos) ? { "Posición": p.pos } : {}),
  Estado: p.st === "lesionado" ? "Lesionado" : p.st === "duda" ? "Duda" : p.st === "sancionado" ? "Sancionado" : "Disponible",
  Minutos: Number(p.min) || 0,
  ...(teamRec ? { Equipo: [teamRec] } : {}),
});
const jugFromAir = (r, i) => ({
  id: i + 1, rec: r.rec, n: r.Nombre || "Sin nombre", d: Number(r.Dorsal) || i + 1,
  pos: r["Posición"] || "MC",
  st: String(r.Estado || "").toLowerCase() === "lesionado" ? "lesionado"
    : String(r.Estado || "").toLowerCase() === "duda" ? "duda"
    : String(r.Estado || "").toLowerCase() === "sancionado" ? "sancionado" : "disponible",
  min: Number(r.Minutos) || 0, att: 0,
});
const partToAir = (f, teamRec) => ({
  Referencia: `${f.date || ""} ${f.home || ""}-${f.away || ""}`.trim().slice(0, 60),
  Fecha: f.date || null, Hora: f.time || "", Jornada: String(f.j || ""),
  Local: f.home || "", Visitante: f.away || "", Lugar: f.place || "",
  ...(teamRec ? { Equipo: [teamRec] } : {}),
});
const partFromAir = (r) => ({
  id: r.rec, rec: r.rec, date: r.Fecha || "", time: r.Hora || "", j: r.Jornada || "",
  home: r.Local || "", away: r.Visitante || "", place: r.Lugar || "",
});

const airPatch = (id, body) => { try { return cbFetch(AIR + "?id=" + id, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => {}); } catch { return null; } };
const airDelete = (id) => { try { return cbFetch(AIR + "?id=" + id, { method: "DELETE" }).catch(() => {}); } catch { return null; } };
const estadoLabel = (status) => (status === "activo" ? "Activo" : "Pendiente");

/* ================= ICONOS =================
   Marcas de tiza, no emoji: línea de un solo grosor y un solo color, que es lo
   que pide la pizarra oscura (un emoji a color se lee como una pegatina puesta
   encima, y en Windows la mitad ni renderizan).
   Antes eran caracteres Unicode sueltos y eso traía dos problemas de fondo:

   · No se distinguían. Seis entradas del menú eran "un cuadrado con algún
     relleno" —▦ Inicio, ▥ Club, ▤ Calendario, ▣ Convocatoria, ◱ Temporada,
     ◧ Estadísticas—: a 15 px son la misma mancha. En la barra de abajo del
     móvil, que es solo iconos, eso deja la navegación a la adivinanza.
   · No se veían igual en todos los sitios. ⬢ ⬡ ⬟ viven en Geometric Shapes
     Extended, un bloque con mala cobertura tipográfica: en bastantes Android
     salen como un cuadro vacío, o los rescata otra fuente con un peso y un
     tamaño que no pegan con el resto.

   Dibujados aquí sobre una rejilla de 24, cada uno enseña lo que es —una
   camiseta para Jugadores, un cono para Entrenamiento, dos tarjetas para
   Disciplina— y se ve idéntico en cualquier dispositivo, porque ya no depende
   de la fuente. */
const ICONOS = {
  /* Inicio: una casa, sin más vueltas. */
  inicio: <><path d="M3.6 11 12 4l8.4 7" /><path d="M6 9.6V20h12V9.6" /><path d="M10 20v-4.6h4V20" /></>,
  /* Club: el escudo. Equipos (catálogo del Master): la parrilla de todos. */
  equipo: <><path d="M12 3.4 19.2 6v5.6c0 4-2.9 7.3-7.2 9-4.3-1.7-7.2-5-7.2-9V6z" /></>,
  equipos: <><rect x="3.6" y="3.6" width="7.4" height="7.4" rx="1.6" /><rect x="13" y="3.6" width="7.4" height="7.4" rx="1.6" /><rect x="3.6" y="13" width="7.4" height="7.4" rx="1.6" /><rect x="13" y="13" width="7.4" height="7.4" rx="1.6" /></>,
  /* Jugadores: una camiseta de fútbol. */
  jugadores: <><path d="M9 3.8 4.8 6.4l1.6 4.2L9 9.6V20.2h6V9.6l2.6 1 1.6-4.2L15 3.8a3 3 0 0 1-6 0z" /></>,
  calendario: <><rect x="3.5" y="5.4" width="17" height="15.1" rx="2" /><path d="M3.5 10.2h17M8 3.4v4M16 3.4v4" /></>,
  /* Convocatoria: el portapapeles con la lista ya marcada. */
  convocatoria: <><path d="M9.4 4.6H7a1.6 1.6 0 0 0-1.6 1.6v12.6A1.6 1.6 0 0 0 7 20.4h10a1.6 1.6 0 0 0 1.6-1.6V6.2A1.6 1.6 0 0 0 17 4.6h-2.4" /><rect x="9.2" y="2.8" width="5.6" height="3.6" rx="1.2" /><path d="M9 13.4l2 2 4-4.2" /></>,
  /* Alineación: el campo con el círculo central. */
  alineacion: <><rect x="3.5" y="4.6" width="17" height="14.8" rx="1.6" /><path d="M12 4.6v14.8" /><circle cx="12" cy="12" r="2.7" /></>,
  /* Modo partido: el cronómetro que se pone en marcha. */
  partido: <><circle cx="12" cy="13.6" r="7" /><path d="M12 13.6V9.8M9.6 3.4h4.8M18.6 7.2 20 5.8" /></>,
  /* Análisis: la lupa sobre lo que pasó (Estadísticas son las barras). */
  analisis: <><circle cx="10.8" cy="10.8" r="6.4" /><path d="M15.5 15.5 20.6 20.6" /><path d="M8.6 12.6v-2M10.8 12.6v-4M13 12.6v-2.8" /></>,
  /* Temporada: la bandera de la meta a la que apunta el plan. */
  temporada: <><path d="M5 21V3.6" /><path d="M5 4.8h11.6l-2.3 3.4 2.3 3.4H5" /></>,
  /* Entrenamiento: el cono. */
  entrenamiento: <><path d="M12 3.6 17.8 18h-11.6z" /><path d="M8.7 13.4h6.6" /><path d="M3.6 20.6h16.8" /></>,
  /* Ejercicios: la biblioteca, en fichas. */
  ejercicios: <><path d="M9.4 6.6h11M9.4 12h11M9.4 17.4h11" /><circle cx="5" cy="6.6" r="1.5" /><circle cx="5" cy="12" r="1.5" /><circle cx="5" cy="17.4" r="1.5" /></>,
  /* Pizarra: el tablero con la jugada dibujada. */
  pizarra: <><rect x="3.4" y="4" width="17.2" height="12.8" rx="1.6" /><path d="M7.6 12.6 10.4 9l2.6 1.8 3.4-3.6" /><path d="M12 16.8v3.4M8.6 20.2h6.8" /></>,
  /* Asistencia: pasar lista, con sus marcas. */
  asistencia: <><path d="M10.4 6.6h10M10.4 12h10M10.4 17.4h10" /><path d="M3.6 6.4 5 7.8l2.4-2.6M3.6 11.8 5 13.2l2.4-2.6M3.6 17.2 5 18.6l2.4-2.6" /></>,
  /* Disciplina: las tarjetas. */
  disciplina: <><rect x="4.4" y="4.6" width="8.6" height="12.4" rx="1.5" /><rect x="10.4" y="7" width="8.6" height="12.4" rx="1.5" /></>,
  /* Normativa: el documento firmado. */
  normativa: <><path d="M6.4 3.5h7.2l4.4 4.4v12.6a1.5 1.5 0 0 1-1.5 1.5H6.4a1.5 1.5 0 0 1-1.5-1.5V5a1.5 1.5 0 0 1 1.5-1.5z" /><path d="M13.4 3.6v4.6h4.6" /><path d="M8.4 13.4h7M8.4 16.8h4.6" /></>,
  estadisticas: <><path d="M4.8 20.4V12.6M12 20.4V4.6M19.2 20.4v-5.6" /></>,
  /* Roles: quién es quién en el club. */
  usuarios: <><circle cx="9.2" cy="8.4" r="3.4" /><path d="M3.4 19.8c0-3.2 2.6-5.2 5.8-5.2s5.8 2 5.8 5.2" /><path d="M16.2 5.8a3.2 3.2 0 0 1 0 5.6M17.8 15c2.1.6 3.6 2.4 3.6 4.8" /></>,
  /* Coach AI: el destello. */
  coachai: <><path d="M11 3.4 12.7 8.3 17.6 10 12.7 11.7 11 16.6 9.3 11.7 4.4 10 9.3 8.3z" /><path d="M17.6 15.2l.8 2.3 2.3.8-2.3.8-.8 2.3-.8-2.3-2.3-.8 2.3-.8z" /></>,
  material: <><path d="M4 8.2h16l-1.3 11.4a1.6 1.6 0 0 1-1.6 1.4H6.9a1.6 1.6 0 0 1-1.6-1.4z" /><path d="M8.6 8.2V6.4a3.4 3.4 0 0 1 6.8 0v1.8" /></>,
  premium: <><path d="M12 3.4l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></>,
  /* Master: la llave del club. */
  master: <><circle cx="7.6" cy="16.4" r="3.6" /><path d="M10.2 13.8 20.4 3.6M17.4 6.6l2.6 2.6M14.8 9.2l2.6 2.6" /></>,
  /* Avisos de la portada: duda (triángulo) y lesión (cruz sanitaria). */
  duda: <><path d="M12 4.2 21 19.6H3z" /><path d="M12 10.2v3.8" /><circle cx="12" cy="17" r="0.95" fill="currentColor" stroke="none" /></>,
  lesion: <><path d="M9.6 3.9h4.8v5.7h5.7v4.8h-5.7v5.7H9.6v-5.7H3.9V9.6h5.7z" /></>,
  /* Categorías por edad: el círculo se va llenando según se crece —la idea de
     antes, ahora dibujada para que no dependa de la fuente— y las tres mayores
     cambian de forma. */
  "cat-prebenjamin": <><circle cx="12" cy="12" r="7.4" /><path d="M12 12V4.6A7.4 7.4 0 0 1 19.4 12z" fill="currentColor" stroke="none" /></>,
  "cat-benjamin": <><circle cx="12" cy="12" r="7.4" /><path d="M12 12V4.6A7.4 7.4 0 0 1 12 19.4z" fill="currentColor" stroke="none" /></>,
  "cat-alevin": <><circle cx="12" cy="12" r="7.4" /><path d="M12 12V4.6A7.4 7.4 0 1 1 4.6 12z" fill="currentColor" stroke="none" /></>,
  "cat-infantil": <><circle cx="12" cy="12" r="7.4" fill="currentColor" /></>,
  "cat-cadete": <><path d="M12 3.8 20.2 12 12 20.2 3.8 12z" fill="currentColor" /></>,
  "cat-juvenil": <><path d="M12 3.6 20.4 9.7l-3.2 9.9H6.8L3.6 9.7z" fill="currentColor" /></>,
  "cat-senior": <><rect x="4.6" y="4.6" width="14.8" height="14.8" rx="1.6" fill="currentColor" /></>,
  "cat-otra": <><circle cx="12" cy="12" r="7.4" strokeDasharray="3 3" /></>,
};
/* Un icono. `n` es la clave; el color lo hereda de quien lo pinta
   (currentColor), así que sigue valiendo el mismo `style={{ color }}` que se
   usaba con los caracteres de antes. El desplazamiento vertical lo deja
   alineado cuando va suelto dentro de una línea de texto. */
const Icono = ({ n, s = 18, className = "", style }) => {
  const d = ICONOS[n];
  if (!d) return null;
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} className={className} aria-hidden="true" focusable="false"
      fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "-0.18em", flexShrink: 0, ...style }}>
      {d}
    </svg>
  );
};
/* Se mantiene el mapa por compatibilidad con lo que aún espera un carácter
   (títulos de pestaña sueltos), pero la navegación ya usa <Icono>. */
const TAB_ICON = {
  inicio: "▦", equipos: "⬢", equipo: "▥", jugadores: "◉", calendario: "▤", convocatoria: "▣",
  alineacion: "⬡", partido: "▶", analisis: "◎", entrenamiento: "◈", temporada: "◱", ejercicios: "≡", pizarra: "✎",
  disciplina: "⚑", normativa: "§", estadisticas: "◧", usuarios: "◍", coachai: "✦", asistencia: "☑",
  material: "◇", premium: "★", master: "❖",
};
/* Menú agrupado en siete apartados, en el orden real de la semana de un
   entrenador: primero con quién cuentas, luego el partido, luego lo que
   preparas entre semana, y al final lo transversal.
   Los grupos anteriores mezclaban criterios (un rol, "Entrenador", junto a
   tareas, "Prepara convocatoria", junto a momentos, "Día de partido") y tres
   de ellos tenían una sola pestaña. Cada grupo se salta si el rol no tiene
   ninguna de sus pestañas: el delegado y el segundo no ven las mismas.
   `label` es una clave de i18n (navg.*), no texto literal. */
const NAV_GROUPS = [
  /* Apartado exclusivo de la cuenta Master. No hace falta filtrarlo aquí: sus
     pestañas solo están en ROLES.master.tabs, así que a cualquier otro rol el
     grupo le sale vacío y agruparNav lo descarta. */
  { label: "navg.master", tabs: ["master", "equipos"] },
  { label: "navg.equipo", tabs: ["equipo", "jugadores"] },
  { label: "navg.partido", tabs: ["calendario", "convocatoria", "alineacion", "partido", "analisis"] },
  { label: "navg.entrenamiento", tabs: ["temporada", "entrenamiento", "ejercicios", "pizarra"] },
  { label: "navg.delegado", tabs: ["asistencia", "disciplina", "normativa"] },
  { label: "navg.estadisticas", tabs: ["estadisticas"] },
  { label: "navg.roles", tabs: ["usuarios"] },
  { label: "navg.coachai", tabs: ["coachai"] },
];
/* A partir de las pestañas visibles de este rol, arma la lista de grupos que
   le tocan (con sus pestañas, en el orden del grupo) más las que no entran en
   ningún grupo (Material, Premium) al final. Inicio va aparte, fijo arriba. */
const agruparNav = (visibleTabs) => {
  /* Las familias solo tienen "normativa" de todo el bloque del delegado, y
     encabezarle esa única entrada con "DELEGADO" es desconcertante: no son
     delegados ni lo van a ser. Cuando no hay disciplina, la normativa sale
     del grupo y baja con las sueltas. */
  const soloNormativa = visibleTabs.includes("normativa") && !visibleTabs.includes("disciplina");
  const grupos = NAV_GROUPS
    .map((g) => ({
      label: g.label,
      tabs: g.tabs.filter((k) => visibleTabs.includes(k) && !(soloNormativa && k === "normativa")),
    }))
    .filter((g) => g.tabs.length > 0);
  const enGrupo = new Set(grupos.flatMap((g) => g.tabs));
  const sueltas = visibleTabs.filter((k) => k !== "inicio" && !enGrupo.has(k));
  return { grupos, sueltas };
};

/* ---------------- Marketplace (demo) ---------------- */
/* ---------------- Material del entrenador · Amazon Afiliados ---------------- */
/* Tag de afiliado de EBLDigital. Cada marketplace de Amazon necesita su propio tag:
   coachai-21 es el de amazon.es, así que todos los enlaces apuntan ahí para que la
   comisión se registre. Cuando se den de alta .fr/.de/.co.uk, se añaden aquí. */
const AMZ_TAG = "coachai-21";
const AMZ_TAGS = { es: "coachai-21", fr: null, de: null, uk: null, it: null };
const AMZ_STORE = "https://www.amazon.es";
const amz = (q) => `${AMZ_STORE}/s?k=${encodeURIComponent(q)}&tag=${AMZ_TAG}`;
/* de "4 conos" saca una búsqueda útil: "conos fútbol entrenamiento" */
const amzMat = (m) => amz(String(m).replace(/^[\d\sx×]+/i, "").trim() + " fútbol entrenamiento");

const STORE = [
  /* --- Entrenamiento --- */
  { id: 1, cat: "training", icon: "🔶", q: "conos entrenamiento fútbol pack", name: { es: "Conos de disco", en: "Disc cones" }, desc: { es: "Para circuitos, rondos y delimitar espacios. Busca packs de 50.", en: "For circuits, rondos and marking areas. Look for 50-packs." } },
  { id: 2, cat: "training", icon: "🚩", q: "conos altos entrenamiento fútbol 30 cm", name: { es: "Conos altos 30 cm", en: "Tall cones 30 cm" }, desc: { es: "Visibles desde lejos, para slalom y porterías improvisadas.", en: "Visible from afar, for slaloms and improvised goals." } },
  { id: 3, cat: "training", icon: "🪜", q: "escalera de agilidad fútbol 6 metros", name: { es: "Escalera de agilidad", en: "Agility ladder" }, desc: { es: "Coordinación y activación. La de 6 m cubre casi todo.", en: "Coordination and activation. A 6 m one covers almost everything." } },
  { id: 4, cat: "training", icon: "🦺", q: "petos entrenamiento fútbol niños pack", name: { es: "Petos reversibles", en: "Reversible bibs" }, desc: { es: "Dos colores en uno. Imprescindibles para rondos y juegos de posición.", en: "Two colours in one. Essential for rondos and positional games." } },
  { id: 5, cat: "training", icon: "⚽", q: "balón fútbol talla 4 entrenamiento", name: { es: "Balones talla 4", en: "Size 4 balls" }, desc: { es: "Alevín e infantil. Talla 5 a partir de cadete.", en: "Under-12 and under-14. Size 5 from under-16 up." } },
  { id: 6, cat: "training", icon: "📍", q: "picas entrenamiento fútbol con base", name: { es: "Picas con base", en: "Training poles" }, desc: { es: "Slalom, barreras y referencias de posición.", en: "Slaloms, walls and positional references." } },
  { id: 7, cat: "training", icon: "⭕", q: "aros coordinación entrenamiento fútbol", name: { es: "Aros de coordinación", en: "Coordination hoops" }, desc: { es: "Trabajo de apoyos y saltos en calentamiento.", en: "Footwork and jumps during warm-up." } },
  { id: 8, cat: "training", icon: "🚧", q: "vallas agilidad entrenamiento fútbol 15 cm", name: { es: "Vallas de agilidad", en: "Agility hurdles" }, desc: { es: "Bajas, plegables. Cuidado con la altura en categorías pequeñas.", en: "Low, foldable. Mind the height for younger age groups." } },
  { id: 9, cat: "training", icon: "🧍", q: "muñeco barrera fútbol entrenamiento", name: { es: "Maniquí de barrera", en: "Free-kick dummy" }, desc: { es: "Para tiros libres y trabajo de ABP.", en: "For free kicks and set-piece work." } },
  { id: 10, cat: "training", icon: "🥅", q: "portería fútbol plegable entrenamiento", name: { es: "Portería plegable", en: "Pop-up goal" }, desc: { es: "Mini porterías para juegos reducidos.", en: "Mini goals for small-sided games." } },
  { id: 11, cat: "training", icon: "🎒", q: "saco portabalones fútbol", name: { es: "Saco portabalones", en: "Ball bag" }, desc: { es: "Mover 10-12 balones sin dos viajes al coche.", en: "Move 10-12 balls without two trips to the car." } },
  { id: 12, cat: "training", icon: "💨", q: "bomba inflar balones fútbol con manómetro", name: { es: "Bomba con manómetro", en: "Pump with gauge" }, desc: { es: "La presión correcta cambia el bote y el control.", en: "Correct pressure changes bounce and control." } },
  /* --- Porteros --- */
  { id: 13, cat: "gk", icon: "🧤", q: "guantes portero fútbol junior niño", name: { es: "Guantes de portero júnior", en: "Junior goalkeeper gloves" }, desc: { es: "Agarre para hierba mojada. Mide la mano antes de comprar.", en: "Grip for wet grass. Measure the hand before buying." } },
  { id: 14, cat: "gk", icon: "🦵", q: "pantalón portero fútbol acolchado niño", name: { es: "Pantalón acolchado", en: "Padded GK trousers" }, desc: { es: "Protege caderas y rodillas en campos duros.", en: "Protects hips and knees on hard pitches." } },
  { id: 15, cat: "gk", icon: "🛡", q: "rodilleras codaleras portero fútbol", name: { es: "Rodilleras y codaleras", en: "Knee and elbow pads" }, desc: { es: "Para porteros que aún tienen miedo a tirarse.", en: "For keepers still afraid to dive." } },
  /* --- Botiquín --- */
  { id: 16, cat: "medical", icon: "🩹", q: "botiquín deportivo fútbol equipo", name: { es: "Botiquín de banquillo", en: "Touchline first-aid kit" }, desc: { es: "Obligatorio en muchas competiciones. Revísalo cada mes.", en: "Mandatory in many competitions. Check it monthly." } },
  { id: 17, cat: "medical", icon: "❄️", q: "spray frío deportivo", name: { es: "Spray frío", en: "Cold spray" }, desc: { es: "Alivio inmediato de golpes. No sustituye a un diagnóstico.", en: "Instant relief for knocks. Not a diagnosis." } },
  { id: 18, cat: "medical", icon: "🧊", q: "bolsa frío instantáneo deportiva pack", name: { es: "Hielo instantáneo", en: "Instant cold packs" }, desc: { es: "Sin nevera. Uno por bolsa de partido.", en: "No cooler needed. One per matchday bag." } },
  { id: 19, cat: "medical", icon: "🩶", q: "tape vendaje funcional deportivo", name: { es: "Tape funcional", en: "Athletic tape" }, desc: { es: "Tobillos y dedos. Aprende a ponerlo antes de necesitarlo.", en: "Ankles and fingers. Learn to apply it before you need it." } },
  /* --- Tecnología --- */
  { id: 20, cat: "tech", icon: "📋", q: "pizarra táctica magnética fútbol entrenador", name: { es: "Pizarra magnética", en: "Magnetic tactics board" }, desc: { es: "Respaldo analógico para cuando no hay batería.", en: "Analogue backup for when the battery dies." } },
  { id: 21, cat: "tech", icon: "📣", q: "silbato árbitro fútbol profesional", name: { es: "Silbato", en: "Whistle" }, desc: { es: "Uno potente y otro de repuesto en la bolsa.", en: "A loud one plus a spare in the bag." } },
  { id: 22, cat: "tech", icon: "⏱", q: "cronómetro digital entrenador deportivo", name: { es: "Cronómetro", en: "Stopwatch" }, desc: { es: "Para bloques de entrenamiento sin depender del móvil.", en: "For training blocks without relying on your phone." } },
  { id: 23, cat: "tech", icon: "📱", q: "trípode móvil grabar partidos fútbol altura", name: { es: "Trípode para grabar", en: "Recording tripod" }, desc: { es: "Cuanto más alto, mejor se lee el juego en el vídeo.", en: "The higher it is, the better the game reads on video." } },
  { id: 24, cat: "tech", icon: "🔋", q: "batería externa power bank 20000", name: { es: "Batería externa", en: "Power bank" }, desc: { es: "Modo partido y cronómetro gastan pantalla.", en: "Match mode and the clock drain the screen." } },
  /* --- Vestuario --- */
  { id: 25, cat: "apparel", icon: "🧥", q: "chándal entrenador fútbol", name: { es: "Chándal de entrenador", en: "Coach tracksuit" }, desc: { es: "Transpirable y con bolsillos con cremallera.", en: "Breathable, with zipped pockets." } },
  { id: 26, cat: "apparel", icon: "🌧", q: "chubasquero técnico impermeable deportivo", name: { es: "Chubasquero técnico", en: "Technical rain jacket" }, desc: { es: "En febrero se entrena igual.", en: "Training happens in February too." } },
  { id: 27, cat: "apparel", icon: "👟", q: "zapatillas fútbol turf césped artificial", name: { es: "Zapatillas de turf", en: "Turf trainers" }, desc: { es: "Para dar sesiones sin destrozarte las rodillas.", en: "To run sessions without wrecking your knees." } },
  { id: 28, cat: "apparel", icon: "🎽", q: "mochila entrenador fútbol grande", name: { es: "Mochila de entrenador", en: "Coach backpack" }, desc: { es: "Con compartimento para botas y portátil.", en: "With boot and laptop compartments." } },
];

/* ---------------- Pizarra táctica ---------------- */
/* ---------------- Sistemas tácticos (F11 / F7) ---------------- */
const F11_CODES = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "3-4-3", "5-3-2"];
const F7_CODES = ["2-3-1", "3-2-1", "3-1-2", "1-4-1"];

// Genera puntos [x,y] (viewBox 1000x640) para un código de sistema ("4-3-3", "2-3-1"...).
// El primer punto siempre es el portero; el resto se reparte en líneas equidistantes.
function buildFormationPts(code, isF7) {
  const lines = String(code).split("-").map(Number).filter((n) => n > 0);
  const xDef = isF7 ? 250 : 220, xFwd = isF7 ? 560 : 640;
  const n = lines.length;
  const pts = [[90, 320]];
  lines.forEach((count, i) => {
    const x = n === 1 ? (xDef + xFwd) / 2 : xDef + (i * (xFwd - xDef)) / (n - 1);
    for (let k = 0; k < count; k++) {
      const y = count === 1 ? 320 : 100 + (k * (540 - 100)) / (count - 1);
      pts.push([x, y]);
    }
  });
  return pts;
}

/* ---------------- Ejercicios de entrenamiento recomendados ----------------
   Cada ejercicio coloca fichas/conos/flechas ya preparados en la pizarra. */
const EX_CATS = ["warmup", "rondo", "buildup", "finish", "cross", "press", "defense", "duel", "setpiece", "technique", "fitness", "gk"];
const EXERCISES = [
  {
    id: "rondo", icon: "🔄", cat: "rondo", dur: 15, materials: { es: ["4 conos", "1 balón"], en: ["4 cones", "1 ball"] },
    name: { es: "Rondo 5v1", en: "5v1 rondo", fr: "Rondo 5v1", de: "5-gegen-1-Rondo", pt: "Rondo 5x1" },
    desc: { es: "Posesión en espacio reducido. 5 jugadores mantienen el balón, 1 defensor presiona en el centro.", en: "Small-space possession. 5 players keep the ball, 1 defender presses in the middle." },
    build: () => {
      const cx = 500, cy = 320, r = 110;
      const tokens = [];
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; tokens.push({ type: "home", x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), label: String(i + 1) }); }
      tokens.push({ type: "away", x: cx, y: cy, label: "1" });
      tokens.push({ type: "ball", x: cx + r, y: cy, label: "" });
      [[cx, cy - r - 40], [cx + r + 40, cy], [cx, cy + r + 40], [cx - r - 40, cy]].forEach((p) => tokens.push({ type: "cone", x: p[0], y: p[1], label: "" }));
      return { tokens, shapes: [] };
    },
  },
  {
    id: "finish", icon: "🎯", cat: "finish", dur: 20, materials: { es: ["8 balones", "4 petos"], en: ["8 balls", "4 bibs"] },
    name: { es: "Finalización por bandas", en: "Wing finishing", fr: "Finition par les côtés", de: "Abschluss über die Flügel", pt: "Finalização pelas alas" },
    desc: { es: "Centros desde ambas bandas para rematar en el área con dos delanteros.", en: "Crosses from both flanks for two forwards to finish in the box." },
    build: () => ({
      tokens: [
        { type: "home", x: 120, y: 570, label: "7" }, { type: "home", x: 120, y: 70, label: "11" },
        { type: "home", x: 800, y: 260, label: "9" }, { type: "home", x: 720, y: 400, label: "10" },
        { type: "away", x: 870, y: 250, label: "4" }, { type: "away", x: 870, y: 400, label: "5" },
        { type: "ball", x: 120, y: 570, label: "" },
      ],
      shapes: [
        { tool: "pass", pts: [{ x: 120, y: 570 }, { x: 780, y: 480 }] },
        { tool: "arrow", pts: [{ x: 780, y: 480 }, { x: 820, y: 300 }] },
        { tool: "pass", pts: [{ x: 120, y: 70 }, { x: 800, y: 150 }] },
      ],
    }),
  },
  {
    id: "press", icon: "🧲", cat: "press", dur: 15, materials: { es: ["4 petos"], en: ["4 bibs"] },
    name: { es: "Presión tras pérdida", en: "Counter-press", fr: "Pressing après perte", de: "Gegenpressing", pt: "Pressão após perda" },
    desc: { es: "Los 5 segundos tras perder el balón: cerrar líneas de pase y recuperar rápido.", en: "The five seconds after losing the ball: close passing lanes and win it back fast." },
    build: () => ({
      tokens: [
        { type: "away", x: 560, y: 320, label: "6" },
        { type: "home", x: 460, y: 200, label: "8" }, { type: "home", x: 460, y: 440, label: "10" },
        { type: "home", x: 380, y: 320, label: "9" }, { type: "home", x: 340, y: 150, label: "3" }, { type: "home", x: 340, y: 490, label: "5" },
        { type: "ball", x: 560, y: 320, label: "" },
      ],
      shapes: [
        { tool: "arrow", pts: [{ x: 460, y: 200 }, { x: 555, y: 300 }] },
        { tool: "arrow", pts: [{ x: 460, y: 440 }, { x: 555, y: 340 }] },
        { tool: "arrow", pts: [{ x: 380, y: 320 }, { x: 530, y: 320 }] },
      ],
    }),
  },
  {
    id: "buildup", icon: "🧩", cat: "buildup", dur: 20, materials: { es: ["6 conos", "petos"], en: ["6 cones", "bibs"] },
    name: { es: "Salida de balón en línea de 3", en: "Build-up from a back three", fr: "Relance à trois défenseurs", de: "Spielaufbau mit Dreierkette", pt: "Saída de bola em linha de 3" },
    desc: { es: "Progresar el balón desde atrás superando la primera línea de presión rival.", en: "Progress the ball from the back, beating the rival's first press line." },
    build: () => ({
      tokens: [
        { type: "home", x: 90, y: 320, label: "1" },
        { type: "home", x: 220, y: 190, label: "3" }, { type: "home", x: 220, y: 320, label: "4" }, { type: "home", x: 220, y: 450, label: "5" },
        { type: "home", x: 420, y: 250, label: "6" }, { type: "home", x: 420, y: 390, label: "8" },
        { type: "away", x: 340, y: 250, label: "9" }, { type: "away", x: 340, y: 390, label: "10" },
        { type: "ball", x: 220, y: 320, label: "" },
      ],
      shapes: [
        { tool: "pass", pts: [{ x: 220, y: 320 }, { x: 220, y: 190 }] },
        { tool: "pass", pts: [{ x: 220, y: 190 }, { x: 420, y: 250 }] },
        { tool: "arrow", pts: [{ x: 420, y: 250 }, { x: 560, y: 260 }] },
      ],
    }),
  },
  {
    id: "corner", icon: "🚩", cat: "setpiece", dur: 15, materials: { es: ["conos", "petos"], en: ["cones", "bibs"] },
    name: { es: "Córner ofensivo", en: "Attacking corner kick", fr: "Corner offensif", de: "Angriffsecke", pt: "Canto ofensivo" },
    desc: { es: "Movimientos de ataque en el saque de esquina: bloqueo, primer palo y remate.", en: "Attacking movement patterns from a corner: block, near post and finish." },
    build: () => ({
      tokens: [
        { type: "home", x: 970, y: 20, label: "C" },
        { type: "home", x: 860, y: 220, label: "5" }, { type: "home", x: 900, y: 320, label: "9" }, { type: "home", x: 860, y: 420, label: "4" }, { type: "home", x: 800, y: 320, label: "10" },
        { type: "away", x: 930, y: 260, label: "3" }, { type: "away", x: 930, y: 380, label: "6" }, { type: "away", x: 940, y: 320, label: "1" },
        { type: "ball", x: 970, y: 20, label: "" },
      ],
      shapes: [
        { tool: "pass", pts: [{ x: 970, y: 20 }, { x: 900, y: 320 }] },
        { tool: "arrow", pts: [{ x: 860, y: 420 }, { x: 900, y: 340 }] },
      ],
    }),
  },
  {
    id: "dribble", icon: "⛳", cat: "technique", dur: 10, materials: { es: ["6 conos", "1 balón"], en: ["6 cones", "1 ball"] },
    name: { es: "Circuito de conducción (conos)", en: "Cone dribbling circuit", fr: "Circuit de conduite (plots)", de: "Dribbelparcours (Hütchen)", pt: "Circuito de condução (cones)" },
    desc: { es: "Slalom individual de conducción de balón para mejorar el control y el cambio de ritmo.", en: "Individual slalom to improve ball control and change of pace." },
    build: () => {
      const tokens = [{ type: "home", x: 90, y: 320, label: "1" }, { type: "ball", x: 90, y: 320, label: "" }];
      const xs = [220, 340, 460, 580, 700, 820];
      xs.forEach((x, i) => tokens.push({ type: "cone", x, y: i % 2 ? 220 : 420, label: "" }));
      const pts = [{ x: 90, y: 320 }, ...xs.map((x, i) => ({ x, y: i % 2 ? 220 : 420 }))];
      return { tokens, shapes: [{ tool: "free", pts }] };
    },
  },
  {
    id: "freekick", icon: "🎯", cat: "setpiece", dur: 15, materials: { es: ["conos (barrera)", "balones"], en: ["cones (wall)", "balls"] },
    name: { es: "Tiro libre directo", en: "Direct free kick", fr: "Coup franc direct", de: "Direkter Freistoß", pt: "Livre direto" },
    desc: { es: "Lanzador, barrera de 3-4 y dos rematadores atacando el rechace.", en: "Taker, a 3-4 player wall and two attackers crashing the rebound." },
    build: () => ({
      tokens: [
        { type: "home", x: 740, y: 320, label: "8" }, { type: "ball", x: 740, y: 320, label: "" },
        { type: "away", x: 820, y: 290, label: "2" }, { type: "away", x: 820, y: 320, label: "5" }, { type: "away", x: 820, y: 350, label: "6" },
        { type: "away", x: 940, y: 320, label: "1" },
        { type: "home", x: 700, y: 220, label: "9" }, { type: "home", x: 700, y: 420, label: "10" },
      ],
      shapes: [
        { tool: "arrow", pts: [{ x: 740, y: 320 }, { x: 960, y: 260 }] },
        { tool: "arrow", pts: [{ x: 700, y: 220 }, { x: 860, y: 260 }] },
        { tool: "arrow", pts: [{ x: 700, y: 420 }, { x: 860, y: 380 }] },
      ],
    }),
  },
  {
    id: "throwin", icon: "🤾", cat: "setpiece", dur: 10, materials: { es: ["1 balón"], en: ["1 ball"] },
    name: { es: "Saque de banda largo", en: "Long throw-in", fr: "Longue touche", de: "Weiter Einwurf", pt: "Lançamento longo" },
    desc: { es: "Saque de banda al área con un remate al primer palo y un rechace al segundo.", en: "Throw-in into the box with a near-post flick and a second-ball runner." },
    build: () => ({
      tokens: [
        { type: "home", x: 760, y: 12, label: "3" }, { type: "ball", x: 760, y: 12, label: "" },
        { type: "home", x: 880, y: 280, label: "9" }, { type: "home", x: 880, y: 400, label: "10" },
        { type: "away", x: 890, y: 270, label: "4" }, { type: "away", x: 890, y: 410, label: "5" },
      ],
      shapes: [
        { tool: "pass", pts: [{ x: 760, y: 12 }, { x: 880, y: 280 }] },
        { tool: "arrow", pts: [{ x: 880, y: 280 }, { x: 880, y: 400 }] },
      ],
    }),
  },
  {
    id: "penalty", icon: "🥅", cat: "setpiece", dur: 10, materials: { es: ["balones"], en: ["balls"] },
    name: { es: "Lanzamiento de penaltis", en: "Penalty taking", fr: "Tir de penalty", de: "Elfmeterschießen", pt: "Marcação de penáltis" },
    desc: { es: "Rutina de lanzamiento de penaltis con portero, para lanzadores y para el guardameta.", en: "Penalty-taking routine with a goalkeeper, for both takers and the keeper." },
    build: () => ({
      tokens: [
        { type: "home", x: 850, y: 320, label: "10" }, { type: "ball", x: 880, y: 320, label: "" },
        { type: "away", x: 970, y: 320, label: "1" },
      ],
      shapes: [{ tool: "arrow", pts: [{ x: 880, y: 320 }, { x: 985, y: 280 }] }],
    }),
  },
  {
    id: "possession", icon: "🟢", cat: "rondo", dur: 20, materials: { es: ["4 conos", "petos", "2 balones"], en: ["4 cones", "bibs", "2 balls"] },
    name: { es: "Posesión 6v2 en zona", en: "6v2 possession box", fr: "Possession 6v2", de: "6-gegen-2-Ballbesitz", pt: "Posse 6x2" },
    desc: { es: "Juego de posición en zona amplia: 6 jugadores frente a 2 defensores.", en: "Positional play in a wide zone: 6 players against 2 defenders." },
    build: () => {
      const cx = 500, cy = 320, half = 170;
      const tokens = [];
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 - Math.PI / 2; tokens.push({ type: "home", x: cx + half * Math.cos(a), y: cy + half * 0.85 * Math.sin(a), label: String(i + 1) }); }
      tokens.push({ type: "away", x: cx - 40, y: cy, label: "1" }, { type: "away", x: cx + 40, y: cy, label: "2" });
      tokens.push({ type: "ball", x: cx + half, y: cy, label: "" });
      [[cx - half, cy - half * 0.85], [cx + half, cy - half * 0.85], [cx + half, cy + half * 0.85], [cx - half, cy + half * 0.85]].forEach((p) => tokens.push({ type: "cone", x: p[0], y: p[1], label: "" }));
      return { tokens, shapes: [] };
    },
  },
  {
    id: "transition", icon: "⚡", cat: "press", dur: 15, materials: { es: ["petos", "balones"], en: ["bibs", "balls"] },
    name: { es: "Transición ofensiva 4v4", en: "4v4 attacking transition", fr: "Transition offensive 4v4", de: "4-gegen-4-Umschalten", pt: "Transição ofensiva 4x4" },
    desc: { es: "Al recuperar el balón en el centro del campo, atacar rápido antes de que el rival se reorganice.", en: "On winning the ball at the halfway line, attack quickly before the opponent resets." },
    build: () => ({
      tokens: [
        { type: "home", x: 300, y: 220, label: "3" }, { type: "home", x: 300, y: 420, label: "5" },
        { type: "home", x: 430, y: 260, label: "8" }, { type: "home", x: 430, y: 380, label: "10" },
        { type: "away", x: 650, y: 240, label: "4" }, { type: "away", x: 650, y: 400, label: "5" },
        { type: "away", x: 760, y: 260, label: "6" }, { type: "away", x: 760, y: 380, label: "8" },
        { type: "ball", x: 500, y: 320, label: "" },
      ],
      shapes: [
        { tool: "arrow", pts: [{ x: 430, y: 260 }, { x: 700, y: 220 }] },
        { tool: "arrow", pts: [{ x: 430, y: 380 }, { x: 700, y: 420 }] },
        { tool: "arrow", pts: [{ x: 500, y: 320 }, { x: 620, y: 320 }] },
      ],
    }),
  },
  {
    id: "finish1v1", icon: "🥇", cat: "finish", dur: 15, materials: { es: ["2 conos", "balones"], en: ["2 cones", "balls"] },
    name: { es: "1 contra 1 con portero", en: "1v1 vs the goalkeeper", fr: "1 contre 1 avec gardien", de: "1-gegen-1 mit Torwart", pt: "1x1 com guarda-redes" },
    desc: { es: "Duelo individual atacante-defensor terminando en remate a portería.", en: "Individual attacker-vs-defender duel finishing with a shot on goal." },
    build: () => ({
      tokens: [
        { type: "home", x: 760, y: 320, label: "9" }, { type: "ball", x: 760, y: 320, label: "" },
        { type: "away", x: 820, y: 320, label: "4" }, { type: "away", x: 940, y: 320, label: "1" },
        { type: "cone", x: 700, y: 280, label: "" }, { type: "cone", x: 700, y: 360, label: "" },
      ],
      shapes: [{ tool: "arrow", pts: [{ x: 760, y: 320 }, { x: 900, y: 280 }] }],
    }),
  },
  {
    id: "gkwork", icon: "🧤", cat: "gk", dur: 15, materials: { es: ["4 conos", "balones"], en: ["4 cones", "balls"] },
    name: { es: "Reflejos de portero", en: "Goalkeeper reflexes", fr: "Réflexes du gardien", de: "Torwart-Reflexe", pt: "Reflexos do guarda-redes" },
    desc: { es: "Trabajo específico de portero: paradas desde distintos ángulos servidas por el entrenador.", en: "Goalkeeper-specific work: saves from different angles fed by the coach." },
    build: () => ({
      tokens: [
        { type: "home", x: 90, y: 320, label: "1" }, { type: "home", x: 260, y: 320, label: "C" }, { type: "ball", x: 260, y: 320, label: "" },
        { type: "cone", x: 220, y: 150, label: "" }, { type: "cone", x: 220, y: 250, label: "" }, { type: "cone", x: 220, y: 390, label: "" }, { type: "cone", x: 220, y: 490, label: "" },
      ],
      shapes: [{ tool: "arrow", pts: [{ x: 260, y: 320 }, { x: 100, y: 260 }] }],
    }),
  },
  {
    id: "fitness", icon: "🏃", cat: "fitness", dur: 12, materials: { es: ["6 conos"], en: ["6 cones"] },
    name: { es: "Circuito físico por intervalos", en: "Interval fitness circuit", fr: "Circuit physique par intervalles", de: "Intervall-Fitnesszirkel", pt: "Circuito físico por intervalos" },
    desc: { es: "Circuito continuo de conos para trabajar resistencia y cambios de dirección.", en: "Continuous cone loop to train endurance and change of direction." },
    build: () => {
      const pts = [[150, 150], [500, 100], [850, 150], [850, 490], [500, 540], [150, 490], [150, 150]];
      const tokens = pts.slice(0, -1).map((p) => ({ type: "cone", x: p[0], y: p[1], label: "" }));
      tokens.push({ type: "home", x: 150, y: 150, label: "1" });
      return { tokens, shapes: [{ tool: "free", pts: pts.map(([x, y]) => ({ x, y })) }] };
    },
  },
  {
    id: "warmball", icon: "🔥", cat: "warmup", dur: 10, materials: { es: ["6 conos", "3 balones"], en: ["6 cones", "3 balls"] },
    name: { es: "Calentamiento con balón", en: "Ball warm-up", fr: "Échauffement avec ballon", de: "Aufwärmen mit Ball", pt: "Aquecimento com bola" },
    desc: { es: "Círculo amplio de pases con desplazamiento tras pase. Activa el cuerpo y la cabeza a la vez.", en: "Wide passing circle, follow your pass. Activates body and mind together." },
    build: () => {
      const cx = 500, cy = 320, r = 190, tokens = [];
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 - Math.PI / 2; tokens.push({ type: "home", x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), label: String(i + 1) }); }
      tokens.push({ type: "ball", x: cx + r, y: cy - 20, label: "" });
      tokens.push({ type: "ball", x: cx - r, y: cy + 20, label: "" });
      return { tokens, shapes: [{ tool: "pass", pts: [{ x: cx + r, y: cy - 20 }, { x: cx, y: cy - r }] }] };
    },
  },
  {
    id: "coord", icon: "🪜", cat: "warmup", dur: 8, materials: { es: ["escalera", "8 conos"], en: ["ladder", "8 cones"] },
    name: { es: "Activación coordinativa", en: "Coordination activation", fr: "Activation coordination", de: "Koordinationsaktivierung", pt: "Ativação coordenativa" },
    desc: { es: "Escalera de coordinación y slalom de conos antes de la parte principal. Series cortas y máxima calidad.", en: "Coordination ladder and cone slalom before the main part. Short sets, maximum quality." },
    build: () => {
      const tokens = [];
      for (let i = 0; i < 8; i++) tokens.push({ type: "cone", x: 200 + i * 70, y: 260, label: "" });
      for (let i = 0; i < 6; i++) tokens.push({ type: "cone", x: 240 + i * 90, y: 420, label: "" });
      tokens.push({ type: "home", x: 140, y: 260, label: "1" });
      tokens.push({ type: "home", x: 140, y: 420, label: "2" });
      return { tokens, shapes: [{ tool: "free", pts: [{ x: 240, y: 420 }, { x: 285, y: 380 }, { x: 330, y: 460 }, { x: 375, y: 380 }, { x: 420, y: 460 }, { x: 465, y: 380 }, { x: 510, y: 460 }, { x: 600, y: 420 }] }] };
    },
  },
  {
    id: "zone4", icon: "🛡", cat: "defense", dur: 15, materials: { es: ["petos", "4 conos"], en: ["bibs", "4 cones"] },
    name: { es: "Defensa en zona: línea de 4", en: "Zonal defending: back four", fr: "Défense de zone : ligne de 4", de: "Raumdeckung: Viererkette", pt: "Defesa à zona: linha de 4" },
    desc: { es: "La línea se mueve junta según dónde está el balón. Trabajo de distancias, perfiles y coberturas.", en: "The back four moves as a unit with the ball. Distances, body shape and cover." },
    /* La línea defiende una portería, así que va en vertical —cuatro fichas a
       la misma altura de campo y repartidas de banda a banda—, no en fila a lo
       largo del campo, que es como estaba y no defendía nada. La portería que
       se protege es la de la izquierda; la basculación es hacia el balón. */
    build: () => {
      const tokens = [];
      [110, 250, 390, 530].forEach((y, i) => tokens.push({ type: "home", x: 300, y, label: String(i + 2) }));
      tokens.push({ type: "home", x: 60, y: 320, label: "1" });
      tokens.push({ type: "away", x: 470, y: 180, label: "9" });
      tokens.push({ type: "away", x: 500, y: 430, label: "11" });
      tokens.push({ type: "ball", x: 490, y: 195, label: "" });
      return { tokens, shapes: [
        { tool: "arrow", pts: [{ x: 300, y: 530 }, { x: 300, y: 420 }] },
        { tool: "arrow", pts: [{ x: 300, y: 390 }, { x: 300, y: 300 }] },
        { tool: "arrow", pts: [{ x: 300, y: 110 }, { x: 330, y: 170 }] },
      ] };
    },
  },
  {
    id: "recover", icon: "↩", cat: "defense", dur: 15, materials: { es: ["petos", "balones"], en: ["bibs", "balls"] },
    name: { es: "Repliegue y basculación", en: "Recovery and shifting", fr: "Repli et bascule", de: "Zurückfallen und Verschieben", pt: "Recuo e basculação" },
    desc: { es: "Tras pérdida, el bloque repliega ordenado y bascula al lado del balón sin abrir pasillos interiores.", en: "After losing the ball the block drops in order and shifts ball-side without opening inside lanes." },
    /* Dos líneas, las dos en vertical delante de la portería propia: la de
       cuatro atrás y la de tres por delante, basculando las dos al lado del
       balón. Antes estaban tumbadas a lo ancho del campo, con lo que el bloque
       no tapaba nada. */
    build: () => {
      const tokens = [];
      [140, 320, 500].forEach((y, i) => tokens.push({ type: "home", x: 430, y, label: String(i + 6) }));
      [110, 250, 390, 530].forEach((y, i) => tokens.push({ type: "home", x: 280, y, label: String(i + 2) }));
      tokens.push({ type: "home", x: 60, y: 320, label: "1" });
      tokens.push({ type: "away", x: 620, y: 150, label: "10" });
      tokens.push({ type: "ball", x: 640, y: 165, label: "" });
      return { tokens, shapes: [
        { tool: "arrow", pts: [{ x: 430, y: 500 }, { x: 430, y: 380 }] },
        { tool: "arrow", pts: [{ x: 430, y: 140 }, { x: 470, y: 200 }] },
        { tool: "arrow", pts: [{ x: 280, y: 530 }, { x: 280, y: 430 }] },
      ] };
    },
  },
  {
    id: "cross", icon: "📤", cat: "cross", dur: 20, materials: { es: ["balones", "conos"], en: ["balls", "cones"] },
    name: { es: "Centros laterales y remate", en: "Wide crosses and finishing", fr: "Centres et finition", de: "Flanken und Abschluss", pt: "Cruzamentos e finalização" },
    desc: { es: "Centro desde banda con tres llegadas: primer palo, punto de penalti y segundo palo. Alternar lados.", en: "Cross from wide with three runs: near post, penalty spot and far post. Alternate sides." },
    build: () => {
      const tokens = [
        { type: "home", x: 130, y: 200, label: "7" },
        { type: "home", x: 620, y: 190, label: "9" },
        { type: "home", x: 660, y: 300, label: "10" },
        { type: "home", x: 700, y: 410, label: "11" },
        { type: "away", x: 800, y: 300, label: "P" },
        { type: "ball", x: 150, y: 215, label: "" },
      ];
      [[560, 120], [560, 480]].forEach((p) => tokens.push({ type: "cone", x: p[0], y: p[1], label: "" }));
      return { tokens, shapes: [
        { tool: "pass", pts: [{ x: 150, y: 210 }, { x: 660, y: 250 }] },
        { tool: "arrow", pts: [{ x: 620, y: 190 }, { x: 700, y: 230 }] },
        { tool: "arrow", pts: [{ x: 700, y: 410 }, { x: 740, y: 340 }] },
      ] };
    },
  },
  {
    id: "duel1v1", icon: "⚔", cat: "duel", dur: 12, materials: { es: ["4 conos", "balones"], en: ["4 cones", "balls"] },
    name: { es: "1v1 defensivo", en: "Defensive 1v1", fr: "1v1 défensif", de: "1-gegen-1 defensiv", pt: "1x1 defensivo" },
    desc: { es: "Duelo en pasillo estrecho. El defensor orienta al atacante a su pierna mala y temporiza.", en: "Duel in a narrow channel. The defender shows the attacker onto his weak foot and delays." },
    build: () => {
      const tokens = [
        { type: "home", x: 300, y: 320, label: "A" },
        { type: "away", x: 620, y: 320, label: "D" },
        { type: "ball", x: 320, y: 335, label: "" },
      ];
      [[250, 200], [250, 440], [720, 200], [720, 440]].forEach((p) => tokens.push({ type: "cone", x: p[0], y: p[1], label: "" }));
      return { tokens, shapes: [{ tool: "arrow", pts: [{ x: 300, y: 320 }, { x: 600, y: 260 }] }] };
    },
  },
  {
    id: "sup32", icon: "➕", cat: "buildup", dur: 15, materials: { es: ["petos", "balones"], en: ["bibs", "balls"] },
    name: { es: "Superioridad 3v2", en: "3v2 overload", fr: "Supériorité 3v2", de: "3-gegen-2-Überzahl", pt: "Superioridade 3x2" },
    desc: { es: "Atacar la superioridad: fijar al defensor antes de pasar y terminar la jugada en menos de 8 segundos.", en: "Attack the overload: fix the defender before passing and finish within 8 seconds." },
    build: () => {
      const tokens = [
        { type: "home", x: 350, y: 200, label: "1" },
        { type: "home", x: 350, y: 440, label: "2" },
        { type: "home", x: 480, y: 320, label: "3" },
        { type: "away", x: 640, y: 250, label: "D" },
        { type: "away", x: 640, y: 400, label: "D" },
        { type: "ball", x: 500, y: 335, label: "" },
      ];
      return { tokens, shapes: [
        { tool: "pass", pts: [{ x: 490, y: 320 }, { x: 360, y: 210 }] },
        { tool: "arrow", pts: [{ x: 480, y: 320 }, { x: 620, y: 330 }] },
      ] };
    },
  },
  {
    id: "gkfeet", icon: "🦶", cat: "gk", dur: 15, materials: { es: ["conos", "balones", "petos"], en: ["cones", "balls", "bibs"] },
    name: { es: "Salida del portero con los pies", en: "Goalkeeper distribution", fr: "Relance du gardien au pied", de: "Torwart-Spielaufbau", pt: "Saída do guarda-redes com os pés" },
    desc: { es: "El portero inicia el juego bajo presión: apoyos abiertos, primer control orientado y decisión rápida.", en: "The keeper starts play under pressure: wide options, open first touch and a quick decision." },
    build: () => {
      const tokens = [
        { type: "home", x: 160, y: 320, label: "P" },
        { type: "home", x: 300, y: 170, label: "2" },
        { type: "home", x: 300, y: 470, label: "3" },
        { type: "home", x: 470, y: 320, label: "5" },
        { type: "away", x: 380, y: 320, label: "9" },
        { type: "ball", x: 185, y: 335, label: "" },
      ];
      return { tokens, shapes: [
        { tool: "pass", pts: [{ x: 180, y: 320 }, { x: 300, y: 180 }] },
        { tool: "pass", pts: [{ x: 180, y: 330 }, { x: 300, y: 460 }] },
      ] };
    },
  },
  {
    id: "rondo42", icon: "🔁", cat: "rondo", dur: 15, materials: { es: ["6 conos", "2 balones", "petos"], en: ["6 cones", "2 balls", "bibs"] },
    name: { es: "Rondo 4v2 con apoyos", en: "4v2 rondo with support", fr: "Rondo 4v2 avec appuis", de: "4-gegen-2-Rondo mit Anspielstationen", pt: "Rondo 4x2 com apoios" },
    desc: { es: "Cuadrado con dos comodines exteriores. Buscar el pase interior antes que el fácil de fuera.", en: "Square with two outside jokers. Look for the inside pass before the easy outside one." },
    build: () => {
      const tokens = [
        { type: "home", x: 340, y: 190, label: "1" }, { type: "home", x: 660, y: 190, label: "2" },
        { type: "home", x: 660, y: 450, label: "3" }, { type: "home", x: 340, y: 450, label: "4" },
        { type: "home", x: 500, y: 130, label: "C" }, { type: "home", x: 500, y: 510, label: "C" },
        { type: "away", x: 450, y: 300, label: "D" }, { type: "away", x: 560, y: 340, label: "D" },
        { type: "ball", x: 360, y: 205, label: "" },
      ];
      [[300, 150], [700, 150], [700, 490], [300, 490]].forEach((p) => tokens.push({ type: "cone", x: p[0], y: p[1], label: "" }));
      return { tokens, shapes: [{ tool: "pass", pts: [{ x: 350, y: 195 }, { x: 655, y: 440 }] }] };
    },
  },
  {
    id: "passctrl", icon: "🎽", cat: "technique", dur: 12, materials: { es: ["8 conos", "4 balones"], en: ["8 cones", "4 balls"] },
    name: { es: "Circuito de pase y control", en: "Passing and control circuit", fr: "Circuit passe et contrôle", de: "Pass- und Annahme-Parcours", pt: "Circuito de passe e controlo" },
    desc: { es: "Rombo de pases con control orientado y cambio de sentido cada dos vueltas. Calidad por encima de velocidad.", en: "Passing diamond with an open first touch, changing direction every two laps. Quality over speed." },
    build: () => {
      const pts = [[500, 150], [750, 320], [500, 490], [250, 320]];
      const tokens = pts.map((p, i) => ({ type: "home", x: p[0], y: p[1], label: String(i + 1) }));
      pts.forEach((p) => tokens.push({ type: "cone", x: p[0], y: p[1] + 45, label: "" }));
      tokens.push({ type: "ball", x: 520, y: 165, label: "" });
      return { tokens, shapes: [
        { tool: "pass", pts: [{ x: 510, y: 155 }, { x: 745, y: 315 }] },
        { tool: "pass", pts: [{ x: 745, y: 325 }, { x: 510, y: 485 }] },
        { tool: "pass", pts: [{ x: 490, y: 485 }, { x: 255, y: 325 }] },
      ] };
    },
  },
  {
    id: "counter3", icon: "🏹", cat: "press", dur: 15, materials: { es: ["petos", "balones"], en: ["bibs", "balls"] },
    name: { es: "Contraataque 3v1", en: "3v1 counter-attack", fr: "Contre-attaque 3v1", de: "Konter 3-gegen-1", pt: "Contra-ataque 3x1" },
    desc: { es: "Tras robo, salir en tres y terminar antes de que llegue la ayuda. Amplitud y último pase al espacio.", en: "After the steal, break in threes and finish before help arrives. Width and a final pass into space." },
    build: () => {
      const tokens = [
        { type: "home", x: 250, y: 320, label: "8" },
        { type: "home", x: 300, y: 140, label: "7" },
        { type: "home", x: 300, y: 500, label: "11" },
        { type: "away", x: 560, y: 320, label: "D" },
        { type: "away", x: 830, y: 320, label: "P" },
        { type: "ball", x: 275, y: 335, label: "" },
      ];
      return { tokens, shapes: [
        { tool: "arrow", pts: [{ x: 300, y: 140 }, { x: 700, y: 180 }] },
        { tool: "arrow", pts: [{ x: 300, y: 500 }, { x: 700, y: 460 }] },
        { tool: "pass", pts: [{ x: 270, y: 320 }, { x: 690, y: 190 }] },
      ] };
    },
  },
  {
    id: "posgame", icon: "♟", cat: "buildup", dur: 20, materials: { es: ["8 conos", "petos 3 colores", "balones"], en: ["8 cones", "bibs in 3 colours", "balls"] },
    name: { es: "Juego de posición 4x4+3", en: "4v4+3 positional game", fr: "Jeu de position 4x4+3", de: "Positionsspiel 4-gegen-4+3", pt: "Jogo de posição 4x4+3" },
    desc: { es: "Tres comodines siempre con el equipo en posesión. Cambiar de orientación tras seis pases seguidos.", en: "Three jokers always with the team in possession. Switch play after six consecutive passes." },
    build: () => {
      const tokens = [];
      [[320, 200], [320, 440], [520, 200], [520, 440]].forEach((p, i) => tokens.push({ type: "home", x: p[0], y: p[1], label: String(i + 1) }));
      [[420, 300], [420, 340], [620, 300], [620, 340]].forEach((p, i) => tokens.push({ type: "away", x: p[0], y: p[1], label: String(i + 1) }));
      [[500, 110], [500, 530], [740, 320]].forEach((p) => tokens.push({ type: "home", x: p[0], y: p[1], label: "C" }));
      tokens.push({ type: "ball", x: 340, y: 215, label: "" });
      [[280, 150], [700, 150], [700, 490], [280, 490]].forEach((p) => tokens.push({ type: "cone", x: p[0], y: p[1], label: "" }));
      return { tokens, shapes: [{ tool: "pass", pts: [{ x: 335, y: 205 }, { x: 730, y: 315 }] }] };
    },
  },
];

/* Desplegable de la pizarra: mismo comportamiento para ejercicios y jugadas.
   Se cierra al pulsar fuera y con Escape, y el panel se ancla al botón. */
function WbMenu({ label, icon, count, AC, wide = false, children }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const box = useRef(null);
  const panel = useRef(null);
  /* La barra de herramientas se desliza con overflow-x en móvil, y eso
     recorta en el eje Y cualquier hijo absoluto por dentro (es la regla CSS
     que convierte el overflow-y en "auto" en cuanto el x deja de ser
     "visible"): el desplegable se abría pero quedaba invisible o sin poder
     tocarlo. En pantalla completa girada pasaba lo mismo, doblado con el giro
     del contenedor. Sacándolo por portal a <body> y calculando su sitio con
     las coordenadas reales del botón (getBoundingClientRect, que ya vienen
     con cualquier transformación aplicada) se escapa de ambos recortes. */
  const situar = () => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    const w = wide ? Math.min(window.innerWidth * 0.88, 380) : Math.min(window.innerWidth * 0.8, 240);
    const left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
    const gap = 4;
    /* En pantalla completa girada, el botón puede acabar pegado al borde REAL
       de la pantalla (la rotación cambia qué es "abajo"): abrir siempre hacia
       abajo lo dejaba en una tira de 20-30 px. Se mide cuánto hueco real hay
       arriba y abajo del botón y se abre hacia el lado que tenga más. */
    const abajo = window.innerHeight - r.bottom - gap;
    const arriba = r.top - gap;
    if (abajo >= 140 || abajo >= arriba) {
      setPos({ left, top: r.bottom + gap, width: w, maxHeight: Math.max(120, Math.min(abajo, 420)) });
    } else {
      setPos({ left, bottom: window.innerHeight - r.top + gap, width: w, maxHeight: Math.max(120, Math.min(arriba, 420)) });
    }
  };
  useEffect(() => {
    if (!open) return;
    situar();
    const out = (e) => { if (!box.current?.contains(e.target) && !panel.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } };
    document.addEventListener("pointerdown", out);
    document.addEventListener("keydown", esc, true);
    window.addEventListener("resize", situar);
    window.addEventListener("scroll", situar, true);
    return () => {
      document.removeEventListener("pointerdown", out); document.removeEventListener("keydown", esc, true);
      window.removeEventListener("resize", situar); window.removeEventListener("scroll", situar, true);
    };
  }, [open]); // eslint-disable-line
  return (
    <div className="relative" ref={box}>
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="true"
        className="h-9 px-2.5 shrink-0 rounded-lg border text-xs font-display uppercase tracking-wide inline-flex items-center gap-1"
        style={{ borderColor: open ? AC : C.line, background: open ? AC : C.panel2, color: open ? "#141414" : C.chalk }}>
        <span>{icon}</span>
        {/* La etiqueta también en el móvil: un icono suelto no dice si eso son
            los ejercicios, los ABP o las jugadas, y con la fila deslizante hay
            sitio de sobra. */}
        <span className="whitespace-nowrap">{label}</span>
        {count != null && <span className="tabular-nums opacity-70">{count}</span>}
        <span className="text-[9px]">▾</span>
      </button>
      {open && pos && createPortal(
        <div ref={panel} className="fixed z-[999] rounded-lg border shadow-2xl overflow-auto"
          style={{ borderColor: C.line, background: C.panel, left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.width, maxHeight: pos.maxHeight }}
          onClick={(e) => e.stopPropagation()}>
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>,
        document.body
      )}
    </div>
  );
}

/* ================= PLANIFICACIÓN DE TEMPORADA =================
   Los cuatro pilares sobre los que se reparte el trabajo del año. No es una
   taxonomía académica: son las cuatro cosas que un entrenador de base decide
   cuánto peso llevan en cada mes de la temporada. */
const PILARES = [
  { k: "fisico", icon: "◈", color: "#36454F", name: { es: "Físico", en: "Physical", fr: "Physique", de: "Athletik", pt: "Físico" },
    desc: { es: "Resistencia, velocidad, fuerza y prevención de lesiones.", en: "Endurance, speed, strength and injury prevention." } },
  { k: "tactico", icon: "⬡", color: "#5A6B75", name: { es: "Táctico", en: "Tactical", fr: "Tactique", de: "Taktik", pt: "Tático" },
    desc: { es: "Sistema, salida de balón, presión y ocupación de espacios.", en: "System, build-up, pressing and use of space." } },
  { k: "mental", icon: "♦", color: "#708090", name: { es: "Mental", en: "Mental", fr: "Mental", de: "Mental", pt: "Mental" },
    desc: { es: "Concentración, gestión del error, cohesión y competitividad.", en: "Focus, handling mistakes, cohesion and competitiveness." } },
  { k: "abp", icon: "⚐", color: "#4F6470", name: { es: "ABP", en: "Set pieces", fr: "Coups arrêtés", de: "Standards", pt: "Bolas paradas" },
    desc: { es: "Córners, faltas, saques de banda y de puerta.", en: "Corners, free kicks, throw-ins and goal kicks." } },
];
/* Temporada de fútbol base: de septiembre a junio. */
/* Qué ejercicios pegan con cada pilar. Sirve para que al marcar un mes como
   "físico" la app proponga trabajo de verdad en vez de dejar la casilla marcada
   y ya. Las claves son las categorías reales de EXERCISES. */
const PILAR_CATS = {
  fisico: ["fitness", "warmup", "duel"],
  tactico: ["buildup", "press", "defense", "rondo", "cross", "finish"],
  mental: ["duel", "rondo", "infantil"],
  abp: ["setpiece", "cross"],
};
const ejerciciosDePilar = (k) => {
  const cats = PILAR_CATS[k] || [];
  return EXERCISES.filter((e) => cats.includes(e.cat));
};

/* Nombre legible de cada tipo de evento del acta. Antes se pintaba la clave
   tal cual y en el acta salía "golRival", que no es castellano. */
const EVENTO_TXT = { gol: "Gol", golRival: "Gol del rival", cambio: "Cambio", tarjeta: "Tarjeta", nota: "Nota", periodo: "2ª parte" };
const nombreEvento = (k) => EVENTO_TXT[k] || k;

const MESES_TEMP = [
  { k: 9, es: "Septiembre" }, { k: 10, es: "Octubre" }, { k: 11, es: "Noviembre" }, { k: 12, es: "Diciembre" },
  { k: 1, es: "Enero" }, { k: 2, es: "Febrero" }, { k: 3, es: "Marzo" }, { k: 4, es: "Abril" },
  { k: 5, es: "Mayo" }, { k: 6, es: "Junio" },
];

/* ================= TABLEROS DE BALÓN PARADO =================
   Un córner, una falta o un penalti no se dibujan en el campo entero, pero
   tampoco haciendo zoom sobre él: ampliar los 1000×640 engorda la cal, deja
   las fichas del tamaño de un plato y se ve como una foto ampliada. Cada
   situación tiene aquí su propio tablero, con la portería arriba y las líneas
   trazadas a medida reglamentaria y a la escala del tablero.

   Todo se piensa en metros de campo real: `x` va de banda a banda (0 a 68) e
   `y` es la profundidad desde la línea de gol (0 = línea de gol). Cada tablero
   sabe traducir esos metros a sus coordenadas. */
const REGLA = {
  ancho: 68,
  area: { fondo: 16.5, medio: 20.16 },
  chica: { fondo: 5.5, medio: 9.16 },
  palo: 3.66,
  punto: 11, arco: 9.15, esquina: 1,
};
/* El semicírculo del área solo se pinta en el trozo que asoma por fuera: este
   es el desplazamiento lateral del corte con la línea del área. */
const ARCO_DX = Math.sqrt(REGLA.arco ** 2 - (REGLA.area.fondo - REGLA.punto) ** 2);

/* `x0` y `ancho` son los metros de campo que entran a lo ancho, y `sobre` los
   metros que se dejan por detrás de la línea de gol para que se vea la
   portería. La escala sale sola, y el fondo visible con ella. */
const tablero = ({ x0, ancho, sobre, w = 1000, h = 640, label }) => {
  const esc = w / ancho;
  return {
    w, h, esc, label,
    X: (m) => (m - x0) * esc,
    Y: (d) => (d + sobre) * esc,
    fondo: h / esc - sobre,
  };
};
const TABLEROS = {
  /* El campo entero se sigue dibujando aparte, con sus encuadres de siempre. */
  campo: { w: 1000, h: 640, esc: 1000 / 105, label: "Campo entero" },
  /* Córner: entran la esquina del saque y el área completa. La portería queda
     descentrada a propósito —un córner es asimétrico— y la banda contraria se
     queda fuera del cuadro porque ahí no pasa nada. */
  cornerDer: tablero({ x0: 10, ancho: 60, sobre: 2.5, label: "Córner derecha" }),
  cornerIzq: tablero({ x0: -2, ancho: 60, sobre: 2.5, label: "Córner izquierda" }),
  /* Falta: de banda a banda, portería centrada y cuarenta metros de fondo,
     que es de donde se lanzan las faltas que acaban en gol. */
  falta: tablero({ x0: 0, ancho: REGLA.ancho, sobre: 3, label: "Falta" }),
  /* Penalti: el área y poco más. Se ve el punto, el arco y dónde tiene que
     esperar el resto, que es justo de lo que va el ensayo. */
  penalti: tablero({ x0: 11, ancho: 46, sobre: 2.5, label: "Penalti" }),
};

/* Las líneas de un tablero de ABP. Se dibujan a medida reglamentaria: un
   córner mal proporcionado engaña sobre las distancias, que es exactamente lo
   que se está enseñando. */
const MarcasTablero = ({ tb, grosor = 3 }) => {
  const { X, Y, esc, fondo } = tb;
  const c = REGLA.ancho / 2;
  const r = REGLA.arco * esc;
  const rq = REGLA.esquina * esc;
  const cal = "rgba(255,255,255,0.55)";
  return (
    <g stroke={cal} strokeWidth={grosor} fill="none">
      {/* línea de gol y las dos bandas (se recortan solas si caen fuera) */}
      <line x1={X(-8)} y1={Y(0)} x2={X(REGLA.ancho + 8)} y2={Y(0)} />
      <line x1={X(0)} y1={Y(0)} x2={X(0)} y2={Y(fondo + 4)} />
      <line x1={X(REGLA.ancho)} y1={Y(0)} x2={X(REGLA.ancho)} y2={Y(fondo + 4)} />
      {/* área grande y área pequeña */}
      <rect x={X(c - REGLA.area.medio)} y={Y(0)} width={REGLA.area.medio * 2 * esc} height={REGLA.area.fondo * esc} />
      <rect x={X(c - REGLA.chica.medio)} y={Y(0)} width={REGLA.chica.medio * 2 * esc} height={REGLA.chica.fondo * esc} />
      {/* punto de penalti y el trozo de arco que sale del área */}
      <circle cx={X(c)} cy={Y(REGLA.punto)} r={Math.max(2, 0.32 * esc)} fill={cal} stroke="none" />
      <path d={`M${X(c - ARCO_DX)},${Y(REGLA.area.fondo)} A${r},${r} 0 0 0 ${X(c + ARCO_DX)},${Y(REGLA.area.fondo)}`} />
      {/* cuartos de círculo de las dos esquinas */}
      <path d={`M${X(REGLA.esquina)},${Y(0)} A${rq},${rq} 0 0 1 ${X(0)},${Y(REGLA.esquina)}`} />
      <path d={`M${X(REGLA.ancho - REGLA.esquina)},${Y(0)} A${rq},${rq} 0 0 0 ${X(REGLA.ancho)},${Y(REGLA.esquina)}`} />
      {/* la portería, dibujada por detrás de la línea de gol */}
      <g strokeWidth={grosor * 1.7} stroke="rgba(255,255,255,0.9)">
        <line x1={X(c - REGLA.palo)} y1={Y(0)} x2={X(c - REGLA.palo)} y2={Y(-2)} />
        <line x1={X(c + REGLA.palo)} y1={Y(0)} x2={X(c + REGLA.palo)} y2={Y(-2)} />
        <line x1={X(c - REGLA.palo)} y1={Y(-2)} x2={X(c + REGLA.palo)} y2={Y(-2)} />
      </g>
    </g>
  );
};
/* Franjas de césped paralelas a la línea de gol: en estos tableros se ataca de
   abajo arriba, así que las del campo entero (verticales) no valen. */
const FranjasTablero = ({ tb }) => (
  <>
    <rect x="0" y="0" width={tb.w} height={tb.h} fill="#152219" />
    {Array.from({ length: 12 }, (_, i) => (
      <rect key={i} x="0" y={tb.Y(i * 5)} width={tb.w} height={5 * tb.esc} fill={i % 2 ? "#17251D" : "#152219"} />
    ))}
  </>
);

/* ================= ACCIONES A BALÓN PARADO (ABP) =================
   Las situaciones que se ensayan de verdad en fútbol base. Cada una deja el
   tablero montado con las posiciones de partida; a partir de ahí el
   entrenador mueve fichas y dibuja, y guarda el resultado como jugada suya.
   El campo es de 1000×640 y se ataca hacia la derecha, igual que en los
   ejercicios de la biblioteca. */
const ABP_TIPOS = [
  { k: "corner", icon: "⌐", name: { es: "Córner", en: "Corner", fr: "Corner", de: "Ecke", pt: "Canto" } },
  { k: "falta", icon: "⊹", name: { es: "Falta", en: "Free kick", fr: "Coup franc", de: "Freistoß", pt: "Livre" } },
  { k: "penalti", icon: "⊙", name: { es: "Penalti", en: "Penalty", fr: "Penalty", de: "Elfmeter", pt: "Penálti" } },
  { k: "banda", icon: "⇥", name: { es: "Saque de banda", en: "Throw-in", fr: "Touche", de: "Einwurf", pt: "Lançamento" } },
  { k: "puerta", icon: "⊥", name: { es: "Saque de puerta", en: "Goal kick", fr: "Dégagement", de: "Abstoß", pt: "Pontapé de baliza" } },
];
/* Qué tablero usa cada situación. Las que no están aquí (banda, saque de
   puerta) se siguen dibujando sobre el campo entero, que es donde pasan. */
const ABP_TABLERO = { corner: "cornerDer", falta: "falta", penalti: "penalti" };

/* ================= POSICIONES DE PARTIDA, EN METROS =================
   Escritas en metros de campo real para que se puedan leer y corregir sin
   mirar píxeles, y para que el mismo córner sirva para los dos lados: se
   refleja la x (68 − x) y listo. El tablero hace la traducción al cargar.
   `home` son las fichas blancas (las tuyas) y `away` las de carbón. */
const ABP_METROS = {
  corner: {
    /* Córner a favor desde la esquina derecha, con los once sobre el campo:
       sacador, el del corto, tres atacando palo-punto-palo, uno al rechace,
       dos al borde y dos atrás tapando el contragolpe. El portero queda al
       fondo porque en un córner a favor está en su campo. */
    ata: {
      tokens: [
        { type: "home", x: 66.2, y: 2.8, label: "7" },   /* saca */
        { type: "home", x: 62, y: 5.5, label: "10" },    /* saque corto */
        { type: "home", x: 38.5, y: 4.5, label: "11" },  /* primer palo */
        { type: "home", x: 34.5, y: 10.5, label: "9" },  /* punto de penalti */
        { type: "home", x: 29.5, y: 5, label: "5" },     /* segundo palo */
        { type: "home", x: 36, y: 18.5, label: "4" },    /* rechace */
        { type: "home", x: 45, y: 19, label: "8" },      /* borde del área */
        { type: "home", x: 52, y: 27, label: "6" },      /* cobertura */
        { type: "home", x: 24, y: 26, label: "2" },      /* cobertura */
        { type: "home", x: 15, y: 31, label: "3" },      /* cobertura */
        { type: "home", x: 34, y: 34, label: "1" },      /* portero, atrás */
        { type: "away", x: 34, y: 1.3, label: "1" },
        { type: "away", x: 37.2, y: 1.2, label: "2" }, { type: "away", x: 30.8, y: 1.2, label: "3" },
        { type: "away", x: 35, y: 7, label: "5" }, { type: "away", x: 38.5, y: 9.5, label: "4" },
        { type: "away", x: 31, y: 9.5, label: "6" }, { type: "away", x: 61, y: 7.5, label: "7" },
        { type: "ball", x: 67.4, y: 0.7, label: "" },
      ],
      shapes: [
        { tool: "pass", pts: [{ x: 67.4, y: 0.7 }, { x: 34.8, y: 10 }] },
        { tool: "arrow", pts: [{ x: 38.5, y: 4.5 }, { x: 35.5, y: 9.5 }] },
        { tool: "arrow", pts: [{ x: 29.5, y: 5 }, { x: 32.5, y: 9 }] },
        { tool: "arrow", pts: [{ x: 36, y: 18.5 }, { x: 35, y: 14 }] },
        { tool: "arrow", pts: [{ x: 62, y: 5.5 }, { x: 65.5, y: 2.5 }] },
      ],
    },
    /* Córner en contra con los once dentro: portero, dos en los palos, cuatro
       en zona repartidos por el área, dos al hombre, uno al saque corto y uno
       al borde para el rechace. En base es donde se pierden más partidos. */
    def: {
      tokens: [
        { type: "home", x: 34, y: 1.6, label: "1" },     /* portero */
        { type: "home", x: 37.4, y: 0.8, label: "5" },   /* primer palo */
        { type: "home", x: 30.6, y: 0.8, label: "3" },   /* segundo palo */
        { type: "home", x: 36, y: 5, label: "4" }, { type: "home", x: 32, y: 5.5, label: "6" },
        { type: "home", x: 39.5, y: 7.5, label: "2" }, { type: "home", x: 29, y: 8.5, label: "11" },
        { type: "home", x: 35, y: 10.5, label: "9" },    /* al hombre */
        { type: "home", x: 40, y: 12.5, label: "10" },   /* al hombre */
        { type: "home", x: 59.5, y: 8, label: "7" },     /* al saque corto */
        { type: "home", x: 34, y: 19, label: "8" },      /* rechace */
        { type: "away", x: 66.2, y: 2.8, label: "11" },
        { type: "away", x: 36.5, y: 9.5, label: "9" }, { type: "away", x: 33, y: 11.5, label: "10" },
        { type: "away", x: 39.5, y: 13, label: "4" }, { type: "away", x: 30, y: 7, label: "5" },
        { type: "away", x: 62, y: 5.5, label: "7" },
        { type: "ball", x: 67.4, y: 0.7, label: "" },
      ],
      shapes: [
        { tool: "pass", pts: [{ x: 67.4, y: 0.7 }, { x: 35, y: 10.5 }] },
        { tool: "arrow", pts: [{ x: 34, y: 19 }, { x: 34, y: 26 }] },
        { tool: "arrow", pts: [{ x: 59.5, y: 8 }, { x: 63.5, y: 4.5 }] },
        { tool: "arrow", pts: [{ x: 39.5, y: 7.5 }, { x: 36.5, y: 10 }] },
      ],
    },
  },
  falta: {
    /* Falta lateral a favor desde la derecha, a unos 26 metros: lanzador y
       apoyo, tres atacando el área en carrera, dos al rechace, dos atrás por
       si sale rebotada y el portero al fondo. La barrera rival está puesta a
       los 9,15 m reglamentarios sobre la línea balón-portería. */
    ata: {
      tokens: [
        { type: "home", x: 53.8, y: 27.6, label: "10" }, /* lanza, un paso detrás del balón */
        { type: "home", x: 56.5, y: 24.5, label: "7" },  /* apoyo */
        { type: "home", x: 39.5, y: 15, label: "4" },
        { type: "home", x: 34.5, y: 10, label: "9" },
        { type: "home", x: 28.5, y: 12.5, label: "5" },
        { type: "home", x: 23, y: 16, label: "11" },
        { type: "home", x: 34, y: 22, label: "8" },      /* rechace */
        { type: "home", x: 42, y: 23, label: "6" },      /* rechace */
        { type: "home", x: 20, y: 31, label: "2" },      /* cobertura */
        { type: "home", x: 48, y: 33, label: "3" },      /* cobertura */
        { type: "home", x: 34, y: 38, label: "1" },      /* portero, atrás */
        { type: "away", x: 36, y: 1.4, label: "1" },
        { type: "away", x: 43.6, y: 20.7, label: "5" }, { type: "away", x: 45.7, y: 19.2, label: "6" },
        { type: "away", x: 47.9, y: 17.8, label: "3" }, { type: "away", x: 50, y: 16.3, label: "2" },
        { type: "away", x: 37.5, y: 8, label: "4" }, { type: "away", x: 31.5, y: 8.5, label: "8" },
        { type: "away", x: 25.5, y: 12.5, label: "11" }, { type: "away", x: 41.5, y: 12, label: "10" },
        { type: "ball", x: 52, y: 26, label: "" },
      ],
      shapes: [
        { tool: "pass", pts: [{ x: 52, y: 26 }, { x: 34.5, y: 7 }] },
        { tool: "arrow", pts: [{ x: 39.5, y: 15 }, { x: 36, y: 9.5 }] },
        { tool: "arrow", pts: [{ x: 23, y: 16 }, { x: 30.5, y: 8.5 }] },
        { tool: "arrow", pts: [{ x: 34, y: 22 }, { x: 34, y: 17 }] },
      ],
    },
    /* Falta en contra desde la derecha: barrera de cuatro a 9,15 m, portero
       tapando el palo largo, cuatro en zona dentro del área, dos en los palos
       y uno adelantado para salir al despeje. */
    def: {
      tokens: [
        { type: "home", x: 43.6, y: 20.7, label: "5" }, { type: "home", x: 45.7, y: 19.2, label: "6" },
        { type: "home", x: 47.9, y: 17.8, label: "4" }, { type: "home", x: 50, y: 16.3, label: "3" },
        { type: "home", x: 32, y: 1.5, label: "1" },    /* portero al palo largo */
        { type: "home", x: 37.5, y: 3, label: "9" },    /* primer palo */
        { type: "home", x: 30.5, y: 3, label: "10" },   /* segundo palo */
        { type: "home", x: 38, y: 7.5, label: "2" }, { type: "home", x: 29.5, y: 9, label: "11" },
        { type: "home", x: 32.5, y: 14.5, label: "8" },
        { type: "home", x: 40, y: 20, label: "7" },     /* sale al despeje */
        { type: "away", x: 53.8, y: 27.6, label: "10" },
        { type: "away", x: 35, y: 10.5, label: "9" }, { type: "away", x: 41, y: 13, label: "7" },
        { type: "away", x: 31, y: 12.5, label: "5" }, { type: "away", x: 25, y: 15.5, label: "11" },
        { type: "ball", x: 52, y: 26, label: "" },
      ],
      shapes: [
        { tool: "pass", pts: [{ x: 52, y: 26 }, { x: 35, y: 9 }] },
        { tool: "arrow", pts: [{ x: 40, y: 20 }, { x: 44, y: 24 }] },
        { tool: "arrow", pts: [{ x: 38, y: 7.5 }, { x: 35.5, y: 10.5 }] },
      ],
    },
  },
  penalti: {
    /* Penalti a favor: lanzador, portero rival en la línea y los ocho de fuera
       colocados donde manda el reglamento —fuera del área y fuera del arco de
       9,15 m—, que es lo que hay que ensayar: quién entra primero al rechace. */
    ata: {
      tokens: [
        { type: "home", x: 34, y: 14, label: "9" },     /* lanza */
        { type: "home", x: 27, y: 20, label: "10" }, { type: "home", x: 40, y: 19, label: "8" },
        { type: "home", x: 47, y: 19.5, label: "7" }, { type: "home", x: 21, y: 20.5, label: "4" },
        { type: "away", x: 34, y: 0.7, label: "1" },
        { type: "away", x: 24.5, y: 20.8, label: "5" }, { type: "away", x: 36.5, y: 21.5, label: "4" },
        { type: "away", x: 44, y: 21.8, label: "6" }, { type: "away", x: 18, y: 22, label: "3" },
        { type: "ball", x: 34, y: 11, label: "" },
      ],
      shapes: [
        { tool: "arrow", pts: [{ x: 34, y: 14 }, { x: 34, y: 11.8 }] },
        { tool: "pass", pts: [{ x: 34, y: 11 }, { x: 31.2, y: 1.2 }] },
        { tool: "arrow", pts: [{ x: 27, y: 20 }, { x: 31.5, y: 13 }] },
      ],
    },
    /* Penalti en contra: portero en la línea y los tuyos al borde del área,
       por delante de los suyos, para ganar el rechace. */
    def: {
      tokens: [
        { type: "home", x: 34, y: 0.7, label: "1" },
        { type: "home", x: 27, y: 20, label: "10" }, { type: "home", x: 40, y: 19, label: "8" },
        { type: "home", x: 47, y: 19.5, label: "7" }, { type: "home", x: 21, y: 20.5, label: "4" },
        { type: "away", x: 34, y: 14, label: "9" },
        { type: "away", x: 24.5, y: 20.8, label: "5" }, { type: "away", x: 36.5, y: 21.5, label: "4" },
        { type: "away", x: 44, y: 21.8, label: "6" }, { type: "away", x: 18, y: 22, label: "3" },
        { type: "ball", x: 34, y: 11, label: "" },
      ],
      shapes: [
        { tool: "arrow", pts: [{ x: 34, y: 14 }, { x: 34, y: 11.8 }] },
        { tool: "pass", pts: [{ x: 34, y: 11 }, { x: 36.8, y: 1.2 }] },
        { tool: "arrow", pts: [{ x: 34, y: 0.7 }, { x: 31.5, y: 2.5 }] },
      ],
    },
  },
};
const ABP_NOMBRE = (k, lang) => {
  const t = ABP_TIPOS.find((x) => x.k === k);
  return t ? (t.name[lang] || t.name.es) : "";
};
/* ================= LOS QUE SE DIBUJAN EN EL CAMPO ENTERO =================
   Saque de banda y saque de puerta ocurren lejos del área y con medio equipo
   fuera de ella, así que no tienen tablero propio: se montan sobre el campo de
   1000×640, atacando a la derecha (el saque de puerta, desde la portería
   propia, a la izquierda), y el selector de lado los refleja.
   Estos son los defensivos: las fichas blancas son las tuyas defendiendo. */
const ABP_SETUP_DEF = {
  /* Saque de banda en contra en nuestro campo: tapar el apoyo, tapar la pared
     y que nadie quede de espaldas al balón. */
  banda: () => ({
    tokens: [
      { type: "home", x: 690, y: 60, label: "3" }, { type: "home", x: 730, y: 165, label: "5" },
      { type: "home", x: 600, y: 150, label: "6" }, { type: "home", x: 820, y: 280, label: "4" },
      { type: "home", x: 958, y: 320, label: "1" },
      { type: "away", x: 640, y: 15, label: "2" }, { type: "away", x: 700, y: 120, label: "8" },
      { type: "away", x: 800, y: 260, label: "9" },
      { type: "ball", x: 640, y: 15, label: "" },
    ],
    shapes: [
      { tool: "pass", pts: [{ x: 640, y: 15 }, { x: 700, y: 120 }] },
      { tool: "arrow", pts: [{ x: 730, y: 165 }, { x: 700, y: 130 }] },
      { tool: "arrow", pts: [{ x: 690, y: 60 }, { x: 655, y: 40 }] },
    ],
  }),
  /* Saque de puerta del rival: presión alta. Se tapan los dos centrales y el
     pivote, y se deja libre el pase largo, que es el que quieres que salga. */
  puerta: () => ({
    tokens: [
      { type: "away", x: 70, y: 320, label: "1" },
      { type: "away", x: 190, y: 170, label: "4" }, { type: "away", x: 190, y: 470, label: "5" },
      { type: "away", x: 330, y: 320, label: "6" },
      { type: "home", x: 300, y: 185, label: "9" }, { type: "home", x: 300, y: 455, label: "10" },
      { type: "home", x: 420, y: 320, label: "8" }, { type: "home", x: 330, y: 70, label: "7" },
      { type: "ball", x: 70, y: 320, label: "" },
    ],
    shapes: [
      { tool: "pass", pts: [{ x: 70, y: 320 }, { x: 190, y: 170 }] },
      { tool: "arrow", pts: [{ x: 300, y: 185 }, { x: 215, y: 175 }] },
      { tool: "arrow", pts: [{ x: 420, y: 320 }, { x: 355, y: 320 }] },
    ],
  }),
};

const ABP_SETUP = {
  /* Saque de banda en campo contrario: apoyo, pared y tercer hombre. */
  banda: () => ({
    tokens: [
      { type: "home", x: 640, y: 15, label: "2" },
      { type: "home", x: 700, y: 120, label: "8" }, { type: "home", x: 560, y: 140, label: "6" },
      { type: "home", x: 800, y: 260, label: "9" },
      { type: "away", x: 690, y: 190, label: "5" }, { type: "away", x: 780, y: 330, label: "4" },
      { type: "ball", x: 640, y: 15, label: "" },
    ],
    shapes: [
      { tool: "pass", pts: [{ x: 640, y: 15 }, { x: 700, y: 120 }] },
      { tool: "pass", pts: [{ x: 700, y: 120 }, { x: 560, y: 140 }] },
      { tool: "arrow", pts: [{ x: 640, y: 15 }, { x: 720, y: 60 }] },
      { tool: "pass", pts: [{ x: 560, y: 140 }, { x: 790, y: 250 }] },
    ],
  }),
  /* Saque de puerta jugado: centrales abiertos, pivote entre líneas y laterales
     altos. El salida en largo se ensaya solo, este es el de jugar desde atrás. */
  puerta: () => ({
    tokens: [
      { type: "home", x: 70, y: 320, label: "1" },
      { type: "home", x: 190, y: 170, label: "4" }, { type: "home", x: 190, y: 470, label: "5" },
      { type: "home", x: 330, y: 320, label: "6" },
      { type: "home", x: 300, y: 40, label: "2" }, { type: "home", x: 300, y: 600, label: "3" },
      { type: "away", x: 340, y: 200, label: "9" }, { type: "away", x: 340, y: 440, label: "10" },
      { type: "ball", x: 70, y: 320, label: "" },
    ],
    shapes: [
      { tool: "pass", pts: [{ x: 70, y: 320 }, { x: 190, y: 170 }] },
      { tool: "pass", pts: [{ x: 190, y: 170 }, { x: 330, y: 320 }] },
      { tool: "arrow", pts: [{ x: 300, y: 40 }, { x: 430, y: 60 }] },
      { tool: "arrow", pts: [{ x: 330, y: 320 }, { x: 450, y: 320 }] },
    ],
  }),
};

function Whiteboard({ AC, lang, teamId, teamRec, isF7, pendingExId, onConsumePending, pendingPlayId, onConsumePlay, canSavePlays = true, onPro, squad = [] }) {
  const t = (k) => T(lang, k);
  const [tokens, setTokens] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [tool, setTool] = useState("move");
  const [draft, setDraft] = useState(null);
  const svgRef = useRef(null);
  /* Grupo que envuelve todo el dibujo. Es quien lleva el giro de 90° del móvil
     en vertical, y de quien se saca el CTM para traducir toques a coordenadas. */
  const gRef = useRef(null);
  const drag = useRef(null);
  const uid = useRef(1);
  const AWAY = "#36454F";

  /* --- pantalla completa, brillo, color y grosor de trazo --- */
  const [full, setFull] = useState(false);
  /* Plantillas de campo: cambian solo el recorte (viewBox), las coordenadas de
     fichas y trazos no se mueven de sitio. */
  const PITCH_VIEWS = {
    completo: { x: 0, y: 0, w: 1000, h: 640, label: "Completo" },
    /* Un ABP no se dibuja en el campo entero: pasa en un área, la de la
       izquierda o la de la derecha según a qué portería ataques ese día. */
    areaDer: { x: 500, y: 0, w: 500, h: 640, label: "Área ▸" },
    areaIzq: { x: 0, y: 0, w: 500, h: 640, label: "◂ Área" },
    /* Aquí no hay encuadre de córner, de falta ni de penalti: cada uno tiene
       su propio tablero dibujado a escala (ver TABLEROS). Recortar el campo
       entero era un zoom, y un zoom se ve como lo que es. */
    banda: { x: 0, y: 160, w: 1000, h: 320, label: "Banda" },
    porteria: { x: 200, y: 0, w: 600, h: 640, label: "Portería" },
  };
  const [pitchView, setPitchViewRaw] = useState("completo");
  /* Lado al que se ataca hoy. Manda sobre los ABP: el mismo córner se coloca
     en un área o en la otra según a qué portería se juegue. */
  const [abpLado, setAbpLado] = useState("der");
  /* Fase del balón parado: el mismo córner se prepara distinto a favor que en
     contra, y en base se ensayan los dos. */
  const [abpFase, setAbpFase] = useState("ata");
  const [sistemasAbierto, setSistemasAbierto] = useState(false);
  /* Jugada guardada que está ahora mismo en la pizarra. Sirve para poder
     guardar los cambios ENCIMA de ella: retocar una y acabar con seis copias
     llamadas "Córner 1", "Córner 2"… no le sirve a nadie. */
  const [playAbierta, setPlayAbierta] = useState(null);
  /* Edición por voz de entrenador: se describe el cambio en una frase y Coach
     AI devuelve las fichas y los trazos ya movidos. Mover doce fichas a mano en
     el móvil, en el vestuario, no lo hace nadie. */
  const [iaTexto, setIaTexto] = useState("");
  const [iaBusy, setIaBusy] = useState(false);
  const [iaMsg, setIaMsg] = useState("");
  /* La vista es el viewBox vivo: la plantilla fija el encuadre de partida y el
     zoom/desplazamiento lo mueven desde ahí. */
  const [view, setView] = useState({ x: 0, y: 0, w: 1000, h: 640 });
  /* Tablero en uso. "campo" es la pizarra de siempre con sus encuadres; el
     resto son los tableros propios de balón parado, que no son un recorte del
     campo sino un dibujo aparte con sus propias líneas y su propia escala. */
  const [tablero, setTableroRaw] = useState("campo");
  const TB = TABLEROS[tablero] || TABLEROS.campo;
  const enCampo = tablero === "campo";
  const VB = { w: TB.w, h: TB.h };
  const base = enCampo ? PITCH_VIEWS[pitchView] : { x: 0, y: 0, w: TB.w, h: TB.h, label: TB.label };
  const MIN_W = Math.max(120, base.w * 0.22);   /* tope de acercamiento */
  const MAX_W = base.w * 1.6;                   /* tope de alejamiento */
  /* clamp seguro: si el rango se invierte (muy alejado) centra en vez de romper */
  const fit = (min, max, val) => (min > max ? (min + max) / 2 : clamp(val, min, max));
  const clampView = (v) => ({ ...v, x: fit(-200, VB.w + 200 - v.w, v.x), y: fit(-150, VB.h + 150 - v.h, v.y) });
  const setPitchView = (k) => { setTableroRaw("campo"); setPitchViewRaw(k); const v = PITCH_VIEWS[k]; setView({ x: v.x, y: v.y, w: v.w, h: v.h }); };
  /* Cambiar de tablero es cambiar de dibujo entero, así que el encuadre vuelve
     a ser el tablero completo: aquí no hay nada que recortar. */
  const setTablero = (k) => {
    setTableroRaw(k); setPitchViewRaw("completo");
    const tb = TABLEROS[k] || TABLEROS.campo;
    setView({ x: 0, y: 0, w: tb.w, h: tb.h });
  };
  /* Grosor de la cal: 26 cm reales, sea cual sea la escala del tablero y el
     zoom. Es lo que evita que un tablero cerrado parezca una foto ampliada. */
  const grosorCal = Math.max(1.2, 0.26 * TB.esc * (view.w / TB.w));
  const resetView = () => setView({ x: base.x, y: base.y, w: base.w, h: base.h });
  const zoomBy = (factor, ax, ay) => setView((v) => {
    const w = clamp(v.w * factor, MIN_W, MAX_W);
    const f = w / v.w;
    const cx = ax ?? v.x + v.w / 2, cy = ay ?? v.y + v.h / 2;
    return clampView({ x: cx - (cx - v.x) * f, y: cy - (cy - v.y) * f, w, h: v.h * f });
  });
  const zoomPct = Math.round((base.w / view.w) * 100);
  /* Secuencia de pasos numerados para explicar una jugada paso a paso */
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const playTimer = useRef(null);
  const addStep = () => setSteps((st) => { const n = [...st, { tokens, shapes }].slice(0, 20); setStepIdx(n.length - 1); return n; });
  const goStep = (i) => {
    if (i < 0 || i >= steps.length) return;
    setStepIdx(i);
    setTokens(steps[i].tokens); setShapes(steps[i].shapes); setDraft(null);
  };
  const clearSteps = () => { setSteps([]); setStepIdx(-1); setPlaying(false); };
  useEffect(() => {
    if (!playing) return;
    playTimer.current = setInterval(() => {
      setStepIdx((i) => {
        const next = i + 1 >= steps.length ? 0 : i + 1;
        setTokens(steps[next].tokens); setShapes(steps[next].shapes);
        return next;
      });
    }, 1600);
    return () => clearInterval(playTimer.current);
  }, [playing, steps]); // eslint-disable-line
  /* Grabacion en video: MediaRecorder nativo, sin librerias. Redibuja el SVG
     sobre un canvas oculto varias veces por segundo y graba ese canvas. */
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const recCanvasRef = useRef(null);
  const recRef = useRef({ recorder: null, raf: null, chunks: [], timer: null });
  /* El PNG y el vídeo salen siempre con el encuadre de la plantilla elegida,
     no con el zoom que tenga el entrenador en pantalla en ese momento. */
  const serializeBoard = () => {
    const svg = svgRef.current;
    if (!svg) return null;
    const clone = svg.cloneNode(true);
    clone.setAttribute("viewBox", `${base.x} ${base.y} ${base.w} ${base.h}`);
    /* El PNG y el vídeo salen siempre apaisados, aunque el móvil esté
       enseñando el campo girado: a la copia se le quita el giro antes de
       exportarla, o el campo saldría tumbado dentro del lienzo. Y con él hay
       que quitar el contragiro de los dorsales y rótulos: sin el giro del
       campo que compensaban, se exportaban ellos tumbados. */
    clone.querySelector("[data-wb-rot]")?.removeAttribute("transform");
    clone.querySelectorAll("[data-wb-up]").forEach((n) => n.removeAttribute("transform"));
    return new XMLSerializer().serializeToString(clone);
  };
  const recordFrame = () => {
    const svg = svgRef.current, canvas = recCanvasRef.current;
    if (!svg || !canvas) return;
    const xml = serializeBoard();
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#152219"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(xml)));
    recRef.current.raf = requestAnimationFrame(recordFrame);
  };
  const startRecording = () => {
    if (!canSavePlays) { onPro?.(); return; }
    if (typeof MediaRecorder === "undefined" || !recCanvasRef.current?.captureStream) {
      window.alert("Este navegador no admite grabación de vídeo. Prueba con Chrome o Firefox actualizados.");
      return;
    }
    const canvas = recCanvasRef.current;
    canvas.width = base.w; canvas.height = base.h;
    const stream = canvas.captureStream(24);
    const rec = new MediaRecorder(stream, { mimeType: "video/webm" });
    recRef.current.chunks = [];
    rec.ondataavailable = (e) => { if (e.data.size) recRef.current.chunks.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(recRef.current.chunks, { type: "video/webm" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `pizarra-${hoyISO()}.webm`;
      a.click();
    };
    recRef.current.recorder = rec;
    rec.start();
    setRecSecs(0);
    recRef.current.timer = setInterval(() => setRecSecs((s) => s + 1), 1000);
    recordFrame();
    setRecording(true);
  };
  const stopRecording = () => {
    recRef.current.recorder?.stop();
    cancelAnimationFrame(recRef.current.raf);
    clearInterval(recRef.current.timer);
    setRecording(false);
  };
  useEffect(() => () => { cancelAnimationFrame(recRef.current.raf); clearInterval(recRef.current.timer); }, []);
  const [bright, setBright] = useState(1);
  const [color, setColor] = useState("#FFFFFF");
  const [width, setWidth] = useState(4);
  const PALETTE = [["#FFFFFF", "Blanco"], ["#D3D3D3", "Gris claro"], ["#9FB0BA", "Gris"], ["#708090", "Pizarra"], ["#36454F", "Carbón"]];
  const [snapGrid, setSnapGrid] = useState(true);
  const [sysFree, setSysFree] = useState("");
  /* En el móvil la plantilla abierta se come 128 px de los 390 que hay: el campo
     queda ridículo. Arranca cerrada y se abre con un toque. */
  const [showSquad, setShowSquad] = useState(() => (typeof window === "undefined" ? true : window.innerWidth >= 640));
  /* Aviso de girar el móvil: la pizarra es 1000x640 y en vertical queda diminuta */
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    const check = () => setPortrait(window.innerWidth < 820 && window.innerHeight > window.innerWidth);
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => { window.removeEventListener("resize", check); window.removeEventListener("orientationchange", check); };
  }, []);
  /* El campo es apaisado (1000×640) y el móvil en vertical no lo es: metido a
     lo ancho de la pantalla se quedaba en una tira de ~220 px de alto, con
     media pantalla en blanco debajo y las fichas tan juntas que no se acertaba
     con el dedo. Girado 90° ocupa ese hueco: el mismo campo pasa de ~350×220 a
     ~350×550, más del doble de superficie para colocar veintidós fichas.
     En pantalla completa NO se gira aquí, porque allí ya se gira el contenedor
     entero por CSS y saldría del revés. */
  const vertical = portrait && !full;
  /* Al girar el campo gira TODO lo que lleva dentro, dorsales y rótulos
     incluidos: quedaban tumbados y había que ladear la cabeza para leer un
     número. Se les aplica el giro contrario sobre su propio punto de anclaje,
     así que no se mueven de sitio y se leen derechos. */
  const textoDerecho = (x, y) => (vertical ? `rotate(-90 ${x} ${y})` : undefined);
  /* Coloca un jugador concreto de la plantilla con su dorsal real */
  const placePlayer = (pl) => {
    snap();
    setTokens((ts) => {
      const ya = ts.find((x) => x.type === "home" && x.label === String(pl.d));
      if (ya) return ts;
      const n = ts.filter((x) => x.type === "home").length;
      /* Antes las fichas caían siempre en x:140,y:90 (coordenadas del campo
         completo). En "Medio campo" el viewBox empieza en x=500, así que el
         jugador aparecía FUERA de lo visible y parecía que el botón no hacía
         nada. Ahora se colocan dentro del encuadre actual, sea cual sea. */
      const x = view.x + view.w * 0.14 + (n % 4) * (view.w * 0.06);
      const y = view.y + view.h * 0.14 + Math.floor(n / 4) * (view.h * 0.11);
      return [...ts, { id: uid.current++, type: "home",
        x: clamp(Math.round(x), 8, VB.w - 8), y: clamp(Math.round(y), 8, VB.h - 8),
        label: String(pl.d) }];
    });
  };
  useEffect(() => {
    if (!full) return;
    const onKey = (e) => { if (e.key === "Escape") setFull(false); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [full]);

  /* --- deshacer / rehacer --- */
  const [hist, setHist] = useState([]);
  const [fut, setFut] = useState([]);
  const snap = () => { setHist((h) => [...h.slice(-29), { tokens, shapes }]); setFut([]); };
  const undo = () => {
    if (!hist.length) return;
    const prev = hist[hist.length - 1];
    setFut((f) => [{ tokens, shapes }, ...f].slice(0, 30));
    setTokens(prev.tokens); setShapes(prev.shapes); setHist((h) => h.slice(0, -1)); setDraft(null);
  };
  const redo = () => {
    if (!fut.length) return;
    const nxt = fut[0];
    setHist((h) => [...h.slice(-29), { tokens, shapes }]);
    setTokens(nxt.tokens); setShapes(nxt.shapes); setFut((f) => f.slice(1)); setDraft(null);
  };

  /* Sistema táctico (fútbol 11 / fútbol 7), local y rival, guardado por dispositivo */
  const storeKey = `cb_wb_${teamId || "demo"}`;
  const playsKey = `cb_wbplays_${teamId || "demo"}`;
  const draftKey = `cb_wbdraft_${teamId || "demo"}`;
  const [format, setFormatRaw] = useState(isF7 ? "f7" : "f11");
  const [codeHome, setCodeHome] = useState(isF7 ? F7_CODES[0] : "4-3-3");
  const [codeAway, setCodeAway] = useState(isF7 ? F7_CODES[0] : "4-3-3");
  const [plays, setPlays] = useState([]);
  const [nubeMsg, setNubeMsg] = useState("");
  /* Al abrir la pizarra se traen las jugadas que el equipo tenga compartidas y
     se unen con las de este dispositivo. Sin esto, quien nunca haya dibujado
     nada abriría la pizarra vacía aunque su entrenador tenga diez preparadas. */
  useEffect(() => {
    if (!teamRec) return;
    let vivo = true;
    airJugadasLeer(teamRec).then((delEquipo) => {
      if (!vivo || !delEquipo?.length) return;
      setPlays((ps) => mezclarJugadas(ps, delEquipo));
    });
    return () => { vivo = false; };
  }, [teamRec]);
  const compartirJugadas = async () => {
    if (!canSavePlays) { onPro?.(); return; }
    if (!teamRec) { setNubeMsg("Entra con tu cuenta del club para poder compartirlas."); return; }
    setNubeMsg("Compartiendo…");
    const out = await airJugadasGuardar(teamRec, plays);
    setNubeMsg(out?.ok ? "✓ Compartidas con tu equipo." : "No se pudieron compartir. Revisa la conexión.");
  };
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.format) setFormatRaw(d.format);
        if (d.codeHome) setCodeHome(d.codeHome);
        if (d.codeAway) setCodeAway(d.codeAway);
        if (d.bright) setBright(Number(d.bright) || 1);
        if (typeof d.snapGrid === "boolean") setSnapGrid(d.snapGrid);
      }
      const rd = localStorage.getItem(draftKey);
      if (rd) {
        const d = JSON.parse(rd);
        if (Array.isArray(d.tokens)) { setTokens(d.tokens); setShapes(Array.isArray(d.shapes) ? d.shapes : []); setSteps(Array.isArray(d.steps) ? d.steps : []); uid.current = Math.max(1, ...d.tokens.map((x) => Number(x.id) || 0), ...(d.shapes || []).map((x) => Number(x.id) || 0)) + 1; }
      }
      const rp = localStorage.getItem(playsKey);
      if (rp) setPlays(JSON.parse(rp) || []);
    } catch { /* sin localStorage disponible */ }
  }, [storeKey, playsKey, draftKey]);
  useEffect(() => {
    try { localStorage.setItem(storeKey, JSON.stringify({ format, codeHome, codeAway, bright, snapGrid })); } catch { /* noop */ }
  }, [format, codeHome, codeAway, bright, snapGrid, storeKey]);
  useEffect(() => {
    try { localStorage.setItem(playsKey, JSON.stringify(plays)); } catch { /* noop */ }
  }, [plays, playsKey]);

  useEffect(() => {
    try { localStorage.setItem(draftKey, JSON.stringify({ tokens, shapes, steps })); } catch { /* noop */ }
  }, [tokens, shapes, steps, draftKey]);
  const setFormat = (f) => {
    setFormatRaw(f);
    const cs = f === "f7" ? F7_CODES : F11_CODES;
    setCodeHome((c) => (cs.includes(c) ? c : cs[0]));
    setCodeAway((c) => (cs.includes(c) ? c : cs[0]));
  };
  const codes = format === "f7" ? F7_CODES : F11_CODES;

  /* Pantalla -> coordenadas del campo. Usa getScreenCTM, que ya incluye el zoom,
     el desplazamiento y la rotación CSS del modo horizontal; hacerlo a mano con
     getBoundingClientRect fallaba en cuanto la vista no era el campo completo.
     El CTM se le pide al GRUPO, no al <svg>: así arrastra también el giro de
     90° del móvil en vertical, y dibujar, mover fichas y pellizcar siguen
     cayendo donde toca sin deshacer la rotación a mano en cada gesto. */
  const toSvg = (cx, cy) => {
    const svg = svgRef.current;
    const ctm = (gRef.current || svg)?.getScreenCTM?.();
    if (ctm && typeof DOMPoint !== "undefined") {
      const p = new DOMPoint(cx, cy).matrixTransform(ctm.inverse());
      return { x: p.x, y: p.y };
    }
    const r = svg.getBoundingClientRect();
    const fx = (cx - r.left) / r.width, fy = (cy - r.top) / r.height;
    /* Sin DOMPoint hay que deshacer el giro a mano: en vertical el eje X del
       campo baja por la pantalla y el eje Y va de derecha a izquierda. */
    if (vertical) return { x: view.x + fy * view.w, y: view.y + view.h - fx * view.h };
    return { x: view.x + fx * view.w, y: view.y + fy * view.h };
  };
  const toVB = (e) => {
    const g = snapGrid ? 10 : 1;
    const p = toSvg(e.clientX, e.clientY);
    return { x: clamp(Math.round(p.x / g) * g, 8, VB.w - 8), y: clamp(Math.round(p.y / g) * g, 8, VB.h - 8) };
  };
  const place = (side) => {
    snap();
    const code = side === "home" ? codeHome : codeAway;
    const raw = buildFormationPts(code, format === "f7");
    const pts = side === "home" ? raw : raw.map(([x, y]) => [VB.w - x, y]);
    setTokens((ts) => [...ts.filter((x) => x.type !== side), ...pts.map((p, i) => ({ id: uid.current++, type: side, x: p[0], y: p[1], label: String(i + 1) }))]);
  };
  /* Igual que placePlayer: el balón va al centro de lo que se está viendo, no
     al centro fijo del campo completo (que en "Portería a portería" o con zoom
     puede quedar fuera de pantalla). */
  const addBall = () => { snap(); setTokens((ts) => [...ts.filter((x) => x.type !== "ball"), { id: uid.current++, type: "ball", x: clamp(Math.round(view.x + view.w / 2), 8, VB.w - 8), y: clamp(Math.round(view.y + view.h / 2), 8, VB.h - 8), label: "" }]); };
  const applyExercise = (ex) => {
    snap();
    const { tokens: tk, shapes: sh } = ex.build();
    setTool("move"); setDraft(null);
    setTokens(tk.map((x) => ({ ...x, id: uid.current++ })));
    setShapes((sh || []).map((s) => ({ ...s, id: uid.current++ })));
  };
  useEffect(() => {
    if (!pendingExId) return;
    const ex = EXERCISES.find((e) => e.id === pendingExId);
    if (ex) applyExercise(ex);
    onConsumePending?.();
  }, [pendingExId]); // eslint-disable-line

  /* --- jugadas guardadas ---
     `tipo` marca de qué ABP es la jugada (o "libre" si no lo es). Se guarda
     junto a la jugada para poder filtrarlas y, sobre todo, para poder
     encontrarlas rápido desde el modo partido: en un córner no te pones a
     buscar entre treinta jugadas sueltas. */
  /* La fase se guarda con la jugada: en el banquillo hay que distinguir de un
     vistazo el córner que sacas del córner que te sacan. */
  const savePlay = (tipo = "libre", fase = abpFase) => {
    if (!canSavePlays) { onPro?.(); return; }
    const mismas = plays.filter((p) => p.tipo === tipo && (p.fase || "ata") === fase).length + 1;
    const porDefecto = tipo === "libre"
      ? `Jugada ${plays.length + 1}`
      : `${ABP_NOMBRE(tipo, lang)} ${fase === "def" ? "en contra" : "a favor"} ${mismas}`;
    const name = window.prompt("Nombre de la jugada", porDefecto);
    if (!name) return;
    const id = Date.now();
    /* Se guarda también el tablero: una jugada dibujada en el tablero de
       córner no significa nada sobre el campo entero, las coordenadas son
       otras. Sin esto, al reabrirla salían once fichas amontonadas. */
    setPlays((ps) => [{ id, name: name.trim(), tipo, fase, tablero, tokens, shapes }, ...ps].slice(0, 30));
    setPlayAbierta(id);
  };
  /* Guardar encima de la jugada abierta, renombrar y mover en la lista. El
     orden importa: en el banquillo quieres arriba la que vas a usar. */
  const actualizarPlay = () => {
    if (!canSavePlays) { onPro?.(); return; }
    setPlays((ps) => ps.map((x) => (x.id === playAbierta ? { ...x, tablero, tokens, shapes } : x)));
  };
  const renombrarPlay = (p) => {
    const v = window.prompt("Nombre de la jugada", p.name);
    if (!v || !v.trim()) return;
    setPlays((ps) => ps.map((x) => (x.id === p.id ? { ...x, name: v.trim() } : x)));
  };
  /* Manda la pizarra actual y la instrucción, y aplica lo que vuelve. Se
     valida todo antes de tocar nada: si el modelo devuelve algo que no cuadra
     —coordenadas fuera del campo, herramientas que no existen— no se pinta
     nada y se avisa, en vez de dejar la pizarra hecha un cristo. */
  const NUM = (v, max) => (typeof v === "number" && isFinite(v) ? Math.max(0, Math.min(max, Math.round(v))) : null);
  const TIPOS_FICHA = ["home", "away", "ball", "cone", "disc", "goal"];
  const TRAZOS = ["arrow", "pass", "dribble", "free", "zone", "circle", "text"];
  const limpiarIA = (d) => {
    const tk = [];
    for (const t of Array.isArray(d?.tokens) ? d.tokens : []) {
      const x = NUM(t?.x, TB.w), y = NUM(t?.y, TB.h);
      if (x === null || y === null || !TIPOS_FICHA.includes(t?.type)) continue;
      tk.push({ id: uid.current++, type: t.type, x, y, label: String(t.label ?? "").slice(0, 3) });
    }
    const sh = [];
    for (const f of Array.isArray(d?.shapes) ? d.shapes : []) {
      if (!TRAZOS.includes(f?.tool) || !Array.isArray(f?.pts) || f.pts.length < 1) continue;
      const pts = [];
      for (const q of f.pts) {
        const x = NUM(q?.x, TB.w), y = NUM(q?.y, TB.h);
        if (x !== null && y !== null) pts.push({ x, y });
      }
      if (f.tool === "text" ? pts.length < 1 : pts.length < 2) continue;
      sh.push({ id: uid.current++, tool: f.tool, pts, color: "#FFFFFF", width: 4, ...(f.tool === "text" ? { text: String(f.text || "").slice(0, 40) } : {}) });
    }
    return tk.length ? { tokens: tk, shapes: sh } : null;
  };
  const pedirIA = async () => {
    const orden = iaTexto.trim();
    if (!orden || iaBusy) return;
    if (!canSavePlays) { onPro?.(); return; }
    setIaBusy(true); setIaMsg("");
    const pizarra = {
      tokens: tokens.map((t) => ({ type: t.type, x: Math.round(t.x), y: Math.round(t.y), label: t.label || "" })),
      shapes: shapes.map((f) => ({ tool: f.tool, pts: (f.pts || []).map((q) => ({ x: Math.round(q.x), y: Math.round(q.y) })), ...(f.text ? { text: f.text } : {}) })),
    };
    /* Lo primero que hay que contarle es en qué tablero está: en el de córner
       las coordenadas no significan lo mismo que en el campo entero, y si no
       se le dice coloca las fichas en el sitio equivocado. */
    const donde = enCampo
      ? `Es el campo entero: mide 1000 de ancho por 640 de alto, x=0 es la línea de gol izquierda, x=1000 la derecha, y=0 la banda de arriba, y=640 la de abajo. Las áreas van de x=12 a x=132 y de x=868 a x=988, entre y=200 e y=440.`
      : `Es el tablero de ${TB.label.toLowerCase()}: mide ${TB.w} de ancho por ${TB.h} de alto y enseña solo la zona donde ocurre la jugada, con la PORTERÍA ARRIBA. y=${Math.round(TB.Y(0))} es la línea de gol y la y crece alejándose de ella. El área grande va de x=${Math.round(TB.X(REGLA.ancho / 2 - REGLA.area.medio))} a x=${Math.round(TB.X(REGLA.ancho / 2 + REGLA.area.medio))} y llega hasta y=${Math.round(TB.Y(REGLA.area.fondo))}. El punto de penalti está en x=${Math.round(TB.X(REGLA.ancho / 2))}, y=${Math.round(TB.Y(REGLA.punto))}. Un metro son ${TB.esc.toFixed(1)} unidades.`;
    const system = `Eres el ayudante de una pizarra táctica de fútbol. ${donde}
Fichas: "home" (equipo propio, con dorsal en label), "away" (rival), "ball", "cone", "disc", "goal".
Trazos: "arrow" (desmarque), "pass", "dribble", "free", "zone", "circle" (dos puntos), "text" (un punto y el campo text).
Devuelve SOLO un objeto JSON con las claves "tokens" y "shapes", sin explicación ni markdown, con la pizarra COMPLETA ya modificada. Mantén las fichas que no haya que tocar tal cual. Coordenadas enteras y siempre dentro del tablero.`;
    const mensajes = [{ role: "user", content: `Pizarra actual:\n${JSON.stringify(pizarra)}\n\nCambio pedido: ${orden}` }];
    const data = await coachRequest(system, mensajes, 2000);
    const txt = (data?.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    setIaBusy(false);
    let out = null;
    try {
      const a = txt.indexOf("{"), b = txt.lastIndexOf("}");
      if (a >= 0 && b > a) out = limpiarIA(JSON.parse(txt.slice(a, b + 1)));
    } catch { out = null; }
    if (!out) { setIaMsg(txt.trim().slice(0, 140) || "No he entendido el cambio. Dilo de otra forma, por ejemplo: \"mueve al 9 al segundo palo\"."); return; }
    snap();
    setTokens(out.tokens);
    setShapes(out.shapes);
    setDraft(null); setTool("move");
    setIaTexto(""); setIaMsg("✓ Hecho. Si no te convence, deshaz con ↶.");
  };
  const moverPlay = (id, paso) => setPlays((ps) => {
    const i = ps.findIndex((x) => x.id === id);
    const j = i + paso;
    if (i < 0 || j < 0 || j >= ps.length) return ps;
    const out = [...ps];
    [out[i], out[j]] = [out[j], out[i]];
    return out;
  });
  /* Al abrir una jugada guardada se recupera el tablero en el que se dibujó.
     Las de balón parado traen el suyo; las del campo entero se encuadran solas
     en la zona donde ocurren, que es lo que hace falta ver desde el banquillo. */
  const loadPlay = (p) => {
    snap(); setTokens(p.tokens || []); setShapes(p.shapes || []); setDraft(null); setTool("move");
    setPlayAbierta(p.id);
    if (p.tablero && p.tablero !== "campo" && TABLEROS[p.tablero]) { setTablero(p.tablero); return; }
    const xs = (p.tokens || []).map((tk) => tk.x);
    if (xs.length) {
      const medio = xs.reduce((a, b) => a + b, 0) / xs.length;
      const cerca = xs.every((x) => (medio > 500 ? x > 380 : x < 620));
      setPitchView(cerca ? (medio > 500 ? "areaDer" : "areaIzq") : "completo");
    } else setPitchView("completo");
  };
  /* Carga las posiciones de partida de un ABP para empezar a dibujar encima.

     Córner, falta y penalti tienen tablero propio: las posiciones están
     escritas en metros y se traducen al tablero al vuelo. `lado` dice por qué
     lado ocurre; como todo está en metros, cambiar de lado es reflejar la x
     sobre el eje del campo (68 − x), no reencuadrar nada. El penalti no tiene
     lado que valga: se lanza desde el punto.

     Saque de banda y saque de puerta se siguen dibujando sobre el campo
     entero, porque es donde pasan: ahí sí hace falta ver los cien metros. */
  const espejoX = (x) => 1000 - x;
  const cargarABP = (k, lado = abpLado, fase = abpFase) => {
    const enMetros = ABP_METROS[k]?.[fase === "def" ? "def" : "ata"];
    if (enMetros) {
      const clave = k === "corner" ? (lado === "izq" ? "cornerIzq" : "cornerDer") : ABP_TABLERO[k];
      const tb = TABLEROS[clave];
      const espejo = k !== "penalti" && lado === "izq";
      const P = (p) => ({
        x: Math.round(tb.X(espejo ? REGLA.ancho - p.x : p.x)),
        y: Math.round(tb.Y(p.y)),
      });
      snap();
      setTokens(enMetros.tokens.map((tk, i) => ({ type: tk.type, label: tk.label, ...P(tk), id: uid.current + i })));
      uid.current += enMetros.tokens.length + 1;
      setShapes(enMetros.shapes.map((s, i) => ({ tool: s.tool, pts: s.pts.map(P), id: uid.current + i })));
      uid.current += enMetros.shapes.length + 1;
      setDraft(null); setTool("move");
      setTablero(clave);
      return;
    }
    const build = (fase === "def" ? ABP_SETUP_DEF : ABP_SETUP)[k];
    if (!build) return;
    const ladoBase = k === "puerta" ? "izq" : "der";
    const girar = lado !== ladoBase;
    const { tokens: tk, shapes: sh } = build();
    snap();
    setTokens(tk.map((t, i) => ({ ...t, x: girar ? espejoX(t.x) : t.x, id: uid.current + i })));
    uid.current += tk.length + 1;
    setShapes(sh.map((s, i) => ({
      ...s, pts: (s.pts || []).map((q) => ({ ...q, x: girar ? espejoX(q.x) : q.x })), id: uid.current + i,
    })));
    uid.current += sh.length + 1;
    setDraft(null); setTool("move");
    setPitchView(lado === "izq" ? "areaIzq" : "areaDer");
  };
  /* El modo partido manda aquí el id de una jugada guardada: se abre la
     pizarra ya con esa jugada puesta, sin buscarla a mano en el banquillo. */
  useEffect(() => {
    if (!pendingPlayId) return;
    const p = plays.find((x) => String(x.id) === String(pendingPlayId));
    if (p) loadPlay(p);
    onConsumePlay?.();
  }, [pendingPlayId, plays]); // eslint-disable-line
  const exportPng = () => {
    if (!canSavePlays) { onPro?.(); return; }
    const svg = svgRef.current;
    if (!svg) return;
    const xml = serializeBoard();
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = base.w * 2; c.height = base.h * 2;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#152219"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = `pizarra-${hoyISO()}.png`;
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(xml)));
  };

  /* --- interacción --- */
  const TOKEN_TOOLS = { cone: "cone", disc: "disc", home: "home", away: "away", goal: "goal" };
  const onTokenDown = (e, id) => {
    e.stopPropagation();
    if (tool === "erase") { snap(); setTokens((ts) => ts.filter((x) => x.id !== id)); return; }
    /* Dorsal: los ABP vienen con números de ejemplo (7, 4, 9…) y en tu equipo
       los lleva otra gente. Con esta herramienta se toca la ficha y se pone el
       dorsal de verdad, que es lo que el chaval reconoce en la pizarra. */
    if (tool === "dorsal") {
      const tk = tokens.find((x) => x.id === id);
      if (!tk || !["home", "away"].includes(tk.type)) return;
      const v = window.prompt("Dorsal de esta ficha (vacío para quitarlo)", tk.label || "");
      if (v === null) return;
      snap();
      setTokens((ts) => ts.map((x) => (x.id === id ? { ...x, label: v.trim().slice(0, 3) } : x)));
      return;
    }
    if (tool === "move") { snap(); drag.current = id; e.currentTarget.setPointerCapture?.(e.pointerId); }
  };
  const onDown = (e) => {
    const p = toVB(e);
    if (TOKEN_TOOLS[tool]) {
      snap();
      const n = tokens.filter((x) => x.type === tool).length + 1;
      const label = tool === "home" || tool === "away" ? String(n) : "";
      setTokens((ts) => [...ts, { id: uid.current++, type: TOKEN_TOOLS[tool], x: p.x, y: p.y, label }]);
      return;
    }
    if (tool === "text") {
      const txt = window.prompt("Texto de la anotación");
      if (!txt) return;
      snap();
      setShapes((s) => [...s, { id: uid.current++, tool: "text", pts: [p], text: txt, color, width }]);
      return;
    }
    if (["arrow", "pass", "dribble", "free", "zone", "circle"].includes(tool)) setDraft({ tool, pts: [p, p], color, width });
  };
  const onMove = (e) => {
    if (drag.current != null) { const p = toVB(e); setTokens((ts) => ts.map((tk) => (tk.id === drag.current ? { ...tk, x: p.x, y: p.y } : tk))); return; }
    if (draft) { const p = toVB(e); setDraft((d) => (d.tool === "free" ? { ...d, pts: [...d.pts, p] } : { ...d, pts: [d.pts[0], p] })); }
  };
  const onUp = () => {
    if (drag.current != null) { drag.current = null; }
    if (draft) {
      const a = draft.pts[0], b = draft.pts[draft.pts.length - 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len > 12 || draft.tool === "free") { snap(); setShapes((s) => [...s, { ...draft, id: uid.current++ }]); }
      setDraft(null);
    }
  };

  /* --- gestos: 1 dedo dibuja, 2 dedos hacen zoom y desplazan --- */
  const ptrs = useRef(new Map());
  const gesture = useRef(null);
  const midOf = () => { const [a, b] = [...ptrs.current.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) || 1 }; };
  const onSvgDown = (e) => {
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.current.size === 2) {
      /* al aparecer el segundo dedo se anula lo que estuviera dibujando o
         arrastrando: el gesto pasa a ser zoom, no trazo */
      setDraft(null); drag.current = null;
      const m = midOf();
      gesture.current = { d: m.d, mid: toSvg(m.x, m.y) };
      return;
    }
    if (ptrs.current.size > 1) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    try { onDown(e); } catch (err) { console.error(err); }
    /* si TEXTO se cancela, libera el capture para que otros controles funcionen */
    if (tool === "text") e.currentTarget.releasePointerCapture?.(e.pointerId);
  };
  const onSvgMove = (e) => {
    if (ptrs.current.has(e.pointerId)) ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (gesture.current && ptrs.current.size >= 2) {
      const m = midOf();
      const midSvg = toSvg(m.x, m.y);
      const g = gesture.current;
      const factor = g.d / m.d;            /* separar los dedos = acercar */
      setView((v) => {
        const w = clamp(v.w * factor, MIN_W, MAX_W);
        const f = w / v.w;
        /* escala alrededor del punto medio y además sigue el desplazamiento
           de los dedos; al ser incremental no acumula error */
        return clampView({
          x: midSvg.x - (midSvg.x - v.x) * f - (midSvg.x - g.mid.x),
          y: midSvg.y - (midSvg.y - v.y) * f - (midSvg.y - g.mid.y),
          w, h: v.h * f,
        });
      });
      gesture.current = { d: m.d, mid: midSvg };
      return;
    }
    if (ptrs.current.size > 1) return;
    onMove(e);
  };
  const onSvgUp = (e) => {
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size < 2) gesture.current = null;
    if (ptrs.current.size === 0) onUp();
  };
  /* Zoom con rueda / trackpad. Va como listener nativo con passive:false porque
     React registra onWheel como pasivo y ahí preventDefault no haría nada. */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey && !full) return;  /* fuera de pantalla completa solo con Ctrl, para no secuestrar el scroll de la página */
      e.preventDefault();
      const p = toSvg(e.clientX, e.clientY);
      zoomBy(e.deltaY > 0 ? 1.12 : 0.89, p.x, p.y);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [full, view, pitchView]); // eslint-disable-line

  const pathOf = (pts) => pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
  const wavyPath = (a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    const step = 16, amp = 7;
    let d = `M${a.x},${a.y}`;
    for (let i = step; i < len - step; i += step) {
      const s = (Math.round(i / step) % 2 === 0 ? 1 : -1) * amp;
      d += ` L${a.x + ux * i + nx * s},${a.y + uy * i + ny * s}`;
    }
    return `${d} L${b.x},${b.y}`;
  };
  const drawShape = (s, ghost) => {
    const col = ghost ? "rgba(255,255,255,0.6)" : (s.color || "#FFFFFF");
    const sw = s.width || 4;
    const common = {
      fill: "none", stroke: col, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round",
      style: { cursor: tool === "erase" ? "pointer" : "default" },
      onPointerDown: (e) => { if (tool === "erase") { e.stopPropagation(); snap(); setShapes((x) => x.filter((z) => z.id !== s.id)); } },
    };
    const k = s.id ?? "d";
    if (s.tool === "text") {
      return (
        <text key={k} data-wb-up x={s.pts[0].x} y={s.pts[0].y} fill={col} fontSize={22 + sw * 2} fontFamily="Barlow Condensed, sans-serif" fontWeight="700"
          transform={textoDerecho(s.pts[0].x, s.pts[0].y)}
          style={{ cursor: tool === "erase" ? "pointer" : "default" }}
          onPointerDown={(e) => { if (tool === "erase") { e.stopPropagation(); snap(); setShapes((x) => x.filter((z) => z.id !== s.id)); } }}>{s.text}</text>
      );
    }
    if (s.tool === "zone") {
      const a = s.pts[0], b = s.pts[1];
      return <rect key={k} x={Math.min(a.x, b.x)} y={Math.min(a.y, b.y)} width={Math.abs(b.x - a.x)} height={Math.abs(b.y - a.y)}
        {...common} fill={col} fillOpacity="0.13" strokeDasharray="8 6" />;
    }
    if (s.tool === "circle") {
      const a = s.pts[0], b = s.pts[1];
      return <circle key={k} cx={a.x} cy={a.y} r={Math.hypot(b.x - a.x, b.y - a.y)} {...common} fill={col} fillOpacity="0.10" />;
    }
    if (s.tool === "pass") return <path key={k} d={pathOf(s.pts)} strokeDasharray="10 10" markerEnd="url(#wbArrow)" {...common} />;
    if (s.tool === "dribble") return <path key={k} d={wavyPath(s.pts[0], s.pts[s.pts.length - 1])} markerEnd="url(#wbArrow)" {...common} />;
    if (s.tool === "arrow") return <path key={k} d={pathOf(s.pts)} markerEnd="url(#wbArrow)" {...common} />;
    return <path key={k} d={pathOf(s.pts)} {...common} />;
  };
  /* En el campo el color sí distingue: los tuyos en blanco y el rival en carbón
     con aro blanco, que es el contraste máximo sobre el gris del césped. */
  const tokenFill = (ty) => (ty === "home" ? "#FFFFFF" : ty === "away" ? AWAY : ty === "ball" ? "#FFFFFF" : ty === "disc" ? "#9FB0BA" : ty === "goal" ? "#E6EAEC" : "#C0C8CD");

  const tools = [
    ["move", t("w.move"), "✋"], ["arrow", t("w.arrow"), "↗"], ["pass", t("w.pass"), "⇢"],
    ["dribble", "Conducción", "〰"], ["free", t("w.free"), "✎"], ["zone", "Zona", "▭"], ["circle", "Círculo", "◯"],
    ["text", "Texto", "T"], ["cone", t("w.cone"), "▲"], ["disc", "Seta", "●"],
    /* Glifos, no emoji: el emoji trae su propio color y su propio dibujo, que
       en cada sistema es distinto, y es lo que delata una interfaz montada
       deprisa. Aquí el color lo pone el estado, no el icono. */
    ["home", "Jugador", "○"], ["away", "Rival", "◉"], ["goal", "Portería", "⊓"],
    ["dorsal", "Dorsal", "№"], ["erase", t("w.erase"), "⌫"],
  ];

  /* Barra compacta: en movil los botones son solo icono (h-8) y todo lo que no
     se usa a cada segundo vive en desplegables, para dejar sitio al campo. */
  const btn = "h-9 px-2.5 rounded-lg border text-xs font-display uppercase tracking-wide inline-flex items-center gap-1 shrink-0";
  const [exQ, setExQ] = useState("");
  const exList = EXERCISES.filter((ex) => {
    const q = exQ.trim().toLowerCase();
    if (!q) return true;
    return ((ex.name[lang] || ex.name.es) + " " + (t("ex.cat." + ex.cat) || "")).toLowerCase().includes(q);
  });

  const Toolbar = (
    <>
      {/* herramientas de dibujo: icono siempre, texto solo si hay sitio */}
      {/* En el móvil, envolver a tres filas dejaba el campo reducido a una
          tira: ahora es UNA fila que se desliza con el dedo. En pantalla
          ancha sigue envolviendo como antes. */}
      <div className="flex flex-nowrap sm:flex-wrap overflow-x-auto sm:overflow-visible gap-1 mb-1.5 -mx-1 px-1 wb-scroll">
        {tools.map(([k, lbl, ic]) => (
          <button key={k} onClick={() => setTool(k)} title={lbl} aria-label={lbl} aria-pressed={tool === k}
            className="h-9 min-w-9 shrink-0 px-1.5 rounded-lg border text-xs font-display uppercase tracking-wide inline-flex items-center justify-center gap-1"
            style={{ borderColor: tool === k ? AC : C.line, background: tool === k ? AC : C.panel2, color: tool === k ? "#141414" : C.chalk }}>
            <span>{ic}</span><span className="hidden lg:inline">{lbl}</span>
          </button>
        ))}
      </div>

      {/* color, grosor y acciones rapidas */}
      <div className="flex flex-nowrap sm:flex-wrap items-center overflow-x-auto sm:overflow-visible gap-1 mb-1.5 -mx-1 px-1 wb-scroll">
        <div className="flex gap-1 items-center shrink-0">
          {PALETTE.map(([c, n]) => (
            <button key={c} onClick={() => setColor(c)} title={n} aria-label={n} className="w-6 h-6 rounded-full border-2 shrink-0"
              style={{ background: c, borderColor: color === c ? "#fff" : "transparent" }} />
          ))}
        </div>
        <div className="flex gap-1 shrink-0">
          {[3, 5, 8].map((w) => (
            <button key={w} onClick={() => setWidth(w)} title={`Grosor ${w}`} className="w-7 h-8 rounded-lg border flex items-center justify-center shrink-0"
              style={{ borderColor: width === w ? AC : C.line, background: C.panel2 }}>
              <span style={{ display: "block", width: 14, height: w, background: color, borderRadius: 4 }} />
            </button>
          ))}
        </div>
        <button onClick={undo} disabled={!hist.length} title="Deshacer" className={btn + " disabled:opacity-35"} style={{ borderColor: C.line, color: C.chalk }}>↶<span className="hidden lg:inline">Deshacer</span></button>
        <button onClick={redo} disabled={!fut.length} title="Rehacer" className={btn + " disabled:opacity-35"} style={{ borderColor: C.line, color: C.chalk }}>↷<span className="hidden lg:inline">Rehacer</span></button>
        <button onClick={() => setSnapGrid((v) => !v)} title={`Cuadrícula ${snapGrid ? "ON" : "OFF"}`} className={btn} style={{ borderColor: snapGrid ? AC : C.line, color: snapGrid ? AC : C.chalk }}>▦<span className="hidden lg:inline">{snapGrid ? "ON" : "OFF"}</span></button>
        <button onClick={addBall} title={t("w.ball")} className={btn} style={{ borderColor: C.line, color: C.chalk }}>◍<span className="hidden lg:inline">{t("w.ball")}</span></button>
        <button onClick={() => { snap(); setTokens([]); setShapes([]); setDraft(null); }} title={t("w.clear")} className={btn} style={{ borderColor: C.line, color: C.red }}>✕<span className="hidden lg:inline">{t("w.clear")}</span></button>
      </div>

      {/* desplegables + acciones */}
      <div className="flex flex-nowrap sm:flex-wrap items-center overflow-x-auto sm:overflow-visible gap-1 mb-2 -mx-1 px-1 wb-scroll">
        <WbMenu label={t("w.exercises")} icon="🎯" count={EXERCISES.length} AC={AC} wide>
          {(close) => (
            <div className="flex flex-col" style={{ maxHeight: "min(60vh, 380px)" }}>
              <div className="p-2 border-b shrink-0" style={{ borderColor: C.line }}>
                <input value={exQ} onChange={(e) => setExQ(e.target.value)} placeholder="Buscar ejercicio…" autoFocus
                  className="w-full text-sm rounded-lg px-2.5 py-1.5 border bg-transparent outline-none"
                  style={{ borderColor: C.line, color: C.chalk }} />
              </div>
              <div className="overflow-y-auto">
                {EX_CATS.map((cat) => {
                  const items = exList.filter((ex) => ex.cat === cat);
                  if (!items.length) return null;
                  return (
                    <div key={cat}>
                      <div className="px-2.5 py-1 text-[10px] font-display uppercase tracking-widest sticky top-0"
                        style={{ color: AC, background: C.panel2 }}>{t("ex.cat." + cat)}</div>
                      {items.map((ex) => (
                        <button key={ex.id} onClick={() => { applyExercise(ex); close(); }}
                          className="w-full flex items-center gap-2 px-2.5 py-3 min-h-11 border-b text-left"
                          style={{ borderColor: "rgba(54,69,79,0.10)" }}>
                          <span className="text-base leading-none shrink-0">{ex.icon}</span>
                          <span className="text-xs flex-1 leading-tight" style={{ color: C.chalk }}>{ex.name[lang] || ex.name.es}</span>
                          <span className="text-[10px] tabular-nums shrink-0" style={{ color: C.dim }}>{ex.dur}′</span>
                        </button>
                      ))}
                    </div>
                  );
                })}
                {!exList.length && <div className="px-3 py-4 text-xs text-center" style={{ color: C.dim }}>Sin resultados</div>}
              </div>
            </div>
          )}
        </WbMenu>

        {/* ABP: coloca las posiciones de partida de la situación y deja que el
            entrenador dibuje encima, en vez de montarlo todo ficha a ficha. */}
        <WbMenu label="ABP" icon="⚐" AC={AC}>
          {(close) => (
            <div className="max-h-[min(50vh,320px)] overflow-y-auto">
              <div className="px-2.5 py-1 text-[10px] font-display uppercase tracking-widest" style={{ color: AC, background: C.panel2 }}>¿A favor o en contra?</div>
              <div className="flex gap-1 p-2 pb-0">
                {[["ata", "Ataque"], ["def", "Defensa"]].map(([k, l]) => (
                  <button key={k} onClick={() => setAbpFase(k)} className="flex-1 text-xs px-2 py-1.5 rounded-lg border"
                    style={{ borderColor: abpFase === k ? AC : C.line, background: abpFase === k ? AC : "transparent", color: abpFase === k ? "#141414" : C.chalk }}>{l}</button>
                ))}
              </div>
              <div className="px-2.5 py-1 mt-1 text-[10px] font-display uppercase tracking-widest" style={{ color: AC, background: C.panel2 }}>¿Por qué lado?</div>
              <div className="flex gap-1 p-2">
                {[["izq", "◂ Izquierda"], ["der", "Derecha ▸"]].map(([k, l]) => (
                  <button key={k} onClick={() => setAbpLado(k)} className="flex-1 text-xs px-2 py-1.5 rounded-lg border"
                    style={{ borderColor: abpLado === k ? AC : C.line, background: abpLado === k ? AC : "transparent", color: abpLado === k ? "#141414" : C.chalk }}>{l}</button>
                ))}
              </div>
              <div className="px-2.5 py-1 text-[10px] font-display uppercase tracking-widest" style={{ color: AC, background: C.panel2 }}>Colocar situación</div>
              {/* En cuadrícula y con tarjetas grandes: en el móvil, con guantes
                  o con prisa, una lista de renglones finos no se acierta. */}
              <div className="grid grid-cols-2 gap-1.5 p-2">
                {ABP_TIPOS.map((a) => (
                  <button key={a.k} onClick={() => { cargarABP(a.k); close(); }}
                    className="flex flex-col items-start gap-1 rounded-lg border px-2.5 py-2.5 min-h-[68px] text-left"
                    style={{ borderColor: C.line, background: C.panel2 }}>
                    <span className="text-lg leading-none" style={{ color: AC }}>{a.icon}</span>
                    <span className="text-xs leading-tight" style={{ color: C.chalk }}>{a.name[lang] || a.name.es}</span>
                    <span className="text-[10px]" style={{ color: C.dim }}>
                      {abpFase === "def" ? "en contra" : "a favor"}
                      {a.k !== "penalti" && ` · ${abpLado === "izq" ? "izquierda" : "derecha"}`}
                      {ABP_TABLERO[a.k] && " · tablero propio"}
                    </span>
                  </button>
                ))}
              </div>
              <div className="px-2.5 py-1 mt-1 text-[10px] font-display uppercase tracking-widest" style={{ color: AC, background: C.panel2 }}>Guardar la pizarra como</div>
              {ABP_TIPOS.map((a) => (
                <button key={a.k} onClick={() => { savePlay(a.k); close(); }}
                  className="w-full flex items-center gap-2 px-2.5 py-3 min-h-11 border-b text-left"
                  style={{ borderColor: "rgba(54,69,79,0.10)" }}>
                  <span className="text-base leading-none shrink-0" style={{ color: C.dim }}>{a.icon}</span>
                  <span className="text-xs flex-1 leading-tight" style={{ color: C.chalk }}>
                    {a.name[lang] || a.name.es} <span style={{ color: C.dim }}>· {abpFase === "def" ? "en contra" : "a favor"}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </WbMenu>

        {/* Retocar la pizarra hablándole en cristiano. Va antes de Jugadas
            porque se usa mientras se dibuja, no al guardar. */}
        <WbMenu label="Ayuda IA" icon="✦" AC={AC}>
          <div className="p-2 w-[min(88vw,380px)]">
            <div className="text-[10px] font-display uppercase tracking-widest mb-1" style={{ color: C.dim }}>Dile el cambio</div>
            <textarea value={iaTexto} onChange={(e) => setIaTexto(e.target.value)} rows={3}
              placeholder="Ej. mueve al 9 al segundo palo y saca al 4 al borde del área"
              className="w-full text-xs px-2 py-1.5 rounded-lg border bg-transparent resize-none"
              style={{ borderColor: C.line, color: C.chalk }} />
            <button onClick={pedirIA} disabled={!iaTexto.trim() || iaBusy}
              className="w-full mt-2 h-8 rounded-lg text-xs font-display uppercase tracking-wide font-semibold disabled:opacity-40"
              style={{ background: AC, color: C.sobre }}>
              {iaBusy ? "Pensando…" : "Aplicar a la pizarra"}
            </button>
            {iaMsg && <div className="text-[11px] mt-2" style={{ color: iaMsg.startsWith("✓") ? C.green : C.dim }}>{iaMsg}</div>}
            <div className="text-[10px] mt-2 leading-snug" style={{ color: C.dim }}>
              Cambia las fichas y los trazos de lo que tengas ahora en el campo. Si no te gusta, ↶ Deshacer lo devuelve como estaba.
            </div>
          </div>
        </WbMenu>

        <WbMenu label="Jugadas" icon="💾" count={plays.length} AC={AC}>
          {(close) => (
            <div className="max-h-[min(50vh,300px)] overflow-y-auto">
              <button onClick={() => { savePlay("libre"); close(); }} className="w-full text-left px-2.5 py-2 border-b text-xs font-display uppercase tracking-wide"
                style={{ borderColor: C.line, color: AC }}>+ Guardar como nueva</button>
              <button onClick={compartirJugadas} className="w-full text-left px-2.5 py-2 border-b text-xs"
                style={{ borderColor: C.line, color: C.chalk }}>
                ⬆ Compartir con el equipo
                <span className="block text-[10px] mt-0.5" style={{ color: C.dim }}>
                  Las verán tu segundo y tu delegado desde su móvil, también en Modo partido.
                </span>
              </button>
              {nubeMsg && <div className="px-2.5 py-1.5 text-[11px] border-b" style={{ borderColor: C.line, color: nubeMsg.startsWith("✓") ? C.green : C.dim }}>{nubeMsg}</div>}
              {plays.some((x) => x.id === playAbierta) && (
                <button onClick={() => { actualizarPlay(); close(); }} className="w-full text-left px-2.5 py-2 border-b text-xs"
                  style={{ borderColor: C.line, color: C.chalk }}>
                  ↻ Guardar los cambios en <strong>{plays.find((x) => x.id === playAbierta)?.name}</strong>
                </button>
              )}
              {plays.map((p, iP) => (
                <div key={p.id} className="flex items-center border-b" style={{ borderColor: "rgba(54,69,79,0.10)" }}>
                  <button onClick={() => { loadPlay(p); close(); }} className="flex-1 flex items-center gap-2 text-left px-2.5 py-3 min-h-11 text-xs" style={{ color: C.chalk }}>
                    {p.tipo && p.tipo !== "libre" && (
                      <span className="shrink-0 text-[13px] leading-none" title={ABP_NOMBRE(p.tipo, lang)} style={{ color: AC }}>
                        {(ABP_TIPOS.find((x) => x.k === p.tipo) || {}).icon}
                      </span>
                    )}
                    <span className="truncate" style={{ color: p.id === playAbierta ? AC : C.chalk }}>{p.name}</span>
                  </button>
                  <button onClick={() => moverPlay(p.id, -1)} disabled={iP === 0} aria-label="Subir" className="px-1.5 py-2 text-xs disabled:opacity-25" style={{ color: C.dim }}>▲</button>
                  <button onClick={() => moverPlay(p.id, 1)} disabled={iP === plays.length - 1} aria-label="Bajar" className="px-1.5 py-2 text-xs disabled:opacity-25" style={{ color: C.dim }}>▼</button>
                  <button onClick={() => renombrarPlay(p)} aria-label="Renombrar" className="px-1.5 py-2 text-xs" style={{ color: C.dim }}>✎</button>
                  <button onClick={() => { setPlays((ps) => ps.filter((x) => x.id !== p.id)); if (p.id === playAbierta) setPlayAbierta(null); }} aria-label="Borrar" className="px-2 py-2 text-xs" style={{ color: C.dim }}>✕</button>
                </div>
              ))}
              {!plays.length && <div className="px-3 py-4 text-xs text-center" style={{ color: C.dim }}>Aún no hay jugadas guardadas</div>}
            </div>
          )}
        </WbMenu>

        <WbMenu label="Vista" icon="🔍" AC={AC}>
          <div className="p-2">
            {!enCampo && (
              /* En un tablero de balón parado no hay encuadres que elegir: el
                 tablero YA es la zona. Lo único que hace falta es la puerta de
                 vuelta al campo entero. */
              <div className="mb-3">
                <div className="text-[10px] font-display uppercase tracking-widest mb-1" style={{ color: C.dim }}>Tablero</div>
                <div className="text-xs mb-2 px-1" style={{ color: C.chalk }}>{TB.label} · a escala real</div>
                <button onClick={() => setPitchView("completo")} className="w-full text-xs px-2 py-2 rounded-lg border"
                  style={{ borderColor: C.line, color: C.chalk }}>‹ Volver al campo entero</button>
              </div>
            )}
            {enCampo && (
              <>
                <div className="text-[10px] font-display uppercase tracking-widest mb-1" style={{ color: C.dim }}>Encuadre</div>
                <div className="grid grid-cols-2 gap-1 mb-3">
                  {Object.entries(PITCH_VIEWS).map(([k, v]) => (
                    <button key={k} onClick={() => setPitchView(k)} className="text-xs px-2 py-1.5 rounded-lg border"
                      style={{ borderColor: pitchView === k ? AC : C.line, background: pitchView === k ? AC : "transparent", color: pitchView === k ? "#141414" : C.chalk }}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="text-[10px] font-display uppercase tracking-widest mb-1" style={{ color: C.dim }}>Zoom · {zoomPct}%</div>
            <div className="flex items-center gap-1 mb-3">
              <button onClick={() => zoomBy(1.25)} className="flex-1 h-8 rounded-lg border" style={{ borderColor: C.line, color: C.chalk }}>−</button>
              <button onClick={resetView} className="flex-1 h-8 rounded-lg border text-[11px]" style={{ borderColor: C.line, color: C.chalk }}>Ajustar</button>
              <button onClick={() => zoomBy(0.8)} className="flex-1 h-8 rounded-lg border" style={{ borderColor: C.line, color: C.chalk }}>+</button>
            </div>
            <div className="text-[10px] mb-2" style={{ color: C.dim }}>Con dos dedos: pellizca para acercar y arrastra para mover.</div>
            <div className="text-[10px] font-display uppercase tracking-widest mb-1" style={{ color: C.dim }}>☀ Brillo · {Math.round(bright * 100)}%</div>
            <input type="range" min="0.6" max="1.8" step="0.05" value={bright} onChange={(e) => setBright(Number(e.target.value))} className="w-full" />
          </div>
        </WbMenu>

        <WbMenu label="Pasos" icon="⏱" count={steps.length || null} AC={AC}>
          <div className="p-2">
            <button onClick={addStep} className="w-full h-8 rounded-lg border text-xs font-display uppercase tracking-wide mb-2"
              style={{ borderColor: AC, color: AC }}>+ Añadir paso</button>
            {steps.length > 0 ? (
              <>
                <div className="flex items-center gap-1 mb-2">
                  <button onClick={() => goStep(stepIdx - 1)} disabled={stepIdx <= 0} className="w-8 h-8 rounded-lg border disabled:opacity-30" style={{ borderColor: C.line, color: C.chalk }}>‹</button>
                  <span className="flex-1 text-center text-xs tabular-nums" style={{ color: C.chalk }}>Paso {stepIdx + 1} de {steps.length}</span>
                  <button onClick={() => goStep(stepIdx + 1)} disabled={stepIdx >= steps.length - 1} className="w-8 h-8 rounded-lg border disabled:opacity-30" style={{ borderColor: C.line, color: C.chalk }}>›</button>
                </div>
                <button onClick={() => setPlaying((v) => !v)} className="w-full h-8 rounded-lg border text-xs font-semibold mb-1"
                  style={{ borderColor: playing ? AC : C.line, background: playing ? AC : "transparent", color: playing ? "#141414" : C.chalk }}>
                  {playing ? "❚❚ Pausa" : "▶ Reproducir"}
                </button>
                <button onClick={clearSteps} className="w-full h-8 rounded-lg border text-xs" style={{ borderColor: C.line, color: C.red }}>Borrar secuencia</button>
              </>
            ) : <div className="text-[11px] text-center py-2" style={{ color: C.dim }}>Guarda instantáneas para explicar la jugada paso a paso.</div>}
          </div>
        </WbMenu>

        {/* Solo en móvil y fuera de pantalla completa: es quien abre el panel
            de sistemas, que únicamente existe en la vista normal. */}
        {!full && (
          <button onClick={() => setSistemasAbierto((v) => !v)} title="Sistemas" className={btn + " sm:hidden"}
            style={{ borderColor: sistemasAbierto ? AC : C.line, color: sistemasAbierto ? AC : C.chalk }}>
            ⊞ {codeHome} <span style={{ color: C.dim }}>vs</span> {codeAway}
          </button>
        )}
        <button onClick={exportPng} title="Exportar PNG" className={btn} style={{ borderColor: C.line, color: C.chalk }}>⤓<span className="hidden lg:inline">PNG</span></button>
        {!recording
          ? <button onClick={startRecording} title="Grabar vídeo" className={btn} style={{ borderColor: C.line, color: C.chalk }}>⏺<span className="hidden lg:inline">Vídeo</span></button>
          : <button onClick={stopRecording} className={btn + " font-semibold"} style={{ background: C.red, color: "#fff", borderColor: C.red }}>
              ■ {String(Math.floor(recSecs / 60)).padStart(2, "0")}:{String(recSecs % 60).padStart(2, "0")}
            </button>}
        <button onClick={() => setFull((f) => !f)} className={btn + " font-semibold ml-auto"}
          style={{ background: full ? C.red : AC, color: full ? "#fff" : "#141414", borderColor: full ? C.red : AC }}>
          {full ? "✕" : "⛶"}<span className="hidden sm:inline">{full ? "Salir" : "Pantalla completa"}</span>
        </button>
      </div>
    </>
  );

  const ZoomPad = (
    <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-lg border px-1 py-1"
      style={{ borderColor: C.line, background: "rgba(20,20,20,.72)", backdropFilter: "blur(2px)" }}>
      <button onClick={() => zoomBy(1.25)} aria-label="Alejar" className="w-8 h-8 rounded-md border font-display text-base leading-none"
        style={{ borderColor: C.line, color: C.chalk }}>−</button>
      <button onClick={resetView} className="px-2 h-8 rounded-md border text-[11px] tabular-nums"
        style={{ borderColor: C.line, color: zoomPct === 100 ? C.dim : AC }}>{zoomPct}%</button>
      <button onClick={() => zoomBy(0.8)} aria-label="Acercar" className="w-8 h-8 rounded-md border font-display text-base leading-none"
        style={{ borderColor: C.line, color: C.chalk }}>+</button>
    </div>
  );

  const Board = (
    <div className="relative">
    {/* En vertical se intercambian el encuadre y la proporción de la caja: el
        dibujo es el mismo, girado por el grupo de dentro.
        El alto se limita por el ANCHO, no con max-height: con max-height la
        caja se queda más baja pero igual de ancha y el campo flota dentro con
        franjas negras a los lados. Dando el ancho que corresponde a ese alto
        máximo, la proporción sale exacta, el campo llena su caja y los
        controles de debajo no se salen de la pantalla. */}
    <svg ref={svgRef} viewBox={vertical ? `0 0 ${view.h} ${view.w}` : `${view.x} ${view.y} ${view.w} ${view.h}`}
      className="w-full rounded-lg border touch-none select-none"
      style={{ borderColor: C.line, aspectRatio: vertical ? `${base.h}/${base.w}` : `${base.w}/${base.h}`, background: "#152219", filter: `brightness(${bright})`, maxHeight: full ? "72vh" : undefined, width: vertical ? `min(100%, calc(max(280px, 100vh - 390px) * ${(base.h / base.w).toFixed(4)}))` : undefined, marginInline: vertical ? "auto" : undefined }}
      onPointerDown={onSvgDown} onPointerMove={onSvgMove} onPointerUp={onSvgUp} onPointerCancel={onSvgUp}>
      <defs>
        <marker id="wbArrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#FFFFFF" /></marker>
      </defs>
      <g ref={gRef} data-wb-rot transform={vertical ? `translate(${view.h + view.y}, ${-view.x}) rotate(90)` : undefined}>
      {/* El campo entero y los tableros de balón parado son dos dibujos
          distintos, no el mismo con más o menos zoom. El grosor de la cal se
          calcula en metros reales en ambos, que es lo que evita que un tablero
          cerrado se lea como una foto ampliada. */}
      {enCampo ? (
        <>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={i * 125} y="0" width="125" height="640" fill={i % 2 ? "#17251D" : "#152219"} />)}
          <g stroke="rgba(255,255,255,0.55)" strokeWidth={grosorCal} fill="none">
            <rect x="12" y="12" width="976" height="616" /><line x1="500" y1="12" x2="500" y2="628" /><circle cx="500" cy="320" r="70" />
            <rect x="12" y="200" width="120" height="240" /><rect x="868" y="200" width="120" height="240" />
            <rect x="12" y="270" width="45" height="100" /><rect x="943" y="270" width="45" height="100" />
          </g>
        </>
      ) : (
        <>
          <FranjasTablero tb={TB} />
          <MarcasTablero tb={TB} grosor={grosorCal} />
        </>
      )}
      {shapes.map((s) => drawShape(s, false))}
      {draft && drawShape(draft, true)}
      {tokens.map((tk) => (
        <g key={tk.id} onPointerDown={(e) => onTokenDown(e, tk.id)} style={{ cursor: tool === "move" ? "grab" : tool === "erase" || tool === "dorsal" ? "pointer" : "default" }}>
          {/* Área de toque invisible: sin esto la ficha mide ~7 px reales en móvil */}
          <circle cx={tk.x} cy={tk.y} r="34" fill="transparent" />
          {tk.type === "cone"
            ? <path d={`M${tk.x},${tk.y - 16} L${tk.x + 14},${tk.y + 12} L${tk.x - 14},${tk.y + 12} Z`} fill={tokenFill(tk.type)} stroke={tk.type === "away" ? "#FFFFFF" : "#36454F"} strokeWidth="2" />
            : tk.type === "disc"
            ? <ellipse cx={tk.x} cy={tk.y} rx="14" ry="7" fill={tokenFill(tk.type)} stroke={tk.type === "away" ? "#FFFFFF" : "#36454F"} strokeWidth="2" />
            : tk.type === "goal"
            ? <g><rect x={tk.x - 30} y={tk.y - 12} width="60" height="24" fill="none" stroke={tokenFill(tk.type)} strokeWidth="4" />
                <line x1={tk.x - 30} y1={tk.y - 12} x2={tk.x - 30} y2={tk.y + 12} stroke={tokenFill(tk.type)} strokeWidth="4" />
                <line x1={tk.x + 30} y1={tk.y - 12} x2={tk.x + 30} y2={tk.y + 12} stroke={tokenFill(tk.type)} strokeWidth="4" /></g>
            : <>
                <circle cx={tk.x} cy={tk.y} r={tk.type === "ball" ? 13 : 20} fill={tokenFill(tk.type)} stroke={tk.type === "away" ? "#FFFFFF" : "#36454F"} strokeWidth={tk.type === "ball" ? 2 : 3} />
                {/* Centrado real (dominant-baseline) en vez del "+6" a ojo de
                    antes: así el punto de anclaje del dorsal ES el centro de la
                    ficha, y al deshacer el giro sobre ese mismo punto el número
                    queda centrado tanto en horizontal como en vertical. Con el
                    apaño de los 6 px se iba de sitio al girar el campo. */}
                {tk.label && <text data-wb-up x={tk.x} y={tk.y} textAnchor="middle" dominantBaseline="central" fontSize="20" fontFamily="Barlow Condensed, sans-serif" fontWeight="700" fill={tk.type === "away" ? "#FFFFFF" : "#36454F"} transform={textoDerecho(tk.x, tk.y)}>{tk.label}</text>}
              </>}
        </g>
      ))}
      </g>
    </svg>
    {/* Pantalla completa al alcance del pulgar y sin gastar una fila entera:
        antes era un cartel a lo ancho justo encima del campo, en el sitio que
        peor se puede gastar en un móvil. En escritorio ya está en la barra. */}
    {!full && (
      <button onClick={() => setFull(true)} aria-label="Pantalla completa" title="Pantalla completa"
        className="sm:hidden absolute right-2 top-2 w-9 h-9 rounded-lg border flex items-center justify-center"
        style={{ borderColor: C.line, background: "rgba(20,20,20,.72)", color: C.chalk, backdropFilter: "blur(2px)" }}>⛶</button>
    )}
    {ZoomPad}
    </div>
  );

  const RecCanvas = <canvas ref={recCanvasRef} style={{ display: "none" }} />;

  /* En el móvil la plantilla no puede ser una columna al lado del campo: hasta
     plegada se llevaba 40 de los ~350 px de ancho, y con el campo en vertical
     ese ancho es justo lo que le da tamaño. Debajo y en una tira que se
     desliza, cada dorsal es un botón redondo de 36 px -tamaño de dedo- y los
     que ya están puestos se apagan. Es la misma acción, colocada donde no
     compite con el campo. */
  const SquadStrip = squad.length > 0 && (
    <div className="sm:hidden mt-2 flex items-center gap-1.5 overflow-x-auto wb-scroll -mx-1 px-1">
      <span className="text-[10px] font-display uppercase tracking-widest shrink-0 pr-0.5" style={{ color: C.dim }}>Plantilla</span>
      {[...squad].sort((a, b) => a.d - b.d).map((pl) => {
        const puesto = tokens.some((x) => x.type === "home" && x.label === String(pl.d));
        return (
          <button key={pl.id} onClick={() => placePlayer(pl)} title={pl.n} aria-label={`${pl.d} ${pl.n}`}
            className="shrink-0 w-9 h-9 rounded-full border font-display text-xs font-bold flex items-center justify-center"
            style={{ borderColor: puesto ? C.line : AC, background: puesto ? "transparent" : AC, color: puesto ? C.dim : C.sobre }}>
            {pl.d}
          </button>
        );
      })}
    </div>
  );

  /* Panel izquierdo: plantilla real por dorsal. Toca un jugador y aparece en el campo. */
  const SquadPanel = squad.length > 0 && (
    <div className="hidden sm:flex shrink-0 rounded-lg border overflow-hidden flex-col"
      style={{ borderColor: C.line, background: C.panel, width: showSquad ? 128 : 40 }}>
      <button onClick={() => setShowSquad((v) => !v)}
        className="w-full text-[10px] font-display uppercase tracking-widest py-1.5 border-b"
        style={{ borderColor: C.line, color: AC }}>
        {showSquad ? "Plantilla ‹" : "›"}
      </button>
      {showSquad && (
        <div className="flex-1 overflow-y-auto">
          {[...squad].sort((a, b) => a.d - b.d).map((pl) => {
            const puesto = tokens.some((x) => x.type === "home" && x.label === String(pl.d));
            return (
              <button key={pl.id} onClick={() => placePlayer(pl)}
                className="w-full flex items-center gap-1.5 px-1.5 py-1.5 border-b text-left"
                style={{ borderColor: "rgba(54,69,79,0.10)", opacity: puesto ? 0.4 : 1 }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center font-display text-[11px] font-bold shrink-0"
                  style={{ background: AC, color: C.sobre }}>{pl.d}</span>
                <span className="text-[11px] truncate" style={{ color: C.chalk }}>{pl.n.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  /* Aquí vivía un aviso a lo ancho ("gira el móvil / abre pantalla completa")
     que existía solo porque el campo en vertical salía diminuto. Ahora el
     campo ya viene girado y ocupa la pantalla, así que el aviso sobra: la
     pantalla completa sigue a un toque, en el botón ⛶ sobre el propio campo. */

  if (full) {
    /* En móvil vertical no esperamos a que el usuario gire el teléfono: se rota
       el propio contenedor por CSS para presentarlo en horizontal, y la barra
       de herramientas se encoge (zoom) para dejar el máximo sitio al campo. */
    const rotStyle = portrait
      ? { transform: "rotate(-90deg)", transformOrigin: "left top", width: "100vh", height: "100vw", position: "fixed", top: "100%", left: 0, overflowY: "auto" }
      : { position: "fixed", inset: 0 };
    return (
      <div className="z-50 p-2 sm:p-4" style={{ background: C.bg, ...rotStyle }}>
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="font-display text-sm uppercase tracking-widest" style={{ color: C.dim }}>{t("w.title")} · pantalla completa</div>
          <button onClick={() => setFull(false)} className="text-sm px-4 py-2 rounded-lg font-display uppercase tracking-wide font-semibold" style={{ background: C.red, color: "#fff" }}>
            ✕ Salir (Esc)
          </button>
        </div>
        {Toolbar}
        <div className="flex gap-2 items-start">
          {SquadPanel}
          <div className="flex-1 min-w-0">{Board}</div>
        </div>
        {RecCanvas}
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4" style={{ background: C.panel, borderColor: C.line }}>
      {/* El título se cae en móvil: la sección ya se llama Pizarra en el menú
          y ese renglón es sitio que le quitas al campo. */}
      <div className="hidden sm:block font-display text-sm uppercase tracking-widest mb-3" style={{ color: C.dim }}>{t("w.title")}</div>
      {Toolbar}
      <div className="hidden sm:block text-[11px] mb-3" style={{ color: C.dim }}>{t("w.hint")}</div>

      {/* Los sistemas se eligen una vez y no se vuelven a tocar en toda la
          sesión: en el móvil van plegados, y el botón que los abre viaja con
          los demás en la fila deslizable de la barra, no ocupando él solo un
          renglón entero por delante del campo. */}
      <div className={`${sistemasAbierto ? "flex" : "hidden"} sm:flex flex-wrap items-end gap-3 mb-3 p-3 rounded-lg border`} style={{ borderColor: C.line, background: C.panel2 }}>
        <div className="flex gap-1">
          {[["f11", t("w.f11")], ["f7", t("w.f7")]].map(([k, lbl]) => (
            <button key={k} onClick={() => setFormat(k)} className="text-xs px-2.5 py-1.5 rounded-lg border font-display uppercase tracking-wide"
              style={{ borderColor: format === k ? AC : C.line, background: format === k ? AC : "transparent", color: format === k ? "#141414" : C.dim }}>{lbl}</button>
          ))}
        </div>
        <div>
          <div className="text-[10px] font-display uppercase tracking-widest mb-1" style={{ color: AC }}>{t("w.homeSys")}</div>
          <div className="flex gap-1.5">
            <select value={codeHome} onChange={(e) => setCodeHome(e.target.value)} className="text-sm rounded-lg px-2.5 py-1.5 outline-none border" style={{ background: C.panel, borderColor: C.line, color: C.chalk }}>
              {codes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={sysFree} onChange={(e) => setSysFree(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && /^\d+(-\d+)+$/.test(sysFree.trim())) { setCodeHome(sysFree.trim()); setSysFree(""); } }}
              placeholder="Otro" className="text-sm rounded-lg px-2 py-1.5 border bg-transparent w-20"
              style={{ borderColor: C.line, color: C.chalk }} />
            <button onClick={() => place("home")} className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: AC, color: AC }}>{t("w.form")}</button>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-display uppercase tracking-widest mb-1" style={{ color: AWAY }}>{t("w.awaySys")}</div>
          <div className="flex gap-1.5">
            <select value={codeAway} onChange={(e) => setCodeAway(e.target.value)} className="text-sm rounded-lg px-2.5 py-1.5 outline-none border" style={{ background: C.panel, borderColor: C.line, color: C.chalk }}>
              {codes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => place("away")} className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: AWAY, color: AWAY }}>{t("w.form")}</button>
          </div>
        </div>
        <div className="text-[10px] ml-auto self-center" style={{ color: C.dim }}>{t("w.autoSave")}</div>
      </div>

      <div className="flex gap-2 items-start">
        {SquadPanel}
        <div className="flex-1 min-w-0">{Board}</div>
      </div>
      {SquadStrip}
      {RecCanvas}
    </div>
  );
}

/* ---------------- Datos demo ---------------- */
/* Plantilla oficial real de Infantil B (C.D. Chamartín Vergara), tal y como
   la aportó el club: 19 jugadores, dorsal y demarcación. La ficha no incluye
   lado (izquierda/derecha) para los 5 extremos, así que se reparten entre
   ED/EI a partes iguales; ajusta la demarcación de cada uno desde "Jugadores"
   si no coincide con el lado real. Sin partidos ni entrenamientos todavía
   (pretemporada), así que asistencia y minutos arrancan en 0 y nadie tiene
   duda ni lesión salvo que el club lo indique. */
const PLAYERS_INIT = [
  { id: 1, n: "Alex Bustos", d: 1, pos: "POR", st: "disponible", att: 0, min: 0 },
  { id: 2, n: "Santiago Bo", d: 2, pos: "POR", st: "disponible", att: 0, min: 0 },
  { id: 3, n: "Daniel Fernández", d: 3, pos: "DFC", st: "disponible", att: 0, min: 0 },
  { id: 4, n: "Jalel Besnard", d: 4, pos: "DFC", st: "disponible", att: 0, min: 0 },
  { id: 5, n: "Matteo Martínez", d: 5, pos: "LD", st: "disponible", att: 0, min: 0 },
  { id: 6, n: "Iván Díez", d: 6, pos: "LD", st: "disponible", att: 0, min: 0 },
  { id: 7, n: "Guillermo Marañón", d: 7, pos: "LI", st: "disponible", att: 0, min: 0 },
  { id: 8, n: "Rodrigo Caldeira", d: 8, pos: "LI", st: "disponible", att: 0, min: 0 },
  { id: 9, n: "Matti Kisters", d: 9, pos: "MC", st: "disponible", att: 0, min: 0 },
  { id: 10, n: "Lorenzo Meyer", d: 10, pos: "MC", st: "disponible", att: 0, min: 0 },
  { id: 11, n: "Iñigo Fernández", d: 11, pos: "MC", st: "disponible", att: 0, min: 0 },
  { id: 12, n: "Deyan Collin", d: 12, pos: "MC", st: "disponible", att: 0, min: 0 },
  { id: 13, n: "José Bello", d: 13, pos: "MC", st: "disponible", att: 0, min: 0 },
  { id: 14, n: "Enrique de Sebastián", d: 14, pos: "ED", st: "disponible", att: 0, min: 0 },
  { id: 15, n: "Álvaro Rey", d: 15, pos: "EI", st: "disponible", att: 0, min: 0 },
  { id: 16, n: "Martín Fernández", d: 16, pos: "ED", st: "disponible", att: 0, min: 0 },
  { id: 17, n: "Manuel Gómez", d: 17, pos: "EI", st: "disponible", att: 0, min: 0 },
  { id: 18, n: "Mateo Rivera", d: 18, pos: "ED", st: "disponible", att: 0, min: 0 },
  { id: 19, n: "Adrian Bianchi", d: 19, pos: "DC", st: "disponible", att: 0, min: 0 },
];

/* Cuerpo técnico real del C.D. Chamartín Vergara (Infantil B), igual que en
   Airtable: Eduardo Bermejo (Master), Daniel Bermejo (director deportivo,
   único del club), Manuel Bermejo (segundo entrenador) y Fidel (entrenador
   principal). Sin delegado dado de alta todavía.

   Estructura con categorías: cada usuario tiene un rol y asignación a categorías.
   - Master: acceso total
   - Director: gestiona todas las categorías del club
   - Entrenador: edita su categoría, ve otras del club de lectura
   - Segundo: propuestas en su categoría, ve otras del club de lectura
   - Delegado: lectura de su categoría y otras del club */
const USERS_INIT = [
  { id: 1, name: "EDUARDO BERMEJO", email: "edubermejo92@gmail.com", role: "master", club: "C.D. Chamartín Vergara", categories: ["Infantil B"], status: "activo" },
  { id: 2, name: "DANI BERMEJO", email: "ebldigital92@gmail.com", role: "director", club: "C.D. Chamartín Vergara", categories: ["Infantil B"], status: "activo" },
  { id: 3, name: "MANUEL BERMEJO", email: "mmanuelb@gmail.com", role: "segundo", club: "C.D. Chamartín Vergara", categories: ["Infantil B"], status: "activo" },
  { id: 4, name: "FIDEL", email: "fidelber@movistar.es", role: "entrenador", club: "C.D. Chamartín Vergara", categories: ["Infantil B"], status: "activo" },
  { id: 5, name: "LUIS GARCÍA", email: "luis.garcia@chamartin.es", role: "segundo", club: "C.D. Chamartín Vergara", categories: ["Infantil B"], status: "activo", categoryRoles: { "cat_1": ["segundo", "delegado"] } },
];

/* Definición de categorías: cada categoría pertenece a un club y tiene roles
   asignados (director, entrenador, segundo, delegado). Un usuario puede estar
   asignado a varias categorías dentro del mismo club. */
const CATEGORIES_INIT = [
  {
    id: "cat_1",
    name: "Infantil B",
    club: "C.D. Chamartín Vergara",
    director: 2,            // Dani
    entrenador: 4,          // Fidel
    segundo: [3, 5],        // Manuel + Luis García
    delegado: 5,            // Luis García (también segundo)
  },
];


/* ---------------- Normativa del club, firmas, incidencias y galería (demo) ---------------- */
const DOCS_INIT = [
  { id: "d1", title: "Código Disciplinario Infantil B 26/27", type: "Código disciplinario", season: "2026/27", v: "v1", date: "01/09/2026", required: true,
    signers: ["Jugador", "Padre/Madre/Tutor", "Cuerpo técnico"],
    summary: "Régimen interno y normas de funcionamiento: 8 faltas leves, 6 faltas graves y 8 medidas disciplinarias de carácter educativo. Cada situación se valora de forma individual por el cuerpo técnico." },
  { id: "d2", title: "Política de protección de datos (RGPD)", type: "Protección de datos (RGPD)", season: "2026/27", v: "v2", date: "01/09/2026", required: true,
    signers: ["Padre/Madre/Tutor", "Cuerpo técnico"],
    summary: "Información sobre el tratamiento de datos de menores, base jurídica, plazos de conservación y ejercicio de derechos." },
  { id: "d3", title: "Cesión de derechos de imagen del menor", type: "Derechos de imagen", season: "2026/27", v: "v1", date: "01/09/2026", required: true,
    signers: ["Padre/Madre/Tutor"],
    summary: "Consentimiento expreso y revocable para el uso de imágenes del menor en el ámbito interno del equipo. Sin consentimiento no se publican fotos ni vídeos." },
  { id: "d4", title: "Protocolo de protección al menor", type: "Protocolo de protección al menor", season: "2026/27", v: "v1", date: "01/09/2026", required: true,
    signers: ["Cuerpo técnico"],
    summary: "Obligatorio para todo el cuerpo técnico (LOPIVI). Incluye pautas de comunicación con menores y canal de comunicación de incidencias." },
  { id: "d5", title: "Plan de Pretemporada Infantil B 26/27", type: "Plan de pretemporada", season: "2026/27", v: "v1", date: "13/08/2026", required: false,
    signers: ["Jugador", "Cuerpo técnico"], file: "/documents/Plan_Pretemporada_Infantil_B_202627.pdf", kind: "exercise",
    summary: "Trabajo previo de agosto: tres semanas de reactivación, desarrollo y aproximación antes del inicio de la pretemporada del equipo el 2 de septiembre. El cuerpo técnico (entrenador/a, delegado/a y director/a deportivo/a) confirma aquí, jugador a jugador, quién ha realizado los ejercicios." },
];
/* firmas demo: ids de jugador y de usuario que ya han firmado cada documento.
   Con la plantilla real de Infantil B cargada, nadie ha firmado ni confirmado
   nada todavía — antes había firmas y confirmaciones de ejemplo precargadas,
   pero dejarlas habría atribuido firmas falsas a jugadores reales. */
const SIGNS_INIT = {
  d1: { players: [], staff: [1, 2, 3] },
  d2: { players: [], staff: [1, 2, 3, 4] },
  d3: { players: [], staff: [] },
  d4: { players: [], staff: [1, 2] },
  d5: { players: [], staff: [] },
};
/* Sin incidencias de ejemplo: con nombres reales de menores, unas incidencias
   disciplinarias inventadas serían datos falsos sobre personas reales. */
const INCIDENTS_INIT = [];

/* Sistema de propuestas: cambios que el segundo entrenador propone pero que
   requieren aprobación del entrenador principal. Estructura:
   - type: "lineup"|"squad"|"calendar" (alineación, plantilla, calendario)
   - status: "pending"|"approved"|"rejected"
   - proposedBy: id del usuario que propone (segundo)
   - approvedBy: id del usuario que aprueba (entrenador)
   - data: los datos propuestos */
const PROPOSALS_INIT = [];

/* Funciones helper para categorías y permisos */
const getCategoriesForUser = (userId, userRole, userClub) => {
  if (userRole === "master") return CATEGORIES_INIT;
  if (userRole === "director") return CATEGORIES_INIT.filter((c) => c.club === userClub);
  return CATEGORIES_INIT.filter((c) => {
    if (c.club !== userClub) return false;
    if (c.director === userId || c.entrenador === userId) return true;
    const segundos = Array.isArray(c.segundo) ? c.segundo : [c.segundo];
    const delegados = Array.isArray(c.delegado) ? c.delegado : [c.delegado];
    return segundos.includes(userId) || delegados.includes(userId);
  });
};

const getCategoryInfo = (categoryId) => CATEGORIES_INIT.find((c) => c.id === categoryId);

const getDefaultCategory = (userId, userRole, userClub) => {
  const cats = getCategoriesForUser(userId, userRole, userClub);
  return cats.length > 0 ? cats[0] : null;
};

/* Obtiene los roles que un usuario tiene en una categoría específica.
   Soporta segundo y delegado como arrays (un usuario puede ser ambos). */
const getRolesInCategory = (userId, categoryId) => {
  const cat = CATEGORIES_INIT.find((c) => c.id === categoryId);
  if (!cat) return [];

  const roles = [];
  if (cat.director === userId) roles.push("director");
  if (cat.entrenador === userId) roles.push("entrenador");

  const segundos = Array.isArray(cat.segundo) ? cat.segundo : [cat.segundo];
  if (segundos.includes(userId)) roles.push("segundo");

  const delegados = Array.isArray(cat.delegado) ? cat.delegado : [cat.delegado];
  if (delegados.includes(userId)) roles.push("delegado");

  return roles;
};

/* true si la sesión tiene esa clave de rol, como Rol principal o como uno de
   sus Roles adicionales (session.rolesExtra, viene del login real). Espejo
   de tieneRol() en airtable.mts. */
const tieneRolFront = (session, clave) =>
  session?.role === clave || (Array.isArray(session?.rolesExtra) && session.rolesExtra.includes(clave));

/* histórico de convocatorias (demo). El cuerpo técnico va guardando las suyas.
   Vacío: la pretemporada aún no ha empezado, así que todavía no hay
   convocatorias reales que guardar para la plantilla de Infantil B. */
const CALLS_INIT = [];

const SLOTS_433 = {
  GK: { label: "POR", x: 50, y: 90 }, RB: { label: "LD", x: 82, y: 72 },
  RCB: { label: "DFC", x: 62, y: 78 }, LCB: { label: "DFC", x: 38, y: 78 },
  LB: { label: "LI", x: 18, y: 72 }, DM: { label: "MCD", x: 50, y: 60 },
  RCM: { label: "MC", x: 68, y: 46 }, LCM: { label: "MCO", x: 32, y: 46 },
  RW: { label: "ED", x: 80, y: 26 }, ST: { label: "DC", x: 50, y: 20 }, LW: { label: "EI", x: 20, y: 26 },
};
const LINEUP_INIT = { GK: 1, RB: 2, RCB: 3, LCB: 4, LB: 5, DM: 6, RCM: 7, LCM: 8, RW: 9, ST: 10, LW: 15 };

/* Genera las posiciones de la alineación (campo vertical, en %) a partir de
   CUALQUIER código de sistema: "4-3-3", "1-4-2-3-1", "3-2-1"… El primer punto
   siempre es el portero. Devuelve { id: {label,x,y} } para el mismo formato
   que usaba SLOTS_433, así que el resto de la pantalla no cambia. */
const posLabel = (lineIdx, totalLines, k, count) => {
  const izq = k === 0, der = k === count - 1;
  if (lineIdx === 0) return count >= 4 ? (izq ? "LI" : der ? "LD" : "DFC") : "DFC";
  if (lineIdx === totalLines - 1) return count === 1 ? "DC" : izq ? "EI" : der ? "ED" : "DC";
  if (lineIdx === 1 && totalLines >= 4) return count === 1 ? "MCD" : "MC";
  return count === 1 ? "MCO" : izq || der ? "MB" : "MC";
};
function buildSlots(code) {
  /* Un "1-" inicial es el portero en notación española: se ignora al repartir líneas */
  let lines = String(code).split("-").map(Number).filter((n) => n > 0);
  if (lines.length > 1 && lines[0] === 1 && lines.reduce((a, b) => a + b, 0) > 11) lines = lines.slice(1);
  if (lines.length > 1 && lines[0] === 1 && lines.reduce((a, b) => a + b, 0) === 11) lines = lines.slice(1);
  const slots = { GK: { label: "POR", x: 50, y: 90 } };
  const n = lines.length;
  const yDef = 76, yFwd = 20;
  lines.forEach((count, i) => {
    const y = n === 1 ? (yDef + yFwd) / 2 : yDef - (i * (yDef - yFwd)) / (n - 1);
    for (let k = 0; k < count; k++) {
      const x = count === 1 ? 50 : 16 + (k * (84 - 16)) / (count - 1);
      slots[`L${i}_${k}`] = { label: posLabel(i, n, k, count), x, y };
    }
  });
  return slots;
}
/* Sistemas sugeridos; el campo admite cualquier otro escrito a mano */
const SYS_F11 = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "3-4-3", "5-3-2", "4-1-4-1", "4-4-1-1", "5-4-1", "4-5-1", "3-4-2-1", "4-3-1-2"];
const SYS_F7 = ["2-3-1", "3-2-1", "3-1-2", "1-4-1", "2-1-3", "3-3", "2-2-2"];

/* ---------------- Utilidades ---------------- */
const fmtClock = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
/* Los estados sí llevan color: es información, no adorno. Tonos apagados para
   que no griten sobre el blanco. */
const stColor = (st) => (st === "disponible" ? C.green : st === "duda" ? C.warn : C.red);
/* ================= ASISTENCIA =================
   Aparte de Disciplina a propósito: esto no genera incidencias ni sanciones,
   es solo saber quién ha venido hoy y, si no, por qué. Un motivo por
   ausencia, no un estado de conducta: verde el que ha venido, ámbar la baja
   por salud, rojo lo que de verdad conviene mirar (sin explicación o
   lesión), y un gris neutro para estudios, que no es una alarma. Lesión e
   "sin explicación" comparten tono porque las dos pesan, y se distinguen por
   el texto, que siempre está a la vista. */
const ASISTENCIA_TIPOS = ["estudios", "injustificada", "enfermedad", "lesion"];
const asistColor = (st) =>
  st === "presente" ? C.green
  : st === "enfermedad" ? C.warn
  : st === "estudios" ? C.dim
  : st === "injustificada" || st === "lesion" ? C.red
  : C.dim;
const asistLabel = (st, t) =>
  st === "presente" ? t("as.present")
  : st === "estudios" ? t("as.studies")
  : st === "injustificada" ? t("as.noExcuse")
  : st === "enfermedad" ? t("as.sick")
  : st === "lesion" ? t("as.injured")
  : t("as.unmarked");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/* ================= FECHAS DEL CALENDARIO =================
   toISOString() da la fecha en UTC, no la del reloj de quien usa la app. En
   España (UTC+1 en invierno, UTC+2 en verano) eso significa que entre las
   00:00 y las 01:00 o 02:00 la app daba por buena la fecha de AYER: la lista
   de asistencia se abría en el día anterior, y una incidencia o un resultado
   guardados al volver del campo por la noche quedaban con fecha del día
   antes.
   Peor todavía: al sumar días se construía la fecha a medianoche local y se
   volvía a convertir a UTC, así que en España "día siguiente" se quedaba en
   el mismo día y "día anterior" saltaba dos. Las flechas de Asistencia
   estaban rotas todo el año.
   Estas dos ayudas trabajan siempre con el día del calendario local, que es
   el que le importa a un entrenador. */
const isoLocal = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
const hoyISO = () => isoLocal(new Date());
/* "2026-08-21" -> "viernes, 21 de agosto". Si no es una fecha ISO válida, se
   devuelve tal cual (por si queda algún texto libre antiguo en localStorage,
   de cuando el campo de fecha del entrenamiento era un input de texto). */
const fechaLegible = (iso, lang = "es") => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ""))) return iso || "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(lang === "es" ? "es-ES" : lang, { weekday: "long", day: "numeric", month: "long" });
};
/* Nombre del mes en el idioma activo, para las cabeceras de calendario:
   antes iba en un array fijo en español ("Enero", "Febrero"…) y no cambiaba
   de idioma nunca, ni aunque el resto de la pantalla sí lo hiciera. */
const mesLargo = (y, m, lang = "es") => new Date(y, m, 1).toLocaleDateString(lang === "es" ? "es-ES" : lang, { month: "long" });
/* Iniciales de lunes a domingo en el idioma activo, a partir de una semana
   de referencia real (1-7 enero 2024 empieza en lunes) en vez de un array
   fijo en español ("L","M","X"…). */
const diasSemanaCortos = (lang = "es") => {
  const loc = lang === "es" ? "es-ES" : lang;
  return [1, 2, 3, 4, 5, 6, 7].map((d) => new Date(2024, 0, d).toLocaleDateString(loc, { weekday: "narrow" }));
};
/* Igual que diasSemanaCortos, pero empezando en domingo (índice 0) como
   Date.getDay(): la usa el selector de "días de entreno". */
const diasSemanaCortosDomingoPrimero = (lang = "es") => {
  const loc = lang === "es" ? "es-ES" : lang;
  return [7, 1, 2, 3, 4, 5, 6].map((d) => new Date(2024, 0, d).toLocaleDateString(loc, { weekday: "narrow" }));
};
/* Suma (o resta) días a una fecha "YYYY-MM-DD" sin salir del huso local. */
const sumarDiasISO = (iso, delta) => {
  const [y, m, d] = String(iso).split("-").map(Number);
  return isoLocal(new Date(y, m - 1, d + delta));
};
const keycap = (n) => String(n).split("").map((d) => d + "\uFE0F\u20E3").join("");
const ease = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

/* La demarcación de un CSV viene como la escribe cada club: "Portero",
   "portero", "POR", "Central", "Lateral izquierdo", "Delantero"… Se traduce a
   los códigos que entiende la app (POS_OK). Sin esto se guardaba el texto tal
   cual en mayúsculas, y todo lo que no fuera exactamente un código de los
   nuestros acababa contado como delantero -que es a donde cae el "si no"
   de posGroup()-, desaparecía del desglose por demarcación de Estadísticas
   y no casaba nunca con el puesto al buscar un cambio en Alineación.
   Lo que no se reconoce se queda en "—": mejor sin demarcación que con una
   inventada. */
/* El orden importa: lo más específico primero, porque se coge la primera que
   case ("lateral derecho" antes que "lateral", "extremo izquierdo" antes que
   "extremo"). */
const POS_ALIAS = [
  [/^(portero|porteria|guardameta|arquero|gk|pt)/, "POR"],
  [/^(lateral\s*der|lateral\s*d\b|defensa\s*der|carrilero\s*der)/, "LD"],
  [/^(lateral\s*izq|lateral\s*i\b|defensa\s*izq|carrilero\s*izq)/, "LI"],
  [/^(central|defensa\s*central|defensa|libero|zaguero)/, "DFC"],
  [/^(pivote|mediocentro\s*def|medio\s*def)/, "MCD"],
  [/^(mediapunta|media\s*punta|enganche|medio\s*ofensivo)/, "MCO"],
  [/^(interior|volante)/, "MB"],
  [/^(mediocentro|centrocampista|medio)/, "MC"],
  [/^(extremo\s*der|banda\s*der)/, "ED"],
  [/^(extremo\s*izq|banda\s*izq)/, "EI"],
  [/^(delantero|punta|ariete|goleador|extremo)/, "DC"],
];
const posNormalizada = (v) => {
  const x = String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  if (!x || x === "-" || x === "—") return "—";
  const directo = x.toUpperCase();
  if (POS_OK.includes(directo)) return directo;
  const hit = POS_ALIAS.find(([re]) => re.test(x));
  return hit ? hit[1] : "—";
};

const parseCSV = (txt, startId) => {
  const rows = txt.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out = [];
  rows.forEach((line, i) => {
    const c = line.split(/[;,\t]/).map((s) => s.trim());
    if (i === 0 && /nombre/i.test(c[0])) return;
    if (!c[0]) return;
    const dorsal = parseInt(c[2], 10);
    /* att: 0 como en el resto de altas (ficha nueva y jugadores traídos de la
       nube). Con el 100 de antes, quien importaba la plantilla por CSV veía a
       los recién llegados encabezando "Top asistencia" sin haber pisado un
       entrenamiento. */
    out.push({ id: startId + out.length, n: `${c[0]} ${c[1] || ""}`.trim(), d: Number.isFinite(dorsal) ? dorsal : 0, pos: posNormalizada(c[3]), st: "disponible", att: 0, min: 0 });
  });
  let next = 1;
  const used = new Set(out.filter((p) => p.d > 0).map((p) => p.d));
  out.forEach((p) => { if (!p.d) { while (used.has(next)) next++; p.d = next; used.add(next); } });
  return out;
};

/* ---------- Coach AI: función Netlify en producción, API directa en el preview ---------- */
/* Coach AI habla SOLO con la función de Netlify: la clave vive allí y el
   navegador no la ve nunca. Antes, si la función fallaba, se intentaba llamar
   a la API desde el navegador —sin clave, y encima bloqueado por CORS—, así
   que el error real se perdía y en pantalla solo aparecía "…". Ahora cada
   fallo tiene su frase. */
async function coachRequest(system, messages, maxTokens) {
  let r;
  try {
    r = await cbFetch("/.netlify/functions/coach", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, messages, ...(maxTokens ? { maxTokens } : {}) }),
    });
  } catch {
    return { content: [{ type: "text", text: "No hay conexión con el asistente. Comprueba tu conexión y vuelve a intentarlo." }] };
  }
  if (r.status === 401) {
    return { content: [{ type: "text", text: "Tu sesión ha caducado. Vuelve a entrar y podrás seguir preguntando." }] };
  }
  if (!r.ok) {
    return { content: [{ type: "text", text: "El asistente no ha podido responder. Vuelve a intentarlo en un minuto." }] };
  }
  return await r.json().catch(() => ({ content: [{ type: "text", text: "Respuesta ilegible del asistente. Vuelve a intentarlo." }] }));
}

/* ---------------- Generador de vídeo 5 s (canvas → webm) ---------------- */
async function makePresentationVideo(player, club, teamName, accent) {
  const W = 540, H = 675, DUR = 5;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.src = player.photo;
  await img.decode();
  const stream = canvas.captureStream(30);
  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise((res) => { rec.onstop = () => res(URL.createObjectURL(new Blob(chunks, { type: "video/webm" }))); });
  const drawCover = (image, x, y, w, h) => {
    const s = Math.max(w / image.width, h / image.height);
    const iw = image.width * s, ih = image.height * s;
    ctx.drawImage(image, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  };
  const frame = (t) => {
    for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? "#17251D" : "#141F17"; ctx.fillRect(0, i * (H / 10), W, H / 10); }
    ctx.strokeStyle = "rgba(54,69,79,0.18)"; ctx.lineWidth = 3; ctx.strokeRect(16, 16, W - 32, H - 32);
    const a1 = ease(t / 0.6);
    ctx.fillStyle = accent; ctx.fillRect(0, 40, W * a1, 6);
    ctx.font = "600 26px 'Barlow Condensed', sans-serif"; ctx.fillStyle = `rgba(54,69,79,${a1})`; ctx.textAlign = "left";
    ctx.fillText(club.toUpperCase(), 24, 82);
    ctx.font = "500 18px 'Barlow Condensed', sans-serif"; ctx.fillStyle = `rgba(143,160,150,${a1})`;
    ctx.fillText(teamName.toUpperCase(), 24, 106);
    const a2 = ease((t - 0.4) / 1.2);
    if (a2 > 0) {
      const R = 150 * (0.6 + 0.4 * a2), cx = W / 2, cy = 300;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
      ctx.globalAlpha = a2; drawCover(img, cx - R, cy - R, R * 2, R * 2); ctx.restore(); ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.lineWidth = 5; ctx.strokeStyle = accent; ctx.stroke();
    }
    const a3 = ease((t - 1.8) / 0.9);
    if (a3 > 0) {
      ctx.font = "700 170px 'Barlow Condensed', sans-serif"; ctx.textAlign = "right"; ctx.fillStyle = accent; ctx.globalAlpha = a3;
      ctx.fillText(String(player.d), W - 24 + (1 - a3) * 120, 560); ctx.globalAlpha = 1;
    }
    const a4 = ease((t - 2.6) / 0.9);
    if (a4 > 0) {
      ctx.textAlign = "left"; ctx.font = "700 44px 'Barlow Condensed', sans-serif"; ctx.fillStyle = `rgba(54,69,79,${a4})`;
      ctx.fillText(player.n.toUpperCase(), 24, 540 - (1 - a4) * 24);
      ctx.font = "600 24px 'Barlow Condensed', sans-serif"; ctx.fillStyle = accent; ctx.globalAlpha = a4;
      ctx.fillText(player.pos === "POR" ? "🧤 PORTERO" : player.pos, 24, 575); ctx.globalAlpha = 1;
    }
    const a5 = ease((t - 4.2) / 0.6);
    if (a5 > 0) {
      ctx.fillStyle = accent; ctx.fillRect(0, H - 52, W * a5, 52);
      ctx.font = "600 22px 'Barlow Condensed', sans-serif"; ctx.fillStyle = `rgba(20,20,20,${a5})`; ctx.textAlign = "center";
      ctx.fillText("COACHBASE AI", W / 2, H - 18);
    }
  };
  rec.start();
  const t0 = performance.now();
  await new Promise((res) => {
    const loop = (now) => {
      const t = (now - t0) / 1000; frame(Math.min(t, DUR));
      if (t < DUR) requestAnimationFrame(loop); else { rec.stop(); res(); }
    };
    requestAnimationFrame(loop);
  });
  return done;
}

/* ---------------- Acceso ---------------- */
function Splash({ lang }) {
  return (
    <div className="font-body min-h-screen flex flex-col items-center justify-center p-6" style={{ background: C.bg, color: C.chalk }}>
      <style>{FONTS}</style>
      <style>{`@keyframes cbbar{0%{width:4%}100%{width:100%}}@keyframes cbpulse{0%,100%{opacity:.6}50%{opacity:1}}`}</style>
      <div className="flex items-center gap-3 mb-7" style={{ animation: "cbpulse 1.2s ease-in-out infinite" }}>
        <div className="w-16 h-16 rounded-lg flex items-center justify-center font-display font-bold text-3xl" style={{ background: C.mando, color: C.sobre }}>CB</div>
        <div className="text-left">
          <div className="font-display text-3xl font-semibold tracking-wide">COACHBASE AI</div>
          <div className="text-xs" style={{ color: C.dim }}>by EBLDigital</div>
        </div>
      </div>
      <div className="w-64 h-1.5 rounded-full overflow-hidden" style={{ background: C.line }}>
        <div className="h-full rounded-full" style={{ background: C.mando, animation: "cbbar 1.5s ease-out forwards" }} />
      </div>
      <div className="text-xs mt-4" style={{ color: C.dim }}>{T(lang, "a.loading")}</div>
    </div>
  );
}

/* Ojo dibujado en SVG y no con un emoji: hereda el color con currentColor,
   se ve nítido a cualquier tamaño y no depende de qué fuente tenga el
   sistema — el mismo motivo por el que los iconos del menú son marcas y no
   emoji a color. */
const OjoIcon = ({ off }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1.8 12S5.4 5.5 12 5.5 22.2 12 22.2 12 18.6 18.5 12 18.5 1.8 12 1.8 12Z" />
    <circle cx="12" cy="12" r="3.2" />
    {off && <line x1="3.6" y1="20.4" x2="20.4" y2="3.6" />}
  </svg>
);
/* Campo de contraseña con ojo para comprobar lo que se ha escrito.
   El botón lleva type="button" (si no, enviaría el formulario), y aria-label
   además del icono: un dibujo a secas no le dice nada a un lector de pantalla. */
function PassInput({ value, onChange, cls, st, placeholder = "••••••••", onEnter, autoComplete = "current-password", autoFocus }) {
  const [ver, setVer] = useState(false);
  return (
    <div className="relative">
      <input value={value} onChange={(e) => onChange(e.target.value)} type={ver ? "text" : "password"}
        placeholder={placeholder} autoComplete={autoComplete} autoFocus={autoFocus}
        className={cls + " pr-12"} style={st}
        onKeyDown={(e) => e.key === "Enter" && onEnter && onEnter()} />
      <button type="button" onClick={() => setVer((v) => !v)} aria-pressed={ver}
        aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
        title={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md flex items-center"
        style={{ color: ver ? C.chalk : C.dim }}>
        <OjoIcon off={ver} />
      </button>
    </div>
  );
}

function Auth({ lang, setLang, onLogin, onRegister, tema, cambiarTema }) {
  const t = (k) => T(lang, k);
  const [view, setView] = useState("choice");
  const [account, setAccount] = useState("oficial");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  /* Repetición de la contraseña, solo en la pantalla de elegir una nueva:
     ahí no hay forma de recuperarse de una errata, porque el enlace del
     correo es de un solo uso. */
  const [pass2, setPass2] = useState("");
  const [resetToken, setResetToken] = useState("");
  /* Tipo del último fallo al guardar: decide si se ofrece pedir otro enlace. */
  const [resetErrTipo, setResetErrTipo] = useState("");
  const [comunidad, setComunidad] = useState("Comunidad de Madrid");
  const [club, setClub] = useState("");
  const [clubOtro, setClubOtro] = useState("");
  const [cat, setCat] = useState("infantil");
  const [letra, setLetra] = useState("A");
  const [directoryClubs, setDirectoryClubs] = useState([]);
  const [directoryTeams, setDirectoryTeams] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const team = selectedTeam || makeTeam(cat, letra);
  const [role, setRole] = useState(null);
  /* Solo se usa cuando account === "club": qué paquete eligió al fundar el
     club. El límite de plazas real no lo fija esto — lo confirma el webhook
     de Stripe cuando se cobra de verdad. Aquí solo decide si tras registrarse
     se le manda o no a pagar. */
  const [planClub, setPlanClub] = useState("gratis");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const isFree = account === "free";
  const isClubFounder = account === "club";
  const ac = C.mando;
  const clubFinal = (club || clubOtro || "").trim();
  const norm = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const clubOptions = [...new Set([...directoryClubs.map((x) => x.name), ...CLUBES_MADRID])];
  const teamOptions = !isFree && clubFinal ? directoryTeams.filter((x) => norm(x.club) === norm(clubFinal)) : [];
  useEffect(() => {
    let alive = true;
    setDirectoryLoading(true);
    Promise.all([airClubs(), airTeams()]).then(([clubs, teams]) => {
      if (!alive) return;
      if (Array.isArray(clubs)) setDirectoryClubs(clubs);
      if (Array.isArray(teams)) setDirectoryTeams(teams);
    }).finally(() => { if (alive) setDirectoryLoading(false); });
    return () => { alive = false; };
  }, []);
  const selectClub = (value) => {
    setClub(value); setClubOtro(value); setSelectedTeam(null);

    const hit = directoryClubs.find((x) => norm(x.name) === norm(value));
    if (hit?.comunidad) setComunidad(hit.comunidad);
  };
  const Field = (label, node) => (
    <div className="mb-4"><div className="font-display text-sm uppercase tracking-widest mb-1.5" style={{ color: C.dim }}>{label}</div>{node}</div>
  );
  const inputCls = "w-full rounded-lg px-4 py-2.5 text-sm outline-none border";
  const inputSt = { background: C.panel2, borderColor: C.line, color: C.chalk };
  const back = () => { setView("choice"); setErr(""); setOkMsg(""); };

  const submitLogin = async () => {
    setErr(""); if (!email.trim() || !pass.trim() || busy) return;
    if (email.trim().toLowerCase() === "demo" && pass === "demo") { setView("demo"); return; }
    setBusy(true);
    const e = await onLogin({ email, password: pass });
    setBusy(false);
    if (e) setErr(e);
  };

  /* El enlace del correo llega como /?reset=<token>. Se recoge al montar y se
     borra de la URL en el acto: si se queda ahí acaba en el historial del
     navegador, en el título de la pestaña y en cualquier captura que haga el
     usuario para pedir ayuda. */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const tk = p.get("reset");
    if (!tk) return;
    setResetToken(tk);
    setView("reset");
    p.delete("reset");
    const q = p.toString();
    window.history.replaceState({}, "", window.location.pathname + (q ? "?" + q : ""));
  }, []);

  const passOk = pass.length >= PASS_MIN && pass === pass2;

  const submitForgot = async () => {
    setErr(""); if (!email.trim() || busy) return;
    setBusy(true);
    const r = await airForgot(email.trim());
    setBusy(false);
    if (!r) { setErr(mensajeFalloAir(t)); return; }
    if (r.sinCorreo) { setErr(t("a.forgotNoMail")); return; }
    setOkMsg(t("a.forgotSent"));
  };

  const submitReset = async () => {
    setErr(""); if (!passOk || busy) return;
    setBusy(true);
    const r = await airReset(resetToken, pass);
    setBusy(false);
    if (!r) { setErr(mensajeFalloAir(t)); return; }
    if (r.ok) { setOkMsg(t("a.resetOk")); return; }
    /* Cada motivo lleva su mensaje: caducado y ya usado se arreglan pidiendo
       otro enlace, pero un fallo de Airtable no, y decirle a alguien que pida
       otro enlace cuando el problema es del servidor le hace perder el rato. */
    setResetErrTipo(String(r.reason || ""));
    setErr(
      r.reason === "corta" ? t("a.passRule")
      : r.reason === "caducado" ? t("a.resetExp")
      : r.reason === "usado" ? t("a.resetUsed")
      : r.reason === "airtable" ? t("a.resetServer")
      : t("a.resetBad"),
    );
  };
  /* La cuenta oficial ya no elige club, equipo ni rol: eso viene del alta que
     ha hecho antes el director deportivo o el Master. Solo hace falta el correo
     con el que te dieron de alta y una contraseña. */
  const regReady = isFree
    ? name.trim() && email.trim() && pass.trim() && team
    : isClubFounder
    ? name.trim() && email.trim() && pass.trim() && clubFinal.trim()
    : name.trim() && email.trim() && pass.trim();
  const submitRegister = async () => {
    setErr(""); setOkMsg(""); if (!regReady || busy) return;
    setBusy(true);
    const r = await onRegister({
      name: name.trim(), email, pass, role: isFree ? "entrenador" : role,
      plan: isFree ? "free" : isClubFounder ? "club" : "oficial",
      club: clubFinal.trim(), comunidad, team,
      checkoutPendiente: isClubFounder && planClub !== "gratis" ? planClub : null,
    });
    setBusy(false);
    if (r && r.error) setErr(r.error);
    else if (r && r.pending) setOkMsg(t("a.registered"));
  };

  const Shell = (children) => (
    <div className="font-body min-h-screen flex items-center justify-center p-4" style={{ background: C.bg, color: C.chalk }}>
      <style>{FONTS}</style>
      <div className="w-full max-w-2xl rounded-lg border p-6 sm:p-8" style={{ background: C.panel, borderColor: C.line }}>
        <div className="flex items-start justify-between gap-3 mb-2">
          {/* El mismo logotipo que la cabecera: la marca se ve desde la
              primera pantalla y es igual en los cinco idiomas, porque es una
              imagen y no texto traducido. */}
          <a href={EBL} target="_blank" rel="noreferrer" aria-label="COACHBASE Ai · by EBLDigital" className="shrink-0">
            <AppWordmark height={72} />
          </a>
          <div className="flex items-center gap-2">
            <button onClick={cambiarTema} title={tema === "oscuro" ? "Modo claro" : "Modo oscuro"}
              aria-label={tema === "oscuro" ? "Modo claro" : "Modo oscuro"}
              className="text-sm w-8 h-8 rounded-lg border flex items-center justify-center"
              style={{ borderColor: C.line, color: C.chalk }}>
              {tema === "oscuro" ? "☀" : "☾"}
            </button>
            <LangPicker lang={lang} setLang={setLang} />
          </div>
        </div>
        <div className="text-sm mb-5 mt-3" style={{ color: C.dim }}>{t("a.tagline")}</div>
        {children}
        <div className="text-[11px] mt-4 text-center" style={{ color: C.dim }}>Tus datos de acceso y los de tu equipo viajan cifrados.</div>
        {/* Autoría, con enlace. Aparece también en el menú lateral una vez
            dentro, para que conste en toda la app y no solo al entrar. */}
        <div className="text-[11px] mt-2 text-center" style={{ color: C.dim }}>
          {t("c.madeBy")}{" "}
          <a href={EBL} target="_blank" rel="noreferrer" className="underline font-semibold" style={{ color: ac }}>ebldigital.com.es</a>
        </div>
        {/* Versión del build. Permite comprobar de un vistazo si un deploy ha
            entrado de verdad, sin ir buscando cambios de interfaz a ojo. */}
        <div className="text-[11px] mt-1 text-center font-display tracking-widest" style={{ color: C.dim }}>v{APP_VERSION}</div>
        <div className="text-[11px] mt-2 text-center">
          <a href="/privacidad" target="_blank" rel="noreferrer" className="underline" style={{ color: C.dim }}>Política de privacidad</a>
        </div>
      </div>
    </div>
  );
  const errBox = err ? <div className="mb-4 rounded-lg border p-3 text-sm" style={{ borderColor: C.red, background: "rgba(163,58,62,.10)", color: C.red }}>{err}</div> : null;

  if (view === "choice") return Shell(
    <>
      <div className="grid sm:grid-cols-2 gap-3">
      <div className="rounded-lg border p-4 mb-3" style={{ borderColor: "rgba(54,69,79,.36)", background: "rgba(54,69,79,.06)" }}>
        <div className="font-display text-2xl leading-none" style={{ color: ac }}>Organiza tu equipo. Gana tiempo cada semana.</div>
        <div className="text-sm mt-2" style={{ color: C.chalk }}>Plantilla, convocatorias, pizarra y planificación desde el primer día.</div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[11px]" style={{ color: C.dim }}><span>✓ Sin tarjeta para empezar</span></div>
      </div>
        <button onClick={() => { setErr(""); setView("login"); }} className="rounded-lg border p-5 text-left" style={{ borderColor: C.line, background: C.panel2 }}>
          <div className="font-display text-xl font-semibold mb-1">{t("a.have")}</div>
          <div className="text-xs" style={{ color: C.dim }}>{t("a.email")} + {t("a.pass")}</div>
        </button>
        <button onClick={() => { setErr(""); setView("register"); }} className="rounded-lg border p-5 text-left" style={{ borderColor: ac, background: C.panel2 }}>
          <div className="font-display text-xl font-semibold mb-1" style={{ color: ac }}>{t("a.register")}</div>
          <div className="text-xs" style={{ color: C.dim }}>{t("a.accOff")} · {t("a.accFree")}</div>
        </button>
      </div>
    </>
  );

  if (view === "demo") return Shell(
    <>
      <button onClick={back} className="text-xs mb-4 font-display uppercase tracking-wider" style={{ color: C.dim }}>{t("a.back")}</button>
      {errBox}
      <div className="font-display text-xl font-semibold mb-1">{t("a.demoPick")}</div>
      <div className="text-xs mb-4" style={{ color: C.dim }}>{t("a.demoPickD")}</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ROLES_DEMO.map((k) => ROLES[k] && [k, ROLES[k]]).filter(Boolean).map(([k, r]) => (
          <button key={k} disabled={busy} onClick={async () => { setErr(""); setBusy(true); const e = await onLogin({ email: "demo", password: "demo", role: k }); setBusy(false); if (e) setErr(e); }}
            className="rounded-lg border p-3 text-left disabled:opacity-50" style={{ borderColor: C.line, background: C.panel2 }}>
            <div className="font-display text-sm font-semibold flex items-center gap-1.5 leading-tight"><span style={{ color: r.color }}>{r.icon}</span>{r.label}</div>
            <div className="text-[10px] mt-0.5" style={{ color: C.dim }}>{r.desc}</div>
          </button>
        ))}
      </div>
    </>
  );

  if (view === "login") return Shell(
    <>
      <button onClick={back} className="text-xs mb-4 font-display uppercase tracking-wider" style={{ color: C.dim }}>{t("a.back")}</button>
      {errBox}
      {Field(t("a.email"), <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" type="email" className={inputCls} style={inputSt} onKeyDown={(e) => e.key === "Enter" && submitLogin()} />)}
      {Field(t("a.pass"), <PassInput value={pass} onChange={setPass} cls={inputCls} st={inputSt} onEnter={submitLogin} />)}
      <button disabled={!email.trim() || !pass.trim() || busy} onClick={submitLogin} className="w-full font-display uppercase tracking-wider py-3 rounded-lg font-semibold disabled:opacity-40" style={{ background: ac, color: C.sobre }}>
        {busy ? t("a.entering") : t("a.signin")}
      </button>
      <button onClick={() => { setErr(""); setOkMsg(""); setView("forgot"); }} className="w-full text-center text-xs mt-3 underline" style={{ color: C.dim }}>
        {t("a.forgot")}
      </button>
    </>
  );

  /* ---- He olvidado mi contraseña ----
     El mensaje de confirmación es el mismo exista o no la cuenta: el backend
     no distingue a propósito, para que esta pantalla no sirva para averiguar
     qué correos están dados de alta en el club. */
  if (view === "forgot") return Shell(
    <>
      <button onClick={() => { setView("login"); setErr(""); setOkMsg(""); }} className="text-xs mb-4 font-display uppercase tracking-wider" style={{ color: C.dim }}>{t("a.back")}</button>
      {okMsg
        ? <div className="rounded-lg border p-4 text-sm" style={{ borderColor: C.green, background: "rgba(47,107,79,.10)", color: C.chalk }}>{okMsg}</div>
        : <>
          {errBox}
          <div className="font-display text-xl font-semibold mb-1">{t("a.forgotTitle")}</div>
          <div className="text-xs mb-4" style={{ color: C.dim }}>{t("a.forgotD")}</div>
          {Field(t("a.email"), <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" type="email" autoComplete="email" className={inputCls} style={inputSt} onKeyDown={(e) => e.key === "Enter" && submitForgot()} />)}
          <button disabled={!email.trim() || busy} onClick={submitForgot} className="w-full font-display uppercase tracking-wider py-3 rounded-lg font-semibold disabled:opacity-40" style={{ background: ac, color: C.sobre }}>
            {busy ? t("a.sending") : t("a.forgotSend")}
          </button>
        </>}
    </>
  );

  /* ---- Elegir nueva contraseña (se llega desde el enlace del correo) ---- */
  if (view === "reset") return Shell(
    <>
      {okMsg
        ? <>
          <div className="rounded-lg border p-4 text-sm mb-4" style={{ borderColor: C.green, background: "rgba(47,107,79,.10)", color: C.chalk }}>{okMsg}</div>
          <button onClick={() => { setOkMsg(""); setPass(""); setPass2(""); setView("login"); }} className="w-full font-display uppercase tracking-wider py-3 rounded-lg font-semibold" style={{ background: ac, color: C.sobre }}>
            {t("a.signin")}
          </button>
        </>
        : <>
          {errBox}
          {/* Si el enlace caducó o ya se usó, la salida es pedir otro. Antes
              había que volver atrás y buscar el enlace de recuperación otra
              vez; siendo la caducidad el fallo más habitual, el botón va aquí
              mismo. */}
          {(resetErrTipo === "caducado" || resetErrTipo === "usado") && (
            <button onClick={() => { setErr(""); setResetErrTipo(""); setPass(""); setPass2(""); setView("forgot"); }}
              className="w-full font-display uppercase tracking-wider py-2.5 rounded-lg font-semibold mb-4"
              style={{ background: ac, color: C.sobre }}>
              {t("a.resetAgain")}
            </button>
          )}
          <div className="font-display text-xl font-semibold mb-1">{t("a.resetTitle")}</div>
          <div className="text-xs mb-4" style={{ color: C.dim }}>{t("a.resetD")}</div>
          {Field(t("a.newPass"), <PassInput value={pass} onChange={setPass} cls={inputCls} st={inputSt} autoComplete="new-password" autoFocus />)}
          {Field(t("a.newPass2"), <PassInput value={pass2} onChange={setPass2} cls={inputCls} st={inputSt} autoComplete="new-password" onEnter={submitReset} />)}
          <button disabled={!passOk || busy} onClick={submitReset} className="w-full font-display uppercase tracking-wider py-3 rounded-lg font-semibold disabled:opacity-40" style={{ background: ac, color: C.sobre }}>
            {busy ? t("a.sending") : t("a.resetSave")}
          </button>
          <div className="text-[11px] mt-3 text-center" style={{ color: C.dim }}>{t("a.passRule")}</div>
        </>}
    </>
  );

  return Shell(
    <>
      <button onClick={back} className="text-xs mb-4 font-display uppercase tracking-wider" style={{ color: C.dim }}>{t("a.back")}</button>
      {okMsg
        ? <div className="rounded-lg border p-4 text-sm" style={{ borderColor: C.green, background: "rgba(47,107,79,.10)", color: C.chalk }}>{okMsg}</div>
        : <>
          {errBox}
          <div role="radiogroup" aria-label={t("a.choice")} className="grid sm:grid-cols-3 gap-3 mb-5">
            {[["oficial", "▣", t("a.accOff"), t("a.accOffD")], ["club", "▦", "Somos un club", "Registra tu club: tú serás el director deportivo y podrás invitar al resto."], ["free", "◇", t("a.accFree"), t("a.accFreeD")]].map(([k, ic, tl, ds]) => {
              const sel = account === k;
              return (
                <button key={k} type="button" role="radio" aria-checked={sel} onClick={() => setAccount(k)}
                  className="relative rounded-lg border p-4 text-left transition-colors"
                  style={{ borderColor: sel ? ac : C.line, background: sel ? "rgba(54,69,79,.08)" : "transparent" }}>
                  <div className="absolute top-3 right-3 w-4 h-4 rounded-full border flex items-center justify-center"
                    style={{ borderColor: sel ? ac : C.dim }}>
                    {sel && <div className="w-2 h-2 rounded-full" style={{ background: ac }} />}
                  </div>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center font-display text-lg mb-2.5"
                    style={{ background: sel ? ac : C.panel2, color: sel ? "#141414" : C.dim }}>
                    {ic}
                  </div>
                  <div className="font-display text-base font-semibold pr-6" style={{ color: sel ? ac : C.chalk }}>{tl}</div>
                  <div className="text-[12px] mt-1 leading-snug" style={{ color: C.dim }}>{ds}</div>
                </button>
              );
            })}
          </div>
          <div className="grid sm:grid-cols-2 gap-x-3">
            {Field(t("a.fullname"), <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Emilio B." className={inputCls} style={inputSt} />)}
            {Field(t("a.email"), <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" type="email" className={inputCls} style={inputSt} />)}
          </div>
          {Field(t("a.pass"), <PassInput value={pass} onChange={setPass} cls={inputCls} st={inputSt} autoComplete="new-password" />)}
          {isClubFounder && Field("Nombre del club", (
            <>
              <ClubPicker value={club} onChange={selectClub}
                options={clubOptions} placeholder={t("a.otherClub")} C={C} AC={ac} />
              <div className="text-[10px] mt-1" style={{ color: C.dim }}>
                {isClubFounder ? "Elige tu club si ya aparece en la lista, o escribe su nombre para crearlo. Si ya tiene cuerpo técnico dado de alta, no podrás fundarlo — pide que te inviten." : "Sugerencias de la Comunidad de Madrid. Si tu club no está, escribe su nombre tal y como aparece en tu federación."}
              </div>
            </>
          ))}
          {isClubFounder && Field("Plan de tu club", (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPlanClub("gratis")} className="rounded-lg border p-2.5 text-left"
                style={{ borderColor: planClub === "gratis" ? ac : C.line, background: planClub === "gratis" ? "rgba(54,69,79,.08)" : "transparent" }}>
                <div className="font-display text-sm font-semibold" style={{ color: planClub === "gratis" ? ac : C.chalk }}>Gratis</div>
                <div className="text-[10px]" style={{ color: C.dim }}>1 acceso de cuerpo técnico</div>
              </button>
              {PLANES_CLUB.map((p) => (
                <button key={p.k} type="button" onClick={() => setPlanClub(p.k)} className="rounded-lg border p-2.5 text-left"
                  style={{ borderColor: planClub === p.k ? ac : C.line, background: planClub === p.k ? "rgba(54,69,79,.08)" : "transparent" }}>
                  <div className="font-display text-sm font-semibold" style={{ color: planClub === p.k ? ac : C.chalk }}>{p.nombre} · {p.precio}</div>
                  <div className="text-[10px]" style={{ color: C.dim }}>{p.equipos}</div>
                </button>
              ))}
              <div className="col-span-2 text-[10px]" style={{ color: C.dim }}>
                {planClub === "gratis" ? "Podrás dar de alta a 1 persona más. Sube de plan cuando quieras desde dentro." : "Al terminar el registro te llevamos a pagar. Las plazas se activan en cuanto se confirma el cobro."}
              </div>
            </div>
          ))}
          {isFree && Field(t("a.teamFree"), (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {!isFree && clubFinal && (
                <div className="col-span-2 sm:col-span-4 mb-3 rounded-lg border p-3" style={{ borderColor: C.line, background: C.panel2 }}>
                  <div className="text-[11px] font-display uppercase tracking-wide mb-2" style={{ color: C.dim }}>Equipos de este club</div>
                  {directoryLoading ? <div className="text-xs" style={{ color: C.dim }}>Cargando equipos…</div> : teamOptions.length ? (
                    <div className="flex flex-wrap gap-2">
                      {teamOptions.map((tm) => <button key={tm.rec} type="button" onClick={() => setSelectedTeam(tm)} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left" style={{ borderColor: selectedTeam?.rec === tm.rec ? ac : C.line, color: selectedTeam?.rec === tm.rec ? ac : C.chalk }}><Crest src={tm.crest} name={tm.name} size={20} /><span className="text-sm">{tm.name}</span></button>)}
                      <button type="button" onClick={() => setSelectedTeam(null)} className="text-xs px-2.5 py-1.5 rounded-lg border" style={{ borderColor: !selectedTeam ? ac : C.line, color: !selectedTeam ? ac : C.dim }}>+ Crear otro</button>
                    </div>
                  ) : <div className="text-xs" style={{ color: C.dim }}>Aún no hay equipos registrados: crea el tuyo abajo.</div>}
                </div>
              )}
                {CATEGORIAS.map((c) => (
                  <button key={c.k} onClick={() => setCat(c.k)} className="rounded-lg border p-2.5 text-left" style={{ borderColor: cat === c.k ? ac : C.line, background: cat === c.k ? C.panel2 : "transparent" }}>
                    <div className="font-display text-base font-semibold leading-tight">{c.label}</div>
                    <div className="text-[10px]" style={{ color: C.dim }}>{c.sub} · {c.f7 ? "F7" : "F11"}</div>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px]" style={{ color: C.dim }}>Equipo</span>
                {LETRAS.map((l) => (
                  <button key={l} onClick={() => setLetra(l)} className="w-9 h-9 rounded-full border font-display" style={{ borderColor: letra === l ? ac : C.line, color: letra === l ? ac : C.dim }}>{l}</button>
                ))}
              </div>
              <div className="text-[11px] mt-2" style={{ color: C.dim }}>
                Tu equipo será <span style={{ color: C.chalk }}>{team.name}</span> — {team.sub}.
              </div>
            </>
          ))}
          {false && Field(t("a.role"), (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(ROLES).filter(([k]) => k !== "master").map(([k, r]) => (
                  <button key={k} onClick={() => setRole(k)} className="rounded-lg border p-2.5 text-left" style={{ borderColor: role === k ? r.color : C.line, background: role === k ? C.panel2 : "transparent" }}>
                    <div className="font-display text-sm font-semibold flex items-center gap-1.5 leading-tight"><span style={{ color: r.color }}>{r.icon}</span>{r.label}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: C.dim }}>{r.desc}</div>
                  </button>
                ))}
              </div>
              <div className="text-[11px] mt-2" style={{ color: C.dim }}>{t("a.pending")}</div>
            </>
          ))}
          {account === "oficial" && (
            <div className="mb-5 rounded-lg border p-3 text-xs" style={{ borderColor: C.line, background: C.panel2, color: C.dim }}>
              <div className="font-display uppercase tracking-wide mb-1" style={{ color: C.chalk }}>Alta por el club</div>
              A los equipos oficiales te da de alta el director deportivo o el Master. Usa el <strong>mismo correo</strong> con el que te añadieron y elige aquí tu contraseña. Tu equipo y tu rol ya vienen definidos.
            </div>
          )}
          {isFree && <div className="mb-5 rounded-lg border p-3 text-xs" style={{ borderColor: C.line, background: C.panel2, color: C.dim }}>{t("a.freeInc")}</div>}
          <button disabled={!regReady || busy} onClick={submitRegister} className="w-full font-display uppercase tracking-wider py-3 rounded-lg font-semibold disabled:opacity-40" style={{ background: ac, color: C.sobre }}>
            {busy ? t("a.loading") : isFree ? t("a.startFree") : t("a.create")}
          </button>
        </>}
    </>
  );
}

/* ============================================================ */
/* ---------------- UI helpers ----------------
   OJO: estos tres tienen que estar FUERA del componente App, y no dentro.

   Estaban definidos dentro, y eso rompía la escritura en toda la app: al
   declararse en el cuerpo de App, cada render creaba una función nueva, y
   para React una función distinta es un componente DISTINTO. Así que en cada
   pulsación de tecla desmontaba la tarjeta entera y montaba otra desde cero;
   el <input> que estabas usando desaparecía, perdía el foco y la segunda
   letra ya no llegaba a ninguna parte. Escribir "guadalajara" en Convocatoria
   dejaba una "g".

   Al vivir aquí arriba la identidad es estable, React reconcilia en vez de
   remontar, y el foco se queda donde debe. Regla para lo que venga: un
   componente no se declara dentro de otro componente. */

/* La cabecera repite la línea de cal del menú: rótulo y filete corriendo
   hasta el borde, para que el mismo gesto ordene el menú y las tarjetas. */
const Card = ({ title, children, className = "" }) => (
  <div className={`rounded-lg border p-4 min-w-0 ${className}`} style={{ background: C.panel, borderColor: C.line }}>
    {title && (
      <div className="flex items-center gap-2.5 mb-3 min-w-0">
        {/* Título de la tarjeta: antes iba con `shrink-0` y sin tope, así que un
            título largo (el nombre de un club y su categoría, por ejemplo) no
            se encogía nunca y empujaba la página entera más ancha que la
            pantalla. En el móvil eso arrastra hasta a la barra inferior fija,
            que sigue el ancho real de la página, no el de la pantalla. Con
            `truncate` el título se recorta con puntos suspensivos si no cabe,
            en vez de romper el ancho de todo lo demás. */}
        <span className="font-display text-sm uppercase tracking-widest truncate min-w-0" style={{ color: C.chalk }}>{title}</span>
        <span className="h-px flex-1 min-w-[8px]" style={{ background: C.line }} />
      </div>
    )}
    {children}
  </div>
);
const Dot = ({ st }) => <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: stColor(st) }} />;
/* Barra de progreso de firmas. Fuera del componente por lo mismo que Card. */
const Bar2 = ({ a, b }) => (
  <div className="h-2 rounded-full overflow-hidden mt-1" style={{ background: C.bg }}>
    <div className="h-full rounded-full" style={{ width: `${b ? (a / b) * 100 : 0}%`, background: a === b ? C.green : C.dim }} />
  </div>
);
const Avatar = ({ p, size = 32 }) => (
  <div className="rounded-full border overflow-hidden flex items-center justify-center font-display font-bold shrink-0"
    style={{ width: size, height: size, borderColor: C.line, background: C.panel2, color: C.dim, backgroundImage: p.photo ? `url(${p.photo})` : "none", backgroundSize: "cover", backgroundPosition: "center", fontSize: size * 0.42 }}>
    {!p.photo && p.d}
  </div>
);

/* Google AdSense. IDs de placeholder hasta que se apruebe la cuenta —
   sustituir por los reales (Panel de AdSense > Anuncios > Por unidad de
   anuncio) y el banner empieza a servir anuncios automáticamente. Solo se
   muestra a cuentas del plan gratuito (ver uso en App: {!isPro && <AdBanner/>}). */
const ADSENSE_CLIENT_ID = "ca-pub-XXXXXXXXXXXXXXXX";
const ADSENSE_SLOT_ID = "XXXXXXXXXX";
const AdBanner = () => {
  const ref = useRef(null);
  useEffect(() => {
    if (ADSENSE_CLIENT_ID.includes("XXXX")) return;
    if (!document.querySelector('script[data-adsbygoogle]')) {
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
      s.crossOrigin = "anonymous";
      s.dataset.adsbygoogle = "1";
      document.head.appendChild(s);
    }
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* AdSense aún no cargado */ }
  }, []);
  if (ADSENSE_CLIENT_ID.includes("XXXX")) return null;
  return (
    <div className="my-3 flex justify-center" ref={ref}>
      <ins className="adsbygoogle" style={{ display: "block", width: "100%" }}
        data-ad-client={ADSENSE_CLIENT_ID} data-ad-slot={ADSENSE_SLOT_ID}
        data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
};

export default function App() {
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cb_session_v1");
      if (raw) setSession(JSON.parse(raw));
    } catch { /* sesión local no disponible */ }
    const id = setTimeout(() => setBooting(false), 650);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => {
    if (booting) return;
    try {
      if (session) localStorage.setItem("cb_session_v1", JSON.stringify(session));
      else localStorage.removeItem("cb_session_v1");
    } catch { /* sesión local no disponible */ }
  }, [session, booting]);
  /* Bug real: el idioma nunca se guardaba. Cada recarga de página (cerrar y
     abrir la pestaña, volver a entrar tras el 401 de sesión caducada, etc.)
     reiniciaba a español aunque el usuario hubiera elegido inglés — así que
     "vuelve a salir en español" pasaba de verdad, no solo por falta de
     traducción. */
  const [lang, setLangRaw] = useState(() => {
    try { return localStorage.getItem("cb_lang") || "es"; } catch { return "es"; }
  });
  const setLang = (l) => { setLangRaw(l); try { localStorage.setItem("cb_lang", l); } catch { /* noop */ } };
  const t = (k) => T(lang, k);
  const role = session ? ROLES[session.role] : ROLES.entrenador;
  /* El color de mando lo pone el TEMA, no el rol: en claro es el carbón y en
     oscuro el gris claro, para que un botón principal se vea en los dos. */
  const AC = C.mando;
  /* C.D. Chamartín Vergara nunca ve topes de plan gratuito, sea cual sea el
     Plan que tenga puesto en Airtable: mismo criterio que isPro más abajo. */
  const lim = session ? (esClubChamartinVergara(session.club) ? LIMITS.oficial : LIMITS[session.plan]) : LIMITS.oficial;
  /* Días de prueba. Manda lo que diga Airtable (lo pone el Master a mano en
     el campo "Prueba hasta"), y el contador local queda solo de respaldo para
     el registro libre sin backend. Antes vivía únicamente en localStorage: se
     reiniciaba al borrar caché y no viajaba entre dispositivos, así que el
     mismo usuario tenía prueba infinita cambiando de móvil. */
  const trialDaysLeft = session ? Math.max(Number(session.prueba) || 0, trialLeft(session.email)) : 0;
  const onTrial = trialDaysLeft > 0 && !session?.pro;
  /* C.D. Chamartín Vergara tiene la app completa sin pagar, para todo su
     cuerpo técnico: no depende del rol de cada persona ni de si tiene
     suscripción, solo de a qué club pertenece. */
  const isPro = !!session && (session.role === "master" || !!session.pro || trialDaysLeft > 0 || esClubChamartinVergara(session.club));
  const pro = (feature) => isPro || !PRO_FEATURES.some((f) => f.k === feature);
  const pendingRestricted = ["viewUsers", "grantAccess", "manageDocs"];

  /* Sistema de permisos por rol y categoría:
     - Master: acceso total
     - Director: gestiona categorías del club
     - Entrenador: edita su categoría, ve otras del club de lectura
     - Segundo: propuestas en su categoría, ve otras del club de lectura
     - Delegado: lectura de su categoría y otras del club */
  const canEditCategory = (categoryId) => {
    if (session?.role === "master") return true;
    if (session?.role === "director") return session?.club; // Todo su club
    if (session?.role === "entrenador") return session?.categories?.includes(categoryId);
    if (session?.role === "segundo") return false; // Solo propuestas, no edición directa
    if (session?.role === "delegado") return false; // Solo lectura
    return false;
  };

  const canViewCategory = (categoryId) => {
    if (session?.role === "master") return true;
    if (session?.role === "director") return true; // Todas del club
    if (session?.role === "entrenador") return true; // Todas del club
    if (session?.role === "segundo") return true; // Todas del club
    if (session?.role === "delegado") return true; // Todas del club
    return false;
  };

  const canProposeChanges = () => {
    /* Cubre tanto la sesión real (session.rolesExtra, del login de verdad)
       como la demo local (CATEGORIES_INIT, donde el rol combinado se
       resuelve por categoría, ej. Luis García = segundo + delegado). */
    if (tieneRolFront(session, "segundo")) return true;
    const rolesInCat = getRolesInCategory(session?.userId, session?.categoryId);
    return rolesInCat.includes("segundo");
  };

  const can = (p) => {
    const hasPermission = role.perms.includes(p);
    const notFreeRestricted = !(session?.plan === "free" && p === "viewUsers" && !esClubChamartinVergara(session?.club));
    const notPendingRestricted = !(session?.pendingApproval && pendingRestricted.includes(p));
    return hasPermission && notFreeRestricted && notPendingRestricted;
  };

  /* Claro u oscuro. Se guarda en el dispositivo: es una preferencia de quien
     mira la pantalla, no del equipo ni de la cuenta. Cambiarlo muta la paleta y
     este `setTema` vuelve a pintar el árbol, que es lo que la aplica. */
  const [tema, setTema] = useState(temaGuardado);
  useEffect(() => {
    try { localStorage.setItem(TEMA_KEY, tema); } catch { /* sin almacenamiento */ }
  }, [tema]);
  /* La paleta se muta ANTES de pedir el re-render, no en un efecto posterior:
     si se hace después, React ya ha pintado con los colores viejos y solo
     cambia el fondo del documento —que es justo lo que pasaba: el fondo se
     ponía negro y las tarjetas se quedaban blancas. */
  const cambiarTema = () => {
    const nuevo = tema === "oscuro" ? "claro" : "oscuro";
    aplicarTema(nuevo);
    setTema(nuevo);
  };

  const [tab, setTab] = useState("inicio");
  /* Cualquier camino a un apartado de pago sin PRO acaba en Premium. El menú
     ya lo evita, pero se llega también desde los accesos rápidos de Inicio y
     desde el botón de pizarra del modo partido: poner el corte aquí cubre
     todas las entradas de una vez, presentes y futuras. */
  useEffect(() => {
    if (tab !== "premium" && !isPro && esTabPro(tab)) setTab("premium");
  }, [tab, isPro]); // eslint-disable-line
  const [mkCat, setMkCat] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [exCat, setExCat] = useState("all");
  const [pendingExId, setPendingExId] = useState(null);
  /* Jugada que el modo partido manda abrir en la pizarra. */
  const [pendingPlayId, setPendingPlayId] = useState(null);
  /* Propuestas del segundo entrenador esperando aprobación del entrenador principal */
  const [proposals, setProposals] = useState(PROPOSALS_INIT);
  /* Categoría actualmente seleccionada si el usuario tiene múltiples */
  const [selectedCategory, setSelectedCategory] = useState(session?.currentCategory);
  /* Orden del menú fijo de abajo (móvil), a elegir por cada persona: por
     defecto sale Inicio + hasta tres secciones más (Pizarra, Entrenamiento,
     Modo partido), pero un delegado no vive de eso — puede preferir tener
     Disciplina o Asistencia como principales. Se guarda por dispositivo y
     por cuenta (email), no viaja a la nube ni entre dispositivos. */
  const navOrderKey = `cb_navorder_${session?.email || "anon"}`;
  const [navOrder, setNavOrderState] = useState(null);
  useEffect(() => {
    if (!session) return;
    try { setNavOrderState(JSON.parse(localStorage.getItem(navOrderKey) || "null")); } catch { setNavOrderState(null); }
  }, [navOrderKey]); // eslint-disable-line
  const setNavOrder = (orden) => {
    setNavOrderState(orden);
    try {
      if (orden && orden.length) localStorage.setItem(navOrderKey, JSON.stringify(orden));
      else localStorage.removeItem(navOrderKey);
    } catch { /* noop */ }
  };
  /* Las jugadas las guarda la pizarra en localStorage; el modo partido las lee
     de la misma clave para poder listar los ABP sin duplicar el almacén. Se
     relee al entrar en la pestaña de partido, que es cuando importan. */
  const [abpGuardados, setAbpGuardados] = useState([]);
  useEffect(() => {
    if (tab !== "partido") return;
    let vivo = true;
    let locales = [];
    try {
      const raw = localStorage.getItem(`cb_wbplays_${session?.team?.id || "demo"}`);
      locales = raw ? JSON.parse(raw) || [] : [];
    } catch { locales = []; }
    const soloABP = (xs) => xs.filter((p) => p.tipo && p.tipo !== "libre");
    setAbpGuardados(soloABP(locales));
    /* Y además las que el equipo tenga compartidas: el delegado que lleva los
       cambios no ha dibujado ninguna en su móvil, pero tiene que verlas. */
    if (session?.team?.rec) {
      airJugadasLeer(session.team.rec).then((delEquipo) => {
        if (vivo && delEquipo?.length) setAbpGuardados(soloABP(mezclarJugadas(locales, delEquipo)));
      });
    }
    return () => { vivo = false; };
  }, [tab, session?.team?.id, session?.team?.rec]);
  const trainKey = `cb_train_${session?.team?.id || "demo"}`;
  const [trainMeta, setTrainMeta] = useState({ fecha: "", hora: "18:30", objetivo: "" });
  const [trainBlocks, setTrainBlocks] = useState([]);
  /* Duración objetivo de la sesión. El entrenador decide primero cuánto dura
     el entreno (lo marca la instalación y la categoría, no los ejercicios) y
     luego rellena ese hueco. Sirve de tope visible mientras añade bloques. */
  const [trainTarget, setTrainTarget] = useState(60);
  const [sesBusy, setSesBusy] = useState(false);
  const [sesMsg, setSesMsg] = useState("");
  const [trainCopied, setTrainCopied] = useState(false);
  /* Días fijos de entrenamiento (0=dom … 6=sáb). Se usan para pintar el
     calendario; el plan de sesión concreto sigue en trainMeta. */
  const trainDaysKey = `cb_traindays_${session?.team?.id || "demo"}`;
  const [trainDays, setTrainDays] = useState([2, 4]);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  /* Día seleccionado en la cuadrícula mensual de la pestaña Calendario
     (formato ISO, ej. "2026-08-16"), o null si no hay ninguno pinchado. */
  const [selectedDay, setSelectedDay] = useState(null);
  useEffect(() => {
    if (!session) return;
    try { const raw = localStorage.getItem(trainDaysKey); if (raw) setTrainDays(JSON.parse(raw)); } catch { /* noop */ }
  }, [trainDaysKey]); // eslint-disable-line
  useEffect(() => {
    if (!session) return;
    try { localStorage.setItem(trainDaysKey, JSON.stringify(trainDays)); } catch { /* noop */ }
  }, [trainDays, trainDaysKey]); // eslint-disable-line
  useEffect(() => {
    if (!session) return;
    try {
      const raw = localStorage.getItem(trainKey);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.meta) setTrainMeta(d.meta);
      if (Array.isArray(d.blocks)) setTrainBlocks(d.blocks);
      if (Number(d.target) > 0) setTrainTarget(Number(d.target));
    } catch { /* sin localStorage disponible */ }
  }, [trainKey]); // eslint-disable-line
  useEffect(() => {
    if (!session) return;
    try { localStorage.setItem(trainKey, JSON.stringify({ meta: trainMeta, blocks: trainBlocks, target: trainTarget })); } catch { /* noop */ }
  }, [trainMeta, trainBlocks, trainTarget, trainKey]); // eslint-disable-line
  const trainTotal = trainBlocks.reduce((s, b) => s + (Number(b.dur) || 0), 0);
  /* Cuánto queda por rellenar y cuánto se ha pasado, que en el campo importa
     tanto lo uno como lo otro: una sesión que se va de tiempo se corta sola. */
  const trainFaltan = Math.max(0, trainTarget - trainTotal);
  const trainSobran = Math.max(0, trainTotal - trainTarget);
  const trainCompleta = trainBlocks.length > 0 && trainTotal >= trainTarget;
  const trainMaterials = [...new Set(trainBlocks.flatMap((b) => b.materials || []))];
  const addTrainBlock = (b) => setTrainBlocks((bs) => [...bs, { ...b, id: Date.now() + Math.random() }]);
  const removeTrainBlock = (id) => setTrainBlocks((bs) => bs.filter((b) => b.id !== id));
  const moveTrainBlock = (id, dir) => setTrainBlocks((bs) => {
    const i = bs.findIndex((b) => b.id === id); const j = i + dir;
    if (i < 0 || j < 0 || j >= bs.length) return bs;
    const next = [...bs]; [next[i], next[j]] = [next[j], next[i]]; return next;
  });
  const trainSummary = () => {
    const lines = trainBlocks.map((b, i) => `${i + 1}. ${b.name} — ${b.dur} min`);
    return `🏋️ *ENTRENAMIENTO — ${session.club} ${session.team.name}*\n📅 ${fechaLegible(trainMeta.fecha, lang) || "—"} · ⏰ ${trainMeta.hora || "—"}\n🎯 ${trainMeta.objetivo || "—"}\n\n${lines.join("\n")}\n\n⏱ Duración total: ${trainTotal} min\n🎒 Material: ${trainMaterials.join(", ") || "—"}`;
  };
  const copyTrainSummary = async () => {
    const txt = trainSummary();
    try { await navigator.clipboard.writeText(txt); }
    catch { const ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); }
    setTrainCopied(true); setTimeout(() => setTrainCopied(false), 1800);
  };
  const [proModal, setProModal] = useState(null);
  const [needsSquad, setNeedsSquad] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [trialWarn, setTrialWarn] = useState(false);
  /* Aviso una sola vez cuando quedan 2 dias o menos de prueba */
  useEffect(() => {
    if (!session || session.pro || trialDaysLeft <= 0 || trialDaysLeft > 2) return;
    try {
      const k = `cb_trialwarn_${String(session.email).toLowerCase()}`;
      if (localStorage.getItem(k)) return;
      localStorage.setItem(k, "1");
    } catch { /* sin localStorage */ }
    setTrialWarn(true);
  }, [trialDaysLeft, session?.email]); // eslint-disable-line
  const [squadText, setSquadText] = useState("");
  const proAlert = (feature) => setProModal(feature || true);
  const [players, setPlayers] = useState(PLAYERS_INIT);
  const [users, setUsers] = useState(USERS_INIT);
  /* --- disciplina, normativa y galería familiar --- */
  const [incidents, setIncidents] = useState(INCIDENTS_INIT);
  const [docs] = useState(DOCS_INIT);
  const [signs, setSigns] = useState(SIGNS_INIT);
  const [discFilter, setDiscFilter] = useState("all");
  const [attend, setAttend] = useState({});
  const [attDate, setAttDate] = useState(() => hoyISO());
  const [attCtx, setAttCtx] = useState("Entrenamiento");
  const [quickPid, setQuickPid] = useState(null);
  const [teamForm, setTeamForm] = useState(null);
  /* Asistencia diaria: separada del "pasar lista" de Disciplina (ese sí abre
     incidencias por retraso o falta sin avisar). Esto es un registro sin
     consecuencias, para saber quién ha venido y el motivo del que no. */
  const asistKey = `cb_asist_${session?.team?.id || "demo"}`;
  const [asistencia, setAsistencia] = useState({});
  useEffect(() => {
    try { const raw = localStorage.getItem(asistKey); setAsistencia(raw ? JSON.parse(raw) || {} : {}); }
    catch { setAsistencia({}); }
  }, [asistKey]);
  useEffect(() => {
    try { localStorage.setItem(asistKey, JSON.stringify(asistencia)); } catch { /* noop */ }
  }, [asistencia, asistKey]);
  const [asistFecha, setAsistFecha] = useState(() => hoyISO());
  const [asistPick, setAsistPick] = useState(null);
  /* ---- Asistencia real de cada jugador ----
     El campo "att" de la ficha era un número muerto: se rellenaba al crear al
     jugador y no lo recalculaba nadie nunca. Resultado: por muchos días que se
     pasara lista en Asistencia, "Top asistencia" en Estadísticas y la ficha
     enseñaban el mismo 0% para toda la plantilla, y a Coach AI se le pasaba ese
     0% como dato bueno justo cuando se le pregunta quién merece más minutos.
     Ahora sale de lo que hay registrado de verdad. Solo cuentan los días en los
     que se pasó lista (los que tienen alguna marca): un día sin abrir la lista
     no es una falta de nadie. Sin ningún día pasado todavía se devuelve null y
     quien lo use se queda con lo que tuviera la ficha, para no enseñar un 0%
     recién inventado como si fuera real. */
  const diasConLista = Object.values(asistencia).filter((d) => d && Object.keys(d).length > 0);
  const attPct = (p) => {
    if (!diasConLista.length) return Number(p?.att) || 0;
    const presentes = diasConLista.filter((d) => d[p.id] === "presente").length;
    return Math.round((presentes / diasConLista.length) * 100);
  };
  /* histórico de convocatorias */
  const [calls, setCalls] = useState(CALLS_INIT);
  const [callMsg, setCallMsg] = useState("");
  const callsKey = `cb_calls_${session?.team?.id || "demo"}`;
  useEffect(() => {
    if (!session) return;
    try { const raw = localStorage.getItem(callsKey); if (raw) setCalls(JSON.parse(raw) || []); } catch { /* noop */ }
  }, [callsKey]); // eslint-disable-line
  useEffect(() => {
    if (!session) return;
    try { localStorage.setItem(callsKey, JSON.stringify(calls)); } catch { /* noop */ }
  }, [calls, callsKey]); // eslint-disable-line
  /* escudo del equipo */
  const [crest, setCrest] = useState(null);
  const crestKey = `cb_crest_${session?.team?.id || "demo"}`;
  useEffect(() => {
    if (!session) return;
    if (session.team?.crest) { setCrest(session.team.crest); return; }
    try { setCrest(localStorage.getItem(crestKey) || null); } catch { setCrest(null); }
  }, [crestKey]); // eslint-disable-line
  const uploadCrest = (file) => {
    const r = new FileReader();
    r.onload = async () => {
      const dataUrl = String(r.result);
      setCrest(dataUrl);
      try { localStorage.setItem(crestKey, dataUrl); } catch { /* noop */ }
      extraerAcentoDeEscudo(dataUrl).then((par) => { if (par && !acentoManual) setAcentoMenu(par); });
      const rec = session.team?.rec;
      if (rec) {
        const out = await airCrest(rec, dataUrl.split(",")[1], file.type || "image/png", file.name || "escudo.png");
        if (out?.url) { setCrest(out.url); try { localStorage.setItem(crestKey, out.url); } catch { /* noop */ } }
      }
    };
    r.readAsDataURL(file);
  };
  /* ---- Acento del menú, a partir del escudo ----
     Por club (no por categoría: el escudo es el mismo para todas), y
     editable a mano — quien prefiera el blanco/negro de siempre, o un color
     propio distinto del detectado, puede desactivarlo o cambiarlo desde Mi
     cuenta. "acentoManual" es lo que decide esa persona; "acentoAuto" es lo
     último que se detectó del escudo. Nunca se pisan entre sí: si hay
     elección manual, manda ella; si no, manda lo detectado. */
  const acentoKey = `cb_acento_${session?.club || "demo"}`;
  const acentoManualKey = `cb_acentoManual_${session?.email || "demo"}`;
  const [acentoAuto, setAcentoAutoState] = useState(null);
  const [acentoManual, setAcentoManualState] = useState(undefined); // undefined = sin elegir; null = "blanco y negro" a propósito
  useEffect(() => {
    if (!session) return;
    try { setAcentoAutoState(JSON.parse(localStorage.getItem(acentoKey) || "null")); } catch { setAcentoAutoState(null); }
    try {
      const raw = localStorage.getItem(acentoManualKey);
      setAcentoManualState(raw === null ? undefined : JSON.parse(raw));
    } catch { setAcentoManualState(undefined); }
  }, [acentoKey, acentoManualKey]); // eslint-disable-line
  const setAcentoMenu = (par) => {
    setAcentoAutoState(par);
    try { par ? localStorage.setItem(acentoKey, JSON.stringify(par)) : localStorage.removeItem(acentoKey); } catch { /* noop */ }
  };
  const setAcentoManual = (par) => {
    // par: {claro,oscuro} elegido a mano, null = "blanco y negro" a propósito, undefined = "sigue lo automático"
    setAcentoManualState(par);
    try { par === undefined ? localStorage.removeItem(acentoManualKey) : localStorage.setItem(acentoManualKey, JSON.stringify(par)); } catch { /* noop */ }
  };
  /* Lo que de verdad se pinta: elección manual si existe, si no lo detectado
     del escudo, si no el blanco/negro de siempre (AC, más abajo). */
  const acentoActivo = acentoManual !== undefined ? acentoManual : acentoAuto;
  /* Color de acento SOLO del menú (barra lateral, barra de abajo, cajón
     "Más"): el resto de la app -botones, formularios, colores que
     significan algo- se queda en negro/blanco (AC), a propósito. */
  const MC = acentoActivo ? (acentoActivo[tema] || AC) : AC;
  /* gestión de equipos (rol Master) */
  const [teams, setTeams] = useState([]);
  const [teamEdit, setTeamEdit] = useState(null);
  const [teamMsg, setTeamMsg] = useState("");
  /* Los clubs se cargan aparte de las categorías: un club recién creado no
     tiene ninguna todavía, y si solo se mirasen las categorías ese club no
     aparecería por ningún lado. */
  const [clubsAll, setClubsAll] = useState([]);
  const [clubNuevo, setClubNuevo] = useState(null);
  /* Plantillas que el Master ha abierto, por categoría: se piden a la nube al
     desplegar y se quedan cacheadas mientras dure la pantalla. Cargar de golpe
     los jugadores de todas las categorías sería una petición por equipo para
     enseñar algo que casi nunca se mira entero. */
  const [plantillasVistas, setPlantillasVistas] = useState({});
  const [plantillaAbierta, setPlantillaAbierta] = useState(null);
  const verPlantilla = async (rec) => {
    if (plantillaAbierta === rec) { setPlantillaAbierta(null); return; }
    setPlantillaAbierta(rec);
    if (plantillasVistas[rec]) return;
    const js = await airList("jugadores", rec);
    setPlantillasVistas((m) => ({ ...m, [rec]: Array.isArray(js) ? js.map(jugFromAir) : null }));
  };
  const loadTeams = async () => {
    const [rows, cls] = await Promise.all([airTeams(), airClubs()]);
    if (cls) setClubsAll(cls);
    if (rows) { setTeams(rows); setTeamMsg(""); }
    else setTeamMsg("Sin conexión con la nube. Los clubs y sus categorías no se pueden gestionar ahora mismo.");
  };
  useEffect(() => { if (session?.role === "master") loadTeams(); }, [session?.role]); // eslint-disable-line
  const [discPid, setDiscPid] = useState("all");
  const [discForm, setDiscForm] = useState(null);
  const [docSel, setDocSel] = useState("d1");
  const discKey = `cb_disc_${session?.team?.id || "demo"}`;
  useEffect(() => {
    if (!session) return;
    try {
      const raw = localStorage.getItem(discKey);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (Array.isArray(d.incidents)) setIncidents(d.incidents);
      if (d.signs) setSigns(d.signs);
      if (d.attend) setAttend(d.attend);
    } catch { /* sin localStorage */ }
  }, [discKey]); // eslint-disable-line
  useEffect(() => {
    if (!session) return;
    try { localStorage.setItem(discKey, JSON.stringify({ incidents, signs, attend })); } catch { /* noop */ }
  }, [incidents, signs, attend, discKey]); // eslint-disable-line
  useEffect(() => {
    if (!session) return;
    let alive = true;
    (async () => {
      const rows = await airRes("incidencias", session.team?.rec);
      if (!alive || !Array.isArray(rows) || !rows.length) return;
      const norm = (x) => String(x || "").replace(/^#\d+\s*/, "").trim().toLowerCase();
      const mapped = rows.map((r) => {
        const hit = players.find((p) => norm(p.n) && norm(r.player).includes(norm(p.n)));
        return hit ? { ...r, pid: hit.id } : null;
      }).filter(Boolean);
      if (mapped.length) setIncidents(mapped);
    })();
    return () => { alive = false; };
  }, [session]); // eslint-disable-line
  const [lineup, setLineup] = useState(LINEUP_INIT);
  /* Borrador del segundo entrenador: antes cada toque llamaba a
     updateLineupWithProposal y mandaba UNA propuesta por movimiento —media
     docena de toques, media docena de propuestas idénticas esperando turno,
     y encima sin verse reflejadas en su propia pantalla (nunca se tocaba
     `lineup`, solo se mandaban a Airtable a ciegas). Ahora edita este
     borrador local, lo ve al momento, y lo manda entero con un solo botón
     cuando ya está conforme. Quien no propone (entrenador, director, master)
     ni lo usa: sigue editando `lineup` directamente, como siempre. */
  const [lineupDraft, setLineupDraft] = useState(null);
  const setLineupSmart = (updater) => {
    if (canProposeChanges()) {
      setLineupDraft((d) => {
        const base = d || lineup;
        return typeof updater === "function" ? updater(base) : updater;
      });
    } else {
      setLineup(updater);
    }
  };
  const [sysCode, setSysCode] = useState("4-3-3");
  const [sysCustom, setSysCustom] = useState("");
  const [slotPos, setSlotPos] = useState(SLOTS_433);
  /* Al cambiar de sistema se regeneran las posiciones y se reasignan los
     jugadores por orden, para no perder la alineación ya montada. */
  const applySystem = (code) => {
    if (canProposeChanges() && miPropuestaPendiente("lineup")) return false;
    const clean = String(code).trim();
    if (!/^\d+(-\d+)+$/.test(clean)) return false;
    const nuevos = buildSlots(clean);
    const nIds = Object.keys(nuevos);
    const total = nIds.length;
    if (total < 5 || total > 11) return false;
    const previos = Object.keys(slotPos);
    setLineupSmart((l) => {
      const out = {};
      nIds.forEach((id, i) => { const viejo = previos[i]; if (viejo && l[viejo]) out[id] = l[viejo]; });
      return out;
    });
    setSlotPos(nuevos);
    setSysCode(clean);
    setSelSlot(null);
    setSelPlayer(null);
    return true;
  };
  const [selSlot, setSelSlot] = useState(null);
  /* Camino inverso al de tocar un puesto en el campo: elegir primero al
     jugador (del banquillo o de la propia alineación) y que la app enseñe
     ahí mismo, a la derecha, en qué puestos puede entrar -el suyo primero-
     sin tener que acertar el punto exacto del campo, más cómodo en móvil. */
  const [selPlayer, setSelPlayer] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [genBusy, setGenBusy] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvReplace, setCsvReplace] = useState(false);
  const [csvMsg, setCsvMsg] = useState("");

  /* Antes arrancaba con un partido inventado ("CD Norte · Domingo 27 · Campo
     Municipal Las Rozas") que en una cuenta real parecía de verdad. Ahora solo
     se rellena así en el modo demo. */
  const MATCHINFO_DEMO = { rival: "CD Norte", fecha: "Domingo 27", hora: "10:00", lugar: "Campo Municipal Las Rozas", j: "" };
  const MATCHINFO_VACIO = { rival: "", fecha: "", hora: "", lugar: "", j: "" };
  const [matchInfo, setMatchInfo] = useState(MATCHINFO_VACIO);
  /* calendario del equipo */
  const [fixtures, setFixtures] = useState(FIXTURES_INIT);
  /* ===== Sincronización con Airtable =====
     Al entrar se cargan plantilla y partidos del equipo. Si Airtable responde,
     manda Airtable; si no hay backend, se sigue con localStorage/demo. */
  const [cloudOn, setCloudOn] = useState(false);
  /* Datos del club: escudo propio, campo, dirección y enlace de Maps */
  const [clubInfo, setClubInfo] = useState({ rec: "", crest: null, campo: "", direccion: "", maps: "" });
  /* ---- Plantillas de entrenamiento (reutilizar y compartir) ---- */
  const [plantillas, setPlantillas] = useState([]);
  const [plBusy, setPlBusy] = useState(false);
  const [plMsg, setPlMsg] = useState("");
  const [plNombre, setPlNombre] = useState("");
  const [plCompartir, setPlCompartir] = useState(false);
  const cargarPlantillas = async () => {
    if (!session?.team?.rec) return;
    const rows = await airPlantillas(session.team.rec, clubInfo.rec);
    if (rows) setPlantillas(rows);
  };
  useEffect(() => { cargarPlantillas(); }, [session?.team?.rec, clubInfo.rec]); // eslint-disable-line
  /* `plantillas` trae de Airtable tanto los guiones reutilizables (plantilla:
     true) como las sesiones concretas ya publicadas -guardadas a mano o, ahora,
     aprobadas de una propuesta del segundo- (plantilla:false). Antes el
     backend descartaba estas últimas: se escribían pero no las veía nadie,
     ni siquiera en el dispositivo de quien las había guardado. Separadas
     aquí para que cada sitio pinte lo suyo. */
  const guionesReutilizables = plantillas.filter((p) => p.plantilla);
  const sesionesPublicadas = plantillas.filter((p) => !p.plantilla);
  /* La sesión a enseñar en Inicio y en la pestaña de Entrenamiento: la más
     próxima en el futuro (incluye hoy); si no hay ninguna por venir, la más
     reciente de las pasadas, para no dejar el hueco vacío nada más pasar el
     día. Ya llegan ordenadas por fecha desde el backend. */
  const proximaSesionPublicada = (() => {
    if (!sesionesPublicadas.length) return null;
    const hoy = hoyISO();
    return sesionesPublicadas.find((s) => s.fecha && s.fecha >= hoy) || sesionesPublicadas[sesionesPublicadas.length - 1];
  })();
  const guardarPlantilla = async () => {
    if (!plNombre.trim() || !trainBlocks.length) return;
    if (!session?.team?.rec) { setPlMsg("Este equipo todavía no está en la nube."); return; }
    setPlBusy(true); setPlMsg("");
    const out = await airPlantillaNueva({
      nombre: plNombre.trim(), objetivo: trainMeta.objetivo || "",
      duracion: trainBlocks.reduce((n, b) => n + (Number(b.dur) || 0), 0),
      bloques: trainBlocks, teamRec: session.team.rec, clubRec: clubInfo.rec || undefined,
      compartida: plCompartir,
    });
    setPlBusy(false);
    if (out?.ok) { setPlMsg(`✓ "${plNombre.trim()}" guardada.`); setPlNombre(""); setPlCompartir(false); cargarPlantillas(); }
    else setPlMsg("No se pudo guardar. Revisa la conexión.");
  };
  /* Guarda la sesión ya montada (la del día, con su hora), no un guion
     reutilizable: para eso está "Guardar como plantilla" justo encima, que
     sigue funcionando igual. */
  const guardarSesion = async () => {
    if (!trainCompleta || sesBusy) return;
    /* El segundo entrenador no publica la sesión directamente: la propone, y
       queda a la espera de que el entrenador principal o el director la
       acepten (ver applyApprovedProposal, caso "training", que es quien de
       verdad la publica en Airtable una vez aprobada). Va antes del aviso de
       "equipo sin nube": igual que las demás propuestas, también funciona
       sin backend (queda en memoria, como en la demo). */
    if (canProposeChanges()) {
      if (miPropuestaPendiente("training")) { setSesMsg("Ya tienes una propuesta de entrenamiento esperando aprobación."); return; }
      setSesBusy(true); setSesMsg("");
      await proposeChange("training", { meta: trainMeta, blocks: trainBlocks, target: trainTarget });
      setSesBusy(false);
      setSesMsg("✓ Propuesta de entrenamiento enviada. Esperando aprobación.");
      setTimeout(() => setSesMsg(""), 5000);
      return;
    }
    if (!session?.team?.rec) { setSesMsg("Este equipo todavía no está en la nube."); return; }
    setSesBusy(true); setSesMsg("");
    const nombre = [fechaLegible(trainMeta.fecha, lang) || new Date().toLocaleDateString("es-ES"), trainMeta.hora, trainMeta.objetivo]
      .filter(Boolean).join(" · ");
    const out = await airPlantillaNueva({
      nombre, plantilla: false, objetivo: trainMeta.objetivo || "",
      duracion: trainTotal, bloques: trainBlocks,
      fecha: trainMeta.fecha, hora: trainMeta.hora,
      teamRec: session.team.rec, clubRec: clubInfo.rec || undefined,
    });
    if (out?.ok) cargarPlantillas();
    setSesBusy(false);
    setSesMsg(out?.ok ? `✓ Sesión de ${trainTotal} min guardada.` : "No se pudo guardar. Revisa la conexión.");
    if (out?.ok) setTimeout(() => setSesMsg(""), 5000);
  };
  /* ================= ANÁLISIS POST-PARTIDO =================
     Reutiliza el mismo backend que Coach AI, pero con un prompt propio: no es
     una conversación, es un informe de un partido concreto a partir del acta
     que se acaba de registrar en modo partido. */
  const [postBusy, setPostBusy] = useState(false);
  const [postTxt, setPostTxt] = useState("");
  const [postCopiado, setPostCopiado] = useState(false);
  /* Compartido entre el análisis del partido en curso y el de un partido ya
     guardado en el histórico (que no tiene alineación ni tandas -eso no se
     conserva-, solo acta y marcador): así el formato del informe no se
     puede desincronizar entre los dos sitios donde se genera. */
  const ESTRUCTURA_ANALISIS = `Responde en el idioma del usuario con esta estructura exacta y nada más:
RESUMEN — dos frases sobre cómo fue el partido.
LO QUE FUNCIONÓ — dos o tres puntos.
A CORREGIR — dos o tres puntos.
PRÓXIMO ENTRENAMIENTO — dos ejercicios concretos que ataquen lo de arriba.
Sé breve (máx ~220 palabras) y concreto. Habla de fútbol, no de personas: son menores, así que nada de juicios sobre su carácter ni valoraciones personales, solo lo deportivo. Nunca hagas diagnósticos médicos.`;
  const analizarPartido = async () => {
    if (postBusy || !events.length) return;
    setPostBusy(true); setPostTxt("");
    const evTxt = events.map((e) => `min ${e.disp || e.min}: ${e.type}${e.player ? " — " + e.player : ""}`).join("\n");
    const xi = Object.entries(lineup).map(([s, id]) => { const p = players.find((x) => x.id === id); return p ? `${s}:#${p.d} ${p.n}` : `${s}:vacío`; }).join(", ");
    const resultado = score.us > score.them ? "victoria" : score.us < score.them ? "derrota" : "empate";
    const system = `Eres Coach AI, analista de fútbol base. Escribe el análisis post-partido de ${session.club} ${session.team.name} (${session.team.sub}) contra ${matchInfo.rival || "el rival"}. Resultado: ${score.us}-${score.them} (${resultado}).
${ESTRUCTURA_ANALISIS}
ALINEACIÓN: ${xi}
TANDAS DE CAMBIOS USADAS: ${tandasUsadas} de ${tandasTotal}
ACTA:\n${evTxt}`;
    try {
      const data = await coachRequest(system, [{ role: "user", content: "Analiza el partido con el acta de arriba." }]);
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      setPostTxt(text || "No he podido generar el análisis. Inténtalo de nuevo.");
    } catch {
      setPostTxt("No he podido conectar con el asistente. Inténtalo de nuevo.");
    }
    setPostBusy(false);
  };
  const copiarAnalisis = async () => {
    try { await navigator.clipboard.writeText(postTxt); setPostCopiado(true); setTimeout(() => setPostCopiado(false), 2000); } catch { /* sin portapapeles */ }
  };
  /* Análisis de un partido que ya está en el histórico -guardado sin pasar
     por "generar análisis", o de una temporada anterior-, a partir de lo
     único que se conserva de él: acta y marcador. Se congela en el propio
     historial al terminar, para no tener que regenerarlo cada vez que se
     abra la lista. */
  const [histAnalisisBusyId, setHistAnalisisBusyId] = useState(null);
  const [histAnalisisAbierto, setHistAnalisisAbierto] = useState(null);
  const generarAnalisisHistorico = async (entry) => {
    if (histAnalisisBusyId) return;
    setHistAnalisisBusyId(entry.id);
    const evTxt = (entry.acta || []).map((e) => `min ${e.disp}: ${e.type}${e.player ? " — " + e.player : ""}`).join("\n") || "sin eventos registrados";
    const resultado = entry.us > entry.them ? "victoria" : entry.us < entry.them ? "derrota" : "empate";
    const system = `Eres Coach AI, analista de fútbol base. Escribe el análisis post-partido de ${session.club} ${session.team.name} (${session.team.sub}) contra ${entry.rival || "el rival"}. Resultado: ${entry.us}-${entry.them} (${resultado}).
${ESTRUCTURA_ANALISIS}
ACTA:\n${evTxt}`;
    let texto = "No he podido generar el análisis. Inténtalo de nuevo.";
    try {
      const data = await coachRequest(system, [{ role: "user", content: "Analiza el partido con el acta de arriba." }]);
      texto = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n") || texto;
    } catch {
      texto = "No he podido conectar con el asistente. Inténtalo de nuevo.";
    }
    setHistorial((h) => {
      const out = h.map((x) => (x.id === entry.id ? { ...x, analisis: texto } : x));
      try { localStorage.setItem(histKey, JSON.stringify(out)); } catch { /* noop */ }
      return out;
    });
    setHistAnalisisBusyId(null);
    setHistAnalisisAbierto(entry.id);
  };

  const usarPlantilla = async (p) => {
    let bloques = [];
    try { bloques = JSON.parse(p.bloques || "[]"); } catch { bloques = []; }
    if (!Array.isArray(bloques) || !bloques.length) { setPlMsg("Esa plantilla está vacía."); return; }
    /* id nuevo por bloque: los de la plantilla podrían chocar con los actuales */
    setTrainBlocks(bloques.map((b) => ({ ...b, id: Date.now() + Math.random() })));
    /* Un guion reutilizable no trae fecha ni hora -por eso el aviso pide
       ajustarlas-, pero una sesión ya publicada (p.plantilla === false) sí
       las tiene de verdad: se cargan tal cual, no hay que pedir nada. */
    setTrainMeta((m) => ({ ...m, ...(p.objetivo ? { objetivo: p.objetivo } : {}), ...(p.fecha ? { fecha: p.fecha } : {}), ...(p.hora ? { hora: p.hora } : {}) }));
    setPlMsg(p.plantilla === false ? `✓ Cargada la sesión de "${p.fecha || p.nombre}".` : `✓ Cargada "${p.nombre}". Ajusta la fecha y la hora.`);
    airPlantillaUsar(p.rec);
    setPlantillas((ps) => ps.map((x) => (x.rec === p.rec ? { ...x, usos: x.usos + 1 } : x)));
  };
  const compartirPlantilla = async (p) => {
    setPlantillas((ps) => ps.map((x) => (x.rec === p.rec ? { ...x, compartida: !x.compartida } : x)));
    await airPlantillaEditar(p.rec, { compartida: !p.compartida });
  };
  const borrarPlantilla = async (p) => {
    setPlantillas((ps) => ps.filter((x) => x.rec !== p.rec));
    await airPlantillaBorrar(p.rec);
  };

  /* Aviso de sesión caducada: el backend ya rechaza peticiones sin token, así
     que hay que decirlo en vez de dejar la app medio muerta. */
  const [authMsg, setAuthMsg] = useState("");
  /* Alta de cuerpo técnico por el club (director deportivo o Master) */
  const [nu, setNu] = useState({ name: "", email: "", role: "entrenador" });
  const [nuBusy, setNuBusy] = useState(false);
  const [nuMsg, setNuMsg] = useState("");
  /* Subida del escudo del club (una vez, aplicado a todos sus equipos) */
  const [clubCrestBusy, setClubCrestBusy] = useState(null);
  /* Panel "Gestionar club": límite de plazas y estado de pago, por club */
  const [clubAdminOpen, setClubAdminOpen] = useState(null);
  const [clubAdminData, setClubAdminData] = useState({});
  const [clubAdminBusy, setClubAdminBusy] = useState(false);
  const [clubAdminLimite, setClubAdminLimite] = useState("");
  const [clubCrestMsg, setClubCrestMsg] = useState({});
  useEffect(() => {
    setAuthExpiredHandler(() => setAuthMsg("Tu sesión ha caducado. Vuelve a iniciar sesión para seguir guardando cambios."));
    return () => setAuthExpiredHandler(() => {});
  }, []);  useEffect(() => {
    if (!session) return;
    let vivo = true;
    airClubs().then((rows) => {
      if (!vivo || !rows) return;
      const mio = rows.find((c) => c.name === session.club) || rows[0];
      if (mio) setClubInfo({ rec: mio.rec, crest: mio.crest || null, campo: mio.campo || "", direccion: mio.direccion || "", maps: mio.maps || "" });
      /* Nota: el escudo del equipo (crest) y el del club son distintos. La
         cabecera usaba solo el del equipo y por eso salía vacía aunque el club
         tuviera escudo; teamCrest unifica la cadena de reservas. */
    });
    return () => { vivo = false; };
  }, [session?.club]); // eslint-disable-line
  /* El color del menú solo se calculaba en el momento de SUBIR el escudo:
     si el escudo ya estaba puesto de antes (se cargó desde la nube o de
     localStorage al entrar), acentoAuto se quedaba a null para siempre y
     el menú obligaba a elegir un color a mano aunque el escudo ya existiera.
     Este efecto recalcula el acento cada vez que cambia el escudo efectivo,
     venga de donde venga, no solo al subirlo. */
  useEffect(() => {
    const fuente = clubInfo.crest || crest;
    if (!fuente || acentoManual) return;
    let vivo = true;
    extraerAcentoDeEscudo(fuente).then((par) => { if (vivo && par) setAcentoMenu(par); });
    return () => { vivo = false; };
  }, [clubInfo.crest, crest]); // eslint-disable-line
  const [cloudMsg, setCloudMsg] = useState("");
  const teamRec = session?.team?.rec || "";
  useEffect(() => {
    if (!session || !teamRec) return;
    let vivo = true;
    (async () => {
      const [js, ps] = await Promise.all([airList("jugadores", teamRec), airList("partidos", teamRec)]);
      if (!vivo) return;
      if (js) {
        setCloudOn(true);
        if (js.length) setPlayers(js.map(jugFromAir));
      }
      if (ps) setFixtures(ps.map(partFromAir).sort((a, b) => (a.date < b.date ? -1 : 1)));
    })();
    return () => { vivo = false; };
  }, [teamRec]); // eslint-disable-line

  /* Guarda la plantilla completa en Airtable (crea, actualiza y borra lo que sobre) */
  const subirPlantilla = async () => {
    if (!teamRec) { setCloudMsg("Este equipo todavía no está en la nube."); return; }
    setCloudMsg("Guardando plantilla…");
    const remotos = (await airList("jugadores", teamRec)) || [];
    const porRec = new Map(remotos.map((r) => [r.rec, r]));
    for (const p of players) {
      if (p.rec && porRec.has(p.rec)) { await airEdit("jugadores", p.rec, jugToAir(p, teamRec)); porRec.delete(p.rec); }
      else { const rec = await airNew("jugadores", jugToAir(p, teamRec)); if (rec) p.rec = rec; }
    }
    for (const sobra of porRec.keys()) await airDrop("jugadores", sobra);
    setCloudOn(true);
    setCloudMsg(`✓ Plantilla guardada (${players.length} jugadores)`);
    setTimeout(() => setCloudMsg(""), 5000);
  };
  /* Guarda el calendario de partidos */
  const subirCalendario = async () => {
    if (!teamRec) { setCloudMsg("Este equipo todavía no está en la nube."); return; }
    setCloudMsg("Guardando calendario…");
    const remotos = (await airList("partidos", teamRec)) || [];
    const porRec = new Map(remotos.map((r) => [r.rec, r]));
    for (const f of fixtures) {
      if (f.rec && porRec.has(f.rec)) { await airEdit("partidos", f.rec, partToAir(f, teamRec)); porRec.delete(f.rec); }
      else { const rec = await airNew("partidos", partToAir(f, teamRec)); if (rec) f.rec = rec; }
    }
    for (const sobra of porRec.keys()) await airDrop("partidos", sobra);
    setCloudOn(true);
    setCloudMsg(`✓ Calendario guardado (${fixtures.length} partidos)`);
    setTimeout(() => setCloudMsg(""), 5000);
  };
  const [calText, setCalText] = useState("");
  const [calMsg, setCalMsg] = useState("");
  const calKey = `cb_cal_${session?.team?.id || "demo"}`;
  useEffect(() => {
    if (!session) return;
    try { const raw = localStorage.getItem(calKey); if (raw) setFixtures(JSON.parse(raw) || []); } catch { /* noop */ }
  }, [calKey]); // eslint-disable-line
  useEffect(() => {
    if (!session) return;
    try { localStorage.setItem(calKey, JSON.stringify(fixtures)); } catch { /* noop */ }
  }, [fixtures, calKey]); // eslint-disable-line
  /* duración de cada parte + descuento señalado por el árbitro */
  const [matchCfg, setMatchCfg] = useState({ halfMin: 35, added: 0, tandas: 5 });
  const matchKey = `cb_match_${session?.team?.id || "demo"}`;
  useEffect(() => {
    if (!session) return;
    try {
      const raw = localStorage.getItem(matchKey);
      if (raw) {
        const d = JSON.parse(raw);
        /* tandas con valor por defecto: las configuraciones guardadas antes de
           que existieran las tandas no traen el campo, y sin esto el contador
           salía "NaN / undefined" en cuanto se recuperaba una del navegador. */
        if (d && Number(d.halfMin)) { setMatchCfg({ halfMin: Number(d.halfMin), added: Number(d.added) || 0, tandas: Number(d.tandas) || 5 }); return; }
      }
    } catch { /* sin localStorage */ }
    setMatchCfg({ halfMin: defaultHalf(session.team), added: 0, tandas: 5 });
  }, [matchKey]); // eslint-disable-line
  useEffect(() => {
    if (!session) return;
    try { localStorage.setItem(matchKey, JSON.stringify(matchCfg)); } catch { /* noop */ }
  }, [matchCfg, matchKey]); // eslint-disable-line
  /* La convocatoria en curso NO se guardaba en ningún sitio: al recargar se
     perdían los jugadores elegidos y los datos del partido. Ahora persiste por
     equipo, igual que el resto de módulos. */
  const [called, setCalled] = useState(new Set());
  const callDraftKey = `cb_calldraft_${session?.team?.id || "demo"}`;
  const callDraftListo = useRef(false);
  useEffect(() => {
    callDraftListo.current = false;
    let d = null;
    try { d = JSON.parse(localStorage.getItem(callDraftKey) || "null"); } catch { /* noop */ }
    if (d && Array.isArray(d.ids)) {
      setCalled(new Set(d.ids));
      setMatchInfo({ ...MATCHINFO_VACIO, ...(d.info || {}) });
    } else if (session?.email === "demo") {
      setCalled(new Set([...Object.values(LINEUP_INIT), 12, 13, 16]));
      setMatchInfo(MATCHINFO_DEMO);
    } else {
      setCalled(new Set());
      setMatchInfo(MATCHINFO_VACIO);
    }
    callDraftListo.current = true;
  }, [callDraftKey]); // eslint-disable-line
  useEffect(() => {
    if (!callDraftListo.current) return;   /* no pisar lo guardado en el primer render */
    try { localStorage.setItem(callDraftKey, JSON.stringify({ ids: [...called], info: matchInfo })); } catch { /* noop */ }
  }, [called, matchInfo, callDraftKey]);
  const [copied, setCopied] = useState(false);

  const [running, setRunning] = useState(false);
  const [secs, setSecs] = useState(0);
  const [half, setHalf] = useState(1);
  /* Tandas de cambios: en fútbol base la competición limita las VENTANAS en
     las que puedes cambiar, no el número de jugadores que metes en cada una.
     Por eso se cuenta a mano y no a partir de los eventos de cambio: en una
     misma tanda entran dos o tres jugadores y sigue siendo una sola tanda.
     Lo lleva el delegado o el segundo desde el banquillo. */
  const [tandasUsadas, setTandasUsadas] = useState(0);
  /* Nunca leer matchCfg.tandas directo: puede faltar en configuraciones
     guardadas antes de esta funcion. */
  const tandasTotal = Number(matchCfg.tandas) || 5;
  const [score, setScore] = useState({ us: 0, them: 0 });
  const [events, setEvents] = useState([]);
  const [evPick, setEvPick] = useState(null);
  /* Los ajustes del partido (duración, descuento, tandas) se ponen antes del
     saque. Mientras el partido no ha empezado están a la vista; en cuanto el
     reloj corre se pliegan y solo vuelven si los pides. */
  const [ajustesAbiertos, setAjustesAbiertos] = useState(false);
  /* Para no dejar dudas de si el acta se guardó: el botón se marca. */
  const [actaGuardada, setActaGuardada] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const elapsedMin = Math.floor(secs / 60);
  const minute = elapsedMin + (half === 2 ? matchCfg.halfMin : 0);
  const overMin = Math.max(0, elapsedMin - matchCfg.halfMin);
  const dispMin = overMin > 0 ? `${matchCfg.halfMin}+${overMin}` : String(elapsedMin);
  const dispAbs = overMin > 0 ? `${matchCfg.halfMin * (half === 2 ? 2 : 1)}+${overMin}` : String(minute || 0);
  const endSecs = (matchCfg.halfMin + (Number(matchCfg.added) || 0)) * 60;
  const leftSecs = Math.max(0, endSecs - secs);
  const enJuego = running || secs > 0 || events.length > 0;
  const ajustesVisibles = !enJuego || ajustesAbiertos;

  /* El evento guarda también dorsal e id del jugador, no solo el nombre: sin
     eso no hay forma de sumar los goles y las tarjetas de cada uno al cerrar
     el partido, que es lo que se mira después en Estadísticas. */
  const addEvent = (type, player) => {
    setEvents((e) => [{ min: minute || 1, disp: dispAbs, type, player: player?.n || null, pid: player?.id ?? null, dorsal: player?.d ?? null, half }, ...e]);
    if (type === "gol") setScore((s) => ({ ...s, us: s.us + 1 }));
    if (type === "golRival") setScore((s) => ({ ...s, them: s.them + 1 }));
    setEvPick(null);
  };

  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEnd = useRef(null);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);
  useEffect(() => {
    if (session && msgs.length === 0)
      setMsgs([{ role: "assistant", content: `Hola, ${session.name}. Soy Coach AI (${session.club} · ${session.team.name}). Tu rol es ${role.label.toLowerCase()}${session.plan === "free" ? " · plan gratuito" : ""}. ¿En qué te ayudo?` }]);
  }, [session]); // eslint-disable-line

  /* textoForzado: para preguntas que dispara la propia app desde otra
     pantalla (p.ej. "Preguntar a la IA" en Alineación) sin pasar por la
     caja de texto ni tocar lo que la persona pudiera estar escribiendo ahí. */
  const askCoach = async (textoForzado) => {
    const q = (textoForzado ?? input).trim();
    if (!q || loading) return;
    const next = [...msgs, { role: "user", content: q }];
    setMsgs(next); if (!textoForzado) setInput(""); setLoading(true);
    /* ================= ALCANCE DE COACH AI POR ROL =================
       Coach AI lo tiene todo el mundo, pero cada rol solo le da de comer la
       información que le corresponde. Esto no es un filtro de presentación:
       lo que no se mete en el prompt, el modelo no lo puede contar.

       - Cuerpo técnico (entrenador, segundo, director, master): todo.
       - Delegado: lleva la logística, no la valoración deportiva. Ve quién
         está disponible y el acta, pero NO los minutos, la asistencia ni la
         alineación — eso es criterio del entrenador sobre menores y no es
         asunto suyo. */
    const nivel = session.role === "delegado" ? "delegado" : "tecnico";

    const comun = `Eres Coach AI, asistente de fútbol base (${session.club}, ${session.team.name}, ${session.team.sub}, ${session.comunidad}). Usuario: ${session.name}, rol: ${role.label}. Responde en el idioma del usuario, breve y práctico (máx ~150 palabras), con terminología futbolística natural. Nunca hagas diagnósticos médicos.`;

    let system;
    if (nivel === "tecnico") {
      const roster = players.map((p) => `#${p.d} ${p.n} (${p.pos}, ${p.st}, ${p.min} min, asist ${attPct(p)}%)`).join("\n");
      const xi = Object.entries(lineup).map(([s, id]) => { const p = players.find((x) => x.id === id); return p ? `${s}:#${p.d} ${p.n}` : `${s}:vacío`; }).join(", ");
      const evTxt = events.length ? events.map((e) => `min ${e.min}: ${e.type}${e.player ? " — " + e.player : ""}`).join("\n") : "sin eventos";
      system = `${comun} Adapta el enfoque a su rol técnico.
PLANTILLA:\n${roster}\nALINEACIÓN: ${xi}\nMARCADOR: ${score.us}-${score.them} | EVENTOS:\n${evTxt}`;
    } else {
      /* Sin minutos, sin asistencia y sin alineación: solo disponibilidad. */
      const roster = players.map((p) => `#${p.d} ${p.n} (${p.pos}, ${p.st})`).join("\n");
      const evTxt = events.length ? events.map((e) => `min ${e.min}: ${e.type}${e.player ? " — " + e.player : ""}`).join("\n") : "sin eventos";
      system = `${comun} Es delegado/a: ayúdale con logística, convocatorias, acta del partido, disciplina y normativa del club.
No tienes acceso a los minutos jugados, la asistencia a entrenamientos ni la alineación: son criterio del entrenador. Si te los piden, dilo con naturalidad y sugiere que hable con el entrenador.
PLANTILLA (disponibilidad):\n${roster}\nMARCADOR: ${score.us}-${score.them} | EVENTOS:\n${evTxt}`;
    }
    try {
      const data = await coachRequest(system, next.map((m) => ({ role: m.role, content: m.content })));
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n") || "…";
      setMsgs((m) => [...m, { role: "assistant", content: text }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "No he podido conectar con el asistente. Inténtalo de nuevo." }]);
    }
    setLoading(false);
  };

  const pitchRef = useRef(null);
  const dragRef = useRef(null);
  const onSlotDown = (e, id) => {
    if (!can("editLineup")) return;
    dragRef.current = { id, moved: false, sx: e.clientX, sy: e.clientY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPitchMove = (e) => {
    const d = dragRef.current;
    if (!d || !pitchRef.current) return;
    if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) d.moved = true;
    if (!d.moved) return;
    const r = pitchRef.current.getBoundingClientRect();
    setSlotPos((p) => ({ ...p, [d.id]: { ...p[d.id], x: clamp(((e.clientX - r.left) / r.width) * 100, 7, 93), y: clamp(((e.clientY - r.top) / r.height) * 100, 6, 94) } }));
  };
  const onSlotUp = (id) => {
    const d = dragRef.current; dragRef.current = null;
    if (!d || d.moved || !can("editLineup")) return;
    /* Con un jugador ya elegido (camino "toca al jugador primero"), tocar
       directamente un puesto del campo lo coloca ahí sin pasos de más. */
    if (selPlayer && id) { asignarJugadorAPuesto(id, selPlayer); return; }
    setSelSlot((s) => (s === id ? null : id));
    setSelPlayer(null);
  };

  const avail = players.filter((p) => p.st === "disponible").length;
  const out = players.filter((p) => p.st !== "disponible");
  const lowMin = [...players].sort((a, b) => a.min - b.min).slice(0, 3);
  const starters = new Set(Object.values(lineup));
  const profile = players.find((p) => p.id === profileId);

  const cycleStatus = (id) => can("editSquad") &&
    updateSquadWithProposal((ps) => ps.map((p) => p.id === id ? { ...p, st: p.st === "disponible" ? "duda" : p.st === "duda" ? "lesionado" : "disponible" } : p));

  /* Marcar un jugador en el día abierto de Asistencia. `estado: null` borra
     la marca (vuelve a "sin marcar"). */
  const marcarAsistencia = (pid, estado) => {
    if (!can("editSquad")) return;
    setAsistencia((a) => {
      const dia = { ...(a[asistFecha] || {}) };
      if (estado) dia[pid] = estado; else delete dia[pid];
      return { ...a, [asistFecha]: dia };
    });
  };
  /* El toque directo sobre la ficha es el camino rápido: presente si estaba
     sin marcar, y quita la marca si ya estaba presente (para poder
     deshacerlo sin abrir el selector de motivo). */
  const tocarAsistencia = (pid) => {
    const actual = (asistencia[asistFecha] || {})[pid];
    marcarAsistencia(pid, actual === "presente" ? null : "presente");
  };
  /* Solo rellena a los que aún no tengan nada marcado: no pisa las ausencias
     que ya hayas puesto. */
  const marcarTodosPresentes = () => {
    if (!can("editSquad")) return;
    setAsistencia((a) => {
      const dia = { ...(a[asistFecha] || {}) };
      players.forEach((p) => { if (!dia[p.id]) dia[p.id] = "presente"; });
      return { ...a, [asistFecha]: dia };
    });
  };
  const setPhoto = (id, dataUrl) => setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, photo: dataUrl, video: null } : p)));

  const genVideo = async (p) => {
    if (!lim.video) return proAlert("video");
    if (!p.photo || genBusy) return;
    setGenBusy(true);
    try {
      const url = await makePresentationVideo(p, session.club, session.team.name, AC);
      setPlayers((ps) => ps.map((x) => (x.id === p.id ? { ...x, video: url } : x)));
    } catch { alert("Tu navegador no soporta la grabación de vídeo (MediaRecorder). Prueba en Chrome/Edge."); }
    setGenBusy(false);
  };

  const importCSV = () => {
    const startId = Math.max(0, ...players.map((p) => p.id)) + 1;
    const nuevos = parseCSV(csvText, startId);
    if (!nuevos.length) { setCsvMsg("No se ha reconocido ningún jugador. Formato: nombre,apellidos,dorsal,posición"); return; }
    const total = (csvReplace ? 0 : players.length) + nuevos.length;
    if (total > lim.players) { setCsvMsg(`El plan gratuito permite hasta ${lim.players} jugadores. Mejora a cuenta de club para ampliar.`); return; }
    updateSquadWithProposal((ps) => (csvReplace ? nuevos : [...ps, ...nuevos]));
    if (csvReplace) { setLineup({}); setCalled(new Set()); }
    setCsvMsg(`${nuevos.length} jugadores ${csvReplace ? "cargados (plantilla reemplazada)" : "añadidos"}.`);
    setCsvText("");
  };

  const waText = () => {
    const list = players.filter((p) => called.has(p.id)).sort((a, b) => (a.pos === "POR" ? -1 : b.pos === "POR" ? 1 : a.d - b.d));
    const lines = list.map((p) => `${p.pos === "POR" ? "🧤 " : ""}${keycap(p.d)} ${p.n}`);
    return `📋 *CONVOCATORIA — ${session.club} ${session.team.name}*\n⚽ vs ${matchInfo.rival}\n📅 ${matchInfo.fecha} · ⏰ ${matchInfo.hora}\n📍 ${matchInfo.lugar}\n\n${lines.join("\n")}\n\n✅ Confirmad asistencia, por favor.`;
  };
  const copyWa = async () => {
    const txt = waText();
    try { await navigator.clipboard.writeText(txt); }
    catch { const ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); }
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  /* Gestión de usuarios */
  const setUserRole = (id, r) => { setUsers((us) => us.map((u) => (u.id === id ? { ...u, role: r } : u))); if (String(id).startsWith("rec")) airPatch(id, { rol: ROL2LABEL[r] }); };
  const setUserStatus = (id, status) => { setUsers((us) => us.map((u) => (u.id === id ? { ...u, status } : u))); if (String(id).startsWith("rec")) airPatch(id, { estado: estadoLabel(status) }); };
  const removeUser = (id) => { setUsers((us) => us.filter((u) => u.id !== id)); if (String(id).startsWith("rec")) airDelete(id); };
  useEffect(() => {
    if (!session || !can("viewUsers")) return;
    let alive = true;
    airUsers(session.team?.rec).then((rows) => {
      if (!alive || !rows) return;
      setUsers(rows.map((r) => ({ id: r.id, name: r.name, email: r.email, role: LABEL2ROL[r.rol] || "entrenador", status: String(r.estado).toLowerCase() === "activo" ? "activo" : "pendiente" })));
    });
    return () => { alive = false; };
  }, [session]);

  /* Card, Dot y Avatar viven fuera de este componente (justo encima de
     App). Ver el comentario de allí: definirlos aquí dentro rompía la
     escritura en todos los formularios. */

  /* ================= MI CUENTA ================= */
  const [accountOpen, setAccountOpen] = useState(false);
  const [accCur, setAccCur] = useState("");
  const [accNew, setAccNew] = useState("");
  const [accNew2, setAccNew2] = useState("");
  const [accMsg, setAccMsg] = useState("");
  const [accErr, setAccErr] = useState("");
  const [accBusy, setAccBusy] = useState(false);
  /* La cuenta demo no existe en Airtable: no hay contraseña que cambiar. */
  const esDemo = session?.email === "demo";
  const accOk = accCur.length > 0 && accNew.length >= PASS_MIN && accNew === accNew2;
  const cerrarCuenta = () => {
    setAccountOpen(false);
    setAccCur(""); setAccNew(""); setAccNew2(""); setAccMsg(""); setAccErr("");
  };
  const submitAccountPass = async () => {
    setAccErr(""); setAccMsg(""); if (!accOk || accBusy) return;
    setAccBusy(true);
    const r = await airChangePass(accCur, accNew);
    setAccBusy(false);
    if (!r) { setAccErr(mensajeFalloAir(t)); return; }
    if (r.ok) { setAccMsg(t("p.saved")); setAccCur(""); setAccNew(""); setAccNew2(""); return; }
    setAccErr(r.reason === "corta" ? t("a.passRule") : t("p.badCurrent"));
  };
  /* ---- Equipo: cambiar al vuelo o crear el propio ----
     La lista de equipos ya es pública (hace falta para el formulario de alta),
     así que se reutiliza en vez de montar otro endpoint. */
  const [eqLista, setEqLista] = useState([]);
  const [eqSel, setEqSel] = useState("");
  const [eqNuevo, setEqNuevo] = useState("");
  const [eqBusy, setEqBusy] = useState(false);
  const [eqMsg, setEqMsg] = useState("");
  useEffect(() => {
    if (!accountOpen || esDemo) return;
    (async () => {
      const r = await airTeams();
      /* Solo las categorías de TU club: cambiarte a la Juvenil A de otro club
         no es "cambiar de equipo", es irte a otro sitio, y eso lo decide quien
         te da de alta allí. El Master sí las ve todas. */
      if (Array.isArray(r)) setEqLista(session.role === "master" ? r : r.filter((e) => !session.club || igualTexto(e.club, session.club)));
    })();
  }, [accountOpen]); // eslint-disable-line
  const cambiarDeEquipo = async () => {
    if (!eqSel || eqBusy) return;
    setEqBusy(true); setEqMsg("");
    const out = await airCambiarEquipo(eqSel);
    setEqBusy(false);
    if (!out?.ok) { setEqMsg(out?.reason === "no_existe" ? "Ese equipo ya no existe." : "No se pudo cambiar. Revisa la conexión."); return; }
    if (out.token) setAuthToken(out.token);
    const eq = eqLista.find((e) => e.rec === eqSel);
    if (eq) setSession((sx) => ({ ...sx, team: eq, club: eq.club || sx.club }));
    setEqMsg(`✓ Ahora estás en ${eq?.name || "la categoría elegida"}.`);
  };
  const crearMiEquipo = async () => {
    const nombre = eqNuevo.trim();
    if (!nombre || eqBusy) return;
    setEqBusy(true); setEqMsg("");
    const out = await airCrearEquipo(nombre);
    setEqBusy(false);
    if (!out?.ok) {
      setEqMsg(out?.reason === "sin_club"
        ? "Tu ficha todavía no tiene club. Los clubs los da de alta EBLDigital: pídelo y luego podrás añadir tus categorías."
        : "No se pudo crear. Revisa la conexión.");
      return;
    }
    if (out.token) setAuthToken(out.token);
    setSession((sx) => ({ ...sx, team: { ...sx.team, rec: out.rec, name: nombre } }));
    setEqMsg(out.reutilizado ? `✓ Ya existía "${nombre}" en tu club y te hemos pasado a ella.` : `✓ Categoría "${nombre}" creada dentro de ${session.club || "tu club"}. Ya estás en ella.`);
    setEqNuevo("");
  };

  /* ---- Darse de baja ---- */
  const [bajaAbierta, setBajaAbierta] = useState(false);
  const [bajaPass, setBajaPass] = useState("");
  const [bajaBusy, setBajaBusy] = useState(false);
  const [bajaErr, setBajaErr] = useState("");
  const borrarmeCuenta = async () => {
    if (!bajaPass || bajaBusy) return;
    setBajaBusy(true); setBajaErr("");
    const out = await airBorrarmeCuenta(bajaPass);
    setBajaBusy(false);
    if (out?.ok) { setAuthToken(null); setSession(null); setMsgs([]); return; }
    setBajaErr(out?.reason === "bad" ? t("p.badCurrent")
      : out?.reason === "master" ? "La cuenta Master no se puede eliminar."
      : "No se pudo eliminar. Inténtalo más tarde.");
  };

  const renderAccount = () => accountOpen && (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(10,14,12,0.8)" }} onClick={cerrarCuenta}>
      <div className="w-full max-w-sm rounded-lg border p-5 max-h-[92vh] overflow-y-auto" style={{ background: C.panel, borderColor: AC }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <div className="font-display text-xl font-semibold uppercase tracking-wide" style={{ color: AC }}>{t("p.account")}</div>
          <button onClick={cerrarCuenta} aria-label={t("p.close")} style={{ color: C.dim }}>✕</button>
        </div>
        <div className="text-sm" style={{ color: C.chalk }}>{session.name}</div>
        <div className="text-[11px] mb-4" style={{ color: C.dim }}>{session.email} · {rLabel(lang, session.role)}</div>

        {/* ---- MI EQUIPO ----
            Cambiarse de equipo es cosa de cada uno: la gente cambia a mitad de
            temporada y no puede depender de que el Master esté disponible. */}
        {!esDemo && (
          <div className="pt-4 border-t" style={{ borderColor: C.line }}>
            <div className="font-display text-sm uppercase tracking-widest mb-1" style={{ color: C.dim }}>{t("p.myTeam")}</div>
            {/* Primero el club, y debajo la categoría: así queda claro que una
                es parte del otro y no dos equipos distintos. */}
            <div className="text-[12px]" style={{ color: C.chalk }}>{session.club || "—"}</div>
            <div className="text-[12px] mb-3" style={{ color: C.dim }}>{session.team?.name || "—"}</div>
            <select value={eqSel} onChange={(e) => setEqSel(e.target.value)}
              aria-label={t("p.pickTeam")}
              className="w-full mb-2 px-3 py-2.5 rounded-lg border text-sm"
              style={{ background: C.panel2, borderColor: C.line, color: C.chalk }}>
              <option value="">{t("p.pickTeam")}</option>
              {eqLista.map((e) => (
                <option key={e.rec} value={e.rec} style={{ background: C.panel }}>
                  {e.name}{e.club && !igualTexto(e.club, session.club) ? ` · ${e.club}` : ""}
                </option>
              ))}
            </select>
            <button onClick={cambiarDeEquipo} disabled={!eqSel || eqBusy}
              className="w-full font-display uppercase tracking-wide text-sm py-2.5 rounded-lg font-semibold disabled:opacity-40 mb-3"
              style={{ background: AC, color: C.sobre }}>
              {eqBusy ? t("a.sending") : t("p.changeTeam")}
            </button>

            {/* Selector de categorías con indicador de acceso por rol */}
            {session?.categories && session.categories.length > 0 && (
              <div className="mb-3">
                <div className="text-[11px] mb-1.5" style={{ color: C.dim }}>
                  {session.categories.length > 1 ? "Categoría actual" : "Tu categoría"}
                </div>
                {session.categories.length > 1 ? (
                  <select value={selectedCategory || ""} onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm"
                    style={{ background: C.panel2, borderColor: C.line, color: C.chalk }}>
                    {session.categories.map((cat) => {
                      const canEdit = canEditCategory(cat);
                      const label = canEdit
                        ? `${cat} (Edición)`
                        : tieneRolFront(session, "segundo")
                          ? `${cat} (Propuestas)`
                          : `${cat} (Lectura)`;
                      return (
                        <option key={cat} value={cat} style={{ background: C.panel }}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div className="px-3 py-2.5 rounded-lg border text-sm" style={{ background: C.panel2, borderColor: C.line, color: C.chalk }}>
                    {session.categories[0]}
                    <span style={{ marginLeft: "10px", fontSize: "11px", color: C.dim }}>
                      {canEditCategory(session.categories[0])
                        ? "(Edición)"
                        : tieneRolFront(session, "segundo")
                          ? "(Propuestas)"
                          : "(Lectura)"}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="text-[11px] mb-1.5" style={{ color: C.dim }}>
              {t("p.newTeamNote")}{session.club ? ` (${session.club})` : ""}
            </div>
            <div className="flex gap-2">
              <input value={eqNuevo} onChange={(e) => setEqNuevo(e.target.value)} placeholder={t("p.newTeamPh")}
                aria-label={t("p.newTeam")}
                className="flex-1 min-w-0 px-3 py-2.5 rounded-lg border text-sm bg-transparent"
                style={{ borderColor: C.line, color: C.chalk }} />
              <button onClick={crearMiEquipo} disabled={!eqNuevo.trim() || eqBusy}
                className="shrink-0 font-display uppercase tracking-wide text-sm px-4 rounded-lg border disabled:opacity-40"
                style={{ borderColor: AC, color: AC }}>
                {t("p.createTeam")}
              </button>
            </div>
            {eqMsg && <div className="text-xs mt-2" style={{ color: eqMsg.startsWith("✓") ? C.green : C.red }}>{eqMsg}</div>}
          </div>
        )}

        {/* ---- MENÚ DE LA BARRA INFERIOR (MÓVIL) ----
            Los 4 primeros de esta lista son los que salen fijos abajo en el
            móvil; el resto se ve al tocar "Más". Cada persona elige el suyo:
            un delegado no vive del día de partido y puede preferir tener
            Disciplina o Asistencia ahí en vez de Pizarra o Modo partido.
            Se guarda solo en este dispositivo, por cuenta. */}
        <div className="pt-4 mt-4 border-t" style={{ borderColor: C.line }}>
          <div className="flex items-center justify-between mb-1">
            <div className="font-display text-sm uppercase tracking-widest" style={{ color: C.dim }}>Menú de abajo (móvil)</div>
            {navOrder && navOrder.length > 0 && (
              <button onClick={() => setNavOrder(null)} className="text-[11px] underline shrink-0" style={{ color: C.dim }}>Restablecer</button>
            )}
          </div>
          <div className="text-[11px] mb-2" style={{ color: C.dim }}>
            Las 4 primeras quedan fijas abajo del móvil. Cambia el orden con las flechas.
          </div>
          {(() => {
            const base = (navOrder && navOrder.length) ? navOrder.filter((k) => visibleTabs.includes(k)) : mobileTabsDefault;
            const orden = [...base, ...visibleTabs.filter((k) => !base.includes(k))];
            const mover = (k, dir) => {
              const i = orden.indexOf(k);
              const j = i + dir;
              if (j < 0 || j >= orden.length) return;
              const copia = [...orden];
              [copia[i], copia[j]] = [copia[j], copia[i]];
              setNavOrder(copia);
            };
            return (
              <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
                {orden.map((k, i) => (
                  <div key={k} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-sm"
                    style={{ borderColor: i < 4 ? MC : C.line, background: i < 4 ? conAlpha(MC, 12) : "transparent", color: C.chalk }}>
                    <span className="w-4 shrink-0 flex justify-center" style={{ color: i < 4 ? MC : C.dim }}><Icono n={k} s={15} /></span>
                    <span className="flex-1 truncate">{t("nav." + k)}</span>
                    <button onClick={() => mover(k, -1)} disabled={i === 0} aria-label={`Subir ${t("nav." + k)}`}
                      className="w-6 h-6 shrink-0 disabled:opacity-25" style={{ color: C.dim }}>▲</button>
                    <button onClick={() => mover(k, 1)} disabled={i === orden.length - 1} aria-label={`Bajar ${t("nav." + k)}`}
                      className="w-6 h-6 shrink-0 disabled:opacity-25" style={{ color: C.dim }}>▼</button>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* ---- COLOR DEL MENÚ, A PARTIR DEL ESCUDO ----
            Solo pinta el menú (esta lista de arriba, la barra lateral, la
            de abajo del móvil y "Más"): el resto de la app -botones,
            formularios, y los colores que SIGNIFICAN algo (disponible,
            duda, lesión...)- se queda en blanco y negro a propósito. Se
            detecta solo al subir el escudo del club; aquí se puede apagar
            o cambiar por cualquier otro color, a mano. */}
        <div className="pt-4 mt-4 border-t" style={{ borderColor: C.line }}>
          <div className="font-display text-sm uppercase tracking-widest mb-1" style={{ color: C.dim }}>Color del menú</div>
          <div className="text-[11px] mb-2" style={{ color: C.dim }}>
            Se detecta del escudo del club al subirlo. Solo cambia el menú; el resto de la app sigue en blanco y negro.
          </div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-6 h-6 rounded-full border shrink-0" style={{ background: MC, borderColor: C.line }} aria-hidden="true" />
            <span className="text-xs" style={{ color: C.chalk }}>
              {acentoManual === null ? "Blanco y negro (elegido)"
                : acentoManual ? "Color elegido a mano"
                : acentoAuto ? "Automático, del escudo"
                : "Blanco y negro (todavía sin escudo con color)"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setAcentoManual(undefined)} disabled={acentoManual === undefined}
              className="text-xs px-3 py-1.5 rounded-lg border disabled:opacity-40" style={{ borderColor: AC, color: AC }}>
              Automático
            </button>
            <button onClick={() => setAcentoManual(null)} disabled={acentoManual === null}
              className="text-xs px-3 py-1.5 rounded-lg border disabled:opacity-40" style={{ borderColor: C.line, color: C.chalk }}>
              Blanco y negro
            </button>
            <label className="text-xs pl-3 pr-2 py-1.5 rounded-lg border cursor-pointer flex items-center gap-1.5" style={{ borderColor: C.line, color: C.chalk }}>
              Elegir color
              <input type="color" aria-label="Elegir color del menú" className="w-5 h-5 p-0 border-0 bg-transparent cursor-pointer rounded"
                onChange={(e) => {
                  const hex = e.target.value;
                  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
                  setAcentoManual(acentosDesdeColor(r, g, b));
                }} />
            </label>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t" style={{ borderColor: C.line }}>
          <div className="font-display text-sm uppercase tracking-widest mb-3" style={{ color: C.dim }}>{t("p.changePass")}</div>
          {esDemo ? (
            <div className="text-xs rounded-lg border p-3" style={{ borderColor: C.line, color: C.dim }}>
              La cuenta demo no tiene contraseña que cambiar. Entra con tu cuenta real para poder cambiarla.
            </div>
          ) : accMsg ? (
            <div className="rounded-lg border p-3 text-sm" style={{ borderColor: C.green, background: "rgba(47,107,79,.10)", color: C.chalk }}>{accMsg}</div>
          ) : (
            <>
              {accErr && <div className="mb-3 rounded-lg border p-3 text-sm" style={{ borderColor: C.red, background: "rgba(163,58,62,.10)", color: C.red }}>{accErr}</div>}
              <div className="mb-3">
                <div className="font-display text-xs uppercase tracking-widest mb-1.5" style={{ color: C.dim }}>{t("p.current")}</div>
                <PassInput value={accCur} onChange={setAccCur} cls="w-full rounded-lg px-4 py-2.5 text-sm outline-none border" st={{ background: C.panel2, borderColor: C.line, color: C.chalk }} />
              </div>
              <div className="mb-3">
                <div className="font-display text-xs uppercase tracking-widest mb-1.5" style={{ color: C.dim }}>{t("a.newPass")}</div>
                <PassInput value={accNew} onChange={setAccNew} autoComplete="new-password" cls="w-full rounded-lg px-4 py-2.5 text-sm outline-none border" st={{ background: C.panel2, borderColor: C.line, color: C.chalk }} />
              </div>
              <div className="mb-3">
                <div className="font-display text-xs uppercase tracking-widest mb-1.5" style={{ color: C.dim }}>{t("a.newPass2")}</div>
                <PassInput value={accNew2} onChange={setAccNew2} autoComplete="new-password" onEnter={submitAccountPass} cls="w-full rounded-lg px-4 py-2.5 text-sm outline-none border" st={{ background: C.panel2, borderColor: C.line, color: C.chalk }} />
              </div>
              <button disabled={!accOk || accBusy} onClick={submitAccountPass} className="w-full font-display uppercase tracking-wider py-2.5 rounded-lg font-semibold disabled:opacity-40" style={{ background: AC, color: C.sobre }}>
                {accBusy ? t("a.sending") : t("p.save")}
              </button>
              <div className="text-[11px] mt-2 text-center" style={{ color: C.dim }}>{t("a.passRule")}</div>
            </>
          )}
        </div>

        {/* Histórico de propuestas (segundo/entrenador) */}
        {(tieneRolFront(session, "segundo") || canResolveProposals()) && getProposalHistory().length > 0 && (
          <div className="pt-4 mt-4 border-t" style={{ borderColor: C.line }}>
            <div className="font-display text-sm uppercase tracking-widest mb-3" style={{ color: C.dim }}>📋 Histórico de propuestas</div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {getProposalHistory().map((p) => (
                <div key={p.id} className="text-xs p-2 rounded-lg border" style={{ borderColor: p.status === "approved" ? C.green : C.red, background: p.status === "approved" ? `${C.green}15` : `${C.red}15` }}>
                  <div style={{ color: p.status === "approved" ? C.green : C.red, fontWeight: "bold" }}>
                    {p.status === "approved" ? "✓ Aprobada" : "✕ Rechazada"}: {getProposalTypeLabel(p.type)}
                  </div>
                  <div style={{ color: C.dim, marginTop: "4px" }}>
                    {new Date(p.date).toLocaleString("es-ES")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- DARSE DE BAJA ----
            Va al final, en rojo y en dos pasos: pedir la contraseña además de
            confirmar evita que un móvil abierto encima de la mesa baste para
            borrar una cuenta sin vuelta atrás. El Master no puede: es la única
            con acceso total y sin ella nadie podría administrar nada. */}
        {!esDemo && session.role !== "master" && (
          <div className="pt-4 mt-4 border-t" style={{ borderColor: C.line }}>
            {!bajaAbierta ? (
              <button onClick={() => setBajaAbierta(true)} className="text-xs underline" style={{ color: C.dim }}>
                {t("p.deleteAcc")}
              </button>
            ) : (
              <div className="rounded-lg border p-3" style={{ borderColor: C.red, background: "rgba(229,72,77,.07)" }}>
                <div className="font-display text-sm uppercase tracking-wide mb-1" style={{ color: C.red }}>{t("p.deleteAcc")}</div>
                <div className="text-[12px] mb-3" style={{ color: C.chalk }}>{t("p.deleteWarn")}</div>
                {bajaErr && <div className="text-xs mb-2" style={{ color: C.red }}>{bajaErr}</div>}
                <div className="mb-3">
                  <div className="font-display text-xs uppercase tracking-widest mb-1.5" style={{ color: C.dim }}>{t("p.current")}</div>
                  <PassInput value={bajaPass} onChange={setBajaPass} onEnter={borrarmeCuenta}
                    cls="w-full rounded-lg px-4 py-2.5 text-sm outline-none border"
                    st={{ background: C.panel2, borderColor: C.line, color: C.chalk }} />
                </div>
                <div className="flex gap-2">
                  <button onClick={borrarmeCuenta} disabled={!bajaPass || bajaBusy}
                    className="flex-1 font-display uppercase tracking-wide text-sm py-2.5 rounded-lg font-semibold disabled:opacity-40"
                    style={{ background: C.red, color: "#fff" }}>
                    {bajaBusy ? t("a.sending") : t("p.deleteGo")}
                  </button>
                  <button onClick={() => { setBajaAbierta(false); setBajaPass(""); setBajaErr(""); }}
                    className="px-4 py-2.5 rounded-lg border text-sm" style={{ borderColor: C.line, color: C.dim }}>
                    {t("p.close")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderProfile = () => profile && (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4" style={{ background: "rgba(10,14,12,0.8)" }} onClick={() => setProfileId(null)}>
      <div className="w-full max-w-md rounded-lg border p-5 max-h-[92vh] overflow-y-auto" style={{ background: C.panel, borderColor: AC }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="font-display text-2xl font-semibold"><span style={{ color: AC }}>#{profile.d}</span> {profile.n}</div>
          <button onClick={() => setProfileId(null)} style={{ color: C.dim }}>✕</button>
        </div>
        <div className="rounded-lg overflow-hidden border mb-3" style={{ borderColor: C.line, background: C.panel2 }}>
          {profile.video ? <video src={profile.video} controls autoPlay loop className="w-full" />
            : profile.photo ? <img src={profile.photo} alt={profile.n} className="w-full object-cover max-h-72" />
            : <div className="h-48 flex items-center justify-center text-sm" style={{ color: C.dim }}>Sin foto todavía</div>}
        </div>
        {can("editSquad") && (
          <div className="flex gap-2 mb-4">
            <label className="flex-1 text-center text-sm px-3 py-2.5 rounded-lg border cursor-pointer font-display uppercase tracking-wide" style={{ borderColor: C.line, color: C.chalk }}>
              📷 {profile.photo ? "Cambiar foto" : "Subir foto"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setPhoto(profile.id, String(r.result)); r.readAsDataURL(f); }} />
            </label>
            <button onClick={() => genVideo(profile)} disabled={(lim.video && !profile.photo) || genBusy}
              className="flex-1 text-sm px-3 py-2.5 rounded-lg font-display uppercase tracking-wide font-semibold disabled:opacity-40"
              style={{ background: lim.video ? AC : C.panel2, color: lim.video ? "#141414" : C.dim, border: lim.video ? "none" : `1px solid ${C.line}` }}>
              {!lim.video ? "🎬 Vídeo 5 s · PRO" : genBusy ? "Grabando 5 s…" : profile.video ? "🎬 Rehacer vídeo" : "🎬 Crear vídeo 5 s"}
            </button>
          </div>
        )}
        {profile.video && lim.video && (
          <a href={profile.video} download={`presentacion-${profile.n.replace(/\s+/g, "-")}.webm`} className="block text-center text-xs mb-4 underline" style={{ color: AC }}>Descargar vídeo (.webm)</a>
        )}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[["Posición", profile.pos], ["Estado", profile.st], ["Asistencia", `${attPct(profile)}%`], ["Minutos", `${profile.min}'`]].map(([k, v]) => (
            <div key={k} className="rounded-lg border p-2.5" style={{ borderColor: C.line, background: C.panel2 }}>
              <div className="text-[10px] font-display uppercase tracking-widest" style={{ color: C.dim }}>{k}</div>
              <div style={{ color: k === "Estado" ? stColor(profile.st) : C.chalk }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ================= PREMIUM (suscripción) ================= */
  const [payMsg, setPayMsg] = useState("");
  const [payBusy, setPayBusy] = useState(false);
  const [sub, setSub] = useState(null);
  /* al entrar (y al volver de Stripe) se consulta la suscripción en Airtable */
  useEffect(() => {
    if (!session?.email || session.email === "demo") return;
    let vivo = true;
    (async () => {
      const d = await airSub(session.email);
      if (!vivo || !d) return;
      setSub(d);
      if (d.pro) setSession((sx) => (sx.pro ? sx : { ...sx, pro: true }));
    })();
    return () => { vivo = false; };
  }, [session?.email]); // eslint-disable-line
  /* Stripe devuelve a /?pro=ok tras el pago: se reconsulta un par de veces
     porque el webhook puede tardar un segundo en escribir en Airtable */
  useEffect(() => {
    if (!session?.email) return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("pro") !== "ok") return;
    let intentos = 0;
    const id = setInterval(async () => {
      intentos += 1;
      const d = await airSub(session.email);
      if (d?.pro) {
        setSub(d);
        setSession((sx) => ({ ...sx, pro: true }));
        setPayMsg("✓ Suscripción activada. Ya tienes todas las funciones PRO.");
        clearInterval(id);
        window.history.replaceState({}, "", window.location.pathname);
      }
      if (intentos >= 6) clearInterval(id);
    }, 2500);
    return () => clearInterval(id);
  }, [session?.email]); // eslint-disable-line
  const goPortal = async () => {
    setPayBusy(true); setPayMsg("");
    try {
      const r = await cbFetch("/.netlify/functions/stripe?action=portal", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: session.email, customerId: sub?.customerId }),
      });
      const d = await r.json();
      if (d.url) { window.location.href = d.url; return; }
      setPayMsg(d.error || "No he podido abrir el portal de suscripción.");
    } catch {
      setPayMsg("La gestión de la suscripción no está disponible ahora mismo. Inténtalo más tarde.");
    }
    setPayBusy(false);
  };
  const goCheckout = async (plan = "mensual") => {
    setPayBusy(true); setPayMsg("");
    try {
      const r = await cbFetch("/.netlify/functions/stripe?action=checkout", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, email: session.email, nombre: session.name, club: session.club, equipo: session.team?.name }),
      });
      if (!r.ok) throw new Error("sin backend");
      const d = await r.json();
      if (d.url) { window.location.href = d.url; return; }
      throw new Error(d.error || "sin url");
    } catch {
      setPayMsg("Los pagos no están disponibles ahora mismo. Inténtalo más tarde.");
    }
    setPayBusy(false);
  };

  /* Si acabas de fundar un club eligiendo un plan de pago, en cuanto entras te
     llevamos a Stripe una sola vez. Si cierras el checkout sin pagar, el club
     se queda tal cual en el plan gratis (1 plaza) hasta que lo intentes desde
     Premium. */
  useEffect(() => {
    if (!session) return;
    let plan = null;
    try { plan = localStorage.getItem("cb_checkout_pendiente"); } catch { /* noop */ }
    if (plan) {
      try { localStorage.removeItem("cb_checkout_pendiente"); } catch { /* noop */ }
      goCheckout(plan);
    }
  }, [session]); // eslint-disable-line

  const renderPremium = () => (
    <div className="space-y-4">
      <Card title={isPro ? "Tu plan" : "CoachBase AI PRO"}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="font-display text-3xl font-semibold" style={{ color: isPro ? C.green : AC }}>
              {isPro ? (session.role === "master" ? "★ Master · acceso total" : "★ PRO activo") : `${PRO_PRICE} / mes`}
            </div>
            <div className="text-sm mt-1" style={{ color: C.dim }}>
              {isPro
                ? "Tienes desbloqueadas todas las funciones del cuerpo técnico."
                : "Suscripción mensual, sin permanencia. Se cancela cuando quieras desde tu cuenta."}
            </div>
            {sub?.periodoFin && (
              <div className="text-[11px] mt-1" style={{ color: sub.cancelarAlFinal ? C.warn : C.dim }}>
                {sub.cancelarAlFinal
                  ? `Cancelada: seguirás con PRO hasta el ${new Date(sub.periodoFin).toLocaleDateString("es-ES")}.`
                  : `Se renueva el ${new Date(sub.periodoFin).toLocaleDateString("es-ES")}.`}
              </div>
            )}
          </div>
          {!isPro && (
            <div className="w-full grid sm:grid-cols-2 gap-3 mt-2">
              {PLANES.map((pl) => (
                <div key={pl.k} className="rounded-lg border p-4 flex flex-col"
                  style={{ borderColor: pl.destacado ? AC : C.line, background: pl.destacado ? "rgba(217,164,65,.07)" : "transparent" }}>
                  <div className="flex items-center gap-2">
                    <span className="font-display uppercase tracking-wide text-sm" style={{ color: C.chalk }}>{pl.nombre}</span>
                    {pl.ahorro && <span className="text-[10px] font-display uppercase px-1.5 py-0.5 rounded" style={{ background: AC, color: C.sobre }}>{pl.ahorro}</span>}
                  </div>
                  <div className="font-display text-3xl font-semibold mt-1" style={{ color: pl.destacado ? AC : C.chalk }}>{pl.precio}</div>
                  <div className="text-[11px]" style={{ color: C.dim }}>{pl.ciclo}</div>
                  <div className="text-[12px] mt-2 flex-1" style={{ color: C.dim }}>{pl.nota}</div>
                  <button onClick={() => goCheckout(pl.k)} disabled={payBusy}
                    className="mt-3 w-full font-display uppercase tracking-wide text-sm px-4 py-2.5 rounded-lg font-semibold disabled:opacity-50 border"
                    style={pl.destacado ? { background: AC, color: C.sobre, borderColor: AC } : { borderColor: C.line, color: C.chalk }}>
                    {payBusy ? "Abriendo pago…" : "Elegir"}
                  </button>
                </div>
              ))}
            </div>
          )}
          {isPro && sub?.customerId && (
            <button onClick={goPortal} disabled={payBusy}
              className="font-display uppercase tracking-wide text-sm px-5 py-3 rounded-lg border disabled:opacity-50"
              style={{ borderColor: C.line, color: C.chalk }}>
              {payBusy ? "Abriendo…" : "Gestionar suscripción"}
            </button>
          )}
        </div>
        {payMsg && <div className="text-xs mt-3" style={{ color: C.warn }}>{payMsg}</div>}
      </Card>

      {!isPro && (
        <Card title="¿Eres el club? Plan para todos tus equipos">
          <div className="text-[12px] mb-3" style={{ color: C.dim }}>
            Todo el cuerpo técnico del club en PRO, con vista agregada para el director deportivo. Precio por temporada.
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {PLANES_CLUB.map((pl) => (
              <div key={pl.k} className="rounded-lg border p-4 flex flex-col"
                style={{ borderColor: pl.destacado ? AC : C.line, background: pl.destacado ? "rgba(217,164,65,.07)" : "transparent" }}>
                <div className="font-display uppercase tracking-wide text-sm" style={{ color: C.chalk }}>{pl.nombre}</div>
                <div className="text-[11px]" style={{ color: C.dim }}>{pl.equipos}</div>
                <div className="font-display text-2xl font-semibold mt-2" style={{ color: pl.destacado ? AC : C.chalk }}>{pl.precio}</div>
                <div className="text-[11px] flex-1" style={{ color: C.dim }}>por temporada · {pl.porEquipo}</div>
                <button onClick={() => goCheckout(pl.k)} disabled={payBusy}
                  className="mt-3 w-full font-display uppercase tracking-wide text-xs px-3 py-2 rounded-lg font-semibold disabled:opacity-50 border"
                  style={pl.destacado ? { background: AC, color: C.sobre, borderColor: AC } : { borderColor: C.line, color: C.chalk }}>
                  Contratar
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Qué incluye cada plan">
        <div className="grid grid-cols-12 gap-2 text-[10px] font-display uppercase tracking-wide pb-2 border-b" style={{ borderColor: C.line, color: C.dim }}>
          <div className="col-span-4">Función</div>
          <div className="col-span-4">Gratis</div>
          <div className="col-span-4" style={{ color: AC }}>PRO</div>
        </div>
        {PRO_FEATURES.map((f) => (
          <div key={f.k} className="grid grid-cols-12 gap-2 text-sm py-2 border-b last:border-0 items-start" style={{ borderColor: C.line }}>
            <div className="col-span-4 flex items-center gap-1.5" style={{ color: C.chalk }}><span>{f.icon}</span></div>
            <div className="col-span-4 text-[12px]" style={{ color: f.free === "—" ? C.dim : C.chalk }}>{f.free}</div>
            <div className="col-span-4 text-[12px]" style={{ color: AC }}>{f.pro}</div>
          </div>
        ))}
      </Card>

    </div>
  );

  /* ================= EQUIPOS (rol Master) ================= */
  /* ---------------- Panel Master ----------------
     Puesto de mando de la cuenta única de EBLDigital. No duplica la gestión
     equipo a equipo (eso sigue en "Equipos"): resume de un vistazo el estado
     de la instalación y deja a un toque lo que solo esta cuenta puede hacer.
     Todas las cifras salen de los equipos reales cargados de la nube: si la
     nube no responde, se dice, no se inventa un número. */
  const renderMasterPanel = () => {
    const clubes = [];
    for (const tm of teams) {
      const k = tm.clubRec || tm.club || "sin-club";
      let g = clubes.find((x) => x.key === k);
      if (!g) { g = { key: k, club: tm.club || "Sin club", items: [] }; clubes.push(g); }
      g.items.push(tm);
    }
    const sinEscudo = teams.filter((tm) => !tm.crest).length;
    const Cifra = ({ n, txt }) => (
      <div className="rounded-lg border px-4 py-3 min-w-[110px]" style={{ borderColor: C.line, background: C.panel2 }}>
        <div className="font-display text-2xl leading-none" style={{ color: AC }}>{n}</div>
        <div className="text-[11px] mt-1 uppercase tracking-wide" style={{ color: C.dim }}>{txt}</div>
      </div>
    );
    return (
      <div className="space-y-4">
        <Card title="Panel Master">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="font-display text-3xl leading-none" style={{ color: ROLES.master.color }}>{ROLES.master.icon}</div>
            <div className="flex-1 min-w-[220px]">
              <div className="font-display uppercase tracking-wide" style={{ color: C.chalk }}>{session.name}</div>
              <div className="text-xs" style={{ color: C.dim }}>{session.email} · acceso total</div>
              <div className="text-[11px] mt-1" style={{ color: C.dim }}>
                Esta cuenta es única y no se puede repartir desde la app: el servidor comprueba el correo antes de dar el rol.
              </div>
            </div>
          </div>
        </Card>

        <Card title="Estado de la instalación">
          {teamMsg ? (
            <div className="text-sm" style={{ color: C.warn }}>{teamMsg}</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Cifra n={clubes.length} txt={clubes.length === 1 ? "club" : "clubes"} />
              <Cifra n={teams.length} txt={teams.length === 1 ? "categoría" : "categorías"} />
              <Cifra n={sinEscudo} txt="sin escudo" />
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            <button onClick={loadTeams} className="text-sm px-4 py-2 rounded-lg border font-display uppercase tracking-wide" style={{ borderColor: C.line, color: C.chalk }}>↻ Recargar</button>
            <button onClick={() => setTab("equipos")} className="text-sm px-4 py-2 rounded-lg font-display uppercase tracking-wide font-semibold" style={{ background: AC, color: C.sobre }}>Gestionar clubes</button>
          </div>
        </Card>

        {clubes.length > 0 && (
          <Card title="Clubes">
            <div className="flex flex-col gap-1.5">
              {clubes.map((g) => (
                <button key={g.key} onClick={() => setTab("equipos")}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2 text-left"
                  style={{ borderColor: C.line }}>
                  <Crest src={g.items.find((x) => x.crest)?.crest || escudoDe(g.club)} name={g.club} size={30} />
                  <span className="flex-1 min-w-0 truncate font-display uppercase tracking-wide text-sm" style={{ color: C.chalk }}>{g.club}</span>
                  <span className="text-[11px] shrink-0" style={{ color: C.dim }}>{g.items.length} {g.items.length === 1 ? "categoría" : "categorías"}</span>
                </button>
              ))}
            </div>
          </Card>
        )}

        <Card title="Solo esta cuenta puede">
          <ul className="text-sm space-y-1.5" style={{ color: C.dim }}>
            <li>· Crear y eliminar clubes. Las categorías (Juvenil A, Infantil B…) las añade cada usuario dentro del suyo.</li>
            <li>· Subir el escudo del club y aplicarlo a todas sus categorías de una vez.</li>
            <li>· Fijar el límite de plazas de cuerpo técnico de cada club.</li>
            <li>· Dar de alta a un director deportivo.</li>
          </ul>
        </Card>
      </div>
    );
  };

  const renderTeams = () => {
    const E = teamEdit;
    /* El catálogo de clubes es de lectura abierta en toda la app (por eso se
       puede enseñar en la demo), pero la plantilla real de cada categoría es
       de las familias y los jugadores que hay dentro: eso no se enseña a
       quien está probando la app sin cuenta. */
    const esMasterDemo = session.role === "master" && session.email === "demo";
    return (
      <div className="space-y-4">
        <Card title="Clubes y categorías">
          <div className="text-[11px] mb-3" style={{ color: C.dim }}>
            El club es el nivel de arriba —el Chamartín Vergara—. Juvenil A o Infantil B son <strong>categorías</strong> suyas, no clubs aparte.
            Los clubs solo los creas tú; las categorías las añade cada usuario dentro del suyo.
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <button onClick={loadTeams} className="text-sm px-4 py-2 rounded-lg border font-display uppercase tracking-wide" style={{ borderColor: C.line, color: C.chalk }}>↻ Recargar</button>
            <button onClick={() => setClubNuevo({ nombre: "", comunidad: session.comunidad || "" })}
              className="text-sm px-4 py-2 rounded-lg font-display uppercase tracking-wide font-semibold" style={{ background: AC, color: C.sobre }}>+ Nuevo club</button>
          </div>
          {clubNuevo && (
            <div className="rounded-lg border p-3 mb-3" style={{ borderColor: AC, background: C.panel2 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <input value={clubNuevo.nombre} autoFocus onChange={(e) => setClubNuevo({ ...clubNuevo, nombre: e.target.value })}
                  placeholder="Nombre del club. Ej. Chamartín Vergara" className="px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.chalk }} />
                <input value={clubNuevo.comunidad} onChange={(e) => setClubNuevo({ ...clubNuevo, comunidad: e.target.value })}
                  placeholder="Comunidad. Ej. Comunidad de Madrid" className="px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.chalk }} />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button disabled={!clubNuevo.nombre.trim()} onClick={async () => {
                  const out = await airCrearClub(clubNuevo.nombre.trim(), clubNuevo.comunidad.trim());
                  if (out?.ok) { setClubNuevo(null); setTeamMsg(out.reutilizado ? "Ese club ya existía; se usa el que había." : "✓ Club creado. Ahora añádele sus categorías."); loadTeams(); }
                  else setTeamMsg(out?.reason === "no_autorizado" ? "Solo el Master puede crear clubs." : "No se pudo crear el club.");
                }} className="text-sm px-4 py-2 rounded-lg font-display uppercase tracking-wide font-semibold disabled:opacity-40" style={{ background: AC, color: C.sobre }}>Crear club</button>
                <button onClick={() => setClubNuevo(null)} className="text-sm px-4 py-2 rounded-lg border" style={{ borderColor: C.line, color: C.dim }}>{t("c.cancel")}</button>
              </div>
            </div>
          )}
          {teamMsg && <div className="text-xs mb-3" style={{ color: C.warn }}>{teamMsg}</div>}
          {teams.length === 0 && clubsAll.length === 0 && !teamMsg && <div className="text-sm" style={{ color: C.dim }}>No hay ningún club todavía.</div>}
          {(() => {
            /* Agrupados por club para poder subir el escudo institucional una
               sola vez y que se aplique a todos los equipos de ese club, en
               vez de subirlo equipo por equipo. */
            const porClub = [];
            /* Se arranca de la lista de clubs para que los recién creados, que
               aún no tienen ninguna categoría, salgan igualmente y se les
               puedan añadir. */
            for (const c of clubsAll) porClub.push({ key: c.rec, clubRec: c.rec, club: c.name || "Sin nombre", items: [] });
            for (const tm of teams) {
              const k = tm.clubRec || tm.club || "sin-club";
              let g = porClub.find((x) => x.key === k);
              if (!g) { g = { key: k, clubRec: tm.clubRec || null, club: tm.club || "Sin club", items: [] }; porClub.push(g); }
              g.items.push(tm);
            }
            return porClub.map((g) => (
              <div key={g.key} className="mb-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <div className="font-display uppercase tracking-wide text-sm" style={{ color: C.chalk }}>{g.club}</div>
                  <div className="font-display uppercase tracking-wide text-xs" style={{ color: C.dim }}>{g.items.length} categoría{g.items.length === 1 ? "" : "s"}</div>
                  {g.clubRec && (
                    <button onClick={() => setTeamEdit({ rec: null, name: "", cat: "infantil", f7: false, club: g.club, clubRec: g.clubRec, comunidad: session.comunidad, web: "", maps: "" })}
                      className="text-[11px] px-2.5 py-1 rounded-lg border" style={{ borderColor: AC, color: AC }}>+ Añadir categoría</button>
                  )}
                  {g.clubRec && g.items.length === 0 && (
                    <button onClick={async () => {
                      if (!confirm(`¿Eliminar el club ${g.club}? Solo se puede porque no tiene ninguna categoría ni nadie dentro.`)) return;
                      const out = await airBorrarClub(g.clubRec);
                      if (out?.ok) { setTeamMsg("✓ Club eliminado."); loadTeams(); }
                      else if (out?.reason === "no_vacio") setTeamMsg(`No se puede: el club tiene ${out.categorias} categoría(s) y ${out.personas} persona(s). Vacíalo primero.`);
                      else setTeamMsg("No se pudo eliminar el club.");
                    }} className="text-[11px] px-2.5 py-1 rounded-lg border" style={{ borderColor: C.line, color: C.red }}>Eliminar club</button>
                  )}
                  {g.clubRec && (
                    <label className="text-[11px] px-2.5 py-1 rounded-lg border cursor-pointer" style={{ borderColor: AC, color: AC }}>
                      ⬡ Escudo del club → todas sus categorías
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const f = e.target.files?.[0]; e.target.value = "";
                        if (!f) return;
                        const forzar = g.items.some((it) => it.crest) && confirm(`Algunas categorías de ${g.club} ya tienen escudo propio. ¿Sustituirlo también en esas?`);
                        setClubCrestBusy(g.key);
                        const rd = new FileReader();
                        rd.onload = async () => {
                          const out = await airClubCrest(g.clubRec, String(rd.result).split(",")[1], f.type || "image/png", f.name || "escudo.png", forzar);
                          setClubCrestBusy(null);
                          if (out?.ok) {
                            setClubCrestMsg((m) => ({ ...m, [g.key]: `✓ Aplicado a ${out.equiposActualizados} categoría${out.equiposActualizados === 1 ? "" : "s"}.` }));
                            loadTeams();
                          } else setClubCrestMsg((m) => ({ ...m, [g.key]: out?.reason === "no_autorizado" ? "Solo el Master puede hacer esto." : "No se pudo subir." }));
                        };
                        rd.readAsDataURL(f);
                      }} />
                    </label>
                  )}
                  {g.clubRec && (
                    <button onClick={() => {
                      if (clubAdminOpen === g.key) { setClubAdminOpen(null); return; }
                      setClubAdminOpen(g.key); setClubAdminBusy(true);
                      airClubAdmin(g.clubRec).then((out) => {
                        setClubAdminBusy(false);
                        if (out?.ok) { setClubAdminData((m) => ({ ...m, [g.key]: out })); setClubAdminLimite(out.limite ? String(out.limite) : ""); }
                      });
                    }} className="text-[11px] px-2.5 py-1 rounded-lg border" style={{ borderColor: C.line, color: C.chalk }}>
                      ⚙ Gestionar club
                    </button>
                  )}
                  {clubCrestBusy === g.key && <span className="text-[11px]" style={{ color: C.dim }}>Subiendo…</span>}
                  {clubCrestMsg[g.key] && <span className="text-[11px]" style={{ color: C.green }}>{clubCrestMsg[g.key]}</span>}
                </div>

                {clubAdminOpen === g.key && (
                  <div className="rounded-lg border p-3 mb-3 text-sm" style={{ borderColor: AC, background: C.panel2 }}>
                    {clubAdminBusy && !clubAdminData[g.key] ? (
                      <div style={{ color: C.dim }}>Consultando plazas y estado de pago…</div>
                    ) : (() => {
                      const d = clubAdminData[g.key];
                      if (!d) return <div style={{ color: C.dim }}>No se pudo consultar. Vuelve a intentarlo.</div>;
                      const s = d.suscripcion;
                      const activa = s && /activ/i.test(s.estado || "");
                      return (
                        <div className="space-y-3">
                          <div>
                            <div className="font-display uppercase tracking-wide text-xs mb-1" style={{ color: C.dim }}>Plazas de cuerpo técnico</div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span style={{ color: C.chalk }}>
                                {d.ocupadas} ocupada{d.ocupadas === 1 ? "" : "s"} ({d.activos} activa{d.activos === 1 ? "" : "s"}, {d.pendientes} pendiente{d.pendientes === 1 ? "" : "s"})
                                {d.limite > 0 ? ` de ${d.limite}` : " · sin límite"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <input value={clubAdminLimite} onChange={(e) => setClubAdminLimite(e.target.value.replace(/[^0-9]/g, ""))}
                                placeholder="Sin límite" className="w-28 px-2 py-1.5 rounded-lg border bg-transparent text-xs"
                                style={{ borderColor: C.line, color: C.chalk }} />
                              <button onClick={async () => {
                                setClubAdminBusy(true);
                                const out = await airClubAdmin(g.clubRec, clubAdminLimite === "" ? null : Number(clubAdminLimite));
                                setClubAdminBusy(false);
                                if (out?.ok) setClubAdminData((m) => ({ ...m, [g.key]: out }));
                              }} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: AC, color: C.sobre }}>Guardar límite</button>
                              <span className="text-[10px]" style={{ color: C.dim }}>Deja en blanco para no limitar (Club L).</span>
                            </div>
                          </div>
                          <div>
                            <div className="font-display uppercase tracking-wide text-xs mb-1" style={{ color: C.dim }}>Estado de pago</div>
                            {s ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-display uppercase tracking-wide px-2 py-1 rounded"
                                  style={{ color: activa ? C.green : C.red, border: `1px solid ${activa ? C.green : C.red}` }}>
                                  {activa ? "Al día" : s.estado || "Sin activar"}
                                </span>
                                <span className="text-xs" style={{ color: C.dim }}>{s.email}</span>
                                {s.periodoFin && <span className="text-xs" style={{ color: C.dim }}>· {s.cancelarFin ? "termina" : "renueva"} el {new Date(s.periodoFin).toLocaleDateString("es-ES")}</span>}
                              </div>
                            ) : (
                              <span className="text-xs" style={{ color: C.red }}>Sin ninguna suscripción activa entre los emails de este club.</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                <div className="space-y-2">
                  {g.items.map((tm) => (
              <div key={tm.rec} className="rounded-lg border p-3 flex flex-wrap items-center gap-3"
                style={{ borderColor: session.team?.rec === tm.rec ? AC : C.line, background: C.panel2 }}>
                <Crest src={tm.crest} name={tm.name} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-base" style={{ color: C.chalk }}>{tm.name}</div>
                  <div className="text-[11px]" style={{ color: C.dim }}>{tm.club || "Sin club"} · {tm.sub}</div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <label className="px-3 py-1.5 rounded-lg border cursor-pointer" style={{ borderColor: C.line, color: C.chalk }}>
                    ⬡ Escudo
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const f = e.target.files?.[0]; e.target.value = "";
                      if (!f) return;
                      const rd = new FileReader();
                      rd.onload = async () => {
                        const out = await airCrest(tm.rec, String(rd.result).split(",")[1], f.type || "image/png", f.name || "escudo.png");
                        if (out?.url) {
                          setTeams((xs) => xs.map((x) => (x.rec === tm.rec ? { ...x, crest: out.url } : x)));
                          if (session.team?.rec === tm.rec) setCrest(out.url);
                          setTeamMsg("✓ Escudo actualizado.");
                        } else setTeamMsg("No se pudo subir el escudo.");
                      };
                      rd.readAsDataURL(f);
                    }} />
                  </label>
                  <button onClick={() => (esMasterDemo ? setTeamMsg("La plantilla de cada categoría es de sus familias y jugadores: en la demo se enseña el catálogo de clubes, no se enseñan sus datos reales.") : verPlantilla(tm.rec))}
                    className="px-3 py-1.5 rounded-lg border" style={{ borderColor: plantillaAbierta === tm.rec ? AC : C.line, color: plantillaAbierta === tm.rec ? AC : C.chalk }}>
                    ◉ Jugadores
                  </button>
                  <button onClick={() => setTeamEdit({ ...tm })} className="px-3 py-1.5 rounded-lg border" style={{ borderColor: C.line, color: C.chalk }}>Editar</button>
                  <button onClick={() => (esMasterDemo ? setTeamMsg("Entrar a trabajar con una categoría real es cosa de la cuenta Master de verdad; en la demo puedes mirar el catálogo, no entrar en él.") : (() => { setSession((sx) => ({ ...sx, team: tm, club: tm.club || sx.club, comunidad: tm.comunidad || sx.comunidad })); setCrest(tm.crest || null); setTab("inicio"); })())}
                    className="px-3 py-1.5 rounded-lg font-semibold" style={{ background: session.team?.rec === tm.rec ? C.line : AC, color: session.team?.rec === tm.rec ? C.dim : "#141414" }}>
                    {session.team?.rec === tm.rec ? "En uso" : "Trabajar con este"}
                  </button>
                </div>
                {plantillaAbierta === tm.rec && (
                  <div className="w-full mt-1 pt-3 border-t" style={{ borderColor: C.line }}>
                    {plantillasVistas[tm.rec] === undefined ? (
                      <div className="text-xs" style={{ color: C.dim }}>Cargando la plantilla…</div>
                    ) : !plantillasVistas[tm.rec] ? (
                      <div className="text-xs" style={{ color: C.red }}>No se pudo cargar la plantilla de esta categoría.</div>
                    ) : plantillasVistas[tm.rec].length === 0 ? (
                      <div className="text-xs" style={{ color: C.dim }}>Esta categoría todavía no tiene jugadores dados de alta.</div>
                    ) : (
                      <>
                        <div className="text-[11px] mb-2" style={{ color: C.dim }}>
                          {plantillasVistas[tm.rec].length} jugador{plantillasVistas[tm.rec].length === 1 ? "" : "es"}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                          {[...plantillasVistas[tm.rec]].sort((a, b) => a.d - b.d).map((pl) => (
                            <div key={pl.id} className="flex items-center gap-2 rounded-lg border px-2.5 py-2" style={{ borderColor: C.line }}>
                              <span className="w-6 h-6 rounded-full flex items-center justify-center font-display text-[11px] font-bold shrink-0"
                                style={{ background: AC, color: C.sobre }}>{pl.d}</span>
                              <span className="text-xs flex-1 min-w-0 truncate" style={{ color: C.chalk }}>{pl.n}</span>
                              <span className="text-[10px] shrink-0" style={{ color: C.dim }}>{pl.pos}</span>
                              <Dot st={pl.st} />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </Card>

        {E && (
          <Card title={E.rec ? `Editar ${E.name}` : `Nueva categoría${E.club ? " de " + E.club : ""}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <label className="space-y-1">
                <div style={{ color: C.dim }}>Nombre de la categoría</div>
                <input value={E.name} onChange={(e) => setTeamEdit({ ...E, name: e.target.value })} placeholder="Juvenil A"
                  className="w-full px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.chalk }} />
              </label>
              <label className="space-y-1">
                {/* El club no se escribe a mano: se elige entre los que existen.
                    Un club escrito a mano con otra grafía creaba un club nuevo
                    y partía en dos las categorías de un mismo equipo. */}
                <div style={{ color: C.dim }}>Club al que pertenece</div>
                <select value={E.clubRec || ""} onChange={(e) => {
                  const c = clubsAll.find((x) => x.rec === e.target.value);
                  setTeamEdit({ ...E, clubRec: e.target.value, club: c?.name || "", comunidad: c?.comunidad || E.comunidad });
                }} className="w-full px-3 py-2 rounded-lg border" style={{ background: C.panel, borderColor: C.line, color: C.chalk }}>
                  <option value="">Elige un club…</option>
                  {clubsAll.map((c) => <option key={c.rec} value={c.rec}>{c.name}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <div style={{ color: C.dim }}>Web del equipo</div>
                <input value={E.web || ""} onChange={(e) => setTeamEdit({ ...E, web: e.target.value })} placeholder="https://…" type="url"
                  className="w-full px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.chalk }} />
              </label>
              <label className="space-y-1">
                <div style={{ color: C.dim }}>Google Maps del campo</div>
                <input value={E.maps || ""} onChange={(e) => setTeamEdit({ ...E, maps: e.target.value })} placeholder="https://maps.app.goo.gl/…" type="url"
                  className="w-full px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.chalk }} />
              </label>
            </div>
            {!E.rec && (
              <div className="mt-3 text-[11px] rounded-lg border p-2.5" style={{ borderColor: C.line, color: C.dim }}>
                El escudo se sube desde la lista de arriba con el botón ⬡ Escudo, una vez creada la categoría.
              </div>
            )}
            <div className="mt-3">
              <div className="text-xs mb-2" style={{ color: C.dim }}>Categoría</div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIAS.map((c) => (
                  <button key={c.k} onClick={() => setTeamEdit({ ...E, cat: c.k, f7: c.f7 })}
                    className="text-xs px-3 py-1.5 rounded-full border"
                    style={{ borderColor: E.cat === c.k ? AC : C.line, color: E.cat === c.k ? AC : C.dim }}>{c.label}</button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                {[["Fútbol 11", false], ["Fútbol 7", true]].map(([l, v]) => (
                  <button key={l} onClick={() => setTeamEdit({ ...E, f7: v })} className="text-xs px-3 py-1.5 rounded-full border"
                    style={{ borderColor: E.f7 === v ? AC : C.line, color: E.f7 === v ? AC : C.dim }}>{l}</button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={async () => {
                if (!E.name.trim()) return;
                if (!E.rec && !E.clubRec) { setTeamMsg("Elige a qué club pertenece la categoría."); return; }
                const ok = E.rec
                  ? await airTeamPatch(E.rec, { name: E.name.trim(), cat: E.cat, f7: E.f7, web: E.web || "", maps: E.maps || "" })
                  : !!(await airTeamCreate({ name: E.name.trim(), cat: E.cat, f7: E.f7, clubRec: E.clubRec || undefined, club: E.club, comunidad: E.comunidad, web: E.web || "", maps: E.maps || "" }))?.ok;
                setTeamMsg(ok ? "✓ Guardado." : "No se pudo guardar. Revisa la conexión.");
                setTeamEdit(null);
                if (ok) loadTeams();
              }} className="font-display uppercase tracking-wide text-sm px-4 py-2 rounded-lg font-semibold" style={{ background: AC, color: C.sobre }}>{t("p.save")}</button>
              <button onClick={() => setTeamEdit(null)} className="text-sm px-4 py-2 rounded-lg border" style={{ borderColor: C.line, color: C.dim }}>{t("c.cancel")}</button>
            </div>
          </Card>
        )}
      </div>
    );
  };

  /* ================= CALENDARIO DEL EQUIPO ================= */
  const todayISO = hoyISO();
  const sortedFix = [...fixtures].sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1));
  const nextFix = sortedFix.find((f) => f.date >= todayISO) || null;
  /* Solo partidos de verdad (jornada numérica): los avisos de pretemporada
     ("j" = "PT") no tienen rival ni hora de partido, así que no pueden
     alimentar el cartel de "próximo partido" — ahí forzarían un "vs" sin
     sentido. Se siguen viendo igual en la lista del calendario completo. */
  const nextMatchFix = sortedFix.find((f) => f.date >= todayISO && /^\d+$/.test(String(f.j))) || null;
  const importCal = (txt) => {
    const rows = parseFixtures(txt);
    if (!rows.length) { setCalMsg("No he reconocido ningún partido. Revisa el formato."); return; }
    if (!isPro && fixtures.length + rows.length > FREE_CAPS.fixtures) {
      setCalMsg(`El plan gratuito guarda ${FREE_CAPS.fixtures} partidos. Suscríbete a PRO para el calendario completo.`);
      return;
    }
    setFixtures((fs) => {
      const key = (f) => f.date + "|" + f.time + "|" + f.home + "|" + f.away;
      const seen = new Set(fs.map(key));
      return [...fs, ...rows.filter((r) => !seen.has(key(r)))];
    });
    setCalMsg(`✓ ${rows.length} partido(s) importados.`);
    setCalText("");
  };
  /* El nombre propio no siempre coincide letra a letra con el que trae el
     calendario (mayúsculas, acentos, "- Alcobendas" añadido al final…), así
     que para saber cuál de los dos equipos del cruce es "el rival" se
     compara el NOMBRE COMPLETO del club, sin acentos ni mayúsculas, con
     normClub -la misma comparación que ya se usa para reconocer el club en
     otras partes de la app-. Antes se comparaban solo los 6 primeros
     caracteres ("c.d. c"), y eso confundía al Chamartín con cualquier otro
     club que también empezara por "C.D. C…" -Canillas, Colmenar…-, colando
     el propio equipo como "rival" de sí mismo en el desplegable. */
  const rivalDeFixture = (f) => {
    const mio = normClub(session.club);
    return (mio && normClub(f.home).includes(mio) ? f.away : f.home) || f.away || f.home;
  };
  const useAsNext = (f) => {
    setMatchInfo({ rival: rivalDeFixture(f), fecha: f.date, hora: f.time || "—", lugar: f.place || "—", j: f.j || "" });
    setTab("partido");
  };
  /* Todos los rivales que aparecen en el calendario, sin repetir y en el
     orden de las jornadas: la lista que alimenta el desplegable de
     Convocatoria. Si el calendario está vacío, la lista sale vacía y el
     desplegable lo dice -de ahí la importancia de que el director deportivo
     lo cargue al empezar la temporada, antes de la primera convocatoria. */
  const rivalesDelCalendario = session ? [...new Set(
    sortedFix.filter((f) => /^\d+$/.test(String(f.j))).map(rivalDeFixture).filter(Boolean)
  )] : [];

  const renderCalendar = () => {
    const canEdit = can("editCal");
    return (
      <div className="space-y-4">
        <Card title={t("ca.teamCrest")}>
          <div className="flex items-center gap-4">
            <Crest src={teamCrest} name={session.team.name} size={56} />
            <div className="min-w-0">
              <div className="font-display text-lg" style={{ color: C.chalk }}>{session.club} · {session.team.name}</div>
              <div className="text-[11px]" style={{ color: C.dim }}>{session.team.sub}</div>
            </div>
          </div>
          <div className="text-[11px] mt-3" style={{ color: C.dim }}>
            El escudo es el del club: lo comparten todas sus categorías (Infantil B, Juvenil A, Sénior…), no hay uno distinto por categoría.
          </div>
        </Card>

        <Card title={t("ca.month")}>
          {(() => {
            const DIAS = diasSemanaCortos(lang);
            const { y, m } = calMonth;
            const primero = new Date(y, m, 1);
            /* getDay() da 0=domingo; se desplaza para que la semana empiece en lunes */
            const offset = (primero.getDay() + 6) % 7;
            const total = new Date(y, m + 1, 0).getDate();
            const iso = (d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const mover = (delta) => setCalMonth(({ y: yy, m: mm }) => {
              const nm = mm + delta;
              return { y: yy + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
            });
            const celdas = [];
            for (let i = 0; i < offset; i++) celdas.push(null);
            for (let d = 1; d <= total; d++) celdas.push(d);
            const diaSel = selectedDay ? new Date(selectedDay + "T00:00:00") : null;
            const partidosDia = selectedDay ? fixtures.filter((f) => f.date === selectedDay) : [];
            const entrenoDia = diaSel ? trainDays.includes(diaSel.getDay()) || trainMeta.fecha === selectedDay : false;
            return (
              <>
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => mover(-1)} className="text-sm px-2.5 py-1 rounded-lg border" style={{ borderColor: C.line, color: C.chalk }}>‹</button>
                  <div className="font-display text-lg uppercase tracking-wide" style={{ color: C.chalk }}>{mesLargo(y, m, lang)} {y}</div>
                  <button onClick={() => mover(1)} className="text-sm px-2.5 py-1 rounded-lg border" style={{ borderColor: C.line, color: C.chalk }}>›</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {DIAS.map((d) => <div key={d} className="text-[10px] font-display uppercase pb-1" style={{ color: C.dim }}>{d}</div>)}
                  {celdas.map((d, i) => {
                    if (!d) return <div key={`x${i}`} />;
                    const fecha = iso(d);
                    const partidos = fixtures.filter((f) => f.date === fecha);
                    const dow = new Date(y, m, d).getDay();
                    const esEntreno = trainDays.includes(dow);
                    const planEse = trainMeta.fecha === fecha;
                    const hoy = fecha === todayISO;
                    const sel = fecha === selectedDay;
                    return (
                      <button key={fecha} type="button" onClick={() => setSelectedDay(sel ? null : fecha)}
                        className="rounded-lg border p-1 min-h-[52px] text-left flex flex-col w-full"
                        style={{ borderColor: sel ? AC : hoy ? AC : C.line, borderWidth: sel ? 2 : 1, background: sel ? `${AC}1a` : hoy ? "rgba(54,69,79,.07)" : "transparent" }}>
                        <div className="text-[11px] font-display" style={{ color: hoy || sel ? AC : C.chalk }}>{d}</div>
                        {partidos.map((f) => (
                          <div key={f.id} title={`${f.home} vs ${f.away} · ${f.time || ""} · ${f.place || ""}`}
                            className="mt-0.5 text-[8px] leading-tight px-1 rounded truncate"
                            style={{ background: AC, color: C.sobre }}>
                            {f.time || ""} {f.away || f.home}
                          </div>
                        ))}
                        {(esEntreno || planEse) && partidos.length === 0 && (
                          <div className="mt-0.5 text-[8px] leading-tight px-1 rounded truncate"
                            style={{ background: `${C.velo}0.14)`, color: C.dim }}>
                            {planEse ? trainMeta.hora || t("ca.legendTrain") : t("ca.legendTrain")}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px]" style={{ color: C.dim }}>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: AC }} />{t("ca.legendMatch")}</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "rgba(47,107,79,.5)" }} />{t("ca.legendTrain")}</span>
                </div>
                {can("editTraining") && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[11px]" style={{ color: C.dim }}>{t("ca.trainDaysLabel")}</span>
                    {diasSemanaCortosDomingoPrimero(lang).map((lbl, idx) => (
                      <button key={idx} onClick={() => setTrainDays((ds) => ds.includes(idx) ? ds.filter((x) => x !== idx) : [...ds, idx])}
                        className="text-[11px] w-7 py-1 rounded border font-display"
                        style={{ borderColor: trainDays.includes(idx) ? C.green : C.line, background: trainDays.includes(idx) ? "rgba(47,107,79,.18)" : "transparent", color: trainDays.includes(idx) ? C.green : C.dim }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                )}
                {!selectedDay && <div className="text-[11px] mt-3" style={{ color: C.dim }}>{t("ca.dayHint")}</div>}
                {selectedDay && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: C.line }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-display text-sm uppercase tracking-wide" style={{ color: C.chalk }}>{fechaLegible(selectedDay, lang)}</div>
                      <button onClick={() => setSelectedDay(null)} className="text-xs px-2 py-1 rounded border" style={{ borderColor: C.line, color: C.dim }}>{t("p.close")}</button>
                    </div>
                    {entrenoDia && (
                      <div className="text-xs px-2 py-1.5 rounded mb-2 inline-block" style={{ background: "rgba(47,107,79,.14)", color: C.green }}>
                        🏋️ {t("ca.dayTraining")}
                      </div>
                    )}
                    {partidosDia.length > 0 ? (
                      <div className="space-y-1.5">
                        {partidosDia.map((f) => (
                          <div key={f.id} className="rounded-lg border p-2.5 flex flex-wrap items-center gap-x-3 gap-y-1" style={{ borderColor: C.line }}>
                            <div className="text-sm tabular-nums shrink-0" style={{ color: C.chalk }}>{f.time || "—"}</div>
                            <div className="text-sm flex-1 min-w-[160px]" style={{ color: C.chalk }}>{f.home} <span style={{ color: C.dim }}>vs</span> {f.away}</div>
                            {f.place && <div className="text-[11px] w-full sm:w-auto" style={{ color: C.dim }}>📍 {f.place}</div>}
                            {canEdit && (
                              <div className="flex gap-2 text-xs">
                                <button onClick={() => useAsNext(f)} className="px-2 py-1 rounded border" style={{ borderColor: C.line, color: C.chalk }}>{t("ca.useMatch")}</button>
                                <button onClick={() => setFixtures((fs) => fs.filter((x) => x.id !== f.id))} className="px-2 py-1 rounded border" style={{ borderColor: C.line, color: C.dim }}>✕</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : !entrenoDia && (
                      <div className="text-sm" style={{ color: C.dim }}>{t("ca.dayEmpty")}</div>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </Card>

        <Card title={t("ca.title")}>
          {sortedFix.length === 0 ? (
            <div className="text-sm" style={{ color: C.dim }}>{t("ca.empty")}</div>
          ) : (
            <div className="space-y-1.5">
              {sortedFix.map((f) => {
                const isNext = nextFix && f.id === nextFix.id;
                return (
                  <div key={f.id} className="rounded-lg border p-3 flex flex-wrap items-center gap-x-3 gap-y-1"
                    style={{ borderColor: isNext ? AC : C.line, background: isNext ? C.panel2 : "transparent", opacity: f.date < todayISO ? 0.5 : 1 }}>
                    {/* Ancho fijo (w-10) más una etiqueta larga ("Pretemporada"
                        en vez de "PT") desbordaba encima de la fecha de al lado:
                        flexbox no encoge un texto sin espacios por debajo de su
                        ancho natural aunque se le fuerce un ancho menor. Con
                        max-w + truncate no puede volver a pasar, sea cual sea
                        el texto que traiga f.j (p.ej. un CSV importado). */}
                    <div className="font-display text-sm shrink-0 max-w-[72px] overflow-hidden text-ellipsis whitespace-nowrap" title={f.j ? "J" + f.j : ""} style={{ color: AC }}>{f.j ? "J" + f.j : "—"}</div>
                    <div className="text-sm tabular-nums shrink-0" style={{ color: C.chalk }}>{f.date} {f.time}</div>
                    <div className="text-sm flex-1 min-w-[180px]" style={{ color: C.chalk }}>{f.home} <span style={{ color: C.dim }}>vs</span> {f.away}</div>
                    {f.place && <div className="text-[11px] w-full sm:w-auto" style={{ color: C.dim }}>📍 {f.place}</div>}
                    {canEdit && (
                      <div className="flex gap-2 text-xs">
                        <button onClick={() => useAsNext(f)} className="px-2 py-1 rounded border" style={{ borderColor: C.line, color: C.chalk }}>{t("ca.useMatch")}</button>
                        <button onClick={() => setFixtures((fs) => fs.filter((x) => x.id !== f.id))} className="px-2 py-1 rounded border" style={{ borderColor: C.line, color: C.dim }}>✕</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {canEdit && (
          <Card title={t("ca.import")}>
            <div className="text-sm" style={{ color: C.chalk }}>
              Pega el calendario de tu equipo o sube un archivo. Admite <strong>CSV</strong> (jornada; fecha; hora; local; visitante; campo) y <strong>ICS</strong> (el que exportan las webs de competición y Google Calendar).
            </div>
            <textarea value={calText} onChange={(e) => setCalText(e.target.value)} rows={5} placeholder={CAL_SAMPLE}
              className="mt-3 w-full px-3 py-2 rounded-lg border bg-transparent text-sm font-mono" style={{ borderColor: C.line, color: C.chalk }} />
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={() => importCal(calText)} className="font-display uppercase tracking-wide text-sm px-4 py-2 rounded-lg font-semibold" style={{ background: AC, color: C.sobre }}>{t("ca.importBtn")}</button>
              <label className="text-sm px-4 py-2 rounded-lg border cursor-pointer font-display uppercase tracking-wide" style={{ borderColor: C.line, color: C.chalk }}>
                📂 Subir .csv / .ics
                <input type="file" accept=".csv,.ics,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => importCal(String(r.result)); r.readAsText(f); e.target.value = ""; }} />
              </label>
              <button onClick={() => setCalText(CAL_SAMPLE)} className="text-sm px-4 py-2 rounded-lg border" style={{ borderColor: C.line, color: C.dim }}>{t("ca.example")}</button>
              {fixtures.length > 0 && <button onClick={() => { setFixtures([]); setCalMsg("Calendario vaciado."); }} className="text-sm px-4 py-2 rounded-lg border" style={{ borderColor: C.line, color: C.dim }}>{t("ca.clear")}</button>}
            </div>
            {calMsg && <div className="text-xs mt-2" style={{ color: calMsg.startsWith("✓") ? C.green : C.warn }}>{calMsg}</div>}
            <div className="text-[11px] mt-3 leading-relaxed" style={{ color: C.dim }}>
              El calendario es el de tu equipo y lo cargas tú: descárgalo de tu federación o de la app del club y súbelo aquí. CoachBase no
              copia datos de webs de terceros.
            </div>
          </Card>
        )}
      </div>
    );
  };

  /* ================= DISCIPLINA (módulo del delegado) ================= */
  const pName = (id) => { const p = players.find((x) => x.id === id); return p ? `#${p.d} ${p.n}` : "—"; };
  const hasSigned = (playerId, docId) => (signs[docId]?.players || []).includes(playerId);
  const pendingSign = players.filter((p) => !hasSigned(p.id, "d1")).length;
  const pendingValid = incidents.filter((i) => i.state === "registrada").length;
  /* Jugadores a los que el cuerpo técnico todavía no ha confirmado que han
     hecho los ejercicios del plan de pretemporada (doc "d5"). */
  const pretempPend = players.filter((p) => !hasSigned(p.id, "d5"));

  /* --- pasar lista: asistencia por sesión + incidencias automáticas --- */
  const ATT_STATES = [
    { k: "ok", label: "Asistió", icon: "✓", color: "#3E7A4E" },
    { k: "late", label: "Retraso", icon: "⏰", color: C.warn },
    { k: "absent", label: "Falta", icon: "✕", color: "#E5484D" },
    { k: "just", label: "Justificada", icon: "📝", color: "#36454F" },
  ];
  const QUICK_NORMS = ["L1", "L2", "L3", "L4", "L6", "G1", "G2"];
  const AUTO_NORM = { late: "L1", absent: "L2" };
  const attKey = `${attDate}|${attCtx}`;
  const attToday = attend[attKey] || {};
  const attCount = (pid, st) =>
    Object.entries(attend).reduce((n, [k, v]) => n + (v[pid] === st ? 1 : 0), 0);
  const newIncident = (pid, norm, desc, extra = {}) => ({
    id: Date.now() + Math.random(), pid, player: pName(pid), date: attDate, ctx: attCtx,
    norm, card: "none", measure: [MEASURES[0]], amount: 0, pay: "na", desc,
    state: "registrada", by: `${session.name} (${role.label.toLowerCase()})`, fam: false, ...extra,
  });
  const setAtt = (pid, val) => {
    setAttend((a) => ({ ...a, [attKey]: { ...(a[attKey] || {}), [pid]: val } }));
    const norm = AUTO_NORM[val];
    setIncidents((xs) => {
      const rest = xs.filter((i) => !(i.auto && i.pid === pid && i.date === attDate && i.ctx === attCtx));
      if (!norm) return rest;
      const row = newIncident(pid, norm,
        val === "late" ? "Retraso registrado al pasar lista." : "Ausencia sin comunicar registrada al pasar lista.",
        { auto: true });
      airResCreate("incidencias", row);
      return [row, ...rest];
    });
  };
  /* --- medidas colectivas (lotes), reincidencia y bote --- */
  const TARGETS = [
    { k: "all", label: "Toda la plantilla" },
    { k: "absent", label: "Han faltado ese día" },
    { k: "late", label: "Han llegado tarde ese día" },
    { k: "unsigned", label: "No han firmado el código" },
    { k: "manual", label: "Selección manual" },
  ];
  const targetPlayers = (k, sel = [], dayKey = attKey) => {
    const day = attend[dayKey] || {};
    if (k === "absent") return players.filter((p) => day[p.id] === "absent");
    if (k === "late") return players.filter((p) => day[p.id] === "late");
    if (k === "unsigned") return players.filter((p) => !hasSigned(p.id, "d1"));
    if (k === "manual") return players.filter((p) => sel.includes(p.id));
    return players;
  };
  const isYouth = session?.team?.cat !== "senior";
  const levesDe = (pid) => incidents.filter((i) => i.pid === pid && i.state !== "anulada" && normOf(i.norm).g === "leve").length;
  const pot = incidents.filter((i) => i.state !== "anulada").reduce(
    (a, i) => ({
      pend: a.pend + (i.pay === "pendiente" ? Number(i.amount) || 0 : 0),
      paid: a.paid + (i.pay === "pagada" ? Number(i.amount) || 0 : 0),
    }), { pend: 0, paid: 0 });
  const annulBatch = (b) => setIncidents((xs) => xs.map((i) => (i.batch === b ? { ...i, state: "anulada" } : i)));
  const saveTeamSanction = () => {
    const f = teamForm;
    const targets = targetPlayers(f.target, f.sel, `${f.date}|${f.ctx}`);
    if (!targets.length) return;
    const batch = "B" + Date.now();
    const rows = targets.map((p) => ({
      ...newIncident(p.id, f.norm, f.desc || "Medida colectiva del equipo."),
      date: f.date, ctx: f.ctx, measure: f.measure,
      /* Nunca por debajo de 0: el input es type=number con min=0, pero eso
         solo se valida al enviar un formulario y aquí no hay ninguno, así que
         un "-5" escrito a mano llegaba tal cual y dejaba el bote en negativo. */
      amount: Math.max(0, Number(f.amount) || 0), pay: Number(f.amount) > 0 ? "pendiente" : "na", batch,
    }));
    setIncidents((xs) => [...rows, ...xs]);
    rows.forEach((r) => airResCreate("incidencias", r));
    setTeamForm(null);
  };
  const exportDiscCsv = () => {
    const head = "Fecha;Contexto;Jugador;Norma;Gravedad;Tarjeta;Medidas;Importe;Pago;Estado;Lote;Descripcion";
    const esc = (v) => String(v ?? "").replace(/[;\r\n]/g, " ").trim();
    const lines = [...incidents]
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((i) => [i.date, i.ctx, pName(i.pid), `${i.norm} ${normOf(i.norm).t}`, normOf(i.norm).g,
        cardOf(i.card).label, (i.measure || []).join(" / "), Number(i.amount) || 0, i.pay, i.state, i.batch || "", i.desc]
        .map(esc).join(";"));
    const blob = new Blob(["\ufeff" + [head, ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `disciplina-${session.team?.id || "equipo"}-${hoyISO()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const quickIncident = (pid, norm) => {
    const row = newIncident(pid, norm, normOf(norm).t + " (registro rápido).");
    setIncidents((xs) => [row, ...xs]);
    airResCreate("incidencias", row);
    setQuickPid(null);
  };

  const saveIncident = () => {
    const f = discForm;
    if (!f || !f.pid) return;
    const row = {
      id: Date.now(), pid: Number(f.pid), player: pName(Number(f.pid)), date: f.date, ctx: f.ctx, norm: f.norm, card: f.card,
      measure: f.measure, amount: Math.max(0, Number(f.amount) || 0), pay: Number(f.amount) > 0 ? "pendiente" : "na",
      desc: f.desc, state: "registrada", by: `${session.name} (${role.label.toLowerCase()})`, fam: false,
    };
    setIncidents((xs) => [row, ...xs]);
    airResCreate("incidencias", row);
    setDiscForm(null);
  };
  const setIncState = (id, state) => {
    setIncidents((xs) => xs.map((i) => (i.id === id ? { ...i, state } : i)));
    const it = incidents.find((i) => i.id === id);
    if (it?.rec) airResPatch("incidencias", it.rec, { state });
  };
  const toggleFam = (id) => setIncidents((xs) => xs.map((i) => (i.id === id ? { ...i, fam: !i.fam } : i)));
  const setPay = (id, pay) => setIncidents((xs) => xs.map((i) => (i.id === id ? { ...i, pay } : i)));

  const renderDiscipline = () => {
    const canEdit = can("editDiscipline");
    const canVal = can("validateDiscipline");
    const list = incidents
      .filter((i) => (discFilter === "all" ? true : discFilter === "pend" ? i.state === "registrada" : i.state === discFilter))
      .filter((i) => discPid === "all" || i.pid === Number(discPid))
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    const rank = players
      .map((p) => {
        const mine = incidents.filter((i) => i.pid === p.id && i.state !== "anulada");
        return {
          p, n: mine.length,
          y: mine.filter((i) => i.card === "yellow" || i.card === "fedYellow").length,
          r: mine.filter((i) => i.card === "red" || i.card === "fedRed").length,
          due: mine.filter((i) => i.pay === "pendiente").reduce((a, i) => a + (Number(i.amount) || 0), 0),
        };
      })
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n);
    const chips = [["all", "Todas"], ["pend", `Pendientes de validar (${pendingValid})`], ["validada", "Validadas"], ["anulada", "Anuladas"]];
    const F = discForm;
    const selNorm = F ? normOf(F.norm) : null;

    return (
      <div className="space-y-4">
        <Card title="Módulo de comportamiento">
          <div className="text-sm" style={{ color: C.chalk }}>
            Registro de incidencias según el <strong>Código Disciplinario</strong> del equipo. Las consecuencias que se ofrecen son las
            literales del documento firmado por el club.
          </div>
          <div className="text-[11px] mt-2 leading-relaxed" style={{ color: C.dim }}>
            El delegado registra; el cuerpo técnico valida. El documento establece que cada situación se valora de forma individual por el
            cuerpo técnico y que las medidas tienen siempre carácter educativo.
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {canEdit && (
              <button onClick={() => setDiscForm({ pid: "", date: hoyISO(), ctx: "Entrenamiento", norm: "L1", card: "none", measure: [], amount: 0, desc: "" })}
                className="font-display uppercase tracking-wide text-sm px-4 py-2 rounded-lg font-semibold" style={{ background: AC, color: C.sobre }}>
                + Registrar incidencia
              </button>
            )}
            {canEdit && (
              <button onClick={() => (isPro ? setTeamForm({ target: "all", sel: [], date: attDate, ctx: attCtx, norm: "G5", measure: ["Tareas de colaboración"], amount: 0, desc: "" }) : proAlert("discipline"))}
                className="font-display uppercase tracking-wide text-sm px-4 py-2 rounded-lg border" style={{ borderColor: AC, color: AC }}>
                ⚖ Medida colectiva
              </button>
            )}
            <button onClick={() => setTab("normativa")} className="text-sm px-4 py-2 rounded-lg border font-display uppercase tracking-wide" style={{ borderColor: C.line, color: C.chalk }}>
              📑 Ver normativa y firmas
            </button>
            {incidents.length > 0 && (
              <button onClick={() => (isPro ? exportDiscCsv() : proAlert("discipline"))} className="text-sm px-4 py-2 rounded-lg border font-display uppercase tracking-wide" style={{ borderColor: C.line, color: C.dim }}>
                ⤓ Exportar CSV
              </button>
            )}
          </div>
          {pendingSign > 0 && (
            <div className="mt-3 text-xs rounded-lg border px-3 py-2" style={{ borderColor: C.warn, color: C.warn }}>
              ⚠ {pendingSign} jugador(es) todavía no han firmado el código disciplinario. Sin firma no debe aplicarse ninguna sanción económica.
            </div>
          )}
        </Card>

        {F && (
          <Card title="Nueva incidencia">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <label className="space-y-1">
                <div style={{ color: C.dim }}>Jugador</div>
                <select value={F.pid} onChange={(e) => setDiscForm({ ...F, pid: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.chalk }}>
                  <option value="" style={{ background: C.panel }}>Elige jugador…</option>
                  {players.map((p) => (<option key={p.id} value={p.id} style={{ background: C.panel }}>#{p.d} {p.n}</option>))}
                </select>
              </label>
              <label className="space-y-1">
                <div style={{ color: C.dim }}>Fecha</div>
                <input type="date" value={F.date} onChange={(e) => setDiscForm({ ...F, date: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.chalk }} />
              </label>
              <label className="space-y-1">
                <div style={{ color: C.dim }}>Contexto</div>
                <select value={F.ctx} onChange={(e) => setDiscForm({ ...F, ctx: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.chalk }}>
                  {CONTEXTS.map((c) => (<option key={c} value={c} style={{ background: C.panel }}>{c}</option>))}
                </select>
              </label>
              <label className="space-y-1">
                <div style={{ color: C.dim }}>Norma infringida</div>
                <select value={F.norm} onChange={(e) => setDiscForm({ ...F, norm: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.chalk }}>
                  <optgroup label="Faltas leves" style={{ background: C.panel }}>
                    {NORMS.filter((n) => n.g === "leve").map((n) => (<option key={n.code} value={n.code} style={{ background: C.panel }}>{n.code} · {n.t}</option>))}
                  </optgroup>
                  <optgroup label="Faltas graves" style={{ background: C.panel }}>
                    {NORMS.filter((n) => n.g === "grave").map((n) => (<option key={n.code} value={n.code} style={{ background: C.panel }}>{n.code} · {n.t}</option>))}
                  </optgroup>
                </select>
              </label>
              <label className="space-y-1">
                <div style={{ color: C.dim }}>Tarjeta</div>
                <select value={F.card} onChange={(e) => setDiscForm({ ...F, card: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.chalk }}>
                  {CARDS.map((c) => (<option key={c.k} value={c.k} style={{ background: C.panel }}>{c.label}</option>))}
                </select>
              </label>
              <label className="space-y-1">
                <div style={{ color: C.dim }}>Sanción económica (opcional)</div>
                <input type="number" min="0" step="1" value={F.amount} onChange={(e) => setDiscForm({ ...F, amount: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.chalk }} />
              </label>
            </div>

            {selNorm && (
              <div className="mt-3 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: C.line, color: C.dim }}>
                <span className="font-display uppercase tracking-wide" style={{ color: selNorm.g === "grave" ? C.red : C.warn }}>Falta {selNorm.g}</span> · Consecuencia según el código: {selNorm.c}
              </div>
            )}

            <div className="mt-3">
              <div className="text-xs mb-2" style={{ color: C.dim }}>Medidas aplicadas (las 8 del documento)</div>
              <div className="flex flex-wrap gap-2">
                {MEASURES.map((m) => {
                  const on = F.measure.includes(m);
                  return (
                    <button key={m} onClick={() => setDiscForm({ ...F, measure: on ? F.measure.filter((x) => x !== m) : [...F.measure, m] })}
                      className="text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: on ? AC : C.line, color: on ? AC : C.dim, background: on ? "rgba(255,255,255,0.04)" : "transparent" }}>
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            <textarea value={F.desc} onChange={(e) => setDiscForm({ ...F, desc: e.target.value })} rows={2} placeholder="Qué ocurrió (hechos, sin juicios de valor)"
              className="mt-3 w-full px-3 py-2 rounded-lg border bg-transparent text-sm" style={{ borderColor: C.line, color: C.chalk }} />

            {Number(F.amount) > 0 && (
              <div className="mt-3 text-xs rounded-lg border px-3 py-2" style={{ borderColor: C.red, color: C.red }}>
                ⚠ El código disciplinario del equipo <strong>no contempla sanciones económicas</strong>: todas sus medidas son educativas.
                Usa este campo solo si el club tiene aprobado y firmado un régimen económico.
                {F.pid && !hasSigned(Number(F.pid), "d1") && <> Además, este jugador <strong>no ha firmado</strong> el código.</>}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button onClick={saveIncident} disabled={!F.pid} className="font-display uppercase tracking-wide text-sm px-4 py-2 rounded-lg font-semibold disabled:opacity-40" style={{ background: AC, color: C.sobre }}>Guardar incidencia</button>
              <button onClick={() => setDiscForm(null)} className="text-sm px-4 py-2 rounded-lg border" style={{ borderColor: C.line, color: C.dim }}>{t("c.cancel")}</button>
            </div>
          </Card>
        )}

        {teamForm && (() => {
          const TF = teamForm;
          const targets = targetPlayers(TF.target, TF.sel, `${TF.date}|${TF.ctx}`);
          const n = normOf(TF.norm);
          return (
            <Card title="Medida colectiva">
              <div className="text-sm" style={{ color: C.chalk }}>
                Aplica la misma medida a varios jugadores de una vez. Se crea una incidencia por jugador, agrupadas en un lote que puedes
                anular entero después.
              </div>

              <div className="mt-3">
                <div className="text-xs mb-2" style={{ color: C.dim }}>¿A quién se aplica?</div>
                <div className="flex flex-wrap gap-2">
                  {TARGETS.map((x) => (
                    <button key={x.k} onClick={() => setTeamForm({ ...TF, target: x.k })}
                      className="text-xs px-3 py-1.5 rounded-full border"
                      style={{ borderColor: TF.target === x.k ? AC : C.line, color: TF.target === x.k ? AC : C.dim }}>{x.label}</button>
                  ))}
                </div>
                {TF.target === "manual" && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {players.map((p) => {
                      const on = TF.sel.includes(p.id);
                      return (
                        <button key={p.id} onClick={() => setTeamForm({ ...TF, sel: on ? TF.sel.filter((x) => x !== p.id) : [...TF.sel, p.id] })}
                          className="text-[11px] px-2.5 py-1 rounded-full border"
                          style={{ borderColor: on ? AC : C.line, color: on ? AC : C.dim }}>#{p.d} {p.n.split(" ")[0]}</button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mt-3">
                <label className="space-y-1">
                  <div style={{ color: C.dim }}>Fecha</div>
                  <input type="date" value={TF.date} onChange={(e) => setTeamForm({ ...TF, date: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.chalk }} />
                </label>
                <label className="space-y-1">
                  <div style={{ color: C.dim }}>Contexto</div>
                  <select value={TF.ctx} onChange={(e) => setTeamForm({ ...TF, ctx: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.chalk }}>
                    {CONTEXTS.map((c) => (<option key={c} value={c} style={{ background: C.panel }}>{c}</option>))}
                  </select>
                </label>
                <label className="space-y-1">
                  <div style={{ color: C.dim }}>Norma</div>
                  <select value={TF.norm} onChange={(e) => setTeamForm({ ...TF, norm: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.chalk }}>
                    <optgroup label="Faltas leves" style={{ background: C.panel }}>
                      {NORMS.filter((x) => x.g === "leve").map((x) => (<option key={x.code} value={x.code} style={{ background: C.panel }}>{x.code} · {x.t}</option>))}
                    </optgroup>
                    <optgroup label="Faltas graves" style={{ background: C.panel }}>
                      {NORMS.filter((x) => x.g === "grave").map((x) => (<option key={x.code} value={x.code} style={{ background: C.panel }}>{x.code} · {x.t}</option>))}
                    </optgroup>
                  </select>
                </label>
                <label className="space-y-1">
                  <div style={{ color: C.dim }}>Importe por jugador (opcional)</div>
                  <input type="number" min="0" step="1" value={TF.amount} onChange={(e) => setTeamForm({ ...TF, amount: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.chalk }} />
                </label>
              </div>

              <div className="mt-3 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: C.line, color: C.dim }}>
                <span className="font-display uppercase tracking-wide" style={{ color: n.g === "grave" ? C.red : C.warn }}>Falta {n.g}</span> · {n.c}
              </div>

              <div className="mt-3">
                <div className="text-xs mb-2" style={{ color: C.dim }}>Medidas aplicadas</div>
                <div className="flex flex-wrap gap-2">
                  {MEASURES.map((m) => {
                    const on = TF.measure.includes(m);
                    return (
                      <button key={m} onClick={() => setTeamForm({ ...TF, measure: on ? TF.measure.filter((x) => x !== m) : [...TF.measure, m] })}
                        className="text-xs px-3 py-1.5 rounded-full border"
                        style={{ borderColor: on ? AC : C.line, color: on ? AC : C.dim }}>{m}</button>
                    );
                  })}
                </div>
              </div>

              <textarea value={TF.desc} onChange={(e) => setTeamForm({ ...TF, desc: e.target.value })} rows={2}
                placeholder="Motivo de la medida colectiva (qué pasó y por qué afecta a todo el grupo)"
                className="mt-3 w-full px-3 py-2 rounded-lg border bg-transparent text-sm" style={{ borderColor: C.line, color: C.chalk }} />

              {Number(TF.amount) > 0 && (
                <div className="mt-3 text-xs rounded-lg border px-3 py-2 leading-relaxed" style={{ borderColor: isYouth ? C.red : C.line, color: isYouth ? C.red : C.dim }}>
                  {isYouth ? (
                    <>⚠ Vas a poner <strong>{Number(TF.amount) * targets.length} €</strong> en total a {targets.length} menores. El código
                    disciplinario del equipo no contempla sanciones económicas y una multa colectiva castiga por igual a quien no hizo nada.
                    Úsalo solo si el club tiene un régimen económico aprobado y firmado por las familias.</>
                  ) : (
                    <>Bote del equipo: {Number(TF.amount) * targets.length} € en total ({targets.length} jugadores).</>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <button onClick={saveTeamSanction} disabled={!targets.length}
                  className="font-display uppercase tracking-wide text-sm px-4 py-2 rounded-lg font-semibold disabled:opacity-40" style={{ background: AC, color: C.sobre }}>
                  Aplicar a {targets.length} jugador{targets.length === 1 ? "" : "es"}
                </button>
                <button onClick={() => setTeamForm(null)} className="text-sm px-4 py-2 rounded-lg border" style={{ borderColor: C.line, color: C.dim }}>{t("c.cancel")}</button>
                {targets.length === 0 && <span className="text-xs" style={{ color: C.warn }}>No hay jugadores que cumplan ese criterio.</span>}
              </div>
            </Card>
          );
        })()}

        <Card title="Pasar lista y registro rápido">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <input type="date" value={attDate} onChange={(e) => setAttDate(e.target.value)}
              className="px-3 py-2 rounded-lg border bg-transparent text-sm" style={{ borderColor: C.line, color: C.chalk }} />
            {CONTEXTS.slice(0, 2).map((c) => (
              <button key={c} onClick={() => setAttCtx(c)} className="text-xs px-3 py-2 rounded-full border"
                style={{ borderColor: attCtx === c ? AC : C.line, color: attCtx === c ? AC : C.dim }}>{c}</button>
            ))}
            <div className="ml-auto text-xs" style={{ color: C.dim }}>
              {Object.values(attToday).filter((v) => v === "ok").length} presentes ·{" "}
              <span style={{ color: C.warn }}>{Object.values(attToday).filter((v) => v === "late").length} retrasos</span> ·{" "}
              <span style={{ color: C.red }}>{Object.values(attToday).filter((v) => v === "absent").length} faltas</span>
            </div>
          </div>

          {canEdit && (
            <div className="flex flex-wrap gap-2 mb-3">
              <button onClick={() => players.forEach((p) => setAtt(p.id, "ok"))}
                className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: C.line, color: C.chalk }}>✓ Marcar todos presentes</button>
              <button onClick={() => setAttend((a) => ({ ...a, [attKey]: {} }))}
                className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: C.line, color: C.dim }}>Limpiar lista del día</button>
            </div>
          )}

          <div className="space-y-1.5">
            {players.map((p) => {
              const st = attToday[p.id];
              const faltas = attCount(p.id, "absent"), retrasos = attCount(p.id, "late");
              const inc = incidents.filter((i) => i.pid === p.id && i.state !== "anulada").length;
              return (
                <div key={p.id} className="rounded-lg border p-2.5" style={{ borderColor: C.line, background: C.panel2 }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 min-w-[150px] flex-1">
                      <Avatar p={p} size={28} />
                      <div className="min-w-0">
                        <div className="text-sm truncate" style={{ color: C.chalk }}>#{p.d} {p.n}</div>
                        <div className="text-[10px]" style={{ color: C.dim }}>
                          {faltas} falta(s) · {retrasos} retraso(s) · {inc} incidencia(s)
                          {!hasSigned(p.id, "d1") && <span style={{ color: C.warn }}> · ⚠ sin firmar</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {ATT_STATES.map((a) => (
                        <button key={a.k} disabled={!canEdit} onClick={() => setAtt(p.id, a.k)} title={a.label}
                          className="w-9 h-9 rounded-lg border text-sm disabled:opacity-40"
                          style={{ borderColor: st === a.k ? a.color : C.line, background: st === a.k ? a.color : "transparent", color: st === a.k ? "#141414" : C.dim }}>
                          {a.icon}
                        </button>
                      ))}
                      {canEdit && (
                        <button onClick={() => setQuickPid(quickPid === p.id ? null : p.id)}
                          className="h-9 px-3 rounded-lg border text-xs font-display uppercase tracking-wide"
                          style={{ borderColor: quickPid === p.id ? AC : C.line, color: quickPid === p.id ? AC : C.dim }}>⚠ Conducta</button>
                      )}
                    </div>
                  </div>
                  {quickPid === p.id && (
                    <div className="mt-2 pt-2 border-t flex flex-wrap gap-1.5" style={{ borderColor: C.line }}>
                      {QUICK_NORMS.map((code) => {
                        const n = normOf(code);
                        return (
                          <button key={code} onClick={() => quickIncident(p.id, code)}
                            className="text-[11px] px-2.5 py-1.5 rounded-full border"
                            style={{ borderColor: C.line, color: n.g === "grave" ? C.red : C.warn }}>
                            {code} · {n.t}
                          </button>
                        );
                      })}
                      <button onClick={() => { setDiscForm({ pid: String(p.id), date: attDate, ctx: attCtx, norm: "L1", card: "none", measure: [], amount: 0, desc: "" }); setQuickPid(null); }}
                        className="text-[11px] px-2.5 py-1.5 rounded-full border" style={{ borderColor: AC, color: AC }}>Otra… (formulario completo)</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-[11px] mt-3 leading-relaxed" style={{ color: C.dim }}>
            Marcar <strong>Retraso</strong> o <strong>Falta</strong> crea automáticamente la incidencia correspondiente del código (L1
            puntualidad, L2 comunicación de ausencias), pendiente de validar por el cuerpo técnico. <strong>Justificada</strong> no genera
            incidencia.
          </div>
          <div className="text-[11px] mt-2 leading-relaxed" style={{ color: C.dim }}>
            Esto es para retrasos y faltas con consecuencia. Si solo quieres saber quién ha venido hoy y por qué —estudios, enfermedad,
            lesión—, sin que abra ninguna incidencia, usa <button onClick={() => setTab("asistencia")} className="underline" style={{ color: AC }}>Asistencia</button>.
          </div>
        </Card>

        <Card title="Historial de incidencias">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {chips.map(([k, l]) => (
              <button key={k} onClick={() => setDiscFilter(k)} className="text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: discFilter === k ? AC : C.line, color: discFilter === k ? AC : C.dim }}>{l}</button>
            ))}
            <select value={discPid} onChange={(e) => setDiscPid(e.target.value)} className="ml-auto text-xs px-3 py-1.5 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.dim }}>
              <option value="all" style={{ background: C.panel }}>Todos los jugadores</option>
              {players.map((p) => (<option key={p.id} value={p.id} style={{ background: C.panel }}>#{p.d} {p.n}</option>))}
            </select>
          </div>
          {list.length === 0 && <div className="text-sm" style={{ color: C.dim }}>No hay incidencias con este filtro.</div>}
          <div className="space-y-2">
            {list.map((i) => {
              const n = normOf(i.norm); const cd = cardOf(i.card);
              return (
                <div key={i.id} className="rounded-lg border p-3" style={{ borderColor: C.line, background: C.panel2, opacity: i.state === "anulada" ? 0.5 : 1 }}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="font-display text-base" style={{ color: C.chalk }}>
                        {cd.k !== "none" && <span className="mr-1">{cd.short}</span>}{pName(i.pid)}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: C.dim }}>
                        {i.date} · {i.ctx} · <span style={{ color: n.g === "grave" ? C.red : C.warn }}>{i.norm} {n.t}</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-display uppercase tracking-wide px-2 py-1 rounded border shrink-0"
                      style={{ borderColor: i.state === "validada" ? C.green : i.state === "anulada" ? C.line : C.warn, color: i.state === "validada" ? C.green : i.state === "anulada" ? C.dim : C.warn }}>
                      {i.state === "registrada" ? "Pendiente de validar" : i.state}
                    </div>
                  </div>
                  {i.desc && <div className="text-sm mt-2" style={{ color: C.chalk }}>{i.desc}</div>}
                  {i.measure?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {i.measure.map((m) => (<span key={m} className="text-[10px] px-2 py-0.5 rounded-full border" style={{ borderColor: C.line, color: C.dim }}>{m}</span>))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                    {Number(i.amount) > 0 && (
                      <span className="px-2 py-1 rounded border" style={{ borderColor: C.line, color: i.pay === "pagada" ? C.green : C.red }}>
                        {i.amount} € · {i.pay === "pagada" ? "pagada" : i.pay === "condonada" ? "condonada" : "pendiente"}
                      </span>
                    )}
                    {Number(i.amount) > 0 && can("manageDocs") && i.pay === "pendiente" && (
                      <>
                        <button onClick={() => setPay(i.id, "pagada")} className="px-2 py-1 rounded border" style={{ borderColor: C.green, color: C.green }}>Marcar pagada</button>
                        <button onClick={() => setPay(i.id, "condonada")} className="px-2 py-1 rounded border" style={{ borderColor: C.line, color: C.dim }}>Condonar</button>
                      </>
                    )}
                    <button onClick={() => toggleFam(i.id)} className="px-2 py-1 rounded border" style={{ borderColor: i.fam ? C.green : C.line, color: i.fam ? C.green : C.dim }}>
                      {i.fam ? "✓ Familia informada" : "Marcar familia informada"}
                    </button>
                    {i.batch && <span className="px-2 py-1 rounded border" style={{ borderColor: C.line, color: C.dim }}>Lote colectivo</span>}
                    {canVal && i.state === "registrada" && (
                      <>
                        <button onClick={() => setIncState(i.id, "validada")} className="px-2 py-1 rounded font-semibold" style={{ background: AC, color: C.sobre }}>Validar</button>
                        <button onClick={() => setIncState(i.id, "anulada")} className="px-2 py-1 rounded border" style={{ borderColor: C.red, color: C.red }}>Anular</button>
                        {i.batch && <button onClick={() => annulBatch(i.batch)} className="px-2 py-1 rounded border" style={{ borderColor: C.red, color: C.red }}>Anular lote entero</button>}
                      </>
                    )}
                    <span className="ml-auto" style={{ color: C.dim }}>{i.by}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Resumen por jugador">
          {rank.length === 0 ? <div className="text-sm" style={{ color: C.dim }}>Sin incidencias registradas.</div> : (
            <div className="space-y-1.5">
              <div className="grid grid-cols-12 gap-2 text-[10px] font-display uppercase tracking-wide pb-1 border-b" style={{ borderColor: C.line, color: C.dim }}>
                <div className="col-span-6">Jugador</div><div className="col-span-2 text-center">🟨</div><div className="col-span-2 text-center">🟥</div><div className="col-span-2 text-right">Pendiente</div>
              </div>
              {rank.map((x) => (
                <div key={x.p.id} className="grid grid-cols-12 gap-2 text-sm py-1.5 border-b last:border-0" style={{ borderColor: C.line, color: C.chalk }}>
                  <div className="col-span-6 truncate">
                    #{x.p.d} {x.p.n}
                    {!hasSigned(x.p.id, "d1") && <span title="No ha firmado el código" style={{ color: C.warn }}> ·⚠</span>}
                    {levesDe(x.p.id) >= 3 && (
                      <button onClick={() => canEdit && setDiscForm({ pid: String(x.p.id), date: attDate, ctx: attCtx, norm: "G5", card: "none", measure: ["Pérdida de minutos"], amount: 0, desc: `Reiteración: ${levesDe(x.p.id)} faltas leves acumuladas.` })}
                        title="Reiteración de faltas leves — el código lo tipifica como falta grave G5"
                        className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full border align-middle" style={{ borderColor: C.red, color: C.red }}>
                        G5 reiteración
                      </button>
                    )}
                  </div>
                  <div className="col-span-2 text-center">{x.y || "—"}</div>
                  <div className="col-span-2 text-center">{x.r || "—"}</div>
                  <div className="col-span-2 text-right" style={{ color: x.due ? C.red : C.dim }}>{x.due ? x.due + " €" : "—"}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {(pot.pend > 0 || pot.paid > 0) && (
          <Card title={isYouth ? "Sanciones económicas" : "Bote del equipo"}>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="font-display text-3xl font-semibold" style={{ color: C.red }}>{pot.pend} €</div>
                <div className="text-[11px]" style={{ color: C.dim }}>pendiente de cobro</div>
              </div>
              <div>
                <div className="font-display text-3xl font-semibold" style={{ color: C.green }}>{pot.paid} €</div>
                <div className="text-[11px]" style={{ color: C.dim }}>ya abonado</div>
              </div>
            </div>
            {isYouth && (
              <div className="text-[11px] mt-3 leading-relaxed" style={{ color: C.dim }}>
                Recuerda que el código disciplinario de este equipo no contempla multas: sus ocho medidas son educativas. Si el club cobra
                importes, deben estar recogidos en una normativa firmada por las familias.
              </div>
            )}
          </Card>
        )}
      </div>
    );
  };

  /* ================= ASISTENCIA DIARIA ================= */
  const renderAsistencia = () => {
    const diaData = asistencia[asistFecha] || {};
    const contar = (k) => players.filter((p) => diaData[p.id] === k).length;
    const sinMarcar = players.filter((p) => !diaData[p.id]).length;
    const hoy = asistFecha === hoyISO();
    const sumarDias = (delta) => {
      setAsistFecha(sumarDiasISO(asistFecha, delta));
      setAsistPick(null);
    };
    const fechaTexto = new Date(`${asistFecha}T00:00:00`).toLocaleDateString(lang === "es" ? "es-ES" : lang, { weekday: "long", day: "numeric", month: "long" });
    const fechaLarga = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);
    return (
      <div className="space-y-4">
        <Card title={t("as.title")}>
          <div className="text-xs mb-3" style={{ color: C.dim }}>{t("as.subtitle")}</div>

          <div className="flex items-center justify-between gap-2 mb-4">
            <button onClick={() => sumarDias(-1)} className="w-9 h-9 rounded-lg border font-display" style={{ borderColor: C.line, color: C.chalk }}>‹</button>
            <div className="text-center">
              <div className="font-display text-base sm:text-lg" style={{ color: C.chalk }}>{fechaLarga}</div>
              {!hoy && (
                <button onClick={() => { setAsistFecha(hoyISO()); setAsistPick(null); }} className="text-[11px] underline" style={{ color: AC }}>
                  {t("as.today")}
                </button>
              )}
            </div>
            <button onClick={() => sumarDias(1)} className="w-9 h-9 rounded-lg border font-display" style={{ borderColor: C.line, color: C.chalk }}>›</button>
          </div>

          {can("editSquad") && players.length > 0 && (
            <button onClick={marcarTodosPresentes}
              className="w-full mb-4 min-h-12 rounded-lg font-display uppercase tracking-wide font-semibold" style={{ background: AC, color: C.sobre }}>
              {t("as.markAll")}
            </button>
          )}

          {!players.length ? (
            <div className="text-sm" style={{ color: C.dim }}>{t("as.noPlayers")}</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {players.map((p) => {
                const estado = diaData[p.id] || null;
                const color = estado ? asistColor(estado) : C.line;
                return (
                  <div key={p.id} className="rounded-lg border overflow-hidden" style={{ borderColor: color }}>
                    {/* Un solo toque marca presente (o quita la marca si ya lo estaba). Es
                        el camino rápido para el día normal, en el que casi todos vienen. */}
                    <button onClick={() => tocarAsistencia(p.id)} disabled={!can("editSquad")}
                      className="w-full min-h-16 flex flex-col items-center justify-center py-2 disabled:opacity-70">
                      <span className="font-display text-lg tabular-nums" style={{ color: estado ? color : C.dim }}>{p.d}</span>
                      <span className="text-[10px] truncate max-w-full px-1" style={{ color: C.chalk }}>{p.n.split(" ")[0]}</span>
                    </button>
                    {can("editSquad") && (
                      <button onClick={() => setAsistPick(asistPick === p.id ? null : p.id)}
                        className="w-full text-[10px] py-1 border-t truncate px-1" style={{ borderColor: C.line, color, background: C.panel2 }}>
                        {asistLabel(estado, t)}
                      </button>
                    )}
                    {asistPick === p.id && (
                      <div className="p-1.5 border-t grid grid-cols-2 gap-1" style={{ borderColor: C.line, background: C.panel2 }}>
                        {ASISTENCIA_TIPOS.map((k) => (
                          <button key={k} onClick={() => { marcarAsistencia(p.id, k); setAsistPick(null); }}
                            className="text-[10px] px-1 py-1.5 rounded border leading-tight" style={{ borderColor: asistColor(k), color: asistColor(k) }}>
                            {asistLabel(k, t)}
                          </button>
                        ))}
                        {estado && (
                          <button onClick={() => { marcarAsistencia(p.id, null); setAsistPick(null); }}
                            className="col-span-2 text-[10px] px-1 py-1.5 rounded" style={{ color: C.dim }}>
                            {t("as.reset")}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-[11px] mt-4 leading-relaxed" style={{ color: C.dim }}>{t("as.discNote")}</div>
        </Card>

        {players.length > 0 && (
          <Card title="Resumen del día">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[["presente", contar("presente")], ...ASISTENCIA_TIPOS.map((k) => [k, contar(k)]), ["sinMarcar", sinMarcar]].map(([k, n]) => (
                <div key={k} className="rounded-lg border p-2.5 text-center" style={{ borderColor: C.line, background: C.panel2 }}>
                  <div className="font-display text-2xl tabular-nums" style={{ color: k === "sinMarcar" ? C.dim : asistColor(k) }}>{n}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: C.dim }}>{k === "sinMarcar" ? t("as.unmarked") : asistLabel(k, t)}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  };

  /* ================= PROPUESTAS DEL SEGUNDO ENTRENADOR =================
     Con sesión real (login de verdad, session.team.rec existe) las propuestas
     viven en Airtable (tabla Propuestas, ver ?res=propuestas en
     airtable.mts) y se cargan/escriben por API. En la demo o sin backend
     (session.team no tiene .rec) siguen siendo solo estado local, como antes. */
  const esSesionRealConEquipo = !!session?.team?.rec;
  const canResolveProposals = () =>
    session?.role === "master" || session?.role === "director" || tieneRolFront(session, "entrenador");

  const refreshProposals = async () => {
    if (!esSesionRealConEquipo) return;
    const recs = await airProposalsList(session.team.rec);
    if (!recs) return;
    setProposals(recs.map((r) => ({
      id: r.id, categoryId: session.team.rec, type: r.type,
      proposedBy: r.proposedBy, proposedData: r.data, status: r.status,
      approvedBy: r.approvedBy, approvedData: r.status === "approved" ? r.data : null,
      date: r.date, resolvedDate: r.resolvedDate || null,
    })));
  };
  useEffect(() => {
    if (esSesionRealConEquipo) refreshProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.team?.rec]);

  const proposeChange = async (type, data) => {
    if (!canProposeChanges()) return;
    if (esSesionRealConEquipo) {
      await airProposalCreate(session.team.rec, type, data);
      await refreshProposals();
      return;
    }
    const proposal = {
      id: `prop_${Date.now()}`,
      categoryId: miEquipoKey(),
      type, // "lineup"|"squad"|"calendar"|"call"|"training"
      proposedBy: session.userId,
      proposedData: data,
      status: "pending",
      approvedBy: null,
      date: new Date().toISOString(),
    };
    setProposals((ps) => [...ps, proposal]);
  };

  const approveProposal = async (proposalId, approveData = null) => {
    if (!canResolveProposals()) return;
    const proposal = proposals.find((p) => p.id === proposalId);
    if (!proposal) return;

    // Aplicar el cambio inmediatamente
    const dataToApply = approveData || proposal.proposedData;
    const resolvedDate = new Date().toISOString();
    await applyApprovedProposal({ ...proposal, status: "approved", approvedData: dataToApply });

    if (esSesionRealConEquipo) {
      await airProposalResolve(proposalId, "approved");
      await refreshProposals();
      return;
    }
    setProposals((ps) =>
      ps.map((p) =>
        p.id === proposalId
          ? { ...p, status: "approved", approvedBy: session.userId, approvedData: dataToApply, resolvedDate }
          : p
      )
    );
  };

  const rejectProposal = async (proposalId) => {
    if (!canResolveProposals()) return;
    if (esSesionRealConEquipo) {
      await airProposalResolve(proposalId, "rejected");
      await refreshProposals();
      return;
    }
    const resolvedDate = new Date().toISOString();
    setProposals((ps) =>
      ps.map((p) =>
        p.id === proposalId ? { ...p, status: "rejected", approvedBy: session.userId, resolvedDate } : p
      )
    );
  };

  /* Con quién se compara `p.categoryId` para saber "es de mi equipo". Con
     cuenta real (esSesionRealConEquipo), Airtable YA filtró por equipo al
     traer la lista (airProposalsList(session.team.rec)), así que aquí basta
     con no filtrar dos veces por un campo que puede no significar lo mismo
     para todos: session.categoryId sale de CATEGORIES_INIT, un catálogo solo
     de demo que al director lo resuelve por CLUB (sin mirar su id real) y a
     entrenador/segundo por id -de ahí que un director real y su propio
     entrenador real acabaran con categoryId distinto en el mismo equipo, y el
     director no viera nunca las propuestas que sí le llegaban. Con cuenta
     real, refreshProposals ya iguala `categoryId` a session.team.rec en cada
     propuesta leída, así que comparar contra team.rec (no contra categoryId)
     es lo único que da el mismo resultado para cualquier rol del equipo. */
  const miEquipoKey = () => session?.team?.rec || session?.categoryId;

  const getPendingProposals = () =>
    proposals.filter(
      (p) =>
        p.status === "pending" &&
        p.categoryId === miEquipoKey() &&
        canResolveProposals()
    );

  const getProposalHistory = () =>
    proposals.filter(
      (p) =>
        p.categoryId === miEquipoKey() &&
        (p.status === "approved" || p.status === "rejected")
    );

  /* Propuestas aceptadas, para el panel del entrenador y del director: solo
     aprobadas, la más reciente arriba (por cuándo se aceptó, no por cuándo
     se propuso), con quién la hizo a la vista. */
  const getAcceptedProposals = () =>
    proposals
      .filter((p) => p.status === "approved" && p.categoryId === miEquipoKey() && canResolveProposals())
      .sort((a, b) => new Date(b.resolvedDate || b.date) - new Date(a.resolvedDate || a.date));

  const getProposalTypeLabel = (type) => {
    const labels = {
      lineup: "Alineación",
      squad: "Plantilla",
      calendar: "Calendario",
      call: "Convocatoria",
      training: "Entrenamiento",
    };
    return labels[type] || type;
  };

  /* Única propuesta pendiente de ESTE usuario para un tipo dado: mientras
     tenga una esperando turno no se le deja mandar otra, para no acumular
     duplicados esperando la misma aprobación. */
  const miPropuestaPendiente = (type) =>
    proposals.find((p) => p.status === "pending" && p.type === type && p.proposedBy === session?.userId);

  /* Único punto que de verdad mueve a un jugador a un puesto, use quien lo
     llame el camino de "toca el campo primero" o el de "toca al jugador
     primero": quita al jugador de cualquier otro puesto donde estuviera
     (nunca en dos demarcaciones a la vez) y limpia ambas selecciones. */
  const asignarJugadorAPuesto = (slotId, playerId) => {
    if (canProposeChanges() && miPropuestaPendiente("lineup")) return;
    setLineupSmart((base) => {
      const next = { ...base };
      Object.keys(next).forEach((k) => { if (next[k] === playerId) delete next[k]; });
      next[slotId] = playerId;
      return next;
    });
    setSelSlot(null);
    setSelPlayer(null);
  };
  /* El segundo entrenador manda el borrador entero de una vez, en vez de
     una propuesta por cada toque. Se limpia el borrador al mandarla: el
     aviso de "pendiente de aprobación" (miPropuestaPendiente) es lo que
     queda a la vista mientras espera turno. */
  const enviarPropuestaAlineacion = async () => {
    if (!lineupDraft || miPropuestaPendiente("lineup")) return;
    await proposeChange("lineup", lineupDraft);
    setLineupDraft(null);
  };

  const updateSquadWithProposal = (updateFn) => {
    if (canProposeChanges()) {
      const newSquad = updateFn(players);
      proposeChange("squad", newSquad);
    } else {
      setPlayers(updateFn);
    }
  };

  const updateCalendarWithProposal = (newCalendar) => {
    if (canProposeChanges()) {
      proposeChange("calendar", newCalendar);
    } else {
      setCalls(newCalendar);
    }
  };

  const applyApprovedProposal = async (proposal) => {
    if (proposal.status !== "approved") return;
    const data = proposal.approvedData || proposal.proposedData;

    switch (proposal.type) {
      case "lineup":
        setLineup(data);
        break;
      case "squad":
        setPlayers(data);
        break;
      case "calendar":
      case "call":
        setCalls(data);
        break;
      case "training": {
        /* A diferencia de alineación/plantilla/convocatoria (que solo viven
           en memoria hasta la próxima acción), el entrenamiento se publica
           de verdad en Airtable -es lo que "Guardar sesión completa" hacía
           antes de que el segundo pasara por aprobación-, así que aprobar
           la propuesta es el momento de publicarlo, no antes. */
        if (data?.meta) setTrainMeta(data.meta);
        if (Array.isArray(data?.blocks)) setTrainBlocks(data.blocks);
        if (Number(data?.target) > 0) setTrainTarget(data.target);
        if (session?.team?.rec && Array.isArray(data?.blocks) && data.blocks.length) {
          const nombre = [fechaLegible(data.meta?.fecha, lang) || new Date().toLocaleDateString("es-ES"), data.meta?.hora, data.meta?.objetivo]
            .filter(Boolean).join(" · ");
          const out = await airPlantillaNueva({
            nombre, plantilla: false, objetivo: data.meta?.objetivo || "",
            duracion: data.blocks.reduce((n, b) => n + (Number(b.dur) || 0), 0),
            bloques: data.blocks, fecha: data.meta?.fecha, hora: data.meta?.hora,
            teamRec: session.team.rec, clubRec: clubInfo.rec || undefined,
          });
          /* Recarga inmediata: sin esto, quien acaba de aprobar no ve la
             sesión reflejada en su propio Inicio/Entrenamiento hasta la
             próxima vez que cargue esos apartados. */
          if (out?.ok) cargarPlantillas();
        }
        break;
      }
      default:
        break;
    }
  };

  /* ================= NORMATIVA Y FIRMAS ================= */
  const toggleSign = (docId, kind, id) => {
    setSigns((sg) => {
      const cur = sg[docId] || { players: [], staff: [] };
      const arr = cur[kind] || [];
      const next = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
      return { ...sg, [docId]: { ...cur, [kind]: next } };
    });
  };
  const renderDocs = () => {
    const d = docs.find((x) => x.id === docSel) || docs[0];
    const sg = signs[d.id] || { players: [], staff: [] };
    const needPlayers = d.signers.some((x) => x === "Jugador" || x === "Padre/Madre/Tutor");
    const needStaff = d.signers.some((x) => x === "Cuerpo técnico");
    const staff = users;
    const canManage = can("manageDocs");
    /* Los documentos de firma (código disciplinario, RGPD…) usan el
       vocabulario de "firma". El plan de pretemporada no se firma: el cuerpo
       técnico confirma quién ha hecho los ejercicios, así que cambia el
       verbo y los títulos para no hablar de "firmar" un entrenamiento. */
    const isExercise = d.kind === "exercise";
    const doneLabel = isExercise ? "✓ Realizado" : "✓ Firmado";
    const chipLabel = isExercise ? "Confirma" : "Firma";
    return (
      <div className="space-y-4">
        <Card title="Normativa del club">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {docs.map((x) => (
              <button key={x.id} onClick={() => setDocSel(x.id)} className="text-left rounded-lg border p-3"
                style={{ borderColor: docSel === x.id ? AC : C.line, background: docSel === x.id ? C.panel2 : "transparent" }}>
                <div className="font-display text-sm" style={{ color: C.chalk }}>📑 {x.title}</div>
                <div className="text-[11px] mt-1" style={{ color: C.dim }}>{x.type} · {x.season} · {x.v}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card title={d.title}>
          <div className="text-sm" style={{ color: C.chalk }}>{d.summary}</div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {d.signers.map((x) => (<span key={x} className="text-[10px] px-2 py-0.5 rounded-full border" style={{ borderColor: C.line, color: C.dim }}>{chipLabel}: {x}</span>))}
          </div>
          <div className="text-[11px] mt-3" style={{ color: C.dim }}>Publicado el {d.date} · versión {d.v}{d.required ? " · firma obligatoria" : ""}</div>
          {d.file && (
            <div className="flex gap-2 mt-3">
              <a href={d.file} target="_blank" rel="noreferrer" className="text-sm px-3 py-1.5 rounded-lg font-display uppercase tracking-wide" style={{ background: AC, color: C.sobre }}>
                Ver PDF
              </a>
              <a href={d.file} download className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: C.line, color: C.chalk }}>
                Descargar
              </a>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {needPlayers && (
            <Card title={isExercise ? "Ejercicios · jugadores" : "Firmas · jugadores y familias"}>
              <div className="text-xs mb-2" style={{ color: C.dim }}>{sg.players.length} de {players.length} {isExercise ? "realizados" : "firmadas"}<Bar2 a={sg.players.length} b={players.length} /></div>
              <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                {players.map((p) => {
                  const ok = sg.players.includes(p.id);
                  return (
                    <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0" style={{ borderColor: C.line, color: C.chalk }}>
                      <span className="truncate">#{p.d} {p.n}</span>
                      <button disabled={!canManage} onClick={() => toggleSign(d.id, "players", p.id)} className="text-[10px] font-display uppercase tracking-wide px-2 py-1 rounded border disabled:opacity-60"
                        style={{ borderColor: ok ? C.green : C.warn, color: ok ? C.green : C.warn }}>{ok ? doneLabel : "Pendiente"}</button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
          {needStaff && (
            <Card title={isExercise ? "Confirmación · cuerpo técnico" : "Firmas · cuerpo técnico"}>
              <div className="text-xs mb-2" style={{ color: C.dim }}>{sg.staff.length} de {staff.length} {isExercise ? "confirmados" : "firmadas"}<Bar2 a={sg.staff.length} b={staff.length} /></div>
              <div className="space-y-1">
                {staff.map((u) => {
                  const ok = sg.staff.includes(u.id);
                  return (
                    <div key={u.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0" style={{ borderColor: C.line, color: C.chalk }}>
                      <span className="truncate">{u.name} <span style={{ color: C.dim }}>· {ROLES[u.role]?.label}</span></span>
                      <button disabled={!canManage} onClick={() => toggleSign(d.id, "staff", u.id)} className="text-[10px] font-display uppercase tracking-wide px-2 py-1 rounded border disabled:opacity-60"
                        style={{ borderColor: ok ? C.green : C.warn, color: ok ? C.green : C.warn }}>{ok ? doneLabel : "Pendiente"}</button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {d.id === "d1" && (
          <Card title="Control de sanciones">
            <div className="text-sm" style={{ color: C.chalk }}>
              {pendingSign === 0
                ? "Toda la plantilla ha firmado el código disciplinario."
                : `${pendingSign} jugador(es) sin firmar el código disciplinario.`}
            </div>
            <div className="text-[11px] mt-2 leading-relaxed" style={{ color: C.dim }}>
              Una medida disciplinaria solo es exigible si la persona conoce y ha aceptado la norma. Antes de aplicar cualquier sanción
              —y con más motivo si es económica— comprueba aquí que la firma está registrada.
            </div>
          </Card>
        )}
      </div>
    );
  };

  /* Datos del próximo partido para el cartel de inicio. nextMatchFix viene del
     calendario importado (solo partidos de verdad, no avisos de pretemporada);
     si no hay ninguno se cae a matchInfo, que es lo que el entrenador escribe
     a mano en la convocatoria. */
  const rivalProx = (session && nextMatchFix)
    ? (nextMatchFix.home.toLowerCase().includes(String(session.club).toLowerCase().slice(0, 6)) ? nextMatchFix.away : nextMatchFix.home)
    : matchInfo.rival;
  const horaProx = nextMatchFix ? nextMatchFix.time : matchInfo.hora;
  const lugarProx = nextMatchFix ? nextMatchFix.place : matchInfo.lugar;
  /* Días que faltan. Se compara a mediodía para que el cambio de hora no
     desplace un día entero la cuenta. */
  const diasProx = (() => {
    const iso = nextMatchFix?.date;
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    const [y, m, d] = iso.split("-").map(Number);
    const destino = new Date(y, m - 1, d, 12, 0, 0);
    const hoy = new Date(); hoy.setHours(12, 0, 0, 0);
    return Math.max(0, Math.round((destino - hoy) / 86400000));
  })();
  const fechaProx = (() => {
    if (!nextMatchFix?.date) return matchInfo.fecha || t("h.noDate");
    const [y, m, d] = nextMatchFix.date.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(lang === "es" ? "es-ES" : lang, { weekday: "long", day: "numeric", month: "long" });
  })();

  const renderHome = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* ================= CARTEL DE PARTIDO =================
          Antes esto era el escudo y el nombre del club centrados, que no
          cuentan nada nuevo: ya están en la cabecera. Un entrenador abre la
          app un viernes para saber contra quién juega, cuándo y con cuántos
          cuenta — así que eso es lo que ocupa el sitio bueno.
          La cuenta atrás en grande porque es el único dato que cambia solo y
          el que se busca de un vistazo. */}
      <div className="lg:col-span-3 rounded-lg border overflow-hidden" style={{ borderColor: C.line, background: C.panel }}>
        <div className="flex items-center gap-2.5 px-4 pt-3.5">
          <span className="font-display text-[11px] uppercase tracking-[0.18em] shrink-0" style={{ color: AC }}>
            {t("h.nextMatch")}{nextMatchFix?.j ? ` · ${t("h.round")} ${nextMatchFix.j}` : ""}
          </span>
          <span className="h-px flex-1" style={{ background: C.line }} />
        </div>

        <div className="px-4 pb-4 pt-2 flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-x-6 gap-y-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Crest src={clubInfo.crest || crest || escudoDe(session.club)} name={session.club} size={56} />
            <div className="min-w-0">
              <div className="font-display text-2xl sm:text-4xl font-semibold leading-none truncate" style={{ color: C.chalk }}>
                {session.team?.name}
              </div>
              <div className="font-display text-lg sm:text-2xl leading-tight truncate" style={{ color: AC }}>
                <span className="text-sm" style={{ color: C.dim }}>vs </span>{rivalProx}
              </div>
              <div className="text-[12px] mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5" style={{ color: C.dim }}>
                <span>{fechaProx}</span>
                {horaProx && <span>· {horaProx}</span>}
                {lugarProx && <span>· {lugarProx}</span>}
                {clubInfo.maps && (
                  <a href={clubInfo.maps} target="_blank" rel="noreferrer" className="underline" style={{ color: AC }}>
                    {t("h.howTo")}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Cuenta atrás y disponibles: los dos números que decides mirar.
              En móvil, fila propia a todo el ancho (justify-between) para que
              no le quite sitio al nombre del equipo y del rival de arriba —
              antes competían en la misma fila y los truncaba a "I...". */}
          <div className="flex items-center justify-between sm:justify-start gap-6 sm:shrink-0">
            {/* La cuenta atrás solo aparece si hay una fecha real que contar.
                Sin calendario importado la fecha es texto libre ("Domingo
                27"), y poner "— SIN FECHA" al lado de una fecha que sí se ve
                escrita se contradice. Mejor no decir nada. */}
            {diasProx != null && (
              <div className="text-center">
                <div className="font-display text-5xl sm:text-6xl font-bold leading-none tabular-nums" style={{ color: diasProx === 0 ? C.green : C.chalk }}>
                  {diasProx === 0 ? "▶" : diasProx}
                </div>
                <div className="font-display text-[10px] uppercase tracking-[0.18em] mt-1" style={{ color: diasProx === 0 ? C.green : C.dim }}>
                  {diasProx === 0 ? t("h.today") : diasProx === 1 ? t("h.day") : t("h.days")}
                </div>
              </div>
            )}
            <div className="text-center">
              <div className="font-display text-5xl sm:text-6xl font-bold leading-none tabular-nums" style={{ color: avail < 11 ? C.warn : C.chalk }}>{avail}</div>
              <div className="font-display text-[10px] uppercase tracking-[0.18em] mt-1" style={{ color: C.dim }}>{t("h.available")}</div>
            </div>
          </div>
        </div>

        {/* Lo que se hace de verdad antes de un partido, en orden. */}
        <div className="flex flex-wrap gap-2 px-4 pb-4">
          {visibleTabs.includes("convocatoria") && (
            <button onClick={() => setTab("convocatoria")} className="font-display uppercase tracking-wide text-sm px-4 py-2.5 rounded-lg border" style={{ borderColor: C.line, background: C.panel2, color: C.chalk }}>
              <Icono n="convocatoria" s={16} /> {t("nav.convocatoria")}
            </button>
          )}
          {visibleTabs.includes("alineacion") && (
            <button onClick={() => setTab("alineacion")} className="font-display uppercase tracking-wide text-sm px-4 py-2.5 rounded-lg border" style={{ borderColor: C.line, background: C.panel2, color: C.chalk }}>
              <Icono n="alineacion" s={16} /> {t("nav.alineacion")}
            </button>
          )}
          {can("events") && (
            <button onClick={() => setTab("partido")} className="font-display uppercase tracking-wide text-sm px-4 py-2.5 rounded-lg font-semibold" style={{ background: AC, color: C.sobre }}>
              <Icono n="partido" s={16} /> {t("h.startMatch")}
            </button>
          )}
        </div>
      </div>

      {/* Notificaciones de propuestas del segundo entrenador. Antes solo las
          veía el entrenador principal (session?.role === "entrenador"): el
          director deportivo, que también puede resolverlas
          (canResolveProposals), se quedaba sin enterarse. */}
      {canResolveProposals() && getPendingProposals().length > 0 && (
        <Card title="⚠️ Propuestas pendientes de aprobación" className="lg:col-span-3" style={{ borderColor: C.warn, background: `${C.warn}10` }}>
          <div className="space-y-3">
            {getPendingProposals().map((p) => {
              const proposer = users.find((u) => u.id === p.proposedBy);
              const typeLabel = getProposalTypeLabel(p.type);

              let detalle = "";
              if (p.type === "lineup" && p.proposedData) {
                const cambios = Object.values(p.proposedData).filter(Boolean).length;
                detalle = ` · ${cambios} puestos cubiertos`;
              } else if (p.type === "squad" && Array.isArray(p.proposedData)) {
                detalle = ` · ${p.proposedData.length} jugadores`;
              } else if (p.type === "training" && p.proposedData) {
                const min = (p.proposedData.blocks || []).reduce((n, b) => n + (Number(b.dur) || 0), 0);
                detalle = ` · ${(p.proposedData.blocks || []).length} bloques, ${min} min`;
              }

              return (
                <div key={p.id} className="flex flex-col gap-2 p-3 rounded-lg border" style={{ borderColor: C.line, background: C.panel2 }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm" style={{ color: C.chalk }}>
                        {proposer?.name || "Usuario desconocido"} propone
                      </div>
                      <div className="text-[12px] mt-0.5" style={{ color: AC }}>
                        {typeLabel}{detalle}
                      </div>
                      <div className="text-[11px] mt-1" style={{ color: C.dim }}>
                        {new Date(p.date).toLocaleString("es-ES")}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => approveProposal(p.id)}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap"
                        style={{ background: C.green, color: "white" }}
                      >
                        ✓ Aprobar
                      </button>
                      <button
                        onClick={() => rejectProposal(p.id)}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap"
                        style={{ background: C.red, color: "white" }}
                      >
                        ✕ Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Propuestas aceptadas: visible para quien puede resolverlas
          (entrenador, director, master), la más reciente arriba, con quién
          la propuso. Antes solo había un histórico mezclado (aceptadas y
          rechazadas juntas, sin nombre) escondido dentro del perfil. */}
      {canResolveProposals() && getAcceptedProposals().length > 0 && (
        <Card title="✓ Propuestas aceptadas" className="lg:col-span-3" style={{ borderColor: C.green, background: `${C.green}0d` }}>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {getAcceptedProposals().map((p) => {
              const proposer = users.find((u) => u.id === p.proposedBy);
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border" style={{ borderColor: C.line, background: C.panel2 }}>
                  <div className="min-w-0">
                    <div className="text-sm" style={{ color: C.chalk }}>
                      <span className="font-semibold">{getProposalTypeLabel(p.type)}</span>
                      <span style={{ color: C.dim }}> · propuesta por {proposer?.name || "usuario desconocido"}</span>
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: C.dim }}>
                      Aceptada el {new Date(p.resolvedDate || p.date).toLocaleString("es-ES")}
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-display uppercase tracking-wide px-2 py-1 rounded-full" style={{ background: C.green, color: "white" }}>✓ Aceptada</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Panel de Categorías por Rol */}
      {session?.categories && session.categories.length > 0 && (
        <Card title="Mis categorías" className="lg:col-span-3" style={{ borderColor: C.line }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {session.categories.map((cat) => {
              const canEdit = canEditCategory(cat);
              const canView = canViewCategory(cat);
              const isSecondo = tieneRolFront(session, "segundo");
              let badge = "";
              let badgeBg = "";
              let badgeColor = "";

              if (canEdit) {
                badge = "✏️ Edición";
                badgeBg = C.green;
                badgeColor = "white";
              } else if (isSecondo && canView) {
                badge = "📌 Propuestas";
                badgeBg = "#f39c12";
                badgeColor = "white";
              } else if (canView) {
                badge = "👁️ Lectura";
                badgeBg = C.line;
                badgeColor = C.dim;
              }

              const activa = selectedCategory === cat;
              return (
                <div key={cat} className="p-3 rounded-lg border flex flex-col gap-2"
                  style={{ borderColor: activa ? AC : C.line, background: activa ? `${AC}15` : C.panel2 }}>
                  <div className={`text-sm flex items-center gap-1.5 ${activa ? "font-bold" : "font-semibold"}`} style={{ color: activa ? AC : C.chalk }}>
                    <Icono n={iconoDeCategoria(cat)} s={14} />{cat}
                  </div>
                  {badge && (
                    <div className="text-xs px-2 py-1 rounded text-center" style={{ background: badgeBg, color: badgeColor }}>
                      {badge}
                    </div>
                  )}
                  {session.categories.length > 1 && (
                    <button onClick={() => setSelectedCategory(cat)}
                      className="text-xs px-2 py-1.5 rounded border font-semibold mt-auto"
                      style={{ borderColor: AC, color: AC, background: "transparent" }}>
                      Seleccionar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card title={t("ca.month")} className="lg:col-span-3">
        {(() => {
          const DIAS = diasSemanaCortos(lang);
          const { y, m } = calMonth;
          const primero = new Date(y, m, 1);
          /* getDay() da 0=domingo; se desplaza para que la semana empiece en lunes */
          const offset = (primero.getDay() + 6) % 7;
          const total = new Date(y, m + 1, 0).getDate();
          const iso = (d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const mover = (delta) => setCalMonth(({ y: yy, m: mm }) => {
            const nm = mm + delta;
            return { y: yy + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
          });
          const celdas = [];
          for (let i = 0; i < offset; i++) celdas.push(null);
          for (let d = 1; d <= total; d++) celdas.push(d);
          return (
            <>
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => mover(-1)} className="text-sm px-2.5 py-1 rounded-lg border" style={{ borderColor: C.line, color: C.chalk }}>‹</button>
                <div className="font-display text-lg uppercase tracking-wide" style={{ color: C.chalk }}>{mesLargo(y, m, lang)} {y}</div>
                <button onClick={() => mover(1)} className="text-sm px-2.5 py-1 rounded-lg border" style={{ borderColor: C.line, color: C.chalk }}>›</button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {DIAS.map((d) => <div key={d} className="text-[10px] font-display uppercase pb-1" style={{ color: C.dim }}>{d}</div>)}
                {celdas.map((d, i) => {
                  if (!d) return <div key={`x${i}`} />;
                  const fecha = iso(d);
                  const partidos = fixtures.filter((f) => f.date === fecha);
                  const dow = new Date(y, m, d).getDay();
                  const esEntreno = trainDays.includes(dow);
                  const planEse = trainMeta.fecha === fecha;
                  const hoy = fecha === todayISO;
                  return (
                    <div key={fecha} className="rounded-lg border p-1 min-h-[52px] text-left flex flex-col"
                      style={{ borderColor: hoy ? AC : C.line, background: hoy ? "rgba(54,69,79,.07)" : "transparent" }}>
                      <div className="text-[11px] font-display" style={{ color: hoy ? AC : C.chalk }}>{d}</div>
                      {partidos.map((f) => (
                        <div key={f.id} title={`${f.home} vs ${f.away} · ${f.time || ""} · ${f.place || ""}`}
                          className="mt-0.5 text-[8px] leading-tight px-1 rounded truncate"
                          style={{ background: AC, color: C.sobre }}>
                          {f.time || ""} {f.away || f.home}
                        </div>
                      ))}
                      {(esEntreno || planEse) && partidos.length === 0 && (
                        <div className="mt-0.5 text-[8px] leading-tight px-1 rounded truncate"
                          style={{ background: `${C.velo}0.14)`, color: C.dim }}>
                          {planEse ? trainMeta.hora || t("ca.legendTrain") : t("ca.legendTrain")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px]" style={{ color: C.dim }}>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: AC }} />{t("ca.legendMatch")}</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "rgba(47,107,79,.5)" }} />{t("ca.legendTrain")}</span>
              </div>
              {can("editTraining") && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px]" style={{ color: C.dim }}>{t("ca.trainDaysLabel")}</span>
                  {diasSemanaCortosDomingoPrimero(lang).map((lbl, idx) => (
                    <button key={idx} onClick={() => setTrainDays((ds) => ds.includes(idx) ? ds.filter((x) => x !== idx) : [...ds, idx])}
                      className="text-[11px] w-7 py-1 rounded border font-display"
                      style={{ borderColor: trainDays.includes(idx) ? C.green : C.line, background: trainDays.includes(idx) ? "rgba(47,107,79,.18)" : "transparent", color: trainDays.includes(idx) ? C.green : C.dim }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </Card>

      <Card title={t("h.nextTrain")} className="lg:col-span-2">
        {/* Primero la sesión YA PUBLICADA (Airtable, la ve todo el cuerpo
            técnico en cualquier dispositivo). Solo si no hay ninguna se cae
            al borrador de este dispositivo -y se avisa de que es eso, un
            borrador, no lo que ya sabe el resto del equipo-. Antes esto
            leía siempre trainBlocks/trainMeta (estado local sin sincronizar
            con nadie): el "próximo entrenamiento" que veía el entrenador en
            su Inicio no era necesariamente el mismo que veía su segundo, ni
            lo que había quedado publicado de verdad. */}
        {proximaSesionPublicada ? (() => {
          let bloques = [];
          try { bloques = JSON.parse(proximaSesionPublicada.bloques || "[]"); } catch { bloques = []; }
          const materiales = [...new Set(bloques.flatMap((b) => b.materials || []))];
          return (
            <>
              <div className="font-display text-2xl leading-tight" style={{ color: C.chalk }}>
                {proximaSesionPublicada.objetivo || t("h.noGoal")}
              </div>
              <div className="text-sm mt-1" style={{ color: C.dim }}>
                {[fechaLegible(proximaSesionPublicada.fecha, lang), proximaSesionPublicada.hora, proximaSesionPublicada.duracion ? `${proximaSesionPublicada.duracion} ${t("tr.min")}` : null].filter(Boolean).join(" · ")}
              </div>
              {materiales.length > 0 && (
                <div className="text-[12px] mt-2" style={{ color: C.dim }}>{t("tr.materials")}: {materiales.join(", ")}</div>
              )}
            </>
          );
        })() : trainBlocks.length || trainMeta.objetivo || trainMeta.fecha ? (
          <>
            <div className="font-display text-2xl leading-tight" style={{ color: C.chalk }}>
              {trainMeta.objetivo || t("h.noGoal")}
            </div>
            <div className="text-sm mt-1" style={{ color: C.dim }}>
              {[fechaLegible(trainMeta.fecha, lang), trainMeta.hora, trainTotal ? `${trainTotal} ${t("tr.min")}` : null].filter(Boolean).join(" · ")}
            </div>
            {trainMaterials.length > 0 && (
              <div className="text-[12px] mt-2" style={{ color: C.dim }}>{t("tr.materials")}: {trainMaterials.join(", ")}</div>
            )}
            {can("editTraining") && (
              <div className="text-[11px] mt-2" style={{ color: C.warn }}>Todavía sin publicar: de momento solo se ve en este dispositivo.</div>
            )}
          </>
        ) : (
          /* Vacío con salida, no un texto de ejemplo: antes aquí había una
             sesión inventada ("Viernes 26 · Transiciones defensivas") que
             parecía real y no lo era. */
          <div>
            <div className="text-sm" style={{ color: C.dim }}>{t("h.noTrain")}</div>
            {can("editTraining") && (
              <button onClick={() => setTab("entrenamiento")} className="mt-3 font-display uppercase tracking-wide text-sm px-4 py-2 rounded-lg border" style={{ borderColor: AC, color: AC }}>
                <Icono n="entrenamiento" s={16} /> {t("h.planTrain")}
              </button>
            )}
          </div>
        )}
      </Card>

      <Card title={t("h.available")}>
        <div className="flex items-baseline gap-3"><span className="font-display text-6xl font-bold" style={{ color: C.chalk }}>{avail}</span><span style={{ color: C.dim }}>/ {players.length}</span></div>
        <div className="mt-3 space-y-1">{out.map((p) => (<div key={p.id} className="text-sm flex items-center" style={{ color: C.chalk }}><Dot st={p.st} /> #{p.d} {p.n} · <span className="ml-1" style={{ color: C.dim }}>{p.st}</span></div>))}</div>
      </Card>
      <Card title={t("h.lessMin")}>
        {lowMin.map((p) => (<div key={p.id} className="flex justify-between text-sm py-1.5 border-b last:border-0" style={{ borderColor: C.line, color: C.chalk }}><span>#{p.d} {p.n}</span><span style={{ color: AC }}>{p.min} min</span></div>))}
      </Card>
      {/* Avisos derivados de los datos reales del equipo. Antes eran dos
          frases fijas escritas a mano ("Iker Molina (duda)", "Daniel Ruiz
          — carga alta 520 min") que no cambiaban nunca y que parecían un
          diagnóstico de verdad. Un aviso falso es peor que ningún aviso. */}
      <Card title={t("h.alerts")}>
        {(() => {
          const dudas = players.filter((p) => p.st === "duda");
          const lesionados = players.filter((p) => p.st === "lesionado");
          const pendUsers = can("viewUsers") ? users.filter((u) => u.status === "pendiente").length : 0;
          const avisos = [
            dudas.length && { c: C.warn, ico: "duda", txt: `${dudas.length} ${dudas.length === 1 ? t("h.aDoubt1") : t("h.aDoubtN")}: ${dudas.map((p) => p.n.split(" ")[0]).join(", ")}` },
            lesionados.length && { c: C.red, ico: "lesion", txt: `${lesionados.length} ${lesionados.length === 1 ? t("h.aInj1") : t("h.aInjN")}: ${lesionados.map((p) => p.n.split(" ")[0]).join(", ")}` },
            pendUsers > 0 && { c: AC, ico: "usuarios", txt: `${pendUsers} ${t("h.pending")}` },
            can("discipline") && pendingValid > 0 && { c: C.warn, ico: "disciplina", txt: `${pendingValid} ${t("h.aDisc")}` },
            can("viewDocs") && pendingSign > 0 && { c: C.warn, ico: "normativa", txt: `${pendingSign} ${t("h.aSign")}` },
            can("viewDocs") && pretempPend.length > 0 && { c: C.warn, ico: "normativa", txt: `${pretempPend.length} sin completar los ejercicios de pretemporada: ${pretempPend.map((p) => p.n.split(" ")[0]).join(", ")}` },
          ].filter(Boolean);
          if (!avisos.length) return <div className="text-sm" style={{ color: C.dim }}>{t("h.noAlerts")}</div>;
          return (
            <div className="space-y-2">
              {avisos.map((a, i) => (
                <div key={i} className="text-sm flex items-start gap-2" style={{ color: C.chalk }}>
                  <span className="shrink-0 flex items-center" style={{ color: a.c, height: "1.55em" }}><Icono n={a.ico} s={16} /></span>
                  <span>{a.txt}</span>
                </div>
              ))}
            </div>
          );
        })()}
      </Card>

      {/* Asistencia de hoy, de un vistazo: quién falta y por qué, sin tener
          que abrir la pestaña. Solo para quien puede pasar lista — a las
          familias no les corresponde ver la asistencia de toda la plantilla. */}
      {can("editSquad") && (
        <Card title={t("as.homeTitle")} className="lg:col-span-3">
          {(() => {
            const diaHoy = hoyISO();
            const diaData = asistencia[diaHoy] || {};
            const marcados = players.filter((p) => diaData[p.id]).length;
            if (!players.length) return <div className="text-sm" style={{ color: C.dim }}>{t("as.noPlayers")}</div>;
            if (!marcados) {
              return (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm" style={{ color: C.dim }}>{t("as.homeEmpty")}</div>
                  <button onClick={() => setTab("asistencia")} className="font-display uppercase tracking-wide text-sm px-4 py-2 rounded-lg font-semibold" style={{ background: AC, color: C.sobre }}>
                    <Icono n="asistencia" s={16} /> {t("as.homeCta")}
                  </button>
                </div>
              );
            }
            const ausentes = players.filter((p) => diaData[p.id] && diaData[p.id] !== "presente");
            return (
              <div>
                <div className="flex flex-wrap items-center gap-4 mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl font-bold tabular-nums" style={{ color: C.green }}>{players.filter((p) => diaData[p.id] === "presente").length}</span>
                    <span className="text-xs" style={{ color: C.dim }}>{t("as.homeOf")} {players.length} · {t("as.present").toLowerCase()}</span>
                  </div>
                  <button onClick={() => setTab("asistencia")} className="ml-auto text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: C.line, color: C.chalk }}>
                    <Icono n="asistencia" s={16} /> {t("as.homeSee")}
                  </button>
                </div>
                {ausentes.length === 0 ? (
                  <div className="text-sm" style={{ color: C.dim }}>{t("as.homeAll")}</div>
                ) : (
                  <div className="space-y-1.5">
                    {ausentes.map((p) => (
                      <div key={p.id} className="text-sm flex items-center gap-2" style={{ color: C.chalk }}>
                        <span className="shrink-0 w-2 h-2 rounded-full" style={{ background: asistColor(diaData[p.id]) }} />
                        <span>#{p.d} {p.n.split(" ")[0]}</span>
                        <span style={{ color: C.dim }}>· {asistLabel(diaData[p.id], t)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </Card>
      )}

      <Card title={t("h.quick")}>
        <div className="grid grid-cols-2 gap-2">
          {getAvailableTabs(session?.club, role.tabs).filter((k) => k !== "inicio" && (k !== "usuarios" || lim.users)).map((k) => (
            <button key={k} onClick={() => setTab(k)} className="font-display uppercase tracking-wide text-sm py-2.5 rounded-lg border hover:opacity-80" style={{ borderColor: C.line, color: C.chalk, background: C.panel2 }}>{t("nav." + k)}</button>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderUsers = () => {
    const grant = can("grantAccess");
    /* Los roles que ESTE usuario puede repartir. El entrenador monta su
       cuerpo técnico (segundo, delegado, familias) pero no nombra directores,
       y "master" no está en ninguna lista: es la cuenta única de EBLDigital. */
    const misRoles = asignables(session.role);
    /* No se puede tocar a quien tiene un rol que tú no repartes (tu director,
       otro master), ni a ti mismo: para eso está Mi cuenta. */
    const puedeEditar = (u) =>
      misRoles.includes(u.role) && norm(u.email) !== norm(session.email);
    return (
      <Card title={`${t("nav.usuarios")} — ${session.club} ${session.team.name}`}>
        <div className="text-xs mb-3" style={{ color: C.dim }}>
          {grant ? t("u.canGrant") : t("u.readonly")}
        </div>

        {can("createUsers") && (
          <div className="rounded-lg border p-3 mb-4" style={{ borderColor: AC, background: C.panel2 }}>
            <div className="font-display uppercase tracking-wide text-sm mb-1" style={{ color: AC }}>+ Dar de alta a alguien</div>
            <div className="text-[11px] mb-3" style={{ color: C.dim }}>
              Nadie puede meterse solo en un equipo oficial. Créale la ficha aquí y dile que se registre en la app con <strong>este mismo correo</strong>: al hacerlo elegirá su contraseña y entrará con el rol y el equipo que le pongas.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <input value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} placeholder="Nombre y apellidos"
                className="px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.chalk }} />
              <input value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} placeholder="correo@ejemplo.com" type="email"
                className="px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.chalk }} />
              <select value={nu.role} onChange={(e) => setNu({ ...nu, role: e.target.value })}
                className="px-3 py-2 rounded-lg border" style={{ background: C.panel, borderColor: C.line, color: C.chalk }}>
                {misRoles.map((k) => <option key={k} value={k}>{rLabel(lang, k)}</option>)}
              </select>
              <button disabled={!nu.name.trim() || !nu.email.trim() || nuBusy} onClick={async () => {
                setNuBusy(true); setNuMsg("");
                const out = await airUserCreate({
                  name: nu.name.trim(), email: nu.email.trim(), rol: ROL2LABEL[nu.role] || "Entrenador principal",
                  clubRec: clubInfo.rec || undefined, teamRec: session.team?.rec || undefined,
                });
                setNuBusy(false);
                if (out?.ok) { setNuMsg(`✓ ${nu.name.trim()} dado de alta. Dile que se registre con ${nu.email.trim()}.`);
                  setUsers((us) => [...us, { id: out.rec, name: nu.name.trim(), email: nu.email.trim(), role: nu.role, status: "pendiente" }]);
                  setNu({ name: "", email: "", role: "entrenador" }); }
                else if (out?.reason === "exists") setNuMsg("Ese correo ya tiene ficha.");
                else if (out?.reason === "limite_alcanzado") setNuMsg(`Este club ya tiene ${out.ocupadas}/${out.limite} plazas ocupadas. Sube el límite en "Gestionar club" o libera una plaza.`);
                else if (out?.reason === "director_unico") setNuMsg("Este club ya tiene un director deportivo. Solo puede haber uno; para cambiarlo, primero hay que dar de baja al actual.");
                else if (out?.reason === "no_autorizado") setNuMsg("Tu rol no puede dar de alta usuarios.");
                else setNuMsg("No se pudo crear. Revisa la conexión.");
              }} className="px-3 py-2 rounded-lg font-display uppercase tracking-wide font-semibold text-sm disabled:opacity-40"
                style={{ background: AC, color: C.sobre }}>{nuBusy ? "Creando…" : "Dar de alta"}</button>
            </div>
            {nuMsg && <div className="text-xs mt-2" style={{ color: nuMsg.startsWith("✓") ? C.green : C.red }}>{nuMsg}</div>}
          </div>
        )}
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="rounded-lg border p-3 flex flex-wrap items-center gap-3" style={{ borderColor: u.status === "pendiente" ? AC : C.line, background: C.panel2 }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold" style={{ background: C.mando, color: C.sobre }}>{ROLES[u.role].icon}</div>
              <div className="flex-1 min-w-[160px]">
                <div style={{ color: C.chalk }}>{u.name}</div>
                <div className="text-xs" style={{ color: C.dim }}>{u.email}</div>
              </div>
              {/* Solo se deja tocar el rol si está dentro de lo que este rol
                  puede repartir. Un entrenador no reasigna a su director, y
                  nadie se cambia el rol a sí mismo desde aquí. */}
              {grant && puedeEditar(u) ? (
                <select value={u.role} onChange={(e) => setUserRole(u.id, e.target.value)}
                  className="rounded-lg px-2 py-1.5 text-sm border" style={{ background: C.panel, borderColor: C.line, color: C.chalk }}>
                  {misRoles.map((k) => <option key={k} value={k}>{rLabel(lang, k)}</option>)}
                </select>
              ) : (
                <span className="text-sm flex items-center gap-1.5" style={{ color: C.dim }}>
                  <span style={{ color: ROLES[u.role]?.color }}>{ROLES[u.role]?.icon}</span>{rLabel(lang, u.role)}
                </span>
              )}
              <span className="text-xs font-display uppercase tracking-wide px-2 py-1 rounded"
                style={{ color: u.status === "activo" ? C.green : AC, border: `1px solid ${u.status === "activo" ? C.green : AC}` }}>{u.status === "activo" ? t("u.activo") : t("u.pendiente")}</span>
              {grant && puedeEditar(u) && (
                <div className="flex gap-1.5">
                  {u.status === "pendiente"
                    ? <button onClick={() => setUserStatus(u.id, "activo")} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: AC, color: C.sobre }}>{t("u.approve")}</button>
                    : <button onClick={() => setUserStatus(u.id, "pendiente")} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: C.line, color: C.dim }}>{t("u.suspend")}</button>}
                  {/* Borrar es irreversible y el backend solo se lo permite al
                      Master, así que aquí se pide confirmación y se nombra a
                      quién se borra: un ✕ suelto se pulsa sin querer. */}
                  <button onClick={() => { if (confirm(`¿Eliminar a ${u.name} (${u.email})? No se puede deshacer.`)) removeUser(u.id); }}
                    aria-label={`Eliminar a ${u.name}`} title={`Eliminar a ${u.name}`}
                    className="text-xs px-2.5 py-1.5 rounded-lg border" style={{ borderColor: C.line, color: C.red }}>✕</button>
                </div>
              )}
            </div>
          ))}
        </div>
        {grant && <div className="text-[11px] mt-3" style={{ color: C.dim }}>{t("u.note")}</div>}
      </Card>
    );
  };

  /* Guardado en la nube y datos del club: es configuración del equipo, no de
     la plantilla, así que vive en su propia pestaña dentro del apartado
     Equipo en vez de encabezar la lista de jugadores. */
  const renderTeamSettings = () => (
    <div className="space-y-4">
      {can("editSquad") && (
        <Card title={t("sq.cloud")}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] px-2 py-1 rounded font-display uppercase tracking-wide"
              style={{ border: `1px solid ${cloudOn ? C.green : C.line}`, color: cloudOn ? C.green : C.dim }}>
              {cloudOn ? t("sq.cloudOn") : t("sq.cloudOff")}
            </span>
            <button onClick={subirPlantilla} className="text-sm px-3 py-1.5 rounded-lg border font-display uppercase tracking-wide"
              style={{ borderColor: AC, color: AC }}>{t("sq.saveSquad")}</button>
            <button onClick={subirCalendario} className="text-sm px-3 py-1.5 rounded-lg border font-display uppercase tracking-wide"
              style={{ borderColor: C.line, color: C.chalk }}>{t("sq.saveCal")}</button>
            {cloudMsg && <span className="text-[12px]" style={{ color: cloudMsg.startsWith("✓") ? C.green : C.dim }}>{cloudMsg}</span>}
          </div>
          <div className="text-[11px] mt-2" style={{ color: C.dim }}>
            {t("sq.cloudNote")}
          </div>

          <div className="mt-4 pt-4 border-t" style={{ borderColor: C.line }}>
            <div className="font-display text-sm uppercase tracking-widest mb-2" style={{ color: AC }}>{t("sq.clubData")}</div>
            <div className="flex items-start gap-3 flex-wrap">
              <div className="flex flex-col items-center gap-1">
                <Crest src={clubInfo.crest || escudoDe(session.club)} name={session.club} size={56} />
                {/* Subir/cambiar el escudo del club queda reservado al Master (v45):
                    toca de golpe a todos los equipos del club, así que un solo rol
                    decide cuándo hacerlo. El resto solo lo ve. */}
                {can("master") && (
                <label className="text-[10px] px-2 py-1 rounded border cursor-pointer font-display uppercase" style={{ borderColor: C.line, color: C.dim }}>
                  {t("sq.crest")}
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const b64 = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(",")[1]); r.readAsDataURL(f); });
                    /* El color se detecta en el propio dispositivo y no depende de
                       la nube: aunque este club todavía no tenga ficha en Airtable
                       (clubInfo.rec vacío), el menú ya puede tomar su color. */
                    extraerAcentoDeEscudo(`data:${f.type || "image/png"};base64,${b64}`).then((par) => { if (par && !acentoManual) setAcentoMenu(par); });
                    if (!clubInfo.rec) return;
                    const out = await airClubCrest(clubInfo.rec, b64, f.type || "image/png", f.name);
                    if (out?.url) setClubInfo((c) => ({ ...c, crest: out.url }));
                  }} />
                </label>
                )}
              </div>
              <div className="flex-1 min-w-[220px] grid gap-2">
                <input value={clubInfo.campo} onChange={(e) => setClubInfo((c) => ({ ...c, campo: e.target.value }))}
                  placeholder="Nombre del campo" className="text-sm px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.chalk }} />
                <input value={clubInfo.direccion} onChange={(e) => setClubInfo((c) => ({ ...c, direccion: e.target.value }))}
                  placeholder="Dirección" className="text-sm px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.chalk }} />
                <input value={clubInfo.maps} onChange={(e) => setClubInfo((c) => ({ ...c, maps: e.target.value }))}
                  placeholder="Enlace de Google Maps" className="text-sm px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.chalk }} />
                <button onClick={async () => {
                  if (!clubInfo.rec) { setCloudMsg("Este club todavía no está en la nube."); return; }
                  await airClubPatch(clubInfo.rec, { campo: clubInfo.campo, direccion: clubInfo.direccion, maps: clubInfo.maps });
                  setCloudMsg("✓ Datos del club guardados");
                  setTimeout(() => setCloudMsg(""), 4000);
                }} className="text-sm px-3 py-2 rounded-lg font-display uppercase tracking-wide font-semibold" style={{ background: AC, color: C.sobre }}>
                  Guardar datos del club
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderSquad = () => (
    <div className="space-y-4">
      {can("editSquad") && (
        <Card title="Importar plantilla desde CSV">
          {!csvOpen ? (
            <div className="flex items-center gap-3">
              <button onClick={() => setCsvOpen(true)} className="font-display uppercase tracking-wide text-sm px-4 py-2 rounded-lg border" style={{ borderColor: C.line, color: AC }}>+ Importar CSV</button>
              <span className="text-xs" style={{ color: C.dim }}>{players.length}/{lim.players === 99 ? "∞" : lim.players} jugadores</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs" style={{ color: C.dim }}>Una línea por jugador: <span style={{ color: C.chalk }}>nombre, apellidos, dorsal, posición</span> (dorsal y posición opcionales).</div>
              <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} rows={4} placeholder={"Sergio, Molina, 21, DC\nLucas, Prieto\nDavid, Camacho, 22, POR"} className="w-full rounded-lg px-3 py-2 text-sm outline-none border font-mono" style={{ background: C.panel2, borderColor: C.line, color: C.chalk }} />
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm px-3 py-2 rounded-lg border cursor-pointer" style={{ borderColor: C.line, color: C.chalk }}>
                  📄 Subir archivo .csv
                  <input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setCsvText(String(r.result || "")); r.readAsText(f); }} />
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: C.chalk }}><input type="checkbox" checked={csvReplace} onChange={(e) => setCsvReplace(e.target.checked)} />Reemplazar plantilla actual</label>
                <button onClick={importCSV} className="font-display uppercase tracking-wide text-sm px-4 py-2 rounded-lg font-semibold" style={{ background: AC, color: C.sobre }}>Importar</button>
                <button onClick={() => { setCsvOpen(false); setCsvMsg(""); }} className="text-sm" style={{ color: C.dim }}>{t("p.close")}</button>
              </div>
              {csvMsg && <div className="text-sm" style={{ color: AC }}>{csvMsg}</div>}
            </div>
          )}
        </Card>
      )}
      <Card title={`Plantilla — ${session.club} ${session.team.name}`}>
        <div className="text-xs mb-3" style={{ color: C.dim }}>Toca un jugador para abrir su perfil (foto y vídeo){can("editSquad") ? " · toca el estado para cambiarlo" : ""}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ color: C.chalk }}>
            <thead><tr className="font-display uppercase tracking-widest text-xs" style={{ color: C.dim }}>
              <th className="text-left py-2" colSpan={2}>Jugador</th><th className="text-left">Pos</th><th className="text-left">Estado</th><th className="text-right">Asist.</th><th className="text-right">Min.</th>
            </tr></thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="border-t" style={{ borderColor: C.line }}>
                  <td className="py-2 w-10"><button onClick={() => setProfileId(p.id)}><Avatar p={p} /></button></td>
                  <td><button onClick={() => setProfileId(p.id)} className="text-left hover:opacity-80"><span className="font-display text-base mr-2" style={{ color: AC }}>{p.d}</span>{p.n}{p.video && " 🎬"}{starters.has(p.id) && <span className="ml-2 text-xs" style={{ color: C.dim }}>· XI</span>}</button></td>
                  <td style={{ color: C.dim }}>{p.pos}</td>
                  <td><button onClick={() => cycleStatus(p.id)} className="flex items-center hover:opacity-80" style={{ cursor: can("editSquad") ? "pointer" : "default" }}><Dot st={p.st} />{p.st}</button></td>
                  <td className="text-right">{attPct(p)}%</td><td className="text-right">{p.min}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderLineup = () => {
    /* El segundo entrenador mira y edita su borrador (lineupDraft); todos
       los demás, la alineación oficial. Fuera de este render, `lineup` y
       `starters` siguen significando "la alineación oficial" en todos
       lados -convocatoria, estadísticas...-, sin verse afectados por un
       borrador que todavía no se ha aprobado. */
    const propone = canProposeChanges();
    const lineupView = propone ? (lineupDraft || lineup) : lineup;
    const startersView = new Set(Object.values(lineupView));
    const bench = players.filter((p) => !startersView.has(p.id));
    const jugadorSel = selPlayer ? players.find((x) => x.id === selPlayer) : null;
    /* Estilo "cambio de jugador" de videojuego de fútbol: al tocar un puesto
       ocupado, en vez de una lista plana con toda la plantilla mezclada, los
       de su misma demarcación suben arriba del todo y marcados, para
       encontrar de un vistazo a quién meter en su lugar. */
    const puestoDelSlot = selSlot ? slotPos[selSlot]?.label : null;
    const jugadoresParaSlot = selSlot
      ? [...players].sort((a, b) => (a.pos === puestoDelSlot ? 0 : 1) - (b.pos === puestoDelSlot ? 0 : 1))
      : bench;
    /* Coach AI ya recibe la alineación entera en su prompt (ver askCoach,
       nivel "tecnico"), así que basta con mandarle una pregunta ya centrada
       en lo que se está mirando aquí -sin puestos vacíos, "¿está
       equilibrada?"; con puestos vacíos, "¿a quién meto?"- en vez de
       obligar a explicárselo desde cero al entrar en su pestaña. */
    const preguntarIASobreAlineacion = () => {
      const vacios = Object.keys(slotPos).length - Object.values(lineupView).filter(Boolean).length;
      const pregunta = vacios > 0
        ? `Estoy montando la alineación en ${sysCode} y me faltan ${vacios} puesto(s) por cubrir. Mirando el banquillo, ¿a quién meterías y por qué?`
        : `¿Qué te parece esta alineación en ${sysCode}? Dime si ves algún desequilibrio de líneas o de perfiles.`;
      setTab("coachai");
      askCoach(pregunta);
    };
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={`${propone ? "Propuesta de alineación" : "Titulares"} — ${sysCode}`}>
          {propone && (
            miPropuestaPendiente("lineup") ? (
              <div className="mb-3 rounded-lg border px-3 py-2.5 text-sm" style={{ borderColor: C.warn, background: `${C.warn}10`, color: C.warn }}>
                ⏳ Tu propuesta de alineación está pendiente de aprobación
              </div>
            ) : (
              <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: C.line, background: C.panel2 }}>
                <div className="text-xs" style={{ color: C.dim }}>
                  {lineupDraft ? "Cuando termines de colocar el once, mándala." : "Coloca el once y manda la propuesta cuando termines."}
                </div>
                <button onClick={enviarPropuestaAlineacion} disabled={!lineupDraft}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-lg font-display uppercase tracking-wide font-semibold disabled:opacity-40"
                  style={{ background: AC, color: C.sobre }}>
                  Enviar propuesta
                </button>
              </div>
            )
          )}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {(session.team?.f7 ? SYS_F7 : SYS_F11).map((c) => (
              <button key={c} onClick={() => applySystem(c)} className="text-xs px-2 py-1 rounded-lg border font-display"
                style={{ borderColor: sysCode === c ? AC : C.line, background: sysCode === c ? AC : "transparent", color: sysCode === c ? "#141414" : C.dim }}>
                {c}
              </button>
            ))}
            <div className="flex items-center gap-1">
              <input value={sysCustom} onChange={(e) => setSysCustom(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && applySystem(sysCustom)) setSysCustom(""); }}
                placeholder={t("ln.other")} className="text-xs px-2 py-1 rounded-lg border bg-transparent w-28"
                style={{ borderColor: C.line, color: C.chalk }} />
              <button onClick={() => { if (applySystem(sysCustom)) setSysCustom(""); }}
                className="text-xs px-2 py-1 rounded-lg border" style={{ borderColor: AC, color: AC }}>{t("ln.apply")}</button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="text-xs" style={{ color: C.dim }}>
              Arrastra para recolocar · toque corto para asignar
            </div>
            {can("ai") && (
              <button onClick={preguntarIASobreAlineacion} disabled={loading}
                className="text-xs px-2.5 py-1 rounded-lg border font-display uppercase tracking-wide disabled:opacity-50"
                style={{ borderColor: AC, color: AC }}>
                ✦ Preguntar a la IA
              </button>
            )}
          </div>
          <div ref={pitchRef} className="relative w-full touch-none select-none" style={{ aspectRatio: "3/4" }} onPointerMove={onPitchMove} onPointerUp={() => onSlotUp(null)}>
            <svg viewBox="0 0 300 400" className="absolute inset-0 w-full h-full pointer-events-none">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (<rect key={i} x="0" y={i * 50} width="300" height="50" fill={i % 2 ? "#17251D" : "#152219"} />))}
              <g stroke={C.chalk} strokeOpacity="0.5" strokeWidth="1.5" fill="none">
                <rect x="8" y="8" width="284" height="384" /><line x1="8" y1="200" x2="292" y2="200" /><circle cx="150" cy="200" r="34" />
                <rect x="75" y="8" width="150" height="52" /><rect x="115" y="8" width="70" height="22" /><rect x="75" y="340" width="150" height="52" /><rect x="115" y="370" width="70" height="22" />
                <path d="M 116 60 A 34 34 0 0 0 184 60" /><path d="M 116 340 A 34 34 0 0 1 184 340" />
              </g>
            </svg>
            {Object.entries(slotPos).map(([id, s]) => {
              const p = players.find((x) => x.id === lineupView[id]); const sel = selSlot === id;
              /* Con un jugador elegido desde la lista, se le marca el aro a
                 su puesto natural en el campo mismo -no solo en la lista de
                 la derecha- para verlo de un vistazo antes de tocar. */
              const sugerido = !sel && jugadorSel && s.label === jugadorSel.pos;
              return (
                <div key={id} onPointerDown={(e) => onSlotDown(e, id)} onPointerUp={() => onSlotUp(id)} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${s.x}%`, top: `${s.y}%`, cursor: can("editLineup") ? "grab" : "default" }}>
                  {/* "background" (shorthand) y "backgroundImage"/"backgroundSize"/
                      "backgroundPosition" (largas) mezclados en el mismo style
                      no funcionan juntos: la abreviada reinicia el tamaño y la
                      posición de la imagen a sus valores iniciales, así que la
                      foto se aplicaba pero se veía en tamaño natural desde la
                      esquina -recortada casi entera fuera del círculo- en vez
                      de a tamaño completo y centrada. Todo en una sola
                      declaración "background" evita el conflicto. */}
                  <div className="relative w-11 h-11 rounded-full flex items-center justify-center font-display text-lg font-bold border-2 overflow-hidden"
                    style={{ background: sel ? AC : p?.photo ? `center / cover no-repeat url(${p.photo})` : C.panel2, color: sel ? "#141414" : C.chalk, borderColor: sel ? AC : sugerido ? AC : p && p.st !== "disponible" ? stColor(p.st) : "rgba(54,69,79,0.5)" }}>
                    {(!p?.photo || sel) && (p ? p.d : s.label)}
                    {/* Con foto, el dorsal desaparecía del todo detrás de la
                        imagen: se ve el jugador pero no quién es. Se pone como
                        insignia encima, en vez de sustituir la foto. */}
                    {p?.photo && !sel && (
                      <span className="absolute -bottom-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] leading-4 font-display font-bold text-center border overflow-visible"
                        style={{ background: C.panel, borderColor: AC, color: AC }}>{p.d}</span>
                    )}
                  </div>
                  {/* La demarcación (s.label, p.ej. "DFC") se mostraba solo
                      mientras el puesto estaba vacío: en cuanto se asignaba un
                      jugador, desaparecía y solo quedaba el nombre. Se deja
                      siempre visible junto al nombre. */}
                  <div className="mt-0.5 text-[10px] px-1 rounded" style={{ background: "rgba(14,21,18,0.8)", color: C.chalk }}>{p ? `${p.n.split(" ")[0]} · ${s.label}` : s.label}</div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card title={selSlot ? `Asignar a ${selSlot}` : jugadorSel ? `Elegir puesto para ${jugadorSel.n.split(" ")[0]}` : "Banquillo"}>
          {!selSlot && !jugadorSel && (
            <div className="text-xs mb-3" style={{ color: C.dim }}>{t("ln.tapPos")} · o toca un jugador de la lista para ver dónde puede jugar</div>
          )}
          {jugadorSel && !selSlot && (
            <div className="text-xs mb-3" style={{ color: C.dim }}>Toca un puesto del campo, o elige uno de esta lista — primero el suyo</div>
          )}
          {selSlot && (
            <div className="text-xs mb-3" style={{ color: C.dim }}>Los de {puestoDelSlot} suben arriba, para encontrar rápido a quién meter</div>
          )}
          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
            {jugadorSel && !selSlot ? (
              /* Camino "elige al jugador primero": en vez de tener que
                 acertar el punto exacto del campo, se listan los puestos con
                 el suyo natural arriba del todo -y quién lo ocupa, si hay
                 alguien-, y basta con tocar uno para colocarlo ahí. */
              Object.entries(slotPos)
                .sort(([, a], [, b]) => (a.label === jugadorSel.pos ? 0 : 1) - (b.label === jugadorSel.pos ? 0 : 1))
                .map(([slotId, s]) => {
                  const ocupante = players.find((x) => x.id === lineupView[slotId]);
                  const esSuPuesto = s.label === jugadorSel.pos;
                  return (
                    <button key={slotId} onClick={() => asignarJugadorAPuesto(slotId, jugadorSel.id)}
                      className="w-full flex items-center justify-between text-sm py-2 px-3 rounded-lg border text-left hover:opacity-80"
                      style={{ borderColor: esSuPuesto ? AC : C.line, background: C.panel2, color: C.chalk }}>
                      <span className="flex items-center gap-2">
                        <span className="font-display text-base" style={{ color: AC }}>{s.label}</span>
                        {esSuPuesto && <span className="text-[10px] font-display uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: AC, color: C.sobre }}>Su puesto</span>}
                      </span>
                      <span style={{ color: C.dim }}>{ocupante ? `Ocupado · ${ocupante.n.split(" ")[0]}` : "Libre"}</span>
                    </button>
                  );
                })
            ) : jugadoresParaSlot.map((p) => {
              const mismoPuesto = selSlot && p.pos === puestoDelSlot;
              return (
                <button key={p.id} onClick={() => (selSlot ? asignarJugadorAPuesto(selSlot, p.id) : setSelPlayer(p.id))}
                  className="w-full flex items-center justify-between text-sm py-2 px-3 rounded-lg border text-left hover:opacity-80 disabled:cursor-default" style={{ borderColor: mismoPuesto ? AC : C.line, background: C.panel2, color: C.chalk }}>
                  <span className="flex items-center gap-2">
                    <Avatar p={p} size={26} /><Dot st={p.st} /><span className="font-display text-base" style={{ color: AC }}>{p.d}</span>{p.n}
                    {mismoPuesto && <span className="text-[10px] font-display uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: AC, color: C.sobre }}>Mismo puesto</span>}
                  </span>
                  <span style={{ color: C.dim }}>{p.pos}{startersView.has(p.id) ? " · XI" : ""}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    );
  };

  const saveCall = () => {
    const row = {
      id: Date.now(), j: nextMatchFix?.j || "", rival: matchInfo.rival, fecha: matchInfo.fecha,
      hora: matchInfo.hora, lugar: matchInfo.lugar, ids: [...called],
    };
    if (!isPro) { setCallMsg("El histórico de convocatorias es una función PRO."); setTimeout(() => setCallMsg(""), 4000); return; }
    if (canProposeChanges()) {
      proposeChange("call", [row, ...calls]);
      setCallMsg("✓ Propuesta de convocatoria enviada. Esperando aprobación del entrenador.");
    } else {
      setCalls([row, ...calls]);
      setCallMsg("✓ Convocatoria guardada en el histórico.");
    }
    setTimeout(() => setCallMsg(""), 4000);
  };

  const renderCall = () => {
    const editable = can("editCall");
    const toggle = (id) => editable && setCalled((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={`Convocatoria${matchInfo.j ? ` — J${matchInfo.j}` : ""} ${editable ? "" : "(solo lectura)"}`}>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[["rival", "Rival"], ["fecha", "Fecha"], ["hora", "Hora"], ["lugar", "Lugar"]].map(([k, lbl]) => (
              <div key={k} className={k === "lugar" ? "col-span-2" : ""}>
                <div className="text-[11px] font-display uppercase tracking-widest" style={{ color: C.dim }}>{lbl}</div>
                {k === "rival" ? (
                  <>
                    {/* Los rivales salen del calendario en vez de escribirse a
                        mano cada vez: menos "CD Norte" un día y "C.D. Norte"
                        al siguiente, que luego rompe el histórico y las
                        estadísticas por rival. "Otro rival" se deja para
                        amistosos o partidos de copa que no están en el
                        calendario oficial. Al elegir uno, la fecha, la hora,
                        el lugar y la jornada llegan solos desde su partido
                        del calendario -no hace falta rellenarlos a mano
                        también, si ya están ahí-. */}
                    <select value={rivalesDelCalendario.includes(matchInfo.rival) ? matchInfo.rival : "__otro__"}
                      disabled={!editable}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "__otro__") { setMatchInfo((m) => ({ ...m, rival: "" })); return; }
                        const f = sortedFix.find((x) => /^\d+$/.test(String(x.j)) && rivalDeFixture(x) === v);
                        setMatchInfo((m) => f
                          ? { ...m, rival: v, fecha: f.date, hora: f.time || m.hora, lugar: f.place || m.lugar, j: f.j || "" }
                          : { ...m, rival: v });
                      }}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none border disabled:opacity-60" style={{ background: C.panel2, borderColor: C.line, color: C.chalk }}>
                      {rivalesDelCalendario.map((r) => <option key={r} value={r}>{r}</option>)}
                      <option value="__otro__">✎ Otro rival (no está en el calendario)</option>
                    </select>
                    {!rivalesDelCalendario.includes(matchInfo.rival) && (
                      <input value={matchInfo.rival} disabled={!editable} onChange={(e) => setMatchInfo((m) => ({ ...m, rival: e.target.value }))}
                        placeholder="Nombre del rival" className="w-full mt-1.5 rounded-lg px-3 py-2 text-sm outline-none border disabled:opacity-60" style={{ background: C.panel2, borderColor: C.line, color: C.chalk }} />
                    )}
                    {rivalesDelCalendario.length === 0 && (
                      <div className="text-[11px] mt-1" style={{ color: "#e0b25a" }}>
                        Sin calendario todavía — el director deportivo tiene que cargarlo al empezar la temporada para tener aquí a todos los rivales.
                      </div>
                    )}
                  </>
                ) : (
                  <input value={matchInfo[k]} disabled={!editable} onChange={(e) => setMatchInfo((m) => ({ ...m, [k]: e.target.value }))} className="w-full rounded-lg px-3 py-2 text-sm outline-none border disabled:opacity-60" style={{ background: C.panel2, borderColor: C.line, color: C.chalk }} />
                )}
              </div>
            ))}
          </div>
          {!editable && (
            <div className="rounded-lg border px-3 py-2 mb-2 text-[12px] flex items-start gap-2"
              style={{ borderColor: C.line, background: "rgba(217,164,65,.10)", color: "#e0b25a" }}>
              <span>🔒</span>
              <span>Modo consulta: la convocatoria la deciden el entrenador y el director deportivo. Como {rLabel(lang, session.role).toLowerCase()} puedes verla, pero no cambiarla.</span>
            </div>
          )}
          <div className="text-xs mb-2" style={{ color: C.dim }}>{editable ? "Marca los convocados" : "Convocados"} — {called.size} seleccionados</div>
          <div className="space-y-1 max-h-[340px] overflow-y-auto pr-1" style={{ opacity: editable ? 1 : 0.75 }}>
            {players.map((p) => (
              <button key={p.id} onClick={() => toggle(p.id)} disabled={!editable} className="w-full flex items-center justify-between text-sm py-2 px-3 rounded-lg border text-left disabled:cursor-default" style={{ borderColor: called.has(p.id) ? AC : C.line, background: called.has(p.id) ? C.panel2 : "transparent", color: C.chalk }}>
                <span className="flex items-center"><span className="w-5 text-center mr-2" style={{ color: called.has(p.id) ? AC : C.dim }}>{called.has(p.id) ? "✓" : "○"}</span><Dot st={p.st} /><span className="font-display text-base mr-2" style={{ color: AC }}>{p.d}</span>{p.n}</span>
                <span style={{ color: C.dim }}>{p.pos}</span>
              </button>
            ))}
          </div>
        </Card>
        <Card title={t("cl.waMsg")}>
          <pre className="whitespace-pre-wrap text-sm rounded-lg p-4 border font-body leading-relaxed" style={{ background: C.panel2, borderColor: C.line, color: C.chalk }}>{waText()}</pre>
          <div className="mt-3 flex gap-2">
            <button onClick={copyWa} className="flex-1 font-display uppercase tracking-wider py-2.5 rounded-lg font-semibold" style={{ background: copied ? C.green : AC, color: C.sobre }}>{copied ? "✓ Copiado" : "Copiar mensaje"}</button>
            <a href={`https://wa.me/?text=${encodeURIComponent(waText())}`} target="_blank" rel="noreferrer" className="flex-1 text-center font-display uppercase tracking-wider py-2.5 rounded-lg font-semibold border" style={{ borderColor: C.line, color: C.chalk }}>{t("cl.waOpen")}</a>
          </div>
          <div className="text-[11px] mt-2" style={{ color: C.dim }}>{t("cl.waLegend")}</div>
          {editable && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: C.line }}>
              <button onClick={saveCall} className="w-full font-display uppercase tracking-wider py-2.5 rounded-lg border" style={{ borderColor: AC, color: AC }}>
                📌 Guardar en el histórico
              </button>
              {callMsg && <div className="text-xs mt-2" style={{ color: C.green }}>{callMsg}</div>}
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderMatch = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2">
        <div className="flex flex-wrap items-center justify-center sm:justify-between gap-x-4 gap-y-2 text-center">
          <div className="font-display text-xl sm:text-3xl font-semibold flex items-center gap-2" style={{ color: C.chalk }}>
            <Crest src={teamCrest} name={session.team.name} size={32} />{session.team.name}
          </div>
          <div className="font-display text-5xl sm:text-7xl font-bold tabular-nums" style={{ color: AC }}>{score.us}<span style={{ color: C.dim }}> – </span>{score.them}</div>
          <div className="font-display text-xl sm:text-3xl font-semibold sm:text-right" style={{ color: C.chalk }}>{matchInfo.rival}</div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
          <div className="font-display text-5xl tabular-nums" style={{ color: leftSecs === 0 ? C.red : overMin > 0 ? C.warn : C.chalk }}>{fmtClock(secs)}</div>
          <button onClick={() => setRunning((r) => !r)} className="font-display uppercase tracking-wider px-6 py-2.5 rounded-lg font-semibold" style={{ background: running ? C.red : AC, color: C.sobre }}>{running ? "Pausa" : "Play"}</button>
          <button onClick={() => { setHalf(2); setSecs(0); setRunning(false); setMatchCfg((c) => ({ ...c, added: 0 })); addEvent("periodo"); }} className="font-display uppercase tracking-wider px-4 py-2.5 rounded-lg border" style={{ borderColor: C.line, color: C.chalk }}>{t("mt.half2")}</button>
          {/* En el banquillo se corrige sobre la pizarra en mitad del partido.
              El reloj y los eventos siguen vivos al cambiar de pestaña, así
              que se puede ir y volver sin perder el acta. */}
          {visibleTabs.includes("pizarra") && (
            <button onClick={() => setTab("pizarra")} className="font-display uppercase tracking-wider px-4 py-2.5 rounded-lg border flex items-center gap-2" style={{ borderColor: AC, color: AC }}>
              <Icono n="pizarra" s={16} />{t("mt.toBoard")}
            </button>
          )}
          <div className="text-sm leading-tight" style={{ color: C.dim }}>
            <div>Parte {half} de {matchCfg.halfMin}′{matchCfg.added > 0 ? ` +${matchCfg.added}′` : ""} · min {dispMin}</div>
            <div style={{ color: leftSecs === 0 ? C.red : overMin > 0 ? C.warn : C.dim }}>
              {leftSecs === 0 ? "⏹ Tiempo cumplido" : overMin > 0 ? `Descuento · quedan ${fmtClock(leftSecs)}` : `Quedan ${fmtClock(leftSecs)}`}
            </div>
          </div>
        </div>

        {/* ---- Lo que se toca durante el partido ----
             Va justo debajo del reloj y nada más. Antes en medio había tres
             bloques de ajustes que solo se tocan una vez, y para apuntar un
             gol había que bajar media pantalla con el partido en marcha. */}
        <div className="mt-5 grid grid-cols-3 sm:grid-cols-5 gap-2">
          {[["gol", "Gol", true], ["golRival", "Gol rival", false], ["cambio", "Cambio", true], ["tarjeta", "Tarjeta", true], ["nota", "Nota", false]].map(([type, lbl, needs]) => (
            <button key={type} onClick={() => (needs ? setEvPick(evPick === type ? null : type) : addEvent(type))}
              className="font-display uppercase tracking-wide min-h-14 py-3 rounded-lg border font-semibold"
              style={{ borderColor: evPick === type ? AC : C.line, borderWidth: evPick === type ? 2 : 1, background: type === "gol" ? AC : C.panel2, color: type === "gol" ? C.sobre : C.chalk }}>{lbl}</button>
          ))}
        </div>
        {evPick && (
          /* Dorsales grandes: en el banquillo, de pie y con prisa, una fila de
             botones finos no se acierta. El dorsal manda sobre el nombre
             porque es lo que se ve desde la banda. */
          <div className="mt-3 p-3 rounded-lg border" style={{ borderColor: AC, background: C.panel2 }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: AC }}>{t("mt.who")}</span>
              <button onClick={() => setEvPick(null)} className="text-xs px-2 py-1" style={{ color: C.dim }}>✕ Cancelar</button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
              {players.filter((p) => starters.has(p.id) || evPick === "cambio").map((p) => (
                <button key={p.id} onClick={() => addEvent(evPick, p)}
                  className="min-h-14 rounded-lg border flex flex-col items-center justify-center leading-tight"
                  style={{ borderColor: starters.has(p.id) ? AC : C.line, color: C.chalk, background: C.panel }}>
                  <span className="font-display text-lg tabular-nums" style={{ color: AC }}>{p.d}</span>
                  <span className="text-[10px] truncate max-w-full px-1" style={{ color: C.dim }}>{p.n.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---- Ajustes del partido ----
             Duración, descuento y tandas se ponen una vez antes del saque. En
             cuanto el reloj corre se pliegan solos y dejan la pantalla para lo
             que sí se usa. */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: C.line }}>
          <button onClick={() => setAjustesAbiertos((v) => !v)}
            className="w-full flex items-center justify-between gap-2 text-left">
            <span className="font-display text-xs uppercase tracking-widest" style={{ color: C.dim }}>
              Ajustes del partido
            </span>
            <span className="text-[11px] flex items-center gap-2" style={{ color: C.dim }}>
              {matchCfg.halfMin}′{matchCfg.added > 0 ? ` +${matchCfg.added}′` : ""} · {tandasTotal} tandas
              <span style={{ color: AC }}>{ajustesVisibles ? "▲" : "▼"}</span>
            </span>
          </button>
          {ajustesVisibles && (
            <>
          <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ borderColor: C.line }}>
            <div>
              <div className="font-display text-xs uppercase tracking-widest mb-2" style={{ color: C.dim }}>{t("mt.halfLen")}</div>
              <div className="flex flex-wrap items-center gap-2">
                {[30, 35, 40].map((m) => (
                  <button key={m} onClick={() => setMatchCfg((c) => ({ ...c, halfMin: m }))}
                    className="text-xs font-display px-3 py-1.5 rounded-full border"
                    style={{ borderColor: matchCfg.halfMin === m ? AC : C.line, color: matchCfg.halfMin === m ? AC : C.dim }}>{m}′</button>
                ))}
                <input type="number" min="1" max="60" value={matchCfg.halfMin}
                  onChange={(e) => setMatchCfg((c) => ({ ...c, halfMin: Math.max(1, Math.min(60, Number(e.target.value) || 1)) }))}
                  className="w-20 px-2 py-1.5 rounded-lg border bg-transparent text-sm text-center tabular-nums"
                  style={{ borderColor: C.line, color: C.chalk }} />
                <span className="text-xs" style={{ color: C.dim }}>min</span>
              </div>
              <div className="text-[11px] mt-2 leading-relaxed" style={{ color: C.dim }}>
                Juvenil 40′ · Cadete e Infantil 35′ · Alevín 30′. Se aplica sola según la categoría; edítala si tu competición usa otra duración.
              </div>
            </div>

            <div>
              <div className="font-display text-xs uppercase tracking-widest mb-2" style={{ color: C.dim }}>{t("mt.added")}</div>
              <div className="flex flex-wrap items-center gap-1.5">
                {ADDED_OPTS.map((m) => (
                  <button key={m} onClick={() => setMatchCfg((c) => ({ ...c, added: m }))}
                    className="text-xs font-display w-9 h-9 rounded-full border tabular-nums"
                    style={{ borderColor: matchCfg.added === m ? AC : C.line, color: matchCfg.added === m ? AC : C.dim }}>{m === 0 ? "—" : "+" + m}</button>
                ))}
                <input type="number" min="0" max="30" value={matchCfg.added}
                  onChange={(e) => setMatchCfg((c) => ({ ...c, added: Math.max(0, Math.min(30, Number(e.target.value) || 0)) }))}
                  className="w-20 px-2 py-1.5 rounded-lg border bg-transparent text-sm text-center tabular-nums"
                  style={{ borderColor: C.line, color: C.chalk }} />
              </div>
              <div className="text-[11px] mt-2 leading-relaxed" style={{ color: C.dim }}>
                {matchCfg.added > 0
                  ? `El reloj avisa al llegar a ${matchCfg.halfMin}+${matchCfg.added}. Los eventos del descuento se registran como ${matchCfg.halfMin * (half === 2 ? 2 : 1)}+n.`
                  : "Marca el descuento cuando lo señale el árbitro. Se reinicia al empezar la 2ª parte."}
              </div>
            </div>
          </div>
              <div className="mt-4">
                <div className="font-display text-xs uppercase tracking-widest mb-2" style={{ color: C.dim }}>{t("mt.subs")}</div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[3, 4, 5, 6].map((n) => (
                  <button key={n} onClick={() => setMatchCfg((c) => ({ ...c, tandas: n }))}
                    className="text-xs font-display w-8 h-8 rounded-full border tabular-nums"
                    style={{ borderColor: tandasTotal === n ? AC : C.line, color: tandasTotal === n ? AC : C.dim }}>{n}</button>
                ))}
                <span className="text-[11px] ml-1" style={{ color: C.dim }}>{t("mt.subsTotal")}</span>
              </div>
              </div>
            </>
          )}
        </div>

        {/* ---- Tandas de cambios ----
             Las lleva el delegado o el segundo. Se pintan como marcas gastadas
             y por gastar para poder leerlas de un vistazo desde el banquillo,
             sin ponerse a contar números. */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: C.line }}>
          <div className="font-display text-xs uppercase tracking-widest" style={{ color: C.dim }}>{t("mt.subs")}</div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5" role="img"
              aria-label={`${tandasUsadas} ${t("mt.subsOf")} ${tandasTotal}`}>
              {Array.from({ length: tandasTotal }, (_, i) => (
                <span key={i} className="w-5 h-5 rounded-full border-2 leading-none"
                  style={{ borderColor: i < tandasUsadas ? AC : C.line, background: i < tandasUsadas ? AC : "transparent" }} />
              ))}
            </div>
            <div className="font-display text-2xl tabular-nums" style={{ color: tandasUsadas >= tandasTotal ? C.red : C.chalk }}>
              {tandasUsadas}<span style={{ color: C.dim }}> / {tandasTotal}</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button onClick={() => setTandasUsadas((n) => Math.max(0, n - 1))} disabled={tandasUsadas === 0}
                aria-label={t("mt.subsUndo")} title={t("mt.subsUndo")}
                className="w-10 h-10 rounded-lg border font-display text-lg leading-none disabled:opacity-30"
                style={{ borderColor: C.line, color: C.chalk }}>−</button>
              <button onClick={() => setTandasUsadas((n) => Math.min(tandasTotal, n + 1))} disabled={tandasUsadas >= tandasTotal}
                className="px-5 h-10 rounded-lg font-display uppercase tracking-wide font-semibold disabled:opacity-40"
                style={{ background: AC, color: C.sobre }}>+ {t("mt.subsOne")}</button>
            </div>
          </div>
          <div className="text-[11px] mt-2" style={{ color: tandasUsadas >= tandasTotal ? C.red : C.dim }}>
            {tandasUsadas >= tandasTotal
              ? t("mt.subsNone")
              : t("mt.subsLeft").replace("{n}", tandasTotal - tandasUsadas)}
          </div>
        </div>

        {/* ---- Alineación inicial ----
             El once que sale, en el mismo sitio donde llevas el partido: en el
             banquillo no da tiempo a cambiar de pantalla para comprobar quién
             empieza. Sale de la alineación guardada; si falta alguien por
             colocar, se dice en vez de enseñar un hueco mudo. */}
        {can("editLineup") && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: C.line }}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="font-display text-xs uppercase tracking-widest" style={{ color: C.dim }}>Alineación inicial</div>
              {visibleTabs.includes("alineacion") && (
                <button onClick={() => setTab("alineacion")} className="text-[11px] px-2.5 py-1 rounded-lg border" style={{ borderColor: C.line, color: C.chalk }}>Editar</button>
              )}
            </div>
            {(() => {
              const once = Object.entries(lineup)
                .map(([puesto, id]) => ({ puesto, p: players.find((x) => x.id === id) }))
                .filter((x) => x.p);
              if (!once.length) return <div className="text-[11px]" style={{ color: C.dim }}>Todavía no has puesto el once. Móntalo en Alineación y lo tendrás aquí.</div>;
              return (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {once.map(({ puesto, p }) => (
                      <span key={puesto} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border"
                        style={{ borderColor: C.line, background: C.panel2, color: C.chalk }}>
                        <span className="font-display tabular-nums" style={{ color: AC }}>{p.d}</span>
                        <span className="truncate max-w-[110px]">{p.n}</span>
                        <span className="text-[10px]" style={{ color: C.dim }}>{puesto}</span>
                      </span>
                    ))}
                  </div>
                  <div className="text-[11px] mt-2" style={{ color: C.dim }}>
                    {once.length} en el campo{once.length < 11 ? " · faltan puestos por cubrir" : ""}.
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* ---- ABP guardados ----
             En un córner no da tiempo a buscar entre treinta jugadas: aquí
             solo salen las de balón parado, agrupadas por situación, y al
             tocar una se abre la pizarra ya con ella puesta. */}
        {(visibleTabs.includes("pizarra") || abpGuardados.length > 0) && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: C.line }}>
            <div className="font-display text-xs uppercase tracking-widest mb-2" style={{ color: C.dim }}>{t("mt.abp")}</div>
            {abpGuardados.length === 0 ? (
              <div className="text-[11px]" style={{ color: C.dim }}>{t("mt.abpEmpty")}</div>
            ) : (
              <>
                {/* Cada jugada con su pizarra pequeña: desde el banquillo se
                    reconoce el dibujo antes que el nombre. Al tocarla se abre
                    en la pizarra grande, ya cargada. */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {abpGuardados.map((p) => {
                    const ti = ABP_TIPOS.find((x) => x.k === p.tipo) || {};
                    /* El delegado y las familias no tienen pizarra: para
                       ellos la jugada se mira, no se abre. La miniatura, que
                       es lo que sirve en el banquillo, la ven igual. */
                    const puedeAbrir = visibleTabs.includes("pizarra");
                    const Marco = puedeAbrir ? "button" : "div";
                    return (
                      <Marco key={p.id} {...(puedeAbrir ? { onClick: () => { setPendingPlayId(p.id); setTab("pizarra"); } } : {})}
                        className="text-left rounded-lg border p-1.5"
                        style={{ borderColor: C.line, background: C.panel2 }}>
                        <MiniPizarra play={p} ac={AC} />
                        <div className="flex items-center gap-1.5 mt-1.5 px-0.5">
                          <span className="shrink-0" style={{ color: AC }}>{ti.icon}</span>
                          <span className="flex-1 min-w-0 truncate text-xs" style={{ color: C.chalk }}>{p.name}</span>
                        </div>
                        <div className="text-[10px] px-0.5 truncate" style={{ color: C.dim }}>
                          {ti.k ? ABP_NOMBRE(ti.k, lang) : ""}{p.fase === "def" ? " · en contra" : p.fase === "ata" ? " · a favor" : ""}
                        </div>
                      </Marco>
                    );
                  })}
                </div>
                {visibleTabs.includes("pizarra") && <div className="text-[11px] mt-2" style={{ color: C.dim }}>{t("mt.abpTap")}</div>}
              </>
            )}
          </div>
        )}

      </Card>
      <Card title={t("mt.events")}>
        {events.length === 0 && <div className="text-sm" style={{ color: C.dim }}>{t("mt.noEvents")}</div>}
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {events.map((e, i) => (<div key={i} className="flex items-center text-sm border-b pb-2 last:border-0" style={{ borderColor: C.line, color: C.chalk }}><span className="font-display text-lg w-16 shrink-0" style={{ color: AC }}>{e.disp || e.min}'</span><span>{nombreEvento(e.type)}{e.player ? ` — ${e.player}` : ""}</span></div>))}
        </div>
        {/* Cerrar el acta se hacía solo desde Análisis, y el partido se acaba
            aquí. Sin esto había que acordarse de cambiar de pantalla, y lo que
            no se guarda no aparece luego en Estadísticas. */}
        {events.length > 0 && (
          <div className="mt-4 pt-3 border-t" style={{ borderColor: C.line }}>
            <button onClick={() => { guardarEnHistorico(); setActaGuardada(true); }}
              className="w-full min-h-12 rounded-lg font-display uppercase tracking-wide font-semibold"
              style={{ background: actaGuardada ? C.panel2 : AC, color: actaGuardada ? C.dim : C.sobre, border: `1px solid ${actaGuardada ? C.line : AC}` }}>
              {actaGuardada ? "✓ Acta guardada" : "Cerrar acta y guardar el partido"}
            </button>
            <div className="text-[11px] mt-2 leading-relaxed" style={{ color: C.dim }}>
              Guarda el resultado, el acta y lo que hizo cada jugador. Lo tendrás en Estadísticas, partido a partido.
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  /* ================= PLANIFICACIÓN DE TEMPORADA ================= */
  const planKey = `cb_plan_${session?.team?.id || "demo"}`;
  const [plan, setPlan] = useState({});
  useEffect(() => {
    if (!session) return;
    try { const raw = localStorage.getItem(planKey); setPlan(raw ? JSON.parse(raw) || {} : {}); } catch { setPlan({}); }
  }, [planKey]); // eslint-disable-line
  useEffect(() => {
    if (!session) return;
    try { localStorage.setItem(planKey, JSON.stringify(plan)); } catch { /* noop */ }
  }, [plan, planKey]); // eslint-disable-line
  /* Al entrar, la de Airtable manda sobre la del dispositivo: si tu segundo
     la cambió desde su móvil, quieres ver la suya, no la tuya de hace un mes.
     Si no hay nada guardado en la nube todavía, se respeta la local. */
  /* Mes cuyas recomendaciones están desplegadas. */
  const [mesAbierto, setMesAbierto] = useState(null);
  /* ================= RIVALES QUE TAMBIÉN USAN LA APP =================
     Cuando el rival de un partido es otra categoría dada de alta en COACHBASE,
     se puede enseñar su escudo de verdad en vez de un nombre suelto, y llevar
     el histórico de los enfrentamientos entre los dos. El listado de equipos
     es de lectura abierta, así que vale para cualquier rol. */
  const [equiposApp, setEquiposApp] = useState([]);
  useEffect(() => {
    if (!session || session.email === "demo") return;
    let vivo = true;
    airTeams().then((rows) => { if (vivo && Array.isArray(rows)) setEquiposApp(rows); });
    return () => { vivo = false; };
  }, [session?.email]); // eslint-disable-line
  /* Un rival se reconoce por el nombre del equipo, por el del club, o por los
     dos juntos ("CD Canillas Cadete A"), que es como se suele escribir en el
     calendario de la federación. */
  const rivalEnApp = (nombre) => {
    const n = String(nombre || "").trim();
    if (n.length < 3) return null;
    return equiposApp.find((e) => {
      if (e.rec === session?.team?.rec) return false;
      const completo = `${e.club || ""} ${e.name || ""}`.trim();
      return igualTexto(e.name, n) || igualTexto(completo, n) ||
        (e.club && e.name && igualTexto(n, `${e.name} ${e.club}`));
    }) || null;
  };
  /* Histórico de partidos jugados, en este dispositivo y por categoría. Los
     resultados no se guardan en la nube (la tabla de partidos solo tiene el
     calendario), así que lo que hay es lo que se haya registrado desde aquí. */
  const histKey = `cb_hist_${session?.team?.id || "demo"}`;
  const [historial, setHistorial] = useState([]);
  /* Partido del histórico cuya ficha por jugador está abierta en Estadísticas. */
  const [partidoStats, setPartidoStats] = useState(null);
  useEffect(() => {
    try { const raw = localStorage.getItem(histKey); setHistorial(raw ? JSON.parse(raw) || [] : []); }
    catch { setHistorial([]); }
  }, [histKey]);
  /* Ficha de cada jugador en ESTE partido: quién fue titular, quién entró, y
     lo que hizo. Se congela al cerrar el acta, con el nombre y el dorsal que
     tenía ese día: si el año que viene cambia de dorsal, el partido de octubre
     tiene que seguir contando lo que pasó en octubre. */
  const fichasDelPartido = () => {
    const convocados = players.filter((p) => called.has(p.id));
    const cuenta = (pid, tipo) => events.filter((e) => e.pid === pid && e.type === tipo).length;
    return convocados.map((p) => ({
      id: p.id, d: p.d, n: p.n, pos: p.pos,
      titular: starters.has(p.id),
      goles: cuenta(p.id, "gol"),
      tarjetas: cuenta(p.id, "tarjeta"),
      cambios: cuenta(p.id, "cambio"),
    }));
  };
  const guardarEnHistorico = () => {
    const fila = {
      id: Date.now(),
      fecha: hoyISO(),
      rival: matchInfo.rival || rivalProx || "Rival",
      j: matchInfo.j || nextMatchFix?.j || "",
      us: score.us, them: score.them,
      eventos: events.length,
      /* El acta entera y la ficha por jugador viajan con el partido: es lo que
         luego se abre desde Estadísticas, partido a partido. Si ya se había
         generado el análisis de IA antes de guardar, se congela también: si
         no, se puede generar más tarde desde la lista de "Análisis
         guardados", sin depender de que siga viva la partida en curso. */
      jugadores: fichasDelPartido(),
      acta: events.map((e) => ({ disp: e.disp || String(e.min), type: e.type, player: e.player, dorsal: e.dorsal })),
      lugar: matchInfo.lugar || "",
      analisis: postTxt || "",
    };
    setHistorial((h) => {
      const out = [fila, ...h].slice(0, 60);
      try { localStorage.setItem(histKey, JSON.stringify(out)); } catch { /* noop */ }
      return out;
    });
  };
  const [planBusy, setPlanBusy] = useState(false);
  const [planMsg, setPlanMsg] = useState("");
  useEffect(() => {
    const rec = session?.team?.rec;
    if (!rec || session?.email === "demo") return;
    let vivo = true;
    (async () => {
      const d = await airPlanLeer(rec);
      if (!vivo || !d?.plan) return;
      try {
        const remoto = JSON.parse(d.plan);
        if (remoto && typeof remoto === "object") setPlan(remoto);
      } catch { /* JSON corrupto en Airtable: se queda la local */ }
    })();
    return () => { vivo = false; };
  }, [session?.team?.rec]); // eslint-disable-line
  const guardarPlan = async () => {
    if (planBusy) return;
    if (!session?.team?.rec) { setPlanMsg("Este equipo todavía no está en la nube."); return; }
    setPlanBusy(true); setPlanMsg("");
    const out = await airPlanGuardar(session.team.rec, plan);
    setPlanBusy(false);
    setPlanMsg(out?.ok ? t("se.saved") : out?.reason === "no_autorizado"
      ? "Tu rol no puede guardar la planificación de este equipo."
      : "No se pudo guardar. Revisa la conexión.");
    if (out?.ok) setTimeout(() => setPlanMsg(""), 4000);
  };
  const togglePilar = (mes, k) => setPlan((p) => {
    const m = p[mes] || { pilares: [], objetivo: "" };
    const tiene = m.pilares.includes(k);
    return { ...p, [mes]: { ...m, pilares: tiene ? m.pilares.filter((x) => x !== k) : [...m.pilares, k] } };
  });
  const setObjetivoMes = (mes, v) => setPlan((p) => ({ ...p, [mes]: { ...(p[mes] || { pilares: [] }), objetivo: v } }));
  /* Cuántos meses lleva marcado cada pilar. Sirve para ver de un vistazo si la
     temporada se está yendo toda en táctico y no se toca el ABP en diez meses,
     que es el desequilibrio típico. */
  const repartoPilares = PILARES.map((pl) => ({
    ...pl,
    meses: MESES_TEMP.filter((m) => (plan[m.k]?.pilares || []).includes(pl.k)).length,
  }));

  const renderSeason = () => (
    <div className="space-y-4">
      <Card title={t("se.title")}>
        <div className="text-xs mb-4" style={{ color: C.dim }}>{t("se.hint")}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {repartoPilares.map((pl) => (
            <div key={pl.k} className="rounded-lg border p-3" style={{ borderColor: C.line, background: C.panel2 }}>
              <div className="flex items-center gap-2 font-display uppercase tracking-wide text-sm" style={{ color: pl.color }}>
                <span>{pl.icon}</span>{pl.name[lang] || pl.name.es}
              </div>
              <div className="text-[11px] mt-1 leading-snug" style={{ color: C.dim }}>{pl.desc[lang] || pl.desc.es}</div>
              <div className="mt-2 font-display text-2xl tabular-nums" style={{ color: pl.meses ? C.chalk : C.dim }}>
                {pl.meses}<span className="text-sm" style={{ color: C.dim }}> / {MESES_TEMP.length} {t("se.months")}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mt-1.5" style={{ background: C.bg }}>
                <div className="h-full rounded-full" style={{ width: `${(pl.meses / MESES_TEMP.length) * 100}%`, background: pl.color }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t("se.calendar")}>
        <div className="space-y-2">
          {MESES_TEMP.map((m) => {
            const d = plan[m.k] || { pilares: [], objetivo: "" };
            return (
              <div key={m.k} className="rounded-lg border p-3" style={{ borderColor: d.pilares.length ? C.line : "rgba(54,69,79,0.07)", background: C.panel2 }}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-display uppercase tracking-wide text-sm w-28 shrink-0" style={{ color: C.chalk }}>{m.es}</span>
                  {PILARES.map((pl) => {
                    const on = d.pilares.includes(pl.k);
                    return (
                      <button key={pl.k} onClick={() => togglePilar(m.k, pl.k)} aria-pressed={on}
                        className="flex items-center gap-1.5 text-xs font-display uppercase tracking-wide px-2.5 py-1.5 rounded-full border"
                        style={{ borderColor: on ? pl.color : C.line, color: on ? pl.color : C.dim, background: on ? `${pl.color}1A` : "transparent" }}>
                        <span>{pl.icon}</span>{pl.name[lang] || pl.name.es}
                      </button>
                    );
                  })}
                </div>
                <input value={d.objetivo} onChange={(e) => setObjetivoMes(m.k, e.target.value)}
                  placeholder={t("se.goalPh")} aria-label={`${t("se.goal")} ${m.es}`}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none border bg-transparent"
                  style={{ borderColor: C.line, color: C.chalk }} />
                {/* Lo que toca entrenar ese mes según lo que hayas marcado.
                    Se toca uno y se abre en la pizarra, montado. */}
                {d.pilares.length > 0 && (() => {
                  const props = [];
                  for (const k of d.pilares) {
                    for (const ex of ejerciciosDePilar(k)) {
                      if (!props.some((x) => x.ex.id === ex.id)) props.push({ ex, pilar: k });
                    }
                  }
                  if (!props.length) return null;
                  const abierto = mesAbierto === m.k;
                  const vistos = abierto ? props : props.slice(0, 3);
                  return (
                    <div className="mt-2">
                      <div className="text-[10px] font-display uppercase tracking-widest mb-1.5" style={{ color: C.dim }}>
                        Para entrenar esto
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {vistos.map(({ ex, pilar }) => {
                          const col = (PILARES.find((x) => x.k === pilar) || {}).color || AC;
                          return (
                            <button key={ex.id} onClick={() => { setPendingExId(ex.id); setTab("pizarra"); }}
                              className="flex items-center gap-1.5 text-xs px-2.5 py-2 rounded-lg border"
                              style={{ borderColor: C.line, background: C.panel, color: C.chalk }}>
                              <span style={{ color: col }}>{ex.icon}</span>
                              <span className="truncate max-w-[190px]">{ex.name[lang] || ex.name.es}</span>
                              <span className="text-[10px]" style={{ color: C.dim }}>{ex.dur}′</span>
                            </button>
                          );
                        })}
                        {props.length > 3 && (
                          <button onClick={() => setMesAbierto(abierto ? null : m.k)}
                            className="text-xs px-2.5 py-2 rounded-lg border" style={{ borderColor: C.line, color: AC }}>
                            {abierto ? "Ver menos" : `+${props.length - 3} más`}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t flex flex-wrap items-center gap-3" style={{ borderColor: C.line }}>
          <button onClick={guardarPlan} disabled={planBusy}
            className="font-display uppercase tracking-wide text-sm px-4 py-2.5 rounded-lg font-semibold disabled:opacity-50"
            style={{ background: AC, color: C.sobre }}>
            {planBusy ? t("a.sending") : t("se.share")}
          </button>
          {planMsg && <span className="text-xs" style={{ color: planMsg === t("se.saved") ? C.green : C.red }}>{planMsg}</span>}
          <span className="text-[11px]" style={{ color: C.dim }}>{t("se.shareNote")}</span>
        </div>
      </Card>
    </div>
  );

  const renderPostMatch = () => (
    <div className="space-y-4">
      <Card title={t("pm.title")}>
        {(() => {
          const rivalTxt = matchInfo.rival || "Rival";
          const eq = rivalEnApp(rivalTxt);
          return (
            <>
              {/* Marcador con los dos escudos cuando el rival también está en
                  la app: se reconoce el partido de un vistazo. */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <Crest src={clubInfo.crest || escudoDe(session.club) || crest} name={session.team.name} size={40} />
                  <div className="font-display text-3xl tabular-nums" style={{ color: C.chalk }}>
                    <span style={{ color: AC }}>{score.us}–{score.them}</span>
                  </div>
                  {eq ? <Crest src={eq.crest} name={eq.name} size={40} /> : null}
                  <div className="min-w-0">
                    <div className="text-sm truncate" style={{ color: C.chalk }}>{eq ? eq.name : rivalTxt}</div>
                    <div className="text-[11px] truncate" style={{ color: C.dim }}>
                      {eq ? `${eq.club || ""} · también usa COACHBASE` : "Rival"}
                    </div>
                  </div>
                </div>
                <div className="text-xs" style={{ color: C.dim }}>
                  {events.length} {t("pm.events")} · {tandasUsadas}/{tandasTotal} {t("mt.subs").toLowerCase()}
                </div>
              </div>

              {/* Histórico contra este rival y balance general. Sale de lo que
                  se haya guardado desde aquí, no se inventa nada. */}
              <div className="rounded-lg border p-3 mb-3" style={{ borderColor: C.line, background: C.panel2 }}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="font-display text-xs uppercase tracking-widest" style={{ color: C.dim }}>Histórico</div>
                  {events.length > 0 && (
                    <button onClick={guardarEnHistorico} className="text-[11px] px-2.5 py-1 rounded-lg border" style={{ borderColor: AC, color: AC }}>
                      + Guardar este resultado
                    </button>
                  )}
                </div>
                {(() => {
                  const contra = historial.filter((h) => igualTexto(h.rival, rivalTxt));
                  const balance = (lista) => lista.reduce((a, h) => {
                    a.gf += h.us; a.gc += h.them;
                    if (h.us > h.them) a.g++; else if (h.us === h.them) a.e++; else a.p++;
                    return a;
                  }, { g: 0, e: 0, p: 0, gf: 0, gc: 0 });
                  if (!historial.length) {
                    return <div className="text-[11px]" style={{ color: C.dim }}>Aún no has guardado ningún resultado. Guarda este y empezarás a tener el histórico de la categoría.</div>;
                  }
                  const bt = balance(historial), br = balance(contra);
                  return (
                    <>
                      <div className="flex flex-wrap gap-4 text-xs mb-2" style={{ color: C.chalk }}>
                        <span><strong style={{ color: C.green }}>{bt.g}</strong> G · <strong>{bt.e}</strong> E · <strong style={{ color: C.red }}>{bt.p}</strong> P</span>
                        <span style={{ color: C.dim }}>{bt.gf}–{bt.gc} en {historial.length} partido{historial.length === 1 ? "" : "s"}</span>
                      </div>
                      {contra.length > 0 ? (
                        <>
                          <div className="text-[11px] mb-1.5" style={{ color: C.dim }}>
                            Contra {eq ? eq.name : rivalTxt}: {br.g}G {br.e}E {br.p}P ({br.gf}–{br.gc})
                          </div>
                          <div className="flex flex-col gap-1">
                            {contra.slice(0, 5).map((h) => (
                              <div key={h.id} className="flex items-center gap-2 text-xs">
                                <span className="tabular-nums" style={{ color: C.dim }}>{h.fecha}</span>
                                <span className="font-display tabular-nums" style={{ color: h.us > h.them ? C.green : h.us === h.them ? C.chalk : C.red }}>{h.us}–{h.them}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-[11px]" style={{ color: C.dim }}>Primer partido guardado contra {eq ? eq.name : rivalTxt}.</div>
                      )}
                    </>
                  );
                })()}
              </div>
            </>
          );
        })()}
        {events.length === 0 ? (
          <div className="text-sm rounded-lg border p-4" style={{ borderColor: C.line, color: C.dim }}>
            {t("pm.empty")}
          </div>
        ) : (
          <>
            <button onClick={analizarPartido} disabled={postBusy}
              className="w-full font-display uppercase tracking-wider py-3 rounded-lg font-semibold disabled:opacity-50"
              style={{ background: AC, color: C.sobre }}>
              {postBusy ? t("pm.thinking") : postTxt ? t("pm.again") : t("pm.go")}
            </button>
            <div className="text-[11px] mt-2" style={{ color: C.dim }}>{t("pm.note")}</div>
          </>
        )}
        {postTxt && (
          <div className="mt-4">
            <pre className="whitespace-pre-wrap text-sm rounded-lg p-4 border font-body leading-relaxed" style={{ background: C.panel2, borderColor: C.line, color: C.chalk }}>{postTxt}</pre>
            <div className="mt-3 flex gap-2">
              <button onClick={copiarAnalisis} className="flex-1 font-display uppercase tracking-wider py-2.5 rounded-lg font-semibold" style={{ background: postCopiado ? C.green : C.panel2, color: postCopiado ? "#141414" : C.chalk, border: `1px solid ${C.line}` }}>
                {postCopiado ? t("tr.copied") : t("tr.copy")}
              </button>
              <a href={`https://wa.me/?text=${encodeURIComponent(postTxt)}`} target="_blank" rel="noreferrer" className="flex-1 text-center font-display uppercase tracking-wider py-2.5 rounded-lg font-semibold border" style={{ borderColor: C.line, color: C.chalk }}>{t("tr.whatsapp")}</a>
            </div>
          </div>
        )}
      </Card>

      {/* Un análisis por partido ya jugado, con su rival, su fecha y su
         jornada -no solo el del partido en curso de arriba-. Si al
         guardarlo en el histórico ya se había generado el informe, sale
         directo; si no, se puede generar aquí mismo a partir del acta que
         se guardó, sin depender de que la partida siga abierta. */}
      {historial.length > 0 && (
        <Card title="Análisis guardados">
          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
            {historial.map((h) => {
              const abierto = histAnalisisAbierto === h.id;
              const generando = histAnalisisBusyId === h.id;
              return (
                <div key={h.id} className="rounded-lg border p-3" style={{ borderColor: C.line, background: C.panel2 }}>
                  <button onClick={() => setHistAnalisisAbierto(abierto ? null : h.id)} className="w-full flex flex-wrap items-center justify-between gap-2 text-left">
                    <span className="flex items-center gap-2 min-w-0">
                      {h.j && <span className="font-display text-sm shrink-0" style={{ color: AC }}>J{h.j}</span>}
                      <span className="text-sm truncate" style={{ color: C.chalk }}>vs {h.rival}</span>
                      <span className="text-[11px] shrink-0" style={{ color: C.dim }}>{h.fecha}</span>
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="font-display tabular-nums text-sm" style={{ color: h.us > h.them ? C.green : h.us === h.them ? C.chalk : C.red }}>{h.us}–{h.them}</span>
                      <span style={{ color: C.dim }}>{abierto ? "▲" : "▼"}</span>
                    </span>
                  </button>
                  {abierto && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: C.line }}>
                      {h.analisis ? (
                        <pre className="whitespace-pre-wrap text-sm rounded-lg p-3 border font-body leading-relaxed" style={{ background: C.panel, borderColor: C.line, color: C.chalk }}>{h.analisis}</pre>
                      ) : (
                        <>
                          <div className="text-[11px] mb-2" style={{ color: C.dim }}>Este partido no tiene análisis guardado todavía.</div>
                          <button onClick={() => generarAnalisisHistorico(h)} disabled={generando}
                            className="w-full font-display uppercase tracking-wider py-2.5 rounded-lg font-semibold disabled:opacity-50" style={{ background: AC, color: C.sobre }}>
                            {generando ? t("pm.thinking") : "Generar análisis"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );

  const renderCoach = () => (
    <Card title="Coach AI — asistente del cuerpo técnico">
      <div className="space-y-3 overflow-y-auto pr-1" style={{ minHeight: 320, maxHeight: 460 }}>
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%] rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap" style={{ background: m.role === "user" ? AC : C.panel2, color: m.role === "user" ? "#141414" : C.chalk, border: m.role === "user" ? "none" : `1px solid ${C.line}` }}>{m.content}</div>
          </div>
        ))}
        {loading && <div className="text-sm" style={{ color: C.dim }}>Coach AI está pensando…</div>}
        <div ref={chatEnd} />
      </div>
      <div className="mt-3 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && askCoach()} placeholder="Pregunta a Coach AI…" className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none border" style={{ background: C.panel2, borderColor: C.line, color: C.chalk }} />
        <button onClick={askCoach} disabled={loading} className="font-display uppercase tracking-wider px-5 rounded-lg font-semibold disabled:opacity-50" style={{ background: AC, color: C.sobre }}>Enviar</button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {["¿Quién debería jugar más minutos la próxima jornada?", "Prepárame un entrenamiento de 75' de transiciones", "Analiza el partido con los eventos registrados"].map((q) => (<button key={q} onClick={() => setInput(q)} className="text-xs px-2.5 py-1 rounded-full border" style={{ borderColor: C.line, color: C.dim }}>{q}</button>))}
      </div>
    </Card>
  );

  const renderExercises = () => {
    const cats = [["all", t("ex.all")], ...EX_CATS.map((c) => [c, t("ex.cat." + c)])];
    const exVisible = isPro ? EXERCISES : EXERCISES.slice(0, FREE_CAPS.exercises);
    const items = exVisible.filter((ex) => exCat === "all" || ex.cat === exCat);
    return (
      <Card title={t("ex.title")}>
        <div className="text-xs mb-3" style={{ color: C.dim }}>{t("ex.hint")}</div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {cats.map(([k, lbl]) => (
            <button key={k} onClick={() => setExCat(k)} className="text-sm px-3 py-1.5 rounded-lg border font-display uppercase tracking-wide"
              style={{ borderColor: exCat === k ? AC : C.line, background: exCat === k ? AC : C.panel2, color: exCat === k ? "#141414" : C.chalk }}>{lbl}</button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((ex) => (
            <div key={ex.id} className="rounded-lg border p-4 flex flex-col" style={{ borderColor: C.line, background: C.panel2 }}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-3xl">{ex.icon}</div>
                <div className="text-[10px] font-display uppercase tracking-wide px-2 py-0.5 rounded-full border" style={{ borderColor: C.line, color: C.dim }}>{ex.dur} {t("ex.dur")}</div>
              </div>
              <div className="font-display text-lg font-semibold leading-tight" style={{ color: C.chalk }}>{ex.name[lang] || ex.name.es}</div>
              <div className="text-xs mt-1 mb-2 flex-1" style={{ color: C.dim }}>{(ex.desc && (ex.desc[lang] || ex.desc.es)) || ""}</div>
              <div className="text-[11px] mb-3 flex flex-wrap items-center gap-1" style={{ color: C.dim }}>
                <span>🎒 {t("ex.materials")}:</span>
                {((ex.materials && (ex.materials[lang] || ex.materials.es)) || []).map((m) => (
                  <a key={m} href={amzMat(m)} target="_blank" rel="noreferrer sponsored nofollow"
                    className="px-2 py-0.5 rounded-full border hover:underline" style={{ borderColor: C.line, color: C.chalk }}>{m} ↗</a>
                ))}
                {(!ex.materials || !(ex.materials[lang] || ex.materials.es)?.length) && <span>—</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setPendingExId(ex.id); setTab("pizarra"); }} className="flex-1 text-sm px-3 py-1.5 rounded-lg font-display uppercase tracking-wide font-semibold" style={{ background: AC, color: C.sobre }}>{t("ex.useBoard")}</button>
                {can("editTraining") && (
                  <button onClick={() => addTrainBlock({ name: ex.name[lang] || ex.name.es, dur: ex.dur, materials: (ex.materials && (ex.materials[lang] || ex.materials.es)) || [], exId: ex.id })}
                    className="flex-1 text-sm px-3 py-1.5 rounded-lg border font-display uppercase tracking-wide" style={{ borderColor: C.line, color: C.chalk }}>{t("ex.addTrain")}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  const renderTraining = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Plantillas: guardar la sesión actual como guion reutilizable, cargar
          una guardada, y compartirla con el resto de equipos del club. */}
      <Card title={t("pl.title")} className="lg:col-span-2">
        <div className="text-xs mb-3" style={{ color: C.dim }}>{t("pl.hint")}</div>

        <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b" style={{ borderColor: C.line }}>
          <input value={plNombre} onChange={(e) => setPlNombre(e.target.value)}
            placeholder={t("pl.namePh")} className="flex-1 min-w-[180px] rounded-lg px-3 py-2 text-sm outline-none border bg-transparent"
            style={{ borderColor: C.line, color: C.chalk }} />
          <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: C.dim }}>
            <input type="checkbox" checked={plCompartir} onChange={(e) => setPlCompartir(e.target.checked)} />
            {t("pl.shareClub")}
          </label>
          <button onClick={guardarPlantilla} disabled={!plNombre.trim() || !trainBlocks.length || plBusy}
            className="px-3 py-2 rounded-lg font-display uppercase tracking-wide text-sm font-semibold disabled:opacity-40"
            style={{ background: AC, color: C.sobre }}>
            {plBusy ? t("pl.saving") : t("pl.save")}
          </button>
          {!trainBlocks.length && <span className="text-[11px]" style={{ color: C.dim }}>{t("pl.needBlocks")}</span>}
          {plMsg && <span className="text-[11px]" style={{ color: plMsg.startsWith("✓") ? C.green : C.red }}>{plMsg}</span>}
        </div>

        {guionesReutilizables.length === 0 ? (
          <div className="text-sm" style={{ color: C.dim }}>{t("pl.empty")}</div>
        ) : (
          <div className="space-y-1.5">
            {guionesReutilizables.map((p) => (
              <div key={p.rec} className="flex flex-wrap items-center gap-2 py-2 px-2.5 rounded-lg border" style={{ borderColor: C.line }}>
                <div className="flex-1 min-w-[160px]">
                  <div className="text-sm" style={{ color: C.chalk }}>
                    {p.nombre}
                    {p.compartida && <span className="ml-2 text-[10px] font-display uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: C.panel2, color: AC }}>{t("pl.shared")}</span>}
                    {!p.propia && <span className="ml-1 text-[10px]" style={{ color: C.dim }}>· {t("pl.fromClub")}</span>}
                  </div>
                  <div className="text-[11px]" style={{ color: C.dim }}>
                    {p.duracion} min · {t("pl.uses")}: {p.usos}{p.objetivo ? ` · ${p.objetivo}` : ""}
                  </div>
                </div>
                <button onClick={() => usarPlantilla(p)} className="text-xs px-2.5 py-1.5 rounded-lg border font-display uppercase tracking-wide"
                  style={{ borderColor: AC, color: AC }}>{t("pl.use")}</button>
                {p.propia && (
                  <>
                    <button onClick={() => compartirPlantilla(p)} title={t("pl.shareClub")}
                      className="text-xs px-2 py-1.5 rounded-lg border" style={{ borderColor: C.line, color: p.compartida ? AC : C.dim }}>
                      {p.compartida ? "🔓" : "🔒"}
                    </button>
                    <button onClick={() => borrarPlantilla(p)} aria-label={t("pl.delete")}
                      className="text-xs px-2 py-1.5 rounded-lg border" style={{ borderColor: C.line, color: C.red }}>✕</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sesiones ya publicadas (guardadas o aprobadas de una propuesta): las
          ve todo el cuerpo técnico, no solo quien las guardó -antes esta
          lista no existía en ningún sitio, aunque la sesión sí llegara a
          Airtable-. La más próxima primero. */}
      {sesionesPublicadas.length > 0 && (
        <Card title="Sesiones publicadas" className="lg:col-span-2">
          <div className="space-y-1.5">
            {sesionesPublicadas.map((p) => (
              <div key={p.rec} className="flex flex-wrap items-center gap-2 py-2 px-2.5 rounded-lg border"
                style={{ borderColor: p.rec === proximaSesionPublicada?.rec ? AC : C.line, background: p.rec === proximaSesionPublicada?.rec ? C.panel2 : "transparent" }}>
                <div className="flex-1 min-w-[160px]">
                  <div className="text-sm" style={{ color: C.chalk }}>
                    {[fechaLegible(p.fecha, lang), p.hora].filter(Boolean).join(" · ") || p.nombre}
                    {p.rec === proximaSesionPublicada?.rec && (
                      <span className="ml-2 text-[10px] font-display uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: AC, color: C.sobre }}>Próxima</span>
                    )}
                  </div>
                  <div className="text-[11px]" style={{ color: C.dim }}>
                    {p.duracion} min{p.objetivo ? ` · ${p.objetivo}` : ""}
                  </div>
                </div>
                <button onClick={() => usarPlantilla(p)} className="text-xs px-2.5 py-1.5 rounded-lg border font-display uppercase tracking-wide"
                  style={{ borderColor: AC, color: AC }}>Cargar</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title={t("tr.title")}>
        <div className="text-xs mb-3" style={{ color: C.dim }}>{t("tr.hint")}</div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <div className="text-[11px] font-display uppercase tracking-widest" style={{ color: C.dim }}>{t("tr.date")}</div>
            {/* Antes era texto libre ("Viernes 31"): parecía una fecha pero no
                lo era para el resto de la app -ni el calendario del mes ni la
                sesión publicada sabían compararla con nada-, así que nunca
                se marcaba el día en Calendario ni se podía ordenar por
                fecha. Con un selector real la fecha es siempre AAAA-MM-DD. */}
            <input type="date" value={/^\d{4}-\d{2}-\d{2}$/.test(trainMeta.fecha) ? trainMeta.fecha : ""}
              onChange={(e) => setTrainMeta((m) => ({ ...m, fecha: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none border" style={{ background: C.panel2, borderColor: C.line, color: C.chalk }} />
          </div>
          <div>
            <div className="text-[11px] font-display uppercase tracking-widest" style={{ color: C.dim }}>{t("tr.time")}</div>
            <input value={trainMeta.hora} onChange={(e) => setTrainMeta((m) => ({ ...m, hora: e.target.value }))} className="w-full rounded-lg px-3 py-2 text-sm outline-none border" style={{ background: C.panel2, borderColor: C.line, color: C.chalk }} />
          </div>
        </div>
        <div className="mb-4">
          <div className="text-[11px] font-display uppercase tracking-widest" style={{ color: C.dim }}>{t("tr.objective")}</div>
          <input value={trainMeta.objetivo} onChange={(e) => setTrainMeta((m) => ({ ...m, objetivo: e.target.value }))} placeholder={t("tr.objectivePh")} className="w-full rounded-lg px-3 py-2 text-sm outline-none border" style={{ background: C.panel2, borderColor: C.line, color: C.chalk }} />
        </div>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab("ejercicios")} className="flex-1 text-sm px-3 py-2 rounded-lg border font-display uppercase tracking-wide" style={{ borderColor: AC, color: AC }}>{t("tr.addFromLib")}</button>
          <button onClick={() => addTrainBlock({ name: t("tr.newBlock"), dur: 15, materials: [] })} className="flex-1 text-sm px-3 py-2 rounded-lg border font-display uppercase tracking-wide" style={{ borderColor: C.line, color: C.chalk }}>{t("tr.addCustom")}</button>
        </div>
        {trainBlocks.length === 0
          ? <div className="text-sm" style={{ color: C.dim }}>{t("tr.noBlocks")}</div>
          : (
            <div className="space-y-2">
              {trainBlocks.map((b, i) => (
                <div key={b.id} className="rounded-lg border p-3 flex items-center gap-3" style={{ borderColor: C.line, background: C.panel2 }}>
                  <div className="flex-1 min-w-0">
                    {b.exId
                      ? <div className="truncate" style={{ color: C.chalk }}>{b.name}</div>
                      : <input value={b.name} onChange={(e) => setTrainBlocks((bs) => bs.map((x) => (x.id === b.id ? { ...x, name: e.target.value } : x)))} className="w-full bg-transparent outline-none text-sm" style={{ color: C.chalk }} />}
                    <div className="text-[11px] flex items-center flex-wrap gap-x-2" style={{ color: C.dim }}>
                      <span className="flex items-center gap-1">
                        <input type="number" min={1} value={b.dur} onChange={(e) => setTrainBlocks((bs) => bs.map((x) => (x.id === b.id ? { ...x, dur: Number(e.target.value) || 0 } : x)))} className="w-12 bg-transparent outline-none border-b" style={{ borderColor: C.line, color: C.dim }} /> {t("tr.min")}
                      </span>
                      {b.materials?.length ? <span>🎒 {b.materials.join(", ")}</span> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => moveTrainBlock(b.id, -1)} disabled={i === 0} className="text-xs disabled:opacity-30" style={{ color: C.dim }}>{t("tr.up")}</button>
                    <button onClick={() => moveTrainBlock(b.id, 1)} disabled={i === trainBlocks.length - 1} className="text-xs disabled:opacity-30" style={{ color: C.dim }}>{t("tr.down")}</button>
                    {b.exId && <button onClick={() => { setPendingExId(b.exId); setTab("pizarra"); }} className="text-xs underline" style={{ color: AC }}>{t("tr.sendBoard")}</button>}
                    <button onClick={() => removeTrainBlock(b.id)} className="text-xs" style={{ color: C.red }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        {/* ---- Duración objetivo y guardado de la sesión ----
             La barra se llena según se añaden bloques: de un vistazo se ve si
             falta entreno por montar o si la sesión se va de tiempo. */}
        <div className="mt-4 pt-3 border-t" style={{ borderColor: C.line }}>
          <div className="font-display text-xs uppercase tracking-widest mb-2" style={{ color: C.dim }}>{t("tr.target")}</div>
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {[30, 60, 90, 120].map((m) => (
              <button key={m} onClick={() => setTrainTarget(m)}
                className="text-xs font-display uppercase tracking-wide px-3 py-1.5 rounded-full border"
                style={{ borderColor: trainTarget === m ? AC : C.line, color: trainTarget === m ? AC : C.dim }}>
                {m < 60 ? `${m}′` : m % 60 === 0 ? `${m / 60} h` : `${Math.floor(m / 60)} h ${m % 60}′`}
              </button>
            ))}
            <input type="number" min={5} max={240} step={5} value={trainTarget}
              onChange={(e) => setTrainTarget(Math.max(5, Math.min(240, Number(e.target.value) || 5)))}
              aria-label={t("tr.target")}
              className="w-20 px-2 py-1.5 rounded-lg border bg-transparent text-sm text-center tabular-nums"
              style={{ borderColor: C.line, color: C.chalk }} />
            <span className="text-xs" style={{ color: C.dim }}>{t("tr.min")}</span>
          </div>

          <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: C.panel2 }}>
            <div className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${Math.min(100, (trainTotal / Math.max(1, trainTarget)) * 100)}%`, background: trainSobran > 0 ? C.red : trainCompleta ? C.green : AC }} />
          </div>
          <div className="flex items-center justify-between text-sm mb-3" style={{ color: C.chalk }}>
            <span>{t("tr.total")}</span>
            <span className="font-display text-lg tabular-nums" style={{ color: trainSobran > 0 ? C.red : trainCompleta ? C.green : AC }}>
              {trainTotal} / {trainTarget} {t("tr.min")}
            </span>
          </div>
          <div className="text-[11px] mb-3" style={{ color: C.dim }}>
            {trainSobran > 0 ? t("tr.over").replace("{n}", trainSobran)
              : trainFaltan > 0 ? t("tr.left").replace("{n}", trainFaltan)
              : t("tr.done")}
          </div>

          {canProposeChanges() && miPropuestaPendiente("training") ? (
            <div className="rounded-lg border px-3 py-2.5 text-center text-sm" style={{ borderColor: C.warn, background: `${C.warn}10`, color: C.warn }}>
              ⏳ Tienes una propuesta de entrenamiento esperando aprobación
            </div>
          ) : (
            <button onClick={guardarSesion} disabled={!trainCompleta || sesBusy}
              className="w-full font-display uppercase tracking-wider py-2.5 rounded-lg font-semibold disabled:opacity-40"
              style={{ background: AC, color: C.sobre }}>
              {sesBusy ? t("a.sending") : canProposeChanges() ? "Enviar propuesta al entrenador" : t("tr.saveSession")}
            </button>
          )}
          {!trainCompleta && !miPropuestaPendiente("training") && (
            <div className="text-[11px] mt-1.5 text-center" style={{ color: C.dim }}>
              {trainBlocks.length === 0 ? t("pl.needBlocks") : t("tr.left").replace("{n}", trainFaltan)}
            </div>
          )}
          {sesMsg && <div className="text-xs mt-2 text-center" style={{ color: sesMsg.startsWith("✓") ? C.green : C.red }}>{sesMsg}</div>}
        </div>
      </Card>
      <Card title={t("tr.summary")}>
        <pre className="whitespace-pre-wrap text-sm rounded-lg p-4 border font-body leading-relaxed" style={{ background: C.panel2, borderColor: C.line, color: C.chalk }}>{trainSummary()}</pre>
        <div className="mt-3 flex gap-2">
          <button onClick={copyTrainSummary} className="flex-1 font-display uppercase tracking-wider py-2.5 rounded-lg font-semibold" style={{ background: trainCopied ? C.green : AC, color: C.sobre }}>{trainCopied ? t("tr.copied") : t("tr.copy")}</button>
          <a href={`https://wa.me/?text=${encodeURIComponent(trainSummary())}`} target="_blank" rel="noreferrer" className="flex-1 text-center font-display uppercase tracking-wider py-2.5 rounded-lg font-semibold border" style={{ borderColor: C.line, color: C.chalk }}>{t("tr.whatsapp")}</a>
        </div>
      </Card>
    </div>
  );

  const renderStats = () => {
    const total = players.length || 1;
    /* Acumulado de la temporada a partir del histórico de partidos: quién ha
       jugado cuántos, cuántos ha empezado, y lo que ha hecho. Solo cuenta lo
       que se haya registrado en Modo partido y guardado en el acta. */
    const conFicha = historial.filter((m) => Array.isArray(m.jugadores) && m.jugadores.length);
    const acumulado = (() => {
      const mapa = new Map();
      for (const m of conFicha) {
        for (const j of m.jugadores) {
          const k = j.id ?? `${j.d}-${j.n}`;
          const a = mapa.get(k) || { d: j.d, n: j.n, convocado: 0, titular: 0, goles: 0, tarjetas: 0 };
          a.convocado += 1;
          a.titular += j.titular ? 1 : 0;
          a.goles += j.goles || 0;
          a.tarjetas += j.tarjetas || 0;
          a.d = j.d; a.n = j.n;
          mapa.set(k, a);
        }
      }
      return [...mapa.values()].sort((x, y) => y.goles - x.goles || y.titular - x.titular || x.d - y.d);
    })();
    const abierto = conFicha.find((m) => m.id === partidoStats) || null;
    const avail2 = players.filter((p) => p.st === "disponible").length;
    const doubt = players.filter((p) => p.st === "duda").length;
    const injured = players.filter((p) => p.st === "lesionado").length;
    const topAtt = [...players].sort((a, b) => attPct(b) - attPct(a)).slice(0, 6);
    const lowMinAll = [...players].sort((a, b) => a.min - b.min).slice(0, 6);
    const maxMin = Math.max(1, ...players.map((p) => p.min));
    const posGroup = (pos) => (pos === "POR" ? "gk" : ["LD", "DFC", "LI"].includes(pos) ? "def" : ["MCD", "MC", "MCO"].includes(pos) ? "mid" : "fwd");
    const groups = { gk: 0, def: 0, mid: 0, fwd: 0 };
    players.forEach((p) => { groups[posGroup(p.pos)] += 1; });
    const maxGroup = Math.max(1, ...Object.values(groups));
    /* Desglose fino: por demarcación exacta, no por línea. Se recorre POS_OK
       para que el orden sea siempre el mismo (portería → ataque) y no baile
       según quién esté dado de alta; las demarcaciones sin nadie no se pintan. */
    const porPos = POS_OK
      .map((k) => ({ k, label: POS_NOMBRE[k] || k, n: players.filter((p) => p.pos === k).length }))
      .filter((x) => x.n > 0);
    const maxPos = Math.max(1, ...porPos.map((x) => x.n));
    const Bar = ({ pct, color }) => (
      <div className="h-2 rounded-full overflow-hidden" style={{ background: C.bg }}>
        <div className="h-full rounded-full" style={{ width: `${clamp(pct, 0, 100)}%`, background: color }} />
      </div>
    );
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={t("st.availability")}>
          <div className="space-y-1.5 text-sm" style={{ color: C.chalk }}>
            <div className="flex items-center justify-between"><span>{t("st.available")}</span><span>{avail2}/{total}</span></div>
            <Bar pct={(avail2 / total) * 100} color={C.green} />
            <div className="flex items-center justify-between mt-2"><span>{t("st.doubt")}</span><span>{doubt}/{total}</span></div>
            <Bar pct={(doubt / total) * 100} color={C.warn} />
            <div className="flex items-center justify-between mt-2"><span>{t("st.injured")}</span><span>{injured}/{total}</span></div>
            <Bar pct={(injured / total) * 100} color={C.red} />
          </div>
        </Card>
        <Card title={t("st.byPosition")}>
          <div className="space-y-2 text-sm" style={{ color: C.chalk }}>
            {[["gk", "st.gkPos"], ["def", "st.defPos"], ["mid", "st.midPos"], ["fwd", "st.fwdPos"]].map(([k, lk]) => (
              <div key={k}>
                <div className="flex items-center justify-between"><span>{t(lk)}</span><span>{groups[k]} {t("st.players")}</span></div>
                <Bar pct={(groups[k] / maxGroup) * 100} color={AC} />
              </div>
            ))}
          </div>
        </Card>
        <Card title={t("st.byRole")} className="lg:col-span-2">
          <div className="text-[11px] mb-3" style={{ color: C.dim }}>{t("st.roleHint")}</div>
          {porPos.length === 0 ? (
            <div className="text-sm" style={{ color: C.dim }}>{t("as.noPlayers")}</div>
          ) : (
            <>
              <div className="space-y-2 text-sm" style={{ color: C.chalk }}>
                {porPos.map((x) => (
                  <div key={x.k}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate">
                        <span className="font-display mr-2" style={{ color: AC }}>{x.k}</span>{x.label}
                      </span>
                      <span className="shrink-0 tabular-nums" style={{ color: C.dim }}>
                        {x.n} {t(x.n === 1 ? "st.player" : "st.players")} · {Math.round((x.n / total) * 100)}%
                      </span>
                    </div>
                    <Bar pct={(x.n / maxPos) * 100} color={AC} />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t font-display uppercase tracking-wide"
                style={{ borderColor: C.line, color: C.chalk }}>
                <span>{t("st.total")}</span>
                <span className="tabular-nums">{players.length} {t(players.length === 1 ? "st.player" : "st.players")}</span>
              </div>
            </>
          )}
        </Card>
        <Card title={t("st.topAtt")}>
          <div className="space-y-2">
            {topAtt.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-sm" style={{ color: C.chalk }}>
                <span className="w-24 shrink-0 truncate">#{p.d} {p.n.split(" ")[0]}</span>
                <div className="flex-1"><Bar pct={attPct(p)} color={AC} /></div>
                <span className="w-10 text-right shrink-0" style={{ color: C.dim }}>{attPct(p)}%</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title={t("st.lowMin")}>
          <div className="space-y-2">
            {lowMinAll.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-sm" style={{ color: C.chalk }}>
                <span className="w-24 shrink-0 truncate">#{p.d} {p.n.split(" ")[0]}</span>
                <div className="flex-1"><Bar pct={(p.min / maxMin) * 100} color="#36454F" /></div>
                <span className="w-12 text-right shrink-0" style={{ color: C.dim }}>{p.min}'</span>
              </div>
            ))}
          </div>
        </Card>

        {/* ---- Partido a partido ----
             Los cuatro cuadros de arriba son la foto de hoy. Esto es la
             temporada: cada partido guardado con su acta y la ficha de cada
             jugador, para poder abrir el de la jornada 7 y ver quién jugó. */}
        <div className="lg:col-span-2">
          <Card title="Partido a partido">
            {conFicha.length === 0 ? (
              <div className="text-sm" style={{ color: C.dim }}>
                Todavía no hay partidos con acta. Registra el partido en Modo partido y guárdalo en el histórico:
                a partir de ahí aparecerá aquí, con lo que hizo cada jugador.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {conFicha.map((m) => {
                    const sel = m.id === partidoStats;
                    const res = m.us > m.them ? C.green : m.us < m.them ? C.red : C.dim;
                    return (
                      <button key={m.id} onClick={() => setPartidoStats(sel ? null : m.id)}
                        className="text-left rounded-lg border px-2.5 py-2 min-w-[9.5rem]"
                        style={{ borderColor: sel ? AC : C.line, background: sel ? C.panel2 : "transparent" }}>
                        <div className="text-xs truncate" style={{ color: C.chalk }}>{m.rival}</div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-lg tabular-nums" style={{ color: res }}>{m.us}-{m.them}</span>
                          <span className="text-[10px]" style={{ color: C.dim }}>{m.fecha}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {abierto ? (
                  <div className="rounded-lg border overflow-hidden" style={{ borderColor: C.line }}>
                    <div className="px-3 py-2 text-xs flex items-center justify-between" style={{ background: C.panel2, color: C.chalk }}>
                      <span>{abierto.rival} · {abierto.fecha}{abierto.lugar ? ` · ${abierto.lugar}` : ""}</span>
                      <span className="font-display text-base tabular-nums" style={{ color: AC }}>{abierto.us}-{abierto.them}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm" style={{ color: C.chalk }}>
                        <thead>
                          <tr className="text-[10px] font-display uppercase tracking-widest" style={{ color: C.dim }}>
                            <th className="text-left px-3 py-1.5">Jugador</th>
                            <th className="px-2 py-1.5">Titular</th>
                            <th className="px-2 py-1.5">Goles</th>
                            <th className="px-2 py-1.5">Tarjetas</th>
                            <th className="px-2 py-1.5">Cambios</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...abierto.jugadores].sort((a, b) => Number(b.titular) - Number(a.titular) || a.d - b.d).map((j) => (
                            <tr key={j.id ?? `${j.d}${j.n}`} className="border-t" style={{ borderColor: C.line }}>
                              <td className="px-3 py-1.5 truncate">#{j.d} {j.n}</td>
                              <td className="px-2 py-1.5 text-center" style={{ color: j.titular ? C.green : C.dim }}>{j.titular ? "✓" : "—"}</td>
                              <td className="px-2 py-1.5 text-center tabular-nums">{j.goles || "—"}</td>
                              <td className="px-2 py-1.5 text-center tabular-nums">{j.tarjetas || "—"}</td>
                              <td className="px-2 py-1.5 text-center tabular-nums">{j.cambios || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {Array.isArray(abierto.acta) && abierto.acta.length > 0 && (
                      <div className="px-3 py-2 border-t text-[11px] leading-relaxed" style={{ borderColor: C.line, color: C.dim }}>
                        {[...abierto.acta].reverse().map((e, i) => (
                          <span key={i}>{i > 0 && " · "}{e.disp}′ {nombreEvento(e.type)}{e.player ? ` ${e.player}` : ""}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px]" style={{ color: C.dim }}>Toca un partido para ver la ficha de cada jugador y el acta.</div>
                )}
              </>
            )}
          </Card>
        </div>

        {acumulado.length > 0 && (
          <div className="lg:col-span-2">
            <Card title={`Temporada · ${conFicha.length} ${conFicha.length === 1 ? "partido" : "partidos"}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ color: C.chalk }}>
                  <thead>
                    <tr className="text-[10px] font-display uppercase tracking-widest" style={{ color: C.dim }}>
                      <th className="text-left px-3 py-1.5">Jugador</th>
                      <th className="px-2 py-1.5">Convocado</th>
                      <th className="px-2 py-1.5">Titular</th>
                      <th className="px-2 py-1.5">Goles</th>
                      <th className="px-2 py-1.5">Tarjetas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acumulado.map((a) => (
                      <tr key={`${a.d}${a.n}`} className="border-t" style={{ borderColor: C.line }}>
                        <td className="px-3 py-1.5 truncate">#{a.d} {a.n}</td>
                        <td className="px-2 py-1.5 text-center tabular-nums">{a.convocado}</td>
                        <td className="px-2 py-1.5 text-center tabular-nums">{a.titular}</td>
                        <td className="px-2 py-1.5 text-center tabular-nums" style={{ color: a.goles ? AC : C.dim }}>{a.goles || "—"}</td>
                        <td className="px-2 py-1.5 text-center tabular-nums">{a.tarjetas || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  };

  const renderMaterial = () => {
    const cats = [["all", "m.all"], ["training", "m.training"], ["gk", "m.gk"], ["medical", "m.medical"], ["tech", "m.tech"], ["apparel", "m.apparel"]];
    const items = STORE.filter((p) => mkCat === "all" || p.cat === mkCat);
    return (
      <Card title={t("m.title")}>
        <div className="text-xs mb-2" style={{ color: C.dim }}>{t("m.note")}</div>
        <div className="text-[11px] mb-4 rounded-lg border px-3 py-2 leading-relaxed" style={{ borderColor: C.line, color: C.dim }}>
          En calidad de Afiliado de Amazon, EBLDigital obtiene ingresos por las compras adscritas que cumplen los requisitos aplicables.
          El precio para ti es exactamente el mismo. Los enlaces abren una búsqueda en Amazon: no mostramos precios porque cambian a diario
          y preferimos que veas el real antes de comprar.
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {cats.map(([k, tk]) => (
            <button key={k} onClick={() => setMkCat(k)} className="text-sm px-3 py-1.5 rounded-lg border font-display uppercase tracking-wide"
              style={{ borderColor: mkCat === k ? AC : C.line, background: mkCat === k ? AC : C.panel2, color: mkCat === k ? "#141414" : C.chalk }}>{t(tk)}</button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((p) => (
            <div key={p.id} className="rounded-lg border p-4 flex flex-col" style={{ borderColor: C.line, background: C.panel2 }}>
              <div className="text-4xl mb-2">{p.icon}</div>
              <div className="font-display text-lg font-semibold leading-tight" style={{ color: C.chalk }}>{p.name[lang] || p.name.en}</div>
              <div className="text-xs mt-1 mb-3 flex-1" style={{ color: C.dim }}>{p.desc[lang] || p.desc.en}</div>
              <a href={amz(p.q)} target="_blank" rel="noreferrer sponsored nofollow"
                className="text-sm px-3 py-2 rounded-lg font-display uppercase tracking-wide font-semibold text-center" style={{ background: AC, color: C.sobre }}>
                Ver en Amazon
              </a>
              <div className="text-[10px] mt-2 font-display uppercase tracking-wide" style={{ color: C.dim }}>· {t("m.aff")}</div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  const doLogin = async ({ email, password, role }) => {
    const em = String(email).trim().toLowerCase();
    if (em === "demo" && password === "demo") {
      const r = ROLES[role] ? role : "entrenador";
      /* pro: true — la demo enseña la app completa. Con los apartados de pago
         bloqueados no se veía casi nada y quien entraba a mirar se llevaba la
         impresión de que la app estaba vacía. Aquí no se cobra nada: son datos
         de ejemplo que no salen de este dispositivo. */
      /* Pase firmado solo para la demo: sin él, Coach AI responde 401. No abre
         ningún dato —las lecturas de Airtable exigen id o equipo—, solo permite
         hablar con el asistente. */
      airDemoToken().then((out) => { if (out?.token) setAuthToken(out.token); });
      const demoTeam = makeTeam("infantil", "B");
      const demoCategories = getCategoriesForUser(1, r, DEMO_CLUB);
      const demoCat = getDefaultCategory(1, r, DEMO_CLUB);
      setSession({
        name: `Demo · ${ROLES[r].label}`,
        role: r, plan: "oficial", pro: true, club: DEMO_CLUB, comunidad: "Comunidad de Madrid", email: "demo",
        team: demoTeam,
        categories: demoCategories.map((c) => c.name),
        currentCategory: demoCat?.name || demoTeam?.name,
        /* getDefaultCategory resuelve al director por CLUB (ve todas las
           categorías del club, sin mirar su id) y al resto por id exacto
           dentro de CATEGORIES_INIT: con el id fijo de la demo (1), el
           director sale con "cat_1" y el resto con ninguna. Incluso en la
           demo, eso dejaba al director sin ver nunca las propuestas de su
           propio segundo -mismo fallo que en cuentas reales, ver
           miEquipoKey más abajo-, así que aquí se cae a la única categoría
           que existe en la demo en vez de a "sin categoría". */
        categoryId: demoCat?.id || CATEGORIES_INIT[0]?.id,
        userId: 1,
      });
      setTab("inicio");
      return null;
    }
    const res = await airLogin(em, password);
    let name, roleLabel, estado, plan = "oficial";
    let club = DEMO_CLUB, comunidad = "Comunidad de Madrid", team = makeTeam("infantil", "B");
    if (res && res.ok) {
      setAuthToken(res.token || null);
      name = res.user.name; roleLabel = res.user.rol;
      estado = String(res.user.estado || "").toLowerCase();
      plan = String(res.user.plan || "Oficial").toLowerCase() === "gratis" ? "free" : "oficial";
      if (res.user.club) club = res.user.club;
      if (res.user.comunidad) comunidad = res.user.comunidad;
      if (res.user.team) team = res.user.team;
    } else if (res && res.ok === false) {
      return T(lang, "a.badCreds");
    } else {
      // Sin backend (preview / drag&drop): login demo con los usuarios sembrados
      const d = DEMO_LOGIN[em];
      if (!d || password !== DEMO_PASS) return T(lang, "a.badCreds");
      name = d.name; roleLabel = ROL2LABEL[d.role]; estado = d.estado;
    }
    if (estado === "suspendido") return T(lang, "a.accSusp");
    startTrial(em);
    const finalRole = LABEL2ROL[roleLabel] || "entrenador";
    const userCategories = getCategoriesForUser(res?.user?.id || 0, finalRole, club);
    const defaultCat = getDefaultCategory(res?.user?.id || 0, finalRole, club);
    setSession({
      name, role: finalRole, plan, club, comunidad, email: em, team,
      /* Roles adicionales de verdad (ej. segundo + delegado a la vez), tal y
         como los devuelve el login real. En la demo/sin backend se queda
         vacío: ahí los roles combinados se simulan con CATEGORIES_INIT. */
      rolesExtra: res?.user?.rolesExtra || [],
      categories: userCategories.map((c) => c.name),
      currentCategory: defaultCat?.name || (team?.name),
      /* Si no hay categoría de demo para este usuario (caso normal con un
         usuario real de Airtable), se usa el id real del equipo: así las
         propuestas persistidas en Airtable quedan ancladas a ESE equipo, no a
         un "cat_x" que solo existe en la demo. */
      categoryId: defaultCat?.id || team?.rec,
      pendingApproval: estado !== "activo",
      prueba: Number(res?.user?.prueba) || 0,
      userId: res?.user?.id,
    });
    setTab("inicio");
    return null;
  };
  const doRegister = async (p) => {
    const esLibre = p.plan === "free";
    const esClubFounder = p.plan === "club";
    const res = await airRegister({
      name: p.name, email: String(p.email).trim(), password: p.pass,
      /* El backend decide el modo (invitación / independiente / fundar club)
         mirando este campo en minúsculas — antes aquí se mandaba "Gratis" u
         "Oficial" para las dos vías antiguas, y la vía "club" nunca habría
         llegado a activarse porque se perdía en la traducción. */
      rol: ROL2LABEL[p.role] || "Entrenador principal", plan: p.plan,
      club: p.club || "Mi equipo", comunidad: p.comunidad,
      team: { name: p.team?.name, cat: p.team?.cat, f7: !!p.team?.f7 },
    });
    if (!res) return { error: mensajeFalloAir(t) };
    /* Alta oficial solo por invitación: si el club no ha creado antes la ficha,
       no se puede entrar en un equipo oficial por cuenta propia. */
    if (res.ok === false && res.reason === "sin_invitacion") {
      return { error: "Tu club todavía no te ha dado de alta. Pide al director deportivo o al Master que te añada con este mismo correo, y vuelve a registrarte." };
    }
    if (res.ok === false && res.reason === "club_ocupado") {
      return { error: "Ese club ya tiene cuerpo técnico dado de alta. No puedes fundarlo tú: pide a tu director deportivo o al Master que te invite con este correo." };
    }
    if (res.ok === false && res.reason === "falta_club") return { error: "Escribe el nombre de tu club." };
    if (res.ok === false && res.reason === "exists") return { error: T(lang, "a.exists") };
    if (res.ok === false) return { error: "No se pudo completar el registro. Inténtalo de nuevo." };
    setAuthToken(res.token || null);
    /* El rol y el equipo de una cuenta oficial (invitada o fundadora) los fija
       el backend, no quien se registra: se toman de su respuesta. */
    const rolFinal = esLibre ? "entrenador" : (LABEL2ROL[res.rol] || p.role || "entrenador");
    setSession({
      name: res.name || p.name, role: rolFinal, plan: esLibre ? "free" : "oficial",
      club: res.team?.club || p.club || "Mi equipo",
      comunidad: res.team?.comunidad || p.comunidad,
      email: String(p.email).trim(), team: res.team || p.team,
    });
    setTab("inicio");
    /* Si fundó el club eligiendo un plan de pago, en cuanto entre lo mandamos
       a Stripe. El límite de plazas real no se activa aquí: lo confirma el
       webhook cuando Stripe cobra de verdad, nunca esta elección del cliente. */
    if (esClubFounder && p.checkoutPendiente) {
      try { localStorage.setItem("cb_checkout_pendiente", p.checkoutPendiente); } catch { /* noop */ }
    }
    return { ok: true, pending: String(res.estado || "").toLowerCase() !== "activo" };
  };

  if (booting) return <Splash lang={lang} />;
  if (!session) return <Auth lang={lang} setLang={setLang} onLogin={doLogin} onRegister={doRegister} tema={tema} cambiarTema={cambiarTema} />;
  const allTabs = getAvailableTabs(session?.club, role.tabs).filter((k) => k !== "usuarios" || lim.users);
  /* El menú enseña TODAS las categorías de la app, no solo las del rol: así se
     ve de un vistazo todo lo que hace COACHBASE y qué desbloquearía otro rol.
     Las que este rol no puede abrir salen apagadas y no llevan a ninguna parte.
     `visibleTabs` sigue siendo lo que el rol SÍ puede usar, porque de eso
     dependen los permisos y el resto de la app. */
  const visibleTabs = allTabs;
  const TODAS_TABS = ["inicio", "master", "equipos", "equipo", "jugadores", "calendario", "convocatoria",
    "alineacion", "partido", "analisis", "temporada", "entrenamiento", "ejercicios", "pizarra",
    "asistencia", "disciplina", "normativa", "estadisticas", "usuarios", "coachai", "material", "premium"];
  /* Las del Master no se le enseñan a nadie más: no es que estén bloqueadas, es
     que no existen para el resto de cuentas. */
  const tabsMenu = TODAS_TABS.filter((k) => allTabs.includes(k) || !["master", "equipos"].includes(k));
  const sinAcceso = (k) => !allTabs.includes(k);
  const mobileTabsDefault = [...visibleTabs.filter((k) => ["inicio", "pizarra", "entrenamiento", "partido"].includes(k)), ...visibleTabs.filter((k) => !["inicio", "pizarra", "entrenamiento", "partido"].includes(k))].slice(0, 4);
  /* Si la persona ha elegido su propio orden (ver "Personalizar menú" en Mi
     cuenta), manda eso: primero sus elegidas que sigan estando a su alcance
     (un cambio de rol puede dejar alguna fuera), y se rellena con el orden
     automático de siempre hasta completar las 4. */
  const mobileTabs = (navOrder && navOrder.length)
    ? (() => {
        const elegidas = navOrder.filter((k) => visibleTabs.includes(k));
        const relleno = mobileTabsDefault.filter((k) => !elegidas.includes(k));
        return [...elegidas, ...relleno].slice(0, 4);
      })()
    : mobileTabsDefault;
  /* Punto de aviso en el menú móvil: mismos avisos que ya se calculan para la
     tarjeta de Inicio (accesos pendientes, propuestas por resolver,
     incidencias sin validar, firmas pendientes), para que en el móvil se
     note sin tener que entrar a mirar. */
  const pendUsersCount = can("viewUsers") ? users.filter((u) => u.status === "pendiente").length : 0;
  const hayAvisosNav = getPendingProposals().length > 0
    || pendUsersCount > 0
    || (can("discipline") && pendingValid > 0)
    || (can("viewDocs") && pendingSign > 0);

  /* Escudo a mostrar: el del equipo, si no el del club de Airtable, y si no el
     archivo local. Antes la cabecera solo miraba el primero. */
  /* El escudo es del CLUB, no de la categoría: Infantil B, Juvenil A y Sénior
     del mismo club comparten el mismo escudo, así que aquí manda siempre el
     del club. "crest" (estado local/por categoría, de una época en que cada
     categoría podía subir el suyo) solo se usa como último recurso mientras
     el del club todavía no ha cargado, para no dejar el hueco vacío un
     instante. */
  const teamCrest = clubInfo.crest || escudoDe(session.club) || crest;

  return (
    <div className="font-body min-h-screen" style={{ background: C.bg, color: C.chalk }}>
      <style>{FONTS}</style>
      {/* Tres zonas: marca a la izquierda, equipo en el centro, rol a la
          derecha. En pantalla ancha es una rejilla de tres columnas para que
          el centro quede centrado de verdad y no dependa de lo largos que
          sean el nombre del club o del rol. Por debajo de lg se apila: marca
          y utilidades arriba, equipo debajo ocupando el ancho. */}
      <header className="flex flex-wrap items-center justify-between gap-x-2 sm:gap-x-4 gap-y-2 px-3 sm:px-5 py-2 sm:py-3 border-b sticky top-0 z-10
                         lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-x-6"
        style={{ borderColor: C.line, background: C.bg, borderTop: `3px solid ${AC}` }}>
        {/* IZQUIERDA · la marca, siempre igual */}
        {/* Solo el logotipo: ya lleva dentro el nombre y "by EBLDigital", así
            que repetirlos en texto al lado era decir dos veces lo mismo.
            Dos tamaños porque en móvil la cabecera tiene que caber en dos
            filas. Dentro de la app lleva a Inicio, no a EBLDigital — ese
            enlace externo queda solo en el pie de la barra lateral
            ("Desarrollado por EBLDigital ↗", más abajo). */}
        <button type="button" onClick={() => setTab("inicio")} aria-label="COACHBASE Ai · ir a Inicio"
          className="flex items-center min-w-0 order-1 shrink-0">
          <span className="sm:hidden"><AppWordmark height={34} /></span>
          <span className="hidden sm:block"><AppWordmark height={58} /></span>
        </button>

        {/* CENTRO · el equipo con el que estás trabajando. Es lo que cambia y
            lo que hay que poder comprobar de un vistazo antes de tocar nada:
            si convocas al equipo equivocado, el lío es gordo. */}
        <div className="flex items-center gap-3 min-w-0 order-3 lg:order-2 lg:justify-self-center">
          <span className="rounded-lg sm:rounded-lg p-0.5 sm:p-1 shrink-0" style={{ boxShadow: `0 0 0 1px ${AC}` }}>
            <span className="sm:hidden"><Crest src={teamCrest} name={session.team.name} size={30} /></span>
            <span className="hidden sm:block"><Crest src={teamCrest} name={session.team.name} size={46} /></span>
          </span>
          <div className="min-w-0 leading-tight">
            <div className="font-display text-base sm:text-2xl font-semibold truncate" style={{ color: C.chalk }}>{session.team.name}</div>
            <div className="text-[11px] sm:text-[12px] truncate" style={{ color: C.dim }}>
              {session.club}<span className="hidden sm:inline"> · {session.comunidad}</span>
            </div>
          </div>
        </div>

        {/* DERECHA · quién eres y con qué permisos, más las utilidades */}
        <div className="flex items-center flex-wrap justify-end gap-1.5 sm:gap-3 order-2 lg:order-3">
          <button onClick={() => setAccountOpen(true)} title={t("p.account")} className="text-right hidden md:block rounded-lg px-2 py-1 leading-tight">
            <div className="font-display text-base lg:text-lg xl:text-xl font-semibold uppercase tracking-wide flex items-center justify-end gap-2 whitespace-nowrap" style={{ color: AC }}>
              <span>{role.icon}</span>{rLabel(lang, session.role)}
            </div>
            <div className="text-[12px] truncate" style={{ color: C.dim }}>{session.name}</div>
          </button>
          {onTrial && <button onClick={() => setTab("premium")} className="hidden sm:inline-block text-[10px] font-display uppercase tracking-wide px-2 py-1 rounded" style={{ background: AC, color: C.sobre }}>★ {t("c.trialBadge")} · {trialDaysLeft} {trialDaysLeft === 1 ? t("h.day") : t("h.days")}</button>}
          {!isPro && (
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="hidden xl:inline text-[10px] font-display uppercase tracking-wide px-2 py-1 rounded" style={{ color: C.dim, border: `1px solid ${C.line}` }}>
                {t("c.planCurrentFree")}
              </span>
              <button onClick={() => proAlert()} className="text-[10px] font-display uppercase tracking-wide px-2.5 py-1 rounded font-semibold" style={{ background: AC, color: C.sobre }}>
                {t("c.goPro")}
              </button>
            </div>
          )}
          {isPro && !onTrial && session.role !== "master" && <span className="hidden sm:inline-block text-[10px] font-display uppercase tracking-wide px-2 py-1 rounded" style={{ background: AC, color: C.sobre }}>★ PRO</span>}
          {/* En móvil el rol de arriba está oculto, así que Mi cuenta se abre
              desde este botón. */}
          <button onClick={() => setAccountOpen(true)} aria-label={t("p.account")} title={t("p.account")}
            className="md:hidden text-base px-2.5 py-2 rounded-lg border leading-none" style={{ borderColor: C.line, color: C.chalk }}>
            <Icono n="usuarios" s={18} />
          </button>
          {/* Claro / oscuro. Un solo botón: el icono dice a qué se va a cambiar. */}
          <button onClick={cambiarTema} title={tema === "oscuro" ? "Modo claro" : "Modo oscuro"}
            aria-label={tema === "oscuro" ? "Modo claro" : "Modo oscuro"}
            className="text-sm w-8 h-8 rounded-lg border flex items-center justify-center"
            style={{ borderColor: C.line, color: C.chalk }}>
            {tema === "oscuro" ? "☀" : "☾"}
          </button>
          <LangPicker lang={lang} setLang={setLang} />
          <button onClick={() => { setAuthToken(null); setSession(null); setMsgs([]); }} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: C.line, color: C.dim }}>{t("c.exit")}</button>
          <button onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} className="relative lg:hidden text-xs px-3 py-2 rounded-lg border font-display uppercase tracking-wide" style={{ borderColor: menuOpen ? MC : C.line, color: menuOpen ? MC : C.chalk }}>
            ☰<span className="hidden sm:inline"> Menú</span>
            {hayAvisosNav && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full" style={{ background: C.red, boxShadow: `0 0 0 2px ${C.bg}` }} />}
          </button>
        </div>
      </header>

      {authMsg && (
        <div className="px-3 sm:px-5 py-2 text-[12px] flex items-center gap-2"
          style={{ background: "rgba(229,72,77,.12)", borderBottom: `1px solid ${C.line}`, color: "#f0a3a5" }}>
          <span>🔒</span>
          <span className="flex-1">{authMsg}</span>
          <button onClick={() => { setAuthToken(null); setAuthMsg(""); setSession(null); setMsgs([]); }}
            className="text-[11px] font-display uppercase tracking-wide px-2.5 py-1 rounded border shrink-0"
            style={{ borderColor: C.red, color: "#f0a3a5" }}>Volver a entrar</button>
        </div>
      )}

      {session.pendingApproval && (
        <div className="px-3 sm:px-5 py-2 text-[12px] flex items-start gap-2" style={{ background: "rgba(217,164,65,.12)", borderBottom: `1px solid ${C.line}`, color: "#e0b25a" }}>
          <span>⏳</span>
          <span>Ya puedes trabajar con tu equipo. Tu acceso oficial está pendiente de que el club lo apruebe: hasta entonces no verás datos compartidos del club ni la gestión de usuarios.</span>
        </div>
      )}

      {welcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.78)" }}>
          <div className="w-full max-w-md rounded-lg border p-6" style={{ background: C.panel, borderColor: AC }}>
            <div className="font-display uppercase tracking-wide text-2xl" style={{ color: AC }}>Tienes {TRIAL_DAYS} días de PRO</div>
            <p className="text-sm mt-2" style={{ color: C.chalk }}>
              Desde hoy y durante {TRIAL_DAYS} días la app está completa: jugadas guardadas, los 26 ejercicios, sesiones ilimitadas,
              histórico de convocatorias y Coach AI sin límite. No hemos pedido tarjeta y no se te va a cobrar nada al terminar.
            </p>
            <p className="text-[12px] mt-2" style={{ color: C.dim }}>
              Al acabar sigues usando la app gratis, con la plantilla y el modo partido completos. Te avisaremos dos días antes.
            </p>
            <button onClick={() => { setWelcome(false); setNeedsSquad(true); }}
              className="mt-4 w-full py-3 rounded-lg font-display uppercase tracking-wide font-semibold" style={{ background: AC, color: C.sobre }}>
              Empezar
            </button>
          </div>
        </div>
      )}

      {trialWarn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.78)" }}>
          <div className="w-full max-w-md rounded-lg border p-6" style={{ background: C.panel, borderColor: C.warn }}>
            <div className="font-display uppercase tracking-wide text-2xl" style={{ color: C.warn }}>
              Te {trialDaysLeft === 1 ? "queda 1 día" : `quedan ${trialDaysLeft} días`} de PRO
            </div>
            <p className="text-sm mt-2" style={{ color: C.chalk }}>Cuando termine dejarás de tener:</p>
            <ul className="text-[13px] mt-2 space-y-1" style={{ color: C.dim }}>
              <li>🖊 Las jugadas que tengas guardadas en la pizarra</li>
              <li>🏋️ Más de {FREE_CAPS.sessions} sesión de entrenamiento</li>
              <li>🎯 {26 - FREE_CAPS.exercises} de los 26 ejercicios</li>
              <li>✦ Coach AI sin límite (pasa a {FREE_CAPS.aiMsgs} consultas al mes)</li>
            </ul>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setTrialWarn(false); setTab("premium"); }}
                className="flex-1 py-2.5 rounded-lg font-display uppercase tracking-wide font-semibold" style={{ background: AC, color: C.sobre }}>
                Ver planes
              </button>
              <button onClick={() => setTrialWarn(false)} className="px-4 py-2.5 rounded-lg border font-display uppercase tracking-wide text-sm" style={{ borderColor: C.line, color: C.dim }}>
                Luego
              </button>
            </div>
          </div>
        </div>
      )}

      {needsSquad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.72)" }}>
          <div className="w-full max-w-md rounded-lg border p-5" style={{ background: C.panel, borderColor: C.line }}>
            <div className="font-display uppercase tracking-wide text-lg" style={{ color: AC }}>Tu plantilla en 30 segundos</div>
            <p className="text-[12px] mt-1 mb-3" style={{ color: C.dim }}>
              Pega los nombres de tus jugadores, uno por línea. Puedes añadir el dorsal delante: <em>7 Marcos Gil</em>. Lo editas todo después.
            </p>
            <textarea value={squadText} onChange={(e) => setSquadText(e.target.value)} rows={8}
              placeholder={"1 Iker Ruiz\n4 Adrián Soto\n7 Marcos Gil"}
              className="w-full text-sm px-3 py-2 rounded-lg border bg-transparent" style={{ borderColor: C.line, color: C.chalk }} />
            <div className="flex items-center gap-3 mt-3 rounded-lg border p-2.5" style={{ borderColor: C.line, background: C.panel2 }}>
              <Crest src={teamCrest} name={session.team.name} size={40} /><div className="min-w-0 flex-1"><div className="text-sm" style={{ color: C.chalk }}>{session.team.name}</div><div className="text-[10px]" style={{ color: C.dim }}>El escudo quedará fijo en la cabecera.</div></div>
              <label className="text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer" style={{ borderColor: AC, color: AC }}>Subir escudo<input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCrest(f); e.target.value = ""; }} /></label>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => {
                const rows = squadText.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 40);
                if (rows.length) {
                  setPlayers(rows.map((line, i) => {
                    const m = line.match(/^(\d{1,2})\s+(.*)$/);
                    return { id: Date.now() + i, d: m ? Number(m[1]) : i + 1, n: (m ? m[2] : line).slice(0, 40), pos: "MC", state: "ok", min: 0, att: 0, cards: { y: 0, r: 0 } };
                  }));
                }
                setNeedsSquad(false); setSquadText(""); setTab("jugadores");
              }} className="flex-1 py-2.5 rounded-lg font-display uppercase tracking-wide font-semibold" style={{ background: AC, color: C.sobre }}>
                Crear plantilla
              </button>
              <button onClick={() => { setNeedsSquad(false); setSquadText(""); }} className="px-4 py-2.5 rounded-lg border font-display uppercase tracking-wide text-sm" style={{ borderColor: C.line, color: C.dim }}>
                Luego
              </button>
            </div>
          </div>
        </div>
      )}

      {proModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.72)" }} onClick={() => setProModal(null)}>
          <div className="w-full max-w-sm rounded-lg border p-5" style={{ background: C.panel, borderColor: AC }} onClick={(e) => e.stopPropagation()}>
            <div className="font-display uppercase tracking-wide text-lg" style={{ color: AC }}>
              {(PRO_FEATURES.find((f) => f.k === proModal) || {}).icon || "★"} Esto es de PRO
            </div>
            <p className="text-sm mt-2" style={{ color: C.chalk }}>
              {(PRO_FEATURES.find((f) => f.k === proModal) || {}).pro || "Desbloquea todas las funciones de CoachBase AI."}
            </p>
            {(PRO_FEATURES.find((f) => f.k === proModal) || {}).free && (
              <p className="text-[12px] mt-1" style={{ color: C.dim }}>
                Con el plan gratuito: {(PRO_FEATURES.find((f) => f.k === proModal) || {}).free}.
              </p>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setProModal(null); setTab("premium"); }} className="flex-1 py-2.5 rounded-lg font-display uppercase tracking-wide font-semibold" style={{ background: AC, color: C.sobre }}>
                Ver PRO · {PRO_PRICE}/mes
              </button>
              <button onClick={() => setProModal(null)} className="px-4 py-2.5 rounded-lg border font-display uppercase tracking-wide text-sm" style={{ borderColor: C.line, color: C.dim }}>
                Ahora no
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40" style={{ background: "rgba(0,0,0,.56)" }} onClick={() => setMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-[min(22rem,88vw)] overflow-y-auto border-l p-4" style={{ background: C.panel, borderColor: C.line }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><span className="font-display uppercase tracking-wide" style={{ color: MC }}>{t("c.nav")}</span><button onClick={() => setMenuOpen(false)} className="text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: C.line, color: C.chalk }}>{t("p.close")}</button></div>
            {(() => {
              const { grupos, sueltas } = agruparNav(tabsMenu);
              const Boton = (k) => {
                const sinRol = sinAcceso(k);
                const bloq = !sinRol && !isPro && esTabPro(k);
                if (sinRol) return (
                  <div key={k} aria-disabled="true"
                    title={`${t("nav." + k)} — tu rol (${role.label}) no tiene acceso`}
                    className="w-full min-h-12 flex items-center gap-3 px-3 py-2.5 rounded-lg text-left font-display uppercase tracking-wide text-sm cursor-not-allowed"
                    style={{ color: C.dim, opacity: 0.45 }}>
                    <span className="w-4 shrink-0 flex justify-center"><Icono n={k} s={16} /></span>
                    <span className="flex-1 min-w-0 truncate" title={t("nav." + k)}>{t("nav." + k)}</span>
                    <span className="text-[11px] shrink-0">·</span>
                  </div>
                );
                return (
                <button key={k} onClick={() => { setTab(bloq ? "premium" : k); setMenuOpen(false); }} aria-current={tab === k ? "page" : undefined}
                  title={bloq ? t("c.proTab") : undefined}
                  className="nav-item w-full min-h-12 flex items-center gap-3 px-3 py-2.5 rounded-lg text-left font-display uppercase tracking-wide text-sm"
                  style={{ background: tab === k ? "rgba(54,69,79,.06)" : "transparent", color: tab === k ? MC : bloq ? C.dim : C.chalk, borderLeft: tab === k ? `3px solid ${MC}` : "3px solid transparent" }}>
                  <span className="w-4 shrink-0 flex justify-center" style={{ color: tab === k ? MC : C.dim }}><Icono n={k} s={16} /></span>
                  <span className="flex-1 min-w-0 truncate" title={t("nav." + k)}>{t("nav." + k)}</span>
                  {bloq && <span className="text-[11px] shrink-0" style={{ color: AC }}>★</span>}
                </button>
                );
              };
              const Titulo = (label) => (
                <div className="flex items-center gap-2 px-3 pt-3 pb-1">
                  <span className="text-[11px] font-display uppercase tracking-[0.18em] shrink-0" style={{ color: "rgba(112,128,144,1)" }}>{t(label)}</span>
                  <span className="h-px flex-1" style={{ background: C.line }} />
                </div>
              );
              return (
                <>
                  {visibleTabs.includes("inicio") && Boton("inicio")}
                  {grupos.map((g) => (
                    <div key={g.label}>
                      {Titulo(g.label)}
                      <div className="flex flex-col gap-0.5">{g.tabs.map(Boton)}</div>
                    </div>
                  ))}
                  {sueltas.length > 0 && (
                    <div className="mt-3 pt-3 border-t flex flex-col gap-0.5" style={{ borderColor: C.line }}>
                      {sueltas.map(Boton)}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
        <nav className="hidden lg:flex flex-col gap-1 p-3 border-r min-h-[calc(100vh-57px)] w-52 shrink-0 sticky top-[57px] self-start max-h-[calc(100vh-57px)] overflow-y-auto" style={{ borderColor: C.line }}>
          {/* Escudo del equipo, grande y fijo: identifica de un vistazo en qué
              equipo estás trabajando. Solo en cuentas oficiales, es decir,
              cuando el club te ha dado de alta. */}
          {session.plan !== "free" && (
            <div className="flex flex-col items-center gap-2 pb-3 mb-2 border-b" style={{ borderColor: C.line }}>
              <div className="rounded-lg p-1.5" style={{ background: "rgba(255,255,255,.05)", boxShadow: `0 0 0 1px ${MC}` }}>
                <Crest src={teamCrest} name={session.team.name} size={84} />
              </div>
              <div className="text-center leading-tight">
                <div className="font-display uppercase tracking-wide text-sm" style={{ color: C.chalk }}>{session.team.name}</div>
                <div className="text-[10px]" style={{ color: C.dim }}>{session.club}</div>
                {session.team?.web && (
                  <a href={session.team.web} target="_blank" rel="noreferrer" className="text-[10px] hover:underline" style={{ color: MC }}>Web del equipo ↗</a>
                )}
                {session.team?.maps && (
                  <a href={session.team.maps} target="_blank" rel="noreferrer" className="block text-[10px] hover:underline" style={{ color: MC }}>📍 Cómo llegar ↗</a>
                )}
                {/* Plazas de cuerpo técnico ocupadas. Solo se muestra a quien
                    puede ver la lista de usuarios: para el resto, el número de
                    personas del club no es asunto suyo. */}
                {can("viewUsers") && (
                  <div className="text-[10px] mt-1" style={{ color: C.dim }}>
                    <Icono n="usuarios" s={15} style={{ color: C.dim }} /> {users.length} {users.length === 1 ? t("nav.roleOne") : t("nav.roleMany")}
                  </div>
                )}
              </div>
            </div>
          )}
          {(() => {
            const { grupos, sueltas } = agruparNav(tabsMenu);
            const Boton = (k) => {
              /* Los apartados de pago se ven, pero con candado: esconderlos
                 haría que la app pareciera más pobre de lo que es y nadie
                 sabría qué gana pagando. Al tocarlos se va a Premium. */
              /* Dos motivos distintos para no poder entrar, y se dicen
                 distinto: el candado ★ es de plan (se arregla pagando) y el
                 apagado es de rol (no lo arregla el usuario). */
              const sinRol = sinAcceso(k);
              const bloq = !sinRol && !isPro && esTabPro(k);
              if (sinRol) return (
                <div key={k} aria-disabled="true"
                  title={`${t("nav." + k)} — tu rol (${role.label}) no tiene acceso a este apartado`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left font-display uppercase tracking-wide text-sm cursor-not-allowed"
                  style={{ color: C.dim, opacity: 0.45, borderLeft: "3px solid transparent" }}>
                  <span className="w-4 shrink-0 flex justify-center"><Icono n={k} s={16} /></span>
                  <span className="flex-1 min-w-0 truncate" title={t("nav." + k)}>{t("nav." + k)}</span>
                  <span className="text-[11px] shrink-0">·</span>
                </div>
              );
              return (
              <button key={k} onClick={() => (bloq ? setTab("premium") : setTab(k))} aria-current={tab === k ? "page" : undefined}
                title={bloq ? t("c.proTab") : undefined}
                className="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-left font-display uppercase tracking-wide text-sm"
                style={{ background: tab === k ? "rgba(54,69,79,.06)" : "transparent", color: tab === k ? MC : bloq ? C.dim : C.chalk, borderLeft: tab === k ? `3px solid ${MC}` : "3px solid transparent" }}>
                <span className="w-4 shrink-0 flex justify-center" style={{ color: tab === k ? MC : C.dim }}><Icono n={k} s={16} /></span>
                <span className="flex-1 min-w-0 truncate" title={t("nav." + k)}>{t("nav." + k)}</span>
                {bloq && <span className="text-[11px] shrink-0" style={{ color: AC }} aria-label={t("c.proTab")}>★</span>}
              </button>
              );
            };
            /* Cabecera de apartado: la etiqueta y, a continuación, un filete que
               corre hasta el borde — una línea de cal saliéndose de la pizarra.
               Separa los apartados sin encajonarlos en tarjetas. */
            const Titulo = (label) => (
              <div className="flex items-center gap-2 px-3 pt-3 pb-1">
                <span className="text-[11px] font-display uppercase tracking-[0.18em] shrink-0" style={{ color: "rgba(112,128,144,1)" }}>{t(label)}</span>
                <span className="h-px flex-1" style={{ background: C.line }} />
              </div>
            );
            return (
              <>
                {visibleTabs.includes("inicio") && Boton("inicio")}
                {grupos.map((g) => (
                  <div key={g.label}>
                    {Titulo(g.label)}
                    <div className="flex flex-col gap-0.5">{g.tabs.map(Boton)}</div>
                  </div>
                ))}
                {sueltas.length > 0 && (
                  <div className="mt-3 pt-3 border-t flex flex-col gap-0.5" style={{ borderColor: C.line }}>
                    {sueltas.map(Boton)}
                  </div>
                )}
              </>
            );
          })()}
          <div className="mt-auto px-3 py-2">
            <a href={EBL} target="_blank" rel="noreferrer" className="text-[10px] block" style={{ color: C.dim }}>{t("c.by")} ↗</a>
            <a href="/privacidad" target="_blank" rel="noreferrer" className="text-[10px] block mt-0.5" style={{ color: C.dim }}>Política de privacidad</a>
            {/* La versión, también aquí dentro: para comprobar si un despliegue
                ha entrado no debería hacer falta cerrar la sesión. */}
            <div className="text-[10px] font-display tracking-widest" style={{ color: C.dim, opacity: 0.7 }}>v{APP_VERSION}</div>
          </div>
        </nav>

        <main className={`flex-1 w-full p-4 sm:p-5 ${session?.categories?.length > 1 ? "pb-32" : "pb-24"} lg:pb-5 max-w-6xl`}>
          {tab === "inicio" && renderHome()}
          {tab === "equipo" && can("editSquad") && renderTeamSettings()}
          {tab === "jugadores" && renderSquad()}
          {tab === "alineacion" && can("editLineup") && renderLineup()}
          {tab === "convocatoria" && renderCall()}
          {tab === "partido" && can("events") && renderMatch()}
          {tab === "analisis" && can("ai") && can("editLineup") && renderPostMatch()}
          {tab === "usuarios" && can("viewUsers") && renderUsers()}
          {tab === "pizarra" && <Whiteboard AC={AC} lang={lang} squad={players} teamId={session.team?.id} teamRec={session.team?.rec} isF7={!!session.team?.f7} canSavePlays={isPro} onPro={proAlert} pendingExId={pendingExId} onConsumePending={() => setPendingExId(null)} pendingPlayId={pendingPlayId} onConsumePlay={() => setPendingPlayId(null)} />}
          {tab === "ejercicios" && can("editTraining") && renderExercises()}
          {tab === "temporada" && can("editTraining") && renderSeason()}
          {tab === "entrenamiento" && can("editTraining") && renderTraining()}
          {tab === "estadisticas" && can("viewStats") && renderStats()}
          {tab === "coachai" && can("ai") && renderCoach()}
          {tab === "premium" && renderPremium()}
          {tab === "master" && can("master") && renderMasterPanel()}
          {tab === "equipos" && can("master") && renderTeams()}
          {tab === "calendario" && renderCalendar()}
          {tab === "disciplina" && can("discipline") && renderDiscipline()}
          {tab === "asistencia" && can("editSquad") && renderAsistencia()}
          {tab === "normativa" && can("viewDocs") && renderDocs()}
          {tab === "material" && renderMaterial()}
          {!isPro && <AdBanner />}
        </main>
      </div>

      {renderProfile()}
      {renderAccount()}

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-20">
        {/* Tira de categorías: solo aparece con más de una (ej. quien lleva
            Infantil B y también Juvenil A). Un icono por categoría porque el
            escudo es el mismo para todas — ver iconoDeCategoria más arriba.
            La activa va en negrita y con el color de mando, igual que la
            pestaña activa de la barra de debajo. */}
        {session?.categories && session.categories.length > 1 && (
          <div className="flex overflow-x-auto border-t" style={{ borderColor: C.line, background: C.panel2 }}>
            {session.categories.map((cat) => {
              const activa = selectedCategory === cat;
              return (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-display uppercase whitespace-nowrap"
                  style={{ color: activa ? MC : C.dim, fontWeight: activa ? 700 : 500 }}>
                  <Icono n={iconoDeCategoria(cat)} s={14} />{cat}
                </button>
              );
            })}
          </div>
        )}
        {/* Solo iconos, sin etiqueta: con texto, algunas pestañas (ej. "Modo
            partido") pasan a dos líneas mientras las de al lado tienen una
            sola, y en pantallas estrechas (~320-360px) las palabras de una
            se metían encima de la otra. El icono solo nunca se solapa, sea
            cual sea el ancho o qué pestañas le toquen a cada rol; title/
            aria-label mantienen el nombre accesible. */}
        <nav className="safe-bottom flex border-t" style={{ borderColor: C.line, background: C.panel }}>
          {mobileTabs.map((k) => (
            <button key={k} onClick={() => setTab(k)} title={t("nav." + k)} aria-label={t("nav." + k)}
              className="relative flex-1 min-w-0 py-2.5 flex items-center justify-center"
              style={{ color: tab === k ? MC : C.dim }}>
              {tab === k && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full" style={{ background: MC }} />}
              <Icono n={k} s={22} />
            </button>
          ))}
          <button onClick={() => setMenuOpen(true)} title={t("c.nav")} aria-label={t("c.nav")}
            className="relative flex-1 min-w-0 py-2.5 flex items-center justify-center" style={{ color: menuOpen ? MC : C.dim }}>
            {menuOpen && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full" style={{ background: MC }} />}
            <span className="relative inline-block text-xl leading-none">
              ⋯
              {hayAvisosNav && <span className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full" style={{ background: C.red, boxShadow: `0 0 0 2px ${C.panel}` }} />}
            </span>
          </button>
        </nav>
      </div>

    </div>
  );
}
