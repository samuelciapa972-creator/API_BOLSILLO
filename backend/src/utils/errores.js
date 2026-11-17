// ========================================
// Error de regla de negocio
// Se lanza desde los services cuando una
// validación falla DENTRO de una
// transacción SQL: el throw provoca el
// ROLLBACK y el middleware global responde
// con `status` y `mensaje` (sin stack).
// ========================================
class ErrorNegocio extends Error {
  constructor(status, mensaje) {
    super(mensaje);

    this.name = "ErrorNegocio";
    this.status = status;
  }
}

module.exports = {
  ErrorNegocio
};
