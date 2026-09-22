import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { profesoresApi, contratosApi, disciplinasApi } from "../../services/api";
import PaginacionTabla from "../../components/PaginacionTabla";
import { abrirDialogoAptoMedico, badgeAptoMedico } from "../../utils/aptoMedico";
import "../../styles/Admin.css";

export default function Profesores() {
  const navigate = useNavigate();
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState(10);
  const [profes, setProfes] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [filtroDisciplina, setFiltroDisciplina] = useState("");
  const [cargando, setCargando] = useState(true);


  useEffect(() => {
    cargarProfesores();
    disciplinasApi.getAll().then(setDisciplinas).catch(console.error);
  }, []);

  const cargarProfesores = async () => {
    try {
      setCargando(true);
      const data = await profesoresApi.getAll();
      setProfes(data || []);
    } catch (error) {
      console.error("Error cargando profesores:", error);
      Swal.fire("Error", "No se pudieron cargar los profesores", "error");
    } finally {
      setCargando(false);
    }
  };

  // La baja ahora es rescindir el contrato (requiere motivo); "reactivar" es
  // dar de alta un contrato nuevo, así que se hace desde la ficha del profesor.
  const handleDarDeBaja = async (profesor) => {
    const { value: motivo } = await Swal.fire({
      title: `¿Dar de baja a ${profesor.nomap_p}?`,
      input: "textarea",
      inputLabel: "Motivo de la baja",
      inputPlaceholder: "Ej: renuncia, cierre de disciplina, etc.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Rescindir contrato",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => !value && "El motivo es obligatorio",
    });
    if (!motivo) return;

    try {
      await contratosApi.rescindir(profesor.id_contrato, { motivo });
      Swal.fire("Éxito", "Contrato rescindido, el profesor quedó inactivo", "success");
      cargarProfesores();
    } catch (error) {
      const horarios = error.data?.horarios;
      if (horarios?.length) {
        const lista = horarios
          .map((h) => `• ${h.nombre_d} / ${h.nombre_a} — ${h.dia_h} ${h.hora_h?.slice(0, 5)}`)
          .join("<br>");
        Swal.fire({
          title: "No se puede dar de baja",
          html: `Todavía tiene horarios asignados en la grilla:<br><br>${lista}<br><br>Quitalos desde la ficha del profesor y volvé a intentar.`,
          icon: "warning",
        });
      } else {
        Swal.fire("Error", error.message || "No se pudo rescindir el contrato", "error");
      }
    }
  };

  const handleRegistrarAptoMedico = (a) => abrirDialogoAptoMedico(
    { nombre: a.nomap_p, fecha_entrega_ficha_medica: a.fecha_entrega_ficha_medica },
    (fecha) => profesoresApi.setAptoMedico(a.id_profesor, fecha),
    cargarProfesores
  );

  const estadoBadge = (a) => {
    if (!a.id_contrato) return <span className="badge bg-secondary">Sin contrato</span>;

    // El backend a veces no recalcula estado_contrato al vuelo: si los días
    // para vencer ya son negativos, el plazo venció aunque diga "vigente".
    const vencido = a.estado_contrato === "vencido" || (a.dias_para_vencer != null && a.dias_para_vencer < 0);
    if (vencido) return <span className="badge bg-danger">Vencido</span>;

    if (a.estado_contrato === "vigente") {
      if (a.dias_para_vencer != null && a.dias_para_vencer <= 30) {
        return (
          <span className="badge bg-warning text-dark">
            Vence en {a.dias_para_vencer}d
          </span>
        );
      }
      return <span className="badge bg-success">Vigente</span>;
    }

    return <span className="badge bg-secondary">Rescindido</span>;
  };

  const profesFiltrados = profes.filter((a) =>
    !filtroDisciplina || (a.disciplinas && a.disciplinas.includes(filtroDisciplina))
  );

  const inicio = (paginaActual - 1) * filasPorPagina;
  const profesPagina = profesFiltrados.slice(inicio, inicio + filasPorPagina);

  return (
    <>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3>Gestión de Profesores</h3>
          <small className="text-muted">Total: <strong>{profesFiltrados.length}</strong> registros</small>
        </div>
        <button className="btn btn-admin" onClick={() => navigate("/admin/profesores/nuevoprofesor")}>
          <i className="ri-add-line"></i> Nuevo profesor
        </button>
      </div>

      {/* FILTROS */}
      <div className="card admin-card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-3">
              <label className="form-label">Disciplina</label>
              <select
                className="form-control form-control-sm"
                value={filtroDisciplina}
                onChange={(e) => { setFiltroDisciplina(e.target.value); setPaginaActual(1); }}
              >
                <option value="">-- Todas --</option>
                {disciplinas.map((d) => (
                  <option key={d.id_disciplina} value={d.nombre_d}>{d.nombre_d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Profesor</th>
              <th>DNI</th>
              <th>Disciplina</th>
              <th className="text-center">Contrato</th>
              <th className="text-center">Apto médico</th>
              <th className="text-center">Estado</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan="7" className="text-center py-4">Cargando...</td>
              </tr>
            ) : profesPagina.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4">No hay profesores registrados</td>
              </tr>
            ) : (
              profesPagina.map((a) => {
                const esActivo = a.activo_p !== false;
                return (
                  <tr key={a.id_profesor || a.id}>
                    <td className="fw-bold">{a.nomap_p || a.nombre || '-'}</td>
                    <td>{a.dni_u || '-'}</td>
                    <td>{a.disciplinas?.length ? a.disciplinas.join(', ') : '-'}</td>
                    <td className="text-center">{estadoBadge(a)}</td>
                    <td className="text-center">
                      <button
                        className={`btn btn-xs badge border-0 cursor-pointer ${badgeAptoMedico(a.estado_ficha_medica).clase}`}
                        onClick={() => handleRegistrarAptoMedico(a)}
                        title="Click para registrar la entrega del certificado médico"
                      >
                        {badgeAptoMedico(a.estado_ficha_medica).texto}
                      </button>
                    </td>
                    <td className="text-center">
                      {esActivo ? (
                        <span className="badge bg-success">Activo</span>
                      ) : (
                        <span className="badge bg-danger">Inactivo</span>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => navigate(`/admin/profesores/${a.id_profesor || a.id}`)}
                          title="Ver información"
                        >
                          <i className="ri-eye-line"></i>
                        </button>

                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => navigate(`/admin/profesores/${a.id_profesor || a.id}/editar`)}
                          title="Editar profesor"
                        >
                          <i className="ri-pencil-fill"></i>
                        </button>

                        {esActivo ? (
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDarDeBaja(a)}
                            title="Dar de baja"
                          >
                            <i className="ri-close-circle-fill"></i>
                          </button>
                        ) : (
                          <button
                            className="btn btn-outline-success"
                            onClick={() => navigate(`/admin/profesores/${a.id_profesor || a.id}/editar`)}
                            title="Reactivar (dar de alta un nuevo contrato)"
                          >
                            <i className="ri-play-circle-fill"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <PaginacionTabla
        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        filasPorPagina={filasPorPagina}
        setFilasPorPagina={setFilasPorPagina}
        totalItems={profesFiltrados.length}
      />
    </>
  );
}
