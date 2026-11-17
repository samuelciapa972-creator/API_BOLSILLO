import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
import { BarraSaldo } from "../components/BarraSaldo";
import { Dialogo } from "../components/Dialogo";
import { ErrorVista, Cargando, Vacio } from "../components/EstadoVista";
import { Extracto } from "../components/Extracto";
import { AvisoError, AvisoExito, Campo } from "../components/Formulario";
import { FormularioMovimiento } from "../components/FormularioMovimiento";
import { Paginacion } from "../components/Paginacion";
import { usePaginacion } from "../hooks/usePaginacion";
import { Sello } from "../components/Sello";
import { ETIQUETA_TIPO, formatoPesos } from "../utils/formato";

export function CuentaPage() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const rol = usuario.rol;
  const puedeMover = rol === "cliente" || rol === "administrador";

  const carga = useCarga(async () => {
    const [cuenta, saldo, bolsillos, transacciones, propias] = await Promise.all([
      obtenerCuenta(id),
      obtenerSaldo(id),
      bolsillosDeCuenta(id),
      transaccionesDeCuenta(id),
      rol === "cliente" ? listarMisCuentas() : Promise.resolve([]),
    ]);
    return { cuenta, saldo, bolsillos, transacciones, propias };
  }, `${id}-${rol}`);

  const [accion, setAccion] = useState(null); // { tipo, bolsillo? }
  const [exito, setExito] = useState(null);
  const [tipoFiltro, setTipoFiltro] = useState("todos");

  const terminar = (mensaje) => {
    setAccion(null);
    setExito(mensaje);
    carga.recargar();
  };

  const movimientos = useMemo(() => {
    const lista = carga.datos?.transacciones || [];
    return [...lista]
      .filter((t) => tipoFiltro === "todos" || t.tipo === tipoFiltro)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [carga.datos, tipoFiltro]);
  const paginacion = usePaginacion(movimientos, 12);

  if (carga.cargando && !carga.datos) return <Cargando etiqueta="Cargando la cuenta" />;
  if (carga.error) {
    return (
      <>
        <p style={{ marginBottom: 16 }}>
          <Link to="/cuentas">Volver a cuentas</Link>
        </p>
        <ErrorVista error={carga.error} alReintentar={carga.recargar} />
      </>
    );
  }

  const { cuenta, saldo, bolsillos, propias } = carga.datos;
  const activa = cuenta.estado === "activa";
  const bolsillosActivos = bolsillos.filter((b) => b.estado === "activo");
  const nombresBolsillo = Object.fromEntries(bolsillos.map((b) => [b.id, b.nombre]));
  const otrasCuentas = propias.filter((c) => c.id !== cuenta.id && c.estado === "activa");

  const TITULOS = {
    retiro: "Retirar dinero",
    transferencia: "Transferir dinero",
    deposito: "Depositar en la cuenta",
    apartar: `Apartar en «${accion?.bolsillo?.nombre}»`,
    devolver: `Devolver desde «${accion?.bolsillo?.nombre}»`,
    "nuevo-bolsillo": "Nuevo bolsillo",
    "editar-bolsillo": `Editar «${accion?.bolsillo?.nombre}»`,
    "eliminar-bolsillo": `Eliminar «${accion?.bolsillo?.nombre}»`,
    estado: "Cambiar estado de la cuenta",
  };

  return (
    <>
      <p style={{ marginBottom: 16 }}>
        <Link to="/cuentas">Volver a cuentas</Link>
      </p>

      <section className="hoja saldo-cuenta" aria-labelledby="titulo-cuenta">
        <div className="encabezado-pagina" style={{ marginBottom: 0 }}>
          <div>
            <h1 id="titulo-cuenta" style={{ fontSize: "1.25rem", fontFamily: "var(--fuente-ui)" }}>
              Cuenta {cuenta.numeroCuenta} <Sello estado={cuenta.estado} />
            </h1>
            <p className="texto-3 num">
              ID #{cuenta.id} · titular #{cuenta.usuarioId} · {cuenta.moneda}
            </p>
          </div>
          <div className="acciones">
            {puedeMover ? (
              <>
                <button className="boton" type="button" disabled={!activa} onClick={() => setAccion({ tipo: "transferencia" })}>
                  Transferir
                </button>
                <button className="boton boton--secundario" type="button" disabled={!activa} onClick={() => setAccion({ tipo: "retiro" })}>
                  Retirar
                </button>
              </>
            ) : null}
            {rol === "administrador" ? (
              <>
                <button className="boton boton--secundario" type="button" disabled={!activa} onClick={() => setAccion({ tipo: "deposito" })}>
                  Depositar
                </button>
                <button className="boton boton--fantasma" type="button" onClick={() => setAccion({ tipo: "estado" })}>
                  Cambiar estado
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div>
          <p className="saldo-cuenta__total cifra">{formatoPesos(saldo.saldoTotal)}</p>
          <p className="texto-3" style={{ marginTop: 6 }}>
            saldo total
          </p>
        </div>
        <BarraSaldo saldoTotal={saldo.saldoTotal} bolsillos={bolsillos} />
        {!activa ? (
          <div className="aviso aviso--atencion">
            La cuenta está {cuenta.estado}: no admite movimientos de dinero.
          </div>
        ) : null}
      </section>

      {exito ? (
        <div style={{ marginTop: 16 }}>
          <AvisoExito>{exito}</AvisoExito>
        </div>
      ) : null}

      <section className="bloque" aria-labelledby="titulo-bolsillos">
        <div className="bloque__titulo">
          <h2 id="titulo-bolsillos">
            Bolsillos <span className="texto-3 num">({bolsillosActivos.length} de 10)</span>
          </h2>
          {puedeMover ? (
            <button
              type="button"
              className="boton boton--secundario"
              disabled={!activa || bolsillosActivos.length >= 10}
              onClick={() => setAccion({ tipo: "nuevo-bolsillo" })}
            >
              Nuevo bolsillo
            </button>
          ) : null}
        </div>

        {bolsillos.length === 0 ? (
          <Vacio titulo="Esta cuenta no tiene bolsillos.">
            Un bolsillo aparta dinero para una meta sin sacarlo de la cuenta.
          </Vacio>
        ) : (
          <div className="bolsillos">
            {bolsillos.map((b) => {
              const avance = b.meta ? Math.min((Number(b.saldo) / Number(b.meta)) * 100, 100) : null;
              return (
                <article key={b.id} className="bolsillo">
                  <div className="bolsillo__cabeza">
                    <h3>{b.nombre}</h3>
                    {b.estado !== "activo" ? <Sello estado={b.estado} /> : null}
                  </div>
                  <p className="bolsillo__saldo cifra">{formatoPesos(b.saldo)}</p>
                  {avance !== null ? (
                    <>
                      <div className="meta" role="img" aria-label={`Meta ${formatoPesos(b.meta)}, avance ${Math.round(avance)}%`}>
                        <span style={{ width: `${avance}%` }} />
                      </div>
                      <span className="texto-3 num" style={{ fontSize: "0.8125rem" }}>
                        {Math.round(avance)}% de {formatoPesos(b.meta)}
                      </span>
                    </>
                  ) : (
                    <span className="texto-3" style={{ fontSize: "0.8125rem" }}>
                      Sin meta definida
                    </span>
                  )}
                  {puedeMover && b.estado === "activo" ? (
                    <div className="rejilla-acciones">
                      <button type="button" className="boton boton--secundario" disabled={!activa} onClick={() => setAccion({ tipo: "apartar", bolsillo: b })}>
                        Apartar
                      </button>
                      <button
                        type="button"
                        className="boton boton--secundario"
                        disabled={!activa || Number(b.saldo) <= 0}
                        onClick={() => setAccion({ tipo: "devolver", bolsillo: b })}
                      >
                        Devolver
                      </button>
                      <button type="button" className="boton boton--fantasma" onClick={() => setAccion({ tipo: "editar-bolsillo", bolsillo: b })}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="boton boton--fantasma"
                        disabled={Number(b.saldo) > 0}
                        title={Number(b.saldo) > 0 ? "Devuelva el saldo antes de eliminar" : undefined}
                        onClick={() => setAccion({ tipo: "eliminar-bolsillo", bolsillo: b })}
                      >
                        Eliminar
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="bloque" aria-labelledby="titulo-extracto">
        <div className="bloque__titulo">
          <h2 id="titulo-extracto">Extracto</h2>
        </div>
        <div className="filtros">
          <Campo etiqueta="Tipo de movimiento">
            {(props) => (
              <select {...props} className="selector" value={tipoFiltro} onChange={(evento) => setTipoFiltro(evento.target.value)}>
                <option value="todos">Todos</option>
                {Object.entries(ETIQUETA_TIPO).map(([valor, texto]) => (
                  <option key={valor} value={valor}>
                    {texto}
                  </option>
                ))}
              </select>
            )}
          </Campo>
        </div>
        {movimientos.length === 0 ? (
          <Vacio titulo={tipoFiltro === "todos" ? "La cuenta no tiene movimientos." : "No hay movimientos de ese tipo."} />
        ) : (
          <>
            <div className="hoja hoja--compacta">
              <Extracto transacciones={paginacion.pagina} cuentaId={cuenta.id} nombresBolsillo={nombresBolsillo} />
            </div>
            <Paginacion {...paginacion} />
          </>
        )}
      </section>

      <Dialogo abierto={Boolean(accion)} alCerrar={() => setAccion(null)} titulo={accion ? TITULOS[accion.tipo] : ""}>
        {accion && ["retiro", "transferencia", "deposito", "apartar", "devolver"].includes(accion.tipo) ? (
          <FormularioMovimiento
            tipo={accion.tipo}
            cuenta={cuenta}
            bolsillo={accion.bolsillo}
            disponible={saldo.saldoDisponible}
            otrasCuentas={otrasCuentas}
            alTerminar={terminar}
          />
        ) : null}
        {accion?.tipo === "nuevo-bolsillo" ? <FormularioBolsillo cuentaId={cuenta.id} alTerminar={terminar} /> : null}
        {accion?.tipo === "editar-bolsillo" ? <FormularioBolsillo bolsillo={accion.bolsillo} alTerminar={terminar} /> : null}
        {accion?.tipo === "eliminar-bolsillo" ? <EliminarBolsillo bolsillo={accion.bolsillo} alTerminar={terminar} /> : null}
        {accion?.tipo === "estado" ? <FormularioEstado cuenta={cuenta} alTerminar={terminar} /> : null}
      </Dialogo>
    </>
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
      alTerminar(bolsillo ? "Bolsillo actualizado." : "Bolsillo creado.");
    } catch (fallo) {
      setError(fallo);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="formulario" onSubmit={enviar}>
      <Campo etiqueta="Nombre" ayuda="Entre 3 y 40 caracteres. Por ejemplo: Viaje, Matrícula, Moto.">
        {(props) => (
          <input
            {...props}
            className="entrada"
            required
            minLength={3}
            maxLength={40}
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
          />
        )}
      </Campo>
      <Campo etiqueta="Meta en pesos (opcional)">
        {(props) => (
          <input
            {...props}
            className="entrada num"
            type="number"
            min="1"
            step="1"
            value={meta}
            onChange={(evento) => setMeta(evento.target.value)}
          />
        )}
      </Campo>
      <AvisoError error={error} />
      <div className="acciones">
        <button className="boton" type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : bolsillo ? "Guardar cambios" : "Crear bolsillo"}
        </button>
      </div>
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
      alTerminar("Bolsillo eliminado.");
    } catch (fallo) {
      setError(fallo);
    } finally {
      setEnviando(false);
    }
  };
  return (
    <div className="formulario">
      <p>El bolsillo no tiene saldo. Al eliminarlo desaparece de la cuenta; sus movimientos quedan en el extracto.</p>
      <AvisoError error={error} />
      <div className="acciones">
        <button type="button" className="boton boton--peligro" disabled={enviando} onClick={confirmar}>
          {enviando ? "Eliminando…" : "Eliminar bolsillo"}
        </button>
      </div>
    </div>
  );
}

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
      alTerminar(`La cuenta quedó ${estado}.`);
    } catch (fallo) {
      setError(fallo);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="formulario" onSubmit={enviar}>
      <Campo etiqueta="Nuevo estado" ayuda="Una cuenta solo puede cerrarse con saldo cero.">
        {(props) => (
          <select {...props} className="selector" value={estado} onChange={(evento) => setEstado(evento.target.value)}>
            <option value="activa">Activa</option>
            <option value="bloqueada">Bloqueada</option>
            <option value="cerrada">Cerrada</option>
          </select>
        )}
      </Campo>
      <AvisoError error={error} />
      <div className="acciones">
        <button className="boton" type="submit" disabled={enviando || estado === cuenta.estado}>
          {enviando ? "Guardando…" : "Guardar estado"}
        </button>
      </div>
    </form>
  );
}
