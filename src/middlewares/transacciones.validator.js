const {
  body,
  param
} = require("express-validator");


// ========================================
// Validar ID
// ========================================

const validarIdTransaccion = [
  param("id")
    .isInt({
      min: 1
    })
    .withMessage(
      "El id debe ser un número entero positivo"
    )
];


// ========================================
// Campos comunes de monto y descripción
// ========================================

const camposMontoDescripcion = [

  body("monto")
    // NUMERIC(14,2): con más decimales la base
    // de datos redondearía y se movería un
    // monto distinto del validado
    .isDecimal({
      decimal_digits: "0,2"
    })
    .withMessage(
      "El monto debe ser un número con máximo 2 decimales"
    )
    .bail()
    .isFloat({
      min: 0.01,
      max: 2000000
    })
    .withMessage(
      "El monto debe ser mayor que 0 y no superar 2.000.000"
    )
    .toFloat(),


  body("descripcion")
    .optional()
    .isString()
    .withMessage(
      "La descripción debe ser texto"
    )
    .trim()
    .isLength({
      max: 120
    })
    .withMessage(
      "La descripción no puede superar 120 caracteres"
    )
];


// ========================================
// POST /deposito
// ========================================

const validarDeposito = [

  body("cuentaDestinoId")
    .isInt({
      min: 1
    })
    .withMessage(
      "El cuentaDestinoId debe ser un número entero positivo"
    )
    .toInt(),

  ...camposMontoDescripcion
];


// ========================================
// POST /retiro
// ========================================

const validarRetiro = [

  body("cuentaOrigenId")
    .isInt({
      min: 1
    })
    .withMessage(
      "El cuentaOrigenId debe ser un número entero positivo"
    )
    .toInt(),

  ...camposMontoDescripcion
];


// ========================================
// POST /transferencia
// ========================================

const validarTransferencia = [

  body("cuentaOrigenId")
    .isInt({
      min: 1
    })
    .withMessage(
      "El cuentaOrigenId debe ser un número entero positivo"
    )
    .toInt(),

  body("cuentaDestinoId")
    .isInt({
      min: 1
    })
    .withMessage(
      "El cuentaDestinoId debe ser un número entero positivo"
    )
    .toInt(),

  ...camposMontoDescripcion
];


module.exports = {
  validarIdTransaccion,
  validarDeposito,
  validarRetiro,
  validarTransferencia
};
