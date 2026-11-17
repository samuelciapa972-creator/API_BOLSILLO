import { useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useCarga } from "../hooks/useCarga";
import { actualizarTitular, crearTitular, eliminarTitular, listarTitulares } from "../services/recursos.service";
import { crearAccesoPrivilegiado, generarRecuperacionAdmin } from "../services/auth.service";
import { Dialogo } from "../components/Dialogo";
import { Contenido, Vacio } from "../components/EstadoVista";
import { AvisoError, AvisoExito, Campo } from "../components/Formulario";
import { Paginacion } from "../components/Paginacion";
import { usePaginacion } from "../hooks/usePaginacion";
import { Sello } from "../components/Sello";
import { formatoFechaLarga } from "../utils/formato";

export function TitularesPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === "administrador";
  const titulares = useCarga(() => listarTitulares());
  const [busqueda, setBusqueda] = useState("");
  const [accion, setAccion] = useState(null);
  const [exito, setExito] = useState(null);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return (titulares.datos || []).filter(
      (t) =>
        !texto ||
        t.nombre.toLowerCase().includes(texto) ||
        t.email.toLowerCase().includes(texto) ||
        t.documento.includes(texto)
    );
  }, [titulares.datos, busqueda]);
  const paginacion = usePaginacion(filtrados, 15);

  const terminar = (mensaje) => {
    setAccion(null);
    setExito(mensaje);
    titulares.recargar();
  };

  const TITULOS = {
    nuevo: "Registrar titular",
    editar: "Editar titular",
    eliminar: "Eliminar titular",
    token: "Token de recuperación",
    acceso: "Crear acceso de auditor o administrador",
  };

  return (
    <>
      <div className="encabezado-pagina">
        <div>
          <h1>Titulares</h1>
          <p>
            Personas dueñas de las cuentas. {esAdmin ? "" : "Como auditor solo puede consultar."}
          </p>
        </div>
        {esAdmin ? (
          <div className="acciones">
            <button className="boton" type="button" onClick={() => setAccion({ tipo: "nuevo" })}>
              Registrar titular
            </button>
            <button className="boton boton--secundario" type="button" onClick={() => setAccion({ tipo: "acceso" })}>
              Crear acceso de personal
            </button>
          </div>
        ) : null}
      </div>

      {exito ? (
        <div style={{ marginBottom: 16 }}>
          <AvisoExito>{exito}</AvisoExito>
        </div>
      ) : null}

      <div className="filtros">
        <Campo etiqueta="Buscar titular">
          {(props) => (
            <input
              {...props}
              className="entrada"
              type="search"
              placeholder="Nombre, correo o documento"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
            />
          )}
        </Campo>
      </div>

      <Contenido
        carga={{ ...titulares, datos: titulares.datos ? filtrados : null }}
        vacio={<Vacio titulo={titulares.datos?.length ? "Ningún titular coincide." : "No hay titulares registrados."} />}
      >
        {() => (
          <>
            <div className="tabla-marco">
              <table className="tabla">
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Documento</th>
                    <th scope="col">Correo</th>
                    <th scope="col">Teléfono</th>
                    <th scope="col">Estado</th>
                    {esAdmin ? (
                      <th scope="col">
                        <span className="solo-lector">Acciones</span>
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {paginacion.pagina.map((t) => (
                    <tr key={t.id}>
                      <td data-etiqueta="Nombre">
                        {t.nombre} <span className="texto-3 num">#{t.id}</span>
                      </td>
                      <td data-etiqueta="Documento" className="num">
                        {t.documento}
                      </td>
                      <td data-etiqueta="Correo">{t.email}</td>
                      <td data-etiqueta="Teléfono" className="num">
                        {t.telefono || <span className="texto-3">Sin teléfono</span>}
                      </td>
                      <td data-etiqueta="Estado">
                        <Sello estado={t.estado} />
                      </td>
                      {esAdmin ? (
                        <td className="tabla__acciones derecha">
                          <div className="acciones" style={{ justifyContent: "flex-end" }}>
                            <button type="button" className="boton boton--secundario" onClick={() => setAccion({ tipo: "editar", titular: t })}>
                              Editar
                            </button>
                            <button
                              type="button"
                              className="boton boton--fantasma"
                              disabled={!t.usuarioAuthId}
                              title={t.usuarioAuthId ? undefined : "El titular no tiene acceso de inicio de sesión vinculado"}
                              onClick={() => setAccion({ tipo: "token", titular: t })}
                            >
                              Token de recuperación
                            </button>
                            <button type="button" className="boton boton--fantasma" onClick={() => setAccion({ tipo: "eliminar", titular: t })}>
                              Eliminar
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginacion {...paginacion} />
          </>
        )}
      </Contenido>

      <Dialogo abierto={Boolean(accion)} alCerrar={() => setAccion(null)} titulo={accion ? TITULOS[accion.tipo] : ""}>
        {accion?.tipo === "nuevo" ? <FormularioTitular alTerminar={terminar} /> : null}
        {accion?.tipo === "editar" ? <FormularioTitular titular={accion.titular} alTerminar={terminar} /> : null}
        {accion?.tipo === "eliminar" ? <EliminarTitular titular={accion.titular} alTerminar={terminar} /> : null}
        {accion?.tipo === "token" ? <TokenRecuperacion titular={accion.titular} /> : null}
        {accion?.tipo === "acceso" ? <FormularioAcceso alTerminar={terminar} /> : null}
      </Dialogo>
    </>
  );
}

function FormularioTitular({ titular, alTerminar }) {
  const [datos, setDatos] = useState({
    nombre: titular?.nombre || "",
    documento: titular?.documento || "",
    email: titular?.email || "",
    telefono: titular?.telefono || "",
    usuarioAuthId: titular?.usuarioAuthId ? String(titular.usuarioAuthId) : "",
    estado: titular?.estado || "activo",
  });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const cambiar = (campo) => (evento) => setDatos((previo) => ({ ...previo, [campo]: evento.target.value }));

  const enviar = async (evento) => {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    const cuerpo = {
      nombre: datos.nombre.trim(),
      documento: datos.documento.trim(),
      email: datos.email.trim().toLowerCase(),
      telefono: datos.telefono.trim(),
    };
    if (datos.usuarioAuthId) cuerpo.usuarioAuthId = Number(datos.usuarioAuthId);
    try {
      if (titular) await actualizarTitular(titular.id, { ...cuerpo, estado: datos.estado });
      else await crearTitular(cuerpo);
      alTerminar(titular ? "Titular actualizado." : "Titular registrado.");
    } catch (fallo) {
      setError(fallo);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="formulario formulario--dos" onSubmit={enviar}>
      <Campo etiqueta="Nombre completo" ancho>
        {(props) => (
          <input {...props} className="entrada" required minLength={3} maxLength={100} value={datos.nombre} onChange={cambiar("nombre")} />
        )}
      </Campo>
      <Campo etiqueta="Documento" ayuda="Solo números, 6 a 15 dígitos.">
        {(props) => (
          <input
            {...props}
            className="entrada num"
            inputMode="numeric"
            pattern="[0-9]{6,15}"
            required
            value={datos.documento}
            onChange={cambiar("documento")}
          />
        )}
      </Campo>
      <Campo etiqueta="Celular" ayuda="10 dígitos, empieza por 3.">
        {(props) => (
          <input {...props} className="entrada num" inputMode="tel" pattern="3[0-9]{9}" required value={datos.telefono} onChange={cambiar("telefono")} />
        )}
      </Campo>
      <Campo etiqueta="Correo" ancho>
        {(props) => <input {...props} className="entrada" type="email" required value={datos.email} onChange={cambiar("email")} />}
      </Campo>
      <Campo etiqueta="ID de acceso vinculado (opcional)" ayuda="ID en usuarios_auth para que el titular inicie sesión.">
        {(props) => (
          <input {...props} className="entrada num" type="number" min="1" step="1" value={datos.usuarioAuthId} onChange={cambiar("usuarioAuthId")} />
        )}
      </Campo>
      {titular ? (
        <Campo etiqueta="Estado">
          {(props) => (
            <select {...props} className="selector" value={datos.estado} onChange={cambiar("estado")}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          )}
        </Campo>
      ) : null}
      <AvisoError error={error} />
      <div className="acciones">
        <button className="boton" type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : titular ? "Guardar cambios" : "Registrar titular"}
        </button>
      </div>
    </form>
  );
}

function EliminarTitular({ titular, alTerminar }) {
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const confirmar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await eliminarTitular(titular.id);
      alTerminar("Titular eliminado.");
    } catch (fallo) {
      setError(fallo);
    } finally {
      setEnviando(false);
    }
  };
  return (
    <div className="formulario">
      <p>
        Se eliminará a <strong>{titular.nombre}</strong>. El servidor lo rechaza si el titular todavía tiene cuentas.
      </p>
      <AvisoError error={error} />
      <div className="acciones">
        <button type="button" className="boton boton--peligro" disabled={enviando} onClick={confirmar}>
          {enviando ? "Eliminando…" : "Eliminar titular"}
        </button>
      </div>
    </div>
  );
}

function TokenRecuperacion({ titular }) {
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const generar = async () => {
    setEnviando(true);
    setError(null);
    try {
      setResultado(await generarRecuperacionAdmin(titular.usuarioAuthId));
    } catch (fallo) {
      setError(fallo);
    } finally {
      setEnviando(false);
    }
  };

  if (resultado) {
    return (
      <div className="formulario">
        <div className="aviso aviso--atencion">{resultado.mensaje}</div>
        <ul className="codigos" style={{ gridTemplateColumns: "1fr", wordBreak: "break-all" }}>
          <li>{resultado.token}</li>
        </ul>
        <p className="texto-2">Vence el {formatoFechaLarga(resultado.expiraEn)}. Sirve una sola vez y no se volverá a mostrar.</p>
      </div>
    );
  }

  return (
    <div className="formulario">
      <p>
        Verifique la identidad de <strong>{titular.nombre}</strong> antes de continuar. El token permite fijar una
        contraseña nueva sin conocer la anterior.
      </p>
      <AvisoError error={error} />
      <div className="acciones">
        <button type="button" className="boton" disabled={enviando} onClick={generar}>
          {enviando ? "Generando…" : "Identidad verificada, generar token"}
        </button>
      </div>
    </div>
  );
}

function FormularioAcceso({ alTerminar }) {
  const [datos, setDatos] = useState({ nombre: "", email: "", password: "", rol: "auditor" });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const cambiar = (campo) => (evento) => setDatos((previo) => ({ ...previo, [campo]: evento.target.value }));

  const enviar = async (evento) => {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await crearAccesoPrivilegiado({ ...datos, email: datos.email.trim().toLowerCase(), nombre: datos.nombre.trim() });
      alTerminar(`Acceso de ${datos.rol} creado para ${datos.email}.`);
    } catch (fallo) {
      setError(fallo);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="formulario" onSubmit={enviar}>
      <p className="texto-2">Los clientes se registran por su canal; aquí solo se crea personal interno.</p>
      <Campo etiqueta="Nombre">
        {(props) => <input {...props} className="entrada" required minLength={3} value={datos.nombre} onChange={cambiar("nombre")} />}
      </Campo>
      <Campo etiqueta="Correo">
        {(props) => <input {...props} className="entrada" type="email" required value={datos.email} onChange={cambiar("email")} />}
      </Campo>
      <Campo etiqueta="Contraseña inicial" ayuda="Entre 10 y 72 caracteres.">
        {(props) => (
          <input
            {...props}
            className="entrada"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            maxLength={72}
            value={datos.password}
            onChange={cambiar("password")}
          />
        )}
      </Campo>
      <Campo etiqueta="Rol">
        {(props) => (
          <select {...props} className="selector" value={datos.rol} onChange={cambiar("rol")}>
            <option value="auditor">Auditor</option>
            <option value="administrador">Administrador</option>
          </select>
        )}
      </Campo>
      <AvisoError error={error} />
      <div className="acciones">
        <button className="boton" type="submit" disabled={enviando}>
          {enviando ? "Creando…" : "Crear acceso"}
        </button>
      </div>
    </form>
  );
}
