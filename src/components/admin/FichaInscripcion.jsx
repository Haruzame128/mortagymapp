import { useState, useEffect } from "react";

import { useHuellaEnrollment } from '../../hooks/useHuellaEnrollment'
import HuellaModal from '../HuellaModal'

import { clientesApi, disciplinasApi, actividadesApi, horariosApi } from '../../services/api'

const TIPOS_PAGO = ['efectivo', 'transferencia', 'tarjeta', 'mercadopago']
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

const INSC_VACIA = {
  id_disciplina: '',
  id_actividad: '',
  slots_elegidos: [],   // [{ dia: '', id_horario: '' }, ...]  — solo para variable
  id_horario: null, // solo para fijo
  cantidad_dias: '',
  tipo_pago: 'efectivo',
  pago: false,
  permiso_salida: false,
  permiso_fotos_redes: false,
  precio_calculado: 0,
}

export default function FichaInscripcion({ onSubmit }) {

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

  // Helpers derivados
  const actividadActual = actividades.find(a => Number(a.id_actividad) === Number(inscActual.id_actividad))
  const esFijo = actividadActual?.tipo_a === 'fijo'
  const diasDisponibles = esFijo ? [...new Set(horarios.map(h => h.dia_h))] : []

  // ── Cargar disciplinas ──────────────────────────────────────────
  useEffect(() => {
    disciplinasApi.getAll().then(setDisciplinas).catch(console.error)
  }, [])

  // ── Cargar actividades al cambiar disciplina ────────────────────
  useEffect(() => {
    if (!inscActual.id_disciplina) {
      setActividades([]); setHorarios([]); setPreciosDisciplina(null)
      setInscActual(prev => ({ ...prev, id_actividad: '', slots_elegidos: [], id_horario: null, cantidad_dias: '', precio_calculado: 0 }))
      return
    }
    const disc = disciplinas.find(d => Number(d.id_disciplina) === Number(inscActual.id_disciplina))
    setPreciosDisciplina(disc || null)
    actividadesApi.getByDisciplina(inscActual.id_disciplina)
      .then(data => {
        const unicas = Object.values(data.reduce((acc, a) => { acc[a.id_actividad] = a; return acc }, {}))
        setActividades(unicas)
      }).catch(console.error)
    setInscActual(prev => ({ ...prev, id_actividad: '', slots_elegidos: [], id_horario: null, cantidad_dias: '', precio_calculado: 0 }))
  }, [inscActual.id_disciplina, disciplinas])

  // ── Cargar horarios al cambiar actividad ────────────────────────
  useEffect(() => {
    if (!inscActual.id_actividad) {
      setHorarios([])
      setInscActual(prev => ({ ...prev, slots_elegidos: [], id_horario: null, cantidad_dias: '', precio_calculado: 0 }))
      return
    }
    horariosApi.getByActividad(inscActual.id_actividad)
      .then(data => {
        const disponibles = data.filter(h => h.cupo_actual < h.cupo_maximo)
        setHorarios(disponibles)

        // Para actividades fijas: setear cantidad_dias automáticamente
        const act = actividades.find(a => Number(a.id_actividad) === Number(inscActual.id_actividad))
        if (act?.tipo_a === 'fijo') {
          const diasUnicos = [...new Set(disponibles.map(h => h.dia_h))].length
          const disc = disciplinas.find(d => Number(d.id_disciplina) === Number(inscActual.id_disciplina))
          const precio = disc ? Number(disc[`precio_${diasUnicos}`] || 0) : 0
          setInscActual(prev => ({ ...prev, slots_elegidos: [], id_horario: null, cantidad_dias: diasUnicos, precio_calculado: precio }))
        } else {
          setInscActual(prev => ({ ...prev, slots_elegidos: [], id_horario: null, cantidad_dias: '', precio_calculado: 0 }))
        }
      }).catch(console.error)
  }, [inscActual.id_actividad])

  // ── Calcular precio al cambiar cantidad_dias ────────────────────
  /* useEffect(() => {
    if (!inscActual.cantidad_dias || !preciosDisciplina) {
      setInscActual(prev => ({ ...prev, precio_calculado: 0 }))
      return
    }
    const n = Number(inscActual.cantidad_dias)
    setInscActual(prev => ({ ...prev, precio_calculado: preciosDisciplina[`precio_${n}`] || 0 }))
  }, [inscActual.cantidad_dias, preciosDisciplina]) */

  // ── Handler: cambia cantidad_dias ───────────────────────────────
  const handleCantidadDias = (valor) => {
    const n = parseInt(valor) || 0
    const precio = n > 0 && preciosDisciplina
      ? Number(preciosDisciplina[`precio_${n}`] || 0)
      : 0

    if (!esFijo) {
      const slots = Array.from({ length: n }, () => ({ dia: '', id_horario: '' }))
      setInscActual(prev => ({ ...prev, cantidad_dias: valor, slots_elegidos: slots, precio_calculado: precio }))
    } else {
      setInscActual(prev => ({ ...prev, cantidad_dias: valor, precio_calculado: precio }))
    }
  }

  // ── Handler: cambia día de un slot ──────────────────────────────
  const handleSlotDia = (idx, dia) => {
    const nuevos = inscActual.slots_elegidos.map((s, i) =>
      i === idx ? { dia, id_horario: '' } : s  // resetear horario al cambiar día
    )
    setInscActual(prev => ({ ...prev, slots_elegidos: nuevos }))
  }

  // ── Handler: cambia horario de un slot ──────────────────────────
  const handleSlotHorario = (idx, id_horario) => {
    const nuevos = inscActual.slots_elegidos.map((s, i) =>
      i === idx ? { ...s, id_horario } : s
    )
    setInscActual(prev => ({ ...prev, slots_elegidos: nuevos }))
  }

  // ── Agregar inscripción ────────────────────────────────────────
  const handleAgregarInscripcion = () => {
    if (!inscActual.id_actividad || !inscActual.cantidad_dias) {
      alert('Completá actividad y días por semana'); return
    }

    if (!esFijo) {
      // Validar que todos los slots tengan día y horario
      const incompleto = inscActual.slots_elegidos.some(s => !s.dia || !s.id_horario)
      if (incompleto) { alert('Completá día y horario para cada entrada'); return }

      // Verificar duplicados con inscripciones ya agregadas
      const duplicado = inscAgregadas.some(i =>
        inscActual.slots_elegidos.some(s => Number(i.id_horario) === Number(s.id_horario))
      )
      if (duplicado) { alert('Uno o más horarios ya fueron agregados'); return }
    } else {
      // Para fijo: verificar que no esté ya inscripta en la misma actividad
      if (inscAgregadas.some(i => Number(i.id_actividad) === Number(inscActual.id_actividad) && i._tipo_a === 'fijo')) {
        alert('Ya agregaste esa actividad'); return
      }
    }

    const actividad = actividades.find(a => Number(a.id_actividad) === Number(inscActual.id_actividad))
    const disciplina = disciplinas.find(d => Number(d.id_disciplina) === Number(inscActual.id_disciplina))

    if (!esFijo) {
      // Una entrada por slot
      const nuevas = inscActual.slots_elegidos.map(slot => {
        const horario = horarios.find(h => Number(h.id_horario) === Number(slot.id_horario))
        return {
          id_actividad: Number(inscActual.id_actividad),
          id_horario: Number(slot.id_horario),
          cantidad_dias: Number(inscActual.cantidad_dias),
          tipo_pago: inscActual.tipo_pago,
          pago: inscActual.pago,
          permiso_salida: inscActual.permiso_salida,
          permiso_fotos_redes: inscActual.permiso_fotos_redes,
          precio_calculado: inscActual.precio_calculado,
          _label_actividad: actividad?.nombre_a,
          _label_disciplina: disciplina?.nombre_d,
          _label_horario: `${horario?.dia_h} ${horario?.hora_h?.slice(0, 5)}${horario?.profesor_nombre ? ` — ${horario.profesor_nombre}` : ''}`,
          _tipo_a: 'variable',
          _grupo: crypto.randomUUID(),
        }
      })
      setInscAgregadas(prev => [...prev, ...nuevas])
    } else {
      // Una sola entrada para actividad fija
      setInscAgregadas(prev => [...prev, {
        id_actividad: Number(inscActual.id_actividad),
        id_horario: null,
        cantidad_dias: Number(inscActual.cantidad_dias),
        tipo_pago: inscActual.tipo_pago,
        pago: inscActual.pago,
        permiso_salida: inscActual.permiso_salida,
        permiso_fotos_redes: inscActual.permiso_fotos_redes,
        precio_calculado: inscActual.precio_calculado,
        _label_actividad: actividad?.nombre_a,
        _label_disciplina: disciplina?.nombre_d,
        _label_horario: diasDisponibles.join(' / '),
        _tipo_a: 'fijo',
      }])
    }

    setInscActual(INSC_VACIA)
    setActividades([]); setHorarios([]); setPreciosDisciplina(null)
  }

  const handleQuitarInscripcion = (idx) => {
    setInscAgregadas(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Form personal ──────────────────────────────────────────────
  const [formData, setFormData] = useState({
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
  })

  const dni = String(formData.dni || '').trim()
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })
  const handleCheckbox = (e) => setFormData({ ...formData, [e.target.name]: e.target.checked })

  const handleRegistrarHuella = () => {
    if (!dni || dni.length < 7) { alert('Ingresá el DNI antes de registrar la huella'); return }
    setModalOpen(true); enroll.start(dni)
  }
  const handleCloseModal = () => {
    if (enroll.status !== 'done') enroll.cancel()
    setModalOpen(false)
  }

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = await clientesApi.create({
        dni: parseInt(formData.dni, 10),
        nombre_apellido: formData.apellidoNombre,
        direccion: formData.direccion || undefined,
        telefono: formData.telefono1 || undefined,
        tel_emergencia: formData.telefonoEmergencia || undefined,
        fecha_nac: formData.fechaNacimiento || undefined,
        template_huella: templateHuella || undefined,
        contrasena: String(formData.dni),

        ficha_medica: {
          altura: formData.altura || null,
          peso: formData.peso || null,
          grupoSanguineo: formData.grupoSanguineo || null,
          patologiaColumna: formData.patologiaColumna,
          otrasPatologias: formData.otrasPatologias,
          otrasPatologiasDetalle: formData.otrasPatologiasDetalle || null,
          enfermedadCardiaca: formData.enfermedadCardiaca,
          enfermedadCardiacaDetalle: formData.enfermedadCardiacaDetalle || null,
          lesiones: formData.lesiones,
          lesionesDetalle: formData.lesionesDetalle || null,
          practicaDeportes: formData.practicaDeportes,
          practicaDeportesDetalle: formData.practicaDeportesDetalle || null,
          mareos: formData.mareos,
          dolorCabeza: formData.dolorCabeza,
          desmayos: formData.desmayos,
          hemorragiasNasales: formData.hemorragiasNasales,
          doloresArticulaciones: formData.doloresArticulaciones,
          piePlano: formData.piePlano,
          problemasRodillaTobillo: formData.problemasRodillaTobillo,
          cirugias: formData.cirugias,
          convulsiones: formData.convulsiones,
          problemasRespiratorios: formData.problemasRespiratorios,
          medicacion: formData.medicacion,
          medicacionDetalle: formData.medicacionDetalle || null,
          alergico: formData.alergico,
          alergicoDetalle: formData.alergicoDetalle || null,
        },

        inscripciones: inscAgregadas.map(i => ({
          id_actividad: i.id_actividad,
          id_horario: i.id_horario,
          cantidad_dias: i.cantidad_dias,
          tipo_pago: i.tipo_pago,
          pago: i.pago,
          permiso_salida: i.permiso_salida,
          permiso_fotos_redes: i.permiso_fotos_redes,
        })),
      })

      alert(`✓ Cliente ${data.nombre_apellido} guardado (DNI ${data.dni})`)
      if (onSubmit) onSubmit(formData)
    } catch (err) {
      alert(err.message || 'No se pudo guardar el cliente')
      console.error(err)
    }
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <form className="card p-4 shadow-sm" onSubmit={handleSubmit}>
      <h4 className="fw-bold mb-4 text-center">Ficha de Datos Cliente</h4>

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
                    value={formData.dni} onChange={handleChange} />
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

              {/* Disciplina y Actividad */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Disciplina</label>
                  <select className="form-select"
                    value={inscActual.id_disciplina}
                    onChange={e => setInscActual(prev => ({ ...prev, id_disciplina: e.target.value }))}>
                    <option value="">Seleccionar disciplina</option>
                    {disciplinas.filter(d => d.activo_d).map(d => (
                      <option key={d.id_disciplina} value={d.id_disciplina}>{d.nombre_d}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Actividad</label>
                  <select className="form-select"
                    value={inscActual.id_actividad}
                    disabled={!inscActual.id_disciplina}
                    onChange={e => setInscActual(prev => ({ ...prev, id_actividad: e.target.value }))}>
                    <option value="">Seleccionar actividad</option>
                    {actividades.filter(a => a.activo_a).map(a => (
                      <option key={a.id_actividad} value={a.id_actividad}>{a.nombre_a}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ── FLUJO VARIABLE (Musculación) ── */}
              {inscActual.id_actividad && !esFijo && (
                <>
                  {/* Paso 1: elegir cantidad de días */}
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Días por semana</label>
                      <select className="form-select"
                        value={inscActual.cantidad_dias}
                        onChange={e => handleCantidadDias(e.target.value)}>
                        <option value="">Seleccionar</option>
                        {[1, 2, 3, 4, 5, 6].map(n => (
                          <option key={n} value={n}>{n} día{n > 1 ? 's' : ''}</option>
                        ))}
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

                  {/* Paso 2: un selector por cada día elegido */}
                  {inscActual.slots_elegidos.length > 0 && (
                    <>
                      <div className="row fw-semibold small text-muted mb-1">
                        <div className="col">Día</div>
                        <div className="col">Horario disponible</div>
                      </div>
                      {inscActual.slots_elegidos.map((slot, idx) => {
                        const diasUsados = inscActual.slots_elegidos
                          .filter((_, i) => i !== idx).map(s => s.dia).filter(Boolean)
                        const horariosDelDia = horarios.filter(h => h.dia_h === slot.dia)

                        return (
                          <div className="row mb-2 align-items-center" key={idx}>
                            <div className="col">
                              <select className="form-select"
                                value={slot.dia}
                                onChange={e => handleSlotDia(idx, e.target.value)}>
                                <option value="">Día {idx + 1}</option>
                                {DIAS_SEMANA
                                  .filter(d => !diasUsados.includes(d))
                                  .map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                            </div>
                            <div className="col">
                              <select className="form-select"
                                value={slot.id_horario}
                                disabled={!slot.dia}
                                onChange={e => handleSlotHorario(idx, e.target.value)}>
                                <option value="">Seleccionar hora</option>
                                {horariosDelDia.map(h => (
                                  <option key={h.id_horario} value={h.id_horario}>
                                    {h.hora_h?.slice(0, 5)}
                                    {h.profesor_nombre ? ` — ${h.profesor_nombre}` : ''}
                                    {` (${h.cupo_actual}/${h.cupo_maximo})`}
                                  </option>
                                ))}
                                {slot.dia && horariosDelDia.length === 0 && (
                                  <option disabled>Sin horarios con cupo</option>
                                )}
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
                  {horarios.length > 0 ? (
                    <div className="alert alert-info py-2 mb-3">
                      <small>
                        <i className="ri-calendar-line me-1"></i>
                        <strong>Días:</strong> {horarios.map(h => `${h.dia_h} ${h.hora_h?.slice(0,5)}`).join(' — ')}
                        <span className="ms-2 text-muted">({diasDisponibles.length} día{diasDisponibles.length > 1 ? 's' : ''} por semana)</span>
                      </small>
                    </div>
                  ) : (
                    <div className="alert alert-warning py-2 mb-3">
                      <small><i className="ri-error-warning-line me-1"></i> Esta actividad no tiene horarios cargados.</small>
                    </div>
                  )}

                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Días por semana</label>
                      <input type="text" className="form-control" disabled
                        value={inscActual.cantidad_dias ? `${inscActual.cantidad_dias} día${inscActual.cantidad_dias > 1 ? 's' : ''}` : ''} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Valor mensual</label>
                      <input type="text" className="form-control" disabled
                        value={inscActual.precio_calculado ? `$${Number(inscActual.precio_calculado).toLocaleString('es-AR')}` : ''} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Tipo de pago</label>
                      <select className="form-select" value={inscActual.tipo_pago}
                        onChange={e => setInscActual(prev => ({ ...prev, tipo_pago: e.target.value }))}>
                        {TIPOS_PAGO.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Permisos — visibles cuando hay actividad y días elegidos */}
              {inscActual.id_actividad && !!inscActual.cantidad_dias && (
                <div className="row mb-3">
                  <div className="col-auto">
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input"
                        checked={inscActual.pago}
                        onChange={e => setInscActual(prev => ({ ...prev, pago: e.target.checked }))} />
                      <label className="form-check-label">Pago recibido</label>
                    </div>
                  </div>
                  <div className="col-auto">
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input"
                        checked={inscActual.permiso_salida}
                        onChange={e => setInscActual(prev => ({ ...prev, permiso_salida: e.target.checked }))} />
                      <label className="form-check-label">Permiso de salida</label>
                    </div>
                  </div>
                  <div className="col-auto">
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input"
                        checked={inscActual.permiso_fotos_redes}
                        onChange={e => setInscActual(prev => ({ ...prev, permiso_fotos_redes: e.target.checked }))} />
                      <label className="form-check-label">Permiso fotos/redes</label>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón agregar */}
              <button type="button" className="btn btn-admin"
                onClick={handleAgregarInscripcion}
                disabled={
                  !inscActual.id_actividad ||
                  !inscActual.cantidad_dias ||
                  (!esFijo && inscActual.slots_elegidos.some(s => !s.dia || !s.id_horario))
                }>
                <i className="ri-add-line me-1"></i> Agregar actividad
              </button>

              {/* Lista de inscripciones agregadas */}
              {inscAgregadas.length > 0 && (
                <div className="mt-3">
                  <hr />
                  <p className="fw-semibold mb-2">Actividades a inscribir:</p>
                  {inscAgregadas.map((i, idx) => (
                    <div key={idx} className="d-flex justify-content-between align-items-center
                                              border rounded px-3 py-2 mb-2 bg-light">
                      <div>
                        <span className="fw-semibold">{i._label_disciplina}</span>
                        <span className="text-muted mx-1">›</span>
                        <span>{i._label_actividad}</span>
                        {i._label_horario && (
                          <>
                            <span className="text-muted mx-1">—</span>
                            <span className="small text-muted">{i._label_horario}</span>
                          </>
                        )}
                        {i._tipo_a === 'fijo' && (
                          <>
                            <span className="text-muted mx-2">|</span>
                            <span className="small">{i.cantidad_dias} día{i.cantidad_dias > 1 ? 's' : ''}/sem</span>
                          </>
                        )}
                        {i.precio_calculado > 0 && idx === inscAgregadas.findIndex(x => x.id_actividad === i.id_actividad) && (
                          <span className="ms-2 badge bg-success">
                            ${i.precio_calculado.toLocaleString('es-AR')}
                          </span>
                        )}
                      </div>
                      <button type="button" className="btn btn-sm btn-outline-danger"
                        onClick={() => handleQuitarInscripcion(idx)}>
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
          <div id="clinica" className="accordion-collapse collapse"
            data-bs-parent="#accordionInscripcion">
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
                  <select className="form-select" name="grupoSanguineo"
                    value={formData.grupoSanguineo} onChange={handleChange}>
                    <option value="">Seleccionar</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="mb-3 fw-semibold">Marque lo que corresponda:</label>
              <div className="row">
                <div className="col-12 col-md-6 mb-3">
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input"
                      name="patologiaColumna" checked={formData.patologiaColumna} onChange={handleCheckbox} />
                    <label className="form-check-label">Patología de columna</label>
                  </div>
                </div>
                <div className="col-12 col-md-6 mb-3">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox"
                      name="otrasPatologias" checked={formData.otrasPatologias} onChange={handleCheckbox} />
                    <label className="form-check-label">Otras patologías óseas</label>
                  </div>
                  {formData.otrasPatologias && (
                    <input type="text" className="form-control mt-2" placeholder="Especifique"
                      name="otrasPatologiasDetalle" value={formData.otrasPatologiasDetalle} onChange={handleChange} />
                  )}
                </div>
                <div className="col-12 col-md-6 mb-3">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox"
                      name="enfermedadCardiaca" checked={formData.enfermedadCardiaca} onChange={handleCheckbox} />
                    <label className="form-check-label">Enfermedades cardíacas</label>
                  </div>
                  {formData.enfermedadCardiaca && (
                    <input type="text" className="form-control mt-2" placeholder="Especifique"
                      name="enfermedadCardiacaDetalle" value={formData.enfermedadCardiacaDetalle} onChange={handleChange} />
                  )}
                </div>
                <div className="col-12 col-md-6 mb-3">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox"
                      name="lesiones" checked={formData.lesiones} onChange={handleCheckbox} />
                    <label className="form-check-label">Lesiones recientes</label>
                  </div>
                  {formData.lesiones && (
                    <input type="text" className="form-control mt-2" placeholder="Especifique"
                      name="lesionesDetalle" value={formData.lesionesDetalle} onChange={handleChange} />
                  )}
                </div>
                <div className="col-12 col-md-6 mb-3">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox"
                      name="practicaDeportes" checked={formData.practicaDeportes} onChange={handleCheckbox} />
                    <label className="form-check-label">Practica otros deportes</label>
                  </div>
                  {formData.practicaDeportes && (
                    <input type="text" className="form-control mt-2" placeholder="Especifique"
                      name="practicaDeportesDetalle" value={formData.practicaDeportesDetalle} onChange={handleChange} />
                  )}
                </div>
                {[
                  ['mareos', 'Sufre mareos'],
                  ['dolorCabeza', 'Dolor de cabeza frecuente'],
                  ['desmayos', 'Ha sufrido desmayos'],
                  ['hemorragiasNasales', 'Hemorragias nasales'],
                  ['doloresArticulaciones', 'Dolores articulares'],
                  ['piePlano', 'Pie plano u otra alteración'],
                  ['problemasRodillaTobillo', 'Problemas de rodilla/tobillo'],
                  ['cirugias', 'Intervenciones quirúrgicas'],
                  ['convulsiones', 'Convulsiones'],
                  ['problemasRespiratorios', 'Problemas respiratorios'],
                ].map(([name, label]) => (
                  <div className="col-12 col-md-6 mb-3" key={name}>
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input"
                        name={name} checked={formData[name]} onChange={handleCheckbox} />
                      <label className="form-check-label">{label}</label>
                    </div>
                  </div>
                ))}
                <div className="col-12 col-md-6 mb-3">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox"
                      name="medicacion" checked={formData.medicacion} onChange={handleCheckbox} />
                    <label className="form-check-label">Toma medicación con frecuencia</label>
                  </div>
                  {formData.medicacion && (
                    <input type="text" className="form-control mt-2" placeholder="Especifique"
                      name="medicacionDetalle" value={formData.medicacionDetalle} onChange={handleChange} />
                  )}
                </div>
                <div className="col-12 col-md-6 mb-3">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox"
                      name="alergico" checked={formData.alergico} onChange={handleCheckbox} />
                    <label className="form-check-label">Es alérgico</label>
                  </div>
                  {formData.alergico && (
                    <input type="text" className="form-control mt-2" placeholder="Especifique"
                      name="alergicoDetalle" value={formData.alergicoDetalle} onChange={handleChange} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── DATOS BIOMÉTRICOS ── */}
        <div className="accordion-item">
          <h2 className="accordion-header">
            <button className="accordion-button collapsed" type="button"
              data-bs-toggle="collapse" data-bs-target="#huella">
              <i className="ri-fingerprint-line"></i> Datos Biométricos
            </button>
          </h2>
          <div id="huella" className="accordion-collapse collapse"
            data-bs-parent="#accordionInscripcion">
            <div className="accordion-body">
              <button type="button" className="btn btn-principal"
                onClick={handleRegistrarHuella}
                disabled={!dni || dni.length < 7}>
                {templateHuella ? '✓ Huella registrada (volver a capturar)' : 'Registrar huella'}
              </button>
              <div className="mt-3" hidden>
                <textarea className="form-control" rows={3} readOnly value={templateHuella}
                  style={{ fontFamily: 'monospace', fontSize: '.72rem', background: '#f8f9fa' }} />
              </div>
            </div>
          </div>

          <HuellaModal
            isOpen={modalOpen}
            status={enroll.status}
            step={enroll.step}
            error={enroll.error}
            onClose={handleCloseModal}
            onRetry={() => enroll.start(dni)}
          />
        </div>

      </div>

      <div className="d-flex justify-content-end mt-4 gap-2">
        <button type="reset" className="btn btn-outline-secondary">Limpiar</button>
        <button type="submit" className="btn btn-success">Guardar inscripción</button>
      </div>
    </form>
  )
}