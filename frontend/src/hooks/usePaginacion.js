import { useMemo, useState } from "react";

/** Paginación en el cliente para listados de administración. */
export function usePaginacion(elementos, porPagina = 15) {
  const [solicitada, setNumero] = useState(1);
  const total = Math.max(1, Math.ceil(elementos.length / porPagina));
  // Si un filtro reduce el listado, la página se ajusta al rango válido.
  const numero = Math.min(solicitada, total);

  const pagina = useMemo(
    () => elementos.slice((numero - 1) * porPagina, numero * porPagina),
    [elementos, numero, porPagina]
  );

  return { pagina, numero, total, cantidad: elementos.length, setNumero };
}
