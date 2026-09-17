import { useState, useEffect, useMemo } from "react";
import Modal from "react-modal";
import Swal from "sweetalert2";
import { ejerciciosApi, categoriasEjercicioApi } from "../../services/api";
import "../../styles/Admin.css";

Modal.setAppElement("#root");

const FORM_VACIO = { nombre: "", id_categoria: "" };
const NUEVA_CATEGORIA = "__nueva__";

export default function Ejercicios() {
  const [ejercicios, setEjercicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [buscar, setBuscar] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null); // null = alta
  const [form, setForm] = useState(FORM_VACIO);
  const [categoriaModo, setCategoriaModo] = useState("existente"); // "existente" | "nueva"
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargarTodo = async () => {
    try {
      setCargando(true);
      const [dataEjercicios, dataCategorias] = await Promise.all([
        ejerciciosApi.getAll(),
        categoriasEjercicioApi.getAll(),
      ]);
      setEjercicios(dataEjercicios);
      setCategorias(dataCategorias);
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudieron cargar los ejercicios", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarTodo(); }, []);

  const ejerciciosFiltrados = useMemo(() => {
    const texto = buscar.trim().toLowerCase();
    if (!texto) return ejercicios;
    return ejercicios.filter(
      (e) => e.nombre_e.toLowerCase().includes(texto) || e.categoria_e.toLowerCase().includes(texto),
    );
  }, [ejercicios, buscar]);

  const abrirNuevo = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setNuevaCategoriaNombre("");
    setCategoriaModo(categorias.length > 0 ? "existente" : "nueva");
    setModalAbierto(true);
  };

  const abrirEditar = (e) => {
    setEditando(e);
    setForm({ nombre: e.nombre_e, id_categoria: e.id_categoria });
    setNuevaCategoriaNombre("");
    setCategoriaModo("existente");
    setModalAbierto(true);
  };

  const handleCategoriaSelect = (valor) => {
    if (valor === NUEVA_CATEGORIA) {
      setCategoriaModo("nueva");
      setForm({ ...form, id_categoria: "" });
    } else {
      setForm({ ...form, id_categoria: Number(valor) });
    }
  };

  const categoriaElegida = categoriaModo === "nueva" ? nuevaCategoriaNombre.trim() : form.id_categoria;

  const handleGuardar = async () => {
    if (!form.nombre.trim() || !categoriaElegida) {
      Swal.fire("Error", "El nombre y la categoría son obligatorios", "warning");
      return;
    }
    setGuardando(true);
    try {
      let id_categoria = form.id_categoria;
      if (categoriaModo === "nueva") {
        const nuevaCategoria = await categoriasEjercicioApi.create(nuevaCategoriaNombre.trim());
        id_categoria = nuevaCategoria.id_categoria;
      }

      const data = { nombre: form.nombre.trim(), id_categoria };
      if (editando) {
        await ejerciciosApi.update(editando.id_ejercicio, data);
      } else {
        await ejerciciosApi.create(data);
      }
      Swal.fire("¡Listo!", "Ejercicio guardado correctamente", "success");
      setModalAbierto(false);
      cargarTodo();
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo guardar el ejercicio", "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = (e) => {
    Swal.fire({
      title: `¿Eliminar "${e.nombre_e}"?`,
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await ejerciciosApi.remove(e.id_ejercicio);
        cargarTodo();
      } catch (err) {
        Swal.fire("Error", err.message || "No se pudo eliminar el ejercicio", "error");
      }
    });
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Ejercicios</h3>
        <button className="btn btn-admin btn-sm" onClick={abrirNuevo}>
          <i className="ri-add-line"></i> Nuevo ejercicio
        </button>
      </div>

      <div className="card admin-card mb-3">
        <div className="card-body">
          <label className="form-label small">Buscar</label>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Nombre o categoría"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Categoría</th>
              <th>Nombre</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="3" className="text-center py-4">Cargando...</td></tr>
            ) : ejerciciosFiltrados.length === 0 ? (
              <tr><td colSpan="3" className="text-center py-4">No hay ejercicios para mostrar</td></tr>
            ) : (
              ejerciciosFiltrados.map((e) => (
                <tr key={e.id_ejercicio}>
                  <td>{e.categoria_e}</td>
                  <td>{e.nombre_e}</td>
                  <td className="text-center">
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-secondary" title="Editar" onClick={() => abrirEditar(e)}>
                        <i className="ri-pencil-fill"></i>
                      </button>
                      <button className="btn btn-outline-danger" title="Eliminar" onClick={() => handleEliminar(e)}>
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL EJERCICIO */}
      <Modal
        isOpen={modalAbierto}
        onRequestClose={() => setModalAbierto(false)}
        className="modal-react"
        overlayClassName="modal-overlay"
        style={{ content: { maxWidth: 500 } }}
      >
        <div className="modal-header">
          <h5 className="modal-title">{editando ? "Editar ejercicio" : "Nuevo ejercicio"}</h5>
          <button className="close" onClick={() => setModalAbierto(false)}><span>&times;</span></button>
        </div>
        <div className="modal-body mt-2">
          <div className="mb-3">
            <label className="form-label">Categoría</label>
            {categoriaModo === "existente" ? (
              <select
                className="form-select"
                value={form.id_categoria}
                onChange={(e) => handleCategoriaSelect(e.target.value)}
              >
                <option value="">Seleccioná una categoría</option>
                {categorias.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>
                ))}
                <option value={NUEVA_CATEGORIA}>+ Agregar nueva categoría</option>
              </select>
            ) : (
              <div className="input-group">
                <input
                  className="form-control"
                  placeholder="Nombre de la nueva categoría"
                  value={nuevaCategoriaNombre}
                  onChange={(e) => setNuevaCategoriaNombre(e.target.value)}
                  autoFocus
                />
                {categorias.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => { setCategoriaModo("existente"); setNuevaCategoriaNombre(""); }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">Nombre del ejercicio</label>
            <input
              className="form-control"
              disabled={!categoriaElegida}
              placeholder={categoriaElegida ? "" : "Primero elegí o creá una categoría"}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary me-2" onClick={() => setModalAbierto(false)}>Cancelar</button>
          <button className="btn btn-admin" onClick={handleGuardar} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </Modal>
    </>
  );
}
