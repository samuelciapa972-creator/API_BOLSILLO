import { useEffect, useState } from "react";
import { CLAVE_TEMA, aplicarTema, leerTema } from "../utils/tema";

const SIGUIENTE = { sistema: "claro", claro: "oscuro", oscuro: "sistema" };
const TEXTO = { sistema: "Tema: sistema", claro: "Tema: claro", oscuro: "Tema: oscuro" };

export function SelectorTema() {
  const [tema, setTema] = useState(leerTema);

  // Sincroniza con sistemas externos (DOM y localStorage), sin setState.
  useEffect(() => {
    aplicarTema(tema);
    try {
      localStorage.setItem(CLAVE_TEMA, tema);
    } catch {
      // Sin almacenamiento: el tema dura hasta recargar.
    }
  }, [tema]);

  return (
    <button
      type="button"
      className="boton boton--fantasma"
      onClick={() => setTema((actual) => SIGUIENTE[actual])}
      aria-label={`${TEXTO[tema]}. Cambiar tema`}
      title="Cambiar entre tema del sistema, claro y oscuro"
    >
      {TEXTO[tema]}
    </button>
  );
}
