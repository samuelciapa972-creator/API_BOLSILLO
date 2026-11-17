import { solicitar } from "./api";

// Login público (Bloque 11): sin API Key en el navegador.
export const iniciarSesion = (email, password) =>
  solicitar("/api/auth/login", {
    metodo: "POST",
    cuerpo: { email, password },
    publica: true,
  });

export const obtenerPerfil = () => solicitar("/api/auth/perfil");

export const cambiarPassword = (datos) =>
  solicitar("/api/auth/cambiar-password", { metodo: "PATCH", cuerpo: datos });

export const restablecerConToken = (datos) =>
  solicitar("/api/auth/restablecer-password", {
    metodo: "POST",
    cuerpo: datos,
    publica: true,
  });

export const restablecerConCodigo = (datos) =>
  solicitar("/api/auth/restablecer-con-codigo", {
    metodo: "POST",
    cuerpo: datos,
    publica: true,
  });

export const estadoCodigos = () => solicitar("/api/auth/codigos-recuperacion/estado");

export const generarCodigos = (passwordActual, regenerar = false) =>
  solicitar(
    regenerar ? "/api/auth/codigos-recuperacion/regenerar" : "/api/auth/codigos-recuperacion",
    { metodo: "POST", cuerpo: { passwordActual } }
  );

// Solo administrador: token temporal para un titular verificado.
export const generarRecuperacionAdmin = (usuarioAuthId) =>
  solicitar(`/api/auth/recuperacion/admin/${usuarioAuthId}`, { metodo: "POST", cuerpo: {} });

// Solo administrador: crea un acceso de auditor o administrador.
export const crearAccesoPrivilegiado = (datos) =>
  solicitar("/api/auth/usuarios", { metodo: "POST", cuerpo: datos });
