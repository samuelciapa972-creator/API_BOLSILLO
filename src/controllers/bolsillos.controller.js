const {
  matchedData
} = require("express-validator");


const bolsillosService =
  require(
    "../services/bolsillos.service"
  );


const transaccionesService =
  require(
    "../services/transacciones.service"
  );


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

const obtenerBolsillos = async (
  req,
  res,
  next
) => {

  try {

    const bolsillos =
      await bolsillosService
        .obtenerBolsillos();


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
// GET por ID
// ========================================

const obtenerBolsilloPorId = async (
  req,
  res,
  next
) => {

  try {

    const {
      id
    } = req.params;


    const bolsillo =
      await bolsillosService
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

  } catch (error) {
    next(error);
  }
};


// ========================================
// POST
// Regla 6: la cuenta debe estar activa
// Regla 10: nombre único, máximo 10 por
// cuenta (en el service, con la cuenta
// bloqueada)
// ========================================

const crearBolsillo = async (
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


    const bolsilloCreado =
      await bolsillosService
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

  } catch (error) {
    next(error);
  }
};


// ========================================
// PUT
// cuentaId no es editable
// ========================================

const actualizarBolsillo = async (
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


    const bolsilloActual =
      await bolsillosService
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
      await bolsillosService
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
      await bolsillosService
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

  } catch (error) {
    next(error);
  }
};


// ========================================
// DELETE
// Regla 8: no se puede eliminar un
// bolsillo con saldo
// Integridad referencial: tampoco si tiene
// transacciones asociadas (la FK lo impide
// igualmente)
// ========================================

const eliminarBolsillo = async (
  req,
  res,
  next
) => {

  try {

    const {
      id
    } = req.params;


    const bolsilloActual =
      await bolsillosService
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
      await transaccionesService
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
      await bolsillosService
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

  } catch (error) {
    next(error);
  }
};


// ========================================
// POST /:id/apartar
// Regla 3: se valida contra el disponible
// (en el service, con la cuenta bloqueada)
// ========================================

const apartarEnBolsillo = async (
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


    const {
      bolsillo,
      transaccion
    } = await bolsillosService
      .apartarEnBolsillo(
        id,
        datosPermitidos
      );


    res
      .status(201)
      .json({

        mensaje:
          "Dinero apartado correctamente",

        bolsillo,

        transaccion
      });

  } catch (error) {
    next(error);
  }
};


// ========================================
// POST /:id/devolver
// Regla 9: no se puede devolver más de lo
// que el bolsillo contiene
// ========================================

const devolverDeBolsillo = async (
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


    const {
      bolsillo,
      transaccion
    } = await bolsillosService
      .devolverDeBolsillo(
        id,
        datosPermitidos
      );


    res
      .status(201)
      .json({

        mensaje:
          "Dinero devuelto correctamente",

        bolsillo,

        transaccion
      });

  } catch (error) {
    next(error);
  }
};


// ========================================
// PATCH /:id/estado
// Regla: archivado es terminal y exige
// saldo en 0 (el CHECK de la base de datos
// lo garantiza aunque se aparte dinero
// entre la validación y el UPDATE)
// ========================================

const actualizarEstadoBolsillo = async (
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


    const bolsilloActual =
      await bolsillosService
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
      await bolsillosService
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

  } catch (error) {
    next(error);
  }
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
