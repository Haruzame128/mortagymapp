
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

/* Componentes */
import Header from './components/Header'
import Footer from './components/Footer'

/* Páginas Básicas */
import Home from './pages/Home'
import Actividades from './pages/Actividades'
import Horarios from './pages/Horarios'
import Login from './pages/Login'
import Contacto from './components/Contacto'

/* Perfiles */
import UsuarioLayout from './layouts/UsuarioLayout'
import ActividadUsuario from './pages/usuario/ActividadUsuario'
import VerRutina from './pages/usuario/VerRutina'
import HorarioUsuario from './pages/usuario/HorarioUsuario'
import Reagendar from './pages/usuario/Reagendar'

/* Profesor */
import ProfesorLayout from './layouts/ProfesorLayout'
import FormRutina from './pages/profesor/FormRutina'
import AlumnosPorProfesor from './pages/profesor/AlumnosPorProfesor'

/* Admin */
import AdminLayout from './layouts/AdminLayout'
import Alumnos from './pages/admin/Alumnos'
import NuevoAlumno from './pages/admin/NuevoAlumno'
import Profesores from './pages/admin/Profesores'
import NuevoProfesor from './pages/admin/NuevoProfesor'
import Gastos from './pages/admin/Gastos'
import Disciplinas from './pages/admin/Disciplinas'
import Servicios from './pages/admin/Servicios'

/* Recepción */
import RecepcionLayout from './layouts/RecepcionLayout'
import Usuarios from './pages/recepcion/Usuarios'
import Caja from './pages/recepcion/Caja'
import Inscripcion from './pages/recepcion/Inscripcion'
import Renovacion from './pages/recepcion/Renovacion'
import Molinete from './pages/recepcion/Molinete'

import './App.css'

function AppContent() {
  const location = useLocation()
  const esAdmin     = location.pathname.startsWith('/admin')
  const esRecepcion = location.pathname.startsWith('/recepcion')
  const esPerfil    = location.pathname.startsWith('/perfil')
  const esProfesor  = location.pathname.startsWith('/profesor')

  let tipoBanner = 'normal'
  if (esAdmin) tipoBanner = 'none'
  else if (esRecepcion || esPerfil || esProfesor) tipoBanner = 'alternativo'

  return (
    <>
      <Header tipoBanner={tipoBanner} />
      <main className={esAdmin ? 'admin-wrapper' : 'container mx-auto p-4'}>
        <Routes>
          {/* ── Rutas públicas ── */}
          <Route path="/"            element={<Home />} />
          <Route path="/actividades" element={<Actividades />} />
          <Route path="/horarios"    element={<Horarios />} />
          <Route path="/contacto"    element={<Contacto />} />
          <Route path="/login"       element={<Login />} />

          {/* ── Perfil (Cliente) ── */}
          <Route element={<ProtectedRoute roles={['Cliente']} />}>
            <Route path="/perfil" element={<UsuarioLayout />}>
              <Route index element={<Navigate to="actividad-horario" replace />} />
              <Route path="actividad-horario" element={<ActividadUsuario />} />
              <Route path="ver-rutina"        element={<VerRutina />} />
              <Route path="horario-usuario"   element={<HorarioUsuario />} />
              <Route path="reagendar-turno"   element={<Reagendar />} />
            </Route>
          </Route>

          {/* ── Profesor ── */}
          <Route element={<ProtectedRoute roles={['Profesor']} />}>
            <Route path="/profesor" element={<ProfesorLayout />}>
              <Route index element={<Navigate to="alumnos-profesor" replace />} />
              <Route path="form-rutina"       element={<FormRutina />} />
              <Route path="alumnos-profesor"  element={<AlumnosPorProfesor />} />
            </Route>
          </Route>

          {/* ── Admin ── */}
          <Route element={<ProtectedRoute roles={['Administrador']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="gastos" replace />} />
              <Route path="alumnos"                element={<Alumnos />} />
              <Route path="alumnos/nuevo"          element={<NuevoAlumno />} />
              <Route path="profesores"             element={<Profesores />} />
              <Route path="profesores/nuevoprofesor" element={<NuevoProfesor />} />
              <Route path="gastos"                 element={<Gastos />} />
              <Route path="disciplinas"            element={<Disciplinas />} />
              <Route path="servicios"              element={<Servicios />} />
            </Route>
          </Route>

          {/* ── Recepción ── */}
          <Route element={<ProtectedRoute roles={['Recepcion']} />}>
            <Route path="/recepcion" element={<RecepcionLayout />}>
              <Route index element={<Navigate to="usuarios" replace />} />
              <Route path="usuarios"   element={<Usuarios />} />
              <Route path="caja"       element={<Caja />} />
              <Route path="inscripcion" element={<Inscripcion />} />
              <Route path="renovacion" element={<Renovacion />} />
              <Route path="molinete"   element={<Molinete />} />
            </Route>
          </Route>
        </Routes>
      </main>
      {!esAdmin && <Footer />}
    </>
  )
}

// AuthProvider va adentro del Router (que ya está en main.jsx)
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}