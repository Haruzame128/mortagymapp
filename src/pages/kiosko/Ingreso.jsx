import { useEffect, useRef } from "react";
import { useAgentSocket } from "../../hooks/useAgentSocket";
import logo from "../../assets/logo_sf.png";
import "../../styles/Kiosko.css";

// Pantalla del molinete de entrada. No requiere login — corre sola en la
// terminal de la puerta. El agente local (huella-agent-electron,
// localhost:3001) identifica la huella y verifica el acceso contra el
// backend por su cuenta; esta pantalla solo escucha el resultado por
// WebSocket y lo muestra en grande.
const REINTENTO_MS = 4000;

export default function Ingreso() {
  const { conectado, lectorListo, ultimoResultado, limpiarResultado } = useAgentSocket();
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (ultimoResultado) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(limpiarResultado, REINTENTO_MS);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [ultimoResultado, limpiarResultado]);

  const resultado = ultimoResultado;

  return (
    <div
      className={`kiosko-pantalla ${
        resultado ? (resultado.permitido ? "kiosko-ok" : "kiosko-error") : ""
      }`}
    >
      {!resultado ? (
        <>
          <div className="kiosko-logo-badge">
            <img src={logo} alt="Morta Gym" />
          </div>
          <h1>¡Bienvenido a Morta Gym!</h1>
          <i className="ri-fingerprint-line kiosko-icono pulso"></i>
          <p className="kiosko-sub">
            {lectorListo ? "Coloque su huella en el lector" : "Lector no disponible"}
          </p>
          {!conectado && (
            <p className="kiosko-aviso">Sin conexión con el agente local (localhost:3001)</p>
          )}
        </>
      ) : (
        <>
          <i
            className={`kiosko-icono ${
              resultado.permitido ? "ri-checkbox-circle-line" : "ri-close-circle-line"
            }`}
          ></i>
          <h1>
            {resultado.permitido
              ? `¡Bienvenido/a, ${resultado.cliente?.nombre || ""}!`
              : "Acceso denegado"}
          </h1>
          <p className="kiosko-sub">{resultado.mensaje}</p>
          {resultado.permitido && resultado.cliente?.entradas_restantes != null && (
            <p className="kiosko-detalle">
              Entradas restantes este mes: {resultado.cliente.entradas_restantes}
            </p>
          )}
        </>
      )}
    </div>
  );
}
