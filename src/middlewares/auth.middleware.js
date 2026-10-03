const {
  verificarToken
} = require("../utils/jwt.util");

// ========================================
// Autenticar mediante JWT
// Espera: Authorization: Bearer <token>
// Si es válido, asocia el usuario a
// req.usuario (la aplicación sigue en
// req.clienteApi, puesta por la API Key)
// ========================================
const autenticarJWT = (req, res, next) => {
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

  try {
    // --------------------------------------
    // Verificar firma y expiración
    // --------------------------------------
    const payload =
      verificarToken(token);

    // --------------------------------------
    // Asociar usuario a la petición
    // --------------------------------------
    req.usuario = {
      id: Number(payload.sub),
      email: payload.email,
      rol: payload.rol
    };

    next();
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
};

module.exports = autenticarJWT;
