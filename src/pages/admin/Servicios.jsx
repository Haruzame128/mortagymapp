
import { useState, useEffect } from "react";
import Modal from "react-modal";
import Swal from "sweetalert2";
import { serviciosApi } from "../../services/api";
import "../../styles/Admin.css";

Modal.setAppElement("#root");

const FORM_VACIO = {
  nombre: "",
  descripcion: "",
  extra: "",
  redes: "",
};

export default function Servicios() {
  const [servicios,            setServicios]            = useState([]);
  const [loading,              setLoading]              = useState(true);
  const [paginaActual,         setPaginaActual]         = useState(1);

  const [isModalOpen,          setIsModalOpen]          = useState(false);
  const [modoNuevo,            setModoNuevo]            = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [formServicio,         setFormServicio]         = useState(FORM_VACIO);
  const [imagenFile,           setImagenFile]           = useState(null);
  const [guardando,            setGuardando]            = useState(false);

  // ── Cargar servicios ────────────────────────────────────────────
  const cargarServicios = async () => {
    try {
      setLoading(true);
      const data = await serviciosApi.getAdmin();
      setServicios(data);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarServicios(); }, []);

  // ── Paginación ──────────────────────────────────────────────────
  const filasPorPagina = 5;
  const inicio = (paginaActual - 1) * filasPorPagina;
  const serviciosPagina = servicios.slice(inicio, inicio + filasPorPagina);
  const totalPaginas = Math.ceil(servicios.length / filasPorPagina);

  // ── Abrir modal nuevo ───────────────────────────────────────────
  const abrirNuevo = () => {
    setModoNuevo(true);
    setServicioSeleccionado(null);
    setFormServicio(FORM_VACIO);
    setImagenFile(null);
    setIsModalOpen(true);
  };

  // ── Abrir modal editar ──────────────────────────────────────────
  const abrirEditar = (s) => {
    setModoNuevo(false);
    setServicioSeleccionado(s);
    setFormServicio({
      nombre:      s.nombre_s,
      descripcion: s.descripcion_s,
      extra:       s.extra_s  || "",
      redes:       s.redes_s  || "",
    });
    setImagenFile(null);
    setIsModalOpen(true);
  };

  // ── Guardar ─────────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!formServicio.nombre.trim()) {
      Swal.fire("Error", "El nombre es obligatorio", "warning");
      return;
    }
    setGuardando(true);
    try {
      const fd = new FormData();
      fd.append("nombre",      formServicio.nombre);
      fd.append("descripcion", formServicio.descripcion);
      fd.append("extra",       formServicio.extra);
      fd.append("redes",       formServicio.redes);
      if (imagenFile) fd.append("imagen", imagenFile);

      if (modoNuevo) {
        await serviciosApi.create(fd);
        Swal.fire("¡Listo!", "Servicio creado correctamente", "success");
      } else {
        await serviciosApi.update(servicioSeleccionado.id_servicio, fd);
        Swal.fire("¡Listo!", "Servicio actualizado correctamente", "success");
      }
      setIsModalOpen(false);
      cargarServicios();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setGuardando(false);
    }
  };

  // ── Toggle activo ───────────────────────────────────────────────
  const handleToggleActivo = (s) => {
    const accion = s.activo_s ? "deshabilitar" : "habilitar";
    const nuevoEstado = !s.activo_s;
    Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} servicio?`,
      text: s.activo_s
        ? "El servicio dejará de mostrarse en la página"
        : "El servicio volverá a mostrarse en la página",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: s.activo_s ? "#dc3545" : "#198754",
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const fd = new FormData();
          fd.append("activo", String(nuevoEstado));
          await serviciosApi.update(s.id_servicio, fd);
          Swal.fire(
            nuevoEstado ? "Habilitado" : "Deshabilitado",
            `El servicio fue ${nuevoEstado ? "habilitado" : "deshabilitado"}`,
            "success"
          );
          cargarServicios();
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
        <h3>Gestión de Servicios</h3>
        <button className="btn btn-admin" onClick={abrirNuevo}>
          <i className="ri-add-line"></i> Nuevo servicio
        </button>
      </div>

      {/* TABLA */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status" />
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle table-servicios">
            <thead className="table-light">
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Extra</th>
                <th>Redes sociales</th>
                <th>Activo</th>
                <th className="text-center">Opciones</th>
              </tr>
            </thead>
            <tbody>
              {serviciosPagina.map((s) => (
                <tr key={s.id_servicio}>
                  <td>{s.nombre_s}</td>
                  <td>{s.descripcion_s}</td>
                  <td>{s.extra_s || "—"}</td>
                  <td>
                    {s.redes_s
                      ? <a href={s.redes_s} target="_blank" rel="noopener noreferrer">{s.redes_s}</a>
                      : "—"}
                  </td>
                  <td>
                    <span className={`badge ${s.activo_s ? "bg-success" : "bg-danger"}`}>
                      {s.activo_s ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-outline-secondary me-1"
                      title="Editar"
                      onClick={() => abrirEditar(s)}
                    >
                      <i className="ri-pencil-fill"></i>
                    </button>
                    <button
                      className={`btn btn-sm ${s.activo_s ? "btn-outline-danger" : "btn-outline-success"}`}
                      title={s.activo_s ? "Deshabilitar" : "Habilitar"}
                      onClick={() => handleToggleActivo(s)}
                    >
                      <i className={s.activo_s ? "ri-close-circle-fill" : "ri-checkbox-circle-fill"}></i>
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

      {/* MODAL */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Servicio"
        className="modal-react"
        overlayClassName="modal-overlay"
      >
        <div className="modal-header">
          <h5 className="modal-title">{modoNuevo ? "Nuevo servicio" : "Editar servicio"}</h5>
          <button className="close" onClick={() => setIsModalOpen(false)}><span>&times;</span></button>
        </div>

        <div className="modal-body mt-2">
          <div className="mb-3">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              className="form-control"
              value={formServicio.nombre}
              onChange={(e) => setFormServicio({ ...formServicio, nombre: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-control"
              rows="3"
              value={formServicio.descripcion}
              onChange={(e) => setFormServicio({ ...formServicio, descripcion: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Extra</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej: Horarios, teléfono de contacto..."
              value={formServicio.extra}
              onChange={(e) => setFormServicio({ ...formServicio, extra: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Redes sociales</label>
            <input
              type="text"
              className="form-control"
              placeholder="https://www.instagram.com/..."
              value={formServicio.redes}
              onChange={(e) => setFormServicio({ ...formServicio, redes: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label className="form-label d-block">Imagen</label>
            <label htmlFor="imagen-servicio" className="btn btn-admin">Seleccionar imagen</label>
            <input
              id="imagen-servicio"
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
            {!imagenFile && servicioSeleccionado?.imagen_s && (
              <span className="ms-2 text-muted small">Imagen actual: {servicioSeleccionado.imagen_s}</span>
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
    </>
  );
}