# API BOLSILLO — Lab. No.9

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

# realizar las pruebas y documentar
SAST → Semgrep
SCA  → npm audit
DAST → OWASP ZAP
