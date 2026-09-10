const OPCIONES_POR_DEFECTO = [10, 25, 50, 100];

// Pie de tabla estándar: selector de "Registros por página", contador
// "Mostrando X a Y de Z" y paginado. Se usa en la mayoría de las tablas
// de admin/profesor/médico para que todas se vean y funcionen igual.
export default function PaginacionTabla({
  paginaActual,
  setPaginaActual,
  filasPorPagina,
  setFilasPorPagina,
  totalItems,
  opcionesPorPagina = OPCIONES_POR_DEFECTO,
}) {
  const inicio = (paginaActual - 1) * filasPorPagina;
  const totalPaginas = Math.ceil(totalItems / filasPorPagina);

  return (
    <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-3">
      <div>
        <label className="form-label me-2 d-inline">Registros por página:</label>
        <select
          className="form-select d-inline-block"
          style={{ width: "auto" }}
          value={filasPorPagina}
          onChange={(e) => {
            setFilasPorPagina(Number(e.target.value));
            setPaginaActual(1);
          }}
        >
          {opcionesPorPagina.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <small className="text-muted">
        {totalItems === 0
          ? "Sin registros"
          : `Mostrando ${inicio + 1} a ${Math.min(inicio + filasPorPagina, totalItems)} de ${totalItems}`}
      </small>

      <nav>
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${paginaActual === 1 ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => setPaginaActual(1)} disabled={paginaActual === 1}>
              &laquo;
            </button>
          </li>
          <li className={`page-item ${paginaActual === 1 ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => setPaginaActual(paginaActual - 1)} disabled={paginaActual === 1}>
              &lsaquo;
            </button>
          </li>

          {Array.from({ length: Math.min(5, totalPaginas) }).map((_, i) => {
            const pagina = i + 1;
            return (
              <li key={pagina} className={`page-item ${paginaActual === pagina ? "active" : ""}`}>
                <button className="page-link" onClick={() => setPaginaActual(pagina)}>
                  {pagina}
                </button>
              </li>
            );
          })}

          {totalPaginas > 5 && (
            <>
              <li className="page-item disabled">
                <span className="page-link">...</span>
              </li>
              <li className={`page-item ${paginaActual === totalPaginas ? "active" : ""}`}>
                <button className="page-link" onClick={() => setPaginaActual(totalPaginas)}>
                  {totalPaginas}
                </button>
              </li>
            </>
          )}

          <li className={`page-item ${paginaActual === totalPaginas ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setPaginaActual(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
            >
              &rsaquo;
            </button>
          </li>
          <li className={`page-item ${paginaActual === totalPaginas ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setPaginaActual(totalPaginas)}
              disabled={paginaActual === totalPaginas}
            >
              &raquo;
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
