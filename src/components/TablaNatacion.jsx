
import { useState } from "react";

// Transforma los precios de una actividad de natación al formato
// { 1: { efectivo, debito, profesor }, ..., clase: { efectivo, debito } }
function transformarPreciosNatacion(actividad) {
  const precios = {}

  for (let i = 1; i <= 6; i++) {
    const ef   = Number(actividad[`precio_${i}`])          || 0
    const deb  = Number(actividad[`precio_${i}_debito`])   || 0
    const prof = Number(actividad[`precio_${i}_profesor`]) || 0
    if (ef > 0 || deb > 0 || prof > 0) {
      precios[String(i)] = { efectivo: ef, debito: deb, profesor: prof }
    }
  }

  if (Number(actividad.precio_dia) > 0 || Number(actividad.precio_dia_debito) > 0) {
    precios['clase'] = {
      efectivo: Number(actividad.precio_dia)        || 0,
      debito:   Number(actividad.precio_dia_debito) || 0,
      profesor: 0,
    }
  }

  return precios
}

const TablaNatacion = ({ actividades = [], matricula }) => {
  const [categoriaIdx, setCategoriaIdx] = useState(0)
  const [dias, setDias] = useState('1')

  if (!actividades || actividades.length === 0) return null

  const categoriaActual  = actividades[categoriaIdx]
  const preciosCategoria = transformarPreciosNatacion(categoriaActual)
  const diasDisponibles  = Object.keys(preciosCategoria)

  // Si el día seleccionado no existe en la nueva categoría, resetear al primero
  const diaValido = diasDisponibles.includes(dias) ? dias : diasDisponibles[0]

  const esNatacion = categoriaActual.nombre_a?.toLowerCase().includes('nataci')
  const tieneProfesor = esNatacion && Object.values(preciosCategoria).some(p => p.profesor > 0)

  return (
    <div className="precios">
      <table className="tabla-precios natacion table table-borderless">
        <thead>
          <tr>
            <th>Actividad</th>
            <th>Días por semana</th>
            <th>Efectivo{tieneProfesor ? ' (Libre)' : ''}</th>
            {tieneProfesor && <th>Efectivo (Con Profesor)</th>}
            <th>Débito/Transferencia</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td data-label="Actividad">
              <select
                value={categoriaIdx}
                onChange={(e) => {
                  setCategoriaIdx(Number(e.target.value))
                  setDias('1')
                }}
              >
                {actividades.map((a, i) => (
                  <option key={a.id_actividad} value={i}>
                    {a.nombre_a}
                  </option>
                ))}
              </select>
            </td>

            <td data-label="Días por semana">
              <select value={diaValido} onChange={(e) => setDias(e.target.value)}>
                {diasDisponibles.map((d) => (
                  <option key={d} value={d}>
                    {d === 'clase'
                      ? '1 clase por día'
                      : `${d} ${d === '1' ? 'vez' : 'veces'} por semana`}
                  </option>
                ))}
              </select>
            </td>

            <td data-label="Efectivo">
              {preciosCategoria[diaValido]?.efectivo > 0
                ? `$${preciosCategoria[diaValido].efectivo.toLocaleString()}`
                : '—'}
            </td>

            {tieneProfesor && (
              <td data-label="Efectivo (Con Profesor)">
                {preciosCategoria[diaValido]?.profesor > 0
                  ? `$${preciosCategoria[diaValido].profesor.toLocaleString()}`
                  : '—'}
              </td>
            )}

            <td data-label="Débito/Transferencia">
              {preciosCategoria[diaValido]?.debito > 0
                ? `$${preciosCategoria[diaValido].debito.toLocaleString()}`
                : '—'}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={tieneProfesor ? 3 : 2}>
              <p className="matricula text-muted">{matricula}</p>
            </td>
            <td colSpan="2">
              <p className="text-muted">Con tarjeta de crédito: +25%</p>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export default TablaNatacion