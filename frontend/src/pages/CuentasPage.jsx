import { CaretRight, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useCarga } from "../hooks/useCarga";
import { usePaginacion } from "../hooks/usePaginacion";
import { bolsillosDeCuenta, crearCuenta, listarCuentas, listarMisCuentas, listarTitulares } from "../services/recursos.service";
import { BarraSaldo } from "../components/BarraSaldo";
import { Contenido, Vacio } from "../components/EstadoVista";
import { AvisoError, Campo } from "../components/Formulario";
import { Hoja } from "../components/Hoja";
import { Paginacion } from "../components/Paginacion";
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
  }, "mis-cuentas-bolsillos");

  return (
    <>
      <header className="saludo">
        <h1>Mis cuentas</h1>
        <p className="texto-2">Elija una cuenta para ver su extracto, mover dinero o administrar sus bolsillos.</p>
      </header>
      <Contenido carga={carga} vacio={<Vacio titulo="Aún no tienes cuentas." />}>
        {(lista) => (
          <ul className="lista-cuentas">
            {lista.map(({ cuenta, bolsillos }) => (
              <li key={cuenta.id}>
                <Link to={`/cuentas/${cuenta.id}`} className="ficha-cuenta">
                  <span className="ficha-cuenta__numero">
                    Cuenta <span className="num">{cuenta.numeroCuenta}</span> <Sello estado={cuenta.estado} />
                  </span>
                  <span className="ficha-cuenta__saldo cifra">{formatoPesos(cuenta.saldoTotal)}</span>
                  <BarraSaldo saldoTotal={cuenta.saldoTotal} bolsillos={bolsillos} compacta />
                  <CaretRight className="ficha-cuenta__flecha" size={20} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Contenido>
    </>
  );
}

const ESTADOS = [
  { id: "todas", texto: "Todas" },
  { id: "activa", texto: "Activas" },
  { id: "bloqueada", texto: "Bloqueadas" },
  { id: "cerrada", texto: "Cerradas" },
];

function TodasLasCuentas({ rol }) {
  const navegar = useNavigate();
  const [parametros, setParametros] = useSearchParams();
  const cuentas = useCarga(() => listarCuentas(), "cuentas");
  const [estado, setEstado] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const abrir = rol === "administrador" && parametros.get("abrir") === "1";
  const setAbrir = (valor) => setParametros(valor ? { abrir: "1" } : {}, { replace: true });

  const filtradas = useMemo(() => {
    const texto = busqueda.trim();
    return (cuentas.datos || []).filter(
      (c) =>
        (estado === "todas" || c.estado === estado) &&
        (!texto || c.numeroCuenta.includes(texto) || String(c.usuarioId) === texto || String(c.id) === texto)
    );
  }, [cuentas.datos, estado, busqueda]);
  const paginacion = usePaginacion(filtradas, 15);
  const total = (cuentas.datos || []).length;

  return (
    <>
      <header className="saludo saludo--fila">
        <div>
          <h1>Cuentas</h1>
          <p className="texto-2">
            {rol === "auditor" ? "Consulta de todas las cuentas. El auditor no puede modificar datos." : `${total} cuentas en la billetera.`}
          </p>
        </div>
        {rol === "administrador" ? (
          <button type="button" className="boton" onClick={() => setAbrir(true)}>
            <Plus size={18} weight="bold" aria-hidden="true" /> Abrir cuenta
          </button>
        ) : null}
      </header>

      <div className="barra-filtros">
        <label className="buscador">
          <MagnifyingGlass size={18} aria-hidden="true" />
          <span className="solo-lector">Buscar cuenta</span>
          <input type="search" placeholder="Número, ID o ID de titular" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </label>
        <div className="chips" role="group" aria-label="Filtrar por estado">
          {ESTADOS.map((e) => (
            <button key={e.id} type="button" className="chip" aria-pressed={estado === e.id} onClick={() => setEstado(e.id)}>
              {e.texto}
            </button>
          ))}
        </div>
      </div>

      <Contenido
        carga={{ ...cuentas, datos: cuentas.datos ? filtradas : null }}
        vacio={<Vacio titulo={total ? "Ninguna cuenta coincide con la búsqueda." : "No hay cuentas registradas."} />}
      >
        {() => (
          <>
            <div className="tabla-marco">
              <table className="tabla">
                <thead>
                  <tr>
                    <th scope="col">Cuenta</th>
                    <th scope="col">Titular</th>
                    <th scope="col">Estado</th>
                    <th scope="col" className="derecha">
                      Saldo total
                    </th>
                    <th scope="col">
                      <span className="solo-lector">Abrir</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginacion.pagina.map((c) => (
                    <tr key={c.id} className="fila-enlace" onClick={() => navegar(`/cuentas/${c.id}`)}>
                      <td data-etiqueta="Cuenta" className="num">
                        <strong>{c.numeroCuenta}</strong> <span className="texto-3">#{c.id}</span>
                      </td>
                      <td data-etiqueta="Titular" className="num">
                        #{c.usuarioId}
                      </td>
                      <td data-etiqueta="Estado">
                        <Sello estado={c.estado} />
                      </td>
                      <td data-etiqueta="Saldo total" className="derecha num">
                        <strong>{formatoPesos(c.saldoTotal)}</strong>
                      </td>
                      <td className="tabla__acciones derecha">
                        <Link className="boton boton--fantasma boton--chico" to={`/cuentas/${c.id}`} onClick={(e) => e.stopPropagation()}>
                          Ver <CaretRight size={14} aria-hidden="true" />
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

      <Hoja abierta={abrir} alCerrar={() => setAbrir(false)} titulo="Abrir cuenta" descripcion="La cuenta nace con saldo cero, en pesos colombianos. El número lo genera el servidor.">
        <FormularioAbrirCuenta
          alTerminar={(cuenta) => {
            toast.success("Cuenta abierta", { description: `Cuenta ${cuenta.numeroCuenta}` });
            navegar(`/cuentas/${cuenta.id}`);
          }}
        />
      </Hoja>
    </>
  );
}

function FormularioAbrirCuenta({ alTerminar }) {
  const titulares = useCarga(() => listarTitulares(), "titulares-para-cuenta");
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
      setEnviando(false);
    }
  };

  return (
    <Contenido carga={titulares} vacio={<Vacio titulo="Primero registre un titular." />}>
      {(lista) => (
        <form className="formulario" onSubmit={enviar}>
          <Campo etiqueta="Titular">
            {(props) => (
              <select {...props} className="selector" required value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
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
          <button className="boton boton--grande boton--ancho" type="submit" disabled={enviando || !usuarioId}>
            {enviando ? "Abriendo…" : "Abrir cuenta"}
          </button>
        </form>
      )}
    </Contenido>
  );
}
