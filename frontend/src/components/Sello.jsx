// Estado de un recurso como sello de tinta: solo estados reales de la BD.
export function Sello({ estado, rol = false }) {
  if (!estado) return null;
  return <span className={`sello ${rol ? "sello--rol" : `sello--${estado}`}`}>{estado}</span>;
}
