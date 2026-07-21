import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { perfilApi } from "../services/api";
import EstadoItem from "../components/usuario/EstadoItem";
import Swal from "sweetalert2";

const calcularEdad = (fechaNac) => {
  if (!fechaNac) return ''
  const hoy = new Date()
  const nac = new Date(fechaNac)
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

const formatFecha = (isoString) => {
  if (!isoString) return ''
  const f = new Date(isoString)
  return `${String(f.getDate()).padStart(2,'0')}/${String(f.getMonth()+1).padStart(2,'0')}/${f.getFullYear()}`
}

const isoToInput = (isoString) => {
  if (!isoString) return ''
  return isoString.slice(0, 10)
}

export default function Perfil() {
  const { user } = useAuth()
  const [perfil,     setPerfil]     = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [isEditable, setIsEditable] = useState(false)
  const [guardando,  setGuardando]  = useState(false)

  const [formData, setFormData] = useState({
    apellidoNombre:     '',
    dni:                '',
    direccion:          '',
    telefono1:          '',
    telefonoEmergencia: '',
    fechaNacimiento:    '',
  })

  // Valores originales para cancelar
  const [formOriginal, setFormOriginal] = useState({})

  const cargarPerfil = () => {
    setLoading(true)
    perfilApi.getMe()
      .then(data => {
        setPerfil(data)
        const valores = {
          apellidoNombre:     data.nomap_c          || '',
          dni:                data.dni_u             || '',
          direccion:          data.direccion_c       || '',
          telefono1:          data.telefono_c        || '',
          telefonoEmergencia: data.tel_emergencia_c  || '',
          fechaNacimiento:    isoToInput(data.fecha_nac_c),
        }
        setFormData(valores)
        setFormOriginal(valores)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargarPerfil() }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleEditar = () => setIsEditable(true)

  const handleCancelar = () => {
    setFormData(formOriginal)
    setIsEditable(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      await perfilApi.update({
        direccion:      formData.direccion          || null,
        telefono:       formData.telefono1          || null,
        tel_emergencia: formData.telefonoEmergencia || null,
      })
      Swal.fire('¡Listo!', 'Datos actualizados correctamente', 'success')
      setIsEditable(false)
      cargarPerfil()
    } catch (err) {
      Swal.fire('Error', err.message, 'error')
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-secondary" role="status" />
    </div>
  )

  return (
    <div className="container perfil mt-4">

      <div className="text-center mb-4">
        <h2 className="fw-bold">Hola, {perfil?.nomap_c || user?.nombre}</h2>
      </div>

      <form className="card p-4 shadow-sm" onSubmit={handleSubmit}>
        <h4 className="fw-bold mb-4 text-center">Perfil del Cliente</h4>

        {/* DATOS PERSONALES */}
        <h6 className="fw-bold mb-3">Datos personales</h6>
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Apellido y Nombre</label>
            <input type="text" className="form-control" name="apellidoNombre"
              value={formData.apellidoNombre} onChange={handleChange} disabled />
          </div>
          <div className="col-md-6">
            <label className="form-label">DNI</label>
            <input type="number" className="form-control" name="dni"
              value={formData.dni} onChange={handleChange} disabled />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Dirección</label>
          <input type="text" className="form-control" name="direccion"
            value={formData.direccion} onChange={handleChange}
            disabled={!isEditable} />
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Teléfono</label>
            <input type="tel" className="form-control" name="telefono1"
              value={formData.telefono1} onChange={handleChange}
              disabled={!isEditable} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Teléfono de emergencia</label>
            <input type="tel" className="form-control" name="telefonoEmergencia"
              value={formData.telefonoEmergencia} onChange={handleChange}
              disabled={!isEditable} />
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-6">
            <label className="form-label">Fecha de nacimiento</label>
            <input type="date" className="form-control" name="fechaNacimiento"
              value={formData.fechaNacimiento} onChange={handleChange} disabled />
          </div>
          <div className="col-md-6">
            <label className="form-label">Edad</label>
            <input type="number" className="form-control" disabled
              value={calcularEdad(formData.fechaNacimiento)} />
          </div>
        </div>

        {/* ACTIVIDADES */}
        <h6 className="fw-bold mb-3">Actividades</h6>
        {perfil?.inscripciones?.length > 0 && (
          <div className="text-start mb-3">
            {[...new Map(perfil.inscripciones.map(i => [i.nombre_d, i])).values()].map((i, idx) => (
              <span key={idx} className="badge bg-light text-dark border me-1 mb-1">
                {i.nombre_d}
              </span>
            ))}
          </div>
        )}

        <div className="row">
          <div className="col perfil-estado-user">
            <EstadoItem
              icon={perfil?.cuota_al_dia ? '✅' : '❌'}
              titulo={perfil?.cuota_al_dia ? 'Cuota al día' : 'Cuota vencida'}
              vencimiento={null}
            />
            <EstadoItem
              icon={perfil?.tiene_ficha ? '✅' : '⚠️'}
              titulo={perfil?.tiene_ficha ? 'Ficha médica vigente' : 'Falta ficha médica'}
              vencimiento={
                perfil?.venc_ficha_medica
                  ? formatFecha(perfil.venc_ficha_medica)
                  : null
              }
            />
          </div>
        </div>

        {/* BOTONES */}
        <div className="d-flex justify-content-end gap-2 mt-4">
          {isEditable ? (
            <>
              <button type="button" className="btn btn-outline-secondary"
                onClick={handleCancelar}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-success" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-outline-primary"
              onClick={handleEditar}>
              Editar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}