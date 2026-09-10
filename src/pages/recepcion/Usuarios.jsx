import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { clientesApi, disciplinasApi, revisionesApi } from "../../services/api";
import TablaPerfil from "../../components/TablaPerfil";
import { abrirDialogoAptoMedico, badgeAptoMedico } from "../../utils/aptoMedico";

export default function Usuarios() {
  const navigate = useNavigate();

  const [disciplinas, setDisciplinas] = useState([]);
  const [pendientesRevision, setPendientesRevision] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [disciplina, setDisciplina] = useState("");

  const cargar = async () => {
    try {
      setLoading(true);
      const [dataAlumnos, dataDisciplinas, dataRevisionesPendientes] = await Promise.all([
        clientesApi.getAll(),
        disciplinasApi.getAll(),
        // Solo aplica a Natación; si falla no debe romper el listado de alumnos.
        revisionesApi.getAll({ pendientes: true }).catch(() => []),
      ]);
      setDatos(dataAlumnos);
      setDisciplinas(dataDisciplinas);
      setPendientesRevision(new Set(dataRevisionesPendientes.map((r) => String(r.id_cliente))));
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const manejarOrdenar = (key) => {
    setDatos([...datos].sort((a, b) => (a[key] > b[key] ? 1 : -1)));
  };

  useEffect(() => setPaginaActual(1), [busqueda, disciplina]);

  const filtrados = datos.filter(a =>
    (a.nomap_c?.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(a.dni_u).includes(busqueda)) &&
    (!disciplina || a.disciplinas?.includes(disciplina))
  );

  const columnas = [
    {
      key: "nomap_c",
      label: "Nombre",
      ordenable: true,
      render: (a) => (
        <>
          {a.nomap_c}
          {pendientesRevision.has(String(a.id_cliente)) && (
            <sup className="text-danger ms-1" title="Falta la revisación médica mensual de Natación">
              *
            </sup>
          )}
        </>
      ),
    },
    { key: "dni_u", label: "DNI", ordenable: true },
    { key: "disciplinas", label: "Disciplina", ordenable: false },
    {
      key: "cuota_al_dia",
      label: "Cuota al día",
      ordenable: true,
      render: (a) => (
        <span className={`badge ${a.cuota_al_dia ? "bg-success" : "bg-danger"}`}>
          {a.cuota_al_dia ? "Sí" : "No"}
        </span>
      ),
    },
    {
      key: "estado_ficha_medica",
      label: "Apto médico",
      ordenable: false,
      render: (a) => (
        <button
          className={`btn btn-xs badge border-0 cursor-pointer ${badgeAptoMedico(a.estado_ficha_medica).clase}`}
          onClick={() => abrirDialogoAptoMedico(
            { nombre: a.nomap_c, fecha_entrega_ficha_medica: a.fecha_entrega_ficha_medica },
            (fecha) => clientesApi.setAptoMedico(a.id_cliente, fecha),
            cargar
          )}
          title="Click para registrar la entrega del certificado médico"
        >
          {badgeAptoMedico(a.estado_ficha_medica).texto}
        </button>
      ),
    },
    {
      key: "opciones",
      label: "Opciones",
      ordenable: false,
      render: (a) => (
        <div className="d-flex gap-1 justify-content-center">
          <button
            className="btn btn-sm btn-outline-secondary"
            title="Ver detalle"
            onClick={() => navigate(`/recepcion/usuarios/${a.id_cliente}`)}
          >
            <i className="ri-eye-fill"></i>
          </button>
          <button
            className="btn btn-sm btn-outline-secondary"
            title="Editar / agregar disciplina"
            onClick={() => navigate(`/recepcion/usuarios/nuevo?id=${a.id_cliente}`)}
          >
            <i className="ri-pencil-fill"></i>
          </button>
          <button
            className="btn btn-sm btn-outline-secondary"
            title="Renovar suscripción"
            onClick={() => navigate(`/recepcion/renovacion?id=${a.id_cliente}`)}
          >
            <i className="ri-refresh-line"></i>
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* BOTONES */}
      <div className="d-flex justify-content-end gap-2 mb-4">
        <button className="btn btn-perfil" onClick={() => navigate("/recepcion/inscripcion")}>
          <i className="ri-profile-line me-1" /> Inscripción
        </button>
      </div>

      {/* FILTROS */}
      <div className="row mb-3">
        <div className="col-md-4">
          <input
            className="form-control"
            placeholder="Nombre o DNI"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        <div className="col-md-4">
          <select
            className="form-select"
            value={disciplina}
            onChange={e => setDisciplina(e.target.value)}
          >
            <option value="">Todas</option>
            {disciplinas.map(d => (
              <option key={d.id_disciplina} value={d.nombre_d}>{d.nombre_d}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status" />
        </div>
      ) : (
        <TablaPerfil
          columnas={columnas}
          datos={filtrados.map(a => ({ ...a, id: a.id_cliente }))}
          paginaActual={paginaActual}
          setPaginaActual={setPaginaActual}
          onOrdenar={manejarOrdenar}
        />
      )}

      {pendientesRevision.size > 0 && (
        <small className="text-muted d-block mt-2">
          * Falta la revisación médica mensual de Natación
        </small>
      )}
    </>
  );
}
