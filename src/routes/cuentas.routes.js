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

const autenticarJWT = require(
  "../middlewares/auth.middleware"
);

const autorizarRoles = require(
  "../middlewares/roles.middleware"
);

const {
  autorizarCuentaPropia
} = require(
  "../middlewares/propiedad.middleware"
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
 *     description:
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

  autenticarJWT,

  autorizarRoles(
    "administrador",
    "auditor"
  ),

  cuentasController.obtenerCuentas
);

/**
 * @openapi
 * /api/cuentas/mis-cuentas:
 *   get:
 *
 *     tags:
 *       - Cuentas
 *
 *     summary:
 *       Obtener las cuentas del cliente autenticado
 *
 *     description:
 *       Roles — cliente. La identidad se deriva del JWT, no de un ID en la URL.
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
 *           Cuentas del titular asociado al usuario autenticado
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
// Debe ir antes de /:id
router.get(
  "/mis-cuentas",

  autenticarJWT,

  autorizarRoles(
    "cliente"
  ),

  cuentasController.obtenerMisCuentas
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
 *     description:
 *       Roles — administrador, auditor (solo lectura), cliente. Propiedad del recurso (BOLA/IDOR) — el cliente solo sus cuentas.
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

  autenticarJWT,

  autorizarRoles(
    "administrador",
    "auditor",
    "cliente"
  ),

  validarIdCuenta,

  validar,

  autorizarCuentaPropia,

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
 *     description:
 *       Roles — administrador, auditor (solo lectura), cliente. Propiedad del recurso (BOLA/IDOR) — el cliente solo sus cuentas.
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

  autenticarJWT,

  autorizarRoles(
    "administrador",
    "auditor",
    "cliente"
  ),

  validarIdCuenta,

  validar,

  autorizarCuentaPropia,

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
 *     description:
 *       Roles — administrador, auditor (solo lectura), cliente. Propiedad del recurso (BOLA/IDOR) — el cliente solo sus cuentas.
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

  autenticarJWT,

  autorizarRoles(
    "administrador",
    "auditor",
    "cliente"
  ),

  validarIdCuenta,

  validar,

  autorizarCuentaPropia,

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
 *     description:
 *       Roles — administrador, auditor (solo lectura), cliente. Propiedad del recurso (BOLA/IDOR) — el cliente solo sus cuentas.
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

  autenticarJWT,

  autorizarRoles(
    "administrador",
    "auditor",
    "cliente"
  ),

  validarIdCuenta,

  validar,

  autorizarCuentaPropia,

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
 *       Roles — administrador.
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

  autenticarJWT,

  autorizarRoles(
    "administrador"
  ),

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
 *       Roles — administrador.
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

  autenticarJWT,

  autorizarRoles(
    "administrador"
  ),

  validarIdCuenta,

  validarEstadoCuenta,

  validar,

  cuentasController.actualizarEstadoCuenta
);

module.exports = router;
