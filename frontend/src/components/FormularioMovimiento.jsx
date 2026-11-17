import { useState } from "react";
import { apartar, depositar, devolver, retirar, transferir } from "../services/recursos.service";
import { formatoPesos } from "../utils/formato";
import { AvisoError, Campo, CampoMonto } from "./Formulario";

const MAXIMO_TRANSACCION = 2000000; // Regla 5 del negocio (CHECK en BD)

const TEXTOS = {
  retiro: { boton: "Retirar", exito: "Retiro registrado." },
  transferencia: { boton: "Transferir", exito: "Transferencia registrada." },
  deposito: { boton: "Depositar", exito: "Depósito registrado." },
  apartar: { boton: "Apartar en el bolsillo", exito: "Dinero apartado." },
  devolver: { boton: "Devolver a la cuenta", exito: "Dinero devuelto a la cuenta." },
};

/**
 * Un solo formulario para los cinco movimientos. El backend valida
 * montos, propiedad de la cuenta y saldo disponible; aquí solo se guía.
 */
export function FormularioMovimiento({ tipo, cuenta, bolsillo, disponible, otrasCuentas = [], alTerminar }) {
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [destino, setDestino] = useState(otrasCuentas[0]?.id ? String(otrasCuentas[0].id) : "");
  const [destinoManual, setDestinoManual] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const tope =
    tipo === "devolver"
      ? Number(bolsillo?.saldo ?? 0)
      : tipo === "deposito"
        ? MAXIMO_TRANSACCION
        : Math.min(Number(disponible ?? 0), MAXIMO_TRANSACCION);

  const enviar = async (evento) => {
    evento.preventDefault();
    setEnviando(true);
    setError(null);

    const base = { monto: Number(monto) };
    if (descripcion.trim()) base.descripcion = descripcion.trim();

    try {
      if (tipo === "retiro") await retirar({ ...base, cuentaOrigenId: cuenta.id });
      if (tipo === "deposito") await depositar({ ...base, cuentaDestinoId: cuenta.id });
      if (tipo === "transferencia") {
        const cuentaDestinoId = Number(destino === "otra" ? destinoManual : destino);
        await transferir({ ...base, cuentaOrigenId: cuenta.id, cuentaDestinoId });
      }
      if (tipo === "apartar") await apartar(bolsillo.id, base);
      if (tipo === "devolver") await devolver(bolsillo.id, base);
      alTerminar(TEXTOS[tipo].exito);
    } catch (fallo) {
      setError(fallo);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="formulario" onSubmit={enviar} noValidate={false}>
      {tipo === "transferencia" ? (
        <>
          <Campo etiqueta="Cuenta destino">
            {(props) => (
              <select
                {...props}
                className="selector"
                value={destino}
                onChange={(evento) => setDestino(evento.target.value)}
              >
                {otrasCuentas.map((otra) => (
                  <option key={otra.id} value={otra.id}>
                    Mi cuenta {otra.numeroCuenta}
                  </option>
                ))}
                <option value="otra">Cuenta de otra persona (por ID)</option>
              </select>
            )}
          </Campo>
          {destino === "otra" || otrasCuentas.length === 0 ? (
            <Campo etiqueta="ID de la cuenta destino" ayuda="Pídale el número interno de cuenta al destinatario.">
              {(props) => (
                <input
                  {...props}
                  className="entrada num"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={destinoManual}
                  onChange={(evento) => {
                    setDestino("otra");
                    setDestinoManual(evento.target.value);
                  }}
                />
              )}
            </Campo>
          ) : null}
        </>
      ) : null}

      <CampoMonto
        valor={monto}
        alCambiar={setMonto}
        maximo={tope > 0 ? tope : undefined}
        ayuda={
          tipo === "deposito"
            ? `Máximo ${formatoPesos(MAXIMO_TRANSACCION)} por movimiento.`
            : `Puede mover hasta ${formatoPesos(Math.max(tope, 0))}.`
        }
      />

      <Campo etiqueta="Descripción (opcional)">
        {(props) => (
          <input
            {...props}
            className="entrada"
            maxLength={120}
            value={descripcion}
            onChange={(evento) => setDescripcion(evento.target.value)}
          />
        )}
      </Campo>

      <AvisoError error={error} />

      <div className="acciones">
        <button className="boton" type="submit" disabled={enviando || !monto}>
          {enviando ? "Enviando…" : TEXTOS[tipo].boton}
        </button>
      </div>
    </form>
  );
}
