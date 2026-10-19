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
// El rol y el estado "activo" los fija el
// servidor, nunca se toman del cliente
// (evita escalada de privilegios)
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

    // ====================================
    // Valores controlados por el servidor
    // ====================================
    rol: "cliente",

    activo: true
  };

  usuariosAuth.push(
    nuevoUsuario
  );

  return nuevoUsuario;
};

// ========================================
// Crear usuario desde administración
// Solo se usa detrás de autorizarRoles
// ("administrador"). crearUsuario() no se
// modifica: el registro público sigue
// creando siempre "cliente".
// ========================================
const crearUsuarioAdministrativo = async (
  datos
) => {
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

    // Ya validado: auditor | administrador
    rol:
      datos.rol,

    // Sigue controlado por el servidor
    activo: true
  };

  usuariosAuth.push(
    nuevoUsuario
  );

  return nuevoUsuario;
};

// ========================================
// Crear administrador inicial (bootstrap)
// Resuelve "¿quién crea al primer
// administrador?". Las credenciales vienen
// de .env, nunca del código ni de los logs.
// ========================================
const crearAdministradorInicial = async () => {
  const nombre =
    process.env.ADMIN_NOMBRE;

  const email =
    process.env.ADMIN_EMAIL;

  const password =
    process.env.ADMIN_PASSWORD;

  if (
    !nombre ||
    !email ||
    !password
  ) {
    console.warn(
      "Administrador inicial no configurado"
    );

    return null;
  }

  const existente =
    obtenerUsuarioPorEmail(email);

  if (existente) {
    return existente;
  }

  const administrador =
    await crearUsuarioAdministrativo({
      nombre,
      email,
      password,
      rol: "administrador"
    });

  // No se imprime email, password ni hash
  console.log(
    "Administrador inicial creado"
  );

  return administrador;
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
  crearUsuarioAdministrativo,
  verificarCredenciales,
  crearAdministradorInicial
};
