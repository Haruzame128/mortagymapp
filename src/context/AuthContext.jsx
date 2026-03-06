
import { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()

  // Inicializamos desde sessionStorage para sobrevivir un F5
  const [user,  setUser]  = useState(() => JSON.parse(sessionStorage.getItem('user')  || 'null'))
  const [token, setToken] = useState(() => sessionStorage.getItem('token') || null)

  const login = async (dni, contrasena) => {
    // Puede lanzar error — el componente que llama lo captura con try/catch
    const data = await authApi.login(dni, contrasena)

     console.log('Respuesta del backend:', data) // temporal para debug

    sessionStorage.setItem('token', data.token)
    sessionStorage.setItem('user',  JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)

    // Redirigir según rol
    switch (data.user.rol) {
      case 'Administrador': navigate('/admin');     break
      case 'Profesor':      navigate('/profesor');  break
      case 'Recepcion':     navigate('/recepcion'); break
      case 'Cliente':       navigate('/perfil');    break
      default:              navigate('/')
    }
  }

  const logout = () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    setToken(null)
    setUser(null)
    navigate('/login')
  }

  // Helpers de rol para usar en componentes
  const isAdmin     = user?.rol === 'Administrador'
  const isProfesor  = user?.rol === 'Profesor'
  const isRecepcion = user?.rol === 'Recepcion'
  const isCliente   = user?.rol === 'Cliente'

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin, isProfesor, isRecepcion, isCliente }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook para usar en cualquier componente: const { user, login, logout } = useAuth()
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}