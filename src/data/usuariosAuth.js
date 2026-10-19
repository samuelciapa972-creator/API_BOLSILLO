// ========================================
// Usuarios que inician sesión en la API
// (administradores, clientes, auditores).
// Son distintos de los "usuarios" de la
// billetera (src/data/usuarios.js).
//
// Inicia vacío: al arrancar, el bootstrap
// crea el administrador inicial desde .env.
// Los clientes se crean con
// POST /api/auth/registro y los auditores
// o administradores con POST
// /api/auth/usuarios (solo administrador).
// Nunca se guardan contraseñas en texto
// plano.
// ========================================

const usuariosAuth = [];

module.exports =
  usuariosAuth;
