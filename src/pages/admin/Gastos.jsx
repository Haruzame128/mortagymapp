import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../../styles/Admin.css";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import Modal from "react-modal";
import { movimientosApi, revisionesApi } from "../../services/api.js";
import TablaMovimientos from "../../components/admin/TablaMovimientos";
import ModalMovimiento from "../../components/admin/ModalMovimiento";

Modal.setAppElement("#root");

export default function Gastos() {
  const [paginaActual, setPaginaActual] = useState(1);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState({ ingresos: 0, egresos: 0, balance: 0 });
  const [gastosPorCategoria, setGastosPorCategoria] = useState([]);
  const [ingresosPorCategoria, setIngresosPorCategoria] = useState([]);
  const [balanceMensual, setBalanceMensual] = useState([]);
  const [cajaHoy, setCajaHoy] = useState({ efectivo: 0, debito: 0, transferencia: 0, credito: 0 });
  const [filasPorPagina, setFilasPorPagina] = useState(10);
  const [precioRevision, setPrecioRevision] = useState(null);

  // Filtros
  const getHoyString = () => {
    const hoy = new Date();
    return hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
  };

  const [filtros, setFiltros] = useState({
    fecha_desde: getHoyString(),
    fecha_hasta: getHoyString(),
    tipo: '',
    medio_pago: '',
  });

  const inicio = (paginaActual - 1) * filasPorPagina;
  const movimientosPagina = movimientos.slice(inicio, inicio + filasPorPagina);
  const totalPaginas = Math.ceil(movimientos.length / filasPorPagina);

  const COLORS_EGRESOS = ["#dc3545", "#ffc107", "#6c757d"];
  const COLORS_INGRESOS = ["#198754", "#20c997", "#0d6efd", "#6c757d"];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState("");

  // Cargar movimientos al montar y cuando cambian filtros
  useEffect(() => {
    cargarMovimientos();
    cargarPrecioRevision();
  }, []);

  const cargarPrecioRevision = async () => {
    try {
      const data = await revisionesApi.getPrecio();
      setPrecioRevision(data.vigente?.monto ?? null);
    } catch (err) {
      console.error("Error cargando precio de revisación médica:", err);
    }
  };

  const handleEditarPrecioRevision = async () => {
    const { value: nuevoMonto } = await Swal.fire({
      title: "Precio de revisación médica",
      text: "Natación — se cobra una vez por mes a cada cliente inscripto",
      input: "number",
      inputLabel: "Nuevo monto",
      inputValue: precioRevision ?? "",
      inputAttributes: { min: 1, step: "0.01" },
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value || Number(value) <= 0) return "Ingresá un monto válido";
      },
    });
    if (!nuevoMonto) return;

    try {
      await revisionesApi.setPrecio(Number(nuevoMonto));
      Swal.fire("¡Listo!", "Precio actualizado correctamente", "success");
      cargarPrecioRevision();
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo actualizar el precio", "error");
    }
  };

  const cargarMovimientos = async (filtrosActuales = filtros) => {
    try {
      setLoading(true);
      const data = await movimientosApi.getAll(
        filtrosActuales.tipo || undefined,
        filtrosActuales.fecha_desde,
        filtrosActuales.fecha_hasta
      );

      // Filtrar por medio de pago si está seleccionado
      const dataFiltrada = filtrosActuales.medio_pago
        ? data.filter(m => m.medio_pago_m === filtrosActuales.medio_pago)
        : data;

      setMovimientos(dataFiltrada);
      calcularResumen(dataFiltrada);
      calcularCajaHoy(dataFiltrada);

      // Cargar balance mensual
      const balances = await movimientosApi.getBalanceMensual();
      setBalanceMensual(balances);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    const nuevosFiltros = { ...filtros, [name]: value };
    setFiltros(nuevosFiltros);
    setPaginaActual(1);
    cargarMovimientos(nuevosFiltros);
  };

  const calcularCajaHoy = (datos) => {
    const caja = {
      efectivo: 0,
      debito: 0,
      transferencia: 0,
      credito: 0,
      otro: 0,
    };

    datos.forEach(m => {
      if (m.tipo_m === 'Ingreso') {
        const medio = m.medio_pago_m.toLowerCase();
        if (medio === 'efectivo') caja.efectivo += parseFloat(m.monto_m || 0);
        else if (medio === 'debito') caja.debito += parseFloat(m.monto_m || 0);
        else if (medio === 'transferencia') caja.transferencia += parseFloat(m.monto_m || 0);
        else if (medio === 'credito') caja.credito += parseFloat(m.monto_m || 0);
        else caja.otro += parseFloat(m.monto_m || 0);
      }
    });

    setCajaHoy(caja);
  };

  const calcularResumen = (datos) => {
    const ingresos = datos
      .filter(m => m.tipo_m === "Ingreso")
      .reduce((sum, m) => sum + parseFloat(m.monto_m || 0), 0);
    const egresos = datos
      .filter(m => m.tipo_m === "Egreso")
      .reduce((sum, m) => sum + parseFloat(m.monto_m || 0), 0);

    setResumen({
      ingresos,
      egresos,
      balance: ingresos - egresos,
    });

    // Agrupar por categoría, separado por tipo
    const egresosPorCategoria = {};
    const ingresosPorCat = {};
    datos.forEach(m => {
      const monto = parseFloat(m.monto_m || 0);
      if (m.tipo_m === "Egreso") {
        egresosPorCategoria[m.categoria] = (egresosPorCategoria[m.categoria] || 0) + monto;
      } else if (m.tipo_m === "Ingreso") {
        ingresosPorCat[m.categoria] = (ingresosPorCat[m.categoria] || 0) + monto;
      }
    });
    setGastosPorCategoria(
      Object.entries(egresosPorCategoria).map(([name, value]) => ({ name, value }))
    );
    setIngresosPorCategoria(
      Object.entries(ingresosPorCat).map(([name, value]) => ({ name, value }))
    );
  };

  const abrirModal = (tipo) => {
    setTipoMovimiento(tipo);
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setTipoMovimiento("");
  };

  const registrarMovimiento = async (movimiento) => {
    try {
      await movimientosApi.create(movimiento);
      Swal.fire("Éxito", "Movimiento registrado correctamente", "success");
      cargarMovimientos();
      cerrarModal();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
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
      {/* FILTROS */}
      <div className="card admin-card mb-4">
        <div className="card-body">
          <h6 className="card-title mb-3">Filtros</h6>
          <div className="row g-3">
            <div className="col-md-2">
              <label className="form-label">Desde</label>
              <input
                type="date"
                className="form-control"
                name="fecha_desde"
                value={filtros.fecha_desde}
                max={filtros.fecha_hasta}
                onChange={handleFiltroChange}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Hasta</label>
              <input
                type="date"
                className="form-control"
                name="fecha_hasta"
                value={filtros.fecha_hasta}
                min={filtros.fecha_desde}
                onChange={handleFiltroChange}
              />
            </div>
            <div className="col-md-2">
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
            <div className="col-md-2">
              <label className="form-label">Medio de pago</label>
              <select
                className="form-control"
                name="medio_pago"
                value={filtros.medio_pago}
                onChange={handleFiltroChange}
              >
                <option value="">-- Todos --</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Debito">Débito</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Credito">Crédito</option>
              </select>
            </div>
            <div className="col-md-4 d-flex align-items-end gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  const hoy = getHoyString();
                  setFiltros({
                    fecha_desde: hoy,
                    fecha_hasta: hoy,
                    tipo: '',
                    medio_pago: '',
                  });
                  cargarMovimientos();
                }}
              >
                <i className="ri-refresh-line"></i> Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CAJA DEL DÍA */}
      <div className="card admin-card mb-4">
        <div className="card-body">
          <h6 className="card-title mb-3">Caja del día - Desglose por medio de pago (Ingresos)</h6>
          <div className="row g-3">
            <div className="col-md-2">
              <div className="text-center p-3 border rounded">
                <h6 className="text-muted mb-2">Efectivo</h6>
                <h4 className="text-success">${cajaHoy.efectivo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</h4>
              </div>
            </div>
            <div className="col-md-2">
              <div className="text-center p-3 border rounded">
                <h6 className="text-muted mb-2">Débito</h6>
                <h4 className="text-primary">${cajaHoy.debito.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</h4>
              </div>
            </div>
            <div className="col-md-2">
              <div className="text-center p-3 border rounded">
                <h6 className="text-muted mb-2">Transferencia</h6>
                <h4 className="text-info">${cajaHoy.transferencia.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</h4>
              </div>
            </div>
            <div className="col-md-2">
              <div className="text-center p-3 border rounded">
                <h6 className="text-muted mb-2">Crédito</h6>
                <h4 className="text-warning">${cajaHoy.credito.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</h4>
              </div>
            </div>
            <div className="col-md-2">
              <div className="text-center p-3 border rounded bg-light">
                <h6 className="text-muted mb-2">Total</h6>
                <h4>${(cajaHoy.efectivo + cajaHoy.debito + cajaHoy.transferencia + cajaHoy.credito).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* BOTONES */}
      <div className="d-flex justify-content-end gap-2 mb-4">
        <button className="btn btn-success" onClick={() => abrirModal("Ingreso")}>
          <i className="ri-add-line"></i> Registrar ingreso
        </button>
        <button className="btn btn-danger" onClick={() => abrirModal("Egreso")}>
          <i className="ri-subtract-line"></i> Registrar egreso
        </button>
      </div>

      {/* TOTALES */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card admin-card text-center">
            <h6>Ingresos totales</h6>
            <h4 className="text-success">${resumen.ingresos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</h4>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card admin-card text-center">
            <h6>Egresos totales</h6>
            <h4 className="text-danger">${resumen.egresos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</h4>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card admin-card text-center">
            <h6>Balance actual</h6>
            <h4>${resumen.balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</h4>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="row mb-4">
        <div className="col-md-4">
          {/* GRÁFICOS — primero ingresos, luego egresos */}
          <div className="card admin-card mb-4">
            <div className="card-body">
              <h5 className="card-title">Categorías de Ingresos</h5>

              {ingresosPorCategoria.length === 0 ? (
                <p className="text-muted text-center py-4">Sin ingresos aún</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={ingresosPorCategoria} dataKey="value" nameKey="name" outerRadius={100}>
                      {ingresosPorCategoria.map((_, index) => (
                        <Cell key={index} fill={COLORS_INGRESOS[index % COLORS_INGRESOS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card admin-card">
            <div className="card-body">
              <h5 className="card-title">Categorías de Egresos</h5>

              {gastosPorCategoria.length === 0 ? (
                <p className="text-muted text-center py-4">Sin egresos aún</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={gastosPorCategoria} dataKey="value" nameKey="name" outerRadius={100}>
                      {gastosPorCategoria.map((_, index) => (
                        <Cell key={index} fill={COLORS_EGRESOS[index % COLORS_EGRESOS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card admin-card">
            <div className="card-body">
              <h5 className="card-title">Registro de Movimientos</h5>
              {movimientos.length === 0 ? (
                <p className="text-muted text-center py-4">No hay movimientos registrados</p>
              ) : (
                <TablaMovimientos
                  movimientos={movimientos}
                  paginaActual={paginaActual}
                  setPaginaActual={setPaginaActual}
                  filasPorPagina={filasPorPagina}
                  setFilasPorPagina={setFilasPorPagina}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* COMPARATIVA POR MES */}
      <div className="card admin-card">
        <div className="card-body">
          <h5 className="card-title mb-4">Comparativa por Mes - Ingresos vs Egresos</h5>
          {balanceMensual.length === 0 ? (
            <p className="text-muted text-center py-4">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={balanceMensual}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString('es-AR')}`} />
                <Legend />
                <Bar dataKey="ingresos" fill="#198754" name="Ingresos" />
                <Bar dataKey="egresos" fill="#dc3545" name="Egresos" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* MODAL */}
      <ModalMovimiento
        isOpen={isModalOpen}
        onClose={cerrarModal}
        tipoMovimiento={tipoMovimiento}
        onSubmit={registrarMovimiento}
      />

    </>
  );
}
