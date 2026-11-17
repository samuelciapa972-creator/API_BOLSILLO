import { solicitar } from "./api";

// Cada función corresponde a un endpoint del backend. El servidor decide
// qué puede ver cada rol (RBAC) y a quién pertenece cada recurso (BOLA).

// ---------- Cuentas ----------
export const listarCuentas = () => solicitar("/api/cuentas");
export const listarMisCuentas = () => solicitar("/api/cuentas/mis-cuentas");
export const obtenerCuenta = (id) => solicitar(`/api/cuentas/${id}`);
export const obtenerSaldo = (id) => solicitar(`/api/cuentas/${id}/saldo`);
export const transaccionesDeCuenta = (id) => solicitar(`/api/cuentas/${id}/transacciones`);
export const bolsillosDeCuenta = (id) => solicitar(`/api/cuentas/${id}/bolsillos`);
export const crearCuenta = (usuarioId) =>
  solicitar("/api/cuentas", { metodo: "POST", cuerpo: { usuarioId } });
export const cambiarEstadoCuenta = (id, estado) =>
  solicitar(`/api/cuentas/${id}/estado`, { metodo: "PATCH", cuerpo: { estado } });

// ---------- Transacciones ----------
export const listarTransacciones = () => solicitar("/api/transacciones");
export const depositar = (datos) =>
  solicitar("/api/transacciones/deposito", { metodo: "POST", cuerpo: datos });
export const retirar = (datos) =>
  solicitar("/api/transacciones/retiro", { metodo: "POST", cuerpo: datos });
export const transferir = (datos) =>
  solicitar("/api/transacciones/transferencia", { metodo: "POST", cuerpo: datos });

// ---------- Bolsillos ----------
export const crearBolsillo = (datos) =>
  solicitar("/api/bolsillos", { metodo: "POST", cuerpo: datos });
export const actualizarBolsillo = (id, datos) =>
  solicitar(`/api/bolsillos/${id}`, { metodo: "PUT", cuerpo: datos });
export const eliminarBolsillo = (id) => solicitar(`/api/bolsillos/${id}`, { metodo: "DELETE" });
export const apartar = (id, datos) =>
  solicitar(`/api/bolsillos/${id}/apartar`, { metodo: "POST", cuerpo: datos });
export const devolver = (id, datos) =>
  solicitar(`/api/bolsillos/${id}/devolver`, { metodo: "POST", cuerpo: datos });

// ---------- Titulares (tabla usuarios) ----------
export const listarTitulares = () => solicitar("/api/usuarios");
export const obtenerTitular = (id) => solicitar(`/api/usuarios/${id}`);
export const crearTitular = (datos) => solicitar("/api/usuarios", { metodo: "POST", cuerpo: datos });
export const actualizarTitular = (id, datos) =>
  solicitar(`/api/usuarios/${id}`, { metodo: "PUT", cuerpo: datos });
export const eliminarTitular = (id) => solicitar(`/api/usuarios/${id}`, { metodo: "DELETE" });

// ---------- Indicadores ----------
export const obtenerResumen = () => solicitar("/api/estadisticas/resumen");
