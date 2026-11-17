import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";

/** Esqueleto con la forma del contenido, no un spinner. */
export function Cargando({ etiqueta = "Cargando información", filas = 4 }) {
  return (
    <div className="esqueleto" role="status" aria-live="polite">
      <span className="solo-lector">{etiqueta}…</span>
      <span className="hueso hueso--titulo" aria-hidden="true" />
      {Array.from({ length: filas }, (_, i) => (
        <span key={i} className="hueso hueso--fila" aria-hidden="true" style={{ width: `${92 - i * 9}%` }} />
      ))}
    </div>
  );
}

export function Vacio({ titulo, children, accion }) {
  return (
    <div className="estado-vista">
      <strong>{titulo}</strong>
      {children ? <p>{children}</p> : null}
      {accion}
    </div>
  );
}

export function ErrorVista({ error, alReintentar }) {
  return (
    <div className="estado-vista estado-vista--error" role="alert">
      <WarningCircle size={28} aria-hidden="true" />
      <strong>No se pudo cargar esta sección.</strong>
      <p>{error?.message || "Error desconocido."}</p>
      {alReintentar ? (
        <button type="button" className="boton boton--secundario" onClick={alReintentar}>
          <ArrowClockwise size={16} aria-hidden="true" /> Reintentar
        </button>
      ) : null}
    </div>
  );
}

/** Envuelve una carga de useCarga y decide qué estado mostrar. */
export function Contenido({ carga, vacio, esVacio, children }) {
  if (carga.cargando && !carga.datos) return <Cargando />;
  if (carga.error) return <ErrorVista error={carga.error} alReintentar={carga.recargar} />;
  const vacioReal = esVacio ? esVacio(carga.datos) : Array.isArray(carga.datos) && carga.datos.length === 0;
  if (vacioReal) return vacio;
  return children(carga.datos);
}
