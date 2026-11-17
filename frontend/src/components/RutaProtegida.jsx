import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Solo decide qué pantallas se muestran. No es un control de seguridad:
 * cada endpoint vuelve a validar JWT, rol y propiedad en el backend.
 */
export function RutaProtegida({ roles, children }) {
  const { autenticado, usuario } = useAuth();
  const ubicacion = useLocation();

  if (!autenticado) {
    return <Navigate to="/acceso" replace state={{ desde: ubicacion.pathname }} />;
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
