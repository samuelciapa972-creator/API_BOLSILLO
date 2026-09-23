const {
  buscarClientePorApiKey
} = require("../services/apiKeys.service");

// ========================================
// Middleware de autenticación por API Key
// Soporta múltiples clientes: cada API Key
// se resuelve contra su hash almacenado y
// nunca se compara en texto plano.
// ========================================
const validarApiKey = (req, res, next) => {
  // Express normaliza los nombres de headers.
  const apiKeyRecibida = req.get("X-API-Key");

  // ----------------------------------------
  // API Key ausente
  // ----------------------------------------
  if (!apiKeyRecibida) {
    return res.status(401).json({
      mensaje: "API Key requerida"
    });
  }

  // ----------------------------------------
  // Buscar cliente
  // ----------------------------------------
  const cliente = buscarClientePorApiKey(
    apiKeyRecibida
  );

  if (!cliente) {
    return res.status(401).json({
      mensaje: "API Key inválida"
    });
  }

  // ----------------------------------------
  // Verificar estado de la API Key
  // ----------------------------------------
  if (!cliente.activa) {
    return res.status(403).json({
      mensaje: "API Key deshabilitada"
    });
  }

  // ----------------------------------------
  // Asociar cliente autenticado
  // ----------------------------------------
  req.clienteApi = {
    id: cliente.id,
    nombre: cliente.cliente
  };

  next();
};

module.exports = validarApiKey;
