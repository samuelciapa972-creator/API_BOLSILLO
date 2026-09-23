const apiKeys = require("../data/apiKeys");

const {
  generarHash,
  compararSeguro
} = require("../utils/crypto.util");

// ========================================
// Buscar cliente mediante API Key
// Nunca se recupera la API Key original
// desde el hash, solo se compara.
// ========================================
const buscarClientePorApiKey = (apiKey) => {
  const hashRecibido = generarHash(apiKey);

  for (const registro of apiKeys) {
    const coincide = compararSeguro(
      hashRecibido,
      registro.hash
    );

    if (coincide) {
      return registro;
    }
  }

  return null;
};

module.exports = {
  buscarClientePorApiKey
};
