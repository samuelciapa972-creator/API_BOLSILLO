// ========================================
// Usuarios que inician sesión en la API
// (administradores, clientes, auditores).
// Son distintos de los "usuarios" de la
// billetera (src/data/usuarios.js).
//
// Inicia vacío: el primer usuario se crea
// mediante POST /api/auth/registro. Nunca
// se guardan contraseñas en texto plano.
// ========================================

const usuariosAuth = [];

module.exports =
  usuariosAuth;
