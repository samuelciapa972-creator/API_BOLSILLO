const crypto = require("node:crypto");

const {
  consultar,
  ejecutarTransaccion
} = require("../config/database");

const {
  generarPasswordHash,
  verificarPassword
} = require("../utils/password.util");

// ========================================
// Códigos de recuperación (Bloque 11)
// Ocho códigos de un solo uso, visibles una
// sola vez. Solo se guarda su hash SHA-256.
// Formato: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
// ========================================

const CANTIDAD_CODIGOS = 8;

const normalizar = (codigo) =>
  codigo.replace(/-/g, "").toUpperCase();

const hashCodigo = (codigo) =>
  crypto
    .createHash("sha256")
    .update(normalizar(codigo))
    .digest("hex");

const codigoNuevo = () =>
  crypto
    .randomBytes(16)
    .toString("hex")
    .toUpperCase()
    .match(/.{4}/g)
    .join("-");

// ========================================
// Generar / regenerar (reautenticación)
// Los códigos anteriores se eliminan.
// ========================================
const generar = async (
  usuarioId,
  passwordActual
) => {
  return ejecutarTransaccion(async (cliente) => {
    // Bloqueo del usuario: dos regeneraciones
    // simultáneas no se mezclan
    const resultado = await cliente.query(
      `SELECT id, activo, password_hash
       FROM public.usuarios_auth
       WHERE id = $1
       FOR UPDATE`,
      [usuarioId]
    );

    const usuario = resultado.rows[0];

    if (
      !usuario ||
      !usuario.activo ||
      !usuario.password_hash ||
      !(await verificarPassword(
        passwordActual,
        usuario.password_hash
      ))
    ) {
      return { estado: "NO_AUTORIZADO" };
    }

    await cliente.query(
      `DELETE FROM public.codigos_recuperacion
       WHERE usuario_id = $1`,
      [usuarioId]
    );

    const codigos = Array.from(
      { length: CANTIDAD_CODIGOS },
      codigoNuevo
    );

    for (const codigo of codigos) {
      await cliente.query(
        `INSERT INTO public.codigos_recuperacion
           (usuario_id, codigo_hash)
         VALUES ($1, $2)`,
        [usuarioId, hashCodigo(codigo)]
      );
    }

    return { estado: "OK", codigos };
  });
};

// ========================================
// Cantidad de códigos disponibles
// ========================================
const estado = async (usuarioId) => {
  const resultado = await consultar(
    `SELECT COUNT(*)::int AS disponibles
     FROM public.codigos_recuperacion
     WHERE usuario_id = $1
       AND fecha_uso IS NULL`,
    [usuarioId]
  );

  return resultado.rows[0].disponibles;
};

// ========================================
// Restablecer contraseña con un código
// ========================================
const restablecer = async (
  email,
  codigo,
  passwordNueva
) => {
  const passwordHash =
    await generarPasswordHash(passwordNueva);

  return ejecutarTransaccion(async (cliente) => {
    // Primero el usuario: mismo orden de
    // bloqueo que generar()
    const u = await cliente.query(
      `SELECT id, activo, password_hash
       FROM public.usuarios_auth
       WHERE LOWER(email) = LOWER($1)
       FOR UPDATE`,
      [email]
    );

    const usuario = u.rows[0];

    if (!usuario || !usuario.activo) {
      return { estado: "INVALIDO" };
    }

    const c = await cliente.query(
      `SELECT id
       FROM public.codigos_recuperacion
       WHERE usuario_id = $1
         AND codigo_hash = $2
         AND fecha_uso IS NULL
       FOR UPDATE`,
      [usuario.id, hashCodigo(codigo)]
    );

    if (c.rows.length === 0) {
      return { estado: "INVALIDO" };
    }

    if (
      usuario.password_hash &&
      (await verificarPassword(
        passwordNueva,
        usuario.password_hash
      ))
    ) {
      return { estado: "MISMA_CLAVE" };
    }

    await cliente.query(
      `UPDATE public.usuarios_auth
       SET password_hash = $1,
           version_sesion = version_sesion + 1
       WHERE id = $2`,
      [passwordHash, usuario.id]
    );

    // Código consumido (un solo uso)
    await cliente.query(
      `UPDATE public.codigos_recuperacion
       SET fecha_uso = NOW()
       WHERE id = $1`,
      [c.rows[0].id]
    );

    // Tokens administrativos previos dejan
    // de servir
    await cliente.query(
      `UPDATE public.password_reset_tokens
       SET fecha_uso = NOW()
       WHERE usuario_id = $1
         AND fecha_uso IS NULL`,
      [usuario.id]
    );

    return { estado: "OK" };
  });
};

module.exports = {
  generar,
  estado,
  restablecer
};
