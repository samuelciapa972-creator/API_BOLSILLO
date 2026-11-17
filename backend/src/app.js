require(
  "dotenv"
).config();


const express =
  require(
    "express"
  );


const helmet =
  require(
    "helmet"
  );


const cors =
  require(
    "cors"
  );


const {
  rateLimit
} = require(
  "express-rate-limit"
);


const swaggerUi =
  require(
    "swagger-ui-express"
  );


const swaggerSpec =
  require(
    "./docs/swagger"
  );


// ========================================
// Rutas
// ========================================

const usuariosRoutes =
  require(
    "./routes/usuarios.routes"
  );


const cuentasRoutes =
  require(
    "./routes/cuentas.routes"
  );


const transaccionesRoutes =
  require(
    "./routes/transacciones.routes"
  );


const bolsillosRoutes =
  require(
    "./routes/bolsillos.routes"
  );


const seguridadRoutes =
  require(
    "./routes/seguridad.routes"
  );


const authRoutes =
  require(
    "./routes/auth.routes"
  );


// ========================================
// Middleware de errores
// ========================================

const {
  rutaNoEncontrada,
  manejarError
} = require(
  "./middlewares/errores.middleware"
);


const validarApiKey =
  require(
    "./middlewares/apiKey.middleware"
  );


// ========================================
// Servicios
// ========================================

const apiKeysService =
  require(
    "./services/apiKeys.service"
  );


// ========================================
// Aplicación
// ========================================

const app =
  express();


const PORT =
  process.env.PORT ||
  3000;


// ========================================
// Seguridad
// ========================================

app.disable(
  "x-powered-by"
);


app.use(
  helmet()
);


// ========================================
// Proxy de confianza
// Necesario para que express-rate-limit
// identifique el IP real (y no falle)
// cuando la app corre detrás de un proxy.
// Por defecto no se confía en ninguno.
// ========================================

const trustProxy =
  process.env.TRUST_PROXY ??
  "false";

if (
  trustProxy !== "false"
) {

  app.set(
    "trust proxy",
    trustProxy === "true"
      ? 1
      : trustProxy
  );
}


// ========================================
// CORS
// ========================================

// Bloque 11: lista separada por comas en
// ALLOWED_ORIGIN (p. ej. Swagger en :3000 y
// la futura SPA React + Vite en :5173).
// Un origen no listado no recibe encabezados
// CORS (el navegador bloquea la respuesta).
const origenesPermitidos = (
  process.env.ALLOWED_ORIGIN || ""
)
  .split(",")
  .map((origen) => origen.trim())
  .filter(Boolean);

if (
  origenesPermitidos.length === 0
) {

  console.warn(
    "ALLOWED_ORIGIN no está definido en .env; " +
    "las peticiones desde el navegador no incluirán encabezados CORS."
  );
}

app.use(
  cors({

    origin:
      origenesPermitidos.length > 0
        ? origenesPermitidos
        : false,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-API-Key"
    ]
  })
);


// ========================================
// Limitar tamaño JSON
// ========================================

app.use(
  express.json({

    limit:
      "10kb"
  })
);


// ========================================
// Rate Limiting
// ========================================

const limiter =
  rateLimit({

    windowMs:
      15 *
      60 *
      1000,

    limit:
      100,

    standardHeaders:
      "draft-8",

    legacyHeaders:
      false,

    // Evita que express-rate-limit lance una
    // excepción cuando llega X-Forwarded-For
    // pero TRUST_PROXY no está configurado
    // (p. ej. detrás de un proxy no declarado).
    validate: {
      xForwardedForHeader: false
    },

    message: {

      mensaje:
        "Demasiadas solicitudes. Intente nuevamente más tarde."
    }
  });


app.use(
  "/api",
  limiter
);


// ========================================
// Bloque 11 - Clientes web y privados
// - POST /api/auth/login: público (con
//   validaciones y rate limit), para no
//   exponer una API Key en React.
// - Recursos y rutas de cuenta: JWT en sus
//   routers (autenticarJWT + RBAC + BOLA).
// - Resto (registro, restablecimientos,
//   /api/seguridad/cliente...): API Key.
// ========================================

const recursosJWT = new Set([
  "/usuarios",
  "/cuentas",
  "/transacciones",
  "/bolsillos"
]);

const rutasAuthJWT = new Set([
  "/auth/perfil",
  "/auth/cambiar-password",
  "/auth/recuperacion",
  "/auth/codigos-recuperacion"
]);

app.use(
  "/api",

  (req, res, next) => {

    if (
      req.method === "POST" &&
      req.path === "/auth/login"
    ) {
      return next();
    }

    const segmentos =
      req.path.split("/");

    if (
      recursosJWT.has(
        "/" + segmentos[1]
      )
    ) {
      return next();
    }

    if (
      rutasAuthJWT.has(
        "/" + segmentos.slice(1, 3).join("/")
      )
    ) {
      return next();
    }

    return validarApiKey(
      req,
      res,
      next
    );
  }
);


// ========================================
// Ruta principal
// ========================================

app.get(
  "/",

  (
    req,
    res
  ) => {

    res
      .status(200)
      .json({

        mensaje:
          "API Bolsillo funcionando"
      });
  }
);


// ========================================
// Recursos
// ========================================

app.use(
  "/api/usuarios",
  usuariosRoutes
);


app.use(
  "/api/cuentas",
  cuentasRoutes
);


app.use(
  "/api/transacciones",
  transaccionesRoutes
);


app.use(
  "/api/bolsillos",
  bolsillosRoutes
);


app.use(
  "/api/seguridad",
  seguridadRoutes
);


// Registro (API Key), login público y
// rutas de cuenta/recuperación (Bloque 11).
app.use(
  "/api/auth",
  authRoutes
);


// ========================================
// Swagger
// ========================================

app.use(
  "/api-docs",

  swaggerUi.serve,

  swaggerUi.setup(
    swaggerSpec
  )
);


// ========================================
// OpenAPI JSON
// ========================================

app.get(
  "/openapi.json",

  (
    req,
    res
  ) => {

    res.json(
      swaggerSpec
    );
  }
);


// ========================================
// Ruta no encontrada
// ========================================

app.use(
  rutaNoEncontrada
);


// ========================================
// Manejo global de errores
// ========================================

app.use(
  manejarError
);


// ========================================
// Iniciar servidor
// Configurar → inicializar datos → si todo
// está bien, abrir el puerto (fail-fast).
// El primer administrador NO se crea aquí:
// npm run seed:admin (Bloque 7.5.1)
// ========================================

const iniciarServidor =
  async () => {

    try {

      // API Keys de .env → public.api_keys
      await apiKeysService
        .sincronizarApiKeys();


      app.listen(
        PORT,

        () => {

          console.log(
            `Servidor ejecutándose en http://localhost:${PORT}`
          );

          console.log(
            `Swagger UI: http://localhost:${PORT}/api-docs`
          );

          console.log(
            `OpenAPI JSON: http://localhost:${PORT}/openapi.json`
          );
        }
      );

    } catch (error) {

      console.error(
        "Error al iniciar el servidor:",
        error.message
      );

      process.exit(1);
    }
  };


iniciarServidor();
