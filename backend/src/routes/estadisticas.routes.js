const express = require("express");

const router = express.Router();

const estadisticasController = require(
  "../controllers/estadisticas.controller"
);

const autenticarJWT = require(
  "../middlewares/auth.middleware"
);

const autorizarRoles = require(
  "../middlewares/roles.middleware"
);

/**
 * @openapi
 * /api/estadisticas/resumen:
 *   get:
 *     summary: Indicadores agregados para el panel (solo administrador y auditor)
 *     description:
 *       Totales de usuarios, cuentas, bolsillos y transacciones. No devuelve
 *       datos personales. Un cliente recibe 403.
 *     tags:
 *       - Estadísticas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen calculado en PostgreSQL
 *       401:
 *         description: Sin JWT o JWT inválido
 *       403:
 *         description: Rol sin permiso
 */
router.get(
  "/resumen",

  autenticarJWT,

  autorizarRoles(
    "administrador",
    "auditor"
  ),

  estadisticasController.obtenerResumen
);

module.exports = router;
