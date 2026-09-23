const {
  body
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
    ),


  body("rol")
    .isIn([
      "administrador",
      "cliente",
      "auditor"
    ])
    .withMessage(
      "El rol debe ser administrador, cliente o auditor"
    )
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


module.exports = {
  validarRegistro,
  validarLogin
};
