import { useEffect, useId, useRef } from "react";

/**
 * Diálogo modal sobre <dialog> nativo: foco atrapado, Escape y retorno del
 * foco al disparador los resuelve el navegador.
 */
export function Dialogo({ abierto, alCerrar, titulo, children }) {
  const ref = useRef(null);
  const idTitulo = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      className="dialogo"
      aria-labelledby={idTitulo}
      onClose={alCerrar}
      onClick={(evento) => {
        // Clic en el fondo (fuera de la caja) cierra.
        if (evento.target === ref.current) alCerrar();
      }}
    >
      <div className="dialogo__cabeza">
        <h2 id={idTitulo}>{titulo}</h2>
        <button type="button" className="boton boton--fantasma" onClick={alCerrar}>
          Cerrar
        </button>
      </div>
      <div className="dialogo__cuerpo">{abierto ? children : null}</div>
    </dialog>
  );
}
