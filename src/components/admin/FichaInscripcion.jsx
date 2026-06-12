import { useState, useEffect } from "react";
import { useHuellaEnrollment } from '../../hooks/useHuellaEnrollment'
import HuellaModal from '../HuellaModal'
import Swal from "sweetalert2";
import { clientesApi, disciplinasApi, actividadesApi, horariosApi } from '../../services/api'

const TIPOS_PAGO = ['efectivo', 'transferencia', 'tarjeta', 'mercadopago']
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

const INSC_VACIA = {
  id_disciplina: '', id_actividad: '',
  slots_elegidos: [], paquete_elegido: null, horarios_paquete: [],
  id_horario: null, cantidad_dias: '',
  tipo_pago: 'efectivo', pago: false,
  permiso_salida: false, permiso_fotos_redes: false, precio_calculado: 0,
}

const FORM_VACIO = {
  apellidoNombre: "", dni: "", direccion: "", telefono1: "",
  telefonoEmergencia: "", fechaNacimiento: "",
  altura: "", peso: "", grupoSanguineo: "",
  patologiaColumna: false, otrasPatologias: false, otrasPatologiasDetalle: "",
  enfermedadCardiaca: false, enfermedadCardiacaDetalle: "",
  lesiones: false, lesionesDetalle: "",
  practicaDeportes: false, practicaDeportesDetalle: "",
  mareos: false, dolorCabeza: false, desmayos: false, hemorragiasNasales: false,
  doloresArticulaciones: false, piePlano: false, problemasRodillaTobillo: false,
  cirugias: false, convulsiones: false, problemasRespiratorios: false,
  medicacion: false, medicacionDetalle: "",
  alergico: false, alergicoDetalle: "",
}

// Mapea ficha_medica de la DB (snake_case) al formData (camelCase)
const mapearFichaDB = (f) => !f ? {} : {
  altura: f.altura || '',
  peso: f.peso || '',
  grupoSanguineo: f.grupo_sanguineo || '',
  patologiaColumna: f.patologia_columna || false,
  otrasPatologias: f.otras_patologias || false,
  otrasPatologiasDetalle: f.otras_patologias_det || '',
  enfermedadCardiaca: f.enf_cardiaca || false,
  enfermedadCardiacaDetalle: f.enf_cardiaca_det || '',
  lesiones: f.lesiones || false,
  lesionesDetalle: f.lesiones_det || '',
  practicaDeportes: f.practica_deportes || false,
  practicaDeportesDetalle: f.practica_deportes_det || '',
  mareos: f.mareos || false,
  dolorCabeza: f.dolor_cabeza || false,
  desmayos: f.desmayos || false,
  hemorragiasNasales: f.hemorragias_nasales || false,
  doloresArticulaciones: f.dolores_articulaciones || false,
  piePlano: f.pie_plano || false,
  problemasRodillaTobillo: f.problemas_rodilla || false,
  cirugias: f.cirugias || false,
  convulsiones: f.convulsiones || false,
  problemasRespiratorios: f.problemas_respiratorios || false,
  medicacion: f.medicacion || false,
  medicacionDetalle: f.medicacion_det || '',
  alergico: f.alergico || false,
  alergicoDetalle: f.alergico_det || '',
}

export default function FichaInscripcion({
  onSubmit,
  modoEdicion = false,
  clienteId = null,
  datosIniciales = null,
}) {

  const [templateHuella, setTemplateHuella] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const enroll = useHuellaEnrollment()

  useEffect(() => {
    if (enroll.status === 'done' && enroll.template) setTemplateHuella(enroll.template)
  }, [enroll.status, enroll.template])

  // ── Selectores ─────────────────────────────────────────────────
  const [disciplinas, setDisciplinas] = useState([])
  const [actividades, setActividades] = useState([])
  const [horarios, setHorarios] = useState([])
  const [preciosDisciplina, setPreciosDisciplina] = useState(null)

  // ── Inscripción en construcción ────────────────────────────────
  const [inscActual, setInscActual] = useState(INSC_VACIA)
  const [inscAgregadas, setInscAgregadas] = useState([])
  const [inscExistentes, setInscExistentes] = useState([])

  // ── Form personal ──────────────────────────────────────────────
  const [formData, setFormData] = useState(FORM_VACIO)

  // ── Pre-cargar datos en modo edición ───────────────────────────
  useEffect(() => {
    if (!modoEdicion || !datosIniciales) return

    setFormData({
      ...FORM_VACIO,
      apellidoNombre: datosIniciales.nomap_c || '',
      dni: datosIniciales.dni_u || '',
      direccion: datosIniciales.direccion_c || '',
      telefono1: datosIniciales.telefono_c || '',
      telefonoEmergencia: datosIniciales.tel_emergencia_c || '',
      fechaNacimiento: datosIniciales.fecha_nac_c
        ? datosIniciales.fecha_nac_c.slice(0, 10)
        : '',
      ...mapearFichaDB(datosIniciales.ficha_medica),
    })

    setInscExistentes(datosIniciales.inscripciones || [])
  }, [modoEdicion, datosIniciales])

  // Helpers derivados
  const actividadActual = actividades.find(a => Number(a.id_actividad) === Number(inscActual.id_actividad))
  const esFijo = actividadActual?.tipo_a === 'fijo'
  const paquetes = esFijo && horarios.length > 0
    ? Object.entries(
      horarios.reduce((acc, h) => {
        const hora = h.hora_h?.slice(0, 5) || 'sin hora'
        if (!acc[hora]) acc[hora] = []
        acc[hora].push(h)
        return acc
      }, {})
    )
      .map(([hora, hs]) => ({ hora, horarios: hs, dias: hs.map(h => h.dia_h), cantidad: hs.length }))
      .sort((a, b) => a.hora.localeCompare(b.hora))
    : []

  // ── Cargar disciplinas ──────────────────────────────────────────
  useEffect(() => {
    disciplinasApi.getAll().then(setDisciplinas).catch(console.error)
  }, [])

  useEffect(() => {
    if (!inscActual.id_disciplina || disciplinas.length === 0) {
      setActividades([]); setHorarios([]); setPreciosDisciplina(null)
      setInscActual(prev => ({ ...prev, id_actividad: '', slots_elegidos: [], paquete_elegido: null, horarios_paquete: [], id_horario: null, cantidad_dias: '', precio_calculado: 0 }))
      return
    }
    const disc = disciplinas.find(d => Number(d.id_disciplina) === Number(inscActual.id_disciplina))
    setPreciosDisciplina(disc || null)
    actividadesApi.getByDisciplina(inscActual.id_disciplina)
      .then(data => {
        const unicas = Object.values(data.reduce((acc, a) => { acc[a.id_actividad] = a; return acc }, {}))
        setActividades(unicas)
      }).catch(console.error)
    setInscActual(prev => ({ ...prev, id_actividad: '', slots_elegidos: [], paquete_elegido: null, horarios_paquete: [], id_horario: null, cantidad_dias: '', precio_calculado: 0 }))
  }, [inscActual.id_disciplina, disciplinas])

  useEffect(() => {
    if (!inscActual.id_actividad) {
      setHorarios([])
      setInscActual(prev => ({ ...prev, slots_elegidos: [], paquete_elegido: null, horarios_paquete: [], id_horario: null, cantidad_dias: '', precio_calculado: 0 }))
      return
    }
    horariosApi.getByActividad(inscActual.id_actividad)
      .then(data => {
        setHorarios(data.filter(h => h.cupo_actual < h.cupo_maximo))
        setInscActual(prev => ({ ...prev, slots_elegidos: [], paquete_elegido: null, horarios_paquete: [], id_horario: null, cantidad_dias: '', precio_calculado: 0 }))
      }).catch(console.error)
  }, [inscActual.id_actividad])

  // ── Handlers ───────────────────────────────────────────────────
  const handleCantidadDias = (valor) => {
    const n = parseInt(valor) || 0
    const precio = n > 0 && preciosDisciplina ? Number(preciosDisciplina[`precio_${n}`] || 0) : 0
    if (!esFijo) {
      const slots = Array.from({ length: n }, () => ({ dia: '', id_horario: '' }))
      setInscActual(prev => ({ ...prev, cantidad_dias: valor, slots_elegidos: slots, precio_calculado: precio }))
    } else {
      setInscActual(prev => ({ ...prev, cantidad_dias: valor, precio_calculado: precio }))
    }
  }

  const handlePaqueteElegido = (paq) => {
    const precio = preciosDisciplina ? Number(preciosDisciplina[`precio_${paq.cantidad}`] || 0) : 0
    setInscActual(prev => ({ ...prev, paquete_elegido: paq.hora, horarios_paquete: paq.horarios, cantidad_dias: paq.cantidad, precio_calculado: precio }))
  }

  const handleSlotDia = (idx, dia) => {
    const nuevos = inscActual.slots_elegidos.map((s, i) => i === idx ? { dia, id_horario: '' } : s)
    setInscActual(prev => ({ ...prev, slots_elegidos: nuevos }))
  }

  const handleSlotHorario = (idx, id_horario) => {
    const nuevos = inscActual.slots_elegidos.map((s, i) => i === idx ? { ...s, id_horario } : s)
    setInscActual(prev => ({ ...prev, slots_elegidos: nuevos }))
  }

  const handleAgregarInscripcion = () => {
    if (!inscActual.id_actividad) { alert('Seleccioná una actividad'); return }
    const actividad = actividades.find(a => Number(a.id_actividad) === Number(inscActual.id_actividad))
    const disciplina = disciplinas.find(d => Number(d.id_disciplina) === Number(inscActual.id_disciplina))

    if (esFijo) {
      if (!inscActual.paquete_elegido) { alert('Seleccioná un paquete de horarios'); return }
      const duplicado = inscAgregadas.some(i => i._tipo_a === 'fijo' && Number(i.id_actividad) === Number(inscActual.id_actividad) && i.paquete_elegido === inscActual.paquete_elegido)
      if (duplicado) { alert('Ya agregaste ese paquete'); return }
      const labelHorario = inscActual.horarios_paquete.map(h => `${h.dia_h} ${h.hora_h?.slice(0, 5)}`).join(' / ')
      setInscAgregadas(prev => [...prev, {
        _tipo_a: 'fijo', id_actividad: Number(inscActual.id_actividad),
        horarios_paquete: inscActual.horarios_paquete, paquete_elegido: inscActual.paquete_elegido,
        cantidad_dias: Number(inscActual.cantidad_dias), tipo_pago: inscActual.tipo_pago,
        pago: inscActual.pago, permiso_salida: inscActual.permiso_salida,
        permiso_fotos_redes: inscActual.permiso_fotos_redes, precio_calculado: inscActual.precio_calculado,
        _label_actividad: actividad?.nombre_a, _label_disciplina: disciplina?.nombre_d, _label_horario: labelHorario,
      }])
    } else {
      if (!inscActual.cantidad_dias) { alert('Seleccioná los días por semana'); return }
      if (inscActual.slots_elegidos.some(s => !s.dia || !s.id_horario)) { alert('Completá día y horario para cada entrada'); return }
      const duplicado = inscAgregadas.some(i => inscActual.slots_elegidos.some(s => Number(i.id_horario) === Number(s.id_horario)))
      if (duplicado) { alert('Uno o más horarios ya fueron agregados'); return }
      const nuevas = inscActual.slots_elegidos.map(slot => {
        const horario = horarios.find(h => Number(h.id_horario) === Number(slot.id_horario))
        return {
          _tipo_a: 'variable', id_actividad: Number(inscActual.id_actividad), id_horario: Number(slot.id_horario),
          cantidad_dias: Number(inscActual.cantidad_dias), tipo_pago: inscActual.tipo_pago,
          pago: inscActual.pago, permiso_salida: inscActual.permiso_salida,
          permiso_fotos_redes: inscActual.permiso_fotos_redes, precio_calculado: inscActual.precio_calculado,
          _label_actividad: actividad?.nombre_a, _label_disciplina: disciplina?.nombre_d,
          _label_horario: `${horario?.dia_h} ${horario?.hora_h?.slice(0, 5)}${horario?.profesor_nombre ? ` — ${horario.profesor_nombre}` : ''}`,
        }
      })
      setInscAgregadas(prev => [...prev, ...nuevas])
    }
    setInscActual(INSC_VACIA); setActividades([]); setHorarios([]); setPreciosDisciplina(null)
  }

  const handleQuitarInscripcion = (idx) => setInscAgregadas(prev => prev.filter((_, i) => i !== idx))

  const dni = String(formData.dni || '').trim()
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })
  const handleCheckbox = (e) => setFormData({ ...formData, [e.target.name]: e.target.checked })

  const handleRegistrarHuella = () => {
    if (!dni || dni.length < 7) { alert('Ingresá el DNI antes de registrar la huella'); return }
    setModalOpen(true); enroll.start(dni)
  }
  const handleCloseModal = () => { if (enroll.status !== 'done') enroll.cancel(); setModalOpen(false) }

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const fichaData = {
        altura: formData.altura || null, peso: formData.peso || null,
        grupoSanguineo: formData.grupoSanguineo || null,
        patologiaColumna: formData.patologiaColumna, otrasPatologias: formData.otrasPatologias,
        otrasPatologiasDetalle: formData.otrasPatologiasDetalle || null,
        enfermedadCardiaca: formData.enfermedadCardiaca, enfermedadCardiacaDetalle: formData.enfermedadCardiacaDetalle || null,
        lesiones: formData.lesiones, lesionesDetalle: formData.lesionesDetalle || null,
        practicaDeportes: formData.practicaDeportes, practicaDeportesDetalle: formData.practicaDeportesDetalle || null,
        mareos: formData.mareos, dolorCabeza: formData.dolorCabeza, desmayos: formData.desmayos,
        hemorragiasNasales: formData.hemorragiasNasales, doloresArticulaciones: formData.doloresArticulaciones,
        piePlano: formData.piePlano, problemasRodillaTobillo: formData.problemasRodillaTobillo,
        cirugias: formData.cirugias, convulsiones: formData.convulsiones, problemasRespiratorios: formData.problemasRespiratorios,
        medicacion: formData.medicacion, medicacionDetalle: formData.medicacionDetalle || null,
        alergico: formData.alergico, alergicoDetalle: formData.alergicoDetalle || null,
      }

      if (modoEdicion) {
        // 1. Actualizar datos personales
        await clientesApi.update(clienteId, {
          nombre_apellido: formData.apellidoNombre,
          direccion: formData.direccion || null,
          telefono: formData.telefono1 || null,
          tel_emergencia: formData.telefonoEmergencia || null,
          fecha_nac: formData.fechaNacimiento || null,
        })

        // 2. Upsert ficha médica
        await clientesApi.updateFicha(clienteId, fichaData)

        // 3. Agregar nuevas inscripciones si las hay
        if (inscAgregadas.length > 0) {
          const inscripciones = inscAgregadas.flatMap(i => {
            if (i._tipo_a === 'fijo') {
              return i.horarios_paquete.map(h => ({
                id_actividad: i.id_actividad, id_horario: Number(h.id_horario),
                cantidad_dias: i.cantidad_dias, tipo_pago: i.tipo_pago,
                pago: i.pago, permiso_salida: i.permiso_salida, permiso_fotos_redes: i.permiso_fotos_redes,
              }))
            }
            return [{
              id_actividad: i.id_actividad, id_horario: i.id_horario, cantidad_dias: i.cantidad_dias,
              tipo_pago: i.tipo_pago, pago: i.pago, permiso_salida: i.permiso_salida, permiso_fotos_redes: i.permiso_fotos_redes
            }]
          })
          await clientesApi.addInscripciones(clienteId, { inscripciones })
        }

        Swal.fire('¡Listo!', 'Cliente actualizado correctamente', 'success')
      } else {
        // Crear nuevo cliente
        const inscripciones = inscAgregadas.flatMap(i => {
          if (i._tipo_a === 'fijo') {
            return i.horarios_paquete.map(h => ({
              id_actividad: i.id_actividad, id_horario: Number(h.id_horario),
              cantidad_dias: i.cantidad_dias, tipo_pago: i.tipo_pago,
              pago: i.pago, permiso_salida: i.permiso_salida, permiso_fotos_redes: i.permiso_fotos_redes,
            }))
          }
          return [{
            id_actividad: i.id_actividad, id_horario: i.id_horario, cantidad_dias: i.cantidad_dias,
            tipo_pago: i.tipo_pago, pago: i.pago, permiso_salida: i.permiso_salida, permiso_fotos_redes: i.permiso_fotos_redes
          }]
        })
        const data = await clientesApi.create({
          dni: parseInt(formData.dni, 10), nombre_apellido: formData.apellidoNombre,
          direccion: formData.direccion || undefined, telefono: formData.telefono1 || undefined,
          tel_emergencia: formData.telefonoEmergencia || undefined, fecha_nac: formData.fechaNacimiento || undefined,
          template_huella: templateHuella || undefined, contrasena: String(formData.dni),
          ficha_medica: fichaData, inscripciones,
        })
        Swal.fire('¡Listo!', `Cliente ${data.nombre_apellido} guardado`, 'success')
      }

      if (onSubmit) onSubmit()
    } catch (err) {
      Swal.fire('Error', err.message || 'No se pudo guardar', 'error')
      console.error(err)
    }
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <form className="card p-4 shadow-sm" onSubmit={handleSubmit}>
      <h4 className="fw-bold mb-4 text-center">
        {modoEdicion ? 'Editar Cliente' : 'Ficha de Datos Cliente'}
      </h4>

      <div className="accordion accordion-flush" id="accordionInscripcion">

        {/* ── DATOS PERSONALES ── */}
        <div className="accordion-item">
          <h2 className="accordion-header">
            <button className="accordion-button" type="button"
              data-bs-toggle="collapse" data-bs-target="#datosPersonales">
              <i className="ri-user-line me-2"></i> Datos personales
            </button>
          </h2>
          <div id="datosPersonales" className="accordion-collapse collapse show"
            data-bs-parent="#accordionInscripcion">
            <div className="accordion-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Apellido y Nombre</label>
                  <input type="text" className="form-control" name="apellidoNombre"
                    value={formData.apellidoNombre} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">DNI</label>
                  <input type="number" className="form-control" name="dni"
                    value={formData.dni} onChange={handleChange}
                    disabled={modoEdicion} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Dirección</label>
                <input type="text" className="form-control" name="direccion"
                  value={formData.direccion} onChange={handleChange} />
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Teléfono</label>
                  <input type="tel" className="form-control" name="telefono1"
                    value={formData.telefono1} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Teléfono de emergencia</label>
                  <input type="tel" className="form-control" name="telefonoEmergencia"
                    value={formData.telefonoEmergencia} onChange={handleChange} />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Fecha de nacimiento</label>
                  <input type="date" className="form-control" name="fechaNacimiento"
                    value={formData.fechaNacimiento} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── PLAN CONTRATADO ── */}
        <div className="accordion-item">
          <h2 className="accordion-header">
            <button className="accordion-button collapsed" type="button"
              data-bs-toggle="collapse" data-bs-target="#plan">
              <i className="ri-vip-crown-line me-2"></i> Plan contratado
            </button>
          </h2>
          <div id="plan" className="accordion-collapse collapse"
            data-bs-parent="#accordionInscripcion">
            <div className="accordion-body">

              {/* Inscripciones existentes (solo en modo edición) */}
              {modoEdicion && inscExistentes.length > 0 && (
                <div className="mb-4">
                  <p className="fw-semibold mb-2">Inscripciones actuales:</p>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Disciplina</th>
                          <th>Actividad</th>
                          <th>Horario</th>
                          <th>Días/sem</th>
                          <th>Entradas</th>
                          <th>Cuota</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inscExistentes.map(i => (
                          <tr key={i.id_inscripto}>
                            <td>{i.nombre_d}</td>
                            <td>{i.nombre_a}</td>
                            <td>{i.dia_h && i.hora_h ? `${i.dia_h} ${i.hora_h.slice(0, 5)}` : '—'}</td>
                            <td>{i.cantidad_dias ?? '—'}</td>
                            <td>{i.entradas_restantes != null ? `${i.entradas_restantes}/${i.entradas_totales}` : '—'}</td>
                            <td>
                              <span className={`badge ${i.pago_s ? 'bg-success' : 'bg-danger'}`}>
                                {i.pago_s ? 'Sí' : 'No'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <hr />
                  <p className="fw-semibold mb-2 mt-3">Agregar nueva inscripción:</p>
                </div>
              )}

              {/* Disciplina y Actividad */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Disciplina</label>
                  <select className="form-select" value={inscActual.id_disciplina}
                    onChange={e => setInscActual(prev => ({ ...prev, id_disciplina: e.target.value }))}>
                    <option value="">Seleccionar disciplina</option>
                    {disciplinas.filter(d => d.activo_d).map(d => (
                      <option key={d.id_disciplina} value={d.id_disciplina}>{d.nombre_d}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Actividad</label>
                  <select className="form-select" value={inscActual.id_actividad}
                    disabled={!inscActual.id_disciplina}
                    onChange={e => setInscActual(prev => ({ ...prev, id_actividad: e.target.value }))}>
                    <option value="">Seleccionar actividad</option>
                    {actividades.filter(a => a.activo_a).map(a => (
                      <option key={a.id_actividad} value={a.id_actividad}>{a.nombre_a}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ── FLUJO VARIABLE ── */}
              {inscActual.id_actividad && !esFijo && (
                <>
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Días por semana</label>
                      <select className="form-select" value={inscActual.cantidad_dias}
                        onChange={e => handleCantidadDias(e.target.value)}>
                        <option value="">Seleccionar</option>
                        {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} día{n > 1 ? 's' : ''}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Valor mensual</label>
                      <input type="text" className="form-control" disabled
                        value={inscActual.precio_calculado ? `$${inscActual.precio_calculado.toLocaleString('es-AR')}` : ''} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Tipo de pago</label>
                      <select className="form-select" value={inscActual.tipo_pago}
                        onChange={e => setInscActual(prev => ({ ...prev, tipo_pago: e.target.value }))}>
                        {TIPOS_PAGO.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  {inscActual.slots_elegidos.length > 0 && (
                    <>
                      <div className="row fw-semibold small text-muted mb-1">
                        <div className="col">Día</div>
                        <div className="col">Horario disponible</div>
                      </div>
                      {inscActual.slots_elegidos.map((slot, idx) => {
                        const diasUsados = inscActual.slots_elegidos.filter((_, i) => i !== idx).map(s => s.dia).filter(Boolean)
                        const horariosDelDia = horarios.filter(h => h.dia_h === slot.dia)
                        return (
                          <div className="row mb-2 align-items-center" key={idx}>
                            <div className="col">
                              <select className="form-select" value={slot.dia}
                                onChange={e => handleSlotDia(idx, e.target.value)}>
                                <option value="">Día {idx + 1}</option>
                                {DIAS_SEMANA.filter(d => !diasUsados.includes(d)).map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                            </div>
                            <div className="col">
                              <select className="form-select" value={slot.id_horario} disabled={!slot.dia}
                                onChange={e => handleSlotHorario(idx, e.target.value)}>
                                <option value="">Seleccionar hora</option>
                                {horariosDelDia.map(h => (
                                  <option key={h.id_horario} value={h.id_horario}>
                                    {h.hora_h?.slice(0, 5)}{h.profesor_nombre ? ` — ${h.profesor_nombre}` : ''}{` (${h.cupo_actual}/${h.cupo_maximo})`}
                                  </option>
                                ))}
                                {slot.dia && horariosDelDia.length === 0 && <option disabled>Sin horarios con cupo</option>}
                              </select>
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                </>
              )}

              {/* ── FLUJO FIJO ── */}
              {inscActual.id_actividad && esFijo && (
                <>
                  {paquetes.length === 0 ? (
                    <div className="alert alert-warning py-2 mb-3">
                      <small><i className="ri-error-warning-line me-1"></i> Esta actividad no tiene horarios cargados.</small>
                    </div>
                  ) : (
                    <>
                      <label className="form-label fw-semibold mb-2">Seleccioná un paquete de horarios</label>
                      {paquetes.map((paq, idx) => {
                        const precio = preciosDisciplina ? Number(preciosDisciplina[`precio_${paq.cantidad}`] || 0) : 0
                        const seleccionado = inscActual.paquete_elegido === paq.hora
                        return (
                          <div key={idx}
                            className={`border rounded p-3 mb-2 ${seleccionado ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                            style={{ cursor: 'pointer' }} onClick={() => handlePaqueteElegido(paq)}>
                            <div className="form-check mb-0">
                              <input type="radio" className="form-check-input" readOnly checked={seleccionado} />
                              <label className="form-check-label ms-1" style={{ cursor: 'pointer' }}>
                                <strong>{paq.cantidad} día{paq.cantidad > 1 ? 's' : ''}</strong>
                                <span className="text-muted ms-2">{paq.dias.join(', ')}</span>
                                <span className="ms-2 text-secondary">— {paq.hora}hs</span>
                                {precio > 0 && <span className="ms-3 badge bg-success">${precio.toLocaleString('es-AR')}</span>}
                              </label>
                            </div>
                          </div>
                        )
                      })}
                      {inscActual.paquete_elegido && (
                        <div className="col-md-4 mt-3">
                          <label className="form-label">Tipo de pago</label>
                          <select className="form-select" value={inscActual.tipo_pago}
                            onChange={e => setInscActual(prev => ({ ...prev, tipo_pago: e.target.value }))}>
                            {TIPOS_PAGO.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Permisos */}
              {inscActual.id_actividad && !!inscActual.cantidad_dias && (
                <div className="row mt-3 mb-3">
                  <div className="col-auto">
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" checked={inscActual.pago}
                        onChange={e => setInscActual(prev => ({ ...prev, pago: e.target.checked }))} />
                      <label className="form-check-label">Pago recibido</label>
                    </div>
                  </div>
                  <div className="col-auto">
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" checked={inscActual.permiso_salida}
                        onChange={e => setInscActual(prev => ({ ...prev, permiso_salida: e.target.checked }))} />
                      <label className="form-check-label">Permiso de salida</label>
                    </div>
                  </div>
                  <div className="col-auto">
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" checked={inscActual.permiso_fotos_redes}
                        onChange={e => setInscActual(prev => ({ ...prev, permiso_fotos_redes: e.target.checked }))} />
                      <label className="form-check-label">Permiso fotos/redes</label>
                    </div>
                  </div>
                </div>
              )}

              <button type="button" className="btn btn-admin mt-1"
                onClick={handleAgregarInscripcion}
                disabled={
                  !inscActual.id_actividad ||
                  (esFijo && !inscActual.paquete_elegido) ||
                  (!esFijo && (!inscActual.cantidad_dias || inscActual.slots_elegidos.some(s => !s.dia || !s.id_horario)))
                }>
                <i className="ri-add-line me-1"></i> Agregar actividad
              </button>

              {inscAgregadas.length > 0 && (
                <div className="mt-3">
                  <hr />
                  <p className="fw-semibold mb-2">Actividades a inscribir:</p>
                  {inscAgregadas.map((i, idx) => (
                    <div key={idx} className="d-flex justify-content-between align-items-center border rounded px-3 py-2 mb-2 bg-light">
                      <div>
                        <span className="fw-semibold">{i._label_disciplina}</span>
                        <span className="text-muted mx-1">›</span>
                        <span>{i._label_actividad}</span>
                        {i._label_horario && <><span className="text-muted mx-1">—</span><span className="small text-muted">{i._label_horario}</span></>}
                        {i._tipo_a === 'fijo' && <><span className="text-muted mx-2">|</span><span className="small">{i.cantidad_dias} día{i.cantidad_dias > 1 ? 's' : ''}/sem</span></>}
                        {i.precio_calculado > 0 && <span className="ms-2 badge bg-success">${Number(i.precio_calculado).toLocaleString('es-AR')}</span>}
                      </div>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleQuitarInscripcion(idx)}>
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── HISTORIA CLÍNICA ── */}
        <div className="accordion-item">
          <h2 className="accordion-header">
            <button className="accordion-button collapsed" type="button"
              data-bs-toggle="collapse" data-bs-target="#clinica">
              <i className="ri-heart-pulse-line me-2"></i> Historia clínica
            </button>
          </h2>
          <div id="clinica" className="accordion-collapse collapse" data-bs-parent="#accordionInscripcion">
            <div className="accordion-body">
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Altura (m)</label>
                  <input type="number" step="0.01" className="form-control" name="altura"
                    value={formData.altura} onChange={handleChange} placeholder="1.75" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Peso (kg)</label>
                  <input type="number" step="0.1" className="form-control" name="peso"
                    value={formData.peso} onChange={handleChange} placeholder="70" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Grupo sanguíneo</label>
                  <select className="form-select" name="grupoSanguineo" value={formData.grupoSanguineo} onChange={handleChange}>
                    <option value="">Seleccionar</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <label className="mb-3 fw-semibold">Marque lo que corresponda:</label>
              <div className="row">
                {[
                  ['patologiaColumna', 'Patología de columna', false],
                  ['otrasPatologias', 'Otras patologías óseas', 'otrasPatologiasDetalle'],
                  ['enfermedadCardiaca', 'Enfermedades cardíacas', 'enfermedadCardiacaDetalle'],
                  ['lesiones', 'Lesiones recientes', 'lesionesDetalle'],
                  ['practicaDeportes', 'Practica otros deportes', 'practicaDeportesDetalle'],
                  ['mareos', 'Sufre mareos', false],
                  ['dolorCabeza', 'Dolor de cabeza frecuente', false],
                  ['desmayos', 'Ha sufrido desmayos', false],
                  ['hemorragiasNasales', 'Hemorragias nasales', false],
                  ['doloresArticulaciones', 'Dolores articulares', false],
                  ['piePlano', 'Pie plano u otra alteración', false],
                  ['problemasRodillaTobillo', 'Problemas de rodilla/tobillo', false],
                  ['cirugias', 'Intervenciones quirúrgicas', false],
                  ['convulsiones', 'Convulsiones', false],
                  ['problemasRespiratorios', 'Problemas respiratorios', false],
                  ['medicacion', 'Toma medicación con frecuencia', 'medicacionDetalle'],
                  ['alergico', 'Es alérgico', 'alergicoDetalle'],
                ].map(([name, label, detalle]) => (
                  <div className="col-12 col-md-6 mb-3" key={name}>
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input"
                        name={name} checked={formData[name]} onChange={handleCheckbox} />
                      <label className="form-check-label">{label}</label>
                    </div>
                    {detalle && formData[name] && (
                      <input type="text" className="form-control mt-2" placeholder="Especifique"
                        name={detalle} value={formData[detalle]} onChange={handleChange} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── DATOS BIOMÉTRICOS ── */}
        {!modoEdicion && (
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button className="accordion-button collapsed" type="button"
                data-bs-toggle="collapse" data-bs-target="#huella">
                <i className="ri-fingerprint-line"></i> Datos Biométricos
              </button>
            </h2>
            <div id="huella" className="accordion-collapse collapse" data-bs-parent="#accordionInscripcion">
              <div className="accordion-body">
                <button type="button" className="btn btn-principal"
                  onClick={handleRegistrarHuella} disabled={!dni || dni.length < 7}>
                  {templateHuella ? '✓ Huella registrada (volver a capturar)' : 'Registrar huella'}
                </button>
                <div className="mt-3" hidden>
                  <textarea className="form-control" rows={3} readOnly value={templateHuella}
                    style={{ fontFamily: 'monospace', fontSize: '.72rem', background: '#f8f9fa' }} />
                </div>
              </div>
            </div>
            <HuellaModal isOpen={modalOpen} status={enroll.status} step={enroll.step}
              error={enroll.error} onClose={handleCloseModal} onRetry={() => enroll.start(dni)} />
          </div>
        )}

      </div>

      <div className="d-flex justify-content-end mt-4 gap-2">
        {!modoEdicion && <button type="reset" className="btn btn-outline-secondary">Limpiar</button>}
        <button type="submit" className="btn btn-success">
          {modoEdicion ? 'Guardar cambios' : 'Guardar inscripción'}
        </button>
      </div>
    </form>
  )
}