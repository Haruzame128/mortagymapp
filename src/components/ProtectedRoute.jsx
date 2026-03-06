import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// roles: array de roles permitidos, ej: ['Administrador', 'Recepcion']
// Si no se pasa roles, solo verifica que esté autenticado
export default function ProtectedRoute({ roles = [] }) {
  const { user } = useAuth()

  // No está logueado → al login
  if (!user) return <Navigate to="/login" replace />

  // Está logueado pero no tiene el rol requerido → al inicio
  if (roles.length > 0 && !roles.includes(user.rol)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}