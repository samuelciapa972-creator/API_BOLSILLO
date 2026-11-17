// ========================================
// Proyecto final - Pruebas de seguridad de la API
// Uso (con la API corriendo y recién iniciada):
//   npm run test:seguridad
//
// Complementa la colección de Postman con casos que
// esta no cubre: JWT manipulado, revocación por
// version_sesion, eco de datos en errores, CORS,
// cabeceras, tamaño de cuerpo, inyección y rate limit.
//
// Crea usuarios sintéticos con sufijo
// .final.<marca>@example.com. Nunca escribe secretos ni
// tokens en el reporte.
// ========================================
require("dotenv").config({ quiet: true });

const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const BASE = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
const API_KEY = process.env.API_KEY_POSTMAN;
const SALIDA = path.join(__dirname, "..", "..", "reportes", "despues");
const marca = Date.now().toString().slice(-6);
const resultados = [];

const pedir = async (ruta, { metodo = "GET", token, apiKey, cuerpo, crudo, encabezados = {} } = {}) => {
  const headers = { ...encabezados };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (apiKey) headers["X-API-Key"] = apiKey;
  if (cuerpo !== undefined || crudo !== undefined) headers["Content-Type"] = "application/json";
  const respuesta = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers,
    body: crudo !== undefined ? crudo : cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await respuesta.text();
  let json = null;
  try {
    json = JSON.parse(texto);
  } catch {
    json = null;
  }
  return { estado: respuesta.status, json, texto, headers: respuesta.headers };
};

const registrar = (id, categoria, prueba, esperado, obtenido, ok) => {
  resultados.push({ id, categoria, prueba, esperado, obtenido, resultado: ok ? "APROBADA" : "FALLIDA" });
  console.log(`${ok ? "✓" : "✗"} ${id} ${prueba} → ${obtenido}`);
};

// Detiene la preparación con un mensaje claro si un paso falla.
const exigir = (respuesta, paso) => {
  if (respuesta.estado >= 300) {
    throw new Error(`Preparación "${paso}" respondió ${respuesta.estado}: ${respuesta.texto.slice(0, 300)}`);
  }
  return respuesta.json;
};

const login = async (email, password) => (await pedir("/api/auth/login", { metodo: "POST", cuerpo: { email, password } })).json?.token;

async function main() {
  if (!API_KEY || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
    throw new Error("Faltan variables en .env (API_KEY_POSTMAN, ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET)");
  }

  // ---------------- Preparación ----------------
  const claveA = `Cliente-A-${marca}x`;
  const claveB = `Cliente-B-${marca}x`;
  const emailA = `cliente.a.final.${marca}@example.com`;
  const emailB = `cliente.b.final.${marca}@example.com`;
  const emailAud = `auditor.final.${marca}@example.com`;

  const admin = await login(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
  if (!admin) throw new Error("No se pudo iniciar sesión como administrador");

  const regA = exigir(await pedir("/api/auth/registro", { metodo: "POST", apiKey: API_KEY, cuerpo: { nombre: "Cliente Final A", email: emailA, password: claveA } }), "registro A");
  const regB = exigir(await pedir("/api/auth/registro", { metodo: "POST", apiKey: API_KEY, cuerpo: { nombre: "Cliente Final B", email: emailB, password: claveB } }), "registro B");
  exigir(await pedir("/api/auth/usuarios", { metodo: "POST", token: admin, cuerpo: { nombre: "Auditor Final", email: emailAud, password: `Auditor-${marca}xyz`, rol: "auditor" } }), "crear auditor");

  const doc = (n) => `9${marca}${n}`.padEnd(10, "0").slice(0, 10);
  const titA = exigir(await pedir("/api/usuarios", { metodo: "POST", token: admin, cuerpo: { nombre: "Cliente Final A", documento: doc(1), email: emailA, telefono: `31${marca}01`.slice(0, 10), usuarioAuthId: regA.usuario.id } }), "titular A");
  const titB = exigir(await pedir("/api/usuarios", { metodo: "POST", token: admin, cuerpo: { nombre: "Cliente Final B", documento: doc(2), email: emailB, telefono: `31${marca}02`.slice(0, 10), usuarioAuthId: regB.usuario.id } }), "titular B");
  const cuentaA = exigir(await pedir("/api/cuentas", { metodo: "POST", token: admin, cuerpo: { usuarioId: titA.usuario.id } }), "cuenta A").cuenta.id;
  const cuentaB = exigir(await pedir("/api/cuentas", { metodo: "POST", token: admin, cuerpo: { usuarioId: titB.usuario.id } }), "cuenta B").cuenta.id;
  exigir(await pedir("/api/transacciones/deposito", { metodo: "POST", token: admin, cuerpo: { cuentaDestinoId: cuentaA, monto: 500000, descripcion: "Fondeo pruebas finales" } }), "depósito");

  const tokA = await login(emailA, claveA);
  const tokB = await login(emailB, claveB);
  const tokAud = await login(emailAud, `Auditor-${marca}xyz`);

  // ---------------- Autenticación ----------------
  let r = await pedir("/api/auth/login", { metodo: "POST", cuerpo: { email: emailA, password: claveA } });
  registrar("API-01", "Autenticación", "Login correcto devuelve JWT y no expone el hash", "200 + token, sin password/passwordHash",
    `${r.estado}, token=${Boolean(r.json?.token)}, hash=${/password/i.test(JSON.stringify(r.json?.usuario || {}))}`,
    r.estado === 200 && r.json?.token && !/password/i.test(JSON.stringify(r.json.usuario)));

  const malo = await pedir("/api/auth/login", { metodo: "POST", cuerpo: { email: emailA, password: "Incorrecta-123" } });
  const noExiste = await pedir("/api/auth/login", { metodo: "POST", cuerpo: { email: `nadie.${marca}@example.com`, password: "Incorrecta-123" } });
  registrar("API-02", "Autenticación", "Clave errónea y correo inexistente responden igual (sin enumeración)", "401 y mismo mensaje",
    `${malo.estado}/${noExiste.estado}, mismo mensaje=${malo.json?.mensaje === noExiste.json?.mensaje}`,
    malo.estado === 401 && noExiste.estado === 401 && malo.json?.mensaje === noExiste.json?.mensaje);

  r = await pedir("/api/auth/registro", { metodo: "POST", apiKey: API_KEY, cuerpo: { nombre: "Eco", email: `eco.${marca}@example.com`, password: "corta-9" } });
  registrar("API-03", "Exposición de datos", "Un error de validación no devuelve la contraseña enviada (CWE-209)", "400 sin el valor enviado",
    `${r.estado}, contiene la clave=${r.texto.includes("corta-9")}`, r.estado === 400 && !r.texto.includes("corta-9"));

  r = await pedir("/api/auth/registro", { metodo: "POST", apiKey: API_KEY, cuerpo: { nombre: "Escalada", email: `escalada.${marca}@example.com`, password: `Escalada-${marca}x`, rol: "administrador" } });
  registrar("API-04", "Mass assignment", "Registro con rol=administrador no eleva privilegios", "201 con rol cliente",
    `${r.estado}, rol=${r.json?.usuario?.rol}`, r.estado === 201 && r.json?.usuario?.rol === "cliente");

  // ---------------- JWT ----------------
  r = await pedir("/api/cuentas/mis-cuentas");
  registrar("API-05", "JWT", "Sin token", "401", String(r.estado), r.estado === 401);

  const [h, p] = tokA.split(".");
  r = await pedir("/api/cuentas/mis-cuentas", { token: `${h}.${p}.firmaFalsa${marca}` });
  registrar("API-06", "JWT", "Firma alterada", "401", String(r.estado), r.estado === 401);

  const carga = JSON.parse(Buffer.from(p, "base64url").toString());
  const ninguno = `${Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ ...carga, rol: "administrador" })).toString("base64url")}.`;
  r = await pedir("/api/cuentas", { token: ninguno });
  registrar("API-07", "JWT", "Token alg=none con rol administrador", "401", String(r.estado), r.estado === 401);

  const vencido = jwt.sign({ email: carga.email, rol: carga.rol, vs: carga.vs }, process.env.JWT_SECRET, { algorithm: "HS256", subject: carga.sub, expiresIn: -60 });
  r = await pedir("/api/cuentas/mis-cuentas", { token: vencido });
  registrar("API-08", "JWT", "Token con firma válida pero expirado", "401", String(r.estado), r.estado === 401);

  // ---------------- RBAC ----------------
  r = await pedir("/api/estadisticas/resumen", { token: tokA });
  registrar("API-09", "RBAC", "Cliente consulta indicadores administrativos", "403", String(r.estado), r.estado === 403);

  r = await pedir("/api/estadisticas/resumen", { token: tokAud });
  const sinPII = !/@|documento|email|nombre/i.test(r.texto);
  registrar("API-10", "RBAC", "Auditor consulta indicadores (solo agregados, sin datos personales)", "200 sin correos, nombres ni documentos",
    `${r.estado}, sin datos personales=${sinPII}`, r.estado === 200 && sinPII);

  r = await pedir("/api/transacciones/deposito", { metodo: "POST", token: tokAud, cuerpo: { cuentaDestinoId: cuentaA, monto: 1000 } });
  registrar("API-11", "RBAC", "Auditor intenta depositar", "403", String(r.estado), r.estado === 403);

  // ---------------- BOLA / IDOR ----------------
  r = await pedir(`/api/cuentas/${cuentaA}`, { token: tokB });
  registrar("API-12", "BOLA/IDOR", "Cliente B lee la cuenta de A", "403 o 404", String(r.estado), [403, 404].includes(r.estado));

  r = await pedir("/api/transacciones/transferencia", { metodo: "POST", token: tokB, cuerpo: { cuentaOrigenId: cuentaA, cuentaDestinoId: cuentaB, monto: 1000 } });
  registrar("API-13", "BOLA/IDOR", "Cliente B transfiere desde la cuenta de A", "403 o 404", String(r.estado), [403, 404].includes(r.estado));

  r = await pedir(`/api/cuentas/${cuentaA}/transacciones`, { token: tokB });
  registrar("API-14", "BOLA/IDOR", "Cliente B lee el extracto de A", "403 o 404", String(r.estado), [403, 404].includes(r.estado));

  // ---------------- Reglas de negocio ----------------
  const antes = (await pedir(`/api/cuentas/${cuentaA}/saldo`, { token: tokA })).json?.saldoTotal;
  r = await pedir("/api/transacciones/retiro", { metodo: "POST", token: tokA, cuerpo: { cuentaOrigenId: cuentaA, monto: 600000 } });
  const despues = (await pedir(`/api/cuentas/${cuentaA}/saldo`, { token: tokA })).json?.saldoTotal;
  registrar("API-15", "Lógica de negocio", "Retiro mayor al saldo disponible", "4xx y saldo sin cambios",
    `${r.estado}, saldo ${antes} → ${despues}`, r.estado >= 400 && r.estado < 500 && antes === despues);

  r = await pedir("/api/transacciones/transferencia", { metodo: "POST", token: tokA, cuerpo: { cuentaOrigenId: cuentaA, cuentaDestinoId: cuentaB, monto: 2000001 } });
  registrar("API-16", "Validación", "Monto superior al tope de 2.000.000", "400", String(r.estado), r.estado === 400);

  // ---------------- Inyección y entradas hostiles ----------------
  r = await pedir("/api/cuentas/1%20OR%201=1", { token: tokA });
  registrar("API-17", "Inyección", "SQL en parámetro de ruta (1 OR 1=1)", "400", String(r.estado), r.estado === 400);

  r = await pedir("/api/auth/login", { metodo: "POST", cuerpo: { email: "' OR '1'='1' --", password: "x' OR '1'='1" } });
  registrar("API-18", "Inyección", "SQL en el login", "400 o 401, nunca 200 ni 500", String(r.estado), [400, 401].includes(r.estado));

  r = await pedir("/api/auth/login", { metodo: "POST", crudo: '{"email": "a@b.co", "password": ' });
  registrar("API-19", "Manejo de errores", "JSON mal formado", "400 sin stack trace",
    `${r.estado}, stack=${/at\s+\S+\s+\(|node_modules/.test(r.texto)}`, r.estado === 400 && !/at\s+\S+\s+\(|node_modules/.test(r.texto));

  r = await pedir("/api/auth/login", { metodo: "POST", crudo: JSON.stringify({ email: "a@b.co", password: "x".repeat(12000) }) });
  registrar("API-20", "Disponibilidad", "Cuerpo mayor a 10 kB", "413", String(r.estado), r.estado === 413);

  // ---------------- CORS y cabeceras ----------------
  r = await pedir("/api/cuentas/mis-cuentas", { token: tokA, encabezados: { Origin: "https://atacante.example" } });
  registrar("API-21", "CORS", "Origen no permitido", "Sin Access-Control-Allow-Origin",
    `ACAO=${r.headers.get("access-control-allow-origin") ?? "ausente"}`, !r.headers.get("access-control-allow-origin"));

  r = await pedir("/api/cuentas/mis-cuentas", { token: tokA, encabezados: { Origin: "http://localhost:5173" } });
  registrar("API-22", "CORS", "Origen de la SPA (localhost:5173)", "ACAO = http://localhost:5173",
    `ACAO=${r.headers.get("access-control-allow-origin")}`, r.headers.get("access-control-allow-origin") === "http://localhost:5173");

  r = await pedir("/");
  const cab = {
    "x-powered-by": r.headers.get("x-powered-by"),
    "x-content-type-options": r.headers.get("x-content-type-options"),
    "strict-transport-security": Boolean(r.headers.get("strict-transport-security")),
    "content-security-policy": Boolean(r.headers.get("content-security-policy")),
  };
  registrar("API-23", "Cabeceras", "Cabeceras de seguridad (Helmet)", "sin X-Powered-By; nosniff, HSTS y CSP presentes",
    JSON.stringify(cab), !cab["x-powered-by"] && cab["x-content-type-options"] === "nosniff" && cab["strict-transport-security"] && cab["content-security-policy"]);

  r = await pedir("/api/no-existe");
  // El filtro de API Key va antes que el 404: una ruta desconocida no
  // revela si existe (no se pueden enumerar rutas sin credenciales).
  registrar("API-24", "Manejo de errores", "Ruta inexistente sin credenciales", "401 o 404 con mensaje genérico, sin detalles internos",
    `${r.estado} ${r.json?.mensaje}`, [401, 404].includes(r.estado) && !/stack|node_modules|Error:/i.test(r.texto));

  // ---------------- Códigos de recuperación ----------------
  const codigos = await pedir("/api/auth/codigos-recuperacion", { metodo: "POST", token: tokB, cuerpo: { passwordActual: claveB } });
  const codigo = codigos.json?.codigos?.[0];
  const nuevaB = `Nueva-B-${marca}Xy1`;
  const uso1 = await pedir("/api/auth/restablecer-con-codigo", { metodo: "POST", cuerpo: { email: emailB, codigo, passwordNueva: nuevaB, confirmarPassword: nuevaB } });
  const uso2 = await pedir("/api/auth/restablecer-con-codigo", { metodo: "POST", cuerpo: { email: emailB, codigo, passwordNueva: `Otra-B-${marca}Xy2`, confirmarPassword: `Otra-B-${marca}Xy2` } });
  registrar("API-25", "Recuperación", "Un código de respaldo sirve una sola vez", "1.º 200, 2.º 400",
    `${codigos.estado} → ${uso1.estado} → ${uso2.estado}`, codigos.estado === 201 && uso1.estado === 200 && uso2.estado === 400);

  // ---------------- Revocación por version_sesion ----------------
  const nuevaA = `Nueva-A-${marca}Xy1`;
  const cambio = await pedir("/api/auth/cambiar-password", { metodo: "PATCH", token: tokA, cuerpo: { passwordActual: claveA, passwordNueva: nuevaA, confirmarPassword: nuevaA } });
  const viejo = await pedir("/api/auth/perfil", { token: tokA });
  const nuevoTok = await login(emailA, nuevaA);
  registrar("API-26", "Sesión", "Tras cambiar la contraseña el JWT anterior queda revocado", "200 → token viejo 401 → login nuevo OK",
    `${cambio.estado} → ${viejo.estado} → nuevo token=${Boolean(nuevoTok)}`, cambio.estado === 200 && viejo.estado === 401 && Boolean(nuevoTok));

  // ---------------- Rate limit (al final: bloquea el login 15 min) ----------------
  const estados = [];
  for (let i = 0; i < 11; i += 1) {
    estados.push((await pedir("/api/auth/login", { metodo: "POST", cuerpo: { email: emailB, password: `Fuerza-bruta-${i}` } })).estado);
  }
  registrar("API-27", "Fuerza bruta", "11 intentos fallidos de login seguidos", "429 al superar 10 fallos en 15 min por IP",
    estados.join(","), estados.at(-1) === 429);

  // ---------------- Reporte ----------------
  const aprobadas = resultados.filter((x) => x.resultado === "APROBADA").length;
  const reporte = {
    fecha: new Date().toISOString(),
    api: BASE,
    total: resultados.length,
    aprobadas,
    fallidas: resultados.length - aprobadas,
    datosSinteticos: `*.final.${marca}@example.com`,
    resultados,
  };
  fs.mkdirSync(SALIDA, { recursive: true });
  fs.writeFileSync(path.join(SALIDA, "api-seguridad.json"), JSON.stringify(reporte, null, 2));
  const md = [
    `# Pruebas de seguridad de la API (${reporte.fecha})`,
    "",
    `API: ${BASE} · ${aprobadas}/${resultados.length} aprobadas · datos sintéticos \`${reporte.datosSinteticos}\``,
    "",
    "| ID | Categoría | Prueba | Esperado | Obtenido | Resultado |",
    "|---|---|---|---|---|---|",
    ...resultados.map((x) => `| ${x.id} | ${x.categoria} | ${x.prueba} | ${x.esperado} | \`${x.obtenido.replace(/\|/g, "/")}\` | ${x.resultado} |`),
    "",
  ].join("\n");
  fs.writeFileSync(path.join(SALIDA, "api-seguridad.md"), md);
  console.log(`\n${aprobadas}/${resultados.length} pruebas aprobadas`);
  process.exitCode = aprobadas === resultados.length ? 0 : 1;
}

main().catch((error) => {
  console.error("Error en las pruebas:", error.message);
  process.exitCode = 1;
});
