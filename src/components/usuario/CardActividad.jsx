const CardActividad = ({ titulo, horario, turnos, cuota, vencimiento }) => {
  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">{titulo}</h5>
        <h6 className="card-subtitle mb-2">{horario}</h6>
        <p className="card-text">
          Turnos restantes:{" "}
          <span className="text-primary"><strong>{turnos}</strong></span>
        </p>
        <p className="card-text small">
          <span className={cuota ? "text-success" : "text-danger"}>
            {cuota ? "Cuota al día" : "Cuota vencida"}
          </span>
          {vencimiento && (
            <span className="text-muted"> - Vencimiento: {vencimiento}</span>
          )}
        </p>
      </div>
    </div>
  )
}

export default CardActividad;