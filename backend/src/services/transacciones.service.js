const {
  consultar,
  ejecutarTransaccion
} = require(
  "../config/database"
);

const cuentasService =
  require(
    "./cuentas.service"
  );

const {
  ErrorNegocio
} = require(
  "../utils/errores"
);

// ========================================
// Columnas devueltas (camelCase)
// ========================================
const COLUMNAS_TRANSACCION = `
  id,
  tipo,
  cuenta_origen_id AS "cuentaOrigenId",
  cuenta_destino_id AS "cuentaDestinoId",
  bolsillo_id AS "bolsilloId",
  monto,
  descripcion,
  fecha,
  estado
`;

const obtenerTransacciones = async () => {
  const resultado =
    await consultar(
      `SELECT ${COLUMNAS_TRANSACCION}
       FROM public.transacciones
       ORDER BY id`
    );

  return resultado.rows;
};

const obtenerTransaccionPorId = async (
  id
) => {
  const resultado =
    await consultar(
      `SELECT ${COLUMNAS_TRANSACCION}
       FROM public.transacciones
       WHERE id = $1`,
      [id]
    );

  return resultado.rows[0] ?? null;
};

const obtenerTransaccionesPorCuenta = async (
  cuentaId
) => {
  const resultado =
    await consultar(
      `SELECT ${COLUMNAS_TRANSACCION}
       FROM public.transacciones
       WHERE cuenta_origen_id = $1
          OR cuenta_destino_id = $1
       ORDER BY id`,
      [cuentaId]
    );

  return resultado.rows;
};

// ========================================
// Integridad referencial
// La FK transacciones.bolsillo_id impide
// igualmente el DELETE; esto permite un
// mensaje claro antes de intentarlo
// ========================================

const bolsilloTieneTransacciones = async (
  bolsilloId
) => {
  const resultado =
    await consultar(
      `SELECT EXISTS (
         SELECT 1 FROM public.transacciones
         WHERE bolsillo_id = $1
       ) AS "existe"`,
      [bolsilloId]
    );

  return resultado.rows[0].existe;
};

// ========================================
// Registrar la transacción (libro contable)
// Siempre con `bd` de la transacción SQL
// que movió el dinero: o se guardan ambos
// o ninguno (regla 12)
// ========================================
const crearTransaccion = async (
  datos,
  bd
) => {
  const resultado =
    await bd.query(
      `INSERT INTO public.transacciones
         (tipo, cuenta_origen_id, cuenta_destino_id,
          bolsillo_id, monto, descripcion)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${COLUMNAS_TRANSACCION}`,
      [
        datos.tipo,
        datos.cuentaOrigenId ?? null,
        datos.cuentaDestinoId ?? null,
        datos.bolsilloId ?? null,
        datos.monto,
        datos.descripcion ?? null
      ]
    );

  return resultado.rows[0];
};

// ========================================
// Movimientos de dinero
// Cada uno es UNA transacción SQL:
//   BEGIN → bloquear cuenta(s) FOR UPDATE →
//   validar sobre las filas bloqueadas →
//   mover saldo → registrar transacción →
//   COMMIT
// Cualquier ErrorNegocio (o error SQL)
// provoca ROLLBACK: no queda nada a medias.
// ========================================

const realizarDeposito = async (
  datos
) => {
  return ejecutarTransaccion(async (bd) => {
    const [cuentaDestino] =
      await cuentasService.bloquearCuentas(
        [datos.cuentaDestinoId],
        bd
      );

    if (!cuentaDestino) {
      throw new ErrorNegocio(
        400,
        "La cuenta destino no existe"
      );
    }

    if (cuentaDestino.estado !== "activa") {
      throw new ErrorNegocio(
        409,
        "La cuenta destino no está activa"
      );
    }

    await cuentasService.registrarDeposito(
      cuentaDestino.id,
      datos.monto,
      bd
    );

    return crearTransaccion(
      {
        tipo: "deposito",
        cuentaDestinoId: cuentaDestino.id,
        monto: datos.monto,
        descripcion: datos.descripcion
      },
      bd
    );
  });
};

// Regla 3: se valida contra el disponible,
// nunca contra el total
const realizarRetiro = async (
  datos
) => {
  return ejecutarTransaccion(async (bd) => {
    const [cuentaOrigen] =
      await cuentasService.bloquearCuentas(
        [datos.cuentaOrigenId],
        bd
      );

    if (!cuentaOrigen) {
      throw new ErrorNegocio(
        400,
        "La cuenta origen no existe"
      );
    }

    if (cuentaOrigen.estado !== "activa") {
      throw new ErrorNegocio(
        409,
        "La cuenta origen no está activa"
      );
    }

    const saldoDisponible =
      await cuentasService.calcularSaldoDisponible(
        cuentaOrigen.id,
        bd
      );

    if (saldoDisponible < datos.monto) {
      throw new ErrorNegocio(
        409,
        "El saldo disponible de la cuenta no alcanza para el retiro"
      );
    }

    await cuentasService.registrarRetiro(
      cuentaOrigen.id,
      datos.monto,
      bd
    );

    return crearTransaccion(
      {
        tipo: "retiro",
        cuentaOrigenId: cuentaOrigen.id,
        monto: datos.monto,
        descripcion: datos.descripcion
      },
      bd
    );
  });
};

// Regla 4: ambas cuentas deben existir,
// ser distintas y estar activas
const realizarTransferencia = async (
  datos
) => {
  return ejecutarTransaccion(async (bd) => {
    const [cuentaOrigen, cuentaDestino] =
      await cuentasService.bloquearCuentas(
        [
          datos.cuentaOrigenId,
          datos.cuentaDestinoId
        ],
        bd
      );

    if (!cuentaOrigen) {
      throw new ErrorNegocio(
        400,
        "La cuenta origen no existe"
      );
    }

    if (!cuentaDestino) {
      throw new ErrorNegocio(
        400,
        "La cuenta destino no existe"
      );
    }

    if (cuentaOrigen.id === cuentaDestino.id) {
      throw new ErrorNegocio(
        409,
        "La cuenta origen y la cuenta destino deben ser distintas"
      );
    }

    if (
      cuentaOrigen.estado !== "activa" ||
      cuentaDestino.estado !== "activa"
    ) {
      throw new ErrorNegocio(
        409,
        "Ambas cuentas deben estar activas"
      );
    }

    const saldoDisponible =
      await cuentasService.calcularSaldoDisponible(
        cuentaOrigen.id,
        bd
      );

    if (saldoDisponible < datos.monto) {
      throw new ErrorNegocio(
        409,
        "El saldo disponible de la cuenta origen no alcanza para la transferencia"
      );
    }

    await cuentasService.registrarRetiro(
      cuentaOrigen.id,
      datos.monto,
      bd
    );

    await cuentasService.registrarDeposito(
      cuentaDestino.id,
      datos.monto,
      bd
    );

    return crearTransaccion(
      {
        tipo: "transferencia",
        cuentaOrigenId: cuentaOrigen.id,
        cuentaDestinoId: cuentaDestino.id,
        monto: datos.monto,
        descripcion: datos.descripcion
      },
      bd
    );
  });
};

module.exports = {
  obtenerTransacciones,
  obtenerTransaccionPorId,
  obtenerTransaccionesPorCuenta,
  bolsilloTieneTransacciones,
  crearTransaccion,
  realizarDeposito,
  realizarRetiro,
  realizarTransferencia
};
