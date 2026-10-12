# Pruebas del backend

Ejecutan la función de Netlify **de verdad** (`netlify/functions/airtable.mts`)
contra un Airtable de mentira en memoria. No tocan la base real ni necesitan
credenciales.

    npm run test

Por qué existen: las pruebas de navegador simulaban el backend, así que no
podían ver los fallos que estaban dentro de él. Estas sí. Encontraron tres:

- Un director podía crear categorías en el club de al lado, y fundar clubes.
- El borrado de una categoría no llegaba a hacerse nunca: el nombre se leía por
  id de campo sobre una respuesta indexada por nombre, salía vacío, y la
  comprobación de "escribe el nombre exacto" no cuadraba jamás.
- Subir las fotos del material devolvía 403 siempre, por el mismo motivo. Las
  dos fotos son la prueba de todo el módulo de material y no llegaban nunca a
  Airtable.

`fakeair.mjs` imita la API de Airtable en lo que importa aquí: devuelve los
campos por NOMBRE salvo que se pida `returnFieldsByFieldId=true`. Esa
distinción es justo la que provocaba los tres fallos, así que la doble tiene
que respetarla o las pruebas no valdrían para nada.

## Los dos modos: Airtable y Supabase

    npm test               # los dos
    npm run test:airtable  # la función contra el Airtable de mentira
    npm run test:supabase  # la misma función, con los datos en Postgres de verdad

En modo Supabase (`PRUEBAS_SUPABASE=1`) las mismas pruebas corren contra
**Postgres de verdad** (PGlite, con la migración real y sus triggers) a través
del adaptador `netlify/lib/supabase-airtable.mts`. `fakesupabase.mjs` imita lo
poco que se usa de la API de Supabase (PostgREST y Storage) y mantiene
`fake.db` como espejo con la forma de fakeair, para que las pruebas no cambien.

- `pruebas16.mjs`: lo propio del adaptador (adjuntos, tipos, errores, fórmulas,
  Supabase caído).
- `pruebas17.mjs`: la migración Airtable → Supabase de punta a punta, comparando
  cada campo de cada registro.
