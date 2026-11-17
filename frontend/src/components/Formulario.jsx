import { useId } from "react";
import { formatoPesos } from "../utils/formato";

/** Etiqueta + control + ayuda + error, enlazados por aria. */
export function Campo({ etiqueta, ayuda, error, ancho = false, children }) {
  const id = useId();
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  const descritoPor = [idAyuda, idError].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`campo${ancho ? " campo--ancho" : ""}`}>
      <label htmlFor={id}>{etiqueta}</label>
      {children({ id, "aria-describedby": descritoPor, "aria-invalid": error ? "true" : undefined })}
      {ayuda ? (
        <span id={idAyuda} className="campo__ayuda">
          {ayuda}
        </span>
      ) : null}
      {error ? (
        <span id={idError} className="campo__error">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** Campo de monto en pesos con prefijo y vista previa formateada. */
export function CampoMonto({ etiqueta = "Monto", valor, alCambiar, maximo, error, ayuda }) {
  const numero = Number(valor);
  const vista = valor && Number.isFinite(numero) && numero > 0 ? formatoPesos(numero) : null;
  return (
    <Campo etiqueta={etiqueta} error={error} ayuda={vista ? `Equivale a ${vista}` : ayuda}>
      {(props) => (
        <div className="casilla-monto">
          <span aria-hidden="true">$</span>
          <input
            {...props}
            className="entrada entrada--monto"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            max={maximo}
            required
            value={valor}
            onChange={(evento) => alCambiar(evento.target.value)}
          />
        </div>
      )}
    </Campo>
  );
}

/** Muestra el error de la API, con el detalle de validación si existe. */
export function AvisoError({ error }) {
  if (!error) return null;
  const detalles = (error.errores || []).map((detalle) => detalle.msg || detalle.mensaje).filter(Boolean);
  return (
    <div className="aviso aviso--error" role="alert">
      {error.message}
      {detalles.length > 0 ? (
        <ul>
          {[...new Set(detalles)].map((texto) => (
            <li key={texto}>{texto}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function AvisoExito({ children }) {
  if (!children) return null;
  return (
    <div className="aviso aviso--exito" role="status">
      {children}
    </div>
  );
}
