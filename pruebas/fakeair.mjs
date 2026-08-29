/* Airtable de mentira en memoria, para poder ejecutar la función de verdad.
   Responde como la API real: por NOMBRE de campo salvo returnFieldsByFieldId. */
export const T = {
  USUARIOS:"tblZf4dFeq4FCjHGJ", JUGADORES:"tblsZpNBzo2DXlt6X", CLUBES:"tblc2wLfnbbJg8KkI",
  EQUIPOS:"tbl7h2mhoWr0W9aSU", PARTES:"tblBM9evPnnjD3prf", INCIDENCIAS:"tblQHTqaiSED689xd",
  NORMATIVA:"tblNgKxTA0TUq93Oa", FIRMAS:"tblCiJo9zi21Yeaf7", GALERIA:"tblwMuinSKzjvkhk7",
  PARTIDOS:"tblwOCRaTwkZVzVxq", CONVOCATORIAS:"tbl4ahEyv6FpMsYL0", PROPUESTAS:"tbl6cVRLXukqg1iFQ",
  ENTRENAMIENTOS:"tblinm3lV3FTUcL62", SUSCRIPCIONES:"tblb6s8eKcLK9LCw9",
  CONFIG:"tblctORB081jr1lDO",
};
/* id de campo -> nombre, para las tablas que tocamos */
export const NOMBRE = {"fldSnD1rqmHptkRlA": "Nombre", "fldJWlJ17YuZNe4Jx": "Email", "fldIWSWMiwFsxJBiY": "Rol", "fldEkbPe6UgCx0Lfy": "Estado", "fldATfWgaJOvmd6ep": "Plan", "fldV2DDL6v5szs0y3": "Club", "fldW8QHQvuOZv1zX8": "Equipo", "fldVX372lPNj7Bab8": "Contraseña", "fldevbPLxMunBH9NR": "Prueba", "fldJRASqTraLecDMa": "RolesExtra", "fld4okYQmHxbEQ6C8": "ParteMat", "fldmjUkaMwwLbPO89": "Nombre", "fldgTxdcJpju1jxt2": "Categoria", "fldSQPSejXh45fRQ8": "Formato", "fldl20r9arDXNdZdC": "Sistema", "fldFGQJQHzeNHi50l": "Club", "fldZ8Eow86UczBCCr": "Escudo", "fldnk9J5mmwx4ac36": "Web", "fldmCTjJcpercjAVl": "Maps", "fld23b31P4y079j77": "Encargado", "fldflPuhPqSecZ3rp": "Plan", "fldAMfVva4jTk0PCH": "Jugadas", "fld57z5y3QWsk1DnF": "Cargas", "flddC2z6uAHNSaGXX": "Dias", "fldlUNDFkJyehw8x0": "Nombre", "fld0BUV86fvUDWOcU": "Comunidad", "fldX3CMkCrO54gUrV": "Escudo", "fldVH4NDAN2Odlzwe": "Campo", "fld6XKOF4q9Kf5bKa": "Direccion", "fld2KQW6HDKsW3wCZ": "Maps", "fldiIev3Pd9eWhulJ": "Limite", "fldVKBSHxPEqCuVk2": "Ref", "fldUyP4Qia9GM6lCR": "Fecha", "fldXvt940m1HPQ3uH": "Equipo", "fldIi957OqvZF1lCA": "Entrenador", "fldEyuA5hqm0GjxZX": "EntrenadorNombre", "fldbDBmH77g1DpW7g": "Salida", "fldy8c534xQZAbyNW": "Entrada", "fldc8hWR8DntfHlSi": "Perdidos", "fldYt0QLeWUmsyWBm": "FotoSalida", "fldc0syR36oJ1iRPW": "FotoEntrada", "fld9cfPju0jijEqRu": "Desperfectos", "fldPr3SR2b6PUIQUh": "Tarde", "fldoEoWloaBFd2VOT": "MinutosTarde", "fldeoeOvw3mPJivEv": "Telefono", "fldrcKIaP9UgyjmFP": "Penalizaciones", "fld7GphfCy25HceMW": "JugTarde", "fldL3yZEsiTDkhs9s": "JugMolestias", "fldL8rT0LpKV1E9mt": "Notas", "fldv5Gtrpw2e6xopC": "Ref", "fldxhO3y8YcOA5XBI": "Fecha", "fldRG05YcO16bs8Mu": "Ctx", "fld5AgFwLmneooEvl": "Grav", "fldOUESP4lLZ5f3kr": "Norma", "fld7sPzGhay95hWgZ": "Tarjeta", "fldUJuIQH32pCVkwS": "Desc", "fldMJW0knN3LXLVmk": "Medida", "fldtnmGoPm5rji3Iv": "Importe", "fldHgEScNF2H3m1ai": "Pago", "fld7gsbHHhts3FegF": "Estado", "fld4CxW7BS48diYpQ": "Jugador", "fldCy8PlOikqwymWt": "Fam", "fldq8MwUXVY0LjPOp": "Equipo", "fldmOwGOnzTLj0YwB": "Ref", "fldcg1NtOgnd1dPgm": "Tipo", "fldTp6KiLsX1Ct0zq": "Estado", "fldLyjvNJYFl9L44F": "Datos", "fldNDgGcg66K5KLGT": "Equipo", "fldtb0FrZmgtdhOoI": "PropuestoPor", "fldeJt8lKbxm0TCdA": "AprobadoPor", "fldrRDvRP5IBIcbwG": "FechaProp", "fldEZxwoA1k4HLWji": "FechaRes", "fldNre3sjgcXmLIig": "Motivo", "fldegGMXJRVzKb3FX": "Ref", "fldmm7Wu8dsiYXp5v": "Fecha", "fldyjODX19T63snIp": "Hora", "flddMRTxwDf4HNE0J": "Objetivo", "fldDitygMo9IAlx5P": "Duracion", "fldqKH4tfgYpFBKto": "Bloques", "fldVpgy3PMoFg1Wef": "Equipo", "fld1Jb0vPATGxESTF": "Plantilla", "fldz3tCDJkRuqrgXr": "Compartida", "fldokrqbCdfZBKMeY": "Club", "fldtpmWpEyHfhx5Ud": "Usos", "fldTCEB7wCHsidFMN": "Ficha rival", "fld6Q79obeJa46rOf": "Token rival", "fldVmYVSgZoa9A8I3": "Jugador", "fldcNQ8FQFYAv4NTk": "Jugador", "fldOGmAE882lecjEE": "Equipo", "fldK6DM4hrZsjS1DP": "Clave", "fldrJOfAInJThfOZv": "Apartados gratis"};
export function crearFake(datos) {
  const db = JSON.parse(JSON.stringify(datos));
  const porNombre = (tabla, f) => {
    const out = {};
    for (const [k, v] of Object.entries(f)) out[NOMBRE[k] || k] = v;
    return out;
  };
  const llamadas = [];
  return {
    db, llamadas,
    fetch: async (url, init = {}) => {
      const u = new URL(String(url));
      const m = (init.method || "GET").toUpperCase();
      llamadas.push(`${m} ${u.pathname}${u.search}`);
      const partes = u.pathname.split("/").filter(Boolean); // v0 / base / tabla / [rec]
      const tabla = partes[2], rec = partes[3];
      db[tabla] = db[tabla] || [];
      const porId = u.searchParams.get("returnFieldsByFieldId") === "true";
      const salida = (r) => ({ id: r.id, fields: porId ? r.fields : porNombre(tabla, r.fields) });
      const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });
      if (m === "GET" && rec) { const r = db[tabla].find((x) => x.id === rec); return r ? J(salida(r)) : J({ error: "NOT_FOUND" }, 404); }
      if (m === "GET") return J({ records: db[tabla].map(salida) });
      if (m === "POST") { const b = JSON.parse(init.body); const id = "rec" + Math.random().toString(36).slice(2, 16);
        db[tabla].push({ id, fields: b.fields }); return J({ id, fields: b.fields }); }
      if (m === "PATCH" && rec) { const r = db[tabla].find((x) => x.id === rec); if (!r) return J({ error: "NOT_FOUND" }, 404);
        Object.assign(r.fields, JSON.parse(init.body).fields); return J(salida(r)); }
      if (m === "PATCH") { const b = JSON.parse(init.body);
        for (const x of b.records) { const r = db[tabla].find((y) => y.id === x.id); if (r) Object.assign(r.fields, x.fields); }
        return J({ records: b.records }); }
      if (m === "DELETE" && rec) { db[tabla] = db[tabla].filter((x) => x.id !== rec); return J({ deleted: true, id: rec }); }
      if (m === "DELETE") { const ids = u.searchParams.getAll("records[]");
        db[tabla] = db[tabla].filter((x) => !ids.includes(x.id)); return J({ records: ids.map((id) => ({ id, deleted: true })) }); }
      return J({ error: "?" }, 400);
    },
  };
}
