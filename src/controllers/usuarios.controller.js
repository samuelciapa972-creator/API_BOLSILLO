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


const authService =
  require(
    "../services/auth.service"
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
// Validar asociación con usuario de login
// ¿existe?, ¿es cliente? y relación 1:1
// (un login no puede ser dueño de dos
// titulares)
// ========================================

const validarAsociacionLogin = async (
  usuarioAuthId,
  idExcluir = null
) => {

  if (
    !usuarioAuthId
  ) {
    return null;
  }


  const usuarioAuth =
    await authService
      .obtenerUsuarioPorId(
        usuarioAuthId
      );


  if (
    !usuarioAuth
  ) {

    return {
      status: 400,
      mensaje:
        "El usuario de acceso asociado no existe"
    };
  }


  if (
    usuarioAuth.rol !== "cliente"
  ) {

    return {
      status: 409,
      mensaje:
        "El usuario de acceso asociado no tiene rol cliente"
    };
  }


  const titularAsociado =
    usuariosService
      .obtenerUsuarioPorUsuarioAuthId(
        usuarioAuthId
      );


  if (
    titularAsociado &&
    titularAsociado.id !==
      Number(idExcluir)
  ) {

    return {
      status: 409,
      mensaje:
        "El usuario de acceso ya está asociado a otro titular"
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

const crearUsuario = async (
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


    const errorAsociacion =
      await validarAsociacionLogin(
        datosPermitidos.usuarioAuthId
      );


    if (
      errorAsociacion
    ) {

      return res
        .status(
          errorAsociacion.status
        )
        .json({
          mensaje:
            errorAsociacion.mensaje
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

  } catch (error) {
    next(error);
  }
};


// ========================================
// PUT
// ========================================

const actualizarUsuario = async (
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


    const errorAsociacion =
      await validarAsociacionLogin(
        datosPermitidos.usuarioAuthId,
        id
      );


    if (
      errorAsociacion
    ) {

      return res
        .status(
          errorAsociacion.status
        )
        .json({
          mensaje:
            errorAsociacion.mensaje
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

  } catch (error) {
    next(error);
  }
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
