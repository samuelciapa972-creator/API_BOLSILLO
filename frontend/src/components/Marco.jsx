import { ArrowsLeftRight, House, IdentificationCard, ShieldCheck, SignOut, Wallet } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ETIQUETA_ROL, iniciales } from "../utils/formato";
import { SelectorTema } from "./SelectorTema";

// Cada rol ve solo destinos que existen y que su backend le permite.
const NAVEGACION = {
  cliente: [
    { a: "/", texto: "Inicio", icono: House, fin: true },
    { a: "/cuentas", texto: "Cuentas", icono: Wallet },
    { a: "/seguridad", texto: "Seguridad", icono: ShieldCheck },
  ],
  gestion: [
    { a: "/", texto: "Resumen", icono: House, fin: true },
    { a: "/cuentas", texto: "Cuentas", icono: Wallet },
    { a: "/titulares", texto: "Titulares", icono: IdentificationCard },
    { a: "/movimientos", texto: "Movimientos", icono: ArrowsLeftRight },
    { a: "/seguridad", texto: "Seguridad", icono: ShieldCheck },
  ],
};

const activo = (pathname, enlace) => (enlace.fin ? pathname === enlace.a : pathname.startsWith(enlace.a));

// Resorte críticamente amortiguado (sin rebote): el indicador acompaña, no distrae.
const RESORTE = { type: "spring", duration: 0.35, bounce: 0 };

function Enlaces({ enlaces, variante }) {
  const { pathname } = useLocation();
  const reducir = useReducedMotion();
  return enlaces.map((enlace) => {
    const Icono = enlace.icono;
    const esActivo = activo(pathname, enlace);
    return (
      <NavLink key={enlace.a} to={enlace.a} end={enlace.fin} className={`nav-${variante}__enlace`}>
        {esActivo ? (
          <motion.span
            layoutId={`indicador-${variante}`}
            className={`nav-${variante}__indicador`}
            transition={reducir ? { duration: 0 } : RESORTE}
            aria-hidden="true"
          />
        ) : null}
        <Icono size={variante === "inferior" ? 22 : 20} weight={esActivo ? "fill" : "regular"} aria-hidden="true" />
        <span>{enlace.texto}</span>
      </NavLink>
    );
  });
}

export function Marco() {
  const { usuario, cerrarSesion } = useAuth();
  const { pathname } = useLocation();
  const enlaces = usuario.rol === "cliente" ? NAVEGACION.cliente : NAVEGACION.gestion;
  const nombre = usuario.nombre || usuario.email;

  return (
    <div className="marco">
      <a className="saltar-contenido" href="#contenido">
        Saltar al contenido
      </a>

      <aside className="lomo" aria-label="Navegación">
        <NavLink to="/" className="marca">
          Bolsillo
        </NavLink>
        <nav className="nav-lateral" aria-label="Principal">
          <Enlaces enlaces={enlaces} variante="lateral" />
        </nav>
        <div className="lomo__pie">
          <div className="persona">
            <span className="iniciales" aria-hidden="true">
              {iniciales(nombre)}
            </span>
            <span className="persona__texto">
              <strong>{nombre}</strong>
              <span>{ETIQUETA_ROL[usuario.rol] || usuario.rol}</span>
            </span>
          </div>
          <div className="lomo__acciones">
            <SelectorTema conTexto />
            <button type="button" className="boton boton--fantasma" onClick={() => cerrarSesion()}>
              <SignOut size={18} aria-hidden="true" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </aside>

      <header className="barra-movil">
        <NavLink to="/" className="marca">
          Bolsillo
        </NavLink>
        <div className="barra-movil__acciones">
          <SelectorTema />
          <button type="button" className="boton boton--fantasma boton--icono" onClick={() => cerrarSesion()} aria-label="Cerrar sesión">
            <SignOut size={20} aria-hidden="true" />
          </button>
        </div>
      </header>

      <main id="contenido" className="pagina" tabIndex={-1}>
        {/* La clave reinicia la entrada suave al cambiar de sección. */}
        <div className="pagina__contenido" key={pathname}>
          <Outlet />
        </div>
      </main>

      <nav className="nav-inferior" aria-label="Principal (móvil)" data-cantidad={enlaces.length}>
        <Enlaces enlaces={enlaces} variante="inferior" />
      </nav>
    </div>
  );
}
