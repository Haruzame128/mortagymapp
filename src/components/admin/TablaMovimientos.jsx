import { useState } from "react";
import "../../styles/Admin.css";
import PaginacionTabla from "../PaginacionTabla";

export default function TablaMovimientos({
  movimientos,
  paginaActual,
  setPaginaActual,
  filasPorPagina: filasPorPaginaProp,
  setFilasPorPagina: setFilasPorPaginaProp,
}) {
  const [filasInternas, setFilasInternas] = useState(10);
  const filasPorPagina = filasPorPaginaProp ?? filasInternas;
  const setFilasPorPagina = setFilasPorPaginaProp ?? setFilasInternas;

  const inicio = (paginaActual - 1) * filasPorPagina;
  const movimientosPagina = movimientos.slice(inicio, inicio + filasPorPagina);

  return (
    <>
      <div className="table-responsive my-2">
        <table className="table table-hover table-bordered align-middle">
          <thead className="table-light">
            <tr>
              <th>Fecha y Hora</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Monto</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.length > 0 ? (
                movimientosPagina.map((m) => {
                  const fechaHora = new Date(m.creado_en);
                  const fecha = fechaHora.toLocaleDateString('es-AR');
                  const hora = fechaHora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <tr key={m.id_movimiento}>
                      <td>
                        <small className="d-block">{fecha}</small>
                        <small className="text-muted">{hora}</small>
                      </td>
                      <td>
                        <span
                          className={`badge ${m.tipo_m === "Ingreso" ? "bg-success" : "bg-danger"
                            }`}
                        >
                          {m.tipo_m}
                        </span>
                      </td>
                      <td>{m.categoria}</td>
                      <td>{m.descripcion_m}</td>
                      <td>${parseFloat(m.monto_m).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                      <td>
                        <small className="d-block">{m.usuario_nombre}</small>
                        <small className="text-muted">{m.dni_u}</small>
                      </td>
                    </tr>
                  );
                })
                ) : (
              <tr>
                <td colSpan={6} className="text-muted text-center py-4">
                  No hay datos para mostrar
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginacionTabla
        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        filasPorPagina={filasPorPagina}
        setFilasPorPagina={setFilasPorPagina}
        totalItems={movimientos.length}
      />
    </>
  );
}
