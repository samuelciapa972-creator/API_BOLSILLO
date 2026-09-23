const {
  matchedData
} = require("express-validator");


const authService =
  require(
    "../services/auth.service"
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
      authService
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
    // Login correcto
    // (todavía no se genera JWT)
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
        }
      });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  registrar,
  login
};
