import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { perfilApi } from "../services/api";

export default function Perfil() {
  const navigate         = useNavigate();
  const { user, logout } = useAuth();
  const [perfil,   setPerfil]   = useState(null);
  const [loading,  setLoading]  = useState(true);

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

        <div className="row justify-content-center g-2 mt-2">
          <div className="col-auto">
            <span className={`badge p-2 fs-6 ${perfil?.cuota_al_dia ? 'bg-success' : 'bg-danger'}`}>
              {perfil?.cuota_al_dia ? '✅ Cuota al día' : '❌ Cuota vencida'}
            </span>
          </div>
          <div className="col-auto">
            <span className={`badge p-2 fs-6 ${perfil?.tiene_ficha ? 'bg-success' : 'bg-warning text-dark'}`}>
              {perfil?.tiene_ficha ? '✅ Ficha médica' : '⚠️ Falta ficha médica'}
            </span>
          </div>
          {perfil?.venc_ficha_medica && (
            <div className="col-auto">
              <span className="badge bg-secondary p-2 fs-6">
                📋 Ficha vence: {new Date(perfil.venc_ficha_medica).toLocaleDateString('es-AR')}
              </span>
            </div>
          )}
        </div>

        {perfil?.entradas_restantes != null && (
          <p className="fs-5 mt-3">
            <strong>Entradas restantes:</strong>{' '}
            <span className="text-primary fw-bold">{perfil.entradas_restantes}</span>
          </p>
        )}
      </div>

      {/* Cards */}
      <div className="row g-4 justify-content-center">

        {/* Mis actividades */}
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-1 text-center h-100">
            <div className="card-body d-flex flex-column justify-content-between">
              <div>
                <h4 className="card-title fw-bold mb-3">Mis actividades</h4>
                <p className="card-text text-muted mb-4">
                  Ver las actividades en las que estás inscripto.
                </p>
                {perfil?.inscripciones?.length > 0 && (
                  <div className="text-start mb-3">
                    {[...new Map(perfil.inscripciones.map(i => [i.nombre_d, i])).values()].map((i, idx) => (
                      <span key={idx} className="badge bg-light text-dark border me-1 mb-1">
                        {i.nombre_d}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="btn btn-principal w-75 mx-auto"
                onClick={() => navigate('/perfil/actividad-horario')}>
                Ver actividades
              </button>
            </div>
          </div>
        </div>

        {/* Mis rutinas */}
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-1 text-center h-100">
            <div className="card-body d-flex flex-column justify-content-between">
              <div>
                <h4 className="card-title fw-bold mb-3">Mis rutinas</h4>
                <p className="card-text text-muted mb-4">
                  Descargá tu plan de entrenamiento personalizado.
                </p>
              </div>
              <button
                className="btn btn-principal w-75 mx-auto"
                onClick={() => navigate('/perfil/ver-rutina')}>
                Ver rutina
              </button>
            </div>
          </div>
        </div>

        {/* Mis horarios */}
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-1 text-center h-100">
            <div className="card-body d-flex flex-column justify-content-between">
              <div>
                <h4 className="card-title fw-bold mb-3">Mis horarios</h4>
                <p className="card-text text-muted mb-4">
                  Consultá tus horarios de entrenamiento.
                </p>
              </div>
              <button
                className="btn btn-principal w-75 mx-auto mb-2"
                onClick={() => navigate('/perfil/horario-usuario')}>
                Ver horarios
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Cerrar sesión */}
      <div className="text-center mt-5">
        <button className="btn btn-outline-secondary" onClick={logout}>
          <i className="ri-logout-box-line me-2"></i> Cerrar sesión
        </button>
      </div>

    </div>
  )
}