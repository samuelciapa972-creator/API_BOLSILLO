const express = require("express");

const router = express.Router();

const transaccionesController = require(
  "../controllers/transacciones.controller"
);

const {
  validarIdTransaccion,
  validarDeposito,
  validarRetiro,
  validarTransferencia
} = require(
  "../middlewares/transacciones.validator"
);

const validar = require(
  "../middlewares/validar.middleware"
);

/**
 * @openapi
 * components:
 *   schemas:
 *
 *     Transaccion:
 *       type: object
 *       properties:
 *
 *         id:
 *           type: integer
 *           example: 1
 *
 *         tipo:
 *           type: string
 *           enum: [deposito, retiro, transferencia, apartado, devolucion]
 *           example: transferencia
 *
 *         cuentaOrigenId:
 *           type: integer
 *           nullable: true
 *           example: 1
 *
 *         cuentaDestinoId:
 *           type: integer
 *           nullable: true
 *           example: 2
 *
 *         bolsilloId:
 *           type: integer
 *           nullable: true
 *           example: null
 *
 *         monto:
 *           type: number
 *           format: float
 *           example: 50000.00
 *
 *         descripcion:
 *           type: string
 *           nullable: true
 *           example: Pago almuerzo
 *
 *         fecha:
 *           type: string
 *           format: date-time
 *           example: "2026-09-14T12:05:00Z"
 *
 *         estado:
 *           type: string
 *           enum: [pendiente, exitosa, fallida]
 *           example: exitosa
 *
 *     DepositoEntrada:
 *       type: object
 *
 *       required:
 *         - cuentaDestinoId
 *         - monto
 *
 *       properties:
 *
 *         cuentaDestinoId:
 *           type: integer
 *           example: 1
 *
 *         monto:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *           maximum: 2000000
 *           example: 50000.00
 *
 *         descripcion:
 *           type: string
 *           maxLength: 120
 *           example: Consignación
 *
 *     RetiroEntrada:
 *       type: object
 *
 *       required:
 *         - cuentaOrigenId
 *         - monto
 *
 *       properties:
 *
 *         cuentaOrigenId:
 *           type: integer
 *           example: 1
 *
 *         monto:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *           maximum: 2000000
 *           example: 50000.00
 *
 *         descripcion:
 *           type: string
 *           maxLength: 120
 *           example: Retiro cajero
 *
 *     TransferenciaEntrada:
 *       type: object
 *
 *       required:
 *         - cuentaOrigenId
 *         - cuentaDestinoId
 *         - monto
 *
 *       properties:
 *
 *         cuentaOrigenId:
 *           type: integer
 *           example: 1
 *
 *         cuentaDestinoId:
 *           type: integer
 *           example: 2
 *
 *         monto:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *           maximum: 2000000
 *           example: 50000.00
 *
 *         descripcion:
 *           type: string
 *           maxLength: 120
 *           example: Pago almuerzo
 */

/**
 * @openapi
 * /api/transacciones:
 *   get:
 *
 *     tags:
 *       - Transacciones
 *
 *     summary:
 *       Obtener todas las transacciones
 *
 *     description:
 *       Las transacciones son inmutables, no se editan ni se eliminan, solo se consultan.
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Lista de transacciones
 *
 *         content:
 *           application/json:
 *
 *             schema:
 *               type: array
 *
 *               items:
 *                 $ref: '#/components/schemas/Transaccion'
 */
router.get(
  "/",
  transaccionesController.obtenerTransacciones
);

/**
 * @openapi
 * /api/transacciones/{id}:
 *   get:
 *
 *     tags:
 *       - Transacciones
 *
 *     summary:
 *       Obtener transacción por ID
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
 *           Transacción encontrada
 *
 *         content:
 *           application/json:
 *
 *             schema:
 *               $ref: '#/components/schemas/Transaccion'
 *
 *       400:
 *         description:
 *           ID inválido
 *
 *       404:
 *         description:
 *           Transacción no encontrada
 */
router.get(
  "/:id",

  validarIdTransaccion,

  validar,

  transaccionesController.obtenerTransaccionPorId
);

/**
 * @openapi
 * /api/transacciones/deposito:
 *   post:
 *
 *     tags:
 *       - Transacciones
 *
 *     summary:
 *       Registrar un depósito
 *
 *     description:
 *       Un depósito no tiene cuenta origen, aumenta el saldo total de la cuenta destino.
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *
 *           schema:
 *             $ref: '#/components/schemas/DepositoEntrada'
 *
 *     responses:
 *
 *       201:
 *         description:
 *           Depósito registrado correctamente
 *
 *       400:
 *         description:
 *           Datos inválidos o la cuenta destino no existe
 *
 *       409:
 *         description:
 *           La cuenta destino no está activa
 */
router.post(
  "/deposito",

  validarDeposito,

  validar,

  transaccionesController.crearDeposito
);

/**
 * @openapi
 * /api/transacciones/retiro:
 *   post:
 *
 *     tags:
 *       - Transacciones
 *
 *     summary:
 *       Registrar un retiro
 *
 *     description:
 *       Un retiro no tiene cuenta destino y se valida contra el saldo disponible de la cuenta origen, nunca contra el saldo total.
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *
 *           schema:
 *             $ref: '#/components/schemas/RetiroEntrada'
 *
 *     responses:
 *
 *       201:
 *         description:
 *           Retiro registrado correctamente
 *
 *       400:
 *         description:
 *           Datos inválidos o la cuenta origen no existe
 *
 *       409:
 *         description:
 *           La cuenta origen no está activa, o el saldo disponible no alcanza
 */
router.post(
  "/retiro",

  validarRetiro,

  validar,

  transaccionesController.crearRetiro
);

/**
 * @openapi
 * /api/transacciones/transferencia:
 *   post:
 *
 *     tags:
 *       - Transacciones
 *
 *     summary:
 *       Registrar una transferencia entre dos cuentas
 *
 *     description:
 *       Exige que ambas cuentas existan, estén activas y sean distintas. Se valida contra el saldo disponible de la cuenta origen.
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *
 *           schema:
 *             $ref: '#/components/schemas/TransferenciaEntrada'
 *
 *     responses:
 *
 *       201:
 *         description:
 *           Transferencia registrada correctamente
 *
 *       400:
 *         description:
 *           Datos inválidos, o alguna de las cuentas no existe
 *
 *       409:
 *         description:
 *           Las cuentas no son distintas, no están activas, o el saldo disponible no alcanza
 */
router.post(
  "/transferencia",

  validarTransferencia,

  validar,

  transaccionesController.crearTransferencia
);

module.exports = router;
