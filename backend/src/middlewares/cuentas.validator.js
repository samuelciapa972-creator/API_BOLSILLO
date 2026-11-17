const {
  body,
  param
} = require("express-validator");


// ========================================
// Validar ID
// ========================================

const validarIdCuenta = [
  param("id")
    .isInt({
      min: 1
    })
    .withMessage(
      "El id debe ser un número entero positivo"
    )
];


// ========================================
// POST
// saldoTotal, numeroCuenta, moneda y estado
// nunca se reciben del cliente
// ========================================

const validarCuenta = [
  body("usuarioId")
    .isInt({
      min: 1
    })
    .withMessage(
      "El usuarioId debe ser un número entero positivo"
    )
    .toInt()
];


// ========================================
// PATCH /:id/estado
// ========================================

const validarEstadoCuenta = [

  body("estado")
    .isIn([
      "activa",
      "bloqueada",
      "cerrada"
    ])
    .withMessage(
      "El estado debe ser activa, bloqueada o cerrada"
    )
];


module.exports = {
  validarIdCuenta,
  validarCuenta,
  validarEstadoCuenta
};
