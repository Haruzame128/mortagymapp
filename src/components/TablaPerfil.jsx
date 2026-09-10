import { useState } from "react";
import PaginacionTabla from "./PaginacionTabla";

export default function TablaPerfil({
  columnas,
  datos,
  paginaActual,
  setPaginaActual,
  filasPorPagina: filasPorPaginaProp,
  setFilasPorPagina: setFilasPorPaginaProp,
  onOrdenar,
}) {
  const [filasInternas, setFilasInternas] = useState(10);
  const filasPorPagina = filasPorPaginaProp ?? filasInternas;
  const setFilasPorPagina = setFilasPorPaginaProp ?? setFilasInternas;

  const inicio = (paginaActual - 1) * filasPorPagina;
  const datosPagina = datos.slice(inicio, inicio + filasPorPagina);

  const renderValor = (valor) => {
    if (typeof valor === "boolean") {
      return valor ? (
        <i className="ri-checkbox-circle-fill text-success fs-5"></i>
      ) : (
        <i className="ri-close-circle-fill text-danger fs-5"></i>
      );
    }
    return valor;
  };

  return (
    <>
      <div className="table-responsive my-2">
        <table className="table table-bordered table-hover text-center align-middle tabla-perfiles">
          <thead className="table-light">
            <tr>
              {columnas.map((col) => (
                <th
                  key={col.key}
                  className={col.ordenable ? "cursor-pointer" : ""}
                  onClick={
                    col.ordenable ? () => onOrdenar(col.key) : undefined
                  }
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {datosPagina.length > 0 ? (
              datosPagina.map((fila) => (
                <tr key={fila.id}>
                  {columnas.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(fila) : renderValor(fila[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columnas.length} className="text-muted py-4">
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
        totalItems={datos.length}
      />
    </>
  );
}
