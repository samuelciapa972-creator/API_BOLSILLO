import { PiggyBank } from "@phosphor-icons/react";
import { formatoPesos } from "../utils/formato";
import { Sello } from "./Sello";

const R = 22;
const CIRC = 2 * Math.PI * R;

/** Bolsillo como sobre: anillo de avance hacia la meta y acciones propias. */
export function Sobre({ bolsillo, acciones }) {
  const saldo = Number(bolsillo.saldo);
  const meta = bolsillo.meta ? Number(bolsillo.meta) : null;
  const avance = meta ? Math.min(saldo / meta, 1) : null;

  return (
    <article className={`sobre${bolsillo.estado !== "activo" ? " sobre--archivado" : ""}`}>
      <div className="sobre__cabeza">
        <div className="anillo" role="img" aria-label={meta ? `Avance ${Math.round(avance * 100)}% de la meta` : "Sin meta"}>
          <svg viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r={R} className="anillo__pista" />
            {meta ? (
              <circle
                cx="26"
                cy="26"
                r={R}
                className="anillo__avance"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - avance)}
              />
            ) : null}
          </svg>
          {meta ? (
            <span className="anillo__texto num">{Math.round(avance * 100)}%</span>
          ) : (
            <PiggyBank className="anillo__icono" size={20} aria-hidden="true" />
          )}
        </div>
        <div className="sobre__titulo">
          <h3>{bolsillo.nombre}</h3>
          {bolsillo.estado !== "activo" ? (
            <Sello estado={bolsillo.estado} />
          ) : (
            <span className="texto-3">{meta ? `Meta ${formatoPesos(meta)}` : "Sin meta"}</span>
          )}
        </div>
      </div>
      <p className="sobre__saldo cifra">{formatoPesos(saldo)}</p>
      {acciones ? <div className="sobre__acciones">{acciones}</div> : null}
    </article>
  );
}
