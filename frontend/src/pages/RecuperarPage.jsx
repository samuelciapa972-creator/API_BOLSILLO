import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { restablecerConCodigo, restablecerConToken } from "../services/auth.service";
import { AvisoError, AvisoExito, Campo } from "../components/Formulario";
import { MarcoAcceso } from "./AccesoPage";

const REGLA = "12 a 72 caracteres, con mayúscula, minúscula y número.";

export function RecuperarPage() {
  const [parametros, setParametros] = useSearchParams();
  const modo = parametros.get("modo") === "token" ? "token" : "codigo";

  const [email, setEmail] = useState("");
  const [secreto, setSecreto] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const cambiarModo = (siguiente) => {
    setParametros(siguiente === "token" ? { modo: "token" } : {});
    setError(null);
    setExito(null);
    setSecreto("");
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const respuesta =
        modo === "token"
          ? await restablecerConToken({ token: secreto.trim(), passwordNueva: nueva, confirmarPassword: confirmar })
          : await restablecerConCodigo({
              email: email.trim().toLowerCase(),
              codigo: secreto.trim(),
              passwordNueva: nueva,
              confirmarPassword: confirmar,
            });
      setExito(respuesta?.mensaje || "Contraseña restablecida.");
      setSecreto("");
      setNueva("");
      setConfirmar("");
    } catch (fallo) {
      setError(fallo);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <MarcoAcceso>
      <div>
        <h1>Recuperar el acceso</h1>
        <p className="texto-2" style={{ marginTop: 8 }}>
          {modo === "token"
            ? "Usa el token de un solo uso que te entregó el administrador después de verificar tu identidad."
            : "Usa uno de los códigos de respaldo que guardaste. Cada código sirve una sola vez."}
        </p>
      </div>

      <div className="pestanas" role="tablist" aria-label="Método de recuperación">
        <button type="button" role="tab" aria-selected={modo === "codigo"} onClick={() => cambiarModo("codigo")}>
          Código de respaldo
        </button>
        <button type="button" role="tab" aria-selected={modo === "token"} onClick={() => cambiarModo("token")}>
          Token del administrador
        </button>
      </div>

      {exito ? (
        <>
          <AvisoExito>{exito}</AvisoExito>
          <Link className="boton" to="/acceso">
            Ir a iniciar sesión
          </Link>
        </>
      ) : (
        <form className="formulario" onSubmit={enviar}>
          {modo === "codigo" ? (
            <Campo etiqueta="Correo de la cuenta">
              {(props) => (
                <input
                  {...props}
                  className="entrada"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                />
              )}
            </Campo>
          ) : null}

          <Campo etiqueta={modo === "token" ? "Token" : "Código de respaldo"}>
            {(props) => (
              <input
                {...props}
                className="entrada num"
                autoComplete="one-time-code"
                spellCheck={false}
                required
                value={secreto}
                onChange={(evento) => setSecreto(evento.target.value)}
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
                value={nueva}
                onChange={(evento) => setNueva(evento.target.value)}
              />
            )}
          </Campo>

          <Campo
            etiqueta="Confirmar contraseña"
            error={confirmar && confirmar !== nueva ? "No coincide con la nueva contraseña." : null}
          >
            {(props) => (
              <input
                {...props}
                className="entrada"
                type="password"
                autoComplete="new-password"
                required
                value={confirmar}
                onChange={(evento) => setConfirmar(evento.target.value)}
              />
            )}
          </Campo>

          <AvisoError error={error} />

          <button className="boton boton--grande boton--ancho" type="submit" disabled={enviando || nueva !== confirmar}>
            {enviando ? "Restableciendo…" : "Restablecer contraseña"}
          </button>
        </form>
      )}

      <div className="acceso__pie">
        <Link to="/acceso">Volver a iniciar sesión</Link>
      </div>
    </MarcoAcceso>
  );
}
