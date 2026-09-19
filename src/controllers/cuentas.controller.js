const {
  matchedData
} = require("express-validator");


const cuentasService =
  require(
    "../services/cuentas.service"
  );


const usuariosService =
  require(
    "../services/usuarios.service"
  );


const transaccionesService =
  require(
    "../services/transacciones.service"
  );


const bolsillosService =
  require(
    "../services/bolsillos.service"
  );


// ========================================
// Ciclo de vida de estados
// activa <-> bloqueada, ambas -> cerrada
// (terminal, exige saldo en 0)
// ========================================

const transicionesPermitidas = {

  activa: [
    "bloqueada",
    "cerrada"
  ],

  bloqueada: [
    "activa",
    "cerrada"
  ],

  cerrada: []
};


// ========================================
// GET todas
// ========================================

const obtenerCuentas = (
  req,
  res
) => {

  const cuentas =
    cuentasService
      .obtenerCuentas();


  res
    .status(200)
    .json(
      cuentas
    );
};


// ========================================
// GET por ID
// ========================================

const obtenerCuentaPorId = (
  req,
  res
) => {

  const {
    id
  } = req.params;


  const cuenta =
    cuentasService
      .obtenerCuentaPorId(
        id
      );


  if (
    !cuenta
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Cuenta no encontrada"
      });
  }


  res
    .status(200)
    .json(
      cuenta
    );
};


// ========================================
// POST
// Regla 1: el usuario debe existir y
// estar activo
// ========================================

const crearCuenta = (
  req,
  res
) => {

  const datosPermitidos =
    matchedData(
      req,
      {
        locations: [
          "body"
        ]
      }
    );


  const usuario =
    usuariosService
      .obtenerUsuarioPorId(
        datosPermitidos.usuarioId
      );


  if (
    !usuario
  ) {

    return res
      .status(400)
      .json({
        mensaje:
          "El usuario indicado no existe"
      });
  }


  if (
    usuario.estado !== "activo"
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "No se puede crear una cuenta para un usuario inactivo"
      });
  }


  const cuentaCreada =
    cuentasService
      .crearCuenta(
        datosPermitidos
      );


  res
    .status(201)
    .json({

      mensaje:
        "Cuenta creada correctamente",

      cuenta:
        cuentaCreada
    });
};


// ========================================
// GET /:id/saldo
// Devuelve total, apartado y disponible
// ========================================

const obtenerSaldoCuenta = (
  req,
  res
) => {

  const {
    id
  } = req.params;


  const cuenta =
    cuentasService
      .obtenerCuentaPorId(
        id
      );


  if (
    !cuenta
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Cuenta no encontrada"
      });
  }


  const saldoApartado =
    cuentasService
      .calcularSaldoApartado(
        id
      );


  const saldoDisponible =
    cuenta.saldoTotal -
    saldoApartado;


  res
    .status(200)
    .json({

      cuentaId:
        cuenta.id,

      saldoTotal:
        cuenta.saldoTotal,

      saldoApartado,

      saldoDisponible,

      moneda:
        cuenta.moneda
    });
};


// ========================================
// GET /:id/transacciones
// ========================================

const obtenerTransaccionesDeCuenta = (
  req,
  res
) => {

  const {
    id
  } = req.params;


  const cuenta =
    cuentasService
      .obtenerCuentaPorId(
        id
      );


  if (
    !cuenta
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Cuenta no encontrada"
      });
  }


  const transacciones =
    transaccionesService
      .obtenerTransaccionesPorCuenta(
        id
      );


  res
    .status(200)
    .json(
      transacciones
    );
};


// ========================================
// GET /:id/bolsillos
// ========================================

const obtenerBolsillosDeCuenta = (
  req,
  res
) => {

  const {
    id
  } = req.params;


  const cuenta =
    cuentasService
      .obtenerCuentaPorId(
        id
      );


  if (
    !cuenta
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Cuenta no encontrada"
      });
  }


  const bolsillos =
    bolsillosService
      .obtenerBolsillosPorCuenta(
        id
      );


  res
    .status(200)
    .json(
      bolsillos
    );
};


// ========================================
// PATCH /:id/estado
// Regla 7: no se puede cerrar una cuenta
// con saldo total mayor que 0
// ========================================

const actualizarEstadoCuenta = (
  req,
  res
) => {

  const {
    id
  } = req.params;


  const datosPermitidos =
    matchedData(
      req,
      {
        locations: [
          "body"
        ]
      }
    );


  const cuentaActual =
    cuentasService
      .obtenerCuentaPorId(
        id
      );


  if (
    !cuentaActual
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Cuenta no encontrada"
      });
  }


  const nuevoEstado =
    datosPermitidos.estado;

  const estadoActual =
    cuentaActual.estado;

  const permitidos =
    transicionesPermitidas[
      estadoActual
    ];


  if (
    !permitidos.includes(
      nuevoEstado
    )
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          `No se permite cambiar una cuenta de ${estadoActual} a ${nuevoEstado}`
      });
  }


  if (
    nuevoEstado === "cerrada" &&
    cuentaActual.saldoTotal > 0
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "No se puede cerrar una cuenta con saldo total mayor que cero"
      });
  }


  const cuentaActualizada =
    cuentasService
      .actualizarEstadoCuenta(
        id,
        nuevoEstado
      );


  res
    .status(200)
    .json({

      mensaje:
        "Estado de la cuenta actualizado correctamente",

      cuenta:
        cuentaActualizada
    });
};


module.exports = {
  obtenerCuentas,
  obtenerCuentaPorId,
  crearCuenta,
  obtenerSaldoCuenta,
  obtenerTransaccionesDeCuenta,
  obtenerBolsillosDeCuenta,
  actualizarEstadoCuenta
};
