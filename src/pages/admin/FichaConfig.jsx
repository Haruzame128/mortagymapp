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
  const [campoErrors, setCampoErrors] = useState({});

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
    if (campoErrors[name]) setCampoErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const CUIT_REGEX = /^\d{2}-?\d{8}-?\d{1}$/;

  const validar = () => {
    const errores = {};

    if (!formData.nombre_gimnasio.trim()) {
      errores.nombre_gimnasio = "El nombre del gimnasio es obligatorio";
    }

    if (!formData.cuit.trim()) {
      errores.cuit = "El CUIT es obligatorio";
    } else if (!CUIT_REGEX.test(formData.cuit.trim())) {
      errores.cuit = "Ingresá un CUIT válido (ej: 20-12345678-9)";
    }

    if (!formData.direccion.trim()) {
      errores.direccion = "La dirección es obligatoria";
    }

    if (!formData.condiciones.trim()) {
      errores.condiciones = "Las condiciones de inscripción son obligatorias";
    }

    return errores;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errores = validar();
    setCampoErrors(errores);
    if (Object.keys(errores).length > 0) return;

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
                className={`form-control ${campoErrors.nombre_gimnasio ? "is-invalid" : ""}`}
                name="nombre_gimnasio"
                value={formData.nombre_gimnasio}
                onChange={handleChange}
              />
              {campoErrors.nombre_gimnasio && <div className="invalid-feedback">{campoErrors.nombre_gimnasio}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">CUIT</label>
              <input
                type="text"
                className={`form-control ${campoErrors.cuit ? "is-invalid" : ""}`}
                name="cuit"
                placeholder="Ej: 20-12345678-9"
                value={formData.cuit}
                onChange={handleChange}
              />
              {campoErrors.cuit && <div className="invalid-feedback">{campoErrors.cuit}</div>}
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label">Dirección</label>
            <input
              type="text"
              className={`form-control ${campoErrors.direccion ? "is-invalid" : ""}`}
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
            />
            {campoErrors.direccion && <div className="invalid-feedback">{campoErrors.direccion}</div>}
          </div>

          <h6 className="fw-bold mb-2">Condiciones de inscripción</h6>
          <small className="text-muted d-block mb-2">
            Texto legal que se imprime al final de la ficha. Podés editarlo si cambian las condiciones del gimnasio.
          </small>
          <textarea
            className={`form-control mb-4 ${campoErrors.condiciones ? "is-invalid" : ""}`}
            name="condiciones"
            rows={18}
            style={{ fontFamily: "monospace", fontSize: ".85rem" }}
            value={formData.condiciones}
            onChange={handleChange}
          />
          {campoErrors.condiciones && <div className="invalid-feedback d-block mb-4">{campoErrors.condiciones}</div>}

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
