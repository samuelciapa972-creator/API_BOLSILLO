import { formatoPesos } from "../utils/formato";

/**
 * Firma visual de Bolsillo: el saldo total partido en lo disponible
 * (verde) y un tramo cobre por cada bolsillo activo.
 * saldo disponible = saldo total − suma de bolsillos activos.
 */
// `cantidadBolsillos` permite dibujar un solo tramo agregado (resumen
// administrativo) sin perder el número real de bolsillos en la leyenda.
export function BarraSaldo({ saldoTotal, bolsillos = [], cantidadBolsillos }) {
  const total = Number(saldoTotal) || 0;
  const activos = bolsillos.filter((b) => b.estado === "activo" && Number(b.saldo) > 0);
  const apartado = activos.reduce((suma, b) => suma + Number(b.saldo), 0);
  const disponible = Math.max(total - apartado, 0);
  const cantidad = cantidadBolsillos ?? activos.length;
  const porcentaje = (valor) => (total > 0 ? (valor / total) * 100 : 0);

  const descripcion =
    total > 0
      ? `Disponible ${formatoPesos(disponible)} de ${formatoPesos(total)}; apartado en bolsillos ${formatoPesos(apartado)}.`
      : "La cuenta no tiene saldo.";

  return (
    <div className="saldo-cuenta">
      <div className="barra-saldo" role="img" aria-label={descripcion}>
        {total > 0 ? (
          <>
            <span
              className="barra-saldo__tramo barra-saldo__tramo--disponible"
              style={{ width: `${porcentaje(disponible)}%` }}
            />
            {activos.map((bolsillo) => (
              <span
                key={bolsillo.id}
                className="barra-saldo__tramo barra-saldo__tramo--bolsillo"
                style={{ width: `${porcentaje(Number(bolsillo.saldo))}%` }}
                title={`${bolsillo.nombre}: ${formatoPesos(bolsillo.saldo)}`}
              />
            ))}
          </>
        ) : null}
      </div>
      <dl className="leyenda-saldo">
        <div>
          <dt>
            <span className="muestra muestra--disponible" aria-hidden="true" />
            Disponible
          </dt>
          <dd className="num">{formatoPesos(disponible)}</dd>
        </div>
        <div>
          <dt>
            <span className="muestra muestra--apartado" aria-hidden="true" />
            Apartado en {cantidad === 1 ? "1 bolsillo" : `${cantidad} bolsillos`}
          </dt>
          <dd className="num apartado">{formatoPesos(apartado)}</dd>
        </div>
      </dl>
    </div>
  );
}
