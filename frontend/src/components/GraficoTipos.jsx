import { useId, useState } from "react";
import { ETIQUETA_TIPO, formatoPesos } from "../utils/formato";
import { IconoMovimiento } from "./IconoMovimiento";

/**
 * Barras horizontales de una sola serie (monto por tipo): un solo tono,
 * etiquetas directas, sin leyenda. Detalle (cantidad) en tooltip al pasar el
 * cursor o enfocar la fila, y una tabla como vista alternativa.
 */
export function GraficoTipos({ filas }) {
  const [vista, setVista] = useState("grafico");
  const id = useId();
  const ordenadas = [...filas].sort((a, b) => Number(b.monto) - Number(a.monto));
  const maximo = Math.max(...ordenadas.map((f) => Number(f.monto)), 1);

  return (
    <div className="hoja">
      <div className="segmentos segmentos--chico" role="tablist" aria-label="Vista">
        <button type="button" role="tab" aria-selected={vista === "grafico"} aria-controls={id} onClick={() => setVista("grafico")}>
          Gráfico
        </button>
        <button type="button" role="tab" aria-selected={vista === "tabla"} aria-controls={id} onClick={() => setVista("tabla")}>
          Tabla
        </button>
      </div>
      <div id={id}>
        {vista === "grafico" ? (
          <ul className="grafico-barras" aria-label="Monto por tipo de movimiento">
            {ordenadas.map((f) => (
              <li key={f.tipo} className="grafico-barras__fila" tabIndex={0}>
                <span className="grafico-barras__rotulo">
                  <IconoMovimiento tipo={f.tipo} />
                  {ETIQUETA_TIPO[f.tipo] || f.tipo}
                </span>
                <span className="grafico-barras__pista">
                  <span className="grafico-barras__barra" style={{ transform: `scaleX(${Number(f.monto) / maximo})` }} />
                </span>
                <span className="grafico-barras__valor num">{formatoPesos(f.monto)}</span>
                <span className="grafico-barras__tooltip" role="tooltip">
                  {f.cantidad} {f.cantidad === 1 ? "movimiento" : "movimientos"} · {formatoPesos(f.monto)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <table className="tabla tabla--simple">
            <thead>
              <tr>
                <th scope="col">Tipo</th>
                <th scope="col" className="derecha">
                  Cantidad
                </th>
                <th scope="col" className="derecha">
                  Monto
                </th>
              </tr>
            </thead>
            <tbody>
              {ordenadas.map((f) => (
                <tr key={f.tipo}>
                  <td data-etiqueta="Tipo">{ETIQUETA_TIPO[f.tipo] || f.tipo}</td>
                  <td data-etiqueta="Cantidad" className="derecha num">
                    {f.cantidad}
                  </td>
                  <td data-etiqueta="Monto" className="derecha num">
                    {formatoPesos(f.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
