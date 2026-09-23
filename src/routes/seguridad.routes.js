const express = require("express");

const router = express.Router();

/**
 * @openapi
 * /api/seguridad/cliente:
 *   get:
 *
 *     tags:
 *       - Seguridad
 *
 *     summary:
 *       Obtener información del cliente autenticado
 *
 *     description:
 *       Retorna la identidad asociada a la API Key utilizada.
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Cliente autenticado correctamente
 *
 *       401:
 *         description:
 *           API Key ausente o inválida
 *
 *       403:
 *         description:
 *           API Key deshabilitada
 */
router.get("/cliente", (req, res) => {
  return res.status(200).json({
    mensaje: "Cliente autenticado",
    cliente: req.clienteApi
  });
});

module.exports = router;
