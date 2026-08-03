import { useState, useEffect } from "react";
import Modal from "react-modal";
import Swal from "sweetalert2";
import { disciplinasApi, horariosApi, actividadesApi, profesoresApi } from "../../services/api";
import "../../styles/Admin.css";

Modal.setAppElement("#root");

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const FORM_VACIO = {
  nombre: "",
  descripcion: "",
  imagen: "",
  precios: { precio_1: "", precio_2: "", precio_3: "", precio_4: "", precio_5: "", precio_6: "", precio_dia: "" },
};

const FORM_ACTIVIDAD_VACIO = {
  nombre: "",
  descripcion: "",
  max_inasistencia: 3,
};

const FORM_HORARIO_VACIO = { dia: "", hora: "", cupo_maximo: 20, id_profesor: "" };

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

export default function Disciplinas() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);

  // Modal disciplina
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modoNuevo, setModoNuevo] = useState(false);
  const [disciplinaSeleccionada, setDisciplinaSeleccionada] = useState(null);
  const [formDisciplina, setFormDisciplina] = useState(FORM_VACIO);
  const [imagenFile, setImagenFile] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Modal precios
  const [modalPrecios, setModalPrecios] = useState(false);
  const [editandoPrecios, setEditandoPrecios] = useState(false);
  const [precios, setPrecios] = useState(null);

  // Modal horarios
  const [modalHorarios, setModalHorarios] = useState(false);
  const [editandoHorarios, setEditandoHorarios] = useState(false);
  const [horarios, setHorarios] = useState([]);
  const [horariosEditados, setHorariosEditados] = useState([]);
  const [paginaHorarios, setPaginaHorarios] = useState(1);
  const [actividadHorario, setActividadHorario] = useState(null);
  const [formNuevoHorario, setFormNuevoHorario] = useState(FORM_HORARIO_VACIO);
  const [guardandoHorario, setGuardandoHorario] = useState(false);
  const [vistaHorarios, setVistaHorarios] = useState('lista');
  const [profesores, setProfesores] = useState([]);

  // Modal imágenes carrusel
  const [modalImagenes, setModalImagenes] = useState(false);
  const [imagenes, setImagenes] = useState([]);
  const [nuevaImagenFile, setNuevaImagenFile] = useState(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  // Actividades
  const [paginaActividades, setPaginaActividades] = useState(1);
  const [actividades, setActividades] = useState([]);
  const [loadingActividades, setLoadingActividades] = useState(false);
  const [modalActividad, setModalActividad] = useState(false);
  const [modoNuevoActividad, setModoNuevoActividad] = useState(false);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [formActividad, setFormActividad] = useState(FORM_ACTIVIDAD_VACIO);
  const [guardandoActividad, setGuardandoActividad] = useState(false);
  const [actividadOriginal, setActividadOriginal] = useState(null);

  // ── Cargar disciplinas ──────────────────────────────────────────
  const cargarDisciplinas = async () => {
    try {
      setLoading(true);
      const data = await disciplinasApi.getAll();
      setDisciplinas(data);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDisciplinas(); }, []);

  // ── Cargar actividades de disciplina seleccionada ───────────────
  const cargarActividades = async (d) => {
    setLoadingActividades(true);
    try {
      const data = await actividadesApi.getByDisciplina(d.id_disciplina);
      setActividades(data);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoadingActividades(false);
    }
  };

  const seleccionarDisciplina = (d) => {
    setDisciplinaSeleccionada(d);
    setPaginaActividades(1);
    cargarActividades(d);
  };

  // ── Paginación ──────────────────────────────────────────────────
  const filasPorPagina = 5;
  const inicio = (paginaActual - 1) * filasPorPagina;
  const disciplinasPagina = disciplinas.slice(inicio, inicio + filasPorPagina);
  const totalPaginas = Math.ceil(disciplinas.length / filasPorPagina);

  // ── Abrir modal nueva disciplina ────────────────────────────────
  const abrirNueva = () => {
    setModoNuevo(true);
    setDisciplinaSeleccionada(null);
    setFormDisciplina(FORM_VACIO);
    setImagenFile(null);
    setIsModalOpen(true);
  };

  // ── Abrir modal editar disciplina ───────────────────────────────
  const abrirEditar = (d) => {
    setModoNuevo(false);
    setDisciplinaSeleccionada(d);
    setFormDisciplina({
      nombre: d.nombre_d,
      descripcion: d.descripcion_d,
      imagen: d.imagen_d || "",
      precios: {
        precio_1: d.precio_1 || "",
        precio_2: d.precio_2 || "",
        precio_3: d.precio_3 || "",
        precio_4: d.precio_4 || "",
        precio_5: d.precio_5 || "",
        precio_6: d.precio_6 || "",
        precio_dia: d.precio_dia || "",
      }
    });
    setImagenFile(null);
    setIsModalOpen(true);
  };

  // ── Guardar disciplina ──────────────────────────────────────────
  const handleGuardar = async () => {
    if (!formDisciplina.nombre.trim()) {
      Swal.fire("Error", "El nombre es obligatorio", "warning");
      return;
    }
    setGuardando(true);
    try {
      const fd = new FormData();
      fd.append("nombre", formDisciplina.nombre);
      fd.append("descripcion", formDisciplina.descripcion);
      fd.append("precios", JSON.stringify(formDisciplina.precios));
      if (imagenFile) fd.append("imagen", imagenFile);

      if (modoNuevo) {
        await disciplinasApi.create(fd);
        Swal.fire("¡Listo!", "Disciplina creada correctamente", "success");
      } else {
        await disciplinasApi.update(disciplinaSeleccionada.id_disciplina, fd);
        Swal.fire("¡Listo!", "Disciplina actualizada correctamente", "success");
      }
      setIsModalOpen(false);
      setImagenFile(null);
      cargarDisciplinas();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setGuardando(false);
    }
  };

  // ── Toggle activo disciplina ────────────────────────────────────
  const handleToggleActivo = (d) => {
    const accion = d.activo_d ? "deshabilitar" : "habilitar";
    const nuevoEstado = !d.activo_d;
    Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} disciplina?`,
      text: d.activo_d ? "La disciplina dejará de estar disponible" : "La disciplina volverá a estar disponible",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: d.activo_d ? "#dc3545" : "#198754",
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await disciplinasApi.toggleActivo(d.id_disciplina, nuevoEstado);
          Swal.fire(nuevoEstado ? "Habilitada" : "Deshabilitada", `La disciplina fue ${nuevoEstado ? "habilitada" : "deshabilitada"}`, "success");
          cargarDisciplinas();
        } catch (err) {
          Swal.fire("Error", err.message, "error");
        }
      }
    });
  };

  // ── Abrir modal precios ─────────────────────────────────────────
  const abrirPrecios = (d) => {
    setDisciplinaSeleccionada(d);
    setPrecios({
      precio_1: d.precio_1 || 0,
      precio_2: d.precio_2 || 0,
      precio_3: d.precio_3 || 0,
      precio_4: d.precio_4 || 0,
      precio_5: d.precio_5 || 0,
      precio_6: d.precio_6 || 0,
      precio_dia: d.precio_dia || 0,
      precio_1_debito: d.precio_1_debito || 0,
      precio_2_debito: d.precio_2_debito || 0,
      precio_3_debito: d.precio_3_debito || 0,
      precio_4_debito: d.precio_4_debito || 0,
      precio_5_debito: d.precio_5_debito || 0,
      precio_6_debito: d.precio_6_debito || 0,
      precio_dia_debito: d.precio_dia_debito || 0,
    });
    setEditandoPrecios(false);
    setModalPrecios(true);
  };

  // ── Guardar precios ─────────────────────────────────────────────
  const handleGuardarPrecios = async () => {
    try {
      await disciplinasApi.updatePrecios(disciplinaSeleccionada.id_disciplina, precios);
      Swal.fire("¡Listo!", "Precios actualizados", "success");
      setEditandoPrecios(false);
      setModalPrecios(false);
      cargarDisciplinas();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // ── Helper: filtrar y setear horarios de una actividad ──────────
  const recargarHorariosActividad = async (a) => {
    const todos = await horariosApi.getAll();
    const filtrados = todos.filter(h =>
      Number(h.id_actividad) === Number(a.id_actividad) &&
      (a.id_profesor ? Number(h.id_profesor) === Number(a.id_profesor) : !h.id_profesor)
    );
    setHorarios(filtrados);
    setHorariosEditados(filtrados);
  };

  // ── Abrir modal horarios ────────────────────────────────────────
  const abrirHorarios = async (a) => {
    setEditandoHorarios(false);
    setPaginaHorarios(1);
    setFormNuevoHorario({ ...FORM_HORARIO_VACIO, id_profesor: a.id_profesor || "" });
    setActividadHorario(a);
    setVistaHorarios('lista');
    setModalHorarios(true);
    try {
      const [, profs] = await Promise.all([
        recargarHorariosActividad(a),
        profesoresApi.getAll(),
      ]);
      setProfesores(profs);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // ── Guardar cambios de horarios (día, hora, cupos) ──────────────
  const handleGuardarHorarios = async () => {
    try {
      await Promise.all(
        horariosEditados.map(h =>
          horariosApi.update(h.id_horario, {
            dia: h.dia_h,
            hora: h.hora_h?.slice(0, 5),
            cupo_maximo: Number(h.cupo_maximo),
            cupo_actual: Number(h.cupo_actual),
            id_profesor: h.id_profesor ? Number(h.id_profesor) : null,
          })
        )
      );
      Swal.fire("¡Listo!", "Horarios actualizados", "success");
      setEditandoHorarios(false);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // ── Eliminar horario ────────────────────────────────────────────
  const handleEliminarHorario = (h) => {
    Swal.fire({
      title: "¿Eliminar horario?",
      text: `${h.dia_h} ${h.hora_h?.slice(0, 5)} — esta acción no se puede deshacer`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await horariosApi.remove(h.id_horario);
          await recargarHorariosActividad(actividadHorario);
        } catch (err) {
          Swal.fire("Error", err.message, "error");
        }
      }
    });
  };

  // ── Agregar nuevo horario ───────────────────────────────────────
  const handleAgregarHorario = async () => {
    if (!formNuevoHorario.dia || !formNuevoHorario.hora) {
      Swal.fire("Error", "Día y hora son obligatorios", "warning");
      return;
    }

    // 🚫 VALIDACIÓN DE DUPLICADO
    const existe = horarios.some(h =>
      h.dia_h === formNuevoHorario.dia &&
      h.hora_h?.slice(0, 5) === formNuevoHorario.hora &&
      Number(h.id_profesor) === Number(actividadHorario.id_profesor)
    );

    if (existe) {
      Swal.fire(
        "Horario duplicado",
        "Ese profesor ya tiene un horario en ese día y hora",
        "warning"
      );
      return;
    }

    setGuardandoHorario(true);
    try {
      await horariosApi.create({
        id_actividad: actividadHorario.id_actividad,
        id_profesor: formNuevoHorario.id_profesor ? Number(formNuevoHorario.id_profesor) : null,
        dia: formNuevoHorario.dia,
        hora: formNuevoHorario.hora,
        cupo_maximo: Number(formNuevoHorario.cupo_maximo),
      });

      setFormNuevoHorario(FORM_HORARIO_VACIO);
      setVistaHorarios('lista');
      await recargarHorariosActividad(actividadHorario);

    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setGuardandoHorario(false);
    }
  };

  // ── Abrir modal imágenes ────────────────────────────────────────
  const abrirImagenes = async (d) => {
    setDisciplinaSeleccionada(d);
    setNuevaImagenFile(null);
    setModalImagenes(true);
    try {
      const data = await disciplinasApi.getImagenes(d.id_disciplina);
      setImagenes(data);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // ── Subir imagen al carrusel ────────────────────────────────────
  const handleSubirImagen = async () => {
    if (!nuevaImagenFile) return;
    setSubiendoImagen(true);
    try {
      const fd = new FormData();
      fd.append("imagen", nuevaImagenFile);
      fd.append("orden", imagenes.length);
      await disciplinasApi.addImagen(disciplinaSeleccionada.id_disciplina, fd);
      const data = await disciplinasApi.getImagenes(disciplinaSeleccionada.id_disciplina);
      setImagenes(data);
      setNuevaImagenFile(null);
      document.getElementById("nueva-imagen-carrusel").value = "";
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSubiendoImagen(false);
    }
  };

  // ── Eliminar imagen del carrusel ────────────────────────────────
  const handleEliminarImagen = (img) => {
    Swal.fire({
      title: "¿Eliminar imagen?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await disciplinasApi.deleteImagen(disciplinaSeleccionada.id_disciplina, img.id_imagen);
          setImagenes(prev => prev.filter(i => i.id_imagen !== img.id_imagen));
        } catch (err) {
          Swal.fire("Error", err.message, "error");
        }
      }
    });
  };

  // ── Abrir modal nueva actividad ─────────────────────────────────
  const abrirNuevaActividad = () => {
    setModoNuevoActividad(true);
    setActividadSeleccionada(null);
    setFormActividad(FORM_ACTIVIDAD_VACIO);
    setActividadOriginal(null);   // ← limpiar
    setModalActividad(true);;
  };

  // ── Abrir modal editar actividad ────────────────────────────────
  const abrirEditarActividad = (a) => {
    setModoNuevoActividad(false);
    setActividadSeleccionada(a);
    const form = {
      nombre: a.nombre_a,
      descripcion: a.descripcion_a || "",
      max_inasistencia: a.max_inasistencia,
    };
    setFormActividad(form);
    setActividadOriginal(form);   // ← guardar original
    setModalActividad(true);
  };

  // ── Guardar actividad ───────────────────────────────────────────
  const handleGuardarActividad = async () => {
    const nombre = formActividad.nombre.trim();

    if (!nombre) {
      Swal.fire("Error", "El nombre es obligatorio", "warning");
      return;
    }
    if (nombre.length < 3) {
      Swal.fire("Error", "El nombre debe tener al menos 3 caracteres", "warning");
      return;
    }
    if (isNaN(formActividad.max_inasistencia) || Number(formActividad.max_inasistencia) < 0) {
      Swal.fire("Error", "El máximo de inasistencias debe ser un número válido", "warning");
      return;
    }

    setGuardandoActividad(true);
    try {
      if (modoNuevoActividad) {
        await actividadesApi.create({
          id_disciplina: disciplinaSeleccionada.id_disciplina,
          nombre: nombre,
          descripcion: formActividad.descripcion.trim(),
          max_inasistencia: Number(formActividad.max_inasistencia),
        });
        Swal.fire("¡Listo!", "Actividad creada correctamente", "success");
      } else {
        await actividadesApi.update(actividadSeleccionada.id_actividad, {
          nombre: nombre,
          descripcion: formActividad.descripcion.trim(),
          max_inasistencia: Number(formActividad.max_inasistencia),
        });
        Swal.fire("¡Listo!", "Actividad actualizada correctamente", "success");
      }
      setModalActividad(false);
      setActividadOriginal(null);
      cargarActividades(disciplinaSeleccionada);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setGuardandoActividad(false);
    }
  };

  // ── Toggle activo actividad ─────────────────────────────────────
  const handleToggleActividad = (a) => {
    const accion = a.activo_a ? "deshabilitar" : "habilitar";
    const nuevoEstado = !a.activo_a;
    Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} actividad?`,
      text: a.activo_a ? "La actividad dejará de estar disponible" : "La actividad volverá a estar disponible",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: a.activo_a ? "#dc3545" : "#198754",
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await actividadesApi.toggleActivo(a.id_actividad, nuevoEstado);
          Swal.fire(
            nuevoEstado ? "Habilitada" : "Deshabilitada",
            `La actividad fue ${nuevoEstado ? "habilitada" : "deshabilitada"}`,
            "success"
          );
          cargarActividades(disciplinaSeleccionada);
        } catch (err) {
          Swal.fire("Error", err.message, "error");
        }
      }
    });
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Gestión de Disciplinas</h3>
        <button className="btn btn-admin" onClick={abrirNueva}>
          <i className="ri-add-line"></i> Nueva disciplina
        </button>
      </div>

      {/* TABLA DISCIPLINAS */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status" />
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle table-disciplinas">
            <thead className="table-light">
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Activo</th>
                <th className="text-center">Opciones</th>
              </tr>
            </thead>
            <tbody>
              {disciplinasPagina.map((d) => (
                <tr
                  key={d.id_disciplina}
                  onClick={() => seleccionarDisciplina(d)}
                  style={{ cursor: "pointer" }}
                  className={disciplinaSeleccionada?.id_disciplina === d.id_disciplina ? "table-active" : ""}
                >
                  <td>{d.nombre_d}</td>
                  <td>{d.descripcion_d}</td>
                  <td>
                    <span className={`badge ${d.activo_d ? "bg-success" : "bg-danger"}`}>
                      {d.activo_d ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="text-center" onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-sm btn-outline-secondary me-1" title="Precios" onClick={() => abrirPrecios(d)}>
                      <i className="ri-money-dollar-circle-line"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-secondary me-1" title="Imágenes carrusel" onClick={() => abrirImagenes(d)}>
                      <i className="ri-image-2-line"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-secondary me-1" title="Editar" onClick={() => abrirEditar(d)}>
                      <i className="ri-pencil-fill"></i>
                    </button>
                    <button
                      className={`btn btn-sm ${d.activo_d ? "btn-outline-danger" : "btn-outline-success"}`}
                      title={d.activo_d ? "Deshabilitar" : "Habilitar"}
                      onClick={() => handleToggleActivo(d)}
                    >
                      <i className={d.activo_d ? "ri-close-circle-fill" : "ri-checkbox-circle-fill"}></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINACIÓN */}
      <nav className="d-flex justify-content-center">
        <ul className="pagination">
          {Array.from({ length: totalPaginas }).map((_, i) => (
            <li key={i} className={`nav-item ${paginaActual === i + 1 ? "navlink-active" : ""}`}>
              <button className="nav-link" onClick={() => setPaginaActual(i + 1)}>{i + 1}</button>
            </li>
          ))}
        </ul>
      </nav>

      {/* SECCIÓN ACTIVIDADES */}
      {disciplinaSeleccionada && (
        <>
          <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
            <h4>Actividades de {disciplinaSeleccionada.nombre_d}</h4>
            <button className="btn btn-admin" onClick={abrirNuevaActividad}>
              <i className="ri-add-line"></i> Nueva actividad
            </button>
          </div>

          {loadingActividades ? (
            <div className="text-center py-3">
              <div className="spinner-border text-secondary" role="status" />
            </div>
          ) : (() => {
            const filasAct = 10;
            const inicioAct = (paginaActividades - 1) * filasAct;
            const actividadesPagina = actividades.slice(inicioAct, inicioAct + filasAct);
            const totalPaginasAct = Math.ceil(actividades.length / filasAct);
            return (
              <>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Nombre</th>
                        <th>Profesor</th>
                        <th>Activo</th>
                        <th className="text-center">Opciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actividadesPagina.length === 0 ? (
                        <tr><td colSpan="4" className="text-center text-muted">No hay actividades cargadas</td></tr>
                      ) : (
                        actividadesPagina.map((a) => (
                          <tr key={`${a.id_actividad}-${a.id_profesor || 'sin'}`}>
                            <td>{a.nombre_a}</td>
                            <td>{a.profesor || <span className="text-muted">Sin asignar</span>}</td>
                            <td>
                              <span className={`badge ${a.activo_a ? "bg-success" : "bg-danger"}`}>
                                {a.activo_a ? "Sí" : "No"}
                              </span>
                            </td>
                            <td className="text-center">
                              <button className="btn btn-sm btn-outline-secondary me-1" title="Horarios" onClick={() => abrirHorarios(a)}>
                                <i className="ri-time-line"></i>
                              </button>
                              <button className="btn btn-sm btn-outline-secondary me-1" title="Editar" onClick={() => abrirEditarActividad(a)}>
                                <i className="ri-pencil-fill"></i>
                              </button>
                              <button
                                className={`btn btn-sm ${a.activo_a ? "btn-outline-danger" : "btn-outline-success"}`}
                                title={a.activo_a ? "Deshabilitar" : "Habilitar"}
                                onClick={() => handleToggleActividad(a)}
                              >
                                <i className={a.activo_a ? "ri-close-circle-fill" : "ri-checkbox-circle-fill"}></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {totalPaginasAct > 1 && (
                  <nav className="d-flex justify-content-center">
                    <ul className="pagination">
                      {Array.from({ length: totalPaginasAct }).map((_, i) => (
                        <li key={i} className={`nav-item ${paginaActividades === i + 1 ? "navlink-active" : ""}`}>
                          <button className="nav-link" onClick={() => setPaginaActividades(i + 1)}>{i + 1}</button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}
              </>
            );
          })()}
        </>
      )}

      {/* MODAL DISCIPLINA */}
      <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} contentLabel="Disciplina" className="modal-react" overlayClassName="modal-overlay">
        <div className="modal-header">
          <h5 className="modal-title">{modoNuevo ? "Nueva disciplina" : "Editar disciplina"}</h5>
          <button className="close" onClick={() => setIsModalOpen(false)}><span>&times;</span></button>
        </div>
        <div className="modal-body mt-2">
          <div className="mb-3">
            <label className="form-label">Nombre</label>
            <input className="form-control" value={formDisciplina.nombre}
              onChange={(e) => setFormDisciplina({ ...formDisciplina, nombre: e.target.value })} />
          </div>
          <div className="mb-3">
            <label className="form-label">Descripción</label>
            <textarea className="form-control" rows="2" value={formDisciplina.descripcion}
              onChange={(e) => setFormDisciplina({ ...formDisciplina, descripcion: e.target.value })} />
          </div>
          <div className="mb-3">
            <label className="form-label d-block">Imagen principal</label>
            <label htmlFor="imagen" className="btn btn-admin">Seleccionar imagen</label>
            <input id="imagen" type="file" className="d-none" accept="image/*"
              onChange={(e) => { const f = e.target.files[0]; if (f) setImagenFile(f); }} />
            {imagenFile && <span className="ms-2 text-muted small">{imagenFile.name}</span>}
            {!imagenFile && formDisciplina.imagen && (
              <span className="ms-2 text-muted small">Imagen actual: {formDisciplina.imagen}</span>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary me-2" onClick={() => setIsModalOpen(false)}>Cancelar</button>
          <button className="btn btn-admin" onClick={handleGuardar} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </Modal>

      {/* MODAL ACTIVIDAD */}
      <Modal isOpen={modalActividad} onRequestClose={() => setModalActividad(false)} className="modal-react" overlayClassName="modal-overlay">
        <div className="modal-header">
          <h5 className="modal-title">{modoNuevoActividad ? "Nueva actividad" : "Editar actividad"}</h5>
          <button className="close" onClick={() => setModalActividad(false)}><span>&times;</span></button>
        </div>
        <div className="modal-body mt-2">
          <div className="mb-3">
            <label className="form-label">Nombre <span className="text-danger">*</span></label>
            <input
              className={`form-control ${formActividad.nombre.trim().length > 0 && formActividad.nombre.trim().length < 3 ? "is-invalid" : ""}`}
              value={formActividad.nombre}
              maxLength={100}
              onChange={(e) => setFormActividad({ ...formActividad, nombre: e.target.value })}
            />
            {formActividad.nombre.trim().length > 0 && formActividad.nombre.trim().length < 3 && (
              <div className="invalid-feedback">Mínimo 3 caracteres</div>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-control"
              rows="2"
              maxLength={300}
              value={formActividad.descripcion}
              onChange={(e) => setFormActividad({ ...formActividad, descripcion: e.target.value })}
            />
            <div className="form-text text-end">{formActividad.descripcion.length}/300</div>
          </div>
          <div className="mb-3">
            <label className="form-label">Máximo de inasistencias <span className="text-danger">*</span></label>
            <input
              type="number"
              className="form-control"
              min="0"
              max="99"
              value={formActividad.max_inasistencia}
              onChange={(e) => setFormActividad({ ...formActividad, max_inasistencia: parseInt(e.target.value) || 0 })}
            />
            <div className="form-text">Cantidad de faltas permitidas antes de dar de baja al alumno</div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary me-2" onClick={() => setModalActividad(false)}>Cancelar</button>
          <button
            className="btn btn-admin"
            onClick={handleGuardarActividad}
            disabled={
              guardandoActividad ||
              formActividad.nombre.trim().length < 3 ||
              (!modoNuevoActividad && actividadOriginal && (
                formActividad.nombre.trim() === actividadOriginal.nombre.trim() &&
                formActividad.descripcion.trim() === actividadOriginal.descripcion.trim() &&
                Number(formActividad.max_inasistencia) === Number(actividadOriginal.max_inasistencia)
              ))
            }
          >
            {guardandoActividad ? "Guardando..." : modoNuevoActividad ? "Crear actividad" : "Guardar cambios"}
          </button>
        </div>
      </Modal>

      {/* MODAL IMÁGENES CARRUSEL */}
      <Modal isOpen={modalImagenes} onRequestClose={() => setModalImagenes(false)} className="modal-react" overlayClassName="modal-overlay">
        <div className="modal-header">
          <h5 className="modal-title">Imágenes carrusel – {disciplinaSeleccionada?.nombre_d}</h5>
          <button className="close" onClick={() => setModalImagenes(false)}><span>&times;</span></button>
        </div>
        <div className="modal-body mt-2">
          {imagenes.length === 0 ? (
            <p className="text-muted text-center mb-3">No hay imágenes cargadas</p>
          ) : (
            <div className="d-flex flex-wrap gap-2 mb-3">
              {imagenes.map((img) => (
                <div key={img.id_imagen} className="position-relative" style={{ width: 100, height: 100 }}>
                  <img src={`${BASE_URL}${img.imagen}`} alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
                  <button className="btn btn-danger btn-sm position-absolute top-0 end-0"
                    style={{ padding: "1px 5px", fontSize: 12 }}
                    onClick={() => handleEliminarImagen(img)}>
                    <i className="ri-close-line"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
          <hr />
          <label className="form-label fw-semibold">Agregar imagen</label>
          <div className="d-flex align-items-center gap-2">
            <label htmlFor="nueva-imagen-carrusel" className="btn btn-admin mb-0">Seleccionar imagen</label>
            <input id="nueva-imagen-carrusel" type="file" className="d-none" accept="image/*"
              onChange={(e) => { const f = e.target.files[0]; if (f) setNuevaImagenFile(f); }} />
            {nuevaImagenFile && <span className="text-muted small">{nuevaImagenFile.name}</span>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary me-2" onClick={() => setModalImagenes(false)}>Cerrar</button>
          <button className="btn btn-admin" onClick={handleSubirImagen} disabled={!nuevaImagenFile || subiendoImagen}>
            {subiendoImagen ? "Subiendo..." : "Subir imagen"}
          </button>
        </div>
      </Modal>

      {/* MODAL PRECIOS */}
      {/* <Modal isOpen={modalPrecios} onRequestClose={() => setModalPrecios(false)} className="modal-react" overlayClassName="modal-overlay">
        <div className="modal-header">
          <h5 className="modal-title">Precios – {disciplinaSeleccionada?.nombre_d}</h5>
          <button className="close" onClick={() => setModalPrecios(false)}><span>&times;</span></button>
        </div>
        <div className="modal-body mt-2">
          {precios && [1, 2, 3, 4, 5, 6].map((n) => (
            <div className="row mb-2" key={n}>
              <div className="col-md-6"><label>{n} día(s) por semana</label></div>
              <div className="col-md-6">
                <input type="number" className="form-control" value={precios[`precio_${n}`]}
                  disabled={!editandoPrecios}
                  onChange={(e) => setPrecios({ ...precios, [`precio_${n}`]: e.target.value })} />
              </div>
            </div>
          ))}
          <div className="row mb-2">
            <div className="col-md-6"><label>Precio por día</label></div>
            <div className="col-md-6">
              <input type="number" className="form-control" value={precios?.precio_dia || ""}
                disabled={!editandoPrecios}
                onChange={(e) => setPrecios({ ...precios, precio_dia: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary me-2" onClick={() => setModalPrecios(false)}>Cerrar</button>
          <button className="btn btn-admin" onClick={() => editandoPrecios ? handleGuardarPrecios() : setEditandoPrecios(true)}>
            {editandoPrecios ? "Guardar cambios" : "Editar"}
          </button>
        </div>
      </Modal> */}

      {/* MODAL PRECIOS (NUEVO FORMATO) */}
      <Modal isOpen={modalPrecios} onRequestClose={() => setModalPrecios(false)} className="modal-react" overlayClassName="modal-overlay">
        <div className="modal-header">
          <h5 className="modal-title">Precios – {disciplinaSeleccionada?.nombre_d}</h5>
          <button className="close" onClick={() => setModalPrecios(false)}><span>&times;</span></button>
        </div>
        <div className="modal-body mt-2">
          {/* Encabezados */}
          <div className="row mb-2 fw-semibold text-center">
            <div className="col-md-4"></div>
            <div className="col-md-4">Efectivo</div>
            <div className="col-md-4">Débito / Tarjeta</div>
          </div>

          {precios && [1, 2, 3, 4, 5, 6].map(n => (
            <div className="row mb-2 align-items-center" key={n}>
              <div className="col-md-4"><label>{n} día(s)/sem</label></div>
              <div className="col-md-4">
                <input type="number" className="form-control form-control-sm"
                  value={precios[`precio_${n}`] || ''}
                  disabled={!editandoPrecios}
                  onChange={e => setPrecios({ ...precios, [`precio_${n}`]: e.target.value })} />
              </div>
              <div className="col-md-4">
                <input type="number" className="form-control form-control-sm"
                  value={precios[`precio_${n}_debito`] || ''}
                  disabled={!editandoPrecios}
                  onChange={e => setPrecios({ ...precios, [`precio_${n}_debito`]: e.target.value })} />
              </div>
            </div>
          ))}

          <div className="row mb-2 align-items-center">
            <div className="col-md-4"><label>Precio por día</label></div>
            <div className="col-md-4">
              <input type="number" className="form-control form-control-sm"
                value={precios?.precio_dia || ''}
                disabled={!editandoPrecios}
                onChange={e => setPrecios({ ...precios, precio_dia: e.target.value })} />
            </div>
            <div className="col-md-4">
              <input type="number" className="form-control form-control-sm"
                value={precios?.precio_dia_debito || ''}
                disabled={!editandoPrecios}
                onChange={e => setPrecios({ ...precios, precio_dia_debito: e.target.value })} />
            </div>
            <div className="col-md-4"></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary me-2" onClick={() => setModalPrecios(false)}>Cerrar</button>
          <button className="btn btn-admin"
            onClick={() => editandoPrecios ? handleGuardarPrecios() : setEditandoPrecios(true)}>
            {editandoPrecios ? "Guardar cambios" : "Editar"}
          </button>
        </div>
      </Modal> {/* FIN MODAL PRECIOS (NUEVO FORMATO) */}

      {/* MODAL HORARIOS */}
      <Modal isOpen={modalHorarios} onRequestClose={() => setModalHorarios(false)} className="modal-react" overlayClassName="modal-overlay">
        <div className="modal-header">
          <h5 className="modal-title">
            Horarios – {actividadHorario?.nombre_a}
            {actividadHorario?.profesor ? ` (${actividadHorario.profesor})` : ""}
          </h5>
          <button className="close" onClick={() => setModalHorarios(false)}><span>&times;</span></button>
        </div>
        <div className="modal-body mt-2">

          {vistaHorarios === 'lista' ? (
            <>
              {/* LISTA DE HORARIOS */}
              {horariosEditados.length === 0 ? (
                <p className="text-muted text-center">No hay horarios cargados</p>
              ) : (() => {
                const filasH = 5;
                const inicioH = (paginaHorarios - 1) * filasH;
                const horariosPagina = horariosEditados.slice(inicioH, inicioH + filasH);
                const totalPaginasH = Math.ceil(horariosEditados.length / filasH);
                return (
                  <>
                    {/* cabecera */}
                    <div className="row fw-semibold mb-1 small text-muted">
                      <div className="col">Día</div>
                      <div className="col">Hora</div>
                      <div className="col">Profesor</div>
                      <div className="col">Cupo máx.</div>
                      {/*<div className="col">Ocupados</div>
                      <div className="col-auto" style={{ width: 40 }}></div>*/}
                    </div>

                    {horariosPagina.map((h, index) => {
                      const realIndex = inicioH + index;
                      return (
                        <div className="row mb-3 align-items-center" key={h.id_horario}>
                          {/* DÍA */}
                          <div className="col">
                            {editandoHorarios ? (
                              <select className="form-select"
                                value={h.dia_h}
                                onChange={(e) => {
                                  const copia = [...horariosEditados];
                                  copia[realIndex] = { ...copia[realIndex], dia_h: e.target.value };
                                  setHorariosEditados(copia);
                                }}>
                                {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                            ) : (
                              <input className="form-control" value={h.dia_h} disabled />
                            )}
                          </div>
                          {/* HORA */}
                          <div className="col">
                            <input type="time" className="form-control"
                              value={h.hora_h?.slice(0, 5) || ""}
                              disabled={!editandoHorarios}
                              onChange={(e) => {
                                const copia = [...horariosEditados];
                                copia[realIndex] = { ...copia[realIndex], hora_h: e.target.value };
                                setHorariosEditados(copia);
                              }} />
                          </div>
                          {/* PROFESOR */}
                          <div className="col-4">
                            {editandoHorarios ? (
                              <select className="form-select"
                                value={h.id_profesor || ""}
                                onChange={(e) => {
                                  const copia = [...horariosEditados];
                                  copia[realIndex] = { ...copia[realIndex], id_profesor: e.target.value || null };
                                  setHorariosEditados(copia);
                                }}>
                                <option value="">Sin asignar</option>
                                {profesores.map(p => (
                                  <option key={p.id_profesor} value={p.id_profesor}>{p.nomap_p}</option>
                                ))}
                              </select>
                            ) : (
                              <input className="form-control" value={h.profesor_nombre || "Sin asignar"} disabled />
                            )}
                          </div>
                          {/* CUPO MÁXIMO */}
                          <div className="col-2">
                            <input type="number" className="form-control" value={h.cupo_maximo}
                              disabled={!editandoHorarios}
                              onChange={(e) => {
                                const copia = [...horariosEditados];
                                copia[realIndex] = { ...copia[realIndex], cupo_maximo: e.target.value };
                                setHorariosEditados(copia);
                              }} />
                          </div>
                          {/* CUPO ACTUAL */}
                          {/*<div className="col">
                            <input type="number" className="form-control" value={h.cupo_actual}
                              disabled={!editandoHorarios}
                              onChange={(e) => {
                                const copia = [...horariosEditados];
                                copia[realIndex] = { ...copia[realIndex], cupo_actual: e.target.value };
                                setHorariosEditados(copia);
                              }} />
                          </div>*/}
                          {/* ELIMINAR */}
                          <div className="col-auto" style={{ width: 50 }}>
                            <button className="btn btn-sm btn-outline-danger"
                              title="Eliminar horario"
                              onClick={() => handleEliminarHorario(h)}>
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {totalPaginasH > 1 && (
                      <nav className="d-flex justify-content-center mt-2">
                        <ul className="pagination pagination-sm mb-0">
                          {Array.from({ length: totalPaginasH }).map((_, i) => (
                            <li key={i} className={`nav-item ${paginaHorarios === i + 1 ? "navlink-active" : ""}`}>
                              <button className="nav-link" onClick={() => setPaginaHorarios(i + 1)}>{i + 1}</button>
                            </li>
                          ))}
                        </ul>
                      </nav>
                    )}
                  </>
                );
              })()}
            </>
          ) : (
            <>
              {/* FORMULARIO NUEVO HORARIO */}
              <div className="row g-3">
                <div className="col-12 col-md">
                  <label className="form-label small mb-1">Día</label>
                  <select className="form-select"
                    value={formNuevoHorario.dia}
                    onChange={(e) => setFormNuevoHorario({ ...formNuevoHorario, dia: e.target.value })}>
                    <option value="">Seleccionar</option>
                    {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="col-12 col-md">
                  <label className="form-label small mb-1">Hora</label>
                  <input type="time" className="form-control"
                    value={formNuevoHorario.hora}
                    onChange={(e) => setFormNuevoHorario({ ...formNuevoHorario, hora: e.target.value })} />
                </div>
                <div className="col-12 col-md">
                  <label className="form-label small mb-1">Cupo máximo</label>
                  <input type="number" className="form-control" min="1"
                    value={formNuevoHorario.cupo_maximo}
                    onChange={(e) => setFormNuevoHorario({ ...formNuevoHorario, cupo_maximo: e.target.value })} />
                </div>
                <div className="col-12 mb-3">
                  <label className="form-label small mb-1">Profesor</label>
                  <select className="form-select"
                    value={formNuevoHorario.id_profesor}
                    onChange={(e) => setFormNuevoHorario({ ...formNuevoHorario, id_profesor: e.target.value })}>
                    <option value="">Sin asignar</option>
                    {profesores.map(p => (
                      <option key={p.id_profesor} value={p.id_profesor}>{p.nomap_p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

        </div>{/* fin modal-body */}

        {/* FOOTER según vista */}
        <div className="modal-footer">
          {vistaHorarios === 'lista' ? (
            <>
              {!editandoHorarios && (
                <button className="btn btn-admin me-auto"
                  onClick={() => {
                    setFormNuevoHorario({ ...FORM_HORARIO_VACIO, id_profesor: actividadHorario?.id_profesor || "" });
                    setVistaHorarios('nuevo');
                  }}>
                  <i className="ri-add-line"></i> Agregar horario
                </button>
              )}
              {editandoHorarios && (
                <button className="btn btn-secondary me-auto"
                  onClick={() => { setEditandoHorarios(false); setHorariosEditados(horarios); }}>
                  <i className="ri-close-line"></i> Cancelar edición
                </button>
              )}
              {!editandoHorarios && (
                <button className="btn btn-secondary me-2" onClick={() => setModalHorarios(false)}>Cerrar</button>
              )}
              <button className="btn btn-admin"
                onClick={() => editandoHorarios ? handleGuardarHorarios() : setEditandoHorarios(true)}>
                {editandoHorarios ? "Guardar cambios" : "Editar"}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary me-auto" onClick={() => setVistaHorarios('lista')}>
                <i className="ri-arrow-left-line"></i> Volver
              </button>
              <button className="btn btn-admin" onClick={handleAgregarHorario} disabled={guardandoHorario}>
                {guardandoHorario ? "Guardando..." : "Guardar horario"}
              </button>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}