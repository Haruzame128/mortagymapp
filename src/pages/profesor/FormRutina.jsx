import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { ejercicios as ejerciciosLocales } from "../../data/ejercicios";
import { profesorApi } from "../../services/api";

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const ejVacio = () => ({ musculo: '', ejercicio: '', id_ejercicio: '', series: 0, repeticiones: 0, peso: 0 })

export default function FormRutina() {
    const location = useLocation()
    const navigate = useNavigate()

    const alumnoSeleccionado = location.state?.alumno || null

    const [alumnos, setAlumnos] = useState([])
    const [alumnoId, setAlumnoId] = useState(alumnoSeleccionado?.id || '')
    const [guardando, setGuardando] = useState(false)
    const [loading, setLoading] = useState(false)

    const mesActual = MESES[new Date().getMonth()]
    const [mes, setMes] = useState(mesActual)
    const [semana, setSemana] = useState(1)

    const [ejerciciosCat, setEjerciciosCat] = useState(ejerciciosLocales)

    useEffect(() => {
        profesorApi.getAlumnos()
            .then(data => {
                const unicos = Object.values(
                    data.reduce((acc, a) => {
                        if (!acc[a.id_cliente]) {
                            acc[a.id_cliente] = {
                                id: a.id_cliente,
                                nombre: a.nomap_c,
                                disciplina: a.nombre_d,
                                cantidad_dias: a.cantidad_dias || 3,
                                patologias: a.patologias || 'Sin patologías',
                                rutina: a.tiene_rutina,
                            }
                        }
                        return acc
                    }, {})
                )
                setAlumnos(unicos)
            })
            .catch(console.error)

        profesorApi.getEjercicios()
            .then(data => {
                if (data.length > 0)
                    setEjerciciosCat(data.map(e => ({ ...e, musculo: e.categoria_e, nombre: e.nombre_e })))
            })
            .catch(() => { })
    }, [])

    const alumnoActual = alumnos.find(a => Number(a.id) === Number(alumnoId)) || alumnoSeleccionado
    const diasCliente = alumnoActual?.cantidad_dias || 3
    const patologias = alumnoActual?.patologias || 'Sin patologías'
    const musculos = [...new Set(ejerciciosCat.map(e => e.musculo))].sort()

    const [rutina, setRutina] = useState([])

    // Reinicializar cuando cambia el alumno
    useEffect(() => {
        setRutina(Array.from({ length: diasCliente }, (_, i) => ({
            dia: i + 1, ejercicios: [ejVacio()]
        })))
    }, [diasCliente])

    // Cargar rutina al cambiar alumno, mes o semana
    useEffect(() => {
        if (!alumnoId) return
        setLoading(true)
        profesorApi.getRutina(alumnoId, mes, semana)
            .then(data => {
                if (data.length === 0) {
                    setRutina(Array.from({ length: diasCliente }, (_, i) => ({
                        dia: i + 1, ejercicios: [ejVacio()]
                    })))
                    return
                }
                const diasMap = {}
                for (const row of data) {
                    if (!diasMap[row.dia_r]) diasMap[row.dia_r] = { dia: row.dia_r, ejercicios: [] }
                    diasMap[row.dia_r].ejercicios.push({
                        musculo: row.categoria_e,
                        ejercicio: row.nombre_e,
                        id_ejercicio: row.id_ejercicio,
                        series: row.series_r,
                        repeticiones: row.repeticiones_r,
                        peso: row.peso_r,
                    })
                }
                setRutina(Object.values(diasMap).sort((a, b) => a.dia - b.dia))
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [alumnoId, mes, semana])

    // ── Handlers ───────────────────────────────────────────────────
    const agregarEjercicio = (diaIndex) => {
        setRutina(prev => prev.map((d, i) =>
            i !== diaIndex ? d : { ...d, ejercicios: [...d.ejercicios, ejVacio()] }
        ))
    }

    const actualizarCampo = (diaIndex, ejIndex, campo, valor) => {
        setRutina(prev => prev.map((dia, i) =>
            i !== diaIndex ? dia : {
                ...dia,
                ejercicios: dia.ejercicios.map((ej, j) =>
                    j !== ejIndex ? ej : { ...ej, [campo]: valor }
                )
            }
        ))
    }

    const handleMusculo = (diaIndex, ejIndex, musculo) => {
        setRutina(prev => prev.map((dia, i) =>
            i !== diaIndex ? dia : {
                ...dia,
                ejercicios: dia.ejercicios.map((ej, j) =>
                    j !== ejIndex ? ej : { ...ej, musculo, ejercicio: '', id_ejercicio: '' }
                )
            }
        ))
    }

    const handleEjercicio = (diaIndex, ejIndex, nombre) => {
        const cat = ejerciciosCat.find(e => (e.nombre || e.nombre_e) === nombre)
        setRutina(prev => prev.map((dia, i) =>
            i !== diaIndex ? dia : {
                ...dia,
                ejercicios: dia.ejercicios.map((ej, j) =>
                    j !== ejIndex ? ej : { ...ej, ejercicio: nombre, id_ejercicio: cat?.id_ejercicio || '' }
                )
            }
        ))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!alumnoId) { Swal.fire('Error', 'Seleccioná un alumno', 'error'); return }
        setGuardando(true)
        try {
            await profesorApi.guardarRutina({
                id_cliente: Number(alumnoId),
                mes,
                semana,
                dias: rutina.map(dia => ({
                    dia: dia.dia,
                    ejercicios: dia.ejercicios
                        .filter(ej => ej.id_ejercicio)
                        .map(ej => ({
                            id_ejercicio: Number(ej.id_ejercicio),
                            series: Number(ej.series) || 0,
                            repeticiones: Number(ej.repeticiones) || 0,
                            peso: Number(ej.peso) || 0,
                        }))
                }))
            })
            Swal.fire('¡Listo!', 'Rutina guardada correctamente', 'success').then(() => {
                navigate('/profesor/alumnos-profesor')
            })
        } catch (err) {
            Swal.fire('Error', err.message, 'error')
        } finally {
            setGuardando(false)
        }
    }

    // ── Render ─────────────────────────────────────────────────────
    return (
        <div>
            <form className="card p-4 shadow-sm" translate="no" onSubmit={handleSubmit}>
                <h4 className="fw-bold mb-4 text-center">Cargar rutina</h4>

                <div className="row mb-3">
                    <div className="col-12 col-md-4 mb-3">
                        <label className="form-label">Alumno</label>
                        <select className="form-select" value={alumnoId}
                            onChange={e => setAlumnoId(Number(e.target.value))}>
                            <option value="">Seleccionar alumno</option>
                            {alumnos.map(a => (
                                <option key={a.id} value={a.id} translate="no">{a.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-12 col-md-4 mb-3">
                        <label className="form-label">Patologías</label>
                        <input type="text" disabled className="form-control input-patologias"
                            value={patologias} />
                    </div>
                    <div className="col-12 col-md-2 mb-3">
                        <label className="form-label">Mes</label>
                        <select className="form-select" value={mes} onChange={e => setMes(e.target.value)}>
                            {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="col-12 col-md-2 mb-3">
                        <label className="form-label">Semana</label>
                        <select className="form-select" value={semana}
                            onChange={e => setSemana(Number(e.target.value))}>
                            {[1, 2, 3, 4].map(s => <option key={s} value={s}>Semana {s}</option>)}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-secondary" role="status" />
                    </div>
                ) : (
                    rutina.map((dia, diaIndex) => {
                        const collapseId = `flush-collapse-${diaIndex}`
                        const headingId = `flush-heading-${diaIndex}`
                        return (
                            <div key={dia.dia} className="mb-2">
                                <div className="accordion accordion-flush rutina-accordion" id="accordionRutina">
                                    <div className="accordion-item">
                                        <h2 className="accordion-header" id={headingId}>
                                            <button
                                                className={`accordion-button ${diaIndex !== 0 ? 'collapsed' : ''}`}
                                                type="button"
                                                data-bs-toggle="collapse"
                                                data-bs-target={`#${collapseId}`}
                                                aria-expanded={diaIndex === 0 ? 'true' : 'false'}
                                                aria-controls={collapseId}>
                                                Dia de Rutina: {dia.dia}
                                            </button>
                                        </h2>
                                        <div id={collapseId}
                                            className={`accordion-collapse collapse ${diaIndex === 0 ? 'show' : ''}`}
                                            aria-labelledby={headingId}
                                            data-bs-parent="#accordionRutina">
                                            <div className="accordion-body">
                                                {dia.ejercicios.map((ej, ejIndex) => {
                                                    const ejerciciosFiltrados = ejerciciosCat.filter(e => e.musculo === ej.musculo)
                                                    return (
                                                        <div key={ejIndex} className="row g-3 mb-3 align-items-end">
                                                            <div className="col-12 col-lg-4">
                                                                <label className="col col-form-label">Músculo</label>
                                                                <select className="form-select"
                                                                    value={ej.musculo}
                                                                    onChange={e => handleMusculo(diaIndex, ejIndex, e.target.value)}>
                                                                    <option value="">Selecciona un músculo</option>
                                                                    {musculos.map(m => (
                                                                        <option key={m} value={m} translate="no">{m}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className="col-12 col-lg-4">
                                                                <label className="col col-form-label">Ejercicio</label>
                                                                <select className="form-select"
                                                                    disabled={!ej.musculo}
                                                                    value={ej.ejercicio}
                                                                    onChange={e => handleEjercicio(diaIndex, ejIndex, e.target.value)}>
                                                                    <option value="">
                                                                        {ej.musculo ? 'Elige el ejercicio' : 'Primero elige un músculo'}
                                                                    </option>
                                                                    {ejerciciosFiltrados.map((e, idx) => (
                                                                        <option key={idx} value={e.nombre || e.nombre_e} translate="no">
                                                                            {e.nombre || e.nombre_e}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className="col-4 col-md-2 col-lg-1">
                                                                <label className="form-label">Series</label>
                                                                <input type="number" className="form-control"
                                                                    value={ej.series}
                                                                    onChange={e => actualizarCampo(diaIndex, ejIndex, 'series', e.target.value)}
                                                                    placeholder="0" />
                                                            </div>
                                                            <div className="col-4 col-md-2 col-lg-1">
                                                                <label className="form-label">Reps</label>
                                                                <input type="number" className="form-control"
                                                                    value={ej.repeticiones}
                                                                    onChange={e => actualizarCampo(diaIndex, ejIndex, 'repeticiones', e.target.value)}
                                                                    placeholder="0" />
                                                            </div>
                                                            <div className="col-4 col-md-2 col-lg-1">
                                                                <label className="form-label">Peso</label>
                                                                <input type="number" className="form-control"
                                                                    value={ej.peso}
                                                                    onChange={e => actualizarCampo(diaIndex, ejIndex, 'peso', e.target.value)}
                                                                    placeholder="0" />
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                                <div className="d-flex justify-content-start gap-2">
                                                    <button type="button" className="btn btn-ejercicio"
                                                        onClick={() => agregarEjercicio(diaIndex)}>
                                                        + Ejercicio
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}

                <div className="d-flex flex-column flex-md-row justify-content-end gap-2 mt-3">
                    <button type="button" className="btn btn-outline-secondary"
                        onClick={() => navigate('/profesor/alumnos-profesor')}>
                        Volver
                    </button>
                    <button type="reset" className="btn btn-outline-secondary">Limpiar</button>
                    <button type="submit" className="btn btn-success" disabled={guardando}>
                        {guardando ? 'Guardando...' : 'GUARDAR RUTINA'}
                    </button>
                </div>
            </form>
        </div>
    )
}