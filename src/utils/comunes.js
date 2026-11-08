// ========================================
// Redondear a 2 decimales para evitar que
// sumas/restas repetidas acumulen errores
// de coma flotante en montos de dinero
// (la aritmética que se persiste se hace en
// SQL con NUMERIC; esto solo aplica a
// valores calculados para la respuesta)
// ========================================

const redondearMoneda = (
  valor
) => {
  return Math.round(
    valor * 100
  ) / 100;
};


module.exports = {
  redondearMoneda
};
