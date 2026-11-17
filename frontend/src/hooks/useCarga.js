import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Ejecuta una carga asíncrona y expone sus tres estados (cargando, error,
 * datos) más `recargar`. `clave` identifica qué se está cargando: cuando
 * cambia (p. ej. otra cuenta), se vuelve a cargar. Ignora respuestas que
 * llegan después de desmontar o de una carga más reciente.
 */
export function useCarga(cargador, clave = "") {
  const [estado, setEstado] = useState({ clave: null, ocupado: false, error: null, datos: null });
  const turno = useRef(0);
  const ultimoCargador = useRef(cargador);

  useLayoutEffect(() => {
    ultimoCargador.current = cargador;
  });

  // Solo actualiza el estado después de la respuesta (nunca en el mismo
  // ciclo del efecto) y descarta respuestas de cargas anteriores.
  const ejecutar = useCallback(async (mio, paraClave) => {
    try {
      const datos = await ultimoCargador.current();
      if (mio === turno.current) setEstado({ clave: paraClave, ocupado: false, error: null, datos });
    } catch (error) {
      if (mio === turno.current) setEstado({ clave: paraClave, ocupado: false, error, datos: null });
    }
  }, []);

  useEffect(() => {
    ejecutar(++turno.current, clave);
    return () => {
      turno.current += 1;
    };
  }, [ejecutar, clave]);

  const recargar = useCallback(() => {
    setEstado((previo) => ({ ...previo, ocupado: true, error: null }));
    return ejecutar(++turno.current, clave);
  }, [ejecutar, clave]);

  // Si la clave cambió, lo mostrado pertenece a otra carga.
  const vigente = estado.clave === clave;

  return {
    cargando: !vigente || estado.ocupado,
    error: vigente ? estado.error : null,
    datos: vigente ? estado.datos : null,
    recargar,
  };
}
