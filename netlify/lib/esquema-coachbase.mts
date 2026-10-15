/* ================= ESQUEMA DE COACHBASE EN SUPABASE =================
   Fuente única de la estructura de datos: de aquí salen las tablas de
   Postgres (supabase/migraciones, generadas con pruebas/generar-sql.mjs) y
   la traducción que hace el adaptador (supabase-airtable.mts) entre la API de
   Airtable -que es lo que sigue hablando airtable.mts- y Supabase.

   Cada tabla de Airtable es una tabla de Postgres con el mismo id de registro
   ("rec…") y una columna por campo. Cada campo guarda su id de Airtable
   ("fld…") y su nombre tal cual, porque el código lee y escribe por los dos:
   por id en casi todo este backend, por nombre en los recursos genéricos que
   consume el frontend (jugadores, partidos…).

   Los enlaces se guardan por los dos lados, igual que en Airtable: el equipo
   lista sus jugadores sin que nadie lo escriba ahí. Un trigger de Postgres
   (_sincronizar_enlaces) mantiene el lado inverso al escribir cualquiera de
   los dos. */

export type Tipo = "texto" | "num" | "bool" | "fecha" | "fechahora" | "multi" | "enlace" | "adjuntos";
/* [id de campo, nombre en Airtable, columna en Postgres, tipo, enlace?]
   enlace = [tabla de destino, id del campo inverso en esa tabla] */
type Def = [string, string, string, Tipo, [string, string]?];

const DEF: Record<string, { airtable: string; campos: Def[] }> = {
  clubes: { airtable: "tblc2wLfnbbJg8KkI", campos: [
    ["fldlUNDFkJyehw8x0", "Nombre", "nombre", "texto"],
    ["fld0BUV86fvUDWOcU", "Comunidad", "comunidad", "texto"],
    ["fldHEc6mURQXD7HVH", "Equipos", "equipos", "enlace", ["equipos", "fldFGQJQHzeNHi50l"]],
    ["fldf41Ef5smzPgD8S", "Usuarios", "usuarios", "enlace", ["usuarios", "fldV2DDL6v5szs0y3"]],
    ["fldX3CMkCrO54gUrV", "Escudo", "escudo", "adjuntos"],
    ["fldVH4NDAN2Odlzwe", "Campo", "campo", "texto"],
    ["fld6XKOF4q9Kf5bKa", "Direccion", "direccion", "texto"],
    ["fld2KQW6HDKsW3wCZ", "Maps", "maps", "texto"],
    ["fldiIev3Pd9eWhulJ", "Limite usuarios", "limite_usuarios", "num"],
    ["fldWaK6dqlvICVRPF", "Entrenamientos", "entrenamientos", "enlace", ["entrenamientos", "fldokrqbCdfZBKMeY"]],
  ] },
  equipos: { airtable: "tbl7h2mhoWr0W9aSU", campos: [
    ["fldmjUkaMwwLbPO89", "Nombre", "nombre", "texto"],
    ["fldgTxdcJpju1jxt2", "Categoría", "categoria", "texto"],
    ["fldSQPSejXh45fRQ8", "Formato", "formato", "texto"],
    ["fldl20r9arDXNdZdC", "Sistema", "sistema", "texto"],
    ["fldFGQJQHzeNHi50l", "Club", "club", "enlace", ["clubes", "fldHEc6mURQXD7HVH"]],
    ["fldMYcnPB43koZxlA", "Jugadores", "jugadores", "enlace", ["jugadores", "fldD7Dy6zT5uO6ivF"]],
    ["fldtQjwRnN7aQr439", "Usuarios", "usuarios", "enlace", ["usuarios", "fldW8QHQvuOZv1zX8"]],
    ["fldbDfYAYqQs9thTA", "Normativa", "normativa", "enlace", ["normativa", "fldOGmAE882lecjEE"]],
    ["fldw828tZj4b0gw57", "Incidencias", "incidencias", "enlace", ["incidencias", "fldq8MwUXVY0LjPOp"]],
    ["fldZ8Eow86UczBCCr", "Escudo", "escudo", "adjuntos"],
    ["fldvQewYiQaYpOQEA", "Partidos", "partidos", "enlace", ["partidos", "fld8zIw50aAfD7k5G"]],
    ["fldXSlXGkWFQJjyeo", "Convocatorias", "convocatorias", "enlace", ["convocatorias", "fldsuIeTAvJzFkzgN"]],
    ["fldly58OdNfl8PLXJ", "Entrenamientos", "entrenamientos", "enlace", ["entrenamientos", "fldVpgy3PMoFg1Wef"]],
    ["fldnk9J5mmwx4ac36", "Web", "web", "texto"],
    ["fldmCTjJcpercjAVl", "Maps", "maps", "texto"],
    ["fldflPuhPqSecZ3rp", "Planificacion", "planificacion", "texto"],
    ["fldAMfVva4jTk0PCH", "Jugadas", "jugadas", "texto"],
    ["fldUAorODIpYyPmDc", "Propuestas", "propuestas", "enlace", ["propuestas", "fldNDgGcg66K5KLGT"]],
    ["fld57z5y3QWsk1DnF", "Cargas fisicas", "cargas_fisicas", "texto"],
    ["fldLIb8GBxvSizIYT", "Partes de entreno", "partes_de_entreno", "enlace", ["partes_entreno", "fldXvt940m1HPQ3uH"]],
    ["fld23b31P4y079j77", "Encargado material", "encargado_material", "texto"],
    ["flddC2z6uAHNSaGXX", "Dias de entreno", "dias_de_entreno", "texto"],
    /* Solo en Supabase (2026-10-15). */
    ["fldEquipac1onKt7q", "Equipacion", "equipacion", "texto"],
    ["fldXjBDGFcYDkEn9M", "Asistencia", "asistencia", "texto"],
    ["fld0ShmGEK97QIhr8", "Alineacion", "alineacion", "texto"],
    ["fldugauQwyDXX4IrG", "Pase de lista", "pase_de_lista", "texto"],
    ["fldnPen6cwkg0Ngz9", "AlineacionesFavoritas", "alineaciones_favoritas", "texto"],
    ["fldf8u5XdjQrEiIgD", "ABP corners", "abp_corners", "texto"],
    ["fld2oH8jIKwosGdEB", "Actas", "actas", "enlace", ["actas", "fldFtOxrcymw0Pq1g"]],
  ] },
  jugadores: { airtable: "tblsZpNBzo2DXlt6X", campos: [
    ["fldBQDY3uEBh07hs7", "Nombre", "nombre", "texto"],
    ["fldj2NH8MAIHVs63U", "Dorsal", "dorsal", "num"],
    ["fldQxAZAHr5rVrbqS", "Posición", "posicion", "texto"],
    ["fldvqyIvhp66rynKc", "Estado", "estado", "texto"],
    ["fldP4SFeFuMYJtlj7", "Minutos", "minutos", "num"],
    ["fldD7Dy6zT5uO6ivF", "Equipo", "equipo", "enlace", ["equipos", "fldMYcnPB43koZxlA"]],
    ["fldWmH6KHQGXmW2g5", "Incidencias", "incidencias", "enlace", ["incidencias", "fld4CxW7BS48diYpQ"]],
    ["fld3jkdhle32OG4Mr", "Firmas", "firmas", "enlace", ["firmas", "fldVmYVSgZoa9A8I3"]],
    ["fldK7h1IYnmoCY41h", "Galeria", "galeria", "enlace", ["galeria", "fldcNQ8FQFYAv4NTk"]],
    ["fldwWOuj4AvGkVB8a", "Usuarios", "usuarios", "enlace", ["usuarios", "fldNH5dEj7PYDLBRW"]],
    ["fld9xF30BdE6ffEEM", "Convocatorias", "convocatorias", "enlace", ["convocatorias", "fldepJvhHpXQb9GhG"]],
    ["fldQLL0aGC0vm7Dei", "Aviso medico", "aviso_medico", "texto"],
    ["fldJopgp8dXWJEui7", "Inscripcion pagada", "inscripcion_pagada", "bool"],
    ["fld0ga9ubLFQmfvlK", "Fecha inscripcion", "fecha_inscripcion", "fecha"],
    ["fldMfcWmT3n5rDIxl", "Historial lesiones", "historial_lesiones", "texto"],
    ["fld8lbwE7lGNFPAeJ", "Usuarios 2", "usuarios_2", "enlace", ["usuarios", "fldOlXL957BafrlfE"]],
    ["fldVAopJcEmx4J1zw", "Foto", "foto", "adjuntos"],
    ["fldol5OZE0MEbu6DQ", "Molestia", "molestia", "texto"],
    /* Solo en Supabase (2026-10-15): Airtable ya no se escribe. */
    ["fldApoyoJug0rX9q1", "Apoyo", "apoyo", "bool"],
  ] },
  usuarios: { airtable: "tblZf4dFeq4FCjHGJ", campos: [
    ["fldSnD1rqmHptkRlA", "Nombre", "nombre", "texto"],
    ["fldJWlJ17YuZNe4Jx", "Email", "email", "texto"],
    ["fldIWSWMiwFsxJBiY", "Rol", "rol", "texto"],
    ["fldEkbPe6UgCx0Lfy", "Estado", "estado", "texto"],
    ["fldATfWgaJOvmd6ep", "Plan", "plan", "texto"],
    ["fldV2DDL6v5szs0y3", "Club", "club", "enlace", ["clubes", "fldf41Ef5smzPgD8S"]],
    ["fldW8QHQvuOZv1zX8", "Equipo", "equipo", "enlace", ["equipos", "fldtQjwRnN7aQr439"]],
    ["fldVX372lPNj7Bab8", "Password", "password", "texto"],
    /* Estos tres pares se llaman igual en Airtable ("Incidencias",
       "Galeria", "Propuestas"): son los inversos de dos enlaces distintos
       (quien registra / quien valida…). Aquí el segundo de cada par lleva
       nombre propio; nadie los lee por nombre. */
    ["fldlwh06UwTeuU27k", "Incidencias", "incidencias_registradas", "enlace", ["incidencias", "fld5X1iVtcR1uqPp8"]],
    ["fldSWAKU4TrwtNCfh", "Incidencias validadas", "incidencias_validadas", "enlace", ["incidencias", "fldB8d21ndhMviNzM"]],
    ["fldfKUcG3KDuQAhiV", "Firmas", "firmas", "enlace", ["firmas", "fldzAbNAwQihqpcFg"]],
    ["fldJJSXxkqOFy2z2L", "Galeria", "galeria_subidas", "enlace", ["galeria", "fldJAQnmzSshJWFy7"]],
    ["fldKl7mPvwQ4WVWWM", "Galeria revisada", "galeria_revisadas", "enlace", ["galeria", "fldU4rojwNN9hPIP0"]],
    ["fldNH5dEj7PYDLBRW", "Hijos/as tutelados", "hijos_tutelados", "enlace", ["jugadores", "fldwWOuj4AvGkVB8a"]],
    ["fldqVR918iRKOLxex", "Suscripciones", "suscripciones", "enlace", ["suscripciones", "fldqN9PDei93K4GZ7"]],
    ["fldevbPLxMunBH9NR", "Prueba hasta", "prueba_hasta", "fecha"],
    ["fldtkQwLbyEo4RaEl", "Propuestas", "propuestas_hechas", "enlace", ["propuestas", "fldtb0FrZmgtdhOoI"]],
    ["fldYUB2fB2LVseHSF", "Propuestas aprobadas", "propuestas_aprobadas", "enlace", ["propuestas", "fldeJt8lKbxm0TCdA"]],
    ["fldJRASqTraLecDMa", "Roles adicionales", "roles_adicionales", "multi"],
    ["fldXx1MXKJpiWswxV", "Partes de entreno", "partes_de_entreno", "enlace", ["partes_entreno", "fldIi957OqvZF1lCA"]],
    ["fld4okYQmHxbEQ6C8", "Parte de material", "parte_de_material", "bool"],
    ["fldqlZapTFUOOLaQl", "Faltas material", "faltas_material", "texto"],
    ["fldOlXL957BafrlfE", "Hijo", "hijo", "enlace", ["jugadores", "fld8lbwE7lGNFPAeJ"]],
  ] },
  normativa: { airtable: "tblNgKxTA0TUq93Oa", campos: [
    ["fld23acIDYlpjUrU9", "Título", "titulo", "texto"],
    ["fldI3z6ZWMlEFCHNj", "Tipo", "tipo", "texto"],
    ["fld40fjSegcUhFZJm", "Temporada", "temporada", "texto"],
    ["fldY10MiSJ3O6nOEz", "Versión", "version", "texto"],
    ["fldjwjEyHDBnUDyJH", "Fecha publicación", "fecha_publicacion", "fecha"],
    ["fldkw7i4gqGawwLSL", "Documento", "documento", "adjuntos"],
    ["fldueEbfb8GZ8TykE", "Firma obligatoria", "firma_obligatoria", "bool"],
    ["fldf74AD9q84fH8uw", "Firmantes requeridos", "firmantes_requeridos", "multi"],
    ["fldOGmAE882lecjEE", "Equipo", "equipo", "enlace", ["equipos", "fldbDfYAYqQs9thTA"]],
    ["fld3FTzFqdSQxzLjl", "Resumen", "resumen", "texto"],
    ["flds3FSHFrDWfiTrO", "Firmas", "firmas", "enlace", ["firmas", "fld1Em8pKl2TjJmzf"]],
  ] },
  incidencias: { airtable: "tblQHTqaiSED689xd", campos: [
    ["fldv5Gtrpw2e6xopC", "Referencia", "referencia", "texto"],
    ["fldxhO3y8YcOA5XBI", "Fecha", "fecha", "fecha"],
    ["fldRG05YcO16bs8Mu", "Contexto", "contexto", "texto"],
    ["fld5AgFwLmneooEvl", "Gravedad", "gravedad", "texto"],
    ["fldOUESP4lLZ5f3kr", "Norma infringida", "norma_infringida", "texto"],
    ["fld7sPzGhay95hWgZ", "Tarjeta", "tarjeta", "texto"],
    ["fldUJuIQH32pCVkwS", "Descripción", "descripcion", "texto"],
    ["fldMJW0knN3LXLVmk", "Medida aplicada", "medida_aplicada", "multi"],
    ["fldtnmGoPm5rji3Iv", "Importe sanción", "importe_sancion", "num"],
    ["fldHgEScNF2H3m1ai", "Estado pago", "estado_pago", "texto"],
    ["fld7gsbHHhts3FegF", "Estado", "estado", "texto"],
    ["fld4CxW7BS48diYpQ", "Jugador", "jugador", "enlace", ["jugadores", "fldWmH6KHQGXmW2g5"]],
    ["fldq8MwUXVY0LjPOp", "Equipo", "equipo", "enlace", ["equipos", "fldw828tZj4b0gw57"]],
    ["fld5X1iVtcR1uqPp8", "Registrada por", "registrada_por", "enlace", ["usuarios", "fldlwh06UwTeuU27k"]],
    ["fldB8d21ndhMviNzM", "Validada por", "validada_por", "enlace", ["usuarios", "fldSWAKU4TrwtNCfh"]],
    ["fldCy8PlOikqwymWt", "Familia informada", "familia_informada", "bool"],
  ] },
  firmas: { airtable: "tblCiJo9zi21Yeaf7", campos: [
    ["fldCHKHKcqNQCYL5L", "Referencia", "referencia", "texto"],
    ["fldtYiMn9MCpHeFsC", "Estado", "estado", "texto"],
    ["fldm2a7grGKcBMjzt", "Firmante", "firmante", "texto"],
    ["fldPYBGRC3zlbjujn", "Fecha firma", "fecha_firma", "fechahora"],
    ["fldIwhWzcqo5XpiJ8", "Evidencia", "evidencia", "texto"],
    ["fld1Em8pKl2TjJmzf", "Normativa", "normativa", "enlace", ["normativa", "flds3FSHFrDWfiTrO"]],
    ["fldVmYVSgZoa9A8I3", "Jugador", "jugador", "enlace", ["jugadores", "fld3jkdhle32OG4Mr"]],
    ["fldzAbNAwQihqpcFg", "Usuario", "usuario", "enlace", ["usuarios", "fldfKUcG3KDuQAhiV"]],
    ["fldc5SA96z2ZzfxnN", "Notas", "notas", "texto"],
  ] },
  galeria: { airtable: "tblwMuinSKzjvkhk7", campos: [
    ["fld71ZpJbRDsm0l0y", "Título", "titulo", "texto"],
    ["fld9Nf4t9bbvklGzh", "Tipo", "tipo", "texto"],
    ["fldDTjHwUbMYHl8p9", "Archivo", "archivo", "adjuntos"],
    ["fldk6MYcSGMXil7Uv", "Estado", "estado", "texto"],
    ["fldU8XPhGAy4ESRbV", "Motivo rechazo", "motivo_rechazo", "texto"],
    ["fldFd6jchzqhTnxVx", "Visibilidad", "visibilidad", "texto"],
    ["fldjvTp0OsTysbUlR", "Consentimiento de imagen verificado", "consentimiento_imagen", "bool"],
    ["fldrT4lTv0hHHu5mL", "Fecha subida", "fecha_subida", "fechahora"],
    ["fldcNQ8FQFYAv4NTk", "Jugador", "jugador", "enlace", ["jugadores", "fldK7h1IYnmoCY41h"]],
    ["fldJAQnmzSshJWFy7", "Subido por", "subido_por", "enlace", ["usuarios", "fldJJSXxkqOFy2z2L"]],
    ["fldU4rojwNN9hPIP0", "Revisado por", "revisado_por", "enlace", ["usuarios", "fldKl7mPvwQ4WVWWM"]],
  ] },
  suscripciones: { airtable: "tblb6s8eKcLK9LCw9", campos: [
    ["fldVivShmbaSNuCcC", "Email", "email", "texto"],
    ["fldKsbWLFhmwWGjjX", "Estado", "estado", "texto"],
    ["fld9VDGUvRR4oLSqc", "Stripe customer", "stripe_customer", "texto"],
    ["fldEqj4wCOCQK6T86", "Stripe subscription", "stripe_subscription", "texto"],
    ["fldCnl3Bf54HU6N8b", "Price ID", "price_id", "texto"],
    ["fldkIp45fn7xXWI60", "Importe", "importe", "num"],
    ["fldSJpmXi4bmtriIs", "Periodo fin", "periodo_fin", "fechahora"],
    ["fldJVihH0K2INwMta", "Cancelar al final", "cancelar_al_final", "bool"],
    ["fld8DIxvodpTddvMs", "Actualizado", "actualizado", "fechahora"],
    ["fldqN9PDei93K4GZ7", "Usuario", "usuario", "enlace", ["usuarios", "fldqVR918iRKOLxex"]],
  ] },
  partidos: { airtable: "tblwOCRaTwkZVzVxq", campos: [
    ["fld2cYL3g3LaA8i2J", "Referencia", "referencia", "texto"],
    ["fldNokXcwb2qIyacc", "Fecha", "fecha", "fecha"],
    ["fldau3FDAZZoerwR9", "Hora", "hora", "texto"],
    ["fldKXS5G3yFurt3x8", "Jornada", "jornada", "texto"],
    ["fldtII90u0OswiivA", "Local", "local", "texto"],
    ["fldWYD2X7319X4Akn", "Visitante", "visitante", "texto"],
    ["fldZbgMXLrsk7i19K", "Lugar", "lugar", "texto"],
    ["fld8zIw50aAfD7k5G", "Equipo", "equipo", "enlace", ["equipos", "fldvQewYiQaYpOQEA"]],
    ["fldTCEB7wCHsidFMN", "Ficha rival", "ficha_rival", "texto"],
    ["fld6Q79obeJa46rOf", "Token rival", "token_rival", "texto"],
    ["fldG20ihRTGxgYXoX", "Goles local", "goles_local", "num"],
    ["fld2IrVxm2Pwj8OWq", "Goles visitante", "goles_visitante", "num"],
  ] },
  convocatorias: { airtable: "tbl4ahEyv6FpMsYL0", campos: [
    ["fldTIoUCMugfu8EyL", "Referencia", "referencia", "texto"],
    ["fld6gJ8X3MYD3jElN", "Fecha", "fecha", "fecha"],
    ["fldZ2oXDt7UhAtemR", "Hora", "hora", "texto"],
    ["fldZ5Yi7StWIHql8R", "Jornada", "jornada", "texto"],
    ["fldbZlgJGMgnh7mP7", "Rival", "rival", "texto"],
    ["fldhX4ULw70aUpuVj", "Lugar", "lugar", "texto"],
    ["fldepJvhHpXQb9GhG", "Convocados", "convocados", "enlace", ["jugadores", "fld9xF30BdE6ffEEM"]],
    ["fldsuIeTAvJzFkzgN", "Equipo", "equipo", "enlace", ["equipos", "fldXSlXGkWFQJjyeo"]],
  ] },
  entrenamientos: { airtable: "tblinm3lV3FTUcL62", campos: [
    ["fldegGMXJRVzKb3FX", "Referencia", "referencia", "texto"],
    ["fldmm7Wu8dsiYXp5v", "Fecha", "fecha", "fecha"],
    ["fldyjODX19T63snIp", "Hora", "hora", "texto"],
    ["flddMRTxwDf4HNE0J", "Objetivo", "objetivo", "texto"],
    ["fldDitygMo9IAlx5P", "Duracion", "duracion", "num"],
    ["fldqKH4tfgYpFBKto", "Bloques", "bloques", "texto"],
    ["fldVpgy3PMoFg1Wef", "Equipo", "equipo", "enlace", ["equipos", "fldly58OdNfl8PLXJ"]],
    ["fld1Jb0vPATGxESTF", "Plantilla", "plantilla", "bool"],
    ["fldz3tCDJkRuqrgXr", "Compartida", "compartida", "bool"],
    ["fldokrqbCdfZBKMeY", "Club", "club", "enlace", ["clubes", "fldWaK6dqlvICVRPF"]],
    ["fldtpmWpEyHfhx5Ud", "Usos", "usos", "num"],
  ] },
  propuestas: { airtable: "tbl6cVRLXukqg1iFQ", campos: [
    ["fldmOwGOnzTLj0YwB", "Referencia", "referencia", "texto"],
    ["fldcg1NtOgnd1dPgm", "Tipo", "tipo", "texto"],
    ["fldTp6KiLsX1Ct0zq", "Estado", "estado", "texto"],
    ["fldLyjvNJYFl9L44F", "Datos", "datos", "texto"],
    ["fldNDgGcg66K5KLGT", "Equipo", "equipo", "enlace", ["equipos", "fldUAorODIpYyPmDc"]],
    ["fldtb0FrZmgtdhOoI", "Propuesto por", "propuesto_por", "enlace", ["usuarios", "fldtkQwLbyEo4RaEl"]],
    ["fldeJt8lKbxm0TCdA", "Aprobado por", "aprobado_por", "enlace", ["usuarios", "fldYUB2fB2LVseHSF"]],
    ["fldrRDvRP5IBIcbwG", "Fecha propuesta", "fecha_propuesta", "fechahora"],
    ["fldEZxwoA1k4HLWji", "Fecha resolución", "fecha_resolucion", "fechahora"],
    ["fldNre3sjgcXmLIig", "Motivo rechazo", "motivo_rechazo", "texto"],
  ] },
  partes_entreno: { airtable: "tblBM9evPnnjD3prf", campos: [
    ["fldVKBSHxPEqCuVk2", "Referencia", "referencia", "texto"],
    ["fldUyP4Qia9GM6lCR", "Fecha", "fecha", "fecha"],
    ["fldXvt940m1HPQ3uH", "Equipo", "equipo", "enlace", ["equipos", "fldLIb8GBxvSizIYT"]],
    ["fldIi957OqvZF1lCA", "Entrenador", "entrenador", "enlace", ["usuarios", "fldXx1MXKJpiWswxV"]],
    ["fldEyuA5hqm0GjxZX", "Entrenador nombre", "entrenador_nombre", "texto"],
    ["fldbDBmH77g1DpW7g", "Balones salida", "balones_salida", "num"],
    ["fldy8c534xQZAbyNW", "Balones entrada", "balones_entrada", "num"],
    ["fldc8hWR8DntfHlSi", "Balones perdidos", "balones_perdidos", "num"],
    ["fldYt0QLeWUmsyWBm", "Foto salida", "foto_salida", "adjuntos"],
    ["fldc0syR36oJ1iRPW", "Foto entrada", "foto_entrada", "adjuntos"],
    ["fld9cfPju0jijEqRu", "Desperfectos", "desperfectos", "texto"],
    ["fldPr3SR2b6PUIQUh", "Entrenador tarde", "entrenador_tarde", "bool"],
    ["fldoEoWloaBFd2VOT", "Minutos tarde", "minutos_tarde", "num"],
    ["fldeoeOvw3mPJivEv", "Uso del telefono", "uso_del_telefono", "bool"],
    ["fldrcKIaP9UgyjmFP", "Penalizaciones", "penalizaciones", "texto"],
    ["fld7GphfCy25HceMW", "Jugadores con retraso", "jugadores_con_retraso", "num"],
    ["fldL3yZEsiTDkhs9s", "Jugadores con molestias", "jugadores_con_molestias", "num"],
    ["fldL8rT0LpKV1E9mt", "Notas", "notas", "texto"],
  ] },
  config: { airtable: "tblctORB081jr1lDO", campos: [
    ["fldK6DM4hrZsjS1DP", "Clave", "clave", "texto"],
    ["fldrJOfAInJThfOZv", "Apartados gratis", "apartados_gratis", "texto"],
    ["fld6I6dRA9myjjleR", "Apartados por rol", "apartados_por_rol", "texto"],
  ] },
  actas: { airtable: "tblpZuEDOM6ypjDKQ", campos: [
    ["fldj6UyImoePfnaHL", "Referencia", "referencia", "texto"],
    ["fldPMw5DRkBZQvVOK", "Fecha", "fecha", "fecha"],
    ["fldFtOxrcymw0Pq1g", "Equipo", "equipo", "enlace", ["equipos", "fld2oH8jIKwosGdEB"]],
    ["fldfsyqBTWze8o88q", "Rival", "rival", "texto"],
    ["fldbCLHPrNYTZtyp4", "Goles favor", "goles_favor", "num"],
    ["flde5wCv6Xx8lZ6D5", "Goles contra", "goles_contra", "num"],
    ["fld4LDZNdodHvPdco", "Datos", "datos", "texto"],
  ] },
};

export type Campo = {
  id: string; nombre: string; col: string; tipo: Tipo;
  destino?: string;          // tabla enlazada
  inversaCol?: string;       // columna del lado inverso, en la tabla enlazada
};
export type Tabla = { nombre: string; airtable: string; campos: Campo[]; porId: Map<string, Campo>; porNombre: Map<string, Campo> };

export const TABLAS: Tabla[] = Object.entries(DEF).map(([nombre, d]) => ({
  nombre, airtable: d.airtable,
  campos: d.campos.map(([id, n, col, tipo, enl]) => ({ id, nombre: n, col, tipo, ...(enl ? { destino: enl[0] } : {}) })),
  porId: new Map(), porNombre: new Map(),
}));
const campoPorId = new Map<string, Campo>();
for (const t of TABLAS) for (const c of t.campos) {
  t.porId.set(c.id, c);
  t.porNombre.set(c.nombre, c);
  campoPorId.set(c.id, c);
}
/* El inverso se resuelve al final, cuando ya existen todos los campos. */
for (const [nombre, d] of Object.entries(DEF)) for (const [id, , , , enl] of d.campos) {
  if (!enl) continue;
  const inv = campoPorId.get(enl[1]);
  if (!inv) throw new Error(`esquema: el inverso ${enl[1]} de ${nombre}.${id} no existe`);
  campoPorId.get(id)!.inversaCol = inv.col;
}

export const tablaPorAirtable = new Map(TABLAS.map((t) => [t.airtable, t]));
export const tablaPorNombre = new Map(TABLAS.map((t) => [t.nombre, t]));
/* Para el endpoint de subida de adjuntos, que solo trae el id del campo. */
export const tablaDeCampo = (fieldId: string): Tabla | undefined =>
  TABLAS.find((t) => t.porId.has(fieldId));
