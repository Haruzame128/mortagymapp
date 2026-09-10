import { disciplinasApi, fichaConfigApi } from "../services/api";
import generarFichaInscripcionPDF, { normalizarInscripcionExistente } from "./generarFichaInscripcionPDF";
import { mapearFichaDB } from "./fichaMedica";

// Vuelve a generar y abrir la ficha de inscripción en PDF de un cliente ya
// existente ("por las dudas"), sin modificar ningún dato — solo lectura.
// `cliente` es el objeto que devuelve GET /api/admin/clientes/:id
// (mismo shape que datosIniciales en FichaInscripcion.jsx).
export default async function descargarFichaCliente(cliente) {
  const [disciplinas, config] = await Promise.all([
    disciplinasApi.getAll().catch(() => []),
    fichaConfigApi.get().catch(() => null),
  ]);

  const formData = {
    apellidoNombre: cliente.nomap_c || "",
    dni: cliente.dni_u || "",
    direccion: cliente.direccion_c || "",
    telefono1: cliente.telefono_c || "",
    telefonoEmergencia: cliente.tel_emergencia_c || "",
    fechaNacimiento: cliente.fecha_nac_c ? cliente.fecha_nac_c.slice(0, 10) : "",
    ...mapearFichaDB(cliente.ficha_medica),
  };

  const inscripciones = (cliente.inscripciones || []).map((i) =>
    normalizarInscripcionExistente(i, disciplinas)
  );

  generarFichaInscripcionPDF({ formData, inscripciones, config });
}
