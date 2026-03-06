
import { useState } from "react";
import logo from "../assets/logo_sf.png";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const dni       = parseInt(e.target.dni.value.trim())
    const contrasena = e.target.password.value.trim();

    try {
      await login(dni, contrasena); // redirige automáticamente según rol
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
              className="form-control"
              placeholder="Ej: 40123456"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label fw-semibold">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="********"
              required
            />
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