import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { formatoPesos } from "../utils/formato";

/**
 * Cifra en pesos que, cuando cambia (tras un movimiento), recorre el valor
 * anterior al nuevo. En el primer pintado no anima: el saldo no "cuenta"
 * cada vez que se abre la página. Propósito: indicar el cambio de estado.
 */
export function CifraAnimada({ valor, className = "" }) {
  const nodo = useRef(null);
  const previo = useRef(null);
  const reducir = useReducedMotion();

  useEffect(() => {
    const destino = Number(valor) || 0;
    const desde = previo.current;
    previo.current = destino;
    if (!nodo.current) return undefined;
    if (desde === null || desde === destino || reducir) {
      nodo.current.textContent = formatoPesos(destino);
      return undefined;
    }
    const control = animate(desde, destino, {
      duration: 0.6,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => {
        if (nodo.current) nodo.current.textContent = formatoPesos(Math.round(v));
      },
      onComplete: () => {
        if (nodo.current) nodo.current.textContent = formatoPesos(destino);
      },
    });
    return () => control.stop();
  }, [valor, reducir]);

  return (
    <span ref={nodo} className={`cifra ${className}`}>
      {formatoPesos(valor)}
    </span>
  );
}
