import { useState, useEffect } from "react";

import { useHuellaEnrollment } from '../../hooks/useHuellaEnrollment'
import HuellaModal from '../HuellaModal'

import { clientesApi } from '../../services/api'

export default function FichaInscripcion({ onSubmit }) {

  const [templateHuella, setTemplateHuella] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const enroll = useHuellaEnrollment()

  // cuando termina el enrollment, sincronizo al state del form
  useEffect(() => {
    if (enroll.status === 'done' && enroll.template) {
      setTemplateHuella(enroll.template)
    }
  }, [enroll.status, enroll.template])

  const handleRegistrarHuella = () => {
    if (!dni || dni.trim().length < 7) {
      alert('Ingresá el DNI antes de registrar la huella')
      return
    }
    setModalOpen(true)
    enroll.start(dni.trim())
  }

  const handleCloseModal = () => {
    if (enroll.status !== 'done') enroll.cancel()
    setModalOpen(false)
  }

  const [formData, setFormData] = useState({
    apellidoNombre: "",
    dni: "",
    direccion: "",
    telefono1: "",
    telefonoEmergencia: "",
    fechaNacimiento: "",
    edad: "",
    planElegido: "",
    valorMensual: "",
    dias: "",
    horarios: "",

    altura: "",
    peso: "",
    grupoSanguineo: "",

    patologiaColumna: false,
    otrasPatologias: false,
    otrasPatologiasDetalle: "",

    enfermedadCardiaca: false,
    enfermedadCardiacaDetalle: "",

    lesiones: false,
    lesionesDetalle: "",

    practicaDeportes: false,
    practicaDeportesDetalle: "",

    mareos: false,
    dolorCabeza: false,
    desmayos: false,
    hemorragiasNasales: false,
    doloresArticulaciones: false,
    piePlano: false,
    problemasRodillaTobillo: false,
    cirugias: false,
    convulsiones: false,
    problemasRespiratorios: false,

    medicacion: false,
    medicacionDetalle: "",

    alergico: false,
    alergicoDetalle: "",
  });

  const dni = String(formData.dni || '').trim() // ⬅ NUEVO

  const planes = [
    "Musculación",
    "Pileta climatizada",
    "Spinning Center",
    "Cardio Gym",
    "Valoración Física",
    "Plan Personalizado",
    "Pilates",
  ];

  const diasDisponibles = [
    "Lunes a Viernes",
    "Lunes / Miércoles / Viernes",
    "Martes / Jueves",
    "Sábados",
  ];

  const horariosDisponibles = [
    "Mañana",
    "Tarde",
    "Noche",
    "Libre",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckbox = (e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleSubmit = async (e) => {
  e.preventDefault()

  try {
    const data = await clientesApi.create({
      dni:             parseInt(formData.dni, 10),
      nombre_apellido: formData.apellidoNombre,
      template_huella: templateHuella || undefined,
      contrasena:      String(formData.dni),   // password inicial = DNI
    })

    alert(`✓ Cliente ${data.nombre_apellido} guardado (DNI ${data.dni})`)
    console.log('Cliente creado:', data)

    if (onSubmit) onSubmit(formData)
    // si querés resetear el form acá, podés
  } catch (err) {
    alert(err.message || 'No se pudo guardar el cliente')
    console.error(err)
  }
};

  return (

    <form className="card p-4 shadow-sm" onSubmit={handleSubmit}>

      <h4 className="fw-bold mb-4 text-center">
        Ficha de Datos Cliente
      </h4>


      <div className="accordion accordion-flush" id="accordionInscripcion">

        {/* DATOS PERSONALES */}

        <div className="accordion-item">

          <h2 className="accordion-header">
            <button
              className="accordion-button"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#datosPersonales"
            >
              <i className="ri-user-line me-2"></i>
              Datos personales
            </button>
          </h2>

          <div
            id="datosPersonales"
            className="accordion-collapse collapse show"
            data-bs-parent="#accordionInscripcion"
          >

            <div className="accordion-body">

              <div className="row mb-3">

                <div className="col-md-6">
                  <label className="form-label">Apellido y Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    name="apellidoNombre"
                    value={formData.apellidoNombre}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">DNI</label>
                  <input
                    type="number"
                    className="form-control"
                    name="dni"
                    value={formData.dni}
                    onChange={handleChange}
                  />
                </div>

              </div>


              <div className="mb-3">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  className="form-control"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                />
              </div>


              <div className="row mb-3">

                <div className="col-md-6">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="telefono1"
                    value={formData.telefono1}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Teléfono de emergencia</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="telefonoEmergencia"
                    value={formData.telefonoEmergencia}
                    onChange={handleChange}
                  />
                </div>

              </div>


              <div className="row mb-3">

                <div className="col-md-6">
                  <label className="form-label">Fecha nacimiento</label>
                  <input
                    type="date"
                    className="form-control"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Edad</label>
                  <input
                    type="number"
                    className="form-control"
                    disabled
                    value={formData.edad}
                  />
                </div>

              </div>

            </div>
          </div>
        </div>


        {/* PLAN CONTRATADO */}

        <div className="accordion-item">

          <h2 className="accordion-header">
            <button
              className="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#plan"
            >
              <i className="ri-vip-crown-line me-2"></i>
              Plan contratado
            </button>
          </h2>

          <div
            id="plan"
            className="accordion-collapse collapse"
            data-bs-parent="#accordionInscripcion"
          >

            <div className="accordion-body">

              <div className="mb-3">

                <label className="form-label">Plan elegido</label>

                <select
                  className="form-select"
                  name="planElegido"
                  value={formData.planElegido}
                  onChange={handleChange}
                >

                  <option value="">Seleccionar plan</option>

                  {planes.map((plan) => (
                    <option key={plan} value={plan}>{plan}</option>
                  ))}

                </select>

              </div>





              <div className="row mb-3">

                <div className="col-md-4">
                  <label className="form-label">Días</label>

                  <select
                    className="form-select"
                    name="dias"
                    value={formData.dias}
                    onChange={handleChange}
                  >

                    <option value="">Seleccionar</option>

                    {diasDisponibles.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}

                  </select>

                </div>

                <div className="col-md-4">

                  <label className="form-label">Horarios</label>

                  <select
                    className="form-select"
                    name="horarios"
                    value={formData.horarios}
                    onChange={handleChange}
                  >

                    <option value="">Seleccionar</option>

                    {horariosDisponibles.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}

                  </select>

                </div>
                <div className="col-md-4">
                  <label className="form-label">Valor mensual</label>
                  <input disabled
                    type="number"
                    className="form-control"
                    name="valorMensual"
                    value={formData.valorMensual}
                    onChange={handleChange}
                  />
                </div>

              </div>

              <div className="d-flex justify-content-start gap-2">
                <button type="button" className="btn btn-ejercicio"
                  onClick={() => agregarActividad()}>
                  + Actividad
                </button>
              </div>

            </div>
          </div>
        </div>


        {/* HISTORIA CLINICA */}

        <div className="accordion-item">

          <h2 className="accordion-header">

            <button
              className="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#clinica"
            >

              <i className="ri-heart-pulse-line me-2"></i>
              Historia clínica

            </button>

          </h2>

          <div
            id="clinica"
            className="accordion-collapse collapse"
            data-bs-parent="#accordionInscripcion"
          >

            <div className="accordion-body">
              <label className="mb-3 fw-semibold">Marque lo que corresponda:</label>

              <div className="row">

                {/* Patología columna */}
                <div className="col-12 col-md-6 mb-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      name="patologiaColumna"
                      checked={formData.patologiaColumna}
                      onChange={handleCheckbox}
                    />
                    <label className="form-check-label">Patología de columna</label>
                  </div>
                </div>

                {/* Otras patologías */}
                <div className="col-12 col-md-6 mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="otrasPatologias"
                      checked={formData.otrasPatologias}
                      onChange={handleCheckbox}
                    />
                    <label className="form-check-label">Otras patologías óseas</label>
                  </div>

                  {formData.otrasPatologias && (
                    <input
                      type="text"
                      className="form-control mt-2"
                      placeholder="Especifique"
                      name="otrasPatologiasDetalle"
                      value={formData.otrasPatologiasDetalle}
                      onChange={handleChange}
                    />
                  )}
                </div>

                {/* Enfermedad cardíaca */}
                <div className="col-12 col-md-6 mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="enfermedadCardiaca"
                      checked={formData.enfermedadCardiaca}
                      onChange={handleCheckbox}
                    />
                    <label className="form-check-label">Enfermedades cardíacas</label>
                  </div>

                  {formData.enfermedadCardiaca && (
                    <input
                      type="text"
                      className="form-control mt-2"
                      placeholder="Especifique"
                      name="enfermedadCardiacaDetalle"
                      value={formData.enfermedadCardiacaDetalle}
                      onChange={handleChange}
                    />
                  )}
                </div>

                {/* Lesiones */}
                <div className="col-12 col-md-6 mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="lesiones"
                      checked={formData.lesiones}
                      onChange={handleCheckbox}
                    />
                    <label className="form-check-label">Lesiones recientes</label>
                  </div>

                  {formData.lesiones && (
                    <input
                      type="text"
                      className="form-control mt-2"
                      placeholder="Especifique"
                      name="lesionesDetalle"
                      value={formData.lesionesDetalle}
                      onChange={handleChange}
                    />
                  )}
                </div>

                {/* Practica deportes */}
                <div className="col-12 col-md-6 mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="practicaDeportes"
                      checked={formData.practicaDeportes}
                      onChange={handleCheckbox}
                    />
                    <label className="form-check-label">Practica otros deportes</label>
                  </div>

                  {formData.practicaDeportes && (
                    <input
                      type="text"
                      className="form-control mt-2"
                      placeholder="Especifique"
                      name="practicaDeportesDetalle"
                      value={formData.practicaDeportesDetalle}
                      onChange={handleChange}
                    />
                  )}
                </div>

                {/* LISTA AUTOMÁTICA */}
                {[
                  ["mareos", "Sufre mareos"],
                  ["dolorCabeza", "Dolor de cabeza frecuente"],
                  ["desmayos", "Ha sufrido desmayos"],
                  ["hemorragiasNasales", "Hemorragias nasales"],
                  ["doloresArticulaciones", "Dolores articulares"],
                  ["piePlano", "Pie plano u otra alteración"],
                  ["problemasRodillaTobillo", "Problemas de rodilla/tobillo"],
                  ["cirugias", "Intervenciones quirúrgicas"],
                  ["convulsiones", "Convulsiones"],
                  ["problemasRespiratorios", "Problemas respiratorios"],
                ].map(([name, label]) => (
                  <div className="col-12 col-md-6 mb-3" key={name}>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        name={name}
                        checked={formData[name]}
                        onChange={handleCheckbox}
                      />
                      <label className="form-check-label">{label}</label>
                    </div>
                  </div>
                ))}

                {/* Medicación */}
                <div className="col-12 col-md-6 mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="medicacion"
                      checked={formData.medicacion}
                      onChange={handleCheckbox}
                    />
                    <label className="form-check-label">
                      Toma medicación con frecuencia
                    </label>
                  </div>

                  {formData.medicacion && (
                    <input
                      type="text"
                      className="form-control mt-2"
                      placeholder="Especifique"
                      name="medicacionDetalle"
                      value={formData.medicacionDetalle}
                      onChange={handleChange}
                    />
                  )}
                </div>

                {/* Alergias */}
                <div className="col-12 col-md-6 mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="alergico"
                      checked={formData.alergico}
                      onChange={handleCheckbox}
                    />
                    <label className="form-check-label">Es alérgico</label>
                  </div>

                  {formData.alergico && (
                    <input
                      type="text"
                      className="form-control mt-2"
                      placeholder="Especifique"
                      name="alergicoDetalle"
                      value={formData.alergicoDetalle}
                      onChange={handleChange}
                    />
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* HUELLA */}

        <div className="accordion-item">

          <h2 className="accordion-header">

            <button
              className="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#huella"
            >

              <i className="ri-fingerprint-line"></i>
              Datos Biométricos

            </button>

          </h2>

          <div
            id="huella"
            className="accordion-collapse collapse"
            data-bs-parent="#accordionInscripcion"
          >
            <div className="accordion-body">
              <button
                type="button"
                className="btn btn-principal"
                onClick={handleRegistrarHuella}
                disabled={!dni || dni.trim().length < 7}
              >
                {templateHuella ? '✓ Huella registrada (volver a capturar)' : 'Registrar Huella'}
              </button>

              {/* Campo visible por ahora; después le metés type="hidden" o style={{display:'none'}} */}
              <div className="mt-3">
                <label className="form-label small text-muted d-flex justify-content-between">
                  <span>Template biométrico (base64)</span>
                  <span className="text-muted" style={{ fontSize: '.72rem' }}>
                    {templateHuella ? `${templateHuella.length} caracteres` : ''}
                  </span>
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  readOnly
                  value={templateHuella}
                  placeholder="Aparecerá aquí al completar el registro..."
                  style={{ fontFamily: 'monospace', fontSize: '.72rem', background: '#f8f9fa' }}
                />
              </div>
            </div>
          </div>

          <HuellaModal
            isOpen={modalOpen}
            status={enroll.status}
            step={enroll.step}
            error={enroll.error}
            onClose={handleCloseModal}
            onRetry={() => enroll.start(dni.trim())}
          />
        </div>

      </div>


      <div className="d-flex justify-content-end mt-4 gap-2">

        <button type="reset" className="btn btn-outline-secondary">
          Limpiar
        </button>

        <button type="submit" className="btn btn-success">
          Guardar inscripción
        </button>

      </div>

    </form>
  );
}