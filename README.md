# Bolsillo · Billetera virtual segura

Aplicación web cliente-servidor desacoplada para gestionar titulares, cuentas, transacciones y **bolsillos de ahorro** (dinero apartado para una meta sin sacarlo de la cuenta).
Proyecto final del curso de Seguridad en el Desarrollo.

```text
Navegador ─► React + Vite (localhost:5173)
               │  fetch · HTTP/JSON · Authorization: Bearer <JWT>
               ▼
             Express (localhost:3000)
               rutas → middlewares (JWT · RBAC · BOLA/IDOR · validación) → controladores → servicios
               │  pg.Pool + TLS (CA verificada)
               ▼
             PostgreSQL en Supabase (9 tablas, RLS activo)
```

La regla central del negocio: **saldo disponible = saldo total − suma de los bolsillos activos**. La API la aplica en cada débito y PostgreSQL la respalda con restricciones `CHECK`.

## Documentación

| Capa | README | Contenido |
|---|---|---|
| Base de datos | [`backend/database/README.md`](./backend/database/README.md) | Orden de los scripts SQL, modelo de 9 tablas, RLS, verificación |
| Backend (BE) | [`backend/README.md`](./backend/README.md) | Instalación, `.env`, scripts, arquitectura, roles, endpoints, controles |
| Frontend (FE) | [`frontend/README.md`](./frontend/README.md) | Instalación, pantallas por rol, estructura, sesión, accesibilidad |
| Diseño | [`frontend/DESIGN.md`](./frontend/DESIGN.md) | Dirección visual (base neutra + morado de marca, Inter) y el porqué de cada decisión |
| Pruebas de seguridad | [`reportes/README.md`](./reportes/README.md) | SCA, SAST, DAST y pruebas de API: herramientas, comandos y resultados |
| Historial | [`backend/HISTORIAL_LABORATORIOS.md`](./backend/HISTORIAL_LABORATORIOS.md) | Labs 8, 9 y 10 y Bloques 7, 7.5.1 y 11 |

## Estructura del repositorio

```text
API_BOLSILLO/
├── backend/            API REST Node.js + Express
│   ├── database/       scripts SQL de Supabase/PostgreSQL + README
│   ├── src/            app, rutas, middlewares, controladores, servicios
│   ├── postman/        colección y entorno
│   └── README.md
├── frontend/           SPA React + Vite
│   ├── src/
│   └── README.md
├── reportes/           evidencias de SCA, SAST, DAST y pruebas de API
│   ├── antes/          resultados antes de corregir
│   └── despues/        resultados después de corregir
└── README.md           este índice
```

## Arranque rápido (dos terminales)

Requisitos: Node.js 22, npm 10 y un proyecto Supabase con los scripts de `backend/database/` aplicados.

**Terminal 1: backend**

```bash
cd backend
npm ci
cp .env.example .env      # completar DATABASE_URL, JWT_SECRET, API keys
npm run db:probar         # verifica la conexión TLS
npm run seed:admin        # solo la primera vez
npm run dev               # http://localhost:3000 · Swagger en /api-docs
```

**Terminal 2: frontend**

```bash
cd frontend
npm ci
cp .env.example .env      # VITE_API_URL=http://localhost:3000
npm run dev               # http://localhost:5173
```

## Roles

| Rol | Puede |
|---|---|
| **Administrador** | Gestionar titulares y cuentas, depositar, cambiar estados, emitir tokens de recuperación, crear personal |
| **Auditor** | Consultar todo, sin modificar nada |
| **Cliente** | Ver y mover solo su dinero: transferir, retirar, crear bolsillos, apartar y devolver |

Cada endpoint vuelve a validar en el servidor el JWT, el rol (RBAC) y que el recurso pertenezca a quien lo pide (BOLA/IDOR). El frontend nunca decide permisos.

## Seguridad

| Prueba | Herramientas | Comando |
|---|---|---|
| SCA (dependencias) | `npm audit`, OSV-Scanner | `npm audit` en `backend/` y `frontend/` |
| SAST (código) | Semgrep, ESLint + `eslint-plugin-security` | `npm run sast` en cada carpeta |
| DAST (aplicación en ejecución) | OWASP ZAP (baseline y API scan) | ver `reportes/README.md` |
| Pruebas de API | Newman (Postman) + script de casos de seguridad | ver `reportes/README.md` |

Secretos: solo en `backend/.env` (ignorado por git). El frontend solo conoce la URL pública de la API.
