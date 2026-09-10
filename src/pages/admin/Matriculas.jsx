import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { matriculasApi, matriculaPrecioApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import PaginacionTabla from "../../components/PaginacionTabla";
import "../../styles/Admin.css";

const anioActual = new Date().getFullYear();

const MEDIOS_PAGO = {
  Efectivo: "Efectivo",
  Debito: "Débito",
  Transferencia: "Transferencia",
  Credito: "Crédito",
  Otro: "Otro",
};

export default function Matriculas() {
  const { isAdmin } = useAuth();
  const [matriculas, setMatriculas] = useState([]);
  const [precios, setPrecios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [filtroDisciplina, setFiltroDisciplina] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState(10);

  const cargar = async () => {
    try {
      setLoading(true);
      const [dataMatriculas, dataPrecios] = await Promise.all([
        matriculasApi.getAll(),
        matriculaPrecioApi.getAll({ anio: anioActual }),
      ]);
      setMatriculas(dataMatriculas);
      setPrecios(dataPrecios);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);
  useEffect(() => setPaginaActual(1), [soloPendientes, filtroDisciplina]);

  const disciplinasDisponibles = [...new Set(matriculas.map((m) => m.disciplina))].sort();

  const filtradas = matriculas.filter((m) =>
    (!soloPendientes || !m.paga) &&
    (!filtroDisciplina || m.disciplina === filtroDisciplina)
  );

  const inicio = (paginaActual - 1) * filasPorPagina;
  const pagina = filtradas.slice(inicio, inicio + filasPorPagina);

  const handleEditarPrecio = async (disciplina, idDisciplina) => {
    const actual = precios.find((p) => p.id_disciplina === idDisciplina) || {};

    const { value: montos } = await Swal.fire({
      title: `Precio de matrícula ${anioActual}`,
      text: `${disciplina} — varía según días por semana`,
      html: `
        <div style="text-align:left">
          ${[1, 2, 3, 4, 5, 6].map((n) => `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <label style="min-width:110px" for="swal-monto-${n}">${n} día${n > 1 ? "s" : ""}/sem</label>
              <input id="swal-monto-${n}" type="number" min="0" step="0.01" class="swal2-input" style="margin:0;flex:1"
                value="${actual[`monto_${n}`] ?? ""}" />
            </div>
          `).join("")}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const valores = {};
        for (const n of [1, 2, 3, 4, 5, 6]) {
          const input = document.getElementById(`swal-monto-${n}`);
          if (input.value !== "") valores[`monto_${n}`] = Number(input.value);
        }
        return valores;
      },
    });
    if (!montos) return;

    try {
      await matriculaPrecioApi.set({ id_disciplina: idDisciplina, anio: anioActual, ...montos });
      Swal.fire("¡Listo!", "Precio actualizado correctamente", "success");
      cargar();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleCobrar = async (m) => {
    const { value: medio_pago } = await Swal.fire({
      title: `Cobrar matrícula — ${m.nomap_c}`,
      text: `${m.disciplina} · ${m.monto_vigente != null ? `$${Number(m.monto_vigente).toLocaleString("es-AR")}` : "sin precio configurado"}`,
      input: "select",
      inputOptions: MEDIOS_PAGO,
      inputValue: "Efectivo",
      showCancelButton: true,
      confirmButtonText: "Cobrar",
      cancelButtonText: "Cancelar",
    });
    if (!medio_pago) return;

    try {
      await matriculasApi.cobrar({ id_cliente: m.id_cliente, id_disciplina: m.id_disciplina, medio_pago });
      Swal.fire("¡Cobrado!", "Matrícula registrada correctamente", "success");
      cargar();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Matrículas {anioActual}</h3>
      </div>

      {/* PRECIOS VIGENTES */}
      {precios.length > 0 && (
        <div className="card admin-card mb-4">
          <div className="card-body">
            <h6 className="card-title mb-3">Precio de matrícula {anioActual}</h6>
            <div className="d-flex flex-column gap-2">
              {precios.map((p) => {
                const configurados = [1, 2, 3, 4, 5, 6].filter((n) => p[`monto_${n}`] != null);
                return (
                  <div key={p.id_matricula_precio} className="d-flex align-items-center gap-2 border rounded px-3 py-2 flex-wrap">
                    <small className="text-muted fw-semibold" style={{ minWidth: 110 }}>{p.nombre_d}</small>
                    <div className="d-flex flex-wrap gap-2 flex-grow-1">
                      {configurados.length === 0 ? (
                        <span className="text-muted">sin precio</span>
                      ) : (
                        configurados.map((n) => (
                          <span key={n} className="badge bg-light text-dark border">
                            {n} día{n > 1 ? "s" : ""}/sem: ${Number(p[`monto_${n}`]).toLocaleString("es-AR")}
                          </span>
                        ))
                      )}
                    </div>
                    {isAdmin && (
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleEditarPrecio(p.nombre_d, p.id_disciplina)}
                      >
                        <i className="ri-pencil-fill"></i>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FILTROS */}
      <div className="card admin-card mb-4">
        <div className="card-body d-flex flex-wrap gap-3 align-items-end">
          <div>
            <label className="form-label">Disciplina</label>
            <select
              className="form-select form-select-sm"
              value={filtroDisciplina}
              onChange={(e) => setFiltroDisciplina(e.target.value)}
            >
              <option value="">Todas</option>
              {disciplinasDisponibles.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="form-check mb-1">
            <input
              type="checkbox"
              className="form-check-input"
              id="soloPendientes"
              checked={soloPendientes}
              onChange={(e) => setSoloPendientes(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="soloPendientes">
              Solo pendientes
            </label>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Nombre</th>
              <th>DNI</th>
              <th>Días/sem</th>
              <th>Estado</th>
              <th>Fecha de pago</th>
              <th>Vencimiento</th>
              <th>Monto</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pagina.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center text-muted py-4">
                  No se encontraron matrículas
                </td>
              </tr>
            ) : (
              pagina.map((m) => (
                <tr key={`${m.id_cliente}-${m.id_disciplina}`}>
                  <td>{m.nomap_c}</td>
                  <td>{m.dni_u}</td>
                  <td>{m.cantidad_dias ?? "—"}</td>
                  <td>
                    <span className={`badge ${m.paga ? "bg-success" : "bg-danger"}`}>
                      {m.paga ? "Pagada" : "Pendiente"}
                    </span>
                  </td>
                  <td>{m.fecha_pago ? new Date(m.fecha_pago).toLocaleDateString("es-AR") : "—"}</td>
                  <td>{m.fecha_vencimiento ? new Date(m.fecha_vencimiento).toLocaleDateString("es-AR") : "—"}</td>
                  <td>
                    {m.paga
                      ? `$${Number(m.monto).toLocaleString("es-AR")}`
                      : m.monto_vigente != null
                        ? `$${Number(m.monto_vigente).toLocaleString("es-AR")}`
                        : "—"}
                  </td>
                  <td className="text-center">
                    {!m.paga && (
                      <button className="btn btn-sm btn-admin" onClick={() => handleCobrar(m)}>
                        <i className="ri-cash-line"></i> Cobrar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginacionTabla
        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        filasPorPagina={filasPorPagina}
        setFilasPorPagina={setFilasPorPagina}
        totalItems={filtradas.length}
      />
    </>
  );
}
