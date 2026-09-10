// Preguntas del acordeón "Historia clínica" — usadas tanto por el formulario
// (FichaInscripcion.jsx) como por el generador de PDF, para que ambos
// muestren siempre las mismas preguntas y el mismo campo de observación.
// [campo (bool), etiqueta, campo de detalle (texto libre)]
export const PREGUNTAS_CLINICA = [
  ['patologiaColumna', 'Patología de columna', 'patologiaColumnaDetalle'],
  ['otrasPatologias', 'Otras patologías óseas', 'otrasPatologiasDetalle'],
  ['enfermedadCardiaca', 'Enfermedades cardíacas', 'enfermedadCardiacaDetalle'],
  ['lesiones', 'Lesiones recientes', 'lesionesDetalle'],
  ['practicaDeportes', 'Practica otros deportes', 'practicaDeportesDetalle'],
  ['mareos', 'Sufre mareos', 'mareosDetalle'],
  ['dolorCabeza', 'Dolor de cabeza frecuente', 'dolorCabezaDetalle'],
  ['desmayos', 'Ha sufrido desmayos', 'desmayosDetalle'],
  ['hemorragiasNasales', 'Hemorragias nasales', 'hemorragiasNasalesDetalle'],
  ['doloresArticulaciones', 'Dolores articulares', 'doloresArticulacionesDetalle'],
  ['piePlano', 'Pie plano u otra alteración', 'piePlanoDetalle'],
  ['problemasRodillaTobillo', 'Problemas de rodilla/tobillo', 'problemasRodillaTobilloDetalle'],
  ['cirugias', 'Intervenciones quirúrgicas', 'cirugiasDetalle'],
  ['convulsiones', 'Convulsiones', 'convulsionesDetalle'],
  ['problemasRespiratorios', 'Problemas respiratorios', 'problemasRespiratoriosDetalle'],
  ['medicacion', 'Toma medicación con frecuencia', 'medicacionDetalle'],
  ['alergico', 'Es alérgico', 'alergicoDetalle'],
]

// Nombre de columna en la tabla ficha_medica para cada campo del formulario.
const COLUMNA_DB = {
  patologiaColumna: 'patologia_columna', patologiaColumnaDetalle: 'patologia_columna_det',
  otrasPatologias: 'otras_patologias', otrasPatologiasDetalle: 'otras_patologias_det',
  enfermedadCardiaca: 'enf_cardiaca', enfermedadCardiacaDetalle: 'enf_cardiaca_det',
  lesiones: 'lesiones', lesionesDetalle: 'lesiones_det',
  practicaDeportes: 'practica_deportes', practicaDeportesDetalle: 'practica_deportes_det',
  mareos: 'mareos', mareosDetalle: 'mareos_det',
  dolorCabeza: 'dolor_cabeza', dolorCabezaDetalle: 'dolor_cabeza_det',
  desmayos: 'desmayos', desmayosDetalle: 'desmayos_det',
  hemorragiasNasales: 'hemorragias_nasales', hemorragiasNasalesDetalle: 'hemorragias_nasales_det',
  doloresArticulaciones: 'dolores_articulaciones', doloresArticulacionesDetalle: 'dolores_articulaciones_det',
  piePlano: 'pie_plano', piePlanoDetalle: 'pie_plano_det',
  problemasRodillaTobillo: 'problemas_rodilla', problemasRodillaTobilloDetalle: 'problemas_rodilla_det',
  cirugias: 'cirugias', cirugiasDetalle: 'cirugias_det',
  convulsiones: 'convulsiones', convulsionesDetalle: 'convulsiones_det',
  problemasRespiratorios: 'problemas_respiratorios', problemasRespiratoriosDetalle: 'problemas_respiratorios_det',
  medicacion: 'medicacion', medicacionDetalle: 'medicacion_det',
  alergico: 'alergico', alergicoDetalle: 'alergico_det',
}

export const FORM_VACIO_CLINICA = {
  altura: '', peso: '', grupoSanguineo: '',
  ...PREGUNTAS_CLINICA.reduce((acc, [campo, , detalle]) => {
    acc[campo] = false
    acc[detalle] = ''
    return acc
  }, {}),
}

// Mapea ficha_medica de la DB (snake_case) al formData (camelCase)
export function mapearFichaDB(f) {
  if (!f) return {}
  const out = {
    altura: f.altura || '',
    peso: f.peso || '',
    grupoSanguineo: f.grupo_sanguineo || '',
  }
  for (const [campo, , detalle] of PREGUNTAS_CLINICA) {
    out[campo] = f[COLUMNA_DB[campo]] || false
    out[detalle] = f[COLUMNA_DB[detalle]] || ''
  }
  return out
}

// Arma el payload que espera el backend (POST /clientes y PUT /:id/ficha-medica)
export function armarFichaMedicaPayload(formData) {
  const payload = {
    altura: formData.altura || null,
    peso: formData.peso || null,
    grupoSanguineo: formData.grupoSanguineo || null,
  }
  for (const [campo, , detalle] of PREGUNTAS_CLINICA) {
    payload[campo] = formData[campo]
    payload[detalle] = formData[detalle] || null
  }
  return payload
}
