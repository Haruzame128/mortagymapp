import { useState, useEffect, useCallback } from "react";
import { perfilApi } from "../services/api";

// Cache simple en memoria: las 3 pestañas de /perfil (Perfil, Actividades,
// Horarios) piden el mismo /api/perfil/me — con esto solo se pide una vez
// por sesión de navegación, en vez de una vez por pestaña visitada.
let cache = null;
const listeners = new Set();

function notify(data) {
  cache = data;
  listeners.forEach((fn) => fn(data));
}

export function usePerfilCliente() {
  const [perfil, setPerfil] = useState(cache);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState(null);

  const recargar = useCallback(() => {
    setLoading(true);
    setError(null);
    return perfilApi
      .getMe()
      .then((data) => {
        notify(data);
        return data;
      })
      .catch((err) => {
        setError(err);
        throw err;
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    listeners.add(setPerfil);
    if (!cache) recargar().catch(() => {});
    return () => listeners.delete(setPerfil);
  }, [recargar]);

  return { perfil, loading, error, recargar };
}
