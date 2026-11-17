import { ETIQUETA_TIPO, formatoFechaLarga, formatoPesos, sentidoMovimiento } from "../utils/formato";
import { IconoMovimiento } from "./IconoMovimiento";

const SIGNO = { credito: "+ ", debito: "− ", apartado: "", neutro: "" };

const diaClave = (fecha) => new Date(fecha).toDateString();
const hoy = () => new Date().toDateString();
const ayer = () => new Date(Date.now() - 86400000).toDateString();
const etiquetaDia = (fecha) => {
  const clave = diaClave(fecha);
  if (clave === hoy()) return "Hoy";
  if (clave === ayer()) return "Ayer";
  return new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" }).format(new Date(fecha));
};
const hora = new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit" });

/**
 * Movimientos como libreta: agrupados por día, con ícono por tipo, concepto
 * con línea punteada y monto con signo. `cuentaId` (o `_cuenta` por fila)
 * define el signo desde el punto de vista de una cuenta.
 */
export function Extracto({ transacciones, cuentaId, nombresBolsillo = {} }) {
  const grupos = [];
  for (const t of transacciones) {
    const clave = diaClave(t.fecha);
    const grupo = grupos.at(-1);
    if (grupo && grupo.clave === clave) grupo.filas.push(t);
    else grupos.push({ clave, etiqueta: etiquetaDia(t.fecha), filas: [t] });
  }

  return (
    <div className="extracto">
      {grupos.map((grupo) => (
        <section key={grupo.clave} className="extracto__dia" aria-label={grupo.etiqueta}>
          <h3 className="extracto__fecha-dia">{grupo.etiqueta}</h3>
          <ol>
            {grupo.filas.map((t) => {
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
                  <IconoMovimiento tipo={t.tipo} sentido={sentido} />
                  <span className="extracto__concepto">
                    <strong>{ETIQUETA_TIPO[t.tipo] || t.tipo}</strong>
                    <span>
                      <time dateTime={t.fecha} title={formatoFechaLarga(t.fecha)}>
                        {hora.format(new Date(t.fecha))}
                      </time>
                      {detalle ? ` · ${detalle}` : ""}
                    </span>
                  </span>
                  <span className={`extracto__monto num ${sentido}`}>
                    {SIGNO[sentido]}
                    {formatoPesos(t.monto)}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
