export function Paginacion({ numero, total, cantidad, setNumero }) {
  if (total <= 1) return <p className="paginacion num">{cantidad} registros</p>;
  return (
    <nav className="paginacion" aria-label="Paginación">
      <span className="num">
        Página {numero} de {total} · {cantidad} registros
      </span>
      <div className="acciones">
        <button
          type="button"
          className="boton boton--secundario"
          disabled={numero === 1}
          onClick={() => setNumero(numero - 1)}
        >
          Anterior
        </button>
        <button
          type="button"
          className="boton boton--secundario"
          disabled={numero === total}
          onClick={() => setNumero(numero + 1)}
        >
          Siguiente
        </button>
      </div>
    </nav>
  );
}
