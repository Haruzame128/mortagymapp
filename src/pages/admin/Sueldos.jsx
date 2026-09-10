import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Modal from "react-modal";
import { sueldosApi } from "../../services/api.js";
import TablaSueldos from "../../components/admin/TablaSueldos";
import ModalPagarSueldo from "../../components/admin/ModalPagarSueldo";
import PaginacionTabla from "../../components/PaginacionTabla";
import "../../styles/Admin.css";

Modal.setAppElement("#root");

// Rango por defecto: el mes calendario actual. El usuario puede elegir
// cualquier otro rango (ej. las dos semanas de un profesor que entró a
// mitad de mes) con los selectores de fecha.
const rangoMesActual = () => {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  const pad = (n) => String(n).padStart(2, "0");
  return {
    desde: `${anio}-${pad(mes + 1)}-01`,
    hasta: `${anio}-${pad(mes + 1)}-${pad(ultimoDia)}`,
  };
};

export default function Sueldos() {
  const [{ desde, hasta }, setRango] = useState(rangoMesActual());
  const [sueldos, setSueldos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState({
    totalAPagar: 0,
    totalPagado: 0,
    pendiente: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profesorSeleccionado, setProfessorSeleccionado] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [paginaHistorial, setPaginaHistorial] = useState(1);
  const [filasPorPaginaHistorial, setFilasPorPaginaHistorial] = useState(10);

  const inicioHistorial = (paginaHistorial - 1) * filasPorPaginaHistorial;
  const historialPagina = historial.slice(
    inicioHistorial,
    inicioHistorial + filasPorPaginaHistorial
  );

  useEffect(() => {
    cargarSueldos();
    cargarHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desde, hasta]);

  const cargarSueldos = async () => {
    try {
      setLoading(true);
      const data = await sueldosApi.getSueldos({ desde, hasta });
      setSueldos(data);
      calcularResumen(data);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = async () => {
    try {
      const data = await sueldosApi.getHistorial();
      setHistorial(data);
    } catch (err) {
      console.error("Error cargando historial:", err);
    }
  };

  const calcularResumen = (datos) => {
    const totalAPagar = datos.reduce((sum, s) => sum + (s.monto || 0), 0);
    const totalPagado = datos
      .filter((s) => s.estado === "Pagado")
      .reduce((sum, s) => sum + (s.monto || 0), 0);
    const pendiente = totalAPagar - totalPagado;

    setResumen({ totalAPagar, totalPagado, pendiente });
  };

  const abrirModalPago = (profesor) => {
    setProfessorSeleccionado(profesor);
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setProfessorSeleccionado(null);
  };

  const registrarPago = async (datoPago) => {
    try {
      // El backend ya registra el pago en sueldos_pagados y su egreso
      // correspondiente en movimientos, dentro de la misma transacción.
      await sueldosApi.registrarPago({
        ...datoPago,
        desde,
        hasta,
      });

      Swal.fire("Éxito", "Sueldo pagado correctamente", "success");
      cargarSueldos();
      cargarHistorial();
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
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Gestión de Sueldos</h3>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <label className="form-label mb-0">Desde:</label>
          <input
            type="date"
            className="form-control"
            style={{ width: "160px" }}
            value={desde}
            max={hasta}
            onChange={(e) => setRango((r) => ({ ...r, desde: e.target.value }))}
          />
          <label className="form-label mb-0">Hasta:</label>
          <input
            type="date"
            className="form-control"
            style={{ width: "160px" }}
            value={hasta}
            min={desde}
            onChange={(e) => setRango((r) => ({ ...r, hasta: e.target.value }))}
          />
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setRango(rangoMesActual())}>
            Mes actual
          </button>
        </div>
      </div>

      {/* RESUMEN */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card admin-card text-center">
            <h6 className="text-muted">Total a Pagar</h6>
            <h4 className="text-primary">
              ${resumen.totalAPagar.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}
            </h4>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card admin-card text-center">
            <h6 className="text-muted">Total Pagado</h6>
            <h4 className="text-success">
              ${resumen.totalPagado.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}
            </h4>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card admin-card text-center">
            <h6 className="text-muted">Pendiente</h6>
            <h4
              className={resumen.pendiente > 0 ? "text-danger" : "text-success"}
            >
              ${resumen.pendiente.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}
            </h4>
          </div>
        </div>
      </div>

      {/* TABLA DE SUELDOS */}
      <div className="card admin-card mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">
            Cálculo de Sueldos — {new Date(`${desde}T00:00:00`).toLocaleDateString("es-AR")} al{" "}
            {new Date(`${hasta}T00:00:00`).toLocaleDateString("es-AR")}
          </h5>
          {sueldos.length === 0 ? (
            <p className="text-muted text-center py-4">
              No hay profesores o no hay cálculo disponible para este período
            </p>
          ) : (
            <TablaSueldos
              sueldos={sueldos}
              onPagar={abrirModalPago}
              desde={desde}
              hasta={hasta}
            />
          )}
        </div>
      </div>

      {/* HISTORIAL DE PAGOS */}
      <div className="card admin-card">
        <div className="card-body">
          <h5 className="card-title mb-3">Historial de Pagos</h5>
          {historial.length === 0 ? (
            <p className="text-muted text-center py-4">Sin historial</p>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Profesor</th>
                      <th>Período</th>
                      <th>Monto</th>
                      <th>Medio de Pago</th>
                      <th>Fecha de Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialPagina.map((pago) => (
                      <tr key={pago.id_sueldo}>
                        <td>{pago.profesor_nombre}</td>
                        <td>
                          {pago.fecha_desde
                            ? `${new Date(pago.fecha_desde).toLocaleDateString("es-AR")} al ${new Date(pago.fecha_hasta).toLocaleDateString("es-AR")}`
                            : pago.mes}
                        </td>
                        <td className="fw-bold">
                          ${parseFloat(pago.monto).toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td>{pago.medio_pago}</td>
                        <td>
                          {new Date(pago.fecha_pago).toLocaleDateString("es-AR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <PaginacionTabla
                paginaActual={paginaHistorial}
                setPaginaActual={setPaginaHistorial}
                filasPorPagina={filasPorPaginaHistorial}
                setFilasPorPagina={setFilasPorPaginaHistorial}
                totalItems={historial.length}
              />
            </>
          )}
        </div>
      </div>

      {/* MODAL */}
      <ModalPagarSueldo
        isOpen={isModalOpen}
        onClose={cerrarModal}
        profesor={profesorSeleccionado}
        onSubmit={registrarPago}
      />
    </>
  );
}
