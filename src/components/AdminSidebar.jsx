import { NavLink } from "react-router-dom";
import "../styles/AdminSidebar.css";
import icon from "/favicon2.png"

export default function AdminSidebar({ collapsed, setCollapsed }) {
  return (
    <div className="sidebar-container bg-dark">
      <div className="sidebar-header">
        {!collapsed && (
          <div className="mt-4">
            <img src={icon} alt="Morta Gym" height={30} className="me-2" />
            <span className="sidebar-title text-white">Administrador</span>
          </div>
        )}

        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle sidebar"
        >
          {collapsed ? (
            <i className="ri-arrow-right-double-line"></i>
          ) : (
            <i className="ri-arrow-left-double-line"></i>
          )}
        </button>
      </div>

      <nav className={`sidebar-menu ${collapsed ? "collapsed" : ""}`}>
        <NavLink to="/admin/alumnos" className="sidebar-item">
          <i className="ri-user-3-line"></i>
          <span>Alumnos</span>
        </NavLink>

        <NavLink to="/admin/profesores" className="sidebar-item">
          <i className="ri-team-line"></i>
          <span>Profesores</span>
        </NavLink>

        <NavLink to="/admin/sueldos" className="sidebar-item">
          <i className="ri-wallet-2-line"></i>
          <span>Sueldos</span>
        </NavLink>

        <NavLink to="/admin/gastos" className="sidebar-item">
          <i className="ri-money-dollar-circle-line"></i>
          <span>Gastos</span>
        </NavLink>

        <NavLink to="/admin/matriculas" className="sidebar-item">
          <i className="ri-file-list-3-line"></i>
          <span>Matrículas</span>
        </NavLink>

        <NavLink to="/admin/disciplinas" className="sidebar-item">
          <i className="ri-run-line"></i>
          <span>Disciplinas</span>
        </NavLink>

        <NavLink to="/admin/usuarios" className="sidebar-item">
          <i className="ri-shield-user-line"></i>
          <span>Usuarios</span>
        </NavLink>

        <NavLink to="/admin/ficha-config" className="sidebar-item">
          <i className="ri-file-settings-line"></i>
          <span>Ficha de inscripción</span>
        </NavLink>

        <button
          type="button"
          className="sidebar-item"
          style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
          onClick={() => window.open("/kiosko/ingreso", "_blank", "noopener,noreferrer")}
        >
          <i className="ri-fingerprint-line"></i>
          <span>Pantalla de ingreso</span>
        </button>
      </nav>
    </div>
  );
}
