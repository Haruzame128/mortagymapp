import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { disciplinasApi, horariosApi } from "../../services/api";

const DIAS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const DIAS_SEMANA = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const FRECUENCIAS = [1, 2, 3, 4, 5, 6];

const money = (n) =>
  Number(n) > 0 ? `$${Number(n).toLocaleString("es-AR")}` : "—";

const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function fechaCompleta(fecha) {
  const partes = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(fecha);
  const obj = Object.fromEntries(partes.map((p) => [p.type, p.value]));
  return `${capitalizar(obj.weekday)} ${obj.day} de ${capitalizar(obj.month)} de ${obj.year}`;
}

// Agrupa los turnos de una celda (mismo día+hora) por actividad, para no
// repetir el nombre cuando varios profesores dan la misma clase a la vez.
function agruparPorActividad(turnos) {
  const porActividad = new Map();
  for (const h of turnos) {
    if (!porActividad.has(h.nombre_a)) porActividad.set(h.nombre_a, { nombre_a: h.nombre_a, turnos: [] });
    porActividad.get(h.nombre_a).turnos.push(h);
  }
  return Array.from(porActividad.values());
}

export default function Dashboard() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seleccionada, setSeleccionada] = useState("");

  const hoy = new Date();
  const nombreDiaHoy = DIAS[hoy.getDay()];

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [dataDisciplinas, dataHorarios] = await Promise.all([
          disciplinasApi.getAll(),
          horariosApi.getAll(),
        ]);
        const activas = dataDisciplinas.filter((d) => d.activo_d);
        setDisciplinas(activas);
        setHorarios(dataHorarios);
        if (activas.length > 0) setSeleccionada(activas[0].nombre_d);
      } catch (err) {
        Swal.fire("Error", err.message, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-secondary" role="status" />
      </div>
    );
  }

  const disciplina = disciplinas.find((d) => d.nombre_d === seleccionada);
  const horariosDisciplina = horarios.filter((h) => h.nombre_d === seleccionada);

  const todasLasHoras = [...new Set(
    horariosDisciplina.map((h) => h.hora_h?.slice(0, 5))
  )].sort((a, b) => a.localeCompare(b));

  const getTurnos = (dia, hora) =>
    horariosDisciplina.filter((h) => h.dia_h === dia && h.hora_h?.slice(0, 5) === hora);

  return (
    <>
      <h5 className="mb-3">{fechaCompleta(hoy)}</h5>

      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <small className="text-muted d-block mb-1">Disciplina</small>
          <select
            className="form-select w-auto"
            value={seleccionada}
            onChange={(e) => setSeleccionada(e.target.value)}
          >
            {disciplinas.length === 0 && <option value="">Sin disciplinas activas</option>}
            {disciplinas.map((d) => (
              <option key={d.id_disciplina} value={d.nombre_d}>{d.nombre_d}</option>
            ))}
          </select>
        </div>

        {disciplina && (
          <div>
            <small className="text-muted d-block mb-1">Precio (efectivo, por veces por semana)</small>
            <div className="table-responsive">
              <table className="table table-sm table-bordered align-middle text-center mb-0">
                <thead className="table-light">
                  <tr>
                    {FRECUENCIAS.map((f) => (
                      <th key={f}>{f}x</th>
                    ))}
                    <th>Día</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {FRECUENCIAS.map((f) => (
                      <td key={f}>{money(disciplina[`precio_${f}`])}</td>
                    ))}
                    <td>{money(disciplina.precio_dia)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="card admin-card">
        <div className="card-body">
          {!disciplina ? (
            <p className="text-muted text-center py-4">Elegí una disciplina para ver sus horarios</p>
          ) : horariosDisciplina.length === 0 ? (
            <p className="text-muted text-center py-4">No hay horarios cargados para esta disciplina</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered text-center align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Hora</th>
                    {DIAS_SEMANA.map((dia) => (
                      <th key={dia}>
                        {dia}
                        {dia === nombreDiaHoy && <span className="badge bg-primary ms-1">Hoy</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {todasLasHoras.map((hora) => (
                    <tr key={hora}>
                      <td className="fw-bold">{hora}</td>
                      {DIAS_SEMANA.map((dia) => {
                        const turnos = getTurnos(dia, hora);
                        if (turnos.length === 0) return <td key={dia}>-</td>;
                        return (
                          <td key={dia}>
                            {agruparPorActividad(turnos).map((grupo) => (
                              <div key={grupo.nombre_a} className="mb-1">
                                <p className="mb-0 fw-semibold small">{grupo.nombre_a}</p>
                                {grupo.turnos.map((h) => {
                                  const lleno = h.cupo_actual >= h.cupo_maximo;
                                  return (
                                    <div key={h.id_horario} className="small text-muted">
                                      {h.profesor_nombre && <span>{h.profesor_nombre} · </span>}
                                      <span className={`badge ${lleno ? "bg-danger" : "bg-secondary"}`}>
                                        {h.cupo_actual}/{h.cupo_maximo}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
