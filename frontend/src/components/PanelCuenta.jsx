import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowsLeftRight,
  Coins,
  DotsThree,
  PencilSimple,
  PiggyBank,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useCarga } from "../hooks/useCarga";
import {
  actualizarBolsillo,
  bolsillosDeCuenta,
  cambiarEstadoCuenta,
  crearBolsillo,
  eliminarBolsillo,
  listarMisCuentas,
  obtenerCuenta,
  obtenerSaldo,
  transaccionesDeCuenta,
} from "../services/recursos.service";
import { sentidoMovimiento } from "../utils/formato";
import { BarraSaldo } from "./BarraSaldo";
import { CifraAnimada } from "./CifraAnimada";
import { ErrorVista, Vacio } from "./EstadoVista";
import { Extracto } from "./Extracto";
import { AvisoError, Campo } from "./Formulario";
import { FormularioMovimiento } from "./FormularioMovimiento";
import { Hoja } from "./Hoja";
import { Sello } from "./Sello";
import { Sobre } from "./Sobre";

const FILTROS = [
  { id: "todos", texto: "Todos" },
  { id: "credito", texto: "Entradas" },
  { id: "debito", texto: "Salidas" },
  { id: "apartado", texto: "Bolsillos" },
];
const POR_TANDA = 15;

export function PanelCuenta({ cuentaId, encabezado }) {
  const { usuario } = useAuth();
  const rol = usuario.rol;
  const puedeMover = rol === "cliente" || rol === "administrador";

  const carga = useCarga(async () => {
    const [cuenta, saldo, bolsillos, transacciones, propias] = await Promise.all([
      obtenerCuenta(cuentaId),
      obtenerSaldo(cuentaId),
      bolsillosDeCuenta(cuentaId),
      transaccionesDeCuenta(cuentaId),
      rol === "cliente" ? listarMisCuentas() : Promise.resolve([]),
    ]);
    return { cuenta, saldo, bolsillos, transacciones, propias };
  }, `${cuentaId}-${rol}`);

  const [accion, setAccion] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [visibles, setVisibles] = useState(POR_TANDA);

  const movimientos = useMemo(() => {
    const lista = carga.datos?.transacciones || [];
    return [...lista]
      .filter((t) => filtro === "todos" || sentidoMovimiento(t, cuentaId) === filtro)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [carga.datos, filtro, cuentaId]);

  const terminar = (titulo, detalle) => {
    setAccion(null);
    toast.success(titulo, detalle ? { description: detalle } : undefined);
    carga.recargar();
  };

  if (carga.cargando && !carga.datos) return <EsqueletoCuenta />;
  if (carga.error) return <ErrorVista error={carga.error} alReintentar={carga.recargar} />;

  const { cuenta, saldo, bolsillos, propias } = carga.datos;
  const activa = cuenta.estado === "activa";
  const bolsillosActivos = bolsillos.filter((b) => b.estado === "activo");
  const nombresBolsillo = Object.fromEntries(bolsillos.map((b) => [b.id, b.nombre]));
  const otrasCuentas = propias.filter((c) => c.id !== cuenta.id && c.estado === "activa");
  const lleno = bolsillosActivos.length >= 10;

  const TITULOS = {
    transferencia: ["Transferir", "Sale de lo disponible; lo apartado en bolsillos no se toca."],
    retiro: ["Retirar", "Solo puede retirar lo disponible."],
    deposito: ["Depositar", "Ingreso registrado por el administrador."],
    apartar: [accion?.bolsillo ? `Apartar en «${accion.bolsillo.nombre}»` : "Apartar en un bolsillo", "El dinero sigue en la cuenta pero deja de estar disponible."],
    devolver: [`Devolver desde «${accion?.bolsillo?.nombre}»`, "El dinero vuelve a estar disponible."],
    "nuevo-bolsillo": ["Nuevo bolsillo", "Aparte dinero para una meta sin sacarlo de la cuenta."],
    "editar-bolsillo": [`Editar «${accion?.bolsillo?.nombre}»`, null],
    "eliminar-bolsillo": [`Eliminar «${accion?.bolsillo?.nombre}»`, null],
    estado: ["Estado de la cuenta", "Una cuenta solo puede cerrarse con saldo cero."],
  };
  const [titulo, descripcion] = accion ? TITULOS[accion.tipo] : ["", null];

  return (
    <>
      {encabezado}

      <section className="tapa" aria-labelledby="titulo-saldo">
        <div className="tapa__cabeza">
          <div>
            <p className="tapa__cuenta">
              Cuenta <span className="num">{cuenta.numeroCuenta}</span> <Sello estado={cuenta.estado} />
            </p>
            <h1 id="titulo-saldo" className="solo-lector">
              Saldo de la cuenta {cuenta.numeroCuenta}
            </h1>
          </div>
          {rol !== "cliente" ? (
            <p className="tapa__meta num">
              ID #{cuenta.id} · titular #{cuenta.usuarioId}
            </p>
          ) : null}
        </div>

        <div className="tapa__saldo">
          <span className="tapa__rotulo">Saldo total</span>
          <CifraAnimada valor={saldo.saldoTotal} className="tapa__cifra" />
        </div>

        <BarraSaldo saldoTotal={saldo.saldoTotal} bolsillos={bolsillos} />

        {puedeMover ? (
          <div className="acciones-rapidas">
            <AccionRapida icono={ArrowsLeftRight} texto="Transferir" principal disabled={!activa} onClick={() => setAccion({ tipo: "transferencia" })} />
            <AccionRapida icono={ArrowUpRight} texto="Retirar" disabled={!activa} onClick={() => setAccion({ tipo: "retiro" })} />
            <AccionRapida
              icono={PiggyBank}
              texto="Apartar"
              disabled={!activa || bolsillosActivos.length === 0}
              title={bolsillosActivos.length === 0 ? "Primero cree un bolsillo" : undefined}
              onClick={() => setAccion({ tipo: "apartar" })}
            />
            {rol === "administrador" ? (
              <>
                <AccionRapida icono={ArrowDownLeft} texto="Depositar" disabled={!activa} onClick={() => setAccion({ tipo: "deposito" })} />
                <AccionRapida icono={DotsThree} texto="Estado" onClick={() => setAccion({ tipo: "estado" })} />
              </>
            ) : null}
          </div>
        ) : (
          <p className="tapa__nota">Vista de solo lectura para auditoría.</p>
        )}

        {!activa ? (
          <div className="aviso aviso--atencion" role="status">
            La cuenta está {cuenta.estado}: no admite movimientos de dinero.
          </div>
        ) : null}
      </section>

      <section className="bloque" aria-labelledby="titulo-bolsillos">
        <div className="bloque__titulo">
          <h2 id="titulo-bolsillos">
            Bolsillos <span className="texto-3 num">{bolsillosActivos.length} de 10</span>
          </h2>
        </div>
        <div className="sobres">
          {bolsillos.map((b) => (
            <Sobre
              key={b.id}
              bolsillo={b}
              acciones={
                puedeMover && b.estado === "activo" ? (
                  <>
                    <button type="button" className="boton boton--secundario boton--chico" disabled={!activa} onClick={() => setAccion({ tipo: "apartar", bolsillo: b })}>
                      <Plus size={14} weight="bold" aria-hidden="true" /> Apartar
                    </button>
                    <button
                      type="button"
                      className="boton boton--secundario boton--chico"
                      disabled={!activa || Number(b.saldo) <= 0}
                      onClick={() => setAccion({ tipo: "devolver", bolsillo: b })}
                    >
                      <Coins size={14} weight="bold" aria-hidden="true" /> Devolver
                    </button>
                    <span className="sobre__menu">
                      <button type="button" className="boton boton--fantasma boton--icono" aria-label={`Editar ${b.nombre}`} onClick={() => setAccion({ tipo: "editar-bolsillo", bolsillo: b })}>
                        <PencilSimple size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="boton boton--fantasma boton--icono"
                        aria-label={Number(b.saldo) > 0 ? `Para eliminar ${b.nombre}, primero devuelva su saldo` : `Eliminar ${b.nombre}`}
                        title={Number(b.saldo) > 0 ? "Devuelva el saldo antes de eliminar" : "Eliminar"}
                        disabled={Number(b.saldo) > 0}
                        onClick={() => setAccion({ tipo: "eliminar-bolsillo", bolsillo: b })}
                      >
                        <Trash size={16} aria-hidden="true" />
                      </button>
                    </span>
                  </>
                ) : null
              }
            />
          ))}
          {puedeMover ? (
            <button
              type="button"
              className="sobre sobre--nuevo"
              disabled={!activa || lleno}
              onClick={() => setAccion({ tipo: "nuevo-bolsillo" })}
            >
              <Plus size={22} aria-hidden="true" />
              <strong>{lleno ? "Límite de 10 bolsillos" : "Nuevo bolsillo"}</strong>
              <span className="texto-3">Para una meta: viaje, matrícula, moto…</span>
            </button>
          ) : bolsillos.length === 0 ? (
            <Vacio titulo="Esta cuenta no tiene bolsillos." />
          ) : null}
        </div>
      </section>

      <section className="bloque" aria-labelledby="titulo-extracto">
        <div className="bloque__titulo">
          <h2 id="titulo-extracto">Extracto</h2>
          <div className="chips" role="group" aria-label="Filtrar movimientos">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                type="button"
                className="chip"
                aria-pressed={filtro === f.id}
                onClick={() => {
                  setFiltro(f.id);
                  setVisibles(POR_TANDA);
                }}
              >
                {f.texto}
              </button>
            ))}
          </div>
        </div>
        {movimientos.length === 0 ? (
          <Vacio titulo={filtro === "todos" ? "La cuenta aún no tiene movimientos." : "No hay movimientos con este filtro."}>
            {filtro === "todos" && puedeMover ? "Cuando reciba, transfiera o aparte dinero, aparecerá aquí." : null}
          </Vacio>
        ) : (
          <div className="hoja">
            <Extracto transacciones={movimientos.slice(0, visibles)} cuentaId={cuenta.id} nombresBolsillo={nombresBolsillo} />
            {movimientos.length > visibles ? (
              <button type="button" className="boton boton--fantasma boton--ancho ver-mas" onClick={() => setVisibles((v) => v + POR_TANDA)}>
                Ver {Math.min(POR_TANDA, movimientos.length - visibles)} movimientos más
              </button>
            ) : (
              <p className="extracto__fin texto-3">{movimientos.length} movimientos en total</p>
            )}
          </div>
        )}
      </section>

      <Hoja abierta={Boolean(accion)} alCerrar={() => setAccion(null)} titulo={titulo} descripcion={descripcion}>
        {accion && ["retiro", "transferencia", "deposito", "apartar", "devolver"].includes(accion.tipo) ? (
          <FormularioMovimiento
            tipo={accion.tipo}
            cuenta={cuenta}
            bolsillo={accion.bolsillo}
            bolsillos={bolsillosActivos}
            disponible={saldo.saldoDisponible}
            otrasCuentas={otrasCuentas}
            alTerminar={terminar}
          />
        ) : null}
        {accion?.tipo === "nuevo-bolsillo" ? <FormularioBolsillo cuentaId={cuenta.id} alTerminar={terminar} /> : null}
        {accion?.tipo === "editar-bolsillo" ? <FormularioBolsillo bolsillo={accion.bolsillo} alTerminar={terminar} /> : null}
        {accion?.tipo === "eliminar-bolsillo" ? <EliminarBolsillo bolsillo={accion.bolsillo} alTerminar={terminar} /> : null}
        {accion?.tipo === "estado" ? <FormularioEstado cuenta={cuenta} alTerminar={terminar} /> : null}
      </Hoja>
    </>
  );
}

function AccionRapida({ icono: Icono, texto, principal = false, ...props }) {
  return (
    <button type="button" className={`accion-rapida${principal ? " accion-rapida--principal" : ""}`} {...props}>
      <span className="accion-rapida__icono" aria-hidden="true">
        <Icono size={20} weight="bold" />
      </span>
      <span>{texto}</span>
    </button>
  );
}

function EsqueletoCuenta() {
  return (
    <div className="esqueleto" role="status" aria-live="polite">
      <span className="solo-lector">Cargando la cuenta…</span>
      <div className="tapa esqueleto__tapa" aria-hidden="true">
        <span className="hueso" style={{ width: "30%" }} />
        <span className="hueso hueso--cifra" style={{ width: "45%" }} />
        <span className="hueso hueso--barra" />
        <div className="acciones-rapidas">
          <span className="hueso hueso--boton" />
          <span className="hueso hueso--boton" />
          <span className="hueso hueso--boton" />
        </div>
      </div>
      <div className="sobres" aria-hidden="true">
        <span className="hueso hueso--sobre" />
        <span className="hueso hueso--sobre" />
      </div>
    </div>
  );
}

function FormularioBolsillo({ cuentaId, bolsillo, alTerminar }) {
  const [nombre, setNombre] = useState(bolsillo?.nombre || "");
  const [meta, setMeta] = useState(bolsillo?.meta ? String(bolsillo.meta) : "");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (evento) => {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    const datos = { nombre: nombre.trim() };
    if (meta) datos.meta = Number(meta);
    try {
      if (bolsillo) await actualizarBolsillo(bolsillo.id, datos);
      else await crearBolsillo({ ...datos, cuentaId });
      alTerminar(bolsillo ? "Bolsillo actualizado" : "Bolsillo creado", datos.nombre);
    } catch (fallo) {
      setError(fallo);
      setEnviando(false);
    }
  };

  return (
    <form className="formulario" onSubmit={enviar}>
      <Campo etiqueta="Nombre" ayuda="Entre 3 y 40 caracteres.">
        {(props) => (
          <input {...props} className="entrada" required minLength={3} maxLength={40} autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} />
        )}
      </Campo>
      <Campo etiqueta="Meta en pesos (opcional)" ayuda="Con meta, el bolsillo muestra su avance.">
        {(props) => (
          <input {...props} className="entrada num" type="number" inputMode="numeric" min="1" step="1" value={meta} onChange={(e) => setMeta(e.target.value)} />
        )}
      </Campo>
      <AvisoError error={error} />
      <button className="boton boton--grande boton--ancho" type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : bolsillo ? "Guardar cambios" : "Crear bolsillo"}
      </button>
    </form>
  );
}

function EliminarBolsillo({ bolsillo, alTerminar }) {
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const confirmar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await eliminarBolsillo(bolsillo.id);
      alTerminar("Bolsillo eliminado", bolsillo.nombre);
    } catch (fallo) {
      setError(fallo);
      setEnviando(false);
    }
  };
  return (
    <div className="formulario">
      <p>El bolsillo no tiene saldo. Al eliminarlo desaparece de la cuenta; sus movimientos se conservan en el extracto.</p>
      <AvisoError error={error} />
      <button type="button" className="boton boton--peligro boton--grande boton--ancho" disabled={enviando} onClick={confirmar}>
        {enviando ? "Eliminando…" : "Eliminar bolsillo"}
      </button>
    </div>
  );
}

const ESTADOS = [
  { id: "activa", texto: "Activa", ayuda: "Admite todos los movimientos." },
  { id: "bloqueada", texto: "Bloqueada", ayuda: "Congela la cuenta; se puede reactivar." },
  { id: "cerrada", texto: "Cerrada", ayuda: "Definitivo. Requiere saldo cero." },
];

function FormularioEstado({ cuenta, alTerminar }) {
  const [estado, setEstado] = useState(cuenta.estado);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (evento) => {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await cambiarEstadoCuenta(cuenta.id, estado);
      alTerminar(`Cuenta ${estado}`, `Cuenta ${cuenta.numeroCuenta}`);
    } catch (fallo) {
      setError(fallo);
      setEnviando(false);
    }
  };

  return (
    <form className="formulario" onSubmit={enviar}>
      <fieldset className="opciones">
        <legend className="solo-lector">Nuevo estado</legend>
        {ESTADOS.map((op) => (
          <label key={op.id} className="opcion">
            <input type="radio" name="estado" value={op.id} checked={estado === op.id} onChange={() => setEstado(op.id)} />
            <span>
              <strong>{op.texto}</strong>
              <span className="texto-3">{op.ayuda}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <AvisoError error={error} />
      <button className="boton boton--grande boton--ancho" type="submit" disabled={enviando || estado === cuenta.estado}>
        {enviando ? "Guardando…" : "Guardar estado"}
      </button>
    </form>
  );
}
