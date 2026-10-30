/* ============================================================
   Ventana de la guía (textos en guia.js)
   ------------------------------------------------------------
   Tres pestañas: los primeros pasos de su rol, con los que ya ha hecho
   marcados; todas las funciones que tiene en su menú, y las preguntas de
   siempre. El buscador mira en las tres a la vez. «Abrir» lleva al apartado
   y cierra la guía, para que nadie tenga que buscarlo en el menú.
   Se carga aparte (React.lazy en App.jsx): solo pesa a quien la abre.
   ============================================================ */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { textosGuia, pasosDe } from "./guia.js";

/* Sin tildes ni mayúsculas: «video» tiene que encontrar «vídeo». */
const plano = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function Guia({ lang, grupo, hechos = {}, tabs = [], puede = () => true, C, AC, onIr, onCuenta, onCerrar, inicial }) {
  const txt = textosGuia(lang);
  const familia = grupo === "familia" || grupo === "jugador";
  const pasos = pasosDe(txt, grupo, puede);
  /* Solo los apartados que tiene en su menú: a un delegado no se le explica
     la pantalla de Club. Los que no son una pestaña (Mi cuenta, la nube) los
     tiene todo el mundo. */
  const secciones = familia ? [] : txt.secciones.filter((s) => !s.tab || tabs.includes(s.tab));
  const faq = txt.faq.filter((f) => !f.para || f.para === (familia ? "familia" : "staff"));
  const pestanas = familia ? ["pasos", "faq"] : ["pasos", "funciones", "faq"];

  const comprobables = pasos.filter((p) => hechos[p.id] !== undefined);
  const hechosN = comprobables.filter((p) => hechos[p.id]).length;
  const siguiente = pasos.find((p) => hechos[p.id] === false);

  const [pestana, setPestana] = useState(inicial?.pestana || "pasos");
  const [q, setQ] = useState("");
  /* Abierto de entrada: el paso que se ha tocado desde Inicio o, si no, el
     siguiente que le falta. Así no hay que leerse los ocho para saber cuál toca. */
  const [abiertos, setAbiertos] = useState(() => new Set([inicial?.id || siguiente?.id || pasos[0]?.id].filter(Boolean)));
  const alternar = (k) => setAbiertos((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  /* App.jsx se repinta a menudo (el reloj del partido, la sincronización)
     y le pasa funciones nuevas cada vez: con la referencia, el foco y la
     tecla Esc se montan una sola vez. */
  const cerrarRef = useRef(null);
  const alCerrar = useRef(onCerrar);
  alCerrar.current = onCerrar;
  useEffect(() => {
    cerrarRef.current?.focus();
    const tecla = (e) => { if (e.key === "Escape") alCerrar.current(); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const busca = plano(q.trim());
  const casa = (...partes) => !busca || busca.split(/\s+/).every((w) => plano(partes.flat().join(" ")).includes(w));
  const encontrados = busca ? {
    pasos: pasos.filter((p) => casa(p.titulo, p.texto)),
    funciones: secciones.filter((s) => casa(s.titulo, s.resumen, s.puntos)),
    faq: faq.filter((f) => casa(f.q, f.a)),
  } : null;

  const puedeAbrir = (x) => x.cuenta ? !!onCuenta : !!(x.tab && tabs.includes(x.tab));
  /* Funciones que pintan, no componentes: un componente definido aquí
     dentro sería otro en cada repintado y React lo montaría de cero. */
  const botonAbrir = (x) => puedeAbrir(x) && (
    <button onClick={() => (x.cuenta ? onCuenta() : onIr(x.tab))}
      className="mt-2 text-xs px-3 py-1.5 rounded-lg font-display uppercase tracking-wide font-semibold"
      style={{ background: AC, color: C.sobre }}>
      {txt.abrir} →
    </button>
  );

  const paso = (p, n) => {
    const ok = !!hechos[p.id];
    const abierto = !!busca || abiertos.has(`p:${p.id}`) || abiertos.has(p.id);
    return (
      <li key={p.id} className="rounded-lg border" style={{ borderColor: abierto ? AC : C.line, background: C.panel }}>
        <button onClick={() => alternar(abiertos.has(p.id) ? p.id : `p:${p.id}`)} aria-expanded={abierto}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-left">
          <span className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold"
            style={ok ? { background: C.green, color: "#fff" } : { border: `1.5px solid ${C.line}`, color: C.dim }}
            aria-label={ok ? txt.hecho : undefined}>
            {ok ? "✓" : n}
          </span>
          <span className="flex-1 min-w-0 font-display text-sm uppercase tracking-wide" style={{ color: ok ? C.dim : C.chalk, textDecoration: ok ? "line-through" : "none" }}>{p.titulo}</span>
          <span className="text-xs shrink-0" style={{ color: C.dim }}>{abierto ? "▴" : "▾"}</span>
        </button>
        {abierto && (
          <div className="px-3 pb-3 pl-[3.25rem] -mt-1">
            <ul className="space-y-1.5 text-sm leading-relaxed list-disc pl-4" style={{ color: C.chalk }}>
              {p.texto.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
            {botonAbrir(p)}
          </div>
        )}
      </li>
    );
  };

  const seccion = (s) => {
    const abierto = !!busca || abiertos.has(`s:${s.id}`);
    return (
      <li key={s.id} className="rounded-lg border" style={{ borderColor: abierto ? AC : C.line, background: C.panel }}>
        <button onClick={() => alternar(`s:${s.id}`)} aria-expanded={abierto} className="w-full flex items-start gap-3 px-3 py-2.5 text-left">
          <span className="flex-1 min-w-0">
            <span className="block font-display text-sm uppercase tracking-wide" style={{ color: C.chalk }}>{s.titulo}</span>
            <span className="block text-xs mt-0.5" style={{ color: C.dim }}>{s.resumen}</span>
          </span>
          <span className="text-xs shrink-0 mt-0.5" style={{ color: C.dim }}>{abierto ? "▴" : "▾"}</span>
        </button>
        {abierto && (
          <div className="px-3 pb-3 -mt-1">
            <ul className="space-y-1.5 text-sm leading-relaxed list-disc pl-5" style={{ color: C.chalk }}>
              {s.puntos.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
            {botonAbrir(s)}
          </div>
        )}
      </li>
    );
  };

  const pregunta = (f, i) => {
    const abierto = !!busca || abiertos.has(`f:${i}`);
    return (
      <li key={f.q} className="rounded-lg border" style={{ borderColor: abierto ? AC : C.line, background: C.panel }}>
        <button onClick={() => alternar(`f:${i}`)} aria-expanded={abierto} className="w-full flex items-center gap-3 px-3 py-2.5 text-left">
          <span className="flex-1 min-w-0 text-sm font-semibold" style={{ color: C.chalk }}>{f.q}</span>
          <span className="text-xs shrink-0" style={{ color: C.dim }}>{abierto ? "▴" : "▾"}</span>
        </button>
        {abierto && <p className="px-3 pb-3 -mt-1 text-sm leading-relaxed" style={{ color: C.chalk }}>{f.a}</p>}
      </li>
    );
  };

  const titulo = (texto) => (
    <div className="flex items-center gap-2 pt-2 pb-1.5">
      <span className="text-[11px] font-display uppercase tracking-[0.18em] shrink-0" style={{ color: C.dim }}>{texto}</span>
      <span className="h-px flex-1" style={{ background: C.line }} />
    </div>
  );

  const progreso = comprobables.length > 1 && (
    <div className="mb-3">
      <div className="flex items-center justify-between text-xs mb-1" style={{ color: C.dim }}>
        <span>{txt.progreso.replace("{a}", hechosN).replace("{b}", comprobables.length)}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.line }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${(hechosN / comprobables.length) * 100}%`, background: C.green }} />
      </div>
    </div>
  );

  let cuerpo;
  if (encontrados) {
    const nada = !encontrados.pasos.length && !encontrados.funciones.length && !encontrados.faq.length;
    cuerpo = nada ? <p className="text-sm py-6 text-center" style={{ color: C.dim }}>{txt.sinResultados}</p> : (
      <>
        {encontrados.pasos.length > 0 && <>{titulo(txt.pestanas.pasos)}<ol className="space-y-2">{encontrados.pasos.map((p) => paso(p, pasos.indexOf(p) + 1))}</ol></>}
        {encontrados.funciones.length > 0 && <>{titulo(txt.pestanas.funciones)}<ul className="space-y-2">{encontrados.funciones.map(seccion)}</ul></>}
        {encontrados.faq.length > 0 && <>{titulo(txt.pestanas.faq)}<ul className="space-y-2">{encontrados.faq.map((f) => pregunta(f, faq.indexOf(f)))}</ul></>}
      </>
    );
  } else if (pestana === "funciones") {
    cuerpo = <ul className="space-y-2">{secciones.map(seccion)}</ul>;
  } else if (pestana === "faq") {
    cuerpo = <ul className="space-y-2">{faq.map(pregunta)}</ul>;
  } else {
    cuerpo = <>{progreso}<ol className="space-y-2">{pasos.map((p, i) => paso(p, i + 1))}</ol></>;
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-stretch sm:items-center justify-center sm:p-4" style={{ background: "rgba(10,14,12,0.8)" }} onClick={onCerrar}>
      <div role="dialog" aria-modal="true" aria-labelledby="cb-guia-titulo"
        className="w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col sm:rounded-lg sm:border overflow-hidden"
        style={{ background: C.bg, borderColor: AC }} onClick={(e) => e.stopPropagation()}>
        <div className="px-4 pt-4 pb-3 border-b shrink-0" style={{ borderColor: C.line, background: C.panel }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="cb-guia-titulo" className="font-display text-xl font-semibold uppercase tracking-wide" style={{ color: AC }}>📘 {txt.titulo}</h2>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: C.dim }}>{familia ? txt.introFamilia : txt.intro}</p>
            </div>
            <button ref={cerrarRef} onClick={onCerrar} aria-label={txt.cerrar} className="shrink-0 text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: C.line, color: C.chalk }}>✕</button>
          </div>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={txt.buscar} aria-label={txt.buscar}
            className="mt-3 w-full px-3 py-2 rounded-lg border bg-transparent text-sm" style={{ borderColor: C.line, color: C.chalk }} />
          {!busca && (
            <div role="tablist" className="mt-3 flex gap-1.5 overflow-x-auto">
              {pestanas.map((k) => (
                <button key={k} role="tab" aria-selected={pestana === k} onClick={() => setPestana(k)}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-display uppercase tracking-wide border"
                  style={pestana === k ? { background: AC, color: C.sobre, borderColor: AC } : { borderColor: C.line, color: C.dim }}>
                  {txt.pestanas[k]}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">{cuerpo}</div>
      </div>
    </div>,
    document.body,
  );
}
