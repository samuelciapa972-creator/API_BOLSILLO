const express = require("express");

const router = express.Router();

const cuentasController = require(
  "../controllers/cuentas.controller"
);

const {
  validarIdCuenta,
  validarCuenta,
  validarEstadoCuenta
} = require(
  "../middlewares/cuentas.validator"
);

const validar = require(
  "../middlewares/validar.middleware"
);

/**
 * @openapi
 * components:
 *   schemas:
 *
 *     Cuenta:
 *       type: object
 *       properties:
 *
 *         id:
 *           type: integer
 *           example: 1
 *
 *         usuarioId:
 *           type: integer
 *           example: 1
 *
 *         numeroCuenta:
 *           type: string
 *           example: "3000000001"
 *
 *         saldoTotal:
 *           type: number
 *           format: float
 *           example: 100000.00
 *
 *         moneda:
 *           type: string
 *           enum: [COP]
 *           example: COP
 *
 *         estado:
 *           type: string
 *           enum: [activa, bloqueada, cerrada]
 *           example: activa
 *
 *     CuentaEntrada:
 *       type: object
 *
 *       required:
 *         - usuarioId
 *
 *       properties:
 *
 *         usuarioId:
 *           type: integer
 *           example: 1
 *
 *     SaldoCuenta:
 *       type: object
 *       properties:
 *
 *         cuentaId:
 *           type: integer
 *           example: 1
 *
 *         saldoTotal:
 *           type: number
 *           format: float
 *           example: 100000.00
 *
 *         saldoApartado:
 *           type: number
 *           format: float
 *           example: 80000.00
 *
 *         saldoDisponible:
 *           type: number
 *           format: float
 *           example: 20000.00
 *
 *         moneda:
 *           type: string
 *           example: COP
 *
 *     EstadoCuentaEntrada:
 *       type: object
 *
 *       required:
 *         - estado
 *
 *       properties:
 *
 *         estado:
 *           type: string
 *           enum: [activa, bloqueada, cerrada]
 *           example: bloqueada
 */

/**
 * @openapi
 * /api/cuentas:
 *   get:
 *
 *     tags:
 *       - Cuentas
 *
 *     summary:
 *       Obtener todas las cuentas
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Lista de cuentas
 *
 *         content:
 *           application/json:
 *
 *             schema:
 *               type: array
 *
 *               items:
 *                 $ref: '#/components/schemas/Cuenta'
 */
router.get(
  "/",
  cuentasController.obtenerCuentas
);

/**
 * @openapi
 * /api/cuentas/{id}:
 *   get:
 *
 *     tags:
 *       - Cuentas
 *
 *     summary:
 *       Obtener cuenta por ID
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Cuenta encontrada
 *
 *         content:
 *           application/json:
 *
 *             schema:
 *               $ref: '#/components/schemas/Cuenta'
 *
 *       400:
 *         description:
 *           ID inválido
 *
 *       404:
 *         description:
 *           Cuenta no encontrada
 */
router.get(
  "/:id",

  validarIdCuenta,

  validar,

  cuentasController.obtenerCuentaPorId
);

/**
 * @openapi
 * /api/cuentas/{id}/saldo:
 *   get:
 *
 *     tags:
 *       - Cuentas
 *
 *     summary:
 *       Obtener el saldo total, apartado y disponible de una cuenta
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Saldo de la cuenta
 *
 *         content:
 *           application/json:
 *
 *             schema:
 *               $ref: '#/components/schemas/SaldoCuenta'
 *
 *       400:
 *         description:
 *           ID inválido
 *
 *       404:
 *         description:
 *           Cuenta no encontrada
 */
router.get(
  "/:id/saldo",

  validarIdCuenta,

  validar,

  cuentasController.obtenerSaldoCuenta
);

/**
 * @openapi
 * /api/cuentas/{id}/transacciones:
 *   get:
 *
 *     tags:
 *       - Cuentas
 *
 *     summary:
 *       Obtener las transacciones de una cuenta
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Lista de transacciones donde la cuenta participa como origen o destino
 *
 *         content:
 *           application/json:
 *
 *             schema:
 *               type: array
 *
 *               items:
 *                 $ref: '#/components/schemas/Transaccion'
 *
 *       400:
 *         description:
 *           ID inválido
 *
 *       404:
 *         description:
 *           Cuenta no encontrada
 */
router.get(
  "/:id/transacciones",

  validarIdCuenta,

  validar,

  cuentasController.obtenerTransaccionesDeCuenta
);

/**
 * @openapi
 * /api/cuentas/{id}/bolsillos:
 *   get:
 *
 *     tags:
 *       - Cuentas
 *
 *     summary:
 *       Obtener los bolsillos de una cuenta
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Lista de bolsillos de la cuenta
 *
 *         content:
 *           application/json:
 *
 *             schema:
 *               type: array
 *
 *               items:
 *                 $ref: '#/components/schemas/Bolsillo'
 *
 *       400:
 *         description:
 *           ID inválido
 *
 *       404:
 *         description:
 *           Cuenta no encontrada
 */
router.get(
  "/:id/bolsillos",

  validarIdCuenta,

  validar,

  cuentasController.obtenerBolsillosDeCuenta
);

/**
 * @openapi
 * /api/cuentas:
 *   post:
 *
 *     tags:
 *       - Cuentas
 *
 *     summary:
 *       Crear una cuenta
 *
 *     description:
 *       Crea una cuenta para un usuario existente y activo. El saldo, el número de cuenta, la moneda y el estado los asigna el sistema.
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *
 *           schema:
 *             $ref: '#/components/schemas/CuentaEntrada'
 *
 *     responses:
 *
 *       201:
 *         description:
 *           Cuenta creada correctamente
 *
 *       400:
 *         description:
 *           Datos inválidos o el usuario indicado no existe
 *
 *       409:
 *         description:
 *           No se puede crear una cuenta para un usuario inactivo
 */
router.post(
  "/",

  validarCuenta,

  validar,

  cuentasController.crearCuenta
);

/**
 * @openapi
 * /api/cuentas/{id}/estado:
 *   patch:
 *
 *     tags:
 *       - Cuentas
 *
 *     summary:
 *       Cambiar el estado de una cuenta
 *
 *     description:
 *       Ciclo de vida de la cuenta. Desde activa se puede pasar a bloqueada o a cerrada.
 *       Desde bloqueada se puede volver a activa o pasar a cerrada. Cerrada es un estado
 *       terminal y exige que el saldo total sea cero.
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *
 *           schema:
 *             $ref: '#/components/schemas/EstadoCuentaEntrada'
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Estado actualizado correctamente
 *
 *       400:
 *         description:
 *           Datos inválidos
 *
 *       404:
 *         description:
 *           Cuenta no encontrada
 *
 *       409:
 *         description:
 *           Transición de estado no permitida, o intento de cerrar con saldo mayor que cero
 */
router.patch(
  "/:id/estado",

  validarIdCuenta,

  validarEstadoCuenta,

  validar,

  cuentasController.actualizarEstadoCuenta
);

module.exports = router;
