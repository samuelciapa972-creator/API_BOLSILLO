const {
  consultar
} = require(
  "../config/database"
);

// ========================================
// Proyecto final - Indicadores del panel
// Solo agregados: ningún dato personal
// (nombres, documentos, correos) sale de
// aquí. Lo consumen administrador y
// auditor desde el dashboard de React.
// ========================================

const obtenerResumen = async () => {

  const [
    usuarios,
    cuentas,
    bolsillos,
    transacciones,
    ultimos30
  ] = await Promise.all([

    consultar(
      `SELECT
         COUNT(*)::int AS "total",
         COUNT(*) FILTER (WHERE estado = 'activo')::int AS "activos"
       FROM public.usuarios`
    ),

    consultar(
      `SELECT
         COUNT(*)::int AS "total",
         COUNT(*) FILTER (WHERE estado = 'activa')::int AS "activas",
         COUNT(*) FILTER (WHERE estado = 'bloqueada')::int AS "bloqueadas",
         COUNT(*) FILTER (WHERE estado = 'cerrada')::int AS "cerradas",
         COALESCE(SUM(saldo_total), 0)::NUMERIC(16, 2) AS "saldoCustodiado"
       FROM public.cuentas`
    ),

    consultar(
      `SELECT
         COUNT(*) FILTER (WHERE estado = 'activo')::int AS "activos",
         COALESCE(SUM(saldo) FILTER (WHERE estado = 'activo'), 0)::NUMERIC(16, 2) AS "saldoApartado"
       FROM public.bolsillos`
    ),

    consultar(
      `SELECT
         tipo,
         COUNT(*)::int AS "cantidad",
         COALESCE(SUM(monto), 0)::NUMERIC(16, 2) AS "monto"
       FROM public.transacciones
       WHERE estado = 'exitosa'
       GROUP BY tipo
       ORDER BY tipo`
    ),

    consultar(
      `SELECT COUNT(*)::int AS "cantidad"
       FROM public.transacciones
       WHERE fecha >= NOW() - INTERVAL '30 days'`
    )
  ]);

  return {
    usuarios: usuarios.rows[0],
    cuentas: cuentas.rows[0],
    bolsillos: bolsillos.rows[0],
    transaccionesPorTipo: transacciones.rows,
    transaccionesUltimos30Dias: ultimos30.rows[0].cantidad,
    generadoEn: new Date().toISOString()
  };
};

module.exports = {
  obtenerResumen
};
