import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { nutricionistaApi } from "../../services/api";
import PaginacionTabla from "../../components/PaginacionTabla";
import "../../styles/Admin.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const formatoFecha = (f) => (f ? new Date(f).toLocaleDateString("es-AR") : "—");

export default function Planes() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [buscar, setBuscar] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState(10);

  const cargar = async () => {
    try {
      setCargando(true);
      const data = await nutricionistaApi.getClientes({ buscar: buscar.trim() || undefined });
      setClientes(data || []);
    } catch (error) {
      Swal.fire("Error", error.message || "No se pudieron cargar los clientes", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setPaginaActual(1);
    const t = setTimeout(cargar, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscar]);

  const inicio = (paginaActual - 1) * filasPorPagina;
  const clientesPagina = clientes.slice(inicio, inicio + filasPorPagina);

  const abrirDialogoPlan = async (cliente) => {
    const { value: formValues } = await Swal.fire({
      title: cliente.tiene_plan ? "Reemplazar plan" : "Cargar plan",
      html: `
        <div class="text-start">
          <p class="mb-2"><strong>${cliente.nomap_c}</strong></p>
          <label class="form-label small mb-1">Plan de alimentación (PDF)</label>
          <input id="swal-pdf" type="file" accept="application/pdf" class="form-control form-control-sm mb-2" />
          <label class="form-label small mb-1">Observaciones</label>
          <textarea id="swal-observaciones" class="form-control form-control-sm" rows="2" placeholder="Opcional"></textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: cliente.tiene_plan ? "Reemplazar" : "Cargar",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const archivo = document.getElementById("swal-pdf").files[0];
        if (!archivo) {
          Swal.showValidationMessage("Seleccioná un archivo PDF");
          return false;
        }
        return {
          archivo,
          observaciones: document.getElementById("swal-observaciones").value.trim() || null,
        };
      },
    });
    if (!formValues) return;

    try {
      const fd = new FormData();
      fd.append("id_cliente", cliente.id_cliente);
      fd.append("pdf", formValues.archivo);
      if (formValues.observaciones) fd.append("observaciones", formValues.observaciones);
      await nutricionistaApi.subirPlan(fd);
      Swal.fire("¡Listo!", "Plan cargado correctamente", "success");
      cargar();
    } catch (error) {
      Swal.fire("Error", error.message || "No se pudo cargar el plan", "error");
    }
  };

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h3 className="mb-0">Planes de alimentación</h3>
          <small className="text-muted">
            Total: <strong>{clientes.length}</strong> clientes
          </small>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Buscar por nombre o DNI"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Cliente</th>
              <th>DNI</th>
              <th>Teléfono</th>
              <th>Último plan</th>
              <th className="text-center">Estado</th>
              <th className="text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan="6" className="text-center py-4">Cargando...</td>
              </tr>
            ) : clientes.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4">No hay clientes para mostrar</td>
              </tr>
            ) : (
              clientesPagina.map((c) => (
                <tr key={c.id_cliente}>
                  <td className="fw-bold">{c.nomap_c}</td>
                  <td>{c.dni_u}</td>
                  <td>{c.telefono_c || "—"}</td>
                  <td>
                    {c.tiene_plan ? (
                      <>
                        {formatoFecha(c.fecha_ultimo_plan)}
                        <a
                          className="d-block small"
                          href={`${BASE_URL}${c.archivo_pdf}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ver PDF
                        </a>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="text-center">
                    <span className={`badge ${c.tiene_plan ? "bg-success" : "bg-secondary"}`}>
                      {c.tiene_plan ? "Con plan" : "Sin plan"}
                    </span>
                  </td>
                  <td className="text-center">
                    <button className="btn btn-sm btn-admin" onClick={() => abrirDialogoPlan(c)}>
                      <i className="ri-file-upload-line"></i> {c.tiene_plan ? "Reemplazar plan" : "Cargar plan"}
                    </button>
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
        totalItems={clientes.length}
      />
    </div>
  );
}
