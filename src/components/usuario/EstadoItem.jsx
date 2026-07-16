const EstadoItem = ({ icon, titulo, vencimiento }) => {
  return (
    <div className="d-flex align-items-start gap-2">
      <span style={{ fontSize: "1rem" }}>{icon}</span>

      <div className="d-flex flex-column text-start">
        <span className="fs-6">{titulo}</span>
        {/* <small className="text-muted">
          Vencimiento: {vencimiento || "---"}
        </small> */}
      </div>
    </div>
  );
};

export default EstadoItem;