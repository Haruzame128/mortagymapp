import Modal from "react-modal";
import { useState, useEffect } from "react";
import "../../styles/perfiles.css";

const VACIO = { id_disciplina: "", nombre: "", telefono: "", dni: "", mail: "" };
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ModalAltaEspera({ isOpen, onClose, disciplinas, onSubmit }) {
  const [formData, setFormData] = useState(VACIO);
  const [campoErrors, setCampoErrors] = useState({});

  useEffect(() => {
    if (isOpen) { setFormData(VACIO); setCampoErrors({}); }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (campoErrors[name]) setCampoErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validar = () => {
    const errores = {};

    if (!formData.id_disciplina) errores.id_disciplina = "Seleccioná una disciplina";
    if (!formData.nombre.trim()) errores.nombre = "El nombre es obligatorio";

    if (formData.telefono && !/^\d{6,15}$/.test(formData.telefono.trim())) {
      errores.telefono = "Ingresá un teléfono válido (solo números)";
    }

    if (formData.dni && !/^\d{7,8}$/.test(String(formData.dni).trim())) {
      errores.dni = "Ingresá un DNI válido (7 u 8 dígitos)";
    }

    if (formData.mail && !EMAIL_REGEX.test(formData.mail.trim())) {
      errores.mail = "Ingresá un mail válido";
    }

    return errores;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const errores = validar();
    setCampoErrors(errores);
    if (Object.keys(errores).length > 0) return;

    onSubmit({
      id_disciplina: Number(formData.id_disciplina),
      nombre: formData.nombre,
      telefono: formData.telefono || undefined,
      dni: formData.dni ? Number(formData.dni) : undefined,
      mail: formData.mail || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Anotar en lista de espera"
      className="modal-react"
      overlayClassName="modal-overlay"
    >
      <div className="modal-header">
        <h5 className="modal-title">Anotar en lista de espera</h5>
        <button type="button" className="close" onClick={onClose}>
          <span>&times;</span>
        </button>
      </div>

      <div className="modal-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Disciplina</label>
            <select
              className={`form-control ${campoErrors.id_disciplina ? "is-invalid" : ""}`}
              name="id_disciplina"
              value={formData.id_disciplina}
              onChange={handleChange}
            >
              <option value="">-- Seleccionar --</option>
              {disciplinas.map((d) => (
                <option key={d.id_disciplina} value={d.id_disciplina}>{d.nombre_d}</option>
              ))}
            </select>
            {campoErrors.id_disciplina && <div className="invalid-feedback">{campoErrors.id_disciplina}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              className={`form-control ${campoErrors.nombre ? "is-invalid" : ""}`}
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
            />
            {campoErrors.nombre && <div className="invalid-feedback">{campoErrors.nombre}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Teléfono</label>
            <input
              type="number"
              className={`form-control no-spinner ${campoErrors.telefono ? "is-invalid" : ""}`}
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
            />
            {campoErrors.telefono && <div className="invalid-feedback">{campoErrors.telefono}</div>}
          </div>

          <div className="mb-3">
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

          <div className="mb-3">
            <label className="form-label">Mail</label>
            <input
              type="email"
              className={`form-control ${campoErrors.mail ? "is-invalid" : ""}`}
              name="mail"
              value={formData.mail}
              onChange={handleChange}
            />
            {campoErrors.mail && <div className="invalid-feedback">{campoErrors.mail}</div>}
          </div>

          <div className="modal-footer px-0">
            <button type="button" className="btn btn-secondary me-2" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-admin">
              Anotar
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
