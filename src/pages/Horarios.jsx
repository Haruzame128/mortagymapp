
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import '../styles/Horarios.css'
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo_sf.png";
import { horariosPublicoApi } from "../services/api";

export default function Horarios() {
  const [horarios,     setHorarios]     = useState([]);
  const [disciplinas,  setDisciplinas]  = useState([]);
  const [filtro,       setFiltro]       = useState('');
  const [loading,      setLoading]      = useState(true);

  const location = useLocation();

  useEffect(() => {
    Promise.all([
      horariosPublicoApi.getHorarios(),
      horariosPublicoApi.getDisciplinas(),
    ]).then(([horariosData, disciplinasData]) => {
      setHorarios(horariosData);
      setDisciplinas(disciplinasData);
      // Si viene filtro desde navegación (ej: botón HORARIO en disciplinas)
      const filtroNav = location.state?.filtro;
      setFiltro(filtroNav && disciplinasData.includes(filtroNav)
        ? filtroNav
        : disciplinasData[0] || ''
      );
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Horas únicas ordenadas
  const todasLasHoras = [...new Set(
    horarios.flatMap(d => d.clases.map(c => c.hora))
  )].sort((a, b) => a.localeCompare(b));

  const dias = horarios.map(d => d.dia);

  const getClase = (dia, hora) => {
    const diaData = horarios.find(d => d.dia === dia);
    if (!diaData) return [];
    return diaData.clases.filter(c => c.hora === hora && c.disciplina === filtro);
  };

  const generarPDF = () => {
    const pdf = new jsPDF("landscape", "pt", "a4");
    const logoEl = document.getElementById("logo");
    const logoX = 15, logoY = 10, logoWidth = 60, logoHeight = 60;
    pdf.addImage(logoEl, "PNG", logoX, logoY, logoWidth, logoHeight);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text(`Horarios - ${filtro}`, logoX + logoWidth + 10, logoY + logoHeight / 2 + 5);

    const columnas = ["Hora", ...horarios.map(d => d.dia)];
    const filas = todasLasHoras.map(hora => {
      const row = [hora];
      horarios.forEach(diaData => {
        const clasesFiltradas = diaData.clases.filter(c => c.hora === hora && c.disciplina === filtro);
        if (clasesFiltradas.length === 0) { row.push("-"); return; }
        const textoCelda = clasesFiltradas.map(c => {
          const prof = c.profe ? ` (${c.profe})` : "";
          return `${c.actividad}${prof}`;
        }).join("\n---\n");
        row.push(textoCelda);
      });
      return row;
    });

    autoTable(pdf, {
      head: [columnas],
      body: filas,
      startY: logoY + logoHeight + 15,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3, halign: "center", valign: "middle" },
      headStyles: { fillColor: [32, 104, 190], textColor: 255, fontStyle: "bold" },
      tableWidth: "auto",
      margin: { left: 20, right: 20 },
    });

    const url = URL.createObjectURL(pdf.output("blob"));
    window.open(url, "_blank");
  };

  if (loading) return (
    <section className="pages-section text-center py-5">
      <div className="spinner-border text-secondary" role="status" />
    </section>
  );

  return (
    <>
      <img src={logo} id="logo" style={{ display: 'none' }} />

      <section className="pages-section">
        <div className="container horarios">
          <div className="mb-4">
            <h2 className="titulo-pagina mb-3 mb-md-0">Horarios</h2>
            <div className="filtro-pdf text-center text-md-start mt-4">
              <select
                className="form-select d-inline-block w-auto"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              >
                {disciplinas.map(d => (
                  <option key={d} value={d} translate="no">{d}</option>
                ))}
              </select>
              <button className="btn btn-principal btn-horario" onClick={generarPDF}>
                Ver Horario
              </button>
            </div>
          </div>

          <div className="tabla-container">
            <table className="table table-bordered text-center align-middle tabla-horarios">
              <thead className="table-head">
                <tr>
                  <th className="celda-hora">Hora</th>
                  {dias.map(dia => <th key={dia}>{dia}</th>)}
                </tr>
              </thead>
              <tbody>
                {todasLasHoras.map(hora => (
                  <tr key={hora}>
                    <td className="fw-bold celda-hora">{hora}</td>
                    {dias.map(dia => {
                      const actividades = getClase(dia, hora);
                      return (
                        <td key={`${dia}-${hora}`}>
                          {actividades.length > 0 ? (
                            actividades.map((act, i) => (
                              <div key={i} className="mb-1">
                                <p className="nombre-actividad" translate="no">{act.actividad}</p>
                                {act.horarioReal && (
                                  <small className="horario-real">{act.horarioReal}</small>
                                )}
                                {act.profe && (
                                  <p className="profesor text-muted small">{act.profe}</p>
                                )}
                                {act.cupo_lleno && (
                                  <span className="badge bg-danger" style={{ fontSize: '10px' }}>SIN CUPO</span>
                                )}
                              </div>
                            ))
                          ) : "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}