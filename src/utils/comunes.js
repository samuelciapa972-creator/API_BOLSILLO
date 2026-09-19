// ========================================
// Generar el siguiente ID autoincremental
// de una colección en memoria
// ========================================

const generarSiguienteId = (
  coleccion
) => {
  return coleccion.length > 0
    ? Math.max(
        ...coleccion.map(
          item =>
            item.id
        )
      ) + 1
    : 1;
};


// ========================================
// Redondear a 2 decimales para evitar que
// sumas/restas repetidas acumulen errores
// de coma flotante en montos de dinero
// ========================================

const redondearMoneda = (
  valor
) => {
  return Math.round(
    valor * 100
  ) / 100;
};


module.exports = {
  generarSiguienteId,
  redondearMoneda
};
