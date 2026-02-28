const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Lee el token guardado en sessionStorage
const getToken = () => sessionStorage.getItem('token')

// Función base — agrega el token automáticamente a cada request
async function request(endpoint, options = {}) {
  const token = getToken()

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  // Si el token expiró, limpiamos sesión y mandamos al login
  if (res.status === 401) {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    window.location.href = '/login'
    return
  }

  const data = await res.json()

  if (!res.ok) {
    // Lanza el mensaje de error que manda el backend
    throw new Error(data.error || 'Error en la solicitud')
  }

  return data
}

// ── Helpers por método ───────────────────────────────────────────
const get    = (endpoint)         => request(endpoint)
const post   = (endpoint, body)   => request(endpoint, { method: 'POST',   body: JSON.stringify(body) })
const put    = (endpoint, body)   => request(endpoint, { method: 'PUT',    body: JSON.stringify(body) })
const patch  = (endpoint, body)   => request(endpoint, { method: 'PATCH',  body: JSON.stringify(body) })
const del    = (endpoint)         => request(endpoint, { method: 'DELETE' })

// ── Auth ─────────────────────────────────────────────────────────
export const authApi = {
  login: (dni, contrasena)  => post('/api/auth/login', { dni, contrasena }),
  me:    ()                 => get('/api/auth/me'),
}

// ── Admin ────────────────────────────────────────────────────────
export const usuariosApi = {
  getAll:  ()           => get('/api/admin/usuarios'),
  getById: (id)         => get(`/api/admin/usuarios/${id}`),
  create:  (data)       => post('/api/admin/usuarios', data),
  update:  (id, data)   => put(`/api/admin/usuarios/${id}`, data),
  remove:  (id)         => del(`/api/admin/usuarios/${id}`),
}

export const clientesApi = {
  getAll:  ()           => get('/api/admin/clientes'),
  getById: (id)         => get(`/api/admin/clientes/${id}`),
  create:  (data)       => post('/api/admin/clientes', data),
  update:  (id, data)   => put(`/api/admin/clientes/${id}`, data),
}

export const profesoresApi = {
  getAll:  ()           => get('/api/admin/profesores'),
  getById: (id)         => get(`/api/admin/profesores/${id}`),
  create:  (data)       => post('/api/admin/profesores', data),
  update:  (id, data)   => put(`/api/admin/profesores/${id}`, data),
}

export const disciplinasApi = {
  getAll:  ()           => get('/api/admin/disciplinas'),
  create:  (data)       => post('/api/admin/disciplinas', data),
  update:  (id, data)   => put(`/api/admin/disciplinas/${id}`, data),
}

export const actividadesApi = {
  getAll:  ()           => get('/api/admin/actividades'),
  create:  (data)       => post('/api/admin/actividades', data),
  update:  (id, data)   => put(`/api/admin/actividades/${id}`, data),
  remove:  (id)         => del(`/api/admin/actividades/${id}`),
}

export const horariosApi = {
  getAll:  ()           => get('/api/admin/horarios'),
  create:  (data)       => post('/api/admin/horarios', data),
  update:  (id, data)   => put(`/api/admin/horarios/${id}`, data),
  remove:  (id)         => del(`/api/admin/horarios/${id}`),
}

// ── Reservas ─────────────────────────────────────────────────────
export const reservasApi = {
  disponibles:       (dia)   => get(`/api/reservas/musculacion/disponibles?dia=${dia}`),
  reservarMuscu:     (data)  => post('/api/reservas/musculacion', data),
  cancelarMuscu:     (id)    => del(`/api/reservas/musculacion/${id}`),
  inscripciones:     ()      => get('/api/reservas/inscripciones'),
  inscribir:         (data)  => post('/api/reservas/inscripciones', data),
}