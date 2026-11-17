const pesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const pesosConCentavos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// La API devuelve NUMERIC ya convertido a número (types.setTypeParser).
export const formatoPesos = (valor) => {
  const numero = Number(valor ?? 0);
  return Number.isInteger(numero) ? pesos.format(numero) : pesosConCentavos.format(numero);
};

const fechaCorta = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short" });
const fechaLarga = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatoFechaCorta = (valor) => (valor ? fechaCorta.format(new Date(valor)) : "");
export const formatoFechaLarga = (valor) => (valor ? fechaLarga.format(new Date(valor)) : "");

export const ETIQUETA_TIPO = {
  deposito: "Depósito",
  retiro: "Retiro",
  transferencia: "Transferencia",
  apartado: "Apartado a bolsillo",
  devolucion: "Devolución de bolsillo",
};

export const ETIQUETA_ROL = {
  administrador: "Administrador",
  cliente: "Cliente",
  auditor: "Auditor",
};

export const iniciales = (texto = "") =>
  texto
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join("") || "?";

/**
 * Signo de un movimiento visto desde una cuenta concreta.
 * Apartar no saca dinero de la cuenta (solo lo reserva), por eso se
 * muestra en cobre y sin signo de débito.
 */
export const sentidoMovimiento = (transaccion, cuentaId) => {
  const id = Number(cuentaId);
  switch (transaccion.tipo) {
    case "deposito":
      return "credito";
    case "retiro":
      return "debito";
    case "transferencia":
      return Number(transaccion.cuentaOrigenId) === id ? "debito" : "credito";
    case "apartado":
    case "devolucion":
      return "apartado";
    default:
      return "neutro";
  }
};
