const {
  body,
  param
} = require("express-validator");


// ========================================
// Opciones de normalización de email
// (mismas que en usuarios.validator.js)
// ========================================

const opcionesEmail = {
  gmail_remove_dots: false,
  gmail_remove_subaddress: false,
  outlookdotcom_remove_subaddress: false,
  yahoo_remove_subaddress: false,
  icloud_remove_subaddress: false
};


// ========================================
// Registro
// ========================================

const validarRegistro = [

  body("nombre")
    .isString()
    .withMessage(
      "El nombre debe ser texto"
    )
    .trim()
    .isLength({
      min: 3,
      max: 100
    })
    .withMessage(
      "El nombre debe tener entre 3 y 100 caracteres"
    ),


  body("email")
    .isEmail()
    .withMessage(
      "Debe proporcionar un correo electrónico válido"
    )
    // Mismo límite que usuarios_auth.email
    .isLength({
      max: 150
    })
    .withMessage(
      "El correo electrónico no puede superar 150 caracteres"
    )
    .normalizeEmail(
      opcionesEmail
    ),


  // bcrypt solo procesa los primeros 72 bytes
  body("password")
    .isString()
    .withMessage(
      "La contraseña debe ser texto"
    )
    .isLength({
      min: 10,
      max: 72
    })
    .withMessage(
      "La contraseña debe tener entre 10 y 72 caracteres"
    )

  // El rol NO se valida aquí: el cliente
  // no puede definirlo. Lo asigna el servidor.
];


// ========================================
// Login
// ========================================

const validarLogin = [

  body("email")
    .isEmail()
    .withMessage(
      "Debe proporcionar un correo electrónico válido"
    )
    .normalizeEmail(
      opcionesEmail
    ),


  body("password")
    .isString()
    .withMessage(
      "La contraseña debe ser texto"
    )
    .notEmpty()
    .withMessage(
      "La contraseña es obligatoria"
    )
];


// ========================================
// Crear usuario desde administración
// Aquí sí se acepta rol, porque la ruta
// ya está protegida por autorizarRoles
// ("administrador"). Deliberadamente no se
// aceptan activo, passwordHash, id ni
// permisos. Los clientes usan /registro.
// ========================================

const validarCreacionUsuarioAdministrativo = [

  ...validarRegistro,


  body("rol")
    .isIn([
      "auditor",
      "administrador"
    ])
    .withMessage(
      "El rol debe ser auditor o administrador"
    )
];


// ========================================
// Bloque 11 - Contraseñas y recuperación
// ========================================

// Nueva contraseña: 12-72 caracteres con
// mayúscula, minúscula y número
const reglaPasswordNueva = () =>
  body("passwordNueva")
    .isString()
    .withMessage(
      "La nueva contraseña debe ser texto"
    )
    .isLength({
      min: 12,
      max: 72
    })
    .withMessage(
      "La nueva contraseña debe tener entre 12 y 72 caracteres"
    )
    .custom((valor) =>
      /[a-z]/.test(valor) &&
      /[A-Z]/.test(valor) &&
      /[0-9]/.test(valor)
    )
    .withMessage(
      "Incluya mayúscula, minúscula y número"
    );

const reglaConfirmacion = () =>
  body("confirmarPassword")
    .isString()
    .custom((valor, { req }) =>
      valor === req.body.passwordNueva
    )
    .withMessage(
      "La confirmación no coincide"
    );

const reglaPasswordActual = () =>
  body("passwordActual")
    .isString()
    .notEmpty()
    .withMessage(
      "La contraseña actual es obligatoria"
    );

const validarCambioPassword = [
  reglaPasswordActual(),
  reglaPasswordNueva(),
  reglaConfirmacion()
];

const validarGenerarRecuperacion = [
  param("usuarioId")
    .isInt({
      min: 1
    })
    .withMessage(
      "ID de usuario inválido"
    )
    .toInt()
];

const validarRestablecimiento = [
  body("token")
    .isString()
    .matches(/^[a-f0-9]{64}$/i)
    .withMessage(
      "Token inválido"
    ),
  reglaPasswordNueva(),
  reglaConfirmacion()
];

const validarGenerarCodigos = [
  reglaPasswordActual()
];

const validarRestablecerConCodigo = [
  body("email")
    .isEmail()
    .withMessage(
      "Correo inválido"
    )
    .normalizeEmail(
      opcionesEmail
    ),
  body("codigo")
    .isString()
    .matches(/^[a-fA-F0-9]{4}(?:-[a-fA-F0-9]{4}){7}$/)
    .withMessage(
      "Código inválido"
    ),
  reglaPasswordNueva(),
  reglaConfirmacion()
];


module.exports = {
  validarRegistro,
  validarLogin,
  validarCreacionUsuarioAdministrativo,
  validarCambioPassword,
  validarGenerarRecuperacion,
  validarRestablecimiento,
  validarGenerarCodigos,
  validarRestablecerConCodigo
};
