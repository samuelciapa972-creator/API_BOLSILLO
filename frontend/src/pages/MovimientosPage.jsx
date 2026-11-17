import { MagnifyingGlass } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCarga } from "../hooks/useCarga";
import { listarTransacciones } from "../services/recursos.service";
import { Contenido, Vacio } from "../components/EstadoVista";
import { IconoMovimiento } from "../components/IconoMovimiento";
import { Paginacion } from "../components/Paginacion";
import { usePaginacion } from "../hooks/usePaginacion";
import { Sello } from "../components/Sello";
import { ETIQUETA_TIPO, formatoFechaLarga, formatoPesos } from "../utils/formato";

const enlaceCuenta = (id) => (id ? <Link to={`/cuentas/${id}`}>#{id}</Link> : <span className="texto-3">no aplica</span>);

export function MovimientosPage() {
  const carga = useCarga(() => listarTransacciones());
  const [tipo, setTipo] = useState("todos");
  const [cuenta, setCuenta] = useState("");

  const filtrados = useMemo(() => {
    const id = cuenta.trim();
    return [...(carga.datos || [])]
      .filter((t) => tipo === "todos" || t.tipo === tipo)
      .filter((t) => !id || String(t.cuentaOrigenId) === id || String(t.cuentaDestinoId) === id)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [carga.datos, tipo, cuenta]);
  const paginacion = usePaginacion(filtrados, 20);

  return (
    <>
      <header className="saludo">
        <h1>Movimientos</h1>
        <p className="texto-2">Todas las transacciones registradas. Son inmutables: ninguna se edita ni se borra.</p>
      </header>

      <div className="barra-filtros">
        <label className="buscador">
          <MagnifyingGlass size={18} aria-hidden="true" />
          <span className="solo-lector">Filtrar por ID de cuenta</span>
          <input type="search" inputMode="numeric" placeholder="ID de cuenta (origen o destino)" value={cuenta} onChange={(evento) => setCuenta(evento.target.value)} />
        </label>
        <div className="chips" role="group" aria-label="Filtrar por tipo">
          <button type="button" className="chip" aria-pressed={tipo === "todos"} onClick={() => setTipo("todos")}>
            Todos
          </button>
          {Object.entries(ETIQUETA_TIPO).map(([valor, texto]) => (
            <button key={valor} type="button" className="chip" aria-pressed={tipo === valor} onClick={() => setTipo(valor)}>
              {texto}
            </button>
          ))}
        </div>
      </div>

      <Contenido
        carga={{ ...carga, datos: carga.datos ? filtrados : null }}
        vacio={<Vacio titulo={carga.datos?.length ? "Ningún movimiento coincide." : "No hay movimientos registrados."} />}
      >
        {() => (
          <>
            <div className="tabla-marco">
              <table className="tabla">
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Tipo</th>
                    <th scope="col">Origen</th>
                    <th scope="col">Destino</th>
                    <th scope="col" className="derecha">
                      Monto
                    </th>
                    <th scope="col">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {paginacion.pagina.map((t) => (
                    <tr key={t.id}>
                      <td data-etiqueta="Fecha" className="num">
                        {formatoFechaLarga(t.fecha)}
                      </td>
                      <td data-etiqueta="Tipo">
                        <span className="celda-tipo">
                          <IconoMovimiento tipo={t.tipo} />
                          {ETIQUETA_TIPO[t.tipo] || t.tipo}
                        </span>
                        {t.descripcion ? <div className="texto-3">{t.descripcion}</div> : null}
                      </td>
                      <td data-etiqueta="Origen" className="num">
                        {enlaceCuenta(t.cuentaOrigenId)}
                      </td>
                      <td data-etiqueta="Destino" className="num">
                        {enlaceCuenta(t.cuentaDestinoId)}
                      </td>
                      <td data-etiqueta="Monto" className={`derecha num ${t.bolsilloId ? "apartado" : ""}`}>
                        {formatoPesos(t.monto)}
                      </td>
                      <td data-etiqueta="Estado">
                        <Sello estado={t.estado} />
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
    </>
  );
}
