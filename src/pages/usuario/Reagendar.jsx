import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { perfilApi, reservasApi } from "../../services/api";
import '../../styles/perfiles.css';


const ORDEN_DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

export default function Reagendar() {

    const [horarios, setHorarios] = useState([])
    const [loading, setLoading] = useState(true)
    const [turnoSeleccionado, setTurnoSeleccionado] = useState(null) // { id_reserva, id_horario, dia_h, hora_h }
    const navigate = useNavigate()

    const cargarHorarios = () => {
        setLoading(true)
        perfilApi.getHorariosMus()
            .then(setHorarios)
            .catch(console.error)
            .finally(() => setLoading(false))
    }

    useEffect(() => { cargarHorarios() }, [])

    if (loading) return (
        <div className="text-center py-5">
            <div className="spinner-border text-secondary" role="status" />
        </div>
    )

    // Días y horas únicos que tienen horarios cargados
    const dias = ORDEN_DIAS.filter(d => horarios.some(h => h.dia_h === d))
    const horas = [...new Set(horarios.map(h => h.hora_h?.slice(0, 5)))].sort()

    const getHorario = (dia, hora) =>
        horarios.find(h => h.dia_h === dia && h.hora_h?.slice(0, 5) === hora)

    const confirmarCambio = (nuevo) => {
        Swal.fire({
            title: 'Cambiar turno',
            html: `
        <p><strong>De:</strong> ${turnoSeleccionado.dia_h} ${turnoSeleccionado.hora_h?.slice(0, 5)}hs</p>
        <p><strong>A:</strong> ${nuevo.dia_h} ${nuevo.hora_h?.slice(0, 5)}hs</p>
      `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Confirmar cambio',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#0093D8',
            cancelButtonColor: '#6c757d',
        }).then(async (result) => {
            if (!result.isConfirmed) return
            try {
                // 1. Cancelar reserva actual
                await reservasApi.cancelarMuscu(turnoSeleccionado.id_reserva)
                // 2. Crear nueva reserva
                await reservasApi.reservarMuscu({ id_horario: nuevo.id_horario })
                Swal.fire('¡Listo!', 'Tu turno fue cambiado correctamente', 'success')
                setTurnoSeleccionado(null)
                cargarHorarios()
            } catch (err) {
                Swal.fire('Error', err.message || 'No se pudo cambiar el turno', 'error')
            }
        })
    }

    return (
        <div className="pages-section reagendar">
            <div className="d-flex justify-content-start mb-3">
                <button className="btn btn-outline-secondary" onClick={() => navigate('/perfil/horario-usuario')}>
                    <i className="ri-arrow-left-line me-1"></i> Volver
                </button>
            </div>
            <h5 className="card-title mb-3">Reagendar Turno</h5>

            {turnoSeleccionado && (
                <div className="alert alert-info py-2 mb-3">
                    <i className="ri-information-line me-2"></i>
                    Turno seleccionado: <strong>{turnoSeleccionado.dia_h} {turnoSeleccionado.hora_h?.slice(0, 5)}hs</strong>
                    — ahora hacé click en un turno disponible para cambiarlo.
                    <button className="btn btn-sm btn-outline-secondary ms-3"
                        onClick={() => setTurnoSeleccionado(null)}>
                        Cancelar
                    </button>
                </div>
            )}

            <table className="table table-bordered text-center align-middle tabla-perfiles">
                <thead className="table-light">
                    <tr>
                        <th>Hora</th>
                        {dias.map(dia => <th key={dia}>{dia}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {horas.map(hora => (
                        <tr key={hora}>
                            <td className="fw-bold">{hora}</td>
                            {dias.map(dia => {
                                const h = getHorario(dia, hora)
                                if (!h) return <td key={`${dia}-${hora}`}>-</td>

                                const esMio = h.es_mi_reserva === true || h.es_mi_reserva === 'true'
                                const lleno = h.cupo_actual >= h.cupo_maximo
                                const seleccionado = turnoSeleccionado?.id_horario === h.id_horario

                                let clase = 'disponible'
                                let texto = `Disponible (${h.cupo_maximo - h.cupo_actual})`
                                if (esMio) { clase = seleccionado ? 'mi-turno seleccionado' : 'mi-turno'; texto = 'Tu turno' }
                                else if (lleno) { clase = 'ocupado'; texto = 'Lleno' }

                                return (
                                    <td key={`${dia}-${hora}`}
                                        className={clase}
                                        onClick={() => {
                                            if (esMio) {
                                                setTurnoSeleccionado(
                                                    seleccionado ? null : {
                                                        id_reserva: Number(h.id_reserva),
                                                        id_horario: h.id_horario,
                                                        dia_h: h.dia_h,
                                                        hora_h: h.hora_h,
                                                    }
                                                )
                                            } else if (turnoSeleccionado && !lleno) {
                                                confirmarCambio(h)
                                            }
                                        }}
                                    >
                                        {texto}
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="d-flex gap-3 mt-3 small text-muted justify-content-center flex-wrap">
                <span><span className="badge mi-turno px-2 me-1">&nbsp;</span> Tu turno</span>
                <span><span className="badge disponible px-2 me-1">&nbsp;</span> Disponible</span>
                <span><span className="badge ocupado px-2 me-1">&nbsp;</span> Lleno</span>
            </div>
        </div>
    )
}