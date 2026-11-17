import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ETIQUETA_ROL, iniciales } from "../utils/formato";
import { SelectorTema } from "./SelectorTema";

// Cada rol ve solo destinos que existen y que su backend le permite.
const NAVEGACION = {
  cliente: [
    { a: "/", texto: "Inicio", fin: true },
    { a: "/cuentas", texto: "Mis cuentas" },
    { a: "/seguridad", texto: "Seguridad" },
  ],
  administrador: [
    { a: "/", texto: "Resumen", fin: true },
    { a: "/cuentas", texto: "Cuentas" },
    { a: "/titulares", texto: "Titulares" },
    { a: "/movimientos", texto: "Movimientos" },
    { a: "/seguridad", texto: "Seguridad" },
  ],
  auditor: [
    { a: "/", texto: "Resumen", fin: true },
    { a: "/cuentas", texto: "Cuentas" },
    { a: "/titulares", texto: "Titulares" },
    { a: "/movimientos", texto: "Movimientos" },
    { a: "/seguridad", texto: "Seguridad" },
  ],
};

export function Marco() {
  const { usuario, cerrarSesion } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const enlaces = NAVEGACION[usuario.rol] || [];

  return (
    <>
      <a className="saltar-contenido" href="#contenido">
        Saltar al contenido
      </a>
      <header className="cabecera">
        <div className="cabecera__fila">
          <NavLink to="/" className="marca">
            Bolsillo
          </NavLink>

          <button
            type="button"
            className="boton boton--secundario boton-menu"
            aria-expanded={menuAbierto}
            aria-controls="navegacion-principal"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
          >
            {menuAbierto ? "Cerrar menú" : "Menú"}
          </button>

          <nav
            id="navegacion-principal"
            className="navegacion"
            aria-label="Principal"
            data-abierta={menuAbierto}
          >
            {enlaces.map((enlace) => (
              <NavLink key={enlace.a} to={enlace.a} end={enlace.fin} onClick={() => setMenuAbierto(false)}>
                {enlace.texto}
              </NavLink>
            ))}
          </nav>

          <div className="cabecera__cuenta">
            <span className="iniciales" aria-hidden="true">
              {iniciales(usuario.nombre || usuario.email)}
            </span>
            <span className="cabecera__quien">
              <span>{usuario.nombre || usuario.email}</span>
              <span>{ETIQUETA_ROL[usuario.rol] || usuario.rol}</span>
            </span>
            <SelectorTema />
            <button type="button" className="boton boton--fantasma" onClick={() => cerrarSesion()}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <main id="contenido" className="pagina" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
