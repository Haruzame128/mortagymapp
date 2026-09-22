import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { clientesApi, disciplinasApi, accesoApi } from "../../services/api";
import ModalRenovarSuscripcion from "../../components/admin/ModalRenovarSuscripcion";
import descargarFichaCliente from "../../utils/descargarFichaCliente";
import { abrirDialogoAptoMedico, badgeAptoMedico } from "../../utils/aptoMedico";
import { useHuellaEnrollment } from "../../hooks/useHuellaEnrollment";
import HuellaModal from "../../components/HuellaModal";
import "../../styles/Admin.css";

export default function AlumnoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const base = location.pathname.startsWith("/recepcion") ? "/recepcion/usuarios" : "/admin/alumnos";

  const [alumno, setAlumno] = useState(null);
  const [disciplinas, setDisciplinas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [inscripcionSeleccionada, setInscripcionSeleccionada] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [ingresos, setIngresos] = useState([]);
  const [huellas, setHuellas] = useState([]);
  const [modalHuella, setModalHuella] = useState(false);
  const enroll = useHuellaEnrollment();

  const cargarAlumno = async () => {
    try {
      setCargando(true);
      const data = await clientesApi.getById(id);
      setAlumno(data);
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo cargar el alumno", "error");
      navigate(base);
    } finally {
      setCargando(false);
    }
  };

  const cargarHuellas = () => clientesApi.getHuellas(id).then(setHuellas).catch(() => {});

  useEffect(() => { cargarAlumno(); }, [id]);
  useEffect(() => { disciplinasApi.getAll().then(setDisciplinas).catch(() => {}); }, []);
  useEffect(() => { accesoApi.getHistorial(id).then(setIngresos).catch(() => {}); }, [id]);
  useEffect(() => { cargarHuellas(); }, [id]);

  // Cuando termina el enrolamiento, agregar la huella (no reemplaza las anteriores)
  useEffect(() => {
    if (enroll.status === "done" && enroll.template) {
      clientesApi.addHuella(id, enroll.template)
        .then(() => {
          Swal.fire("¡Listo!", "Huella registrada correctamente", "success");
          setModalHuella(false);
          cargarHuellas();
        })
        .catch((err) => Swal.fire("Error", err.message, "error"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enroll.status, enroll.template]);

  const handleAgregarHuella = async () => {
    try {
      await fetch("http://localhost:3001/api/status", { signal: AbortSignal.timeout(2000) });
    } catch {
      Swal.fire(
        "Lector no disponible",
        "El servicio de huella dactilar no está activo en esta máquina. Verificá que el agente esté corriendo.",
        "warning"
      );
      return;
    }
    setModalHuella(true);
    enroll.start(String(alumno.dni_u));
  };

  const handleCerrarHuella = () => {
    if (!["done", "duplicado"].includes(enroll.status)) enroll.cancel();
    setModalHuella(false);
  };

  const handleEliminarHuella = (h) => {
    Swal.fire({
      title: "¿Eliminar esta huella?",
      text: h.etiqueta || `Huella #${h.id_huella}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (!result.isConfirmed) return;
      clientesApi.removeHuella(id, h.id_huella)
        .then(cargarHuellas)
        .catch((err) => Swal.fire("Error", err.message, "error"));
    });
  };

  const handleEditarPin = async () => {
    const { value: pin, isDenied } = await Swal.fire({
      title: "PIN de acceso",
      text: "Se ingresa en el teclado del molinete cuando la huella no funciona bien (útil con niños).",
      input: "text",
      inputValue: alumno.pin_acceso_c || "",
      inputAttributes: { maxlength: 6, inputmode: "numeric" },
      showCancelButton: true,
      showDenyButton: !!alumno.pin_acceso_c,
      denyButtonText: "Quitar PIN",
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value) return "El PIN es obligatorio";
        if (!/^\d{4,6}$/.test(value)) return "El PIN debe tener entre 4 y 6 dígitos numéricos";
      },
    });
    if (pin === undefined && !isDenied) return;

    try {
      await clientesApi.setPin(id, isDenied ? null : pin);
      Swal.fire("¡Listo!", isDenied ? "PIN quitado" : "PIN guardado correctamente", "success");
      cargarAlumno();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const abrirRenovar = (insc) => {
    setInscripcionSeleccionada(insc);
    setModalOpen(true);
  };

  const handleRenovar = async (data) => {
    try {
      const resultado = await clientesApi.renovarInscripcion(
        id,
        inscripcionSeleccionada.id_inscripto,
        data
      );
      setModalOpen(false);
      setInscripcionSeleccionada(null);
      const montoTexto = resultado.monto
        ? ` — $${Number(resultado.monto).toLocaleString("es-AR")}`
        : "";
      Swal.fire("¡Renovado!", `Suscripción renovada correctamente${montoTexto}`, "success");
      cargarAlumno();
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo renovar la suscripción", "error");
    }
  };

  const handleDescargarFicha = async () => {
    try {
      setDescargando(true);
      await descargarFichaCliente(alumno);
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo generar la ficha", "error");
    } finally {
      setDescargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-secondary" role="status" />
      </div>
    );
  }

  if (!alumno) return null;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn btn-outline-secondary btn-sm mb-2" onClick={() => navigate(base)}>
            <i className="ri-arrow-left-line"></i> Volver
          </button>
          <h3 className="mb-0">
            {alumno.nomap_c}{" "}
            <span className={`badge ${alumno.activo_c ? "bg-success" : "bg-secondary"}`}>
              {alumno.activo_c ? "Activo" : "Inactivo"}
            </span>
          </h3>
          <small className="text-muted d-block">DNI: {alumno.dni_u}</small>
          {!alumno.activo_c && alumno.fecha_baja && (
            <small className="text-muted d-block">
              Baja {alumno.tipo_baja === "automatica" ? "automática" : "manual"} el{" "}
              {new Date(alumno.fecha_baja).toLocaleDateString("es-AR")}
              {alumno.motivo_baja ? ` — ${alumno.motivo_baja}` : ""}
            </small>
          )}
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={handleDescargarFicha}
            disabled={descargando}
          >
            <i className="ri-file-download-line"></i> {descargando ? "Generando..." : "Descargar ficha"}
          </button>
          <button
            className="btn btn-admin"
            onClick={() => navigate(`${base}/nuevo?id=${alumno.id_cliente}`)}
          >
            <i className="ri-pencil-fill"></i> Editar datos
          </button>
        </div>
      </div>

      {/* DATOS PERSONALES */}
      <div className="card admin-card mb-4">
        <div className="card-body">
          <h6 className="fw-bold mb-3">Datos personales</h6>
          <div className="row">
            <div className="col-md-4 mb-2">
              <small className="text-muted d-block">Dirección</small>
              {alumno.direccion_c || "—"}
            </div>
            <div className="col-md-4 mb-2">
              <small className="text-muted d-block">Teléfono</small>
              {alumno.telefono_c || "—"}
            </div>
            <div className="col-md-4 mb-2">
              <small className="text-muted d-block">Teléfono de emergencia</small>
              {alumno.tel_emergencia_c || "—"}
            </div>
            <div className="col-md-4 mb-2">
              <small className="text-muted d-block">Fecha de nacimiento</small>
              {alumno.fecha_nac_c ? new Date(alumno.fecha_nac_c).toLocaleDateString("es-AR") : "—"}
            </div>
            <div className="col-md-4 mb-2">
              <small className="text-muted d-block">Ficha médica (inscripción)</small>
              {alumno.ficha_medica ? "Cargada" : "Pendiente"}
            </div>
          </div>
        </div>
      </div>

      {/* APTO MÉDICO — certificado físico entregado por el cliente */}
      <div className="card admin-card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <h6 className="fw-bold mb-0">Apto médico (certificado físico)</h6>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => abrirDialogoAptoMedico(
                { nombre: alumno.nomap_c, fecha_entrega_ficha_medica: alumno.fecha_entrega_ficha_medica },
                (fecha) => clientesApi.setAptoMedico(alumno.id_cliente, fecha),
                cargarAlumno
              )}
            >
              <i className="ri-pencil-fill"></i>{" "}
              {alumno.fecha_entrega_ficha_medica ? "Renovar / quitar" : "Registrar entrega"}
            </button>
          </div>
          <div className="row">
            <div className="col-md-4 mb-2">
              <small className="text-muted d-block">Estado</small>
              <span className={`badge ${badgeAptoMedico(alumno.estado_ficha_medica).clase}`}>
                {badgeAptoMedico(alumno.estado_ficha_medica).texto}
              </span>
            </div>
            <div className="col-md-4 mb-2">
              <small className="text-muted d-block">Entregado el</small>
              {alumno.fecha_entrega_ficha_medica
                ? new Date(alumno.fecha_entrega_ficha_medica).toLocaleDateString("es-AR")
                : "—"}
            </div>
            <div className="col-md-4 mb-2">
              <small className="text-muted d-block">Vence el</small>
              {alumno.venc_ficha_medica
                ? new Date(alumno.venc_ficha_medica).toLocaleDateString("es-AR")
                : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* ACCESOS — huellas (varias, por si una no lee bien) y PIN alternativo */}
      <div className="card admin-card mb-4">
        <div className="card-body">
          <h6 className="fw-bold mb-3">Accesos (molinete)</h6>

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
            <small className="text-muted d-block mb-0">Huellas registradas</small>
            <button className="btn btn-sm btn-outline-secondary" onClick={handleAgregarHuella}>
              <i className="ri-fingerprint-line"></i> Agregar huella
            </button>
          </div>
          {huellas.length > 0 ? (
            <ul className="list-group list-group-flush mb-3">
              {huellas.map((h) => (
                <li key={h.id_huella} className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <span>
                    {h.etiqueta || `Huella #${h.id_huella}`}{" "}
                    <small className="text-muted">
                      registrada el {new Date(h.creado_en).toLocaleDateString("es-AR")}
                    </small>
                  </span>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleEliminarHuella(h)}>
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted small mb-3">Sin huellas registradas todavía.</p>
          )}

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <small className="text-muted d-block">PIN de acceso</small>
              {alumno.pin_acceso_c || <span className="text-muted">No configurado</span>}
            </div>
            <button className="btn btn-sm btn-outline-secondary" onClick={handleEditarPin}>
              <i className="ri-pencil-fill"></i> {alumno.pin_acceso_c ? "Editar PIN" : "Configurar PIN"}
            </button>
          </div>
        </div>
      </div>

      {/* INSCRIPCIONES ACTUALES */}
      <div className="card admin-card mb-4">
        <div className="card-body">
          <h6 className="fw-bold mb-3">Inscripciones actuales</h6>
          {alumno.inscripciones?.length > 0 ? (
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
                  {alumno.inscripciones.map((i) => (
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
                        <button className="btn btn-sm btn-admin" onClick={() => abrirRenovar(i)}>
                          <i className="ri-refresh-line"></i> Renovar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted mb-0">Este alumno no tiene inscripciones.</p>
          )}
        </div>
      </div>

      {/* HISTORIAL DE PAGOS */}
      <div className="card admin-card">
        <div className="card-body">
          <h6 className="fw-bold mb-3">Historial de pagos</h6>
          {alumno.historial?.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Fecha período</th>
                    <th>Disciplina</th>
                    <th>Actividad</th>
                    <th>Días/sem</th>
                    <th>Medio de pago</th>
                    <th className="text-end">Monto</th>
                    <th className="text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {alumno.historial.map((h) => (
                    <tr key={h.id_suscripcion}>
                      <td>{new Date(h.fecha_s).toLocaleDateString("es-AR")}</td>
                      <td>{h.nombre_d}</td>
                      <td>{h.nombre_a}</td>
                      <td>{h.cantidad_dias ?? "—"}</td>
                      <td className="text-capitalize">{h.tipo_pago_s || "—"}</td>
                      <td className="text-end">
                        {h.monto_m != null
                          ? `$${Number(h.monto_m).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                      <td className="text-center">
                        <span className={`badge ${h.monto_m != null ? "bg-success" : "bg-danger"}`}>
                          {h.monto_m != null ? "Pagado" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted mb-0">Sin historial de pagos todavía.</p>
          )}
        </div>
      </div>

      {/* HISTORIAL DE INGRESOS (molinete) */}
      <div className="card admin-card mt-4">
        <div className="card-body">
          <h6 className="fw-bold mb-3">Historial de ingresos (molinete)</h6>
          {ingresos.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Fecha y hora</th>
                    <th className="text-center">Resultado</th>
                    <th>Método</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {ingresos.map((i) => (
                    <tr key={i.id_asistencia}>
                      <td>{new Date(i.fecha_hora).toLocaleString("es-AR")}</td>
                      <td className="text-center">
                        <span className={`badge ${i.permitido ? "bg-success" : "bg-danger"}`}>
                          {i.permitido ? "Ingresó" : "Denegado"}
                        </span>
                      </td>
                      <td className="small text-capitalize">{i.metodo}</td>
                      <td className="small">{i.mensaje}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted mb-0">Sin ingresos registrados todavía.</p>
          )}
        </div>
      </div>

      <ModalRenovarSuscripcion
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setInscripcionSeleccionada(null); }}
        inscripcion={inscripcionSeleccionada}
        disciplinas={disciplinas}
        onSubmit={handleRenovar}
      />

      <HuellaModal
        isOpen={modalHuella}
        status={enroll.status}
        step={enroll.step}
        error={enroll.error}
        onClose={handleCerrarHuella}
        onRetry={() => enroll.start(String(alumno.dni_u))}
      />
    </>
  );
}
