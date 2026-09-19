const {
  matchedData
} = require("express-validator");


const transaccionesService =
  require(
    "../services/transacciones.service"
  );


const cuentasService =
  require(
    "../services/cuentas.service"
  );


// ========================================
// GET todas
// ========================================

const obtenerTransacciones = (
  req,
  res
) => {

  const transacciones =
    transaccionesService
      .obtenerTransacciones();


  res
    .status(200)
    .json(
      transacciones
    );
};


// ========================================
// GET por ID
// ========================================

const obtenerTransaccionPorId = (
  req,
  res
) => {

  const {
    id
  } = req.params;


  const transaccion =
    transaccionesService
      .obtenerTransaccionPorId(
        id
      );


  if (
    !transaccion
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Transacción no encontrada"
      });
  }


  res
    .status(200)
    .json(
      transaccion
    );
};


// ========================================
// POST /deposito
// ========================================

const crearDeposito = (
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


  const cuentaDestino =
    cuentasService
      .obtenerCuentaPorId(
        datosPermitidos.cuentaDestinoId
      );


  if (
    !cuentaDestino
  ) {

    return res
      .status(400)
      .json({
        mensaje:
          "La cuenta destino no existe"
      });
  }


  if (
    cuentaDestino.estado !== "activa"
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "La cuenta destino no está activa"
      });
  }


  cuentasService
    .registrarDeposito(
      cuentaDestino.id,
      datosPermitidos.monto
    );


  const transaccionCreada =
    transaccionesService
      .crearTransaccion({

        tipo: "deposito",

        cuentaDestinoId:
          cuentaDestino.id,

        monto:
          datosPermitidos.monto,

        descripcion:
          datosPermitidos.descripcion
      });


  res
    .status(201)
    .json({

      mensaje:
        "Depósito registrado correctamente",

      transaccion:
        transaccionCreada
    });
};


// ========================================
// POST /retiro
// Regla 3: se valida contra el disponible,
// nunca contra el total
// ========================================

const crearRetiro = (
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


  const cuentaOrigen =
    cuentasService
      .obtenerCuentaPorId(
        datosPermitidos.cuentaOrigenId
      );


  if (
    !cuentaOrigen
  ) {

    return res
      .status(400)
      .json({
        mensaje:
          "La cuenta origen no existe"
      });
  }


  if (
    cuentaOrigen.estado !== "activa"
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "La cuenta origen no está activa"
      });
  }


  const saldoDisponible =
    cuentasService
      .calcularSaldoDisponible(
        cuentaOrigen.id
      );


  if (
    saldoDisponible <
      datosPermitidos.monto
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "El saldo disponible de la cuenta no alcanza para el retiro"
      });
  }


  cuentasService
    .registrarRetiro(
      cuentaOrigen.id,
      datosPermitidos.monto
    );


  const transaccionCreada =
    transaccionesService
      .crearTransaccion({

        tipo: "retiro",

        cuentaOrigenId:
          cuentaOrigen.id,

        monto:
          datosPermitidos.monto,

        descripcion:
          datosPermitidos.descripcion
      });


  res
    .status(201)
    .json({

      mensaje:
        "Retiro registrado correctamente",

      transaccion:
        transaccionCreada
    });
};


// ========================================
// POST /transferencia
// Regla 4: ambas cuentas deben existir,
// ser distintas y estar activas
// ========================================

const crearTransferencia = (
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


  const cuentaOrigen =
    cuentasService
      .obtenerCuentaPorId(
        datosPermitidos.cuentaOrigenId
      );


  if (
    !cuentaOrigen
  ) {

    return res
      .status(400)
      .json({
        mensaje:
          "La cuenta origen no existe"
      });
  }


  const cuentaDestino =
    cuentasService
      .obtenerCuentaPorId(
        datosPermitidos.cuentaDestinoId
      );


  if (
    !cuentaDestino
  ) {

    return res
      .status(400)
      .json({
        mensaje:
          "La cuenta destino no existe"
      });
  }


  if (
    datosPermitidos.cuentaOrigenId ===
      datosPermitidos.cuentaDestinoId
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "La cuenta origen y la cuenta destino deben ser distintas"
      });
  }


  if (
    cuentaOrigen.estado !== "activa" ||
    cuentaDestino.estado !== "activa"
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "Ambas cuentas deben estar activas"
      });
  }


  const saldoDisponible =
    cuentasService
      .calcularSaldoDisponible(
        cuentaOrigen.id
      );


  if (
    saldoDisponible <
      datosPermitidos.monto
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "El saldo disponible de la cuenta origen no alcanza para la transferencia"
      });
  }


  cuentasService
    .registrarRetiro(
      cuentaOrigen.id,
      datosPermitidos.monto
    );

  cuentasService
    .registrarDeposito(
      cuentaDestino.id,
      datosPermitidos.monto
    );


  const transaccionCreada =
    transaccionesService
      .crearTransaccion({

        tipo: "transferencia",

        cuentaOrigenId:
          cuentaOrigen.id,

        cuentaDestinoId:
          cuentaDestino.id,

        monto:
          datosPermitidos.monto,

        descripcion:
          datosPermitidos.descripcion
      });


  res
    .status(201)
    .json({

      mensaje:
        "Transferencia registrada correctamente",

      transaccion:
        transaccionCreada
    });
};


module.exports = {
  obtenerTransacciones,
  obtenerTransaccionPorId,
  crearDeposito,
  crearRetiro,
  crearTransferencia
};
