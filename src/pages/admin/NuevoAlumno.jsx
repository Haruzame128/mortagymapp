import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { clientesApi } from "../../services/api";
import FichaInscripcion from "../../components/admin/FichaInscripcion";
 
export default function NuevoAlumno() {
  const [searchParams]    = useSearchParams();
  const navigate          = useNavigate();
  const id                = searchParams.get("id");
 
  const [datosIniciales, setDatosIniciales] = useState(null);
  const [loading,        setLoading]        = useState(!!id);
 
  useEffect(() => {
    if (!id) return;
    clientesApi.getById(id)
      .then(data => { setDatosIniciales(data); setLoading(false); })
      .catch(err  => { alert(err.message);      setLoading(false); });
  }, [id]);
 
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-secondary" role="status" />
      </div>
    );
  }
 
  return (
    <FichaInscripcion
      modoEdicion={!!id}
      clienteId={id ? Number(id) : null}
      datosIniciales={datosIniciales}
      onSubmit={() => navigate("/admin/alumnos")}
    />
  );
}