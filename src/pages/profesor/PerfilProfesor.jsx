import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { profesorApi } from "../../services/api";
import Swal from "sweetalert2";
import EstadoItem from "../../components/usuario/EstadoItem";

const calcularEdad = (fechaNac) => {
    if (!fechaNac) return ''
    const hoy = new Date()
    const nac = new Date(fechaNac)
    let edad = hoy.getFullYear() - nac.getFullYear()
    const m = hoy.getMonth() - nac.getMonth()
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
    return edad
}

const isoToInput = (isoString) => {
    if (!isoString) return ''
    return isoString.slice(0, 10)
}

const formatFecha = (isoString) => {
    if (!isoString) return ''
    const f = new Date(isoString)
    return `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}/${f.getFullYear()}`
}

export default function PerfilProfesor() {
    const { user } = useAuth()
    const [perfil, setPerfil] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isEditable, setIsEditable] = useState(false)
    const [guardando, setGuardando] = useState(false)

    const [formData, setFormData] = useState({
        apellidoNombre: '',
        dni: '',
        telefono: '',
        celular: '',
        mail: '',
        direccion: '',
        fechaNacimiento: '',
    })

    const [formOriginal, setFormOriginal] = useState({})

    const cargarPerfil = () => {
        setLoading(true)
        profesorApi.getPerfil()
            .then(data => {
                setPerfil(data)
                const valores = {
                    apellidoNombre: data.nomap_p || '',
                    dni: data.dni_u || '',
                    telefono: data.telefono_p || '',
                    celular: data.celular_p || '',
                    mail: data.mail_p || '',
                    direccion: data.direccion_p || '',
                    fechaNacimiento: isoToInput(data.fecha_nac_p),
                }
                setFormData(valores)
                setFormOriginal(valores)
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }

    useEffect(() => { cargarPerfil() }, [])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleCancelar = () => {
        setFormData(formOriginal)
        setIsEditable(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setGuardando(true)
        try {
            await profesorApi.updatePerfil({
                telefono: formData.telefono || null,
                celular: formData.celular || null,
                mail: formData.mail || null,
                direccion: formData.direccion || null,
            })
            Swal.fire('¡Listo!', 'Datos actualizados correctamente', 'success')
            setIsEditable(false)
            cargarPerfil()
        } catch (err) {
            Swal.fire('Error', err.message, 'error')
        } finally {
            setGuardando(false)
        }
    }

    if (loading) return (
        <div className="text-center py-5">
            <div className="spinner-border text-secondary" role="status" />
        </div>
    )

    return (
        <div className="container perfil mt-4">

            <div className="text-center mb-4">
                <h2 className="fw-bold">Hola, {perfil?.nomap_p || user?.nombre}</h2>
            </div>

            <form className="card p-4 shadow-sm" onSubmit={handleSubmit}>
                <h4 className="fw-bold mb-4 text-center">Mi Perfil</h4>

                <div className="row mb-3">
                    <div className="col-md-6">
                        <label className="form-label">Apellido y Nombre</label>
                        <input type="text" className="form-control" name="apellidoNombre"
                            value={formData.apellidoNombre} disabled />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">DNI</label>
                        <input type="number" className="form-control" name="dni"
                            value={formData.dni} disabled />
                    </div>
                </div>

                <div className="row mb-3">
                    <div className="col-md-6">
                        <label className="form-label">Teléfono</label>
                        <input type="tel" className="form-control" name="telefono"
                            value={formData.telefono} onChange={handleChange}
                            disabled={!isEditable} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Celular</label>
                        <input type="tel" className="form-control" name="celular"
                            value={formData.celular} onChange={handleChange}
                            disabled={!isEditable} />
                    </div>
                </div>

                <div className="row mb-3">
                    <div className="col-md-6">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-control" name="mail"
                            value={formData.mail} onChange={handleChange}
                            disabled={!isEditable} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Dirección</label>
                        <input type="text" className="form-control" name="direccion"
                            value={formData.direccion} onChange={handleChange}
                            disabled={!isEditable} />
                    </div>
                </div>

                <div className="row mb-4">
                    <div className="col-md-6">
                        <label className="form-label">Fecha de nacimiento</label>
                        <input type="date" className="form-control"
                            value={formData.fechaNacimiento} disabled />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Edad</label>
                        <input type="number" className="form-control" disabled
                            value={calcularEdad(formData.fechaNacimiento)} />
                    </div>
                </div>
                <div className="row">
                    <div className="col perfil-estado-user">
                        {/* <EstadoItem
              icon={perfil?.cuota_al_dia ? '✅' : '❌'}
              titulo={perfil?.cuota_al_dia ? 'Contrato Vigente' : 'Contrato vencido'}
              vencimiento={null}
            /> */}
                        <EstadoItem
                            icon='❌'
                            titulo='Contrato vencido'
                            vencimiento={null}
                        />
                        <EstadoItem
                            /* icon={perfil?.tiene_ficha ? '✅' : '⚠️'}
                            titulo={perfil?.tiene_ficha ? 'Ficha médica vigente' : 'Falta ficha médica'}
                            vencimiento={
                              perfil?.venc_ficha_medica
                                ? formatFecha(perfil.venc_ficha_medica)
                                : null
                            } */
                            icon='✅'
                            titulo='Ficha médica vigente'
                            vencimiento={null}
                        />
                    </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-2">
                    {isEditable ? (
                        <>
                            <button type="button" className="btn btn-outline-secondary"
                                onClick={handleCancelar}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-success" disabled={guardando}>
                                {guardando ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                        </>
                    ) : (
                        <button type="button" className="btn btn-outline-primary"
                            onClick={() => setIsEditable(true)}>
                            Editar
                        </button>
                    )}
                </div>
            </form>
        </div>
    )
}