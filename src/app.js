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

const allowedOrigin =
  process.env.ALLOWED_ORIGIN;

if (
  !allowedOrigin
) {

  console.warn(
    "ALLOWED_ORIGIN no está definido en .env; " +
    "las peticiones desde el navegador no incluirán encabezados CORS."
  );
}

app.use(
  cors({

    origin:
      allowedOrigin ||
      false,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE"
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
// Autenticación mediante API Key
// ========================================

app.use(
  "/api",
  validarApiKey
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
// Servidor
// ========================================

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