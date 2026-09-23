const swaggerJsdoc =
  require(
    "swagger-jsdoc"
  );


const options = {

  definition: {

    openapi:
      "3.0.3",


    info: {

      title:
        "Bolsillo API",

      version:
        "1.0.0",

      description:
        "API REST para una billetera virtual desarrollada con Node.js, Express, prácticas seguras y documentación OpenAPI."
    },


    servers: [
      {
        url:
          "http://localhost:3000",

        description:
          "Servidor local"
      }
    ],


    components: {

      securitySchemes: {

        ApiKeyAuth: {

          type:
            "apiKey",

          in:
            "header",

          name:
            "X-API-Key",

          description:
            "API Key requerida para consumir los endpoints protegidos de la API."
        }
      }
    },


    security: [
      {
        ApiKeyAuth: []
      }
    ],


    tags: [

      {
        name:
          "Usuarios",

        description:
          "Gestión de las personas registradas en la billetera"
      },

      {
        name:
          "Cuentas",

        description:
          "Gestión del saldo y el estado de cada cuenta"
      },

      {
        name:
          "Transacciones",

        description:
          "Registro de depósitos, retiros y transferencias entre cuentas"
      },

      {
        name:
          "Bolsillos",

        description:
          "Gestión de metas de ahorro que apartan saldo dentro de una cuenta"
      },

      {
        name:
          "Seguridad",

        description:
          "Endpoints relacionados con autenticación y seguridad de la API"
      },

      {
        name:
          "Autenticación",

        description:
          "Registro e inicio de sesión de usuarios"
      }

    ]
  },


  apis: [
    "./src/routes/*.js"
  ]
};


const swaggerSpec =
  swaggerJsdoc(
    options
  );


module.exports =
  swaggerSpec;