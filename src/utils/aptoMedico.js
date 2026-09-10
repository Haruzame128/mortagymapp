import Swal from "sweetalert2";

// "Apto médico" — el certificado físico que una persona (cliente o profesor)
// entrega en persona (firmado por un médico) y que se archiva en papel. Es
// distinto de la ficha_medica digital que se completa en la inscripción: acá
// el sistema solo necesita saber si se entregó, cuándo, y cuándo vence (un
// año desde la entrega). Compartido entre clientes (admin/Alumnos.jsx,
// recepcion/Usuarios.jsx, admin/AlumnoDetalle.jsx) y profesores
// (admin/Profesores.jsx, admin/ProfesorDetalle.jsx) para no duplicar el
// diálogo de carga ni la lógica de badges.

const ESTADOS = {
  vigente: { clase: "bg-success", texto: "Vigente" },
  pendiente: { clase: "bg-warning text-dark", texto: "Pendiente" },
  vencido: { clase: "bg-danger", texto: "Vencido" },
};

export function badgeAptoMedico(estado) {
  return ESTADOS[estado] || ESTADOS.pendiente;
}

// entidad: { nombre, fecha_entrega_ficha_medica }
// onSet(fecha|null): hace el PUT correspondiente (clientesApi o profesoresApi)
export async function abrirDialogoAptoMedico(entidad, onSet, onGuardado) {
  const tieneEntrega = !!entidad.fecha_entrega_ficha_medica;
  const hoy = new Date().toISOString().slice(0, 10);

  const { value, isDenied } = await Swal.fire({
    title: tieneEntrega ? "Renovar apto médico" : "Registrar apto médico",
    html: `
      <div class="text-start">
        <p class="mb-2"><strong>${entidad.nombre}</strong></p>
        <label class="form-label small mb-1">Fecha de entrega del certificado</label>
        <input id="swal-fecha-entrega" type="date" class="form-control form-control-sm" value="${entidad.fecha_entrega_ficha_medica?.slice(0, 10) || hoy}" max="${hoy}" />
        <small class="text-muted d-block mt-2">Vence al año de la fecha de entrega.</small>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    showDenyButton: tieneEntrega,
    confirmButtonText: tieneEntrega ? "Renovar" : "Registrar",
    denyButtonText: "Quitar",
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      const fecha = document.getElementById("swal-fecha-entrega").value;
      if (!fecha) {
        Swal.showValidationMessage("Seleccioná una fecha");
        return false;
      }
      return fecha;
    },
  });

  if (!value && !isDenied) return;

  try {
    await onSet(isDenied ? null : value);
    Swal.fire(
      "¡Listo!",
      isDenied ? "Apto médico marcado como pendiente" : "Apto médico registrado correctamente",
      "success"
    );
    onGuardado?.();
  } catch (err) {
    Swal.fire("Error", err.message, "error");
  }
}
