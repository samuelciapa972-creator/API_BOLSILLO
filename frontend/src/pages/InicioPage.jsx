import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCarga } from "../hooks/useCarga";
import {
  bolsillosDeCuenta,
  listarMisCuentas,
  listarTransacciones,
  obtenerResumen,
  transaccionesDeCuenta,
} from "../services/recursos.service";
import { BarraSaldo } from "../components/BarraSaldo";
import { Contenido, Vacio } from "../components/EstadoVista";
import { Extracto } from "../components/Extracto";
import { Sello } from "../components/Sello";
import { ETIQUETA_TIPO, formatoFechaLarga, formatoPesos } from "../utils/formato";

const primerNombre = (usuario) => (usuario.nombre || usuario.email).split(/\s|@/)[0];

export function InicioPage() {
  const { usuario } = useAuth();
  return usuario.rol === "cliente" ? <InicioCliente usuario={usuario} /> : <InicioGestion usuario={usuario} />;
}

// ---------------------------------------------------------------- Cliente
function InicioCliente({ usuario }) {
  const carga = useCarga(async () => {
    const cuentas = await listarMisCuentas();
    const detalle = await Promise.all(
      cuentas.map(async (cuenta) => {
        const [bolsillos, transacciones] = await Promise.all([
          bolsillosDeCuenta(cuenta.id),
          transaccionesDeCuenta(cuenta.id),
        ]);
        return { cuenta, bolsillos, transacciones };
      })
    );
    return detalle;
  });

  return (
    <>
      <div className="encabezado-pagina">
        <div>
          <h1>Hola, {primerNombre(usuario)}</h1>
          <p>Así va tu dinero hoy.</p>
        </div>
      </div>

      <Contenido
        carga={carga}
        vacio={
          <Vacio titulo="Aún no tienes cuentas.">
            Un administrador de Bolsillo abre la cuenta cuando tu ficha de titular está vinculada a este acceso.
          </Vacio>
        }
      >
        {(detalle) => {
          const total = detalle.reduce((suma, d) => suma + Number(d.cuenta.saldoTotal), 0);
          const recientes = detalle
            .flatMap((d) => d.transacciones.map((t) => ({ ...t, _cuenta: d.cuenta.id })))
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, 6);
          const nombresBolsillo = Object.fromEntries(
            detalle.flatMap((d) => d.bolsillos.map((b) => [b.id, b.nombre]))
          );

          return (
            <>
              {detalle.length > 1 ? (
                <p className="texto-2" style={{ marginBottom: 16 }}>
                  Total en {detalle.length} cuentas:{" "}
                  <strong className="num">{formatoPesos(total)}</strong>
                </p>
              ) : null}

              <div className="lista-cuentas">
                {detalle.map(({ cuenta, bolsillos }) => (
                  <Link key={cuenta.id} to={`/cuentas/${cuenta.id}`} className="hoja ficha-cuenta">
                    <div>
                      <span className="ficha-cuenta__numero">
                        Cuenta {cuenta.numeroCuenta} <Sello estado={cuenta.estado} />
                      </span>
                      <p className="ficha-cuenta__saldo cifra">{formatoPesos(cuenta.saldoTotal)}</p>
                      <span className="texto-3">saldo total · ver detalle</span>
                    </div>
                    <BarraSaldo saldoTotal={cuenta.saldoTotal} bolsillos={bolsillos} />
                  </Link>
                ))}
              </div>

              <section className="bloque" aria-labelledby="titulo-recientes">
                <div className="bloque__titulo">
                  <h2 id="titulo-recientes">Últimos movimientos</h2>
                </div>
                <div className="hoja hoja--compacta">
                  {recientes.length === 0 ? (
                    <p className="texto-2">Todavía no hay movimientos en tus cuentas.</p>
                  ) : (
                    <Extracto transacciones={recientes} nombresBolsillo={nombresBolsillo} />
                  )}
                </div>
              </section>
            </>
          );
        }}
      </Contenido>
    </>
  );
}

// ---------------------------------------------------- Administrador / auditor
function InicioGestion({ usuario }) {
  const resumen = useCarga(() => obtenerResumen());
  const recientes = useCarga(async () => {
    const todas = await listarTransacciones();
    return [...todas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 8);
  });

  return (
    <>
      <div className="encabezado-pagina">
        <div>
          <h1>Resumen de Bolsillo</h1>
          <p>
            {usuario.rol === "auditor"
              ? "Vista de solo lectura para auditoría."
              : "Estado del dinero custodiado y de las cuentas."}
          </p>
        </div>
        {usuario.rol === "administrador" ? (
          <div className="acciones">
            <Link className="boton" to="/cuentas">
              Abrir una cuenta
            </Link>
            <Link className="boton boton--secundario" to="/titulares">
              Registrar titular
            </Link>
          </div>
        ) : null}
      </div>

      <Contenido carga={resumen} esVacio={() => false}>
        {(datos) => (
          <div className="resumen">
            <section className="hoja resumen__foco" aria-labelledby="titulo-custodia">
              <div>
                <h2 id="titulo-custodia" className="texto-2" style={{ fontWeight: 500 }}>
                  Dinero custodiado en cuentas
                </h2>
                <p className="resumen__cifra cifra" style={{ marginTop: 8 }}>
                  {formatoPesos(datos.cuentas.saldoCustodiado)}
                </p>
              </div>
              <BarraSaldo
                saldoTotal={datos.cuentas.saldoCustodiado}
                bolsillos={[
                  { id: "todos", nombre: "Bolsillos", estado: "activo", saldo: datos.bolsillos.saldoApartado },
                ]}
                cantidadBolsillos={datos.bolsillos.activos}
              />
              <p className="texto-3" style={{ fontSize: "0.8125rem" }}>
                Calculado el {formatoFechaLarga(datos.generadoEn)}
              </p>
            </section>

            <section className="hoja" aria-labelledby="titulo-cuentas">
              <h2 id="titulo-cuentas">Cuentas y titulares</h2>
              <dl className="datos-cortos" style={{ marginTop: 8 }}>
                <div>
                  <dt>Titulares activos</dt>
                  <dd className="num">
                    {datos.usuarios.activos} de {datos.usuarios.total}
                  </dd>
                </div>
                <div>
                  <dt>Cuentas activas</dt>
                  <dd className="num">{datos.cuentas.activas}</dd>
                </div>
                <div>
                  <dt>Cuentas bloqueadas</dt>
                  <dd className="num">{datos.cuentas.bloqueadas}</dd>
                </div>
                <div>
                  <dt>Cuentas cerradas</dt>
                  <dd className="num">{datos.cuentas.cerradas}</dd>
                </div>
                <div>
                  <dt>Movimientos (últimos 30 días)</dt>
                  <dd className="num">{datos.transaccionesUltimos30Dias}</dd>
                </div>
              </dl>
            </section>
          </div>
        )}
      </Contenido>

      <div className="dos-columnas bloque">
        <section aria-labelledby="titulo-tipos">
          <div className="bloque__titulo">
            <h2 id="titulo-tipos">Movimientos exitosos por tipo</h2>
          </div>
          <Contenido carga={resumen} esVacio={(d) => d.transaccionesPorTipo.length === 0} vacio={<Vacio titulo="Sin movimientos registrados." />}>
            {(datos) => (
              <div className="hoja hoja--compacta">
                <dl className="datos-cortos">
                  {datos.transaccionesPorTipo.map((fila) => (
                    <div key={fila.tipo}>
                      <dt>
                        {ETIQUETA_TIPO[fila.tipo] || fila.tipo}{" "}
                        <span className="texto-3 num">({fila.cantidad})</span>
                      </dt>
                      <dd className="num">{formatoPesos(fila.monto)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </Contenido>
        </section>

        <section aria-labelledby="titulo-ultimos">
          <div className="bloque__titulo">
            <h2 id="titulo-ultimos">Últimos movimientos</h2>
            <Link to="/movimientos">Ver todos</Link>
          </div>
          <Contenido carga={recientes} vacio={<Vacio titulo="Sin movimientos registrados." />}>
            {(lista) => (
              <div className="hoja hoja--compacta">
                <Extracto transacciones={lista} />
              </div>
            )}
          </Contenido>
        </section>
      </div>
    </>
  );
}
