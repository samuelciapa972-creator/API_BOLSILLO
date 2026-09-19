const crypto = require("crypto");

// ========================================
// Comparación segura de valores
// ========================================
const compararSeguro = (valorRecibido, valorEsperado) => {
  const recibido = Buffer.from(valorRecibido);
  const esperado = Buffer.from(valorEsperado);

  // timingSafeEqual exige buffers del mismo tamaño.
  if (recibido.length !== esperado.length) {
    return false;
  }

  return crypto.timingSafeEqual(recibido, esperado);
};

// ========================================
// Middleware de autenticación por API Key
// ========================================
const validarApiKey = (req, res, next) => {
  const apiKeyConfigurada = process.env.API_KEY;

  // Error de configuración del servidor.
  if (!apiKeyConfigurada) {
    console.error(
      "ERROR: La variable de entorno API_KEY no está configurada."
    );

    return res.status(500).json({
      mensaje: "Error de configuración del servidor"
    });
  }

  // Express normaliza los nombres de headers.
  const apiKeyRecibida = req.get("X-API-Key");

  if (!apiKeyRecibida) {
    return res.status(401).json({
      mensaje: "API Key requerida"
    });
  }

  const esValida = compararSeguro(
    apiKeyRecibida,
    apiKeyConfigurada
  );

  if (!esValida) {
    return res.status(401).json({
      mensaje: "API Key inválida"
    });
  }

  next();
};

module.exports = validarApiKey;
