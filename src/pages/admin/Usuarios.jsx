import { useState, useEffect } from "react";
import Modal from "react-modal";
import Swal from "sweetalert2";
import { usuariosApi, rolesApi, permisosApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import PaginacionTabla from "../../components/PaginacionTabla";
import "../../styles/Admin.css";

Modal.setAppElement("#root");

const ROLES_SIN_ALTA_DESDE_ACA = ["Cliente", "Profesor"];

const FORM_ROL_VACIO = { nombre_rol: "", descripcion: "", permisos: [] };

export default function UsuariosAdmin() {
  const { user } = useAuth();
  const [tab, setTab] = useState("usuarios");

  // ── Usuarios ──────────────────────────────────────────────────
  const [usuarios, setUsuarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("");
  const [buscar, setBuscar] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState(10);

  // ── Roles ─────────────────────────────────────────────────────
  const [roles, setRoles] = useState([]);
  const [cargandoRoles, setCargandoRoles] = useState(true);
  const [catalogo, setCatalogo] = useState({});
  const [modalRol, setModalRol] = useState(false);
  const [rolEditando, setRolEditando] = useState(null); // null = alta
  const [formRol, setFormRol] = useState(FORM_ROL_VACIO);
  const [guardandoRol, setGuardandoRol] = useState(false);

  const cargarUsuarios = async () => {
    try {
      setCargandoUsuarios(true);
      const data = await usuariosApi.getAll({
        rol: filtroRol || undefined,
        activo: filtroActivo || undefined,
        buscar: buscar.trim() || undefined,
      });
      setUsuarios(data);
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudieron cargar los usuarios", "error");
    } finally {
      setCargandoUsuarios(false);
    }
  };

  const cargarRoles = async () => {
    try {
      setCargandoRoles(true);
      const [dataRoles, dataCatalogo] = await Promise.all([rolesApi.getAll(), permisosApi.getCatalogo()]);
      setRoles(dataRoles);
      setCatalogo(dataCatalogo);
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudieron cargar los roles", "error");
    } finally {
      setCargandoRoles(false);
    }
  };

  useEffect(() => { cargarRoles(); }, []);

  useEffect(() => {
    setPaginaActual(1);
    const t = setTimeout(cargarUsuarios, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroRol, filtroActivo, buscar]);

  const inicio = (paginaActual - 1) * filasPorPagina;
  const usuariosPagina = usuarios.slice(inicio, inicio + filasPorPagina);
  const rolesActivos = roles.filter((r) => r.activo);
  const rolesAsignables = rolesActivos.filter((r) => !ROLES_SIN_ALTA_DESDE_ACA.includes(r.nombre_rol));

  // ── Alta de usuario interno ──────────────────────────────────────
  const handleNuevoUsuario = async () => {
    const opciones = rolesAsignables.map((r) => `<option value="${r.nombre_rol}">${r.nombre_rol}</option>`).join("");
    const { value: form } = await Swal.fire({
      title: "Nuevo usuario",
      html: `
        <div class="text-start">
          <label class="form-label small mb-1">DNI</label>
          <input id="swal-dni" type="number" class="form-control form-control-sm mb-2" />
          <label class="form-label small mb-1">Nombre</label>
          <input id="swal-nombre" type="text" class="form-control form-control-sm mb-2" />
          <label class="form-label small mb-1">Rol</label>
          <select id="swal-rol" class="form-select form-select-sm mb-2">${opciones}</select>
          <label class="form-label small mb-1">Contraseña</label>
          <input id="swal-contrasena" type="text" class="form-control form-control-sm mb-1" placeholder="Vacío = usa el DNI" />
          <div class="small text-muted">Si la dejás vacía, la contraseña inicial va a ser el DNI.</div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Crear",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const dni = document.getElementById("swal-dni").value;
        const nombre = document.getElementById("swal-nombre").value.trim();
        const rol = document.getElementById("swal-rol").value;
        const contrasena = document.getElementById("swal-contrasena").value.trim();
        if (!dni || !nombre || !rol) {
          Swal.showValidationMessage("DNI, nombre y rol son obligatorios");
          return false;
        }
        return { dni: Number(dni), nombre, rol, contrasena: contrasena || undefined };
      },
    });
    if (!form) return;

    try {
      await usuariosApi.create(form);
      Swal.fire("¡Listo!", "Usuario creado correctamente", "success");
      cargarUsuarios();
      cargarRoles();
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo crear el usuario", "error");
    }
  };

  const handleEditarNombre = async (u) => {
    const { value: nombre } = await Swal.fire({
      title: "Editar nombre",
      input: "text",
      inputValue: u.nombre || "",
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      inputValidator: (v) => !v.trim() && "El nombre es obligatorio",
    });
    if (!nombre) return;
    try {
      await usuariosApi.actualizarNombre(u.id_usuario, nombre.trim());
      cargarUsuarios();
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo actualizar el nombre", "error");
    }
  };

  const handleCambiarRol = async (u) => {
    const opciones = rolesAsignables
      .map((r) => `<option value="${r.nombre_rol}" ${r.nombre_rol === u.rol_u ? "selected" : ""}>${r.nombre_rol}</option>`)
      .join("");
    const { value: rol } = await Swal.fire({
      title: `Cambiar rol de ${u.nombre || u.dni_u}`,
      html: `<select id="swal-rol" class="form-select">${opciones}</select>`,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      preConfirm: () => document.getElementById("swal-rol").value,
    });
    if (!rol || rol === u.rol_u) return;
    try {
      await usuariosApi.cambiarRol(u.id_usuario, rol);
      Swal.fire("¡Listo!", "Rol actualizado", "success");
      cargarUsuarios();
      cargarRoles();
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo cambiar el rol", "error");
    }
  };

  const handleToggleEstado = (u) => {
    const desactivar = u.activo_u;
    Swal.fire({
      title: desactivar ? "¿Desactivar usuario?" : "¿Reactivar usuario?",
      text: `${u.nombre || u.dni_u}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: desactivar ? "#dc3545" : "#198754",
      confirmButtonText: desactivar ? "Sí, desactivar" : "Sí, reactivar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await usuariosApi.cambiarEstado(u.id_usuario, !desactivar);
        cargarUsuarios();
      } catch (err) {
        Swal.fire("Error", err.message || "No se pudo actualizar el estado", "error");
      }
    });
  };

  const handleResetPassword = async (u) => {
    const { value: contrasena } = await Swal.fire({
      title: `Resetear contraseña — ${u.nombre || u.dni_u}`,
      input: "text",
      inputPlaceholder: "Vacío = usa el DNI como contraseña",
      showCancelButton: true,
      confirmButtonText: "Resetear",
      cancelButtonText: "Cancelar",
    });
    if (contrasena === undefined) return;
    try {
      const resp = await usuariosApi.resetPassword(u.id_usuario, contrasena.trim() || undefined);
      Swal.fire(
        "¡Listo!",
        resp.contrasena_temporal ? `Nueva contraseña: <strong>${resp.contrasena_temporal}</strong>` : "Contraseña actualizada",
        "success",
      );
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo resetear la contraseña", "error");
    }
  };

  // ── Roles ─────────────────────────────────────────────────────
  const abrirNuevoRol = () => {
    setRolEditando(null);
    setFormRol(FORM_ROL_VACIO);
    setModalRol(true);
  };

  const abrirEditarRol = (r) => {
    setRolEditando(r);
    setFormRol({ nombre_rol: r.nombre_rol, descripcion: r.descripcion || "", permisos: r.permisos.map((p) => p.clave) });
    setModalRol(true);
  };

  const togglePermiso = (clave) =>
    setFormRol((prev) => ({
      ...prev,
      permisos: prev.permisos.includes(clave)
        ? prev.permisos.filter((c) => c !== clave)
        : [...prev.permisos, clave],
    }));

  const toggleModulo = (claves, marcar) =>
    setFormRol((prev) => ({
      ...prev,
      permisos: marcar
        ? [...new Set([...prev.permisos, ...claves])]
        : prev.permisos.filter((c) => !claves.includes(c)),
    }));

  const handleGuardarRol = async () => {
    if (!formRol.nombre_rol.trim()) {
      Swal.fire("Error", "El nombre del rol es obligatorio", "warning");
      return;
    }
    setGuardandoRol(true);
    try {
      if (rolEditando) {
        await rolesApi.update(rolEditando.id_rol, {
          nombre_rol: rolEditando.es_sistema ? undefined : formRol.nombre_rol.trim(),
          descripcion: formRol.descripcion.trim(),
          permisos: formRol.permisos,
        });
      } else {
        await rolesApi.create({
          nombre_rol: formRol.nombre_rol.trim(),
          descripcion: formRol.descripcion.trim(),
          permisos: formRol.permisos,
        });
      }
      Swal.fire("¡Listo!", "Rol guardado correctamente", "success");
      setModalRol(false);
      cargarRoles();
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo guardar el rol", "error");
    } finally {
      setGuardandoRol(false);
    }
  };

  const handleEliminarRol = (r) => {
    Swal.fire({
      title: `¿Eliminar el rol ${r.nombre_rol}?`,
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await rolesApi.remove(r.id_rol);
        cargarRoles();
      } catch (err) {
        Swal.fire("Error", err.message || "No se pudo eliminar el rol", "error");
      }
    });
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Gestión de usuarios</h3>
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${tab === "usuarios" ? "active" : ""}`} onClick={() => setTab("usuarios")}>
            Usuarios
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === "roles" ? "active" : ""}`} onClick={() => setTab("roles")}>
            Roles
          </button>
        </li>
      </ul>

      {tab === "usuarios" && (
        <>
          <div className="card admin-card mb-3">
            <div className="card-body">
              <div className="row g-2 align-items-end">
                <div className="col-md-4">
                  <label className="form-label small">Buscar</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Nombre o DNI"
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label small">Rol</label>
                  <select className="form-select form-select-sm" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
                    <option value="">-- Todos --</option>
                    {roles.map((r) => (
                      <option key={r.id_rol} value={r.nombre_rol}>{r.nombre_rol}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label small">Estado</label>
                  <select className="form-select form-select-sm" value={filtroActivo} onChange={(e) => setFiltroActivo(e.target.value)}>
                    <option value="">-- Todos --</option>
                    <option value="true">Activos</option>
                    <option value="false">Inactivos</option>
                  </select>
                </div>
                <div className="col-md-2 text-end">
                  <button className="btn btn-admin btn-sm w-100" onClick={handleNuevoUsuario}>
                    <i className="ri-add-line"></i> Nuevo
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>DNI</th>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Tipo</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargandoUsuarios ? (
                  <tr><td colSpan="6" className="text-center py-4">Cargando...</td></tr>
                ) : usuariosPagina.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-4">No hay usuarios para mostrar</td></tr>
                ) : (
                  usuariosPagina.map((u) => {
                    const esUnoMismo = Number(u.id_usuario) === Number(user?.id);
                    return (
                      <tr key={u.id_usuario}>
                        <td>{u.dni_u}</td>
                        <td>
                          {u.nombre || <span className="text-muted">—</span>}
                          {u.tipo === "interno" && (
                            <button className="btn btn-sm btn-link p-0 ms-1" title="Editar nombre" onClick={() => handleEditarNombre(u)}>
                              <i className="ri-pencil-line"></i>
                            </button>
                          )}
                        </td>
                        <td>{u.rol_u}</td>
                        <td className="text-capitalize">{u.tipo}</td>
                        <td className="text-center">
                          <span className={`badge ${u.activo_u ? "bg-success" : "bg-danger"}`}>
                            {u.activo_u ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-secondary"
                              title={esUnoMismo ? "No podés cambiar tu propio rol" : "Cambiar rol"}
                              disabled={esUnoMismo}
                              onClick={() => handleCambiarRol(u)}
                            >
                              <i className="ri-shield-user-line"></i>
                            </button>
                            <button
                              className="btn btn-outline-secondary"
                              title="Resetear contraseña"
                              onClick={() => handleResetPassword(u)}
                            >
                              <i className="ri-key-2-line"></i>
                            </button>
                            <button
                              className={`btn ${u.activo_u ? "btn-outline-danger" : "btn-outline-success"}`}
                              title={esUnoMismo ? "No podés desactivarte a vos mismo" : u.activo_u ? "Desactivar" : "Reactivar"}
                              disabled={esUnoMismo}
                              onClick={() => handleToggleEstado(u)}
                            >
                              <i className={u.activo_u ? "ri-close-circle-fill" : "ri-checkbox-circle-fill"}></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <PaginacionTabla
            paginaActual={paginaActual}
            setPaginaActual={setPaginaActual}
            filasPorPagina={filasPorPagina}
            setFilasPorPagina={setFilasPorPagina}
            totalItems={usuarios.length}
          />
        </>
      )}

      {tab === "roles" && (
        <>
          <div className="d-flex justify-content-end mb-3">
            <button className="btn btn-admin btn-sm" onClick={abrirNuevoRol}>
              <i className="ri-add-line"></i> Nuevo rol
            </button>
          </div>

          {cargandoRoles ? (
            <div className="text-center py-5">
              <div className="spinner-border text-secondary" role="status" />
            </div>
          ) : (
            <div className="row g-3">
              {roles.map((r) => (
                <div className="col-md-4" key={r.id_rol}>
                  <div className="card admin-card h-100">
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start">
                        <h6 className="fw-bold mb-1">{r.nombre_rol}</h6>
                        {r.es_sistema && <span className="badge bg-secondary">Sistema</span>}
                      </div>
                      <p className="text-muted small mb-2">{r.descripcion || "—"}</p>
                      <div className="small text-muted mb-3">
                        {r.usuarios} usuario(s) · {r.permisos.length} permiso(s)
                      </div>
                      <div className="mt-auto d-flex gap-2">
                        <button className="btn btn-sm btn-outline-secondary flex-fill" onClick={() => abrirEditarRol(r)}>
                          <i className="ri-pencil-fill"></i> Editar
                        </button>
                        {!r.es_sistema && (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleEliminarRol(r)}>
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* MODAL ROL */}
      <Modal isOpen={modalRol} onRequestClose={() => setModalRol(false)} className="modal-react" overlayClassName="modal-overlay"
        style={{ content: { maxWidth: 700, maxHeight: "85vh", overflowY: "auto" } }}>
        <div className="modal-header">
          <h5 className="modal-title">{rolEditando ? `Editar rol — ${rolEditando.nombre_rol}` : "Nuevo rol"}</h5>
          <button className="close" onClick={() => setModalRol(false)}><span>&times;</span></button>
        </div>
        <div className="modal-body mt-2">
          <div className="mb-3">
            <label className="form-label">Nombre del rol</label>
            <input
              className="form-control"
              value={formRol.nombre_rol}
              disabled={!!rolEditando?.es_sistema}
              onChange={(e) => setFormRol({ ...formRol, nombre_rol: e.target.value })}
            />
            {rolEditando?.es_sistema && (
              <div className="form-text">Los roles de sistema no se pueden renombrar.</div>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-control"
              rows="2"
              value={formRol.descripcion}
              onChange={(e) => setFormRol({ ...formRol, descripcion: e.target.value })}
            />
          </div>

          <label className="form-label fw-semibold">Permisos</label>
          {Object.entries(catalogo).map(([modulo, permisos]) => {
            const claves = permisos.map((p) => p.clave);
            const todosMarcados = claves.every((c) => formRol.permisos.includes(c));
            return (
              <div className="border rounded p-2 mb-2" key={modulo}>
                <div className="form-check border-bottom pb-1 mb-1">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`modulo-${modulo}`}
                    checked={todosMarcados}
                    onChange={(e) => toggleModulo(claves, e.target.checked)}
                  />
                  <label className="form-check-label small fw-semibold text-capitalize" htmlFor={`modulo-${modulo}`}>
                    {modulo}
                  </label>
                </div>
                <div className="row">
                  {permisos.map((p) => (
                    <div className="col-md-6 form-check" key={p.clave}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`perm-${p.clave}`}
                        checked={formRol.permisos.includes(p.clave)}
                        onChange={() => togglePermiso(p.clave)}
                      />
                      <label className="form-check-label small" htmlFor={`perm-${p.clave}`} title={p.descripcion}>
                        {p.clave}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary me-2" onClick={() => setModalRol(false)}>Cancelar</button>
          <button className="btn btn-admin" onClick={handleGuardarRol} disabled={guardandoRol}>
            {guardandoRol ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </Modal>
    </>
  );
}
