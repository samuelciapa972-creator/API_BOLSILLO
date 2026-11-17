import { ETIQUETA_TIPO, formatoFechaCorta, formatoFechaLarga, formatoPesos, sentidoMovimiento } from "../utils/formato";

const SIGNO = { credito: "+ ", debito: "− ", apartado: "", neutro: "" };

/**
 * Movimientos como filas de libreta: fecha, concepto con línea punteada y
 * monto. Si se pasa `cuentaId`, el signo se calcula desde esa cuenta.
 */
export function Extracto({ transacciones, cuentaId, nombresBolsillo = {} }) {
  return (
    <ol className="extracto">
      {transacciones.map((t) => {
        // `_cuenta` permite mezclar movimientos de varias cuentas propias.
        const referencia = cuentaId ?? t._cuenta;
        const sentido = referencia ? sentidoMovimiento(t, referencia) : "neutro";
        const bolsillo = t.bolsilloId ? nombresBolsillo[t.bolsilloId] : null;
        const detalle = [
          bolsillo ? `«${bolsillo}»` : null,
          t.tipo === "transferencia" && referencia
            ? sentido === "debito"
              ? `a cuenta #${t.cuentaDestinoId}`
              : `desde cuenta #${t.cuentaOrigenId}`
            : null,
          t.descripcion,
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <li key={`${t.id}-${referencia ?? ""}`} className="extracto__fila">
            <time className="extracto__fecha num" dateTime={t.fecha} title={formatoFechaLarga(t.fecha)}>
              {formatoFechaCorta(t.fecha)}
            </time>
            <span className="extracto__concepto">
              <strong>{ETIQUETA_TIPO[t.tipo] || t.tipo}</strong>
              {detalle ? <span>{detalle}</span> : null}
            </span>
            <span className={`extracto__monto num ${sentido}`}>
              {SIGNO[sentido]}
              {formatoPesos(t.monto)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
