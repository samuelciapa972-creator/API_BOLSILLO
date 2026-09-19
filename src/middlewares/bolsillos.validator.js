const {
  body,
  param
} = require("express-validator");


// ========================================
// Validar ID
// ========================================

const validarIdBolsillo = [
  param("id")
    .isInt({
      min: 1
    })
    .withMessage(
      "El id debe ser un número entero positivo"
    )
];


// ========================================
// Campos comunes de nombre y meta
// ========================================

const camposNombreMeta = [

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
      max: 40
    })
    .withMessage(
      "El nombre debe tener entre 3 y 40 caracteres"
    ),


  body("meta")
    .optional()
    .isFloat({
      min: 0.01
    })
    .withMessage(
      "La meta debe ser un número decimal mayor que 0"
    )
    .toFloat()
];


// ========================================
// POST
// saldo, fechaCreacion y estado nunca se
// reciben del cliente
// ========================================

const validarBolsillo = [

  body("cuentaId")
    .isInt({
      min: 1
    })
    .withMessage(
      "El cuentaId debe ser un número entero positivo"
    )
    .toInt(),

  ...camposNombreMeta
];


// ========================================
// PUT
// cuentaId no es editable
// ========================================

const validarActualizacionBolsillo = [
  ...camposNombreMeta
];


// ========================================
// POST /:id/apartar y /:id/devolver
// ========================================

const validarMontoBolsillo = [

  body("monto")
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
// PATCH /:id/estado
// ========================================

const validarEstadoBolsillo = [

  body("estado")
    .isIn([
      "activo",
      "archivado"
    ])
    .withMessage(
      "El estado debe ser activo o archivado"
    )
];


module.exports = {
  validarIdBolsillo,
  validarBolsillo,
  validarActualizacionBolsillo,
  validarMontoBolsillo,
  validarEstadoBolsillo
};
