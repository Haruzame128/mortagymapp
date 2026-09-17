const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getToken = () => sessionStorage.getItem("token");

// ── Request JSON normal ──────────────────────────────────────────
async function request(endpoint, options = {}) {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Error en el servidor");
  }

  if (res.status === 401 && !endpoint.includes("/auth/login") && !endpoint.includes("/acceso/verificar")) {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) throw Object.assign(new Error(data?.error || "Error en la solicitud"), { data });

  return data;
}

// ── Request multipart (para subida de archivos) ──────────────────
async function requestForm(endpoint, options = {}) {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      // NO agregar Content-Type — el browser lo pone solo con el boundary
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Error en el servidor");
  }

  if (!res.ok) throw new Error(data?.error || "Error en la solicitud");

  return data;
}

// ── Helpers ──────────────────────────────────────────────────────
const get = (endpoint) => request(endpoint);
const post = (endpoint, body, headers) =>
  request(endpoint, { method: "POST", body: JSON.stringify(body), headers });
const put = (endpoint, body) =>
  request(endpoint, { method: "PUT", body: JSON.stringify(body) });
const patch = (endpoint, body) =>
  request(endpoint, { method: "PATCH", body: JSON.stringify(body) });
const del = (endpoint) => request(endpoint, { method: "DELETE" });
const postForm = (endpoint, formData) =>
  requestForm(endpoint, { method: "POST", body: formData });
const putForm = (endpoint, formData) =>
  requestForm(endpoint, { method: "PUT", body: formData });

// ── Auth ─────────────────────────────────────────────────────────
export const authApi = {
  login: (dni, contrasena) => post("/api/auth/login", { dni, contrasena }),
  me: () => get("/api/auth/me"),
};

// ── Admin — Usuarios ─────────────────────────────────────────────
export const usuariosApi = {
  getAll: ({ rol, activo, buscar } = {}) => {
    const params = new URLSearchParams();
    if (rol) params.append("rol", rol);
    if (activo !== undefined && activo !== "") params.append("activo", activo);
    if (buscar) params.append("buscar", buscar);
    const qs = params.toString();
    return get(`/api/admin/usuarios${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => get(`/api/admin/usuarios/${id}`),
  create: (data) => post("/api/admin/usuarios", data),
  actualizarNombre: (id, nombre) => patch(`/api/admin/usuarios/${id}`, { nombre }),
  cambiarRol: (id, rol) => patch(`/api/admin/usuarios/${id}/rol`, { rol }),
  cambiarEstado: (id, activo) => patch(`/api/admin/usuarios/${id}/estado`, { activo }),
  resetPassword: (id, contrasena) => post(`/api/admin/usuarios/${id}/reset-password`, { contrasena }),
};

// ── Admin — Roles y permisos ──────────────────────────────────────
export const rolesApi = {
  getAll: () => get("/api/admin/roles"),
  create: (data) => post("/api/admin/roles", data),
  update: (id, data) => patch(`/api/admin/roles/${id}`, data),
  remove: (id) => del(`/api/admin/roles/${id}`),
};

export const permisosApi = {
  getCatalogo: () => get("/api/admin/permisos"),
};

// ── Admin — Clientes ─────────────────────────────────────────────
export const clientesApi = {
  getAll: () => get("/api/admin/clientes"),
  getById: (id) => get(`/api/admin/clientes/${id}`),
  create: (data) => post("/api/admin/clientes", data),
  update: (id, data) => put(`/api/admin/clientes/${id}`, data),
  updateFicha: (id, data) =>
    put(`/api/admin/clientes/${id}/ficha-medica`, data),
  setAptoMedico: (id, fecha_entrega) =>
    put(`/api/admin/clientes/${id}/apto-medico`, { fecha_entrega }),
  getHuellas: (id) => get(`/api/admin/clientes/${id}/huellas`),
  addHuella: (id, template_huella, etiqueta) =>
    post(`/api/admin/clientes/${id}/huellas`, { template_huella, etiqueta }),
  removeHuella: (id, idHuella) => del(`/api/admin/clientes/${id}/huellas/${idHuella}`),
  setPin: (id, pin) => put(`/api/admin/clientes/${id}/pin`, { pin }),
  addInscripciones: (id, data) =>
    post(`/api/admin/clientes/${id}/inscripciones`, data),
  renovarInscripcion: (id, idInscripcion, data) =>
    post(`/api/admin/clientes/${id}/inscripciones/${idInscripcion}/renovar`, data),
  remove: (id) => del(`/api/admin/clientes/${id}`),
};

// ── Admin — Profesores ───────────────────────────────────────────
export const profesoresApi = {
  getAll: () => get("/api/admin/profesores"),
  getById: (id) => get(`/api/admin/profesores/${id}`),
  create: (data) => post("/api/admin/profesores", data),
  update: (id, data) => put(`/api/admin/profesores/${id}`, data),
  getContratos: (id) => get(`/api/admin/profesores/${id}/contratos`),
  getContratoVigente: (id) => get(`/api/admin/profesores/${id}/contrato-vigente`),
  crearContrato: (id, data) => post(`/api/admin/profesores/${id}/contratos`, data),
  getAlumnos: (id) => get(`/api/admin/profesores/${id}/alumnos`),
  setAptoMedico: (id, fecha_entrega) =>
    put(`/api/admin/profesores/${id}/apto-medico`, { fecha_entrega }),
};

// ── Acceso (molinete) ──────────────────────────────────────────────
// La verificación real por huella la dispara el agente local
// (huella-agent-electron) llamando directo al backend — la pantalla del
// kiosko solo escucha el resultado por WebSocket (ver useAgentSocket.js).
export const accesoApi = {
  getHistorial: (idCliente) => get(`/api/acceso/historial/${idCliente}`),
  registrarEntrada: (id_suscripcion) =>
    post("/api/acceso/registrar-entrada", { id_suscripcion }),
};

export const contratosApi = {
  actualizar: (id, data) => patch(`/api/admin/contratos/${id}`, data),
  rescindir: (id, data) => post(`/api/admin/contratos/${id}/rescindir`, data),
  porVencer: (dias = 30) => get(`/api/admin/contratos/por-vencer?dias=${dias}`),
};

// ── Admin — Sueldos ──────────────────────────────────────────────
export const sueldosApi = {
  getSueldos: ({ desde, hasta }) =>
    get(`/api/admin/sueldos?desde=${desde}&hasta=${hasta}`),
  getHistorial: () => get("/api/admin/sueldos/historial"),
  registrarPago: (data) => post("/api/admin/sueldos/pago", data),
  getDetalleProfesor: (profesorId, { desde, hasta }) =>
    get(`/api/admin/sueldos/profesor/${profesorId}?desde=${desde}&hasta=${hasta}`),
  setAsistencia: (id_profesor, marcas) =>
    put("/api/admin/sueldos/asistencia", { id_profesor, marcas }),
};

// ── Admin — Disciplinas (multipart por imagen) ───────────────────
export const disciplinasApi = {
  getAll: () => get("/api/admin/disciplinas"),
  getPublico: () => get("/api/admin/disciplinas/publico"),
  getImagenes: (id) => get(`/api/admin/disciplinas/${id}/imagenes`),
  create: (formData) => postForm("/api/admin/disciplinas", formData),
  update: (id, formData) => putForm(`/api/admin/disciplinas/${id}`, formData),
  updatePrecios: (id, precios, usaPrecioProfesor) =>
    put(`/api/admin/disciplinas/${id}/precios`, { precios, usa_precio_profesor: usaPrecioProfesor }),
  toggleActivo: (id, activo) =>
    put(`/api/admin/disciplinas/${id}/activo`, { activo }),
  addImagen: (id, formData) =>
    postForm(`/api/admin/disciplinas/${id}/imagenes`, formData),
  deleteImagen: (id, imgId) =>
    del(`/api/admin/disciplinas/${id}/imagenes/${imgId}`),
};

// ── Admin — Actividades ──────────────────────────────────────────
export const actividadesApi = {
  getByDisciplina: (id) => get(`/api/admin/actividades?disciplina=${id}`),
  create: (data) => post("/api/admin/actividades", data),
  update: (id, data) => put(`/api/admin/actividades/${id}`, data),
  toggleActivo: (id, activo) =>
    put(`/api/admin/actividades/${id}/activo`, { activo }),
  remove: (id) => del(`/api/admin/actividades/${id}`),
};

// ── Admin — Ejercicios ───────────────────────────────────────────
export const ejerciciosApi = {
  getAll: () => get("/api/admin/ejercicios"),
  create: (data) => post("/api/admin/ejercicios", data),
  update: (id, data) => put(`/api/admin/ejercicios/${id}`, data),
  remove: (id) => del(`/api/admin/ejercicios/${id}`),
};

// ── Admin — Categorías de ejercicio ───────────────────────────────
export const categoriasEjercicioApi = {
  getAll: () => get("/api/admin/categorias-ejercicio"),
  create: (nombre) => post("/api/admin/categorias-ejercicio", { nombre }),
};

// ── Admin — Horarios ─────────────────────────────────────────────
export const horariosApi = {
  getAll: () => get("/api/admin/horarios"),
  getByActividad: (id) => get(`/api/admin/horarios?actividad=${id}`),
  create: (data) => post("/api/admin/horarios", data),
  update: (id, data) => put(`/api/admin/horarios/${id}`, data),
  remove: (id) => del(`/api/admin/horarios/${id}`),
  getCoprofesores: (id) => get(`/api/admin/horarios/${id}/coprofesores`),
  setCoprofesores: (id, idProfesores) =>
    put(`/api/admin/horarios/${id}/coprofesores`, { id_profesores: idProfesores }),
};

// ── Servicios ────────────────────────────────────────────────────
export const serviciosApi = {
  getPublicos: () => get("/api/servicios"),
  getAdmin: () => get("/api/servicios/admin"),
  create: (formData) => postForm("/api/servicios", formData),
  update: (id, formData) => putForm(`/api/servicios/${id}`, formData),
};

// ── Reservas ────────────────────────────────────────────────────
export const reservasApi = {
  disponibles: (dia) => get(`/api/reservas/musculacion/disponibles?dia=${dia}`),
  reservarMuscu: (data) => post("/api/reservas/musculacion", data),
  cancelarMuscu: (id) => del(`/api/reservas/musculacion/${id}`),
  inscripciones: () => get("/api/reservas/inscripciones"),
  inscribir: (data) => post("/api/reservas/inscripciones", data),
};

// ── Horarios públicos ─────────────────────────────────────────────
export const horariosPublicoApi = {
  getHorarios: () => get("/api/horarios"),
  getDisciplinas: () => get("/api/horarios/disciplinas"),
};

// ── Perfil ───────────────────────────────────────────────────────
export const perfilApi = {
  getMe:           ()        => get('/api/perfil/me'),
  update:          (data)    => patch('/api/perfil/me', data),
  getHorariosMus:  ()        => get('/api/perfil/horarios-musculacion'),
  getRutina:       (mes)     => get(`/api/perfil/rutina?mes=${mes}`),
  guardarProgreso: (data)    => post('/api/perfil/progreso', data),
};

// ── Profesor ─────────────────────────────────────────────────────
export const profesorApi = {
  getAlumnos:    ()                => get('/api/profesor/alumnos'),
  getEjercicios: ()                => get('/api/profesor/ejercicios'),
  getRutina:     (id, mes, semana) => get(`/api/profesor/alumnos/${id}/rutina?mes=${mes}&semana=${semana}`),
  guardarRutina: (data)            => post('/api/profesor/rutinas', data),
  getProgreso:   (id, mes)         => get(`/api/profesor/alumnos/${id}/progreso?mes=${mes}`),
  getPerfil:     ()     => get('/api/profesor/perfil'),
  updatePerfil:  (data) => patch('/api/profesor/perfil', data),
}

// ── Admin — Revisiones médicas ─────────────────────────────────────
export const revisionesApi = {
  getAll: ({ pendientes, buscar } = {}) => {
    const params = new URLSearchParams();
    if (pendientes) params.append("pendientes", "true");
    if (buscar) params.append("buscar", buscar);
    const qs = params.toString();
    return get(`/api/admin/revisiones${qs ? `?${qs}` : ""}`);
  },
  getPrecio: () => get("/api/admin/revisiones/precio"),
  setPrecio: (monto) => post("/api/admin/revisiones/precio", { monto }),
};

// ── Médico — Revisiones médicas ───────────────────────────────────
export const medicoApi = {
  getRevisiones: ({ pendientes, buscar } = {}) => {
    const params = new URLSearchParams();
    if (pendientes) params.append("pendientes", "true");
    if (buscar) params.append("buscar", buscar);
    const qs = params.toString();
    return get(`/api/medico/revisiones${qs ? `?${qs}` : ""}`);
  },
  registrar: (data) => post("/api/medico/revisiones", data),
  getHistorialCliente: (id) => get(`/api/medico/clientes/${id}/historial`),
};

// ── Nutricionista — Planes de alimentación ────────────────────────
export const nutricionistaApi = {
  getClientes: ({ buscar } = {}) => {
    const params = new URLSearchParams();
    if (buscar) params.append("buscar", buscar);
    const qs = params.toString();
    return get(`/api/nutricion/clientes${qs ? `?${qs}` : ""}`);
  },
  subirPlan: (formData) => postForm("/api/nutricion/planes", formData),
  getHistorialCliente: (id) => get(`/api/nutricion/clientes/${id}/historial`),
};

// ── Admin — Movimientos (Gastos/Ingresos) ────────────────────────
export const movimientosApi = {
  getAll: (tipo, fecha_desde, fecha_hasta, categoria) => {
    let url = '/api/admin/movimientos'
    const params = new URLSearchParams()
    if (tipo) params.append('tipo', tipo)
    if (fecha_desde) params.append('fecha_desde', fecha_desde)
    if (fecha_hasta) params.append('fecha_hasta', fecha_hasta)
    if (categoria) params.append('categoria', categoria)
    if (params.toString()) url += `?${params.toString()}`
    return get(url)
  },
  getResumen: (fecha_desde, fecha_hasta) => {
    let url = '/api/admin/movimientos/resumen'
    const params = new URLSearchParams()
    if (fecha_desde) params.append('fecha_desde', fecha_desde)
    if (fecha_hasta) params.append('fecha_hasta', fecha_hasta)
    if (params.toString()) url += `?${params.toString()}`
    return get(url)
  },
  getBalanceMensual: () => get('/api/admin/movimientos/balance-mensual'),
  getCategorias: () => get('/api/admin/movimientos/categorias'),
  create: (data) => post('/api/admin/movimientos', data),
  update: (id, data) => put(`/api/admin/movimientos/${id}`, data),
  delete: (id) => del(`/api/admin/movimientos/${id}`),
}

// ── Admin — Matrículas ────────────────────────────────────────────
export const matriculasApi = {
  getAll: ({ paga, anio, disciplina, buscar } = {}) => {
    const params = new URLSearchParams()
    if (paga !== undefined && paga !== '') params.append('paga', paga)
    if (anio) params.append('anio', anio)
    if (disciplina) params.append('disciplina', disciplina)
    if (buscar) params.append('buscar', buscar)
    const qs = params.toString()
    return get(`/api/admin/matriculas${qs ? `?${qs}` : ''}`)
  },
  cobrar: (data) => post('/api/admin/matriculas', data),
  getHistorialCliente: (idCliente) => get(`/api/admin/clientes/${idCliente}/matriculas`),
}

export const matriculaPrecioApi = {
  getAll: ({ disciplina, anio } = {}) => {
    const params = new URLSearchParams()
    if (disciplina) params.append('disciplina', disciplina)
    if (anio) params.append('anio', anio)
    const qs = params.toString()
    return get(`/api/admin/matricula-precio${qs ? `?${qs}` : ''}`)
  },
  set: (data) => post('/api/admin/matricula-precio', data),
}

// ── Admin — Lista de espera ───────────────────────────────────────
export const listaEsperaApi = {
  getAll: ({ disciplina, estado } = {}) => {
    const params = new URLSearchParams()
    if (disciplina) params.append('disciplina', disciplina)
    if (estado) params.append('estado', estado)
    const qs = params.toString()
    return get(`/api/admin/lista-espera${qs ? `?${qs}` : ''}`)
  },
  anotar: (data) => post('/api/admin/lista-espera', data),
  cambiarEstado: (id, data) => patch(`/api/admin/lista-espera/${id}/estado`, data),
  cambiarPrioridad: (id, prioridad) => patch(`/api/admin/lista-espera/${id}/prioridad`, { prioridad }),
  eliminar: (id) => del(`/api/admin/lista-espera/${id}`),
}

export const cuposDisponiblesApi = {
  getAll: (disciplina) => get(`/api/admin/cupos-disponibles${disciplina ? `?disciplina=${disciplina}` : ''}`),
}

// ── Admin — Configuración de la ficha de inscripción ──────────────
export const fichaConfigApi = {
  get: () => get('/api/admin/ficha-config'),
  update: (data) => put('/api/admin/ficha-config', data),
}
