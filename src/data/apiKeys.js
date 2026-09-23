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
// API Keys registradas
// Simula la futura tabla api_keys de
// Supabase/PostgreSQL. Nunca se guarda la
// API Key original, solo su hash.
// ========================================
const apiKeys = [
  {
    id: 1,
    cliente: "Postman Laboratorio",
    hash: generarHash(
      process.env.API_KEY_POSTMAN
    ),
    activa: true,
    creadaEn: "2026-09-15"
  },
  {
    id: 2,
    cliente: "Aplicación Administrativa",
    hash: generarHash(
      process.env.API_KEY_ADMIN
    ),
    activa: true,
    creadaEn: "2026-09-15"
  },
  {
    id: 3,
    cliente: "Aplicación Móvil",
    hash: generarHash(
      process.env.API_KEY_MOVIL
    ),
    activa: false,
    creadaEn: "2026-09-15"
  }
];

module.exports = apiKeys;
