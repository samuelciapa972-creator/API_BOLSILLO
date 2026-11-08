const {
  verificarToken
} = require("../utils/jwt.util");

const authService =
  require("../services/auth.service");

// ========================================
// Autenticar mediante JWT
// Espera: Authorization: Bearer <token>
// Si es válido, asocia el usuario a
// req.usuario (la aplicación sigue en
// req.clienteApi, puesta por la API Key)
// ========================================
const autenticarJWT = async (req, res, next) => {
  const authorization =
    req.get("Authorization");

  // ----------------------------------------
  // Header ausente
  // ----------------------------------------
  if (!authorization) {
    return res.status(401).json({
      mensaje:
        "Token de autenticación requerido"
    });
  }

  // ----------------------------------------
  // Validar formato Bearer
  // ----------------------------------------
  const partes =
    authorization.split(" ");

  if (
    partes.length !== 2 ||
    partes[0] !== "Bearer" ||
    !partes[1]
  ) {
    return res.status(401).json({
      mensaje:
        "Formato de token inválido"
    });
  }

  const token = partes[1];

  let payload;

  try {
    // --------------------------------------
    // Verificar firma y expiración
    // --------------------------------------
    payload =
      verificarToken(token);
  } catch (error) {
    if (
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        mensaje: "Token expirado"
      });
    }

    return res.status(401).json({
      mensaje: "Token inválido"
    });
  }

  // sub debe ser un ID numérico (así lo
  // emite generarToken)
  if (!/^[1-9][0-9]{0,15}$/.test(payload.sub ?? "")) {
    return res.status(401).json({
      mensaje: "Token inválido"
    });
  }

  try {
    // --------------------------------------
    // Vigencia del usuario en la base de
    // datos: un token firmado no sirve si
    // el usuario fue eliminado o
    // deshabilitado después de emitirlo
    // --------------------------------------
    const usuario =
      await authService
        .obtenerUsuarioPorId(
          payload.sub
        );

    if (!usuario) {
      return res.status(401).json({
        mensaje: "Token inválido"
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        mensaje: "Usuario deshabilitado"
      });
    }

    // --------------------------------------
    // Asociar usuario a la petición
    // El rol se toma de la base de datos:
    // si cambió, manda el valor actual y no
    // el que quedó dentro del token
    // --------------------------------------
    req.usuario = {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = autenticarJWT;
