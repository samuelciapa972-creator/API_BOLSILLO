import { useId, useState } from "react";
import { apartar, depositar, devolver, retirar, transferir } from "../services/recursos.service";
import { formatoPesos } from "../utils/formato";
import { AvisoError, Campo } from "./Formulario";

const MAXIMO_TRANSACCION = 2000000; // Regla 5 del negocio (CHECK en BD)

const TEXTOS = {
  retiro: { boton: "Retirar", exito: "Retiro registrado" },
  transferencia: { boton: "Transferir", exito: "Transferencia registrada" },
  deposito: { boton: "Depositar", exito: "Depósito registrado" },
  apartar: { boton: "Apartar", exito: "Dinero apartado" },
  devolver: { boton: "Devolver a la cuenta", exito: "Dinero devuelto a la cuenta" },
};

const RAPIDOS = [20000, 50000, 100000, 200000];

/**
 * Un solo formulario para los cinco movimientos. El backend valida montos,
 * propiedad y saldo disponible; aquí se guía y se muestra el efecto antes de
 * confirmar.
 */
export function FormularioMovimiento({
  tipo,
  cuenta,
  bolsillo: bolsilloInicial,
  bolsillos = [],
  disponible,
  otrasCuentas = [],
  alTerminar,
}) {
  const idMonto = useId();
  const idAyudaMonto = useId();
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [bolsilloId, setBolsilloId] = useState(bolsilloInicial ? String(bolsilloInicial.id) : bolsillos[0] ? String(bolsillos[0].id) : "");
  const [destino, setDestino] = useState(otrasCuentas[0]?.id ? String(otrasCuentas[0].id) : "otra");
  const [destinoManual, setDestinoManual] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const bolsillo = bolsilloInicial || bolsillos.find((b) => String(b.id) === bolsilloId);
  const libre = Number(disponible ?? 0);
  const tope =
    tipo === "devolver"
      ? Number(bolsillo?.saldo ?? 0)
      : tipo === "deposito"
        ? MAXIMO_TRANSACCION
        : Math.min(libre, MAXIMO_TRANSACCION);

  const valor = Number(monto);
  const valido = Number.isFinite(valor) && valor > 0 && valor <= tope;
  const excedido = Number.isFinite(valor) && valor > tope;

  // Efecto sobre el disponible: apartar, retirar y transferir lo reducen.
  const despues =
    tipo === "deposito" || tipo === "devolver" ? libre + (valor || 0) : libre - (valor || 0);

  const enviar = async (evento) => {
    evento.preventDefault();
    if (!valido) return;
    setEnviando(true);
    setError(null);
    const base = { monto: valor };
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
      alTerminar(TEXTOS[tipo].exito, `${formatoPesos(valor)}${bolsillo ? ` · ${bolsillo.nombre}` : ""}`);
    } catch (fallo) {
      setError(fallo);
      setEnviando(false);
    }
  };

  const rapidos = RAPIDOS.filter((r) => r <= tope);

  return (
    <form className="formulario" onSubmit={enviar}>
      {tipo === "apartar" && !bolsilloInicial ? (
        <Campo etiqueta="Bolsillo">
          {(props) => (
            <select {...props} className="selector" value={bolsilloId} onChange={(e) => setBolsilloId(e.target.value)} required>
              {bolsillos.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre} · {formatoPesos(b.saldo)}
                </option>
              ))}
            </select>
          )}
        </Campo>
      ) : null}

      {tipo === "transferencia" ? (
        <>
          <Campo etiqueta="Para">
            {(props) => (
              <select {...props} className="selector" value={destino} onChange={(e) => setDestino(e.target.value)}>
                {otrasCuentas.map((otra) => (
                  <option key={otra.id} value={otra.id}>
                    Mi cuenta {otra.numeroCuenta}
                  </option>
                ))}
                <option value="otra">Otra cuenta (por ID)</option>
              </select>
            )}
          </Campo>
          {destino === "otra" ? (
            <Campo etiqueta="ID de la cuenta destino" ayuda="Pídale el número interno de cuenta al destinatario.">
              {(props) => (
                <input
                  {...props}
                  className="entrada num"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  required
                  value={destinoManual}
                  onChange={(e) => setDestinoManual(e.target.value)}
                />
              )}
            </Campo>
          ) : null}
        </>
      ) : null}

      <div className="monto">
        <label htmlFor={idMonto} className="monto__etiqueta">
          ¿Cuánto?
        </label>
        <div className="monto__caja">
          <span aria-hidden="true">$</span>
          <input
            id={idMonto}
            className="monto__entrada cifra"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            placeholder="0"
            required
            autoFocus
            aria-describedby={idAyudaMonto}
            aria-invalid={excedido ? "true" : undefined}
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
        </div>
        <p id={idAyudaMonto} className={`monto__ayuda ${excedido ? "debito" : "texto-3"}`}>
          {excedido
            ? `Máximo ${formatoPesos(tope)} para esta operación.`
            : tipo === "deposito"
              ? `Hasta ${formatoPesos(MAXIMO_TRANSACCION)} por movimiento.`
              : tipo === "devolver"
                ? `El bolsillo tiene ${formatoPesos(tope)}.`
                : `Disponible: ${formatoPesos(libre)}.`}
        </p>
        {rapidos.length || tipo !== "deposito" ? (
          <div className="chips" role="group" aria-label="Montos rápidos">
            {rapidos.map((r) => (
              <button key={r} type="button" className="chip" onClick={() => setMonto(String(r))} aria-pressed={valor === r}>
                {formatoPesos(r)}
              </button>
            ))}
            {tipo !== "deposito" && tope > 0 ? (
              <button type="button" className="chip" onClick={() => setMonto(String(Math.floor(tope)))} aria-pressed={valor === Math.floor(tope)}>
                Todo
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <Campo etiqueta="Descripción (opcional)">
        {(props) => (
          <input {...props} className="entrada" maxLength={120} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        )}
      </Campo>

      {valido && tipo !== "deposito" ? (
        <dl className="resumen-mov" aria-live="polite">
          <div>
            <dt>Disponible después</dt>
            <dd className="num">{formatoPesos(Math.max(despues, 0))}</dd>
          </div>
          {bolsillo && (tipo === "apartar" || tipo === "devolver") ? (
            <div>
              <dt>«{bolsillo.nombre}» quedará con</dt>
              <dd className="num apartado">
                {formatoPesos(Number(bolsillo.saldo) + (tipo === "apartar" ? valor : -valor))}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <AvisoError error={error} />

      <button className="boton boton--grande boton--ancho" type="submit" disabled={enviando || !valido}>
        {enviando ? "Procesando…" : valido ? `${TEXTOS[tipo].boton} ${formatoPesos(valor)}` : TEXTOS[tipo].boton}
      </button>
    </form>
  );
}
