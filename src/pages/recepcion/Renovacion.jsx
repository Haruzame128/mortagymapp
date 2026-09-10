import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { clientesApi } from "../../services/api";
import ModalRenovarSuscripcion from "../../components/admin/ModalRenovarSuscripcion";

export default function Renovacion() {
  const [searchParams] = useSearchParams();
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [clienteId, setClienteId] = useState(null);
  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [inscripcionSeleccionada, setInscripcionSeleccionada] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    clientesApi.getAll().then(setClientes).catch(console.error);

    // Si venimos desde el listado de un alumno puntual (ej. botón "Renovar"
    // en /recepcion/usuarios), saltamos la búsqueda por DNI.
    const idPreseleccionado = searchParams.get("id");
    if (idPreseleccionado) cargarDetalle(idPreseleccionado);
  }, []);

  const cargarDetalle = async (id) => {
    setCargando(true);
    try {
      const data = await clientesApi.getById(id);
      setClienteDetalle(data);
      setClienteId(id);
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo cargar el cliente", "error");
    } finally {
      setCargando(false);
    }
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    const dni = busqueda.trim();
    if (!dni) return;
    const encontrado = clientes.find((c) => String(c.dni_u) === dni);
    if (!encontrado) {
      Swal.fire("Sin resultados", `No se encontró ningún alumno con DNI ${dni}`, "warning");
      setClienteDetalle(null);
      setClienteId(null);
      return;
    }
    cargarDetalle(encontrado.id_cliente);
  };

  const abrirRenovar = (insc) => {
    setInscripcionSeleccionada(insc);
    setModalOpen(true);
  };

  const handleRenovar = async (data) => {
    try {
      const resultado = await clientesApi.renovarInscripcion(
        clienteId,
        inscripcionSeleccionada.id_inscripto,
        data
      );
      setModalOpen(false);
      setInscripcionSeleccionada(null);
      const montoTexto = resultado.monto
        ? ` — $${Number(resultado.monto).toLocaleString("es-AR")}`
        : "";
      Swal.fire("¡Renovado!", `Suscripción renovada correctamente${montoTexto}`, "success");
      cargarDetalle(clienteId);
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo renovar la suscripción", "error");
    }
  };

  return (
    <>
      <div className="mb-4">
        <h3>Renovación de cuota</h3>
        <small className="text-muted">Buscá al alumno por DNI para renovar su suscripción</small>
      </div>

      <form className="card admin-card mb-4" onSubmit={handleBuscar}>
        <div className="card-body d-flex gap-2">
          <input
            type="text"
            className="form-control"
            placeholder="DNI del alumno"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button type="submit" className="btn btn-admin text-nowrap">
            <i className="ri-search-line"></i> Buscar
          </button>
        </div>
      </form>

      {cargando && (
        <div className="text-center py-4">
          <div className="spinner-border text-secondary" role="status" />
        </div>
      )}

      {!cargando && clienteDetalle && (
        <div className="card admin-card">
          <div className="card-body">
            <h5 className="mb-1">{clienteDetalle.nomap_c}</h5>
            <p className="text-muted mb-3">DNI: {clienteDetalle.dni_u}</p>

            {clienteDetalle.inscripciones?.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Disciplina</th>
                      <th>Actividad</th>
                      <th>Horario</th>
                      <th>Días/sem</th>
                      <th>Entradas</th>
                      <th>Cuota</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clienteDetalle.inscripciones.map((i) => (
                      <tr key={i.id_inscripto}>
                        <td>{i.nombre_d}</td>
                        <td>{i.nombre_a}</td>
                        <td>
                          {i.dia_h && i.hora_h
                            ? `${i.dia_h} ${i.hora_h.slice(0, 5)}`
                            : <span className="text-muted">—</span>}
                        </td>
                        <td>{i.cantidad_dias ?? "—"}</td>
                        <td>
                          {i.entradas_restantes != null
                            ? `${i.entradas_restantes}/${i.entradas_totales}`
                            : "—"}
                        </td>
                        <td>
                          <span className={`badge ${i.pago_s ? "bg-success" : "bg-danger"}`}>
                            {i.pago_s ? "Pagado" : "Pendiente"}
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-admin"
                            onClick={() => abrirRenovar(i)}
                          >
                            <i className="ri-refresh-line"></i> Renovar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted">Este alumno no tiene inscripciones activas.</p>
            )}
          </div>
        </div>
      )}

      <ModalRenovarSuscripcion
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setInscripcionSeleccionada(null); }}
        inscripcion={inscripcionSeleccionada}
        onSubmit={handleRenovar}
      />
    </>
  );
}
