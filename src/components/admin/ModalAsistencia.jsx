export default function ModalAsistencia({ isOpen, onClose, asistencias }) {
  if (!isOpen) return null;

  const mesActual = new Date().toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">

          {/* HEADER */}
          <div className="modal-header">
            <h5 className="modal-title">Asistencia del mes</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>

          {/* BODY */}
          <div className="modal-body">
            <span className="fw-bold d-block mb-3">
              Mes: {mesActual}
            </span>

            <div className="table-responsive">
              <table className="table table-sm table-bordered text-center align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Hora entrada</th>
                    <th>Hora salida</th>
                  </tr>
                </thead>
                <tbody>
                  {asistencias.length > 0 ? (
                    asistencias.map((a, i) => (
                      <tr key={i}>
                        <td>{a.fecha}</td>
                        <td>{a.entrada}</td>
                        <td>{a.salida}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-muted">
                        Sin asistencias registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* FOOTER */}
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>

          </div>
        </div>
      </div>
    </>
  );
}
