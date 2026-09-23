const usuariosAuth =
  require(
    "../data/usuariosAuth"
  );

const {
  generarSiguienteId
} = require(
  "../utils/comunes"
);

const {
  generarPasswordHash,
  verificarPassword
} = require(
  "../utils/password.util"
);

// ========================================
// Obtener usuario por email
// ========================================
const obtenerUsuarioPorEmail = (email) => {
  return usuariosAuth.find(
    (usuario) =>
      usuario.email.toLowerCase() ===
      email.toLowerCase()
  );
};

// ========================================
// Obtener usuario por ID
// ========================================
const obtenerUsuarioPorId = (id) => {
  return usuariosAuth.find(
    (usuario) =>
      usuario.id === Number(id)
  );
};

// ========================================
// Crear usuario
// El estado "activo" lo fija el servidor,
// nunca se toma del cliente
// ========================================
const crearUsuario = async (datos) => {
  const passwordHash =
    await generarPasswordHash(
      datos.password
    );

  const nuevoUsuario = {
    id:
      generarSiguienteId(
        usuariosAuth
      ),

    nombre:
      datos.nombre,

    email:
      datos.email.toLowerCase(),

    passwordHash,

    rol:
      datos.rol,

    activo: true
  };

  usuariosAuth.push(
    nuevoUsuario
  );



  return nuevoUsuario;
};

// ========================================
// Verificar credenciales
// Devuelve null tanto si el email no existe
// como si la contraseña no coincide
// ========================================
const verificarCredenciales = async (
  email,
  password
) => {
  const usuario =
    obtenerUsuarioPorEmail(email);

  if (!usuario) {
    return null;
  }

  const passwordValida =
    await verificarPassword(
      password,
      usuario.passwordHash
    );

  if (!passwordValida) {
    return null;
  }

  return usuario;
};

module.exports = {
  obtenerUsuarioPorEmail,
  obtenerUsuarioPorId,
  crearUsuario,
  verificarCredenciales
};
