import { useState, useEffect, useRef, useCallback } from "react";

// El agente local (huella-agent-electron) ya identifica la huella y llama
// él mismo a /api/acceso/verificar — acá solo escuchamos por WebSocket el
// resultado que difunde (mismo servidor que usa su propia ventana Electron
// para el panel "Acceso autorizado/denegado"). Esta pantalla es un oyente
// pasivo, no dispara nada.
const WS_URL = "ws://localhost:3001";
const RECONNECT_MS = 2000;

export function useAgentSocket() {
  const [conectado, setConectado] = useState(false); // WebSocket al agente
  const [lectorListo, setLectorListo] = useState(false); // lector conectado
  const [ultimoResultado, setUltimoResultado] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const limpiarResultado = useCallback(() => setUltimoResultado(null), []);

  useEffect(() => {
    let desmontado = false;

    const conectar = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setConectado(true);

      ws.onclose = () => {
        setConectado(false);
        setLectorListo(false);
        if (!desmontado) {
          reconnectTimerRef.current = setTimeout(conectar, RECONNECT_MS);
        }
      };

      ws.onerror = () => ws.close();

      ws.onmessage = (ev) => {
        let msg;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }

        if (msg.type === "init") setLectorListo(!!msg.connected);
        else if (msg.type === "connected") setLectorListo(true);
        else if (msg.type === "disconnected" || msg.type === "deviceMissing") setLectorListo(false);
        else if (msg.type === "accessResult") setUltimoResultado(msg);
      };
    };

    conectar();

    return () => {
      desmontado = true;
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, []);

  return { conectado, lectorListo, ultimoResultado, limpiarResultado };
}
