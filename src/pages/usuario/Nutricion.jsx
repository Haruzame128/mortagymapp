import { usePerfilCliente } from "../../hooks/usePerfilCliente";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Nutricion() {
  const { perfil, loading, error, recargar } = usePerfilCliente();

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-secondary" role="status" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <p className="text-danger">No se pudo cargar tu plan de nutrición.</p>
        <button className="btn btn-outline-secondary btn-sm" onClick={recargar}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!perfil?.tiene_plan_nutricion) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">Todavía no tenés un plan de alimentación cargado.</p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h4 className="mb-3">Tu plan de alimentación</h4>
      <p className="text-muted">
        Cargado el {new Date(perfil.plan_nutricion_fecha).toLocaleDateString("es-AR")}
      </p>
      <a
        className="btn btn-principal"
        href={`${BASE_URL}${perfil.plan_nutricion_url}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <i className="ri-file-pdf-2-line me-1"></i> Ver plan (PDF)
      </a>
    </div>
  );
}
