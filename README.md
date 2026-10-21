# API BOLSILLO — Lab. No.10

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

Los datos se almacenan inicialmente en memoria mediante archivos JavaScript.

Esta arquitectura será posteriormente adaptable a BaaS.

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

Desde el Lab. No.10 se configura el administrador inicial:

```
ADMIN_NOMBRE=Administrador Bolsillo
ADMIN_EMAIL=admin@bolsillo.com
ADMIN_PASSWORD=<contraseña segura>
```

Si faltan, el servidor arranca con la advertencia "Administrador inicial no configurado" y no habrá ningún administrador.

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
│   ├── data/
│   │   ├── usuarios.js
│   │   ├── cuentas.js
│   │   ├── transacciones.js
│   │   ├── bolsillos.js
│   │   ├── apiKeys.js
│   │   └── usuariosAuth.js
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
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── usuarios.service.js
│   │   ├── cuentas.service.js
│   │   ├── transacciones.service.js
│   │   ├── bolsillos.service.js
│   │   └── apiKeys.service.js
│   │
│   ├── utils/
│   │   ├── comunes.js
│   │   ├── crypto.util.js
│   │   ├── jwt.util.js
│   │   └── password.util.js
│   │
│   └── app.js
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

> La colección de Postman de `postman/` es anterior a este laboratorio y no envía JWT. Para estas pruebas se usa Swagger UI (botón **Authorize** con `ApiKeyAuth` y `BearerAuth`).

# Bloque 7 — Persistencia con Supabase + PostgreSQL

Migración progresiva de `src/data/` a PostgreSQL, conservando API Key, JWT, RBAC y BOLA. Guía completa, modelo y evidencias en [`database/README.md`](./database/README.md).

| Sub-bloque | Alcance | Estado |
|---|---|---|
| 7.1 | Esquema relacional (`database/01…04`), RLS y `REVOKE` | Verificado en local y en Supabase |
| 7.2 | `pg` + TLS verificado (`src/config/database.js`), `npm run db:probar` | Verificado contra Supabase (Session pooler) |
| 7.3 | Usuarios de login, auth y bootstrap del administrador | Pendiente |
| 7.4 | Titulares y API Keys | Pendiente |
| 7.5 | Cuentas, bolsillos y transacciones atómicas | Pendiente |

Requiere `DATABASE_URL` en `.env` (ver `.env.example`).

# realizar las pruebas y documentar
SAST → Semgrep
SCA  → npm audit
DAST → OWASP ZAP
