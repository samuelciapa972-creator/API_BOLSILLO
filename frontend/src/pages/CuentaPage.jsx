import { ArrowLeft } from "@phosphor-icons/react";
import { Link, useParams } from "react-router-dom";
import { PanelCuenta } from "../components/PanelCuenta";

export function CuentaPage() {
  const { id } = useParams();
  return (
    <PanelCuenta
      key={id}
      cuentaId={Number(id)}
      encabezado={
        <Link to="/cuentas" className="volver">
          <ArrowLeft size={16} aria-hidden="true" /> Cuentas
        </Link>
      }
    />
  );
}
