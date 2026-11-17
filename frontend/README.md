# Frontend · Bolsillo (React + Vite)

SPA de la billetera virtual Bolsillo. Consume la API REST del [backend](../backend/README.md) con `fetch` y JWT.
**React 19 + Vite 8 + React Router 7**, CSS propio (sin plantillas), tipografías Fraunces e Instrument Sans empaquetadas con `@fontsource`.

> Índice del repositorio: [`../README.md`](../README.md) · Dirección visual y decisiones de diseño: [`DESIGN.md`](./DESIGN.md)

---

## 1. Requisitos

- Node.js 22.x (Vite 8 exige Node 20.19+ o 22.12+) y npm 10.
- El backend corriendo en `http://localhost:3000` con `ALLOWED_ORIGIN` que incluya `http://localhost:5173`.

## 2. Instalación paso a paso

```bash
# 1. Entrar a la carpeta del frontend
cd frontend

# 2. Instalar dependencias exactas
npm ci

# 3. Configurar la URL de la API
cp .env.example .env          # VITE_API_URL=http://localhost:3000

# 4. Desarrollo (http://localhost:5173)
npm run dev

# 5. Calidad y seguridad
npm run lint                  # oxlint
npm run sast                  # ESLint + eslint-plugin-security + no-unsanitized

# 6. Compilación de producción (carpeta dist/) y vista previa
npm run build
npm run preview               # http://localhost:4173
```

Cómo se creó el proyecto (referencia):

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install react-router-dom @fontsource-variable/fraunces @fontsource-variable/instrument-sans
```

### Variables de entorno

| Variable | Ejemplo | Nota |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Única variable. Todo lo que empieza por `VITE_` **queda visible en el navegador**: nunca poner aquí `DATABASE_URL`, `JWT_SECRET`, contraseñas ni API Keys. |

## 3. Pantallas por rol

| Ruta | Cliente | Administrador | Auditor |
|---|---|---|---|
| `/acceso` | Iniciar sesión | Iniciar sesión | Iniciar sesión |
| `/recuperar` | Recuperar con código de respaldo o token del administrador | igual | igual |
| `/` | Sus cuentas con la barra de saldo y últimos movimientos | Resumen: dinero custodiado, cuentas y movimientos por tipo | Igual, solo lectura |
| `/cuentas` | Sus cuentas | Todas, con filtros, paginación y "Abrir una cuenta" | Todas, solo lectura |
| `/cuentas/:id` | Transferir, retirar, crear bolsillos, apartar y devolver | Además: depositar y cambiar estado | Solo lectura |
| `/titulares` | No disponible | CRUD, token de recuperación y acceso de personal | Solo lectura |
| `/movimientos` | No disponible | Todas las transacciones con filtros | Igual |
| `/seguridad` | Cambiar contraseña y códigos de respaldo | igual | igual |

`RutaProtegida` solo decide qué se muestra. **No es un control de seguridad**: cada endpoint valida JWT, rol y propiedad en el backend.

## 4. Estructura

Librerías de interfaz: `sonner` (avisos emergentes), `@phosphor-icons/react` (íconos) y `motion` (indicador de navegación y cifras animadas). Ninguna exige `unsafe-eval`, así que la CSP estricta del build se mantiene.

```text
frontend/
├── index.html                 documento raíz (lang="es")
├── DESIGN.md                  dirección visual "Libreta de ahorro"
├── vite.config.js             puerto 5173 fijo (es el origen permitido por CORS)
├── eslint.security.config.js  reglas de SAST
├── public/favicon.svg
└── src/
    ├── main.jsx               monta App con BrowserRouter y AuthProvider
    ├── App.jsx                rutas
    ├── styles/
    │   ├── tokens.css         colores claro/oscuro, tipografía, radios
    │   └── app.css            componentes y diseño responsive
    ├── services/
    │   ├── api.js             fetch con JWT, manejo de errores y 401
    │   ├── auth.service.js    login, perfil, contraseñas y recuperación
    │   ├── recursos.service.js cuentas, bolsillos, transacciones, titulares, indicadores
    │   └── sesion-expirada.js aviso de sesión vencida o revocada
    ├── context/               AuthContext (sesión, cierre al vencer el JWT)
    ├── hooks/                 useAuth, useCarga (cargando/error/datos), usePaginacion, useTema
    ├── components/            Marco (lomo lateral + pestañas móviles), RutaProtegida,
    │                          PanelCuenta (saldo, acciones, bolsillos, extracto),
    │                          BarraSaldo, CifraAnimada, Sobre (bolsillo con anillo de meta),
    │                          Extracto, IconoMovimiento, GraficoTipos, Hoja (diálogo
    │                          deslizable), Formulario, FormularioMovimiento, EstadoVista,
    │                          Notificaciones, Sello, Paginacion, SelectorTema
    ├── pages/                 Acceso, Recuperar, Inicio, Cuentas, Cuenta, Titulares,
    │                          Movimientos, Seguridad, NoEncontrada
    └── utils/                 formato (COP, fechas, etiquetas) y tema
```

## 5. Manejo de la sesión

1. `POST /api/auth/login` (público, sin API Key) devuelve `{ usuario, token }`.
2. La sesión se guarda en `sessionStorage` (`bolsillo.sesion`): se borra al cerrar la pestaña.
3. Cada petición envía `Authorization: Bearer <token>`.
4. El cliente programa el cierre al vencer `exp` del JWT. Si la API responde **401** (token vencido o revocado por `version_sesion`), se cierra la sesión y se muestra el motivo en `/acceso`.
5. Al cambiar la contraseña se cierra la sesión porque el backend invalida todos los JWT anteriores.

## 6. Diseño, accesibilidad y responsive

- Paleta de 2 colores + 1 acento (cobre solo para lo apartado en bolsillos). Contraste AA verificado: el peor caso es 5.06:1 en tema claro y 6.97:1 en oscuro.
- Tema claro, oscuro o del sistema (botón en la cabecera).
- Navegación completa con teclado: enlace "Saltar al contenido", foco visible, diálogos nativos `<dialog>` que se cierran con Escape.
- Toda vista con datos tiene estados de carga, vacío y error con botón "Reintentar".
- En pantallas de menos de 720 px las tablas se convierten en fichas y el menú se pliega. Los objetivos táctiles miden al menos 44 px.
- Respeta `prefers-reduced-motion`.

## 7. Problemas frecuentes

| Síntoma | Solución |
|---|---|
| "No se pudo contactar la API" | Encender el backend y revisar `VITE_API_URL` |
| Error de CORS en la consola | Agregar `http://localhost:5173` a `ALLOWED_ORIGIN` del backend y reiniciarlo |
| `Port 5173 is already in use` | Cerrar el otro proceso: el puerto es fijo porque es el origen autorizado |
| Vuelve al inicio de sesión al recargar otra pestaña | Es esperado: `sessionStorage` es por pestaña |
