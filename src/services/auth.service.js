const {
  consultar
} = require(
  "../config/database"
);

const {
  generarPasswordHash,
  verificarPassword
} = require(
  "../utils/password.util"
);

// ========================================
// Columnas devueltas (camelCase)
// El rol se obtiene de public.roles: en la
// tabla solo se guarda rol_id
// ========================================
const COLUMNAS_USUARIO = `
  u.id,
  u.nombre,
  u.email,
  u.password_hash AS "passwordHash",
  r.nombre AS rol,
  u.activo
`;

// ========================================
// Obtener usuario por email
// El email se guarda en minúsculas
// ========================================
const obtenerUsuarioPorEmail = async (
  email
) => {
  const resultado =
    await consultar(
      `SELECT ${COLUMNAS_USUARIO}
       FROM public.usuarios_auth u
       JOIN public.roles r ON r.id = u.rol_id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );

  return resultado.rows[0] ?? null;
};

// ========================================
// Obtener usuario por ID
// ========================================
const obtenerUsuarioPorId = async (
  id
) => {
  const resultado =
    await consultar(
      `SELECT ${COLUMNAS_USUARIO}
       FROM public.usuarios_auth u
       JOIN public.roles r ON r.id = u.rol_id
       WHERE u.id = $1`,
      [id]
    );

  return resultado.rows[0] ?? null;
};

// ========================================
// Insertar usuario con un rol de negocio
// El rol se resuelve por nombre: si no
// existe o está inactivo, no se inserta
// nada y se lanza un error.
// ========================================
const insertarUsuario = async (
  datos,
  rol
) => {
  const passwordHash =
    await generarPasswordHash(
      datos.password
    );

  const resultado =
    await consultar(
      `WITH nuevo AS (
         INSERT INTO public.usuarios_auth
           (rol_id, nombre, email, password_hash)
         SELECT r.id, $2, LOWER($3), $4
         FROM public.roles r
         WHERE r.nombre = $1 AND r.activo
         RETURNING *
       )
       SELECT ${COLUMNAS_USUARIO}
       FROM nuevo u
       JOIN public.roles r ON r.id = u.rol_id`,
      [
        rol,
        datos.nombre,
        datos.email,
        passwordHash
      ]
    );

  if (resultado.rowCount === 0) {
    throw new Error(
      `El rol ${rol} no existe o está inactivo`
    );
  }

  return resultado.rows[0];
};

// ========================================
// Crear usuario
// El rol y el estado "activo" los fija el
// servidor, nunca se toman del cliente
// (evita escalada de privilegios)
// ========================================
const crearUsuario = async (datos) => {
  return insertarUsuario(
    datos,
    "cliente"
  );
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
  // Ya validado: auditor | administrador
  return insertarUsuario(
    datos,
    datos.rol
  );
};

// ========================================
// Crear administrador inicial (bootstrap)
// Resuelve "¿quién crea al primer
// administrador?". Las credenciales vienen
// de .env, nunca del código ni de los logs.
//
// Idempotente: si el email ya existe no se
// crea otro ni se cambia su contraseña. ON
// CONFLICT cubre dos instancias arrancando
// a la vez.
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
    await obtenerUsuarioPorEmail(email);

  if (existente) {
    if (existente.rol !== "administrador") {
      console.warn(
        "ADMIN_EMAIL pertenece a un usuario sin rol administrador"
      );
    }

    return existente;
  }

  const passwordHash =
    await generarPasswordHash(
      password
    );

  await consultar(
    `INSERT INTO public.usuarios_auth
       (rol_id, nombre, email, password_hash)
     SELECT r.id, $1, LOWER($2), $3
     FROM public.roles r
     WHERE r.nombre = 'administrador'
     ON CONFLICT (LOWER(email)) DO NOTHING`,
    [
      nombre,
      email,
      passwordHash
    ]
  );

  const administrador =
    await obtenerUsuarioPorEmail(email);

  if (!administrador) {
    throw new Error(
      "No se pudo crear el administrador inicial"
    );
  }

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
    await obtenerUsuarioPorEmail(email);

  if (
    !usuario ||
    !usuario.passwordHash
  ) {
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
