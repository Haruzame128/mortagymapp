import { useState } from "react";
import { NavLink, Link } from 'react-router-dom'
import logo from '../assets/logo_sf.png'
import fondo from '../assets/fondo-gradiente.jpg'
import { BsBoxArrowInRight, BsSpeedometer2, BsBoxArrowRight } from "react-icons/bs";
import { useAuth } from '../context/AuthContext'
import '../styles/Header.css'

// A dónde vuelve cada rol y cómo se llama el botón — así ningún rol nuevo
// se queda sin botón de "volver a mis funciones" por caer en un else vacío.
const HOME_POR_ROL = {
  Administrador: { to: '/admin', label: 'Panel de Control' },
  Cliente: { to: '/perfil', label: 'Mi Perfil' },
  Profesor: { to: '/profesor/perfil', label: 'Mi Perfil' },
  Recepcion: { to: '/recepcion', label: 'Volver a mis funciones' },
  Medico: { to: '/medico', label: 'Volver a mis funciones' },
  Editor: { to: '/editor', label: 'Volver a mis funciones' },
  Nutricionista: { to: '/nutricion', label: 'Volver a mis funciones' },
}

export default function Navbar({ tipoBanner = "normal" }) {

  const [menuAbierto, setMenuAbierto] = useState(false);
  const cerrarMenu = () => setMenuAbierto(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    cerrarMenu();
    logout();
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg custom-navbar shadow-sm">
        <div className="container-fluid mx-2">
          {tipoBanner === "normal" || tipoBanner === "alternativo" && (
            <Link className="navbar-brand header-title" to="/">
              <img src={logo} alt="Morta Gym logo" height="85" className="me-2" />
            </Link>
          )}

          <button
            className="navbar-toggler custom-toggler ms-auto"
            type="button"
            aria-expanded={menuAbierto}
            aria-label="Toggle navigation"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            <i className="ri-menu-line"></i>
          </button>

          <div className={`py-2 collapse navbar-collapse ${menuAbierto ? "show" : "py-2"}`} id="mainNav">
            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item"><NavLink className="nav-link" to="/" onClick={cerrarMenu}>Inicio</NavLink></li>
              <li className="nav-item"><NavLink className="nav-link" to="/actividades" onClick={cerrarMenu}>Disciplinas</NavLink></li>
              <li className="nav-item"><NavLink className="nav-link" to="/horarios" onClick={cerrarMenu}>Horarios</NavLink></li>

              {!user ? (
                // No logueado → Ingresar
                <li className="nav-item">
                  <NavLink className="nav-link nav-btn px-4" to="/login" onClick={cerrarMenu}>
                    <BsBoxArrowInRight className="me-2" /> Ingresar
                  </NavLink>
                </li>
              ) : (
                // Logueado → volver a sus funciones (según rol) + Salir
                <>
                  {HOME_POR_ROL[user.rol] && (
                    <li className="nav-item ms-2">
                      <NavLink className="nav-link nav-btn px-4" to={HOME_POR_ROL[user.rol].to} onClick={cerrarMenu}>
                        <BsSpeedometer2 className="me-2" /> {HOME_POR_ROL[user.rol].label}
                      </NavLink>
                    </li>
                  )}
                  <li className="nav-item ms-2">
                    <button className="nav-link nav-btn-outline px-3" onClick={handleLogout}>
                      <BsBoxArrowRight className="me-2" /> Salir
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {tipoBanner === "normal" && (
        <section className="banner-section">
          <h2 className="banner-text fst-italic fw-bold">
            Si lo crees lo creas, <br /> el cambio comienza en vos
          </h2>
        </section>
      )}

      {tipoBanner === "alternativo" && (
        <section className="banner-alt position-relative">
          <img src={fondo} alt="Banner alternativo" className="w-100 banner-img" />
          <h1 className="banner-alt-text fst-italic fw-bold">
            {user?.nombre || 'Mi Perfil'}
          </h1>
        </section>
      )}
    </>
  )
}