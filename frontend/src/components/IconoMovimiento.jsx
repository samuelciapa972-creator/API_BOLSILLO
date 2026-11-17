import { ArrowDownLeft, ArrowUpRight, ArrowsLeftRight, Coins, PiggyBank } from "@phosphor-icons/react";

// Un ícono por tipo de movimiento: se reconoce sin leer.
const ICONOS = {
  deposito: ArrowDownLeft,
  retiro: ArrowUpRight,
  transferencia: ArrowsLeftRight,
  apartado: PiggyBank,
  devolucion: Coins,
};

export function IconoMovimiento({ tipo, sentido = "neutro" }) {
  const Icono = ICONOS[tipo] || ArrowsLeftRight;
  return (
    <span className={`icono-mov icono-mov--${sentido}`} aria-hidden="true">
      <Icono size={18} weight="bold" />
    </span>
  );
}
