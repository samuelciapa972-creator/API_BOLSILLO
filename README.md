# API BOLSILLO — Lab. No.5

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
API_HOSPITAL/
│
├── src/
│   │
│   ├── controllers/
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
│   │   └── apiKeys.js
│   │
│   ├── docs/
│   │   └── swagger.js
│   │
│   ├── middlewares/
│   │   ├── usuarios.validator.js
│   │   ├── cuentas.validator.js
│   │   ├── transacciones.validator.js
│   │   ├── bolsillos.validator.js
│   │   ├── apiKey.middleware.js
│   │   ├── errores.middleware.js
│   │   └── validar.middleware.js
│   │
│   ├── routes/
│   │   ├── usuarios.routes.js
│   │   ├── cuentas.routes.js
│   │   ├── transacciones.routes.js
│   │   ├── bolsillos.routes.js
│   │   └── seguridad.routes.js
│   │
│   ├── services/
│   │   ├── usuarios.service.js
│   │   ├── cuentas.service.js
│   │   ├── transacciones.service.js
│   │   ├── bolsillos.service.js
│   │   └── apiKeys.service.js
│   │
│   ├── utils/
│   │   ├── comunes.js
│   │   └── crypto.util.js
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

# realizar las pruebas y documentar
SAST → Semgrep
SCA  → npm audit
DAST → OWASP ZAP
