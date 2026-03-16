const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const getToken = () => sessionStorage.getItem('token')

// ── Request JSON normal ──────────────────────────────────────────
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

  let data
  try {
    data = await res.json()
  } catch {
    throw new Error('Error en el servidor')
  }

  if (res.status === 401 && !endpoint.includes('/auth/login')) {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    window.location.href = '/login'
    return
  }

  if (!res.ok) throw new Error(data?.error || 'Error en la solicitud')

  return data
}

// ── Request multipart (para subida de archivos) ──────────────────
async function requestForm(endpoint, options = {}) {
  const token = getToken()

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      // NO agregar Content-Type — el browser lo pone solo con el boundary
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  let data
  try {
    data = await res.json()
  } catch {
    throw new Error('Error en el servidor')
  }

  if (!res.ok) throw new Error(data?.error || 'Error en la solicitud')

  return data
}

// ── Helpers ──────────────────────────────────────────────────────
const get      = (endpoint)           => request(endpoint)
const post     = (endpoint, body)     => request(endpoint,     { method: 'POST',   body: JSON.stringify(body) })
const put      = (endpoint, body)     => request(endpoint,     { method: 'PUT',    body: JSON.stringify(body) })
const patch    = (endpoint, body)     => request(endpoint,     { method: 'PATCH',  body: JSON.stringify(body) })
const del      = (endpoint)           => request(endpoint,     { method: 'DELETE' })
const postForm = (endpoint, formData) => requestForm(endpoint, { method: 'POST',   body: formData })
const putForm  = (endpoint, formData) => requestForm(endpoint, { method: 'PUT',    body: formData })

// ── Auth ─────────────────────────────────────────────────────────
export const authApi = {
  login: (dni, contrasena) => post('/api/auth/login', { dni, contrasena }),
  me:    ()                => get('/api/auth/me'),
}

// ── Admin — Usuarios ─────────────────────────────────────────────
export const usuariosApi = {
  getAll:  ()         => get('/api/admin/usuarios'),
  getById: (id)       => get(`/api/admin/usuarios/${id}`),
  create:  (data)     => post('/api/admin/usuarios', data),
  update:  (id, data) => put(`/api/admin/usuarios/${id}`, data),
  remove:  (id)       => del(`/api/admin/usuarios/${id}`),
}

// ── Admin — Clientes ─────────────────────────────────────────────
export const clientesApi = {
  getAll:  ()         => get('/api/admin/clientes'),
  getById: (id)       => get(`/api/admin/clientes/${id}`),
  create:  (data)     => post('/api/admin/clientes', data),
  update:  (id, data) => put(`/api/admin/clientes/${id}`, data),
}

// ── Admin — Profesores ───────────────────────────────────────────
export const profesoresApi = {
  getAll:  ()         => get('/api/admin/profesores'),
  getById: (id)       => get(`/api/admin/profesores/${id}`),
  create:  (data)     => post('/api/admin/profesores', data),
  update:  (id, data) => put(`/api/admin/profesores/${id}`, data),
}

// ── Admin — Disciplinas (multipart por imagen) ───────────────────
export const disciplinasApi = {
  getAll:        ()              => get('/api/admin/disciplinas'),
  getPublico:    ()              => get('/api/admin/disciplinas/publico'),
  getImagenes:   (id)            => get(`/api/admin/disciplinas/${id}/imagenes`),
  create:        (formData)      => postForm('/api/admin/disciplinas', formData),
  update:        (id, formData)  => putForm(`/api/admin/disciplinas/${id}`, formData),
  updatePrecios: (id, precios)   => put(`/api/admin/disciplinas/${id}/precios`, { precios }),
  toggleActivo:  (id, activo)    => put(`/api/admin/disciplinas/${id}/activo`, { activo }),
  addImagen:     (id, formData)  => postForm(`/api/admin/disciplinas/${id}/imagenes`, formData),
  deleteImagen:  (id, imgId)     => del(`/api/admin/disciplinas/${id}/imagenes/${imgId}`),
}

// ── Admin — Actividades ──────────────────────────────────────────
export const actividadesApi = {
  getAll:  ()         => get('/api/admin/actividades'),
  create:  (data)     => post('/api/admin/actividades', data),
  update:  (id, data) => put(`/api/admin/actividades/${id}`, data),
  remove:  (id)       => del(`/api/admin/actividades/${id}`),
}

// ── Admin — Horarios ─────────────────────────────────────────────
export const horariosApi = {
  getAll:  ()         => get('/api/admin/horarios'),
  create:  (data)     => post('/api/admin/horarios', data),
  update:  (id, data) => put(`/api/admin/horarios/${id}`, data),
  remove:  (id)       => del(`/api/admin/horarios/${id}`),
}

// ── Servicios ────────────────────────────────────────────────────
export const serviciosApi = {
  getPublicos: ()             => get('/api/servicios'),
  getAdmin:    ()             => get('/api/servicios/admin'),
  create:      (formData)     => postForm('/api/servicios', formData),
  update:      (id, formData) => putForm(`/api/servicios/${id}`, formData),
}

// ── Reservas ─────────────────────────────────────────────────────
export const reservasApi = {
  disponibles:   (dia)  => get(`/api/reservas/musculacion/disponibles?dia=${dia}`),
  reservarMuscu: (data) => post('/api/reservas/musculacion', data),
  cancelarMuscu: (id)   => del(`/api/reservas/musculacion/${id}`),
  inscripciones: ()     => get('/api/reservas/inscripciones'),
  inscribir:     (data) => post('/api/reservas/inscripciones', data),
}

// ── Horarios públicos ─────────────────────────────────────────────
export const horariosPublicoApi = {
  getHorarios:    () => get('/api/horarios'),
  getDisciplinas: () => get('/api/horarios/disciplinas'),
}