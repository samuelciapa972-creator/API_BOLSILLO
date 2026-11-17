const jwt = require("jsonwebtoken");

// ========================================
// Obtener configuración JWT
// El secreto nunca se escribe en el código:
// se lee de JWT_SECRET (.env)
// ========================================
const obtenerConfiguracionJWT = () => {
  const secret = process.env.JWT_SECRET;

  const expiresIn =
    process.env.JWT_EXPIRES_IN || "1h";

  if (!secret) {
    throw new Error(
      "JWT_SECRET no está configurado"
    );
  }

  return {
    secret,
    expiresIn
  };
};

// ========================================
// Generar JWT
// El payload solo lleva lo necesario para
// identificar al usuario: nunca password,
// passwordHash ni otros secretos (el
// payload se puede decodificar)
// ========================================
const generarToken = (usuario) => {
  const {
    secret,
    expiresIn
  } = obtenerConfiguracionJWT();

  // vs = versión de sesión (Bloque 11):
  // al cambiar o restablecer la contraseña
  // aumenta en la base de datos y los JWT
  // emitidos antes dejan de ser válidos
  const payload = {
    email: usuario.email,
    rol: usuario.rol,
    vs: usuario.versionSesion
  };

  return jwt.sign(
    payload,
    secret,
    {
      algorithm: "HS256",
      subject: String(usuario.id),
      expiresIn
    }
  );
};

// ========================================
// Verificar JWT
// Comprueba firma y expiración. Solo se
// acepta HS256: no se confía en el
// algoritmo que indique el token recibido
// ========================================
const verificarToken = (token) => {
  const {
    secret
  } = obtenerConfiguracionJWT();

  return jwt.verify(
    token,
    secret,
    {
      algorithms: ["HS256"]
    }
  );
};

module.exports = {
  generarToken,
  verificarToken
};
