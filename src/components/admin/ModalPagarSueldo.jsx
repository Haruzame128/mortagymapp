import { useState, useEffect } from "react";
import Modal from "react-modal";
import Swal from "sweetalert2";

Modal.setAppElement("#root");

export default function ModalPagarSueldo({ isOpen, onClose, profesor, onSubmit }) {
  const [formData, setFormData] = useState({
    medio_pago: "Efectivo",
    numero_comprobante: "",
    observaciones: "",
  });

  useEffect(() => {
    if (profesor) {
      setFormData({
        medio_pago: "Efectivo",
        numero_comprobante: "",
        observaciones: "",
      });
    }
  }, [profesor, isOpen]);

  // Los valores deben coincidir exactamente con el check constraint de
  // movimientos.medio_pago_m (sin tildes) — con tilde el pago se guarda en
  // sueldos_pagados pero el egreso en movimientos revienta y hace rollback
  // de todo el pago.
  const mediosPago = [
    { value: "Efectivo", label: "Efectivo" },
    { value: "Debito", label: "Débito" },
    { value: "Transferencia", label: "Transferencia" },
    { value: "Credito", label: "Crédito" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.medio_pago) {
      Swal.fire("Error", "Debes seleccionar un medio de pago", "error");
      return;
    }

    onSubmit({
      profesor_id: profesor.profesor_id,
      profesor_nombre: profesor.profesor_nombre,
      monto: profesor.monto,
      medio_pago: formData.medio_pago,
      numero_comprobante: formData.numero_comprobante,
      observaciones: formData.observaciones,
      fecha: new Date().toISOString().slice(0, 10),
      detalle: profesor.condiciones,
    });
  };

  if (!profesor) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Pagar sueldo"
      className="modal-react"
      overlayClassName="modal-overlay"
    >
      <div className="modal-header">
        <h5 className="modal-title">Pagar Sueldo - {profesor.profesor_nombre}</h5>
        <button type="button" className="close" onClick={onClose}>
          <span>&times;</span>
        </button>
      </div>

      <div className="modal-body">
        <div className="mb-4 p-3 bg-light rounded">
          <div className="row">
            <div className="col-md-6">
              <h6 className="text-muted mb-2">Condiciones</h6>
              {profesor.condiciones?.map((c) => (
                <div key={c.disciplina} className="small">
                  {c.disciplina}: {c.modalidad === "porcentaje" ? `${c.valor}%`
                    : c.modalidad === "por_hora" ? `$${c.valor}/h`
                    : `$${c.valor}/alumno`}
                </div>
              ))}
            </div>
            <div className="col-md-6">
              <h6 className="text-muted mb-2">Clientes Pagos</h6>
              <h5>{profesor.clientes_pagos}</h5>
            </div>
          </div>
          <hr className="my-3" />
          <div className="row">
            <div className="col-12">
              <h6 className="text-muted mb-2">Monto Total a Pagar</h6>
              <h4 className="text-success">
                ${parseFloat(profesor.monto).toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })}
              </h4>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Medio de Pago *</label>
            <select
              className="form-control"
              name="medio_pago"
              value={formData.medio_pago}
              onChange={handleChange}
              required
            >
              <option value="">-- Seleccionar --</option>
              {mediosPago.map((medio) => (
                <option key={medio.value} value={medio.value}>
                  {medio.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Número de Comprobante</label>
            <input
              type="text"
              className="form-control"
              name="numero_comprobante"
              value={formData.numero_comprobante}
              onChange={handleChange}
              placeholder="Ej: TRF-001, CHQ-123"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Observaciones</label>
            <textarea
              className="form-control"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows="3"
              placeholder="Notas adicionales sobre el pago"
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-success">
              <i className="ri-check-line"></i> Confirmar Pago
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
