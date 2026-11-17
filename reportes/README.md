# Pruebas de seguridad · API Bolsillo

Evidencias del proyecto final: **SCA, SAST, DAST y pruebas de API** sobre el backend (Express) y el frontend (React + Vite).
Fecha de ejecución: 2026-11-16 · Entorno: local (API en `:3000`, SPA en `:5173`/`:4173`) contra la base de datos del proyecto en Supabase.

> Volver al [índice del repositorio](../README.md)

`antes/` guarda los resultados previos a las correcciones y `despues/` los finales. Los reportes JSON de Newman y ZAP se guardaron **con los JWT, API Keys y contraseñas redactados** (`<REDACTADO>`).

## Resumen

| Prueba | Herramienta | Antes | Después |
|---|---|---|---|
| SCA backend | `npm audit` / OSV-Scanner | 6 avisos (1 alto, 5 moderados) / 4 paquetes (CVSS máx. 7.5) | **0 en producción** · 1 aviso solo de desarrollo (ver R-01) |
| SCA frontend | `npm audit` / OSV-Scanner | 0 / 0 | **0 en producción** · 1 aviso solo de desarrollo (ver R-01) |
| SAST | Semgrep (7 rulesets, 79 archivos) | 0 vulnerabilidades (9 controles positivos) | **0** |
| SAST | ESLint + `eslint-plugin-security` | backend 3 avisos · frontend 1 error | backend 3 · frontend 10 avisos (tras el rediseño), **todos falsos positivos analizados**, 0 errores |
| SAST manual | revisión de código | eco de contraseñas en errores 400 (CWE-209) | **corregido** |
| DAST API | OWASP ZAP API scan (OpenAPI, activo, JWT de auditor) | 106 URL · 0 fallos · 1 aviso bajo | **0 fallos** · 1 aviso (falso positivo) |
| DAST frontend | OWASP ZAP baseline (build de producción) | 0 fallos · 8 avisos (cabeceras ausentes) | **0 fallos** · 3 avisos informativos (repetido tras el rediseño, 2026-11-17) |
| API | Newman (colección Postman) | | **40 peticiones · 53/53 aserciones** |
| API | `npm run test:seguridad` | 25/27 (2 hallazgos) | **27/27** |

## Cómo reproducir

```bash
# SCA
cd backend  && npm audit
cd frontend && npm audit
docker run --rm -v "$PWD/backend/package-lock.json:/src/package-lock.json:ro" \
  ghcr.io/google/osv-scanner:latest scan source -L /src/package-lock.json

# SAST
cd backend  && npm run sast
cd frontend && npm run sast
semgrep scan --metrics=off --config p/owasp-top-ten --config p/javascript \
  --config p/nodejsscan --config p/expressjs --config p/react --config p/secrets \
  --config p/jwt backend/src backend/scripts frontend/src

# Pruebas de API (API recién iniciada: el rate limit vive en memoria)
cd backend && npm start
npx newman run backend/postman/API_BOLSILLO.postman_collection.json \
  -e backend/postman/API_BOLSILLO.postman_environment.json \
  --env-var apiKey=... --env-var adminEmail=... --env-var adminPassword=...
cd backend && npm run test:seguridad

# DAST (API con límite ampliado SOLO en local, frontend compilado)
cd backend && RATE_LIMIT_GLOBAL=20000 npm start
cd frontend && npm run build && \
  __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=host.docker.internal npx vite preview --host 127.0.0.1
cd backend && DAST_EMAIL=<auditor> DAST_PASSWORD=<clave> \
  FE_URL=http://host.docker.internal:4173 bash scripts/dast-zap.sh despues
```

## Hallazgos corregidos

| ID | Origen | Hallazgo | Corrección |
|---|---|---|---|
| H-01 | SCA | `body-parser` 1.20.8 (GHSA-27r3-jxmh-p828, CVSS 7.5, DoS), `qs` 6.16.0, `glob` 11.1.0, `minimatch` 10.2.6 | `npm audit fix` + `overrides` (`glob` ^14.0.6, `minimatch` ^11.0.9) sin bajar `nodemon` |
| H-02 | SAST manual | Las respuestas 400 de validación devolvían `value`: el valor enviado, incluidas contraseñas (CWE-209) | `validar.middleware.js` responde solo `{campo, ubicacion, msg}` |
| H-03 | Pruebas de API | `POST /api/auth/usuarios` exigía API Key: imposible usarlo desde el panel sin exponer la clave | Ruta solo con JWT + rol administrador (que ya tenía) |
| H-04 | Pruebas de API | Los restablecimientos de contraseña exigían API Key: la pantalla de recuperación de la SPA no podía funcionar | Rutas públicas protegidas por token/código de un solo uso, validación y `limiteReset` |
| H-05 | DAST | El frontend no enviaba CSP, anti-clickjacking, `nosniff`, `Permissions-Policy` ni COEP | Cabeceras en `vite.config.js` (CSP estricta en el build) |
| H-06 | Integración | El formulario de titulares trataba el teléfono como opcional y la API lo exige | Campo obligatorio con el mismo patrón |

## Riesgos aceptados

| ID | Origen | Hallazgo | Decisión |
|---|---|---|---|
| R-01 | SCA (2026-11-17) | `picomatch` ≤ 4.0.7 (GHSA-fc5q-39xc-vjpf, ReDoS con extglobs), traído por `vite` (frontend) y `nodemon` (backend). El aviso cubre **todas** las versiones publicadas y no hay parche. | Solo dependencias de desarrollo: `npm audit --omit=dev` da 0 en ambos proyectos y el paquete no llega al bundle del navegador ni al servidor en producción. Los patrones glob los define el desarrollador, no el usuario. `npm audit fix --force` bajaría Vite a la 6.2.7 (cambio incompatible), así que se acepta y se revisa cuando salga el parche. |

## Falsos positivos analizados

| Herramienta | Alerta | Por qué no aplica |
|---|---|---|
| ESLint `detect-unsafe-regex` | `auth.validator.js:220` | Regex anclada con repeticiones fijas; 1 000 000 caracteres en 0,86 ms (`despues/sast-redos-prueba.txt`) |
| ESLint `detect-object-injection` | controladores (`transicionesPermitidas[estadoActual]`) y frontend (`TEXTOS[tipo]`) | La clave viene de un `CHECK` de la BD o de constantes del código, nunca del usuario |
| ZAP 10096 Timestamp Disclosure | `GET /api/usuarios` | Son números de documento (`2035286422`), no marcas de tiempo |
| ZAP 10027 Suspicious Comments | bundle JS | Es la palabra `admin` en la URL `/api/auth/recuperacion/admin/…`, no un comentario |

## Riesgos aceptados y pendientes

- El backend se conecta con el rol `postgres` (`BYPASSRLS`): RLS no filtra sus consultas. El aislamiento lo dan JWT, RBAC y BOLA en Express. Pendiente: rol con permisos mínimos.
- El rate limit vive en memoria: se reinicia con la API y no se comparte entre instancias.
- El JWT se guarda en `sessionStorage` (accesible desde JavaScript). La CSP estricta reduce el riesgo de XSS.
- HSTS solo tiene efecto detrás de HTTPS (en local se sirve por HTTP).
