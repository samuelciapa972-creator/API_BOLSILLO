const {
  consultar,
  ejecutarTransaccion
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
// Solo lo invoca src/scripts/crearAdmin.js
// (npm run seed:admin), nunca el arranque
// HTTP. Las credenciales vienen de .env y
// no se imprimen.
//
// - Si ya existe cualquier administrador
//   (incluso inactivo) no inserta ni
//   modifica nada.
// - Si el email pertenece a otro rol no lo
//   convierte en administrador.
// - pg_advisory_xact_lock serializa dos
//   ejecuciones simultáneas del bootstrap.
// ========================================
const crearAdministradorInicial = async () => {
  const nombre =
    process.env.ADMIN_NOMBRE?.trim();

  const email =
    process.env.ADMIN_EMAIL?.trim()
      .toLowerCase();

  const password =
    process.env.ADMIN_PASSWORD;

  if (
    !nombre ||
    !email ||
    !password
  ) {
    throw new Error(
      "Faltan ADMIN_NOMBRE, ADMIN_EMAIL o ADMIN_PASSWORD"
    );
  }

  if (password.length < 12) {
    throw new Error(
      "ADMIN_PASSWORD debe tener al menos 12 caracteres"
    );
  }

  // El hash se calcula fuera de la
  // transacción para no retener el bloqueo
  const passwordHash =
    await generarPasswordHash(
      password
    );

  return ejecutarTransaccion(
    async (cliente) => {
      await cliente.query(
        "SELECT pg_advisory_xact_lock($1, $2)",
        [7505, 1]
      );

      const administradores =
        await cliente.query(
          `SELECT u.id
           FROM public.usuarios_auth u
           JOIN public.roles r ON r.id = u.rol_id
           WHERE r.nombre = 'administrador'
           LIMIT 1`
        );

      if (administradores.rowCount > 0) {
        return {
          creado: false,
          motivo: "ADMINISTRADOR_EXISTENTE"
        };
      }

      const correoExistente =
        await cliente.query(
          `SELECT id
           FROM public.usuarios_auth
           WHERE LOWER(email) = LOWER($1)`,
          [email]
        );

      if (correoExistente.rowCount > 0) {
        throw new Error(
          "El correo de bootstrap ya pertenece a otro usuario. No se elevarán privilegios."
        );
      }

      const resultado =
        await cliente.query(
          `INSERT INTO public.usuarios_auth
             (rol_id, nombre, email, password_hash)
           SELECT r.id, $1, $2, $3
           FROM public.roles r
           WHERE r.nombre = 'administrador'
             AND r.activo
           RETURNING id`,
          [
            nombre,
            email,
            passwordHash
          ]
        );

      if (resultado.rowCount === 0) {
        throw new Error(
          "No existe un rol administrador activo"
        );
      }

      return {
        creado: true,
        id: resultado.rows[0].id
      };
    }
  );
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
