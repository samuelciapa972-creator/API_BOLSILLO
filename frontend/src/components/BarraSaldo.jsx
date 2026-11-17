import { formatoPesos } from "../utils/formato";

/**
 * Firma visual de Bolsillo: el saldo total partido en lo disponible (verde)
 * y un tramo cobre por cada bolsillo activo.
 * saldo disponible = saldo total − suma de bolsillos activos.
 *
 * Los tramos se mueven solo con transform (translateX + scaleX), así un
 * apartado o una devolución desliza la frontera sin recalcular el layout.
 * `cantidadBolsillos` permite un tramo agregado (resumen administrativo)
 * sin perder el número real de bolsillos en la leyenda.
 */
export function BarraSaldo({ saldoTotal, bolsillos = [], cantidadBolsillos, compacta = false }) {
  const total = Number(saldoTotal) || 0;
  const activos = bolsillos.filter((b) => b.estado === "activo" && Number(b.saldo) > 0);
  const apartado = activos.reduce((suma, b) => suma + Number(b.saldo), 0);
  const disponible = Math.max(total - apartado, 0);
  const cantidad = cantidadBolsillos ?? activos.length;
  const fr = (valor) => (total > 0 ? valor / total : 0);

  // Cada tramo empieza donde termina el anterior (el primero, tras lo disponible).
  const tramos = activos.reduce((lista, b) => {
    const previo = lista.at(-1);
    const desde = previo ? previo.desde + previo.ancho : fr(disponible);
    return [...lista, { id: b.id, nombre: b.nombre, saldo: Number(b.saldo), desde, ancho: fr(Number(b.saldo)) }];
  }, []);

  const descripcion =
    total > 0
      ? `Disponible ${formatoPesos(disponible)} de ${formatoPesos(total)}; apartado en bolsillos ${formatoPesos(apartado)}.`
      : "La cuenta no tiene saldo.";

  return (
    <div className={`saldo-barra${compacta ? " saldo-barra--compacta" : ""}`}>
      <div className="barra-saldo" role="img" aria-label={descripcion}>
        <span
          className="barra-saldo__tramo barra-saldo__tramo--disponible"
          style={{ transform: `scaleX(${fr(disponible)})` }}
        />
        {tramos.map((t) => (
          <span
            key={t.id}
            className="barra-saldo__tramo barra-saldo__tramo--bolsillo"
            style={{ transform: `translateX(${t.desde * 100}%) scaleX(${t.ancho})` }}
            title={`${t.nombre}: ${formatoPesos(t.saldo)}`}
          />
        ))}
        {/* Muescas entre tramos: elementos propios para que no se deformen con scaleX. */}
        {tramos.map((t) => (
          <span key={`m-${t.id}`} className="barra-saldo__muesca" style={{ transform: `translateX(${t.desde * 100}%)` }} />
        ))}
      </div>
      {compacta ? null : (
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
              En {cantidad === 1 ? "1 bolsillo" : `${cantidad} bolsillos`}
            </dt>
            <dd className="num apartado">{formatoPesos(apartado)}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
