# Pruebas de seguridad de la API (2026-11-17T00:19:00.457Z)

API: http://localhost:3000 · 27/27 aprobadas · datos sintéticos `*.final.724235@example.com`

| ID | Categoría | Prueba | Esperado | Obtenido | Resultado |
|---|---|---|---|---|---|
| API-01 | Autenticación | Login correcto devuelve JWT y no expone el hash | 200 + token, sin password/passwordHash | `200, token=true, hash=false` | APROBADA |
| API-02 | Autenticación | Clave errónea y correo inexistente responden igual (sin enumeración) | 401 y mismo mensaje | `401/401, mismo mensaje=true` | APROBADA |
| API-03 | Exposición de datos | Un error de validación no devuelve la contraseña enviada (CWE-209) | 400 sin el valor enviado | `400, contiene la clave=false` | APROBADA |
| API-04 | Mass assignment | Registro con rol=administrador no eleva privilegios | 201 con rol cliente | `201, rol=cliente` | APROBADA |
| API-05 | JWT | Sin token | 401 | `401` | APROBADA |
| API-06 | JWT | Firma alterada | 401 | `401` | APROBADA |
| API-07 | JWT | Token alg=none con rol administrador | 401 | `401` | APROBADA |
| API-08 | JWT | Token con firma válida pero expirado | 401 | `401` | APROBADA |
| API-09 | RBAC | Cliente consulta indicadores administrativos | 403 | `403` | APROBADA |
| API-10 | RBAC | Auditor consulta indicadores (solo agregados, sin datos personales) | 200 sin correos, nombres ni documentos | `200, sin datos personales=true` | APROBADA |
| API-11 | RBAC | Auditor intenta depositar | 403 | `403` | APROBADA |
| API-12 | BOLA/IDOR | Cliente B lee la cuenta de A | 403 o 404 | `403` | APROBADA |
| API-13 | BOLA/IDOR | Cliente B transfiere desde la cuenta de A | 403 o 404 | `403` | APROBADA |
| API-14 | BOLA/IDOR | Cliente B lee el extracto de A | 403 o 404 | `403` | APROBADA |
| API-15 | Lógica de negocio | Retiro mayor al saldo disponible | 4xx y saldo sin cambios | `409, saldo 500000 → 500000` | APROBADA |
| API-16 | Validación | Monto superior al tope de 2.000.000 | 400 | `400` | APROBADA |
| API-17 | Inyección | SQL en parámetro de ruta (1 OR 1=1) | 400 | `400` | APROBADA |
| API-18 | Inyección | SQL en el login | 400 o 401, nunca 200 ni 500 | `400` | APROBADA |
| API-19 | Manejo de errores | JSON mal formado | 400 sin stack trace | `400, stack=false` | APROBADA |
| API-20 | Disponibilidad | Cuerpo mayor a 10 kB | 413 | `413` | APROBADA |
| API-21 | CORS | Origen no permitido | Sin Access-Control-Allow-Origin | `ACAO=ausente` | APROBADA |
| API-22 | CORS | Origen de la SPA (localhost:5173) | ACAO = http://localhost:5173 | `ACAO=http://localhost:5173` | APROBADA |
| API-23 | Cabeceras | Cabeceras de seguridad (Helmet) | sin X-Powered-By; nosniff, HSTS y CSP presentes | `{"x-powered-by":null,"x-content-type-options":"nosniff","strict-transport-security":true,"content-security-policy":true}` | APROBADA |
| API-24 | Manejo de errores | Ruta inexistente sin credenciales | 401 o 404 con mensaje genérico, sin detalles internos | `401 API Key requerida` | APROBADA |
| API-25 | Recuperación | Un código de respaldo sirve una sola vez | 1.º 200, 2.º 400 | `201 → 200 → 400` | APROBADA |
| API-26 | Sesión | Tras cambiar la contraseña el JWT anterior queda revocado | 200 → token viejo 401 → login nuevo OK | `200 → 401 → nuevo token=true` | APROBADA |
| API-27 | Fuerza bruta | 11 intentos fallidos de login seguidos | 429 al superar 10 fallos en 15 min por IP | `401,401,401,401,401,401,401,429,429,429,429` | APROBADA |
