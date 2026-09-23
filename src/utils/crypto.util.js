const crypto = require("crypto");

// ========================================
// Generar hash SHA-256
// ========================================
const generarHash = (valor) => {
  return crypto
    .createHash("sha256")
    .update(valor)
    .digest("hex");
};

// ========================================
// Comparación segura (tiempo constante)
// evita que un atacante infiera el valor
// correcto midiendo tiempos de respuesta
// ========================================
const compararSeguro = (valorA, valorB) => {
  const bufferA = Buffer.from(valorA, "utf8");
  const bufferB = Buffer.from(valorB, "utf8");

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    bufferA,
    bufferB
  );
};

module.exports = {
  generarHash,
  compararSeguro
};