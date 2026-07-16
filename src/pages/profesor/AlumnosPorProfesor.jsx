import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Modal from "react-modal";
import TablaPerfil from "../../components/TablaPerfil";
import { profesorApi } from "../../services/api";

Modal.setAppElement("#root")

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function AlumnosPorProfesor() {
  const navigate = useNavigate()

  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [disciplina, setDisciplina] = useState("")
  const [paginaActual, setPaginaActual] = useState(1)

  // Modal progreso
  const [modalProgreso, setModalProgreso] = useState(false)
  const [alumnoProgreso, setAlumnoProgreso] = useState(null)
  const [progresoData, setProgresoData] = useState([])
  const [loadingProgreso, setLoadingProgreso] = useState(false)
  const mesActual = MESES[new Date().getMonth()]
  const [mesProgreso, setMesProgreso] = useState(mesActual)

  useEffect(() => {
    profesorApi.getAlumnos()
      .then(data => {
        const agrupados = Object.values(
          data.reduce((acc, a) => {
            if (!acc[a.id_cliente]) {
              acc[a.id_cliente] = {
                id: a.id_cliente,
                nombre: a.nomap_c,
                disciplina: a.nombre_d,
                horarios: [],
                rutina: a.tiene_rutina,
                cantidad_dias: a.cantidad_dias,
                patologias: a.patologias || 'Sin patologías',
              }
            }
            if (a.dia_h && a.hora_h) {
              acc[a.id_cliente].horarios.push(`${a.dia_h} ${a.hora_h.slice(0, 5)}hs`)
            }
            return acc
          }, {})
        ).map(a => ({ ...a, horario: a.horarios.join(' / ') }))
        setAlumnos(agrupados)
      })
      .catch(err => Swal.fire("Error", err.message, "error"))
      .finally(() => setLoading(false))
  }, [])

  const irACargarRutina = (alumno) => {
    navigate("/profesor/form-rutina", { state: { alumno } })
  }

  const abrirProgreso = async (alumno) => {
    setAlumnoProgreso(alumno)
    setModalProgreso(true)
    setLoadingProgreso(true)
    try {
      const data = await profesorApi.getProgreso(alumno.id, mesProgreso)
      setProgresoData(data)
    } catch (err) {
      Swal.fire("Error", err.message, "error")
    } finally {
      setLoadingProgreso(false)
    }
  }

  // Recargar progreso cuando cambia el mes
  useEffect(() => {
    if (!modalProgreso || !alumnoProgreso) return
    setLoadingProgreso(true)
    profesorApi.getProgreso(alumnoProgreso.id, mesProgreso)
      .then(setProgresoData)
      .catch(console.error)
      .finally(() => setLoadingProgreso(false))
  }, [mesProgreso, modalProgreso])

  const disciplinas = [...new Set(alumnos.map(a => a.disciplina))]

  const manejarOrdenar = (key) => {
    setAlumnos([...alumnos].sort((a, b) => (a[key] > b[key] ? 1 : -1)))
  }

  const filtrados = alumnos.filter(a =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
    (!disciplina || a.disciplina.toLowerCase().includes(disciplina.toLowerCase()))
  )

  const columnas = [
    { key: "nombre", label: "Nombre", ordenable: true },
    { key: "disciplina", label: "Disciplina", ordenable: true },
    { key: "horario", label: "Horario", ordenable: false },
    {
      key: "rutina",
      label: "Rutina",
      render: (fila) => {
        if (fila.rutina === true || fila.rutina === 'true') {
          return (
            <div className="d-flex gap-1 flex-wrap justify-content-center">
              <button className="btn btn-sm btn-outline-primary"
                title="Editar / Nueva semana"
                onClick={() => irACargarRutina(fila)}>
                <i className="ri-pencil-line"></i>
              </button>
              <button className="btn btn-sm btn-outline-secondary"
                title="Ver progreso"
                onClick={() => abrirProgreso(fila)}>
                <i className="ri-bar-chart-line"></i>
              </button>
            </div>
          )
        }
        if (fila.rutina === false || fila.rutina === 'false') {
          return (
            <button className="btn btn-sm btn-outline-primary"
              onClick={() => irACargarRutina(fila)}>
              Cargar
            </button>
          )
        }
        return "-"
      },
    },
  ]

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-secondary" role="status" />
    </div>
  )

  return (
    <div className="listado-alumnos" translate="no">
      <div className="row mb-3">
        <div className="col-md-4">
          <input className="form-control" placeholder="Nombre"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)} />
        </div>
        <div className="col-md-4">
          <select className="form-select" value={disciplina}
            onChange={e => setDisciplina(e.target.value)}>
            <option value="">Todas</option>
            {disciplinas.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <button className="btn btn-principal btn-horario" hidden>Ver Horario</button>
      </div>

      <TablaPerfil
        columnas={columnas}
        datos={filtrados}
        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        onOrdenar={manejarOrdenar}
      />

      {/* MODAL PROGRESO */}
      <Modal
        isOpen={modalProgreso}
        onRequestClose={() => setModalProgreso(false)}
        contentLabel="Progreso del alumno"
        className="modal-react"
        overlayClassName="modal-overlay"
        style={{ content: { maxWidth: '900px', maxHeight: '85vh', overflowY: 'auto' } }}
      >
        <div className="modal-header">
          <h5 className="modal-title">
            Progreso — {alumnoProgreso?.nombre}
          </h5>
          <button type="button" className="close" onClick={() => setModalProgreso(false)}>
            <span>&times;</span>
          </button>
        </div>

        <div className="modal-body">
          <div className="mb-3">
            <select className="form-select form-select-sm w-auto"
              value={mesProgreso}
              onChange={e => setMesProgreso(e.target.value)}>
              {MESES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {loadingProgreso ? (
            <div className="text-center py-4">
              <div className="spinner-border text-secondary" role="status" />
            </div>
          ) : progresoData.length === 0 ? (
            <p className="text-muted text-center py-3">
              Sin progreso registrado para {mesProgreso}.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-bordered text-center align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Semana</th>
                    <th>Día</th>
                    <th className="text-start">Ejercicio</th>
                    <th>Rutina S.</th>
                    <th>Rutina R.</th>
                    <th>Rutina Kg</th>
                    <th>Real S.</th>
                    <th>Real R.</th>
                    <th>Real Kg</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {progresoData.map((p, idx) => (
                    <tr key={idx}
                      className={p.series_cliente == null ? 'table-light text-muted' : ''}>
                      <td>S{p.semana_c}</td>
                      <td>Día {p.dia_r}</td>
                      <td className="text-start">{p.ejercicio}</td>
                      <td>{p.series_r}</td>
                      <td>{p.repeticiones_r}</td>
                      <td>{p.peso_r}kg</td>
                      <td>{p.series_cliente ?? '—'}</td>
                      <td>{p.repeticion_cliente ?? '—'}</td>
                      <td>{p.peso_cliente != null ? `${p.peso_cliente}kg` : '—'}</td>
                      <td>
                        {p.fecha
                          ? new Date(p.fecha).toLocaleDateString('es-AR')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setModalProgreso(false)}>
            Cerrar
          </button>
        </div>
      </Modal>
    </div>
  )
}