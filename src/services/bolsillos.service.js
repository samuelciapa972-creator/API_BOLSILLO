const bolsillos =
  require(
    "../data/bolsillos"
  );

const {
  generarSiguienteId,
  redondearMoneda
} = require(
  "../utils/comunes"
);

const obtenerBolsillos = () => {
  return bolsillos;
};

const obtenerBolsilloPorId = (
  id
) => {
  return bolsillos.find(
    bolsillo =>
      bolsillo.id === Number(id)
  );
};

const obtenerBolsillosPorCuenta = (
  cuentaId
) => {
  return bolsillos.filter(
    bolsillo =>
      bolsillo.cuentaId ===
      Number(cuentaId)
  );
};

const buscarBolsilloPorNombreYCuenta = (
  nombre,
  cuentaId
) => {
  return bolsillos.find(
    bolsillo =>
      bolsillo.cuentaId === Number(cuentaId) &&
      bolsillo.nombre.toLowerCase() ===
        nombre.toLowerCase()
  );
};

const contarBolsillosPorCuenta = (
  cuentaId
) => {
  return obtenerBolsillosPorCuenta(
    cuentaId
  ).length;
};

const crearBolsillo = (
  datos
) => {
  const nuevoId =
    generarSiguienteId(
      bolsillos
    );

  const bolsillo = {
    id:
      nuevoId,

    cuentaId:
      datos.cuentaId,

    nombre:
      datos.nombre,

    meta:
      datos.meta ?? null,

    saldo: 0,

    fechaCreacion:
      new Date().toISOString(),

    estado: "activo"
  };

  bolsillos.push(
    bolsillo
  );

  return bolsillo;
};

const actualizarBolsillo = (
  id,
  datos
) => {
  const indice =
    bolsillos.findIndex(
      bolsillo =>
        bolsillo.id ===
        Number(id)
    );

  if (
    indice === -1
  ) {
    return null;
  }

  bolsillos[indice] = {
    ...bolsillos[indice],

    nombre:
      datos.nombre,

    // Si no se envía meta, se conserva la actual: el campo es
    // opcional en la validación y no hay forma de enviar "null"
    // explícito, así que ausencia no debe interpretarse como borrado.
    meta:
      datos.meta !== undefined
        ? datos.meta
        : bolsillos[indice].meta
  };

  return bolsillos[indice];
};

const eliminarBolsillo = (
  id
) => {
  const indice =
    bolsillos.findIndex(
      bolsillo =>
        bolsillo.id ===
        Number(id)
    );

  if (
    indice === -1
  ) {
    return null;
  }

  const eliminado =
    bolsillos.splice(
      indice,
      1
    );

  return eliminado[0];
};

const apartarEnBolsillo = (
  id,
  monto
) => {
  const bolsillo =
    obtenerBolsilloPorId(
      id
    );

  bolsillo.saldo =
    redondearMoneda(
      bolsillo.saldo +
      monto
    );

  return bolsillo;
};

const devolverDeBolsillo = (
  id,
  monto
) => {
  const bolsillo =
    obtenerBolsilloPorId(
      id
    );

  bolsillo.saldo =
    redondearMoneda(
      bolsillo.saldo -
      monto
    );

  return bolsillo;
};

const actualizarEstadoBolsillo = (
  id,
  nuevoEstado
) => {
  const bolsillo =
    obtenerBolsilloPorId(
      id
    );

  if (
    !bolsillo
  ) {
    return null;
  }

  bolsillo.estado =
    nuevoEstado;

  return bolsillo;
};

module.exports = {
  obtenerBolsillos,
  obtenerBolsilloPorId,
  obtenerBolsillosPorCuenta,
  buscarBolsilloPorNombreYCuenta,
  contarBolsillosPorCuenta,
  crearBolsillo,
  actualizarBolsillo,
  eliminarBolsillo,
  apartarEnBolsillo,
  devolverDeBolsillo,
  actualizarEstadoBolsillo
};
