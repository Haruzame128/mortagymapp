import { useState, useRef, useCallback, useEffect } from "react";

const AGENT = "http://localhost:3001";
const POLL_MS = 500;

export function useHuellaEnrollment() {
  const [status, setStatus] = useState("idle"); // idle|starting|waiting|lift|processing|done|error
  const [step, setStep] = useState(0); // 0,1,2
  const [template, setTemplate] = useState(null);
  const [error, setError] = useState(null);

  const sessionIdRef = useRef(null);
  const pollTimerRef = useRef(null);
  const isStartingRef = useRef(false); // evita ejecuciones simultáneas

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const cancel = useCallback(async () => {
    isStartingRef.current = false;
    stopPolling();
    if (sessionIdRef.current) {
      await fetch(`${AGENT}/api/enroll/session/${sessionIdRef.current}`, {
        method: "DELETE",
      }).catch(() => {});
      sessionIdRef.current = null;
    }
    setStatus("idle");
    setStep(0);
    setError(null);
  }, []);

  const start = useCallback(async (dni, nombre = "") => {
    if (isStartingRef.current) return; // evitar ejecuciones simultáneas
    isStartingRef.current = true;
    stopPolling();
    setStatus("starting");
    setError(null);
    setTemplate(null);
    setStep(0);

    try {
      // Asegurar que el agente esté conectado
      const st = await fetch(`${AGENT}/api/status`)
        .then((r) => r.json())
        .catch(() => ({ connected: false }));
      if (!st.connected) {
        await fetch(`${AGENT}/api/connect`, { method: "POST" }).catch(() => {});
        await new Promise((r) => setTimeout(r, 1200));
      }

      // Cancelar sesión previa si quedó abierta
      if (sessionIdRef.current) {
        await fetch(`${AGENT}/api/enroll/session/${sessionIdRef.current}`, {
          method: "DELETE",
        }).catch(() => {});
        sessionIdRef.current = null;
        await new Promise((r) => setTimeout(r, 300));
      }

      // Cancelar enroll e identificación activos
      await fetch(`${AGENT}/api/enroll/cancel`, { method: "POST" }).catch(
        () => {},
      );
      await fetch(`${AGENT}/api/identify/stop`, { method: "POST" }).catch(
        () => {},
      );
      await new Promise((r) => setTimeout(r, 800));

      sessionIdRef.current = null;

      // Abrir sesión de enroll
      const res = await fetch(
        `${AGENT}/api/enroll/${encodeURIComponent(dni)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre }),
        },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      const { sessionId } = await res.json();

      // Verificar que la sesión existe antes de pollear
      const verify = await fetch(`${AGENT}/api/enroll/session/${sessionId}`);
      if (!verify.ok) {
        throw new Error("El agente no pudo crear la sesión. Intentá de nuevo.");
      }

      sessionIdRef.current = sessionId;
      setStatus("waiting");
      isStartingRef.current = false; // liberar el flag antes de pollear

      await new Promise((r) => setTimeout(r, 400));

      let intentos404 = 0;

      pollTimerRef.current = setInterval(async () => {
        try {
          const r = await fetch(`${AGENT}/api/enroll/session/${sessionId}`);

          if (r.status === 404) {
            intentos404++;
            if (intentos404 >= 10) {
              stopPolling();
              setStatus("error");
              setError("La sesión expiró. Intentá de nuevo.");
            }
            return;
          }

          intentos404 = 0;
          if (!r.ok) {
            stopPolling();
            return;
          }
          const s = await r.json();

          if (s.status === "waiting_finger") {
            setStatus("waiting");
            setStep(s.step || 0);
          } else if (s.status === "lift_finger") {
            setStatus("lift");
            setStep(s.step || 0);
          } else if (s.status === "processing") {
            setStatus("processing");
          } else if (s.status === "done") {
            setStatus("done");
            setTemplate(s.templateBase64);
            stopPolling();
          } else if (s.status === "error") {
            setStatus("error");
            setError(s.step?.error || "Error en el registro");
            stopPolling();
          }
        } catch {
          stopPolling();
          setStatus("error");
          setError("Conexión perdida con el agente.");
        }
      }, POLL_MS);
    } catch (e) {
      isStartingRef.current = false;
      setStatus("error");
      setError(
        e.message === "Failed to fetch"
          ? "No se pudo conectar al agente."
          : e.message,
      );
    }
  }, []);

  // Cleanup al desmontar
  useEffect(
    () => () => {
      stopPolling();
      if (sessionIdRef.current) {
        fetch(`${AGENT}/api/enroll/session/${sessionIdRef.current}`, {
          method: "DELETE",
        }).catch(() => {});
        sessionIdRef.current = null;
      }
    },
    [],
  );

  return { status, step, template, error, start, cancel };
}
