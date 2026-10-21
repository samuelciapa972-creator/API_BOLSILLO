const {
  pool,
  consultar
} = require("../src/config/database");

// ========================================
// Prueba de conectividad con Supabase
// Uso: npm run db:probar
// ========================================
async function probarConexion() {
  try {
    console.log("Conectando con Supabase...");

    const resultado = await consultar(`
      SELECT
        current_database() AS base_datos,
        current_user AS usuario,
        NOW() AS fecha_servidor
    `);

    console.table(resultado.rows);

    const roles = await consultar(`
      SELECT id, nombre, activo
      FROM public.roles
      ORDER BY id
    `);

    console.log("Roles registrados:");
    console.table(roles.rows);

    const inventario = await consultar(`
      SELECT 'usuarios_auth' AS tabla, COUNT(*) AS registros FROM public.usuarios_auth
      UNION ALL SELECT 'usuarios', COUNT(*) FROM public.usuarios
      UNION ALL SELECT 'cuentas', COUNT(*) FROM public.cuentas
      UNION ALL SELECT 'bolsillos', COUNT(*) FROM public.bolsillos
      UNION ALL SELECT 'transacciones', COUNT(*) FROM public.transacciones
      UNION ALL SELECT 'api_keys', COUNT(*) FROM public.api_keys
    `);

    console.log("Inventario de tablas:");
    console.table(inventario.rows);

    console.log("Conexión PostgreSQL exitosa");
  } catch (error) {
    // Solo código y mensaje: nunca la URI
    console.error("Error de conexión PostgreSQL");
    console.error("Código:", error.code);
    console.error("Mensaje:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

probarConexion();
