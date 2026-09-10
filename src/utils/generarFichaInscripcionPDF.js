import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo_sf.png";
import { PREGUNTAS_CLINICA } from "./fichaMedica";
import { calcularPrecio } from "./preciosDisciplina";

// "YYYY-MM-DD" (o un ISO con hora) a {anio, mes, dia}, sin pasar por Date —
// new Date("YYYY-MM-DD") lo interpreta como medianoche UTC, y con getters
// locales en Argentina (UTC-3) termina mostrando el día anterior.
const partesFecha = (fecha) => {
  const soloFecha = String(fecha).slice(0, 10);
  const [anio, mes, dia] = soloFecha.split("-").map(Number);
  if (!anio || !mes || !dia) return null;
  return { anio, mes, dia };
};

const calcularEdad = (fechaNac) => {
  const p = partesFecha(fechaNac);
  if (!p) return "—";
  const hoy = new Date();
  let edad = hoy.getFullYear() - p.anio;
  const m = (hoy.getMonth() + 1) - p.mes;
  if (m < 0 || (m === 0 && hoy.getDate() < p.dia)) edad--;
  return edad;
};

const formatFecha = (fecha) => {
  if (!fecha) return "—";
  if (fecha instanceof Date) {
    return `${String(fecha.getDate()).padStart(2, "0")}/${String(fecha.getMonth() + 1).padStart(2, "0")}/${fecha.getFullYear()}`;
  }
  const p = partesFecha(fecha);
  if (!p) return "—";
  return `${String(p.dia).padStart(2, "0")}/${String(p.mes).padStart(2, "0")}/${p.anio}`;
};

const siNo = (v) => (v ? "Sí" : "No");

// Convierte una inscripción existente (formato de datosIniciales.inscripciones)
// al mismo formato que usan las recién agregadas (inscAgregadas), para poder
// mostrar en la ficha el plan completo del cliente y no solo lo nuevo.
export function normalizarInscripcionExistente(i, disciplinas = []) {
  const disciplina = disciplinas.find((d) => d.nombre_d === i.nombre_d);
  const precio = calcularPrecio(disciplina, i.cantidad_dias, i.con_profesor);
  return {
    _label_disciplina: i.nombre_d,
    _label_actividad: i.nombre_a,
    _label_horario: i.dia_h && i.hora_h
      ? `${i.dia_h} ${i.hora_h.slice(0, 5)}${i.profesor ? ` — ${i.profesor}` : ""}`
      : "—",
    _label_modalidad: i.con_profesor == null ? null : (i.con_profesor ? "Con profesor" : "Sin profesor"),
    cantidad_dias: i.cantidad_dias,
    precio_calculado: precio,
    tipo_pago: i.tipo_pago_s || "—",
  };
}

function agregarParrafos(pdf, texto, x, y, maxWidth, lineHeight, margenInferior) {
  const pageHeight = pdf.internal.pageSize.getHeight();
  const parrafos = texto.split(/\n\s*\n/);
  for (const parrafo of parrafos) {
    const lineas = pdf.splitTextToSize(parrafo.trim(), maxWidth);
    for (const linea of lineas) {
      if (y > pageHeight - margenInferior) {
        pdf.addPage();
        y = 50;
      }
      pdf.text(linea, x, y);
      y += lineHeight;
    }
    y += lineHeight * 0.5;
  }
  return y;
}

// Genera la ficha de inscripción en PDF a partir de los mismos datos que
// carga FichaInscripcion.jsx (formData + inscripciones) y la abre en una
// pestaña nueva, lista para imprimir/guardar.
export default function generarFichaInscripcionPDF({ formData, inscripciones = [], config }) {
  const pdf = new jsPDF("portrait", "pt", "a4");
  const margin = 40;
  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = 40;

  // ── Encabezado con datos del gimnasio ────────────────────────────
  pdf.addImage(logo, "PNG", margin, y, 50, 50);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(config?.nombre_gimnasio || "MORTA GYM", margin + 60, y + 16);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  if (config?.cuit) pdf.text(`C.U.I.T.: ${config.cuit}`, margin + 60, y + 30);
  if (config?.direccion) pdf.text(config.direccion, margin + 60, y + 42);
  pdf.text(`Ficha de Inscripción — Emitida el ${formatFecha(new Date())}`, margin + 60, y + 56);
  y += 90;

  // ── Datos personales ──────────────────────────────────────────
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Datos personales", margin, y);
  y += 8;
  autoTable(pdf, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 5 },
    margin: { left: margin, right: margin },
    columnStyles: { 0: { fontStyle: "bold" }, 2: { fontStyle: "bold" } },
    body: [
      ["Apellido y Nombre", formData.apellidoNombre || "—", "DNI", formData.dni || "—"],
      ["Dirección", formData.direccion || "—", "Fecha de nacimiento", formatFecha(formData.fechaNacimiento)],
      ["Teléfono", formData.telefono1 || "—", "Teléfono de emergencia", formData.telefonoEmergencia || "—"],
      ["Edad", String(calcularEdad(formData.fechaNacimiento)), "", ""],
    ],
  });
  y = pdf.lastAutoTable.finalY + 25;

  // ── Plan contratado (formato tipo ficha en papel: campo/valor) ──
  if (inscripciones.length > 0) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Plan contratado", margin, y);
    y += 20;

    const labelX = margin;
    const valueX = margin + 110;
    const maxValueWidth = pageWidth - valueX - margin;

    inscripciones.forEach((i, idx) => {
      const pageHeight = pdf.internal.pageSize.getHeight();
      if (y > pageHeight - 100) { pdf.addPage(); y = 50; }

      const campos = [
        ["PLAN ELEGIDO:", `${i._label_disciplina || "—"} — ${i._label_actividad || "—"}`],
        ...(i._label_modalidad ? [["MODALIDAD:", i._label_modalidad]] : []),
        ["VALOR MENSUAL:", i.precio_calculado ? `$${Number(i.precio_calculado).toLocaleString("es-AR")}` : "—"],
        ["DÍAS POR SEMANA:", i.cantidad_dias != null ? String(i.cantidad_dias) : "—"],
        ["HORARIOS ABONADOS:", i._label_horario || "—"],
        ["MEDIO DE PAGO:", i.tipo_pago || "—"],
      ];

      campos.forEach(([label, value]) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9.5);
        pdf.text(label, labelX, y);
        pdf.setFont("helvetica", "normal");
        const lineas = pdf.splitTextToSize(value, maxValueWidth);
        pdf.text(lineas, valueX, y);
        y += 15 * lineas.length;
      });

      if (idx < inscripciones.length - 1) {
        y += 6;
        pdf.setDrawColor(200);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 16;
      }
    });
    y += 20;
  }

  // ── Historia clínica ──────────────────────────────────────────
  if (y > 620) { pdf.addPage(); y = 50; }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Historia clínica", margin, y);
  y += 8;
  autoTable(pdf, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 5 },
    margin: { left: margin, right: margin },
    columnStyles: { 0: { fontStyle: "bold" }, 2: { fontStyle: "bold" } },
    body: [
      ["Altura", formData.altura ? `${formData.altura} m` : "—", "Peso", formData.peso ? `${formData.peso} kg` : "—"],
      ["Grupo sanguíneo", formData.grupoSanguineo || "—", "", ""],
    ],
  });
  y = pdf.lastAutoTable.finalY + 15;

  autoTable(pdf, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [32, 104, 190], textColor: 255 },
    margin: { left: margin, right: margin },
    head: [["Pregunta", "Respuesta", "Detalle"]],
    columnStyles: { 0: { cellWidth: 220 }, 1: { cellWidth: 60, halign: "center" } },
    body: PREGUNTAS_CLINICA.map(([campo, label, detalleCampo]) => [
      label,
      siNo(formData[campo]),
      detalleCampo && formData[campo] ? (formData[detalleCampo] || "—") : "—",
    ]),
  });
  y = pdf.lastAutoTable.finalY + 30;

  // ── Condiciones de inscripción ──────────────────────────────────
  if (config?.condiciones) {
    pdf.addPage();
    y = 50;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Condiciones de socio, inscripción, huella, horarios y responsabilidad", margin, y);
    y += 20;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    y = agregarParrafos(pdf, config.condiciones, margin, y, pageWidth - margin * 2, 12, 90);
    y += 30;
  }

  // ── Firmas ────────────────────────────────────────────────────
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (y > pageHeight - 80) { pdf.addPage(); y = 60; }
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("_____________________________", margin, y);
  pdf.text("_____________________________", 320, y);
  y += 15;
  pdf.text("Firma del cliente / usuario", margin, y);
  pdf.text(`Firma responsable ${config?.nombre_gimnasio || "MORTA GYM"}`, 320, y);

  window.open(URL.createObjectURL(pdf.output("blob")), "_blank");
}
