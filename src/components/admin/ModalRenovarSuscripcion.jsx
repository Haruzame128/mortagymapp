import { useState, useEffect } from "react";
import Modal from "react-modal";
import Swal from "sweetalert2";
import { tieneConProfesor } from "../../utils/preciosDisciplina";

Modal.setAppElement("#root");

const TIPOS_PAGO = ["efectivo", "transferencia", "tarjeta", "mercadopago"];

export default function ModalRenovarSuscripcion({ isOpen, onClose, inscripcion, disciplinas = [], onSubmit }) {
  const [formData, setFormData] = useState({
    cantidad_dias: 1,
    tipo_pago: "efectivo",
    pago: true,
    con_profesor: false,
  });

  const precios = disciplinas.find((d) => Number(d.id_disciplina) === Number(inscripcion?.id_disciplina));
  const conProfesorDisponible = tieneConProfesor(precios);

  useEffect(() => {
    if (inscripcion) {
      setFormData({
        cantidad_dias: inscripcion.cantidad_dias || 1,
        tipo_pago: "efectivo",
        pago: true,
        con_profesor: inscripcion.con_profesor ?? false,
      });
    }
  }, [inscripcion, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.cantidad_dias) {
      Swal.fire("Error", "Seleccioná los días por semana", "error");
      return;
    }
    onSubmit({
      cantidad_dias: Number(formData.cantidad_dias),
      tipo_pago: formData.tipo_pago,
      pago: formData.pago,
      con_profesor: conProfesorDisponible ? formData.con_profesor : null,
    });
  };

  if (!inscripcion) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Renovar suscripción"
      className="modal-react"
      overlayClassName="modal-overlay"
    >
      <div className="modal-header">
        <h5 className="modal-title">
          Renovar — {inscripcion.nombre_d} / {inscripcion.nombre_a}
        </h5>
        <button type="button" className="close" onClick={onClose}>
          <span>&times;</span>
        </button>
      </div>

      <div className="modal-body">
        <div className="mb-4 p-3 bg-light rounded">
          <div className="row">
            <div className="col-md-6">
              <h6 className="text-muted mb-2">Último período</h6>
              <p className="mb-0">
                {inscripcion.fecha_s
                  ? new Date(inscripcion.fecha_s).toLocaleDateString("es-AR")
                  : "—"}
              </p>
            </div>
            <div className="col-md-6">
              <h6 className="text-muted mb-2">Estado actual</h6>
              <span className={`badge ${inscripcion.pago_s ? "bg-success" : "bg-danger"}`}>
                {inscripcion.pago_s ? "Pagado" : "Pendiente"}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Días por semana *</label>
            <select
              className="form-control"
              name="cantidad_dias"
              value={formData.cantidad_dias}
              onChange={handleChange}
              required
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} día{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          {conProfesorDisponible && (
            <div className="mb-3">
              <label className="form-label">Modalidad *</label>
              <select
                className="form-control"
                name="con_profesor"
                value={formData.con_profesor ? "con" : "sin"}
                onChange={(e) => setFormData({ ...formData, con_profesor: e.target.value === "con" })}
                required
              >
                <option value="con">Con profesor</option>
                <option value="sin">Sin profesor</option>
              </select>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">Tipo de pago *</label>
            <select
              className="form-control"
              name="tipo_pago"
              value={formData.tipo_pago}
              onChange={handleChange}
              required
            >
              {TIPOS_PAGO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              name="pago"
              checked={formData.pago}
              onChange={handleChange}
            />
            <label className="form-check-label">Pago recibido</label>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-success">
              <i className="ri-check-line"></i> Confirmar renovación
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
