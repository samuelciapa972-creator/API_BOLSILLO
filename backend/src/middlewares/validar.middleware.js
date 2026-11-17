const {
  validationResult
} = require("express-validator");

const validar = (
  req,
  res,
  next
) => {
  const errores =
    validationResult(req);

  if (!errores.isEmpty()) {
    return res
      .status(400)
      .json({
        mensaje:
          "Datos de entrada inválidos",

        // Proyecto final (SAST manual): no se
        // devuelve `value`. express-validator lo
        // incluye por defecto y reflejaba en la
        // respuesta lo enviado, incluidas
        // contraseñas, códigos y tokens (CWE-209).
        errores:
          errores
            .array()
            .map((error) => ({
              campo: error.path,
              ubicacion: error.location,
              msg: error.msg
            }))
      });
  }

  next();
};

module.exports = validar;