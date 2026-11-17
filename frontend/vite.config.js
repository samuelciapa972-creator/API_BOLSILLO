import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// Cabeceras de seguridad (hallazgos del DAST con OWASP ZAP).
// En producción, el servidor que publique dist/ debe enviar las mismas.
const cabecerasBase = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Resource-Policy": "same-origin",
};

const csp = (urlApi) =>
  [
    "default-src 'self'",
    "script-src 'self'",
    // React aplica `style={...}` por CSSOM, que CSP no bloquea: no hace falta 'unsafe-inline'.
    "style-src 'self'",
    "font-src 'self'",
    "img-src 'self' data:",
    `connect-src 'self' ${urlApi}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const urlApi = new URL(env.VITE_API_URL || "http://localhost:3000").origin;

  return {
    plugins: [react()],
    // El frontend corre en :5173 (origen permitido en ALLOWED_ORIGIN del backend).
    // En desarrollo no se envía CSP: Vite inyecta estilos en línea para la recarga en caliente.
    server: { port: 5173, strictPort: true, headers: cabecerasBase },
    preview: {
      port: 4173,
      strictPort: true,
      headers: { ...cabecerasBase, "Content-Security-Policy": csp(urlApi) },
    },
  };
});
