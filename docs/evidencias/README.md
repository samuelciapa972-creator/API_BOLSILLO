# Evidencias — Bloque 7 (Supabase + PostgreSQL)

Capturas tomadas el **2026-10-21** contra el proyecto **Supabase real** (Session pooler, TLS verificado), con Swagger UI en `http://localhost:3000/api-docs`.

- La **API Key** y los **JWT** aparecen tapados (`••••••••(oculta)`, `eyJhbGciOi…(JWT oculto)`), como pide el insumo: no exponer credenciales en capturas. Antes de guardar cada imagen se verificó que no quedara ningún secreto visible.
- Las capturas de Swagger se tomaron con un navegador automatizado (Playwright + Chromium): la operación se ejecutó realmente con **Try it out → Execute**.
- La captura 04 es una **consulta directa** desde Node.js (`pg`) contra la base de Supabase, no el dashboard. Las mismas consultas se pueden ejecutar en **SQL Editor**.

## Evidencias obligatorias (`README_BLOQUE_7_5.md`: "POST en Swagger, registro en PostgreSQL y consulta posterior a reiniciar Node.js")

| # | Evidencia | Resultado | Archivo |
|---|---|---|---|
| 03 | **POST** `/api/transacciones/deposito`: 10.000 a la cuenta 1, "Evidencia Bloque 7" | 201, transacción `id 4` | [03-post-deposito-201.png](03-post-deposito-201.png) |
| 04 | **Registro en PostgreSQL**: la transacción `id 4` y el saldo de la cuenta 1 (110.000 / 80.000 / 30.000) | Fila presente | [04-registro-en-postgresql.png](04-registro-en-postgresql.png) |
| 05 | **Después de reiniciar Node.js**: `GET /api/transacciones/4` | 200, mismos datos y misma fecha | [05-despues-de-reiniciar-200.png](05-despues-de-reiniciar-200.png) |
| 05b | Después de reiniciar: saldo de la cuenta 1 | 110.000 / 80.000 / 30.000 | [05b-saldo-despues-de-reiniciar.png](05b-saldo-despues-de-reiniciar.png) |

## Evidencias de reglas de negocio y seguridad

| # | Caso | Esperado | Archivo |
|---|---|---|---|
| 01 | Saldo de la cuenta 1 antes del depósito | 200: total 100.000, apartado 80.000, disponible 20.000 | [01-saldo-disponible.png](01-saldo-disponible.png) |
| 02 | **Caso estrella:** retirar 50.000 con 20.000 disponibles | 409 | [02-caso-estrella-retiro-409.png](02-caso-estrella-retiro-409.png) |
| 06 | Petición sin JWT | 401 | [06-sin-jwt-401.png](06-sin-jwt-401.png) |
| 07 | Monto con 3 decimales (`10.555`) | 400 | [07-monto-3-decimales-400.png](07-monto-3-decimales-400.png) |
| 08 | **BOLA:** el cliente de Carlos consulta la cuenta de Ana | 403 | [08-bola-cuenta-ajena-403.png](08-bola-cuenta-ajena-403.png) |
| 09 | `GET /api/cuentas/mis-cuentas` como cliente (identidad desde el JWT) | 200, solo su cuenta | [09-mis-cuentas-cliente-200.png](09-mis-cuentas-cliente-200.png) |

## Datos que dejó la toma de evidencias en Supabase

- Transacción `id 4` (depósito de 10.000 a la cuenta 1, "Evidencia Bloque 7"). Es **permanente**: las transacciones son inmutables.
- Login `carlos.evidencia@example.com` (rol cliente), vinculado al titular de prueba Carlos (`usuarios.id = 2`) para las capturas 08 y 09.
