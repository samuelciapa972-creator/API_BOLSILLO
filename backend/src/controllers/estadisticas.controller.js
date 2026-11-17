const estadisticasService = require(
  "../services/estadisticas.service"
);

// ========================================
// GET /api/estadisticas/resumen
// ========================================

const obtenerResumen = async (
  req,
  res,
  next
) => {

  try {

    const resumen =
      await estadisticasService
        .obtenerResumen();

    // Agregados financieros: que no queden
    // en cachés intermedias
    res.set(
      "Cache-Control",
      "no-store"
    );

    res
      .status(200)
      .json(
        resumen
      );

  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerResumen
};
