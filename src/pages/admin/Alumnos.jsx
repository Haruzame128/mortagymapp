import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Modal from "react-modal";
import { clientesApi } from "../../services/api";
import "../../styles/Admin.css";
import { useHuellaEnrollment } from '../../hooks/useHuellaEnrollment'
import HuellaModal from '../../components/HuellaModal'

Modal.setAppElement("#root");

export default function Alumnos() {
  const navigate = useNavigate();

  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [clienteHuella, setClienteHuella] = useState(null) // cliente al que se le registra
  const [modalHuella, setModalHuella] = useState(false)
  const enroll = useHuellaEnrollment()

  // ── Cargar alumnos ──────────────────────────────────────────────
  const cargarAlumnos = async () => {
    try {
      setLoading(true);
      const data = await clientesApi.getAll();
      setAlumnos(data);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Cuando termina el enrollment, guardar en DB
  useEffect(() => {
    if (enroll.status === 'done' && enroll.template && clienteHuella) {
      clientesApi.update(clienteHuella.id_cliente, { huella: enroll.template })
        .then(() => {
          Swal.fire('¡Listo!', 'Huella registrada correctamente', 'success')
          setModalHuella(false)
          setClienteHuella(null)
        })
        .catch(err => Swal.fire('Error', err.message, 'error'))
    }
  }, [enroll.status, enroll.template])


  useEffect(() => { cargarAlumnos(); }, []);

  // ── Abrir modal con detalle completo ────────────────────────────
  const abrirDetalle = async (a) => {
    setAlumnoSeleccionado(a);
    setIsModalOpen(true);
    setLoadingDetalle(true);
    try {
      const detalle = await clientesApi.getById(a.id_cliente);
      setAlumnoSeleccionado(detalle);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoadingDetalle(false);
    }
  };

  // ── Eliminar alumno ─────────────────────────────────────────────
  const handleToggleActivo = (a) => {
    const desactivar = a.activo_c
    Swal.fire({
      title: desactivar ? '¿Desactivar alumno?' : '¿Reactivar alumno?',
      text: desactivar
        ? `${a.nomap_c} no podrá acceder al sistema`
        : `${a.nomap_c} volverá a estar activo`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: desactivar ? '#dc3545' : '#198754',
      confirmButtonText: desactivar ? 'Sí, desactivar' : 'Sí, reactivar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await clientesApi.remove(a.id_cliente)
          Swal.fire(
            desactivar ? 'Desactivado' : 'Reactivado',
            `El alumno fue ${desactivar ? 'desactivado' : 'reactivado'} correctamente`,
            'success'
          )
          cargarAlumnos()
        } catch (err) {
          Swal.fire('Error', err.message, 'error')
        }
      }
    })
  }

  // ── Filtro por búsqueda ─────────────────────────────────────────
  const alumnosFiltrados = alumnos.filter(a =>
    a.nomap_c?.toLowerCase().includes(busqueda.toLowerCase()) ||
    String(a.dni_u).includes(busqueda)
  );

  // ── Paginación ──────────────────────────────────────────────────
  const filasPorPagina = 5; // <--- cambiar aqui la cantidad de filas por página
  const inicio = (paginaActual - 1) * filasPorPagina;
  const alumnosPagina = alumnosFiltrados.slice(inicio, inicio + filasPorPagina);
  const totalPaginas = Math.ceil(alumnosFiltrados.length / filasPorPagina);

  // Handler para abrir el modal
  const handleRegistrarHuella = async (a) => {
    // Verificar que el agente esté disponible antes de abrir el modal
    try {
      await fetch('http://localhost:3001/api/status', { signal: AbortSignal.timeout(2000) })
    } catch {
      Swal.fire(
        'Lector no disponible',
        'El servicio de huella dactilar no está activo en esta máquina. Verificá que el agente esté corriendo.',
        'warning'
      )
      return
    }
    setClienteHuella(a)
    setModalHuella(true)
    enroll.start(String(a.dni_u))
  }

  const handleCerrarHuella = () => {
    if (enroll.status !== 'done') enroll.cancel()
    setModalHuella(false)
    setClienteHuella(null)
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Gestión de Alumnos</h3>
        <button className="btn btn-admin" onClick={() => navigate("/admin/alumnos/nuevo")}>
          <i className="ri-add-line"></i> Nuevo alumno
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Buscar por nombre o DNI..."
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setPaginaActual(1); }}
        />
      </div>

      {/* TABLA */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status" />
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Nombre completo</th>
                <th>DNI</th>
                <th>Disciplinas</th>
                <th>Cuota al día</th>
                <th>Ficha médica</th>
                <th className="text-center">Opciones</th>
              </tr>
            </thead>
            <tbody>
              {alumnosPagina.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No se encontraron alumnos
                  </td>
                </tr>
              ) : (
                alumnosPagina.map((a) => (
                  <tr key={a.id_cliente} className={!a.activo_c ? 'table-secondary text-muted' : ''}>
                    <td>{a.nomap_c}</td>
                    <td>{a.dni_u}</td>
                    <td>
                      {a.disciplinas
                        ? a.disciplinas
                        : <span className="text-muted">Sin inscripciones</span>}
                    </td>
                    <td>
                      <span className={`badge ${a.cuota_al_dia ? "bg-success" : "bg-danger"}`}>
                        {a.cuota_al_dia ? "Sí" : "No"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${a.tiene_ficha ? "bg-success" : "bg-warning text-dark"}`}>
                        {a.tiene_ficha ? "Sí" : "Pendiente"}
                      </span>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-secondary me-1"
                        title="Ver detalle"
                        onClick={() => abrirDetalle(a)}>
                        <i className="ri-eye-fill"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-secondary me-1"
                        title="Editar"
                        onClick={() => navigate(`/admin/alumnos/nuevo?id=${a.id_cliente}`)}>
                        <i className="ri-pencil-fill"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-secondary me-1"
                        title={a.huella_c ? 'Actualizar huella' : 'Registrar huella'}
                        onClick={() => handleRegistrarHuella(a)}>
                        <i className={a.huella_c ? 'ri-fingerprint-fill' : 'ri-fingerprint-line'}></i>
                      </button>
                      <button
                        className={`btn btn-sm ${a.activo_c ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        title={a.activo_c ? 'Desactivar' : 'Reactivar'}
                        onClick={() => handleToggleActivo(a)}>
                        <i className={a.activo_c ? 'ri-close-circle-fill' : 'ri-checkbox-circle-fill'}></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINACIÓN */}
      {totalPaginas > 1 && (
        <nav className="d-flex justify-content-center">
          <ul className="pagination">
            {Array.from({ length: totalPaginas }).map((_, i) => (
              <li key={i} className={`nav-item ${paginaActual === i + 1 ? "navlink-active" : ""}`}>
                <button className="nav-link" onClick={() => setPaginaActual(i + 1)}>
                  {i + 1}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* MODAL DETALLE */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => { setIsModalOpen(false); setAlumnoSeleccionado(null); }}
        contentLabel="Detalle del alumno"
        className="modal-react"
        overlayClassName="modal-overlay"
      >
        <div className="modal-header">
          <h5 className="modal-title">Información del alumno</h5>
          <button type="button" className="close" onClick={() => setIsModalOpen(false)}>
            <span>&times;</span>
          </button>
        </div>

        <div className="modal-body">
          {loadingDetalle ? (
            <div className="text-center py-4">
              <div className="spinner-border text-secondary" role="status" />
            </div>
          ) : alumnoSeleccionado && (
            <>
              <ul className="list-group list-group-flush mb-3">
                <li className="list-group-item">
                  <strong>Nombre:</strong> {alumnoSeleccionado.nomap_c}
                </li>
                <li className="list-group-item">
                  <strong>DNI:</strong> {alumnoSeleccionado.dni_u}
                </li>
                {alumnoSeleccionado.direccion_c && (
                  <li className="list-group-item">
                    <strong>Dirección:</strong> {alumnoSeleccionado.direccion_c}
                  </li>
                )}
                {alumnoSeleccionado.telefono_c && (
                  <li className="list-group-item">
                    <strong>Teléfono:</strong> {alumnoSeleccionado.telefono_c}
                  </li>
                )}
                {alumnoSeleccionado.fecha_nac_c && (
                  <li className="list-group-item">
                    <strong>Fecha de nacimiento:</strong>{" "}
                    {new Date(alumnoSeleccionado.fecha_nac_c).toLocaleDateString('es-AR')}
                  </li>
                )}
                <li className="list-group-item">
                  <strong>Ficha médica:</strong>{" "}
                  {alumnoSeleccionado.tiene_ficha ? "Cargada" : "Pendiente"}
                </li>
                {alumnoSeleccionado.venc_ficha_medica && (
                  <li className="list-group-item">
                    <strong>Venc. ficha médica:</strong>{" "}
                    {new Date(alumnoSeleccionado.venc_ficha_medica).toLocaleDateString('es-AR')}
                  </li>
                )}
              </ul>

              {/* Inscripciones */}
              {alumnoSeleccionado.inscripciones?.length > 0 && (
                <>
                  <h6 className="fw-semibold mb-2">Inscripciones</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Disciplina</th>
                          <th>Actividad</th>
                          <th>Horario</th>
                          <th>Días/sem</th>
                          <th>Entradas</th>
                          <th>Cuota</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alumnoSeleccionado.inscripciones.map((i) => (
                          <tr key={i.id_inscripto}>
                            <td>{i.nombre_d}</td>
                            <td>{i.nombre_a}</td>
                            <td>
                              {i.dia_h && i.hora_h
                                ? `${i.dia_h} ${i.hora_h.slice(0, 5)}`
                                : <span className="text-muted">—</span>}
                            </td>
                            <td>{i.cantidad_dias ?? '—'}</td>
                            <td>
                              {i.entradas_restantes != null
                                ? `${i.entradas_restantes}/${i.entradas_totales}`
                                : '—'}
                            </td>
                            <td>
                              <span className={`badge ${i.pago_s ? "bg-success" : "bg-danger"}`}>
                                {i.pago_s ? "Sí" : "No"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
            Cerrar
          </button>
        </div>
      </Modal>
      <HuellaModal
        isOpen={modalHuella}
        status={enroll.status}
        step={enroll.step}
        error={enroll.error}
        onClose={handleCerrarHuella}
        onRetry={() => clienteHuella && enroll.start(String(clienteHuella.dni_u))}
      />
    </>
  );

}