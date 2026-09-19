const cuentas =
  require(
    "../data/cuentas"
  );

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

const obtenerCuentas = () => {
  return cuentas;
};

const obtenerCuentaPorId = (
  id
) => {
  return cuentas.find(
    cuenta =>
      cuenta.id === Number(id)
  );
};

const obtenerCuentasPorUsuario = (
  usuarioId
) => {
  return cuentas.filter(
    cuenta =>
      cuenta.usuarioId ===
      Number(usuarioId)
  );
};

// ========================================
// Función central del dominio
// Ningún débito debe escribirse sin pasar
// por aquí
// ========================================

const calcularSaldoApartado = (
  cuentaId
) => {
  return bolsillos
    .filter(
      bolsillo =>
        bolsillo.cuentaId === Number(cuentaId) &&
        bolsillo.estado === "activo"
    )
    .reduce(
      (total, bolsillo) =>
        total + bolsillo.saldo,
      0
    );
};

const calcularSaldoDisponible = (
  cuentaId
) => {
  const cuenta =
    obtenerCuentaPorId(
      cuentaId
    );

  if (
    !cuenta
  ) {
    return null;
  }

  const saldoApartado =
    calcularSaldoApartado(
      cuentaId
    );

  return cuenta.saldoTotal -
    saldoApartado;
};

const generarNumeroCuenta = (
  id
) => {
  return (
    "300000" +
    String(id).padStart(4, "0")
  );
};

const crearCuenta = (
  datos
) => {
  const nuevoId =
    generarSiguienteId(
      cuentas
    );

  const cuenta = {
    id:
      nuevoId,

    usuarioId:
      datos.usuarioId,

    numeroCuenta:
      generarNumeroCuenta(
        nuevoId
      ),

    saldoTotal: 0,

    moneda: "COP",

    estado: "activa"
  };

  cuentas.push(
    cuenta
  );

  return cuenta;
};

const registrarDeposito = (
  cuentaId,
  monto
) => {
  const cuenta =
    obtenerCuentaPorId(
      cuentaId
    );

  cuenta.saldoTotal =
    redondearMoneda(
      cuenta.saldoTotal +
      monto
    );

  return cuenta;
};

const registrarRetiro = (
  cuentaId,
  monto
) => {
  const cuenta =
    obtenerCuentaPorId(
      cuentaId
    );

  cuenta.saldoTotal =
    redondearMoneda(
      cuenta.saldoTotal -
      monto
    );

  return cuenta;
};

const actualizarEstadoCuenta = (
  id,
  nuevoEstado
) => {
  const cuenta =
    obtenerCuentaPorId(
      id
    );

  if (
    !cuenta
  ) {
    return null;
  }

  cuenta.estado =
    nuevoEstado;

  return cuenta;
};

module.exports = {
  obtenerCuentas,
  obtenerCuentaPorId,
  obtenerCuentasPorUsuario,
  calcularSaldoApartado,
  calcularSaldoDisponible,
  crearCuenta,
  registrarDeposito,
  registrarRetiro,
  actualizarEstadoCuenta
};
