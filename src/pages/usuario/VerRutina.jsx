import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";
import logo from "../../assets/logo_sf.png";
import Modal from 'react-modal';
import { perfilApi } from "../../services/api";

Modal.setAppElement('#root')

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const progVacio = () => ({ serie: '', reps: '', carga: '' })

export default function VerRutina() {

    const mesActual = MESES[new Date().getMonth()]
    const [mes, setMes] = useState(mesActual)
    const [ejercicios, setEjercicios] = useState({}) // key: `${dia}-${ejercicio}`
    const [loading, setLoading] = useState(true)
    const [filtroDia, setFiltroDia] = useState('mensual')
    const [semanaActual, setSemanaActual] = useState(1)
    const [modoEdicion, setModoEdicion] = useState(false)
    const [guardando, setGuardando] = useState(false)
    const [showVideo, setShowVideo] = useState(false)

    const videoUrl = "https://www.youtube.com/embed/a_1gQmdwfUQ?si=zLVVO6sYe4yEKAKk"

    // ── Cargar rutina ───────────────────────────────────────────────
    useEffect(() => {
        setLoading(true)
        perfilApi.getRutina(mes)
            .then(rows => {
                const mapa = {}
                for (const row of rows) {
                    const key = `${row.dia_r}-${row.ejercicio}`
                    const semana = Number(row.semana_c)

                    if (!mapa[key]) {
                        mapa[key] = {
                            dia: Number(row.dia_r),
                            ejercicio: row.ejercicio,
                            series: row.series_r,
                            reps: row.repeticiones_r,
                            carga: row.peso_r ? `${row.peso_r}kg` : '—',
                            rutinaPorSemana: {},   // id_rutina de cada semana
                            progresoSemanas: {
                                1: progVacio(), 2: progVacio(), 3: progVacio(), 4: progVacio()
                            }
                        }
                    }

                    // Registrar el id_rutina para esta semana
                    mapa[key].rutinaPorSemana[semana] = row.id_rutina

                    // Registrar progreso si existe
                    if (row.series_cliente != null || row.repeticion_cliente != null || row.peso_cliente != null) {
                        mapa[key].progresoSemanas[semana] = {
                            serie: row.series_cliente != null ? String(row.series_cliente) : '',
                            reps: row.repeticion_cliente != null ? String(row.repeticion_cliente) : '',
                            carga: row.peso_cliente != null ? String(row.peso_cliente) : '',
                        }
                    }
                }
                setEjercicios(mapa)
            })
            .catch(err => Swal.fire('Error', err.message, 'error'))
            .finally(() => setLoading(false))
    }, [mes])

    // Ejercicios ordenados y filtrados por día
    const todosLosEjercicios = Object.values(ejercicios)
        .sort((a, b) => a.dia - b.dia || a.ejercicio.localeCompare(b.ejercicio))

    const diasUnicos = [...new Set(todosLosEjercicios.map(r => r.dia))].sort((a, b) => a - b)

    const rutinaFiltrada = todosLosEjercicios.filter(r =>
        filtroDia === 'mensual' || r.dia === Number(filtroDia)
    )

    // ── Edición ─────────────────────────────────────────────────────
    const handleProgresoChange = (key, campo, valor) => {
        setEjercicios(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                progresoSemanas: {
                    ...prev[key].progresoSemanas,
                    [semanaActual]: {
                        ...prev[key].progresoSemanas[semanaActual],
                        [campo]: valor
                    }
                }
            }
        }))
    }

    const getKey = (r) => `${r.dia}-${r.ejercicio}`

    // ── Guardar ─────────────────────────────────────────────────────
    const guardarProgreso = async () => {
        setGuardando(true)
        try {
            const sinRutina = rutinaFiltrada.filter(r => !r.rutinaPorSemana[semanaActual])
            if (sinRutina.length > 0) {
                Swal.fire('Atención',
                    'Esta semana aún no tiene rutina cargada. El profesor debe cargarla primero.',
                    'warning')
                setGuardando(false)
                return
            }

            const promesas = rutinaFiltrada
                .filter(r => {
                    const p = r.progresoSemanas[semanaActual]
                    return p?.serie || p?.reps || p?.carga
                })
                .map(r => {
                    const prog = r.progresoSemanas[semanaActual]
                    return perfilApi.guardarProgreso({
                        id_rutina: r.rutinaPorSemana[semanaActual],
                        semana: semanaActual,
                        series: Number(prog.serie) || 0,
                        repeticiones: Number(prog.reps) || 0,
                        peso: Number(prog.carga) || 0,
                    })
                })

            await Promise.all(promesas)
            Swal.fire('¡Listo!', 'Progreso guardado correctamente', 'success')
            setModoEdicion(false)
        } catch (err) {
            Swal.fire('Error', err.message, 'error')
        } finally {
            setGuardando(false)
        }
    }

    // ── PDF ─────────────────────────────────────────────────────────
    const generarPDF = () => {
        const pdf = new jsPDF('landscape', 'pt', 'a3')
        pdf.addImage(logo, 'PNG', 15, 10, 60, 60)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(18)
        pdf.text(`Rutina ${mes} - Semana ${semanaActual}`, 100, 55)
        autoTable(pdf, {
            head: [['DÍA', 'EJERCICIO', 'SERIES', 'REPETICIONES', 'CARGA', 'S. Realizada', 'R. Realizada', 'Peso Real']],
            body: rutinaFiltrada.map(r => {
                const p = r.progresoSemanas[semanaActual]
                return [`Día ${r.dia}`, r.ejercicio, r.series, r.reps, r.carga,
                p?.serie || '', p?.reps || '', p?.carga || '']
            }),
            startY: 100,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: { top: 8, bottom: 8, left: 4, right: 4 }, halign: 'center', valign: 'middle' },
            headStyles: { fillColor: [32, 104, 190], textColor: 255, fontStyle: 'bold' },
            margin: { left: 20, right: 20 },
        })
        window.open(URL.createObjectURL(pdf.output('blob')), '_blank')
    }

    // ── Render ─────────────────────────────────────────────────────
    if (loading) return (
        <div className="text-center py-5">
            <div className="spinner-border text-secondary" role="status" />
        </div>
    )

    if (todosLosEjercicios.length === 0) return (
        <div className="text-center py-5 text-muted">
            <i className="ri-file-list-3-line fs-1 mb-3 d-block"></i>
            <p>No tenés una rutina cargada para {mes}.</p>
        </div>
    )

    return (
        <div>

            {/* Acciones */}
            <div className="acciones-rutina d-flex flex-wrap gap-2 mb-4 justify-content-center justify-content-md-end">
                <button className="btn btn-principal w-auto" onClick={generarPDF}>
                    <i className="ri-file-text-line me-1" />Descargar
                </button>

                {modoEdicion ? (
                    <div className="d-flex gap-2">
                        <button className="btn btn-success w-auto" onClick={guardarProgreso} disabled={guardando}>
                            <i className="ri-check-line me-1" />
                            {guardando ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button className="btn btn-outline-secondary w-auto" onClick={() => setModoEdicion(false)}>
                            Cancelar
                        </button>
                    </div>
                ) : (
                    <button className="btn btn-principal w-auto" onClick={() => setModoEdicion(true)}>
                        <i className="ri-pencil-line me-1" />Editar Progreso
                    </button>
                )}

                <button className="btn btn-principal w-auto btn-user-video" onClick={() => setShowVideo(true)}>
                    <i className="ri-open-arm-fill me-1" />Calentamiento
                </button>
            </div>

            {/* Modal video */}
            <Modal isOpen={showVideo} onRequestClose={() => setShowVideo(false)}
                contentLabel="Video Calentamiento" className="modal-react" overlayClassName="modal-overlay">
                <div className="modal-header">
                    <h5 className="modal-title">Calentamiento</h5>
                    <button type="button" className="close" onClick={() => setShowVideo(false)}>
                        <span>&times;</span>
                    </button>
                </div>
                <div className="modal-body my-2">
                    <p>Recuerda hacer tus ejercicios de calentamiento</p>
                    <div className="ratio ratio-16x9">
                        <iframe src={showVideo ? videoUrl : ''} title="Calentamiento"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setShowVideo(false)}>Cerrar</button>
                </div>
            </Modal>

            {/* Filtros */}
            <div className="row mb-3 align-items-center filtros-rutina">
                <div className="col-md-3">
                    <select className="form-select" value={semanaActual}
                        onChange={e => { setSemanaActual(Number(e.target.value)); setFiltroDia('mensual') }}>
                        {[1, 2, 3, 4].map(s => <option key={s} value={s}>Semana {s}</option>)}
                    </select>
                </div>
                <div className="col-md-3">
                    <select className="form-select" value={filtroDia}
                        onChange={e => setFiltroDia(e.target.value)}>
                        <option value="mensual">Rutina Mensual</option>
                        {diasUnicos.map(d => <option key={d} value={d}>Rutina Día {d}</option>)}
                    </select>
                </div>
            </div>

            {rutinaFiltrada.length === 0 ? (
                <p className="text-center text-muted py-4">Sin ejercicios.</p>
            ) : (
                <>
                    {/* ── TABLA DESKTOP ── */}
                    <div className="tabla-container d-none d-md-block">
                        <table className="table table-bordered text-center align-middle tabla-rutinas">
                            <thead className="table-head">
                                <tr>
                                    <th colSpan={5} className="grupo-rutina">
                                        <p className="titulo-grupo-rutina">Rutina</p>
                                    </th>
                                    <th colSpan={3} className="grupo-progreso">
                                        <p className="titulo-grupo-progreso">Progreso - Semana {semanaActual}</p>
                                    </th>
                                </tr>
                                <tr className="sub-head">
                                    <th>Día</th>
                                    <th>Ejercicio</th>
                                    <th>Serie</th>
                                    <th><span className="desktop-label">Repeticiones</span><span className="mobile-label">Reps</span></th>
                                    <th>Carga</th>
                                    <th>Serie</th>
                                    <th><span className="desktop-label">Repeticiones</span><span className="mobile-label">Reps</span></th>
                                    <th>Carga</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rutinaFiltrada.map((r, index) => {
                                    const filasPorDia = rutinaFiltrada.filter(item => item.dia === r.dia).length
                                    const esPrimero = index === 0 || rutinaFiltrada[index - 1].dia !== r.dia
                                    const prog = r.progresoSemanas[semanaActual]
                                    const key = getKey(r)
                                    return (
                                        <tr key={key}>
                                            {esPrimero && <td rowSpan={filasPorDia} className="grupo-dia">Día {r.dia}</td>}
                                            <td className="text-start">{r.ejercicio}</td>
                                            <td>{r.series}</td>
                                            <td>{r.reps}</td>
                                            <td>{r.carga}</td>
                                            <td>
                                                {modoEdicion
                                                    ? <input type="number" className="input-progreso form-control form-control-sm"
                                                        value={prog.serie}
                                                        onChange={e => handleProgresoChange(key, 'serie', e.target.value)} />
                                                    : prog.serie || ''}
                                            </td>
                                            <td>
                                                {modoEdicion
                                                    ? <input type="number" className="input-progreso"
                                                        value={prog.reps}
                                                        onChange={e => handleProgresoChange(key, 'reps', e.target.value)} />
                                                    : prog.reps || ''}
                                            </td>
                                            <td>
                                                {modoEdicion
                                                    ? <input type="text" className="input-progreso" placeholder="0kg"
                                                        value={prog.carga}
                                                        onChange={e => handleProgresoChange(key, 'carga', e.target.value)} />
                                                    : prog.carga || ''}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* ── TABLAS MOBILE ── */}
                    <div className="d-block d-md-none">

                        {/* Tabla rutina */}
                        <table className="table table-bordered text-center align-middle tabla-rutinas">
                            <thead className="table-head">
                                <tr>
                                    <th colSpan={5} className="grupo-rutina">
                                        <p className="titulo-grupo-rutina">Rutina</p>
                                    </th>
                                </tr>
                                <tr className="sub-head">
                                    <th>Día</th>
                                    <th>Ejercicio</th>
                                    <th>Serie</th>
                                    <th><span className="desktop-label">Repeticiones</span><span className="mobile-label">Reps</span></th>
                                    <th>Carga</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rutinaFiltrada.map((r, index) => {
                                    const filasPorDia = rutinaFiltrada.filter(item => item.dia === r.dia).length
                                    const esPrimero = index === 0 || rutinaFiltrada[index - 1].dia !== r.dia
                                    return (
                                        <tr key={index}>
                                            {esPrimero && <td rowSpan={filasPorDia} className="grupo-dia">Día {r.dia}</td>}
                                            <td className="text-start">{r.ejercicio}</td>
                                            <td>{r.series}</td>
                                            <td>{r.reps}</td>
                                            <td>{r.carga}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>

                        {/* Tabla progreso */}
                        <table className="table table-bordered text-center align-middle tabla-rutinas">
                            <thead className="table-head">
                                <tr>
                                    <th colSpan={5} className="grupo-progreso">
                                        <p className="titulo-grupo-progreso">Progreso - Semana {semanaActual}</p>
                                    </th>
                                </tr>
                                <tr className="sub-head">
                                    <th>Día</th>
                                    <th>Ejercicio</th>
                                    <th>Serie</th>
                                    <th><span className="desktop-label">Repeticiones</span><span className="mobile-label">Reps</span></th>
                                    <th>Carga</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rutinaFiltrada.map((r, index) => {
                                    const filasPorDia = rutinaFiltrada.filter(item => item.dia === r.dia).length
                                    const esPrimero = index === 0 || rutinaFiltrada[index - 1].dia !== r.dia
                                    const prog = r.progresoSemanas[semanaActual]
                                    const key = getKey(r)
                                    return (
                                        <tr key={index}>
                                            {esPrimero && <td rowSpan={filasPorDia} className="grupo-dia">Día {r.dia}</td>}
                                            <td className="text-start">{r.ejercicio}</td>
                                            <td>
                                                {modoEdicion
                                                    ? <input type="number" className="input-progreso form-control form-control-sm"
                                                        value={prog.serie}
                                                        onChange={e => handleProgresoChange(key, 'serie', e.target.value)} />
                                                    : prog.serie || ''}
                                            </td>
                                            <td>
                                                {modoEdicion
                                                    ? <input type="number" className="input-progreso"
                                                        value={prog.reps}
                                                        onChange={e => handleProgresoChange(key, 'reps', e.target.value)} />
                                                    : prog.reps || ''}
                                            </td>
                                            <td>
                                                {modoEdicion
                                                    ? <input type="text" className="input-progreso" placeholder="0kg"
                                                        value={prog.carga}
                                                        onChange={e => handleProgresoChange(key, 'carga', e.target.value)} />
                                                    : prog.carga || ''}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>

                    </div>
                </>
            )}
        </div>
    )
}