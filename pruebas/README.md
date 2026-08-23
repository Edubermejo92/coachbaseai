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
