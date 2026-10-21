const bolsillos =
  require(
    "../data/bolsillos"
  );

const {
  consultar
} = require(
  "../config/database"
);

// ========================================
// Columnas devueltas (camelCase)
// ========================================
const COLUMNAS_CUENTA = `
  id,
  usuario_id AS "usuarioId",
  numero_cuenta AS "numeroCuenta",
  saldo_total AS "saldoTotal",
  moneda,
  estado
`;

// ========================================
// Ejecutor de consultas
// Sin `bd`, usa el pool. Con `bd` (el
// cliente de ejecutarTransaccion), la
// consulta forma parte de esa transacción.
// ========================================
const ejecutar = (
  bd,
  sql,
  parametros
) => {
  return bd
    ? bd.query(sql, parametros)
    : consultar(sql, parametros);
};

const obtenerCuentas = async () => {
  const resultado =
    await consultar(
      `SELECT ${COLUMNAS_CUENTA}
       FROM public.cuentas
       ORDER BY id`
    );

  return resultado.rows;
};

const obtenerCuentaPorId = async (
  id,
  bd = null
) => {
  const resultado =
    await ejecutar(
      bd,
      `SELECT ${COLUMNAS_CUENTA}
       FROM public.cuentas
       WHERE id = $1`,
      [id]
    );

  return resultado.rows[0] ?? null;
};

const obtenerCuentasPorUsuario = async (
  usuarioId
) => {
  const resultado =
    await consultar(
      `SELECT ${COLUMNAS_CUENTA}
       FROM public.cuentas
       WHERE usuario_id = $1
       ORDER BY id`,
      [usuarioId]
    );

  return resultado.rows;
};

// ========================================
// Función central del dominio
// Ningún débito debe escribirse sin pasar
// por aquí
//
// Transitorio (7.5 paso 1): los bolsillos
// siguen en memoria, así que el saldo
// apartado se calcula con ellos. En el
// paso 2 pasa a SQL.
// ========================================

const calcularSaldoApartado = async (
  cuentaId
) => {
  return bolsillos
    .filter(
      bolsillo =>
        bolsillo.cuentaId === Number(cuentaId) &&
        bolsillo.estado === "activo"
    )
    .reduce(
      (total, bolsillo) =>
        total + bolsillo.saldo,
      0
    );
};

const calcularSaldoDisponible = async (
  cuentaId
) => {
  const cuenta =
    await obtenerCuentaPorId(
      cuentaId
    );

  if (
    !cuenta
  ) {
    return null;
  }

  const saldoApartado =
    await calcularSaldoApartado(
      cuentaId
    );

  return cuenta.saldoTotal -
    saldoApartado;
};

// ========================================
// Crear
// numero_cuenta, saldo_total (0), moneda
// (COP) y estado (activa) los fija la base
// de datos, nunca el cliente
// ========================================
const crearCuenta = async (
  datos
) => {
  const resultado =
    await consultar(
      `INSERT INTO public.cuentas (usuario_id)
       VALUES ($1)
       RETURNING ${COLUMNAS_CUENTA}`,
      [datos.usuarioId]
    );

  return resultado.rows[0];
};

// ========================================
// Movimientos de saldo
// La suma y la resta se hacen en SQL
// (NUMERIC), no en JavaScript. El CHECK
// saldo_total >= 0 impide dejar la cuenta
// en negativo aunque falle la validación
// previa.
// ========================================
const registrarDeposito = async (
  cuentaId,
  monto,
  bd = null
) => {
  const resultado =
    await ejecutar(
      bd,
      `UPDATE public.cuentas
       SET saldo_total = saldo_total + $2
       WHERE id = $1
       RETURNING ${COLUMNAS_CUENTA}`,
      [cuentaId, monto]
    );

  return resultado.rows[0] ?? null;
};

const registrarRetiro = async (
  cuentaId,
  monto,
  bd = null
) => {
  const resultado =
    await ejecutar(
      bd,
      `UPDATE public.cuentas
       SET saldo_total = saldo_total - $2
       WHERE id = $1
       RETURNING ${COLUMNAS_CUENTA}`,
      [cuentaId, monto]
    );

  return resultado.rows[0] ?? null;
};

const actualizarEstadoCuenta = async (
  id,
  nuevoEstado
) => {
  const resultado =
    await consultar(
      `UPDATE public.cuentas
       SET estado = $2
       WHERE id = $1
       RETURNING ${COLUMNAS_CUENTA}`,
      [id, nuevoEstado]
    );

  return resultado.rows[0] ?? null;
};

module.exports = {
  obtenerCuentas,
  obtenerCuentaPorId,
  obtenerCuentasPorUsuario,
  calcularSaldoApartado,
  calcularSaldoDisponible,
  crearCuenta,
  registrarDeposito,
  registrarRetiro,
  actualizarEstadoCuenta
};
