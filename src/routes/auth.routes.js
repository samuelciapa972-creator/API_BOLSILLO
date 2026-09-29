const express = require("express");

const router = express.Router();

const {
  registrar,
  login
} = require(
  "../controllers/auth.controller"
);

const {
  validarRegistro,
  validarLogin
} = require(
  "../middlewares/auth.validator"
);

const validar = require(
  "../middlewares/validar.middleware"
);

/**
 * @openapi
 * components:
 *   schemas:
 *
 *     RegistroUsuario:
 *       type: object
 *
 *       required:
 *         - nombre
 *         - email
 *         - password
 *
 *       properties:
 *
 *         nombre:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: Cliente Bolsillo
 *
 *         email:
 *           type: string
 *           format: email
 *           example: cliente@bolsillo.com
 *
 *         password:
 *           type: string
 *           format: password
 *           minLength: 10
 *           maxLength: 72
 *           example: ClaveSegura2026!
 *
 *     LoginUsuario:
 *       type: object
 *
 *       required:
 *         - email
 *         - password
 *
 *       properties:
 *
 *         email:
 *           type: string
 *           format: email
 *           example: cliente@bolsillo.com
 *
 *         password:
 *           type: string
 *           format: password
 *           example: ClaveSegura2026!
 */

/**
 * @openapi
 * /api/auth/registro:
 *   post:
 *
 *     tags:
 *       - Autenticación
 *
 *     summary:
 *       Registrar un nuevo usuario
 *
 *     description: >
 *       Registra un nuevo usuario utilizando bcrypt para proteger
 *       la contraseña. El rol es asignado por el servidor ("cliente")
 *       y no puede ser definido por el cliente.
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegistroUsuario'
 *
 *     responses:
 *
 *       201:
 *         description:
 *           Usuario registrado correctamente
 *
 *       400:
 *         description:
 *           Datos inválidos
 *
 *       401:
 *         description:
 *           API Key ausente o inválida
 *
 *       409:
 *         description:
 *           Correo electrónico ya registrado
 */
router.post(
  "/registro",
  validarRegistro,
  validar,
  registrar
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *
 *     tags:
 *       - Autenticación
 *
 *     summary:
 *       Iniciar sesión
 *
 *     description:
 *       Verifica email y contraseña. En este bloque todavía no genera JWT.
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginUsuario'
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Credenciales correctas
 *
 *       400:
 *         description:
 *           Datos inválidos
 *
 *       401:
 *         description:
 *           Credenciales inválidas
 *
 *       403:
 *         description:
 *           Usuario deshabilitado
 */
router.post(
  "/login",
  validarLogin,
  validar,
  login
);

module.exports = router;
