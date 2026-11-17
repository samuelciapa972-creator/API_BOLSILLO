import { Route, Routes } from "react-router-dom";
import { Marco } from "./components/Marco";
import { RutaProtegida } from "./components/RutaProtegida";
import { AccesoPage } from "./pages/AccesoPage";
import { RecuperarPage } from "./pages/RecuperarPage";
import { InicioPage } from "./pages/InicioPage";
import { CuentasPage } from "./pages/CuentasPage";
import { CuentaPage } from "./pages/CuentaPage";
import { TitularesPage } from "./pages/TitularesPage";
import { MovimientosPage } from "./pages/MovimientosPage";
import { SeguridadPage } from "./pages/SeguridadPage";
import { NoEncontradaPage } from "./pages/NoEncontradaPage";

const GESTION = ["administrador", "auditor"];

export default function App() {
  return (
    <Routes>
      <Route path="/acceso" element={<AccesoPage />} />
      <Route path="/recuperar" element={<RecuperarPage />} />

      <Route
        element={
          <RutaProtegida>
            <Marco />
          </RutaProtegida>
        }
      >
        <Route index element={<InicioPage />} />
        <Route path="cuentas" element={<CuentasPage />} />
        <Route path="cuentas/:id" element={<CuentaPage />} />
        <Route
          path="titulares"
          element={
            <RutaProtegida roles={GESTION}>
              <TitularesPage />
            </RutaProtegida>
          }
        />
        <Route
          path="movimientos"
          element={
            <RutaProtegida roles={GESTION}>
              <MovimientosPage />
            </RutaProtegida>
          }
        />
        <Route path="seguridad" element={<SeguridadPage />} />
        <Route path="*" element={<NoEncontradaPage />} />
      </Route>
    </Routes>
  );
}
