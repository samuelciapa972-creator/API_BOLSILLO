const rutaNoEncontrada = (
  req,
  res
) => {
  res.status(404).json({
    mensaje:
      "Ruta no encontrada"
  });
};

// ========================================
// Errores de PostgreSQL (SQLSTATE)
// Son la segunda línea de defensa: llegan
// aquí cuando una restricción de la base de
// datos detiene algo que las validaciones
// previas no frenaron (p. ej. dos
// solicitudes simultáneas). Se responde con
// un mensaje genérico: nunca el detalle SQL,
// la tabla ni los valores.
// ========================================
const ERRORES_POSTGRES = {
  // unique_violation
  "23505": {
    status: 409,
    mensaje: "El registro ya existe"
  },

  // foreign_key_violation
  "23503": {
    status: 409,
    mensaje: "La operación viola una relación entre registros"
  },

  // check_violation
  "23514": {
    status: 409,
    mensaje: "La operación incumple una regla de negocio"
  },

  // not_null_violation
  "23502": {
    status: 400,
    mensaje: "Falta un dato obligatorio"
  },

  // restrict_violation (transacciones
  // inmutables)
  "23001": {
    status: 409,
    mensaje: "La operación no está permitida sobre este registro"
  },

  // string_data_right_truncation
  "22001": {
    status: 400,
    mensaje: "Un dato supera la longitud permitida"
  }
};

const manejarError = (
  error,
  req,
  res,
  next
) => {
  const errorPostgres =
    ERRORES_POSTGRES[error.code];

  if (errorPostgres) {
    // Solo código y restricción: el detail
    // de PostgreSQL incluye valores (emails,
    // documentos) que no deben quedar en los
    // logs
    console.error(
      "Restricción PostgreSQL:",
      error.code,
      error.constraint ?? ""
    );

    return res
      .status(errorPostgres.status)
      .json({
        mensaje: errorPostgres.mensaje
      });
  }

  console.error(error);

  const status =
    error.status ||
    error.statusCode ||
    500;

  const mensaje =
    status >= 500 || !error.message
      ? "Error interno del servidor"
      : error.message;

  res.status(status).json({
    mensaje
  });
};

module.exports = {
  rutaNoEncontrada,
  manejarError
};
