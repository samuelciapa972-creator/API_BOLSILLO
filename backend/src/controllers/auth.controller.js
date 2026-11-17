const {
  matchedData
} = require("express-validator");


const authService =
  require(
    "../services/auth.service"
  );


const passwordResetService =
  require(
    "../services/passwordReset.service"
  );


const codigosService =
  require(
    "../services/codigosRecuperacion.service"
  );


const {
  generarToken
} = require(
  "../utils/jwt.util"
);


// ========================================
// Registro
// ========================================

const registrar = async (
  req,
  res,
  next
) => {

  try {

    // Solo los campos declarados en el
    // validator (evita mass assignment)
    const datos =
      matchedData(
        req,
        {
          locations: [
            "body"
          ]
        }
      );


    // ------------------------------------
    // Verificar email duplicado
    // ------------------------------------
    const usuarioExistente =
      await authService
        .obtenerUsuarioPorEmail(
          datos.email
        );


    if (
      usuarioExistente
    ) {

      return res
        .status(409)
        .json({
          mensaje:
            "Ya existe un usuario con ese correo electrónico"
        });
    }


    // ------------------------------------
    // Crear usuario
    // ------------------------------------
    const usuario =
      await authService
        .crearUsuario(
          datos
        );


    // ------------------------------------
    // Respuesta segura: nunca se devuelve
    // password ni passwordHash
    // ------------------------------------
    return res
      .status(201)
      .json({

        mensaje:
          "Usuario registrado correctamente",

        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          activo: usuario.activo
        }
      });

  } catch (error) {
    next(error);
  }
};


// ========================================
// Login
// ========================================

const login = async (
  req,
  res,
  next
) => {

  try {

    const datos =
      matchedData(
        req,
        {
          locations: [
            "body"
          ]
        }
      );


    const usuario =
      await authService
        .verificarCredenciales(
          datos.email,
          datos.password
        );


    // ------------------------------------
    // Credenciales incorrectas
    // Mismo mensaje para email inexistente
    // y contraseña errónea
    // ------------------------------------
    if (
      !usuario
    ) {

      return res
        .status(401)
        .json({
          mensaje:
            "Credenciales inválidas"
        });
    }


    // ------------------------------------
    // Usuario deshabilitado
    // ------------------------------------
    if (
      !usuario.activo
    ) {

      return res
        .status(403)
        .json({
          mensaje:
            "Usuario deshabilitado"
        });
    }


    // ------------------------------------
    // Generar JWT
    // ------------------------------------
    const token =
      generarToken(
        usuario
      );


    // ------------------------------------
    // Login correcto
    // ------------------------------------
    return res
      .status(200)
      .json({

        mensaje:
          "Autenticación correcta",

        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol
        },

        token
      });

  } catch (error) {
    next(error);
  }
};


// ========================================
// Crear usuario privilegiado
// Solo administrador (ver auth.routes.js)
// ========================================

const crearUsuarioAdministrativo = async (
  req,
  res,
  next
) => {

  try {

    // Solo nombre, email, password y rol
    const datos =
      matchedData(
        req,
        {
          locations: [
            "body"
          ]
        }
      );


    // ------------------------------------
    // Verificar email duplicado
    // ------------------------------------
    const usuarioExistente =
      await authService
        .obtenerUsuarioPorEmail(
          datos.email
        );


    if (
      usuarioExistente
    ) {

      return res
        .status(409)
        .json({
          mensaje:
            "Ya existe un usuario con ese correo electrónico"
        });
    }


    // ------------------------------------
    // Crear usuario
    // ------------------------------------
    const usuario =
      await authService
        .crearUsuarioAdministrativo(
          datos
        );


    // ------------------------------------
    // Respuesta segura
    // ------------------------------------
    return res
      .status(201)
      .json({

        mensaje:
          "Usuario creado correctamente",

        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          activo: usuario.activo
        }
      });

  } catch (error) {
    next(error);
  }
};


// ========================================
// Bloque 11 - Cambiar contraseña propia
// ========================================

const cambiarPassword = async (
  req,
  res,
  next
) => {

  try {

    const datos =
      matchedData(req, { locations: ["body"] });

    const resultado =
      await authService.cambiarPasswordPropio(
        req.usuario.id,
        datos.passwordActual,
        datos.passwordNueva
      );

    if (
      resultado.estado === "CLAVE_INCORRECTA" ||
      resultado.estado === "NO_AUTORIZADO"
    ) {
      return res.status(401).json({
        mensaje: "Contraseña actual inválida"
      });
    }

    if (resultado.estado === "MISMA_CLAVE") {
      return res.status(400).json({
        mensaje: "La nueva contraseña debe ser diferente"
      });
    }

    if (resultado.estado === "CONFLICTO") {
      return res.status(409).json({
        mensaje:
          "La contraseña cambió durante la operación; inténtelo nuevamente"
      });
    }

    return res.status(200).json({
      mensaje:
        "Contraseña actualizada. Inicie sesión nuevamente."
    });

  } catch (error) {
    next(error);
  }
};


// ========================================
// Bloque 11 - Recuperación administrativa
// ========================================

const generarRecuperacionAdmin = async (
  req,
  res,
  next
) => {

  try {

    const { usuarioId } =
      matchedData(req, { locations: ["params"] });

    const resultado =
      await passwordResetService.generarRecuperacion(
        usuarioId,
        req.usuario.id
      );

    if (resultado.estado === "NO_ENCONTRADO") {
      return res.status(404).json({
        mensaje: "Usuario no encontrado o inactivo"
      });
    }

    // El token no debe quedar en cachés
    res.set("Cache-Control", "no-store");

    return res.status(201).json({
      mensaje:
        "Token generado. Entréguelo únicamente al titular verificado.",
      token: resultado.token,
      expiraEn: resultado.expiraEn
    });

  } catch (error) {
    next(error);
  }
};


const restablecerPassword = async (
  req,
  res,
  next
) => {

  try {

    const { token, passwordNueva } =
      matchedData(req, { locations: ["body"] });

    const resultado =
      await passwordResetService.restablecerPassword(
        token,
        passwordNueva
      );

    if (resultado.estado === "TOKEN_INVALIDO") {
      return res.status(400).json({
        mensaje: "Token inválido, utilizado o expirado"
      });
    }

    if (resultado.estado === "MISMA_CLAVE") {
      return res.status(400).json({
        mensaje: "La nueva contraseña debe ser diferente"
      });
    }

    return res.status(200).json({
      mensaje:
        "Contraseña restablecida. Inicie sesión nuevamente."
    });

  } catch (error) {
    next(error);
  }
};


// ========================================
// Bloque 11 - Códigos de recuperación
// ========================================

const generarCodigos = async (
  req,
  res,
  next
) => {

  try {

    const { passwordActual } =
      matchedData(req, { locations: ["body"] });

    const resultado =
      await codigosService.generar(
        req.usuario.id,
        passwordActual
      );

    if (resultado.estado !== "OK") {
      return res.status(401).json({
        mensaje: "Reautenticación incorrecta"
      });
    }

    res.set("Cache-Control", "no-store");

    return res.status(201).json({
      mensaje:
        "Guarde estos códigos. No se mostrarán nuevamente.",
      codigos: resultado.codigos
    });

  } catch (error) {
    next(error);
  }
};


const estadoCodigos = async (
  req,
  res,
  next
) => {

  try {

    return res.status(200).json({
      disponibles:
        await codigosService.estado(req.usuario.id)
    });

  } catch (error) {
    next(error);
  }
};


const restablecerConCodigo = async (
  req,
  res,
  next
) => {

  try {

    const { email, codigo, passwordNueva } =
      matchedData(req, { locations: ["body"] });

    const resultado =
      await codigosService.restablecer(
        email,
        codigo,
        passwordNueva
      );

    if (resultado.estado === "MISMA_CLAVE") {
      return res.status(400).json({
        mensaje: "La nueva contraseña debe ser diferente"
      });
    }

    if (resultado.estado !== "OK") {
      return res.status(400).json({
        mensaje: "Código o cuenta inválidos"
      });
    }

    return res.status(200).json({
      mensaje:
        "Contraseña restablecida. Inicie sesión nuevamente."
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  registrar,
  login,
  crearUsuarioAdministrativo,
  cambiarPassword,
  generarRecuperacionAdmin,
  restablecerPassword,
  generarCodigos,
  estadoCodigos,
  restablecerConCodigo
};
