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

export default function VerRutina() {

    const mesActual = MESES[new Date().getMonth()]
    const [mes, setMes] = useState(mesActual)
    const [rutinaData, setRutinaData] = useState([])
    const [loading, setLoading] = useState(true)
    const [filtroDia, setFiltroDia] = useState('mensual')
    const [rangoSemana, setRangoSemana] = useState(1)
    const [modoEdicion, setModoEdicion] = useState(false)
    const [guardando, setGuardando] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // ── Cargar rutina desde API ─────────────────────────────────────
    useEffect(() => {
        setLoading(true)
        perfilApi.getRutina(mes)
            .then(rows => {
                // Agrupar por (dia_r + ejercicio) tomando progreso por semana
                const mapa = {}
                for (const row of rows) {
                    const key = `${row.dia_r}-${row.ejercicio}-${row.semana_c}`
                    if (!mapa[key]) {
                        mapa[key] = {
                            id: row.id_rutina,
                            semana: row.semana_c,
                            dia: row.dia_r,
                            ejercicio: row.ejercicio,
                            series: row.series_r,
                            reps: row.repeticiones_r,
                            carga: row.peso_r ? `${row.peso_r}kg` : '—',
                            // id_rutina por semana (para guardar progreso)
                            rutinaPorSemana: { [row.semana_c]: row.id_rutina },
                            progreso: {
                                1: { serie: '', reps: '', carga: '' },
                                2: { serie: '', reps: '', carga: '' },
                                3: { serie: '', reps: '', carga: '' },
                                4: { serie: '', reps: '', carga: '' },
                            }
                        }
                    }
                    // Guardar progreso de esta semana si existe
                    if (row.series_cliente != null || row.repeticion_cliente != null || row.peso_cliente != null) {
                        mapa[key].progreso[row.semana_c] = {
                            serie: row.series_cliente != null ? String(row.series_cliente) : '',
                            reps: row.repeticion_cliente != null ? String(row.repeticion_cliente) : '',
                            carga: row.peso_cliente != null ? String(row.peso_cliente) : '',
                        }
                    }
                }
                setRutinaData(Object.values(mapa).sort((a, b) =>
                    a.semana - b.semana || a.dia - b.dia || a.ejercicio.localeCompare(b.ejercicio)
                ))
            })
            .catch(err => Swal.fire('Error', err.message, 'error'))
            .finally(() => setLoading(false))
    }, [mes])

    // ── Semanas visibles ────────────────────────────────────────────
    const semanasVisibles = { 1: [1, 2], 2: [2, 3], 3: [3, 4] }[rangoSemana]

    // Filtrar por día y por semanas visibles
    const rutinaFiltrada = rutinaData.filter(r => {
        const enSemana = semanasVisibles.includes(r.semana)
        const enDia = filtroDia === 'mensual' || Number(r.dia) === Number(filtroDia)
        return enSemana && enDia
    })

    // Días únicos para el selector
    const diasUnicos = [...new Set(rutinaData.map(r => r.dia))].sort((a, b) => a - b)

    // ── Edición de progreso ─────────────────────────────────────────
    const handleProgresoChange = (id, semana, campo, valor) => {
        setRutinaData(prev => prev.map(item =>
            item.id !== id ? item : {
                ...item,
                progreso: {
                    ...item.progreso,
                    [semana]: { ...item.progreso?.[semana], [campo]: valor }
                }
            }
        ))
    }

    // ── Guardar progreso ────────────────────────────────────────────
    const guardarProgreso = async () => {
        setGuardando(true)
        try {
            const promesas = rutinaFiltrada.flatMap(r =>
                semanasVisibles.map(semana => {
                    const prog = r.progreso?.[semana]
                    if (!prog?.serie && !prog?.reps && !prog?.carga) return null
                    const idRutina = r.semana === semana ? r.id : null
                    if (!idRutina) return null
                    return perfilApi.guardarProgreso({
                        id_rutina: idRutina,
                        semana,
                        series: Number(prog.serie) || 0,
                        repeticiones: Number(prog.reps) || 0,
                        peso: Number(prog.carga) || 0,
                    })
                }).filter(Boolean)
            )
            await Promise.all(promesas)
            Swal.fire('¡Listo!', 'Progreso guardado correctamente', 'success')
            setModoEdicion(false)
        } catch (err) {
            Swal.fire('Error', err.message, 'error')
        } finally {
            setGuardando(false)
        }
    }

    // ── Generar PDF ─────────────────────────────────────────────────
    const generarPDF = async () => {
        const pdf = new jsPDF('landscape', 'pt', 'a3')
        pdf.addImage(logo, 'PNG', 15, 10, 60, 60)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(18)
        pdf.text('Rutina Mensual', 100, 55)

        const todasLasSemanas = [1, 2, 3, 4]
        const head = [
            [
                { content: 'RUTINA', colSpan: 5, styles: { halign: 'center' } },
                ...todasLasSemanas.map(() => ({ content: 'PROGRESO', colSpan: 3, styles: { halign: 'center' } }))
            ],
            ['DÍA', 'EJERCICIO', 'SERIES', 'REPETICIONES', 'CARGA',
                ...todasLasSemanas.flatMap(s => [`S${s} - Serie`, `S${s} - Reps`, `S${s} - Carga`])]
        ]

        // Para PDF usar semana 1 como base de ejercicios
        const paraExportar = rutinaData.filter(r => r.semana === 1)
        const filas = paraExportar.map(item => {
            const fila = [`Día ${item.dia}`, item.ejercicio, item.series, item.reps, item.carga]
            todasLasSemanas.forEach(semana => {
                fila.push(
                    item.progreso?.[semana]?.serie || '',
                    item.progreso?.[semana]?.reps || '',
                    item.progreso?.[semana]?.carga || ''
                )
            })
            return fila
        })

        autoTable(pdf, {
            head, body: filas, startY: 100,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: { top: 8, bottom: 8, left: 4, right: 4 }, halign: 'center', valign: 'middle' },
            headStyles: { fillColor: [32, 104, 190], textColor: 255, fontStyle: 'bold' },
            tableWidth: 'auto',
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

    if (rutinaData.length === 0) return (
        <div className="text-center py-5 text-muted">
            <i className="ri-file-list-3-line fs-1 mb-3 d-block"></i>
            <p>No tenés una rutina cargada para {mes}.</p>
        </div>
    )

    return (
        <div>
            {/* Acciones */}
            <div className="acciones-rutina d-flex gap-2 mb-4">
                <button className="btn btn-principal w-auto" onClick={generarPDF}>
                    <i className="ri-file-text-line me-1" />Descargar Rutina
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
                        <i className="ri-pencil-line me-1" />Agregar Progreso
                    </button>
                )}
            </div>

            {/* Filtros */}
            <div className="row mb-3 align-items-center filtros-rutina">
                <div className="col-md-3">
                    <select className="form-select" value={mes} onChange={e => setMes(e.target.value)}>
                        {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div className="col-md-3">
                    <select className="form-select" value={filtroDia}
                        onChange={e => setFiltroDia(e.target.value)}>
                        <option value="mensual">Rutina Mensual</option>
                        {diasUnicos.map(d => (
                            <option key={d} value={d}>Rutina Día {d}</option>
                        ))}
                    </select>
                </div>
                <div className="col-md-3">
                    <select className="form-select" value={rangoSemana}
                        onChange={e => setRangoSemana(Number(e.target.value))}>
                        <option value={1}>Semana 1 y 2</option>
                        <option value={2}>Semana 2 y 3</option>
                        <option value={3}>Semana 3 y 4</option>
                    </select>
                </div>
                <p className="col-md-3 mb-0">Acordate de hacer tu ejercicio de Calentamiento</p>
            </div>

            {/* Tabla */}
            <div className="tabla-container">
                <table className="table table-bordered text-center align-middle tabla-rutinas">
                    <thead className="table-head">
                        <tr>
                            <th colSpan={5} className="grupo-rutina">
                                <p className="titulo-grupo-rutina">Rutina</p>
                            </th>
                            {semanasVisibles.map(semana => (
                                <th key={semana} colSpan={3} className="grupo-progreso">
                                    <p className="titulo-grupo-progreso">Progreso - Semana {semana}</p>
                                </th>
                            ))}
                        </tr>
                        <tr className="sub-head">
                            <th>Día</th>
                            <th>Ejercicio</th>
                            <th>Serie</th>
                            <th>
                                <span className="desktop-label">Repeticiones</span>
                                <span className="mobile-label">Reps</span>
                            </th>
                            <th>Carga</th>
                            {semanasVisibles.map(semana => (
                                <React.Fragment key={semana}>
                                    <th>Serie</th>
                                    <th>
                                        <span className="desktop-label">Repeticiones</span>
                                        <span className="mobile-label">Reps</span>
                                    </th>
                                    <th>Carga</th>
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rutinaFiltrada.map((r, index) => {
                            const filasPorDia = rutinaFiltrada.filter(item => item.dia === r.dia && item.semana === r.semana).length
                            const esPrimero = index === 0 ||
                                rutinaFiltrada[index - 1].dia !== r.dia ||
                                rutinaFiltrada[index - 1].semana !== r.semana

                            return (
                                <tr key={`${r.id}-${r.semana}`}>
                                    {esPrimero && (
                                        <td rowSpan={filasPorDia} className="grupo-dia">
                                            Día {r.dia}
                                        </td>
                                    )}
                                    <td className="text-start">{r.ejercicio}</td>
                                    <td>{r.series}</td>
                                    <td>{r.reps}</td>
                                    <td>{r.carga}</td>

                                    {semanasVisibles.map(semana => (
                                        <React.Fragment key={semana}>
                                            <td>
                                                {modoEdicion && r.semana === semana ? (
                                                    <input type="number"
                                                        value={r.progreso?.[semana]?.serie || ''}
                                                        onChange={e => handleProgresoChange(r.id, semana, 'serie', e.target.value)}
                                                        className="input-progreso form-control form-control-sm" />
                                                ) : r.progreso?.[semana]?.serie || ''}
                                            </td>
                                            <td>
                                                {modoEdicion && r.semana === semana ? (
                                                    <input type="number"
                                                        value={r.progreso?.[semana]?.reps || ''}
                                                        onChange={e => handleProgresoChange(r.id, semana, 'reps', e.target.value)}
                                                        className="input-progreso" />
                                                ) : r.progreso?.[semana]?.reps || ''}
                                            </td>
                                            <td>
                                                {modoEdicion && r.semana === semana ? (
                                                    <input type="text"
                                                        value={r.progreso?.[semana]?.carga || ''}
                                                        onChange={e => handleProgresoChange(r.id, semana, 'carga', e.target.value)}
                                                        className="input-progreso" placeholder="0kg" />
                                                ) : r.progreso?.[semana]?.carga || ''}
                                            </td>
                                        </React.Fragment>
                                    ))}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}