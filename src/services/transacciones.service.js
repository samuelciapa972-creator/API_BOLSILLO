const transacciones =
  require(
    "../data/transacciones"
  );

const {
  generarSiguienteId
} = require(
  "../utils/comunes"
);

const obtenerTransacciones = () => {
  return transacciones;
};

const obtenerTransaccionPorId = (
  id
) => {
  return transacciones.find(
    transaccion =>
      transaccion.id === Number(id)
  );
};

const obtenerTransaccionesPorCuenta = (
  cuentaId
) => {
  return transacciones.filter(
    transaccion =>
      transaccion.cuentaOrigenId === Number(cuentaId) ||
      transaccion.cuentaDestinoId === Number(cuentaId)
  );
};

// ========================================
// Integridad referencial
// ========================================

const bolsilloTieneTransacciones = (
  bolsilloId
) => {
  return transacciones.some(
    transaccion =>
      transaccion.bolsilloId === Number(bolsilloId)
  );
};

const crearTransaccion = (
  datos
) => {
  const nuevoId =
    generarSiguienteId(
      transacciones
    );

  const transaccion = {
    id:
      nuevoId,

    tipo:
      datos.tipo,

    cuentaOrigenId:
      datos.cuentaOrigenId ?? null,

    cuentaDestinoId:
      datos.cuentaDestinoId ?? null,

    bolsilloId:
      datos.bolsilloId ?? null,

    monto:
      datos.monto,

    descripcion:
      datos.descripcion ?? null,

    fecha:
      new Date().toISOString(),

    estado: "exitosa"
  };

  transacciones.push(
    transaccion
  );

  return transaccion;
};

module.exports = {
  obtenerTransacciones,
  obtenerTransaccionPorId,
  obtenerTransaccionesPorCuenta,
  bolsilloTieneTransacciones,
  crearTransaccion
};
