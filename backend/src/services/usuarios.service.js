const {
  consultar
} = require(
  "../config/database"
);

// ========================================
// Columnas devueltas (snake_case en SQL,
// camelCase en la API)
// ========================================
const COLUMNAS_USUARIO = `
  id,
  usuario_auth_id AS "usuarioAuthId",
  nombre,
  documento,
  email,
  telefono,
  estado
`;

const obtenerUsuarios = async () => {
  const resultado =
    await consultar(
      `SELECT ${COLUMNAS_USUARIO}
       FROM public.usuarios
       ORDER BY id`
    );

  return resultado.rows;
};

const obtenerUsuarioPorId = async (
  id
) => {
  const resultado =
    await consultar(
      `SELECT ${COLUMNAS_USUARIO}
       FROM public.usuarios
       WHERE id = $1`,
      [id]
    );

  return resultado.rows[0] ?? null;
};

// ========================================
// Obtener titular por usuario de login
// Relaciona el JWT (sub = usuarios_auth.id)
// con el titular de la billetera
// ========================================
const obtenerUsuarioPorUsuarioAuthId = async (
  usuarioAuthId
) => {
  const resultado =
    await consultar(
      `SELECT ${COLUMNAS_USUARIO}
       FROM public.usuarios
       WHERE usuario_auth_id = $1`,
      [usuarioAuthId]
    );

  return resultado.rows[0] ?? null;
};

const buscarUsuarioPorDocumento = async (
  documento
) => {
  const resultado =
    await consultar(
      `SELECT ${COLUMNAS_USUARIO}
       FROM public.usuarios
       WHERE documento = $1`,
      [documento]
    );

  return resultado.rows[0] ?? null;
};

// Sin distinguir mayúsculas, igual que el
// índice único uq_usuarios_email_ci
const buscarUsuarioPorEmail = async (
  email
) => {
  const resultado =
    await consultar(
      `SELECT ${COLUMNAS_USUARIO}
       FROM public.usuarios
       WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

  return resultado.rows[0] ?? null;
};

// ========================================
// Crear
// El estado lo fija la base de datos
// (DEFAULT 'activo'), nunca el cliente
// ========================================
const crearUsuario = async (
  datos
) => {
  const resultado =
    await consultar(
      `INSERT INTO public.usuarios
         (usuario_auth_id, nombre, documento, email, telefono)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${COLUMNAS_USUARIO}`,
      [
        datos.usuarioAuthId ?? null,
        datos.nombre,
        datos.documento,
        datos.email,
        datos.telefono
      ]
    );

  return resultado.rows[0];
};

// ========================================
// Actualizar (PUT)
// Si no se envía usuarioAuthId, se conserva
// la asociación actual con el login
// ========================================
const actualizarUsuario = async (
  id,
  datos
) => {
  const cambiarAsociacion =
    datos.usuarioAuthId !== undefined;

  const resultado =
    await consultar(
      `UPDATE public.usuarios
       SET nombre = $2,
           documento = $3,
           email = $4,
           telefono = $5,
           estado = $6,
           usuario_auth_id = CASE
             WHEN $7::BOOLEAN THEN $8::BIGINT
             ELSE usuario_auth_id
           END
       WHERE id = $1
       RETURNING ${COLUMNAS_USUARIO}`,
      [
        id,
        datos.nombre,
        datos.documento,
        datos.email,
        datos.telefono,
        datos.estado,
        cambiarAsociacion,
        cambiarAsociacion
          ? datos.usuarioAuthId
          : null
      ]
    );

  return resultado.rows[0] ?? null;
};

// ========================================
// Eliminar
// Si tiene cuentas, la FK (ON DELETE
// RESTRICT) lo impide: error 23503
// ========================================
const eliminarUsuario = async (
  id
) => {
  const resultado =
    await consultar(
      `DELETE FROM public.usuarios
       WHERE id = $1
       RETURNING ${COLUMNAS_USUARIO}`,
      [id]
    );

  return resultado.rows[0] ?? null;
};

module.exports = {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  obtenerUsuarioPorUsuarioAuthId,
  buscarUsuarioPorDocumento,
  buscarUsuarioPorEmail,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
};
