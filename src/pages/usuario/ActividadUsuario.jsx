import EstadoItem from "../../components/usuario/EstadoItem"
import CardActividad from "../../components/usuario/CardActividad"
import { usePerfilCliente } from "../../hooks/usePerfilCliente"
import '../../styles/perfiles.css'

const formatFechaCorta = (isoString) => {
    if (!isoString) return null
    const f = new Date(isoString)
    return `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}`
}

export default function ActividadUsuario() {
    const { perfil, loading, error, recargar } = usePerfilCliente()

    if (loading) return (
        <div className="text-center py-5">
            <div className="spinner-border text-secondary" role="status" />
        </div>
    )

    if (error) return (
        <div className="text-center py-5">
            <p className="text-muted mb-3">No se pudieron cargar tus actividades.</p>
            <button className="btn btn-outline-primary" onClick={() => recargar()}>
                Reintentar
            </button>
        </div>
    )

    // Agrupar inscripciones por actividad
    const actividadesAgrupadas = Object.values(
        (perfil?.inscripciones || []).reduce((acc, i) => {
            const key = `${i.nombre_d}-${i.nombre_a}`
            if (!acc[key]) {
                acc[key] = {
                    titulo: i.nombre_a,
                    horarios: [],
                    entradas: Number(i.entradas_restantes || 0),
                    cuota: i.pago_s || false,
                    vencimiento: i.fecha_s ? (() => {
                        const f = new Date(i.fecha_s)
                        f.setMonth(f.getMonth() + 1)
                        const dia = String(f.getDate()).padStart(2, '0')
                        const mes = String(f.getMonth() + 1).padStart(2, '0')
                        return `${dia}/${mes}`
                    })() : null,
                }
            }
            if (i.dia_h && i.hora_h) {
                acc[key].horarios.push(`${i.dia_h} ${i.hora_h.slice(0, 5)}hs`)
            }
            return acc
        }, {})
    )

    return (
        <div className="contenido-actividades text-center">

            {/* ESTADO */}
            <div className="estado-user justify-content-center">
                <EstadoItem
                    icon={perfil?.tiene_ficha ? "✅" : "❌"}
                    titulo={perfil?.tiene_ficha ? "Ficha médica presentada" : "Falta Ficha Médica"}
                    vencimiento={formatFechaCorta(perfil?.venc_ficha_medica)}
                />
            </div>

            {/* CARDS */}
            <div className="actividades-user mt-5">
                {actividadesAgrupadas.length === 0
                    ? <p className="text-muted">No tenés actividades inscriptas.</p>
                    : actividadesAgrupadas.map((a, idx) => (
                        <CardActividad
                            key={idx}
                            titulo={a.titulo}
                            horario={a.horarios.length > 0 ? a.horarios.join(' / ') : 'Sin horario asignado'}
                            turnos={a.entradas}
                            cuota={a.cuota}
                            vencimiento={a.vencimiento}
                        />
                    ))
                }
            </div>

        </div>
    )
}
