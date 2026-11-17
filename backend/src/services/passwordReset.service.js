const crypto = require("node:crypto");

const {
  ejecutarTransaccion
} = require("../config/database");

const {
  generarPasswordHash,
  verificarPassword
} = require("../utils/password.util");

// ========================================
// Recuperación administrativa (Bloque 11)
// El token solo se entrega una vez; en la
// base de datos se guarda su hash SHA-256.
// ========================================

const VIGENCIA_TOKEN = "15 minutes";

const hashToken = (token) =>
  crypto
    .createHash("sha256")
    .update(token, "utf8")
    .digest("hex");

// ========================================
// Generar token (lo autoriza un admin)
// ========================================
const generarRecuperacion = async (
  usuarioId,
  administradorId
) => {
  return ejecutarTransaccion(async (cliente) => {
    const resultado = await cliente.query(
      `SELECT id, activo
       FROM public.usuarios_auth
       WHERE id = $1
       FOR UPDATE`,
      [usuarioId]
    );

    if (
      resultado.rows.length === 0 ||
      !resultado.rows[0].activo
    ) {
      return { estado: "NO_ENCONTRADO" };
    }

    // Solo un token vigente por usuario:
    // los anteriores sin usar se anulan
    await cliente.query(
      `UPDATE public.password_reset_tokens
       SET fecha_uso = NOW()
       WHERE usuario_id = $1
         AND fecha_uso IS NULL`,
      [usuarioId]
    );

    const token =
      crypto.randomBytes(32).toString("hex");

    const guardado = await cliente.query(
      `INSERT INTO public.password_reset_tokens
         (usuario_id, administrador_id,
          token_hash, fecha_expiracion)
       VALUES ($1, $2, $3,
               NOW() + $4::interval)
       RETURNING fecha_expiracion AS "expiraEn"`,
      [
        usuarioId,
        administradorId,
        hashToken(token),
        VIGENCIA_TOKEN
      ]
    );

    return {
      estado: "OK",
      token,
      expiraEn: guardado.rows[0].expiraEn
    };
  });
};

// ========================================
// Restablecer contraseña con el token
// ========================================
const restablecerPassword = async (
  token,
  passwordNueva
) => {
  // bcrypt fuera de la transacción para no
  // mantener bloqueos mientras se calcula
  const passwordHash =
    await generarPasswordHash(passwordNueva);

  return ejecutarTransaccion(async (cliente) => {
    const encontrado = await cliente.query(
      `SELECT t.usuario_id,
              t.fecha_uso,
              t.fecha_expiracion <= NOW() AS vencido,
              u.activo,
              u.password_hash
       FROM public.password_reset_tokens t
       JOIN public.usuarios_auth u
         ON u.id = t.usuario_id
       WHERE t.token_hash = $1
       FOR UPDATE OF t, u`,
      [hashToken(token)]
    );

    const registro = encontrado.rows[0];

    if (
      !registro ||
      registro.fecha_uso ||
      registro.vencido ||
      !registro.activo
    ) {
      return { estado: "TOKEN_INVALIDO" };
    }

    if (
      registro.password_hash &&
      (await verificarPassword(
        passwordNueva,
        registro.password_hash
      ))
    ) {
      return { estado: "MISMA_CLAVE" };
    }

    // Nueva contraseña + revocar JWT previos
    await cliente.query(
      `UPDATE public.usuarios_auth
       SET password_hash = $1,
           version_sesion = version_sesion + 1
       WHERE id = $2`,
      [passwordHash, registro.usuario_id]
    );

    // Token consumido (un solo uso)
    await cliente.query(
      `UPDATE public.password_reset_tokens
       SET fecha_uso = NOW()
       WHERE usuario_id = $1
         AND fecha_uso IS NULL`,
      [registro.usuario_id]
    );

    // Los códigos de respaldo previos
    // también dejan de servir
    await cliente.query(
      `UPDATE public.codigos_recuperacion
       SET fecha_uso = NOW()
       WHERE usuario_id = $1
         AND fecha_uso IS NULL`,
      [registro.usuario_id]
    );

    return { estado: "OK" };
  });
};

module.exports = {
  generarRecuperacion,
  restablecerPassword
};
