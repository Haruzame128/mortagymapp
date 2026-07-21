import { useState, useEffect } from "react";
//import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { perfilApi } from "../services/api";
import EstadoItem from "../components/usuario/EstadoItem";

export default function Perfil({ onSubmit }) {
  //const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
      apellidoNombre: "",
      dni: "",
      direccion: "",
      telefono1: "",
      telefonoEmergencia: "",
      fechaNacimiento: "",
      edad: "",
      planElegido: "",
      valorMensual: "",
      dias: "",
      horarios: "",
    });

  const [isEditable, setIsEditable] = useState(false);

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
    };

   const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Ficha de inscripción:", formData);

    if (onSubmit) onSubmit(formData);
  };

  useEffect(() => {
    perfilApi.getMe()
      .then(setPerfil)
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-secondary" role="status" />
      </div>
    )
  }

   
  return (
    <div className="container perfil mt-4">

      {/* Encabezado */}
      <div className="text-center mb-4">
        <h2 className="fw-bold">Hola, {perfil?.nomap_c || user?.nombre}</h2>

        {/* Cerrar sesión */}
        <div className="text-center mt-5">
          <button className="btn btn-outline-secondary" onClick={logout}>
            <i className="ri-logout-box-line me-2"></i> Cerrar sesión
          </button>
        </div>

      </div>
   
        <form className="card p-4 shadow-sm" disabled onSubmit={handleSubmit}>
          <h4 className="fw-bold mb-4 text-center">Perfil del Cliente</h4>

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
                disabled={!isEditable}
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
                disabled={!isEditable}
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
              disabled={!isEditable}
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
                disabled={!isEditable}
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
                disabled={!isEditable}
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
                disabled={!isEditable}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Edad</label>
              <input disabled
                type="number"
                className="form-control"
                name="edad"
                value={formData.edad}
                onChange={handleChange}
              />
            </div>
          </div>

          <h6 className="fw-bold mb-3">Actividades</h6>

          {perfil?.inscripciones?.length > 0 && (
            <div className="text-start mb-3">
              {[...new Map(perfil.inscripciones.map(i => [i.nombre_d, i])).values()].map((i, idx) => (
                <span key={idx} className="badge bg-light text-dark border me-1 mb-1">
                  {i.nombre_d}
                </span>
              ))}
            </div>
            )}
          <div className="row">
              <div className="col perfil-estado-user">
                  <EstadoItem 
                      icon= {perfil?.cuota_al_dia ? '✅' : '❌'}
                      titulo=  {perfil?.cuota_al_dia ? 'Cuota al día' : 'Cuota vencida'}
                      vencimiento="28/2" 
                  />
                  <EstadoItem 
                      icon="✅" 
                      titulo="Matrícula al día (En caso de natación)" 
                      vencimiento="20/12" 
                      
                  />
                  <EstadoItem 
                      icon={perfil?.tiene_ficha ? '✅' : '⚠️ '} 
                      titulo={perfil?.tiene_ficha ? 'Ficha médica Vigente' : 'Falta ficha médica'} 
                      vencimiento={null} 
                  />

                  {perfil?.venc_ficha_medica && (
                    <div className="col-auto">
                      <span className="badge bg-secondary p-2 fs-6">
                        📋 Ficha vence: {(() => {
                          const f = new Date(perfil.venc_ficha_medica)
                          return `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}/${f.getFullYear()}`
                        })()}
                      </span>
                    </div>
                  )}
              </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button type="reset" className="btn btn-outline-secondary">
              Limpiar
            </button>
            <button type="reset" className="btn btn-outline-primary" onClick={() => setIsEditable(true)}>
              Editar
            </button>
            <button type="submit" className="btn btn-success">
              Guardar cambios
            </button>
          </div>
        </form>

    </div>
  )
}