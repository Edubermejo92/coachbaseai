import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);

/* Registro del service worker: solo cachea el cascarón (ver public/sw.js),
   nunca las llamadas a la API. Sin esto Chrome no considera la app
   "instalable" -requisito para el TWA de Android- ni funciona offline. */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
