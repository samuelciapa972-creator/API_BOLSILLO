const express = require("express");

const router = express.Router();

const bolsillosController = require(
  "../controllers/bolsillos.controller"
);

const {
  validarIdBolsillo,
  validarBolsillo,
  validarActualizacionBolsillo,
  validarMontoBolsillo,
  validarEstadoBolsillo
} = require(
  "../middlewares/bolsillos.validator"
);

const validar = require(
  "../middlewares/validar.middleware"
);

/**
 * @openapi
 * components:
 *   schemas:
 *
 *     Bolsillo:
 *       type: object
 *       properties:
 *
 *         id:
 *           type: integer
 *           example: 1
 *
 *         cuentaId:
 *           type: integer
 *           example: 1
 *
 *         nombre:
 *           type: string
 *           example: Viaje a Cartagena
 *
 *         meta:
 *           type: number
 *           format: float
 *           nullable: true
 *           example: 800000.00
 *
 *         saldo:
 *           type: number
 *           format: float
 *           example: 80000.00
 *
 *         fechaCreacion:
 *           type: string
 *           format: date-time
 *           example: "2026-09-01T10:00:00Z"
 *
 *         estado:
 *           type: string
 *           enum: [activo, archivado]
 *           example: activo
 *
 *     BolsilloEntrada:
 *       type: object
 *
 *       required:
 *         - cuentaId
 *         - nombre
 *
 *       properties:
 *
 *         cuentaId:
 *           type: integer
 *           example: 1
 *
 *         nombre:
 *           type: string
 *           minLength: 3
 *           maxLength: 40
 *           example: Viaje a Cartagena
 *
 *         meta:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *           example: 800000.00
 *
 *     BolsilloActualizacionEntrada:
 *       type: object
 *
 *       required:
 *         - nombre
 *
 *       properties:
 *
 *         nombre:
 *           type: string
 *           minLength: 3
 *           maxLength: 40
 *           example: Fondo de viaje
 *
 *         meta:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *           example: 900000.00
 *
 *     EstadoBolsilloEntrada:
 *       type: object
 *
 *       required:
 *         - estado
 *
 *       properties:
 *
 *         estado:
 *           type: string
 *           enum: [activo, archivado]
 *           example: archivado
 *
 *     MontoBolsilloEntrada:
 *       type: object
 *
 *       required:
 *         - monto
 *
 *       properties:
 *
 *         monto:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *           maximum: 2000000
 *           example: 20000.00
 *
 *         descripcion:
 *           type: string
 *           maxLength: 120
 *           example: Ahorro mensual
 */

/**
 * @openapi
 * /api/bolsillos:
 *   get:
 *
 *     tags:
 *       - Bolsillos
 *
 *     summary:
 *       Obtener todos los bolsillos
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Lista de bolsillos
 *
 *         content:
 *           application/json:
 *
 *             schema:
 *               type: array
 *
 *               items:
 *                 $ref: '#/components/schemas/Bolsillo'
 */
router.get(
  "/",
  bolsillosController.obtenerBolsillos
);

/**
 * @openapi
 * /api/bolsillos/{id}:
 *   get:
 *
 *     tags:
 *       - Bolsillos
 *
 *     summary:
 *       Obtener bolsillo por ID
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
 *           Bolsillo encontrado
 *
 *         content:
 *           application/json:
 *
 *             schema:
 *               $ref: '#/components/schemas/Bolsillo'
 *
 *       400:
 *         description:
 *           ID inválido
 *
 *       404:
 *         description:
 *           Bolsillo no encontrado
 */
router.get(
  "/:id",

  validarIdBolsillo,

  validar,

  bolsillosController.obtenerBolsilloPorId
);

/**
 * @openapi
 * /api/bolsillos:
 *   post:
 *
 *     tags:
 *       - Bolsillos
 *
 *     summary:
 *       Crear un bolsillo
 *
 *     description:
 *       El saldo, la fecha de creación y el estado los asigna el sistema. Una cuenta admite máximo 10 bolsillos, y el nombre debe ser único dentro de la cuenta.
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *
 *           schema:
 *             $ref: '#/components/schemas/BolsilloEntrada'
 *
 *     responses:
 *
 *       201:
 *         description:
 *           Bolsillo creado correctamente
 *
 *       400:
 *         description:
 *           Datos inválidos o la cuenta indicada no existe
 *
 *       409:
 *         description:
 *           La cuenta no está activa, el nombre ya existe en la cuenta, o se alcanzó el máximo de 10 bolsillos
 */
router.post(
  "/",

  validarBolsillo,

  validar,

  bolsillosController.crearBolsillo
);

/**
 * @openapi
 * /api/bolsillos/{id}:
 *   put:
 *
 *     tags:
 *       - Bolsillos
 *
 *     summary:
 *       Actualizar nombre y meta de un bolsillo
 *
 *     description:
 *       La cuenta a la que pertenece un bolsillo no es editable.
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
 *             $ref: '#/components/schemas/BolsilloActualizacionEntrada'
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Bolsillo actualizado correctamente
 *
 *       400:
 *         description:
 *           Datos inválidos
 *
 *       404:
 *         description:
 *           Bolsillo no encontrado
 *
 *       409:
 *         description:
 *           Ya existe un bolsillo con ese nombre en la cuenta
 */
router.put(
  "/:id",

  validarIdBolsillo,

  validarActualizacionBolsillo,

  validar,

  bolsillosController.actualizarBolsillo
);

/**
 * @openapi
 * /api/bolsillos/{id}:
 *   delete:
 *
 *     tags:
 *       - Bolsillos
 *
 *     summary:
 *       Eliminar bolsillo
 *
 *     description:
 *       No se puede eliminar un bolsillo con saldo, primero debe devolverse el dinero a la cuenta.
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
 *           Bolsillo eliminado correctamente
 *
 *       400:
 *         description:
 *           ID inválido
 *
 *       404:
 *         description:
 *           Bolsillo no encontrado
 *
 *       409:
 *         description:
 *           El bolsillo tiene saldo o tiene transacciones asociadas
 */
router.delete(
  "/:id",

  validarIdBolsillo,

  validar,

  bolsillosController.eliminarBolsillo
);

/**
 * @openapi
 * /api/bolsillos/{id}/apartar:
 *   post:
 *
 *     tags:
 *       - Bolsillos
 *
 *     summary:
 *       Apartar dinero en un bolsillo
 *
 *     description:
 *       No cambia el saldo total de la cuenta, solo reduce el saldo disponible. Cada llamada crea un movimiento nuevo, por eso es POST y no PATCH.
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
 *             $ref: '#/components/schemas/MontoBolsilloEntrada'
 *
 *     responses:
 *
 *       201:
 *         description:
 *           Dinero apartado correctamente
 *
 *       400:
 *         description:
 *           Datos inválidos
 *
 *       404:
 *         description:
 *           Bolsillo no encontrado
 *
 *       409:
 *         description:
 *           El bolsillo está archivado, la cuenta no está activa, o el saldo disponible no alcanza
 */
router.post(
  "/:id/apartar",

  validarIdBolsillo,

  validarMontoBolsillo,

  validar,

  bolsillosController.apartarEnBolsillo
);

/**
 * @openapi
 * /api/bolsillos/{id}/devolver:
 *   post:
 *
 *     tags:
 *       - Bolsillos
 *
 *     summary:
 *       Devolver dinero de un bolsillo a la cuenta
 *
 *     description:
 *       No se puede devolver más de lo que el bolsillo contiene.
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
 *             $ref: '#/components/schemas/MontoBolsilloEntrada'
 *
 *     responses:
 *
 *       201:
 *         description:
 *           Dinero devuelto correctamente
 *
 *       400:
 *         description:
 *           Datos inválidos
 *
 *       404:
 *         description:
 *           Bolsillo no encontrado
 *
 *       409:
 *         description:
 *           El monto supera el saldo del bolsillo, o la cuenta no está activa
 */
router.post(
  "/:id/devolver",

  validarIdBolsillo,

  validarMontoBolsillo,

  validar,

  bolsillosController.devolverDeBolsillo
);

/**
 * @openapi
 * /api/bolsillos/{id}/estado:
 *   patch:
 *
 *     tags:
 *       - Bolsillos
 *
 *     summary:
 *       Cambiar el estado de un bolsillo
 *
 *     description:
 *       El estado archivado es terminal y exige que el bolsillo tenga saldo en 0.
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
 *             $ref: '#/components/schemas/EstadoBolsilloEntrada'
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Estado del bolsillo actualizado correctamente
 *
 *       400:
 *         description:
 *           Datos inválidos
 *
 *       404:
 *         description:
 *           Bolsillo no encontrado
 *
 *       409:
 *         description:
 *           Transición de estado no permitida, o el bolsillo tiene saldo
 */
router.patch(
  "/:id/estado",

  validarIdBolsillo,

  validarEstadoBolsillo,

  validar,

  bolsillosController.actualizarEstadoBolsillo
);

module.exports = router;
