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

const autenticarJWT = require(
  "../middlewares/auth.middleware"
);

const autorizarRoles = require(
  "../middlewares/roles.middleware"
);

const {
  autorizarCuentaOrigenPropia,
  autorizarAccesoTransaccion
} = require(
  "../middlewares/propiedad.middleware"
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
 *       Roles — administrador, auditor (solo lectura).
 *
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     responses:
 *
 *       401:
 *         $ref: '#/components/responses/NoAutenticado'
 *
 *       403:
 *         $ref: '#/components/responses/SinPermisos'
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

  autenticarJWT,

  autorizarRoles(
    "administrador",
    "auditor"
  ),

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
 *     description:
 *       Roles — administrador, auditor (solo lectura), cliente. Propiedad del recurso (BOLA/IDOR) — el cliente solo si es dueño de la cuenta origen o destino.
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
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     responses:
 *
 *       401:
 *         $ref: '#/components/responses/NoAutenticado'
 *
 *       403:
 *         $ref: '#/components/responses/SinPermisos'
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

  autenticarJWT,

  autorizarRoles(
    "administrador",
    "auditor",
    "cliente"
  ),

  validarIdTransaccion,

  validar,

  autorizarAccesoTransaccion,

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
 *       Roles — administrador.
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
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     responses:
 *
 *       401:
 *         $ref: '#/components/responses/NoAutenticado'
 *
 *       403:
 *         $ref: '#/components/responses/SinPermisos'
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

  autenticarJWT,

  autorizarRoles(
    "administrador"
  ),

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
 *       Roles — administrador, cliente. Propiedad del recurso (BOLA/IDOR) — el cliente solo desde una cuenta propia.
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
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     responses:
 *
 *       401:
 *         $ref: '#/components/responses/NoAutenticado'
 *
 *       403:
 *         $ref: '#/components/responses/SinPermisos'
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

  autenticarJWT,

  autorizarRoles(
    "administrador",
    "cliente"
  ),

  validarRetiro,

  validar,

  autorizarCuentaOrigenPropia,

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
 *       Roles — administrador, cliente. Propiedad del recurso (BOLA/IDOR) — el cliente solo desde una cuenta propia (el destino puede ser cualquier cuenta).
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
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     responses:
 *
 *       401:
 *         $ref: '#/components/responses/NoAutenticado'
 *
 *       403:
 *         $ref: '#/components/responses/SinPermisos'
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

  autenticarJWT,

  autorizarRoles(
    "administrador",
    "cliente"
  ),

  validarTransferencia,

  validar,

  autorizarCuentaOrigenPropia,

  transaccionesController.crearTransferencia
);

module.exports = router;
