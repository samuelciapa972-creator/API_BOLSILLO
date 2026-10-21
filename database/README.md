# Base de datos — API Bolsillo

**Tecnología:** Supabase + PostgreSQL 16
**Módulo:** Bloque 7 — Persistencia y modelo relacional
**Estado:** 7.1 (esquema) y 7.2 (conexión) verificados en local y en Supabase (`us-east-2`, Session pooler). Pendiente: migrar los services (7.3–7.5).

## 1. Objetivo

Sustituir progresivamente los arreglos en memoria (`src/data/`) por persistencia real, **sin perder** API Key, JWT, RBAC, controles de propiedad (BOLA/IDOR), validación con `express-validator` ni `matchedData()`.

En una billetera, la base de datos no solo almacena: es la **segunda línea de defensa** de las reglas de negocio. Aunque un bug en Express intente dejar un saldo negativo o editar una transacción, PostgreSQL lo rechaza.

## 2. Archivos

| Archivo | Responsabilidad | ¿Repetible? |
|---|---|---|
| `01_esquema_bolsillo.sql` | Tablas, FK, CHECK, índices y trigger de inmutabilidad | No (contiene `CREATE`) |
| `02_roles_seguridad.sql` | Roles de negocio, RLS y `REVOKE` para `anon`/`authenticated` | No (inserta roles) |
| `03_verificacion.sql` | Consultas de comprobación (solo lectura) | Sí |
| `04_datos_prueba.sql` | Ana y Carlos, sus cuentas y el bolsillo, **con sus transacciones** | Sí (no duplica) |

## 3. Crear el proyecto en Supabase

1. [Supabase Dashboard](https://supabase.com/dashboard) → **New project**. Nombre sugerido: `bolsillo`.
2. **Contraseña de la base de datos:** robusta y única. No es la del administrador de la API.
3. **Región:** la más cercana al backend.
4. Sección **Seguridad** del formulario:

| Opción | Valor | Motivo |
|---|---|---|
| Habilitar la API de datos | Activado | No da acceso por sí sola: también intervienen los `REVOKE` y RLS |
| Exponer automáticamente nuevas tablas | **Desactivado** | Sin privilegios automáticos sobre tablas nuevas |
| Habilitar RLS automático | Activado | Igualmente se activa explícitamente en `02_roles_seguridad.sql` |

> Los roles de negocio (`administrador`, `cliente`, `auditor`) viven en `public.roles` y **no son** los roles de Supabase (`anon`, `authenticated`, `service_role`).

## 4. Ejecutar los scripts

En **SQL Editor → New query**, en este orden, uno por consulta:

1. `01_esquema_bolsillo.sql` → Run. En **Table Editor** deben aparecer 7 tablas.
2. `02_roles_seguridad.sql` → Run.
3. `03_verificacion.sql` → Run y comparar con la sección 7.
4. (Opcional, laboratorio) `04_datos_prueba.sql`.

## 5. Modelo de datos

```text
roles 1 ──< usuarios_auth 1 ── 0..1 usuarios 1 ──< cuentas 1 ──< bolsillos
   (login: rol, hash bcrypt)   (titular billetera)    │              │
                                                      │ origen/destino│ 0..N
                                                      └──< transacciones >┘
api_keys (clientes confiables, solo hash)
```

| Tabla | Equivale a | Notas |
|---|---|---|
| `roles` | roles fijos del código | `administrador`, `cliente`, `auditor` |
| `usuarios_auth` | `src/data/usuariosAuth.js` | Login. `rol_id → roles`, `auth_user_id → auth.users` (para Supabase Auth en el futuro) |
| `usuarios` | `src/data/usuarios.js` | Titular. `usuario_auth_id → usuarios_auth` (1:1 opcional): la base de la cadena de propiedad |
| `cuentas` | `src/data/cuentas.js` | `numero_cuenta` lo genera la BD (`300` + 7 dígitos) |
| `bolsillos` | `src/data/bolsillos.js` | |
| `transacciones` | `src/data/transacciones.js` | Inmutable |
| `api_keys` | `src/data/apiKeys.js` | Solo hash SHA-256 |

> El ID del login (`usuarios_auth.id`, el `sub` del JWT) **no es** el ID del titular (`usuarios.id`) ni el de la cuenta.

### Reglas de negocio protegidas por la base de datos

| Regla (ficha) | Mecanismo en PostgreSQL |
|---|---|
| 2. Documento y email únicos | `UNIQUE(documento)`, índice único `LOWER(email)` |
| 3. Nunca gastar dinero apartado | `CHECK saldo_total >= 0`, `CHECK saldo >= 0` + transacción SQL con `FOR UPDATE` (7.5) |
| 4. Transferencia entre cuentas distintas | `CHECK cuenta_origen_id <> cuenta_destino_id` |
| 5. Monto > 0 y ≤ 2.000.000 | `ck_transacciones_monto` |
| 7. No cerrar cuenta con saldo | `ck_cuentas_cerrada_sin_saldo` |
| 8. No eliminar/archivar bolsillo con saldo | `ck_bolsillos_archivado_sin_saldo` + FK `RESTRICT` desde transacciones |
| 10. Nombre de bolsillo único por cuenta | índice único `(cuenta_id, LOWER(nombre))` |
| 11. Transacciones inmutables | trigger `trg_transacciones_inmutables` (UPDATE/DELETE) y `trg_transacciones_sin_truncate` |
| 12. Todo movimiento queda registrado | `ck_transacciones_referencias`: cada tipo exige exactamente sus cuentas/bolsillo |
| Dinero sin errores de coma flotante | `NUMERIC(14,2)`, nunca `float` |
| No eliminar titular con cuentas | FK `ON DELETE RESTRICT` |

Lo que sigue en Express (no se puede expresar con un CHECK simple): máximo 10 bolsillos por cuenta, cuenta activa para operar, transiciones de estado válidas y saldo **disponible** (total − bolsillos activos).

### Errores de PostgreSQL que traducirá la API

| SQLSTATE | Significado | HTTP |
|---|---|---|
| `23505` | Valor único duplicado | 409 |
| `23503` | FK: referencia inexistente o registro en uso | 409 (400 si la referencia no existe) |
| `23514` | CHECK incumplido | 409 / 400 según el caso |
| `23502` | NOT NULL | 400 |
| `23001` | Trigger de inmutabilidad (`restrict_violation`) | 409 |

## 6. Row Level Security

RLS está **activado** en las 7 tablas y **sin políticas**. Además, se aplica `REVOKE ALL` a `anon` y `authenticated`, de modo que nadie puede leer las tablas a través de la API de datos de Supabase.

> **Importante:** Express se conecta con un rol de servidor que **omite RLS**. Por eso RBAC y BOLA siguen siendo responsabilidad de Express. RLS no reemplaza esos controles: solo cierra el acceso directo desde fuera.

## 7. Verificación — resultados esperados

| Consulta (`03_verificacion.sql`) | Esperado |
|---|---|
| 1. Roles | 3 activos |
| 2. Tablas | 7 |
| 3. RLS | 7 en `true` |
| 4. Claves foráneas | 8 |
| 5. Políticas | 0 filas |
| 6. Privilegios `anon`/`authenticated` | 0 filas |
| 9. Triggers en `transacciones` | 2 |

## 8. Conexión desde Express (Bloque 7.2)

1. Supabase → **Connect** → **Session pooler** (puerto `5432`, compatible con IPv4). Copiar la URI **solo** en `.env`:
   ```dotenv
   DATABASE_URL=postgresql://USUARIO:CONTRASENA@HOST:5432/postgres
   ```
   - La URI de **Direct** (`db.<ref>.supabase.co`) es solo IPv6: en redes sin IPv6 falla con `ENETUNREACH`. El Session pooler usa el usuario `postgres.<ref>` y el host `aws-0-<región>.pooler.supabase.com`.
   - Quitar los corchetes de `[YOUR-PASSWORD]`: si quedan, la autenticación falla con `28P01`.
   - Sin `?sslmode=...`: `src/config/database.js` lo rechaza porque reemplazaría la configuración TLS.
   - Codificar caracteres especiales de la contraseña (`@` → `%40`, `#` → `%23`, …).
2. Certificado: `certs/prod-ca-2021.crt` es la CA pública **Supabase Root 2021 CA** (no es un secreto). Para confirmar que es la tuya: **Database → Settings → SSL configuration → Download certificate** y comparar la huella:
   ```bash
   openssl x509 -in certs/prod-ca-2021.crt -noout -fingerprint -sha256
   # 80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA
   ```
3. Probar:
   ```bash
   npm run db:probar
   ```
   Debe mostrar base `postgres`, los 3 roles y el inventario de tablas.
4. Supabase → **Database → Settings → SSL configuration** → **Enforce SSL on incoming connections: ON**.

`src/config/database.js` exporta:

| Export | Uso |
|---|---|
| `consultar(sql, parametros)` | Consulta parametrizada (`$1`, `$2`…), nunca concatenando valores |
| `ejecutarTransaccion(async (cliente) => …)` | `BEGIN` … `COMMIT`, o `ROLLBACK` si algo falla. Para todo movimiento de dinero |
| `pool` | Cerrar con `pool.end()` en scripts |

`BIGINT` y `NUMERIC` se convierten a `Number` para conservar el contrato JSON (ids y montos numéricos). La aritmética de dinero se hace en SQL.

## 9. Evidencias

S01–S12 y C01–C09 se verificaron en **PostgreSQL 16 local (Docker)**, con un stub de `auth.users` y de los roles `anon`/`authenticated`. C10–C13 se verificaron en el proyecto Supabase.

| ID | Prueba | Esperado | Local |
|---|---|---|---|
| S01 | Scripts 01 → 02 → 04 | Sin errores | ✅ |
| S02 | Verificación (sección 7) | 3 roles, 7 tablas, 7 RLS, 8 FK, 0 políticas, 0 grants, 2 triggers | ✅ |
| S03 | Caso estrella: Ana 100.000 total, 80.000 apartado | Disponible 20.000 | ✅ |
| S04 | `UPDATE`/`DELETE`/`TRUNCATE` sobre transacciones | Rechazado | ✅ |
| S05 | Depósito con cuenta origen / transferencia a sí misma | `ck_transacciones_referencias` | ✅ |
| S06 | Monto 5.000.000 o negativo | `ck_transacciones_monto` | ✅ |
| S07 | Saldo negativo / cerrar con saldo / archivar con saldo | CHECK correspondiente | ✅ |
| S08 | Bolsillo `VIAJE A CARTAGENA` en la misma cuenta | Duplicado (23505) | ✅ |
| S09 | Mismo nombre de bolsillo en otra cuenta | Aceptado | ✅ |
| S10 | Email de titular duplicado con mayúsculas | 23505 | ✅ |
| S11 | Eliminar titular con cuentas / bolsillo con transacciones | 23503 | ✅ |
| S12 | `SET ROLE anon; SELECT * FROM cuentas` | `permission denied` | ✅ |
| C01 | Sin `DATABASE_URL` | Error antes de conectar | ✅ |
| C02 | `DATABASE_URL` con `sslmode` | Error antes de conectar | ✅ |
| C03 | Sin archivo de certificado | Error antes de conectar | ✅ |
| C04 | Servidor sin TLS | Rechazado | ✅ |
| C05 | Certificado que no firmó la CA configurada | `UNABLE_TO_VERIFY_LEAF_SIGNATURE` | ✅ |
| C06 | CA correcta + `rejectUnauthorized: true` | Conexión exitosa | ✅ (CA local de prueba) |
| C07 | Contraseña errónea | `28P01` | ✅ |
| C08 | `ejecutarTransaccion`: fallo a mitad | ROLLBACK, saldo intacto | ✅ |
| C09 | `ejecutarTransaccion`: éxito | COMMIT, montos como `Number` | ✅ |
| C10 | `npm run db:probar` contra Supabase (Session pooler, CA Supabase, `rejectUnauthorized: true`) | 3 roles | ✅ Supabase |
| C11 | Verificación en Supabase: 7 tablas, 7 RLS, 8 FK, 0 políticas, 0 grants, 2 triggers | Igual que local | ✅ Supabase |
| C12 | Caso estrella en Supabase | Disponible 20.000 | ✅ Supabase |
| C13 | `UPDATE` de transacción en Supabase | `23001` | ✅ Supabase |
| C15 | Enforce SSL activado en Supabase | `db:probar` sigue conectando | ✅ Supabase |
| C16 | Huella del certificado descargado del proyecto vs `certs/prod-ca-2021.crt` | Idénticas | ✅ |
| C14 | Conexión *Direct* (`db.<ref>.supabase.co`) desde red sin IPv6 | `ENETUNREACH`: usar Session pooler | Observado |

## 10. Próximos pasos

- **7.3** Usuarios de login (`usuarios_auth`), auth y bootstrap idempotente del administrador.
- **7.4** Titulares (`usuarios`) y API Keys (`api_keys`).
- **7.5** Cuentas, bolsillos y transacciones, con movimientos de dinero atómicos (`ejecutarTransaccion` + `SELECT … FOR UPDATE`) y `propiedad.middleware.js` asíncrono.

No borrar `src/data/` hasta terminar la migración y sus pruebas.
