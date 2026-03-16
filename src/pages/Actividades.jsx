
import { useState, useEffect } from 'react'
import '../styles/Actividades.css'
import Disciplina from '../components/Disciplina'
import { disciplinasApi } from '../services/api'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Transforma los precios del backend al formato que espera Disciplina.jsx
// { precio_1, precio_1_debito, ..., precio_dia, precio_dia_debito }
// → { 1: { efectivo, debito }, ..., clase: { efectivo, debito } }
function transformarPrecios(d) {
  const precios = {}

  for (let i = 1; i <= 6; i++) {
    const ef  = Number(d[`precio_${i}`])        || 0
    const deb = Number(d[`precio_${i}_debito`]) || 0
    if (ef > 0 || deb > 0) {
      precios[String(i)] = { efectivo: ef, debito: deb }
    }
  }

  if (Number(d.precio_dia) > 0 || Number(d.precio_dia_debito) > 0) {
    precios['clase'] = {
      efectivo: Number(d.precio_dia)        || 0,
      debito:   Number(d.precio_dia_debito) || 0,
    }
  }

  return precios
}

// Transforma las imágenes del backend al formato { id, src }
function transformarImagenes(imagenes, imagenPrincipal) {
  if (imagenes && imagenes.length > 0) {
    return imagenes.map(img => ({
      id:  img.id_imagen,
      src: `${BASE_URL}${img.imagen}`,
    }))
  }
  // Si no hay imágenes en la tabla, usa la imagen principal
  if (imagenPrincipal) {
    return [{ id: 1, src: `${BASE_URL}${imagenPrincipal}` }]
  }
  return [{ id: 1, src: '/disciplinas/default.jpg' }]
}

// Transforma las actividades al formato modalData: [{ id, titulo, descripcion }]
function transformarModalData(actividades) {
  return actividades
    .filter(a => a.descripcion_a) // solo las que tienen descripción
    .map(a => ({
      id:          String(a.id_actividad),
      titulo:      a.nombre_a,
      descripcion: a.descripcion_a,
    }))
}
// Solo actividades que tienen al menos un precio cargado
function actividadesConPrecios(actividades) {
  return actividades.filter(a => {
    for (let i = 1; i <= 6; i++) {
      if (Number(a[`precio_${i}`]) > 0 || Number(a[`precio_${i}_debito`]) > 0) return true
    }
    if (Number(a.precio_dia) > 0 || Number(a.precio_dia_debito) > 0) return true
    return false
  })
}

// Arma el string de subactividades: "Adultos - Niños - Hidrogimnasia"
function transformarSubactividad(actividades) {
  if (!actividades || actividades.length === 0) return ''
  return actividades.map(a => a.nombre_a).join(' - ')
}

export default function Actividades() {
  const [disciplinas, setDisciplinas] = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    disciplinasApi.getPublico()
      .then(data => setDisciplinas(data))
      .catch(() => setDisciplinas([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="pages-section text-center py-5">
        <div className="spinner-border text-secondary" role="status" />
      </div>
    )
  }

  return (
    <div className='pages-section'>
      <div className='titulo-pagina'>Disciplinas</div>

      {disciplinas.length === 0 && (
        <p className="text-center text-muted py-5">No hay disciplinas disponibles.</p>
      )}

      {disciplinas.map((d, index) => (
        <Disciplina
          key={d.id_disciplina}
          titulo={d.nombre_d}
          descripcion={d.descripcion_d}
          subactividad={transformarSubactividad(actividadesConPrecios(d.actividades))}
          precios={transformarPrecios(d)}
          fotos={transformarImagenes(d.imagenes, d.imagen_d)}
          actividades={actividadesConPrecios(d.actividades)}
          modalData={transformarModalData(d.actividades)}
          reverse={index % 2 !== 0}
        />
      ))}
    </div>
  )
}
