import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth-context";
import { borrarSesion, guardarSesion, leerSesion } from "../services/api";
import { iniciarSesion } from "../services/auth.service";
import { escucharSesionExpirada } from "../services/sesion-expirada";

// Lee `exp` del JWT solo para programar el cierre en el cliente.
// La validez real la decide siempre el backend (firma, expiración y
// version_sesion); este valor no se usa para autorizar nada.
const leerExpiracion = (token) => {
  try {
    const carga = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(carga));
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
};

const sesionVigente = () => {
  const sesion = leerSesion();
  if (!sesion?.token) return null;
  if (sesion.expiraEn && sesion.expiraEn <= Date.now()) {
    borrarSesion();
    return null;
  }
  return sesion;
};

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(sesionVigente);
  const [motivoCierre, setMotivoCierre] = useState(null);

  const cerrarSesion = useCallback((motivo = null) => {
    borrarSesion();
    setSesion(null);
    setMotivoCierre(motivo);
  }, []);

  const entrar = useCallback(async (email, password) => {
    const respuesta = await iniciarSesion(email, password);
    const nueva = {
      token: respuesta.token,
      usuario: respuesta.usuario,
      expiraEn: leerExpiracion(respuesta.token),
    };
    guardarSesion(nueva);
    setMotivoCierre(null);
    setSesion(nueva);
    return nueva.usuario;
  }, []);

  // 401 desde cualquier petición: token vencido o revocado.
  useEffect(
    () => escucharSesionExpirada(() => cerrarSesion("Su sesión expiró o fue revocada. Inicie sesión de nuevo.")),
    [cerrarSesion]
  );

  // Cierre programado al vencer el JWT.
  useEffect(() => {
    if (!sesion?.expiraEn) return undefined;
    const restante = sesion.expiraEn - Date.now();
    const temporizador = window.setTimeout(
      () => cerrarSesion("Su sesión expiró. Inicie sesión de nuevo."),
      Math.max(restante, 0)
    );
    return () => window.clearTimeout(temporizador);
  }, [sesion, cerrarSesion]);

  const valor = useMemo(
    () => ({
      usuario: sesion?.usuario ?? null,
      autenticado: Boolean(sesion?.token),
      expiraEn: sesion?.expiraEn ?? null,
      motivoCierre,
      entrar,
      cerrarSesion,
    }),
    [sesion, motivoCierre, entrar, cerrarSesion]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
