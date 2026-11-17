import { Link } from "react-router-dom";

export function NoEncontradaPage() {
  return (
    <div className="estado-vista" style={{ marginTop: 24 }}>
      <strong>Esta página no existe.</strong>
      <p>Revise la dirección o vuelva al inicio.</p>
      <Link className="boton" to="/">
        Volver al inicio
      </Link>
    </div>
  );
}
