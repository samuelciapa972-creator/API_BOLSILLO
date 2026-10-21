-- ========================================
-- Verificación del esquema API Bolsillo
-- Solo lectura: se puede ejecutar las veces
-- que sea necesario.
-- ========================================

-- 1. Roles (esperado: 3 activos)
SELECT id, nombre, activo
FROM public.roles
ORDER BY id;

-- 2. Tablas (esperado: 7)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'roles', 'usuarios_auth', 'usuarios', 'cuentas',
    'bolsillos', 'transacciones', 'api_keys'
  )
ORDER BY table_name;

-- 3. RLS (esperado: 7 filas en true)
SELECT
    relname AS tabla,
    relrowsecurity AS rls_habilitado
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relname IN (
    'roles', 'usuarios_auth', 'usuarios', 'cuentas',
    'bolsillos', 'transacciones', 'api_keys'
  )
ORDER BY relname;

-- 4. Claves foráneas (esperado: 8)
SELECT
    conrelid::regclass AS tabla,
    conname AS restriccion,
    confrelid::regclass AS tabla_referenciada
FROM pg_constraint
WHERE contype = 'f'
  AND connamespace = 'public'::regnamespace
ORDER BY tabla, restriccion;

-- 5. Políticas RLS (esperado: 0 filas)
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. Privilegios de anon/authenticated
-- (esperado: 0 filas)
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'roles', 'usuarios_auth', 'usuarios', 'cuentas',
    'bolsillos', 'transacciones', 'api_keys'
  )
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;

-- 7. Restricciones CHECK y UNIQUE
SELECT
    conrelid::regclass AS tabla,
    conname AS restriccion,
    pg_get_constraintdef(oid) AS definicion
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND contype IN ('c', 'u')
ORDER BY tabla, restriccion;

-- 8. Índices
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 9. Triggers de inmutabilidad
-- (esperado: trg_transacciones_inmutables y
-- trg_transacciones_sin_truncate)
SELECT tgname AS trigger, tgrelid::regclass AS tabla
FROM pg_trigger
WHERE tgrelid = 'public.transacciones'::regclass
  AND NOT tgisinternal
ORDER BY tgname;

-- 10. Inventario de registros
SELECT 'roles' AS tabla, COUNT(*) AS registros FROM public.roles
UNION ALL SELECT 'usuarios_auth', COUNT(*) FROM public.usuarios_auth
UNION ALL SELECT 'usuarios', COUNT(*) FROM public.usuarios
UNION ALL SELECT 'cuentas', COUNT(*) FROM public.cuentas
UNION ALL SELECT 'bolsillos', COUNT(*) FROM public.bolsillos
UNION ALL SELECT 'transacciones', COUNT(*) FROM public.transacciones
UNION ALL SELECT 'api_keys', COUNT(*) FROM public.api_keys;
