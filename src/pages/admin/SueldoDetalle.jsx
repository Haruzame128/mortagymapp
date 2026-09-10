import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { sueldosApi } from "../../services/api";
import "../../styles/Admin.css";

const formatoModalidad = (c) => {
  if (c.modalidad === "porcentaje") return `${c.valor}% del recaudado`;
  if (c.modalidad === "por_hora") return `$${c.valor} por hora`;
  return `$${c.valor} por alumno (monto fijo)`;
};

const claveMarca = (idHorario, fecha) => `${idHorario}_${fecha}`;

const formatoHora = (ts) => new Date(ts).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

const badgeFichada = (fichada) => {
  if (!fichada) return <span className="badge bg-secondary">Sin fichada</span>;
  if (fichada.dentro_tolerancia) return <span className="badge bg-success">A horario</span>;
  return <span className="badge bg-warning text-dark">Fuera de horario</span>;
};

// Solo informativo — muestra la fichada real (entrada/salida) contra la
// hora de clase programada. No cambia el checkbox de asistencia: esa
// decisión sigue siendo manual (el admin puede tener motivos para marcar
// presente/ausente distintos de lo que diga la fichada).
const verDetalleFichada = (f) => {
  const horaClase = f.hora_h?.slice(0, 5);
  const fechaFmt = new Date(`${f.fecha}T00:00:00`).toLocaleDateString("es-AR");
  Swal.fire({
    title: "Detalle de fichada",
    html: `
      <div class="text-start">
        <p class="mb-1"><strong>${fechaFmt}</strong> — clase programada a las ${horaClase}</p>
        ${f.fichada ? `
          <p class="mb-1">Entrada: <strong>${formatoHora(f.fichada.hora_entrada)}</strong></p>
          <p class="mb-1">Salida: <strong>${formatoHora(f.fichada.hora_salida)}</strong></p>
          <p class="mb-0 ${f.fichada.dentro_tolerancia ? "text-success" : "text-warning"}">
            ${f.fichada.dentro_tolerancia
              ? "Dentro del horario de tolerancia (±30 min)."
              : "Fichó ese día, pero el turno no cubre esta clase (fuera de tolerancia)."}
          </p>
        ` : `<p class="text-muted mb-0">No hay ninguna fichada registrada ese día.</p>`}
      </div>
    `,
    confirmButtonText: "Cerrar",
  });
};

// Página completa de detalle de cálculo de un sueldo — antes era un modal
// (ModalDetalleSueldo), pero al mostrar varias disciplinas con sus propias
// tablas de alumnos/horarios necesitaba más lugar, igual que pasó con el
// detalle de un alumno (AlumnoDetalle.jsx).
export default function SueldoDetalle() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");

  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [editandoAsistencia, setEditandoAsistencia] = useState(false);
  const [marcas, setMarcas] = useState({});
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    try {
      setCargando(true);
      const data = await sueldosApi.getDetalleProfesor(id, { desde, hasta });
      setDetalle(data);
      // Reconstruye el estado de los checkboxes a partir de lo calculado.
      const iniciales = {};
      data.condiciones
        .filter((c) => c.modalidad === "por_hora")
        .forEach((c) => c.detalle.forEach((h) =>
          h.fechas.forEach((f) => { iniciales[claveMarca(h.id_horario, f.fecha)] = f.asistio; })
        ));
      setMarcas(iniciales);
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo cargar el detalle", "error");
      navigate("/admin/sueldos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (id && desde && hasta) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, desde, hasta]);

  const hayCondicionesPorHora = detalle?.condiciones.some((c) => c.modalidad === "por_hora");

  const handleGuardarAsistencia = async () => {
    const marcasArray = Object.entries(marcas).map(([clave, asistio]) => {
      const [id_horario, ...resto] = clave.split("_");
      return { id_horario: Number(id_horario), fecha: resto.join("_"), asistio };
    });
    try {
      setGuardando(true);
      await sueldosApi.setAsistencia(id, marcasArray);
      setEditandoAsistencia(false);
      await cargar();
      Swal.fire("¡Listo!", "Asistencia actualizada — el monto se recalculó", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-secondary" role="status" />
      </div>
    );
  }

  if (!detalle) return null;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/admin/sueldos")}>
          <i className="ri-arrow-left-line"></i> Volver
        </button>
        {hayCondicionesPorHora && (
          editandoAsistencia ? (
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-secondary" onClick={() => { setEditandoAsistencia(false); cargar(); }} disabled={guardando}>
                Cancelar
              </button>
              <button className="btn btn-sm btn-admin" onClick={handleGuardarAsistencia} disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar asistencia"}
              </button>
            </div>
          ) : (
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditandoAsistencia(true)}>
              <i className="ri-calendar-check-line"></i> Editar asistencia
            </button>
          )
        )}
      </div>

      <h3 className="mb-4">Detalle de cálculo — {detalle.profesor_nombre}</h3>

      {/* RESUMEN */}
      <div className="card admin-card mb-4">
        <div className="card-body">
          <div className="row mb-2">
            <div className="col-md-6 mb-2">
              <small className="text-muted d-block">Período liquidado</small>
              <h5 className="mb-0">
                {new Date(`${detalle.desde}T00:00:00`).toLocaleDateString("es-AR")} al{" "}
                {new Date(`${detalle.hasta}T00:00:00`).toLocaleDateString("es-AR")}
              </h5>
            </div>
            <div className="col-md-6 mb-2">
              <small className="text-muted d-block">Contrato vigente en el período</small>
              <h6 className="mb-0">
                {detalle.contrato
                  ? `Desde ${new Date(detalle.contrato.fecha_alta).toLocaleDateString("es-AR")}`
                  : "—"}
              </h6>
            </div>
          </div>
          <hr className="my-2" />
          <div className="row">
            <div className="col-md-6 mb-2">
              <small className="text-muted d-block">Clientes pagos</small>
              <h5 className="mb-0">{detalle.clientes_pagos}</h5>
            </div>
            <div className="col-md-6 mb-2">
              <small className="text-muted d-block">Monto final</small>
              <h5 className="text-success mb-0">
                ${parseFloat(detalle.monto_final).toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })}
              </h5>
            </div>
          </div>
        </div>
      </div>

      {/* UNA CARD POR CONDICIÓN / DISCIPLINA */}
      {detalle.condiciones.map((c) => {
        // "por_hora" se muestra desglosado por fecha (una fila por clase real
        // dentro del período), con checkbox de asistencia — las demás
        // modalidades (porcentaje/monto_fijo) siguen mostrando el roster de
        // alumnos como antes, ya que ahí la asistencia del profesor no aplica
        // (dependen de si el alumno pagó, no de una fecha de clase puntual).
        const filasPorHora = c.modalidad === "por_hora"
          ? c.detalle
              .flatMap((h) => h.fechas.map((f) => ({ ...f, id_horario: h.id_horario, dia_h: h.dia_h, hora_h: h.hora_h, nombre_a: h.nombre_a })))
              .sort((a, b) => a.fecha.localeCompare(b.fecha))
          : [];

        return (
          <div className="card admin-card mb-3" key={c.id_disciplina}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                <h5 className="card-title mb-0">{c.disciplina}</h5>
                <span className="badge bg-info text-dark">{formatoModalidad(c)}</span>
              </div>
              <p className="mb-3">
                Aporta{" "}
                <strong className="text-success">
                  ${parseFloat(c.monto).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </strong>
                {c.modalidad === "por_hora" && ` (${c.horas} horas asistidas de ${filasPorHora.length} clases en el período)`}
              </p>

              {c.modalidad === "por_hora" ? (
                filasPorHora.length > 0 && (
                  <div className="table-responsive">
                    <table className="table table-sm table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Fecha</th><th>Día</th><th>Hora</th><th>Actividad</th>
                          <th className="text-center">Fichada</th>
                          <th className="text-center">Asistió</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filasPorHora.map((f) => {
                          const clave = claveMarca(f.id_horario, f.fecha);
                          return (
                            <tr key={clave} className={!marcas[clave] ? "table-danger" : ""}>
                              <td>{new Date(`${f.fecha}T00:00:00`).toLocaleDateString("es-AR")}</td>
                              <td>{f.dia_h}</td>
                              <td>{f.hora_h?.slice(0, 5)}</td>
                              <td className="text-muted">{f.nombre_a}</td>
                              <td className="text-center">
                                <button
                                  className="btn btn-sm p-0 border-0 bg-transparent"
                                  onClick={() => verDetalleFichada(f)}
                                  title="Ver detalle de fichada"
                                >
                                  {badgeFichada(f.fichada)}
                                </button>
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={!!marcas[clave]}
                                  disabled={!editandoAsistencia}
                                  onChange={(e) => setMarcas((m) => ({ ...m, [clave]: e.target.checked }))}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                c.detalle?.length > 0 && (
                  <div className="table-responsive">
                    <table className="table table-sm table-hover mb-0">
                      <thead className="table-light">
                        <tr><th>Alumno</th><th className="text-end">Monto</th><th className="text-center">Estado</th></tr>
                      </thead>
                      <tbody>
                        {c.detalle.map((al, idx) => (
                          <tr key={`${al.cliente_id}-${idx}`}>
                            <td>{al.cliente_nombre}</td>
                            <td className="text-end">
                              ${parseFloat(al.monto).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="text-center">
                              <span className={`badge ${al.estado_pago === "Pendiente" ? "bg-danger" : "bg-success"}`}>
                                {al.estado_pago || "Pagado"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
