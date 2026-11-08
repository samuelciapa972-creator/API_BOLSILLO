const {
  matchedData
} = require("express-validator");


const transaccionesService =
  require(
    "../services/transacciones.service"
  );


// ========================================
// GET todas
// ========================================

const obtenerTransacciones = async (
  req,
  res,
  next
) => {

  try {

    const transacciones =
      await transaccionesService
        .obtenerTransacciones();


    res
      .status(200)
      .json(
        transacciones
      );

  } catch (error) {
    next(error);
  }
};


// ========================================
// GET por ID
// ========================================

const obtenerTransaccionPorId = async (
  req,
  res,
  next
) => {

  try {

    const {
      id
    } = req.params;


    const transaccion =
      await transaccionesService
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

  } catch (error) {
    next(error);
  }
};


// ========================================
// POST /deposito
// Las reglas de negocio (cuenta existe y
// está activa) se validan dentro de la
// transacción SQL del service: un error
// de negocio llega como ErrorNegocio al
// middleware global.
// ========================================

const crearDeposito = async (
  req,
  res,
  next
) => {

  try {

    const datosPermitidos =
      matchedData(
        req,
        {
          locations: [
            "body"
          ]
        }
      );


    const transaccionCreada =
      await transaccionesService
        .realizarDeposito(
          datosPermitidos
        );


    res
      .status(201)
      .json({

        mensaje:
          "Depósito registrado correctamente",

        transaccion:
          transaccionCreada
      });

  } catch (error) {
    next(error);
  }
};


// ========================================
// POST /retiro
// Regla 3: se valida contra el disponible,
// nunca contra el total (en el service,
// con la cuenta bloqueada)
// ========================================

const crearRetiro = async (
  req,
  res,
  next
) => {

  try {

    const datosPermitidos =
      matchedData(
        req,
        {
          locations: [
            "body"
          ]
        }
      );


    const transaccionCreada =
      await transaccionesService
        .realizarRetiro(
          datosPermitidos
        );


    res
      .status(201)
      .json({

        mensaje:
          "Retiro registrado correctamente",

        transaccion:
          transaccionCreada
      });

  } catch (error) {
    next(error);
  }
};


// ========================================
// POST /transferencia
// Regla 4: ambas cuentas deben existir,
// ser distintas y estar activas (en el
// service, con ambas cuentas bloqueadas)
// ========================================

const crearTransferencia = async (
  req,
  res,
  next
) => {

  try {

    const datosPermitidos =
      matchedData(
        req,
        {
          locations: [
            "body"
          ]
        }
      );


    const transaccionCreada =
      await transaccionesService
        .realizarTransferencia(
          datosPermitidos
        );


    res
      .status(201)
      .json({

        mensaje:
          "Transferencia registrada correctamente",

        transaccion:
          transaccionCreada
      });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  obtenerTransacciones,
  obtenerTransaccionPorId,
  crearDeposito,
  crearRetiro,
  crearTransferencia
};
