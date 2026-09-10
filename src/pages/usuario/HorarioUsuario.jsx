import { useNavigate } from "react-router-dom";
import { usePerfilCliente } from "../../hooks/usePerfilCliente";
import '../../styles/perfiles.css';

const ORDEN_DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
const DIAS_JS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

export default function HorarioUsuario() {
  const navigate = useNavigate()
  const { perfil, loading, error, recargar } = usePerfilCliente()

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-secondary" role="status" />
    </div>
  )

  if (error) return (
    <div className="text-center py-5">
      <p className="text-muted mb-3">No se pudo cargar tu horario.</p>
      <button className="btn btn-outline-primary" onClick={() => recargar()}>
        Reintentar
      </button>
    </div>
  )

  const inscripciones = perfil?.inscripciones || []
  const nombreDiaHoy = DIAS_JS[new Date().getDay()]

  // El botón de reagendar es específico de Musculación (cupos por turno);
  // no tiene sentido mostrarlo a quien no está inscripto ahí.
  const tieneMusculacion = inscripciones.some(i => i.tipo_d === 'musculacion')

  // Días ordenados según la semana
  const dias = ORDEN_DIAS

  // Horas únicas ordenadas
  const todasLasHoras = [...new Set(
    inscripciones.filter(i => i.hora_h).map(i => i.hora_h.slice(0, 5))
  )].sort((a, b) => a.localeCompare(b))

  // Actividades para un día y hora dados
  const getClases = (dia, hora) =>
    inscripciones.filter(i => i.dia_h === dia && i.hora_h?.slice(0, 5) === hora)

  const botonReagendar = tieneMusculacion && (
    <div className="d-flex justify-content-end gap-2 mb-4">
      <button className="btn btn-principal btn-reagendar" onClick={() => navigate('/perfil/reagendar-turno')}>
        <i className="ri-calendar-event-line me-2"></i>
        Cambiar Turno
      </button>
    </div>
  )

  if (inscripciones.filter(i => i.dia_h).length === 0) {
    return (
      <>
        {botonReagendar}
        <p className="text-center text-muted">No tenés horarios asignados.</p>
      </>
    )
  }

  return (
    <>
      {botonReagendar}

      <div className="tabla-container">
        <table className="table table-bordered text-center align-middle tabla-horario-usuario">
          <thead className="table-head">
            <tr>
              <th>Hora</th>
              {dias.map(dia => (
                <th key={dia} className={dia === nombreDiaHoy ? "dia-actual" : undefined}>
                  {dia}{dia === nombreDiaHoy && <span className="badge bg-primary ms-1">Hoy</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {todasLasHoras.map(hora => (
              <tr key={hora}>
                <td className="fw-bold">{hora}</td>
                {dias.map(dia => {
                  const clases = getClases(dia, hora)
                  return (
                    <td key={`${dia}-${hora}`} className={dia === nombreDiaHoy ? "dia-actual" : undefined}>
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
      </div>
    </>
  )
}
