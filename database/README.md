# Base de datos — API Bolsillo

**Tecnología:** Supabase + PostgreSQL 16
**Módulo:** Bloque 7 — Persistencia y modelo relacional
**Estado:** 7.1 (esquema), 7.2 (conexión), 7.3 (login/auth), 7.4 (titulares/API Keys) y 7.5 (cuentas, bolsillos y transacciones atómicas) verificados en local y en Supabase (`us-east-2`, Session pooler). **Bloque 7 cerrado.**

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

## 10. Bloque 7.3 — Usuarios de login y autenticación

`src/data/usuariosAuth.js` se eliminó: `auth.service.js` trabaja sobre `public.usuarios_auth` + `public.roles`.

| Archivo | Cambio |
|---|---|
| `src/services/auth.service.js` | SQL parametrizado; todas las funciones son `async`. El rol se resuelve por nombre en `roles` (en la tabla solo vive `rol_id`) |
| `src/controllers/auth.controller.js` | `await` en la verificación de email duplicado |
| `src/controllers/usuarios.controller.js` | `validarAsociacionLogin()` es `async` (consulta el login en BD); POST y PUT con `try/catch` + `next(error)` |
| `src/middlewares/auth.middleware.js` | Tras verificar firma y expiración, consulta al usuario: inexistente → 401, deshabilitado → 403. **El rol vigente sale de la BD**, no del token |
| `src/middlewares/errores.middleware.js` | Traduce SQLSTATE (23505, 23503, 23514, 23502, 23001, 22001) a 409/400 con mensaje genérico; el log solo registra código y restricción |
| `src/middlewares/auth.validator.js` | Email máximo 150 caracteres (igual que la columna) |

**Se conserva:** el contrato del JWT (`sub` = `usuarios_auth.id`, `email`, `rol`), bcrypt con cost 12, que el registro público cree siempre `cliente`, el mismo 401 para un email inexistente y para una contraseña errónea, y que no se registren contraseñas ni hashes.

**Bootstrap idempotente:** si `ADMIN_EMAIL` ya existe, no se crea otro administrador ni se cambia su contraseña. `INSERT … ON CONFLICT (LOWER(email)) DO NOTHING` cubre el caso de dos instancias arrancando a la vez. Para cambiar la contraseña del admin **no** basta con editar `.env`.

**Transitorio hasta 7.4:** los titulares (`usuarios`) siguen en memoria. Su `usuarioAuthId` ya apunta a IDs reales de `usuarios_auth`, pero las asociaciones se pierden al reiniciar Node.js.

### Pruebas 7.3

Local = PostgreSQL 16 con TLS en Docker. Supabase = proyecto real, solo pruebas de humo (no se crearon usuarios de prueba).

| ID | Caso | Esperado | Resultado |
|---|---|---|---|
| P01 | Registro válido | 201 | ✅ Local |
| P02 | Correo duplicado / con mayúsculas | 409 | ✅ Local |
| P03 | Login correcto | 200 | ✅ Local · ✅ Supabase (admin) |
| P04 | Contraseña incorrecta / email inexistente | 401 / 401 | ✅ Local · ✅ Supabase |
| P05 | Perfil con JWT | 200 | ✅ Local · ✅ Supabase |
| P06 | Perfil sin JWT | 401 | ✅ Local |
| P07 | Registro enviando `rol: administrador` | 201 con rol `cliente` | ✅ Local |
| P07b | Email > 150 caracteres | 400 | ✅ Local |
| A01 | Admin crea auditor | 201 | ✅ Local |
| A02 | Cliente intenta crear administrador | 403 | ✅ Local |
| A03–A05 | Asociar titular a login cliente / auditor / inexistente | 201 / 409 / 400 | ✅ Local |
| R01 | 3 registros simultáneos con el mismo email (×5) | 1 fila, 201 + 409 + 409 | ✅ Local (los 10 rechazos los detuvo el índice único: 23505 → 409) |
| V01 | Login de usuario deshabilitado | 403 | ✅ Local |
| V02 | Token emitido antes de deshabilitar | 403 | ✅ Local |
| V03 | Rol cambiado en BD con token viejo | Rige el rol de la BD | ✅ Local |
| V04–V05 | Token firmado con `sub` no numérico / inexistente | 401 | ✅ Local |
| E01 | Respuesta 409 sin detalle SQL | Mensaje genérico | ✅ Local |
| B01–B02 | Reiniciar: no duplica administrador | 1 admin, sin "creado" | ✅ Local · ✅ Supabase (3 arranques) |
| B03–B04 | Reiniciar: login y token previo siguen válidos | 200 | ✅ Local |
| B05 | `password_hash` con formato bcrypt `$2b$12$` | Sí | ✅ Local |
| B06 | Logs sin contraseñas ni hashes | 0 coincidencias | ✅ Local · ✅ Supabase |

## 11. Bloque 7.4 — Titulares y API Keys

| Archivo | Cambio |
|---|---|
| `src/services/usuarios.service.js` | CRUD sobre `public.usuarios` con SQL parametrizado; columnas con alias camelCase (`usuario_auth_id AS "usuarioAuthId"`). Email sin distinguir mayúsculas |
| `src/controllers/usuarios.controller.js` | Todos los handlers `async` con `try/catch` + `next(error)`; `validarDuplicados()` es `async` |
| `src/controllers/cuentas.controller.js` | `obtenerMisCuentas` y `crearCuenta` esperan al titular (las cuentas siguen en memoria hasta 7.5) |
| `src/middlewares/propiedad.middleware.js` | Fábrica `async`: espera al titular del JWT y acepta comprobaciones de propiedad síncronas o asíncronas (preparado para 7.5) |
| `src/middlewares/usuarios.validator.js` | Email máximo 150 caracteres |
| `src/services/apiKeys.service.js` | Busca el hash SHA-256 en `public.api_keys`; `sincronizarApiKeys()` al arrancar |
| `src/data/apiKeys.js` | Ya no es fuente de datos: es la **semilla** que se sincroniza con la tabla |
| `src/middlewares/apiKey.middleware.js` | `async`; un error de BD pasa al manejador global (500 genérico) |
| `src/app.js` | Arranque: sincronizar API Keys → administrador inicial → abrir el puerto |

**API Keys: qué manda la tabla y qué manda `.env`:**

- `.env` manda el **hash**: para rotar una key, cámbiala en `.env` y reinicia. La anterior deja de funcionar.
- La tabla manda **`activa`**: `UPDATE public.api_keys SET activa = false WHERE cliente = '…'` deshabilita una key al instante, sin reiniciar y sin tocar el código. Al reiniciar no se sobrescribe.
- La tabla nunca guarda la key en claro (`CHECK hash ~ '^[0-9a-f]{64}$'`).

**PUT de titular:** si no se envía `usuarioAuthId`, se conserva el vínculo actual. La relación 1:1 con el login la protege `UNIQUE(usuario_auth_id)`, además de la validación del controller.

**Transitorio hasta 7.5:** cuentas, bolsillos y transacciones siguen en memoria. Los IDs de cuenta de la semilla (1 y 2) coinciden con los titulares de la semilla SQL, así que `mis-cuentas` y BOLA sobre cuentas funcionan con los datos de prueba.

### Pruebas 7.4

| ID | Caso | Esperado | Resultado |
|---|---|---|---|
| K01–K02 | Sin `X-API-Key` / key inválida | 401 | ✅ Local · ✅ Supabase (K01) |
| K03 | Key Postman activa | 200 | ✅ Local · ✅ Supabase |
| K04 | Key Móvil inactiva | 403 | ✅ Local · ✅ Supabase |
| K05 | La tabla no contiene keys en claro | 0 | ✅ Local · ✅ Supabase (3 hashes de 64) |
| K06 | Activar una key en la tabla sin reiniciar | 200 | ✅ Local |
| U01–U04 | Listar (2) / por ID / inexistente / ID inválido | 200 / 200 / 404 / 400 | ✅ Local · ✅ Supabase (U01, U03) |
| U05 | POST con `estado` e `id` en el body | 201, ignorados (mass assignment) | ✅ Local |
| U06–U07 | Documento duplicado / email duplicado con mayúsculas | 409 | ✅ Local |
| U08–U09 | PUT completo / PUT con email de otro titular | 200 / 409 | ✅ Local |
| U10–U12 | Eliminar con cuentas / sin cuentas / ya eliminado | 409 / 200 / 404 | ✅ Local |
| U13 | 3 POST simultáneos con el mismo documento | 1 fila (201, 409, 409) | ✅ Local |
| O01–O04 | Vincular titular↔login, 1:1, PUT sin `usuarioAuthId` conserva el vínculo | 200 / 409 / 200 / igual | ✅ Local |
| O05–O08 | Cliente: su titular / ajeno / inexistente / listado | 200 / 403 / 403 / 403 | ✅ Local |
| O09–O11 | `mis-cuentas` con titular / sin titular / cuenta ajena | 200 / 403 / 403 | ✅ Local |
| R01–R02 | Reinicio: 3 keys, `activa` no se sobrescribe | Sí | ✅ Local · ✅ Supabase (R01) |
| R03–R04 | Key rotada en `.env`: la vieja / la nueva | 401 / 200 | ✅ Local |
| R05–R07 | Reinicio: vínculo, BOLA y eliminación persisten | Sí | ✅ Local |
| R08 | Logs sin keys, contraseñas ni hashes | 0 | ✅ Local · ✅ Supabase |

## 12. Bloque 7.5 — Paso 1: Cuentas

| Archivo | Cambio |
|---|---|
| `src/services/cuentas.service.js` | CRUD sobre `public.cuentas`. Depósito y retiro con `saldo_total ± $2` en SQL (NUMERIC). Parámetro opcional `bd` para ejecutar dentro de `ejecutarTransaccion` (paso 2) |
| `src/controllers/cuentas.controller.js` | Todos los handlers `async` |
| `src/controllers/transacciones.controller.js` | Depósito, retiro y transferencia esperan a `cuentasService` |
| `src/controllers/bolsillos.controller.js` | Crear, apartar y devolver esperan la cuenta y el saldo disponible |
| `src/controllers/usuarios.controller.js` | `GET /:id/cuentas` y `DELETE` esperan las cuentas de la BD |
| `src/middlewares/propiedad.middleware.js` | `esCuentaDelTitular()` es `async`; las comprobaciones compuestas (bolsillo, transacción) esperan cada llamada por separado |

**Lección del paso (verificada con mutantes):** una comprobación de propiedad `async` sin `await` falla de dos maneras:

| Error | Efecto | Prueba que lo detecta |
|---|---|---|
| La fábrica evalúa la promesa como booleano (`if (!perteneceAlTitular(...))`) | **Hueco BOLA:** una promesa siempre es verdadera, así que cualquier cliente pasa (Eve vio una transferencia ajena: 200) | B10 |
| `esCuentaDelTitular(origen) \|\| esCuentaDelTitular(destino)` | `\|\|` devuelve la primera promesa: solo se revisa el origen, y el dueño del destino recibe un 403 indebido | B08 |

### Estado transitorio del paso 1 (resuelto en el paso 2)

Durante el paso 1, transacciones y bolsillos siguieron en memoria y la transferencia no era atómica. Ver §13.

### Pruebas 7.5 — paso 1

| ID | Caso | Esperado | Resultado |
|---|---|---|---|
| C01–C04 | Listar (montos e ids como `number`) / por ID / inexistente / ID inválido | 200 / 200 / 404 / 400 | ✅ Local · ✅ Supabase (C01, C03) |
| C05 | Crear con `saldoTotal`, `numeroCuenta` y `estado` en el body | 201: número generado por la BD, saldo 0, activa | ✅ Local |
| C06–C07 | Titular inexistente / inactivo | 400 / 409 | ✅ Local |
| C08 | Saldo de Ana | 100.000 / 80.000 / 20.000 | ✅ Local · ✅ Supabase |
| M01–M02 | **Caso estrella:** retirar 50.000 con 20.000 disponibles | 409, saldo intacto en BD | ✅ Local |
| M03–M06 | Depósito 50.000 y retiro 10.000,50 | 201, saldo exacto `139999.50` en BD | ✅ Local |
| M07–M08 | Transferencia 5.000 | 201, ambos saldos actualizados en BD | ✅ Local |
| M09–M11 | Misma cuenta / destino inexistente / 5.000.000 | 409 / 400 / 400 | ✅ Local |
| S01–S08 | Bloquear, operar bloqueada, desbloquear, cerrar con o sin saldo, reabrir, estado inválido | 200 / 409 / 409 / 200 / 409 / 200 / 409 / 400 | ✅ Local |
| B01–B07 | Cliente: sus cuentas sí; ajenas, inexistentes, débito ajeno, crear y cambiar estado no | 200 / 403 | ✅ Local |
| B08–B09 | Ver transferencia como dueño del destino / del origen | 200 | ✅ Local |
| B10–B12 | Tercer cliente: transferencia, depósito y bolsillo ajenos | 403 | ✅ Local |
| B13–B14 | Bolsillo propio / crear bolsillo en cuenta ajena | 200 / 403 | ✅ Local |
| B15 | Auditor: lectura sí, depósito no | 200 / 403 | ✅ Local |
| I01–I02 | Eliminar titular con cuentas; respuesta sin detalle SQL | 409 | ✅ Local |
| R01–R04 | Reinicio: saldos, estado cerrada, logs sin secretos | Persisten | ✅ Local |

## 13. Bloque 7.5 — Paso 2: Bolsillos y transacciones atómicas

Todo movimiento de dinero es **una sola transacción SQL**:

```text
BEGIN
  SELECT … FROM cuentas WHERE id = ANY($1) ORDER BY id FOR UPDATE   ← bloquea la(s) cuenta(s)
  [SELECT … FROM bolsillos WHERE id = $1 FOR UPDATE]                ← apartar / devolver
  validar sobre las filas bloqueadas (existe, activa, disponible…)  ← ErrorNegocio → ROLLBACK
  UPDATE saldo(s)
  INSERT INTO transacciones                                          ← libro contable (regla 12)
COMMIT
```

| Archivo | Cambio |
|---|---|
| `src/services/transacciones.service.js` | SQL + `realizarDeposito`, `realizarRetiro` y `realizarTransferencia` atómicos; `crearTransaccion()` siempre dentro de la transacción que movió el dinero |
| `src/services/bolsillos.service.js` | SQL + `crearBolsillo` (límite de 10 con la cuenta bloqueada), `apartarEnBolsillo` y `devolverDeBolsillo` atómicos |
| `src/services/cuentas.service.js` | `bloquearCuentas()` (`FOR UPDATE` en orden de id); saldo apartado calculado en SQL |
| `src/utils/errores.js` | `ErrorNegocio(status, mensaje)`: una regla incumplida dentro de la transacción provoca el ROLLBACK y la misma respuesta HTTP de antes |
| `src/middlewares/errores.middleware.js` | Responde `ErrorNegocio` sin registrar el stack; añade `22003` (valor fuera de rango) → 400 |
| `src/controllers/transacciones.controller.js`, `bolsillos.controller.js` | Los movimientos delegan en el service; PUT, DELETE y cambio de estado mantienen su validación |
| `src/middlewares/transacciones.validator.js`, `bolsillos.validator.js` | `monto` y `meta` con **máximo 2 decimales**; `meta` hasta 999.999.999.999,99 |

**Decisiones:**

- **Orden de bloqueo único: cuenta → bolsillo**, y las cuentas en orden de id. Así, dos transferencias cruzadas (A→B y B→A) no se bloquean entre sí.
- **Las validaciones se hacen sobre filas ya bloqueadas.** Leer, validar y después escribir sin bloqueo permite que dos peticiones validen el mismo saldo disponible.
- **Máximo 2 decimales:** `NUMERIC(14,2)` redondearía `10.555` a `10.56`, y se movería un monto distinto del validado.
- **Mismos códigos y mensajes de antes:** el contrato HTTP no cambia.

### Pruebas 7.5 — paso 2

| ID | Caso | Esperado | Resultado |
|---|---|---|---|
| K01–K02 | Listar / bolsillo inexistente | 200 / 404 | ✅ Local · ✅ Supabase (K01) |
| K03 | Crear enviando `saldo` y `estado` en el body | 201, saldo 0, activo | ✅ Local |
| K04–K05 | Nombre duplicado con mayúsculas / mismo nombre en otra cuenta | 409 / 201 | ✅ Local |
| K06–K07 | Meta con 3 decimales / cuenta inexistente | 400 / 400 | ✅ Local |
| K08–K09 | PUT sin meta la conserva / PUT con nombre existente | igual / 409 | ✅ Local |
| A01–A02 | Apartar 15.000: el total no cambia y el disponible baja | 201, 100.000 / 5.000 | ✅ Local |
| A03–A04 | Apartar o retirar más del disponible | 409 | ✅ Local |
| A05–A07 | Devolver más de lo que hay / devolver 5.000,25 | 409 / 201 (disponible 10.000,25) | ✅ Local |
| A08–A09 | Bolsillo inexistente / monto con 3 decimales | 404 / 400 | ✅ Local |
| E01–E06b | Eliminar o archivar con saldo, eliminar con transacciones, archivar vacío, apartar en archivado, reactivar, cliente cambia el estado | 409 / 409 / 409 / 200 / 409 / 409 / 403 | ✅ Local |
| E07–E08 | Eliminar bolsillo nuevo / ver bolsillo ajeno | 200 / 403 | ✅ Local |
| L01–L04 | Libro por cuenta, persistencia, RBAC, sin PUT ni DELETE | 200 / filas / 403 / 404 | ✅ Local · ✅ Supabase (L01) |
| T01–T04 | **Atomicidad:** se fuerza que el INSERT de la transacción falle después de mover saldos | 409, saldos y bolsillo intactos, 0 transacciones nuevas | ✅ Local |
| T05, X11 | Conciliación: saldo de cada cuenta y bolsillo = suma de sus transacciones; ningún disponible negativo | 0 descuadres | ✅ Local · ✅ Supabase |
| X01–X02 | 10 retiros simultáneos de 5.000 con 20.000 disponibles | 4 × 201, 6 × 409, disponible ≥ 0 | ✅ Local |
| X03 | 10 apartados simultáneos de 4.000 con 30.000 disponibles | 7 × 201, 3 × 409 | ✅ Local |
| X04–X05 | 5 retiros + 5 apartados de 2.000 mezclados con 12.000 disponibles | 6 éxitos, disponible exacto 0,00 | ✅ Local |
| X06–X08 | 20 transferencias cruzadas A↔B simultáneas | 20 × 201, dinero conservado, 0 deadlocks | ✅ Local |
| X09–X10 | 5 bolsillos simultáneos con 8 existentes | 2 × 201, 3 × 409, total 10 | ✅ Local |
| R01–R03 | Reinicio: transacciones y estados persisten; logs sin secretos | Sí | ✅ Local |

**Mutante (sin `FOR UPDATE`):** la misma batería de concurrencia falla en 8 pruebas, lo que demuestra que el bloqueo es lo que protege el saldo:

| Prueba | Con bloqueo | Sin bloqueo |
|---|---|---|
| X01: retiros aprobados con 20.000 disponibles | 4 | **8: se gastó el dinero apartado** |
| X05: disponible final | 0,00 | **−4.000** |
| X06: transferencias cruzadas | 20 × 201 | **12 × 500 por deadlock** |
| X10: bolsillos en la cuenta (máximo 10) | 10 | **13** |

La conciliación (X11) cuadra incluso en el mutante: la atomicidad sigue funcionando, pero la regla del saldo disponible no. El `CHECK saldo_total >= 0` no lo detecta porque el total sigue siendo positivo. Por eso hace falta `FOR UPDATE`.

**En Supabase solo se hicieron lecturas:** las transacciones son inmutables y cualquier movimiento de prueba quedaría para siempre en el libro.

## 14. Bloque 7.5 — Paso 3: Cierre

| Cambio | Detalle |
|---|---|
| `src/data/` | Se eliminaron `usuarios.js`, `cuentas.js`, `bolsillos.js` y `transacciones.js`. Queda `apiKeys.js`, que es la semilla sincronizada con `public.api_keys` |
| `src/utils/comunes.js` | Se eliminó `generarSiguienteId` (los ids los genera `GENERATED ALWAYS AS IDENTITY`) |
| Swagger | `monto` y `meta` con `multipleOf: 0.01`; `meta` con su máximo; la descripción de la API menciona PostgreSQL y las transacciones atómicas |
| Postman | Colección nueva del Bloque 7 (40 peticiones, 53 tests) que se puede repetir sobre una BD persistente. Ver el README principal |
| `npm audit fix` | Actualizó `proxy-addr` (crítica), `brace-expansion` y `fast-uri`. **Producción: 0 vulnerabilidades**. Quedan 3 avisos solo de desarrollo (nodemon); no se aplicó `--force` porque bajaría nodemon a 1.14.10 |

**Regresión final con el código definitivo** (PostgreSQL 16 con TLS en Docker, BD limpia por batería):

| Batería | Resultado |
|---|---|
| Paso 1: cuentas, movimientos, estados, RBAC/BOLA, persistencia (49) | ✅ 0 fallas |
| Paso 2: bolsillos, libro contable, atomicidad, concurrencia, persistencia (51) | ✅ 0 fallas |
| Colección Postman con newman (40 peticiones, 53 tests), dos corridas seguidas sobre la misma BD | ✅ 0 fallas |
| Supabase: arranque, `/api-docs`, `/openapi.json`, lecturas y conciliación del libro | ✅ |

## 15. Resumen y criterios de cierre del Bloque 7

**Pruebas registradas en total:** 7.1 (20 negativas de restricciones + verificación) · 7.2 (conexión y TLS: 16) · 7.3 (30) · 7.4 (38) · 7.5 (49 + 51 + 53 de Postman) · 3 mutantes que demuestran que las pruebas detectan los errores que buscan.

Criterio de cierre del insumo (7.5) y cómo se cumple:

| Criterio | Evidencia |
|---|---|
| Matriz de pruebas con resultados registrados | §9–§14 |
| Persistencia comprobada tras reiniciar | R01–R08 de cada paso |
| Conflictos bloqueados | En Bolsillo, el equivalente a la "agenda" son los débitos concurrentes: X01–X10 y el mutante sin `FOR UPDATE` |
| Perfiles ajenos no consultables | O05–O11 (7.4), B01–B15 (7.5), carpeta 4 de Postman |
| Integridad referencial ante intentos de eliminación | U10, I01, E01–E03, carpeta 5 de Postman |

## 16. Pendiente para bloques futuros

- **Supabase Auth:** `usuarios_auth.auth_user_id` está listo, pero las contraseñas siguen con bcrypt en la propia tabla. No mantener dos sistemas de contraseñas indefinidamente.
- **Políticas RLS** por usuario, si algún cliente llega a consultar Supabase directamente. Hoy Express usa un rol de servidor que omite RLS, y la autorización vive en Express.
- **Paginación** en los listados (`GET /cuentas`, `/transacciones`…) cuando crezcan los datos.
- **Rendimiento:** cada petición hace unas 3 consultas de seguridad (API Key, usuario del JWT y titular). Se puede agregar una caché corta si hace falta.
- **Rate limit en memoria:** se reinicia con el servidor y no se comparte entre instancias.
- **SAST, SCA y DAST** del README principal (Semgrep, npm audit, OWASP ZAP) sobre la versión persistente.
