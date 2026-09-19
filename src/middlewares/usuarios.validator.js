const {
  body,
  param
} = require("express-validator");


// ========================================
// Validar ID
// ========================================

const validarIdUsuario = [
  param("id")
    .isInt({
      min: 1
    })
    .withMessage(
      "El id debe ser un número entero positivo"
    )
];


// ========================================
// Campos comunes de nombre, documento,
// email y teléfono
// ========================================

const camposBasicos = [

  body("nombre")
    .isString()
    .withMessage(
      "El nombre debe ser texto"
    )
    .trim()
    .notEmpty()
    .withMessage(
      "El nombre es obligatorio"
    )
    .isLength({
      min: 3,
      max: 100
    })
    .withMessage(
      "El nombre debe tener entre 3 y 100 caracteres"
    ),


  body("documento")
    .isString()
    .withMessage(
      "El documento debe ser texto"
    )
    .trim()
    .notEmpty()
    .withMessage(
      "El documento es obligatorio"
    )
    .matches(/^[0-9]{6,15}$/)
    .withMessage(
      "El documento debe contener entre 6 y 15 dígitos"
    ),


  body("email")
    .isEmail()
    .withMessage(
      "El correo electrónico no es válido"
    )
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false
    }),


  body("telefono")
    .isString()
    .withMessage(
      "El teléfono debe ser texto"
    )
    .trim()
    .matches(/^3[0-9]{9}$/)
    .withMessage(
      "El teléfono debe tener 10 dígitos y empezar por 3"
    )
];


// ========================================
// POST
// El estado nunca se recibe del cliente,
// todo usuario nace "activo"
// ========================================

const validarCreacionUsuario = [
  ...camposBasicos
];


// ========================================
// PUT
// Reemplazo completo, estado obligatorio
// ========================================

const validarActualizacionUsuario = [

  ...camposBasicos,

  body("estado")
    .isIn([
      "activo",
      "inactivo"
    ])
    .withMessage(
      "El estado debe ser activo o inactivo"
    )
];


module.exports = {
  validarIdUsuario,
  validarCreacionUsuario,
  validarActualizacionUsuario
};
