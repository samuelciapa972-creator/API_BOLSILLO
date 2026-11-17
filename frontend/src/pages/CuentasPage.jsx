import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCarga } from "../hooks/useCarga";
import {
  bolsillosDeCuenta,
  crearCuenta,
  listarCuentas,
  listarMisCuentas,
  listarTitulares,
} from "../services/recursos.service";
import { BarraSaldo } from "../components/BarraSaldo";
import { Dialogo } from "../components/Dialogo";
import { Contenido, Vacio } from "../components/EstadoVista";
import { AvisoError, Campo } from "../components/Formulario";
import { Paginacion } from "../components/Paginacion";
import { usePaginacion } from "../hooks/usePaginacion";
import { Sello } from "../components/Sello";
import { formatoPesos } from "../utils/formato";

export function CuentasPage() {
  const { usuario } = useAuth();
  return usuario.rol === "cliente" ? <MisCuentas /> : <TodasLasCuentas rol={usuario.rol} />;
}

function MisCuentas() {
  const carga = useCarga(async () => {
    const cuentas = await listarMisCuentas();
    return Promise.all(cuentas.map(async (cuenta) => ({ cuenta, bolsillos: await bolsillosDeCuenta(cuenta.id) })));
  });

  return (
    <>
      <div className="encabezado-pagina">
        <div>
          <h1>Mis cuentas</h1>
          <p>Abre una cuenta para ver su extracto, mover dinero o administrar sus bolsillos.</p>
        </div>
      </div>
      <Contenido carga={carga} vacio={<Vacio titulo="Aún no tienes cuentas." />}>
        {(lista) => (
          <div className="lista-cuentas">
            {lista.map(({ cuenta, bolsillos }) => (
              <Link key={cuenta.id} to={`/cuentas/${cuenta.id}`} className="hoja ficha-cuenta">
                <div>
                  <span className="ficha-cuenta__numero">
                    Cuenta {cuenta.numeroCuenta} <Sello estado={cuenta.estado} />
                  </span>
                  <p className="ficha-cuenta__saldo cifra">{formatoPesos(cuenta.saldoTotal)}</p>
                  <span className="texto-3">ID interno #{cuenta.id}</span>
                </div>
                <BarraSaldo saldoTotal={cuenta.saldoTotal} bolsillos={bolsillos} />
              </Link>
            ))}
          </div>
        )}
      </Contenido>
    </>
  );
}

function TodasLasCuentas({ rol }) {
  const navegar = useNavigate();
  const cuentas = useCarga(() => listarCuentas());
  const [estado, setEstado] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [abrir, setAbrir] = useState(false);

  const filtradas = useMemo(() => {
    const texto = busqueda.trim();
    return (cuentas.datos || []).filter(
      (c) =>
        (estado === "todas" || c.estado === estado) &&
        (!texto || c.numeroCuenta.includes(texto) || String(c.usuarioId) === texto || String(c.id) === texto)
    );
  }, [cuentas.datos, estado, busqueda]);

  const paginacion = usePaginacion(filtradas, 15);

  return (
    <>
      <div className="encabezado-pagina">
        <div>
          <h1>Cuentas</h1>
          <p>
            {rol === "auditor"
              ? "Consulta de todas las cuentas. El auditor no puede modificar datos."
              : "Todas las cuentas de la billetera. Abre una cuenta nueva para un titular registrado."}
          </p>
        </div>
        {rol === "administrador" ? (
          <button type="button" className="boton" onClick={() => setAbrir(true)}>
            Abrir una cuenta
          </button>
        ) : null}
      </div>

      <div className="filtros">
        <Campo etiqueta="Buscar">
          {(props) => (
            <input
              {...props}
              className="entrada"
              type="search"
              placeholder="Número, ID o ID de titular"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
            />
          )}
        </Campo>
        <Campo etiqueta="Estado">
          {(props) => (
            <select {...props} className="selector" value={estado} onChange={(evento) => setEstado(evento.target.value)}>
              <option value="todas">Todas</option>
              <option value="activa">Activas</option>
              <option value="bloqueada">Bloqueadas</option>
              <option value="cerrada">Cerradas</option>
            </select>
          )}
        </Campo>
      </div>

      <Contenido
        carga={{ ...cuentas, datos: cuentas.datos ? filtradas : null }}
        vacio={
          <Vacio titulo={cuentas.datos?.length ? "Ninguna cuenta coincide con el filtro." : "No hay cuentas registradas."} />
        }
      >
        {() => (
          <>
            <div className="tabla-marco">
              <table className="tabla">
                <thead>
                  <tr>
                    <th scope="col">Número</th>
                    <th scope="col">Titular</th>
                    <th scope="col">Estado</th>
                    <th scope="col" className="derecha">
                      Saldo total
                    </th>
                    <th scope="col">
                      <span className="solo-lector">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginacion.pagina.map((c) => (
                    <tr key={c.id}>
                      <td data-etiqueta="Número" className="num">
                        {c.numeroCuenta} <span className="texto-3">#{c.id}</span>
                      </td>
                      <td data-etiqueta="Titular" className="num">
                        #{c.usuarioId}
                      </td>
                      <td data-etiqueta="Estado">
                        <Sello estado={c.estado} />
                      </td>
                      <td data-etiqueta="Saldo total" className="derecha num">
                        {formatoPesos(c.saldoTotal)}
                      </td>
                      <td className="tabla__acciones derecha">
                        <Link className="boton boton--secundario" to={`/cuentas/${c.id}`}>
                          Ver cuenta
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginacion {...paginacion} />
          </>
        )}
      </Contenido>

      <Dialogo abierto={abrir} alCerrar={() => setAbrir(false)} titulo="Abrir una cuenta">
        <FormularioAbrirCuenta
          alTerminar={(cuenta) => {
            setAbrir(false);
            navegar(`/cuentas/${cuenta.id}`);
          }}
        />
      </Dialogo>
    </>
  );
}

function FormularioAbrirCuenta({ alTerminar }) {
  const titulares = useCarga(() => listarTitulares());
  const [usuarioId, setUsuarioId] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (evento) => {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await crearCuenta(Number(usuarioId));
      alTerminar(respuesta.cuenta || respuesta);
    } catch (fallo) {
      setError(fallo);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Contenido carga={titulares} vacio={<Vacio titulo="Primero registre un titular." />}>
      {(lista) => (
        <form className="formulario" onSubmit={enviar}>
          <p className="texto-2">
            La cuenta se crea con saldo cero, en pesos colombianos. El número lo genera el servidor.
          </p>
          <Campo etiqueta="Titular">
            {(props) => (
              <select
                {...props}
                className="selector"
                required
                value={usuarioId}
                onChange={(evento) => setUsuarioId(evento.target.value)}
              >
                <option value="">Seleccione un titular activo</option>
                {lista
                  .filter((t) => t.estado === "activo")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} · doc. {t.documento}
                    </option>
                  ))}
              </select>
            )}
          </Campo>
          <AvisoError error={error} />
          <div className="acciones">
            <button className="boton" type="submit" disabled={enviando || !usuarioId}>
              {enviando ? "Abriendo…" : "Abrir cuenta"}
            </button>
          </div>
        </form>
      )}
    </Contenido>
  );
}
