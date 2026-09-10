import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { disciplinasApi, listaEsperaApi, cuposDisponiblesApi } from "../../services/api";
import ModalAltaEspera from "../../components/recepcion/ModalAltaEspera";

function agruparPorActividad(cola) {
  const porDisciplina = new Map();

  for (const item of cola) {
    if (!porDisciplina.has(item.disciplina)) porDisciplina.set(item.disciplina, new Map());
    const porActividad = porDisciplina.get(item.disciplina);
    const clave = item.actividad || "Sin actividad específica";
    if (!porActividad.has(clave)) porActividad.set(clave, []);
    porActividad.get(clave).push(item);
  }

  return Array.from(porDisciplina.entries()).map(([disciplina, actividades]) => ({
    disciplina,
    actividades: Array.from(actividades.entries()).map(([actividad, items]) => ({
      actividad,
      items: items.slice().sort((a, b) => a.posicion - b.posicion),
    })),
  }));
}

export default function ListaEspera() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [cola, setCola] = useState([]);
  const [cupos, setCupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const cargar = async () => {
    try {
      setLoading(true);
      const [dataDisciplinas, dataCola, dataCupos] = await Promise.all([
        disciplinasApi.getAll(),
        listaEsperaApi.getAll(),
        cuposDisponiblesApi.getAll(),
      ]);
      setDisciplinas(dataDisciplinas.filter((d) => d.activo_d));
      setCola(dataCola);
      setCupos(dataCupos);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleAnotar = async (data) => {
    try {
      await listaEsperaApi.anotar(data);
      Swal.fire("¡Listo!", "Se anotó correctamente en la lista de espera", "success");
      setModalOpen(false);
      cargar();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleContactado = async (item) => {
    try {
      await listaEsperaApi.cambiarEstado(item.id_espera, { estado: "contactado" });
      Swal.fire("Actualizado", `${item.nombre} marcado como contactado`, "success");
      cargar();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleInscripto = async (item) => {
    const result = await Swal.fire({
      title: "¿Marcar como inscripto?",
      text: `${item.nombre} saldrá de la cola de espera`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, inscripto",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    try {
      await listaEsperaApi.cambiarEstado(item.id_espera, { estado: "inscripto" });
      Swal.fire("Actualizado", `${item.nombre} marcado como inscripto`, "success");
      cargar();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleDesistio = async (item) => {
    const result = await Swal.fire({
      title: "¿Marcar que desistió?",
      text: `${item.nombre} saldrá de la cola de espera`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, desistió",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    try {
      await listaEsperaApi.cambiarEstado(item.id_espera, { estado: "desistio" });
      Swal.fire("Actualizado", `${item.nombre} marcado como desistido`, "success");
      cargar();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-secondary" role="status" />
      </div>
    );
  }

  const grupos = agruparPorActividad(cola);

  return (
    <>
      <div className="d-flex justify-content-end mb-4">
        <button className="btn btn-perfil" onClick={() => setModalOpen(true)}>
          <i className="ri-user-add-line me-1" /> Anotar en lista de espera
        </button>
      </div>

      <div className="row g-4">
        {/* COLA DE ESPERA */}
        <div className="col-md-7">
          <div className="card admin-card h-100">
            <div className="card-body">
              <h6 className="card-title mb-3">Lista de espera</h6>
              {grupos.length === 0 ? (
                <p className="text-muted text-center py-4">No hay nadie esperando</p>
              ) : (
                grupos.map((g) => (
                  <div key={g.disciplina} className="mb-3">
                    <h6 className="mb-2">{g.disciplina}</h6>
                    {g.actividades.map((a) => (
                      <div key={a.actividad} className="mb-3 ps-2">
                        <small className="text-muted d-block mb-1">{a.actividad}</small>
                        <div className="table-responsive">
                          <table className="table table-sm table-hover align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>#</th>
                                <th>Nombre</th>
                                <th>Teléfono</th>
                                <th>Días esperando</th>
                                <th>Estado</th>
                                <th className="text-center">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {a.items.map((item) => (
                                <tr key={item.id_espera}>
                                  <td>{item.posicion}</td>
                                  <td>
                                    {item.nombre}
                                    {item.es_cliente && (
                                      <span className="badge bg-info ms-1">Cliente</span>
                                    )}
                                  </td>
                                  <td className="fw-semibold">{item.telefono || "—"}</td>
                                  <td>{item.dias_esperando}</td>
                                  <td>
                                    <span className={`badge ${item.estado === "contactado" ? "bg-warning text-dark" : "bg-secondary"}`}>
                                      {item.estado === "contactado" ? "Contactado" : "Esperando"}
                                    </span>
                                  </td>
                                  <td className="text-center">
                                    <div className="d-flex gap-1 justify-content-center">
                                      {item.estado !== "contactado" && (
                                        <button
                                          className="btn btn-sm btn-outline-secondary"
                                          title="Marcar contactado"
                                          onClick={() => handleContactado(item)}
                                        >
                                          <i className="ri-phone-line"></i>
                                        </button>
                                      )}
                                      <button
                                        className="btn btn-sm btn-outline-success"
                                        title="Marcar inscripto"
                                        onClick={() => handleInscripto(item)}
                                      >
                                        <i className="ri-check-line"></i>
                                      </button>
                                      <button
                                        className="btn btn-sm btn-outline-danger"
                                        title="Marcar que desistió"
                                        onClick={() => handleDesistio(item)}
                                      >
                                        <i className="ri-close-line"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* CUPOS DISPONIBLES */}
        <div className="col-md-5">
          <div className="card admin-card h-100">
            <div className="card-body">
              <h6 className="card-title mb-1">Cupos disponibles</h6>
              <small className="text-muted d-block mb-3">Se liberó un lugar: a quién llamar</small>
              {cupos.length === 0 ? (
                <p className="text-muted text-center py-4">No hay cupos libres en disciplinas con lista de espera</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Disciplina / Actividad</th>
                        <th>Día y hora</th>
                        <th className="text-center">Libres</th>
                        <th className="text-center">Esperando</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cupos.map((c) => (
                        <tr key={c.id_horario}>
                          <td>
                            {c.disciplina}
                            <small className="d-block text-muted">{c.actividad}</small>
                          </td>
                          <td>{c.dia_h} {c.hora_h?.slice(0, 5)}</td>
                          <td className="text-center">
                            <span className="badge bg-success">{c.lugares_libres}</span>
                          </td>
                          <td className="text-center">
                            {c.en_espera > 0 ? (
                              <span className="badge bg-warning text-dark">{c.en_espera}</span>
                            ) : (
                              <span className="text-muted">0</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ModalAltaEspera
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        disciplinas={disciplinas}
        onSubmit={handleAnotar}
      />
    </>
  );
}
