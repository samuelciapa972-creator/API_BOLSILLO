import { Key, MagnifyingGlass, PencilSimple, Plus, Trash, UserPlus } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useCarga } from "../hooks/useCarga";
import { actualizarTitular, crearTitular, eliminarTitular, listarTitulares } from "../services/recursos.service";
import { crearAccesoPrivilegiado, generarRecuperacionAdmin } from "../services/auth.service";
import { Hoja } from "../components/Hoja";
import { Contenido, Vacio } from "../components/EstadoVista";
import { AvisoError, Campo } from "../components/Formulario";
import { Paginacion } from "../components/Paginacion";
import { usePaginacion } from "../hooks/usePaginacion";
import { Sello } from "../components/Sello";
import { formatoFechaLarga } from "../utils/formato";

export function TitularesPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === "administrador";
  const titulares = useCarga(() => listarTitulares());
  const [busqueda, setBusqueda] = useState("");
  const [parametros, setParametros] = useSearchParams();
  const [accionLocal, setAccion] = useState(null);
  // ?nuevo=1 llega desde el atajo "Registrar titular" del resumen.
  const accion = accionLocal ?? (esAdmin && parametros.get("nuevo") === "1" ? { tipo: "nuevo" } : null);
  const cerrar = () => {
    setAccion(null);
    if (parametros.has("nuevo")) setParametros({}, { replace: true });
  };

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
    cerrar();
    toast.success(mensaje);
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
      <header className="saludo saludo--fila">
        <div>
          <h1>Titulares</h1>
          <p className="texto-2">
            Personas dueñas de las cuentas. {esAdmin ? "" : "Como auditor solo puede consultar."}
          </p>
        </div>
        {esAdmin ? (
          <div className="acciones">
            <button className="boton" type="button" onClick={() => setAccion({ tipo: "nuevo" })}>
              <Plus size={18} weight="bold" aria-hidden="true" /> Registrar titular
            </button>
            <button className="boton boton--secundario" type="button" onClick={() => setAccion({ tipo: "acceso" })}>
              <UserPlus size={18} aria-hidden="true" /> Acceso de personal
            </button>
          </div>
        ) : null}
      </header>

      <div className="barra-filtros">
        <label className="buscador">
          <MagnifyingGlass size={18} aria-hidden="true" />
          <span className="solo-lector">Buscar titular</span>
          <input type="search" placeholder="Nombre, correo o documento" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} />
        </label>
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
                            <button type="button" className="boton boton--fantasma boton--icono" aria-label={`Editar a ${t.nombre}`} title="Editar" onClick={() => setAccion({ tipo: "editar", titular: t })}>
                              <PencilSimple size={18} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="boton boton--fantasma boton--icono"
                              disabled={!t.usuarioAuthId}
                              aria-label={t.usuarioAuthId ? `Token de recuperación para ${t.nombre}` : `${t.nombre} no tiene acceso vinculado`}
                              title={t.usuarioAuthId ? "Token de recuperación" : "Sin acceso de inicio de sesión vinculado"}
                              onClick={() => setAccion({ tipo: "token", titular: t })}
                            >
                              <Key size={18} aria-hidden="true" />
                            </button>
                            <button type="button" className="boton boton--fantasma boton--icono" aria-label={`Eliminar a ${t.nombre}`} title="Eliminar" onClick={() => setAccion({ tipo: "eliminar", titular: t })}>
                              <Trash size={18} aria-hidden="true" />
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

      <Hoja abierta={Boolean(accion)} alCerrar={cerrar} titulo={accion ? TITULOS[accion.tipo] : ""}>
        {accion?.tipo === "nuevo" ? <FormularioTitular alTerminar={terminar} /> : null}
        {accion?.tipo === "editar" ? <FormularioTitular titular={accion.titular} alTerminar={terminar} /> : null}
        {accion?.tipo === "eliminar" ? <EliminarTitular titular={accion.titular} alTerminar={terminar} /> : null}
        {accion?.tipo === "token" ? <TokenRecuperacion titular={accion.titular} /> : null}
        {accion?.tipo === "acceso" ? <FormularioAcceso alTerminar={terminar} /> : null}
      </Hoja>
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
    <form className="formulario" onSubmit={enviar}>
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
