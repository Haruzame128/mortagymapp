import { NavLink, Outlet } from "react-router-dom";

export default function RecepcionLayout() {
  return (
    <div className="container perfil">

      {/* TABS */}
      <ul className="nav nav-tabs justify-content-center mb-4">
        <li className="nav-item">
          <NavLink
            to="/recepcion/dashboard"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            Dashboard
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink
            to="/recepcion/usuarios"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            Usuarios
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink
            to="/recepcion/caja"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            Caja
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink
            to="/recepcion/matriculas"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            Matrículas
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink
            to="/recepcion/lista-espera"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            Lista de espera
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink
            to="/recepcion/molinete"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            Molinete
          </NavLink>
        </li>

        <li className="nav-item">
          <button
            type="button"
            className="nav-link"
            onClick={() => window.open("/kiosko/ingreso", "_blank", "noopener,noreferrer")}
          >
            <i className="ri-fingerprint-line me-1"></i> Pantalla de ingreso
          </button>
        </li>
      </ul>

      {/* CONTENIDO */}
      <Outlet />
    </div>
  );
}
