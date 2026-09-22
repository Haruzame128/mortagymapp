import { useState } from "react";
import "../../styles/perfiles.css";

export default function Molinete() {
  const [formData, setFormData] = useState({
    dni: "",
    tipoUsuario: "",
    comentario: "",
  });
  const [campoErrors, setCampoErrors] = useState({});

  const tipoUsuario = [
    "Alumno",
    "Profesor",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (campoErrors[name]) setCampoErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validar = () => {
    const errores = {};
    const dni = String(formData.dni || "").trim();

    if (!dni) {
      errores.dni = "El DNI es obligatorio";
    } else if (!/^\d{7,8}$/.test(dni)) {
      errores.dni = "Ingresá un DNI válido (7 u 8 dígitos)";
    }

    if (!formData.tipoUsuario) {
      errores.tipoUsuario = "Seleccioná el tipo de usuario";
    }

    if (!formData.comentario.trim()) {
      errores.comentario = "Indicá el motivo de la apertura manual";
    }

    return errores;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const errores = validar();
    setCampoErrors(errores);
    if (Object.keys(errores).length > 0) return;

    console.log("Ficha de inscripción:", formData);
  };
  return (
    <div>
      <h5 className="card-title mb-2">Apertura Manual de Molinete</h5>
      <span>Recuerde tomar nota del motivo por el cual se accedió de forma manual.</span>
      <form className="mt-4" onSubmit={handleSubmit}>

        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">DNI</label>
            <input
              type="number"
              className={`form-control no-spinner ${campoErrors.dni ? "is-invalid" : ""}`}
              name="dni"
              value={formData.dni}
              onChange={handleChange}
            />
            {campoErrors.dni && <div className="invalid-feedback">{campoErrors.dni}</div>}
          </div>
          <div className="col-md-6">
            <label className="form-label">Tipo de Usuario</label>
            <select
              className={`form-select ${campoErrors.tipoUsuario ? "is-invalid" : ""}`}
              name="tipoUsuario"
              value={formData.tipoUsuario}
              onChange={handleChange}
            >
              <option value="">Seleccionar Tipo de Usuario</option>
              {tipoUsuario.map((tipoUsuario) => (
                <option key={tipoUsuario} value={tipoUsuario}>
                  {tipoUsuario}
                </option>
              ))}
            </select>
            {campoErrors.tipoUsuario && <div className="invalid-feedback">{campoErrors.tipoUsuario}</div>}
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Comentario</label>
          <textarea
            className={`form-control ${campoErrors.comentario ? "is-invalid" : ""}`}
            name="comentario"
            value={formData.comentario}
            onChange={handleChange}
          />
          {campoErrors.comentario && <div className="invalid-feedback">{campoErrors.comentario}</div>}
        </div>

        {/* BOTONES */}
        <div className="d-flex justify-content-end gap-2">
          <button type="submit" className="btn btn-success">
            Abrir Molinete
          </button>
        </div>
      </form>
    </div>
  )
}
