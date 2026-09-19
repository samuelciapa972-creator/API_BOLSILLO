const rutaNoEncontrada = (
  req,
  res
) => {
  res.status(404).json({
    mensaje:
      "Ruta no encontrada"
  });
};

const manejarError = (
  error,
  req,
  res,
  next
) => {
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