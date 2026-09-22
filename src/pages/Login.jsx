
import { useState } from "react";
import logo from "../assets/logo_sf.png";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [campoErrors, setCampoErrors] = useState({});

  const validar = (dniTexto, contrasena) => {
    const errores = {};

    if (!dniTexto) {
      errores.dni = "El DNI es obligatorio";
    } else if (!/^\d{7,8}$/.test(dniTexto)) {
      errores.dni = "Ingresá un DNI válido (7 u 8 dígitos)";
    }

    if (!contrasena) {
      errores.password = "La contraseña es obligatoria";
    }

    return errores;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const dniTexto    = e.target.dni.value.trim();
    const contrasena  = e.target.password.value.trim();

    const errores = validar(dniTexto, contrasena);
    setCampoErrors(errores);
    if (Object.keys(errores).length > 0) return;

    setLoading(true);
    try {
      await login(parseInt(dniTexto), contrasena); // redirige automáticamente según rol
    } catch (err) {
      setError(err.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page d-flex align-items-center justify-content-center mt-5">
      <div className="card shadow p-4 login-card">
        <div className="text-center mb-4">
          <img src={logo} alt="Morta Gym logo" height="100" />
        </div>

        <h3 className="text-center titulo-pagina mb-2">Ingresar</h3>

        {error && (
          <div className="alert alert-danger text-center py-2">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="dni" className="form-label fw-semibold">
              DNI
            </label>
            <input
              type="number"
              name="dni"
              className={`form-control no-spinner ${campoErrors.dni ? "is-invalid" : ""}`}
              placeholder="Ej: 40123456"
            />
            {campoErrors.dni && (
              <div className="invalid-feedback">{campoErrors.dni}</div>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label fw-semibold">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              className={`form-control ${campoErrors.password ? "is-invalid" : ""}`}
              placeholder="********"
            />
            {campoErrors.password && (
              <div className="invalid-feedback">{campoErrors.password}</div>
            )}
          </div>

          <div className="d-grid">
            <button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}