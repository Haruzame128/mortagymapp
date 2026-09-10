import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { clientesApi, disciplinasApi, revisionesApi } from "../../services/api";
import PaginacionTabla from "../../components/PaginacionTabla";
import { abrirDialogoAptoMedico, badgeAptoMedico } from "../../utils/aptoMedico";
import "../../styles/Admin.css";
import { useHuellaEnrollment } from '../../hooks/useHuellaEnrollment'
import HuellaModal from '../../components/HuellaModal'

export default function Alumnos() {
  const navigate = useNavigate();

  const [alumnos, setAlumnos] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [pendientesRevision, setPendientesRevision] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState(10);
  const [busqueda, setBusqueda] = useState("");
  const [clienteHuella, setClienteHuella] = useState(null)
  const [modalHuella, setModalHuella] = useState(false)
  const [filtros, setFiltros] = useState({
    disciplina: '',
    aptomedico: '',
    cuota: '',
    huella: '',
    activo: ''
  })
  const enroll = useHuellaEnrollment()

  // ── Cargar alumnos y disciplinas ─────────────────────────────────
  const cargarAlumnos = async () => {
    try {
      setLoading(true);
      const [dataAlumnos, dataDisciplinas, dataRevisionesPendientes] = await Promise.all([
        clientesApi.getAll(),
        disciplinasApi.getAll(),
        // Solo aplica a Natación; si falla no debe romper el listado de alumnos.
        revisionesApi.getAll({ pendientes: true }).catch(() => []),
      ]);
      setAlumnos(dataAlumnos);
      setDisciplinas(dataDisciplinas);
      setPendientesRevision(new Set(dataRevisionesPendientes.map((r) => String(r.id_cliente))));
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Cuando termina el enrollment, guardar en DB
  useEffect(() => {
    if (enroll.status === 'done' && enroll.template && clienteHuella) {
      clientesApi.addHuella(clienteHuella.id_cliente, enroll.template)
        .then(() => {
          Swal.fire('¡Listo!', 'Huella registrada correctamente', 'success')
          setModalHuella(false)
          setClienteHuella(null)
          cargarAlumnos()
        })
        .catch(err => Swal.fire('Error', err.message, 'error'))
    }
  }, [enroll.status, enroll.template])


  useEffect(() => { cargarAlumnos(); }, []);


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

  // ── Filtros ─────────────────────────────────────────────────────
  const alumnosFiltrados = alumnos.filter(a => {
    const cumpleBusqueda = a.nomap_c?.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(a.dni_u).includes(busqueda);

    const cumpleDisciplina = !filtros.disciplina ||
      (a.disciplinas && a.disciplinas.includes(filtros.disciplina));

    const cumpleFicha = !filtros.aptomedico || a.estado_ficha_medica === filtros.aptomedico;

    const cumpleCuota = !filtros.cuota ||
      (filtros.cuota === 'si' && a.cuota_al_dia) ||
      (filtros.cuota === 'no' && !a.cuota_al_dia);

    const cumpleHuella = !filtros.huella ||
      (filtros.huella === 'si' && a.cantidad_huellas > 0) ||
      (filtros.huella === 'no' && !(a.cantidad_huellas > 0));

    const cumpleActivo = !filtros.activo ||
      (filtros.activo === 'activos' && a.activo_c) ||
      (filtros.activo === 'inactivos' && !a.activo_c);

    return cumpleBusqueda && cumpleDisciplina && cumpleFicha && cumpleCuota && cumpleHuella && cumpleActivo;
  });

  // ── Paginación ──────────────────────────────────────────────────
  const inicio = (paginaActual - 1) * filasPorPagina;
  const alumnosPagina = alumnosFiltrados.slice(inicio, inicio + filasPorPagina);

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
    if (!['done', 'duplicado'].includes(enroll.status)) enroll.cancel()
    setModalHuella(false)
    setClienteHuella(null)
  }

  const handleRegistrarAptoMedico = (a) => abrirDialogoAptoMedico(
    { nombre: a.nomap_c, fecha_entrega_ficha_medica: a.fecha_entrega_ficha_medica },
    (fecha) => clientesApi.setAptoMedico(a.id_cliente, fecha),
    cargarAlumnos
  )

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros({ ...filtros, [name]: value });
    setPaginaActual(1);
  }

  const handleLimpiarFiltros = () => {
    setFiltros({
      disciplina: '',
      aptomedico: '',
      cuota: '',
      huella: '',
      activo: ''
    });
    setBusqueda('');
    setPaginaActual(1);
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

      {/* BUSCADOR Y FILTROS */}
      <div className="card admin-card mb-4">
        <div className="card-body">
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre o DNI..."
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setPaginaActual(1); }}
            />
          </div>

          <div className="row g-2">
            <div className="col-md-2">
              <label className="form-label">Disciplina</label>
              <select
                className="form-control form-control-sm"
                name="disciplina"
                value={filtros.disciplina}
                onChange={handleFiltroChange}
              >
                <option value="">-- Todas --</option>
                {disciplinas.map(d => (
                  <option key={d.id_disciplina} value={d.nombre_d}>
                    {d.nombre_d}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Apto médico</label>
              <select
                className="form-control form-control-sm"
                name="aptomedico"
                value={filtros.aptomedico}
                onChange={handleFiltroChange}
              >
                <option value="">-- Todos --</option>
                <option value="vigente">Vigente</option>
                <option value="pendiente">Pendiente</option>
                <option value="vencido">Vencido</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Cuota</label>
              <select
                className="form-control form-control-sm"
                name="cuota"
                value={filtros.cuota}
                onChange={handleFiltroChange}
              >
                <option value="">-- Todos --</option>
                <option value="si">Al día</option>
                <option value="no">Adeuda</option>
              </select>
            </div>
            <div className="col-md-1">
              <label className="form-label">Huella</label>
              <select
                className="form-control form-control-sm"
                name="huella"
                value={filtros.huella}
                onChange={handleFiltroChange}
              >
                <option value="">-- Todos --</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="col-md-1">
              <label className="form-label">Estado</label>
              <select
                className="form-control form-control-sm"
                name="activo"
                value={filtros.activo}
                onChange={handleFiltroChange}
              >
                <option value="">-- Todos --</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </select>
            </div>
            <div className="col-md-1 d-flex align-items-end">
              <button
                className="btn btn-sm btn-outline-secondary w-100"
                onClick={handleLimpiarFiltros}
                title="Limpiar todos los filtros"
              >
                <i className="ri-refresh-line"></i>
              </button>
            </div>
          </div>
        </div>
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
                <th>Apto médico</th>
                <th>Huella</th>
                <th>PIN</th>
                <th className="text-center">Opciones</th>
              </tr>
            </thead>
            <tbody>
              {alumnosPagina.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    No se encontraron alumnos
                  </td>
                </tr>
              ) : (
                alumnosPagina.map((a) => (
                  <tr key={a.id_cliente} className={!a.activo_c ? 'table-secondary text-muted' : ''}>
                    <td>
                      {a.nomap_c}
                      {pendientesRevision.has(String(a.id_cliente)) && (
                        <sup className="text-danger ms-1" title="Falta la revisación médica mensual de Natación">
                          *
                        </sup>
                      )}
                      {!a.activo_c && a.fecha_baja && (
                        <small className="d-block text-muted">
                          Baja {a.tipo_baja === "automatica" ? "automática" : "manual"} el{" "}
                          {new Date(a.fecha_baja).toLocaleDateString("es-AR")}
                        </small>
                      )}
                    </td>
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
                      <button
                        className={`btn btn-xs badge border-0 cursor-pointer ${badgeAptoMedico(a.estado_ficha_medica).clase}`}
                        onClick={() => handleRegistrarAptoMedico(a)}
                        title="Click para registrar la entrega del certificado médico"
                      >
                        {badgeAptoMedico(a.estado_ficha_medica).texto}
                      </button>
                    </td>
                    <td>
                      <span className={`badge ${a.cantidad_huellas > 0 ? "bg-info" : "bg-secondary"}`}>
                        {a.cantidad_huellas > 0 ? a.cantidad_huellas : "No"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${a.pin_acceso_c ? "bg-info" : "bg-secondary"}`}>
                        {a.pin_acceso_c ? "Sí" : "No"}
                      </span>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-secondary me-1"
                        title="Ver detalle"
                        onClick={() => navigate(`/admin/alumnos/${a.id_cliente}`)}>
                        <i className="ri-eye-fill"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-secondary me-1"
                        title="Editar"
                        onClick={() => navigate(`/admin/alumnos/nuevo?id=${a.id_cliente}`)}>
                        <i className="ri-pencil-fill"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-secondary me-1"
                        title={a.cantidad_huellas > 0 ? 'Agregar otra huella' : 'Registrar huella'}
                        onClick={() => handleRegistrarHuella(a)}>
                        <i className={a.cantidad_huellas > 0 ? 'ri-fingerprint-fill' : 'ri-fingerprint-line'}></i>
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

      {pendientesRevision.size > 0 && (
        <small className="text-muted d-block mb-3">
          * Falta la revisación médica mensual de Natación
        </small>
      )}

      <PaginacionTabla
        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        filasPorPagina={filasPorPagina}
        setFilasPorPagina={setFilasPorPagina}
        totalItems={alumnosFiltrados.length}
      />

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