# Bolsillo — API REST para una billetera virtual sencilla

Ficha preliminar de proyecto + guía de implementación.
Documento de referencia para el desarrollo. No se aprueba el inicio de la
programación hasta que recursos, atributos, relaciones y reglas de negocio
estén definidos.

**Flujo de trabajo:**

```
PROBLEMA → RECURSOS → ATRIBUTOS → RELACIONES → REGLAS DE NEGOCIO →
ENDPOINTS → VALIDACIONES → ARQUITECTURA → CÓDIGO → OPENAPI →
PRUEBAS → SEGURIDAD
```

---

## 1. Ficha preliminar (formato de entrega)

| Elemento | Definición |
|---|---|
| **Nombre del proyecto** | Bolsillo — API REST para una billetera virtual sencilla |
| **Problema identificado** | Una billetera digital necesita registrar usuarios, mantener el saldo de sus cuentas, mover dinero entre ellas y dejar trazabilidad de cada movimiento. Además, los usuarios necesitan apartar dinero para metas de ahorro sin sacarlo de la billetera. Sin un sistema centralizado no hay forma de garantizar que el saldo sea consistente ni de auditar quién movió qué y cuándo. |
| **Propósito de la API** | Desarrollar una API REST segura para gestionar una billetera virtual, permitiendo administrar usuarios, cuentas, transacciones y bolsillos de ahorro, inicialmente con datos en memoria y evolucionando posteriormente hacia persistencia, autenticación y controles de acceso. |
| **Recurso 1** | Usuarios — gestionar las personas registradas en la billetera |
| **Recurso 2** | Cuentas — gestionar el saldo y el estado de cada cuenta, asociada a un usuario |
| **Recurso 3** | Transacciones — registrar todo movimiento de dinero: depósito, retiro, transferencia y apartados |
| **Recurso 4** | Bolsillos — gestionar metas de ahorro que apartan saldo dentro de una misma cuenta |
| **Recurso 5** | No aplica (el proyecto queda con 4 recursos, dentro del rango 3–5) |
| **Relaciones entre recursos** | Usuario 1:N Cuenta · Cuenta 1:N Bolsillo · Cuenta 1:N Transacción (como origen o destino) · Bolsillo 0:N Transacción (apartados y devoluciones) |
| **Principales reglas de negocio** | Ver sección 5 (12 reglas). La central: el saldo disponible = saldo total − suma de bolsillos. |
| **Endpoints propuestos** | Ver sección 6 (27 endpoints sobre 4 recursos) |
| **Validaciones principales** | Ver sección 7 |
| **Casos de prueba** | Ver sección 9 |

**Alcance técnico de esta entrega:** datos en memoria, sin base de datos.
Sin autenticación en esta fase. La persistencia en BaaS y el control de acceso
quedan para una fase posterior.

---

## 2. Recursos

| Recurso | Responsabilidad |
|---|---|
| Usuarios | Gestionar las personas registradas en la billetera |
| Cuentas | Gestionar el saldo y el estado de cada cuenta, asociada a un usuario |
| Transacciones | Registrar todo movimiento de dinero: depósito, retiro, transferencia y apartados |
| Bolsillos | Gestionar metas de ahorro que apartan saldo dentro de una misma cuenta |

---

## 3. Atributos

```
Usuario                    Cuenta
├── id                     ├── id
├── nombre                 ├── usuarioId
├── documento              ├── numeroCuenta
├── email                  ├── saldoTotal
├── telefono               ├── moneda
└── estado                 └── estado

Transaccion                Bolsillo
├── id                     ├── id
├── tipo                   ├── cuentaId
├── cuentaOrigenId         ├── nombre
├── cuentaDestinoId        ├── meta
├── bolsilloId             ├── saldo
├── monto                  ├── fechaCreacion
├── descripcion            └── estado
├── fecha
└── estado
```

### Tipos

| Campo | Tipo |
|---|---|
| `id`, `usuarioId`, `cuentaId`, `bolsilloId`, `cuentaOrigenId`, `cuentaDestinoId` | número entero |
| `saldoTotal`, `saldo`, `monto`, `meta` | número decimal |
| `nombre`, `documento`, `numeroCuenta`, `descripcion` | texto |
| `email` | correo |
| `telefono` | texto (10 dígitos) |
| `fecha`, `fechaCreacion` | fecha-hora ISO 8601 |
| `estado`, `tipo`, `moneda` | conjunto de valores permitidos |

> `cuentaOrigenId`, `cuentaDestinoId` y `bolsilloId` son nulos según el tipo de
> transacción: un depósito no tiene origen, un retiro no tiene destino, y solo
> los apartados y devoluciones referencian un bolsillo.

---

## 4. Relaciones entre recursos

```
Usuario
   │ 1 : N
   ▼
 Cuenta ──────► Transaccion   (como origen o destino)
   │ 1 : N            ▲
   ▼                  │ 0 : N
Bolsillo ─────────────┘        (apartar y devolver generan movimiento)
```

Esto evolucionará naturalmente a Primary Key / Foreign Key cuando se llegue a
persistencia en BaaS.

---

## 5. Reglas de negocio

1. No se puede crear una cuenta si el usuario no existe o está inactivo.
2. El documento y el email de un usuario son únicos.
3. **El saldo disponible de una cuenta es el saldo total menos la suma del
   saldo de sus bolsillos.** Todo débito (retiro, transferencia, apartado) se
   valida contra el disponible, nunca contra el total.
4. Una transferencia exige que ambas cuentas existan, estén activas y sean
   distintas.
5. El monto siempre debe ser mayor que cero y no superar el límite por
   transacción (2.000.000).
6. Una cuenta bloqueada o cerrada no puede enviar ni recibir dinero, ni operar
   bolsillos.
7. Una cuenta con saldo total mayor que cero no puede cerrarse.
8. No se puede eliminar un bolsillo que tenga saldo: primero debe devolverse el
   dinero a la cuenta.
9. No se puede devolver de un bolsillo más de lo que este contiene.
10. El nombre del bolsillo es único dentro de la misma cuenta, y una cuenta
    admite máximo 10 bolsillos.
11. Las transacciones son inmutables: no se editan ni se eliminan, solo se
    consultan.
12. Toda operación que mueva dinero, incluidos apartados y devoluciones, debe
    quedar registrada como transacción.

> La regla 3 es el corazón del proyecto: apartar dinero no cambia el saldo
> total de la cuenta, solo reduce lo que se puede gastar. Es lo que diferencia
> esto de un CRUD con validaciones.

### Comprobaciones previas a una transferencia

```
¿Existe la cuenta origen?
        ↓
¿Existe la cuenta destino?
        ↓
¿Son distintas?
        ↓
¿Ambas están activas?
        ↓
¿El monto es válido?
        ↓
¿El saldo DISPONIBLE del origen alcanza?
        ↓
   Crear transacción
```

### Ciclo de vida de los estados

```
Cuenta:     activa ──► bloqueada ──► activa
                 └────► cerrada          (terminal, exige saldo en 0)

Bolsillo:   activo ──► archivado         (terminal, exige saldo en 0)

Transacción: pendiente ──► exitosa
                      └──► fallida
```

---

## 6. Endpoints

### Usuarios

```
GET    /api/usuarios
GET    /api/usuarios/:id
POST   /api/usuarios
PUT    /api/usuarios/:id
DELETE /api/usuarios/:id
GET    /api/usuarios/:id/cuentas
```

### Cuentas

```
GET    /api/cuentas
GET    /api/cuentas/:id
POST   /api/cuentas
GET    /api/cuentas/:id/saldo
GET    /api/cuentas/:id/transacciones
GET    /api/cuentas/:id/bolsillos
PATCH  /api/cuentas/:id/estado
```

### Transacciones

```
GET    /api/transacciones
GET    /api/transacciones/:id
POST   /api/transacciones/deposito
POST   /api/transacciones/retiro
POST   /api/transacciones/transferencia
```

### Bolsillos

```
GET    /api/bolsillos
GET    /api/bolsillos/:id
POST   /api/bolsillos
PUT    /api/bolsillos/:id
DELETE /api/bolsillos/:id
POST   /api/bolsillos/:id/apartar
POST   /api/bolsillos/:id/devolver
PATCH  /api/bolsillos/:id/estado
```

### Decisiones de diseño a sustentar

- `GET /api/cuentas/:id/saldo` devuelve **dos** valores: `saldoTotal` y
  `saldoDisponible`.
- Transacciones no tiene `PUT` ni `DELETE` a propósito: es un libro contable.
  Esa ausencia es una decisión de dominio, no un olvido.
- Las tres rutas `POST` de transacciones están separadas porque cada tipo valida
  cosas distintas: un depósito no tiene cuenta origen, una transferencia exige
  dos cuentas.
- `apartar` y `devolver` son `POST` y no `PATCH` porque cada llamada crea un
  movimiento nuevo, no modifica el estado de un recurso existente.

---

## 7. Validaciones

| Campo | Reglas |
|---|---|
| `nombre` (usuario) | obligatorio · string · 3 a 100 caracteres |
| `documento` | obligatorio · string numérico · 6 a 15 caracteres · único |
| `email` | obligatorio · formato email · único |
| `telefono` | obligatorio · 10 dígitos · empieza por 3 |
| `estado` (usuario) | `activo` \| `inactivo` |
| `usuarioId` | obligatorio · entero · debe existir |
| `numeroCuenta` | generado por el sistema · único |
| `saldoTotal` | decimal · mínimo 0 · **nunca se recibe del cliente** |
| `moneda` | `COP` (único valor por ahora) |
| `estado` (cuenta) | `activa` \| `bloqueada` \| `cerrada` |
| `tipo` | `deposito` \| `retiro` \| `transferencia` \| `apartado` \| `devolucion` |
| `monto` | obligatorio · decimal · mayor que 0 · máximo 2.000.000 |
| `descripcion` | opcional · máximo 120 caracteres |
| `fecha` | generada por el sistema |
| `estado` (transacción) | `pendiente` \| `exitosa` \| `fallida` |
| `nombre` (bolsillo) | obligatorio · string · 3 a 40 caracteres · único por cuenta |
| `meta` | opcional · decimal · mayor que 0 |
| `saldo` (bolsillo) | decimal · mínimo 0 · **nunca se recibe del cliente** |
| `estado` (bolsillo) | `activo` \| `archivado` |

> `saldoTotal`, `saldo`, `id`, `fecha`, `numeroCuenta` y `estado` nunca se toman
> de `req.body`. Usar `matchedData()` con allowlist para evitar Mass Assignment.

---

## 8. Datos de prueba (JSON)

Construir estos ejemplos **antes** de programar: prácticamente definen el
futuro modelo.

```json
{
  "id": 1,
  "nombre": "Ana Ruiz",
  "documento": "1057234891",
  "email": "ana.ruiz@example.com",
  "telefono": "3124567890",
  "estado": "activo"
}
```

```json
{
  "id": 1,
  "usuarioId": 1,
  "numeroCuenta": "3124567890",
  "saldoTotal": 250000.00,
  "moneda": "COP",
  "estado": "activa"
}
```

```json
{
  "id": 1,
  "cuentaId": 1,
  "nombre": "Viaje a Cartagena",
  "meta": 800000.00,
  "saldo": 150000.00,
  "fechaCreacion": "2026-09-14T10:32:00Z",
  "estado": "activo"
}
```

```json
{
  "id": 1,
  "tipo": "transferencia",
  "cuentaOrigenId": 1,
  "cuentaDestinoId": 2,
  "bolsilloId": null,
  "monto": 50000.00,
  "descripcion": "Pago almuerzo",
  "fecha": "2026-09-14T12:05:00Z",
  "estado": "exitosa"
}
```

Respuesta esperada de `GET /api/cuentas/1/saldo`:

```json
{
  "cuentaId": 1,
  "saldoTotal": 250000.00,
  "saldoApartado": 150000.00,
  "saldoDisponible": 100000.00,
  "moneda": "COP"
}
```

---

## 9. Casos de prueba

No basta probar que "funciona". Cada endpoint necesita caso positivo y negativo.

| Tipo | Caso | Resultado esperado |
|---|---|---|
| Válido | Transferencia entre dos cuentas activas con disponible suficiente | 201 · saldos actualizados en ambas |
| Válido | Apartar dinero a un bolsillo | 201 · `saldoTotal` sin cambios, `saldoDisponible` reducido |
| Inválido | Transferencia con monto negativo | 400 |
| ID inexistente | `GET /api/bolsillos/9999` | 404 |
| ID inválido | `GET /api/cuentas/abc` | 400 |
| Campo faltante | Crear usuario sin `documento` | 400 |
| Tipo incorrecto | Crear bolsillo con `meta` de tipo texto | 400 |
| Fuera de rango | Transferencia por 5.000.000 | 400 |
| Duplicado | Dos usuarios con el mismo email | 409 |
| Duplicado | Dos bolsillos con el mismo nombre en una cuenta | 409 |
| Mass Assignment | `POST /api/bolsillos` con `saldo: 999999` en el body | 201 · campo ignorado, saldo en 0 |
| Regla incumplida | Retiro contra saldo apartado en bolsillos | 409 |
| Regla incumplida | Eliminar bolsillo con saldo | 409 |
| Regla incumplida | Devolver más de lo apartado | 409 |
| Regla incumplida | Transferencia a la misma cuenta | 409 |
| Regla incumplida | Crear el bolsillo número 11 | 409 |
| Regla incumplida | Cerrar cuenta con saldo total mayor que 0 | 409 |

> **Caso estrella para la sustentación:** cuenta con 100.000 de saldo total y
> 80.000 apartados en bolsillos. Intento retirar 50.000. La API debe rechazarlo
> aunque el saldo total alcance.

---

## 10. Arquitectura

Todos los recursos siguen la misma cadena:

```
Request → Route → Validator → Controller → Service → Data
```

### Estructura de carpetas

```
src/
├── controllers/
│   ├── usuarios.controller.js
│   ├── cuentas.controller.js
│   ├── transacciones.controller.js
│   └── bolsillos.controller.js
├── data/
│   ├── usuarios.js
│   ├── cuentas.js
│   ├── transacciones.js
│   └── bolsillos.js
├── middlewares/
│   ├── usuarios.validator.js
│   ├── cuentas.validator.js
│   ├── transacciones.validator.js
│   ├── bolsillos.validator.js
│   ├── validar.middleware.js
│   └── errores.middleware.js
├── routes/
│   ├── usuarios.routes.js
│   ├── cuentas.routes.js
│   ├── transacciones.routes.js
│   └── bolsillos.routes.js
├── services/
│   ├── usuarios.service.js
│   ├── cuentas.service.js
│   ├── transacciones.service.js
│   └── bolsillos.service.js
├── docs/
│   └── swagger.js
└── app.js

.env
.env.example
.gitignore
package.json
README.md
```

### Si estás adaptando otro proyecto

Mapeo de renombrado, si vienes de un proyecto con otros recursos:

| Archivo previo | Archivo nuevo | Nivel de reescritura |
|---|---|---|
| `<recurso1>.*.js` | `usuarios.*.js` | Bajo — CRUD casi directo |
| `<recurso2>.*.js` | `cuentas.*.js` | Medio — agregar `saldoDisponible` y `PATCH /estado` |
| `<recurso3>.*.js` | `transacciones.*.js` | Alto — quitar PUT/DELETE, partir el POST en tres rutas |
| `<recurso4>.*.js` | `bolsillos.*.js` | Alto — agregar `apartar` y `devolver` |
| `validar.middleware.js` | igual | Ninguno |
| `errores.middleware.js` | igual | Ninguno |
| `app.js` | igual | Bajo — cambiar los `app.use()` de rutas |

**Cuidado al copiar:** lo que rompe una adaptación de este tipo es arrastrar la
lógica de saldo del proyecto anterior. En Bolsillo, el saldo se calcula en el
service, nunca se recibe ni se modifica directamente desde el controller.

### Función central del dominio

Va en `cuentas.service.js` y la usan transacciones y bolsillos:

```
calcularSaldoDisponible(cuentaId):
    cuenta        = buscarCuenta(cuentaId)
    saldoApartado = suma del saldo de los bolsillos activos de esa cuenta
    retornar cuenta.saldoTotal - saldoApartado
```

Ningún débito debe escribirse sin pasar por aquí.

---

## 11. Controles de seguridad (mínimos obligatorios)

- [ ] Helmet
- [ ] CORS configurado (no `*`)
- [ ] Rate Limiting
- [ ] Límite de tamaño del JSON (`express.json({ limit: '10kb' })`)
- [ ] `express-validator` en todos los endpoints
- [ ] `matchedData()` para construir los objetos
- [ ] Allowlist de campos por recurso
- [ ] Manejo centralizado de errores
- [ ] Variables de entorno en `.env`
- [ ] `.env` incluido en `.gitignore`

**Prohibido:**

- `eval()`
- Guardar directamente `{ ...req.body }` sin control
- Devolver mensajes de error con stack trace en producción

---

## 12. Documentación

- `/api-docs` → Swagger UI
- `/openapi.json` → especificación

Swagger debe permitir probar **todos** los recursos, no solo listarlos.

---

## 13. Análisis de seguridad (al terminar)

```
Código            → Semgrep      → SAST
Dependencias      → npm audit    → SCA
API ejecutándose  → OWASP ZAP    → DAST
Aplicación viva   → IAST
Ataques controlados → Pentesting
```

Pentesting mínimo: probar autenticación, autorización, endpoints y entradas
maliciosas.

---

## 14. Orden sugerido de implementación

1. `data/` con arreglos en memoria y datos semilla (2 usuarios, 2 cuentas,
   1 bolsillo).
2. Usuarios completo, de punta a punta. Sirve de plantilla para el resto.
3. Cuentas, incluyendo `calcularSaldoDisponible()`.
4. Transacciones: depósito primero (el más simple), luego retiro, luego
   transferencia.
5. Bolsillos: CRUD, y después `apartar` / `devolver`.
6. Manejo centralizado de errores y códigos HTTP consistentes.
7. Controles de seguridad de la sección 11.
8. Swagger.
9. Batería de pruebas de la sección 9.
10. SAST, SCA y DAST.

Los pasos 1 a 5 son el desarrollo; del 6 en adelante es lo que convierte esto en
algo más completo que programar un CRUD.
