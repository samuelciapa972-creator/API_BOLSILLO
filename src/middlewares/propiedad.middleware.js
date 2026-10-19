const usuariosService =
  require("../services/usuarios.service");

const cuentasService =
  require("../services/cuentas.service");

const bolsillosService =
  require("../services/bolsillos.service");

const transaccionesService =
  require("../services/transacciones.service");


// ========================================
// Autorización a nivel de objeto
// (protección BOLA / IDOR)
//
// RBAC responde: ¿tu rol puede hacer esto?
// Aquí respondemos: ¿puedes hacerlo sobre
// ESTE recurso concreto?
//
// Cadena de propiedad en Bolsillo:
//
//   JWT (sub = usuarioAuth.id)
//     ↓
//   titular (usuario.usuarioAuthId)
//     ↓
//   cuenta (cuenta.usuarioId)
//     ↓
//   bolsillo (cuentaId) / transacción
//   (cuentaOrigenId o cuentaDestinoId)
//
// Debe ejecutarse después de autenticarJWT,
// autorizarRoles y validar (los IDs ya son
// enteros válidos).
// ========================================


// ========================================
// Acceso global
// administrador: todo
// auditor: solo lectura (GET)
// ========================================

const tieneAccesoGlobal = (req) => {

  if (
    req.usuario.rol ===
    "administrador"
  ) {
    return true;
  }

  return (
    req.usuario.rol === "auditor" &&
    req.method === "GET"
  );
};


// ========================================
// ¿La cuenta pertenece al titular?
// ========================================

const esCuentaDelTitular = (
  cuentaId,
  titular
) => {

  const cuenta =
    cuentasService
      .obtenerCuentaPorId(
        cuentaId
      );

  return (
    !!cuenta &&
    cuenta.usuarioId ===
      titular.id
  );
};


// ========================================
// Fábrica de middlewares de propiedad
// perteneceAlTitular(req, titular) decide
// si el recurso pedido es del titular.
//
// Para un cliente, un recurso inexistente
// y uno ajeno responden igual (403): así
// no se puede enumerar qué IDs existen.
// Los roles globales siguen al controller,
// que responde 404 si no existe.
// ========================================

const autorizarPropiedad = (
  perteneceAlTitular
) => {

  return (req, res, next) => {

    // ------------------------------------
    // Requiere autenticación previa
    // ------------------------------------

    if (!req.usuario) {
      return res.status(401).json({
        mensaje:
          "Usuario no autenticado"
      });
    }


    // ------------------------------------
    // Administrador / auditor (lectura)
    // ------------------------------------

    if (
      tieneAccesoGlobal(req)
    ) {
      return next();
    }


    // ------------------------------------
    // Esta regla aplica a clientes
    // ------------------------------------

    if (
      req.usuario.rol !==
      "cliente"
    ) {
      return res.status(403).json({
        mensaje:
          "No tiene permisos para acceder a este recurso"
      });
    }


    // ------------------------------------
    // Titular del usuario autenticado
    // (identidad derivada del JWT, nunca
    // de la URL ni del body)
    // ------------------------------------

    const titular =
      usuariosService
        .obtenerUsuarioPorUsuarioAuthId(
          req.usuario.id
        );


    if (!titular) {
      return res.status(403).json({
        mensaje:
          "El usuario no tiene un titular de billetera asociado"
      });
    }


    // ------------------------------------
    // Comprobar propiedad
    // ------------------------------------

    if (
      !perteneceAlTitular(
        req,
        titular
      )
    ) {
      return res.status(403).json({
        mensaje:
          "No tiene permisos para acceder a este recurso"
      });
    }


    next();
  };
};


// ========================================
// /api/usuarios/:id
// El titular solicitado es el propio
// ========================================

const autorizarUsuarioPropio =
  autorizarPropiedad(
    (req, titular) =>
      titular.id ===
        Number(req.params.id)
  );


// ========================================
// /api/cuentas/:id (y /saldo,
// /transacciones, /bolsillos)
// ========================================

const autorizarCuentaPropia =
  autorizarPropiedad(
    (req, titular) =>
      esCuentaDelTitular(
        req.params.id,
        titular
      )
  );


// ========================================
// Retiro / transferencia
// El dinero solo puede salir de una cuenta
// propia. El destino de una transferencia
// puede ser cualquier cuenta.
// ========================================

const autorizarCuentaOrigenPropia =
  autorizarPropiedad(
    (req, titular) =>
      esCuentaDelTitular(
        req.body.cuentaOrigenId,
        titular
      )
  );


// ========================================
// POST /api/bolsillos
// Solo se crean bolsillos en cuentas
// propias
// ========================================

const autorizarCuentaDeBolsilloNuevo =
  autorizarPropiedad(
    (req, titular) =>
      esCuentaDelTitular(
        req.body.cuentaId,
        titular
      )
  );


// ========================================
// /api/bolsillos/:id (y /apartar,
// /devolver, PUT, DELETE)
// ========================================

const autorizarAccesoBolsillo =
  autorizarPropiedad(
    (req, titular) => {

      const bolsillo =
        bolsillosService
          .obtenerBolsilloPorId(
            req.params.id
          );

      return (
        !!bolsillo &&
        esCuentaDelTitular(
          bolsillo.cuentaId,
          titular
        )
      );
    }
  );


// ========================================
// /api/transacciones/:id
// Visible si el titular es dueño de la
// cuenta origen o de la cuenta destino
// ========================================

const autorizarAccesoTransaccion =
  autorizarPropiedad(
    (req, titular) => {

      const transaccion =
        transaccionesService
          .obtenerTransaccionPorId(
            req.params.id
          );

      if (!transaccion) {
        return false;
      }

      return (
        esCuentaDelTitular(
          transaccion.cuentaOrigenId,
          titular
        ) ||
        esCuentaDelTitular(
          transaccion.cuentaDestinoId,
          titular
        )
      );
    }
  );


// ========================================
// Exportaciones
// ========================================

module.exports = {
  autorizarUsuarioPropio,
  autorizarCuentaPropia,
  autorizarCuentaOrigenPropia,
  autorizarCuentaDeBolsilloNuevo,
  autorizarAccesoBolsillo,
  autorizarAccesoTransaccion
};
