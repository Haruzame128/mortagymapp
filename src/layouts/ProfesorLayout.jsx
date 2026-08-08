import { NavLink, Outlet } from "react-router-dom";

export default function ProfesorLayout() {
  return (

    <div className="container perfil">
      <ul className="nav nav-tabs justify-content-center mb-4">
        <li className="nav-item">
          <NavLink to="/profesor/perfil"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Mi Perfil
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/profesor/alumnos-profesor"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            Alumnos
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink
            to="/profesor/form-rutina"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            Rutinas
          </NavLink>
        </li>
      </ul>

      {/* CONTENIDO */}
      <Outlet />
    </div>
  );
}
