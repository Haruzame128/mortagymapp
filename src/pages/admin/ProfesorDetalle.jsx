import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { profesoresApi, contratosApi, sueldosApi, horariosApi } from "../../services/api";
import { abrirDialogoAptoMedico, badgeAptoMedico } from "../../utils/aptoMedico";
import "../../styles/Admin.css";

const formatoModalidad = (c) => {
  if (c.modalidad === "porcentaje") return `${c.valor}%`;
  if (c.modalidad === "por_hora") return `$${c.valor}/hora`;
  return `$${c.valor}/alumno`;
};

const estadoBadgeContrato = (estado) => {
  if (estado === "vigente") return <span className="badge bg-success">Vigente</span>;
  if (estado === "vencido") return <span className="badge bg-danger">Vencido</span>;
  if (estado === "rescindido") return <span className="badge bg-secondary">Rescindido</span>;
  return <span className="badge bg-secondary">—</span>;
};

export default function ProfesorDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profesor, setProfesor] = useState(null);
  const [contratos, setContratos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [horariosAQuitar, setHorariosAQuitar] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarTodo = async () => {
    try {
      setCargando(true);
      const [datosProfesor, historialContratos, historialPagos, todosLosHorarios, alumnosHorarios] = await Promise.all([
        profesoresApi.getById(id),
        profesoresApi.getContratos(id),
        sueldosApi.getHistorial(),
        horariosApi.getAll(),
        profesoresApi.getAlumnos(id),
      ]);
      setProfesor(datosProfesor);
      setContratos(historialContratos);
      setPagos(historialPagos.filter((p) => Number(p.id_profesor) === Number(id)));
      setHorarios(todosLosHorarios.filter((h) => Number(h.id_profesor) === Number(id)));
      setAlumnos(alumnosHorarios || []);
      setHorariosAQuitar([]);
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo cargar el profesor", "error");
      navigate("/admin/profesores");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarTodo(); }, [id]);

  const toggleHorarioAQuitar = (id) =>
    setHorariosAQuitar((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const quitarHorariosDelProfesor = (lista) =>
    Promise.all(
      lista.map((h) =>
        horariosApi.update(h.id_horario, {
          dia: h.dia_h,
          hora: h.hora_h?.slice(0, 5),
          cupo_maximo: Number(h.cupo_maximo),
          cupo_actual: Number(h.cupo_actual),
          id_profesor: null,
        }),
      ),
    );

  const handleQuitarHorario = (h) => {
    Swal.fire({
      title: "¿Quitar este horario del profesor?",
      text: `${h.nombre_d} - ${h.nombre_a} (${h.dia_h} ${h.hora_h?.slice(0, 5)})`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Sí, quitar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await quitarHorariosDelProfesor([h]);
        cargarTodo();
      } catch (error) {
        Swal.fire("Error", error.message || "No se pudo quitar el horario", "error");
      }
    });
  };

  const handleQuitarHorariosSeleccionados = () => {
    if (horariosAQuitar.length === 0) return;
    Swal.fire({
      title: `¿Quitar ${horariosAQuitar.length} horario(s) del profesor?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Sí, quitar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const seleccionados = horarios.filter((h) => horariosAQuitar.includes(h.id_horario));
        await quitarHorariosDelProfesor(seleccionados);
        cargarTodo();
      } catch (error) {
        Swal.fire("Error", error.message || "No se pudieron quitar los horarios", "error");
      }
    });
  };

  const handleRescindirContrato = async () => {
    const { value: motivo } = await Swal.fire({
      title: "Rescindir contrato",
      input: "textarea",
      inputLabel: "Motivo de la baja",
      inputPlaceholder: "Ej: renuncia, cierre de disciplina, etc.",
      showCancelButton: true,
      confirmButtonText: "Rescindir",
      confirmButtonColor: "#dc3545",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => !value && "El motivo es obligatorio",
    });
    if (!motivo) return;

    try {
      await contratosApi.rescindir(profesor.contrato_vigente.id_contrato, { motivo });
      Swal.fire("Listo", "Contrato rescindido. El profesor quedó inactivo.", "success");
      cargarTodo();
    } catch (error) {
      const horariosPendientes = error.data?.horarios;
      if (horariosPendientes?.length) {
        const lista = horariosPendientes
          .map((h) => `• ${h.nombre_d} / ${h.nombre_a} — ${h.dia_h} ${h.hora_h?.slice(0, 5)}`)
          .join("<br>");
        Swal.fire({
          title: "No se puede dar de baja",
          html: `Todavía tiene horarios asignados:<br><br>${lista}<br><br>Quitalos desde "Horarios asignados" más abajo y volvé a intentar.`,
          icon: "warning",
        });
      } else {
        Swal.fire("Error", error.message || "No se pudo rescindir el contrato", "error");
      }
    }
  };

  if (cargando) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-secondary" role="status" />
      </div>
    );
  }

  if (!profesor) return null;

  const contratoVigente = profesor.contrato_vigente;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn btn-outline-secondary btn-sm mb-2" onClick={() => navigate("/admin/profesores")}>
            <i className="ri-arrow-left-line"></i> Volver
          </button>
          <h3 className="mb-0">
            {profesor.nomap_p}{" "}
            <span className={`badge ${profesor.activo_p ? "bg-success" : "bg-secondary"}`}>
              {profesor.activo_p ? "Activo" : "Inactivo"}
            </span>
          </h3>
          <small className="text-muted">DNI: {profesor.dni_u}</small>
        </div>
        <button className="btn btn-admin" onClick={() => navigate(`/admin/profesores/${id}/editar`)}>
          <i className="ri-pencil-fill"></i> Editar
        </button>
      </div>

      {/* DATOS PERSONALES */}
      <div className="card admin-card mb-4">
        <div className="card-body">
          <h6 className="fw-bold mb-3">Datos personales</h6>
          <div className="row">
            <div className="col-md-4 mb-2">
              <small className="text-muted d-block">Dirección</small>
              {profesor.direccion_p || "—"}
            </div>
            <div className="col-md-4 mb-2">
              <small className="text-muted d-block">Teléfono</small>
              {profesor.telefono_p || "—"}
            </div>
            <div className="col-md-4 mb-2">
              <small className="text-muted d-block">Celular</small>
              {profesor.celular_p || "—"}
            </div>
            <div className="col-md-4 mb-2">
              <small className="text-muted d-block">Fecha de nacimiento</small>
              {profesor.fecha_nac_p ? new Date(profesor.fecha_nac_p).toLocaleDateString("es-AR") : "—"}
            </div>
            <div className="col-md-4 mb-2">
              <small className="text-muted d-block">Mail</small>
              {profesor.mail_p || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* APTO MÉDICO — certificado físico entregado por el profesor */}
      <div className="card admin-card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <h6 className="fw-bold mb-0">Apto médico (certificado físico)</h6>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => abrirDialogoAptoMedico(
                { nombre: profesor.nomap_p, fecha_entrega_ficha_medica: profesor.fecha_entrega_ficha_medica },
                (fecha) => profesoresApi.setAptoMedico(id, fecha),
                cargarTodo
              )}
            >
              <i className="ri-pencil-fill"></i>{" "}
              {profesor.fecha_entrega_ficha_medica ? "Renovar / quitar" : "Registrar entrega"}
            </button>
          </div>
          <div className="row">
            <div className="col-md-4 mb-2">
              <small className="text-muted d-block">Estado</small>
              <span className={`badge ${badgeAptoMedico(profesor.estado_ficha_medica).clase}`}>
                {badgeAptoMedico(profesor.estado_ficha_medica).texto}
              </span>
            </div>
            <div className="col-md-4 mb-2">
              <small className="text-muted d-block">Entregado el</small>
              {profesor.fecha_entrega_ficha_medica
                ? new Date(profesor.fecha_entrega_ficha_medica).toLocaleDateString("es-AR")
                : "—"}
            </div>
            <div className="col-md-4 mb-2">
              <small className="text-muted d-block">Vence el</small>
              {profesor.venc_ficha_medica
                ? new Date(profesor.venc_ficha_medica).toLocaleDateString("es-AR")
                : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* CONTRATO VIGENTE */}
      <div className="card admin-card mb-4">
        <div className="card-body">
          <h6 className="fw-bold mb-3">Contrato vigente</h6>
          {contratoVigente?.id_contrato ? (
            <>
              <div className="row mb-2">
                <div className="col-md-4">
                  <small className="text-muted d-block">Desde</small>
                  {new Date(contratoVigente.fecha_alta).toLocaleDateString("es-AR")}
                </div>
                <div className="col-md-4">
                  <small className="text-muted d-block">Vencimiento</small>
                  {contratoVigente.fecha_vencimiento
                    ? new Date(contratoVigente.fecha_vencimiento).toLocaleDateString("es-AR")
                    : "Sin plazo"}
                  {contratoVigente.dias_para_vencer != null && contratoVigente.dias_para_vencer < 0 && (
                    <span className="badge bg-danger ms-2">Vencido</span>
                  )}
                  {contratoVigente.dias_para_vencer != null && contratoVigente.dias_para_vencer >= 0 && contratoVigente.dias_para_vencer <= 30 && (
                    <span className="badge bg-warning text-dark ms-2">
                      Vence en {contratoVigente.dias_para_vencer} días
                    </span>
                  )}
                </div>
              </div>
              <small className="text-muted d-block mb-1">Condiciones</small>
              <ul className="mb-3 ps-3">
                {(contratoVigente.condiciones || []).map((c) => (
                  <li key={c.id_disciplina}>{c.disciplina} — {formatoModalidad(c)}</li>
                ))}
              </ul>
              <button className="btn btn-sm btn-outline-danger" onClick={handleRescindirContrato}>
                <i className="ri-close-circle-line"></i> Rescindir contrato
              </button>
            </>
          ) : (
            <p className="text-muted mb-0">Este profesor no tiene contrato vigente.</p>
          )}
        </div>
      </div>

      {/* HORARIOS ASIGNADOS */}
      <div className="card admin-card mb-4">
        <div className="card-body">
          <h6 className="fw-bold mb-3">Horarios asignados</h6>
          {horarios.length > 0 ? (
            <>
              {horariosAQuitar.length > 0 && (
                <div className="mb-2">
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={handleQuitarHorariosSeleccionados}
                  >
                    <i className="ri-close-line"></i> Quitar seleccionados ({horariosAQuitar.length})
                  </button>
                </div>
              )}
              <div className="table-responsive">
                <table className="table table-sm table-bordered align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 32 }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={horariosAQuitar.length === horarios.length}
                          onChange={(e) =>
                            setHorariosAQuitar(e.target.checked ? horarios.map((h) => h.id_horario) : [])
                          }
                        />
                      </th>
                      <th>Disciplina</th>
                      <th>Actividad</th>
                      <th>Día</th>
                      <th>Hora</th>
                      <th className="text-center">Quitar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horarios.map((h) => (
                      <tr key={h.id_horario}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={horariosAQuitar.includes(h.id_horario)}
                            onChange={() => toggleHorarioAQuitar(h.id_horario)}
                          />
                        </td>
                        <td>{h.nombre_d}</td>
                        <td>{h.nombre_a}</td>
                        <td>{h.dia_h}</td>
                        <td>{h.hora_h?.slice(0, 5)}</td>
                        <td className="text-center">
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleQuitarHorario(h)}>
                            <i className="ri-close-line"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-muted mb-0">No tiene horarios asignados.</p>
          )}
        </div>
      </div>

      {/* ALUMNOS QUE ASISTEN */}
      <div className="card admin-card mb-4">
        <div className="card-body">
          <h6 className="fw-bold mb-3">Alumnos que asisten a sus horarios</h6>
          {alumnos.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Día</th>
                    <th>Hora</th>
                    <th>Disciplina</th>
                    <th>Actividad</th>
                    <th>Alumno</th>
                    <th>DNI</th>
                    <th className="text-center">Cuota</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnos.map((al) => (
                    <tr key={`${al.id_horario}-${al.id_cliente}`}>
                      <td>{al.dia_h}</td>
                      <td>{al.hora_h?.slice(0, 5)}</td>
                      <td>{al.nombre_d}</td>
                      <td>{al.nombre_a}</td>
                      <td>{al.nomap_c}</td>
                      <td>{al.dni_u}</td>
                      <td className="text-center">
                        <span className={`badge ${al.pago_s ? "bg-success" : "bg-danger"}`}>
                          {al.pago_s ? "Pagado" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted mb-0">No tiene alumnos asignados en sus horarios.</p>
          )}
        </div>
      </div>

      {/* HISTORIAL DE CONTRATOS */}
      <div className="card admin-card mb-4">
        <div className="card-body">
          <h6 className="fw-bold mb-3">Historial de contratos</h6>
          {contratos.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Desde</th>
                    <th>Hasta</th>
                    <th>Estado</th>
                    <th>Tipo de baja</th>
                    <th>Motivo</th>
                    <th>Condiciones</th>
                  </tr>
                </thead>
                <tbody>
                  {contratos.map((c) => (
                    <tr key={c.id_contrato}>
                      <td className="small">{new Date(c.fecha_alta).toLocaleDateString("es-AR")}</td>
                      <td className="small">
                        {c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toLocaleDateString("es-AR") : "Sin plazo"}
                      </td>
                      <td>{estadoBadgeContrato(c.estado)}</td>
                      <td className="small">{c.tipo_baja || "—"}</td>
                      <td className="small">{c.motivo_baja || "—"}</td>
                      <td className="small">
                        {c.condiciones.map((cond) => (
                          <div key={cond.id_disciplina}>{cond.disciplina}: {formatoModalidad(cond)}</div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted mb-0">Sin historial de contratos.</p>
          )}
        </div>
      </div>

      {/* HISTORIAL DE PAGOS */}
      <div className="card admin-card">
        <div className="card-body">
          <h6 className="fw-bold mb-3">Historial de pagos de sueldo</h6>
          {pagos.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Mes</th>
                    <th className="text-end">Monto</th>
                    <th>Medio de pago</th>
                    <th>Comprobante</th>
                    <th>Fecha de pago</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((p) => (
                    <tr key={p.id_sueldo}>
                      <td>{p.mes}</td>
                      <td className="text-end">
                        ${parseFloat(p.monto).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>
                      <td>{p.medio_pago}</td>
                      <td>{p.numero_comprobante || "—"}</td>
                      <td>{new Date(p.fecha_pago).toLocaleDateString("es-AR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted mb-0">Sin pagos registrados todavía.</p>
          )}
        </div>
      </div>
    </>
  );
}
