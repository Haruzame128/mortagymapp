import { useNavigate } from "react-router-dom";

export default function TablaSueldos({ sueldos, onPagar, desde, hasta }) {
  const navigate = useNavigate();

  const getEstadoBadge = (estado) => {
    if (estado === "Pagado") {
      return <span className="badge bg-success">Pagado</span>;
    }
    return <span className="badge bg-warning">Pendiente</span>;
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th>Profesor</th>
            <th>Condiciones</th>
            <th className="text-center">Clientes Pagos</th>
            <th className="text-end">Monto a Pagar</th>
            <th className="text-center">Estado</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sueldos.map((sueldo) => (
            <tr key={sueldo.profesor_id}>
              <td className="fw-bold">{sueldo.profesor_nombre}</td>
              <td className="small">
                {sueldo.condiciones?.length
                  ? sueldo.condiciones.map((c) => (
                      <div key={c.disciplina}>
                        {c.disciplina}: {c.modalidad === "porcentaje" ? `${c.valor}%`
                          : c.modalidad === "por_hora" ? `$${c.valor}/h`
                          : `$${c.valor}/alumno`}
                      </div>
                    ))
                  : <span className="text-muted">Sin contrato ese período</span>}
              </td>
              <td className="text-center">{sueldo.clientes_pagos}</td>
              <td className="text-end fw-bold">
                ${parseFloat(sueldo.monto).toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })}
              </td>
              <td className="text-center">{getEstadoBadge(sueldo.estado)}</td>
              <td className="text-center">
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => navigate(`/admin/sueldos/${sueldo.profesor_id}?desde=${desde}&hasta=${hasta}`)}
                    title="Ver detalles de cálculo"
                  >
                    <i className="ri-eye-line"></i>
                  </button>
                  {sueldo.estado === "Pendiente" ? (
                    <button
                      className="btn btn-success"
                      onClick={() => onPagar(sueldo)}
                      title="Pagar sueldo"
                    >
                      <i className="ri-check-line"></i> Pagar
                    </button>
                  ) : (
                    <button
                      className="btn btn-outline-secondary"
                      disabled
                      title="Sueldo ya pagado"
                    >
                      <i className="ri-check-double-line"></i>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
