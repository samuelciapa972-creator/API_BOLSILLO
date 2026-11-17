import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AvisoError, Campo } from "../components/Formulario";

export function MarcoAcceso({ children }) {
  return (
    <div className="acceso">
      <aside className="acceso__libreta">
        <Link to="/acceso" className="marca">
          Bolsillo
        </Link>
        <div className="acceso__centro">
          <p className="acceso__lema">Tu dinero, con bolsillos para lo que importa.</p>
          {/* Explica la regla del negocio con la misma barra de la app: proporciones, no cifras. */}
          <figure className="regla" aria-label="Lo que apartas en bolsillos sigue en tu cuenta, pero no se gasta por error">
            <div className="regla__fila">
              <span>Saldo total</span>
              <span className="regla__barra">
                <i className="regla__tramo regla__tramo--disponible" style={{ "--d": "0ms", flexGrow: 58 }} />
                <i className="regla__tramo regla__tramo--bolsillo" style={{ "--d": "80ms", flexGrow: 27 }} />
                <i className="regla__tramo regla__tramo--bolsillo" style={{ "--d": "140ms", flexGrow: 15 }} />
              </span>
            </div>
            <div className="regla__fila">
              <span>En bolsillos</span>
              <span className="regla__barra">
                <i className="regla__hueco" style={{ flexGrow: 58 }} />
                <i className="regla__tramo regla__tramo--bolsillo" style={{ "--d": "220ms", flexGrow: 27 }} />
                <i className="regla__tramo regla__tramo--bolsillo" style={{ "--d": "280ms", flexGrow: 15 }} />
              </span>
            </div>
            <div className="regla__fila">
              <span>Disponible</span>
              <span className="regla__barra">
                <i className="regla__tramo regla__tramo--disponible" style={{ "--d": "360ms", flexGrow: 58 }} />
                <i className="regla__hueco" style={{ flexGrow: 42 }} />
              </span>
            </div>
            <figcaption>
              Lo que apartas en un bolsillo sigue en tu cuenta, pero no se gasta por error.
            </figcaption>
          </figure>
        </div>
        <p className="acceso__pie-tapa">Billetera virtual · pesos colombianos</p>
      </aside>
      <main className="acceso__formulario" id="contenido">
        <div className="acceso__caja">{children}</div>
      </main>
    </div>
  );
}

export function AccesoPage() {
  const { autenticado, entrar, motivoCierre } = useAuth();
  const navegar = useNavigate();
  const { state } = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  if (autenticado) return <Navigate to={state?.desde || "/"} replace />;

  const enviar = async (evento) => {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await entrar(email.trim().toLowerCase(), password);
      navegar(state?.desde || "/", { replace: true });
    } catch (fallo) {
      setError(fallo);
      setPassword("");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <MarcoAcceso>
      <div>
        <h1>Entrar a tu libreta</h1>
        <p className="texto-2" style={{ marginTop: 8 }}>
          Usa el correo y la contraseña de tu cuenta Bolsillo.
        </p>
      </div>

      {motivoCierre ? (
        <div className="aviso aviso--atencion" role="status">
          {motivoCierre}
        </div>
      ) : null}

      <form className="formulario" onSubmit={enviar}>
        <Campo etiqueta="Correo">
          {(props) => (
            <input
              {...props}
              className="entrada"
              type="email"
              autoComplete="username"
              required
              maxLength={120}
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
            />
          )}
        </Campo>
        <Campo etiqueta="Contraseña">
          {(props) => (
            <input
              {...props}
              className="entrada"
              type="password"
              autoComplete="current-password"
              required
              maxLength={72}
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
            />
          )}
        </Campo>

        <AvisoError error={error} />

        <button className="boton boton--grande boton--ancho" type="submit" disabled={enviando}>
          {enviando ? "Verificando…" : "Entrar"}
        </button>
      </form>

      <div className="acceso__pie">
        <Link to="/recuperar">Recuperar con código de respaldo</Link>
        <Link to="/recuperar?modo=token">Tengo un token del administrador</Link>
      </div>
    </MarcoAcceso>
  );
}
