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

const autenticarJWT = require(
  "../middlewares/auth.middleware"
);

const autorizarRoles = require(
  "../middlewares/roles.middleware"
);

const {
  autorizarUsuarioPropio
} = require(
  "../middlewares/propiedad.middleware"
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
 *         usuarioAuthId:
 *           type: integer
 *           nullable: true
 *           description: Usuario de acceso (login con rol cliente) dueño de este titular
 *           example: 2
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
 *         usuarioAuthId:
 *           type: integer
 *           nullable: true
 *           minimum: 1
 *           description: Asocia el titular con un usuario de acceso de rol cliente (1 a 1). Solo administrador.
 *           example: 2
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

  autenticarJWT,

  autorizarRoles(
    "administrador",
    "auditor"
  ),

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
 *     description:
 *       Roles — administrador, auditor (solo lectura), cliente. Propiedad del recurso (BOLA/IDOR) — el cliente solo su propio titular.
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

  autenticarJWT,

  autorizarRoles(
    "administrador",
    "auditor",
    "cliente"
  ),

  validarIdUsuario,

  validar,

  autorizarUsuarioPropio,

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
 *     description:
 *       Roles — administrador, auditor (solo lectura), cliente. Propiedad del recurso (BOLA/IDOR) — el cliente solo su propio titular.
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

  autenticarJWT,

  autorizarRoles(
    "administrador",
    "auditor",
    "cliente"
  ),

  validarIdUsuario,

  validar,

  autorizarUsuarioPropio,

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
 *     description:
 *       Roles — administrador.
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

  autenticarJWT,

  autorizarRoles(
    "administrador"
  ),

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
 *     description:
 *       Roles — administrador.
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

  autenticarJWT,

  autorizarRoles(
    "administrador"
  ),

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
 *     description:
 *       Roles — administrador.
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

  autenticarJWT,

  autorizarRoles(
    "administrador"
  ),

  validarIdUsuario,

  validar,

  usuariosController.eliminarUsuario
);

module.exports = router;
