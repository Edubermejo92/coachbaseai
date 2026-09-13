/* Los tres sitios donde vive el identificador de editor de AdSense tienen que
   decir lo mismo: el código de la app, la etiqueta de verificación del HTML y
   ads.txt. Es un fallo fácil de cometer -se rellena uno y se olvida otro- y
   muy difícil de ver: el banner simplemente no sirve anuncios, sin ningún
   error en ninguna parte. Mejor que lo diga una prueba.
   Mientras estén los tres sin rellenar, la prueba pasa: es el estado normal
   hasta que AdSense apruebe la cuenta. */
import { readFileSync } from "node:fs";
let ok = 0, mal = 0;
const dice = (n, c, e = "") => { (c ? ok++ : mal++); console.log(`${c ? "✓" : "✗"} ${n}${e ? "  → " + e : ""}`); };

const lee = (f) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
const saca = (txt, re) => (txt.match(re) || [])[1] || "";

const app = saca(lee("src/App.jsx"), /const ADSENSE_CLIENT_ID = "(ca-pub-[^"]*)"/);
const slot = saca(lee("src/App.jsx"), /const ADSENSE_SLOT_ID = "([^"]*)"/);
const html = saca(lee("index.html"), /name="google-adsense-account" content="(ca-pub-[^"]*)"/);
const ads = saca(lee("public/ads.txt"), /google\.com,\s*(pub-[^,\s]+)/);

dice("el código de la app declara un ca-pub-", !!app, app);
dice("el HTML lleva la etiqueta de verificación", !!html, html);
dice("ads.txt declara un pub-", !!ads, ads);
dice("el ID del HTML es el mismo que el de la app", html === app, `${html} vs ${app}`);
dice("el de ads.txt es el mismo (ads.txt va sin el 'ca-')", `ca-${ads}` === app, `ca-${ads} vs ${app}`);

/* Y si se ha rellenado el editor, el hueco de anuncio también: con uno solo
   de los dos, el banner no se pinta y parece que AdSense no funciona. */
const pendiente = (x) => x.includes("XXXX");
dice("o los dos rellenos o los dos sin rellenar", pendiente(app) === pendiente(slot), `editor=${app} · hueco=${slot}`);

/* El .txt tiene que llevar la línea tal y como la pide Google, con su ID de
   sistema de publicidad: sin eso, la línea no vale. */
dice("ads.txt lleva la línea completa de Google", /google\.com,\s*pub-[^,]+,\s*DIRECT,\s*f08c47fec0942fa0/.test(lee("public/ads.txt")), lee("public/ads.txt").trim().split("\n").pop());

console.log(`\n${ok} correctas · ${mal} fallos`);
process.exit(mal ? 1 : 0);
