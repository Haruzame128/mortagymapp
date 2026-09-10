import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { fichaConfigApi } from "../../services/api";
import "../../styles/Admin.css";

export default function FichaConfig() {
  const [formData, setFormData] = useState({
    nombre_gimnasio: "",
    direccion: "",
    cuit: "",
    condiciones: "",
  });
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fichaConfigApi
      .get()
      .then((data) =>
        setFormData({
          nombre_gimnasio: data.nombre_gimnasio || "",
          direccion: data.direccion || "",
          cuit: data.cuit || "",
          condiciones: data.condiciones || "",
        })
      )
      .catch((err) => Swal.fire("Error", err.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await fichaConfigApi.update(formData);
      Swal.fire("¡Listo!", "Se actualizó la configuración de la ficha", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setGuardando(false);
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
      <div className="mb-4">
        <h3>Ficha de inscripción</h3>
        <small className="text-muted">
          Estos datos se imprimen en la ficha de inscripción que se genera al dar de alta o editar un alumno.
        </small>
      </div>

      <form className="card admin-card" onSubmit={handleSubmit}>
        <div className="card-body">
          <h6 className="fw-bold mb-3">Datos del gimnasio</h6>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Nombre del gimnasio</label>
              <input
                type="text"
                className="form-control"
                name="nombre_gimnasio"
                value={formData.nombre_gimnasio}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">CUIT</label>
              <input
                type="text"
                className="form-control"
                name="cuit"
                value={formData.cuit}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label">Dirección</label>
            <input
              type="text"
              className="form-control"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              required
            />
          </div>

          <h6 className="fw-bold mb-2">Condiciones de inscripción</h6>
          <small className="text-muted d-block mb-2">
            Texto legal que se imprime al final de la ficha. Podés editarlo si cambian las condiciones del gimnasio.
          </small>
          <textarea
            className="form-control mb-4"
            name="condiciones"
            rows={18}
            style={{ fontFamily: "monospace", fontSize: ".85rem" }}
            value={formData.condiciones}
            onChange={handleChange}
            required
          />

          <div className="d-flex justify-content-end">
            <button type="submit" className="btn btn-admin" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
