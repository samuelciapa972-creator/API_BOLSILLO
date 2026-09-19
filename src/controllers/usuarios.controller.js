const {
  matchedData
} = require("express-validator");


const usuariosService =
  require(
    "../services/usuarios.service"
  );


const cuentasService =
  require(
    "../services/cuentas.service"
  );


// ========================================
// Validar unicidad de documento y email
// ========================================

const validarDuplicados = (
  datos,
  idExcluir = null
) => {

  const documentoExistente =
    usuariosService
      .buscarUsuarioPorDocumento(
        datos.documento
      );


  if (
    documentoExistente &&
    documentoExistente.id !==
      Number(idExcluir)
  ) {

    return {
      status: 409,
      mensaje:
        "Ya existe un usuario con ese documento"
    };
  }


  const emailExistente =
    usuariosService
      .buscarUsuarioPorEmail(
        datos.email
      );


  if (
    emailExistente &&
    emailExistente.id !==
      Number(idExcluir)
  ) {

    return {
      status: 409,
      mensaje:
        "Ya existe un usuario con ese email"
    };
  }


  return null;
};


// ========================================
// GET todos
// ========================================

const obtenerUsuarios = (
  req,
  res
) => {

  const usuarios =
    usuariosService
      .obtenerUsuarios();


  res
    .status(200)
    .json(
      usuarios
    );
};


// ========================================
// GET por ID
// ========================================

const obtenerUsuarioPorId = (
  req,
  res
) => {

  const {
    id
  } = req.params;


  const usuario =
    usuariosService
      .obtenerUsuarioPorId(
        id
      );


  if (
    !usuario
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Usuario no encontrado"
      });
  }


  res
    .status(200)
    .json(
      usuario
    );
};


// ========================================
// GET /:id/cuentas
// ========================================

const obtenerCuentasDeUsuario = (
  req,
  res
) => {

  const {
    id
  } = req.params;


  const usuario =
    usuariosService
      .obtenerUsuarioPorId(
        id
      );


  if (
    !usuario
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Usuario no encontrado"
      });
  }


  const cuentas =
    cuentasService
      .obtenerCuentasPorUsuario(
        id
      );


  res
    .status(200)
    .json(
      cuentas
    );
};


// ========================================
// POST
// ========================================

const crearUsuario = (
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


  const errorDuplicado =
    validarDuplicados(
      datosPermitidos
    );


  if (
    errorDuplicado
  ) {

    return res
      .status(
        errorDuplicado.status
      )
      .json({
        mensaje:
          errorDuplicado.mensaje
      });
  }


  const usuarioCreado =
    usuariosService
      .crearUsuario(
        datosPermitidos
      );


  res
    .status(201)
    .json({

      mensaje:
        "Usuario creado correctamente",

      usuario:
        usuarioCreado
    });
};


// ========================================
// PUT
// ========================================

const actualizarUsuario = (
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


  const usuarioActual =
    usuariosService
      .obtenerUsuarioPorId(
        id
      );


  if (
    !usuarioActual
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Usuario no encontrado"
      });
  }


  const errorDuplicado =
    validarDuplicados(
      datosPermitidos,
      id
    );


  if (
    errorDuplicado
  ) {

    return res
      .status(
        errorDuplicado.status
      )
      .json({
        mensaje:
          errorDuplicado.mensaje
      });
  }


  const usuarioActualizado =
    usuariosService
      .actualizarUsuario(
        id,
        datosPermitidos
      );


  res
    .status(200)
    .json({

      mensaje:
        "Usuario actualizado correctamente",

      usuario:
        usuarioActualizado
    });
};


// ========================================
// DELETE
// No se puede eliminar un usuario con
// cuentas asociadas
// ========================================

const eliminarUsuario = (
  req,
  res
) => {

  const {
    id
  } = req.params;


  const usuarioActual =
    usuariosService
      .obtenerUsuarioPorId(
        id
      );


  if (
    !usuarioActual
  ) {

    return res
      .status(404)
      .json({
        mensaje:
          "Usuario no encontrado"
      });
  }


  const cuentasDelUsuario =
    cuentasService
      .obtenerCuentasPorUsuario(
        id
      );


  if (
    cuentasDelUsuario.length > 0
  ) {

    return res
      .status(409)
      .json({
        mensaje:
          "No se puede eliminar un usuario con cuentas asociadas"
      });
  }


  const usuarioEliminado =
    usuariosService
      .eliminarUsuario(
        id
      );


  res
    .status(200)
    .json({

      mensaje:
        "Usuario eliminado correctamente",

      usuario:
        usuarioEliminado
    });
};


module.exports = {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  obtenerCuentasDeUsuario,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
};
