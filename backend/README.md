# Backend · API Bolsillo

API REST de una billetera virtual: titulares, cuentas, transacciones y bolsillos de ahorro.
**Node.js + Express 4 (CommonJS)**, PostgreSQL en **Supabase** con `pg`, autenticación **JWT**, autorización **RBAC + propiedad (BOLA/IDOR)** y documentación **OpenAPI/Swagger**.

> Índice general del repositorio: [`../README.md`](../README.md) · Base de datos: [`database/README.md`](./database/README.md) · Frontend: [`../frontend/README.md`](../frontend/README.md)
> Historial de laboratorios (Labs 8, 9, 10 y Bloques 7, 7.5.1 y 11): [`HISTORIAL_LABORATORIOS.md`](./HISTORIAL_LABORATORIOS.md)

---

## 1. Requisitos

| Herramienta | Versión probada | Para qué |
|---|---|---|
| Node.js | 22.x (mínimo 20) | Ejecutar la API |
| npm | 10.x | Instalar dependencias |
| Proyecto Supabase | PostgreSQL (Session pooler) | Persistencia |
| Certificado CA de Supabase | `certs/prod-ca-2021.crt` | Conexión TLS verificada |
| Postman o Newman (opcional) | | Colección en `postman/` |

## 2. Instalación paso a paso

```bash
# 1. Entrar a la carpeta del backend
cd backend

# 2. Instalar exactamente las versiones del package-lock.json
npm ci

# 3. Crear la configuración local (nunca se sube a GitHub)
cp .env.example .env
#    y completar los valores (ver sección 3)

# 4. Preparar la base de datos en Supabase
#    seguir database/README.md (scripts 01 → 02 → 11_3 → 11_4 → 11_4_2 → 03)

# 5. Comprobar la conexión y el rol con el que se conecta la API
npm run db:probar

# 6. Crear el primer administrador (solo una vez)
npm run seed:admin

# 7. Iniciar la API
npm run dev        # desarrollo, con recarga automática (nodemon)
# o
npm start          # sin recarga
```

Al arrancar debe verse:

```text
Servidor ejecutándose en http://localhost:3000
Swagger UI: http://localhost:3000/api-docs
OpenAPI JSON: http://localhost:3000/openapi.json
```

## 3. Variables de entorno (`.env`)

| Variable | Ejemplo | Uso |
|---|---|---|
| `PORT` | `3000` | Puerto HTTP |
| `ALLOWED_ORIGIN` | `http://localhost:3000,http://localhost:5173` | Orígenes CORS permitidos (Swagger y la SPA de React) |
| `TRUST_PROXY` | `false` | Solo si la API corre detrás de un proxy (afecta al rate limit) |
| `DATABASE_URL` | `postgresql://USUARIO:CONTRASENA@HOST:5432/postgres` | Session pooler de Supabase |
| `JWT_SECRET` | 64+ caracteres aleatorios | Firma HS256 de los tokens |
| `JWT_EXPIRES_IN` | `1h` | Vigencia del JWT |
| `API_KEY_POSTMAN`, `API_KEY_ADMIN`, `API_KEY_MOVIL` | claves largas aleatorias | Clientes de confianza (se guardan solo como hash) |
| `ADMIN_NOMBRE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | | Solo para `npm run seed:admin`; después pueden retirarse |

Generar secretos:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

> El frontend **nunca** recibe `DATABASE_URL`, `JWT_SECRET` ni API Keys. Solo conoce `VITE_API_URL`.

## 4. Scripts de npm

| Script | Qué hace |
|---|---|
| `npm run dev` | API con nodemon |
| `npm start` | API en modo normal |
| `npm run db:probar` | Prueba la conexión TLS y muestra el rol real del `pg.Pool` (incluido `BYPASSRLS`) |
| `npm run seed:admin` | Crea el primer administrador dentro de una transacción con bloqueo; si ya existe, no hace nada |
| `npm run sast` | Análisis estático de seguridad con ESLint + `eslint-plugin-security` |
| `npm audit` | Análisis de dependencias (SCA) |

## 5. Arquitectura

```text
Cliente (React :5173 · Postman · Swagger)
   │  HTTP/JSON  ·  Authorization: Bearer <JWT>  |  X-API-Key
   ▼
app.js ─ helmet ─ CORS (lista blanca) ─ JSON ≤ 10 kB ─ rate limit ─ filtro API Key/JWT
   ▼
routes/        rutas y documentación OpenAPI (JSDoc)
   ▼
middlewares/   autenticarJWT → autorizarRoles (RBAC) → validadores → validar → propiedad (BOLA/IDOR)
   ▼
controllers/   matchedData() (anti mass assignment) y respuesta HTTP
   ▼
services/      SQL parametrizado, transacciones con FOR UPDATE
   ▼
config/database.js  pg.Pool + TLS (CA verificada) → PostgreSQL (Supabase)
```

| Carpeta / archivo | Responsabilidad |
|---|---|
| `src/app.js` | Configuración de Express, seguridad, montaje de rutas, Swagger |
| `src/config/database.js` | Pool `pg` con TLS, `consultar()` y `ejecutarTransaccion()` |
| `src/routes/` | `auth`, `usuarios` (titulares), `cuentas`, `transacciones`, `bolsillos`, `estadisticas`, `seguridad` |
| `src/middlewares/` | JWT, roles, propiedad, API Key, validadores y manejo de errores |
| `src/controllers/` | Coordinan petición → servicio → respuesta |
| `src/services/` | Reglas de negocio y SQL |
| `src/utils/` | JWT, bcrypt, criptografía, redondeo de moneda |
| `src/scripts/crearAdmin.js` | Bootstrap del administrador |
| `scripts/probar-conexion.js` | Diagnóstico de conexión |
| `database/` | Scripts SQL (ver su README) |
| `postman/` | Colección y entorno de Postman |
| `eslint.security.config.mjs` | Reglas de SAST |

## 6. Roles y permisos

| Recurso | Administrador | Auditor | Cliente |
|---|---|---|---|
| Titulares (`/api/usuarios`) | CRUD | Leer | Solo el suyo |
| Cuentas | Crear, leer, cambiar estado | Leer | Solo las suyas (`/mis-cuentas`) |
| Depósitos | Sí | No | No |
| Retiros y transferencias | Sí | No | Solo desde sus cuentas |
| Bolsillos | Sí | Leer | Solo en sus cuentas |
| Indicadores (`/api/estadisticas/resumen`) | Sí | Sí | No (403) |

El rol **no basta**: `propiedad.middleware.js` verifica en PostgreSQL que la cuenta, el bolsillo o la transacción pertenezcan al cliente autenticado. Cambiar un ID en la URL devuelve 403/404, nunca datos ajenos.

## 7. Endpoints

Documentación interactiva: `http://localhost:3000/api-docs` · Especificación: `http://localhost:3000/openapi.json`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión (público, con rate limit) |
| POST | `/api/auth/registro` | Registrar cliente (requiere API Key) |
| GET | `/api/auth/perfil` | Perfil del usuario autenticado |
| POST | `/api/auth/usuarios` | Crear auditor o administrador (solo administrador) |
| PATCH | `/api/auth/cambiar-password` | Cambiar la contraseña propia y revocar los JWT anteriores |
| POST | `/api/auth/recuperacion/admin/{usuarioId}` | El administrador emite un token de recuperación de un solo uso |
| POST | `/api/auth/restablecer-password` | Restablecer con el token temporal |
| POST | `/api/auth/codigos-recuperacion` | Generar ocho códigos de respaldo |
| GET | `/api/auth/codigos-recuperacion/estado` | Códigos disponibles |
| POST | `/api/auth/codigos-recuperacion/regenerar` | Revocar y generar códigos nuevos |
| POST | `/api/auth/restablecer-con-codigo` | Recuperar con un código de respaldo |
| GET, POST | `/api/usuarios` | Listar / crear titulares |
| GET, PUT, DELETE | `/api/usuarios/{id}` | Ver / reemplazar / eliminar titular |
| GET | `/api/usuarios/{id}/cuentas` | Cuentas de un titular |
| GET, POST | `/api/cuentas` | Listar / abrir cuenta |
| GET | `/api/cuentas/mis-cuentas` | Cuentas del cliente autenticado |
| GET | `/api/cuentas/{id}` | Ver cuenta |
| GET | `/api/cuentas/{id}/saldo` | Saldo total, apartado y disponible |
| GET | `/api/cuentas/{id}/transacciones` | Extracto de la cuenta |
| GET | `/api/cuentas/{id}/bolsillos` | Bolsillos de la cuenta |
| PATCH | `/api/cuentas/{id}/estado` | Activar, bloquear o cerrar |
| GET | `/api/transacciones` | Todas las transacciones |
| GET | `/api/transacciones/{id}` | Ver transacción |
| POST | `/api/transacciones/deposito` | Depósito |
| POST | `/api/transacciones/retiro` | Retiro |
| POST | `/api/transacciones/transferencia` | Transferencia entre cuentas |
| GET, POST | `/api/bolsillos` | Listar / crear bolsillo |
| GET, PUT, DELETE | `/api/bolsillos/{id}` | Ver / editar / eliminar bolsillo |
| POST | `/api/bolsillos/{id}/apartar` | Apartar dinero |
| POST | `/api/bolsillos/{id}/devolver` | Devolver dinero a la cuenta |
| PATCH | `/api/bolsillos/{id}/estado` | Activar o archivar |
| GET | `/api/estadisticas/resumen` | Indicadores del panel (nuevo en el proyecto final) |
| GET | `/api/seguridad/cliente` | Cliente identificado por API Key |

## 8. Controles de seguridad

| Control | Dónde |
|---|---|
| Contraseñas con bcrypt | `utils/password.util.js` |
| JWT HS256 con expiración y `version_sesion` (revocación al cambiar la clave) | `utils/jwt.util.js`, `middlewares/auth.middleware.js` |
| RBAC | `middlewares/roles.middleware.js` |
| BOLA/IDOR | `middlewares/propiedad.middleware.js` |
| Validación y anti mass assignment | `*.validator.js` + `matchedData()` |
| Los errores de validación no devuelven lo enviado (sin eco de contraseñas) | `middlewares/validar.middleware.js` |
| Helmet, CORS con lista blanca, JSON ≤ 10 kB | `app.js` |
| Rate limit global (100 / 15 min) y específico en login y recuperación | `app.js`, `routes/auth.routes.js` |
| API Keys guardadas como hash SHA-256 | `services/apiKeys.service.js` |
| SQL parametrizado y movimientos atómicos con `FOR UPDATE` | `services/*.service.js` |
| Errores de PostgreSQL traducidos sin filtrar detalles | `middlewares/errores.middleware.js` |

Resultados de SCA, SAST, DAST y pruebas de API: [`../reportes/`](../reportes/) y el PDF de evidencias del proyecto final.

## 9. Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| `tenant/user ... not found` | El proyecto Supabase (plan gratuito) está pausado | Restaurarlo desde el dashboard de Supabase |
| `self-signed certificate in certificate chain` | Falta o no coincide el CA | Revisar `certs/prod-ca-2021.crt` |
| `429 Demasiadas solicitudes` | Rate limit en memoria | Esperar 15 min o reiniciar la API en desarrollo |
| El navegador muestra error de CORS | Origen no listado | Añadirlo a `ALLOWED_ORIGIN` |
| `401` después de cambiar la contraseña | `version_sesion` revocó el JWT | Iniciar sesión de nuevo (comportamiento esperado) |
