const semillaApiKeys = require("../data/apiKeys");

const {
  consultar
} = require("../config/database");

const {
  generarHash
} = require("../utils/crypto.util");

// ========================================
// Buscar cliente mediante API Key
// Nunca se recupera la API Key original
// desde el hash: se calcula el SHA-256 de
// la key recibida y se busca ese hash.
//
// Buscar por hash en lugar de comparar
// texto plano evita filtrar la key por
// tiempos de respuesta: un atacante no
// controla los bytes del hash calculado.
// ========================================
const buscarClientePorApiKey = async (apiKey) => {
  const hashRecibido = generarHash(apiKey);

  const resultado =
    await consultar(
      `SELECT id, cliente, activa
       FROM public.api_keys
       WHERE hash = $1`,
      [hashRecibido]
    );

  return resultado.rows[0] ?? null;
};

// ========================================
// Sincronizar la semilla con la tabla
// Se ejecuta al arrancar (como el
// administrador inicial):
// - cliente nuevo: se inserta con su hash
//   y su estado inicial
// - cliente existente: se actualiza el
//   hash (rotar una key = cambiarla en
//   .env y reiniciar) pero NO "activa",
//   que se administra en la tabla
// ========================================
const sincronizarApiKeys = async () => {
  for (const registro of semillaApiKeys) {
    await consultar(
      `INSERT INTO public.api_keys
         (cliente, hash, activa)
       VALUES ($1, $2, $3)
       ON CONFLICT (cliente)
       DO UPDATE SET hash = EXCLUDED.hash`,
      [
        registro.cliente,
        registro.hash,
        registro.activa
      ]
    );
  }

  // Sin imprimir keys ni hashes
  console.log(
    `API Keys sincronizadas: ${semillaApiKeys.length}`
  );
};

module.exports = {
  buscarClientePorApiKey,
  sincronizarApiKeys
};
