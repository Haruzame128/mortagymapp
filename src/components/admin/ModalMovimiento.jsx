import Modal from "react-modal";
import { useState, useEffect } from "react";
import { movimientosApi } from "../../services/api.js";
import Swal from "sweetalert2";

export default function ModalMovimiento({
  isOpen,
  onClose,
  tipoMovimiento,
  onSubmit,
}) {
  const [formData, setFormData] = useState({
    id_categoria: "",
    descripcion: "",
    monto_m: "",
    medio_pago_m: "Efectivo",
  });

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      cargarCategorias();
      setFormData({ id_categoria: "", descripcion: "", monto_m: "", medio_pago_m: "Efectivo" });
    }
  }, [isOpen]);

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      const data = await movimientosApi.getCategorias();
      const categoriasFiltradas = data.filter(c => c.tipo_cm === tipoMovimiento);
      setCategorias(categoriasFiltradas);
    } catch (err) {
      Swal.fire("Error", "No se pudieron cargar las categorías", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.id_categoria) {
      Swal.fire("Error", "Selecciona una categoría", "error");
      return;
    }

    const hoy = new Date();
    const fechaString = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');

    onSubmit({
      id_categoria: parseInt(formData.id_categoria),
      descripcion_m: formData.descripcion,
      monto_m: Number(formData.monto_m),
      medio_pago_m: formData.medio_pago_m,
      tipo_m: tipoMovimiento,
      fecha_m: fechaString,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Registrar movimiento"
      className="modal-react"
      overlayClassName="modal-overlay"
    >
      <div className="modal-header">
        <h5 className="modal-title">
          {tipoMovimiento === "Ingreso"
            ? "Registrar ingreso"
            : "Registrar egreso"}
        </h5>
        <button type="button" className="close" onClick={onClose}>
          <span>&times;</span>
        </button>
      </div>

      <div className="modal-body">
        <p className="text-muted my-3">
          <strong>Fecha:</strong> {new Date().toLocaleDateString()} <br />
          <strong>Tipo:</strong>{" "}
          <span
            className={
              tipoMovimiento === "Ingreso"
                ? "text-success"
                : "text-danger"
            }
          >
            {tipoMovimiento}
          </span>
        </p>

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-secondary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Categoría</label>
              <select
                className="form-control"
                name="id_categoria"
                value={formData.id_categoria}
                onChange={handleChange}
                required
              >
                <option value="">-- Seleccionar categoría --</option>
                {categorias.map(cat => (
                  <option key={cat.id_categoria} value={cat.id_categoria}>
                    {cat.nombre_cm}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Descripción</label>
              <input
                type="text"
                className="form-control"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Monto</label>
              <input
                type="number"
                className="form-control"
                name="monto_m"
                value={formData.monto_m}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Medio de pago</label>
              <select
                className="form-control"
                name="medio_pago_m"
                value={formData.medio_pago_m}
                onChange={handleChange}
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Debito">Débito</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Credito">Crédito</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="modal-footer px-0">
              <button
                type="button"
                className="btn btn-secondary me-2"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-admin">
                Guardar
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
