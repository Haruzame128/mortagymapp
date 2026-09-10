import { NavLink, Outlet } from "react-router-dom";
import { usePerfilCliente } from "../hooks/usePerfilCliente";

export default function UsuarioLayout() {
  const { perfil } = usePerfilCliente();

  return (

    <div className="container perfil">
      <ul className="nav nav-tabs justify-content-center mb-4">
        <li className="nav-item">
          <NavLink
            to="/perfil"
            end
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            Perfil
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink
            to="/perfil/actividad-horario"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            Actividades
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/perfil/horario-usuario"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            Horarios
          </NavLink>
        </li>

        {/* Solo aparece si la nutricionista le cargó un plan — si no asiste
            a nutrición, no tiene sentido mostrarle la pestaña. */}
        {perfil?.tiene_plan_nutricion && (
          <li className="nav-item">
            <NavLink
              to="/perfil/nutricion"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              Nutrición
            </NavLink>
          </li>
        )}

        {/* "Rutinas" fuera del menú hasta que exista el backend que la
            respalda (/api/perfil/rutina, /api/perfil/progreso no existen
            todavía) — hoy fallaba igual para todos los clientes. */}
      </ul>

      {/* CONTENIDO */}
      <Outlet />
    </div>
  );
}
