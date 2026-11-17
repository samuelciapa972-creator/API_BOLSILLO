import { Toaster } from "sonner";
import { useTema } from "../hooks/useTema";
import { temaParaToaster } from "../utils/tema";

// Un solo Toaster en la raíz. Abajo al centro en móvil, abajo a la derecha en PC.
export function Notificaciones() {
  const tema = useTema();
  return (
    <Toaster
      theme={temaParaToaster(tema)}
      position="bottom-right"
      offset={24}
      mobileOffset={{ bottom: 88, left: 16, right: 16 }}
      toastOptions={{ className: "toast-bolsillo" }}
      closeButton={false}
      duration={3500}
    />
  );
}
