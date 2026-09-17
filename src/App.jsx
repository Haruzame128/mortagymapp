
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
import Nutricion from './pages/usuario/Nutricion'
import Perfil from './pages/Perfil'

/* Profesor */
import ProfesorLayout from './layouts/ProfesorLayout'
import FormRutina from './pages/profesor/FormRutina'
import AlumnosPorProfesor from './pages/profesor/AlumnosPorProfesor'
import PerfilProfesor from './pages/profesor/PerfilProfesor'

/* Admin */
import AdminLayout from './layouts/AdminLayout'
import Alumnos from './pages/admin/Alumnos'
import NuevoAlumno from './pages/admin/NuevoAlumno'
import AlumnoDetalle from './pages/admin/AlumnoDetalle'
import Profesores from './pages/admin/Profesores'
import NuevoProfesor from './pages/admin/NuevoProfesor'
import ProfesorDetalle from './pages/admin/ProfesorDetalle'
import Sueldos from './pages/admin/Sueldos'
import SueldoDetalle from './pages/admin/SueldoDetalle'
import Gastos from './pages/admin/Gastos'
import Disciplinas from './pages/admin/Disciplinas'
import UsuariosAdmin from './pages/admin/Usuarios'
import Matriculas from './pages/admin/Matriculas'
import FichaConfig from './pages/admin/FichaConfig'
import Ejercicios from './pages/admin/Ejercicios'

/* Editor */
import EditorLayout from './layouts/EditorLayout'
import EditorDisciplinas from './pages/editor/Disciplinas'
import EditorServicios from './pages/editor/Servicios'

/* Médico */
import Revisiones from './pages/medico/Revisiones'

/* Nutricionista */
import Planes from './pages/nutricion/Planes'

/* Recepción */
import RecepcionLayout from './layouts/RecepcionLayout'
import DashboardRecepcion from './pages/recepcion/Dashboard'
import Usuarios from './pages/recepcion/Usuarios'
import Caja from './pages/recepcion/Caja'
import Inscripcion from './pages/recepcion/Inscripcion'
import Renovacion from './pages/recepcion/Renovacion'
import Molinete from './pages/recepcion/Molinete'
import ListaEspera from './pages/recepcion/ListaEspera'
import MatriculasRecepcion from './pages/admin/Matriculas'

/* Kiosko (pantalla del molinete de entrada) */
import IngresoKiosko from './pages/kiosko/Ingreso'

import './App.css'

function AppContent() {
  const location = useLocation()
  const esAdmin = location.pathname.startsWith('/admin')
  const esEditor = location.pathname.startsWith('/editor')
  const esRecepcion = location.pathname.startsWith('/recepcion')
  const esPerfil = location.pathname.startsWith('/perfil')
  const esProfesor = location.pathname.startsWith('/profesor')
  const esMedico = location.pathname.startsWith('/medico')
  const esNutricion = location.pathname.startsWith('/nutricion')
  const esKiosko = location.pathname.startsWith('/kiosko')

  let tipoBanner = 'normal'
  if (esAdmin || esEditor) tipoBanner = 'none'
  else if (esRecepcion || esPerfil || esProfesor || esMedico || esNutricion) tipoBanner = 'alternativo'

  // El kiosko es una pantalla a pantalla completa sin header/footer/menú —
  // corre sola en la terminal de la puerta.
  if (esKiosko) {
    return (
      <Routes>
        <Route path="/kiosko/ingreso" element={<IngresoKiosko />} />
      </Routes>
    )
  }

  return (
    <>
      <Header tipoBanner={tipoBanner} />
      <main className={esAdmin || esEditor ? 'admin-wrapper' : 'container mx-auto p-4'}>
        <Routes>
          {/* ── Rutas públicas ── */}
          <Route path="/" element={<Home />} />
          <Route path="/actividades" element={<Actividades />} />
          <Route path="/horarios" element={<Horarios />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/login" element={<Login />} />

          {/* ── Perfil (Cliente) ── */}
          <Route element={<ProtectedRoute roles={['Cliente']} />}>
            <Route path="/perfil" element={<UsuarioLayout />}>
              <Route index element={<Perfil />} />
              <Route path="actividad-horario" element={<ActividadUsuario />} />
              <Route path="ver-rutina" element={<VerRutina />} />
              <Route path="horario-usuario" element={<HorarioUsuario />} />
              <Route path="reagendar-turno" element={<Reagendar />} />
              <Route path="nutricion" element={<Nutricion />} />
            </Route>
          </Route>

          {/* ── Profesor ── */}
          <Route element={<ProtectedRoute roles={['Profesor']} />}>
            <Route path="/profesor" element={<ProfesorLayout />}>
              <Route index element={<Navigate to="alumnos-profesor" replace />} />
              <Route path="form-rutina" element={<FormRutina />} />
              <Route path="alumnos-profesor" element={<AlumnosPorProfesor />} />
              <Route path="perfil" element={<PerfilProfesor />} />  {/* ← nuevo */}
            </Route>
          </Route>

          {/* ── Admin ── */}
          <Route element={<ProtectedRoute roles={['Administrador']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="gastos" replace />} />
              <Route path="alumnos" element={<Alumnos />} />
              <Route path="alumnos/nuevo" element={<NuevoAlumno />} />
              <Route path="alumnos/:id" element={<AlumnoDetalle />} />
              <Route path="profesores" element={<Profesores />} />
              <Route path="profesores/nuevoprofesor" element={<NuevoProfesor />} />
              <Route path="profesores/:id" element={<ProfesorDetalle />} />
              <Route path="profesores/:id/editar" element={<NuevoProfesor />} />
              <Route path="sueldos" element={<Sueldos />} />
              <Route path="sueldos/:id" element={<SueldoDetalle />} />
              <Route path="gastos" element={<Gastos />} />
              <Route path="matriculas" element={<Matriculas />} />
              <Route path="disciplinas" element={<Disciplinas />} />
              <Route path="ejercicios" element={<Ejercicios />} />
              <Route path="usuarios" element={<UsuariosAdmin />} />
              <Route path="ficha-config" element={<FichaConfig />} />
            </Route>
          </Route>

          {/* ── Editor — contenido del sitio (disciplinas, servicios) ── */}
          <Route element={<ProtectedRoute roles={['Editor']} />}>
            <Route path="/editor" element={<EditorLayout />}>
              <Route index element={<Navigate to="disciplinas" replace />} />
              <Route path="disciplinas" element={<EditorDisciplinas />} />
              <Route path="servicios" element={<EditorServicios />} />
            </Route>
          </Route>

          {/* ── Médico ── */}
          <Route element={<ProtectedRoute roles={['Medico']} />}>
            <Route path="/medico" element={<Revisiones />} />
          </Route>

          {/* ── Nutricionista ── */}
          <Route element={<ProtectedRoute roles={['Nutricionista']} />}>
            <Route path="/nutricion" element={<Planes />} />
          </Route>

          {/* ── Recepción ── */}
          <Route element={<ProtectedRoute roles={['Recepcion']} />}>
            <Route path="/recepcion" element={<RecepcionLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardRecepcion />} />
              <Route path="usuarios" element={<Usuarios />} />
              <Route path="usuarios/nuevo" element={<NuevoAlumno />} />
              <Route path="usuarios/:id" element={<AlumnoDetalle />} />
              <Route path="caja" element={<Caja />} />
              <Route path="inscripcion" element={<Inscripcion />} />
              <Route path="renovacion" element={<Renovacion />} />
              <Route path="lista-espera" element={<ListaEspera />} />
              <Route path="matriculas" element={<MatriculasRecepcion />} />
              <Route path="molinete" element={<Molinete />} />
            </Route>
          </Route>
        </Routes>
      </main>
      {!esAdmin && !esEditor && <Footer />}
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