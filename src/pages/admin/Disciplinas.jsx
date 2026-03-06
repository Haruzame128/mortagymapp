import { useState, useEffect } from "react";
import Modal from "react-modal";
import Swal from "sweetalert2";
import { disciplinasApi, horariosApi } from "../../services/api";
import "../../styles/Admin.css";

Modal.setAppElement("#root");

const FORM_VACIO = {
  nombre: "",
  descripcion: "",
  imagen: "",
  precios: { precio_1: "", precio_2: "", precio_3: "", precio_4: "", precio_5: "", precio_6: "", precio_dia: "" },
};

export default function Disciplinas() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);

  // Modal disciplina
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modoNuevo, setModoNuevo] = useState(false);
  const [disciplinaSeleccionada, setDisciplinaSeleccionada] = useState(null);
  const [formDisciplina, setFormDisciplina] = useState(FORM_VACIO);
  const [imagenFile, setImagenFile] = useState(null) // archivo real
  const [guardando, setGuardando] = useState(false);

  // Modal precios
  const [modalPrecios, setModalPrecios] = useState(false);
  const [editandoPrecios, setEditandoPrecios] = useState(false);
  const [precios, setPrecios] = useState(null);

  // Modal horarios
  const [modalHorarios, setModalHorarios] = useState(false);
  const [editandoHorarios, setEditandoHorarios] = useState(false);
  const [horarios, setHorarios] = useState([]);

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
    setIsModalOpen(true);
  };

  // ── Abrir modal editar ──────────────────────────────────────────
  const abrirEditar = (d) => {
    setModoNuevo(false);
    setDisciplinaSeleccionada(d);
    setFormDisciplina({
      nombre: d.nombre_d,
      descripcion: d.descripcion_d,
      imagen: d.imagen || "",
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
    setIsModalOpen(true);
  };

  // ── Guardar (crear o editar) ────────────────────────────────────
  const handleGuardar = async () => {
    if (!formDisciplina.nombre.trim()) {
      Swal.fire("Error", "El nombre es obligatorio", "warning");
      return;
    }
    setGuardando(true);
    try {
      // Armar FormData para poder enviar la imagen junto con los datos
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

  // ── Deshabilitar disciplina ─────────────────────────────────────
  const handleToggleActivo = (d) => {
    const accion = d.activo_d ? "deshabilitar" : "habilitar";
    const nuevoEstado = !d.activo_d;
    Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} disciplina?`,
      text: d.activo_d
        ? "La disciplina dejará de estar disponible"
        : "La disciplina volverá a estar disponible",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: d.activo_d ? "#dc3545" : "#198754",
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await disciplinasApi.toggleActivo(d.id_disciplina, nuevoEstado);
          Swal.fire(
            nuevoEstado ? "Habilitada" : "Deshabilitada",
            `La disciplina fue ${nuevoEstado ? "habilitada" : "deshabilitada"}`,
            "success"
          );
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

  // ── Abrir modal horarios ────────────────────────────────────────
  const abrirHorarios = async (d) => {
    setDisciplinaSeleccionada(d);
    setEditandoHorarios(false);
    setModalHorarios(true);
    try {
      const todos = await horariosApi.getAll();
      setHorarios(todos.filter(h => h.nombre_d === d.nombre_d));
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
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

      {/* TABLA */}
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
                <tr key={d.id_disciplina}>
                  <td>{d.nombre_d}</td>
                  <td>{d.descripcion_d}</td>
                  <td>
                    <span className={`badge ${d.activo_d ? "bg-success" : "bg-danger"}`}>
                      {d.activo_d ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-outline-secondary me-1"
                      title="Precios"
                      onClick={() => abrirPrecios(d)}
                    >
                      <i className="ri-money-dollar-circle-line"></i>
                    </button>

                    <button
                      className="btn btn-sm btn-outline-secondary me-1"
                      title="Horarios"
                      onClick={() => abrirHorarios(d)}
                    >
                      <i className="ri-time-line"></i>
                    </button>

                    <button
                      className="btn btn-sm btn-outline-secondary me-1"
                      title="Editar"
                      onClick={() => abrirEditar(d)}
                    >
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
              <button className="nav-link" onClick={() => setPaginaActual(i + 1)}>
                {i + 1}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* MODAL DISCIPLINA */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Disciplina"
        className="modal-react"
        overlayClassName="modal-overlay"
      >
        <div className="modal-header">
          <h5 className="modal-title">{modoNuevo ? "Nueva disciplina" : "Editar disciplina"}</h5>
          <button className="close" onClick={() => setIsModalOpen(false)}><span>&times;</span></button>
        </div>

        <div className="modal-body mt-2">
          <div className="mb-3">
            <label className="form-label">Nombre</label>
            <input
              className="form-control"
              value={formDisciplina.nombre}
              onChange={(e) => setFormDisciplina({ ...formDisciplina, nombre: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-control"
              rows="2"
              value={formDisciplina.descripcion}
              onChange={(e) => setFormDisciplina({ ...formDisciplina, descripcion: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label className="form-label d-block">Imagen</label>
            <label htmlFor="imagen" className="btn btn-admin">Seleccionar imagen</label>
            <input
              id="imagen"
              type="file"
              className="d-none"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) setImagenFile(file);
              }}
            />
            {imagenFile && (
              <span className="ms-2 text-muted small">{imagenFile.name}</span>
            )}
            {!imagenFile && formDisciplina.imagen && (
              <span className="ms-2 text-muted small">Imagen actual: {formDisciplina.imagen}</span>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary me-2" onClick={() => setIsModalOpen(false)}>
            Cancelar
          </button>
          <button className="btn btn-admin" onClick={handleGuardar} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </Modal>

      {/* MODAL PRECIOS */}
      <Modal
        isOpen={modalPrecios}
        onRequestClose={() => setModalPrecios(false)}
        className="modal-react"
        overlayClassName="modal-overlay"
      >
        <div className="modal-header">
          <h5 className="modal-title">Precios – {disciplinaSeleccionada?.nombre_d}</h5>
          <button className="close" onClick={() => setModalPrecios(false)}><span>&times;</span></button>
        </div>

        <div className="modal-body mt-2">
          {precios && [1, 2, 3, 4, 5, 6].map((n) => (
            <div className="row mb-2" key={n}>
              <div className="col-md-6">
                <label>{n} día(s) por semana</label>
              </div>
              <div className="col-md-6">
                <input
                  type="number"
                  className="form-control"
                  value={precios[`precio_${n}`]}
                  disabled={!editandoPrecios}
                  onChange={(e) => setPrecios({ ...precios, [`precio_${n}`]: e.target.value })}
                />
              </div>
            </div>
          ))}

          <div className="row mb-2">
            <div className="col-md-6"><label>Precio por día</label></div>
            <div className="col-md-6">
              <input
                type="number"
                className="form-control"
                value={precios?.precio_dia || ""}
                disabled={!editandoPrecios}
                onChange={(e) => setPrecios({ ...precios, precio_dia: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary me-2" onClick={() => setModalPrecios(false)}>
            Cerrar
          </button>
          <button
            className="btn btn-admin"
            onClick={() => editandoPrecios ? handleGuardarPrecios() : setEditandoPrecios(true)}
          >
            {editandoPrecios ? "Guardar cambios" : "Editar"}
          </button>
        </div>
      </Modal>

      {/* MODAL HORARIOS */}
      <Modal
        isOpen={modalHorarios}
        onRequestClose={() => setModalHorarios(false)}
        className="modal-react"
        overlayClassName="modal-overlay"
      >
        <div className="modal-header">
          <h5 className="modal-title">Horarios – {disciplinaSeleccionada?.nombre_d}</h5>
          <button className="close" onClick={() => setModalHorarios(false)}><span>&times;</span></button>
        </div>

        <div className="modal-body mt-2">
          {horarios.length === 0 ? (
            <p className="text-muted text-center">No hay horarios cargados</p>
          ) : (
            horarios.map((h, index) => (
              <div className="row mb-2 align-items-center" key={index}>
                <div className="col">
                  <input className="form-control" value={h.dia_h} disabled />
                </div>
                <div className="col">
                  <input type="time" className="form-control" value={h.hora_inicio || ""} disabled={!editandoHorarios} />
                </div>
                <div className="col-md-1 text-center"><p>-</p></div>
                <div className="col">
                  <input type="time" className="form-control" value={h.hora_fin || ""} disabled={!editandoHorarios} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary me-2" onClick={() => setModalHorarios(false)}>
            Cerrar
          </button>
          <button className="btn btn-admin" onClick={() => setEditandoHorarios(!editandoHorarios)}>
            {editandoHorarios ? "Guardar cambios" : "Editar"}
          </button>
        </div>
      </Modal>
    </>
  );
}