import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { perfilApi } from "../../services/api";
import '../../styles/perfiles.css';

const ORDEN_DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

export default function HorarioUsuario() {
  const navigate = useNavigate()
  const [inscripciones, setInscripciones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    perfilApi.getMe()
      .then(data => setInscripciones(data.inscripciones || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-secondary" role="status" />
    </div>
  )

  // Días ordenados según la semana
  const dias = ORDEN_DIAS

  // Horas únicas ordenadas
  const todasLasHoras = [...new Set(
    inscripciones.filter(i => i.hora_h).map(i => i.hora_h.slice(0, 5))
  )].sort((a, b) => a.localeCompare(b))

  // Actividades para un día y hora dados
  const getClases = (dia, hora) =>
    inscripciones.filter(i => i.dia_h === dia && i.hora_h?.slice(0, 5) === hora)

  if (inscripciones.filter(i => i.dia_h).length === 0) {
    return (
      <>
        <div className="d-flex justify-content-end gap-2 mb-4">
          <button className="btn btn-principal btn-reagendar" onClick={() => navigate('/perfil/reagendar-turno')}>
            <i className="ri-calendar-event-line me-2"></i>
            Cambiar Turno
          </button>
        </div>
        <p className="text-center text-muted">No tenés horarios asignados.</p>
      </>
    )
  }

  return (
    <>
      <div className="d-flex justify-content-end gap-2 mb-4">
        <button className="btn btn-principal btn-reagendar" onClick={() => navigate('/perfil/reagendar-turno')}>
          <i className="ri-calendar-event-line me-2"></i>
          Cambiar Turno
        </button>
      </div>

      <table className="table table-bordered text-center align-middle">
        <thead className="table-head">
          <tr>
            <th>Hora</th>
            {dias.map(dia => <th key={dia}>{dia}</th>)}
          </tr>
        </thead>
        <tbody>
          {todasLasHoras.map(hora => (
            <tr key={hora}>
              <td className="fw-bold">{hora}</td>
              {dias.map(dia => {
                const clases = getClases(dia, hora)
                return (
                  <td key={`${dia}-${hora}`}>
                    {clases.length > 0 ? (
                      clases.map((c, idx) => (
                        <div key={idx} className="mb-1">
                          <p className="nombre-actividad" translate="no">{c.nombre_a}</p>
                          {c.profesor && (
                            <p className="profesor text-muted small">{c.profesor}</p>
                          )}
                        </div>
                      ))
                    ) : '-'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}