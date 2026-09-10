import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { disciplinasApi } from "../../services/api";
import { tieneConProfesor } from "../../utils/preciosDisciplina";

// Editor de precios de una disciplina — antes era un modal (ModalPrecios),
// pero con hasta 4 columnas de precios no entraba en el ancho fijo del modal
// genérico (.modal-react, max-width 600px) y algunas columnas quedaban
// invisibles. Ahora se muestra inline en el detalle de la disciplina
// (admin/Disciplinas.jsx), usando todo el ancho disponible de la página.
export default function PreciosDisciplina({ disciplina, onGuardado }) {
  const [editando, setEditando] = useState(false);
  const [precios, setPrecios] = useState(null);
  const [usaProfesor, setUsaProfesor] = useState(false);

  useEffect(() => {
    if (!disciplina) return;
    setUsaProfesor(!!disciplina.usa_precio_profesor);
    setPrecios({
      precio_1: disciplina.precio_1 || 0,
      precio_2: disciplina.precio_2 || 0,
      precio_3: disciplina.precio_3 || 0,
      precio_4: disciplina.precio_4 || 0,
      precio_5: disciplina.precio_5 || 0,
      precio_6: disciplina.precio_6 || 0,
      precio_dia: disciplina.precio_dia || 0,
      precio_1_debito: disciplina.precio_1_debito || 0,
      precio_2_debito: disciplina.precio_2_debito || 0,
      precio_3_debito: disciplina.precio_3_debito || 0,
      precio_4_debito: disciplina.precio_4_debito || 0,
      precio_5_debito: disciplina.precio_5_debito || 0,
      precio_6_debito: disciplina.precio_6_debito || 0,
      precio_dia_debito: disciplina.precio_dia_debito || 0,
      precio_1_profesor: disciplina.precio_1_profesor || 0,
      precio_2_profesor: disciplina.precio_2_profesor || 0,
      precio_3_profesor: disciplina.precio_3_profesor || 0,
      precio_4_profesor: disciplina.precio_4_profesor || 0,
      precio_5_profesor: disciplina.precio_5_profesor || 0,
      precio_6_profesor: disciplina.precio_6_profesor || 0,
    });
    setEditando(false);
  }, [disciplina]);

  const handleGuardar = async () => {
    try {
      await disciplinasApi.updatePrecios(disciplina.id_disciplina, precios, usaProfesor);
      Swal.fire("¡Listo!", "Precios actualizados", "success");
      setEditando(false);
      onGuardado?.();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  if (!disciplina || !precios) return null;

  const conProfesor = usaProfesor || tieneConProfesor(precios);

  return (
    <div className="card admin-card mb-4">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <h5 className="mb-0">Precios — {disciplina.nombre_d}</h5>
          <button
            className="btn btn-sm btn-admin"
            onClick={() => (editando ? handleGuardar() : setEditando(true))}
          >
            {editando ? "Guardar cambios" : "Editar precios"}
          </button>
        </div>

        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            id={`usaProfesor-${disciplina.id_disciplina}`}
            checked={usaProfesor}
            disabled={!editando}
            onChange={(e) => setUsaProfesor(e.target.checked)}
          />
          <label className="form-check-label" htmlFor={`usaProfesor-${disciplina.id_disciplina}`}>
            Esta disciplina tiene precio "con profesor" (además del precio "sin profesor")
          </label>
        </div>

        {conProfesor && (
          <small className="text-muted d-block mb-2">
            "Con profesor" es opcional — solo aplica a disciplinas con esa modalidad (ej. Natación). No tiene variante por día.
          </small>
        )}

        <div className="table-responsive">
          <table className="table table-sm align-middle text-center mb-0">
            <thead className="table-light">
              <tr>
                <th className="text-start">Días / semana</th>
                <th>Efectivo{conProfesor ? " (sin profesor)" : ""}</th>
                <th>Precio real</th>
                {conProfesor && <th>Efectivo (con profesor)</th>}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <tr key={n}>
                  <td className="text-start">{n} día{n > 1 ? "s" : ""}/sem</td>
                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={precios[`precio_${n}`] || ""}
                      disabled={!editando}
                      onChange={(e) => setPrecios({ ...precios, [`precio_${n}`]: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={precios[`precio_${n}_debito`] || ""}
                      disabled={!editando}
                      onChange={(e) => setPrecios({ ...precios, [`precio_${n}_debito`]: e.target.value })}
                    />
                  </td>
                  {conProfesor && (
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="—"
                        value={precios[`precio_${n}_profesor`] || ""}
                        disabled={!editando}
                        onChange={(e) => setPrecios({ ...precios, [`precio_${n}_profesor`]: e.target.value })}
                      />
                    </td>
                  )}
                </tr>
              ))}
              <tr>
                <td className="text-start">Precio por día</td>
                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={precios.precio_dia || ""}
                    disabled={!editando}
                    onChange={(e) => setPrecios({ ...precios, precio_dia: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={precios.precio_dia_debito || ""}
                    disabled={!editando}
                    onChange={(e) => setPrecios({ ...precios, precio_dia_debito: e.target.value })}
                  />
                </td>
                {conProfesor && <td className="text-muted">—</td>}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
