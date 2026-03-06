import { useState } from "react";
import "../../styles/Admin.css";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import Modal from "react-modal";
import TablaMovimientos from "../../components/admin/TablaMovimientos";
import ModalMovimiento from "../../components/admin/ModalMovimiento";



export default function Gastos() {
  const [paginaActual, setPaginaActual] = useState(1);

  /* ================= DATOS MOCK ================= */

  const movimientos = [
    { id: 1, fecha: "2025-01-02", tipo: "Ingreso", categoria: "Cuotas", descripcion: "Cuotas enero", monto: 250000 },
    { id: 2, fecha: "2025-01-05", tipo: "Egreso", categoria: "Servicios", descripcion: "Luz", monto: 40000 },
    { id: 3, fecha: "2025-01-10", tipo: "Egreso", categoria: "Sueldos", descripcion: "Profesorado", monto: 120000 },
    { id: 4, fecha: "2025-01-15", tipo: "Ingreso", categoria: "Inscripciones", descripcion: "Nuevos alumnos", monto: 80000 },
    { id: 5, fecha: "2025-01-17", tipo: "Ingreso", categoria: "Inscripciones", descripcion: "Nuevos alumnos", monto: 80000 },
    { id: 6, fecha: "2025-01-17", tipo: "Egreso", categoria: "Servicios", descripcion: "Agua", monto: 50000 },
  ];

  const resumen = {
    ingresos: 330000,
    egresos: 160000,
    balance: 170000,
  };

  const gastosPorCategoria = [
    { name: "Servicios", value: 40000 },
    { name: "Sueldos", value: 120000 },
    { name: "Insumos", value: 30000 },
  ];

  const balanceMensual = [
    { mes: "Ene", ingresos: 330000, egresos: 160000 },
    { mes: "Feb", ingresos: 280000, egresos: 140000 },
    { mes: "Mar", ingresos: 350000, egresos: 200000 },
  ];

  const filasPorPagina = 5;
  const inicio = (paginaActual - 1) * filasPorPagina;
  const movimientosPagina = movimientos.slice(inicio, inicio + filasPorPagina);
  const totalPaginas = Math.ceil(movimientos.length / filasPorPagina);

  const COLORS = ["#dc3545", "#ffc107", "#6c757d"];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState("");

  const [formData, setFormData] = useState({
    categoria: "",
    descripcion: "",
    monto: "",
  });

  const abrirModal = (tipo) => {
    setTipoMovimiento(tipo);
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setTipoMovimiento("");
  };

  const registrarMovimiento = (movimiento) => {
    console.log("Movimiento registrado:", movimiento);
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const nuevoMovimiento = {
      fecha: new Date().toLocaleDateString(),
      tipo: tipoMovimiento,
      ...formData,
      monto: Number(formData.monto),
    };

    console.log("Movimiento registrado:", nuevoMovimiento);

    cerrarModal();
  };


  return (
    <>
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
            <h4 className="text-success">${resumen.ingresos.toLocaleString()}</h4>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card admin-card text-center">
            <h6>Egresos totales</h6>
            <h4 className="text-danger">${resumen.egresos.toLocaleString()}</h4>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card admin-card text-center">
            <h6>Balance actual</h6>
            <h4>${resumen.balance.toLocaleString()}</h4>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card admin-card">
            <div className="card-body">
              <h5 className="card-title">Registro de Movimientos</h5>
              <TablaMovimientos
                movimientos={movimientos}
                paginaActual={paginaActual}
                setPaginaActual={setPaginaActual}
              />
            </div>
          </div>

        </div>

        <div className="col-md-4">
          {/* GRÁFICOS */}
          <div className="card admin-card">
            <div className="card-body">
              <h5 className="card-title">Categorías de Gastos
              </h5>

              <div className="col-md-12">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={gastosPorCategoria} dataKey="value" nameKey="name" outerRadius={100}>
                      {gastosPorCategoria.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* RESUMENES */}

      <div className="card admin-card">
        <div className="card-body">
          <h5 className="card-title">Resumen de Balances</h5>
          <div className="row mt-2">
            {["Diario", "Mensual", "Anual"].map((tipo) => (
              <div className="col-md-4" key={tipo}>
                <div className="card admin-card text-center mt-2">
                  <h6>Balance {tipo}</h6>
                  <h4>$150.000</h4>
                  <small className="text-success">Ingresos: $200.000</small><br />
                  <small className="text-danger">Egresos: $50.000</small>
                </div>
              </div>
            ))}
          </div>

          <div className="col-md-12 p-5">
            <h6 className="text-start text-secondary">Balance mensual</h6>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={balanceMensual}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="egresos" fill="#dc3545" />
                <Bar dataKey="ingresos" fill="#198754" />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
