const {
  consultar
} = require(
  "../config/database"
);

const {
  redondearMoneda
} = require(
  "../utils/comunes"
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
// Bloquear cuentas (SELECT ... FOR UPDATE)
// Solo dentro de ejecutarTransaccion. Hasta
// el COMMIT, ninguna otra operación puede
// modificar estas cuentas ni sus bolsillos
// (todas bloquean la cuenta primero), así
// que el saldo disponible validado es el
// que se debita.
//
// Se bloquean en orden de id para que dos
// transferencias cruzadas (A→B y B→A) no
// se bloqueen mutuamente (deadlock).
// Devuelve las cuentas en el orden pedido;
// null si alguna no existe.
// ========================================
const bloquearCuentas = async (
  ids,
  bd
) => {
  const resultado =
    await bd.query(
      `SELECT ${COLUMNAS_CUENTA}
       FROM public.cuentas
       WHERE id = ANY($1::BIGINT[])
       ORDER BY id
       FOR UPDATE`,
      [ids]
    );

  return ids.map(
    (id) =>
      resultado.rows.find(
        (cuenta) => cuenta.id === Number(id)
      ) ?? null
  );
};

// ========================================
// Función central del dominio
// Ningún débito debe escribirse sin pasar
// por aquí
// Saldo apartado = suma de los bolsillos
// ACTIVOS de la cuenta (en SQL, NUMERIC)
// ========================================

const calcularSaldoApartado = async (
  cuentaId,
  bd = null
) => {
  const resultado =
    await ejecutar(
      bd,
      `SELECT COALESCE(SUM(saldo), 0)::NUMERIC(14, 2) AS "saldoApartado"
       FROM public.bolsillos
       WHERE cuenta_id = $1
         AND estado = 'activo'`,
      [cuentaId]
    );

  return resultado.rows[0].saldoApartado;
};

// Dentro de una transacción, pasar `bd`
// DESPUÉS de bloquearCuentas()
const calcularSaldoDisponible = async (
  cuentaId,
  bd = null
) => {
  const cuenta =
    await obtenerCuentaPorId(
      cuentaId,
      bd
    );

  if (
    !cuenta
  ) {
    return null;
  }

  const saldoApartado =
    await calcularSaldoApartado(
      cuentaId,
      bd
    );

  return redondearMoneda(
    cuenta.saldoTotal -
    saldoApartado
  );
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
  bloquearCuentas,
  calcularSaldoApartado,
  calcularSaldoDisponible,
  crearCuenta,
  registrarDeposito,
  registrarRetiro,
  actualizarEstadoCuenta
};
