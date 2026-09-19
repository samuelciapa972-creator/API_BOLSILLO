const express = require("express");

const router = express.Router();

const usuariosController = require(
  "../controllers/usuarios.controller"
);

const {
  validarIdUsuario,
  validarCreacionUsuario,
  validarActualizacionUsuario
} = require(
  "../middlewares/usuarios.validator"
);

const validar = require(
  "../middlewares/validar.middleware"
);

/**
 * @openapi
 * components:
 *   schemas:
 *
 *     Usuario:
 *       type: object
 *       properties:
 *
 *         id:
 *           type: integer
 *           example: 1
 *
 *         nombre:
 *           type: string
 *           example: Ana Ruiz
 *
 *         documento:
 *           type: string
 *           example: "1057234891"
 *
 *         email:
 *           type: string
 *           format: email
 *           example: ana.ruiz@example.com
 *
 *         telefono:
 *           type: string
 *           example: "3124567890"
 *
 *         estado:
 *           type: string
 *           enum: [activo, inactivo]
 *           example: activo
 *
 *     UsuarioEntrada:
 *       type: object
 *
 *       required:
 *         - nombre
 *         - documento
 *         - email
 *         - telefono
 *
 *       properties:
 *
 *         nombre:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: María Rodríguez
 *
 *         documento:
 *           type: string
 *           pattern: '^[0-9]{6,15}$'
 *           example: "1056789012"
 *
 *         email:
 *           type: string
 *           format: email
 *           example: maria@example.com
 *
 *         telefono:
 *           type: string
 *           pattern: '^3[0-9]{9}$'
 *           example: "3151234567"
 *
 *         estado:
 *           type: string
 *           enum: [activo, inactivo]
 *           description: Solo se usa al reemplazar el usuario completo (PUT). En creación se ignora si se envía, todo usuario nace "activo".
 *           example: activo
 */

/**
 * @openapi
 * /api/usuarios:
 *   get:
 *
 *     tags:
 *       - Usuarios
 *
 *     summary:
 *       Obtener todos los usuarios
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Lista de usuarios
 *
 *         content:
 *           application/json:
 *
 *             schema:
 *               type: array
 *
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 */
router.get(
  "/",
  usuariosController.obtenerUsuarios
);

/**
 * @openapi
 * /api/usuarios/{id}:
 *   get:
 *
 *     tags:
 *       - Usuarios
 *
 *     summary:
 *       Obtener usuario por ID
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
 *           Usuario encontrado
 *
 *         content:
 *           application/json:
 *
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *
 *       400:
 *         description:
 *           ID inválido
 *
 *       404:
 *         description:
 *           Usuario no encontrado
 */
router.get(
  "/:id",

  validarIdUsuario,

  validar,

  usuariosController.obtenerUsuarioPorId
);

/**
 * @openapi
 * /api/usuarios/{id}/cuentas:
 *   get:
 *
 *     tags:
 *       - Usuarios
 *
 *     summary:
 *       Obtener las cuentas de un usuario
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
 *           Lista de cuentas del usuario
 *
 *         content:
 *           application/json:
 *
 *             schema:
 *               type: array
 *
 *               items:
 *                 $ref: '#/components/schemas/Cuenta'
 *
 *       400:
 *         description:
 *           ID inválido
 *
 *       404:
 *         description:
 *           Usuario no encontrado
 */
router.get(
  "/:id/cuentas",

  validarIdUsuario,

  validar,

  usuariosController.obtenerCuentasDeUsuario
);

/**
 * @openapi
 * /api/usuarios:
 *   post:
 *
 *     tags:
 *       - Usuarios
 *
 *     summary:
 *       Crear un usuario
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *
 *           schema:
 *             $ref: '#/components/schemas/UsuarioEntrada'
 *
 *     responses:
 *
 *       201:
 *         description:
 *           Usuario creado correctamente
 *
 *       400:
 *         description:
 *           Datos inválidos
 *
 *       409:
 *         description:
 *           Ya existe un usuario con ese documento o email
 */
router.post(
  "/",

  validarCreacionUsuario,

  validar,

  usuariosController.crearUsuario
);

/**
 * @openapi
 * /api/usuarios/{id}:
 *   put:
 *
 *     tags:
 *       - Usuarios
 *
 *     summary:
 *       Actualizar completamente un usuario
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
 *             allOf:
 *               - $ref: '#/components/schemas/UsuarioEntrada'
 *               - required: [estado]
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Usuario actualizado correctamente
 *
 *       400:
 *         description:
 *           Datos inválidos
 *
 *       404:
 *         description:
 *           Usuario no encontrado
 *
 *       409:
 *         description:
 *           El documento o el email pertenecen a otro usuario
 */
router.put(
  "/:id",

  validarIdUsuario,

  validarActualizacionUsuario,

  validar,

  usuariosController.actualizarUsuario
);

/**
 * @openapi
 * /api/usuarios/{id}:
 *   delete:
 *
 *     tags:
 *       - Usuarios
 *
 *     summary:
 *       Eliminar usuario
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
 *           Usuario eliminado correctamente
 *
 *       400:
 *         description:
 *           ID inválido
 *
 *       404:
 *         description:
 *           Usuario no encontrado
 *
 *       409:
 *         description:
 *           No se puede eliminar un usuario con cuentas asociadas
 */
router.delete(
  "/:id",

  validarIdUsuario,

  validar,

  usuariosController.eliminarUsuario
);

module.exports = router;
