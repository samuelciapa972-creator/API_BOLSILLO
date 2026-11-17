/**
 * Los tres estados que toda vista con datos debe cubrir.
 */
export function Cargando({ etiqueta = "Cargando información" }) {
  return (
    <div className="cargando" role="status" aria-live="polite">
      <span className="solo-lector">{etiqueta}…</span>
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
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
    <div className="estado-vista" role="alert">
      <strong>No se pudo cargar esta sección.</strong>
      <p>{error?.message || "Error desconocido."}</p>
      {alReintentar ? (
        <button type="button" className="boton boton--secundario" onClick={alReintentar}>
          Reintentar
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
