const express = require("express");

const router = express.Router();

const {
  registrar,
  login,
  crearUsuarioAdministrativo,
  cambiarPassword,
  generarRecuperacionAdmin,
  restablecerPassword,
  generarCodigos,
  estadoCodigos,
  restablecerConCodigo
} = require(
  "../controllers/auth.controller"
);

const {
  validarRegistro,
  validarLogin,
  validarCreacionUsuarioAdministrativo,
  validarCambioPassword,
  validarGenerarRecuperacion,
  validarRestablecimiento,
  validarGenerarCodigos,
  validarRestablecerConCodigo
} = require(
  "../middlewares/auth.validator"
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
  rateLimit
} = require("express-rate-limit");


// ========================================
// Límites específicos (Bloque 11)
// Se suman al límite global de /api.
// ========================================

// Login público: solo cuentan los intentos
// fallidos (fuerza bruta), no los correctos
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false
  },
  message: {
    mensaje: "Demasiados intentos. Intente más tarde."
  }
});

// Recuperación y códigos de respaldo
const limiteReset = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false
  },
  message: {
    mensaje: "Demasiados intentos. Intente más tarde."
  }
});

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
 *       y no puede ser definido por el cliente. Exige API Key.
 *
 *     security:
 *       - ApiKeyAuth: []
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
 *     description: >
 *       Verifica email y contraseña. Si son correctas devuelve un JWT
 *       (firmado con HS256) que se usa como Bearer Token en los
 *       endpoints que identifican al usuario. Es público: no exige
 *       API Key (no se expone una clave privada en la futura SPA
 *       React) ni JWT; mantiene validaciones y rate limit.
 *
 *     security: []
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
 *           Credenciales correctas; incluye el token JWT
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
  limiteLogin,
  validarLogin,
  validar,
  login
);

/**
 * @openapi
 * /api/auth/perfil:
 *   get:
 *
 *     tags:
 *       - Autenticación
 *
 *     summary:
 *       Obtener perfil del usuario autenticado
 *
 *     description:
 *       Requiere un JWT válido (BearerAuth). No exige API Key.
 *
 *     security:
 *       - BearerAuth: []
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Usuario autenticado correctamente
 *
 *       401:
 *         description:
 *           Credenciales de autenticación ausentes o inválidas
 */
router.get(
  "/perfil",
  autenticarJWT,
  (req, res) => {
    return res.status(200).json({
      mensaje:
        "Usuario autenticado mediante JWT",

      usuario: req.usuario,

      clienteApi: req.clienteApi
    });
  }
);

/**
 * @openapi
 * components:
 *   schemas:
 *
 *     UsuarioAdministrativoEntrada:
 *       type: object
 *
 *       required:
 *         - nombre
 *         - email
 *         - password
 *         - rol
 *
 *       properties:
 *
 *         nombre:
 *           type: string
 *           example: Auditor Bolsillo
 *
 *         email:
 *           type: string
 *           format: email
 *           example: auditor@bolsillo.com
 *
 *         password:
 *           type: string
 *           format: password
 *           example: ClaveAuditor2026!
 *
 *         rol:
 *           type: string
 *           enum: [auditor, administrador]
 *           example: auditor
 */

/**
 * @openapi
 * /api/auth/usuarios:
 *   post:
 *
 *     tags:
 *       - Autenticación
 *
 *     summary:
 *       Crear usuario privilegiado (auditor o administrador)
 *
 *     description:
 *       Solo un administrador autenticado puede crear usuarios con rol
 *       auditor o administrador. Los clientes se crean con /api/auth/registro.
 *       Campos como activo, passwordHash o id se ignoran.
 *
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *
 *           schema:
 *             $ref: '#/components/schemas/UsuarioAdministrativoEntrada'
 *
 *     responses:
 *
 *       201:
 *         description:
 *           Usuario creado correctamente
 *
 *       400:
 *         description:
 *           Datos inválidos (incluye un rol no permitido)
 *
 *       401:
 *         $ref: '#/components/responses/NoAutenticado'
 *
 *       403:
 *         $ref: '#/components/responses/SinPermisos'
 *
 *       409:
 *         description:
 *           Correo electrónico ya registrado
 */
router.post(
  "/usuarios",

  // Primero ¿puede hacerlo?, luego los datos
  autenticarJWT,

  autorizarRoles(
    "administrador"
  ),

  validarCreacionUsuarioAdministrativo,

  validar,

  crearUsuarioAdministrativo
);

// ========================================
// BLOQUE 11 - Contraseñas y recuperación
// ========================================

/**
 * @openapi
 * /api/auth/cambiar-password:
 *   patch:
 *     tags:
 *       - Autenticación
 *     summary:
 *       Cambiar la contraseña propia y revocar los JWT anteriores
 *     description: >
 *       Comprueba la contraseña actual, guarda un nuevo hash bcrypt e
 *       incrementa version_sesion. Los JWT emitidos antes responden 401.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [passwordActual, passwordNueva, confirmarPassword]
 *             properties:
 *               passwordActual:
 *                 type: string
 *                 format: password
 *               passwordNueva:
 *                 type: string
 *                 format: password
 *                 description: 12-72 caracteres con mayúscula, minúscula y número
 *               confirmarPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Contraseña cambiada y JWT anteriores revocados
 *       400:
 *         description: Datos inválidos o contraseña reutilizada
 *       401:
 *         description: JWT inválido/revocado o contraseña actual incorrecta
 *       409:
 *         description: Cambio concurrente de contraseña
 */
router.patch(
  "/cambiar-password",
  autenticarJWT,
  validarCambioPassword,
  validar,
  cambiarPassword
);

/**
 * @openapi
 * /api/auth/recuperacion/admin/{usuarioId}:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary:
 *       Administrador autoriza recuperación y emite un token de un solo uso
 *     description: >
 *       Verificar antes la identidad del titular por un procedimiento
 *       externo autorizado. El token se devuelve una sola vez, vence en
 *       15 minutos y en la base de datos solo se guarda su hash.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         description: ID en usuarios_auth de la cuenta que recupera acceso
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       201:
 *         description: Token temporal generado
 *       401:
 *         $ref: '#/components/responses/NoAutenticado'
 *       403:
 *         $ref: '#/components/responses/SinPermisos'
 *       404:
 *         description: Usuario inexistente o inactivo
 */
router.post(
  "/recuperacion/admin/:usuarioId",
  autenticarJWT,
  autorizarRoles(
    "administrador"
  ),
  limiteReset,
  validarGenerarRecuperacion,
  validar,
  generarRecuperacionAdmin
);

/**
 * @openapi
 * /api/auth/restablecer-password:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary:
 *       Restablecer la contraseña con el token temporal
 *     description: >
 *       Consume el token (un solo uso), cambia la contraseña e invalida
 *       las sesiones anteriores. Todavía exige API Key: no está
 *       preparada para el navegador (React).
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, passwordNueva, confirmarPassword]
 *             properties:
 *               token:
 *                 type: string
 *                 description: 64 caracteres hexadecimales
 *               passwordNueva:
 *                 type: string
 *                 format: password
 *               confirmarPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Contraseña restablecida y sesiones previas revocadas
 *       400:
 *         description: Token inválido, utilizado o expirado, o datos incorrectos
 *       401:
 *         description: API Key ausente o inválida
 *       429:
 *         description: Demasiados intentos
 */
router.post(
  "/restablecer-password",
  limiteReset,
  validarRestablecimiento,
  validar,
  restablecerPassword
);

/**
 * @openapi
 * /api/auth/codigos-recuperacion:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary:
 *       Generar ocho códigos de respaldo (invalida los anteriores)
 *     description: >
 *       Exige la contraseña actual (reautenticación). Los códigos se
 *       muestran una sola vez; solo se guarda su hash.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [passwordActual]
 *             properties:
 *               passwordActual:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Ocho códigos visibles una sola vez
 *       401:
 *         description: JWT o contraseña actual inválidos
 */
router.post(
  "/codigos-recuperacion",
  autenticarJWT,
  limiteReset,
  validarGenerarCodigos,
  validar,
  generarCodigos
);

/**
 * @openapi
 * /api/auth/codigos-recuperacion/estado:
 *   get:
 *     tags:
 *       - Autenticación
 *     summary:
 *       Consultar cuántos códigos de respaldo quedan disponibles
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cantidad disponible
 *       401:
 *         $ref: '#/components/responses/NoAutenticado'
 */
router.get(
  "/codigos-recuperacion/estado",
  autenticarJWT,
  estadoCodigos
);

/**
 * @openapi
 * /api/auth/codigos-recuperacion/regenerar:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary:
 *       Revocar los códigos anteriores y generar ocho nuevos
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [passwordActual]
 *             properties:
 *               passwordActual:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Nuevos códigos generados
 *       401:
 *         description: JWT o contraseña actual inválidos
 */
router.post(
  "/codigos-recuperacion/regenerar",
  autenticarJWT,
  limiteReset,
  validarGenerarCodigos,
  validar,
  generarCodigos
);

/**
 * @openapi
 * /api/auth/restablecer-con-codigo:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary:
 *       Recuperar la contraseña con un código de respaldo de un solo uso
 *     description: >
 *       Todavía exige API Key: no está preparada para el navegador.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, codigo, passwordNueva, confirmarPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               codigo:
 *                 type: string
 *                 example: ABCD-1234-ABCD-1234-ABCD-1234-ABCD-1234
 *               passwordNueva:
 *                 type: string
 *                 format: password
 *               confirmarPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Contraseña restablecida
 *       400:
 *         description: Código o datos inválidos
 *       401:
 *         description: API Key ausente o inválida
 *       429:
 *         description: Demasiados intentos
 */
router.post(
  "/restablecer-con-codigo",
  limiteReset,
  validarRestablecerConCodigo,
  validar,
  restablecerConCodigo
);

module.exports = router;
