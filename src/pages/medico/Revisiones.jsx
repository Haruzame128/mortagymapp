import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { medicoApi } from "../../services/api";
import PaginacionTabla from "../../components/PaginacionTabla";
import "../../styles/Admin.css";

const RESULTADO_LABEL = {
  apto: "Apto",
  apto_con_observaciones: "Apto con obs.",
  no_apto: "No apto",
};

const formatoFecha = (f) => (f ? new Date(f).toLocaleDateString("es-AR") : "—");

const formatoMonto = (m) =>
  `$${Number(m).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;

function estadoDe(r) {
  if (r.al_dia) return { texto: "Al día", clase: "bg-success" };
  if (!r.ultima_revision) return { texto: "Nunca se revisó", clase: "bg-dark" };
  return { texto: "Vencida", clase: "bg-danger" };
}

export default function Revisiones() {
  const [revisiones, setRevisiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [buscar, setBuscar] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState(10);

  const cargar = async () => {
    try {
      setCargando(true);
      const data = await medicoApi.getRevisiones({
        pendientes: soloPendientes,
        buscar: buscar.trim() || undefined,
      });
      setRevisiones(data || []);
    } catch (error) {
      Swal.fire("Error", error.message || "No se pudieron cargar las revisaciones", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setPaginaActual(1);
    const t = setTimeout(cargar, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soloPendientes, buscar]);

  const inicio = (paginaActual - 1) * filasPorPagina;
  const revisionesPagina = revisiones.slice(inicio, inicio + filasPorPagina);

  const abrirDialogoRevision = async (cliente) => {
    const { value: formValues } = await Swal.fire({
      title: "Registrar revisación",
      html: `
        <div class="text-start">
          <p class="mb-2"><strong>${cliente.nomap_c}</strong></p>
          <label class="form-label small mb-1">Resultado</label>
          <select id="swal-resultado" class="form-select form-select-sm mb-2">
            <option value="apto" selected>Apto</option>
            <option value="apto_con_observaciones">Apto con observaciones</option>
            <option value="no_apto">No apto</option>
          </select>
          <label class="form-label small mb-1">Medio de pago</label>
          <select id="swal-medio-pago" class="form-select form-select-sm mb-2">
            <option value="Efectivo" selected>Efectivo</option>
            <option value="Debito">Débito</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Credito">Crédito</option>
            <option value="Otro">Otro</option>
          </select>
          <label class="form-label small mb-1">Observaciones</label>
          <textarea id="swal-observaciones" class="form-control form-control-sm mb-2" rows="2" placeholder="Opcional"></textarea>
          <div class="small text-muted">Monto a cobrar: <strong>${formatoMonto(cliente.monto_vigente)}</strong></div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Registrar",
      cancelButtonText: "Cancelar",
      preConfirm: () => ({
        resultado: document.getElementById("swal-resultado").value,
        medio_pago: document.getElementById("swal-medio-pago").value,
        observaciones: document.getElementById("swal-observaciones").value.trim() || null,
      }),
    });
    if (!formValues) return;

    try {
      await medicoApi.registrar({ id_cliente: cliente.id_cliente, ...formValues });
      Swal.fire("¡Listo!", "Revisación registrada correctamente", "success");
      cargar();
    } catch (error) {
      Swal.fire("Error", error.message || "No se pudo registrar la revisación", "error");
    }
  };

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h3 className="mb-0">Revisaciones médicas — Natación</h3>
          <small className="text-muted">
            Total: <strong>{revisiones.length}</strong> clientes
          </small>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-md-5">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Buscar por nombre o DNI"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
              />
            </div>
            <div className="col-md-5">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="chk-pendientes"
                  checked={soloPendientes}
                  onChange={(e) => setSoloPendientes(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="chk-pendientes">
                  Mostrar solo pendientes
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Cliente</th>
              <th>DNI</th>
              <th>Teléfono</th>
              <th>Última revisación</th>
              <th className="text-center">Días</th>
              <th className="text-center">Estado</th>
              <th className="text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan="7" className="text-center py-4">Cargando...</td>
              </tr>
            ) : revisiones.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4">No hay clientes para mostrar</td>
              </tr>
            ) : (
              revisionesPagina.map((r) => {
                const estado = estadoDe(r);
                return (
                  <tr key={r.id_cliente}>
                    <td className="fw-bold">{r.nomap_c}</td>
                    <td>{r.dni_u}</td>
                    <td>{r.telefono_c || "—"}</td>
                    <td>
                      {formatoFecha(r.ultima_revision)}
                      {r.ultimo_resultado && (
                        <small className="text-muted d-block">
                          {RESULTADO_LABEL[r.ultimo_resultado] || r.ultimo_resultado}
                        </small>
                      )}
                    </td>
                    <td className="text-center">{r.dias_desde_ultima ?? "—"}</td>
                    <td className="text-center">
                      <span className={`badge ${estado.clase}`}>{estado.texto}</span>
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-admin"
                        disabled={r.al_dia}
                        onClick={() => abrirDialogoRevision(r)}
                        title={r.al_dia ? "Ya tiene revisación este mes" : "Registrar revisación"}
                      >
                        <i className="ri-stethoscope-line"></i> Registrar revisación
                      </button>
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
        totalItems={revisiones.length}
      />
    </div>
  );
}
