// Canal mínimo entre la capa HTTP y el AuthContext: cuando la API responde
// 401 (token vencido o revocado por version_sesion) se cierra la sesión.
const EVENTO = "bolsillo:sesion-expirada";

export const avisarSesionExpirada = () => {
  window.dispatchEvent(new Event(EVENTO));
};

export const escucharSesionExpirada = (accion) => {
  window.addEventListener(EVENTO, accion);
  return () => window.removeEventListener(EVENTO, accion);
};
