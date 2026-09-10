import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { profesoresApi, contratosApi, disciplinasApi, actividadesApi, horariosApi } from "../../services/api";
import Swal from "sweetalert2";

const MODALIDADES = [
  { value: "porcentaje", label: "Porcentaje del recaudado" },
  { value: "por_hora", label: "Por hora" },
  { value: "monto_fijo", label: "Monto fijo por alumno" },
];

const CONDICION_VACIA = { id_disciplina: "", modalidad: "porcentaje", valor: "" };

export default function FichaProfesor({ onSubmit, profesorId }) {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(!!profesorId);
  const [formData, setFormData] = useState({
    apellidoNombre: "",
    dni: "",
    direccion: "",
    telefono1: "",
    telefonoEmergencia: "",
    fechaNacimiento: "",
  });

  // ── Disciplinas (para condiciones de contrato y horarios) ────────
  const [disciplinas, setDisciplinas] = useState([]);

  // ── Contrato ──────────────────────────────────────────────────
  const [contratoVigente, setContratoVigente] = useState(null);
  const [mostrarFormContrato, setMostrarFormContrato] = useState(false);
  const [fechaAltaContrato, setFechaAltaContrato] = useState(new Date().toISOString().slice(0, 10));
  const [duracionMeses, setDuracionMeses] = useState("");
  const [observacionesContrato, setObservacionesContrato] = useState("");
  const [condicionesForm, setCondicionesForm] = useState([{ ...CONDICION_VACIA }]);
  const [guardandoContrato, setGuardandoContrato] = useState(false);

  // ── Horarios asignados al profesor ──────────────────────────────
  const [horariosProfesor, setHorariosProfesor] = useState([]);
  const [actividadesDisc, setActividadesDisc] = useState([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [asignacion, setAsignacion] = useState({ id_disciplina: "", id_actividad: "" });
  const [horariosSeleccionados, setHorariosSeleccionados] = useState([]);
  const [horariosAQuitar, setHorariosAQuitar] = useState([]);
  const [asignando, setAsignando] = useState(false);

  useEffect(() => {
    disciplinasApi.getAll().then(setDisciplinas).catch(console.error);
    if (profesorId) {
      cargarProfesor();
      cargarHorariosProfesor();
    }
  }, [profesorId]);

  useEffect(() => {
    if (!asignacion.id_disciplina) { setActividadesDisc([]); return; }
    // El endpoint trae una fila por cada combinación actividad+profesor
    // (lo necesita Disciplinas.jsx); acá solo queremos actividades únicas.
    actividadesApi.getByDisciplina(asignacion.id_disciplina)
      .then((data) => {
        const unicas = Object.values(
          data.reduce((acc, a) => {
            acc[a.id_actividad] ??= a;
            return acc;
          }, {}),
        );
        setActividadesDisc(unicas);
      })
      .catch(console.error);
  }, [asignacion.id_disciplina]);

  useEffect(() => {
    setHorariosSeleccionados([]);
    if (!asignacion.id_actividad) { setHorariosDisponibles([]); return; }
    horariosApi.getByActividad(asignacion.id_actividad)
      .then(data => setHorariosDisponibles(data.filter(h => !h.id_profesor)))
      .catch(console.error);
  }, [asignacion.id_actividad]);

  const cargarProfesor = async () => {
    try {
      const data = await profesoresApi.getById(profesorId);
      setFormData({
        apellidoNombre: data.nomap_p || "",
        dni: data.dni_u || "",
        direccion: data.direccion_p || "",
        telefono1: data.telefono_p || "",
        telefonoEmergencia: data.celular_p || "",
        fechaNacimiento: data.fecha_nac_p ? data.fecha_nac_p.slice(0, 10) : "",
      });
      setContratoVigente(data.contrato_vigente || null);
    } catch (error) {
      console.error("Error cargando profesor:", error);
      Swal.fire("Error", "No se pudo cargar el profesor", "error");
      navigate("/admin/profesores");
    } finally {
      setCargando(false);
    }
  };

  const cargarHorariosProfesor = async () => {
    try {
      const data = await horariosApi.getAll();
      setHorariosProfesor(data.filter(h => Number(h.id_profesor) === Number(profesorId)));
      setHorariosAQuitar([]);
    } catch (error) {
      console.error("Error cargando horarios del profesor:", error);
    }
  };

  // ── Editor de condiciones (reutilizado en alta y renovación) ────
  const handleAgregarCondicion = () => setCondicionesForm(prev => [...prev, { ...CONDICION_VACIA }]);
  const handleQuitarCondicion = (idx) => setCondicionesForm(prev => prev.filter((_, i) => i !== idx));
  const handleCambiarCondicion = (idx, campo, valor) =>
    setCondicionesForm(prev => prev.map((c, i) => i === idx ? { ...c, [campo]: valor } : c));

  const condicionesValidas = () => condicionesForm
    .filter(c => c.id_disciplina && c.modalidad && c.valor !== "")
    .map(c => ({ id_disciplina: Number(c.id_disciplina), modalidad: c.modalidad, valor: Number(c.valor) }));

  const resetFormContrato = () => {
    setFechaAltaContrato(new Date().toISOString().slice(0, 10));
    setDuracionMeses("");
    setObservacionesContrato("");
    setCondicionesForm([{ ...CONDICION_VACIA }]);
  };

  const handleGuardarContrato = async () => {
    const condiciones = condicionesValidas();
    if (condiciones.length === 0) {
      Swal.fire("Error", "Agregá al menos una condición (disciplina, modalidad y valor)", "error");
      return;
    }
    setGuardandoContrato(true);
    try {
      await profesoresApi.crearContrato(profesorId, {
        fecha_alta: fechaAltaContrato,
        duracion_meses: duracionMeses ? Number(duracionMeses) : null,
        observaciones: observacionesContrato || null,
        condiciones,
      });
      Swal.fire("¡Listo!", "Contrato registrado correctamente", "success");
      setMostrarFormContrato(false);
      resetFormContrato();
      cargarProfesor();
    } catch (error) {
      Swal.fire("Error", error.message || "No se pudo registrar el contrato", "error");
    } finally {
      setGuardandoContrato(false);
    }
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
      await contratosApi.rescindir(contratoVigente.id_contrato, { motivo });
      Swal.fire("Listo", "Contrato rescindido. El profesor quedó inactivo.", "success");
      cargarProfesor();
    } catch (error) {
      const horarios = error.data?.horarios;
      if (horarios?.length) {
        const lista = horarios
          .map(h => `• ${h.nombre_d} / ${h.nombre_a} — ${h.dia_h} ${h.hora_h?.slice(0, 5)}`)
          .join("<br>");
        Swal.fire({
          title: "No se puede dar de baja",
          html: `Todavía tiene horarios asignados en la grilla:<br><br>${lista}<br><br>Quitalos desde "Horarios asignados" más abajo y volvé a intentar.`,
          icon: "warning",
        });
      } else {
        Swal.fire("Error", error.message || "No se pudo rescindir el contrato", "error");
      }
    }
  };

  const toggleHorarioSeleccionado = (id) =>
    setHorariosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const toggleHorarioAQuitar = (id) =>
    setHorariosAQuitar((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const asignarHorariosAlProfesor = (ids) =>
    Promise.all(
      ids.map((id) => {
        const h = horariosDisponibles.find((x) => x.id_horario === id);
        return horariosApi.update(h.id_horario, {
          dia: h.dia_h,
          hora: h.hora_h?.slice(0, 5),
          cupo_maximo: Number(h.cupo_maximo),
          cupo_actual: Number(h.cupo_actual),
          id_profesor: Number(profesorId),
        });
      }),
    );

  const handleAsignarHorarios = async () => {
    if (horariosSeleccionados.length === 0) return;
    setAsignando(true);
    try {
      await asignarHorariosAlProfesor(horariosSeleccionados);
      Swal.fire("¡Listo!", `${horariosSeleccionados.length} horario(s) asignado(s) al profesor`, "success");
      setAsignacion({ id_disciplina: "", id_actividad: "" });
      setHorariosSeleccionados([]);
      cargarHorariosProfesor();
    } catch (error) {
      Swal.fire("Error", error.message || "No se pudieron asignar los horarios", "error");
    } finally {
      setAsignando(false);
    }
  };

  const quitarHorariosDelProfesor = (horarios) =>
    Promise.all(
      horarios.map((h) =>
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
        cargarHorariosProfesor();
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
        const seleccionados = horariosProfesor.filter((h) => horariosAQuitar.includes(h.id_horario));
        await quitarHorariosDelProfesor(seleccionados);
        cargarHorariosProfesor();
      } catch (error) {
        Swal.fire("Error", error.message || "No se pudieron quitar los horarios", "error");
      }
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (profesorId) {
        await profesoresApi.update(profesorId, {
          nombre_apellido: formData.apellidoNombre,
          direccion: formData.direccion || null,
          telefono: formData.telefono1 || null,
          celular: formData.telefonoEmergencia || null,
          fecha_nac: formData.fechaNacimiento || null,
        });
        Swal.fire("Éxito", "Profesor actualizado correctamente", "success");
        navigate("/admin/profesores");
      } else {
        const condiciones = condicionesValidas();
        if (condiciones.length === 0) {
          Swal.fire("Error", "Agregá al menos una condición de contrato (disciplina, modalidad y valor)", "error");
          return;
        }
        await profesoresApi.create({
          dni: parseInt(formData.dni, 10),
          nombre_apellido: formData.apellidoNombre,
          direccion: formData.direccion || undefined,
          telefono: formData.telefono1 || undefined,
          celular: formData.telefonoEmergencia || undefined,
          fecha_nac: formData.fechaNacimiento || undefined,
          fecha_alta: fechaAltaContrato,
          duracion_meses: duracionMeses ? Number(duracionMeses) : undefined,
          observaciones: observacionesContrato || undefined,
          condiciones,
        });
        Swal.fire("Éxito", "Profesor creado correctamente", "success");
        navigate("/admin/profesores");
      }
    } catch (error) {
      console.error("Error guardando profesor:", error);
      Swal.fire("Error", error.message || "No se pudo guardar el profesor", "error");
    }
  };

  if (cargando) {
    return <div className="text-center py-5">Cargando...</div>;
  }

  const editorCondiciones = (
    <>
      {condicionesForm.map((c, idx) => (
        <div className="row g-2 align-items-end mb-2" key={idx}>
          <div className="col-md-5">
            <label className="form-label small">Disciplina</label>
            <select className="form-select" value={c.id_disciplina}
              onChange={(e) => handleCambiarCondicion(idx, "id_disciplina", e.target.value)}>
              <option value="">Seleccionar</option>
              {disciplinas.filter(d => d.activo_d).map(d => (
                <option key={d.id_disciplina} value={d.id_disciplina}>{d.nombre_d}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label small">Modalidad</label>
            <select className="form-select" value={c.modalidad}
              onChange={(e) => handleCambiarCondicion(idx, "modalidad", e.target.value)}>
              {MODALIDADES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small">Valor</label>
            <input type="number" className="form-control" value={c.valor}
              onChange={(e) => handleCambiarCondicion(idx, "valor", e.target.value)} />
          </div>
          <div className="col-md-1">
            {condicionesForm.length > 1 && (
              <button type="button" className="btn btn-sm btn-outline-danger w-100"
                onClick={() => handleQuitarCondicion(idx)}>
                <i className="ri-close-line"></i>
              </button>
            )}
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-sm btn-outline-secondary mb-3" onClick={handleAgregarCondicion}>
        <i className="ri-add-line"></i> Agregar disciplina
      </button>
    </>
  );

  return (
    <form className="card p-4 shadow-sm" onSubmit={handleSubmit}>
      <h4 className="fw-bold mb-4 text-center">{profesorId ? "Editar" : "Nuevo"} Profesor</h4>

      {/* DATOS PERSONALES */}
      <h6 className="fw-bold mb-3">Datos personales</h6>
      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label">Apellido y Nombre</label>
          <input
            type="text"
            className="form-control"
            name="apellidoNombre"
            value={formData.apellidoNombre}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">DNI</label>
          <input
            type="number"
            className="form-control"
            name="dni"
            value={formData.dni}
            onChange={handleChange}
            disabled={!!profesorId}
            required
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">Dirección</label>
        <input
          type="text"
          className="form-control"
          name="direccion"
          value={formData.direccion}
          onChange={handleChange}
        />
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label">Teléfono</label>
          <input
            type="tel"
            className="form-control"
            name="telefono1"
            value={formData.telefono1}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Teléfono de emergencia</label>
          <input
            type="tel"
            className="form-control"
            name="telefonoEmergencia"
            value={formData.telefonoEmergencia}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <label className="form-label">Fecha de nacimiento</label>
          <input
            type="date"
            className="form-control"
            name="fechaNacimiento"
            value={formData.fechaNacimiento}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* CONTRATO */}
      <h6 className="fw-bold mb-3">Contrato</h6>

      {!profesorId && (
        <>
          <div className="row mb-2">
            <div className="col-md-4">
              <label className="form-label small">Fecha de alta</label>
              <input type="date" className="form-control" value={fechaAltaContrato}
                onChange={(e) => setFechaAltaContrato(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label small">Duración (meses)</label>
              <input type="number" className="form-control" placeholder="Vacío = sin plazo"
                value={duracionMeses} onChange={(e) => setDuracionMeses(e.target.value)} />
            </div>
          </div>
          <div className="mb-2">
            <label className="form-label small">Observaciones</label>
            <input type="text" className="form-control" value={observacionesContrato}
              onChange={(e) => setObservacionesContrato(e.target.value)} />
          </div>
          <label className="form-label fw-semibold">Condiciones</label>
          {editorCondiciones}
        </>
      )}

      {profesorId && (
        contratoVigente?.id_contrato ? (
          <div className="mb-4">
            <div className="p-3 bg-light rounded mb-2">
              <div className="row">
                <div className="col-md-4">
                  <small className="text-muted d-block">Vigente desde</small>
                  {new Date(contratoVigente.fecha_alta).toLocaleDateString("es-AR")}
                </div>
                <div className="col-md-4">
                  <small className="text-muted d-block">Vencimiento</small>
                  {contratoVigente.fecha_vencimiento
                    ? new Date(contratoVigente.fecha_vencimiento).toLocaleDateString("es-AR")
                    : "Sin plazo"}
                  {contratoVigente.dias_para_vencer != null && contratoVigente.dias_para_vencer <= 30 && (
                    <span className="badge bg-warning text-dark ms-2">
                      Vence en {contratoVigente.dias_para_vencer} días
                    </span>
                  )}
                </div>
              </div>
              <hr className="my-2" />
              <small className="text-muted d-block mb-1">Condiciones</small>
              <ul className="mb-0 ps-3">
                {(contratoVigente.condiciones || []).map((c) => (
                  <li key={c.id_disciplina}>
                    {c.disciplina} — {c.modalidad === "porcentaje" ? `${c.valor}%`
                      : c.modalidad === "por_hora" ? `$${c.valor}/hora`
                      : `$${c.valor} por alumno`}
                  </li>
                ))}
              </ul>
            </div>
            <div className="d-flex gap-2 mb-3">
              <button type="button" className="btn btn-sm btn-outline-secondary"
                onClick={() => { setMostrarFormContrato(v => !v); resetFormContrato(); }}>
                <i className="ri-refresh-line"></i> Renovar contrato
              </button>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleRescindirContrato}>
                <i className="ri-close-circle-line"></i> Rescindir contrato
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-muted">Este profesor no tiene un contrato vigente.</p>
            <button type="button" className="btn btn-sm btn-admin"
              onClick={() => { setMostrarFormContrato(v => !v); resetFormContrato(); }}>
              <i className="ri-add-line"></i> Dar de alta un contrato
            </button>
          </div>
        )
      )}

      {profesorId && mostrarFormContrato && (
        <div className="border rounded p-3 mb-4">
          <div className="row mb-2">
            <div className="col-md-4">
              <label className="form-label small">Fecha de alta</label>
              <input type="date" className="form-control" value={fechaAltaContrato}
                onChange={(e) => setFechaAltaContrato(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label small">Duración (meses)</label>
              <input type="number" className="form-control" placeholder="Vacío = sin plazo"
                value={duracionMeses} onChange={(e) => setDuracionMeses(e.target.value)} />
            </div>
          </div>
          <div className="mb-2">
            <label className="form-label small">Observaciones</label>
            <input type="text" className="form-control" value={observacionesContrato}
              onChange={(e) => setObservacionesContrato(e.target.value)} />
          </div>
          <label className="form-label fw-semibold">Condiciones</label>
          {editorCondiciones}
          <button type="button" className="btn btn-success" disabled={guardandoContrato}
            onClick={handleGuardarContrato}>
            <i className="ri-check-line"></i> Confirmar contrato
          </button>
        </div>
      )}

      {/* HORARIOS ASIGNADOS */}
      {profesorId && (
        <>
          <h6 className="fw-bold mb-3">Horarios asignados</h6>

          {horariosProfesor.length > 0 ? (
            <>
              {horariosAQuitar.length > 0 && (
                <div className="mb-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={handleQuitarHorariosSeleccionados}
                  >
                    <i className="ri-close-line"></i> Quitar seleccionados ({horariosAQuitar.length})
                  </button>
                </div>
              )}
              <div className="table-responsive mb-3">
                <table className="table table-sm table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 32 }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={horariosAQuitar.length === horariosProfesor.length}
                          onChange={(e) =>
                            setHorariosAQuitar(e.target.checked ? horariosProfesor.map((h) => h.id_horario) : [])
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
                    {horariosProfesor.map((h) => (
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
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleQuitarHorario(h)}
                          >
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
            <p className="text-muted mb-3">Este profesor no tiene horarios asignados todavía.</p>
          )}

          <p className="fw-semibold mb-2">Asignar a nuevos horarios</p>
          <div className="row g-2 mb-2">
            <div className="col-md-4">
              <label className="form-label">Disciplina</label>
              <select
                className="form-select"
                value={asignacion.id_disciplina}
                onChange={(e) => setAsignacion({ id_disciplina: e.target.value, id_actividad: "" })}
              >
                <option value="">Seleccionar</option>
                {disciplinas.filter((d) => d.activo_d).map((d) => (
                  <option key={d.id_disciplina} value={d.id_disciplina}>{d.nombre_d}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Actividad</label>
              <select
                className="form-select"
                value={asignacion.id_actividad}
                disabled={!asignacion.id_disciplina}
                onChange={(e) => setAsignacion((prev) => ({ ...prev, id_actividad: e.target.value }))}
              >
                <option value="">Seleccionar</option>
                {actividadesDisc.filter((a) => a.activo_a).map((a) => (
                  <option key={a.id_actividad} value={a.id_actividad}>{a.nombre_a}</option>
                ))}
              </select>
            </div>
          </div>

          {asignacion.id_actividad && (
            <div className="border rounded p-2 mb-2" style={{ maxHeight: 220, overflowY: "auto" }}>
              {horariosDisponibles.length === 0 ? (
                <p className="text-muted small mb-0">No hay horarios libres para esta actividad.</p>
              ) : (
                <>
                  <div className="form-check mb-1 border-bottom pb-1">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="chk-todos-horarios"
                      checked={horariosSeleccionados.length === horariosDisponibles.length}
                      onChange={(e) =>
                        setHorariosSeleccionados(e.target.checked ? horariosDisponibles.map((h) => h.id_horario) : [])
                      }
                    />
                    <label className="form-check-label small fw-semibold" htmlFor="chk-todos-horarios">
                      Seleccionar todos
                    </label>
                  </div>
                  {horariosDisponibles.map((h) => (
                    <div className="form-check" key={h.id_horario}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`chk-horario-${h.id_horario}`}
                        checked={horariosSeleccionados.includes(h.id_horario)}
                        onChange={() => toggleHorarioSeleccionado(h.id_horario)}
                      />
                      <label className="form-check-label small" htmlFor={`chk-horario-${h.id_horario}`}>
                        {h.dia_h} {h.hora_h?.slice(0, 5)}{" "}
                        <span className="text-muted">(cupo {h.cupo_maximo})</span>
                      </label>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          <button
            type="button"
            className="btn btn-admin mb-4"
            disabled={horariosSeleccionados.length === 0 || asignando}
            onClick={handleAsignarHorarios}
          >
            <i className="ri-add-line"></i> Asignar seleccionados
            {horariosSeleccionados.length > 0 ? ` (${horariosSeleccionados.length})` : ""}
          </button>
        </>
      )}

      {/* BOTONES */}
      <div className="d-flex justify-content-end gap-2">
        <button type="reset" className="btn btn-outline-secondary">
          Limpiar
        </button>
        <button type="submit" className="btn btn-success">
          Guardar
        </button>
      </div>
    </form>
  )
}
