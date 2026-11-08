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


const {
  redondearMoneda
} = require(
  "../utils/comunes"
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

const obtenerCuentas = async (
  req,
  res,
  next
) => {

  try {

    const cuentas =
      await cuentasService
        .obtenerCuentas();


    res
      .status(200)
      .json(
        cuentas
      );

  } catch (error) {
    next(error);
  }
};


// ========================================
// GET /mis-cuentas
// Solo cliente. La identidad sale del JWT,
// no de un ID en la URL: no hay nada que
// manipular.
// ========================================

const obtenerMisCuentas = async (
  req,
  res,
  next
) => {

  try {

    const titular =
      await usuariosService
        .obtenerUsuarioPorUsuarioAuthId(
          req.usuario.id
        );


    if (
      !titular
    ) {

      return res
        .status(403)
        .json({
          mensaje:
            "El usuario no tiene un titular de billetera asociado"
        });
    }


    const cuentas =
      await cuentasService
        .obtenerCuentasPorUsuario(
          titular.id
        );


    res
      .status(200)
      .json(
        cuentas
      );

  } catch (error) {
    next(error);
  }
};


// ========================================
// GET por ID
// ========================================

const obtenerCuentaPorId = async (
  req,
  res,
  next
) => {

  try {

    const {
      id
    } = req.params;


    const cuenta =
      await cuentasService
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

  } catch (error) {
    next(error);
  }
};


// ========================================
// POST
// Regla 1: el usuario debe existir y
// estar activo
// ========================================

const crearCuenta = async (
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


    const usuario =
      await usuariosService
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
      await cuentasService
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

  } catch (error) {
    next(error);
  }
};


// ========================================
// GET /:id/saldo
// Devuelve total, apartado y disponible
// ========================================

const obtenerSaldoCuenta = async (
  req,
  res,
  next
) => {

  try {

    const {
      id
    } = req.params;


    const cuenta =
      await cuentasService
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
      await cuentasService
        .calcularSaldoApartado(
          id
        );


    const saldoDisponible =
      redondearMoneda(
        cuenta.saldoTotal -
        saldoApartado
      );


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

  } catch (error) {
    next(error);
  }
};


// ========================================
// GET /:id/transacciones
// ========================================

const obtenerTransaccionesDeCuenta = async (
  req,
  res,
  next
) => {

  try {

    const {
      id
    } = req.params;


    const cuenta =
      await cuentasService
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
      await transaccionesService
        .obtenerTransaccionesPorCuenta(
          id
        );


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
// GET /:id/bolsillos
// ========================================

const obtenerBolsillosDeCuenta = async (
  req,
  res,
  next
) => {

  try {

    const {
      id
    } = req.params;


    const cuenta =
      await cuentasService
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
      await bolsillosService
        .obtenerBolsillosPorCuenta(
          id
        );


    res
      .status(200)
      .json(
        bolsillos
      );

  } catch (error) {
    next(error);
  }
};


// ========================================
// PATCH /:id/estado
// Regla 7: no se puede cerrar una cuenta
// con saldo total mayor que 0
// ========================================

const actualizarEstadoCuenta = async (
  req,
  res,
  next
) => {

  try {

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
      await cuentasService
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
      await cuentasService
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

  } catch (error) {
    next(error);
  }
};


module.exports = {
  obtenerCuentas,
  obtenerMisCuentas,
  obtenerCuentaPorId,
  crearCuenta,
  obtenerSaldoCuenta,
  obtenerTransaccionesDeCuenta,
  obtenerBolsillosDeCuenta,
  actualizarEstadoCuenta
};
