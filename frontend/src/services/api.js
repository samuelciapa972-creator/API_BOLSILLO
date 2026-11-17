import { avisarSesionExpirada } from "./sesion-expirada";

// Solo la URL pública de la API. Ningún secreto vive en el frontend:
// las variables VITE_ quedan expuestas en el navegador.
const URL_API = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

const CLAVE_SESION = "bolsillo.sesion";

export const leerSesion = () => {
  try {
    const crudo = sessionStorage.getItem(CLAVE_SESION);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
};

export const guardarSesion = (sesion) => {
  try {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  } catch {
    // Navegación privada sin almacenamiento: la sesión vive solo en memoria.
  }
};

export const borrarSesion = () => {
  try {
    sessionStorage.removeItem(CLAVE_SESION);
  } catch {
    // Nada que borrar.
  }
};

export class ErrorApi extends Error {
  constructor(estado, cuerpo) {
    super(cuerpo?.mensaje || mensajePorEstado(estado));
    this.name = "ErrorApi";
    this.estado = estado;
    this.errores = Array.isArray(cuerpo?.errores) ? cuerpo.errores : [];
  }
}

const mensajePorEstado = (estado) => {
  if (estado === 0) return "No se pudo contactar la API. Revise que el backend esté encendido.";
  if (estado === 401) return "Su sesión no es válida. Inicie sesión de nuevo.";
  if (estado === 403) return "Su rol no tiene permiso para esta operación.";
  if (estado === 404) return "El recurso no existe o no le pertenece.";
  if (estado === 429) return "Demasiadas solicitudes. Espere unos minutos.";
  return "Ocurrió un error inesperado. Intente de nuevo.";
};

/**
 * Petición HTTP a la API.
 * - Adjunta el JWT si hay sesión (opcion `publica` lo evita).
 * - Ante 401 en una ruta protegida avisa que la sesión expiró.
 */
export const solicitar = async (ruta, { metodo = "GET", cuerpo, publica = false, senal } = {}) => {
  const encabezados = { Accept: "application/json" };

  if (cuerpo !== undefined) {
    encabezados["Content-Type"] = "application/json";
  }

  const sesion = leerSesion();

  if (!publica && sesion?.token) {
    encabezados.Authorization = `Bearer ${sesion.token}`;
  }

  let respuesta;

  try {
    respuesta = await fetch(`${URL_API}${ruta}`, {
      method: metodo,
      headers: encabezados,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      signal: senal,
      cache: "no-store",
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ErrorApi(0, null);
  }

  let datos = null;
  const tipo = respuesta.headers.get("content-type") || "";

  if (tipo.includes("application/json")) {
    datos = await respuesta.json().catch(() => null);
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401 && !publica) {
      avisarSesionExpirada();
    }
    throw new ErrorApi(respuesta.status, datos);
  }

  return datos;
};
