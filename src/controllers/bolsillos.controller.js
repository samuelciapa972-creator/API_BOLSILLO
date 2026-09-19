const {
  matchedData
} = require("express-validator");


const bolsillosService =
  require(
    "../services/bolsillos.service"
  );


const cuentasService =
  require(
    "../services/cuentas.service"
  );


const transaccionesService =
  require(
    "../services/transacciones.service"
  );


const MAXIMO_BOLSILLOS_POR_CUENTA = 10;


// ========================================
// Ciclo de vida de estados
// activo -> archivado (terminal, exige
// saldo en 0)
// ========================================

const transicionesPermitidas = {

  activo: [
    "archivado"
  ],

  archivado: []
};


// ========================================
// GET todos
// ========================================

const obtenerBolsillos = (
  req,
  res
) => {

  const bolsillos =
    bolsillosService
      .obtenerBolsillos();


  res
    .status(200)
    .json(
      bolsillos
    );
};


// ========================================
// GET por ID
// ========================================

const obtenerBolsilloPorId = (
  req,
  res
) => {

  const {
    id
  } = req.params;


  const bolsillo =
    bolsillosService
      .obtenerBolsilloPorId(
        id
      );


  if (
    !bolsillo
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Bolsillo no encontrado"
      });
  }


  res
    .status(200)
    .json(
      bolsillo
    );
};


// ========================================
// POST
// Regla 6: la cuenta debe estar activa
// Regla 10: nombre único, máximo 10 por
// cuenta
// ========================================

const crearBolsillo = (
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


  const cuenta =
    cuentasService
      .obtenerCuentaPorId(
        datosPermitidos.cuentaId
      );


  if (
    !cuenta
  ) {

    return res
      .status(400)
      .json({
        mensaje:
          "La cuenta indicada no existe"
      });
  }


  if (
    cuenta.estado !== "activa"
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "No se pueden crear bolsillos en una cuenta que no está activa"
      });
  }


  const nombreExistente =
    bolsillosService
      .buscarBolsilloPorNombreYCuenta(
        datosPermitidos.nombre,
        datosPermitidos.cuentaId
      );


  if (
    nombreExistente
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "Ya existe un bolsillo con ese nombre en la cuenta"
      });
  }


  const totalBolsillos =
    bolsillosService
      .contarBolsillosPorCuenta(
        datosPermitidos.cuentaId
      );


  if (
    totalBolsillos >=
      MAXIMO_BOLSILLOS_POR_CUENTA
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "La cuenta ya tiene el máximo de 10 bolsillos permitidos"
      });
  }


  const bolsilloCreado =
    bolsillosService
      .crearBolsillo(
        datosPermitidos
      );


  res
    .status(201)
    .json({

      mensaje:
        "Bolsillo creado correctamente",

      bolsillo:
        bolsilloCreado
    });
};


// ========================================
// PUT
// cuentaId no es editable
// ========================================

const actualizarBolsillo = (
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


  const bolsilloActual =
    bolsillosService
      .obtenerBolsilloPorId(
        id
      );


  if (
    !bolsilloActual
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Bolsillo no encontrado"
      });
  }


  const nombreExistente =
    bolsillosService
      .buscarBolsilloPorNombreYCuenta(
        datosPermitidos.nombre,
        bolsilloActual.cuentaId
      );


  if (
    nombreExistente &&
    nombreExistente.id !==
      Number(id)
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "Ya existe un bolsillo con ese nombre en la cuenta"
      });
  }


  const bolsilloActualizado =
    bolsillosService
      .actualizarBolsillo(
        id,
        datosPermitidos
      );


  res
    .status(200)
    .json({

      mensaje:
        "Bolsillo actualizado correctamente",

      bolsillo:
        bolsilloActualizado
    });
};


// ========================================
// DELETE
// Regla 8: no se puede eliminar un
// bolsillo con saldo
// Integridad referencial: tampoco si tiene
// transacciones asociadas (evita huérfanos)
// ========================================

const eliminarBolsillo = (
  req,
  res
) => {

  const {
    id
  } = req.params;


  const bolsilloActual =
    bolsillosService
      .obtenerBolsilloPorId(
        id
      );


  if (
    !bolsilloActual
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Bolsillo no encontrado"
      });
  }


  if (
    bolsilloActual.saldo > 0
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "No se puede eliminar un bolsillo con saldo, primero debe devolverse el dinero"
      });
  }


  const tieneTransacciones =
    transaccionesService
      .bolsilloTieneTransacciones(
        id
      );


  if (
    tieneTransacciones
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "No se puede eliminar el bolsillo porque tiene transacciones asociadas"
      });
  }


  const bolsilloEliminado =
    bolsillosService
      .eliminarBolsillo(
        id
      );


  res
    .status(200)
    .json({

      mensaje:
        "Bolsillo eliminado correctamente",

      bolsillo:
        bolsilloEliminado
    });
};


// ========================================
// POST /:id/apartar
// Regla 3: se valida contra el disponible
// ========================================

const apartarEnBolsillo = (
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


  const bolsilloActual =
    bolsillosService
      .obtenerBolsilloPorId(
        id
      );


  if (
    !bolsilloActual
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Bolsillo no encontrado"
      });
  }


  if (
    bolsilloActual.estado !== "activo"
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "No se puede apartar dinero en un bolsillo archivado"
      });
  }


  const cuenta =
    cuentasService
      .obtenerCuentaPorId(
        bolsilloActual.cuentaId
      );


  if (
    !cuenta ||
    cuenta.estado !== "activa"
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "No se pueden operar bolsillos de una cuenta que no está activa"
      });
  }


  const saldoDisponible =
    cuentasService
      .calcularSaldoDisponible(
        cuenta.id
      );


  if (
    saldoDisponible <
      datosPermitidos.monto
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "El saldo disponible de la cuenta no alcanza para apartar ese monto"
      });
  }


  const bolsilloActualizado =
    bolsillosService
      .apartarEnBolsillo(
        id,
        datosPermitidos.monto
      );


  const transaccionCreada =
    transaccionesService
      .crearTransaccion({

        tipo: "apartado",

        cuentaOrigenId:
          cuenta.id,

        bolsilloId:
          bolsilloActualizado.id,

        monto:
          datosPermitidos.monto,

        descripcion:
          datosPermitidos.descripcion
      });


  res
    .status(201)
    .json({

      mensaje:
        "Dinero apartado correctamente",

      bolsillo:
        bolsilloActualizado,

      transaccion:
        transaccionCreada
    });
};


// ========================================
// POST /:id/devolver
// Regla 9: no se puede devolver más de lo
// que el bolsillo contiene
// ========================================

const devolverDeBolsillo = (
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


  const bolsilloActual =
    bolsillosService
      .obtenerBolsilloPorId(
        id
      );


  if (
    !bolsilloActual
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Bolsillo no encontrado"
      });
  }


  if (
    datosPermitidos.monto >
      bolsilloActual.saldo
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "No se puede devolver más de lo que el bolsillo contiene"
      });
  }


  const cuenta =
    cuentasService
      .obtenerCuentaPorId(
        bolsilloActual.cuentaId
      );


  if (
    !cuenta ||
    cuenta.estado !== "activa"
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "No se pueden operar bolsillos de una cuenta que no está activa"
      });
  }


  const bolsilloActualizado =
    bolsillosService
      .devolverDeBolsillo(
        id,
        datosPermitidos.monto
      );


  const transaccionCreada =
    transaccionesService
      .crearTransaccion({

        tipo: "devolucion",

        cuentaDestinoId:
          cuenta.id,

        bolsilloId:
          bolsilloActualizado.id,

        monto:
          datosPermitidos.monto,

        descripcion:
          datosPermitidos.descripcion
      });


  res
    .status(201)
    .json({

      mensaje:
        "Dinero devuelto correctamente",

      bolsillo:
        bolsilloActualizado,

      transaccion:
        transaccionCreada
    });
};


// ========================================
// PATCH /:id/estado
// Regla: archivado es terminal y exige
// saldo en 0
// ========================================

const actualizarEstadoBolsillo = (
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


  const bolsilloActual =
    bolsillosService
      .obtenerBolsilloPorId(
        id
      );


  if (
    !bolsilloActual
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Bolsillo no encontrado"
      });
  }


  const nuevoEstado =
    datosPermitidos.estado;

  const estadoActual =
    bolsilloActual.estado;

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
          `No se permite cambiar un bolsillo de ${estadoActual} a ${nuevoEstado}`
      });
  }


  if (
    nuevoEstado === "archivado" &&
    bolsilloActual.saldo > 0
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "No se puede archivar un bolsillo con saldo, primero debe devolverse el dinero"
      });
  }


  const bolsilloActualizado =
    bolsillosService
      .actualizarEstadoBolsillo(
        id,
        nuevoEstado
      );


  res
    .status(200)
    .json({

      mensaje:
        "Estado del bolsillo actualizado correctamente",

      bolsillo:
        bolsilloActualizado
    });
};


module.exports = {
  obtenerBolsillos,
  obtenerBolsilloPorId,
  crearBolsillo,
  actualizarBolsillo,
  eliminarBolsillo,
  apartarEnBolsillo,
  devolverDeBolsillo,
  actualizarEstadoBolsillo
};
