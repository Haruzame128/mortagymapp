import { NavLink } from "react-router-dom";
import "../styles/AdminSidebar.css";
import icon from "/favicon2.png"

export default function EditorSidebar({ collapsed, setCollapsed }) {
  return (
    <div className="sidebar-container bg-dark">
      <div className="sidebar-header">
        {!collapsed && (
          <div className="mt-4">
            <img src={icon} alt="Morta Gym" height={30} className="me-2" />
            <span className="sidebar-title text-white">Editor</span>
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
        <NavLink to="/editor/disciplinas" className="sidebar-item">
          <i className="ri-run-line"></i>
          <span>Disciplinas</span>
        </NavLink>

        <NavLink to="/editor/servicios" className="sidebar-item">
          <i className="ri-boxing-line"></i>
          <span>Servicios</span>
        </NavLink>
      </nav>
    </div>
  );
}
