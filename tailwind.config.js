/** @type {import('tailwindcss').Config} */
/* Tailwind se compila ahora en el build, no en el navegador.
   `content` escanea el código fuente, así que cualquier clase debe aparecer
   literal en el source: las clases dinámicas (`text-${color}`) NO se generan.
   En esta app el color variable viaja siempre por `style={{}}`, que es lo
   correcto; si en el futuro hace falta una clase condicional, escribe las dos
   variantes completas en un ternario en vez de concatenar el fragmento. */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
};
