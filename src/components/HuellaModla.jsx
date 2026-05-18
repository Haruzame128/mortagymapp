export default function HuellaModal({ isOpen, status, step, error, onClose, onRetry }) {
  if (!isOpen) return null
  const isDone = status === 'done'
  const isError = status === 'error'
  const isWorking = ['starting','waiting','lift','processing'].includes(status)

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0" style={{ borderRadius: 16 }}>
          <div className="modal-header border-0 pb-0 px-4 pt-4">
            <h5 className="modal-title fw-bold">Registro de Huella Digital</h5>
          </div>
          <div className="modal-body px-4 pb-0 text-center">
            {isWorking && (
              <>
                <p className="text-muted small mb-4">Seguí los pasos para capturar la huella</p>
                <div className="d-flex align-items-center justify-content-center mb-3 gap-3">
                  {[0,1,2].map(i => (
                    <div key={i} className="d-flex flex-column align-items-center">
                      <div style={{
                        width: 58, height: 58, borderRadius: '50%',
                        border: `2.5px solid ${step > i ? '#198754' : step === i ? '#0093D8' : '#dee2e6'}`,
                        background: step > i ? '#d1e7dd' : '#f8f9fa',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.3rem'
                      }}>
                        {step > i ? '✓' : '🖐'}
                      </div>
                      <div className="small text-muted mt-1">Captura {i+1}</div>
                    </div>
                  ))}
                </div>
                {status === 'waiting' && (<>
                  <p className="fw-bold mb-1">Apoyá el dedo en el lector ({step + 1} de 3)</p>
                  <p className="text-muted small mb-3">Mantené el dedo quieto hasta el beep</p>
                </>)}
                {status === 'lift' && (
                  <p className="fw-bold mb-3">✓ Captura {step} lista — levantá el dedo</p>
                )}
                {status === 'processing' && (<>
                  <p className="fw-bold mb-1">Procesando...</p>
                  <p className="text-muted small mb-3">Fusionando las 3 capturas</p>
                </>)}
                {status === 'starting' && <p className="text-muted">Conectando al agente...</p>}
              </>
            )}
            {isDone && (
              <div className="py-2 mb-2">
                <div style={{ fontSize: '3rem' }}>✅</div>
                <div className="fw-bold mt-2" style={{ color: '#198754' }}>¡Huella registrada!</div>
                <div className="text-muted small mt-1">Las 3 capturas fueron fusionadas correctamente.</div>
              </div>
            )}
            {isError && (
              <div className="py-2 mb-2">
                <div style={{ fontSize: '2.5rem' }}>❌</div>
                <div className="fw-bold text-danger mt-2">{error || 'Error en el registro'}</div>
                <button className="btn btn-sm btn-outline-primary mt-2" onClick={onRetry}>Reintentar</button>
              </div>
            )}
          </div>
          <div className="modal-footer border-0 justify-content-center pb-4">
            <button type="button" className="btn btn-outline-secondary px-4" onClick={onClose}>
              {isDone ? 'Cerrar' : 'Cancelar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}