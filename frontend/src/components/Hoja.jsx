import { X } from "@phosphor-icons/react";
import { useEffect, useId, useRef } from "react";

/**
 * Hoja deslizable sobre <dialog> nativo: foco atrapado, Escape y retorno del
 * foco los resuelve el navegador. Entra desde la derecha en escritorio y desde
 * abajo en móvil (mismo camino de entrada y salida). La animación es CSS con
 * @starting-style y transition-behavior: allow-discrete, sin JavaScript.
 */
export function Hoja({ abierta, alCerrar, titulo, descripcion, children }) {
  const ref = useRef(null);
  const idTitulo = useId();
  const idDesc = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierta && !dialogo.open) dialogo.showModal();
    if (!abierta && dialogo.open) dialogo.close();
  }, [abierta]);

  return (
    <dialog
      ref={ref}
      className="hoja-lateral"
      aria-labelledby={idTitulo}
      aria-describedby={descripcion ? idDesc : undefined}
      onClose={alCerrar}
      onClick={(evento) => {
        if (evento.target === ref.current) alCerrar();
      }}
    >
      <div className="hoja-lateral__marco">
        <span className="hoja-lateral__asa" aria-hidden="true" />
        <header className="hoja-lateral__cabeza">
          <div>
            <h2 id={idTitulo}>{titulo}</h2>
            {descripcion ? (
              <p id={idDesc} className="texto-2">
                {descripcion}
              </p>
            ) : null}
          </div>
          <button type="button" className="boton boton--fantasma boton--icono" onClick={alCerrar} aria-label="Cerrar">
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="hoja-lateral__cuerpo">{abierta ? children : null}</div>
      </div>
    </dialog>
  );
}
