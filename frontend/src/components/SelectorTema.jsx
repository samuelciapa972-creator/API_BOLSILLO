import { Desktop, Moon, Sun } from "@phosphor-icons/react";
import { useTema } from "../hooks/useTema";
import { rotarTema } from "../utils/tema";

const TEXTO = { sistema: "Tema del sistema", claro: "Tema claro", oscuro: "Tema oscuro" };
const ICONO = { sistema: Desktop, claro: Sun, oscuro: Moon };

export function SelectorTema({ conTexto = false }) {
  const tema = useTema();
  const Icono = ICONO[tema] || Desktop;
  return (
    <button
      type="button"
      className={`boton boton--fantasma ${conTexto ? "" : "boton--icono"}`}
      onClick={rotarTema}
      aria-label={`${TEXTO[tema]}. Cambiar tema`}
      title={`${TEXTO[tema]} (clic para cambiar)`}
    >
      <Icono size={18} weight="regular" aria-hidden="true" />
      {conTexto ? <span>{TEXTO[tema]}</span> : null}
    </button>
  );
}
