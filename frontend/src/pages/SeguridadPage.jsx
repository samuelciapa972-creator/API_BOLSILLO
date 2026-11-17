import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useCarga } from "../hooks/useCarga";
import { cambiarPassword, estadoCodigos, generarCodigos, obtenerPerfil } from "../services/auth.service";
import { Contenido } from "../components/EstadoVista";
import { AvisoError, Campo } from "../components/Formulario";
import { Sello } from "../components/Sello";
import { ETIQUETA_ROL, formatoFechaLarga } from "../utils/formato";

const REGLA = "12 a 72 caracteres, con mayúscula, minúscula y número.";

export function SeguridadPage() {
  const { expiraEn } = useAuth();
  const perfil = useCarga(() => obtenerPerfil());

  return (
    <>
      <header className="saludo">
        <h1>Seguridad</h1>
        <p className="texto-2">Contraseña, códigos de respaldo y datos de la sesión actual.</p>
      </header>

      <div className="dos-columnas">
        <section className="hoja" aria-labelledby="titulo-sesion">
          <h2 id="titulo-sesion">Sesión actual</h2>
          <Contenido carga={perfil} esVacio={() => false}>
            {(datos) => (
              <dl className="datos-cortos" style={{ marginTop: 8 }}>
                <div>
                  <dt>Correo</dt>
                  <dd>{datos.usuario.email}</dd>
                </div>
                <div>
                  <dt>Rol</dt>
                  <dd>
                    <Sello estado={ETIQUETA_ROL[datos.usuario.rol] || datos.usuario.rol} rol />
                  </dd>
                </div>
                <div>
                  <dt>ID de acceso</dt>
                  <dd className="num">#{datos.usuario.id}</dd>
                </div>
                {expiraEn ? (
                  <div>
                    <dt>La sesión vence</dt>
                    <dd className="num">{formatoFechaLarga(expiraEn)}</dd>
                  </div>
                ) : null}
              </dl>
            )}
          </Contenido>
          <p className="texto-3" style={{ marginTop: 12, fontSize: "0.8125rem" }}>
            La sesión se guarda solo en esta pestaña y se cierra al vencer el token.
          </p>
        </section>

        <CodigosRespaldo />
      </div>

      <CambioPassword />
    </>
  );
}

function CambioPassword() {
  const { cerrarSesion } = useAuth();
  const [datos, setDatos] = useState({ passwordActual: "", passwordNueva: "", confirmarPassword: "" });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const cambiar = (campo) => (evento) => setDatos((previo) => ({ ...previo, [campo]: evento.target.value }));
  const distintas = datos.confirmarPassword && datos.confirmarPassword !== datos.passwordNueva;

  const enviar = async (evento) => {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await cambiarPassword(datos);
      // version_sesion aumentó: este JWT ya no sirve.
      cerrarSesion(respuesta?.mensaje || "Contraseña actualizada. Inicie sesión nuevamente.");
    } catch (fallo) {
      setError(fallo);
      setEnviando(false);
    }
  };

  return (
    <section className="hoja bloque" aria-labelledby="titulo-clave">
      <h2 id="titulo-clave">Cambiar contraseña</h2>
      <p className="texto-2" style={{ margin: "6px 0 16px" }}>
        Al cambiarla se cierran todas las sesiones abiertas, incluida esta.
      </p>
      <form className="formulario formulario--dos formulario--angosto" onSubmit={enviar}>
        <Campo etiqueta="Contraseña actual" ancho>
          {(props) => (
            <input
              {...props}
              className="entrada"
              type="password"
              autoComplete="current-password"
              required
              value={datos.passwordActual}
              onChange={cambiar("passwordActual")}
            />
          )}
        </Campo>
        <Campo etiqueta="Nueva contraseña" ayuda={REGLA}>
          {(props) => (
            <input
              {...props}
              className="entrada"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
              required
              value={datos.passwordNueva}
              onChange={cambiar("passwordNueva")}
            />
          )}
        </Campo>
        <Campo etiqueta="Confirmar nueva contraseña" error={distintas ? "No coincide." : null}>
          {(props) => (
            <input
              {...props}
              className="entrada"
              type="password"
              autoComplete="new-password"
              required
              value={datos.confirmarPassword}
              onChange={cambiar("confirmarPassword")}
            />
          )}
        </Campo>
        <AvisoError error={error} />
        <div className="acciones">
          <button className="boton" type="submit" disabled={enviando || distintas}>
            {enviando ? "Guardando…" : "Cambiar contraseña"}
          </button>
        </div>
      </form>
    </section>
  );
}

function CodigosRespaldo() {
  const estado = useCarga(() => estadoCodigos());
  const [password, setPassword] = useState("");
  const [codigos, setCodigos] = useState(null);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const disponibles = estado.datos?.disponibles ?? 0;

  const generar = async (evento) => {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await generarCodigos(password, disponibles > 0);
      setCodigos(respuesta.codigos);
      setPassword("");
      estado.recargar();
    } catch (fallo) {
      setError(fallo);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="hoja" aria-labelledby="titulo-codigos">
      <h2 id="titulo-codigos">Códigos de respaldo</h2>
      <Contenido carga={estado} esVacio={() => false}>
        {() => (
          <p className="texto-2" style={{ margin: "6px 0 16px" }}>
            {disponibles > 0
              ? `Le quedan ${disponibles} códigos sin usar. Generar nuevos invalida los anteriores.`
              : "No tiene códigos. Sirven para recuperar el acceso si olvida la contraseña."}
          </p>
        )}
      </Contenido>

      {codigos ? (
        <div className="formulario">
          <div className="aviso aviso--atencion" role="status">
            Guárdelos ahora en un lugar seguro. No se volverán a mostrar.
          </div>
          <ol className="codigos">
            {codigos.map((codigo) => (
              <li key={codigo}>{codigo}</li>
            ))}
          </ol>
          <div className="acciones">
            <button type="button" className="boton boton--secundario" onClick={() => setCodigos(null)}>
              Ya los guardé
            </button>
          </div>
        </div>
      ) : (
        <form className="formulario" onSubmit={generar}>
          <Campo etiqueta="Confirme su contraseña actual">
            {(props) => (
              <input
                {...props}
                className="entrada"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(evento) => setPassword(evento.target.value)}
              />
            )}
          </Campo>
          <AvisoError error={error} />
          <div className="acciones">
            <button className="boton" type="submit" disabled={enviando || estado.cargando}>
              {enviando ? "Generando…" : disponibles > 0 ? "Regenerar códigos" : "Generar códigos"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
