import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { movimientosApi } from "../../services/api";
import TablaMovimientos from "../../components/admin/TablaMovimientos";
import ModalMovimiento from "../../components/admin/ModalMovimiento";

export default function Caja() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState(10);
  const [modal, setModal] = useState(false);
  const [tipo, setTipo] = useState("");

  const [filtros, setFiltros] = useState({
    fecha_desde: "",
    fecha_hasta: "",
    tipo: "",
  });

  // El backend ya filtra para que Recepción solo vea lo que ella misma cargó.
  const cargar = async (filtrosActuales = filtros) => {
    try {
      setLoading(true);
      const data = await movimientosApi.getAll(
        filtrosActuales.tipo || undefined,
        filtrosActuales.fecha_desde || undefined,
        filtrosActuales.fecha_hasta || undefined
      );
      setMovimientos(data);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    const nuevosFiltros = { ...filtros, [name]: value };
    setFiltros(nuevosFiltros);
    setPaginaActual(1);
    cargar(nuevosFiltros);
  };

  const limpiarFiltros = () => {
    const vacios = { fecha_desde: "", fecha_hasta: "", tipo: "" };
    setFiltros(vacios);
    setPaginaActual(1);
    cargar(vacios);
  };

  const abrir = (t) => { setTipo(t); setModal(true); };

  const registrarMovimiento = async (movimiento) => {
    try {
      await movimientosApi.create(movimiento);
      Swal.fire("Éxito", "Movimiento registrado correctamente", "success");
      setModal(false);
      cargar();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-end flex-wrap gap-2 mb-4">
        <div className="row g-2 flex-grow-1">
          <div className="col-md-3">
            <label className="form-label">Desde</label>
            <input
              type="date"
              className="form-control"
              name="fecha_desde"
              value={filtros.fecha_desde}
              max={filtros.fecha_hasta || undefined}
              onChange={handleFiltroChange}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Hasta</label>
            <input
              type="date"
              className="form-control"
              name="fecha_hasta"
              value={filtros.fecha_hasta}
              min={filtros.fecha_desde || undefined}
              onChange={handleFiltroChange}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Tipo</label>
            <select
              className="form-control"
              name="tipo"
              value={filtros.tipo}
              onChange={handleFiltroChange}
            >
              <option value="">-- Todos --</option>
              <option value="Ingreso">Ingreso</option>
              <option value="Egreso">Egreso</option>
            </select>
          </div>
          <div className="col-md-3 d-flex align-items-end">
            <button className="btn btn-sm btn-outline-secondary" onClick={limpiarFiltros}>
              <i className="ri-refresh-line"></i> Limpiar
            </button>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-success" onClick={() => abrir("Ingreso")}>
            + Ingreso
          </button>
          <button className="btn btn-danger" onClick={() => abrir("Egreso")}>
            − Egreso
          </button>
        </div>
      </div>

      <h5 className="card-title mb-3">Mis movimientos cargados</h5>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status" />
        </div>
      ) : (
        <TablaMovimientos
          movimientos={movimientos}
          paginaActual={paginaActual}
          setPaginaActual={setPaginaActual}
          filasPorPagina={filasPorPagina}
          setFilasPorPagina={setFilasPorPagina}
        />
      )}

      <ModalMovimiento
        isOpen={modal}
        onClose={() => setModal(false)}
        tipoMovimiento={tipo}
        onSubmit={registrarMovimiento}
      />
    </>
  );
}
