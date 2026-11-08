const {
  generarHash
} = require("../utils/crypto.util");

// ========================================
// Validar configuración
// ========================================
const clavesConfiguradas = [
  process.env.API_KEY_POSTMAN,
  process.env.API_KEY_ADMIN,
  process.env.API_KEY_MOVIL
];

if (clavesConfiguradas.some((clave) => !clave)) {
  throw new Error(
    "Faltan variables de entorno para las API Keys"
  );
}

// ========================================
// Semilla de API Keys
// Ya no es la fuente de datos: al arrancar,
// apiKeys.service.js la sincroniza con la
// tabla public.api_keys. Nunca se guarda
// la API Key original, solo su hash.
//
// "activa" solo se usa al insertar un
// cliente nuevo: después manda el valor de
// la tabla (se puede deshabilitar una key
// sin tocar el código).
// ========================================
const apiKeys = [
  {
    cliente: "Postman Laboratorio",
    hash: generarHash(
      process.env.API_KEY_POSTMAN
    ),
    activa: true
  },
  {
    cliente: "Aplicación Administrativa",
    hash: generarHash(
      process.env.API_KEY_ADMIN
    ),
    activa: true
  },
  {
    cliente: "Aplicación Móvil",
    hash: generarHash(
      process.env.API_KEY_MOVIL
    ),
    activa: false
  }
];

module.exports = apiKeys;
