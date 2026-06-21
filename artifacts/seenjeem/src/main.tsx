import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { API_BASE } from "@/lib/apiBase";

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {});
  });
}

// Keep-alive: ping الخادم كل 8 دقائق عشان ما ينام على Render Free Tier
setInterval(() => {
  fetch(`${API_BASE}/healthz`).catch(() => {});
}, 8 * 60 * 1000);
