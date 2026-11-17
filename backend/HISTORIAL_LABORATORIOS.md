# API BOLSILLO — Bloque 11 (recuperación de cuentas y preparación para React)

Proyecto para el desarrollo y análisis de seguridad de una API REST para una billetera virtual, utilizando Node.js, Express, Swagger/OpenAPI y herramientas de análisis SAST, SCA y DAST.

La ficha completa del proyecto (recursos, atributos, relaciones, reglas de negocio, endpoints, validaciones y arquitectura) está en [`ficha-bolsillo-api.md`](./ficha-bolsillo-api.md).

---

# 1. OBJETIVO DEL PROYECTO

Construir una API REST para gestionar:

- usuarios;
- cuentas;
- transacciones (depósitos, retiros y transferencias);
- bolsillos de ahorro.

El proyecto permite formalizar:

- arquitectura de una API REST;
- rutas;
- controllers;
- services;
- middlewares;
- validación de datos;
- relaciones entre recursos;
- reglas de negocio (en particular, el cálculo del saldo disponible);
- protección contra Mass Assignment;
- documentación OpenAPI;
- Swagger UI;
- análisis SAST;
- análisis SCA;
- análisis DAST.

Los datos se almacenaron inicialmente en memoria mediante archivos JavaScript. Desde el Bloque 7 viven en **PostgreSQL (Supabase)**: ver la sección del Bloque 7 y [`database/README.md`](./database/README.md).

La arquitectura por capas (rutas → validadores → controllers → services) permitió migrar a BaaS sin cambiar los endpoints.

# Instalación

```
npm install
```

## Recordemos que:
- helmet
→ agrega encabezados HTTP de seguridad

- cors
→ controla los orígenes permitidos

- express-rate-limit
→ limita solicitudes repetidas

- express-validator
→ valida parámetros y datos recibidos

- dotenv
→ carga variables de entorno desde .env

- swagger-ui-express / swagger-jsdoc
→ visualizar, probar y describir formalmente la API

- nodemon
→ recarga el servidor en desarrollo

# CREAR EL ARCHIVO .ENV

Copiar `.env.example` a `.env` y ajustar los valores si hace falta.

Variables principales:

```
DATABASE_URL=postgresql://USUARIO:CONTRASENA@HOST:5432/postgres   (Session pooler de Supabase)
JWT_SECRET=<secreto largo y aleatorio>
API_KEY_POSTMAN=<api key>          (también API_KEY_ADMIN y API_KEY_MOVIL)
ALLOWED_ORIGIN=http://localhost:3000,http://localhost:5173
```

`ALLOWED_ORIGIN` acepta varios orígenes separados por comas: Swagger (`:3000`) y la futura SPA React + Vite (`:5173`).

El administrador inicial **ya no se crea al arrancar la API** (Bloque 7.5.1). Se crea una sola vez con:

```
ADMIN_NOMBRE=Administrador Bolsillo
ADMIN_EMAIL=admin@bolsillo.com
ADMIN_PASSWORD=<contraseña segura de 12+ caracteres>

npm run seed:admin
```

Si ya existe un administrador, el script no crea otro ni modifica nada. Después se pueden retirar esas variables del `.env`.

# Estructura del proyecto

```
API_BOLSILLO/
│
├── src/
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── usuarios.controller.js
│   │   ├── cuentas.controller.js
│   │   ├── transacciones.controller.js
│   │   └── bolsillos.controller.js
│   │
│   ├── config/
│   │   └── database.js      (pool pg + TLS, consultar, ejecutarTransaccion)
│   │
│   ├── data/
│   │   └── apiKeys.js       (semilla: se sincroniza con public.api_keys)
│   │   (los demás arreglos en memoria se eliminaron en el
│   │    Bloque 7: los datos viven en PostgreSQL)
│   │
│   ├── docs/
│   │   └── swagger.js
│   │
│   ├── middlewares/
│   │   ├── auth.validator.js
│   │   ├── usuarios.validator.js
│   │   ├── cuentas.validator.js
│   │   ├── transacciones.validator.js
│   │   ├── bolsillos.validator.js
│   │   ├── apiKey.middleware.js
│   │   ├── auth.middleware.js
│   │   ├── errores.middleware.js
│   │   ├── propiedad.middleware.js
│   │   ├── roles.middleware.js
│   │   └── validar.middleware.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── usuarios.routes.js
│   │   ├── cuentas.routes.js
│   │   ├── transacciones.routes.js
│   │   ├── bolsillos.routes.js
│   │   └── seguridad.routes.js
│   │
│   ├── scripts/
│   │   └── crearAdmin.js    (npm run seed:admin)
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── passwordReset.service.js        (Bloque 11)
│   │   ├── codigosRecuperacion.service.js  (Bloque 11)
│   │   ├── usuarios.service.js
│   │   ├── cuentas.service.js
│   │   ├── transacciones.service.js
│   │   ├── bolsillos.service.js
│   │   └── apiKeys.service.js
│   │
│   ├── utils/
│   │   ├── comunes.js
│   │   ├── errores.js       (ErrorNegocio)
│   │   ├── crypto.util.js
│   │   ├── jwt.util.js
│   │   └── password.util.js
│   │
│   └── app.js
│
├── certs/
│   └── prod-ca-2021.crt     (CA pública de Supabase)
│
├── database/
│   ├── 01_esquema_bolsillo.sql
│   ├── 02_roles_seguridad.sql
│   ├── 03_verificacion.sql
│   ├── 04_datos_prueba.sql
│   ├── 11_3_version_sesion.sql            (Bloque 11)
│   ├── 11_4_password_reset_tokens.sql     (Bloque 11)
│   ├── 11_4_2_codigos_recuperacion.sql    (Bloque 11)
│   └── README.md            (guía, modelo y evidencias del Bloque 7)
│
├── scripts/
│   └── probar-conexion.js   (npm run db:probar, incluye diagnóstico RLS)
│
├── postman/
│   ├── API_BOLSILLO.postman_collection.json
│   └── API_BOLSILLO.postman_environment.json
│
├── .env
├── .env.example
├── .gitignore
├── ficha-bolsillo-api.md
├── package.json
├── package-lock.json
└── README.md
```

# EJECUTAR LA API

```
npm run dev
```

---
Servidor ejecutándose en http://localhost:3000

Swagger UI:
http://localhost:3000/api-docs

OpenAPI JSON:
http://localhost:3000/openapi.json
---

# La regla central del dominio

El saldo disponible de una cuenta es el saldo total menos la suma del saldo de sus bolsillos. Todo débito (retiro, transferencia, apartado) se valida contra el disponible, nunca contra el total. Ver `calcularSaldoDisponible()` en `src/services/cuentas.service.js`.

# Lab. No.8 — Control del rol y prevención de escalada de privilegios

## La vulnerabilidad

Antes de este laboratorio, `POST /api/auth/registro` aceptaba el campo `rol` desde el cliente:

- `auth.validator.js` validaba `rol` con `isIn(["administrador", "cliente", "auditor"])`;
- `auth.service.js` guardaba `rol: datos.rol`.

Cualquier cliente con una API Key válida podía registrarse directamente como `administrador` (**escalada de privilegios**).

## Defensa en profundidad

| Capa | Archivo | Cambio |
|---|---|---|
| 1. Validación (allowlist) | `src/middlewares/auth.validator.js` | Se eliminó la validación de `rol`. Solo se aceptan `nombre`, `email` y `password` |
| Filtrado | `src/controllers/auth.controller.js` | Sin cambios: `matchedData()` descarta todo campo no declarado en el validator |
| 2. Persistencia | `src/services/auth.service.js` | `rol: datos.rol` → `rol: "cliente"`. El servidor decide el rol y el estado `activo: true` |
| Documentación | `src/routes/auth.routes.js` | El esquema `RegistroUsuario` ya no expone `rol`, y la descripción indica que el rol lo asigna el servidor |

Así, aunque el cliente envíe `rol`, `activo`, `id`, `passwordHash`, `esSuperAdmin` o `permisos`, esos campos se ignoran:

```
ATACANTE SOLICITÓ              SERVIDOR GUARDÓ
rol: administrador   ──X──►   rol: cliente
activo: false        ──X──►   activo: true
id: 9999             ──X──►   id: siguiente consecutivo
passwordHash: falso  ──X──►   hash bcrypt de la contraseña real
esSuperAdmin: true   ──X──►   no existe
```

> **Allowlisting:** solo se acepta lo que está expresamente autorizado. Enviar un atributo no significa tener autorización para controlarlo.

Nunca se construye el usuario con `...req.body` (mass assignment); los campos se asignan uno a uno.

## ¿Por qué 201 y no 400 al enviar `rol`?

`matchedData()` ignora los campos que no pertenecen al contrato. El registro responde `201`, pero el ataque no tiene efecto: el usuario queda como `cliente`.

## ¿Cómo se creará un administrador?

No desde el registro público. Más adelante, con JWT y autorización, se creará una operación administrativa que solo podrá ejecutar un usuario autorizado. El primer administrador se creará mediante un proceso controlado (seed o migración) cuando haya persistencia.

## Pruebas (requieren header `X-API-Key`)

| Prueba | Body | Resultado esperado |
|---|---|---|
| Registro sin rol | `nombre`, `email`, `password` | `201` + `rol: "cliente"` |
| Intento de rol administrador | `+ "rol": "administrador"` | `201` + `rol: "cliente"` |
| Intento de `activo: false` | `+ "activo": false` | Se mantiene `activo: true` |
| `passwordHash` falso | `+ "passwordHash": "HASH_CONTROLADO"` | Ignorado; el login funciona con la contraseña real |
| `esSuperAdmin` / `permisos` / `id` | `+ "esSuperAdmin": true, "id": 9999, ...` | Ignorados |
| Login correcto | email + contraseña válidos | `200 OK` |
| Login incorrecto | contraseña errónea | `401 Unauthorized` |

Ejemplo de ataque de mass assignment:

```json
{
  "nombre": "Ataque Mass Assignment",
  "email": "mass@bolsillo.com",
  "password": "ClaveSegura2026!",
  "id": 9999,
  "rol": "administrador",
  "activo": false,
  "passwordHash": "HASH_CONTROLADO",
  "esSuperAdmin": true,
  "permisos": ["DELETE_ALL", "ADMIN"]
}
```

Respuesta obtenida:

```json
{
  "mensaje": "Usuario registrado correctamente",
  "usuario": {
    "id": 3,
    "nombre": "Ataque Mass Assignment",
    "email": "mass@bolsillo.com",
    "rol": "cliente",
    "activo": true
  }
}
```

# Lab. No.9 — Autenticación con JWT

El login deja de limitarse a decir "credenciales correctas": ahora entrega una **credencial temporal** (JWT) que identifica al usuario en los endpoints protegidos.

## Cambios

| Archivo | Cambio |
|---|---|
| `package.json` | Nueva dependencia `jsonwebtoken` |
| `.env` / `.env.example` | `JWT_SECRET` (64 bytes aleatorios, solo en `.env`) y `JWT_EXPIRES_IN=1h` |
| `src/utils/jwt.util.js` | `generarToken()` firma con **HS256**, `sub` = id del usuario, payload solo `email` y `rol`. `verificarToken()` solo acepta `algorithms: ["HS256"]` |
| `src/controllers/auth.controller.js` | El login exitoso devuelve `token` |
| `src/middlewares/auth.middleware.js` | `autenticarJWT`: exige `Authorization: Bearer <token>`, verifica firma y expiración y deja el usuario en `req.usuario` |
| `src/routes/auth.routes.js` | Nuevo `GET /api/auth/perfil` (API Key **y** JWT) |
| `src/docs/swagger.js` | Nuevo esquema de seguridad `BearerAuth` |

## Qué lleva el token

```json
{ "email": "cliente@bolsillo.com", "rol": "cliente", "iat": 1791045847, "exp": 1791049447, "sub": "1" }
```

Nunca `password`, `passwordHash` ni otros secretos: **firmar no es cifrar**. Cualquiera puede leer el payload con `jwt.decode()`; la firma solo permite detectar alteraciones. `jwt.verify()` sí comprueba firma y expiración.

## API Key + JWT

> **Actualizado en el Bloque 11:** el login ya no exige API Key y los recursos usan solo JWT. La tabla de abajo describe el estado del Lab. 9; el esquema vigente está en la sección del Bloque 11.

En OpenAPI, para exigir **ambos** esquemas van en el mismo objeto:

```yaml
security:
  - ApiKeyAuth: []
    BearerAuth: []     # API Key AND Bearer (dos guiones serían OR)
```

| Endpoint | API Key | JWT | email/password |
|---|---|---|---|
| `POST /api/auth/login` | ✅ | ❌ (crea el JWT) | ✅ |
| `GET /api/auth/perfil` | ✅ | ✅ (consume el JWT) | ❌ |

| Credencial | Identifica | Ejemplo |
|---|---|---|
| `X-API-Key` → `req.clienteApi` | la aplicación cliente | Postman Laboratorio |
| email + password | al usuario (una vez) | cliente@bolsillo.com |
| JWT → `req.usuario` | la sesión temporal del usuario | `eyJ...` |
| `rol` | base para la autorización (próximo lab) | cliente |

## Pruebas

| Prueba | Petición | Resultado esperado |
|---|---|---|
| Registro | `POST /api/auth/registro` | `201` |
| Login | `POST /api/auth/login` | `200` + `token` |
| Perfil con JWT | `GET /api/auth/perfil` + Bearer | `200` + `usuario` y `clienteApi` |
| Perfil sin JWT | sin `Authorization` | `401` "Token de autenticación requerido" |
| Formato incorrecto | `Authorization: Token eyJ...` | `401` "Formato de token inválido" |
| JWT alterado | un carácter cambiado | `401` "Token inválido" |
| Decodificar | `node -e "console.log(require('jsonwebtoken').decode('TOKEN'))"` | Muestra el payload sin conocer el secreto |
| Expiración | `JWT_EXPIRES_IN=20s`, esperar > 20 s | `401` "Token expirado" |

# Lab. No.10 — Autorización segura: RBAC, IDOR/BOLA y control de acceso a recursos

Estar autenticado no basta. Ahora cada petición responde dos preguntas:

1. **¿Qué puede hacer este rol?** (RBAC) → `autorizarRoles(...)`.
2. **¿Este recurso es suyo?** (propiedad) → middlewares de `propiedad.middleware.js`. Esto evita el **IDOR/BOLA**, es decir, cambiar el ID en la URL para ver datos de otra persona.

## Roles

| Rol | Cómo se obtiene | Qué puede hacer |
|---|---|---|
| `cliente` | `POST /api/auth/registro` (siempre) | Solo lo suyo: ver, retirar y transferir desde su cuenta y gestionar sus bolsillos |
| `auditor` | El admin lo crea con `POST /api/auth/usuarios` | Lectura global (solo `GET`) |
| `administrador` | El inicial se crea al arrancar con `ADMIN_*` del `.env`; los demás, con `POST /api/auth/usuarios` | Todo |

## Cambios

| Archivo | Cambio |
|---|---|
| `src/middlewares/roles.middleware.js` | `autorizarRoles(...roles)`: 403 si el rol del JWT no está permitido |
| `src/middlewares/propiedad.middleware.js` | `autorizarUsuarioPropio`, `autorizarCuentaPropia`, `autorizarCuentaOrigenPropia`, `autorizarCuentaDeBolsilloNuevo`, `autorizarAccesoBolsillo`, `autorizarAccesoTransaccion` |
| `src/services/auth.service.js` | `crearAdministradorInicial()` (bootstrap) y creación de usuarios privilegiados |
| `src/app.js` | `iniciarServidor()`: si la inicialización falla, no se abre el puerto |
| `src/routes/auth.routes.js` | Nuevo `POST /api/auth/usuarios` (solo admin) para crear `auditor` o `administrador` |
| `src/data/usuarios.js` y `usuarios.validator.js` | Nuevo campo `usuarioAuthId`: asocia el titular de billetera con su login |
| `src/routes/cuentas.routes.js` | Nuevo `GET /api/cuentas/mis-cuentas` (solo cliente) |
| `src/routes/*.routes.js` y `src/docs/swagger.js` | Todos los endpoints de negocio exigen API Key **y** JWT, y Swagger documenta los roles y las respuestas 401/403 |

## Cadena de propiedad

Un cliente es dueño de un recurso solo si toda la cadena lo lleva a él:

```
JWT (sub) → usuarioAuth → titular (usuarioAuthId) → cuenta (usuarioId) → bolsillo / transacción
```

El admin asocia el titular con el login mediante `PUT /api/usuarios/{id}` con `usuarioAuthId`. Responde 400 si el login no existe y 409 si no es `cliente` o ya está asociado a otro titular. Un cliente sin titular asociado recibe 403 en todo lo que dependa de la propiedad.

## Matriz de permisos

✅ = permitido · 🔒 = solo si el recurso es suyo · ❌ = 403

| Endpoint | Admin | Auditor | Cliente |
|---|---|---|---|
| `POST /api/auth/usuarios` | ✅ | ❌ | ❌ |
| `GET /api/usuarios`, `/api/cuentas`, `/api/transacciones`, `/api/bolsillos` (listados) | ✅ | ✅ | ❌ |
| `GET /api/usuarios/{id}` y `/{id}/cuentas` | ✅ | ✅ | 🔒 |
| `POST`, `PUT` y `DELETE /api/usuarios` | ✅ | ❌ | ❌ |
| `GET /api/cuentas/mis-cuentas` | ❌ | ❌ | 🔒 |
| `GET /api/cuentas/{id}` (y `/saldo`, `/transacciones`, `/bolsillos`) | ✅ | ✅ | 🔒 |
| `POST /api/cuentas`, `PATCH /api/cuentas/{id}/estado` | ✅ | ❌ | ❌ |
| `GET /api/transacciones/{id}` | ✅ | ✅ | 🔒 (origen o destino) |
| `POST /api/transacciones/deposito` | ✅ | ❌ | ❌ |
| `POST /api/transacciones/retiro` y `/transferencia` | ✅ | ❌ | 🔒 (cuenta origen; el destino puede ser cualquiera) |
| `GET /api/bolsillos/{id}` | ✅ | ✅ | 🔒 |
| `POST`, `PUT`, `DELETE`, `/apartar`, `/devolver` en bolsillos | ✅ | ❌ | 🔒 |
| `PATCH /api/bolsillos/{id}/estado` | ✅ | ❌ | ❌ |

## Decisiones que se apartan del laboratorio

1. **Recurso inexistente:** si un cliente pide un recurso que no existe, recibe 403 igual que si fuera ajeno, para no revelar qué IDs existen. El admin sí recibe 404.
2. **Auditor:** su acceso global solo funciona en `GET`. Es una segunda barrera por si alguna ruta de escritura lo incluyera por error.

## Pruebas

Preparación (en una sola sesión, sin reiniciar el servidor, porque los datos están en memoria):

1. Login del admin (`admin@bolsillo.com` + `ADMIN_PASSWORD`).
2. Registrar a Cliente A, B y C. C se queda **sin titular**.
3. Como admin: crear un auditor con `POST /api/auth/usuarios`, y asociar titular 1 ↔ A y titular 2 ↔ B con `PUT /api/usuarios/{id}` + `usuarioAuthId`.
4. Como admin, depositar a la cuenta 2. Como A, transferir de la cuenta 1 a la 2.

| Prueba | Usuario | Petición | Esperado |
|---|---|---|---|
| Sin JWT | — | `GET /api/cuentas` | 401 |
| Sin API Key | Admin | `GET /api/cuentas` | 401 |
| JWT alterado | A | `GET /api/cuentas/1` | 401 |
| Registro con `rol`, `activo`, `passwordHash`, `esSuperAdmin` | — | `POST /api/auth/registro` | 201, `rol: cliente` |
| Admin crea auditor | Admin | `POST /api/auth/usuarios` | 201 |
| Auditor crea usuario privilegiado | Auditor | `POST /api/auth/usuarios` | 403 |
| Cliente / auditor → depósito | A / Auditor | `POST /api/transacciones/deposito` | 403 |
| Listar todas las cuentas | Admin / Auditor / A | `GET /api/cuentas` | 200 / 200 / 403 |
| Su propia cuenta | A | `GET /api/cuentas/1` | 200 |
| Cuenta ajena (**IDOR**) | A | `GET /api/cuentas/2` | 403 |
| Su transacción / transacción ajena | A | `GET /api/transacciones/{id}` | 200 / 403 |
| Su bolsillo / bolsillo ajeno | A / B | `GET /api/bolsillos/1` | 200 / 403 |
| Mis cuentas | A / B / C (sin titular) | `GET /api/cuentas/mis-cuentas` | 200 (solo la suya) / 200 / 403 |
| Mis cuentas con rol privilegiado | Admin / Auditor | `GET /api/cuentas/mis-cuentas` | 403 |
| Crear cuenta | A / Auditor | `POST /api/cuentas` | 403 |
| Eliminar titular / editar bolsillo | A / Auditor | `DELETE /api/usuarios/1` / `PUT /api/bolsillos/1` | 403 |
| Cambiar estado de cuenta | A | `PATCH /api/cuentas/1/estado` | 403 |

> Para estas pruebas se usa Swagger UI (botón **Authorize** con `ApiKeyAuth` y `BearerAuth`). Desde el Bloque 7, la colección de `postman/` también envía JWT (ver la sección del Bloque 7).

# Bloque 7 — Persistencia con Supabase + PostgreSQL

Los arreglos en memoria se reemplazaron por PostgreSQL (Supabase) **sin cambiar los endpoints ni los contratos JSON**, conservando API Key, JWT, RBAC, BOLA y validaciones. Guía completa, modelo, decisiones y evidencias en [`database/README.md`](./database/README.md).

| Sub-bloque | Alcance | Estado |
|---|---|---|
| 7.1 | Esquema relacional (`database/01…04`), RLS y `REVOKE` | ✅ Local y Supabase |
| 7.2 | `pg` + TLS verificado (`src/config/database.js`), `npm run db:probar` | ✅ Local y Supabase |
| 7.3 | Usuarios de login, auth y bootstrap idempotente del administrador | ✅ Local y Supabase |
| 7.4 | Titulares y API Keys | ✅ Local y Supabase |
| 7.5 | Cuentas, bolsillos y transacciones **atómicas** (`SELECT … FOR UPDATE`) | ✅ Local y Supabase (en Supabase solo lecturas) |

**Puesta en marcha:** crear el proyecto Supabase y ejecutar los scripts de `database/` (ver `database/README.md` §3–§4), poner `DATABASE_URL` en `.env` (Session pooler, sin `sslmode`), y luego `npm run db:probar` y `npm run dev`.

**Lo más importante del bloque:**

- **Todo movimiento de dinero es una transacción SQL:** se bloquea la cuenta, se valida el disponible sobre la fila bloqueada, se mueve el saldo y se registra la transacción, todo o nada. Con 10 retiros simultáneos de 5.000 y 20.000 disponibles se aprueban exactamente 4. Sin el bloqueo se aprobaron 8 y el disponible quedó negativo (verificado con un mutante).
- **La base de datos es la segunda línea de defensa:** CHECK de saldos, montos y estados; unicidad sin distinguir mayúsculas; FK `RESTRICT`; un trigger hace inmutables las transacciones; RLS y `REVOKE` cierran el acceso directo.
- **Montos en `NUMERIC(14,2)`** y con máximo 2 decimales en la entrada.

**Evidencias:** se entregan en PDF, fuera del repositorio.

## Colección de Postman (Bloque 7)

`postman/API_BOLSILLO.postman_collection.json` tiene 40 peticiones y 53 tests automáticos, en este orden: preparación (login, clientes A y B, titulares, cuentas) → movimientos de dinero (caso estrella incluido) → validaciones → seguridad (API Key, JWT, RBAC, BOLA) → integridad.

1. Importar la colección y el environment `postman/API_BOLSILLO.postman_environment.json`.
2. En el environment, completar `apiKey` (el valor de `API_KEY_POSTMAN`), `adminEmail` y `adminPassword` (los de `.env`).
3. **Run collection**, en orden.

Cada corrida crea sus propios datos únicos, así que se puede repetir sobre la misma base. Ojo: como las transacciones son inmutables, cada corrida deja movimientos permanentes en el libro. Úsala contra una base de laboratorio. Desde la terminal:

```bash
npx newman run postman/API_BOLSILLO.postman_collection.json \
  -e postman/API_BOLSILLO.postman_environment.json
```

## Dependencias (`npm audit`)

`npm audit fix` actualizó `proxy-addr` (crítica: falsificación de IP; afecta al rate limit detrás de un proxy), `brace-expansion` y `fast-uri`. **Dependencias de producción: 0 vulnerabilidades** (`npm audit --omit=dev`). Quedan 3 avisos altos en `braces` → `chokidar` → `nodemon`, solo de desarrollo. No se aplicó `npm audit fix --force` porque bajaría nodemon de 3.x a 1.14.10.

# Bloques 7.5.1 y 8 — Bootstrap del administrador y validación integral

- **7.5.1:** `src/app.js` solo arranca Express. El primer administrador se crea con `npm run seed:admin` (`src/scripts/crearAdmin.js`), en una transacción con `pg_advisory_xact_lock(7505, 1)`: no duplica administradores ni convierte en administrador a una cuenta que ya existe.
- **8:** se aplicó la matriz de pruebas del laboratorio (P01–P36 y SEG-01 a SEG-08) a la API Bolsillo, con equivalencias: pacientes → titulares, médicos → cuentas, consultorios → bolsillos, citas → transacciones, médico → auditor.

# Bloque 11 — Versión de sesión, recuperación de cuentas y preparación para React

## Base de datos

Se ejecutan **una vez**, en este orden, sobre la base del Bloque 8. No borran ni reinician nada:

| Script | Qué agrega |
|---|---|
| `database/11_3_version_sesion.sql` | `usuarios_auth.version_sesion INTEGER NOT NULL DEFAULT 0` |
| `database/11_4_password_reset_tokens.sql` | Tabla `password_reset_tokens` (usuario, administrador que autoriza, `token_hash`, vencimiento, uso) |
| `database/11_4_2_codigos_recuperacion.sql` | Tabla `codigos_recuperacion` (usuario, `codigo_hash`, uso) |

Resultado: **nueve tablas** en `public`, todas con RLS habilitado y sin permisos para `anon` ni `authenticated`. Tokens y códigos se guardan solo como hash SHA-256. `database/03_verificacion.sql` ya espera las nueve tablas.

## Versión de sesión

El JWT lleva `vs` (versión de sesión). Al cambiar o restablecer la contraseña, `version_sesion` aumenta en la base y `auth.middleware.js` rechaza los tokens anteriores con `401 "Sesión revocada"`.

## Endpoints nuevos

| Endpoint | Credencial | Qué hace |
|---|---|---|
| `PATCH /api/auth/cambiar-password` | JWT | Exige la contraseña actual; guarda un nuevo hash bcrypt y revoca los JWT anteriores |
| `POST /api/auth/recuperacion/admin/{usuarioId}` | JWT + rol administrador | Emite un token de un solo uso que vence en 15 minutos |
| `POST /api/auth/restablecer-password` | API Key | Cambia la contraseña con el token y lo marca como utilizado |
| `POST /api/auth/codigos-recuperacion` | JWT | Genera ocho códigos de respaldo (visibles una sola vez); pide la contraseña actual |
| `GET /api/auth/codigos-recuperacion/estado` | JWT | Cuántos códigos quedan disponibles |
| `POST /api/auth/codigos-recuperacion/regenerar` | JWT | Invalida los códigos anteriores y genera ocho nuevos |
| `POST /api/auth/restablecer-con-codigo` | API Key | Cambia la contraseña con un código, que se consume |

La recuperación y los códigos tienen su propio rate limit (10 intentos cada 15 minutos).

## Credenciales por tipo de cliente

| Ruta | Credencial | Motivo |
|---|---|---|
| `POST /api/auth/login` | Ninguna (validaciones + rate limit de intentos fallidos) | La SPA React no debe guardar una API Key privada |
| `/api/usuarios`, `/api/cuentas`, `/api/transacciones`, `/api/bolsillos` | JWT (+ RBAC y control de propiedad) | Recursos de la persona autenticada |
| `/api/auth/perfil`, `cambiar-password`, `recuperacion/admin`, `codigos-recuperacion` | JWT | Operaciones sobre la propia cuenta |
| Registro, restablecimientos y `/api/seguridad/cliente` | API Key | Integraciones privadas; los restablecimientos todavía no están listos para el navegador |

Swagger ya no tiene seguridad global: cada operación declara la credencial que exige.

## CORS

Se permiten los orígenes de `ALLOWED_ORIGIN`, los métodos con `OPTIONS` y los encabezados `Content-Type`, `Authorization` y `X-API-Key`. El preflight desde `http://localhost:5173` responde `204` con `Access-Control-Allow-Origin`.

## RLS habilitado no es RLS aplicado

`npm run db:probar` muestra el rol real del `pg.Pool`: `postgres`, con `BYPASSRLS = true`. RLS protege las tablas frente a accesos directos con roles públicos, pero **no filtra las consultas del backend**. El aislamiento entre usuarios lo dan JWT, RBAC y BOLA/IDOR en Express.

## Pendientes

- Reemplazar la conexión `postgres` (BYPASSRLS) por un rol propio con permisos mínimos antes de producción.
- Preparar las rutas de restablecimiento para el navegador.
- Integrar React + Vite y después ejecutar los bloques 9 y 10 de pruebas de seguridad.

# realizar las pruebas y documentar
SAST → Semgrep
SCA  → npm audit
DAST → OWASP ZAP
