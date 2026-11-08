const {
  Pool,
  types
} = require("pg");

const fs = require("node:fs");
const path = require("node:path");

require("dotenv").config();


// ========================================
// Validar configuración
// La URI (con la contraseña) solo vive en
// .env, nunca en el código ni en el
// frontend.
// ========================================
if (!process.env.DATABASE_URL) {
  throw new Error(
    "Falta DATABASE_URL en el archivo .env"
  );
}

// Los parámetros SSL dentro de la URI
// (sslmode, sslrootcert...) reemplazan la
// configuración ssl de abajo y pueden
// desactivar la verificación del
// certificado. Se rechazan para que solo
// haya una fuente de verdad.
const PARAMETROS_SSL_URI =
  /[?&](sslmode|sslrootcert|sslcert|sslkey)=/i;

if (
  PARAMETROS_SSL_URI.test(
    process.env.DATABASE_URL
  )
) {
  throw new Error(
    "DATABASE_URL no debe incluir parámetros SSL (sslmode, sslrootcert...): " +
    "TLS se configura en src/config/database.js"
  );
}


// ========================================
// Certificado CA de Supabase
// ========================================
const rutaCertificado = path.resolve(
  __dirname,
  "../../certs/prod-ca-2021.crt"
);

if (!fs.existsSync(rutaCertificado)) {
  throw new Error(
    `No se encontró el certificado SSL en: ${rutaCertificado}`
  );
}

const certificado = fs.readFileSync(
  rutaCertificado,
  "utf8"
);


// ========================================
// Conversión de tipos
// pg devuelve BIGINT y NUMERIC como texto
// para no perder precisión. Se convierten
// a Number para conservar el contrato JSON
// de la API (ids y montos numéricos) y las
// comparaciones con ===.
//
// Es seguro en este dominio: los ids están
// muy por debajo de 2^53 y NUMERIC(14,2)
// cabe en un double sin perder centavos.
// La aritmética de dinero se hace en SQL
// (NUMERIC), no en JavaScript.
// ========================================
const OID_BIGINT = 20;
const OID_NUMERIC = 1700;

types.setTypeParser(
  OID_BIGINT,
  (valor) => Number.parseInt(valor, 10)
);

types.setTypeParser(
  OID_NUMERIC,
  (valor) => Number.parseFloat(valor)
);


// ========================================
// Pool de conexiones con TLS verificado
// rejectUnauthorized: true exige que el
// servidor presente un certificado firmado
// por la CA de confianza.
// ========================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: {
    ca: certificado,
    rejectUnauthorized: true
  },

  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on("error", (error) => {
  // Solo el mensaje: nunca la URI ni las
  // credenciales
  console.error(
    "Error en conexión PostgreSQL inactiva:",
    error.message
  );
});


// ========================================
// Consulta parametrizada
// Los valores van siempre en `parametros`
// ($1, $2...), nunca concatenados en el SQL
// ========================================
const consultar = (sql, parametros = []) => {
  return pool.query(sql, parametros);
};


// ========================================
// Transacción SQL
// Ejecuta `operacion(cliente)` entre BEGIN y
// COMMIT con una misma conexión. Si algo
// falla, ROLLBACK: o se aplican todos los
// cambios o ninguno (p. ej. debitar una
// cuenta y registrar la transacción).
// ========================================
const ejecutarTransaccion = async (
  operacion
) => {
  const cliente =
    await pool.connect();

  let conexionRota = false;

  try {
    await cliente.query("BEGIN");

    const resultado =
      await operacion(cliente);

    await cliente.query("COMMIT");

    return resultado;
  } catch (error) {
    try {
      await cliente.query("ROLLBACK");
    } catch {
      // Si ni el ROLLBACK responde, la
      // conexión no se devuelve al pool
      conexionRota = true;
    }

    // Se propaga el error original, no el
    // del ROLLBACK
    throw error;
  } finally {
    cliente.release(conexionRota);
  }
};

// ========================================
// Cerrar el pool
// Para procesos independientes (scripts):
// sin esto Node.js no termina mientras haya
// conexiones abiertas
// ========================================
const cerrarPool = () => {
  return pool.end();
};

module.exports = {
  pool,
  consultar,
  ejecutarTransaccion,
  cerrarPool
};
