import { IdentificationCard, Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCarga } from "../hooks/useCarga";
import { listarMisCuentas, listarTransacciones, obtenerResumen } from "../services/recursos.service";
import { BarraSaldo } from "../components/BarraSaldo";
import { CifraAnimada } from "../components/CifraAnimada";
import { Cargando, Contenido, Vacio } from "../components/EstadoVista";
import { Extracto } from "../components/Extracto";
import { GraficoTipos } from "../components/GraficoTipos";
import { PanelCuenta } from "../components/PanelCuenta";
import { formatoFechaLarga } from "../utils/formato";

const primerNombre = (usuario) => (usuario.nombre || usuario.email).split(/\s|@/)[0];
const fechaHoy = () =>
  new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
const saludo = () => {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
};

export function InicioPage() {
  const { usuario } = useAuth();
  return usuario.rol === "cliente" ? <InicioCliente usuario={usuario} /> : <InicioGestion usuario={usuario} />;
}

// ---------------------------------------------------------------- Cliente
function InicioCliente({ usuario }) {
  const cuentas = useCarga(() => listarMisCuentas(), "mis-cuentas");
  const [elegida, setElegida] = useState(null);

  const encabezado = (lista) => (
    <header className="saludo">
      <p className="saludo__fecha">{fechaHoy()}</p>
      <h1>
        {saludo()}, {primerNombre(usuario)}
      </h1>
      {lista.length > 1 ? (
        <div className="segmentos" role="tablist" aria-label="Elegir cuenta">
          {lista.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={(elegida ?? lista[0].id) === c.id}
              onClick={() => setElegida(c.id)}
            >
              Cuenta ···{c.numeroCuenta.slice(-4)}
            </button>
          ))}
        </div>
      ) : null}
    </header>
  );

  if (cuentas.cargando && !cuentas.datos) return <Cargando etiqueta="Cargando tus cuentas" />;

  return (
    <Contenido
      carga={cuentas}
      vacio={
        <>
          {encabezado([])}
          <Vacio titulo="Aún no tienes cuentas.">
            Un administrador de Bolsillo abre la cuenta cuando tu ficha de titular está vinculada a este acceso.
          </Vacio>
        </>
      }
    >
      {(lista) => {
        const id = elegida ?? lista[0].id;
        return <PanelCuenta key={id} cuentaId={id} encabezado={encabezado(lista)} />;
      }}
    </Contenido>
  );
}

// ---------------------------------------------------- Administrador / auditor
function InicioGestion({ usuario }) {
  const resumen = useCarga(() => obtenerResumen(), "resumen");
  const recientes = useCarga(async () => {
    const todas = await listarTransacciones();
    return [...todas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 8);
  }, "recientes");

  return (
    <>
      <header className="saludo">
        <p className="saludo__fecha">{fechaHoy()}</p>
        <h1>
          {saludo()}, {primerNombre(usuario)}
        </h1>
        <p className="texto-2">
          {usuario.rol === "auditor" ? "Vista de solo lectura para auditoría." : "Así está el dinero que custodia Bolsillo."}
        </p>
      </header>

      <Contenido carga={resumen} esVacio={() => false}>
        {(datos) => (
          <div className="resumen">
            <section className="tapa resumen__foco" aria-labelledby="titulo-custodia">
              <div className="tapa__saldo">
                <h2 id="titulo-custodia" className="tapa__rotulo">
                  Dinero custodiado
                </h2>
                <CifraAnimada valor={datos.cuentas.saldoCustodiado} className="tapa__cifra" />
              </div>
              <BarraSaldo
                saldoTotal={datos.cuentas.saldoCustodiado}
                bolsillos={[{ id: "todos", nombre: "Bolsillos", estado: "activo", saldo: datos.bolsillos.saldoApartado }]}
                cantidadBolsillos={datos.bolsillos.activos}
              />
              {usuario.rol === "administrador" ? (
                <div className="acciones-rapidas">
                  <Link className="accion-rapida accion-rapida--principal" to="/cuentas?abrir=1">
                    <span className="accion-rapida__icono" aria-hidden="true">
                      <Plus size={20} weight="bold" />
                    </span>
                    <span>Abrir cuenta</span>
                  </Link>
                  <Link className="accion-rapida" to="/titulares?nuevo=1">
                    <span className="accion-rapida__icono" aria-hidden="true">
                      <IdentificationCard size={20} weight="bold" />
                    </span>
                    <span>Registrar titular</span>
                  </Link>
                </div>
              ) : null}
              <p className="tapa__nota">Calculado el {formatoFechaLarga(datos.generadoEn)}</p>
            </section>

            <section className="hoja" aria-labelledby="titulo-cuentas">
              <h2 id="titulo-cuentas">Cuentas y titulares</h2>
              <dl className="cifras-cortas">
                <div>
                  <dt>Titulares activos</dt>
                  <dd className="num">
                    {datos.usuarios.activos}
                    <small> / {datos.usuarios.total}</small>
                  </dd>
                </div>
                <div>
                  <dt>Cuentas activas</dt>
                  <dd className="num">{datos.cuentas.activas}</dd>
                </div>
                <div>
                  <dt>Bloqueadas</dt>
                  <dd className="num">{datos.cuentas.bloqueadas}</dd>
                </div>
                <div>
                  <dt>Cerradas</dt>
                  <dd className="num">{datos.cuentas.cerradas}</dd>
                </div>
                <div className="cifras-cortas__ancha">
                  <dt>Movimientos en los últimos 30 días</dt>
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
            <h2 id="titulo-tipos">Dinero movido por tipo</h2>
          </div>
          <Contenido
            carga={resumen}
            esVacio={(d) => d.transaccionesPorTipo.length === 0}
            vacio={<Vacio titulo="Sin movimientos registrados." />}
          >
            {(datos) => <GraficoTipos filas={datos.transaccionesPorTipo} />}
          </Contenido>
        </section>

        <section aria-labelledby="titulo-ultimos">
          <div className="bloque__titulo">
            <h2 id="titulo-ultimos">Últimos movimientos</h2>
            <Link to="/movimientos" className="enlace-sutil">
              Ver todos
            </Link>
          </div>
          <Contenido carga={recientes} vacio={<Vacio titulo="Sin movimientos registrados." />}>
            {(lista) => (
              <div className="hoja">
                <Extracto transacciones={lista} />
              </div>
            )}
          </Contenido>
        </section>
      </div>
    </>
  );
}
