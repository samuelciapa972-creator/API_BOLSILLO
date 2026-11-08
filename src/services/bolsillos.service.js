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

const transaccionesService =
  require(
    "./transacciones.service"
  );

const {
  ErrorNegocio
} = require(
  "../utils/errores"
);

const MAXIMO_BOLSILLOS_POR_CUENTA = 10;

// ========================================
// Columnas devueltas (camelCase)
// ========================================
const COLUMNAS_BOLSILLO = `
  id,
  cuenta_id AS "cuentaId",
  nombre,
  meta,
  saldo,
  fecha_creacion AS "fechaCreacion",
  estado
`;

// Ver cuentas.service.js
const ejecutar = (
  bd,
  sql,
  parametros
) => {
  return bd
    ? bd.query(sql, parametros)
    : consultar(sql, parametros);
};

const obtenerBolsillos = async () => {
  const resultado =
    await consultar(
      `SELECT ${COLUMNAS_BOLSILLO}
       FROM public.bolsillos
       ORDER BY id`
    );

  return resultado.rows;
};

// Con `bloquear`, la fila queda bloqueada
// hasta el fin de la transacción `bd`
const obtenerBolsilloPorId = async (
  id,
  bd = null,
  bloquear = false
) => {
  const resultado =
    await ejecutar(
      bd,
      `SELECT ${COLUMNAS_BOLSILLO}
       FROM public.bolsillos
       WHERE id = $1
       ${bloquear ? "FOR UPDATE" : ""}`,
      [id]
    );

  return resultado.rows[0] ?? null;
};

const obtenerBolsillosPorCuenta = async (
  cuentaId
) => {
  const resultado =
    await consultar(
      `SELECT ${COLUMNAS_BOLSILLO}
       FROM public.bolsillos
       WHERE cuenta_id = $1
       ORDER BY id`,
      [cuentaId]
    );

  return resultado.rows;
};

// Sin distinguir mayúsculas, igual que el
// índice uq_bolsillos_cuenta_nombre_ci
const buscarBolsilloPorNombreYCuenta = async (
  nombre,
  cuentaId,
  bd = null
) => {
  const resultado =
    await ejecutar(
      bd,
      `SELECT ${COLUMNAS_BOLSILLO}
       FROM public.bolsillos
       WHERE cuenta_id = $1
         AND LOWER(nombre) = LOWER($2)`,
      [cuentaId, nombre]
    );

  return resultado.rows[0] ?? null;
};

const contarBolsillosPorCuenta = async (
  cuentaId,
  bd = null
) => {
  const resultado =
    await ejecutar(
      bd,
      `SELECT COUNT(*) AS "total"
       FROM public.bolsillos
       WHERE cuenta_id = $1`,
      [cuentaId]
    );

  return resultado.rows[0].total;
};

// ========================================
// Crear
// Regla 6: la cuenta debe estar activa
// Regla 10: nombre único, máximo 10 por
// cuenta
// La cuenta se bloquea: dos creaciones
// simultáneas no pueden superar el máximo
// (el conteo y el INSERT son atómicos).
// saldo (0), fecha y estado (activo) los
// fija la base de datos.
// ========================================
const crearBolsillo = async (
  datos
) => {
  return ejecutarTransaccion(async (bd) => {
    const [cuenta] =
      await cuentasService.bloquearCuentas(
        [datos.cuentaId],
        bd
      );

    if (!cuenta) {
      throw new ErrorNegocio(
        400,
        "La cuenta indicada no existe"
      );
    }

    if (cuenta.estado !== "activa") {
      throw new ErrorNegocio(
        409,
        "No se pueden crear bolsillos en una cuenta que no está activa"
      );
    }

    const nombreExistente =
      await buscarBolsilloPorNombreYCuenta(
        datos.nombre,
        cuenta.id,
        bd
      );

    if (nombreExistente) {
      throw new ErrorNegocio(
        409,
        "Ya existe un bolsillo con ese nombre en la cuenta"
      );
    }

    const totalBolsillos =
      await contarBolsillosPorCuenta(
        cuenta.id,
        bd
      );

    if (totalBolsillos >= MAXIMO_BOLSILLOS_POR_CUENTA) {
      throw new ErrorNegocio(
        409,
        "La cuenta ya tiene el máximo de 10 bolsillos permitidos"
      );
    }

    const resultado =
      await bd.query(
        `INSERT INTO public.bolsillos
           (cuenta_id, nombre, meta)
         VALUES ($1, $2, $3)
         RETURNING ${COLUMNAS_BOLSILLO}`,
        [
          cuenta.id,
          datos.nombre,
          datos.meta ?? null
        ]
      );

    return resultado.rows[0];
  });
};

// ========================================
// Actualizar (PUT)
// cuentaId no es editable. Si no se envía
// meta, se conserva la actual: el campo es
// opcional en la validación y no hay forma
// de enviar "null" explícito, así que
// ausencia no debe interpretarse como
// borrado.
// ========================================
const actualizarBolsillo = async (
  id,
  datos
) => {
  const cambiarMeta =
    datos.meta !== undefined;

  const resultado =
    await consultar(
      `UPDATE public.bolsillos
       SET nombre = $2,
           meta = CASE
             WHEN $3::BOOLEAN THEN $4::NUMERIC
             ELSE meta
           END
       WHERE id = $1
       RETURNING ${COLUMNAS_BOLSILLO}`,
      [
        id,
        datos.nombre,
        cambiarMeta,
        cambiarMeta ? datos.meta : null
      ]
    );

  return resultado.rows[0] ?? null;
};

// ========================================
// Eliminar
// La FK desde transacciones y el CHECK de
// saldo protegen aunque falle la
// validación previa del controller
// ========================================
const eliminarBolsillo = async (
  id
) => {
  const resultado =
    await consultar(
      `DELETE FROM public.bolsillos
       WHERE id = $1
       RETURNING ${COLUMNAS_BOLSILLO}`,
      [id]
    );

  return resultado.rows[0] ?? null;
};

// ========================================
// Preparar un movimiento de bolsillo
// Orden de bloqueo: cuenta → bolsillo (el
// mismo en toda la API, evita deadlocks).
// Devuelve bolsillo y cuenta bloqueados.
// ========================================
const bloquearBolsilloYCuenta = async (
  bolsilloId,
  bd
) => {
  const bolsillo =
    await obtenerBolsilloPorId(
      bolsilloId,
      bd
    );

  if (!bolsillo) {
    throw new ErrorNegocio(
      404,
      "Bolsillo no encontrado"
    );
  }

  const [cuenta] =
    await cuentasService.bloquearCuentas(
      [bolsillo.cuentaId],
      bd
    );

  // Releer con bloqueo: el saldo y el
  // estado leídos antes de bloquear pueden
  // haber cambiado
  const bolsilloBloqueado =
    await obtenerBolsilloPorId(
      bolsilloId,
      bd,
      true
    );

  if (!bolsilloBloqueado) {
    throw new ErrorNegocio(
      404,
      "Bolsillo no encontrado"
    );
  }

  return {
    bolsillo: bolsilloBloqueado,
    cuenta
  };
};

// ========================================
// Apartar (POST /:id/apartar)
// Regla 3: se valida contra el disponible.
// El saldo total de la cuenta NO cambia:
// solo se reduce lo que se puede gastar.
// ========================================
const apartarEnBolsillo = async (
  id,
  datos
) => {
  return ejecutarTransaccion(async (bd) => {
    const {
      bolsillo,
      cuenta
    } = await bloquearBolsilloYCuenta(
      id,
      bd
    );

    if (bolsillo.estado !== "activo") {
      throw new ErrorNegocio(
        409,
        "No se puede apartar dinero en un bolsillo archivado"
      );
    }

    if (!cuenta || cuenta.estado !== "activa") {
      throw new ErrorNegocio(
        409,
        "No se pueden operar bolsillos de una cuenta que no está activa"
      );
    }

    const saldoDisponible =
      await cuentasService.calcularSaldoDisponible(
        cuenta.id,
        bd
      );

    if (saldoDisponible < datos.monto) {
      throw new ErrorNegocio(
        409,
        "El saldo disponible de la cuenta no alcanza para apartar ese monto"
      );
    }

    const resultado =
      await bd.query(
        `UPDATE public.bolsillos
         SET saldo = saldo + $2
         WHERE id = $1
         RETURNING ${COLUMNAS_BOLSILLO}`,
        [bolsillo.id, datos.monto]
      );

    const transaccion =
      await transaccionesService.crearTransaccion(
        {
          tipo: "apartado",
          cuentaOrigenId: cuenta.id,
          bolsilloId: bolsillo.id,
          monto: datos.monto,
          descripcion: datos.descripcion
        },
        bd
      );

    return {
      bolsillo: resultado.rows[0],
      transaccion
    };
  });
};

// ========================================
// Devolver (POST /:id/devolver)
// Regla 9: no se puede devolver más de lo
// que el bolsillo contiene
// ========================================
const devolverDeBolsillo = async (
  id,
  datos
) => {
  return ejecutarTransaccion(async (bd) => {
    const {
      bolsillo,
      cuenta
    } = await bloquearBolsilloYCuenta(
      id,
      bd
    );

    if (datos.monto > bolsillo.saldo) {
      throw new ErrorNegocio(
        409,
        "No se puede devolver más de lo que el bolsillo contiene"
      );
    }

    if (!cuenta || cuenta.estado !== "activa") {
      throw new ErrorNegocio(
        409,
        "No se pueden operar bolsillos de una cuenta que no está activa"
      );
    }

    const resultado =
      await bd.query(
        `UPDATE public.bolsillos
         SET saldo = saldo - $2
         WHERE id = $1
         RETURNING ${COLUMNAS_BOLSILLO}`,
        [bolsillo.id, datos.monto]
      );

    const transaccion =
      await transaccionesService.crearTransaccion(
        {
          tipo: "devolucion",
          cuentaDestinoId: cuenta.id,
          bolsilloId: bolsillo.id,
          monto: datos.monto,
          descripcion: datos.descripcion
        },
        bd
      );

    return {
      bolsillo: resultado.rows[0],
      transaccion
    };
  });
};

const actualizarEstadoBolsillo = async (
  id,
  nuevoEstado
) => {
  const resultado =
    await consultar(
      `UPDATE public.bolsillos
       SET estado = $2
       WHERE id = $1
       RETURNING ${COLUMNAS_BOLSILLO}`,
      [id, nuevoEstado]
    );

  return resultado.rows[0] ?? null;
};

module.exports = {
  obtenerBolsillos,
  obtenerBolsilloPorId,
  obtenerBolsillosPorCuenta,
  buscarBolsilloPorNombreYCuenta,
  contarBolsillosPorCuenta,
  crearBolsillo,
  actualizarBolsillo,
  eliminarBolsillo,
  apartarEnBolsillo,
  devolverDeBolsillo,
  actualizarEstadoBolsillo
};
