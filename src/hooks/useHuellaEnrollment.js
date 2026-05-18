import { useState, useRef, useCallback, useEffect } from 'react'

const AGENT = 'http://localhost:3001'
const POLL_MS = 500

export function useHuellaEnrollment() {
  const [status, setStatus] = useState('idle')     // idle|starting|waiting|lift|processing|done|error
  const [step, setStep] = useState(0)              // 0,1,2
  const [template, setTemplate] = useState(null)
  const [error, setError] = useState(null)
  const sessionIdRef = useRef(null)
  const pollTimerRef = useRef(null)

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }

  const cancel = useCallback(async () => {
    stopPolling()
    if (sessionIdRef.current) {
      await fetch(`${AGENT}/api/enroll/session/${sessionIdRef.current}`, { method: 'DELETE' }).catch(() => {})
      sessionIdRef.current = null
    }
    setStatus('idle'); setStep(0); setError(null)
  }, [])

  const start = useCallback(async (dni, nombre = '') => {
    setStatus('starting'); setError(null); setTemplate(null); setStep(0)
    try {
      // asegurar que el agente esté conectado
      const st = await fetch(`${AGENT}/api/status`).then(r => r.json()).catch(() => ({ connected: false }))
      if (!st.connected) {
        await fetch(`${AGENT}/api/connect`, { method: 'POST' }).catch(() => {})
        await new Promise(r => setTimeout(r, 1200))
      }

      // abrir sesión de enroll
      const res = await fetch(`${AGENT}/api/enroll/${encodeURIComponent(dni)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre })
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      const { sessionId } = await res.json()
      sessionIdRef.current = sessionId
      setStatus('waiting')

      pollTimerRef.current = setInterval(async () => {
        try {
          const r = await fetch(`${AGENT}/api/enroll/session/${sessionId}`)
          if (!r.ok) { stopPolling(); return }
          const s = await r.json()

          if (s.status === 'waiting_finger') { setStatus('waiting'); setStep(s.step || 0) }
          else if (s.status === 'lift_finger') { setStatus('lift'); setStep(s.step || 0) }
          else if (s.status === 'processing')  { setStatus('processing') }
          else if (s.status === 'done')        { setStatus('done'); setTemplate(s.templateBase64); stopPolling() }
          else if (s.status === 'error')       { setStatus('error'); setError(s.step?.error || 'Error en el registro'); stopPolling() }
        } catch {
          stopPolling(); setStatus('error'); setError('Conexión perdida con el agente.')
        }
      }, POLL_MS)
    } catch (e) {
      setStatus('error')
      setError(e.message === 'Failed to fetch' ? 'No se pudo conectar al agente.' : e.message)
    }
  }, [])

  // cleanup si el componente se desmonta
  useEffect(() => () => { stopPolling() }, [])

  return { status, step, template, error, start, cancel }
}