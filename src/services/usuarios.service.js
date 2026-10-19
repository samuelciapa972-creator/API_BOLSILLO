const usuarios =
  require(
    "../data/usuarios"
  );

const {
  generarSiguienteId
} = require(
  "../utils/comunes"
);

const obtenerUsuarios = () => {
  return usuarios;
};

const obtenerUsuarioPorId = (
  id
) => {
  return usuarios.find(
    usuario =>
      usuario.id === Number(id)
  );
};

// ========================================
// Obtener titular por usuario de login
// Relaciona el JWT (sub = usuarioAuth.id)
// con el titular de la billetera
// ========================================
const obtenerUsuarioPorUsuarioAuthId = (
  usuarioAuthId
) => {
  return usuarios.find(
    usuario =>
      usuario.usuarioAuthId ===
      Number(usuarioAuthId)
  );
};

const buscarUsuarioPorDocumento = (
  documento
) => {
  return usuarios.find(
    usuario =>
      usuario.documento ===
      documento
  );
};

const buscarUsuarioPorEmail = (
  email
) => {
  return usuarios.find(
    usuario =>
      usuario.email ===
      email
  );
};

const crearUsuario = (
  datos
) => {
  const nuevoId =
    generarSiguienteId(
      usuarios
    );

  const usuario = {
    id:
      nuevoId,

    usuarioAuthId:
      datos.usuarioAuthId ?? null,

    nombre:
      datos.nombre,

    documento:
      datos.documento,

    email:
      datos.email,

    telefono:
      datos.telefono,

    estado: "activo"
  };

  usuarios.push(
    usuario
  );

  return usuario;
};

const actualizarUsuario = (
  id,
  datos
) => {
  const indice =
    usuarios.findIndex(
      usuario =>
        usuario.id ===
        Number(id)
    );

  if (
    indice === -1
  ) {
    return null;
  }

  usuarios[indice] = {
    id:
      usuarios[indice].id,

    // Si no se envía, se conserva la
    // asociación actual con el login
    usuarioAuthId:
      datos.usuarioAuthId !== undefined
        ? datos.usuarioAuthId
        : usuarios[indice].usuarioAuthId,

    nombre:
      datos.nombre,

    documento:
      datos.documento,

    email:
      datos.email,

    telefono:
      datos.telefono,

    estado:
      datos.estado
  };

  return usuarios[indice];
};

const eliminarUsuario = (
  id
) => {
  const indice =
    usuarios.findIndex(
      usuario =>
        usuario.id ===
        Number(id)
    );

  if (
    indice === -1
  ) {
    return null;
  }

  const eliminado =
    usuarios.splice(
      indice,
      1
    );

  return eliminado[0];
};

module.exports = {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  obtenerUsuarioPorUsuarioAuthId,
  buscarUsuarioPorDocumento,
  buscarUsuarioPorEmail,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
};
