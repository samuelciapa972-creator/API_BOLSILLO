import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/instrument-sans";
import "./styles/tokens.css";
import "./styles/app.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { Notificaciones } from "./components/Notificaciones.jsx";
import { temaInicial } from "./utils/tema.js";

// Aplica el tema guardado antes del primer pintado.
temaInicial();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
    <Notificaciones />
  </StrictMode>
);
