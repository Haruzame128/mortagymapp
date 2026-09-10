import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { disciplinasApi, actividadesApi } from "../../services/api";
import { tieneConProfesor } from "../../utils/preciosDisciplina";
import PreciosDisciplina from "../../components/admin/PreciosDisciplina";
import PaginacionTabla from "../../components/PaginacionTabla";
import "../../styles/Admin.css";

// Vista de disciplinas para Administrador — a diferencia de la de Editor
// (pages/editor/Disciplinas.jsx, que edita nombre/descripción/imágenes/
// horarios), acá se elige una disciplina y se ve todo lo que le compete al
// administrador sobre ella en un solo lugar: precios (editables) y
// actividades (solo lectura).
export default function Disciplinas() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState(10);

  const [disciplinaSeleccionada, setDisciplinaSeleccionada] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [loadingActividades, setLoadingActividades] = useState(false);

  const cargarDisciplinas = async () => {
    try {
      setLoading(true);
      const data = await disciplinasApi.getAll();
      setDisciplinas(data);
      // Si había una seleccionada, refrescar sus datos (ej. tras editar precios)
      setDisciplinaSeleccionada((prev) =>
        prev ? data.find((d) => d.id_disciplina === prev.id_disciplina) || null : null
      );
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDisciplinas(); }, []);

  const seleccionarDisciplina = async (d) => {
    setDisciplinaSeleccionada(d);
    setLoadingActividades(true);
    try {
      const data = await actividadesApi.getByDisciplina(d.id_disciplina);
      setActividades(data);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoadingActividades(false);
    }
  };

  const inicio = (paginaActual - 1) * filasPorPagina;
  const disciplinasPagina = disciplinas.slice(inicio, inicio + filasPorPagina);

  const rangoPrecio = (d) => {
    const valores = [1, 2, 3, 4, 5, 6].map((n) => Number(d[`precio_${n}`]) || 0).filter((v) => v > 0);
    if (valores.length === 0) return "sin precio";
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    return min === max
      ? `$${min.toLocaleString("es-AR")}`
      : `$${min.toLocaleString("es-AR")} – $${max.toLocaleString("es-AR")}`;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-secondary" role="status" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <h3>Disciplinas</h3>
        <small className="text-muted">
          Elegí una disciplina para ver y editar sus precios y sus actividades. La estructura
          (nombre, descripción, imágenes, horarios) se administra desde el panel de Editor.
        </small>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle table-disciplinas">
          <thead className="table-light">
            <tr>
              <th>Nombre</th>
              <th>Activo</th>
              <th>Precio (efectivo)</th>
            </tr>
          </thead>
          <tbody>
            {disciplinasPagina.map((d) => (
              <tr
                key={d.id_disciplina}
                onClick={() => seleccionarDisciplina(d)}
                style={{ cursor: "pointer" }}
                className={disciplinaSeleccionada?.id_disciplina === d.id_disciplina ? "table-active" : ""}
              >
                <td>
                  {d.nombre_d}
                  {tieneConProfesor(d) && <span className="badge bg-secondary ms-2">con/sin profesor</span>}
                </td>
                <td>
                  <span className={`badge ${d.activo_d ? "bg-success" : "bg-danger"}`}>
                    {d.activo_d ? "Sí" : "No"}
                  </span>
                </td>
                <td>{rangoPrecio(d)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginacionTabla
        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        filasPorPagina={filasPorPagina}
        setFilasPorPagina={setFilasPorPagina}
        totalItems={disciplinas.length}
      />

      {/* DETALLE de la disciplina seleccionada */}
      {disciplinaSeleccionada && (
        <div className="mt-4">
          <h4 className="mb-3">{disciplinaSeleccionada.nombre_d}</h4>

          <PreciosDisciplina
            disciplina={disciplinaSeleccionada}
            onGuardado={cargarDisciplinas}
          />

          <div className="card admin-card">
            <div className="card-body">
              <h5 className="mb-3">Actividades</h5>
              {loadingActividades ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-secondary" role="status" />
                </div>
              ) : actividades.length === 0 ? (
                <p className="text-muted mb-0">Esta disciplina todavía no tiene actividades cargadas.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Actividad</th>
                        <th>Profesor</th>
                        <th>Máx. inasistencias</th>
                        <th>Activa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actividades.map((a) => (
                        <tr key={`${a.id_actividad}-${a.id_profesor || "sin"}`}>
                          <td>{a.nombre_a}</td>
                          <td>{a.profesor || <span className="text-muted">Sin asignar</span>}</td>
                          <td>{a.max_inasistencia}</td>
                          <td>
                            <span className={`badge ${a.activo_a ? "bg-success" : "bg-danger"}`}>
                              {a.activo_a ? "Sí" : "No"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
